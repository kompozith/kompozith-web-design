import { motion } from "motion/react";

export default function LinesBackground() {
  return (
    <div className="guide-lines absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      <svg
        className="w-full h-full text-slate-200/60"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Responsive Grid Lines using percentages and responsive positions */}
        
        {/* Left vertical border guideline */}
        <line
          x1="8%"
          y1="0"
          x2="8%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="hidden md:block opacity-60"
        />

        {/* First Left Column Divider Line */}
        <line
          x1="18%"
          y1="0"
          x2="18%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="hidden lg:block opacity-40"
        />

        {/* Middle Core Grid Split Line (Splits Hero CTA and Scrolling Cards Column) */}
        <line
          x1="52%"
          y1="0"
          x2="52%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="hidden md:block opacity-80"
        />

        {/* Right vertical guideline */}
        <line
          x1="92%"
          y1="0"
          x2="92%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="hidden md:block opacity-60"
        />

        {/* Horizontal Line separating Top Nav Area */}
        <line
          x1="0"
          y1="100"
          x2="100%"
          y2="100"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="opacity-50"
        />

        {/* Horizontal Line separating Main Hero cards list of services */}
        <line
          x1="0"
          y1="780"
          x2="100%"
          y2="780"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="opacity-80"
        />

        {/* Horizontal Line at the bottom of standard content */}
        <line
          x1="0"
          y1="1300"
          x2="100%"
          y2="1300"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="opacity-40"
        />

        {/* Decorative Grid Ticks and Intersection Indicators (Crosshairs) */}
        
        {/* Top-Left Nav Intersection (8%, 100px) */}
        <path
          d="M 8% 90 L 8% 110 M 0% 100 L 12% 100"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />
        {/* Center Split & Nav bar intersection (52%, 100px) */}
        <path
          d="M 52% 90 L 52% 110 M 49% 100 L 55% 100"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />
        {/* Top-Right Nav Intersection (92%, 100px) */}
        <path
          d="M 92% 90 L 92% 110 M 88% 100 L 96% 100"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />

        {/* Left Hero & Services Split Intersection (8%, 780px) */}
        <path
          d="M 8% 770 L 8% 790 M 5% 780 L 11% 780"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />

        {/* Center & Services Split Intersection (52%, 780px) */}
        <path
          d="M 52% 770 L 52% 790 M 49% 780 L 55% 780"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />

        {/* Right & Services Split Intersection (92%, 780px) */}
        <path
          d="M 92% 770 L 92% 790 M 89% 780 L 95% 780"
          stroke="currentColor"
          strokeWidth="1"
          className="hidden md:block opacity-90"
        />

        {/* Corner Accent Ticks representing coordinates */}
        <rect x="8.5%" y="110" width="3" height="3" fill="currentColor" className="hidden md:block opacity-40" />
        <rect x="52.5%" y="110" width="3" height="3" fill="currentColor" className="hidden md:block opacity-40" />
        <rect x="8.5%" y="790" width="3" height="3" fill="currentColor" className="hidden md:block opacity-40" />
      </svg>
    </div>
  );
}
