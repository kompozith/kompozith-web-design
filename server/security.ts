/**
 * Password hashing, token minting and constant-time comparison.
 *
 * Everything here is built on node:crypto — no third-party crypto dependency,
 * so there is no supply-chain surface for the part of the system that guards
 * the admin console.
 */
import {
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
  createHash,
  type ScryptOptions,
} from "node:crypto";

/** promisify() picks the 3-argument overload, which drops our cost params. */
const scrypt = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });

/* OWASP-recommended scrypt parameters (N=2^16, r=8, p=1 -> ~64 MB). */
const SCRYPT_N = 65536;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 128 * SCRYPT_N * SCRYPT_R * 2;

/**
 * Returns `scrypt$N$r$p$salt$hash`. Parameters travel with the hash so they
 * can be raised later without invalidating existing passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!N || !r || !p) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }

  const key = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 2,
  });
  return timingSafeEqual(key, expected);
}

/** Constant-time string compare that does not leak length via early return. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/** 256 bits of entropy, URL-safe. Used for session and challenge tokens. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Tokens are stored hashed. A leaked database snapshot therefore cannot be
 * replayed as a live session.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Cryptographically uniform 6-digit code (leading zeros preserved). */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Password strength floor for admin accounts. Deliberately strict: this is the
 * only knowledge factor guarding the console.
 */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("at least 12 characters");
  if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("a digit");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("a symbol");
  return issues;
}
