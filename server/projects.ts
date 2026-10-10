/**
 * Project content API.
 *
 * Two routers: an unauthenticated one that only ever exposes published
 * projects, and an admin one behind session auth + CSRF that can read drafts
 * and mutate.
 *
 * Everything crossing the boundary goes through `normalizeProject`, which
 * rebuilds the record field by field. Unknown keys from the client are dropped
 * rather than merged, so the stored shape can never be polluted.
 */
import express, { type Request, type Response, type Router } from "express";
import { audit, getDb, newId, withDb } from "./db.ts";
import { clientIp, requireAuth, requireCsrf, type AuthedRequest } from "./auth.ts";
import type {
  Block,
  BlockLayout,
  BulletItem,
  GalleryImage,
  ProcessStep,
  Project,
  ProjectCard,
  StatItem,
} from "./types.ts";

/* ----------------------------------------------------------- sanitisation */

const str = (v: unknown, max = 400): string =>
  typeof v === "string" ? v.slice(0, max).trim() : "";

const text = (v: unknown, max = 8000): string =>
  typeof v === "string" ? v.slice(0, max) : "";

const strList = (v: unknown, max = 24, len = 120): string[] =>
  Array.isArray(v) ? v.slice(0, max).map((x) => str(x, len)).filter(Boolean) : [];

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const color = (v: unknown, fallback: string): string => {
  const s = str(v, 32);
  return HEX.test(s) ? s : fallback;
};

/**
 * Accepts site-relative paths and http(s) URLs only. Rejects `javascript:`,
 * `data:` and other schemes that would turn an image field into an XSS vector.
 */
export function safeUrl(v: unknown, max = 2048): string {
  const s = str(v, max);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : "";
  } catch {
    return "";
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const stats = (v: unknown): StatItem[] =>
  Array.isArray(v)
    ? v.slice(0, 8).map((s) => ({
        label: str((s as StatItem)?.label, 80),
        value: str((s as StatItem)?.value, 40),
      }))
    : [];

const bullets = (v: unknown): BulletItem[] =>
  Array.isArray(v)
    ? v.slice(0, 12).map((b) => ({
        lead: str((b as BulletItem)?.lead, 120),
        text: text((b as BulletItem)?.text, 600),
      }))
    : [];

const steps = (v: unknown): ProcessStep[] =>
  Array.isArray(v)
    ? v.slice(0, 8).map((s) => ({
        title: str((s as ProcessStep)?.title, 120),
        body: text((s as ProcessStep)?.body, 800),
        tags: strList((s as ProcessStep)?.tags, 8, 60),
      }))
    : [];

const images = (v: unknown): GalleryImage[] =>
  Array.isArray(v)
    ? v
        .slice(0, 12)
        .map((i) => ({
          url: safeUrl((i as GalleryImage)?.url),
          alt: str((i as GalleryImage)?.alt, 200),
        }))
        .filter((i) => i.url)
    : [];

const LAYOUTS: BlockLayout[] = [
  "image-right",
  "image-left",
  "image-below",
  "none",
];

const blockLayout = (v: unknown): BlockLayout =>
  LAYOUTS.includes(v as BlockLayout) ? (v as BlockLayout) : "image-right";

function normalizeBlock(raw: unknown): Block | null {
  const b = raw as Record<string, unknown>;
  const id = str(b?.id, 60) || newId();
  switch (b?.type) {
    case "feature":
      return {
        id,
        type: "feature",
        label: str(b.label, 60),
        title: str(b.title, 200),
        body: text(b.body, 4000),
        bullets: bullets(b.bullets),
        image: safeUrl(b.image),
        imageAlt: str(b.imageAlt, 200),
        layout: blockLayout(b.layout),
      };
    case "process":
      return {
        id,
        type: "process",
        label: str(b.label, 60),
        title: str(b.title, 200),
        body: text(b.body, 2000),
        steps: steps(b.steps),
      };
    case "text":
      return {
        id,
        type: "text",
        label: str(b.label, 60),
        title: str(b.title, 200),
        body: text(b.body, 8000),
      };
    case "image":
      return {
        id,
        type: "image",
        url: safeUrl(b.url),
        alt: str(b.alt, 200),
        caption: str(b.caption, 300),
        width: b.width === "contained" ? "contained" : "full",
      };
    case "gallery":
      return {
        id,
        type: "gallery",
        images: images(b.images),
        columns: b.columns === 3 ? 3 : 2,
      };
    case "stats":
      return {
        id,
        type: "stats",
        label: str(b.label, 60),
        title: str(b.title, 200),
        items: stats(b.items),
      };
    case "quote":
      return {
        id,
        type: "quote",
        quote: text(b.quote, 1200),
        author: str(b.author, 120),
        role: str(b.role, 120),
        avatar: safeUrl(b.avatar),
      };
    default:
      return null;
  }
}

/** Rebuilds a project from untrusted input, preserving server-owned fields. */
export function normalizeProject(
  raw: unknown,
  existing: Project | null,
): Project {
  const b = (raw ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const title = str(b.title, 160) || existing?.title || "Untitled project";
  const slug =
    slugify(str(b.slug, 80)) || existing?.slug || slugify(title) || newId();

  return {
    id: existing?.id ?? newId(),
    slug,
    status: b.status === "published" ? "published" : "draft",
    title,
    client: str(b.client, 160),
    category: str(b.category, 80),
    excerpt: text(b.excerpt, 500),
    tagline: text(b.tagline, 400),
    coverImage: safeUrl(b.coverImage),
    accentColor: color(b.accentColor, "#FF6230"),
    cardBg: color(b.cardBg, "#EAEAEA"),
    order: Number.isFinite(Number(b.order)) ? Number(b.order) : (existing?.order ?? 0),
    featured: Boolean(b.featured),
    overview: text(b.overview, 4000),
    objective: text(b.objective, 4000),
    meta: {
      industry: str((b.meta as Record<string, unknown>)?.industry, 120),
      services: strList((b.meta as Record<string, unknown>)?.services, 12, 60),
      duration: str((b.meta as Record<string, unknown>)?.duration, 60),
      timeline: str((b.meta as Record<string, unknown>)?.timeline, 60),
    },
    stats: stats(b.stats),
    liveUrl: safeUrl(b.liveUrl),
    sections: Array.isArray(b.sections)
      ? b.sections.slice(0, 30).map(normalizeBlock).filter((x): x is Block => !!x)
      : [],
    seoTitle: str(b.seoTitle, 200),
    seoDescription: text(b.seoDescription, 400),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: existing?.publishedAt ?? null,
  };
}

function toCard(p: Project): ProjectCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    accentColor: p.accentColor,
    cardBg: p.cardBg,
    order: p.order,
  };
}

