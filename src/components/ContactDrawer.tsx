import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  CheckCircle2,
  User,
  Globe,
  FileText,
} from "lucide-react";

interface ContactDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over enquiry form. Extracted from the home page so the case-study
 * pages can open the same drawer from their closing CTA.
 */
export default function ContactDrawer({ open, onClose }: ContactDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    budget: "medium",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      onClose();
      setFormData({ name: "", email: "", message: "", budget: "medium" });
    }, 4000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Blur Lockout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1A2540]/40 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Contact Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-7 md:p-9 flex flex-col justify-between overflow-y-auto border-l border-slate-100 text-left"
            id="contact-form-sidebar"
          >
            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#FF6230]" />
                  <h3 className="text-[#1A2540] font-sans font-black text-xl tracking-tight">
                    Start Your Project
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors duration-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-500 font-sans text-sm md:text-md mb-6 leading-relaxed">
                Tell us about your venture. Our creative digital engineers will
                get back to you with custom strategies in less than 2 hours.
              </p>

              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-4 my-8"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-emerald-900 font-sans font-bold text-lg leading-tight">
                    Proposal Submitted!
                  </h4>
                  <p className="text-emerald-700 font-sans text-sm">
                    Thank you {formData.name || "friend"}. We have received your
                    request and will contact you shortly on{" "}
                    <strong>{formData.email}</strong>.
                  </p>
                </motion.div>
              ) : (
                /* Form Fields */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name input */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Your beautiful name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-sm font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Email input */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-sm font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Budget radio groups */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider">
                      Estimated Budget Range
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "small", label: "< $5k" },
                        { key: "medium", label: "$5k - $15k" },
                        { key: "large", label: "$15k+" },
                      ].map((b) => {
                        const isSelected = formData.budget === b.key;
                        return (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, budget: b.key })
                            }
                            className={`py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-[#FF6230]/10 border-[#FF6230] text-[#FF6230]"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message input */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider">
                      Project Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Tell us what you have in mind..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF6230] focus:ring-1 focus:ring-[#FF6230] outline-none text-slate-800 text-sm font-medium transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#FF6230] hover:bg-[#ff7548] text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Strategy Inquiry
                  </button>
                </form>
              )}
            </div>

            {/* Drawer Footer Metrics */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#FF6230]" />
                <span>HQ: Europe London Time</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>NDAs Guaranteed</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
