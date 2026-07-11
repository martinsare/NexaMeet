import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#faq", label: "FAQ" },
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
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-void-200 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" onClick={() => navigate("/join")}>
            Join a meeting
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Log in
          </Button>
          <Button size="sm" onClick={() => navigate("/signup")}>
            Sign up free
          </Button>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-void-900 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-void-200" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" onClick={() => navigate("/join")}>Join a meeting</Button>
              <Button variant="secondary" onClick={() => navigate("/login")}>Log in</Button>
              <Button onClick={() => navigate("/signup")}>Sign up free</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
