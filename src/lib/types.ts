export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  title?: string;
  createdAt: string;
};

export type MeetingStatus = "upcoming" | "live" | "ended";

export type MeetingRoom = {
  id: string;
  meetingId: string;
  name: string;
  kind: "main" | "breakout" | "waiting";
  orderIndex: number;
};

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
  participants: { id: string; name: string; avatarUrl: string; joined: boolean; guest?: boolean }[];
  hasRecording?: boolean;
  hasTranscript?: boolean;
  locked?: boolean;
  aiSummary?: {
    summary: string;
    decisions: string[];
    actionItems: { task: string; owner: string; done: boolean }[];
    highlights: string[];
  };
};
