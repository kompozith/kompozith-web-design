import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, ArrowUpRight, HelpCircle } from "lucide-react";
import RevealTitle from "./RevealTitle";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      question: "How does the subscription model work?",
      answer: "Once subscribed, you can add as many design or development requests to your queue as you like. They will be delivered one by one. You pay a flat rate every month, with no hidden costs or hourly surprises."
    },
    {
      id: "faq-2",
      question: "What kind of design tasks can I request?",
      answer: "Virtually everything you need! From complex SaaS wireframes, brand identities, complete design systems, web dashboards or high-conversion promotional websites, straight through to mobile application layouts."
    },
    {
      id: "faq-3",
      question: "How fast will I receive my designs?",
      answer: "On average, most design tasks are completed and delivered in just 2-3 business days. More complex requests (such as a full mobile app or landing page layout) might be split into smaller milestones."
    },
    {
      id: "faq-4",
      question: "What tools do you use to manage the work?",
      answer: "We use Figma for UI/UX master designs, and Slack/Trello to manage your delivery queue smoothly. This makes submitting active request briefs or sharing live review screencasts effortless."
    },
    {
      id: "faq-5",
      question: "How many requests I can make?",
      answer: "There are absolutely no limits! You can keep stack-ranking requests inside your digital column queue. We will continuously code or design them one after the other in high priority."
    },
    {
      id: "faq-6",
      question: "Can I cancel or pause anytime?",
      answer: "Yes, absolutely. If you only have one or two active tasks, you can pause your subscription once they are delivered and reactivate it later when additional design needs emerge. No questions asked."
    }
  ];

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAskQuestion = () => {
    const event = new CustomEvent("openContactForm");
    window.dispatchEvent(event);
  };

  return (
    <section
      id="faq-section"
      className="relative w-full py-24 px-4 sm:px-8 md:px-12 lg:px-20 bg-white"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Heading and Subheadings */}
        <div className="md:col-span-5 flex flex-col items-start text-left space-y-5 md:sticky md:top-28">
          
          {/* Accent Label Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/50 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-widest">
            007 / FAQS
          </div>

          {/* Staggered Big Header Stack */}
          <RevealTitle
            segments={[
              { text: "Questions?" },
              { text: "Answers.", className: "text-slate-400", breakBefore: true },
            ]}
            className="text-[#1A2540] font-sans font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.95]"
          />

          <p className="text-slate-500 font-sans text-xs sm:text-sm md:text-md leading-relaxed font-normal max-w-xs pt-1">
            Everything you need to know about our design subscription service.
          </p>

          {/* Circular Diagonal Arrow Button matching exactly the reference layout */}
          <button
            onClick={handleAskQuestion}
            className="group flex items-center gap-3.5 text-[#1A2540] pt-4 hover:text-[#FF6230] transition-colors focus:outline-none cursor-pointer"
          >
            <span className="font-sans font-extrabold text-[#111827] text-sm group-hover:text-[#FF6230] transition-colors select-none">
              Ask a question
            </span>
            <div className="w-8 h-8 rounded-full bg-[#111827] group-hover:bg-[#FF6230] flex items-center justify-center text-white transition-all duration-300 shadow-md">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Right Column: Custom Rounded Accordion List */}
        <div className="md:col-span-7 space-y-4" id="faq-accordions-group">
          {faqs.map((faq) => {
            const isCurrentExpanded = expandedId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 bg-[#F4F6FB] border-[#E4E9F2]/70 ${
                  isCurrentExpanded
                    ? "bg-slate-50/80 border-[#FF6230]/30 shadow-xs"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <button
                  onClick={() => handleToggle(faq.id)}
                  className="w-full flex items-center justify-between p-5.5 md:p-6 cursor-pointer text-left focus:outline-none"
                >
                  {/* Question */}
                  <h3 className="text-[#1A2540] font-sans font-bold text-sm sm:text-base leading-snug tracking-tight max-w-[85%] select-none">
                    {faq.question}
                  </h3>

                  {/* Circle Plus/Minus Button Wrapper */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isCurrentExpanded
                        ? "bg-[#FF6230] text-white rotate-180"
                        : "bg-[#111827] text-white"
                    }`}
                  >
                    {isCurrentExpanded ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isCurrentExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5.5 md:px-6 pb-6 pt-1 text-left border-t border-slate-150/40 mt-1">
                        <p className="text-slate-500 font-sans text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
