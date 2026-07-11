import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/marketing/AuthLayout";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/backend";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await auth.signIn({ email, password });
    toast.success("Welcome back to NexaMeet");
    navigate("/dashboard");
  }

  async function onGoogle() {
    setGoogleLoading(true);
    await auth.signInWithGoogle();
    toast.success("Signed in with Google");
    navigate("/dashboard");
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-white">Log in to NexaMeet</h1>
      <p className="mt-2 text-sm text-void-300">Meet smarter. Connect faster.</p>

      <Button variant="secondary" className="mt-6 w-full" onClick={onGoogle} disabled={googleLoading}>
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.98 10.98 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0 0 12 1 10.98 10.98 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        )}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-void-500">
        <div className="h-px flex-1 bg-surface-border" /> or <div className="h-px flex-1 bg-surface-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
            <Input id="email" type="email" required placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-signal-300 hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
            <Input id="password" type="password" required placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Log in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-void-300">
        New to NexaMeet? <Link to="/signup" className="text-signal-300 hover:underline">Create an account</Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/join" className="text-void-400 hover:text-white">Join a meeting as a guest →</Link>
      </p>
    </AuthLayout>
  );
}
