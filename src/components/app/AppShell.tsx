import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarPlus, History, Search, Settings, LogOut, Menu, X, Bell, User,
  CalendarCheck, Video, AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { auth, notifications as notificationsApi } from "@/lib/backend";
import { cn } from "@/lib/utils";

type Notification = { id: string; type: string; title: string; time: string; read: boolean };

function notifIcon(type: string) {
  if (type === "meeting") return <Video className="h-3.5 w-3.5 text-primary" />;
  if (type === "reminder") return <CalendarCheck className="h-3.5 w-3.5 text-success" />;
  return <AlertCircle className="h-3.5 w-3.5 text-text-muted" />;
}

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
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);

  async function openNotifs() {
    try {
      const data = await notificationsApi.list();
      setNotifs(data);
    } catch { /* silently ignore */ }
    setNotifsLoaded(true);
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silently ignore */ }
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

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
            <DropdownMenu onOpenChange={(open) => { if (open) openNotifs(); }}>
              <DropdownMenuTrigger asChild>
                <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text">
                  <Bell className="h-4 w-4" />
                  {(unreadCount > 0 || !notifsLoaded) && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold text-text">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {!notifsLoaded ? (
                    <p className="px-4 py-6 text-center text-sm text-text-muted">Loading…</p>
                  ) : notifs.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <Bell className="h-6 w-6 text-text-muted opacity-40" />
                      <p className="text-sm text-text-muted">No notifications yet</p>
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 border-b border-border px-4 py-3 last:border-0",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                          {notifIcon(n.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm", !n.read ? "font-medium text-text" : "text-text-muted")}>
                            {n.title}
                          </p>
                          {n.time && (
                            <p className="mt-0.5 text-xs text-text-muted">{n.time}</p>
                          )}
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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
