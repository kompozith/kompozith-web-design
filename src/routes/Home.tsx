import { useState, useEffect } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

import ContactDrawer from "../components/ContactDrawer";
import Header from "../components/Header";
import LinesBackground from "../components/LinesBackground";
import MagneticButton from "../components/MagneticButton";
import ScrollingImagesGrid from "../components/ScrollingImagesGrid";
import ServicesSection from "../components/ServicesSection";
import ProcessSection from "../components/ProcessSection";
import OutcomesSection from "../components/OutcomesSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FaqSection from "../components/FaqSection";
import FooterNew from "../components/FooterNew";

gsap.registerPlugin(ScrollTrigger);

const sectionVariants = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 2, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  useSmoothScroll();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleOpenDrawer = () => {
      setDrawerOpen(true);
    };
    window.addEventListener("openContactForm", handleOpenDrawer);
    return () => {
      window.removeEventListener("openContactForm", handleOpenDrawer);
    };
  }, []);

  // Dark-theme window: dark once the process section is 40% into the viewport,
  // light again as soon as the reviews section enters. A single class toggle —
  // CSS variables + transitions do the animating, nothing runs per scroll frame.
  useEffect(() => {
    const setDark = (on: boolean) =>
      document.documentElement.classList.toggle("theme-dark", on);

    const enterDark = ScrollTrigger.create({
      trigger: "#process-section",
      start: "top 60%",
      onEnter: () => setDark(true),
      onLeaveBack: () => setDark(false),
    });

    const exitDark = ScrollTrigger.create({
      trigger: "#testimonials",
      start: "top bottom",
      onEnter: () => setDark(false),
      onLeaveBack: () => setDark(true),
    });

    return () => {
      enterDark.kill();
      exitDark.kill();
      setDark(false);
    };
  }, []);


  return (
    <div id="hero-top" className="relative min-h-screen w-full bg-[var(--theme-bg)] text-slate-800 font-sans overflow-x-hidden">
      
      {/* SVG-based Guideline & Crosshair Backdrop */}
      <LinesBackground />

      {/* Decorative Blur Orbs for elegant depth background matching */}
      <div className="absolute top-24 left-[15%] w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute top-96 right-[10%] w-96 h-96 rounded-full bg-orange-400/5 blur-3xl pointer-events-none z-0" />

      {/* Header Navigation Module */}
      <Header onNavClick={(id) => {
        if (id === "contact") {
          setDrawerOpen(true);
        } else {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }} />

      {/* Main Container Hero Wrapper */}
      <main className="relative z-10 w-full px-4 sm:px-8 md:px-12 lg:px-20 pt-[110px] md:pt-[120px] pb-12 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center md:min-h-[750px] max-w-7xl mx-auto">
          
          {/* Left Column Content Area */}
          <div className="md:col-span-6 flex flex-col items-start text-left space-y-7 z-20">
            
            {/* Soft Green Available Pill Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/60 shadow-3xs"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 font-sans font-semibold text-xs tracking-wide">
                Available for projects
              </span>
            </motion.div>

            {/* Main Display Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-[#1A2540] font-sans font-black text-3xl sm:text-5xl lg:text-6.5xl tracking-tight leading-[1.05] max-w-xl"
            >
              We are the <span className="font-serif italic font-semibold text-[#FF6230] hover:text-[#ff794d] transition-colors duration-300">only</span> digital partner <span className="text-slate-400 font-black">you need.</span>
            </motion.h1>

            {/* Display Subheading details */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-slate-600 font-sans text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-md"
            >
              We help Tech Startups and Small Business B2B to standout in their market. High-performance design meets premium Web engineering.
            </motion.p>

            {/* Magnetic CTA button wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 100 }}
              className="pt-2"
            >
              <MagneticButton onClick={() => setDrawerOpen(true)}>
                Get in Touch
              </MagneticButton>
            </motion.div>

            {/* Overlapping circle avatars social proof group */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="pt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 w-full max-w-md"
              id="social-proof-panel"
            >
              <div className="flex -space-x-3.5">
                <img
                  className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                  alt="Creative director avatar"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
                  alt="Technical lead avatar"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
                  alt="Product engineer avatar"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
                  alt="Marketing head avatar"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-slate-800 font-sans font-semibold text-xs sm:text-sm tracking-tight leading-none">
                  Trusted by <span className="text-[#FF6230]">+50</span> Customers
                </span>
                <span className="text-slate-400 font-inter text-[10px] sm:text-xs mt-0.5 font-medium leading-none">
                  They've hit their target - You're next
                </span>
              </div>
            </motion.div>

          </div>

          {/* Right Column Scrolling Grid Module — pulled up to the very top of the page so the
              images flow behind the glass navbar, stretched so it always ends flush with the hero bottom */}
          <div className="md:col-span-6 z-10 w-full md:-mt-[120px] md:self-stretch md:relative">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
              className="md:absolute md:inset-0"
            >
              <ScrollingImagesGrid />
            </motion.div>
          </div>

        </div>

        {/* Glassy distorted edge covering the entire bottom of the hero, full-bleed */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-[120px] pointer-events-none z-30">
          <div className="progressive-blur-bottom" aria-hidden="true">
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
      </main>

      {/* Services and Accordions Viewport Section (Transition line at 780px mapped by SVG) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <ServicesSection />
      </motion.div>

      {/* Modern interactive process section */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <ProcessSection />
      </motion.div>

      {/* Styled outcomes case studies section with interactive modal */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <OutcomesSection />
      </motion.div>

      {/* Testimonials success stories segment */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <TestimonialsSection />
      </motion.div>

      {/* Interactive design subscription FAQs segment */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <FaqSection />
      </motion.div>

      {/* Footer Branding Showcase */}
      <FooterNew />

      {/* Sliding Slideover Contact Drawer Component */}
      <ContactDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

    </div>
  );
}
