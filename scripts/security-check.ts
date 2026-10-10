/**
 * End-to-end security and behaviour suite for the CMS API.
 *
 * Boots a throwaway API on a random port against an isolated data directory,
 * so brute-force and lockout tests cannot touch real content or lock the
 * operator out of the live console. Run with `npm run cms:test`.
 */
import { promises as fs } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "kz-cms-test-"));
process.env.CMS_DATA_DIR = DATA_DIR;
// Pin the transport before any server module loads. dotenv never overwrites an
// existing key, so real credentials in .env.local cannot make the suite send
// mail to a live inbox.
process.env.MAIL_TRANSPORT = "console";
// Most groups exercise the two-step flow; group 13 flips this to cover the
// password-only mode.
process.env.AUTH_REQUIRE_OTP = "true";

// Imported after CMS_DATA_DIR is set — the store resolves its path at load.
const { createApiApp } = await import("../server/app.ts");
const { withDb, newId } = await import("../server/db.ts");
const { hashPassword } = await import("../server/security.ts");

const PASSWORD = "Test-Console-Password!2026";
const USERNAME = "testop";
const EMAIL = "test-operator@example.invalid";

await withDb((db) => {
  db.users.push({
    id: newId(),
    username: USERNAME,
    email: EMAIL,
    role: "owner",
    passwordHash: "",
    mustChangePassword: false,
    disabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    passwordChangedAt: new Date().toISOString(),
  });
});
const hash = await hashPassword(PASSWORD);
await withDb((db) => {
  db.users[0].passwordHash = hash;
});

const server = http.createServer(createApiApp());
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };
const BASE = `http://127.0.0.1:${port}`;

/* ------------------------------------------------------------- harness */

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function group(title: string): void {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

interface Jar {
  cookies: Record<string, string>;
  csrf: string;
}

const jar: Jar = { cookies: {}, csrf: "" };

async function call(
  path: string,
  init: RequestInit & { auth?: boolean; csrf?: boolean } = {},
): Promise<{ status: number; body: any; headers: Headers }> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.auth !== false) {
    const cookie = Object.entries(jar.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookie) headers.set("Cookie", cookie);
  }
  if (init.csrf !== false && jar.csrf) headers.set("X-CSRF-Token", jar.csrf);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value) jar.cookies[name] = value;
    else delete jar.cookies[name];
    if (name === "kz_csrf" && value) jar.csrf = value;
  }

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

/** Reads the most recent code the console mail transport wrote to disk. */
async function latestOtp(): Promise<string> {
  const log = await fs.readFile(path.join(DATA_DIR, "outbox.log"), "utf8");
  const matches = [...log.matchAll(/code is (\d{6})/g)];
  return matches.at(-1)?.[1] ?? "";
}

async function signIn(): Promise<void> {
  const step1 = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (step1.body?.status === "signed-in") return;
  // Delivery is fire-and-forget; give it a moment to land in the outbox.
  await new Promise((r) => setTimeout(r, 150));
  await call("/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeToken: step1.body.challengeToken,
      code: await latestOtp(),
    }),
  });
}

/* --------------------------------------------------------------- tests */

console.log(`\n\x1b[1mKompozith CMS — security suite\x1b[0m  (${BASE})`);

/* 1. Unauthenticated access ------------------------------------------- */
group("1. Access control");
{
  const list = await call("/admin/projects", { auth: false, csrf: false });
  check("admin project list rejects anonymous", list.status === 401, `got ${list.status}`);

  const media = await call("/admin/media", { auth: false, csrf: false });
  check("admin media rejects anonymous", media.status === 401, `got ${media.status}`);

  const overview = await call("/admin/overview", { auth: false, csrf: false });
  check("admin overview rejects anonymous", overview.status === 401, `got ${overview.status}`);

  const bogus = await call("/admin/projects", {
    auth: false,
    csrf: false,
    headers: { Cookie: "kz_sid=forged-session-token-aaaaaaaaaaaaaaaaaaa" },
  });
  check("forged session cookie rejected", bogus.status === 401, `got ${bogus.status}`);
}

