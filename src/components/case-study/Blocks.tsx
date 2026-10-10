import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Block } from "../../lib/api";

/* Shared type scale for the case-study surface. */
export const eyebrow =
  "text-[#FF6230] font-sans text-[11px] font-bold uppercase tracking-[0.2em]";
export const heading =
  "text-[var(--theme-ink)] font-sans font-black text-2xl sm:text-3xl md:text-[2.6rem] tracking-tight leading-[1.12]";
export const body =
  "text-[var(--theme-muted)] font-sans text-base md:text-lg font-normal leading-relaxed";

const rise = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Blank-line-separated prose, rendered as spaced paragraphs. */
export function Prose({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  if (!paragraphs.length) return null;
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className={body}>
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={`w-full px-4 sm:px-8 md:px-12 lg:px-20 py-14 md:py-20 ${className}`}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ feature */

function FeatureBlockView({ block }: { block: Extract<Block, { type: "feature" }> }) {
  const hasImage = Boolean(block.image) && block.layout !== "none";
  const stacked = block.layout === "image-below" || !hasImage;

  const copy = (
    <div className="flex flex-col gap-6">
      {block.label && <span className={eyebrow}>{block.label}</span>}
      {block.title && <h2 className={heading}>{block.title}</h2>}
      {block.body && <Prose text={block.body} />}

      {block.bullets.length > 0 && (
        <ul className="mt-2 space-y-3">
          {block.bullets.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-3.5 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-card)] px-4 py-3.5"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6230]/10">
                <Check className="h-3 w-3 stroke-[3] text-[#FF6230]" />
              </span>
              <p className="text-sm md:text-[15px] leading-relaxed text-[var(--theme-strong)]">
                {bullet.lead && (
                  <span className="font-semibold text-[var(--theme-ink)]">
                    {bullet.lead}
                    {bullet.text ? ": " : ""}
                  </span>
                )}
                {bullet.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const picture = hasImage ? (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--theme-line)] bg-[var(--theme-chip)]">
      <img
        src={block.image}
        alt={block.imageAlt || block.title}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  ) : null;

  if (stacked) {
    return (
      <Section>
        <div className="max-w-3xl">{copy}</div>
        {picture && <div className="mt-10 md:mt-14">{picture}</div>}
      </Section>
    );
  }

  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
        <div
          className={`md:col-span-6 ${
            block.layout === "image-left" ? "md:order-2" : ""
          }`}
        >
          {copy}
        </div>
        <div
          className={`md:col-span-6 ${
            block.layout === "image-left" ? "md:order-1" : ""
          }`}
        >
          {picture}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ process */

function ProcessBlockView({ block }: { block: Extract<Block, { type: "process" }> }) {
  return (
    <Section>
      {/* Dark panel, echoing the scroll-driven dark window on the home page. */}
      <div className="rounded-[36px] bg-[#0B1322] px-6 py-12 sm:px-10 md:px-14 md:py-16">
        <div className="max-w-3xl">
          {block.label && (
            <span className="text-[#FF6230] font-sans text-[11px] font-bold uppercase tracking-[0.2em]">
              {block.label}
            </span>
          )}
          {block.title && (
            <h2 className="mt-5 font-sans text-2xl font-black leading-[1.12] tracking-tight text-[#F1F5FA] sm:text-3xl md:text-[2.4rem]">
              {block.title}
            </h2>
          )}
          {block.body && (
            <p className="mt-5 font-sans text-base leading-relaxed text-[#97A3B9] md:text-lg">
              {block.body}
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {block.steps.map((step, i) => (
            <div
              key={i}
              className="group flex flex-col rounded-3xl border border-white/8 bg-[#111C30] p-6 transition-colors duration-300 hover:border-[#FF6230]/40"
            >
              <span className="font-mono text-xs font-medium text-[#FF6230]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-sans text-lg font-bold tracking-tight text-[#F1F5FA]">
                {step.title}
              </h3>
              <p className="mt-3 flex-grow font-sans text-sm leading-relaxed text-[#97A3B9]">
                {step.body}
              </p>
              {step.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {step.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/8 bg-[#17243D] px-2.5 py-1 font-sans text-[10px] font-medium tracking-wide text-[#D9DFEA]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------------- rest */

function TextBlockView({ block }: { block: Extract<Block, { type: "text" }> }) {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-5">
          {block.label && <span className={eyebrow}>{block.label}</span>}
          {block.title && <h2 className={`${heading} mt-5`}>{block.title}</h2>}
        </div>
        <div className="md:col-span-7">
          <Prose text={block.body} />
        </div>
      </div>
    </Section>
  );
}

function ImageBlockView({ block }: { block: Extract<Block, { type: "image" }> }) {
  if (!block.url) return null;
  return (
    <Section>
      <figure className={block.width === "contained" ? "mx-auto max-w-4xl" : ""}>
        <div className="overflow-hidden rounded-[28px] border border-[var(--theme-line)] bg-[var(--theme-chip)]">
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-4 text-center font-sans text-xs text-[var(--theme-muted)]">
            {block.caption}
          </figcaption>
        )}
      </figure>
    </Section>
  );
}

function GalleryBlockView({ block }: { block: Extract<Block, { type: "gallery" }> }) {
  if (!block.images.length) return null;
  return (
    <Section>
      <div
        className={`grid grid-cols-1 gap-5 ${
          block.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {block.images.map((image, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[24px] border border-[var(--theme-line)] bg-[var(--theme-chip)]"
          >
            <img
              src={image.url}
              alt={image.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

function StatsBlockView({ block }: { block: Extract<Block, { type: "stats" }> }) {
  return (
    <Section>
      <div className="max-w-3xl">
        {block.label && <span className={eyebrow}>{block.label}</span>}
        {block.title && <h2 className={`${heading} mt-5`}>{block.title}</h2>}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {block.items.map((item, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--theme-line)] bg-[var(--theme-card)] p-7 text-center"
          >
            <span className="block font-sans text-3xl font-black tracking-tight text-[#FF6230] md:text-4xl">
              {item.value}
            </span>
            <span className="mt-2 block font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--theme-muted)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function QuoteBlockView({ block }: { block: Extract<Block, { type: "quote" }> }) {
  if (!block.quote) return null;
  return (
    <Section>
      <figure className="mx-auto max-w-3xl text-center">
        <blockquote className="font-serif text-2xl italic leading-snug text-[var(--theme-ink)] sm:text-3xl md:text-[2.1rem]">
          “{block.quote}”
        </blockquote>
        {(block.author || block.role) && (
          <figcaption className="mt-7 flex items-center justify-center gap-3">
            {block.avatar && (
              <img
                src={block.avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <span className="font-sans text-sm">
              <span className="font-semibold text-[var(--theme-ink)]">
                {block.author}
              </span>
              {block.role && (
                <span className="text-[var(--theme-muted)]"> · {block.role}</span>
              )}
            </span>
          </figcaption>
        )}
      </figure>
    </Section>
  );
}

export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "feature":
      return <FeatureBlockView block={block} />;
    case "process":
      return <ProcessBlockView block={block} />;
    case "text":
      return <TextBlockView block={block} />;
    case "image":
      return <ImageBlockView block={block} />;
    case "gallery":
      return <GalleryBlockView block={block} />;
    case "stats":
      return <StatsBlockView block={block} />;
    case "quote":
      return <QuoteBlockView block={block} />;
    default:
      return null;
  }
}
