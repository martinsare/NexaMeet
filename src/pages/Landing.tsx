import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Wifi, Sparkles, Shield, Share2, Search, ArrowRight, Check,
  Video, MousePointerClick, MessageSquare, Star,
} from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PulseConnect } from "@/components/lottie/PulseConnect";
import { productFeatures, testimonials, pricingPlans, faqs } from "@/lib/data/demo-data";
import heroOrb from "@/assets/images/hero-orb.jpg";
import { useState } from "react";

const iconMap: Record<string, any> = { zap: Zap, signal: Wifi, sparkles: Sparkles, shield: Shield, share2: Share2, search: Search };

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

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-void-900 overflow-x-hidden">
      <Nav />

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-orbit-radial" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-20 md:grid-cols-2 md:pt-28">
          <FadeIn>
            <Badge variant="pulse" className="mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-pulse-400 animate-pulse" /> Live: Smart Connection 2.0
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl">
              Meet smarter.
              <br />
              <span className="text-gradient">Connect faster.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-void-200">
              NexaMeet joins in seconds, survives bad wifi with adaptive quality, and writes your meeting notes for you — so your team shows up and actually talks.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Start free meeting <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/join")}>
                <Video className="h-4 w-4" /> Join a meeting
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-void-300">
              <div className="flex -space-x-2">
                {testimonials.map((t, i) => (
                  <Avatar key={i} src={t.avatarUrl} name={t.name} className="ring-2 ring-void-900" />
                ))}
              </div>
              <p>Trusted by 4,000+ teams already meeting smarter</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="relative">
            {/* Outer wrapper — no clip so badges can overflow */}
            <div className="relative mx-auto aspect-square max-w-md">
              {/* Image + animation clipped to rounded shape */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <img src={heroOrb} alt="" className="h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PulseConnect className="h-72 w-72" />
                </div>
              </div>
              {/* Floating badges — outside the clip */}
              <motion.div
                className="absolute -left-6 top-8 rounded-xl border border-surface-border bg-surface-raised/90 px-4 py-3 shadow-glow backdrop-blur"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <p className="text-xs text-void-300">Connection</p>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-pulse-400"><Wifi className="h-3.5 w-3.5" /> HD · Stable</p>
              </motion.div>
              <motion.div
                className="absolute -right-4 bottom-10 rounded-xl border border-surface-border bg-surface-raised/90 px-4 py-3 shadow-glow backdrop-blur"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity }}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold text-signal-300"><Sparkles className="h-3.5 w-3.5" /> AI notes ready</p>
                <p className="text-xs text-void-300">3 action items found</p>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* LOGOS / STRIP */}
      <section className="border-y border-white/5 bg-void-950/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-4 px-6 text-void-500">
          {["Fielder Logistics", "Northpeak", "GreenRoute", "Meridian Co.", "Aurea Labs"].map((n) => (
            <span key={n} className="font-display text-sm tracking-wide">{n}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto mb-4">Why NexaMeet</Badge>
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Everything a meeting needs. Nothing it doesn't.</h2>
          <p className="mt-4 text-void-300">Six things NexaMeet obsesses over so your team never has to.</p>
        </FadeIn>

        {/* Bento grid: alternating wide/narrow */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {productFeatures.map((f, i) => {
            const Icon = iconMap[f.icon];
            const iconGradients = [
              "from-signal-600 to-signal-800",
              "from-pulse-600 to-pulse-800",
              "from-void-500 to-signal-700",
              "from-coral-500 to-coral-700",
              "from-signal-500 to-pulse-600",
              "from-void-400 to-signal-600",
            ];
            const topAccents = [
              "via-signal-400/70",
              "via-pulse-400/70",
              "via-void-300/50",
              "via-coral-400/70",
              "via-signal-300/60",
              "via-pulse-300/60",
            ];
            // bento: 2+1, 1+2, 1+2
            const spanTwo = i === 0 || i === 3 || i === 4;
            return (
              <FadeIn
                key={f.title}
                delay={i * 0.07}
                className={spanTwo ? "md:col-span-2" : "md:col-span-1"}
              >
                <div className="group relative h-full overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/40 p-7 transition-colors hover:border-white/20">
                  {/* Top gradient accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${topAccents[i]} to-transparent`} />
                  {/* Faded number watermark */}
                  <span className="pointer-events-none absolute right-5 top-1 select-none font-display text-8xl font-bold leading-none text-white/[0.04]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* Icon */}
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradients[i]} shadow-lg transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-void-300">{f.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* SMART CONNECTION SPOTLIGHT */}
      <section className="relative border-y border-white/5 bg-void-950/60 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          <FadeIn>
            <Badge variant="pulse" className="mb-4"><Wifi className="h-3 w-3" /> Core feature</Badge>
            <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Smart Connection adapts before you notice a problem.</h2>
            <p className="mt-4 text-void-300">
              NexaMeet reads your bandwidth, jitter, and packet loss every few seconds and quietly shifts between HD, SD, Low Data Mode, and Audio-only — recovering automatically if you drop off entirely.
            </p>
            <ul className="mt-6 space-y-3">
              {["Live bandwidth indicator, always visible", "Auto recovery after connection loss", "Low Data Mode for rural & mobile networks"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-void-100">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pulse-400/20 text-pulse-400"><Check className="h-3 w-3" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.15}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-void-200">Live network diagnostics</span>
                <Badge variant="pulse">Stable</Badge>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Video quality", value: "HD 1080p", pct: 92, color: "bg-pulse-400" },
                  { label: "Bandwidth", value: "3.4 Mbps", pct: 68, color: "bg-signal-400" },
                  { label: "Packet loss", value: "0.2%", pct: 8, color: "bg-coral-400" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex justify-between text-xs text-void-300">
                      <span>{row.label}</span><span className="text-white">{row.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
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

      {/* AI ASSISTANT */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <FadeIn className="order-2 md:order-1">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-void-200"><Sparkles className="h-4 w-4 text-signal-300" /> AI Assistant</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-void-950/60 p-3 text-sm text-void-200">"Summarize today's meeting."</div>
                <div className="rounded-xl border border-signal-400/30 bg-signal-500/10 p-3 text-sm text-void-100">
                  Team aligned on shipping Smart Connection to 100% of users by July 18. Priya owns the bandwidth-indicator copy; Tom is drafting the AI notes beta invite.
                </div>
                <div className="rounded-xl bg-void-950/60 p-3 text-sm text-void-200">"Who agreed to finish the report?"</div>
                <div className="rounded-xl border border-signal-400/30 bg-signal-500/10 p-3 text-sm text-void-100">Diego Marín — due before Friday's sync.</div>
              </div>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1} className="order-1 md:order-2">
            <Badge className="mb-4">⭐ Biggest differentiator</Badge>
            <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Stop taking notes. NexaMeet already did.</h2>
            <p className="mt-4 text-void-300">Live transcription and speaker recognition during the call. Summaries, decisions, and action items the second it ends. Then just ask.</p>
            <ul className="mt-6 space-y-3">
              {["Live captions & transcription", "Decisions and action items auto-tagged", "Ask the AI anything about any past meeting"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-void-100">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-400/20 text-signal-300"><Check className="h-3 w-3" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-white/5 bg-void-950/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">From link to live in three taps.</h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: MousePointerClick, step: "01", title: "Create or join", text: "Start an instant meeting or open an invite link — no download required." },
              { icon: Video, step: "02", title: "Meet, adaptively", text: "Smart Connection keeps you visible and audible no matter the network." },
              { icon: MessageSquare, step: "03", title: "Get the recap", text: "AI notes, decisions, and action items land in your inbox automatically." },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-surface-border bg-surface-raised/40 p-7">
                  <span className="font-display text-4xl font-semibold text-signal-500/30">{s.step}</span>
                  <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500/15 text-signal-300"><s.icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-void-300">{s.text}</p>
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
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Teams stop noticing the meeting tool.</h2>
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-b from-surface-raised/60 to-surface-raised/20 p-7 transition-colors hover:border-white/15">
                {/* Decorative quote mark */}
                <span className="pointer-events-none absolute right-5 top-3 select-none font-display text-8xl font-bold leading-none text-signal-500/10 transition-colors group-hover:text-signal-500/15">"</span>
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-pulse-400 text-pulse-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="relative mt-4 flex-1 text-sm leading-relaxed text-void-100">"{t.quote}"</p>
                {/* Divider */}
                <div className="my-5 h-px bg-gradient-to-r from-surface-border to-transparent" />
                {/* Attribution */}
                <div className="flex items-center gap-3">
                  <Avatar src={t.avatarUrl} name={t.name} className="ring-2 ring-signal-500/20" />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-void-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="border-y border-white/5 bg-void-950/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <Badge className="mx-auto mb-4">Pricing</Badge>
            <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Simple plans that scale with your team.</h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {pricingPlans.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}>
                <Card className={`flex h-full flex-col p-7 ${p.highlighted ? "border-signal-400 shadow-glow" : ""}`}>
                  {p.highlighted && <Badge className="mb-4 w-fit">Most popular</Badge>}
                  <h3 className="font-display text-xl font-semibold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-void-300">{p.tagline}</p>
                  <p className="mt-5 font-display text-4xl font-semibold text-white">
                    ${p.price}<span className="text-base font-normal text-void-400">/mo</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-void-100">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-pulse-400" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-7" variant={p.highlighted ? "primary" : "secondary"} onClick={() => navigate("/signup")}>
                    {p.cta}
                  </Button>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <FadeIn className="text-center">
          <Badge className="mx-auto mb-4">FAQ</Badge>
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Questions, answered.</h2>
        </FadeIn>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <FadeIn key={f.q} delay={i * 0.05}>
              <Card className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white">{f.q}</span>
                  <span className={`transition-transform ${openFaq === i ? "rotate-45" : ""} text-signal-300 text-xl`}>+</span>
                </button>
                {openFaq === i && <p className="px-6 pb-5 text-sm text-void-300">{f.a}</p>}
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-6 pb-24">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-aurora p-12 text-center">
            <div className="absolute inset-0 noise-overlay" />
            <h2 className="relative font-display text-3xl font-semibold text-white md:text-4xl">Ready to meet smarter?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/80">Start your first meeting in seconds. No credit card required.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="bg-white text-void-900 hover:bg-white/90" onClick={() => navigate("/signup")}>
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="mailto:hello@nexameet.dev">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">Contact sales</Button>
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
