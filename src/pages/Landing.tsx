import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wifi, Video } from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { testimonials } from "@/lib/data/content";
import { HeroIllustration } from "@/components/marketing/HeroIllustration";

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

const VALUE_PROPS = [
  {
    num: "01",
    icon: Wifi,
    label: "Survives any connection",
    headline: "Smart Connection keeps you in the room.",
    body: "NexaMeet continuously reads your bandwidth, jitter, and packet loss — shifting between HD, SD, Low Data, and Audio-only before your call drops. Most users never notice the switch.",
    color: "text-success",
  },
  {
    num: "02",
    icon: Sparkles,
    label: "AI takes the notes",
    headline: "Stop taking notes. We already did.",
    body: "Live transcription and speaker recognition during the call. Summaries, decisions, and action items the second it ends. Then just ask the AI anything about any past meeting.",
    color: "text-primary",
  },
  {
    num: "03",
    icon: Video,
    label: "Instant, no friction",
    headline: "From link to live in one tap.",
    body: "No downloads. No plugins. One link opens a secure meeting on any device, any OS, any network — in under three seconds.",
    color: "text-destructive",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const featured = testimonials[0];

  // Force dark mode on the landing page regardless of user preference
  useEffect(() => {
    const root = document.documentElement;
    const wasLight = root.classList.contains("light");
    root.classList.add("dark");
    root.classList.remove("light");
    return () => {
      if (wasLight) {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Nav hideThemeToggle />

      {/* ── HERO ── */}
      <section className="relative">
        <div className="absolute inset-0 " />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-20 md:grid-cols-2 md:pt-28">
          <FadeIn>
            <Badge variant="pulse" className="mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live: Smart Connection 2.0
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-text md:text-6xl">
              Meet smarter.
              <br />
              <span className="">Connect faster.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-text-muted">
              Adaptive video meetings that survive bad wifi, write their own notes, and get out of the way — so your team can actually talk.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Start free meeting <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/join")}>
                <Video className="h-4 w-4" /> Join a meeting
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-text-muted">
              <div className="flex -space-x-2">
                {testimonials.map((t, i) => (
                  <Avatar key={i} src={t.avatarUrl} name={t.name} className="ring-2 ring-background" />
                ))}
              </div>
              <p>Trusted by 4,000+ teams already meeting smarter</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="relative">
            <div className="relative mx-auto max-w-lg">
              <HeroIllustration className="w-full drop-shadow-2xl" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="border-y border-border bg-surface-raised/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-4 px-6 text-text-muted">
          {["Fielder Logistics", "Northpeak", "GreenRoute", "Meridian Co.", "Aurea Labs"].map((n) => (
            <span key={n} className="font-display text-sm tracking-wide">{n}</span>
          ))}
        </div>
      </section>

      {/* ── 3 EDITORIAL VALUE PROPS ── */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Why teams switch to NexaMeet</p>
        </FadeIn>
        <div className="mt-12 divide-y divide-surface-border">
          {VALUE_PROPS.map((vp, i) => (
            <FadeIn key={vp.num} delay={i * 0.1}>
              <div className="group grid grid-cols-1 gap-6 py-10 md:grid-cols-[120px_1fr_1fr] md:gap-12">
                {/* Number + label */}
                <div className="flex items-start gap-4 md:flex-col md:gap-2">
                  <span className="font-display text-4xl font-bold text-text/10">{vp.num}</span>
                  <span className={`mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest md:mt-0 ${vp.color}`}>
                    <vp.icon className="h-3.5 w-3.5" /> {vp.label}
                  </span>
                </div>
                {/* Headline */}
                <h2 className="font-display text-2xl font-semibold leading-snug text-text md:text-3xl">
                  {vp.headline}
                </h2>
                {/* Body + link */}
                <div>
                  <p className="text-text-muted leading-relaxed">{vp.body}</p>
                  <Link
                    to="/features"
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${vp.color} hover:opacity-80 transition-opacity`}
                  >
                    See how it works <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURED TESTIMONIAL ── */}
      <section className="border-y border-border bg-surface-raised/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <div className="flex flex-col items-center text-center">
              <span className="font-display text-8xl font-bold leading-none text-primary/20">"</span>
              <blockquote className="-mt-4 text-xl font-medium leading-relaxed text-text md:text-2xl">
                {featured.quote}
              </blockquote>
              <div className="mt-8 flex items-center gap-3">
                <Avatar src={featured.avatarUrl} name={featured.name} className="h-10 w-10 ring-2 ring-primary/30" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-text">{featured.name}</p>
                  <p className="text-xs text-text-muted">{featured.role}</p>
                </div>
              </div>
              <Link to="/features#testimonials" className="mt-8 text-sm text-text-muted hover:text-text transition-colors underline underline-offset-4">
                Read more stories
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-12 text-center">
            <div className="absolute inset-0 noise-overlay" />
            <h2 className="relative font-display text-3xl font-semibold text-text md:text-4xl">
              Ready to meet smarter?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-text/80">
              Start your first meeting in seconds. No credit card required.
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
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-border text-text hover:bg-surface-raised">
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
