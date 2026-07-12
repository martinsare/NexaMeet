---
name: Daily.co join chimes timing
description: Why participant-joined fires multiple times on entry and how to suppress false chimes.
---

**The problem:** Daily fires `participant-joined` for every *existing* participant when the local user joins — before `joined-meeting`. Playing a chime on every one of those events means 5 chimes for a 5-person room.

**Fix:** Use a `hasJoinedRef = useRef(false)`. Set it to `true` inside a `setTimeout(..., 500)` called from the `joined-meeting` handler. Only play a chime when `hasJoinedRef.current === true`.

**Why the 500ms delay:** `joined-meeting` fires immediately after the last catch-up `participant-joined`, so a zero-delay setTimeout might still fire before the last catch-up event is processed. 500ms is a safe buffer.

**How to apply:** Gate any "someone new arrived" side effect (chime, notification, analytics) the same way.
