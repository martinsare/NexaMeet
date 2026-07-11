import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AuthLayout } from "@/components/marketing/AuthLayout";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/backend";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await auth.signUp({ name, email, password });
    toast.success("Account created — check your email to verify (demo mode).", {
      icon: <Sparkles className="h-4 w-4" />,
    });
    navigate("/dashboard");
  }

  return (
    <AuthLayout tagline="“The AI recap after every standup means nobody argues about ownership anymore.”">
      <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
      <p className="mt-2 text-sm text-void-300">Free forever for small teams. No credit card.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
            <Input id="name" required placeholder="Amara Chen" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
            <Input id="email" type="email" required placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
            <Input id="password" type="password" required minLength={6} placeholder="At least 6 characters" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create free account <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-void-300">
        Already on NexaMeet? <Link to="/login" className="text-signal-300 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
