/**
 * Authentication for the admin console.
 *
 * With AUTH_REQUIRE_OTP=true — two steps:
 *   step 1  POST /auth/login   username + password  -> challenge token, code emailed
 *   step 2  POST /auth/verify  challenge + 6-digit code -> session cookie
 *
 * Otherwise — one step: POST /auth/login returns the session cookie directly.
 *
 * Design notes:
 *  - In two-step mode, step 1 always answers with a challenge, even for unknown
 *    accounts. In one-step mode a failure is one generic 401. Either way the
 *    same scrypt round is always burned, so response shape and timing carry no
 *    signal about whether an account exists.
 *  - Session tokens and OTP codes are stored hashed; the database alone is not
 *    enough to impersonate anyone.
 *  - The session cookie is httpOnly + SameSite=Strict, and every mutating
 *    request additionally needs a CSRF token bound to that session.
 */
import { createHash } from "node:crypto";
import type { Request, Response, NextFunction, Router } from "express";
import express from "express";
import {
  audit,
  getDb,
  pruneExpired,
  withDb,
  type ChallengeRecord,
  type SessionRecord,
  type UserRecord,
} from "./db.ts";
import {
  generateOtpCode,
  hashPassword,
  hashToken,
  passwordIssues,
  randomToken,
  safeEqual,
  verifyPassword,
} from "./security.ts";
import { sendOtpEmail, sendSecurityNotice } from "./mailer.ts";

/* ------------------------------------------------------------------ config */

const SESSION_COOKIE = "kz_sid";
const CSRF_COOKIE = "kz_csrf";

const CHALLENGE_TTL_MIN = 10;
const CHALLENGE_MAX_ATTEMPTS = 5;
const CHALLENGE_MAX_RESENDS = 3;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOCKOUT_STEPS_MS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
];

const SESSION_IDLE_MS = 60 * 60 * 1000;
const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;

/* A hash of a value nobody knows — used to keep timing flat for unknown users. */
const DECOY_PASSWORD_HASH =
  "scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

/**
 * Second factor toggle. Read per request rather than at module load so the
 * test suite can exercise both modes in one run.
 *
 * Off means the console rests on the password alone — every other control
 * (throttling, hashing, session hardening, CSRF) is unchanged, but a leaked
 * or guessed password is then sufficient on its own. Turn it back on with
 * AUTH_REQUIRE_OTP=true once mail delivery is configured.
 */
export function otpRequired(): boolean {
  return process.env.AUTH_REQUIRE_OTP === "true";
}

export function describeAuthMode(): string {
  return otpRequired()
    ? "auth: password + emailed one-time code"
    : "auth: PASSWORD ONLY — second factor disabled (AUTH_REQUIRE_OTP=true to enable)";
}

/* ------------------------------------------------------------- request ctx */

export interface AuthedRequest extends Request {
  user?: UserRecord;
  session?: SessionRecord;
}

export function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "";
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      /* malformed cookie — ignore */
    }
  }
  return out;
}

function isSecureRequest(req: Request): boolean {
  return (
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.FORCE_SECURE_COOKIES === "true"
  );
}

function setSessionCookies(
  req: Request,
  res: Response,
  token: string,
  csrf: string,
): void {
  const secure = isSecureRequest(req);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: SESSION_ABSOLUTE_MS,
  });
  // Readable by the admin bundle so it can echo the value back in a header.
  res.cookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: SESSION_ABSOLUTE_MS,
  });
}

function clearSessionCookies(req: Request, res: Response): void {
  const secure = isSecureRequest(req);
  const opts = { sameSite: "strict" as const, secure, path: "/" };
  res.clearCookie(SESSION_COOKIE, { ...opts, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...opts, httpOnly: false });
}

/* ------------------------------------------------------------- throttling */

interface ThrottleState {
  blocked: boolean;
  retryAfterSec: number;
}

