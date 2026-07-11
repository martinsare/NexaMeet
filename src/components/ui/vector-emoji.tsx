import { emojiToTwemojiUrl } from "@/lib/twemoji";

/**
 * Renders an emoji as a crisp vector SVG image (Twemoji).
 * Use instead of raw emoji characters for consistent cross-platform rendering.
 */
export function VectorEmoji({
  emoji,
  size = 20,
  className,
}: {
  emoji: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={emojiToTwemojiUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
