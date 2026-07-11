/**
 * CENTRALIZED DEMO DATA
 * ---------------------------------------------------------------------------
 * Every piece of "fake backend" data for NexaMeet lives in this one file.
 * The rest of the app never imports mock values directly — it always goes
 * through `src/lib/backend.ts`, which exposes the same function signatures
 * we'll use once Supabase is connected (see backend.ts header comment).
 *
 * To swap to Supabase later: implement the same exported functions in
 * backend.ts using supabase-js calls, and delete this file. No page or
 * component needs to change.
 */

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  title?: string;
  createdAt: string;
};

export type MeetingStatus = "upcoming" | "live" | "ended";

export type Meeting = {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  status: MeetingStatus;
  startAt: string;
  durationMins: number;
  timezone: string;
  recurring?: "none" | "daily" | "weekly" | "monthly";
  passwordProtected?: boolean;
  waitingRoom?: boolean;
  participants: { id: string; name: string; avatarUrl: string; joined: boolean }[];
  hasRecording?: boolean;
  hasTranscript?: boolean;
  aiSummary?: {
    summary: string;
    decisions: string[];
    actionItems: { task: string; owner: string; done: boolean }[];
    highlights: string[];
  };
};

export const currentUser: User = {
  id: "u-1",
  name: "Amara Chen",
  email: "amara@nexameet.dev",
  avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Amara&backgroundColor=5B5CF5",
  title: "Product Designer",
  createdAt: "2025-11-02T10:00:00Z",
};

export const demoContacts: User[] = [
  { id: "u-2", name: "Diego Marín", email: "diego@nexameet.dev", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Diego&backgroundColor=00E5A0", createdAt: "" },
  { id: "u-3", name: "Priya Nair", email: "priya@nexameet.dev", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Priya&backgroundColor=FF5D73", createdAt: "" },
  { id: "u-4", name: "Tom Baptiste", email: "tom@nexameet.dev", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Tom&backgroundColor=9192F8", createdAt: "" },
  { id: "u-5", name: "Yuki Sato", email: "yuki@nexameet.dev", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Yuki&backgroundColor=00BF85", createdAt: "" },
  { id: "u-6", name: "Layla Haddad", email: "layla@nexameet.dev", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Layla&backgroundColor=F53A54", createdAt: "" },
];

export const demoMeetings: Meeting[] = [
  {
    id: "m-1001",
    title: "Product sync — Q3 roadmap",
    description: "Weekly alignment on roadmap priorities and blockers.",
    hostId: "u-1",
    status: "upcoming",
    startAt: "2026-07-11T15:00:00Z",
    durationMins: 30,
    timezone: "UTC",
    recurring: "weekly",
    waitingRoom: true,
    participants: [
      { id: "u-2", name: "Diego Marín", avatarUrl: demoContacts[0].avatarUrl, joined: false },
      { id: "u-3", name: "Priya Nair", avatarUrl: demoContacts[1].avatarUrl, joined: false },
    ],
  },
  {
    id: "m-1002",
    title: "Design review: Onboarding flow",
    hostId: "u-1",
    status: "upcoming",
    startAt: "2026-07-11T18:30:00Z",
    durationMins: 45,
    timezone: "UTC",
    recurring: "none",
    passwordProtected: true,
    participants: [
      { id: "u-4", name: "Tom Baptiste", avatarUrl: demoContacts[2].avatarUrl, joined: false },
    ],
  },
  {
    id: "m-1003",
    title: "Investor update — July",
    hostId: "u-1",
    status: "upcoming",
    startAt: "2026-07-12T09:00:00Z",
    durationMins: 60,
    timezone: "UTC",
    participants: [
      { id: "u-5", name: "Yuki Sato", avatarUrl: demoContacts[3].avatarUrl, joined: false },
      { id: "u-6", name: "Layla Haddad", avatarUrl: demoContacts[4].avatarUrl, joined: false },
    ],
  },
  {
    id: "m-0991",
    title: "All-hands: July kickoff",
    hostId: "u-2",
    status: "ended",
    startAt: "2026-07-08T14:00:00Z",
    durationMins: 52,
    timezone: "UTC",
    hasRecording: true,
    hasTranscript: true,
    participants: [
      { id: "u-2", name: "Diego Marín", avatarUrl: demoContacts[0].avatarUrl, joined: true },
      { id: "u-3", name: "Priya Nair", avatarUrl: demoContacts[1].avatarUrl, joined: true },
      { id: "u-4", name: "Tom Baptiste", avatarUrl: demoContacts[2].avatarUrl, joined: true },
    ],
    aiSummary: {
      summary:
        "The team kicked off July priorities, reviewed the adaptive-quality rollout, and aligned on the AI notes beta timeline.",
      decisions: [
        "Ship Smart Connection to 100% of users by July 18.",
        "AI meeting notes beta opens to 50 waitlisted teams.",
      ],
      actionItems: [
        { task: "Finalize bandwidth indicator copy", owner: "Priya Nair", done: true },
        { task: "Draft AI notes beta invite email", owner: "Tom Baptiste", done: false },
        { task: "QA low-data mode on 3G throttle", owner: "Diego Marín", done: false },
      ],
      highlights: [
        "Smart Connection reduced dropped calls by 41% in staging.",
        "Beta waitlist crossed 1,200 signups.",
      ],
    },
  },
  {
    id: "m-0982",
    title: "Client onboarding: Meridian Co.",
    hostId: "u-1",
    status: "ended",
    startAt: "2026-07-05T16:00:00Z",
    durationMins: 38,
    timezone: "UTC",
    hasRecording: true,
    hasTranscript: true,
    participants: [
      { id: "u-3", name: "Priya Nair", avatarUrl: demoContacts[1].avatarUrl, joined: true },
    ],
    aiSummary: {
      summary: "Walked Meridian through workspace setup, SSO, and their first scheduled meeting.",
      decisions: ["Meridian will pilot with 12 seats for 30 days."],
      actionItems: [{ task: "Send SSO setup guide", owner: "Amara Chen", done: true }],
      highlights: ["Meridian's team completed setup in under 9 minutes."],
    },
  },
];

export const demoNotifications = [
  { id: "n-1", type: "reminder", title: "Design review starts in 15 minutes", time: "15m", read: false },
  { id: "n-2", type: "ai", title: "AI summary ready for “All-hands: July kickoff”", time: "2h", read: false },
  { id: "n-3", type: "invite", title: "Yuki Sato invited you to “Investor update — July”", time: "5h", read: true },
  { id: "n-4", type: "recording", title: "Recording ready for “Client onboarding: Meridian Co.”", time: "1d", read: true },
];

export const testimonials = [
  {
    quote:
      "We switched from our old video tool because calls kept dropping on the team's home wifi. NexaMeet just... doesn't drop. And I stopped taking notes entirely.",
    name: "Renée Okafor",
    role: "COO, Fielder Logistics",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Renee&backgroundColor=5B5CF5",
  },
  {
    quote:
      "The AI recap after every standup means nobody argues about who owns what anymore. It's just... in the summary.",
    name: "Marcus Webb",
    role: "Eng Lead, Northpeak",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Marcus&backgroundColor=00E5A0",
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
