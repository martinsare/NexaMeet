import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { to: "/features", label: "Features" },
  { to: "/pricing",  label: "Pricing"  },
  { to: "/docs",     label: "Docs"     },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-void-200 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" onClick={() => navigate("/join")}>
            Join a meeting
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Log in
          </Button>
          <ThemeToggle />
          <Button size="sm" onClick={() => navigate("/signup")}>
            Sign up free
          </Button>
        </div>

        {/* Mobile: toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-void-300 hover:bg-white/5 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-void-900 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium text-void-200 hover:text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-border">
              <Button variant="secondary" onClick={() => { navigate("/join"); setOpen(false); }}>
                Join a meeting
              </Button>
              <Button variant="secondary" onClick={() => { navigate("/login"); setOpen(false); }}>
                Log in
              </Button>
              <Button onClick={() => { navigate("/signup"); setOpen(false); }}>
                Sign up free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
