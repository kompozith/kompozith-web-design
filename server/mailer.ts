/**
 * Outbound email for the login one-time codes.
 *
 * Three transports, picked in order of what is configured:
 *   1. Resend  — set RESEND_API_KEY (HTTP, no extra dependency)
 *   2. SMTP    — set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *   3. Console — the development fallback: the code is printed to the server
 *                log and appended to data/outbox.log so it stays reachable
 *                without any provider account.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const OUTBOX = path.join(
  process.env.CMS_DATA_DIR || path.resolve(process.cwd(), "data"),
  "outbox.log",
);

export type MailTransport = "resend" | "smtp" | "console";

/**
 * The envelope sender. Resend requires this domain to be verified in your
 * account; most SMTP providers require it to match the authenticated mailbox.
 */
const FROM =
  process.env.MAIL_FROM || "Kompozith Console <no-reply@kompozith.studio>";

export function activeTransport(): MailTransport {
  // Explicit override, so a test run can never send real mail just because
  // credentials happen to be present in .env.local.
  const forced = process.env.MAIL_TRANSPORT;
  if (forced === "console" || forced === "smtp" || forced === "resend") {
    return forced;
  }
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  return "console";
}

/** One-line startup banner so the active transport is never a guess. */
export function describeTransport(): string {
  const transport = activeTransport();
  if (transport === "resend") return `mail: Resend, from ${FROM}`;
  if (transport === "smtp") {
    return `mail: SMTP ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}, from ${FROM}`;
  }
  return "mail: NOT CONFIGURED — codes go to data/outbox.log, no email is sent";
}

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendViaResend(mail: Mail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

let smtpTransport: nodemailer.Transporter | null = null;

async function sendViaSmtp(mail: Mail): Promise<void> {
  if (!smtpTransport) {
    const port = Number(process.env.SMTP_PORT || 587);
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  await smtpTransport.sendMail({ from: FROM, ...mail });
}

async function sendViaConsole(mail: Mail): Promise<void> {
  const entry =
    `\n[${new Date().toISOString()}] to=${mail.to}\n` +
    `subject: ${mail.subject}\n${mail.text}\n${"-".repeat(60)}\n`;
  // eslint-disable-next-line no-console
  console.log(`\x1b[33m[mail:console]\x1b[0m ${mail.subject} -> ${mail.to}`);
  // eslint-disable-next-line no-console
  console.log(mail.text);
  await fs.mkdir(path.dirname(OUTBOX), { recursive: true });
  await fs.appendFile(OUTBOX, entry, "utf8");
}

async function send(mail: Mail): Promise<void> {
  switch (activeTransport()) {
    case "resend":
      return sendViaResend(mail);
    case "smtp":
      return sendViaSmtp(mail);
    default:
      return sendViaConsole(mail);
  }
}

function otpHtml(code: string, minutes: number, ip: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#FAFBFD;font-family:Inter,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:460px;background:#fff;border:1px solid #E6EAF2;border-radius:24px;padding:36px">
        <tr><td>
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#FF6230;font-weight:700">Kompozith Console</p>
          <h1 style="margin:0 0 14px;font-size:22px;color:#1A2540;font-weight:800">Your sign-in code</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#526078">
            Enter this code to finish signing in. It expires in ${minutes} minutes and can only be used once.
          </p>
          <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:.32em;color:#1A2540;background:#F4F6FB;border:1px solid #E6EAF2;border-radius:16px;padding:18px;text-align:center">
            ${code}
          </div>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8A97AC">
            Requested from ${ip || "an unknown address"}. If this was not you, change your console password immediately.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  minutes: number;
  ip: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: `${opts.code} is your Kompozith Console sign-in code`,
    text:
      `Your Kompozith Console sign-in code is ${opts.code}\n\n` +
      `It expires in ${opts.minutes} minutes and can only be used once.\n` +
      `Requested from ${opts.ip || "an unknown address"}.\n\n` +
      `If this was not you, change your console password immediately.`,
    html: otpHtml(opts.code, opts.minutes, opts.ip),
  });
}

export async function sendSecurityNotice(opts: {
  to: string;
  subject: string;
  message: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: opts.subject,
    text: opts.message,
    html: `<p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1A2540">${opts.message}</p>`,
  });
}
