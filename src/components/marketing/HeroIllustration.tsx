import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

const PARTICIPANTS = [
  { name: "Alex", color: "#D94820", initials: "A", speaking: true },
  { name: "Sara", color: "#208050", initials: "S", speaking: false },
  { name: "Mike", color: "#E5B537", initials: "M", speaking: false },
  { name: "Priya", color: "#2B4C7E", initials: "P", speaking: false },
];

function VideoTile({
  participant,
  x,
  y,
  w,
  h,
  delay = 0,
  colors,
}: {
  participant: (typeof PARTICIPANTS)[0];
  x: number;
  y: number;
  w: number;
  h: number;
  delay?: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <rect x={x} y={y} width={w} height={h} rx={10} fill={colors.tile} stroke={participant.speaking ? participant.color : colors.border} strokeWidth={participant.speaking ? 2 : 1} />
      <circle cx={x + w / 2} cy={y + h / 2 - 8} r={18} fill={participant.color + "33"} />
      <circle cx={x + w / 2} cy={y + h / 2 - 8} r={12} fill={participant.color + "66"} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={colors.tileText}>{participant.initials}</text>
      <text x={x + 8} y={y + h - 10} fontSize={8} fill={colors.tileText} opacity={0.6}>{participant.name}</text>
      {participant.speaking && (
        <motion.circle
          cx={x + w - 12}
          cy={y + h - 12}
          r={4}
          fill="#208050"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
}

function useColors(isDark: boolean) {
  return isDark ? {
    card: "#181817",
    cardStroke: "#2C2C2A",
    topBar: "#222220",
    tile: "#222220",
    border: "#2C2C2A",
    panel: "#222220",
    panelStroke: "#2C2C2A",
    text: "#F2F2EF",
    tileText: "#FFFFFF",
    muted: "#9CA3AF",
    progressBg: "#2C2C2A",
  } : {
    card: "#FFFFFF",
    cardStroke: "#DEDDD9",
    topBar: "#F4F4F0",
    tile: "#F4F4F0",
    border: "#DEDDD9",
    panel: "#FFFFFF",
    panelStroke: "#DEDDD9",
    text: "#1C1C1A",
    tileText: "#1C1C1A",
    muted: "#666560",
    progressBg: "#DEDDD9",
  };
}

export function HeroIllustration({ className }: { className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const c = useColors(isDark);

  return (
    <div className={className}>
      <svg viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background card */}
        <rect x="10" y="10" width="400" height="360" rx="18" fill={c.card} stroke={c.cardStroke} strokeWidth="1.5" />

        {/* Top bar */}
        <rect x="10" y="10" width="400" height="36" rx="18" fill={c.topBar} />
        <rect x="10" y="28" width="400" height="18" fill={c.topBar} />
        <circle cx="30" cy="28" r="6" fill="#EF4444" opacity="0.7" />
        <circle cx="46" cy="28" r="6" fill="#E5B537" opacity="0.7" />
        <circle cx="62" cy="28" r="6" fill="#208050" opacity="0.7" />
        <text x="210" y="32" textAnchor="middle" fontSize="10" fill={c.muted} fontFamily="sans-serif">NexaMeet · Design Review</text>
        {/* Live badge */}
        <rect x="340" y="20" width="58" height="16" rx="8" fill="#EF444422" />
        <circle cx="350" cy="28" r="3" fill="#EF4444">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="357" y="32" fontSize="8" fill="#EF4444" fontFamily="sans-serif" fontWeight="700">● LIVE</text>

        {/* Main video tiles grid — 2x2 */}
        <VideoTile participant={PARTICIPANTS[0]} x={18} y={55} w={190} h={140} delay={0.1} colors={c} />
        <VideoTile participant={PARTICIPANTS[1]} x={214} y={55} w={190} h={140} delay={0.2} colors={c} />
        <VideoTile participant={PARTICIPANTS[2]} x={18} y={201} w={190} h={100} delay={0.3} colors={c} />
        <VideoTile participant={PARTICIPANTS[3]} x={214} y={201} w={100} h={100} delay={0.4} colors={c} />

        {/* You tile */}
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <rect x="320" y="201" width="84" height="100" rx="10" fill={c.tile} stroke="#D94820" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="362" y="250" textAnchor="middle" fontSize="8" fill="#D94820" opacity="0.7" fontFamily="sans-serif">You</text>
          <rect x="330" y="258" width="64" height="16" rx="4" fill="#D9482022" />
          <text x="362" y="270" textAnchor="middle" fontSize="7" fill="#D94820" fontFamily="sans-serif">Camera off</text>
        </motion.g>

        {/* AI Summary panel */}
        <motion.g
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <rect x="18" y="310" width="198" height="50" rx="10" fill={c.panel} stroke={c.panelStroke} />
          <rect x="26" y="318" width="8" height="8" rx="2" fill="#A78BFA" />
          <text x="40" y="326" fontSize="8" fill={c.text} fontWeight="700" fontFamily="sans-serif">AI Notes</text>
          <text x="26" y="340" fontSize="7" fill={c.muted} fontFamily="sans-serif">3 action items · transcript ready</text>
          <rect x="26" y="347" width="60" height="6" rx="3" fill={c.progressBg} />
          <rect x="26" y="347" width="38" height="6" rx="3" fill="#A78BFA55" />
          <rect x="92" y="347" width="40" height="6" rx="3" fill={c.progressBg} />
          <rect x="92" y="347" width="22" height="6" rx="3" fill="#A78BFA33" />
        </motion.g>

        {/* Chat panel */}
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <rect x="222" y="310" width="182" height="50" rx="10" fill={c.panel} stroke={c.panelStroke} />
          <text x="232" y="324" fontSize="8" fill={c.muted} fontFamily="sans-serif">Alex</text>
          <rect x="232" y="328" width="80" height="10" rx="5" fill="#D9482022" />
          <text x="236" y="336" fontSize="7" fill="#A78BFA" fontFamily="sans-serif">Looks great! · Done</text>
          <text x="232" y="350" fontSize="8" fill={c.muted} fontFamily="sans-serif">Sara</text>
          <rect x="232" y="352" width="60" height="8" rx="4" fill="#20805022" />
          <text x="236" y="358" fontSize="7" fill="#208050" fontFamily="sans-serif">Agreed</text>
        </motion.g>

        {/* Floating "Presenting" badge on tile 1 */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="22" y="60" width="68" height="16" rx="6" fill="#D94820CC" />
          <text x="56" y="71" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="sans-serif" fontWeight="600">Presenting</text>
        </motion.g>

        {/* Speaking wave animation on Alex tile */}
        {[0, 1, 2, 3].map((i) => (
          <motion.rect
            key={i}
            x={108 + (i - 1.5) * 6}
            width={4}
            rx={2}
            fill="#D94820"
            initial={{ height: 4, y: 180 }}
            animate={{ height: [4, 12, 4], y: [180, 176, 180] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
          />
        ))}

        {/* Connection quality badge */}
        <motion.g
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="214" y="60" width="72" height="16" rx="6" fill="#20805022" stroke="#20805055" strokeWidth="1" />
          <text x="250" y="71" textAnchor="middle" fontSize="7.5" fill="#208050" fontFamily="sans-serif" fontWeight="600"> HD · Stable</text>
        </motion.g>
      </svg>
    </div>
  );
}
