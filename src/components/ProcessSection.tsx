import { useState } from "react";
import { motion } from "motion/react";
import { PhoneCall, Users, PenTool, Rocket, ArrowRight } from "lucide-react";
import RevealTitle from "./RevealTitle";

import imgCall from "../assets/images/process_step_one_call_1779961815697.png";
import imgSaas from "../assets/images/saas_interface_mockup_1779960728149.png";
import imgStudio from "../assets/images/creative_studio_laptop_1779960794200.png";
import imgWebsite from "../assets/images/service_website_desktop_1779961535663.png";

const steps = [
  {
    num: "01",
    title: "Discovery Call",
    icon: PhoneCall,
    image: imgCall,
    quote: "We listen before we create.",
    description:
      "Auditing your brand, understanding your goals, and mapping out the right strategy to move forward.",
  },
  {
    num: "02",
    title: "User Research",
    icon: Users,
    image: imgSaas,
    quote: "Structure meets aesthetics.",
    description:
      "From wireframes to high-fidelity UI mockups — we craft an experience that looks great and feels intuitive.",
  },
  {
    num: "03",
    title: "Design & Build",
    icon: PenTool,
    image: imgStudio,
    quote: "We code exactly what we promised.",
    description:
      "Pixel-perfect development, CMS integration, performance optimization and responsive across all devices.",
  },
  {
    num: "04",
    title: "Launch & Grow",
    icon: Rocket,
    image: imgWebsite,
    quote: "Launch day is just the beginning.",
    description:
      "We deploy, onboard your team, and keep monitoring performance so your product keeps improving.",
  },
];

// Soft, springy ease shared by the card squeeze and content reveals
const humanEase = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function ProcessSection() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="process-section"
      className="relative w-full py-24 md:py-32 px-4 sm:px-8 md:px-12 lg:px-20 bg-transparent overflow-hidden"
    >
      {/* Faint blueprint grid fading out below the heading (hidden in dark theme) */}
      <div
        className="blueprint-grid absolute inset-x-0 top-0 h-[460px] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(203,213,225,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(203,213,225,0.28) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Top row: heading left, supporting copy + CTA right (styled like the Services header) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-14 text-left">
          <div className="flex flex-col items-start">
            {/* Accent Badge */}
            <div className="bg-[var(--theme-ink)] text-[var(--theme-bg)] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 flex items-center gap-1.5 shadow-sm">
              Our process
            </div>

            <RevealTitle
              segments={"We’ve perfected the process."}
              className="text-[var(--theme-ink)] font-sans font-bold text-4xl sm:text-5xl lg:text-5.5xl tracking-tight leading-none"
            />
          </div>

          <div className="flex flex-col items-start gap-7 md:pt-10">
            <p className="text-[var(--theme-muted)] font-sans text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-lg">
              Kompozith brings clarity, not complexity — one adaptive workflow
              that listens, designs, builds and keeps improving your product
              long after launch.
            </p>

            <button
              onClick={() => {
                const el = document.getElementById("case-studies");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group inline-flex items-center gap-2.5 bg-[var(--theme-ink)] hover:bg-[#FF6230] text-[var(--theme-bg)] hover:text-white rounded-full pl-7 pr-6 py-3.5 text-sm font-semibold tracking-tight ring-1 ring-inset ring-white/10 shadow-[0_1px_2px_rgba(26,37,64,0.4),0_16px_32px_-12px_rgba(26,37,64,0.45)] hover:shadow-[0_1px_2px_rgba(255,98,48,0.4),0_16px_32px_-10px_rgba(255,98,48,0.5)] active:scale-[0.97] cursor-pointer"
            >
              Explore More
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Accordion card row: hovered card grows, siblings squeeze */}
        <div
          className="flex flex-col md:flex-row gap-2.5 lg:gap-3"
          onMouseLeave={() => setActive(0)}
        >
          {steps.map((step, i) => {
            const isActive = i === active;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className="relative overflow-hidden rounded-[16px] bg-[var(--theme-card)] text-left cursor-pointer"
                style={{
                  flex: isActive ? "2.6 1 0%" : "1 1 0%",
                  transition: `flex 900ms ${humanEase}`,
                }}
              >
                <div className="relative md:h-[560px]">
                  {/* Collapsed face: ghost number on top, icon + short title pinned to the bottom (desktop only) */}
                  <div
                    className={`hidden md:flex absolute inset-0 flex-col justify-between p-8 transition-all duration-500 ${
                      isActive
                        ? "opacity-0 -translate-y-2 pointer-events-none"
                        : "opacity-100 translate-y-0 delay-200"
                    }`}
                    style={{ transitionTimingFunction: humanEase }}
                  >
                    <span className="font-sans font-black text-6xl lg:text-[76px] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--theme-ghost-1)] to-[var(--theme-ghost-2)]">
                      {step.num}.
                    </span>

                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--theme-chip)] ring-1 ring-inset ring-[var(--theme-line)] shadow-[0_1px_2px_rgba(15,23,42,0.05)] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#FF6230]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                          Step {step.num}
                        </span>
                        <h3 className="text-[var(--theme-ink)] font-sans font-semibold text-[15px] leading-snug tracking-tight max-w-[8.5rem]">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Expanded face: image, icon, big title and description
                      (always visible on mobile, revealed on hover on desktop) */}
                  <div
                    className={`flex flex-col p-6 md:p-8 md:absolute md:inset-0 md:min-w-[420px] transition-all duration-600 ${
                      isActive
                        ? "md:opacity-100 md:translate-y-0 md:delay-250"
                        : "md:opacity-0 md:translate-y-4 md:pointer-events-none"
                    }`}
                    style={{ transitionTimingFunction: humanEase }}
                  >
                    <div className="relative rounded-[10px] overflow-hidden h-44 md:h-56 ring-1 ring-inset ring-slate-900/10 shrink-0 mb-8">
                      <img
                        src={step.image}
                        alt={step.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out"
                        style={{ transform: isActive ? "scale(1)" : "scale(1.08)" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A2540]/15 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--theme-chip)] ring-1 ring-inset ring-[var(--theme-line)] shadow-[0_1px_2px_rgba(15,23,42,0.05)] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#FF6230]" strokeWidth={1.75} />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
                        {step.num} / 04
                      </span>
                    </div>

                    <h3 className="text-[var(--theme-ink)] font-sans font-black text-2xl md:text-[40px] tracking-tight leading-[1.05] max-w-sm">
                      {step.title}
                    </h3>

                    <div className="mt-6 md:mt-auto pt-6 border-t border-[var(--theme-line)] max-w-md">
                      <p className="font-sans font-semibold text-[var(--theme-strong)] text-[15px] md:text-base leading-snug">
                        &ldquo;{step.quote}&rdquo;
                      </p>
                      <p className="text-[var(--theme-muted)] font-sans text-sm leading-[1.75] font-normal mt-2.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
