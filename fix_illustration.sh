#!/bin/bash
sed -i \
  -e 's/#5B5CF5/#D94820/g' \
  -e 's/#10B981/#208050/g' \
  -e 's/#F59E0B/#E5B537/g' \
  -e 's/#EC4899/#2B4C7E/g' \
  -e 's/#0E0C1E/#181817/g' \
  -e 's/#161230/#222220/g' \
  -e 's/#1A1735/#222220/g' \
  -e 's/#2B2456/#2C2C2A/g' \
  src/components/marketing/HeroIllustration.tsx
