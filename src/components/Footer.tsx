import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

export default function Footer() {
  const [time, setTime] = useState("");
  const [timeZone, setTimeZone] = useState("GMT");
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API on first user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
    };
    window.addEventListener("click", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Timezone and Time logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Get Time in HH:MM format
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(timeStr);
      
      // Get Timezone abbreviation
      try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now);
        const tzPart = parts.find((p) => p.type === "timeZoneName");
        if (tzPart) {
          setTimeZone(tzPart.value);
        }
      } catch (e) {
        // Fallback for older browsers
        const offset = -now.getTimezoneOffset() / 60;
        setTimeZone(`GMT${offset >= 0 ? "+" : ""}${offset}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Synth Pluck function
  const playSound = (index: number) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") return;

      // Pentatonic scale MIDI notes (C major pentatonic from low to high)
      const pentatonic = [
        36, 38, 40, 43, 45, 
        48, 50, 52, 55, 57, 
        60, 62, 64, 67, 69, 
        72, 74, 76, 79, 81, 
        84, 86, 88, 91, 93, 
        96
      ];

      // Map line index to pentatonic note (reverse index so bottom is low, top is high)
      const noteIndex = Math.min(index, pentatonic.length - 1);
      const midiNote = pentatonic[pentatonic.length - 1 - noteIndex];
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "triangle"; // Nice warm woody sound similar to a physical harp string
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Lowpass filter to smooth out high harmonics
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100, ctx.currentTime);

      // Volume envelope (fast attack, exponential decay pluck)
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.75);
    } catch (error) {
      console.warn("Audio Context synth play block failed:", error);
    }
  };

  // Harp configuration
  const lineCount = 26;
  const startY = 15;
  const endY = 225;
  const step = (endY - startY) / (lineCount - 1);

  return (
    <footer className="w-full bg-[#08090C] text-white pt-20 pb-12 border-t border-white/5 overflow-hidden relative" id="footer-branding">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1116]/40 to-[#08090C] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 relative z-10">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-8 mb-16 gap-6">
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-slate-400 uppercase select-none">
            LET'S BUILD WORK THAT INSPIRES.
          </div>
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.15em] text-slate-400 uppercase flex items-center gap-1.5 select-none">
            <span>{timeZone}</span>
            <span className="text-slate-600">→</span>
            <span className="font-semibold text-white tabular-nums">{time}</span>
          </div>
        </div>

        {/* Middle Main Title & CTA Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-end mb-20">
          <div className="md:col-span-8 text-left">
            <h2 className="text-[#F1F3F5] font-sans font-black text-4xl sm:text-5xl lg:text-7.5xl tracking-tight leading-[1.05]">
              Ready to build<br />
              something bold?
            </h2>
          </div>
          <div className="md:col-span-4 flex md:justify-end text-left">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openContactForm"));
              }}
              className="group flex items-center gap-3 text-xs sm:text-sm font-mono tracking-[0.2em] font-bold uppercase text-white hover:text-[#FF6230] transition-colors duration-300 relative py-2 cursor-pointer"
            >
              <span>START A COLLABORATION</span>
              <span className="inline-block transform group-hover:translate-x-1.5 transition-transform duration-300">
                →
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white group-hover:bg-[#FF6230] origin-left scale-x-100 group-hover:scale-x-105 transition-all duration-300" />
            </button>
          </div>
        </div>

        {/* Third Row: Metadata and Contact Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 border-t border-white/5 pt-10 pb-16">
          {/* Left copyright and interaction indicator */}
          <div className="md:col-span-5 space-y-3.5 text-left">
            <div className="text-slate-300 font-sans text-xs tracking-widest font-semibold uppercase">
              ©KOMPOZITH® 2026
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6230] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6230]"></span>
              </span>
              <span>SOUND ON 🎵 HOVER THE LINES.</span>
            </div>
          </div>
          
          {/* Right Columns */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {/* Column 1: Business Enquiry */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase font-bold">
                BUSINESS ENQUIRY
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 font-sans font-medium">
                <li>
                  <a href="mailto:hello@kompozith.com" className="hover:text-[#FF6230] transition-colors duration-200">
                    <span className="text-slate-500 mr-1 font-mono">E.</span> hello@kompozith.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919824182099" className="hover:text-[#FF6230] transition-colors duration-200">
                    <span className="text-slate-500 mr-1 font-mono">P.</span> +91 98241 82099
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Column 2: Social Links */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase font-bold">
                SOCIAL
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 font-sans font-medium">
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6230] transition-colors duration-200 block">
                    Linkedin
                  </a>
                </li>
                <li>
                  <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6230] transition-colors duration-200 block">
                    Dribbble
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Column 3: Social Links Column 2 */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase font-bold sm:opacity-0 select-none">
                SOCIAL
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 font-sans font-medium">
                <li>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6230] transition-colors duration-200 block">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6230] transition-colors duration-200 block">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: KOMPOZITH SVG Lines Harp */}
        <div className="w-full relative mt-6 select-none overflow-visible" id="harp-container">
          <svg
            viewBox="0 0 1200 240"
            width="100%"
            height="100%"
            className="overflow-visible pointer-events-none"
          >
            <defs>
              <mask id="kompozith-text-mask">
                <rect width="100%" height="100%" fill="black" />
                <text
                  x="50%"
                  y="55%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontSize="155px"
                  fontWeight="900"
                  fill="white"
                  fontFamily="Inter, var(--font-sans), sans-serif"
                  letterSpacing="0.06em"
                >
                  KOMPOZITH
                </text>
              </mask>
            </defs>

            {/* Masked Group (Visible lines inside text bounds) */}
            <g mask="url(#kompozith-text-mask)">
              {Array.from({ length: lineCount }).map((_, i) => {
                const y = startY + i * step;
                const isHovered = hoveredLineIndex === i;
                return (
                  <line
                    key={i}
                    x1="0"
                    y1={y}
                    x2="1200"
                    y2={y}
                    stroke={isHovered ? "#FF6230" : "rgba(255, 255, 255, 0.16)"}
                    strokeWidth={isHovered ? 4.5 : 1.3}
                    className="transition-all duration-300 ease-out"
                    style={{
                      transitionProperty: "stroke, stroke-width",
                    }}
                  />
                );
              })}
            </g>

            {/* Full-width Invisible Hover Interception Areas inside the SVG coordinate space */}
            <g pointerEvents="all" className="pointer-events-auto">
              {Array.from({ length: lineCount }).map((_, i) => {
                const y = startY + i * step;
                return (
                  <rect
                    key={i}
                    x="0"
                    y={y - step / 2}
                    width="1200"
                    height={step}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredLineIndex(i);
                      playSound(i);
                    }}
                    onMouseLeave={() => {
                      setHoveredLineIndex(null);
                    }}
                  />
                );
              })}
            </g>
          </svg>
        </div>

      </div>
    </footer>
  );
}
