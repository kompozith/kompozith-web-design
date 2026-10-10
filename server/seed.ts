/**
 * One-off setup: creates the first owner account and loads the starter
 * content. Run with `npm run cms:setup`.
 *
 * The generated password is printed exactly once, here, and only its scrypt
 * hash is stored. Re-running is safe — nothing is overwritten unless you pass
 * --reset-password.
 */
import "./env.ts";
import { randomInt } from "node:crypto";
import { audit, getDb, newId, withDb, type UserRecord } from "./db.ts";
import { hashPassword } from "./security.ts";
import { buildSeedProjects } from "./seedData.ts";
import { activeTransport, sendSecurityNotice } from "./mailer.ts";

/*
 * 24 characters drawn from a 57-glyph alphabet with the visually ambiguous
 * ones removed (no 0/O, no 1/l/I). That is roughly 140 bits — the account is
 * strong on the password alone, before the emailed code — while staying
 * transcribable once into a password manager. Dashes are cosmetic grouping.
 */
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*?";
const ALPHABET = LOWER + UPPER + DIGITS;
const LENGTH = 24;

function generatePassword(): string {
  const chars = Array.from(
    { length: LENGTH },
    () => ALPHABET[randomInt(0, ALPHABET.length)],
  );

  // Guarantee each policy class rather than relying on chance.
  const slots = new Set<number>();
  while (slots.size < 4) slots.add(randomInt(0, LENGTH));
  const [a, b, c, d] = [...slots];
  chars[a] = LOWER[randomInt(0, LOWER.length)];
  chars[b] = UPPER[randomInt(0, UPPER.length)];
  chars[c] = DIGITS[randomInt(0, DIGITS.length)];
  chars[d] = SYMBOLS[randomInt(0, SYMBOLS.length)];

  return [0, 6, 12, 18]
    .map((i) => chars.slice(i, i + 6).join(""))
    .join("-");
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

/** Deliberately permissive — the point is to catch typos, not police syntax. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

async function main(): Promise<void> {
  const resetPassword = process.argv.includes("--reset-password");
  const username = arg("username") || process.env.ADMIN_USERNAME || "kompozith";
  const emailArg = arg("email") || process.env.ADMIN_EMAIL;

  if (emailArg && !EMAIL_RE.test(emailArg)) {
    throw new Error(`"${emailArg}" does not look like an email address.`);
  }

  const db = await getDb();
  const existing = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  let password: string | null = null;
  let previousEmail: string | null = null;

  if (!existing) {
    if (!emailArg) {
      throw new Error(
        "Creating an operator needs an address for the sign-in codes.\n" +
          "  Pass --email=you@example.com (or set ADMIN_EMAIL).",
      );
    }
    password = generatePassword();
    const user: UserRecord = {
      id: newId(),
      username,
      email: emailArg,
      role: "owner",
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      passwordChangedAt: new Date().toISOString(),
    };
    await withDb((d) => {
      d.users.push(user);
    });
  } else {
    // Changing where the codes go is independent of rotating the password:
    // one is a delivery detail, the other invalidates every session.
    if (emailArg && emailArg !== existing.email) {
      previousEmail = existing.email;
      await withDb((d) => {
        const u = d.users.find((x) => x.id === existing.id);
        if (!u) return;
        u.email = emailArg;
        u.updatedAt = new Date().toISOString();
        // Any challenge in flight was sent to the old address — drop it.
        d.challenges = d.challenges.filter((c) => c.userId !== u.id);
      });
      await audit("account.email_changed", {
        userId: existing.id,
        detail: `${previousEmail} -> ${emailArg}`,
      });
      // Best effort: tell the old address, in case this was not the owner.
      await sendSecurityNotice({
        to: previousEmail,
        subject: "Kompozith Console sign-in codes moved to another address",
        message:
          `Sign-in codes for "${username}" now go to ${emailArg}. ` +
          `This address will no longer receive them. If you did not expect ` +
          `this, your server has been accessed — rotate the password immediately.`,
      }).catch(() => undefined);
    }

    if (resetPassword) {
      password = generatePassword();
      const hash = await hashPassword(password);
      await withDb((d) => {
        const u = d.users.find((x) => x.id === existing.id);
        if (!u) return;
        u.passwordHash = hash;
        u.mustChangePassword = true;
        u.updatedAt = new Date().toISOString();
        u.passwordChangedAt = u.updatedAt;
        // A password reset invalidates every existing session.
        d.sessions = d.sessions.filter((s) => s.userId !== u.id);
      });
    }
  }

  let seeded = 0;
  if (db.projects.length === 0) {
    const projects = buildSeedProjects();
    seeded = projects.length;
    await withDb((d) => {
      d.projects.push(...projects);
    });
  }

  // Re-read: the record may have changed above.
  const current = (await getDb()).users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  const line = "─".repeat(58);
  console.log(`\n${line}`);
  console.log("  KOMPOZITH CONSOLE — setup");
  console.log(line);
  console.log(`  Console URL   :  /kz-console`);
  console.log(`  Username      :  ${username}`);
  console.log(`  Email (OTP)   :  ${current?.email ?? emailArg}`);
  if (previousEmail) {
    console.log(`                   (was ${previousEmail})`);
  }
  if (password) {
    console.log(`  Password      :  ${password}`);
    console.log(`\n  Shown once. Store it now, then change it after first login.`);
  } else {
    console.log(`  Password      :  unchanged (use --reset-password to rotate)`);
  }
  console.log(line);
  console.log(`  Mail transport:  ${activeTransport()}`);
  if (activeTransport() === "console") {
    console.log(
      `  No mail provider configured — sign-in codes are printed to the\n` +
        `  dev server log and appended to data/outbox.log.`,
    );
  }
  console.log(`  Projects      :  ${seeded ? `${seeded} seeded` : "already present"}`);
  console.log(`${line}\n`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
