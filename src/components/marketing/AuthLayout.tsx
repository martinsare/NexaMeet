import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { PulseConnect } from "@/components/lottie/PulseConnect";
import type { ReactNode } from "react";

export function AuthLayout({ children, tagline }: { children: ReactNode; tagline?: string }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-surface-raised p-12 lg:flex">
        <div className="absolute inset-0 " />
        <Link to="/" className="relative z-10"><Logo /></Link>
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <PulseConnect className="h-80 w-80" />
        </div>
        <motion.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md text-text"
        >
          <p className="font-display text-xl leading-snug">
            {tagline ?? "\u201cWe stopped noticing the meeting tool. That's the whole point.\u201d"}
          </p>
          <footer className="mt-3 text-sm text-text-muted">Renée Okafor, COO at Fielder Logistics</footer>
        </motion.blockquote>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-20">
        <Link to="/" className="mb-10 lg:hidden"><Logo /></Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
