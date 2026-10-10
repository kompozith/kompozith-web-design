import React, { useState, useRef } from "react";
import {
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Linkedin,
  Globe,
  Check,
  Copy
} from "lucide-react";
import Newsletter from "./Newsletter";

// Custom SVG for X (formerly Twitter) icon for absolute fidelity
function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Custom SVG for Behance / Layout / Dribbble alternative to look exactly like the reference icon
function DesignIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 15h6" />
      <path d="M15 3v18" />
      <path d="M15 9h6" />
    </svg>
  );
}

// White at the top melting into a vibrant orange glow anchored to the bottom,
// with soft blurred falloff on the sides — matches the reference image
const SVGBackground = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 w-full h-full -z-10 select-none pointer-events-none"
    preserveAspectRatio="none"
    viewBox="0 0 1440 960"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="1440" height="960" fill="#FFFFFF" />
    {/* Core orange mass: rounded top, flares past the edges at the bottom */}
    <path
      d="M 720 400
         C 1150 400, 1400 470, 1480 580
         L 1480 1060 L -40 1060
         C -40 1060, -40 580, -40 580
         C 40 470, 290 400, 720 400 Z"
      fill="#f8ccb9ff"
      filter="url(#footer-organic-blur)"
    />
    {/* Deeper saturation at the very bottom so the base reads fully solid */}
    <rect x="-40" y="700" width="1620" height="360" fill="#ff8551ff" filter="url(#footer-soft-blur)" />
    <defs>
      <filter id="footer-organic-blur" x="-400" y="-400" width="2240" height="1800" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation="120" />
      </filter>
      <filter id="footer-soft-blur" x="-400" y="-400" width="2240" height="1800" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation="60" />
      </filter>
    </defs>
  </svg>
);

// Giant bottom wordmark: always 100vw wide (height keeps the natural proportion),
// Inter Bold with -5% tracking. A single <text> runs through one live filter —
// the displacement map itself follows the cursor, so the glyphs are genuinely
// warped, blurred and split into RGB fringes only where the pointer is.
const WM_W = 1600;
const WM_H = 250;
const HOT_PX = 200; // on-screen size of the reactive area