const byOrder = (a: Project, b: Project) =>
  a.order - b.order || a.title.localeCompare(b.title);

/* ------------------------------------------------------------ public API */

export function createPublicProjectsRouter(): Router {
  const router = express.Router();

  router.get("/", async (_req: Request, res: Response) => {
    const db = await getDb();
    const published = db.projects
      .filter((p) => p.status === "published")
      .sort(byOrder)
      .map(toCard);
    res.set("Cache-Control", "public, max-age=30");
    res.json({ projects: published });
  });

  router.get("/:slug", async (req: Request, res: Response) => {
    const db = await getDb();
    const slug = slugify(String(req.params.slug));
    const project = db.projects.find(
      (p) => p.slug === slug && p.status === "published",
    );
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const siblings = db.projects
      .filter((p) => p.status === "published")
      .sort(byOrder);
    const idx = siblings.findIndex((p) => p.id === project.id);
    const next = siblings[(idx + 1) % siblings.length];

    res.set("Cache-Control", "public, max-age=30");
    res.json({
      project,
      next: next && next.id !== project.id ? toCard(next) : null,
    });
  });

  return router;
}

/* ------------------------------------------------------------- admin API */

export function createAdminProjectsRouter(): Router {
  const router = express.Router();
  router.use(requireAuth, requireCsrf);

  router.get("/", async (_req: Request, res: Response) => {
    const db = await getDb();
    res.json({
      projects: [...db.projects].sort(byOrder).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        status: p.status,
        coverImage: p.coverImage,
        order: p.order,
        featured: p.featured,
        updatedAt: p.updatedAt,
        publishedAt: p.publishedAt,
        sectionCount: p.sections.length,
      })),
    });
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const db = await getDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ project });
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    const db = await getDb();
    const draft = normalizeProject(req.body, null);
    draft.status = "draft";
    draft.order = db.projects.length
      ? Math.max(...db.projects.map((p) => p.order)) + 1
      : 0;
    draft.slug = uniqueSlug(db.projects, draft.slug, null);

    await withDb((d) => {
      d.projects.push(draft);
    });
    await audit("project.created", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: draft.slug,
    });
    res.status(201).json({ project: draft });
  });

  router.put("/:id", async (req: AuthedRequest, res: Response) => {
    const db = await getDb();
    const existing = db.projects.find((p) => p.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const updated = normalizeProject(req.body, existing);
    updated.slug = uniqueSlug(db.projects, updated.slug, existing.id);
    if (updated.status === "published" && !updated.publishedAt) {
      updated.publishedAt = new Date().toISOString();
    }

    await withDb((d) => {
      const idx = d.projects.findIndex((p) => p.id === existing.id);
      if (idx >= 0) d.projects[idx] = updated;
    });
    await audit("project.updated", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: `${updated.slug} (${updated.status})`,
    });
    res.json({ project: updated });
  });

  router.post("/:id/status", async (req: AuthedRequest, res: Response) => {
    const publish = req.body?.status === "published";
    const id = req.params.id;

    const project = await withDb((d) => {
      const p = d.projects.find((x) => x.id === id);
      if (!p) return null;
      p.status = publish ? "published" : "draft";
      p.updatedAt = new Date().toISOString();
      if (publish && !p.publishedAt) p.publishedAt = p.updatedAt;
      return { ...p };
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await audit(publish ? "project.published" : "project.unpublished", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: project.slug,
    });
    res.json({ project });
  });

  router.post("/reorder", async (req: AuthedRequest, res: Response) => {
    const ids = strList(req.body?.ids, 100, 60);
    await withDb((d) => {
      ids.forEach((id, i) => {
        const p = d.projects.find((x) => x.id === id);
        if (p) p.order = i;
      });
    });
    await audit("project.reordered", {
      userId: req.user!.id,
      ip: clientIp(req),
    });
    res.json({ ok: true });
  });

  router.delete("/:id", async (req: AuthedRequest, res: Response) => {
    const id = req.params.id;
    const removed = await withDb((d) => {
      const p = d.projects.find((x) => x.id === id);
      if (!p) return null;
      d.projects = d.projects.filter((x) => x.id !== id);
      return p.slug;
    });
    if (!removed) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await audit("project.deleted", {
      userId: req.user!.id,
      ip: clientIp(req),
      detail: removed,
    });
    res.json({ ok: true });
  });

  return router;
}

function uniqueSlug(
  projects: Project[],
  slug: string,
  selfId: string | null,
): string {
  let candidate = slug || "project";
  let n = 2;
  while (projects.some((p) => p.slug === candidate && p.id !== selfId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}
