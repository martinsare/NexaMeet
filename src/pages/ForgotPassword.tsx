import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/marketing/AuthLayout";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckmarkSuccess } from "@/components/lottie/CheckmarkSuccess";
import { auth } from "@/lib/backend";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await auth.sendPasswordReset(email);
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthLayout>
      {sent ? (
        <div className="text-center">
          <CheckmarkSuccess className="mx-auto h-28 w-28" />
          <h1 className="font-display text-xl font-semibold text-text">Check your inbox</h1>
          <p className="mt-2 text-sm text-text-muted">We sent a reset link to <span className="text-text">{email}</span>.</p>
          <Link to="/login" className="mt-6 inline-block text-sm text-primary hover:underline">Back to log in</Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-text">Reset your password</h1>
          <p className="mt-2 text-sm text-text-muted">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input id="email" type="email" required placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-text-muted">
            <Link to="/login" className="text-primary hover:underline">Back to log in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
