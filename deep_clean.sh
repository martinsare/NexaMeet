#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e 's/ring-background/ring-background/g' \
  -e 's/ring-signal-500\/30/ring-primary\/30/g' \
  -e 's/bg-white\/5/bg-surface-raised/g' \
  -e 's/bg-white\/10/bg-surface-raised/g' \
  -e 's/border-white\/5/border-border/g' \
  -e 's/border-white\/10/border-border/g' \
  -e 's/text-white\/80/text-text-muted/g' \
  -e 's/bg-white/bg-text/g' \
  -e 's/text-void-900/text-background/g' \
  -e 's/text-white/text-text/g' \
  -e 's/bg-black\/60/bg-text\/20 backdrop-blur-sm/g' \
  -e 's/bg-void-900\/70/bg-background\/80/g'
