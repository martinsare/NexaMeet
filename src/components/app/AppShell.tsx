import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarPlus, History, Search, Settings, LogOut, Menu, X, Bell, User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/backend";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedule",  label: "Schedule",  icon: CalendarPlus },
  { to: "/history",   label: "History",   icon: History },
  { to: "/search",    label: "Search",    icon: Search },
  { to: "/settings",  label: "Settings",  icon: Settings },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { session } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await auth.signOut();
    navigate("/");
  }

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-0.5 px-2">
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:bg-surface-raised hover:text-text"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="px-5 py-5">
          <Link to="/dashboard"><Logo /></Link>
        </div>
        <NavList />
        <div className="p-4">
          <button
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-raised"
          >
            <Avatar src={session?.user.avatarUrl} name={session?.user.name ?? "You"} className="h-7 w-7" />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-text">{session?.user.name ?? "Account"}</p>
              <p className="truncate text-xs text-text-muted">{session?.user.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-56 flex-col bg-background border-r border-border p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onClick={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-text-muted hover:text-text" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            {title && <h1 className="font-display text-base font-semibold text-text">{title}</h1>}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text">
                  <User className="h-4 w-4" />
                </button>
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

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
