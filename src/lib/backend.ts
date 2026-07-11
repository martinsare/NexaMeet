/**
 * BACKEND ABSTRACTION LAYER
 * ---------------------------------------------------------------------------
 * Every page/component talks to THIS file, never to demo-data.ts directly.
 * Right now every function is implemented with localStorage + the seed data
 * in demo-data.ts. When Supabase credentials are added, replace the guts of
 * these functions with supabase-js calls (auth.signUp, .from("meetings")...)
 * and keep the same exported names/shapes — nothing else in the app changes.
 *
 * Swap checklist for later:
 *  1. `npm install @supabase/supabase-js`
 *  2. Create src/lib/supabase.ts with createClient(url, anonKey)
 *  3. Re-implement auth() and meetings() bodies below using supabase calls
 *  4. Point storage/table names at your Supabase schema
 */
import {
  currentUser,
  demoContacts,
  demoMeetings,
  demoNotifications,
  type Meeting,
  type User,
} from "./data/demo-data";

const LS_KEYS = {
  session: "nexameet.session",
  meetings: "nexameet.meetings",
  notifications: "nexameet.notifications",
  profile: "nexameet.profile",
};

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* no-op */
  }
}
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
export type Session = { user: User; guest?: boolean } | null;

function getSession(): Session {
  return readLS<Session>(LS_KEYS.session, null);
}
function setSession(session: Session) {
  writeLS(LS_KEYS.session, session);
  window.dispatchEvent(new Event("nexameet:session"));
}

export const auth = {
  getSession: async (): Promise<Session> => delay(getSession(), 50),

  signUp: async (opts: { name: string; email: string; password: string }): Promise<Session> => {
    const profile = readLS<User>(LS_KEYS.profile, currentUser);
    const user: User = { ...profile, name: opts.name, email: opts.email, id: genId("u") };
    writeLS(LS_KEYS.profile, user);
    const session: Session = { user };
    setSession(session);
    return delay(session, 500);
  },

  signIn: async (opts: { email: string; password: string }): Promise<Session> => {
    const profile = readLS<User>(LS_KEYS.profile, currentUser);
    const user: User = { ...profile, email: opts.email };
    const session: Session = { user };
    setSession(session);
    return delay(session, 500);
  },

  signInWithGoogle: async (): Promise<Session> => {
    const session: Session = { user: readLS<User>(LS_KEYS.profile, currentUser) };
    setSession(session);
    return delay(session, 600);
  },

  sendMagicLink: async (_email: string): Promise<{ sent: boolean }> => delay({ sent: true }, 500),

  continueAsGuest: async (name: string): Promise<Session> => {
    const guestUser: User = {
      id: genId("guest"),
      name,
      email: "",
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=5B5CF5`,
      createdAt: new Date().toISOString(),
    };
    const session: Session = { user: guestUser, guest: true };
    setSession(session);
    return delay(session, 400);
  },

  sendPasswordReset: async (_email: string): Promise<{ sent: boolean }> => delay({ sent: true }, 500),

  signOut: async (): Promise<void> => {
    setSession(null);
    return delay(undefined as unknown as void, 200);
  },

  updateProfile: async (patch: Partial<User>): Promise<User> => {
    const current = readLS<User>(LS_KEYS.profile, currentUser);
    const updated = { ...current, ...patch };
    writeLS(LS_KEYS.profile, updated);
    const session = getSession();
    if (session) setSession({ ...session, user: updated });
    return delay(updated, 300);
  },

  onSessionChange: (cb: (session: Session) => void) => {
    const handler = () => cb(getSession());
    window.addEventListener("nexameet:session", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nexameet:session", handler);
      window.removeEventListener("storage", handler);
    };
  },
};

// ---------------------------------------------------------------------------
// MEETINGS
// ---------------------------------------------------------------------------
function loadMeetings(): Meeting[] {
  return readLS<Meeting[]>(LS_KEYS.meetings, demoMeetings);
}
function saveMeetings(meetings: Meeting[]) {
  writeLS(LS_KEYS.meetings, meetings);
}

export const meetings = {
  list: async (): Promise<Meeting[]> => delay(loadMeetings(), 300),

  upcoming: async (): Promise<Meeting[]> =>
    delay(loadMeetings().filter((m) => m.status === "upcoming"), 300),

  history: async (): Promise<Meeting[]> =>
    delay(loadMeetings().filter((m) => m.status === "ended"), 300),

  get: async (id: string): Promise<Meeting | undefined> =>
    delay(loadMeetings().find((m) => m.id === id), 200),

  createInstant: async (title = "Instant meeting"): Promise<Meeting> => {
    const all = loadMeetings();
    const m: Meeting = {
      id: genId("m"),
      title,
      hostId: currentUser.id,
      status: "live",
      startAt: new Date().toISOString(),
      durationMins: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      participants: [],
    };
    saveMeetings([m, ...all]);
    return delay(m, 250);
  },

  schedule: async (input: {
    title: string;
    description?: string;
    startAt: string;
    durationMins: number;
    timezone: string;
    recurring?: Meeting["recurring"];
    passwordProtected?: boolean;
    waitingRoom?: boolean;
  }): Promise<Meeting> => {
    const all = loadMeetings();
    const m: Meeting = {
      id: genId("m"),
      title: input.title,
      description: input.description,
      hostId: currentUser.id,
      status: "upcoming",
      startAt: input.startAt,
      durationMins: input.durationMins,
      timezone: input.timezone,
      recurring: input.recurring ?? "none",
      passwordProtected: input.passwordProtected,
      waitingRoom: input.waitingRoom,
      participants: [],
    };
    saveMeetings([m, ...all]);
    return delay(m, 400);
  },

  search: async (query: string): Promise<Meeting[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return delay([], 100);
    return delay(
      loadMeetings().filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.aiSummary?.summary.toLowerCase().includes(q)
      ),
      250
    );
  },
};

export const notifications = {
  list: async () => delay(readLS(LS_KEYS.notifications, demoNotifications), 200),
  markAllRead: async () => {
    const all = readLS(LS_KEYS.notifications, demoNotifications).map((n) => ({ ...n, read: true }));
    writeLS(LS_KEYS.notifications, all);
    return delay(all, 150);
  },
};

export const contacts = {
  list: async (): Promise<User[]> => delay(demoContacts, 200),
};
