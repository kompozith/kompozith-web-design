/**
 * Initial content set: the four case studies that used to live hard-coded in
 * OutcomesSection.tsx, expanded into full case-study documents.
 *
 * Only used on an empty database. Once seeded, the CMS owns this content.
 */
import { randomUUID } from "node:crypto";
import type { Block, Project } from "./types.ts";

/** Distributes over the Block union so each variant keeps its own field set. */
type BlockInput = Block extends infer T
  ? T extends { id: string }
    ? Omit<T, "id">
    : never
  : never;

const block = (b: BlockInput): Block => ({ id: randomUUID(), ...b }) as Block;

const now = () => new Date().toISOString();

function project(p: Omit<Project, "id" | "createdAt" | "updatedAt" | "publishedAt">): Project {
  const ts = now();
  return {
    ...p,
    id: randomUUID(),
    createdAt: ts,
    updatedAt: ts,
    publishedAt: p.status === "published" ? ts : null,
  };
}

export function buildSeedProjects(): Project[] {
  return [
    project({
      slug: "stackwise",
      status: "published",
      title: "Stackwise platform",
      client: "Stackwise",
      category: "AI & SaaS",
      excerpt:
        "Tactile electronics and smart dial engineering paired with state-of-the-art SaaS automation dashboards.",
      tagline:
        "Revolutionising modern automated workflows with responsive tactile dials and neon halos.",
      coverImage: "/media/case_study_automentor_1779962169075.png",
      accentColor: "#FF6230",
      cardBg: "#EAEAEA",
      order: 0,
      featured: true,
      overview:
        "Stackwise is an automation platform that lets operations teams wire together the tools they already use without writing code.\n\nThe product had the engine but not the language: every run looked like a wall of logs. Our brief was to turn an engineer's tool into something an operations lead could open on a Monday morning and understand in ten seconds.",
      objective:
        "Rebuild the marketing site and the run dashboard around a single visual language, so a visitor understands what the platform does before scrolling, and an operator can read the health of 2.4 million daily workflows at a glance.",
      meta: {
        industry: "Workflow Automation",
        services: ["UX Design", "UI Design", "Web Design", "Front-end Engineering"],
        duration: "8 weeks",
        timeline: "2025",
      },
      stats: [
        { label: "Active connections", value: "85,000+" },
        { label: "Execution latency", value: "<12ms" },
        { label: "Workflows run daily", value: "2.4M" },
      ],
      liveUrl: "",
      seoTitle: "Stackwise — automation platform case study",
      seoDescription:
        "How Kompozith rebuilt the Stackwise automation platform around a tactile, legible control surface.",
      sections: [
        block({
          type: "feature",
          label: "Problem",
          title: "Automation that felt harder than doing the work by hand",
          body: "Teams adopted Stackwise to save time, then spent that time deciphering what their own workflows had done overnight.",
          bullets: [
            {
              lead: "Log-shaped interface",
              text: "Every run was reported as raw output, so reading a result meant reading a transcript.",
            },
            {
              lead: "No sense of state",
              text: "Nothing on screen distinguished a healthy workflow from one that had been failing for three days.",
            },
            {
              lead: "Undifferentiated homepage",
              text: "The site described features in the same vocabulary as five competitors, so the demo did all the selling.",
            },
            {
              lead: "Dashboard that did not scale",
              text: "Layouts built for ten workflows became unusable at four hundred.",
            },
          ],
          image: "/media/saas_interface_mockup_1779960728149.png",
          imageAlt: "Stackwise dashboard before the redesign",
          layout: "image-right",
        }),
        block({
          type: "feature",
          label: "Solution",
          title: "A control surface that explains itself",
          body: "We gave every workflow a physical metaphor — a dial with a state, a halo with a colour — and built the rest of the system around it.",
          bullets: [
            {
              lead: "Tactile control language",
              text: "Dials and sliders carry real feedback, so adjusting a threshold feels like turning something.",
            },
            {
              lead: "Reactive status halos",
              text: "A single glowing ring communicates health, throughput and last-run status without a legend.",
            },
            {
              lead: "Density that scales",
              text: "One card component reads correctly at ten workflows and at four hundred.",
            },
            {
              lead: "A homepage with a point of view",
              text: "The product's own interface became the hero, replacing generic feature copy.",
            },
          ],
          image: "/media/case_study_automentor_1779962169075.png",
          imageAlt: "Stackwise control surface after the redesign",
          layout: "image-left",
        }),
        block({
          type: "process",
          label: "Process",
          title: "From engine to interface, in four passes",
          body: "Each pass ended with something clickable, so decisions were made against real behaviour rather than static screens.",
          steps: [
            {
              title: "Discovery",
              body: "We sat with four operations leads and watched them read their own workflow runs.",
              tags: ["Stakeholder interviews", "Log audit", "Task analysis", "Competitive scan"],
            },
            {
              title: "Structure",
              body: "The information model was rebuilt around workflow state instead of chronological output.",
              tags: ["Information architecture", "State model", "Navigation", "Content hierarchy"],
            },
            {
              title: "Visual direction",
              body: "A tactile system of dials, halos and neon accents gave every state a distinct, memorable form.",
              tags: ["Design system", "Motion language", "Typography", "Colour semantics"],
            },
            {
              title: "Engineering",
              body: "Built in React with GSAP-driven transitions, tuned to hold sixty frames on a four-year-old laptop.",
              tags: ["React", "GSAP", "Performance budget", "Accessibility pass"],
            },
          ],
        }),
        block({
          type: "image",
          url: "/media/service_website_desktop_1779961535663.png",
          alt: "Stackwise marketing site across desktop breakpoints",
          caption: "The rebuilt marketing site leads with the product's own control surface.",
          width: "full",
        }),
        block({
          type: "feature",
          label: "Research",
          title: "Operators do not read, they scan",
          body: "Session recordings showed the same pattern across every account: users looked at a run for under four seconds before deciding whether to act.",
          bullets: [
            {
              lead: "Four seconds to a decision",
              text: "Anything that could not be understood in a glance was skipped entirely.",
            },
            {
              lead: "Colour beat copy",
              text: "Testers identified failing workflows by colour long before they read a single label.",
            },
            {
              lead: "Trust came from consistency",
              text: "Layout changes between sections read as instability, not variety.",
            },
          ],
          image: "/media/mobile_neon_app_1779960753950.png",
          imageAlt: "Stackwise status states on mobile",
          layout: "image-right",
        }),
        block({
          type: "text",
          label: "Services",
          title: "Making a technical product legible",
          body: "The platform's complexity was never the problem — its presentation was. We reorganised the product surface so that the first thing a visitor meets is a working piece of the interface rather than a paragraph about it.\n\nEvery section that followed was built to answer one question and hand the reader to the next. Navigation, spacing and type scale stayed identical throughout, which let the content carry the variation instead of the layout.",
        }),
        block({
          type: "stats",
          label: "Results & outcomes",
          title: "A product people can read",
          items: [
            { value: "+46%", label: "Demo requests" },
            { value: "-31%", label: "Time to first workflow" },
            { value: "+52%", label: "Scroll depth on the homepage" },
          ],
        }),
        block({
          type: "quote",
          quote:
            "Our support queue changed shape overnight. People stopped asking what the dashboard was telling them and started asking for new features.",
          author: "Head of Product",
          role: "Stackwise",
          avatar: "",
        }),
      ],
    }),

    project({
      slug: "genesy",
      status: "published",
      title: "Genesy telemetry",
      client: "Genesy",
      category: "Technology & SaaS",
      excerpt:
        "Ultra-high-definition device telemetry showing hardware rotation accuracy with custom environment resistance features.",
      tagline:
        "Engineering ultra-high-definition industrial operations via dynamic, weather-sealed adjustment knobs.",
      coverImage: "/media/case_study_kigoo_1779962190864.png",
      accentColor: "#3B82F6",
      cardBg: "#0B101D",
      order: 1,
      featured: true,
      overview:
        "Genesy builds sealed industrial sensors for sites where a millimetre of drift is expensive and a failed reading is dangerous.\n\nThe hardware was trusted. The software around it was not: the monitoring console had grown one screen at a time, and field engineers had started keeping their own spreadsheets rather than trusting the dashboard.",
      objective:
        "Give field engineers one console they trust more than their spreadsheet — precise enough for calibration work, readable in daylight, and honest about what the sensor actually knows.",
      meta: {
        industry: "Industrial IoT",
        services: ["Product Design", "UI Design", "Data Visualisation", "Web Engineering"],
        duration: "10 weeks",
        timeline: "2025",
      },
      stats: [
        { label: "Precision", value: "0.001mm" },
        { label: "Ingress protection", value: "IP68" },
        { label: "API availability", value: "99.99%" },
      ],
      liveUrl: "",
      seoTitle: "Genesy — industrial telemetry case study",
      seoDescription:
        "Redesigning the Genesy telemetry console for field engineers who need precision they can read at a glance.",
      sections: [
        block({
          type: "feature",
          label: "Problem",
          title: "A console engineers had stopped trusting",
          body: "When the interface and the instrument disagree, people believe the instrument — and then stop opening the interface.",
          bullets: [
            {
              lead: "Precision without context",
              text: "Readings were shown to six decimal places with no indication of tolerance or confidence.",
            },
            {
              lead: "Unreadable in the field",
              text: "Low-contrast charts washed out completely on a tablet in direct sunlight.",
            },
            {
              lead: "Alerts with no hierarchy",
              text: "A calibration reminder and a sensor failure looked identical.",
            },
            {
              lead: "Screens that never agreed",
              text: "Each console area had been designed separately, with its own units and conventions.",
            },
          ],
          image: "/media/case_study_kigoo_1779962190864.png",
          imageAlt: "Genesy sensor hardware",
          layout: "image-right",
        }),
        block({
          type: "feature",
          label: "Solution",
          title: "Precision you can read from two metres away",
          body: "We rebuilt the console around a dark, high-contrast system tuned for outdoor screens, and made uncertainty a first-class part of every reading.",
          bullets: [
            {
              lead: "Confidence-aware readouts",
              text: "Every value carries its tolerance band, so a drifting sensor is visible before it fails.",
            },
            {
              lead: "Daylight-first palette",
              text: "Contrast ratios were validated on a tablet outdoors, not on a studio monitor.",
            },
            {
              lead: "Three-level alert model",
              text: "Informational, degraded and critical states are distinguishable by shape as well as colour.",
            },
            {
              lead: "One shared component set",
              text: "Charts, dials and tables now share units, spacing and interaction patterns across the console.",
            },
          ],
          image: "/media/service_product_app_1779961518796.png",
          imageAlt: "Genesy console interface",
          layout: "image-left",
        }),
        block({
          type: "process",
          label: "Process",
          title: "Designed on site, not in the studio",
          body: "Two of the four phases were run at a customer facility, with the screens tested on the same tablets engineers carry.",
          steps: [
            {
              title: "Field study",
              body: "Two days shadowing calibration rounds, recording where the console was ignored and why.",
              tags: ["Site visits", "Contextual inquiry", "Device audit", "Lighting tests"],
            },
            {
              title: "Data modelling",
              body: "Readings, tolerances and alert states were unified into a single vocabulary.",
              tags: ["Units model", "Alert taxonomy", "Tolerance bands", "Naming"],
            },
            {
              title: "Dark system",
              body: "A high-contrast dark palette validated outdoors, with type sized for gloved, arm's-length use.",
              tags: ["Contrast validation", "Type scale", "Iconography", "Chart specs"],
            },
            {
              title: "Rollout",
              body: "Shipped area by area behind a flag, with the old console one click away for the first month.",
              tags: ["Feature flags", "Parallel run", "Training notes", "Telemetry"],
            },
          ],
        }),
        block({
          type: "image",
          url: "/media/creative_studio_laptop_1779960794200.png",
          alt: "Genesy console on a laptop",
          caption: "The console in its desk configuration, sharing one component set with the field view.",
          width: "full",
        }),
        block({
          type: "text",
          label: "Services",
          title: "Designing for a hostile environment",
          body: "Industrial software is rarely used in the conditions it was designed in. Gloves, glare, vibration and a two-metre viewing distance change what counts as legible, and none of those constraints show up in a design file.\n\nWe treated them as hard requirements. Every screen was reviewed on the target hardware, outdoors, before it was considered finished — which is how the type scale ended up two steps larger than the original proposal, and why nothing critical is communicated by colour alone.",
        }),
        block({
          type: "stats",
          label: "Results & outcomes",
          title: "Back to a single source of truth",
          items: [
            { value: "-64%", label: "Shadow spreadsheets in use" },
            { value: "+38%", label: "Weekly active engineers" },
            { value: "2.1x", label: "Faster fault triage" },
          ],
        }),
        block({
          type: "quote",
          quote:
            "The tolerance bands were the whole thing. We caught two drifting units in the first week that we would previously have found at the next service.",
          author: "Field Operations Lead",
          role: "Genesy",
          avatar: "",
        }),
      ],
    }),

    project({
      slug: "althor",
      status: "published",
      title: "Althor payments",
      client: "Althor",
      category: "Finance & Fintech",
      excerpt:
        "An elegant, matte silver payment gateway and interactive smart console facilitating high-stakes multi-currency operations.",
      tagline:
        "Delivering minimalist terminal interactions and laser-guided micro-accounting models.",
      coverImage: "/media/case_study_monlook_1779962211255.png",
      accentColor: "#FF6230",
      cardBg: "#ECECEC",
      order: 2,
      featured: true,
      overview:
        "Althor moves money between currencies for businesses whose margins live in the third decimal place.\n\nThe platform was technically excellent and commercially invisible. Onboarding took eleven minutes, most of it spent on a compliance form that gave no indication of progress, and the marketing site read like a regulatory filing.",
      objective:
        "Cut time-to-first-transaction from eleven minutes to under a minute, and give a regulated financial product a public face that earns trust without hiding behind jargon.",
      meta: {
        industry: "Cross-border Payments",
        services: ["Brand Strategy", "UX Design", "UI Design", "Web Engineering"],
        duration: "12 weeks",
        timeline: "2026",
      },
      stats: [
        { label: "Processed volume", value: "$1.4B" },
        { label: "Onboarding time", value: "45s" },
        { label: "Compliance score", value: "100/100" },
      ],
      liveUrl: "",
      seoTitle: "Althor — payments platform case study",
      seoDescription:
        "Rebuilding onboarding and brand for Althor, a cross-border payments platform, from eleven minutes to forty-five seconds.",
      sections: [
        block({
          type: "feature",
          label: "Problem",
          title: "A trustworthy product that looked like paperwork",
          body: "Regulated does not have to mean unreadable, but every surface of the product had been written by someone protecting against a worst case.",
          bullets: [
            {
              lead: "Eleven-minute onboarding",
              text: "A single unbroken compliance form with no progress, no save and no explanation.",
            },
            {
              lead: "Jargon as a first impression",
              text: "The homepage opened with settlement terminology before saying what the product does.",
            },
            {
              lead: "No sense of scale",
              text: "Nothing communicated the volume already moving through the platform.",
            },
            {
              lead: "Fragmented visual identity",
              text: "Product, marketing and documentation looked like three different companies.",
            },
          ],
          image: "/media/case_study_monlook_1779962211255.png",
          imageAlt: "Althor payment terminal",
          layout: "image-right",
        }),
        block({
          type: "feature",
          label: "Solution",
          title: "Compliance, broken into moments you can finish",
          body: "The form did not get shorter. It got honest about where you are, what is left, and why each answer is needed.",
          bullets: [
            {
              lead: "Staged onboarding",
              text: "Four short steps with visible progress and automatic save between each.",
            },
            {
              lead: "Plain-language first",
              text: "Every regulatory term is introduced in ordinary words, with the formal wording one tap away.",
            },
            {
              lead: "Evidence of scale",
              text: "Live volume and settlement figures moved to the top of the homepage.",
            },
            {
              lead: "One identity",
              text: "A matte, precise visual system now runs from the marketing site through to the receipts.",
            },
          ],
          image: "/media/service_brand_cards_1779961502424.png",
          imageAlt: "Althor brand identity system",
          layout: "image-left",
        }),
        block({
          type: "process",
          label: "Process",
          title: "Compliance and design in the same room",
          body: "Legal review usually happens after the work. Here it happened during, which is the only reason the language could be simplified at all.",
          steps: [
            {
              title: "Audit",
              body: "Every onboarding field was mapped to the regulation that required it — a third turned out to be optional.",
              tags: ["Field audit", "Regulatory mapping", "Drop-off analysis", "Support tickets"],
            },
            {
              title: "Restructure",
              body: "The remaining fields were grouped into four stages a person can complete in one sitting.",
              tags: ["Flow design", "Progressive disclosure", "Save states", "Error recovery"],
            },
            {
              title: "Identity",
              body: "A precise, matte visual language built to read as careful rather than cold.",
              tags: ["Brand system", "Typography", "Motion", "Photography direction"],
            },
            {
              title: "Build & verify",
              body: "Implemented alongside compliance, with every copy change reviewed before it shipped.",
              tags: ["React", "Legal review", "A/B testing", "Analytics"],
            },
          ],
        }),
        block({
          type: "image",
          url: "/media/brand_identity_mockup_1779960773588.png",
          alt: "Althor identity applied across print and screen",
          caption: "One system, from the marketing site to the transaction receipt.",
          width: "full",
        }),
        block({
          type: "text",
          label: "Services",
          title: "Trust is a design output",
          body: "In financial products, trust is usually pursued with seals, certifications and dense legal copy. In testing, none of those moved the needle. What did was the interface behaving predictably: saving when it said it saved, explaining why a field was needed, and never losing an answer.\n\nSo the identity work followed the same rule. Restraint over reassurance, precision over polish, and a tone that treats the reader as a professional rather than a risk.",
        }),
        block({
          type: "stats",
          label: "Results & outcomes",
          title: "From eleven minutes to forty-five seconds",
          items: [
            { value: "-93%", label: "Onboarding duration" },
            { value: "+71%", label: "Completed applications" },
            { value: "-27%", label: "Landing page exits" },
          ],
        }),
        block({
          type: "quote",
          quote:
            "We assumed the drop-off was a compliance cost we had to accept. It turned out to be an interface problem the whole time.",
          author: "Chief Operating Officer",
          role: "Althor",
          avatar: "",
        }),
      ],
    }),

    project({
      slug: "etery",
      status: "published",
      title: "Etery commerce",
      client: "Etery",
      category: "E-commerce",
      excerpt:
        "Tactile material-black composite equipment styling combined with fluid shopping portals to unlock premium customer actions.",
      tagline:
        "Simplifying premium audio commerce through tactile state management and honest product photography.",
      coverImage: "/media/brand_identity_mockup_1779960773588.png",
      accentColor: "#FF6230",
      cardBg: "#1C202E",
      order: 3,
      featured: false,
      overview:
        "Etery makes premium audio hardware and sells it directly. The products are tactile, heavy and beautifully made; the store made them look like accessories.\n\nMobile was where the damage showed: two thirds of traffic, a third of revenue, and a bounce rate that climbed with every image the page loaded.",
      objective:
        "Make the online store feel like the products do — deliberate, tactile, unhurried — while cutting mobile page weight enough to keep people past the first scroll.",
      meta: {
        industry: "Consumer Audio",
        services: ["E-commerce Design", "UI Design", "Front-end Engineering", "Performance"],
        duration: "7 weeks",
        timeline: "2026",
      },
      stats: [
        { label: "Conversion uplift", value: "+44%" },
        { label: "Playback uptime", value: "99.999%" },
        { label: "Mobile bounce rate", value: "-28%" },
      ],
      liveUrl: "",
      seoTitle: "Etery — premium audio commerce case study",
      seoDescription:
        "Rebuilding the Etery storefront around tactile product presentation and a strict mobile performance budget.",
      sections: [
        block({
          type: "feature",
          label: "Problem",
          title: "Premium hardware, commodity storefront",
          body: "The products commanded a premium price on a page that looked like every other catalogue template.",
          bullets: [
            {
              lead: "Flat product presentation",
              text: "Studio cut-outs on white removed every cue about weight, finish and material.",
            },
            {
              lead: "Punishing mobile weight",
              text: "Fourteen megabytes of hero imagery before a single price was visible.",
            },
            {
              lead: "Checkout friction",
              text: "Five steps, an account requirement, and shipping costs revealed at the last one.",
            },
            {
              lead: "Search that could not find anything",
              text: "Product names had to be typed exactly, with no tolerance for a missing hyphen.",
            },
          ],
          image: "/media/service_brand_cards_1779961502424.png",
          imageAlt: "Etery products before the redesign",
          layout: "image-right",
        }),
        block({
          type: "feature",
          label: "Solution",
          title: "A store that behaves like the object",
          body: "Photography, motion and interaction were all rebuilt to communicate one thing: this is a physical object worth what it costs.",
          bullets: [
            {
              lead: "Material-first photography",
              text: "Products shot in context and in raking light, so finish and weight read immediately.",
            },
            {
              lead: "A hard performance budget",
              text: "Under 500 KB before interaction on mobile, enforced in the build rather than reviewed after it.",
            },
            {
              lead: "Two-step checkout",
              text: "Guest by default, with shipping costs shown from the first screen.",
            },
            {
              lead: "Forgiving search",
              text: "Typo-tolerant search over a metadata-rich catalogue, with results as you type.",
            },
          ],
          image: "/media/mobile_neon_app_1779960753950.png",
          imageAlt: "Etery mobile storefront",
          layout: "image-left",
        }),
        block({
          type: "process",
          label: "Process",
          title: "Rebuilt around the mobile session",
          body: "Every decision was tested on a mid-range Android over a throttled connection first, and on desktop second.",
          steps: [
            {
              title: "Analytics review",
              body: "Session recordings showed exactly where mobile visitors abandoned, and it was almost always mid-load.",
              tags: ["Funnel analysis", "Session replay", "Performance audit", "Search logs"],
            },
            {
              title: "Art direction",
              body: "A new photography direction built to convey material and scale rather than isolate the product.",
              tags: ["Shot list", "Lighting direction", "Colour grading", "Crop system"],
            },
            {
              title: "Storefront design",
              body: "Templates designed at mobile width first, then allowed to expand rather than contract.",
              tags: ["Mobile-first layouts", "Component library", "Motion", "Checkout flow"],
            },
            {
              title: "Engineering",
              body: "Built with a per-route weight budget that fails the build when exceeded.",
              tags: ["React", "Image pipeline", "Budget enforcement", "Core Web Vitals"],
            },
          ],
        }),
        block({
          type: "gallery",
          images: [
            {
              url: "/media/service_product_app_1779961518796.png",
              alt: "Etery product detail screens",
            },
            {
              url: "/media/service_website_desktop_1779961535663.png",
              alt: "Etery storefront on desktop",
            },
          ],
          columns: 2,
        }),
        block({
          type: "text",
          label: "Services",
          title: "Performance as art direction",
          body: "Speed is usually framed as an engineering concern and photography as a creative one. On this project they were the same decision: every image had to justify its weight, which forced the shot list to get sharper rather than longer.\n\nThe result is a store with fewer images than the one it replaced, each doing considerably more work — and a first meaningful paint that arrives before a visitor has decided to leave.",
        }),
        block({
          type: "stats",
          label: "Results & outcomes",
          title: "Fewer images, more revenue",
          items: [
            { value: "+44%", label: "Conversion rate" },
            { value: "-28%", label: "Mobile bounce rate" },
            { value: "1.1s", label: "Largest contentful paint" },
          ],
        }),
        block({
          type: "quote",
          quote:
            "We spent two years adding to that page. The version that finally worked took things away.",
          author: "Founder",
          role: "Etery",
          avatar: "",
        }),
      ],
    }),
  ];
}
