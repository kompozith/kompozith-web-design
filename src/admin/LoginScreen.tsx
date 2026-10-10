import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, KeyRound, Lock, Mail, User } from "lucide-react";
import { api, type AdminUserView } from "../lib/api";
import { Banner, Button, Field, inputClass } from "./ui";

type Stage =
  | { name: "credentials" }
  | { name: "code"; challengeToken: string; sentTo: string; expiresAt: number };

export default function LoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: AdminUserView) => void;
}) {
  const [stage, setStage] = useState<Stage>({ name: "credentials" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .authConfig()
      .then(({ mfaRequired: required }) => setMfaRequired(required))
      .catch(() => setMfaRequired(null));
  }, []);

  useEffect(() => {
    if (stage.name === "code") codeRef.current?.focus();
  }, [stage.name]);

  // Countdown to challenge expiry, so a stale code screen is obvious.
  useEffect(() => {
    if (stage.name !== "code") return;
    const tick = () =>
      setRemaining(Math.max(0, Math.round((stage.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stage]);

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await api.login(username.trim(), password);
      if (res.status === "signed-in") {
        // Second factor disabled server-side: the session already exists.
        onAuthenticated(res.user);
        return;
      }
      setStage({
        name: "code",
        challengeToken: res.challengeToken,
        sentTo: res.sentTo,
        expiresAt: Date.now() + res.expiresInSec * 1000,
      });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stage.name !== "code") return;
    setError(null);
    setBusy(true);
    try {
      const { user } = await api.verifyCode(stage.challengeToken, code);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setCode("");
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (stage.name !== "code") return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.resendCode(stage.challengeToken);
      setStage({ ...stage, expiresAt: Date.now() + res.expiresInSec * 1000 });
      setNotice("A new code is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStage({ name: "credentials" });
    setPassword("");
    setCode("");
    setError(null);
    setNotice(null);
  };

  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080E1A] px-5 py-12">
      {/* Ambient depth, matching the site's decorative orbs. */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-[#FF6230]/8 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#111C30]">
            <Lock className="h-5 w-5 text-[#FF6230]" />
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-[#F1F5FA]">
            Kompozith Console
          </h1>
          <p className="mt-2 font-sans text-sm text-[#8A97AC]">
            Restricted area. Authorised operators only.
          </p>
        </div>

        {/* Enter-only transitions: an exit animation would have to finish
            before the next step mounts, which never happens if the tab is
            backgrounded mid-sign-in and rAF stops firing. */}
        <div className="rounded-3xl border border-white/8 bg-[#111C30] p-7 shadow-2xl">
          {stage.name === "credentials" ? (
              <motion.form
                key="credentials"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={submitCredentials}
                className="space-y-5"
              >
                <Field label="Username">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6980]" />
                    <input
                      autoFocus
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="operator"
                    />
                  </div>
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6980]" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="••••••••••••"
                    />
                  </div>
                </Field>

                {error && <Banner kind="error" message={error} />}

                <Button
                  type="submit"
                  loading={busy}
                  disabled={!username.trim() || !password}
                  className="w-full"
                >
                  {mfaRequired === false ? "Sign in" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {mfaRequired && (
                  <p className="text-center font-sans text-[11px] leading-relaxed text-[#5B6980]">
                    A one-time code will be emailed to the address on file.
                  </p>
                )}
              </motion.form>
            ) : (
              <motion.form
                key="code"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={submitCode}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-[#0E1729] px-3.5 py-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6230]" />
                  <p className="font-sans text-[13px] leading-relaxed text-[#97A3B9]">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-[#F1F5FA]">
                      {stage.sentTo}
                    </span>
                    .
                  </p>
                </div>

                <Field
                  label="One-time code"
                  hint={
                    remaining > 0
                      ? `Expires in ${mmss}`
                      : "This code has expired — request a new one."
                  }
                >
                  <input
                    ref={codeRef}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`}
                    placeholder="000000"
                  />
                </Field>

                {error && <Banner kind="error" message={error} />}
                {notice && !error && <Banner kind="success" message={notice} />}

                <Button
                  type="submit"
                  loading={busy}
                  disabled={code.length !== 6}
                  className="w-full"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex items-center gap-1.5 font-sans text-xs text-[#8A97AC] transition-colors hover:text-[#F1F5FA]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Start over
                  </button>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={busy}
                    className="font-sans text-xs text-[#FF6230] transition-opacity hover:opacity-80 disabled:opacity-40"
                  >
                    Resend code
                  </button>
                </div>
              </motion.form>
            )}
        </div>
      </motion.div>
    </div>
  );
}
