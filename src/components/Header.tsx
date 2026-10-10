import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
import logoKompozith from "../assets/images/logo-kompozith.svg";

interface HeaderProps {
  onNavClick?: (section: string) => void;
}

export default function Header({ onNavClick }: HeaderProps) {
  const [activeTab, setActiveTab] = useState("Home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", id: "hero-top" },
    { name: "Services", id: "services-section" },
    { name: "Our process", id: "process-section" },
    { name: "Case Studies", id: "case-studies" },
  ];

  const isManualScroll = useRef(false);
  const scrollUnlockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mathematical precise, mounting-safe scroll-based tab activation
  useEffect(() => {
    const handleScroll = () => {
      // Ignore scroll tracking during manual smooth scrolling triggered by tab clicks
      if (isManualScroll.current) return;

      const scrollPos = window.scrollY;

      // 1. Absolute top edge case: Force "Home"
      if (scrollPos < 120) {
        setActiveTab("Home");
        return;
      }

      // 2. Absolute bottom edge case: Force "Case Studies"
      const isAtBottom = window.innerHeight + scrollPos >= document.documentElement.scrollHeight - 80;
      if (isAtBottom) {
        setActiveTab("Case Studies");
        return;
      }

      // 3. Middle-viewport math calculation to highlight active section
      const middleOfViewport = scrollPos + window.innerHeight * 0.4;
      let activeSectionName = "Home";

      for (const item of navItems) {
        if (item.id === "contact") continue;
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrollPos;
          
          if (middleOfViewport >= elementTop - 50) {
            activeSectionName = item.name;
          }
        }
      }

      setActiveTab(activeSectionName);
    };

    // Run once on load/mount to coordinate current scroll position
    const initTimer = setTimeout(handleScroll, 120);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("scroll", handleScroll);
      if (scrollUnlockTimeout.current) clearTimeout(scrollUnlockTimeout.current);
    };
  }, []);

  const handleTabClick = (name: string, id: string) => {
    setActiveTab(name);

    // Set scroll lock flag during smooth-scrolling to prevent "activeTab jiggling"
    isManualScroll.current = true;
    if (scrollUnlockTimeout.current) clearTimeout(scrollUnlockTimeout.current);
    scrollUnlockTimeout.current = setTimeout(() => {
      isManualScroll.current = false;
    }, 850); // Lock stays active for typical smooth-scroll duration

    if (onNavClick) {
      onNavClick(id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleMobileTabClick = (name: string, id: string) => {
    setMobileMenuOpen(false);
    // Smooth delay before scroll actions
    setTimeout(() => {
      handleTabClick(name, id);
    }, 320);
  };

  return (
    <>
      {/* Liquid-glass filter: wavy displacement map, with R/G/B channels
          displaced at slightly different scales to fake light dispersion
          (chromatic aberration), then recombined. Referenced by
          .progressive-blur::before via backdrop-filter: url(). */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="glass-aberration" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.014" numOctaves="1" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="map" />

          <feDisplacementMap in="SourceGraphic" in2="map" scale="34" xChannelSelector="R" yChannelSelector="G" result="dispR" />
          <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />

          <feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G" result="dispG" />
          <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />

          <feDisplacementMap in="SourceGraphic" in2="map" scale="18" xChannelSelector="R" yChannelSelector="G" result="dispB" />
          <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />

          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" />
        </filter>
      </svg>

      <header
        id="main-app-header"
        className={`fixed top-0 left-0 w-full z-50 px-4 md:px-12 lg:[padding-left:150px] lg:[padding-right:150px] flex items-center justify-between h-[75px] md:h-[80px]`}
      >
        {/* Progressive blur backdrop: blur strength ramps down layer by layer */}
        <div className="progressive-blur" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
        </div>

        {/* Brand Logo Group */}
        <div className="flex items-center" id="brand-logo-container">
          <img
            src={logoKompozith}
            alt="Kompozith Studio"
            className="h-[46px] w-auto"
          />
        </div>

        {/* Responsive Capsule Navigation bar */}
        <div className="flex items-center gap-4" id="navigation-bar">
          {/* Floating Capsule pill list */}
          <nav className="hidden md:flex items-center p-1.5 bg-[#1F2B48] rounded-full shadow-[0_4px_16px_rgba(26,37,64,0.15)] backdrop-blur-md">
            <ul className="flex items-center gap-1 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = activeTab === item.name;
                return (
                  <li key={item.name} className="relative">
                    <button
                      onClick={() => handleTabClick(item.name, item.id)}
                      className={`px-4.5 py-2 rounded-full cursor-pointer transition-colors duration-200 relative z-10 ${isActive
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                        }`}
                    >
                      {item.name}
                    </button>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        className="absolute inset-0 bg-[#354875] rounded-full z-0 shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                  </li>
                );
              })}

              {/* In-Navbar "Get in Touch" Orange Pill */}
              <li>
                <button
                  onClick={() => handleTabClick("Contact", "contact")}
                  className="ml-1 px-4.5 py-2 rounded-full cursor-pointer bg-[#FF6230] text-white hover:bg-[#ff7548] active:scale-95 transition-all duration-200 shadow-sm font-semibold text-xs md:text-sm"
                >
                  Get in Touch
                </button>
              </li>
            </ul>
          </nav>

          {/* Mobile Navigation fallback / trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden bg-[#111827] text-white rounded-full py-1.5 pl-4.5 pr-1.5 flex items-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer border border-[#111827] hover:border-white/10"
            id="mobile-menu-trigger-button"
          >
            <span className="font-sans font-bold text-[13px] tracking-wide text-white select-none">
              Menu
            </span>
            <div className="w-7 h-7 rounded-full border border-dashed border-white/30 flex items-center justify-center shrink-0">
              <Menu className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      </header>

      {/* Styled fullscreen overlay for mobile navigation menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark glass backdrop with high blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#0C1222]/90 backdrop-blur-lg z-999 cursor-pointer"
            />

            {/* Floating Navigation menu board */}
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="fixed inset-x-4 top-4 max-w-lg mx-auto bg-[#121A2E] border border-white/10 rounded-[32px] p-6 shadow-2xl z-1000 flex flex-col space-y-8 text-left"
              id="mobile-navigation-overlay"
            >
              {/* Header row inside popup */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <img
                  src={logoKompozith}
                  alt="Kompozith Studio"
                  className="h-[32px] w-auto"
                />

                {/* Styled close button mirroring input trigger */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[#1C2642] text-white rounded-full py-1.5 pl-4.5 pr-1.5 flex items-center gap-2.5 transition-all border border-white/5 active:scale-95 cursor-pointer shadow-sm"
                >
                  <span className="font-sans font-bold text-[12px] tracking-wide text-white select-none">
                    Close
                  </span>
                  <div className="w-6 h-6 rounded-full border border-dashed border-white/40 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>

              {/* Navigation links stack list */}
              <nav className="flex flex-col space-y-4 pt-2">
                <ul className="space-y-3.5">
                  {navItems.map((item, index) => {
                    const isContact = item.id === "contact";
                    return (
                      <motion.li
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06 }}
                        key={item.name}
                      >
                        <button
                          onClick={() => handleMobileTabClick(item.name, item.id)}
                          className={`w-full text-left py-2 px-4 rounded-2xl flex items-center justify-between transition-all group ${isContact
                            ? "bg-[#FF6230] text-white hover:bg-[#ff7548]"
                            : "text-slate-200 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <span className="font-sans font-bold text-base tracking-wide">
                            {item.name}
                          </span>
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer details row for premium feel */}
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-400 font-sans font-bold text-[9px] uppercase tracking-wider">
                    Available Now
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF6230]" />
                  <span>Secure TLS Gateway</span>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
