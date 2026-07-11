#!/bin/bash

# A more exhaustive color replacement script
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e 's/bg-void-900/bg-background/g' \
  -e 's/bg-void-950/bg-background/g' \
  -e 's/bg-void-800/bg-surface/g' \
  -e 's/bg-void-700/bg-surface-raised/g' \
  -e 's/text-void-200/text-text-muted/g' \
  -e 's/text-void-300/text-text-muted/g' \
  -e 's/text-void-400/text-text-muted/g' \
  -e 's/text-void-500/text-text-muted/g' \
  -e 's/text-void-100/text-text/g' \
  -e 's/text-void-50/text-text/g' \
  -e 's/text-white\/80/text-text-muted/g' \
  -e 's/text-white\/60/text-text-muted/g' \
  -e 's/text-white\/40/text-text-muted/g' \
  -e 's/text-white/text-text/g' \
  -e 's/bg-surface-overlay/bg-surface/g' \
  -e 's/bg-surface-border/bg-border/g' \
  -e 's/border-surface-border/border-border/g' \
  -e 's/text-signal-500/text-primary/g' \
  -e 's/text-signal-400/text-primary/g' \
  -e 's/text-signal-300/text-primary/g' \
  -e 's/bg-signal-500/bg-primary/g' \
  -e 's/bg-signal-400/bg-primary/g' \
  -e 's/text-pulse-400/text-success/g' \
  -e 's/text-pulse-300/text-success/g' \
  -e 's/bg-pulse-400/bg-success/g' \
  -e 's/bg-coral-500/bg-destructive/g' \
  -e 's/text-coral-400/text-destructive/g' \
  -e 's/text-coral-500/text-destructive/g' \
  -e 's/border-white\/5/border-border/g' \
  -e 's/border-white\/10/border-border/g' \
  -e 's/border-white\/20/border-border/g' \
  -e 's/bg-white\/5/bg-surface-raised/g' \
  -e 's/bg-white\/10/bg-surface-raised/g' \
  -e 's/hover:bg-white\/5/hover:bg-surface-raised/g' \
  -e 's/hover:bg-white\/10/hover:bg-surface-raised/g' \
  -e 's/ring-void-900/ring-background/g' \
  -e 's/shadow-glow-pulse//g' \
  -e 's/shadow-glow//g' \
  -e 's/bg-orbit-radial//g' \
  -e 's/bg-aurora/bg-surface-raised/g' \
  -e 's/text-gradient//g' \
  -e 's/from-signal-500/from-primary/g' \
  -e 's/to-signal-400/to-primary/g' \
  -e 's/text-text0/text-text-muted/g'

