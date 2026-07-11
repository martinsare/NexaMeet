import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";
import { Globe, MessageCircleMore, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-void-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-void-300">
              Meet smarter. Connect faster. Adaptive video meetings with AI notes built in.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border text-void-300 hover:border-signal-400 hover:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><a href="/#features" className="hover:text-white">Features</a></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><a href="/#faq" className="hover:text-white">FAQ</a></li>
              <li><Link to="/join" className="hover:text-white">Join a meeting</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Get the app</h4>
            <ul className="mt-4 space-y-3 text-sm text-void-300">
              <li><span className="opacity-60">iOS — coming soon</span></li>
              <li><span className="opacity-60">Android — coming soon</span></li>
              <li><span className="opacity-60">Desktop — coming soon</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-void-400 md:flex-row">
          <p>© 2026 NexaMeet. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
