import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealTitle from "./RevealTitle";
import { api, type ProjectCard } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

export default function OutcomesSection() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // High performance smooth custom cursor tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 24, stiffness: 280, mass: 0.15 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const updateMousePos = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", updateMousePos);
    return () => {
      window.removeEventListener("mousemove", updateMousePos);
    };
  }, [cursorX, cursorY]);

  // Published projects come from the CMS, ordered by the console.
  useEffect(() => {
    let cancelled = false;
    api
      .listPublished()
      .then(({ projects: list }) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        // The rest of the page must still render if the API is unreachable.
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // GSAP horizontal scroll pinning & parallax. Re-runs once the project list
  // arrives, because the track width — and therefore the pin distance —
  // depends on how many cards there are.
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      // Calculate how far to scroll horizontally
      const getScrollAmount = () => {
        return -(track.scrollWidth - window.innerWidth);
      };

      const scrollTween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.abs(getScrollAmount())}`,
          pin: true,
          // Direct 1:1 scrub — Lenis already smooths the scroll, so any extra
          // smoothing here made the track lag past its pin point.
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Parallax effect on background images relative to scroll horizontal velocity
      const cards = gsap.utils.toArray<HTMLElement>(".project-card");
      cards.forEach((card) => {
        const wrap = card.querySelector(".parallax-wrap");
        if (!wrap) return;

        gsap.fromTo(
          wrap,
          { xPercent: -7 },
          {
            xPercent: 7,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          }
        );
      });
    });

    // The pin's start position is measured on mount, but fonts, images and the
    // hero geometry settle later and shift every offset below them — refresh
    // once everything has loaded so the pin engages exactly at "top top".
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    const imgs: HTMLImageElement[] = [];
    track.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (!img.complete) imgs.push(img);
    });
    imgs.forEach((img) => img.addEventListener("load", refresh, { once: true }));

    return () => {
      window.removeEventListener("load", refresh);
      imgs.forEach((img) => img.removeEventListener("load", refresh));
      ctx.revert();
    };
  }, [projects]);

  // Touch: let a horizontal swipe browse the cards, alongside the existing
  // scroll-driven motion.
  //
  // The swipe does not move the track itself — it moves the page scroll
  // position that the pin already reads. Both inputs therefore drive the one
  // source of truth, so they can never disagree, and the pin, parallax and
  // card animations keep working untouched.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let axis: "undecided" | "horizontal" | "vertical" = "undecided";
    let lastX = 0;
    let lastAt = 0;
    let velocity = 0;
    let swiped = false;
    let fling: gsap.core.Tween | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      fling?.kill();
      const touch = e.touches[0];
      startX = lastX = touch.clientX;
      startY = touch.clientY;
      startScroll = window.scrollY;
      lastAt = e.timeStamp;
      axis = "undecided";
      velocity = 0;
      swiped = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = startX - touch.clientX;
      const dy = startY - touch.clientY;

      // Wait for a clear intent before committing, so a slightly slanted
      // vertical scroll is not stolen.
      if (axis === "undecided") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      // Vertical gestures are left entirely alone — same behaviour as before.
      if (axis !== "horizontal") return;

      e.preventDefault();
      swiped = true;

      const elapsed = e.timeStamp - lastAt;
      if (elapsed > 0) velocity = (lastX - touch.clientX) / elapsed;
      lastX = touch.clientX;
      lastAt = e.timeStamp;

      // The pin advances the track one pixel per pixel of vertical scroll,
      // so swipe distance transfers one to one.
      window.scrollTo(0, startScroll + dx);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (axis !== "horizontal") return;
      // Ignore a stale reading from a finger that paused before lifting.
      if (e.timeStamp - lastAt > 100 || Math.abs(velocity) < 0.15) return;

      const proxy = { scroll: window.scrollY };
      fling = gsap.to(proxy, {
        scroll: proxy.scroll + velocity * 260,
        duration: 0.7,
        ease: "power2.out",
        onUpdate: () => window.scrollTo(0, proxy.scroll),
      });
    };

    // A swipe that starts on a card must not also open that project.
    const onClickCapture = (e: MouseEvent) => {
      if (!swiped) return;
      swiped = false;
      e.preventDefault();
      e.stopPropagation();
    };

    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });
    section.addEventListener("touchcancel", onTouchEnd, { passive: true });
    section.addEventListener("click", onClickCapture, true);

    return () => {
      fling?.kill();
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
      section.removeEventListener("touchcancel", onTouchEnd);
      section.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="case-studies"
      className="relative w-full bg-[var(--theme-bg)] overflow-hidden"
      // Vertical panning stays with the browser; horizontal is ours, which is
      // what lets the touchmove handler cancel it.
      style={{ touchAction: "pan-y" }}
    >
      {/* Horizontally scrolling track */}
      <div
        ref={trackRef}
        className="flex items-stretch will-change-transform"
        style={{ width: "fit-content" }}
      >
        {/* First panel: Section header (viewport-width) */}
        <div className="w-screen h-screen flex items-center shrink-0 px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 md:gap-8 items-start text-left">
            <div className="flex flex-col items-start">
              {/* Accent Badge */}
              <div className="bg-[var(--theme-ink)] text-[var(--theme-bg)] px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest mb-5 flex items-center gap-1.5 shadow-xs">
                Work
              </div>

              <RevealTitle
                segments="The outcomes we've got."
                className="text-[var(--theme-ink)] font-sans font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight"
              />
            </div>

            {/* Strategic description */}
            <div className="flex items-center">
              <p className="text-[var(--theme-muted)] font-sans text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-2xl">
                A look at some of the brands we've helped — and the outcomes we've delivered with precision engineering and high fidelity design.
              </p>
            </div>
          </div>
        </div>

        {/* Project cards row — each one opens its full case study */}
        {projects.map((study) => (
          <Link
            key={study.id}
            to={`/work/${study.slug}`}
            onMouseEnter={() => setHoveredCardId(study.id)}
            onMouseLeave={() => setHoveredCardId(null)}
            className="project-card group relative overflow-hidden cursor-none bg-slate-50 flex flex-col justify-end transition-all duration-500 shrink-0 w-screen h-screen"
          >
            {/* Main high fidelity device mockup image with parallax wrapper */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <div
                className="parallax-wrap absolute inset-y-0 w-[120%] h-full"
                style={{ left: "-10%" }}
              >
                <img
                  src={study.coverImage}
                  alt={study.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
                />
              </div>
            </div>

            {/* Gradient shadow overlay behind content so text is readable */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

            {/* White floating card layout matching reference exactly */}
            <div className="absolute bottom-12 left-4 sm:left-8 md:left-12 lg:left-20 w-[calc(100%-2rem)] sm:w-[480px] bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex items-center justify-between shadow-lg border border-white/40 transition-all duration-300 group-hover:shadow-xl group-hover:bg-white z-10">
              <div className="text-left">
                <span className="text-[#FF6230] font-sans text-xs font-bold uppercase tracking-wider mb-2 block">
                  {study.category}
                </span>
                <h3 className="text-[#1A2540] font-sans font-black text-xl sm:text-2xl tracking-tight leading-tight shadow-none mb-1">
                  {study.title}
                </h3>
                <p className="text-slate-500 font-sans text-xs sm:text-sm font-normal line-clamp-2">
                  {study.excerpt}
                </p>
              </div>

              {/* Box diagonal arrow container */}
              <div className="w-12 h-12 rounded-xl bg-[#111827] group-hover:bg-[#FF6230] text-white flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ml-6">
                <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Custom Hover Follow Cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-50 rounded-full bg-white/20 backdrop-blur-md border border-white/50 shadow-[0_16px_36px_rgba(0,0,0,0.15)] flex items-center justify-center w-14 h-14 -ml-7 -mt-7"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: hoveredCardId ? 1 : 0,
          opacity: hoveredCardId ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 26,
        }}
      >
        <div className="w-9 h-9 rounded-full bg-white/55 flex items-center justify-center shadow-xs border border-white/70">
          <ArrowUpRight className="w-4.5 h-4.5 text-[#1A2540] stroke-[3]" />
        </div>
      </motion.div>

    </section>
  );
}
