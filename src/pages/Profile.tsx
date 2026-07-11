import { useState } from "react";
import { toast } from "sonner";
import { Camera, Mail, Briefcase, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/backend";

export default function Profile() {
  const { session } = useAuth();
  const [name, setName] = useState(session?.user.name ?? "");
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
      <div className="mx-auto max-w-2xl">
        <Card className="p-7">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar src={session?.user.avatarUrl} name={name || "You"} className="h-20 w-20" />
              <button type="button" className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-text ">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text">{name || "Your profile"}</h2>
              <p className="text-sm text-text-muted">{title || "Add a title"}</p>
            </div>
          </div>

          <form onSubmit={onSave} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="title" className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Title</Label>
              <Input id="title" placeholder="e.g. Product Designer" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