async function checkThrottle(key: string): Promise<ThrottleState> {
  const db = await getDb();
  const rec = db.throttles.find((t) => t.key === key);
  if (!rec?.lockedUntil) return { blocked: false, retryAfterSec: 0 };
  const remain = Date.parse(rec.lockedUntil) - Date.now();
  if (remain <= 0) return { blocked: false, retryAfterSec: 0 };
  return { blocked: true, retryAfterSec: Math.ceil(remain / 1000) };
}

async function registerFailure(key: string): Promise<void> {
  await withDb((db) => {
    const now = Date.now();
    let rec = db.throttles.find((t) => t.key === key);
    if (!rec || now - Date.parse(rec.firstAt) > LOGIN_WINDOW_MS) {
      rec = {
        key,
        count: 0,
        firstAt: new Date().toISOString(),
        lockedUntil: null,
      };
      db.throttles = db.throttles.filter((t) => t.key !== key);
      db.throttles.push(rec);
    }
    rec.count += 1;
    if (rec.count >= LOGIN_MAX_ATTEMPTS) {
      const step = Math.min(
        Math.floor(rec.count / LOGIN_MAX_ATTEMPTS) - 1,
        LOCKOUT_STEPS_MS.length - 1,
      );
      rec.lockedUntil = new Date(now + LOCKOUT_STEPS_MS[step]).toISOString();
    }
  });
}

async function clearThrottle(key: string): Promise<void> {
  await withDb((db) => {
    db.throttles = db.throttles.filter((t) => t.key !== key);
  });
}

/* --------------------------------------------------------------- sessions */

async function createSession(
  req: Request,
  res: Response,
  user: UserRecord,
): Promise<void> {
  const token = randomToken();
  const csrf = randomToken(24);
  const now = Date.now();

  await withDb((db) => {
    pruneExpired(db);
    // One human, a handful of devices — cap runaway session growth.
    const mine = db.sessions
      .filter((s) => s.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    for (const stale of mine.slice(4)) {
      db.sessions = db.sessions.filter((s) => s.tokenHash !== stale.tokenHash);
    }
    db.sessions.push({
      tokenHash: hashToken(token),
      userId: user.id,
      csrfHash: hashToken(csrf),
      createdAt: new Date(now).toISOString(),
      lastSeenAt: new Date(now).toISOString(),
      absoluteExpiresAt: new Date(now + SESSION_ABSOLUTE_MS).toISOString(),
      idleExpiresAt: new Date(now + SESSION_IDLE_MS).toISOString(),
      ip: clientIp(req),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
    });
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastLoginAt = new Date(now).toISOString();
  });

  setSessionCookies(req, res, token, csrf);
}

/** Loads the session, slides the idle window, and rejects if anything is off. */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const tokenHash = hashToken(token);
  const result = await withDb((db) => {
    pruneExpired(db);
    const session = db.sessions.find((s) => s.tokenHash === tokenHash);
    if (!session) return null;
    const user = db.users.find((u) => u.id === session.userId);
    if (!user || user.disabled) return null;
    const now = Date.now();
    session.lastSeenAt = new Date(now).toISOString();
    session.idleExpiresAt = new Date(now + SESSION_IDLE_MS).toISOString();
    return { session: { ...session }, user: { ...user } };
  });

  if (!result) {
    clearSessionCookies(req, res);
    res.status(401).json({ error: "Session expired" });
    return;
  }

  req.session = result.session;
  req.user = result.user;
  next();
}

/** Double-submit CSRF check, bound to the session record. */
export function requireCsrf(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  const header = req.get("x-csrf-token") || "";
  const cookie = parseCookies(req)[CSRF_COOKIE] || "";
  if (
    !header ||
    !cookie ||
    !safeEqual(header, cookie) ||
    !req.session ||
    hashToken(header) !== req.session.csrfHash
  ) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }
  next();
}

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    mustChangePassword: user.mustChangePassword,
  };
}

/* ------------------------------------------------------------------ routes */

/** Hides all but the first character and the domain: `a•••@site.com`. */
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "•••";
  const head = name.slice(0, 1);
  return `${head}${"•".repeat(Math.max(name.length - 1, 2))}@${domain}`;
}

