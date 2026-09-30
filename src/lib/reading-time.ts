// Prose words only: fenced code isn't read word by word.
export const wordCount = (src: string) => src.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;

export function readingTime(src: string) {
  return Math.max(1, Math.round(wordCount(src) / 220));
}
