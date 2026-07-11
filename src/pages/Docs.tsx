import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Video, Wifi, Sparkles, Shield, Users, Settings, CreditCard, LifeBuoy, BookOpen, Zap } from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  {
    icon: Zap,
    color: "text-signal-300",
    bg: "bg-signal-500/15",
    title: "Getting Started",
    articles: [
      { title: "Creating your first meeting", read: "2 min" },
      { title: "Joining a meeting as a guest", read: "1 min" },
      { title: "Setting up your profile", read: "2 min" },
      { title: "Inviting team members", read: "3 min" },
    ],
  },
  {
    icon: Wifi,
    color: "text-pulse-400",
    bg: "bg-pulse-400/15",
    title: "Smart Connection",
    articles: [
      { title: "How Smart Connection works", read: "4 min" },
      { title: "Understanding the bandwidth indicator", read: "2 min" },
      { title: "Low Data Mode for mobile networks", read: "3 min" },
      { title: "Troubleshooting connection drops", read: "5 min" },
    ],
  },
  {
    icon: Sparkles,
    color: "text-signal-300",
    bg: "bg-signal-500/15",
    title: "AI Notes & Transcription",
    articles: [
      { title: "Enabling AI notes for a meeting", read: "2 min" },
      { title: "Reading your AI-generated summary", read: "3 min" },
      { title: "Searching past meeting transcripts", read: "2 min" },
      { title: "Exporting summaries and action items", read: "3 min" },
      { title: "Asking the AI assistant questions", read: "4 min" },
    ],
  },
  {
    icon: Video,
    color: "text-coral-400",
    bg: "bg-coral-400/15",
    title: "Meetings",
    articles: [
      { title: "Scheduling a recurring meeting", read: "3 min" },
      { title: "Using the waiting room", read: "2 min" },
      { title: "Password-protecting a meeting", read: "1 min" },
      { title: "Screen sharing and presenting", read: "4 min" },
      { title: "Recording a meeting", read: "3 min" },
      { title: "Co-hosting and host controls", read: "4 min" },
    ],
  },
  {
    icon: Shield,
    color: "text-pulse-400",
    bg: "bg-pulse-400/15",
    title: "Security & Privacy",
    articles: [
      { title: "Two-factor authentication setup", read: "3 min" },
      { title: "Managing recording consent", read: "4 min" },
      { title: "Data retention and deletion", read: "3 min" },
      { title: "SSO configuration (Business plan)", read: "8 min" },
    ],
  },
  {
    icon: Users,
    color: "text-signal-300",
    bg: "bg-signal-500/15",
    title: "Team & Admin",
    articles: [
      { title: "Adding and removing team members", read: "3 min" },
      { title: "Setting admin roles", read: "4 min" },
      { title: "Viewing meeting analytics", read: "5 min" },
      { title: "Managing usage limits", read: "3 min" },
    ],
  },
  {
    icon: CreditCard,
    color: "text-coral-400",
    bg: "bg-coral-400/15",
    title: "Billing & Plans",
    articles: [
      { title: "Comparing Starter, Pro, and Business", read: "3 min" },
      { title: "Upgrading or downgrading your plan", read: "2 min" },
      { title: "Updating payment information", read: "2 min" },
      { title: "Cancelling your subscription", read: "2 min" },
      { title: "Requesting a refund", read: "3 min" },
    ],
  },
  {
    icon: Settings,
    color: "text-void-300",
    bg: "bg-void-500/15",
    title: "Account & Settings",
    articles: [
      { title: "Changing your email or password", read: "2 min" },
      { title: "Notification preferences", read: "2 min" },
      { title: "Deleting your account", read: "3 min" },
      { title: "Accessibility settings", read: "3 min" },
    ],
  },
];

const popularArticles = [
  "How Smart Connection works",
  "Enabling AI notes for a meeting",
  "Recording a meeting",
  "Comparing Starter, Pro, and Business",
  "Joining a meeting as a guest",
  "Troubleshooting connection drops",
];

function ArticleRow({ title, read }: { title: string; read: string }) {
  return (
    <li>
      <a
        href="#"
        className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-overlay"
      >
        <span className="text-sm text-void-200 group-hover:text-white transition-colors">{title}</span>
        <div className="flex items-center gap-2 text-xs text-void-500">
          <span>{read} read</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </a>
    </li>
  );
}

export default function Docs() {
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const filtered = query.trim()
    ? categories.map((c) => ({
        ...c,
        articles: c.articles.filter((a) =>
          a.title.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter((c) => c.articles.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-void-900">
      <Nav />

      {/* Hero */}
      <section className="relative border-b border-white/5 bg-void-950/50 py-20 text-center">
        <div className="absolute inset-0 bg-orbit-radial opacity-50" />
        <div className="relative mx-auto max-w-2xl px-6">
          <div className="mb-3 flex justify-center">
            <BookOpen className="h-8 w-8 text-signal-300" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-white">NexaMeet Help Center</h1>
          <p className="mt-3 text-void-300">
            Guides, references, and answers for everything NexaMeet.
          </p>
          {/* Search */}
          <div className="relative mx-auto mt-8 max-w-lg">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-void-500" />
            <input
              type="text"
              placeholder="Search documentation…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-raised py-3 pl-11 pr-4 text-sm text-white placeholder:text-void-500 focus:border-signal-400 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Popular */}
        {!query && (
          <div className="mb-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-void-500">Popular articles</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {popularArticles.map((a) => (
                <a
                  key={a}
                  href="#"
                  className="group flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised/40 px-4 py-3.5 transition-colors hover:border-signal-400/50 hover:bg-surface-raised"
                >
                  <LifeBuoy className="h-4 w-4 shrink-0 text-signal-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="text-sm text-void-200 group-hover:text-white transition-colors">{a}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Category grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => {
            const Icon = cat.icon;
            const isOpen = openCategory === cat.title;

            return (
              <div
                key={cat.title}
                className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/40"
              >
                <button
                  className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-overlay"
                  onClick={() => setOpenCategory(isOpen ? null : cat.title)}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bg}`}>
                    <Icon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{cat.title}</p>
                    <p className="text-xs text-void-400">{cat.articles.length} articles</p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-void-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {(isOpen || !!query) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-surface-border"
                    >
                      <ul className="px-3 py-3">
                        {cat.articles.map((a) => (
                          <ArticleRow key={a.title} title={a.title} read={a.read} />
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Still need help */}
        <div className="mt-16 rounded-2xl border border-surface-border bg-surface-raised/30 p-8 text-center">
          <LifeBuoy className="mx-auto h-8 w-8 text-signal-300" />
          <h3 className="mt-3 font-display text-lg font-semibold text-white">Still need help?</h3>
          <p className="mt-2 text-sm text-void-300">
            Our support team is available Monday–Friday, 9 am–6 pm UTC.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="mailto:support@nexameet.dev"
              className="rounded-lg border border-surface-border bg-surface-raised px-4 py-2.5 text-void-200 transition-colors hover:border-signal-400/50 hover:text-white"
            >
              Email support
            </a>
            <Link
              to="/join"
              className="rounded-lg border border-signal-400/40 bg-signal-500/10 px-4 py-2.5 text-signal-300 transition-colors hover:bg-signal-500/20"
            >
              Live chat with support
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
