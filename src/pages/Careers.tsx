import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const PERKS = [
  { icon: "🌍", title: "Fully remote", body: "Work from anywhere. We have teammates across 12 countries." },
  { icon: "🏥", title: "Great benefits", body: "Full health, dental, and vision. $1,500 annual wellness budget." },
  { icon: "📚", title: "Learning budget", body: "$2,000/year for courses, books, or conferences." },
  { icon: "🏖️", title: "Unlimited PTO", body: "We trust you. Minimum 15 days/year encouraged." },
  { icon: "💻", title: "Top-tier equipment", body: "MacBook Pro + $500 home office stipend on day one." },
  { icon: "📈", title: "Equity", body: "Everyone gets meaningful stock options. We grow together." },
];

const ROLES = [
  {
    title: "Senior Frontend Engineer",
    team: "Engineering",
    location: "Remote · Worldwide",
    type: "Full-time",
    description: "Help us build the smoothest video conferencing UI on the web. React, TypeScript, and a passion for performance.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote · Worldwide",
    type: "Full-time",
    description: "Own the end-to-end design of new features, from concept to polished UI. Deep Figma skills required.",
  },
  {
    title: "Backend Engineer — Real-time",
    team: "Engineering",
    location: "Remote · US / EU",
    type: "Full-time",
    description: "Scale our WebRTC infrastructure to handle millions of concurrent participants without breaking a sweat.",
  },
  {
    title: "AI/ML Engineer",
    team: "AI",
    location: "Remote · Worldwide",
    type: "Full-time",
    description: "Build and improve our meeting transcription, summarization, and action-item extraction models.",
  },
  {
    title: "Growth Marketer",
    team: "Marketing",
    location: "Remote · US",
    type: "Full-time",
    description: "Drive product-led growth through SEO, content, and experiment-driven campaigns.",
  },
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-void-900">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-orbit-radial opacity-60" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <FadeIn>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-void-500">Join the team</p>
            <h1 className="font-display text-4xl font-semibold text-white md:text-5xl">
              Build the future of <span className="text-gradient">remote work.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-void-300 leading-relaxed">
              We're a small, focused team on a big mission: make every meeting feel effortless, no matter where you are or what your connection looks like.
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-void-400">
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-signal-300" /> 28 people</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-pulse-400" /> 12 countries</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-coral-400" /> Series A</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-white/5 bg-void-950/60 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-void-500">Why NexaMeet</p>
            <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">Perks & benefits</h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((perk, i) => (
              <FadeIn key={perk.title} delay={i * 0.07}>
                <div className="rounded-2xl border border-surface-border bg-surface-card p-6">
                  <p className="text-2xl">{perk.icon}</p>
                  <h3 className="mt-3 font-semibold text-white">{perk.title}</h3>
                  <p className="mt-1.5 text-sm text-void-300 leading-relaxed">{perk.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-void-500">Now hiring</p>
          <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">Open roles</h2>
        </FadeIn>
        <div className="mt-10 divide-y divide-surface-border">
          {ROLES.map((role, i) => (
            <FadeIn key={role.title} delay={i * 0.06}>
              <div className="group flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white group-hover:text-signal-300 transition-colors">{role.title}</h3>
                    <span className="rounded-full bg-signal-500/10 px-2.5 py-0.5 text-xs font-medium text-signal-300">{role.team}</span>
                  </div>
                  <p className="mt-1 text-sm text-void-300">{role.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-void-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {role.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {role.type}</span>
                  </div>
                </div>
                <a href="mailto:jobs@nexameet.dev?subject=Application: {role.title}">
                  <Button variant="secondary" size="sm" className="shrink-0">
                    Apply <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn>
          <p className="mt-8 text-sm text-void-400">
            Don't see a role that fits? Send us a note at{" "}
            <a href="mailto:jobs@nexameet.dev" className="text-signal-300 hover:text-white transition-colors underline underline-offset-4">
              jobs@nexameet.dev
            </a>
            . We love hearing from great people.
          </p>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
