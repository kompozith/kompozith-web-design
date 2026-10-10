import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MessageSquareCode, Check, Send, AlertCircle } from "lucide-react";
import RevealTitle from "./RevealTitle";

interface Testimonial {
  id: string;
  rating: string;
  text: string;
  author: string;
  role: string;
  avatarUrl: string;
}

export default function TestimonialsSection() {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRole, setReviewerRole] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // High quality sample testimonials matching the screenshot tokens
  const testimonials: Testimonial[] = [
    {
      id: "t-1",
      rating: "4.8",
      text: "Refresh or rebrand your UI; lift retention with clear flows and micro-interactions. They hit the nail on the head.",
      author: "Marcus Lawrance",
      role: "CEO REAL BUCKET",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
    },
    {
      id: "t-2",
      rating: "4.9",
      text: "Bespoke engineering that runs at buttery smooth frame rates. The custom infinite rotating gallery is magnificent.",
      author: "Sarah Jenkins",
      role: "VP OF PRODUCT, NEXUS",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop"
    },
    {
      id: "t-3",
      rating: "4.7",
      text: "Kompozith Studio understood our strict brand requirements perfectly. The outcome is extremely elegant and high-end.",
      author: "David Vance",
      role: "CO-FOUNDER, INSIDE71",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop"
    },
    {
      id: "t-4",
      rating: "4.8",
      text: "Their strategic discovery call was incredibly thorough. Shipped our fully responsive landing page in record time.",
      author: "Elisa Berthier",
      role: "CREATIVE LEAD, MON LOOK",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
    }
  ];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewText) return;
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewModalOpen(false);
      setReviewerName("");
      setReviewerRole("");
      setReviewText("");
    }, 3000);
  };

  return (
    <section
      id="testimonials"
      className="relative w-full py-20 px-4 sm:px-8 md:px-12 lg:px-20 bg-[#FAFBFD]"
    >
      {/* Structural layout row matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-14 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-start text-left">
          {/* Accent Badge */}
          <div className="bg-[#1A2540] text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 flex items-center gap-1.5 shadow-sm">
            Reviews
          </div>

          <RevealTitle
            segments="Success Stories."
            className="text-[#1A2540] font-sans font-bold text-4xl sm:text-5xl lg:text-5.5xl tracking-tight leading-none"
          />
        </div>

        {/* Right strategic description */}
        <div className="flex items-center h-full md:pt-10 text-left">
          <p className="text-slate-600 font-sans text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-lg">
            Discover how our flexible method helps innovative brands grow smarter and faster.
          </p>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch relative z-10">
        
        {/* Left Column: Premium Dark Score Card (Spans full height) */}
        <div
          className="lg:col-span-4 relative overflow-hidden bg-[#121A2E] rounded-[32px] p-7 sm:p-9 flex flex-col justify-between text-left shadow-lg border border-[#1E294B] min-h-[440px] lg:min-h-full"
          id="testimonials-summary-card"
        >
          {/* Glowing Neon wave vector or gradient element inside card */}
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden rounded-[32px]">
            <svg viewBox="0 0 400 600" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M-50 450 C30 400, 120 250, 200 350 S320 500, 450 400"
                stroke="#3B82F6"
                strokeWidth="28"
                strokeLinecap="round"
                className="blur-3xl"
              />
              <path
                d="M-50 450 C30 400, 120 250, 200 350 S320 500, 450 400"
                stroke="#FF6230"
                strokeWidth="10"
                strokeLinecap="round"
                className="blur-2xl"
              />
            </svg>
          </div>

          {/* Top block */}
          <div className="relative z-10">
            <div className="flex justify-between items-start gap-4">
              <span className="text-white font-sans font-black text-4xl sm:text-5.5xl tracking-tight">
                4.7/5
              </span>
              <p className="text-slate-350 font-sans text-xs sm:text-sm opacity-100 color-white leading-snug font-medium max-w-[160px]">
                We've delivered 100+ projects that drive real results.
              </p>
            </div>
          </div>

          {/* Bottom block */}
          <div className="relative z-10 mt-12 space-y-6">
            
            {/* User face overlapping list and tag */}
            <div className="space-y-3 pt-6 border-t border-slate-800/80">
              <div className="flex -space-x-3">
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-[#121A2E] object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=85"
                  alt="Reviewer face"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-[#121A2E] object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=85"
                  alt="Reviewer face"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-[#121A2E] object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=85"
                  alt="Reviewer face"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-[#121A2E] object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=85"
                  alt="Reviewer face"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-white font-sans font-semibold text-xs tracking-tight">
                  Trusted by +50 Customers
                </span>
                <span className="text-slate-400 font-sans text-[11px] mt-0.5 font-normal">
                  They've hit their target - You're next
                </span>
              </div>
            </div>

            {/* Leave a review orange button */}
            <button
              onClick={() => setReviewModalOpen(true)}
              className="w-full py-3.5 bg-[#FF6230] hover:bg-[#ff7548] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-full shadow-[0_4px_16px_rgba(255,98,48,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Leave a review</span>
            </button>
          </div>

        </div>

        {/* Right Columns: Four Card Grid (2 Columns, 2 Rows) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="testimonials-bubbles-grid">
          {testimonials.map((test) => (
            <div
              key={test.id}
              className="flex flex-col rounded-[26px] bg-[#E4E9F2]/60 p-3.5 border border-slate-200/40 shadow-2xs text-left"
            >
              {/* White capsule containing rates and description text */}
              <div className="bg-white p-6 rounded-2xl flex flex-col justify-between items-start flex-grow shadow-3xs border border-[#F0F2F6]">
                <div className="flex items-center gap-1.5 md:gap-2 mb-4.5">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide">
                    {test.rating}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wide text-slate-400 capitalize">
                    rating
                  </span>
                </div>

                <p className="text-[#1A2540] font-sans text-xs sm:text-sm font-semibold leading-relaxed tracking-tight select-none flex-grow">
                  "{test.text}"
                </p>
              </div>

              {/* Bottom bar holding avatar, author name, and subtitle */}
              <div className="mt-3 px-4 py-2 flex items-center gap-3">
                <img
                  className="w-9 h-9 rounded-full object-cover border border-slate-200/60 shadow-2xs"
                  src={test.avatarUrl}
                  alt={test.author}
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[#1A2540] font-sans font-bold text-xs sm:text-sm">
                    {test.author}
                  </span>
                  <span className="text-slate-400 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5">
                    {test.role}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Write a Review slide over popup representation */}
      <AnimatePresence>
        {reviewModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModalOpen(false)}
              className="fixed inset-0 bg-[#1A2540]/50 backdrop-blur-xs z-50 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-[20%] max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-50 border border-slate-100 text-left"
              id="write-review-dialog-overlay"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <MessageSquareCode className="w-5 h-5 text-[#FF6230]" />
                  <h3 className="text-[#1A2540] font-sans font-extrabold text-lg tracking-tight">
                    Submit Your Success Story
                  </h3>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {reviewSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-3.5 my-4"
                >
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-emerald-900 font-sans font-bold text-md">
                    Review Broadcasted!
                  </h4>
                  <p className="text-emerald-700 font-sans text-xs">
                    Thank you, {reviewerName}. Your testimonial is stored securely. We appreciate your valuable partnership feedback.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  
                  {/* Rating Selector */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-slate-600 font-sans text-xs font-semibold uppercase tracking-wider">
                      Your Rating Choice
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= userRating
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-slate-600 font-sans text-xs font-semibold uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Marcus Lawrance"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>

                  {/* Role / Job Title */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-slate-600 font-sans text-xs font-semibold uppercase tracking-wider">
                      Business Role & Company
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerRole}
                      onChange={(e) => setReviewerRole(e.target.value)}
                      placeholder="CEO REAL BUCKET"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>

                  {/* Text Description */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-slate-600 font-sans text-xs font-semibold uppercase tracking-wider">
                      Your Experience
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Fabulous design and blazing fast build execution rates..."
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>

                  {/* Disclaimer notice */}
                  <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-350" />
                    <span>Submitted reviews will immediately be rendered onto the client list array as dynamic assets.</span>
                  </div>

                  {/* Submit code */}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#FF6230] hover:bg-[#ff7548] text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish Real Review
                  </button>

                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </section>
  );
}
