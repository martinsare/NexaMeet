import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NODES = [
  { cx: 50, cy: 50, r: 5,   color: "#D94820", delay: 0 },
  { cx: 78, cy: 28, r: 3.5, color: "#2B4C7E", delay: 0.4 },
  { cx: 22, cy: 35, r: 3,   color: "#E5793D", delay: 0.7 },
  { cx: 72, cy: 72, r: 4,   color: "#2B4C7E", delay: 1.0 },
  { cx: 28, cy: 72, r: 3,   color: "#D94820", delay: 1.3 },
  { cx: 85, cy: 52, r: 2.5, color: "#5C88CD", delay: 0.6 },
  { cx: 15, cy: 55, r: 2,   color: "#BD3915", delay: 1.6 },
];

const EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [2, 4],
];

// Animate a packet along an edge using translateX/Y (CSS, not SVG attrs)
function DataPacket({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <motion.circle
      r={1.2}
      fill="#D94820"
      style={{ x: x1, y: y1 }}
      animate={{ x: [x1, x2, x1], y: [y1, y2, y1], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// Ring that grows from center using scale (CSS transform, not SVG r attr)
function PulseRing({ delay }: { delay: number }) {
  return (
    <motion.circle
      cx={50} cy={50} r={6}
      fill="none"
      stroke="#D94820"
      strokeWidth={0.5}
      style={{ originX: "50px", originY: "50px" }}
      animate={{ scale: [1, 8], opacity: [0.7, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

export function PulseConnect({ className }: { className?: string }) {
  return (
    <div className={cn("relative pointer-events-none", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Ambient glow behind core */}
        <motion.circle
          cx={50} cy={50} r={10}
          fill="rgba(217,72,32,0.18)"
          animate={{ scale: [1, 1.5, 1] }}
          style={{ originX: "50px", originY: "50px" }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Pulsing rings */}
        {[0, 1, 2].map((i) => <PulseRing key={i} delay={i * 1} />)}

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const na = NODES[a], nb = NODES[b];
          return (
            <motion.line
              key={i}
              x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
              stroke="rgba(217,72,32,0.28)"
              strokeWidth={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: Math.max(na.delay, nb.delay) }}
            />
          );
        })}

        {/* Data packets */}
        {EDGES.slice(0, 5).map(([a, b], i) => {
          const na = NODES[a], nb = NODES[b];
          return <DataPacket key={i} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy} delay={i * 0.55 + 0.5} />;
        })}

        {/* Nodes — outer glow ring + core dot, both using scale not r */}
        {NODES.map((n, i) => (
          <motion.g key={i} style={{ originX: `${n.cx}px`, originY: `${n.cy}px` }}>
            {/* Glow ring */}
            <motion.circle
              cx={n.cx} cy={n.cy} r={n.r + 2.5}
              fill="none"
              stroke={n.color}
              strokeWidth={0.6}
              style={{ originX: `${n.cx}px`, originY: `${n.cy}px` }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.8], opacity: [0, 0.5, 0] }}
              transition={{ duration: 2.5, delay: n.delay + 0.4, repeat: Infinity, ease: "easeOut" }}
            />
            {/* Core */}
            <motion.circle
              cx={n.cx} cy={n.cy} r={n.r}
              fill={n.color}
              style={{ originX: `${n.cx}px`, originY: `${n.cy}px` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: 1 }}
              transition={{ duration: 2.5, delay: n.delay, repeat: Infinity }}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
