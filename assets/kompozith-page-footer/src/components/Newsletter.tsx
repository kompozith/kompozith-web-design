import React, { useState } from "react";
import { ArrowUpRight, Check, Send, AlertCircle } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      setErrorMessage("Please enter an email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // Simulate sending to newsletter list
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
    <div className="flex flex-col space-y-4 max-w-sm w-full" id="newsletter-block">
      <div>
        <h3 className="font-display font-medium text-white text-lg tracking-tight">
          Stay updated
        </h3>
        <p className="text-neutral-400 text-sm font-light mt-1 leading-relaxed">
          Subscribe to our newsletter for insights, updates, and exclusive content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full" id="newsletter-form">
        <div className="relative flex items-center">
          <input
            type="email"
            value={email}
            disabled={status === "loading" || status === "success"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Enter your email"
            className="w-full bg-[#0a0a0a] text-neutral-200 placeholder-neutral-500 text-sm font-light pl-5 pr-14 py-3.5 rounded-full border border-neutral-800 focus:border-[#ff4e17] focus:outline-none focus:ring-2 focus:ring-[#ff4e17]/20 transition-all duration-300"
          />

          {/* Action Button inside input field */}
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={`absolute right-1.5 p-2 rounded-full flex items-center justify-center transition-all duration-300 ${
              status === "success"
                ? "bg-green-600 text-white"
                : "bg-[#ff4e17] text-white hover:bg-[#ff6838] active:scale-95"
            } disabled:cursor-not-allowed`}
            style={{ width: "40px", height: "40px" }}
            aria-label="Subscribe"
          >
            {status === "loading" ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : status === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </button>
        </div>

        {/* Status Feedbacks */}
        {status === "error" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#ff4e17] pl-3 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-500 pl-3 animate-fade-in font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Success! Welcome to Kompozith updates.</span>
          </div>
        )}
      </form>
    </div>
  );
}
