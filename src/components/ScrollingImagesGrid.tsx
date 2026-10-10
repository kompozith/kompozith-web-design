import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { column1Items, column2Items, PortfolioItem } from "../types";
import { ArrowUpRight } from "lucide-react";

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

export default function ScrollingImagesGrid() {
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clone lists to ensure infinite continuous looping
  const duplicatedCol1 = [...column1Items, ...column1Items, ...column1Items];
  const duplicatedCol2 = [...column2Items, ...column2Items, ...column2Items];

  useEffect(() => {
    const col1 = col1Ref.current;
    const col2 = col2Ref.current;
    const container = containerRef.current;

    if (!col1 || !col2 || !container) return;

    // Use GSAP Context for isolated memory cleanup
    const ctx = gsap.context(() => {
      // Clean up standard translation values to eliminate jumping
      gsap.set(col1, { yPercent: 0 });
      gsap.set(col2, { yPercent: -33.33 }); // Start second column slightly offset for organic asymmetry

      // 1. Column 1 scrolling UP timeline
      const speed1 = 20; // Seconds to complete a full loop cycle
      const tl1 = gsap.to(col1, {
        yPercent: -33.33, // Travel exactly 1/3 of the height (one full duplication block)
        ease: "none",
        repeat: -1,
        duration: speed1,
      });

      // 2. Column 2 scrolling DOWN timeline
      const speed2 = 22;
      const tl2 = gsap.to(col2, {
        yPercent: 0, // Starts at -33.33% and moves to 0% to scroll DOWN
        ease: "none",
        repeat: -1,
        duration: speed2,
      });

      // 3. ScrollTrigger velocity integration
      // As the user scrolls, the speed of rotation adapts dynamically based on velocity
      let velocityTimeout: ReturnType<typeof setTimeout>;

      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity());

          if (velocity > 15) {
            // Translate scroll velocity into speed scale boost
            // Clamp value to secure reasonable layout speed rates
            const targetTimeScale = Math.min(1 + velocity * 0.003, 5);

            gsap.to([tl1, tl2], {
              timeScale: targetTimeScale,
              duration: 0.15,
              overwrite: "auto",
            });

            // Smoothly decelerate back to normal scale (1x) when scrolling halts
            clearTimeout(velocityTimeout);
            velocityTimeout = setTimeout(() => {
              gsap.to([tl1, tl2], {
                timeScale: 1,
                duration: 1.1,
                ease: "power2.out",
                overwrite: "auto",
              });
            }, 80);
          }
        },
      });

    });

    return () => ctx.revert();
  }, []);

  const renderCard = (item: PortfolioItem) => {
    return (
      <div
        key={item.id + Math.random().toString(36).substr(2, 4)} // Ensure unique keys for list rendering
        className="group relative overflow-hidden rounded-3xl w-full h-[220px] sm:h-[300px] lg:h-[340px] will-change-transform border border-slate-100/50 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
        style={{ contentVisibility: "auto" }} // Leverage hardware acceleration & render performance
      >
        {/* Full Cover Image */}
        <img
          src={item.imageUrl}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-[1.04] will-change-transform"
        />

        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors duration-500 pointer-events-none" />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[750px] md:h-full overflow-hidden grid grid-cols-2 gap-4 lg:gap-6 px-2 md:px-4"
      id="rotating-portfolio-grid"
    >
      {/* Top fade kept light so images stay visible behind the glass navbar.
          (The glassy bottom overlay lives in App.tsx so it spans the whole hero.) */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FAFBFD]/60 to-transparent pointer-events-none z-30" />

      {/* Column 1: Infinite Scrolling UP */}
      <div className="relative h-full overflow-hidden">
        <div
          ref={col1Ref}
          className="flex flex-col gap-4 lg:gap-6 py-2 will-change-transform"
        >
          {duplicatedCol1.map((item) => renderCard(item))}
        </div>
      </div>

      {/* Column 2: Infinite Scrolling DOWN */}
      <div className="relative h-full overflow-hidden">
        <div
          ref={col2Ref}
          className="flex flex-col gap-4 lg:gap-6 py-2 will-change-transform"
        >
          {duplicatedCol2.map((item) => renderCard(item))}
        </div>
      </div>
    </div>
  );
}
