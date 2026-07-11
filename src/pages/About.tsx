import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Sparkles, Wifi, Users } from "lucide-react";
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

const VALUES = [
  { icon: Wifi, title: "Connection first", body: "Bad wifi shouldn't mean a bad meeting. We built adaptive technology that keeps calls stable on any network.", color: "text-success bg-success/10" },
  { icon: Sparkles, title: "AI that earns its place", body: "We only add AI where it genuinely saves time — summaries, action items, and search. Not AI for the sake of it.", color: "text-primary bg-primary/10" },
  { icon: Users, title: "People over features", body: "Every decision starts with the person in the meeting. If it's not simpler for them, we don't ship it.", color: "text-destructive bg-destructive/10" },
  { icon: Video, title: "One link, everywhere", body: "No downloads, no plugins. A single link that works on any device in under three seconds.", color: "text-violet-400 bg-violet-400/10" },
];

const TEAM = [
  { name: "Jordan Park", role: "CEO & Co-founder", avatar: "JP" },
  { name: "Leila Nassar", role: "CTO & Co-founder", avatar: "LN" },
  { name: "Marcus Webb", role: "Head of Product", avatar: "MW" },
  { name: "Chloe Lin", role: "Head of Design", avatar: "CL" },
  { name: "Tomás Reyes", role: "Lead Engineer", avatar: "TR" },
  { name: "Anya Patel", role: "Head of Growth", avatar: "AP" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0  opacity-60" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <FadeIn>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">Our story</p>
            <h1 className="font-display text-4xl font-semibold text-text md:text-5xl">
              Built for the meeting that <span className="">actually matters.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted leading-relaxed">
              NexaMeet started in 2024 when a team of five engineers got tired of calls dropping right before the most important decision. So they rebuilt video conferencing from the network layer up.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-surface-raised/60 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { num: "4,000+", label: "teams worldwide" },
                { num: "98.9%", label: "uptime last 12 months" },
                { num: "<3s", label: "average join time" },
                { num: "2024", label: "founded" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-text">{s.num}</p>
                  <p className="mt-1 text-sm text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">What drives us</p>
          <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">Our values</h2>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.08}>
              <div className="rounded-2xl border border-border bg-surface-card p-6">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${v.color}`}>
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-text">{v.title}</h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">{v.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-border bg-surface-raised/60 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">The people</p>
            <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">Meet the team</h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {TEAM.map((member, i) => (
              <FadeIn key={member.name} delay={i * 0.07}>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-card p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 font-display text-lg font-semibold text-primary">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-text">{member.name}</p>
                    <p className="text-sm text-text-muted">{member.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <FadeIn>
          <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">Want to join us?</h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">We're always looking for great people. Check out our open roles.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/careers">
              <Button size="lg">View open roles</Button>
            </Link>
            <a href="mailto:hello@nexameet.dev">
              <Button size="lg" variant="secondary">Get in touch</Button>
            </a>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