/* 2. Account enumeration ---------------------------------------------- */
group("2. Account enumeration resistance");
{
  const real = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: "definitely-wrong" }),
  });
  const fake = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: "no-such-operator", password: "definitely-wrong" }),
  });

  check("same status for known and unknown account", real.status === fake.status, `${real.status} vs ${fake.status}`);
  check(
    "same response keys",
    JSON.stringify(Object.keys(real.body).sort()) ===
      JSON.stringify(Object.keys(fake.body).sort()),
  );
  check("both return a challenge token", Boolean(real.body.challengeToken && fake.body.challengeToken));
  check(
    "masked address looks the same shape",
    /^.•+@[a-z.]+$/.test(real.body.sentTo) && /^.•+@[a-z.]+$/.test(fake.body.sentTo),
    `${real.body.sentTo} / ${fake.body.sentTo}`,
  );
  check(
    "no email sent for a wrong password",
    !(await fs.readFile(path.join(DATA_DIR, "outbox.log"), "utf8").catch(() => "")).includes(EMAIL),
  );
}

/* 3. OTP handling ------------------------------------------------------ */
group("3. One-time code handling");
{
  const step1 = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  await new Promise((r) => setTimeout(r, 150));
  const code = await latestOtp();
  check("code emailed after a correct password", code.length === 6, `got "${code}"`);

  const wrong = await call("/auth/verify", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ challengeToken: step1.body.challengeToken, code: "000000" }),
  });
  check("wrong code rejected", wrong.status === 401, `got ${wrong.status}`);

  const noToken = await call("/auth/verify", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ challengeToken: "made-up-token", code }),
  });
  check("code without a valid challenge rejected", noToken.status === 410, `got ${noToken.status}`);

  const ok = await call("/auth/verify", {
    method: "POST",
    csrf: false,
    body: JSON.stringify({ challengeToken: step1.body.challengeToken, code }),
  });
  check("correct code establishes a session", ok.status === 200, `got ${ok.status}`);

  const replay = await call("/auth/verify", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ challengeToken: step1.body.challengeToken, code }),
  });
  check("code cannot be replayed", replay.status === 410, `got ${replay.status}`);
}

