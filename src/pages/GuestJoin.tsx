import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Video } from "lucide-react";
import { AuthLayout } from "@/components/marketing/AuthLayout";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/backend";

export default function GuestJoin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await auth.continueAsGuest(name || "Guest");
    navigate(`/meeting/${meetingId}`);
  }

  return (
    <AuthLayout tagline="“Our field team joins from patchy rural connections constantly. Low Data Mode actually solved that.”">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Video className="h-5 w-5" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-text">Join a meeting</h1>
      <p className="mt-2 text-sm text-text-muted">No account needed — just a name and a meeting ID or link.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="meetingId">Meeting ID or link</Label>
          <Input id="meetingId" required placeholder="e.g. nex-482-193" value={meetingId} onChange={(e) => setMeetingId(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" required placeholder="How others will see you" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Join meeting <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </AuthLayout>
  );
}
