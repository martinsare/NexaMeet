#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e 's/bg-coral-400/bg-destructive/g' \
  -e 's/hover:border-signal-400/hover:border-primary/g' \
  -e 's/bg-signal-700/bg-primary\/20/g' \
  -e 's/ring-pulse-400/ring-success/g' \
  -e 's/ring-offset-void-900/ring-offset-background/g' \
  -e 's/focus:border-signal-400/focus:border-primary/g' \
  -e 's/focus:ring-signal-400/focus:ring-primary/g' \
  -e 's/border-signal-400/border-primary/g' \
  -e 's/ring-void-950/ring-background/g' \
  -e 's/ring-white\/5/ring-border/g' \
  -e 's/hover:border-signal-400\/50/hover:border-primary\/50/g' \
  -e 's/bg-signal-600\/20/bg-primary\/10/g' \
  -e 's/bg-pulse-600\/15/bg-success\/10/g' \
  -e 's/border-white\/15/border-border/g' \
  -e 's/border-coral-500\/30/border-destructive\/30/g' \
  -e 's/text-coral-300/text-destructive/g' \
  -e 's/border-signal-500/border-primary/g' \
  -e 's/to-pulse-400/to-success/g' \
  -e 's/bg-text\/20/bg-surface\/80/g' \
  -e 's/bg-void-950/bg-background/g'

# update sonner toast toastOptions in main.tsx
sed -i 's/background: "#161230", border: "1px solid #2B2456", color: "white"/background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)"/g' src/main.tsx
