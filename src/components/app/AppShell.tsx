import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarPlus, History, Search, Settings, LogOut, Menu, X, Bell, Video,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/backend";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedule", label: "Schedule", icon: CalendarPlus },
  { to: "/history", label: "History", icon: History },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await auth.signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-void-900">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-void-950 md:flex">
        <div className="px-6 py-6"><Link to="/dashboard"><Logo /></Link></div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-signal-500/15 text-white" : "text-void-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-4">
          <Button className="w-full" onClick={() => navigate("/schedule?instant=1")}>
            <Video className="h-4 w-4" /> Start instant meeting
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 bg-void-950 p-6">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-white" /></button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-void-200 hover:bg-white/5">
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 bg-void-900/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-white" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-void-300 hover:bg-white/5 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral-400" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar src={session?.user.avatarUrl} name={session?.user.name ?? "Guest"} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
