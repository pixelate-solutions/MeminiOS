export interface TextChunk {
  ordinal: number;
  content: string;
  start: number;
  end: number;
  tokenEstimate: number;
}

export function chunkText(
  input: string,
  targetCharacters = 1_500,
  overlapCharacters = 180,
): TextChunk[] {
  if (targetCharacters < 200) throw new Error("targetCharacters must be at least 200");
  if (overlapCharacters < 0 || overlapCharacters >= targetCharacters) {
    throw new Error("overlapCharacters must be non-negative and smaller than targetCharacters");
  }
  const content = input.trim();
  if (!content) return [];
  const chunks: TextChunk[] = [];
  let start = 0;
  while (start < content.length) {
    const maximumEnd = Math.min(content.length, start + targetCharacters);
    const window = content.slice(start, maximumEnd);
    const paragraphBreak = window.lastIndexOf("\n\n");
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
    );
    const naturalBreak = paragraphBreak > targetCharacters * 0.55 ? paragraphBreak : sentenceBreak;
    const end =
      maximumEnd === content.length
        ? maximumEnd
        : start + (naturalBreak > targetCharacters * 0.55 ? naturalBreak + 1 : window.length);
    const value = content.slice(start, end).trim();
    chunks.push({
      ordinal: chunks.length,
      content: value,
      start,
      end,
      tokenEstimate: Math.ceil(value.length / 4),
    });
    if (end >= content.length) break;
    start = Math.max(start + 1, end - overlapCharacters);
  }
  return chunks;
}
