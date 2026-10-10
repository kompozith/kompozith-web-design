# Kompozith CMS

A self-contained content system for the case-study projects: an Express API,
a JSON content store, and a private admin console at `/kz-console`.

---

## Quick start

```bash
npm install
npm run cms:setup   # creates the first operator + seeds the four projects
npm run dev         # site + API on http://localhost:3000
```

`cms:setup` prints the generated password **once**. It is stored only as a
scrypt hash — there is no way to recover it, only to rotate it:

```bash
npm run cms:setup -- --reset-password
```

To move the sign-in codes to a different address, without touching the
password or signing anyone out:

```bash
npm run cms:setup -- --email=new@example.com
```

Any challenge already in flight is dropped (it was sent to the old address)
and the old address is notified of the change. Restart the server afterwards —
the store is cached in memory.

Other setup flags: `--username=…`.

---

## Layout

| Path | Purpose |
| --- | --- |
| `server/` | Express API — auth, projects, media |
| `server/types.ts` | Domain types, shared with the front end |
| `src/routes/CaseStudy.tsx` | Public `/work/:slug` page |
| `src/components/case-study/` | Block renderers |
| `src/admin/` | The console (lazy-loaded, separate bundle) |
| `data/` | Content store + uploads — **gitignored** |
| `scripts/security-check.ts` | Security suite (`npm run cms:test`) |

The API is mounted inside the Vite dev server (see `vite.config.ts`), so the
site and the API share one origin in development. That matters: the session
cookie is `SameSite=Strict` and a separate API port would never receive it.

**Editing anything under `server/` requires a dev-server restart** — the API
module is loaded once when Vite reads its config, so HMR does not reach it.

---

## Routes

| Route | Access |
| --- | --- |
| `/` | Public. Work carousel reads `GET /api/projects` |
| `/work/:slug` | Public. Published projects only |
| `/kz-console` | Private. Not linked from anywhere on the site |

### API

| Endpoint | Auth |
| --- | --- |
| `GET /api/projects` | public — published only |
| `GET /api/projects/:slug` | public — published only |
| `GET /api/auth/config` | public — reports whether a second factor is required |
| `POST /api/auth/login` | public — signs in, or opens a code challenge |
| `POST /api/auth/verify` | public — step 2; 404 when the second factor is off |
| `POST /api/auth/resend` | public — 404 when the second factor is off |
| `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/password` | session |
| `GET/POST/PUT/DELETE /api/admin/projects…` | session + CSRF |
| `GET/POST/DELETE /api/admin/media…` | session + CSRF |

---

## Sign-in

The second factor is a toggle, `AUTH_REQUIRE_OTP` in `.env.local`. The server
prints the active mode on startup:

```
[cms] auth: PASSWORD ONLY — second factor disabled (AUTH_REQUIRE_OTP=true to enable)
[cms] auth: password + emailed one-time code
```

**`AUTH_REQUIRE_OTP=false` (default) — one step.** Username + password returns
the session directly. A failure is a single generic 401 for both a wrong
password and a non-existent account. `/auth/verify` and `/auth/resend` return
404, so the code path cannot be used as an alternative way in.

**`AUTH_REQUIRE_OTP=true` — two steps.**

1. Username + password.
2. A six-digit code emailed to the address on the account.

The code is valid for 10 minutes, single use, with at most 5 attempts and 3
resends per challenge.

Everything else is identical in both modes: scrypt hashing, throttling and
lockouts, session hardening, CSRF. Password-only means a guessed or leaked
password is sufficient on its own — turn the second factor back on once mail
delivery is working.

### Mail delivery

Settings go in `.env.local` (gitignored; a commented template is already
there). The server prints the active transport on startup:

```
[cms] mail: NOT CONFIGURED — codes go to data/outbox.log, no email is sent
[cms] mail: SMTP smtp.gmail.com:587, from Kompozith Console <you@gmail.com>
```

The transport is chosen from whatever is configured, in this order:

| Transport | Configure with |
| --- | --- |
| Resend | `RESEND_API_KEY` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| Console (default) | nothing |

`MAIL_TRANSPORT=console\|smtp\|resend` forces one regardless of credentials —
the test suite pins it to `console` so a run can never mail a live inbox.

