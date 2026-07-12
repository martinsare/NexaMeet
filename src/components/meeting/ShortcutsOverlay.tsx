import { X } from "lucide-react";

const SHORTCUTS = [
  { category: "Audio & Video", items: [
    { keys: ["Space"], desc: "Push-to-talk (hold while muted to speak, release to mute)" },
    { keys: ["Alt", "A"], desc: "Toggle microphone on / off" },
    { keys: ["Alt", "V"], desc: "Toggle camera on / off" },
  ]},
  { category: "Screen & View", items: [
    { keys: ["Alt", "S"], desc: "Start / stop screen share" },
    { keys: ["Alt", "G"], desc: "Toggle grid / speaker view" },
    { keys:["Double-click tile"], desc: "Expand participant to fullscreen" },
    { keys: ["Escape"], desc: "Close open panel or exit fullscreen" },
  ]},
  { category: "Panels & Navigation", items: [
    { keys: ["Alt", "C"], desc: "Open / close chat" },
    { keys: ["Alt", "P"], desc: "Open / close participants" },
    { keys: ["Alt", "H"], desc: "Raise / lower hand" },
    { keys: ["?"], desc: "Show this shortcuts panel" },
  ]},
  { category: "Host Controls", items: [
    { keys: ["Alt", "M"], desc: "Mute all participants (host only)" },
  ]},
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-text">Keyboard shortcuts</h2>
          <button onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {SHORTCUTS.map(section => (
            <div key={section.category}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{section.category}</p>
              <div className="space-y-1.5">
                {section.items.map(item => (
                  <div key={item.desc} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-text-muted">{item.desc}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.keys.map(k => (
                        <kbd key={k} className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-background px-2 text-[10px] font-mono font-medium text-text">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3 text-center text-[10px] text-text-muted">
          Press <kbd className="mx-0.5 inline-flex h-4 items-center rounded border border-border bg-background px-1 font-mono text-[9px]">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
