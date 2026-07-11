import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { auth } from "@/lib/backend";
import { cn } from "@/lib/utils";

// ── Use-case options ──────────────────────────────────────────────────────────
const USE_CASES = [
  { id: "standups",    emoji: "🔄", label: "Team standups"  },
  { id: "clients",     emoji: "🤝", label: "Client calls"   },
  { id: "1on1",        emoji: "💬", label: "1:1 meetings"   },
  { id: "webinars",    emoji: "📢", label: "Webinars"       },
  { id: "interviews",  emoji: "💼", label: "Interviews"     },
  { id: "exploring",   emoji: "✨", label: "Just exploring" },
];

// ── Password strength ─────────────────────────────────────────────────────────
function pwStrength(pw: string) {
  if (!pw) return null;
  const long     = pw.length >= 8;
  const hasNum   = /\d/.test(pw);
  const hasSpec  = /[^a-zA-Z0-9]/.test(pw);
  if (!long)                   return { label: "Too short", bar: "w-1/4",  color: "bg-coral-400" };
  if (!hasNum && !hasSpec)     return { label: "Weak",      bar: "w-2/4",  color: "bg-coral-400" };
  if ((hasNum || hasSpec) && !( hasNum && hasSpec))
                               return { label: "Good",      bar: "w-3/4",  color: "bg-amber-400" };
  return                              { label: "Strong",    bar: "w-full", color: "bg-pulse-400" };
}

// ── Slide variants ────────────────────────────────────────────────────────────
const slide = (dir: number) => ({
  initial: { opacity: 0, x: dir * 36 },
  animate: { opacity: 1, x: 0,        transition: { duration: 0.28, ease: [0.22,1,0.36,1] } },
  exit:    { opacity: 0, x: dir * -36, transition: { duration: 0.18, ease: [0.22,1,0.36,1] } },
});

// ── Google SVG ────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.98 10.98 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0 0 12 1 10.98 10.98 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Signup() {
  const navigate  = useNavigate();
  const [step, setStep]         = useState(1);
  const [dir,  setDir]          = useState(1);   // animation direction

  // Step 1 state
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Step 2 state
  const [selected, setSelected] = useState<string[]>([]);

  const strength = pwStrength(password);

  function go(n: number) { setDir(n > step ? 1 : -1); setStep(n); }

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.signUp({ name, email, password });
      go(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleUseCase(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function finish() {
    toast.success(`Welcome to NexaMeet, ${name.split(" ")[0]}! 🎉`);
    navigate("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-void-950 flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-signal-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-pulse-600/15 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-void-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Progress dots */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-2 pt-7 pb-2">
              {[1, 2].map(n => (
                <div key={n} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  n === step ? "w-6 bg-signal-400" : n < step ? "w-4 bg-pulse-400" : "w-4 bg-white/15"
                )} />
              ))}
            </div>
          )}

          <div className="px-8 pb-8 pt-4">
            <AnimatePresence mode="wait" initial={false}>
              {/* ── STEP 1: Account ─────────────────────────────────── */}
              {step === 1 && (
                <motion.div key="s1" {...slide(dir)}>
                  <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
                  <p className="mt-1.5 text-sm text-void-300">Free forever for small teams. No credit card.</p>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={async () => { setLoading(true); await auth.signInWithGoogle(); }}
                    disabled={loading}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-void-100 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="my-5 flex items-center gap-3 text-xs text-void-500">
                    <div className="h-px flex-1 bg-surface-border" /> or <div className="h-px flex-1 bg-surface-border" />
                  </div>

                  <form onSubmit={submitAccount} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" required autoFocus placeholder="Amara Chen"
                        value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="email">Work email</Label>
                      <Input id="email" type="email" required placeholder="you@company.com"
                        value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password" required minLength={6}
                          type={showPw ? "text" : "password"}
                          placeholder="At least 6 characters"
                          className="pr-11"
                          value={password} onChange={e => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-void-400 hover:text-void-100 transition-colors">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      {strength && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-300", strength.bar, strength.color)} />
                          </div>
                          <span className={cn("text-xs font-medium",
                            strength.label === "Strong" ? "text-pulse-400" :
                            strength.label === "Good"   ? "text-amber-400" : "text-coral-400"
                          )}>{strength.label}</span>
                        </div>
                      )}
                    </div>

                    {error && <p className="rounded-xl bg-coral-500/10 border border-coral-500/30 px-3.5 py-2.5 text-sm text-coral-300">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </form>

                  <p className="mt-5 text-center text-sm text-void-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-signal-300 hover:underline font-medium">Log in</Link>
                  </p>
                  <p className="mt-2 text-center text-xs text-void-500">
                    By continuing you agree to our{" "}
                    <Link to="/terms" className="hover:text-void-300 underline underline-offset-2">Terms</Link> &amp;{" "}
                    <Link to="/privacy" className="hover:text-void-300 underline underline-offset-2">Privacy Policy</Link>
                  </p>
                </motion.div>
              )}

              {/* ── STEP 2: Use-case ────────────────────────────────── */}
              {step === 2 && (
                <motion.div key="s2" {...slide(dir)}>
                  <button onClick={() => go(1)} className="mb-4 flex items-center gap-1.5 text-sm text-void-400 hover:text-void-100 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <h1 className="font-display text-2xl font-semibold text-white">What brings you here?</h1>
                  <p className="mt-1.5 text-sm text-void-300">Select all that apply — we'll personalise your experience.</p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {USE_CASES.map(uc => {
                      const on = selected.includes(uc.id);
                      return (
                        <button key={uc.id} type="button" onClick={() => toggleUseCase(uc.id)}
                          className={cn(
                            "relative flex flex-col items-start gap-2 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150",
                            on
                              ? "border-signal-500 bg-signal-500/10 text-white"
                              : "border-white/10 bg-white/4 text-void-200 hover:border-white/20 hover:bg-white/8"
                          )}>
                          {on && (
                            <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal-500">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                          <span className="text-xl">{uc.emoji}</span>
                          <span className="text-sm font-medium leading-tight">{uc.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <Button className="mt-6 w-full" onClick={() => go(3)}>
                    {selected.length === 0 ? "Skip for now" : <>Continue <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </motion.div>
              )}

              {/* ── STEP 3: Welcome ─────────────────────────────────── */}
              {step === 3 && (
                <motion.div key="s3" {...slide(dir)} className="py-4 text-center">
                  {/* Animated ring */}
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-signal-500 to-pulse-400">
                    <Check className="h-9 w-9 text-white" strokeWidth={2.5} />
                  </div>

                  <h1 className="font-display text-2xl font-semibold text-white">
                    You're in, {name.split(" ")[0]}! 🎉
                  </h1>
                  <p className="mt-2 text-sm text-void-300">
                    Your account is ready. Let's start your first meeting.
                  </p>

                  {/* Feature highlights */}
                  <div className="mt-6 space-y-2.5 text-left">
                    {[
                      { icon: "✅", text: "Account created" },
                      { icon: "🔒", text: "End-to-end encrypted" },
                      { icon: "🤖", text: "AI notes ready on your first call" },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-void-100">
                        <span>{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <Button className="mt-6 w-full" size="lg" onClick={finish}>
                    Go to dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