/* 4. Cookie hardening -------------------------------------------------- */
group("4. Session cookie hardening");
{
  const probe = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  await new Promise((r) => setTimeout(r, 150));
  const res = await fetch(`${BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeToken: probe.body.challengeToken,
      code: await latestOtp(),
    }),
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const session = setCookies.find((c) => c.startsWith("kz_sid="));
  const csrf = setCookies.find((c) => c.startsWith("kz_csrf="));

  check("session cookie is HttpOnly", Boolean(session?.includes("HttpOnly")));
  check("session cookie is SameSite=Strict", Boolean(session?.match(/SameSite=Strict/i)));
  check("csrf cookie readable by script", Boolean(csrf && !csrf.includes("HttpOnly")));
  check("csrf cookie is SameSite=Strict", Boolean(csrf?.match(/SameSite=Strict/i)));
}

/* 5. CSRF -------------------------------------------------------------- */
group("5. CSRF protection");
{
  const noHeader = await call("/admin/projects", {
    method: "POST",
    csrf: false,
    body: JSON.stringify({ title: "csrf probe" }),
  });
  check("mutation without CSRF header rejected", noHeader.status === 403, `got ${noHeader.status}`);

  const wrongHeader = await call("/admin/projects", {
    method: "POST",
    csrf: false,
    headers: { "X-CSRF-Token": "not-the-right-token" },
    body: JSON.stringify({ title: "csrf probe" }),
  });
  check("mutation with wrong CSRF token rejected", wrongHeader.status === 403, `got ${wrongHeader.status}`);

  const crossOrigin = await call("/admin/projects", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: JSON.stringify({ title: "csrf probe" }),
  });
  check("cross-origin mutation rejected", crossOrigin.status === 403, `got ${crossOrigin.status}`);

  const good = await call("/admin/projects", {
    method: "POST",
    body: JSON.stringify({ title: "csrf probe" }),
  });
  check("mutation with valid CSRF accepted", good.status === 201, `got ${good.status}`);
  if (good.status === 201) {
    await call(`/admin/projects/${good.body.project.id}`, { method: "DELETE" });
  }
}

/* 6. Input sanitisation ------------------------------------------------ */
group("6. Input sanitisation");
{
  const created = await call("/admin/projects", {
    method: "POST",
    body: JSON.stringify({ title: "Sanitisation probe" }),
  });
  const id = created.body.project.id;

  const saved = await call(`/admin/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...created.body.project,
      coverImage: "javascript:alert(document.cookie)",
      liveUrl: "data:text/html,<script>alert(1)</script>",
      accentColor: "red; background:url(javascript:alert(1))",
      slug: "../../etc/passwd",
      isAdmin: true,
      publishedAt: "1999-01-01T00:00:00.000Z",
      sections: [{ type: "not-a-real-block", payload: "x" }],
    }),
  });
  const p = saved.body.project;

  check("javascript: URL stripped from image field", p.coverImage === "", `got "${p.coverImage}"`);
  check("data: URL stripped from link field", p.liveUrl === "", `got "${p.liveUrl}"`);
  check("invalid colour falls back to default", p.accentColor === "#FF6230", `got "${p.accentColor}"`);
  check("path traversal removed from slug", !p.slug.includes("/") && !p.slug.includes(".."), `got "${p.slug}"`);
  check("unknown client fields dropped", !("isAdmin" in p));
  check("unknown block types dropped", p.sections.length === 0, `got ${p.sections.length}`);
  check(
    "server-owned publishedAt not client-writable",
    p.publishedAt !== "1999-01-01T00:00:00.000Z",
    `got ${p.publishedAt}`,
  );

  await call(`/admin/projects/${id}`, { method: "DELETE" });
}

/* 7. Media upload ------------------------------------------------------ */
group("7. Media upload validation");
{
  const html = Buffer.from("<html><script>alert(1)</script></html>").toString("base64");
  const badType = await call("/admin/media", {
    method: "POST",
    body: JSON.stringify({ data: html }),
  });
  check("non-image upload rejected by magic bytes", badType.status === 415, `got ${badType.status}`);

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>').toString("base64");
  const svgUpload = await call("/admin/media", {
    method: "POST",
    body: JSON.stringify({ data: svg }),
  });
  check("SVG upload rejected", svgUpload.status === 415, `got ${svgUpload.status}`);

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64),
  ]).toString("base64");
  const good = await call("/admin/media", {
    method: "POST",
    body: JSON.stringify({ data: `data:image/png;base64,${png}` }),
  });
  check("valid PNG accepted", good.status === 201, `got ${good.status}`);
  check(
    "stored filename is randomised, not client-supplied",
    /^[A-Za-z0-9_-]{16}\.png$/.test(good.body?.file?.name ?? ""),
    `got "${good.body?.file?.name}"`,
  );

  const traversal = await call("/admin/media/..%2F..%2Fcms.json", { method: "DELETE" });
  check("path traversal on delete rejected", traversal.status === 400, `got ${traversal.status}`);
  check(
    "database file untouched by traversal attempt",
    await fs
      .access(path.join(DATA_DIR, "cms.json"))
      .then(() => true)
      .catch(() => false),
  );

  if (good.status === 201) {
    await call(`/admin/media/${good.body.file.name}`, { method: "DELETE" });
  }
}

