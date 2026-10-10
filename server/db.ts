/**
 * File-backed JSON store.
 *
 * A portfolio CMS holds a few dozen records, so a single JSON document read
 * into memory is the right size of tool — no database process to run, and the
 * whole content set is diffable and backup-able as one file.
 *
 * Writes are atomic (write temp -> fsync -> rename) and serialised through a
 * promise chain so two concurrent requests can never interleave a save.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Project } from "./types.ts";

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: "owner" | "editor";
  passwordHash: string;
  /** Set when the account was seeded with a generated password. */
  mustChangePassword: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string;
}

export interface SessionRecord {
  /** sha256 of the session token — the raw token only ever lives in the cookie. */
  tokenHash: string;
  userId: string;
  csrfHash: string;
  createdAt: string;
  lastSeenAt: string;
  absoluteExpiresAt: string;
  idleExpiresAt: string;
  ip: string;
  userAgent: string;
}

export interface ChallengeRecord {
  /** sha256 of the challenge token handed to the client after step 1. */
  tokenHash: string;
  userId: string;
  codeHash: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  resends: number;
  ip: string;
}

export interface ThrottleRecord {
  key: string;
  count: number;
  firstAt: string;
  lockedUntil: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  event: string;
  userId: string | null;
  ip: string;
  detail: string;
}

export interface DatabaseShape {
  version: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  challenges: ChallengeRecord[];
  throttles: ThrottleRecord[];
  projects: Project[];
  audit: AuditEntry[];
}

const DATA_DIR =
  process.env.CMS_DATA_DIR || path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cms.json");

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const EMPTY: DatabaseShape = {
  version: 1,
  users: [],
  sessions: [],
  challenges: [],
  throttles: [],
  projects: [],
  audit: [],
};

let cache: DatabaseShape | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function readFromDisk(): Promise<DatabaseShape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
    return { ...EMPTY, ...parsed };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(EMPTY);
    }
    throw err;
  }
}

/**
 * A process killed between writing a temp file and renaming it leaves the temp
 * behind. Harmless, but it accumulates — sweep it on the first read.
 */
async function sweepStaleTemps(): Promise<void> {
  const names = await fs.readdir(DATA_DIR).catch(() => [] as string[]);
  await Promise.all(
    names
      .filter((n) => n.startsWith("cms.json.") && n.endsWith(".tmp"))
      .map((n) => fs.unlink(path.join(DATA_DIR, n)).catch(() => undefined)),
  );
}

export async function getDb(): Promise<DatabaseShape> {
  if (!cache) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cache = await readFromDisk();
    await sweepStaleTemps();
  }
  return cache;
}

async function persist(db: DatabaseShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  const handle = await fs.open(tmp, "w");
  try {
    await handle.writeFile(JSON.stringify(db, null, 2), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, DB_FILE);
}

/**
 * Runs `mutator` against the in-memory database and flushes to disk. Calls are
 * queued, so the on-disk file always reflects a complete, ordered mutation.
 */
export function withDb<T>(
  mutator: (db: DatabaseShape) => T | Promise<T>,
): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await getDb();
    const result = await mutator(db);
    await persist(db);
    return result;
  });
  // Keep the chain alive even if one mutation rejects.
  writeChain = run.catch(() => undefined);
  return run;
}

export function newId(): string {
  return randomUUID();
}

export async function audit(
  event: string,
  opts: { userId?: string | null; ip?: string; detail?: string } = {},
): Promise<void> {
  await withDb((db) => {
    db.audit.unshift({
      id: newId(),
      at: new Date().toISOString(),
      event,
      userId: opts.userId ?? null,
      ip: opts.ip ?? "",
      detail: opts.detail ?? "",
    });
    // Keep the log bounded; it is a forensic aid, not an archive.
    if (db.audit.length > 1000) db.audit.length = 1000;
  });
}

/** Drops expired sessions and challenges. Cheap enough to run per request. */
export function pruneExpired(db: DatabaseShape): void {
  const now = Date.now();
  db.sessions = db.sessions.filter(
    (s) =>
      Date.parse(s.absoluteExpiresAt) > now && Date.parse(s.idleExpiresAt) > now,
  );
  db.challenges = db.challenges.filter((c) => Date.parse(c.expiresAt) > now);
  db.throttles = db.throttles.filter((t) => {
    const locked = t.lockedUntil && Date.parse(t.lockedUntil) > now;
    const recent = now - Date.parse(t.firstAt) < 60 * 60 * 1000;
    return locked || recent;
  });
}
