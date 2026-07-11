#!/bin/bash
sed -i 's/ 👋//g' src/pages/Dashboard.tsx
sed -i 's/! 🎉/!/g' src/pages/Signup.tsx
sed -i 's/ 👋//g' src/pages/MeetingRoom.tsx
sed -i 's/ 👍//g' src/pages/MeetingRoom.tsx
sed -i 's/const EMOJIS = .*/const EMOJIS = ["+", "!", "!", "?", "!!"];/g' src/pages/MeetingRoom.tsx
sed -i 's/You {handRaised && "✋"}/You {handRaised \&\& " (Hand Raised)"}/g' src/pages/MeetingRoom.tsx
sed -i 's/📺 Presenting/Presenting/g' src/components/marketing/HeroIllustration.tsx
sed -i 's/✓/· Done/g' src/components/marketing/HeroIllustration.tsx
sed -i 's/📶 / /g' src/components/marketing/HeroIllustration.tsx
sed -i 's/👍//g' src/components/marketing/HeroIllustration.tsx
