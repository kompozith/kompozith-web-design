import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

/**
 * Console primitives.
 *
 * The console runs on the dark end of the site palette with the same orange
 * accent, so it reads as part of Kompozith without being mistakable for a
 * public page. Colours are literal here rather than theme variables: the
 * console must not follow the scroll-driven theme switching of the site.
 */

export const INK = "#F1F5FA";
export const MUTED = "#97A3B9";
export const ACCENT = "#FF6230";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0E1729] px-3.5 py-2.5 font-sans text-sm text-[#F1F5FA] outline-none transition-colors placeholder:text-[#5B6980] focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230]/40 disabled:opacity-50";

export const labelClass =
  "block font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A97AC]";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && (
        <span className="block font-sans text-[11px] leading-relaxed text-[#6B7A93]">
          {hint}
        </span>
      )}
    </label>
  );
}

type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#FF6230] text-white hover:bg-[#ff7548] disabled:hover:bg-[#FF6230]",
  ghost:
    "border border-white/12 bg-transparent text-[#D9DFEA] hover:border-white/25 hover:text-white",
  subtle: "bg-white/6 text-[#D9DFEA] hover:bg-white/12",
  danger:
    "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  loading,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-[#111C30] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: "draft" | "published" }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] ${
        published
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {published ? "Live" : "Draft"}
    </span>
  );
}

export function Banner({
  kind,
  message,
  onDismiss,
}: {
  kind: "error" | "success";
  message: string;
  onDismiss?: () => void;
}) {
  const error = kind === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 font-sans text-sm ${
        error
          ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {error ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#17243D] px-5 py-2.5 font-sans text-sm text-[#F1F5FA] shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6230]">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-1.5 font-sans text-2xl font-black tracking-tight text-[#F1F5FA] md:text-3xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
