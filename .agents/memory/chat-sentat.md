---
name: ChatMessage sentAt
description: Both the local push and the received-message handler must populate sentAt.
---

`ChatMessage.sentAt` is `number` (epoch ms). It must be set in two places in `use-daily-call.ts`:

1. **Received message** (app-message handler, `kind === "chat"`):
   `{ ..., sentAt: Date.now() }`

2. **Sent message** (sendChat callback):
   `{ ..., sentAt: Date.now() }`

The UI in MeetingRoom.tsx displays it when `m.sentAt > 0` using `toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })`.

**Why sentAt and not a string:** Storing epoch ms allows future sorting, diffing, and formatting with any locale without re-parsing.
