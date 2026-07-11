import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";
import { X, AtSign, Share2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-void-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-void-300">
              Meet smarter. Connect faster. Adaptive video meetings with AI notes built in.
            </p>
            <div className="mt-6 flex gap-3">
              {[X, AtSign, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border text-void-300 hover:border-signal-400 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing"  className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/docs"     className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/join"     className="hover:text-white transition-colors">Join a meeting</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="mailto:hello@nexameet.dev" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Get the app */}
          <div>
            <h4 className="text-sm font-semibold text-white">Get the app</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><span className="opacity-50">iOS — coming soon</span></li>
              <li><span className="opacity-50">Android — coming soon</span></li>
              <li><span className="opacity-50">Desktop — coming soon</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-void-400 md:flex-row">
          <p>© 2026 NexaMeet, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms"   className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:security@nexameet.dev" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
