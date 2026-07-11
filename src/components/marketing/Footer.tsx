import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";
import { X, AtSign, Share2 } from "lucide-react";


export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-raised">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-text-muted">
              Meet smarter. Connect faster. Adaptive video meetings with AI notes built in.
            </p>
            <div className="mt-6 flex gap-3">
              {[X, AtSign, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-text">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li><Link to="/features" className="hover:text-text transition-colors">Features</Link></li>
              <li><Link to="/pricing"  className="hover:text-text transition-colors">Pricing</Link></li>
              <li><Link to="/docs"     className="hover:text-text transition-colors">Documentation</Link></li>
              <li><Link to="/join"     className="hover:text-text transition-colors">Join a meeting</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-text">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li><Link to="/about" className="hover:text-text transition-colors">About</Link></li>
              <li><Link to="/careers" className="hover:text-text transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-text transition-colors">Blog</Link></li>
              <li><a href="mailto:hello@nexameet.dev" className="hover:text-text transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Get the app */}
          <div>
            <h4 className="text-sm font-semibold text-text">Get the app</h4>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li><span className="opacity-50">iOS — coming soon</span></li>
              <li><span className="opacity-50">Android — coming soon</span></li>
              <li><span className="opacity-50">Desktop — coming soon</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-text-muted md:flex-row">
          <p> 2026 NexaMeet, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-text transition-colors">Privacy</Link>
            <Link to="/terms"   className="hover:text-text transition-colors">Terms</Link>
            <a href="mailto:security@nexameet.dev" className="hover:text-text transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