const DECOY_DOMAINS = ["gmail.com", "outlook.com", "icloud.com", "proton.me"];

/**
 * A plausible masked address for an account that does not exist, so step 1
 * gives the same answer whether or not the username is real. Derived from the
 * username so repeated probes see a stable value — randomising it per request
 * would itself be the tell.
 */
function decoyMaskedEmail(username: string): string {
  const h = createHash("sha256").update(username.toLowerCase()).digest();
  const domain = DECOY_DOMAINS[h[0] % DECOY_DOMAINS.length];
  const length = 6 + (h[1] % 9);
  const head = (username[0] || "a").toLowerCase();
  return `${head}${"•".repeat(length)}@${domain}`;
}

async function issueChallenge(
  req: Request,
  user: UserRecord | null,
  username: string,
): Promise<{ token: string; sentTo: string }> {
  const token = randomToken();
  const code = generateOtpCode();
  const now = Date.now();

  const record: ChallengeRecord = {
    tokenHash: hashToken(token),
    // An empty userId marks a decoy challenge for an unknown account.
    userId: user?.id ?? "",
    codeHash: user ? hashToken(code) : hashToken(randomToken()),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CHALLENGE_TTL_MIN * 60 * 1000).toISOString(),
    attempts: 0,
    resends: 0,
    ip: clientIp(req),
  };

  await withDb((db) => {
    pruneExpired(db);
    if (user) {
      // Only one live challenge per account.
      db.challenges = db.challenges.filter((c) => c.userId !== user.id);
    }
    db.challenges.push(record);
  });

  if (user) {
    // Dispatched without awaiting: delivery latency must not make a real
    // account measurably slower to probe than a non-existent one.
    void sendOtpEmail({
      to: user.email,
      code,
      minutes: CHALLENGE_TTL_MIN,
      ip: clientIp(req),
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[auth] OTP delivery failed:", err);
    });
  }

  return {
    token,
    sentTo: user ? maskEmail(user.email) : decoyMaskedEmail(username),
  };
}

