import { motion } from "motion/react";
import RevealTitle from "./RevealTitle";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 90,
      damping: 18,
      mass: 0.75,
    },
  },
};

export default function ServicesSection() {
  const cards = [
    {
      id: "service-brand",
      title: "Brand Identity",
      description: "Elevate your identity: sharp positioning, cohesive visuals, real impact.",
      tags: ["BRAND STRATEGY", "LOGO DESIGN", "BRAND DNA", "ART DIRECTION"],
      imageUrl: "/src/assets/images/service_brand_cards_1779961502424.png",
      logo: (
        <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="orangeGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6230" />
              <stop offset="100%" stopColor="#FFA185" />
            </linearGradient>
          </defs>
          {/* Folded ribbon geometric shapes matching screenshot 1st logo */}
          <path d="M12 4H28C36 4 40 8 40 16V28C40 36 36 40 28 40H12C4 40 4 36 4 28V16C4 8 4 4 12 4Z" fill="url(#orangeGrad)" />
          <path d="M4 16 L28 40 L4 40 Z" fill="#FFFFFF" opacity="0.18" />
          <path d="M40 28 L16 4 L40 4 Z" fill="#000000" opacity="0.08" />
        </svg>
      ),
    },
    {
      id: "service-product",
      title: "Product Design",
      description: "Refresh or rebrand your UI; lift retention with clear flows and micro-interactions.",
      tags: ["CLEAN & MODERN UI", "REBRANDING", "PROTOTYPING", "DESIGN SYSTEM"],
      imageUrl: "/src/assets/images/service_product_app_1779961518796.png",
      logo: (
        <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blueSquareGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1A2540" />
              <stop offset="100%" stopColor="#3B538C" />
            </linearGradient>
            <linearGradient id="orangeSquareGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6230" />
              <stop offset="100%" stopColor="#FFA082" />
            </linearGradient>
          </defs>
          {/* Two overlapping capsules with soft lighting as on second logo */}
          <rect x="4" y="8" width="26" height="26" rx="8" fill="url(#blueSquareGrad)" />
          <rect x="18" y="14" width="26" height="26" rx="8" fill="url(#orangeSquareGrad)" className="mix-blend-normal" opacity="0.92" />
          {/* Transparency highlight */}
          <circle cx="22" cy="22" r="6" fill="#FFFFFF" opacity="0.15" />
        </svg>
      ),
    },
    {
      id: "service-websites",
      title: "Web Developement",
      description: "Launch a revenue-driving site that captures qualified leads 24/7 — shipped in 30 days.",
      tags: ["UI/UX DESIGN", "INTEGRATIONS", "CMS INTEGRATION", "ANIMATION"],
      imageUrl: "/src/assets/images/service_website_desktop_1779961535663.png",
      logo: (
        <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="circleBlue" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1C2742" />
              <stop offset="100%" stopColor="#4A65A4" />
            </linearGradient>
            <linearGradient id="circleOrange" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6230" />
              <stop offset="100%" stopColor="#FFAE96" />
            </linearGradient>
          </defs>
          {/* Tri-lobe modular petals icon representation as in image logo-3 */}
          <circle cx="24" cy="24" r="20" fill="url(#circleBlue)" />
          <path d="M24 4 C35.0457 4 44 12.9543 44 24 C44 35.0457 35.0457 44 24 44 Z" fill="url(#circleOrange)" opacity="0.85" className="mix-blend-screen" />
          <path d="M12 24 C12 17.3726 17.3726 12 24 12 C30.6274 12 36 17.3726 36 24 C36 30.6274 30.6274 36 24 36 C17.3726 36 12 30.6274 12 24 Z" fill="#FFFFFF" opacity="0.3" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="services-section"
      className="relative w-full py-20 px-4 sm:px-8 md:px-12 lg:px-20 bg-white"
    >
      {/* Structural layout row matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-14 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-start text-left">
          {/* Accent Badge */}
          <div className="bg-[#1A2540] text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 flex items-center gap-1.5 shadow-sm">
            Our services
          </div>

          <RevealTitle
            segments="What we do."
            className="text-[#1A2540] font-sans font-bold text-4xl sm:text-5xl lg:text-5.5xl tracking-tight leading-none"
          />
        </div>

        {/* Right strategic description */}
        <div className="flex items-center h-full md:pt-10 text-left">
          <p className="text-slate-600 font-sans text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-lg">
            We combine strategy, speed, and skill to deliver exceptional output — every time.
          </p>
        </div>
      </div>

      {/* Modern 3-Column Services Card layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 max-w-7xl mx-auto relative z-10"
        id="services-grid-wrapper"
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={cardVariants}
            className="group flex flex-col bg-[#F4F6FB] p-[5px] rounded-[14px] text-left"
          >
            {/* White card container (top half) */}
            <div className="bg-white p-7 rounded-[8px] flex flex-col items-start justify-between min-h-[310px] sm:min-h-[320px]">
              {/* Logo / Brand container */}
              <div className="mb-4">
                {card.logo}
              </div>

              {/* Text and Title container */}
              <div className="space-y-2 mt-2">
                <h3 className="text-[#1A2540] font-sans font-extrabold text-xl tracking-tight">
                  {card.title}
                </h3>
                <p className="text-slate-500 font-sans text-xs sm:text-sm font-normal leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bullet Tag Lists */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full mt-6 pt-5 border-t border-slate-100/60">
                {card.tags.map((tag) => (
                  <div key={tag} className="flex items-center gap-1.5 overflow-hidden">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6230] shrink-0" />
                    <span className="text-[9px] sm:text-[9.5px] font-sans font-semibold tracking-wide text-slate-500 uppercase truncate">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup Card image container (bottom half) */}
            <div className="mt-[5px] overflow-hidden rounded-[8px] aspect-[4/3] w-full relative z-0">
              <img
                src={card.imageUrl}
                alt={card.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out will-change-transform"
              />
              {/* Soft overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
