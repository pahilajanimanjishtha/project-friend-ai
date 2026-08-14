export type CrisisMatch = { phrase: string; level: "urgent" | "support" } | null;

// Phrase-level checks reduce false positives such as: "my friend is depressed".
// This is an interface-level safety net, not a clinical assessment or emergency service.
const URGENT_PATTERNS = [
  /\b(?:want|going|plan(?:ning)?|thinking)\s+to\s+(?:kill|hurt)\s+myself\b/i,
  /\b(?:end|take)\s+my\s+life\b/i,
  /\b(?:suicide|suicidal)\b/i,
  /\b(?:self[-\s]?harm|cut\s+myself)\b/i,
  /\bi\s+(?:do not|don't)\s+want\s+to\s+live\b/i,
];
const SUPPORT_PATTERNS = [/\bdepressed\b/i, /\bhopeless\b/i, /\bcan't\s+go\s+on\b/i, /\bwant\s+to\s+disappear\b/i];

export function detectCrisis(text: string): CrisisMatch {
  const urgent = URGENT_PATTERNS.find((pattern) => pattern.test(text));
  if (urgent) return { phrase: urgent.source, level: "urgent" };
  const support = SUPPORT_PATTERNS.find((pattern) => pattern.test(text));
  return support ? { phrase: support.source, level: "support" } : null;
}
