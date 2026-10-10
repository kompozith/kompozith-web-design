import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#FAFBFD] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6230]">
          404
        </span>
        <h1 className="mt-4 font-sans font-black text-4xl sm:text-5xl tracking-tight text-[#1A2540]">
          Page not found
        </h1>
        <p className="mt-4 text-slate-500 font-sans text-base leading-relaxed">
          The page you were looking for has moved, or never existed.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1A2540] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#243357]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Kompozith
        </Link>
      </div>
    </div>
  );
}
