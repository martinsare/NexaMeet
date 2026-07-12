---
name: WhiteboardStroke coordinate normalisation
description: Stroke points are stored as [0,1] fractions, not pixels, for cross-device consistency.
---

`WhiteboardStroke.points` is a flat array of `[x0, y0, x1, y1, ...]` where each value is a fraction of the canvas's current width/height at draw time.

When rendering, multiply by `canvas.width` / `canvas.height`:
```ts
ctx.moveTo(points[0] * w, points[1] * h);
```

**Why:** Different participants may have different viewport sizes. Pixel coordinates would look shifted or scaled for everyone except the original drawer. Normalised coordinates produce identical visuals regardless of canvas size.

**How to apply:** Always divide by canvas dimensions when recording mouse position, and multiply when rendering. The ResizeObserver in Whiteboard.tsx triggers a full redraw on resize.
