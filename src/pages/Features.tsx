import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Wifi, Sparkles, Shield, Share2, Search,
  ArrowRight, Check, Video, MousePointerClick, MessageSquare, Star,
} from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { productFeatures, testimonials } from "@/lib/data/content";

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const iconMap: Record<string, React.ElementType> = {
  zap: Zap, signal: Wifi, sparkles: Sparkles, shield: Shield, share2: Share2, search: Search,
};

const iconGradients = [
  "from-primary/40 to-primary/20",
  "from-success/40 to-success/20",
  "from-border/40 to-primary/20",
  "from-destructive/40 to-destructive/20",
  "from-primary/40 to-success/20",
  "from-border/40 to-primary/20",
];

const topAccents = [
  "via-primary/40",
  "via-success/40",
  "via-border/40",
  "via-destructive/40",
  "via-primary/30",
  "via-success/30",
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Nav />

      {/* PAGE HEADER */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0  opacity-60" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <FadeIn>
            <Badge className="mx-auto mb-6">Everything you need</Badge>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-text md:text-6xl">
              Built for teams that<br />
              <span className="">actually meet.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
              Every feature in NexaMeet is obsessed over for one reason: to make the meeting disappear so the work can happen.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/join")}>
                Join a meeting
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* BENTO FEATURE GRID */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <p className="mb-12 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Core capabilities
          </p>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {productFeatures.map((f, i) => {
            const Icon = iconMap[f.icon];
            const spanTwo = i === 0 || i === 3 || i === 4;
            return (
              <FadeIn key={f.title} delay={i * 0.07} className={spanTwo ? "md:col-span-2" : "md:col-span-1"}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface-raised/40 p-7 transition-colors hover:border-border">
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${topAccents[i]} to-transparent`} />
                  <span className="pointer-events-none absolute right-5 top-1 select-none font-display text-8xl font-bold leading-none text-text/[0.04]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradients[i]} shadow-lg transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5 text-text" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-text">{f.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">{f.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* SMART CONNECTION SPOTLIGHT */}
      <section className="relative border-y border-border bg-surface-raised/60 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          <FadeIn>
            <Badge variant="pulse" className="mb-4"><Wifi className="h-3 w-3" /> Core feature</Badge>
            <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">
              Smart Connection adapts before you notice a problem.
            </h2>
            <p className="mt-4 text-text-muted">
              NexaMeet reads your bandwidth, jitter, and packet loss every few seconds and quietly shifts between HD, SD, Low Data Mode, and Audio-only — recovering automatically if you drop off entirely.
            </p>
            <ul className="mt-6 space-y-3">
              {["Live bandwidth indicator, always visible", "Auto recovery after connection loss", "Low Data Mode for rural & mobile networks"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-text">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.15}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">Live network diagnostics</span>
                <Badge variant="pulse">Stable</Badge>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Video quality", value: "HD 1080p", pct: 92, color: "bg-success" },
                  { label: "Bandwidth", value: "3.4 Mbps", pct: 68, color: "bg-primary" },
                  { label: "Packet loss", value: "0.2%", pct: 8, color: "bg-destructive" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex justify-between text-xs text-text-muted">
                      <span>{row.label}</span><span className="text-text">{row.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <motion.div
                        className={`h-full rounded-full ${row.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* AI ASSISTANT SPOTLIGHT */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <FadeIn className="order-2 md:order-1">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                <Sparkles className="h-4 w-4 text-primary" /> AI Assistant
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-surface-raised/60 p-3 text-sm text-text-muted">"Summarize today's meeting."</div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-text">
                  Team aligned on shipping Smart Connection to 100% of users by July 18. Priya owns the bandwidth-indicator copy; Tom is drafting the AI notes beta invite.
                </div>
                <div className="rounded-xl bg-surface-raised/60 p-3 text-sm text-text-muted">"Who agreed to finish the report?"</div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-text">
                  Diego Marín — due before Friday's sync.
                </div>
              </div>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1} className="order-1 md:order-2">
            <Badge className="mb-4"> Biggest differentiator</Badge>
            <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">
              Stop taking notes. NexaMeet already did.
            </h2>
            <p className="mt-4 text-text-muted">
              Live transcription and speaker recognition during the call. Summaries, decisions, and action items the second it ends. Then just ask.
            </p>
            <ul className="mt-6 space-y-3">
              {["Live captions & transcription", "Decisions and action items auto-tagged", "Ask the AI anything about any past meeting"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-text">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-surface-raised/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">From link to live in three taps.</h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: MousePointerClick, step: "01", title: "Create or join", text: "Start an instant meeting or open an invite link — no download required." },
              { icon: Video, step: "02", title: "Meet, adaptively", text: "Smart Connection keeps you visible and audible no matter the network." },
              { icon: MessageSquare, step: "03", title: "Get the recap", text: "AI notes, decisions, and action items land in your inbox automatically." },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-border bg-surface-raised/40 p-7">
                  <span className="font-display text-4xl font-semibold text-primary/30">{s.step}</span>
                  <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-text">{s.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{s.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto mb-4">Loved by teams</Badge>
          <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">Teams stop noticing the meeting tool.</h2>
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/60 to-surface-raised/20 p-7 transition-colors hover:border-border">
                <span className="pointer-events-none absolute right-5 top-3 select-none font-display text-8xl font-bold leading-none text-primary/10 transition-colors group-hover:text-primary/15">"</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-success text-success" />
                  ))}
                </div>
                <p className="relative mt-4 flex-1 text-sm leading-relaxed text-text">"{t.quote}"</p>
                <div className="my-5 h-px bg-gradient-to-r from-surface-border to-transparent" />
                <div className="flex items-center gap-3">
                  <Avatar src={t.avatarUrl} name={t.name} className="ring-2 ring-primary/20" />
                  <div>
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-12 text-center">
            <div className="absolute inset-0 noise-overlay" />
            <h2 className="relative font-display text-3xl font-semibold text-text md:text-4xl">
              See it for yourself.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-text/80">
              Start a free meeting in seconds. No credit card required.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="bg-text text-background hover:bg-text/90"
                onClick={() => navigate("/signup")}
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
