import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, User } from "lucide-react";

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const POSTS = [
  {
    tag: "Product",
    tagColor: "text-signal-300 bg-signal-300/10",
    title: "Introducing Smart Connection 2.0: stay in HD even on 2G",
    excerpt: "Our adaptive bitrate engine just got a major upgrade. Here's how we cut connection-related drops by 78% — and what it means for your next call.",
    author: "Leila Nassar",
    date: "July 8, 2026",
    readTime: "6 min read",
    avatar: "LN",
    featured: true,
  },
  {
    tag: "Engineering",
    tagColor: "text-pulse-400 bg-pulse-400/10",
    title: "How we built real-time transcription for 10,000 concurrent meetings",
    excerpt: "Scaling Whisper-based transcription without burning the budget required rethinking our entire queue architecture.",
    author: "Tomás Reyes",
    date: "June 28, 2026",
    readTime: "9 min read",
    avatar: "TR",
    featured: false,
  },
  {
    tag: "Tips",
    tagColor: "text-coral-400 bg-coral-400/10",
    title: "7 ways to run meetings that people actually want to attend",
    excerpt: "Meeting fatigue is real. Here's how high-performing teams are using async video and AI notes to cut meeting time by 40%.",
    author: "Anya Patel",
    date: "June 20, 2026",
    readTime: "5 min read",
    avatar: "AP",
    featured: false,
  },
  {
    tag: "Product",
    tagColor: "text-signal-300 bg-signal-300/10",
    title: "AI meeting summaries are now searchable across your entire history",
    excerpt: "Find anything from any meeting, ever. Our new semantic search understands context — not just keywords.",
    author: "Marcus Webb",
    date: "June 12, 2026",
    readTime: "4 min read",
    avatar: "MW",
    featured: false,
  },
  {
    tag: "Company",
    tagColor: "text-violet-400 bg-violet-400/10",
    title: "NexaMeet raises $12M Series A to redefine remote collaboration",
    excerpt: "We're thrilled to share that NexaMeet has raised a $12M Series A. Here's what we're building next.",
    author: "Jordan Park",
    date: "May 30, 2026",
    readTime: "3 min read",
    avatar: "JP",
    featured: false,
  },
  {
    tag: "Engineering",
    tagColor: "text-pulse-400 bg-pulse-400/10",
    title: "End-to-end encryption in NexaMeet: a deep dive",
    excerpt: "Every meeting is encrypted by default. Here's exactly how we implemented E2EE without sacrificing performance.",
    author: "Leila Nassar",
    date: "May 18, 2026",
    readTime: "11 min read",
    avatar: "LN",
    featured: false,
  },
];

export default function Blog() {
  const featured = POSTS[0];
  const rest = POSTS.slice(1);

  return (
    <div className="min-h-screen bg-void-900">
      <Nav />

      {/* Hero */}
      <section className="border-b border-white/5 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-void-500">NexaMeet Blog</p>
            <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
              Product updates, engineering deep-dives,<br className="hidden md:block" /> and tips for better meetings.
            </h1>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Featured post */}
        <FadeIn>
          <div className="group relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card p-8 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${featured.tagColor}`}>{featured.tag}</span>
                  <span className="text-xs text-void-500">Featured</span>
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold text-white group-hover:text-signal-300 transition-colors md:text-2xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-void-300 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-void-500">
                  <span className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-signal-500/20 text-[9px] font-bold text-signal-300">{featured.avatar}</div>
                    {featured.author}
                  </span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readTime}</span>
                  <span>{featured.date}</span>
                </div>
                <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-signal-300 hover:opacity-80 transition-opacity">
                  Read post <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-500/20 to-pulse-400/20 text-5xl md:flex">
                📡
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Post grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <FadeIn key={post.title} delay={i * 0.07}>
              <div className="group flex h-full flex-col rounded-2xl border border-surface-border bg-surface-card p-6 transition-colors hover:border-signal-500/40">
                <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${post.tagColor}`}>{post.tag}</span>
                <h3 className="mt-3 font-semibold text-white leading-snug group-hover:text-signal-300 transition-colors flex-1">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-void-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-void-500 border-t border-surface-border pt-4">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-signal-500/20 text-[9px] font-bold text-signal-300">{post.avatar}</div>
                  <span>{post.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Newsletter */}
        <FadeIn>
          <div className="mt-16 rounded-3xl border border-surface-border bg-aurora p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-white">Stay in the loop</h2>
            <p className="mt-2 text-sm text-white/70">Get product updates and engineering posts in your inbox. No spam, ever.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/40 sm:w-72"
              />
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-void-900 hover:bg-white/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      <Footer />
    </div>
  );
}