export function createAuthRouter(): Router {
  const router = express.Router();

  /**
   * Lets the sign-in screen describe the flow accurately before the first
   * attempt. Public, but reveals nothing a single login attempt would not.
   */
  router.get("/config", (_req: Request, res: Response) => {
    res.json({ mfaRequired: otpRequired() });
  });

  /* ---- step 1: password ------------------------------------------------ */
  router.post("/login", async (req: Request, res: Response) => {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const ip = clientIp(req);
    const ipKey = `login:ip:${ip}`;
    const userKey = `login:user:${username.toLowerCase()}`;

    for (const key of [ipKey, userKey]) {
      const state = await checkThrottle(key);
      if (state.blocked) {
        await audit("login.throttled", { ip, detail: username });
        res
          .status(429)
          .set("Retry-After", String(state.retryAfterSec))
          .json({
            error: `Too many attempts. Try again in ${Math.ceil(
              state.retryAfterSec / 60,
            )} minute(s).`,
          });
        return;
      }
    }

    const db = await getDb();
    const lookup = username.toLowerCase();
    const user =
      db.users.find(
        (u) =>
          u.username.toLowerCase() === lookup ||
          u.email.toLowerCase() === lookup,
      ) ?? null;

    // Always run scrypt so a missing account costs the same as a wrong password.
    const ok = await verifyPassword(
      password,
      user && !user.disabled ? user.passwordHash : DECOY_PASSWORD_HASH,
    );

    if (!user || user.disabled || !ok) {
      await registerFailure(ipKey);
      await registerFailure(userKey);
      await audit("login.failed", { ip, detail: username });

      if (!otpRequired()) {
        // One generic message for "no such account" and "wrong password", on
        // a path that already spent the same scrypt round either way.
        res.status(401).json({ error: "Incorrect username or password" });
        return;
      }
      // Still hand back a challenge: the client flow is identical either way.
      const challenge = await issueChallenge(req, null, username);
      res.json({
        status: "mfa-required",
        challengeToken: challenge.token,
        sentTo: challenge.sentTo,
        expiresInSec: CHALLENGE_TTL_MIN * 60,
      });
      return;
    }

    await clearThrottle(ipKey);
    await clearThrottle(userKey);
    await audit("login.password_ok", { userId: user.id, ip });

    if (!otpRequired()) {
      await createSession(req, res, user);
      await audit("login.success", { userId: user.id, ip, detail: "no-mfa" });
      res.json({ status: "signed-in", user: publicUser(user) });
      return;
    }

    const challenge = await issueChallenge(req, user, username);
    res.json({
      status: "mfa-required",
      challengeToken: challenge.token,
      sentTo: challenge.sentTo,
      expiresInSec: CHALLENGE_TTL_MIN * 60,
    });
  });

  /* ---- resend the code ------------------------------------------------- */
  router.post("/resend", async (req: Request, res: Response) => {
    if (!otpRequired()) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const token = String(req.body?.challengeToken ?? "");
    if (!token) {
      res.status(400).json({ error: "Missing challenge" });
      return;
    }
    const tokenHash = hashToken(token);

    const outcome = await withDb((db) => {
      pruneExpired(db);
      const challenge = db.challenges.find((c) => c.tokenHash === tokenHash);
      if (!challenge) return { status: "gone" as const };
      if (challenge.resends >= CHALLENGE_MAX_RESENDS)
        return { status: "limit" as const };
      challenge.resends += 1;
      challenge.attempts = 0;
      const user = db.users.find((u) => u.id === challenge.userId) ?? null;
      return { status: "ok" as const, challenge, user };
    });

    if (outcome.status === "gone") {
      res.status(410).json({ error: "This code request expired. Start over." });
      return;
    }
    if (outcome.status === "limit") {
      res.status(429).json({ error: "Too many resends. Start over." });
      return;
    }

    if (outcome.user) {
      const code = generateOtpCode();
      const codeHash = hashToken(code);
      await withDb((db) => {
        const c = db.challenges.find((x) => x.tokenHash === tokenHash);
        if (c) c.codeHash = codeHash;
      });
      await sendOtpEmail({
        to: outcome.user.email,
        code,
        minutes: CHALLENGE_TTL_MIN,
        ip: clientIp(req),
      });
      await audit("login.otp_resent", {
        userId: outcome.user.id,
        ip: clientIp(req),
      });
    }

    res.json({ ok: true, expiresInSec: CHALLENGE_TTL_MIN * 60 });
  });

  /* ---- step 2: one-time code ------------------------------------------- */
  router.post("/verify", async (req: Request, res: Response) => {
    if (!otpRequired()) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const token = String(req.body?.challengeToken ?? "");
    const code = String(req.body?.code ?? "").replace(/\D/g, "");
    const ip = clientIp(req);

    if (!token || code.length !== 6) {
      res.status(400).json({ error: "Enter the 6-digit code" });
      return;
    }

    const ipKey = `otp:ip:${ip}`;
    const state = await checkThrottle(ipKey);
    if (state.blocked) {
      res
        .status(429)
        .set("Retry-After", String(state.retryAfterSec))
        .json({ error: "Too many attempts. Try again later." });
      return;
    }

    const tokenHash = hashToken(token);
    const codeHash = hashToken(code);

    const outcome = await withDb((db) => {
      pruneExpired(db);
      const challenge = db.challenges.find((c) => c.tokenHash === tokenHash);
      if (!challenge) return { status: "gone" as const };

      challenge.attempts += 1;
      if (challenge.attempts > CHALLENGE_MAX_ATTEMPTS) {
        db.challenges = db.challenges.filter((c) => c.tokenHash !== tokenHash);
        return { status: "burned" as const };
      }
      if (challenge.codeHash !== codeHash) return { status: "bad" as const };

      const user = db.users.find((u) => u.id === challenge.userId);
      if (!user || user.disabled) return { status: "bad" as const };

      // Single use: consume the challenge the moment it succeeds.
      db.challenges = db.challenges.filter((c) => c.tokenHash !== tokenHash);
      return { status: "ok" as const, user: { ...user } };
    });

    if (outcome.status === "ok") {
      await clearThrottle(ipKey);
      await createSession(req, res, outcome.user);
      await audit("login.success", { userId: outcome.user.id, ip });
      res.json({ user: publicUser(outcome.user) });
      return;
    }

    await registerFailure(ipKey);
    await audit(`login.otp_${outcome.status}`, { ip });

    if (outcome.status === "gone" || outcome.status === "burned") {
      res
        .status(410)
        .json({ error: "This code is no longer valid. Start over." });
      return;
    }
    res.status(401).json({ error: "Incorrect code" });
  });

  /* ---- session probe --------------------------------------------------- */
  router.get(
    "/me",
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      res.json({ user: publicUser(req.user!), mfaRequired: otpRequired() });
    },
  );

  /* ---- logout ---------------------------------------------------------- */
  router.post(
    "/logout",
    requireAuth,
    requireCsrf,
    async (req: AuthedRequest, res: Response) => {
      const hash = req.session!.tokenHash;
      await withDb((db) => {
        db.sessions = db.sessions.filter((s) => s.tokenHash !== hash);
      });
      await audit("logout", { userId: req.user!.id, ip: clientIp(req) });
      clearSessionCookies(req, res);
      res.json({ ok: true });
    },
  );

  /* ---- password change ------------------------------------------------- */
  router.post(
    "/password",
    requireAuth,
    requireCsrf,
    async (req: AuthedRequest, res: Response) => {
      const current = String(req.body?.currentPassword ?? "");
      const next = String(req.body?.newPassword ?? "");

      if (!(await verifyPassword(current, req.user!.passwordHash))) {
        await registerFailure(`login:user:${req.user!.username.toLowerCase()}`);
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
      const issues = passwordIssues(next);
      if (issues.length) {
        res
          .status(400)
          .json({ error: `Password needs ${issues.join(", ")}.` });
        return;
      }
      if (await verifyPassword(next, req.user!.passwordHash)) {
        res
          .status(400)
          .json({ error: "New password must differ from the current one" });
        return;
      }

      const hash = await hashPassword(next);
      const keep = req.session!.tokenHash;
      await withDb((db) => {
        const u = db.users.find((x) => x.id === req.user!.id);
        if (!u) return;
        u.passwordHash = hash;
        u.mustChangePassword = false;
        u.passwordChangedAt = new Date().toISOString();
        u.updatedAt = new Date().toISOString();
        // Changing the password ends every other session.
        db.sessions = db.sessions.filter(
          (s) => s.userId !== u.id || s.tokenHash === keep,
        );
      });
      await audit("password.changed", {
        userId: req.user!.id,
        ip: clientIp(req),
      });
      await sendSecurityNotice({
        to: req.user!.email,
        subject: "Your Kompozith Console password was changed",
        message:
          `The password for ${req.user!.username} was changed from ${clientIp(req)}. ` +
          `If this was not you, contact your administrator immediately.`,
      }).catch(() => undefined);

      res.json({ ok: true });
    },
  );

  /* ---- active sessions ------------------------------------------------- */
  router.get(
    "/sessions",
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const db = await getDb();
      res.json({
        sessions: db.sessions
          .filter((s) => s.userId === req.user!.id)
          .map((s) => ({
            current: s.tokenHash === req.session!.tokenHash,
            createdAt: s.createdAt,
            lastSeenAt: s.lastSeenAt,
            ip: s.ip,
            userAgent: s.userAgent,
          })),
      });
    },
  );

  router.post(
    "/sessions/revoke-others",
    requireAuth,
    requireCsrf,
    async (req: AuthedRequest, res: Response) => {
      const keep = req.session!.tokenHash;
      const id = req.user!.id;
      await withDb((db) => {
        db.sessions = db.sessions.filter(
          (s) => s.userId !== id || s.tokenHash === keep,
        );
      });
      await audit("sessions.revoked_others", { userId: id, ip: clientIp(req) });
      res.json({ ok: true });
    },
  );

  return router;
}
