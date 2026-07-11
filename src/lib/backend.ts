/**
 * BACKEND — Supabase implementation
 * ---------------------------------------------------------------------------
 * All pages/components talk to this file only. The exported function
 * signatures are identical to the old localStorage version so nothing
 * in the rest of the app needs to change.
 *
 * Auth:      supabase.auth.*
 * Data:      supabase.from("meetings" | "profiles" | "notifications" | …)
 * Guests:    still stored in localStorage — guests have no Supabase account
 * Schema:    supabase/migrations/001_initial.sql
 */

import { supabase } from "./supabase";
import type { User, Meeting } from "./types";

export type { User, Meeting } from "./types";
export type Session = { user: User; guest?: boolean } | null;

// ── localStorage key for guest-only sessions ────────────────────────────────
const GUEST_KEY = "nexameet.guest_session";

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Row → app-type converters ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileToUser(row: any): User {
  return {
    id:        row.id        as string,
    name:      row.name      as string,
    email:     row.email     as string,
    avatarUrl: row.avatar_url as string,
    title:     row.title     as string | undefined,
    createdAt: row.created_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMeeting(row: any): Meeting {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = row.meeting_participants ?? [];
  return {
    id:                row.id                as string,
    title:             row.title             as string,
    description:       row.description       as string | undefined,
    hostId:            row.host_id           as string,
    status:            row.status            as Meeting["status"],
    startAt:           row.start_at          as string,
    durationMins:      row.duration_mins     as number,
    timezone:          row.timezone          as string,
    recurring:         row.recurring         as Meeting["recurring"],
    passwordProtected: row.password_protected as boolean | undefined,
    waitingRoom:       row.waiting_room       as boolean | undefined,
    hasRecording:      row.has_recording      as boolean | undefined,
    hasTranscript:     row.has_transcript     as boolean | undefined,
    aiSummary:         row.ai_summary         as Meeting["aiSummary"],
    participants: parts.map((p) => ({
      id:        p.user_id   as string,
      name:      p.name      as string,
      avatarUrl: p.avatar_url as string,
      joined:    p.joined    as boolean,
    })),
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data ? profileToUser(data) : null;
}

const MEETING_SELECT = "*, meeting_participants(*)";

// ── AUTH ─────────────────────────────────────────────────────────────────────

export const auth = {
  getSession: async (): Promise<Session> => {
    // Guests first
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch { /* ignore */ }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const profile = await fetchProfile(session.user.id);
    return profile ? { user: profile } : null;
  },

  signUp: async (opts: {
    name: string;
    email: string;
    password: string;
  }): Promise<Session> => {
    const { data, error } = await supabase.auth.signUp({
      email: opts.email,
      password: opts.password,
      options: { data: { name: opts.name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign-up failed — no user returned.");

    // Trigger creates the profile row; give it a moment then fetch
    await new Promise((r) => setTimeout(r, 500));
    const profile = (await fetchProfile(data.user.id)) ?? {
      id:        data.user.id,
      name:      opts.name,
      email:     opts.email,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(opts.name)}&backgroundColor=D94820`,
      createdAt: new Date().toISOString(),
    };
    return { user: profile };
  },

  signIn: async (opts: {
    email: string;
    password: string;
  }): Promise<Session> => {
    const { data, error } = await supabase.auth.signInWithPassword(opts);
    if (error) throw error;
    if (!data.user) throw new Error("Sign-in failed.");
    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error("Profile not found — contact support.");
    return { user: profile };
  },

  signInWithGoogle: async (): Promise<Session> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
    // Page redirects; the auth state listener will handle the session on return
    return null;
  },

  sendMagicLink: async (email: string): Promise<{ sent: boolean }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return { sent: true };
  },

  continueAsGuest: async (name: string): Promise<Session> => {
    const guestUser: User = {
      id:        genId("guest"),
      name,
      email:     "",
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=D94820`,
      createdAt: new Date().toISOString(),
    };
    const session: Session = { user: guestUser, guest: true };
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(session)); } catch { /* ignore */ }
    return session;
  },

  sendPasswordReset: async (email: string): Promise<{ sent: boolean }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { sent: true };
  },

  signOut: async (): Promise<void> => {
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    await supabase.auth.signOut();
  },

  updateProfile: async (patch: Partial<User>): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbPatch: Record<string, any> = {};
    if (patch.name      !== undefined) dbPatch.name       = patch.name;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (patch.title     !== undefined) dbPatch.title      = patch.title;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbPatch)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return profileToUser(data);
  },

  onSessionChange: (cb: (session: Session) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          // Check for a guest session before reporting signed-out
          try {
            const raw = localStorage.getItem(GUEST_KEY);
            if (raw) { cb(JSON.parse(raw) as Session); return; }
          } catch { /* ignore */ }
          cb(null);
          return;
        }
        const profile = await fetchProfile(session.user.id);
        cb(profile ? { user: profile } : null);
      }
    );
    return () => subscription.unsubscribe();
  },
};