/* 8. Draft visibility -------------------------------------------------- */
group("8. Draft visibility");
{
  const created = await call("/admin/projects", {
    method: "POST",
    body: JSON.stringify({ title: "Secret draft", excerpt: "unreleased" }),
  });
  const project = created.body.project;

  const publicList = await call("/projects", { auth: false, csrf: false });
  check(
    "draft absent from the public list",
    !JSON.stringify(publicList.body).includes("Secret draft"),
  );

  const direct = await call(`/projects/${project.slug}`, { auth: false, csrf: false });
  check("draft not reachable by direct slug", direct.status === 404, `got ${direct.status}`);

  await call(`/admin/projects/${project.id}/status`, {
    method: "POST",
    body: JSON.stringify({ status: "published" }),
  });
  const afterPublish = await call(`/projects/${project.slug}`, { auth: false, csrf: false });
  check("published project becomes reachable", afterPublish.status === 200, `got ${afterPublish.status}`);

  await call(`/admin/projects/${project.id}`, { method: "DELETE" });
  const afterDelete = await call(`/projects/${project.slug}`, { auth: false, csrf: false });
  check("deleted project stops resolving", afterDelete.status === 404, `got ${afterDelete.status}`);
}

/* 9. Response headers -------------------------------------------------- */
group("9. Response headers");
{
  const admin = await call("/admin/projects");
  check("nosniff on admin responses", admin.headers.get("x-content-type-options") === "nosniff");
  check("frames denied", admin.headers.get("x-frame-options") === "DENY");
  check(
    "admin responses are not cacheable",
    (admin.headers.get("cache-control") ?? "").includes("no-store"),
    admin.headers.get("cache-control") ?? "missing",
  );
  check(
    "admin responses are not indexable",
    (admin.headers.get("x-robots-tag") ?? "").includes("noindex"),
    admin.headers.get("x-robots-tag") ?? "missing",
  );
  check("no framework fingerprint", !admin.headers.has("x-powered-by"));
}

/* 10. Password policy -------------------------------------------------- */
group("10. Password policy");
{
  const weak = await call("/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword: PASSWORD, newPassword: "short" }),
  });
  check("weak password rejected", weak.status === 400, `got ${weak.status}`);

  const wrongCurrent = await call("/auth/password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword: "not-my-password",
      newPassword: "Another-Strong-Pass!2026",
    }),
  });
  check("wrong current password rejected", wrongCurrent.status === 401, `got ${wrongCurrent.status}`);
}

/* 11. Brute force ------------------------------------------------------ */
group("11. Brute-force throttling");
{
  jar.cookies = {};
  jar.csrf = "";

  let lockedAt = 0;
  for (let attempt = 1; attempt <= 9; attempt += 1) {
    const res = await call("/auth/login", {
      auth: false,
      csrf: false,
      method: "POST",
      body: JSON.stringify({ username: USERNAME, password: `guess-${attempt}` }),
    });
    if (res.status === 429) {
      lockedAt = attempt;
      break;
    }
  }
  check("password guessing gets locked out", lockedAt > 0 && lockedAt <= 7, `locked at attempt ${lockedAt}`);

  const blocked = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  check("correct password is refused while locked out", blocked.status === 429, `got ${blocked.status}`);
  check("lockout advertises Retry-After", blocked.headers.has("retry-after"));
}

/* 12. Session lifecycle ------------------------------------------------ */
group("12. Session lifecycle");
{
  // Fresh throttle key by using the account's email as the identifier.
  await withDb((db) => {
    db.throttles = [];
  });
  await signIn();

  const before = await call("/auth/me");
  check("session active before logout", before.status === 200, `got ${before.status}`);

  const out = await call("/auth/logout", { method: "POST" });
  check("logout succeeds", out.status === 200, `got ${out.status}`);

  const after = await call("/auth/me", { csrf: false });
  check("session dead after logout", after.status === 401, `got ${after.status}`);
}

