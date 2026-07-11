import { useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/backend";

export default function Profile() {
  const { session } = useAuth();
  const [name, setName]   = useState(session?.user.name ?? "");
  const [title, setTitle] = useState(session?.user.title ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await auth.updateProfile({ name, title, email });
    setSaving(false);
    toast.success("Profile updated");
  }

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-lg">
        {/* Avatar section */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <Avatar src={session?.user.avatarUrl} name={name || "You"} className="h-24 w-24" />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-text shadow-md hover:opacity-90"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-text">{name || "Your name"}</p>
            <p className="text-sm text-text-muted">{title || "No title set"}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Account info</p>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product Designer" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-2">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
