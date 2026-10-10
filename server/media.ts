/**
 * Image library.
 *
 * Uploads arrive as base64 in a JSON body — no multipart parser dependency.
 * The declared filename and MIME type from the client are both ignored: the
 * stored extension comes from sniffing the actual bytes, and the stored name is
 * random. That removes path traversal, double-extension and content-confusion
 * attacks in one move.
 *
 * SVG is deliberately not accepted. Served from our own origin it is a script
 * execution vector, and nothing in the design system needs uploaded SVG.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import express, { type Response, type Router } from "express";
import { UPLOAD_DIR } from "./db.ts";
import { audit } from "./db.ts";
import { randomToken } from "./security.ts";
import { clientIp, requireAuth, requireCsrf, type AuthedRequest } from "./auth.ts";

const MAX_BYTES = 8 * 1024 * 1024;

interface Signature {
  ext: string;
  mime: string;
  test: (b: Buffer) => boolean;
}

const SIGNATURES: Signature[] = [
  {
    ext: "png",
    mime: "image/png",
    test: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  {
    ext: "jpg",
    mime: "image/jpeg",
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "gif",
    mime: "image/gif",
    test: (b) => b.length > 6 && b.subarray(0, 3).toString("latin1") === "GIF",
  },
  {
    ext: "webp",
    mime: "image/webp",
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    ext: "avif",
    mime: "image/avif",
    test: (b) =>
      b.length > 12 &&
      b.subarray(4, 8).toString("latin1") === "ftyp" &&
      ["avif", "avis"].includes(b.subarray(8, 12).toString("latin1")),
  },
];

const SAFE_NAME = /^[A-Za-z0-9_-]{8,64}\.(png|jpg|gif|webp|avif)$/;

export function createMediaRouter(): Router {
  const router = express.Router();
  router.use(requireAuth, requireCsrf);

  router.get("/", async (_req, res: Response) => {
    const names = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
    const files = await Promise.all(
      names
        .filter((n) => SAFE_NAME.test(n))
        .map(async (name) => {
          const stat = await fs.stat(path.join(UPLOAD_DIR, name));
          return {
            name,
            url: `/uploads/${name}`,
            size: stat.size,
            uploadedAt: stat.mtime.toISOString(),
          };
        }),
    );
    files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    res.json({ files });
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    const raw = String(req.body?.data ?? "");
    const base64 = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
    if (!base64) {
      res.status(400).json({ error: "No file data" });
      return;
    }
    // 4 base64 chars per 3 bytes — reject oversize before allocating.
    if (base64.length > (MAX_BYTES / 3) * 4 + 1024) {
      res.status(413).json({ error: "Image exceeds 8 MB" });
      return;
    }

    let buf: Buffer;
    try {
      buf = Buffer.from(base64, "base64");
    } catch {
      res.status(400).json({ error: "Malformed image data" });
      return;
    }
    if (!buf.length || buf.length > MAX_BYTES) {
      res.status(413).json({ error: "Image exceeds 8 MB" });
      return;
    }

    const sig = SIGNATURES.find((s) => s.test(buf));
    if (!sig) {
      res
        .status(415)
        .json({ error: "Only PNG, JPEG, GIF, WebP and AVIF images are accepted" });
      return;
    }

    const name = `${randomToken(12)}.${sig.ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    await audit("media.uploaded", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: `${name} (${buf.length} bytes)`,
    });

    res.status(201).json({
      file: {
        name,
        url: `/uploads/${name}`,
        size: buf.length,
        type: sig.mime,
        uploadedAt: new Date().toISOString(),
      },
    });
  });

  router.delete("/:name", async (req: AuthedRequest, res: Response) => {
    const name = String(req.params.name);
    if (!SAFE_NAME.test(name)) {
      res.status(400).json({ error: "Invalid file name" });
      return;
    }
    await fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined);
    await audit("media.deleted", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: name,
    });
    res.json({ ok: true });
  });

  return router;
}