// Soft disc used as the lens. Its alpha gates how much distortion each pixel
// gets, which is what gives the effect its falloff instead of a hard edge.
const LENS_HREF = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<radialGradient id="g">` +
    `<stop offset="0" stop-color="#fff"/>` +
    `<stop offset="0.5" stop-color="#fff" stop-opacity="0.9"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `</svg>`
)}`;

function KompozithWordmark() {
  const svgRef = useRef<SVGSVGElement>(null);
  const lensRef = useRef<SVGFEImageElement>(null);
  const frame = useRef(0);

  const moveLens = (e: React.PointerEvent<SVGSVGElement>) => {
    const { clientX, clientY } = e;
    if (frame.current) return; // coalesce to one filter update per frame
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const svg = svgRef.current;
      const lens = lensRef.current;
      if (!svg || !lens) return;
      const rect = svg.getBoundingClientRect();
      const scale = WM_W / rect.width; // aspect ratio preserved, one scale fits both axes
      const size = HOT_PX * scale;
      lens.setAttribute("width", String(size));
      lens.setAttribute("height", String(size));
      lens.setAttribute("x", String((clientX - rect.left) * scale - size / 2));
      lens.setAttribute("y", String((clientY - rect.top) * scale - size / 2));
    });
  };

  // Collapsing the lens leaves a neutral map everywhere, so the word snaps back clean
  const clearLens = () => {
    const lens = lensRef.current;
    if (!lens) return;
    lens.setAttribute("width", "0");
    lens.setAttribute("height", "0");
  };

  return (
    <svg
      ref={svgRef}
      onPointerMove={moveLens}
      onPointerLeave={clearLens}
      viewBox={`0 0 ${WM_W} ${WM_H}`}
      className="block w-screen h-auto select-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kompozith"
      role="img"
    >
      <defs>
        {/* Navy body, easing off slightly toward the bottom like the reference */}
        <linearGradient id="wm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#ffffffbd" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="wm-lens" x="-8%" y="-60%" width="116%" height="220%" colorInterpolationFilters="sRGB">
          {/* The lens follows the pointer — this is the only thing that moves */}
          <feImage ref={lensRef} href={LENS_HREF} x="0" y="0" width="0" height="0" preserveAspectRatio="none" result="lens" />

          {/* Turbulence clipped to the lens, dropped onto a neutral (no-shift) map */}
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.022" numOctaves="2" seed="4" result="noise" />
          <feComposite in="noise" in2="lens" operator="in" result="lensNoise" />
          <feFlood floodColor="#808080" result="neutral" />
          <feComposite in="lensNoise" in2="neutral" operator="over" result="map" />

          {/* Real geometric distortion of the glyphs */}
          <feDisplacementMap in="SourceGraphic" in2="map" scale="70" xChannelSelector="R" yChannelSelector="G" result="warp" />

          {/* Blur, faded in through the same lens alpha */}
          <feGaussianBlur in="warp" stdDeviation="6" result="blurAll" />
          <feComposite in="blurAll" in2="lens" operator="in" result="blurLens" />
          <feComposite in="blurLens" in2="warp" operator="over" result="soft" />

          {/* Chromatic aberration: pull R and B apart, recombine, fade in through the lens */}
          <feOffset in="soft" dx="3" dy="0" result="rShift" />
          <feColorMatrix in="rShift" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rOnly" />
          <feOffset in="soft" dx="-3" dy="0" result="bShift" />
          <feColorMatrix in="bShift" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bOnly" />
          <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gOnly" />
          <feBlend in="rOnly" in2="gOnly" mode="screen" result="rg" />
          <feBlend in="rg" in2="bOnly" mode="screen" result="ca" />
          <feComposite in="ca" in2="lens" operator="in" result="caLens" />
          <feComposite in="caLens" in2="soft" operator="over" />
        </filter>
      </defs>

      <text
        x={WM_W / 2}
        y={WM_H - 12}
        textAnchor="middle"
        fontFamily="'Inter Variable', 'InterVariable', 'Inter', sans-serif"
        fontWeight={700}
        fontSize={292}
        letterSpacing="-0.05em"
        textLength={WM_W}
        lengthAdjust="spacingAndGlyphs"
        fill="url(#wm-fill)"
        filter="url(#wm-lens)"
      >
        KOMPOZITH
      </text>
    </svg>
  );
}

export default function FooterNew() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <footer
      className="relative isolate bg-transparent pt-8 pb-6 px-4 md:px-12 lg:[padding-left:150px] lg:[padding-right:150px] selection:bg-[#F97316] selection:text-white overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <SVGBackground />

      <div className="w-full">
        {/* Top Banner Section */}
        <div className="rounded-[2.5rem] p-12 md:p-16 lg:p-20 text-center text-white mb-16 relative overflow-hidden">

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-medium mb-8 tracking-tight leading-tight text-black">
              Elevate your <i style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700" }} className="text-[#FF804A]">brand</i> with us.
            </h2>

            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black font-medium px-6 py-3 rounded-full inline-flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              Book a call
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Middle Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">

          {/* Brand & Contact Column */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <div className="mb-6">
              <span className="font-bold text-xl text-slate-950 tracking-tight">Kompozith</span>
            </div>

            <div className="space-y-4 text-sm text-slate-800 mb-8 font-light">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-700" />
                <a href="mailto:hello@kompozith.com" className="hover:text-black transition-colors font-medium">hello@kompozith.com</a>
                <button
                  onClick={() => copyToClipboard("hello@kompozith.com", "email")}
                  className="text-slate-600 hover:text-black"
                  title="Copy to clipboard"
                >
                  {copiedText === "email" ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-700" />
                <a href="tel:+15551234567" className="hover:text-black transition-colors font-medium">+1 (555) 123-4567</a>
                <button
                  onClick={() => copyToClipboard("+1 (555) 123-4567", "phone")}
                  className="text-slate-600 hover:text-black"
                  title="Copy to clipboard"
                >
                  {copiedText === "phone" ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-700 mt-0.5" />
                <p className="leading-relaxed font-medium">123 Design Street,<br />Creative City, CA 90210</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-700">
              {[
                { icon: <XIcon className="w-4 h-4" />, href: "https://twitter.com", name: "X (Twitter)" },
                { icon: <Instagram className="w-4 h-4" />, href: "https://instagram.com", name: "Instagram" },
                { icon: <Linkedin className="w-4 h-4" />, href: "https://linkedin.com", name: "LinkedIn" }
              ].map((social, idx) => (
                <a key={idx} href={social.href} title={social.name} className="hover:text-black transition-colors" target="_blank" rel="noopener noreferrer">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Spacer for layout match */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-slate-950 mb-6 text-base">Important</h4>
            <ul className="space-y-4 text-sm text-slate-800 font-medium">
              {[
                { label: "Services", href: "#services" },
                { label: "Portfolio", href: "#portfolio" },
                { label: "Pricing", href: "#pricing" },
                { label: "About", href: "#about" },
                { label: "Reviews", href: "#reviews" }
              ].map(link => (
                <li key={link.label}><a href={link.href} className="hover:text-black transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-slate-950 mb-6 text-base">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-800 font-medium">
              {[
                { label: "Terms & conditions", href: "#terms" },
                { label: "Privacy policy", href: "#privacy" },
                { label: "Contact us", href: "#contact" }
              ].map(link => (
                <li key={link.label}><a href={link.href} className="hover:text-black transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3">
            <Newsletter />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-900/10 pt-8 pb-4 flex flex-col md:flex-row justify-center md:justify-start items-center gap-6 text-xs text-slate-950 font-semibold">
          <p>Copyright © 2026 - All rights reserved</p>
        </div>

        {/* Giant interactive wordmark, full-bleed at the very bottom */}
        <div className="relative left-1/2 -translate-x-1/2 -bottom-8 w-screen mt-10 -mb-6">
          <KompozithWordmark />
        </div>
      </div>
    </footer>
  );
}
