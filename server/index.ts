/**
 * Production server: static build + CMS API from a single origin.
 * Run with `npm run start` after `npm run build`.
 */
import "./env.ts";
import path from "node:path";
import express from "express";
import { createApiApp } from "./app.ts";
import { UPLOAD_DIR } from "./db.ts";

const PORT = Number(process.env.PORT || 8080);
const DIST = path.resolve(process.cwd(), "dist");

const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.set("Content-Security-Policy", CSP);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  next();
});

// The console is a private surface: keep it out of every index.
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /kz-console\n");
});

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "365d",
    immutable: true,
    // Uploaded bytes are never executed as HTML or scripts.
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
  }),
);

app.use("/api", createApiApp());

app.use(express.static(DIST, { index: false, maxAge: "1h" }));

app.get("*", (req, res) => {
  if (req.path.startsWith("/kz-console")) {
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.set("Cache-Control", "no-store");
  }
  res.sendFile(path.join(DIST, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Kompozith running on http://localhost:${PORT}`);
});
