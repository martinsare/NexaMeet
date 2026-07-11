import { useState } from "react";
import { toast } from "sonner";
import { Sun, Moon, Monitor, Mic, Camera, Volume2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function Row({ icon: Icon, title, description, control }: { icon: any; title: string; description?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <div>
          <p className="text-sm font-medium text-text">{title}</p>
          {description && <p className="text-xs text-text-muted">{description}</p>}
        </div>
      </div>
      {control}
    </div>
  );
}

export default function Settings() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [autoMute, setAutoMute] = useState(true);
  const [autoCameraOff, setAutoCameraOff] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [virtualBg, setVirtualBg] = useState(false);
  const [camera, setCamera] = useState("default-camera");
  const [mic, setMic] = useState("default-mic");
  const [speaker, setSpeaker] = useState("default-speaker");

  function saved() {
    toast.success("Preferences saved");
  }

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-text">Appearance</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { id: "dark", label: "Dark", icon: Moon },
              { id: "light", label: "Light", icon: Sun },
              { id: "system", label: "System", icon: Monitor },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setTheme(opt.id as any); saved(); }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                  theme === opt.id ? "border-primary bg-primary/10" : "border-border hover:bg-surface-raised"
                )}
              >
                <opt.icon className="h-5 w-5 text-text" />
                <span className="text-xs text-text-muted">{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-text">Devices</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-text-muted"><Camera className="h-3.5 w-3.5" /> Camera</label>
              <Select value={camera} onValueChange={setCamera}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-camera">FaceTime HD Camera</SelectItem>
                  <SelectItem value="external-camera">External Webcam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-text-muted"><Mic className="h-3.5 w-3.5" /> Microphone</label>
              <Select value={mic} onValueChange={setMic}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-mic">Built-in Microphone</SelectItem>
                  <SelectItem value="headset-mic">Headset Microphone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-text-muted"><Volume2 className="h-3.5 w-3.5" /> Speaker</label>
              <Select value={speaker} onValueChange={setSpeaker}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-speaker">Built-in Speakers</SelectItem>
                  <SelectItem value="headset-speaker">Headset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="divide-y divide-surface-border p-6">
          <h3 className="pb-2 font-display font-semibold text-text">Preferences</h3>
          <Row icon={Mic} title="Auto-mute on join" description="Join meetings muted by default" control={<Switch checked={autoMute} onCheckedChange={(v) => { setAutoMute(v); saved(); }} />} />
          <Row icon={Camera} title="Auto camera off" description="Join meetings with camera off" control={<Switch checked={autoCameraOff} onCheckedChange={(v) => { setAutoCameraOff(v); saved(); }} />} />
          <Row icon={Sparkles} title="Noise suppression" description="AI-powered background noise removal" control={<Switch checked={noiseSuppression} onCheckedChange={(v) => { setNoiseSuppression(v); saved(); }} />} />
          <Row icon={Camera} title="Virtual background" description="Blur or replace your background" control={<Switch checked={virtualBg} onCheckedChange={(v) => { setVirtualBg(v); saved(); }} />} />
        </Card>
      </div>
    </AppShell>
  );
}