/* 13. Password-only mode ----------------------------------------------- */
group("13. Password-only mode (AUTH_REQUIRE_OTP unset)");
{
  process.env.AUTH_REQUIRE_OTP = "false";
  jar.cookies = {};
  jar.csrf = "";
  await withDb((db) => {
    db.throttles = [];
    db.challenges = [];
  });

  const config = await call("/auth/config", { auth: false, csrf: false });
  check("config advertises no second factor", config.body?.mfaRequired === false);

  const bad = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: "wrong-password" }),
  });
  const unknown = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: "ghost-operator", password: "wrong-password" }),
  });
  check("wrong password rejected", bad.status === 401, `got ${bad.status}`);
  check(
    "unknown account answers identically",
    bad.status === unknown.status && bad.body?.error === unknown.body?.error,
    `${bad.status}/${bad.body?.error} vs ${unknown.status}/${unknown.body?.error}`,
  );
  check(
    "failure does not say which field was wrong",
    // Must name both fields together, or neither — never single one out.
    /username (and|or) password|credentials/i.test(
      String(bad.body?.error ?? ""),
    ) &&
      !/(no such|not found|does not exist|unknown (user|account))/i.test(
        String(bad.body?.error ?? ""),
      ),
    String(bad.body?.error),
  );

  const outboxBefore = await fs
    .readFile(path.join(DATA_DIR, "outbox.log"), "utf8")
    .catch(() => "");

  const good = await call("/auth/login", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  check("correct password signs in directly", good.body?.status === "signed-in", `got ${JSON.stringify(good.body)?.slice(0, 80)}`);
  check("no challenge token handed out", !good.body?.challengeToken);

  await new Promise((r) => setTimeout(r, 150));
  const outboxAfter = await fs
    .readFile(path.join(DATA_DIR, "outbox.log"), "utf8")
    .catch(() => "");
  check("no code emailed in this mode", outboxBefore === outboxAfter);

  const session = await call("/auth/me", { csrf: false });
  check("session works immediately", session.status === 200, `got ${session.status}`);
  check("me reports mfa disabled", session.body?.mfaRequired === false);

  // The OTP endpoints must not linger as an alternative way in.
  const verify = await call("/auth/verify", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ challengeToken: "x", code: "123456" }),
  });
  check("verify endpoint disabled", verify.status === 404, `got ${verify.status}`);

  const resend = await call("/auth/resend", {
    auth: false,
    csrf: false,
    method: "POST",
    body: JSON.stringify({ challengeToken: "x" }),
  });
  check("resend endpoint disabled", resend.status === 404, `got ${resend.status}`);

  // Everything else must still hold with the second factor off.
  const noCsrf = await call("/admin/projects", {
    method: "POST",
    csrf: false,
    body: JSON.stringify({ title: "probe" }),
  });
  check("CSRF still enforced", noCsrf.status === 403, `got ${noCsrf.status}`);

  const anon = await call("/admin/projects", { auth: false, csrf: false });
  check("admin API still rejects anonymous", anon.status === 401, `got ${anon.status}`);

  let lockedAt = 0;
  for (let attempt = 1; attempt <= 9; attempt += 1) {
    const res = await call("/auth/login", {
      auth: false,
      csrf: false,
      method: "POST",
      body: JSON.stringify({ username: USERNAME, password: `guess-${attempt}` }),
    });
    if (res.status === 429) {
      lockedAt = attempt;
      break;
    }
  }
  check("throttling still applies", lockedAt > 0 && lockedAt <= 7, `locked at attempt ${lockedAt}`);
}

/* ------------------------------------------------------------- report */

server.close();
await fs.rm(DATA_DIR, { recursive: true, force: true });

console.log(`\n${"─".repeat(58)}`);
console.log(
  failed === 0
    ? `\x1b[32m  ALL ${passed} CHECKS PASSED\x1b[0m`
    : `\x1b[31m  ${failed} FAILED\x1b[0m, ${passed} passed`,
);
if (failures.length) {
  for (const name of failures) console.log(`    · ${name}`);
}
console.log(`${"─".repeat(58)}\n`);

process.exit(failed === 0 ? 0 : 1);
