import { useCallback, useEffect, useState } from "react";
import { Monitor, ShieldAlert, ShieldCheck } from "lucide-react";
import { api, type AdminUserView } from "../lib/api";
import { Banner, Button, Card, Field, SectionTitle, inputClass, labelClass } from "./ui";

interface SessionView {
  current: boolean;
  createdAt: string;
  lastSeenAt: string;
  ip: string;
  userAgent: string;
}

/** Mirrors the server-side policy in security.ts so the UI can preview it. */
function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("12+ characters");
  if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("a digit");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("a symbol");
  return issues;
}

export default function AccountPanel({
  user,
  mfaRequired,
  onUserChange,
  notify,
}: {
  user: AdminUserView;
  mfaRequired: boolean;
  onUserChange: (user: AdminUserView) => void;
  notify: (message: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<SessionView[]>([]);

  const loadSessions = useCallback(async () => {
    const { sessions: list } = await api.sessions().catch(() => ({
      sessions: [] as SessionView[],
    }));
    setSessions(list);
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const issues = next ? passwordIssues(next) : [];
  const mismatch = Boolean(confirm) && next !== confirm;
  const canSubmit =
    Boolean(current) && Boolean(next) && !issues.length && !mismatch;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      onUserChange({ ...user, mustChangePassword: false });
      notify("Password updated — other sessions signed out");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  const revokeOthers = async () => {
    await api.revokeOtherSessions().catch(() => undefined);
    notify("Other sessions signed out");
    await loadSessions();
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Account" title="Security" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className={labelClass}>Identity</h2>
          <dl className="space-y-3">
            {[
              ["Username", user.username],
              [mfaRequired ? "Email for one-time codes" : "Email", user.email],
              ["Role", user.role],
              [
                "Last sign-in",
                user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "—",
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="font-sans text-[13px] text-[#8A97AC]">{label}</dt>
                <dd className="text-right font-sans text-[13px] font-medium text-[#F1F5FA]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {mfaRequired ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3.5 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="font-sans text-[12px] leading-relaxed text-emerald-200">
                Two-factor sign-in is on. Every session requires the password
                and a fresh code sent to {user.email}.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="font-sans text-[12px] leading-relaxed text-amber-200">
                Two-factor sign-in is off — this console is protected by the
                password alone. Set{" "}
                <code className="font-mono">AUTH_REQUIRE_OTP=true</code> in
                <code className="font-mono"> .env.local</code> once mail
                delivery works, then restart the server.
              </p>
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className={labelClass}>Change password</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Current password">
              <input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="New password"
              hint={
                issues.length
                  ? `Still needs: ${issues.join(", ")}`
                  : next
                    ? "Meets the policy."
                    : "12+ characters with upper, lower, digit and symbol."
              }
            >
              <input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Confirm new password"
              hint={mismatch ? "Passwords do not match." : undefined}
            >
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && <Banner kind="error" message={error} />}

            <Button type="submit" loading={busy} disabled={!canSubmit}>
              Update password
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className={labelClass}>Active sessions</h2>
          {sessions.length > 1 && (
            <Button
              variant="ghost"
              className="!px-3 !py-1.5 !text-xs"
              onClick={revokeOthers}
            >
              Sign out other sessions
            </Button>
          )}
        </div>
        <ul className="divide-y divide-white/6">
          {sessions.map((session, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <Monitor className="h-4 w-4 shrink-0 text-[#5B6980]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[13px] text-[#D9DFEA]">
                  {session.userAgent || "Unknown client"}
                </p>
                <p className="font-mono text-[11px] text-[#5B6980]">
                  {session.ip || "unknown ip"} · active{" "}
                  {new Date(session.lastSeenAt).toLocaleString()}
                </p>
              </div>
              {session.current && (
                <span className="shrink-0 rounded-full bg-emerald-500/12 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  This device
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