With no provider configured, codes are printed to the dev-server log and
appended to `data/outbox.log`. **No email leaves the machine.** That is fine
locally and must not be how production runs.

`MAIL_FROM` is the sender. It defaults to
`Kompozith Console <no-reply@kompozith.studio>`, which is a placeholder — set
it to something you control, because providers reject unverified senders:
Resend needs the domain verified in your account, and Gmail SMTP needs
`MAIL_FROM` to match `SMTP_USER` (with an App Password, not the account
password).

`.env` files are loaded by `server/env.ts`, imported first by every server
entry point. Vite does not populate `process.env` on its own, so that import
is what makes any of these variables reach the API. **Restart the dev server
after editing `.env.local`.**

---

## Content model

A project has card fields (title, category, excerpt, cover image), an
overview block (prose, objective, fact sheet, headline figures), and an
ordered list of sections.

Section types, all editable in the console:

| Type | Renders as |
| --- | --- |
| `feature` | Eyebrow, heading, body, bold-lead bullets, side image |
| `process` | Numbered step cards with tag chips, on a dark panel |
| `text` | Heading left, long-form prose right |
| `image` | Full-width or contained figure with caption |
| `gallery` | Two or three column image grid |
| `stats` | Three headline figures |
| `quote` | Pull quote with attribution |

Drafts are invisible to the public API — both in the list and by direct slug.

### Images

Uploads go to `data/uploads` and are served from `/uploads`. PNG, JPEG, GIF,
WebP and AVIF up to 8 MB. The client-supplied filename and MIME type are both
ignored: the extension comes from sniffing the bytes and the stored name is
random. SVG is rejected — served from our own origin it is a script vector.

Any `http(s)` URL or site-relative path also works in an image field.

---

## Security

| Concern | Measure |
| --- | --- |
| Password storage | scrypt, N=2^16 r=8 p=1, per-password salt, parameters stored with the hash |
| Second factor | Emailed 6-digit code, stored hashed, single use — **off unless `AUTH_REQUIRE_OTP=true`** |
| Account enumeration | The same scrypt round is always burned. In two-step mode step 1 always returns a challenge, with a masked address derived from the username so an unknown account looks real; in one-step mode both failures give one identical 401. Mail is dispatched without awaiting, so delivery latency is not a timing oracle |
| Session tokens | 256-bit, stored as sha256, `HttpOnly` + `SameSite=Strict`, `Secure` over HTTPS |
| Session lifetime | 60-minute sliding idle window, 12-hour absolute cap, max 5 concurrent |
| CSRF | Double-submit token bound to the session record, plus a same-origin check |
| Brute force | Per-IP and per-account throttling with escalating lockouts (1 → 5 → 15 → 60 min) |
| Input | Every project field is rebuilt server-side; unknown keys dropped, URLs restricted to `http(s)` and site-relative paths |
| Uploads | Magic-byte validation, randomised names, no SVG, 8 MB cap |
| Headers | `nosniff`, `X-Frame-Options: DENY`, `no-store` and `noindex` on admin responses, CSP + HSTS in production |
| Discoverability | Console excluded in `robots.txt`, `noindex` meta, no link from any public page |

Password changes and session revocation both invalidate every other session,
and a password change sends a notification email.

### Environment

| Variable | Effect |
| --- | --- |
| `AUTH_REQUIRE_OTP` | `true` to require the emailed code on top of the password |
| `MAIL_TRANSPORT` | Force `console`, `smtp` or `resend` regardless of credentials |
| `CMS_DATA_DIR` | Content store location (default `./data`) |
| `TRUST_PROXY` | Set `true` behind a reverse proxy so client IPs are read from `X-Forwarded-For` |
| `FORCE_SECURE_COOKIES` | Force the `Secure` flag when TLS terminates upstream |
| `PORT` | Production server port (default 8080) |

---

## Testing

```bash
npm run cms:test   # 66 checks: both auth modes, CSRF, sanitisation, uploads, throttling
npm run lint       # tsc --noEmit
```

The suite boots a throwaway API against a temporary data directory, so the
brute-force tests cannot lock anyone out of the real console.

---

## Deploying

```bash
npm run build
npm run start      # serves dist/ + /api + /uploads on one origin
```

Back up `data/cms.json` and `data/uploads/` — that is the entire content set.
