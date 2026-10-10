export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  bgColor: string;
  accentText?: string;
  accentTag?: string;
  userHandle?: string;
}

export const column1Items: PortfolioItem[] = [
  {
    id: "col1-1",
    title: "Super Charge Sales with Smart Automation AI",
    category: "SaaS Platform",
    imageUrl: "/src/assets/images/saas_interface_mockup_1779960728149.png",
    bgColor: "bg-blue-50",
    accentTag: "New Release",
    userHandle: "@smartport"
  },
  {
    id: "col1-2",
    title: "The Intelligent Automation for Modern Teams",
    category: "Mobile UX",
    imageUrl: "/src/assets/images/mobile_neon_app_1779960753950.png",
    bgColor: "bg-indigo-950",
    accentText: "Neon Purple",
    userHandle: "@intelliplane"
  },
  {
    id: "col1-3",
    title: "Minimalist Mobile Interaction & Micro-flows",
    category: "App Design",
    imageUrl: "/src/assets/images/service_product_app_1779961518796.png",
    bgColor: "bg-purple-100",
    userHandle: "@goflow"
  },
  {
    id: "col1-4",
    title: "Abstract Spatial Geometry Experimentation",
    category: "Interactive 3D",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    bgColor: "bg-rose-50",
    userHandle: "@spatial_form"
  }
];

export const column2Items: PortfolioItem[] = [
  {
    id: "col2-1",
    title: "FUTURE PROOF YOUR GROWTH - Modern Corporate Identity",
    category: "Branding",
    imageUrl: "/src/assets/images/brand_identity_mockup_1779960773588.png",
    bgColor: "bg-slate-50",
    accentText: "Growth Labs",
    userHandle: "@nexstudio"
  },
  {
    id: "col2-2",
    title: "THINK. CREATE. SOLUTIONS. - Minimalist Green Concept",
    category: "Web Engineering",
    imageUrl: "/src/assets/images/creative_studio_laptop_1779960794200.png",
    bgColor: "bg-emerald-50",
    userHandle: "@think_create"
  },
  {
    id: "col2-3",
    title: "Tactile Typography & Dark Mode Layouts",
    category: "Branding",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop",
    bgColor: "bg-neutral-900",
    accentText: "Classic Black",
    userHandle: "@typefoundry"
  },
  {
    id: "col2-4",
    title: "Creative Multi-Disciplinary Design Services",
    category: "Strategy & Art",
    imageUrl: "/src/assets/images/service_brand_cards_1779961502424.png",
    bgColor: "bg-amber-50",
    userHandle: "@studiounify"
  }
];

export interface ServiceItem {
  id: string;
  num: string;
  title: string;
  description: string;
  tags: string[];
}

export const servicesList: ServiceItem[] = [
  {
    id: "service-1",
    num: "01",
    title: "High-End UX/UI Design",
    description: "Creating visually stunning, tactile, and highly responsive user interfaces. Specially adapted for ultra-performance, using modern motion physics and typography pairings.",
    tags: ["Figma Mastery", "Motion Design", "Design Systems"]
  },
  {
    id: "service-2",
    num: "02",
    title: "Interactive Web Experiences",
    description: "Developing blazing fast, bespoke promotional pages and websites using React, GSAP, and Tailwind. Engineered with meticulous care for buttery smooth frames.",
    tags: ["React 19", "GSAP Engine", "Scroll Animation"]
  },
  {
    id: "service-3",
    num: "03",
    title: "Brand Strategy & Positioning",
    description: "Transforming startups into digital leaders. We clarify your unique messaging, define the aesthetic guidelines, and forge a cohesive presence that stands out.",
    tags: ["Strategic Positioning", "Typography Art", "B2B Scale"]
  }
];
