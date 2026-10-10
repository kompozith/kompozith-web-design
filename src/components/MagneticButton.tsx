import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";

interface MagneticButtonProps {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function MagneticButton({
  className = "",
  onClick,
  children,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for the button translation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for high-end micro-interaction feel
  const springX = useSpring(x, { stiffness: 120, damping: 14, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 14, mass: 0.6 });

  // Separate, subtler displacement for the text/content for nested depth
  const textX = useSpring(useMotionValue(0), { stiffness: 100, damping: 16 });
  const textY = useSpring(useMotionValue(0), { stiffness: 100, damping: 16 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - (left + width / 2);
    const mouseY = e.clientY - (top + height / 2);

    // Pull intensity factor (0.4 means it follows cursor up to 40% of standard boundaries)
    const buttonPull = 0.38;
    const textPull = 0.18;

    x.set(mouseX * buttonPull);
    y.set(mouseY * buttonPull);

    // Apply secondary offset for nested depth parallax
    textX.set(mouseX * textPull);
    textY.set(mouseY * textPull);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    textX.set(0);
    textY.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative py-4 px-0 flex items-center justify-center cursor-pointer select-none group focus:outline-none ${className}`}
      onClick={onClick}
      id="magnetic-cta-container"
    >
      <motion.button
        id="magnetic-cta-trigger"
        style={{
          x: springX,
          y: springY,
        }}
        className="relative bg-[#FF6230] text-white font-medium py-3.5 pl-6 pr-4 rounded-full flex items-center gap-3.5 shadow-[0_4px_24px_rgba(255,98,48,0.25)] hover:shadow-[0_8px_32px_rgba(255,98,48,0.4)] transition-shadow duration-300 pointer-events-none"
      >
        {/* Dynamic back reflection subtle effect */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Inner label content with secondary offset mapping for realistic soft 3D bend */}
        <motion.span
          style={{ x: textX, y: textY }}
          className="flex items-center gap-3 font-semibold tracking-wide text-sm md:text-base pointer-events-none"
        >
          {children || "Get in Touch"}
        </motion.span>

        {/* Diagonal Arrow Circular Badge */}
        <motion.div
          animate={{
            scale: isHovered ? [1, 1.05] : 1,
            rotate: isHovered ? 45 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1A2540] flex items-center justify-center shadow-inner group-hover:bg-[#111827] transition-colors duration-300"
        >
          <ArrowUpRight className="w-5 h-5 text-white stroke-[2.5]" />
        </motion.div>
      </motion.button>
    </div>
  );
}
