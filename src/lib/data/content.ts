/**
 * Static marketing content — testimonials, pricing, FAQs, feature list.
 * None of this is user data; it never touches the database.
 */

export const testimonials = [
  {
    quote:
      "We switched from our old video tool because calls kept dropping on the team's home wifi. NexaMeet just... doesn't drop. And I stopped taking notes entirely.",
    name: "Renée Okafor",
    role: "COO, Fielder Logistics",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Renee&backgroundColor=D94820",
  },
  {
    quote:
      "The AI recap after every standup means nobody argues about who owns what anymore. It's just... in the summary.",
    name: "Marcus Webb",
    role: "Eng Lead, Northpeak",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Marcus&backgroundColor=2B4C7E",
  },
  {
    quote:
      "Our field team joins from patchy rural connections constantly. Low Data Mode is the first thing that's actually solved that for us.",
    name: "Sofia Delgado",
    role: "Ops Director, GreenRoute",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Sofia&backgroundColor=FF5D73",
  },
];

export const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "For quick catch-ups and small teams getting started.",
    features: [
      "40-minute group meetings",
      "Up to 6 participants",
      "HD video & screen share",
      "Smart Connection adaptive quality",
      "Basic chat & reactions",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 14,
    tagline: "For teams that run on meetings and can't lose the notes.",
    features: [
      "Unlimited meeting length",
      "Up to 100 participants",
      "AI notes, summaries & action items",
      "Cloud recording & transcripts",
      "Custom backgrounds & noise suppression",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: 29,
    tagline: "For organizations that need control and analytics.",
    features: [
      "Everything in Pro",
      "Up to 300 participants",
      "Meeting analytics & attendance",
      "SSO & device management",
      "Admin roles & co-hosting",
      "Dedicated onboarding",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export const faqs = [
  {
    q: "How does Smart Connection actually work?",
    a: "NexaMeet continuously measures your bandwidth, packet loss, and jitter, then adjusts video resolution, frame rate, and even switches to audio-only in real time — before your call drops. Most users never notice the switch happening.",
  },
  {
    q: "What does the AI Assistant have access to?",
    a: "Only the audio and chat of meetings you're a host or invited participant in. Transcripts and summaries are generated per-meeting and are only visible to that meeting's participants.",
  },
  {
    q: "Can guests join without creating an account?",
    a: "Yes — anyone with a meeting link can join as a guest with just a display name. Hosts can require waiting-room approval or a password for extra control.",
  },
  {
    q: "Is there a limit on meeting length on the free plan?",
    a: "Starter includes 40-minute group meetings, similar to most free tiers. One-on-one calls are unlimited on every plan.",
  },
  {
    q: "Do you support recording and transcripts?",
    a: "Yes — Pro and Business plans include cloud recording, downloadable transcripts, and searchable AI summaries for every recorded meeting.",
  },
];

export const productFeatures = [
  {
    icon: "zap",
    title: "Instant meetings",
    description: "One click generates a secure room and shareable link — no setup screens, no friction.",
  },
  {
    icon: "signal",
    title: "Smart Connection",
    description: "Adapts automatically between HD, SD, Low Data, and Audio-only as your network shifts.",
  },
  {
    icon: "sparkles",
    title: "AI meeting notes",
    description: "Live transcription, summaries, decisions and action items — generated automatically, every time.",
  },
  {
    icon: "shield",
    title: "Built-in security",
    description: "Waiting rooms, password protection, and host controls keep every meeting yours to run.",
  },
  {
    icon: "share2",
    title: "Effortless sharing",
    description: "Screen share, files, and whiteboards — presenters can hand off control in a click.",
  },
  {
    icon: "search",
    title: "Search everything",
    description: "Find any meeting, message, or moment across every transcript and summary you've ever had.",
  },
];
