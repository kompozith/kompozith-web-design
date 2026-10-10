/**
 * The CMS API, assembled as a mountable Express app.
 *
 * It is used twice: as Vite dev-server middleware (see vite.config.ts) so
 * `npm run dev` serves site + API from one origin, and inside the production
 * server (server/index.ts) alongside the built assets. Same code both times,
 * so there is no dev-only auth path.
 */
import "./env.ts";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import {
  createAuthRouter,
  describeAuthMode,
  otpRequired,
  requireAuth,
  requireCsrf,
  type AuthedRequest,
} from "./auth.ts";
import { getDb } from "./db.ts";
import { activeTransport, describeTransport } from "./mailer.ts";
import { createMediaRouter } from "./media.ts";
import {
  createAdminProjectsRouter,
  createPublicProjectsRouter,
} from "./projects.ts";

function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("X-Frame-Options", "DENY");
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  // Nothing under the admin surface should ever be cached or indexed.
  if (req.path.startsWith("/admin")) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  next();
}

/**
 * Same-origin guard. The API sets no CORS headers, so a browser blocks
 * cross-origin reads anyway; this rejects the request outright and keeps
 * mistakes from ever reaching a handler.
 */
function sameOriginOnly(req: Request, res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  const origin = req.get("origin");
  if (!origin) {
    // No Origin header: not a browser fetch, and CSRF needs a browser.
    next();
    return;
  }
  const host = req.get("host");
  try {
    if (new URL(origin).host === host) {
      next();
      return;
    }
  } catch {
    /* fall through */
  }
  res.status(403).json({ error: "Cross-origin request rejected" });
}

let bannerShown = false;

export function createApiApp(): Express {
  if (!bannerShown) {
    bannerShown = true;
    const warn = (line: string) => `\x1b[33m[cms]\x1b[0m ${line}`;
    const plain = (line: string) => `[cms] ${line}`;
    // eslint-disable-next-line no-console
    console.log(
      (otpRequired() ? plain : warn)(describeAuthMode()),
    );
    // Only worth mentioning mail when it is actually used for sign-in.
    if (otpRequired()) {
      // eslint-disable-next-line no-console
      console.log(
        (activeTransport() === "console" ? warn : plain)(describeTransport()),
      );
    }
  }

  const api = express();
  api.disable("x-powered-by");
  api.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

  api.use(securityHeaders);
  api.use(sameOriginOnly);

  // Media carries base64 payloads; everything else stays small on purpose.
  api.use("/admin/media", express.json({ limit: "12mb" }));
  api.use(express.json({ limit: "256kb" }));

  api.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  api.use("/auth", createAuthRouter());
  api.use("/projects", createPublicProjectsRouter());
  api.use("/admin/projects", createAdminProjectsRouter());
  api.use("/admin/media", createMediaRouter());

  api.get(
    "/admin/overview",
    requireAuth,
    requireCsrf,
    async (_req: AuthedRequest, res: Response) => {
      const db = await getDb();
      res.json({
        counts: {
          total: db.projects.length,
          published: db.projects.filter((p) => p.status === "published").length,
          drafts: db.projects.filter((p) => p.status === "draft").length,
        },
        recentActivity: db.audit.slice(0, 12).map((a) => ({
          id: a.id,
          at: a.at,
          event: a.event,
          detail: a.detail,
          ip: a.ip,
        })),
      });
    },
  );

  api.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Never leak a stack trace to the client.
  api.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      // eslint-disable-next-line no-console
      console.error("[api]", err);
      const status =
        typeof (err as { status?: number })?.status === "number"
          ? (err as { status: number }).status
          : 500;
      res
        .status(status >= 400 && status < 600 ? status : 500)
        .json({ error: status === 413 ? "Payload too large" : "Server error" });
    },
  );

  return api;
}
