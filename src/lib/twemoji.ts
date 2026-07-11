/**
 * Converts an emoji string to its Twemoji SVG URL (via jsDelivr CDN).
 * Uses Twitter's open-source Twemoji set — consistent vector rendering
 * across all platforms and browsers, no npm dependency needed.
 *
 * Example: "👍" → "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44d.svg"
 */
export function emojiToTwemojiUrl(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined) {
      codePoints.push(cp.toString(16));
    }
  }
  const slug = codePoints.join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${slug}.svg`;
}
