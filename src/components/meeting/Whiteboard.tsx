/**
 * Whiteboard — shared real-time canvas.
 * Strokes are synced via Daily app messages (instant) and persisted to the DB
 * (for latecomers). Coordinates are normalised to [0,1] so the board looks
 * the same on every screen size.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Undo2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhiteboardStroke } from "@/lib/use-daily-call";
import { cn } from "@/lib/utils";

const COLORS = ["#1a1a1a","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff"];
const SIZES  = [2, 5, 12, 24];

type Tool = "pen" | "eraser";

function drawStroke(ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke, w: number, h: number) {
  if (stroke.points.length < 4) return;
  ctx.save();
  ctx.lineCap   = "round";
  ctx.lineJoin  = "round";
  ctx.lineWidth = stroke.width;
  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }
  ctx.beginPath();
  ctx.moveTo(stroke.points[0] * w, stroke.points[1] * h);
  for (let i = 2; i < stroke.points.length; i += 2) {
    ctx.lineTo(stroke.points[i] * w, stroke.points[i + 1] * h);
  }
  ctx.stroke();
  ctx.restore();
}

type Props = {
  meetingId: string;
  strokes: WhiteboardStroke[];
  mySessionId: string;
  canClear: boolean;
  onStroke: (stroke: WhiteboardStroke) => void;
  onUndo: (strokeId: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function Whiteboard({ meetingId, strokes, mySessionId, canClear, onStroke, onUndo, onClear, onClose }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const drawing     = useRef(false);
  const currentPts  = useRef<number[]>([]);
  const currentId   = useRef<string>("");
  const myStrokes   = useRef<string[]>([]); // IDs of strokes I drew (for undo)

  const [tool,  setTool]  = useState<Tool>("pen");
  const [color, setColor] = useState("#1a1a1a");
  const [size,  setSize]  = useState(5);

  // Redraw everything whenever strokes change
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) drawStroke(ctx, s, canvas.width, canvas.height);
    // Draw current in-progress stroke
    if (drawing.current && currentPts.current.length >= 4) {
      drawStroke(ctx, { id: "live", tool, points: currentPts.current, color, width: size }, canvas.width, canvas.height);
    }
  }, [strokes, tool, color, size]);

  useEffect(() => { redraw(); }, [redraw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redraw();
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [redraw]);

  function getXY(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const src = "touches" in e ? e.touches[0] : e;
    return [(src.clientX - rect.left) / canvas.width, (src.clientY - rect.top) / canvas.height];
  }

  function pointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    currentId.current = crypto.randomUUID();
    const [x, y] = getXY(e);
    currentPts.current = [x, y];
  }

  function pointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const [x, y] = getXY(e);
    currentPts.current.push(x, y);
    redraw();
  }

  function pointerUp(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    if (currentPts.current.length < 4) { currentPts.current = []; return; }
    const stroke: WhiteboardStroke = {
      id: currentId.current, tool, points: [...currentPts.current], color, width: size,
    };
    myStrokes.current.push(stroke.id);
    currentPts.current = [];
    onStroke(stroke);
    // Persist to DB (fire-and-forget)
    fetch("/api/whiteboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, strokeData: stroke, createdBySession: mySessionId }),
    }).catch(() => {});
  }

  function handleUndo() {
    const id = myStrokes.current.pop();
    if (id) {
      onUndo(id);
      fetch(`/api/whiteboard/${id}/delete`, { method: "POST" }).catch(() => {});
    }
  }

  function handleClear() {
    myStrokes.current = [];
    onClear();
    fetch("/api/whiteboard/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId }),
    }).catch(() => {});
  }

  function downloadPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-3 py-2 flex-wrap">
        {/* Tools */}
        <div className="flex gap-1">
          {(["pen","eraser"] as Tool[]).map((t) => (
            <button key={t} onClick={() => setTool(t)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                tool === t ? "bg-primary text-white" : "bg-background text-text-muted hover:text-text"
              )}>
              {t === "pen" ? "✏️ Pen" : "⬜ Eraser"}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
              className={cn("h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                color === c && tool === "pen" ? "border-primary scale-110" : "border-border"
              )}
              style={{ background: c }} />
          ))}
        </div>

        {/* Sizes */}
        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(s)}
              className={cn("flex h-7 w-7 items-center justify-center rounded-lg hover:bg-background",
                size === s && "bg-background ring-1 ring-primary"
              )}>
              <span className="rounded-full bg-text" style={{ width: Math.min(s, 16), height: Math.min(s, 16) }} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1">
          <Button variant="secondary" size="sm" onClick={handleUndo}><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
          {canClear && <Button variant="secondary" size="sm" onClick={handleClear}><Trash2 className="h-3.5 w-3.5" /> Clear all</Button>}
          <Button variant="secondary" size="sm" onClick={downloadPNG}><Download className="h-3.5 w-3.5" /> Save PNG</Button>
          <Button variant="secondary" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white cursor-crosshair touch-none"
        style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
        onMouseDown={pointerDown}
        onMouseMove={pointerMove}
        onMouseUp={pointerUp}
        onMouseLeave={pointerUp}
        onTouchStart={pointerDown}
        onTouchMove={pointerMove}
        onTouchEnd={pointerUp}
      />
    </div>
  );
}