// ── MEETINGS ─────────────────────────────────────────────────────────────────

export const meetings = {
  list: async (): Promise<Meeting[]> => {
    const { data, error } = await supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .order("start_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToMeeting);
  },

  upcoming: async (): Promise<Meeting[]> => {
    const { data, error } = await supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .eq("status", "upcoming")
      .order("start_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToMeeting);
  },

  history: async (): Promise<Meeting[]> => {
    const { data, error } = await supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .eq("status", "ended")
      .order("start_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToMeeting);
  },

  get: async (id: string): Promise<Meeting | undefined> => {
    const { data, error } = await supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .eq("id", id)
      .single();
    if (error) return undefined;
    return rowToMeeting(data);
  },

  createInstant: async (input: { title?: string; description?: string } = {}): Promise<Meeting> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        title:        input.title || "My meeting",
        description:  input.description || null,
        host_id:      user.id,
        status:       "live",
        start_at:     new Date().toISOString(),
        duration_mins: 0,
        timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .select(MEETING_SELECT)
      .single();
    if (error) throw error;
    return rowToMeeting(data);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        title:             input.title,
        description:       input.description,
        host_id:           user.id,
        status:            "upcoming",
        start_at:          input.startAt,
        duration_mins:     input.durationMins,
        timezone:          input.timezone,
        recurring:         input.recurring ?? "none",
        password_protected: input.passwordProtected ?? false,
        waiting_room:      input.waitingRoom ?? false,
      })
      .select(MEETING_SELECT)
      .single();
    if (error) throw error;
    return rowToMeeting(data);
  },

  search: async (query: string): Promise<Meeting[]> => {
    const q = query.trim();
    if (!q) return [];
    const { data, error } = await supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order("start_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToMeeting);
  },

  /** Marks a live meeting as ended once the host leaves the call. */
  end: async (id: string, durationMins: number): Promise<void> => {
    const { error } = await supabase
      .from("meetings")
      .update({ status: "ended", duration_mins: Math.max(0, Math.round(durationMins)) })
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * Persists the AI meeting-notes pipeline result (Daily.co audio -> Groq
   * Whisper transcript -> Groq LLM summary) and marks the meeting ended.
   * Only the host runs this pipeline (see MeetingRoom.tsx), so there's no
   * concurrent-writer concern.
   */
  saveAiNotes: async (
    id: string,
    input: {
      durationMins: number;
      transcript: string;
      segments: { start: number; end: number; text: string }[];
      aiSummary: Meeting["aiSummary"];
    }
  ): Promise<void> => {
    const { error: transcriptError } = await supabase
      .from("meeting_transcripts")
      .upsert({ meeting_id: id, transcript: input.transcript, segments: input.segments });
    if (transcriptError) throw transcriptError;

    const { error: meetingError } = await supabase
      .from("meetings")
      .update({
        status:         "ended",
        duration_mins:  Math.max(0, Math.round(input.durationMins)),
        has_transcript: true,
        ai_summary:     input.aiSummary,
      })
      .eq("id", id);
    if (meetingError) throw meetingError;
  },

  getTranscript: async (id: string): Promise<{ transcript: string; segments: { start: number; end: number; text: string }[] } | null> => {
    const { data, error } = await supabase
      .from("meeting_transcripts")
      .select("*")
      .eq("meeting_id", id)
      .maybeSingle();
    if (error || !data) return null;
    return { transcript: data.transcript as string, segments: (data.segments ?? []) as { start: number; end: number; text: string }[] };
  },
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export const notifications = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((n: any) => ({
      id:    n.id    as string,
      type:  n.type  as string,
      title: n.title as string,
      time:  n.time  as string,
      read:  n.read  as boolean,
    }));
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .select();
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((n: any) => ({
      id:    n.id    as string,
      type:  n.type  as string,
      title: n.title as string,
      time:  n.time  as string,
      read:  n.read  as boolean,
    }));
  },
};

// ── CONTACTS ──────────────────────────────────────────────────────────────────

export const contacts = {
  list: async (): Promise<User[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id);
    if (error) throw error;
    return (data ?? []).map(profileToUser);
  },
};
