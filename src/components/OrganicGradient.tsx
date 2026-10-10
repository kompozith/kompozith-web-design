import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function OrganicGradient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<SVGCircleElement>(null);
  const glow2Ref = useRef<SVGCircleElement>(null);
  const glow3Ref = useRef<SVGCircleElement>(null);
  const glow4Ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up organic slow movements using GSAP
    const ctx = gsap.context(() => {
      // Glow 1: Red-orange
      gsap.to(glow1Ref.current, {
        cx: "70%",
        cy: "20%",
        r: "28%",
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Glow 2: Bright Orange
      gsap.to(glow2Ref.current, {
        cx: "30%",
        cy: "40%",
        r: "35%",
        duration: 18,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Glow 3: White / Soft Cream highlight
      gsap.to(glow3Ref.current, {
        cx: "50%",
        cy: "15%",
        r: "22%",
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Glow 4: Deep Red / Magenta blend
      gsap.to(glow4Ref.current, {
        cx: "85%",
        cy: "50%",
        r: "32%",
        duration: 22,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="organic-gradient-container"
      className="absolute top-0 left-0 w-full h-[450px] overflow-hidden pointer-events-none z-0 select-none"
    >
      <svg
        className="w-full h-full opacity-90"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 450"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Advanced Organic Grainy Blur Filter */}
          <filter id="organic-glow-blur" x="-100%" y="-100%" width="300%" height="300%">
            {/* 1. Heavy Gaussian blur to create the soft, luminous ambient glow */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="85" result="blurred" />

            {/* 2. High-frequency fractal noise generator to create a fine, tactile paper/grain texture */}
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />

            {/* 3. Blend the noise onto the blurred shapes using overlay mode to preserve brightness & details */}
            <feBlend mode="overlay" in="blurred" in2="noise" result="grainyGlow" />

            {/* 4. Mask the grainy glow using the original blurred shape's alpha channel to maintain a soft drop-off */}
            <feComposite operator="in" in="grainyGlow" in2="blurred" result="final" />
          </filter>
        </defs>

        {/* Deep pitch black base canvas */}
        <rect width="100%" height="100%" fill="#FAFBFD" />

        {/* Group of animated elements utilizing the grainy blur filter */}
        <g>
          {/* Glow 4: Soft rose pink */}
          <circle
            ref={glow4Ref}
            cx="80%"
            cy="40%"
            r="25%"
            fill="#FECDD3"
            opacity="0.45"
            filter="url(#organic-glow-blur)"
          />

          {/* Glow 2: Soft apricot peach */}
          <circle
            ref={glow2Ref}
            cx="25%"
            cy="30%"
            r="30%"
            fill="#FED7AA"
            opacity="0.45"
            filter="url(#organic-glow-blur)"
          />

          {/* Glow 1: Soft sky-blue */}
          <circle
            ref={glow1Ref}
            cx="60%"
            cy="10%"
            r="24%"
            fill="#BAE6FD"
            opacity="0.5"
            filter="url(#organic-glow-blur)"
          />

          {/* Glow 3: Soft lavender core */}
          <circle
            ref={glow3Ref}
            cx="45%"
            cy="10%"
            r="16%"
            fill="#E0E7FF"
            opacity="0.55"
            filter="url(#organic-glow-blur)"
          />
        </g>
      </svg>

      {/* Elegant smooth fade into the solid black footer background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FAFBFD]/65 to-[#FAFBFD] z-10" />
    </div>
  );
}
