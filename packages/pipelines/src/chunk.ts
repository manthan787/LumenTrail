export type TextChunk = {
  text: string;
  start: number;
  end: number;
};

export function chunkText(
  text: string,
  maxLength = 1200,
  overlap = 150
): TextChunk[] {
  if (!text.trim()) return [];

  const chunks: TextChunk[] = [];
  const step = Math.max(200, maxLength - overlap);
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const lastBreak = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"));
      if (lastBreak > 200) {
        end = start + lastBreak;
      }
    }

    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push({ text: slice, start, end });
    }

    if (end >= text.length) break;
    start = Math.max(end - overlap, start + step);
  }

  return chunks;
}
