import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Segment = {
  text: string;
  className?: string;
  breakBefore?: boolean;
};

interface RevealTitleProps {
  /** Plain string, or segments for multi-styled / multi-line titles */
  segments: string | Segment[];
  className?: string;
}

/**
 * Scroll-scrubbed per-letter reveal: each letter fades in and rises with a
 * touch of skew/blur distortion and an RGB-fringe (chromatic aberration)
 * that resolves as it settles. Driven by scroll progress, so scrolling
 * back down plays the animation in reverse.
 */
export default function RevealTitle({ segments, className }: RevealTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const parts: Segment[] =
    typeof segments === "string" ? [{ text: segments }] : segments;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const letters = el.querySelectorAll<HTMLElement>("[data-reveal-letter]");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        letters,
        {
          opacity: 0,
          yPercent: 55,
          skewX: -12,
          scaleY: 1.25,
          filter: "blur(6px)",
          textShadow:
            "-0.08em 0 rgba(255,60,0,0.55), 0.08em 0 rgba(0,150,255,0.55)",
        },
        {
          opacity: 1,
          yPercent: 0,
          skewX: 0,
          scaleY: 1,
          filter: "blur(0px)",
          textShadow: "0em 0 rgba(255,60,0,0), 0em 0 rgba(0,150,255,0)",
          transformOrigin: "50% 100%",
          stagger: 0.06,
          ease: "power1.out",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 55%",
            scrub: 0.5,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <h2
      ref={ref}
      className={className}
      aria-label={parts.map((p) => p.text).join(" ")}
    >
      {parts.map((part, pi) => (
        <span key={pi} className={part.className} aria-hidden="true">
          {part.breakBefore && <br />}
          {part.text.split(" ").map((word, wi, words) => (
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">
                {word.split("").map((ch, ci) => (
                  <span
                    key={ci}
                    data-reveal-letter
                    className="inline-block will-change-transform"
                  >
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 && " "}
            </Fragment>
          ))}
          {pi < parts.length - 1 && " "}
        </span>
      ))}
    </h2>
  );
}
