/**
 * Crisis Safety Filter — Intercepts user messages for crisis/self-harm keywords.
 *
 * When a match is detected, the normal LLM pipeline is bypassed and a hardcoded
 * safety response is returned along with emergency helpline information.
 *
 * This runs BEFORE any LLM call in the avatar-conversation and chat pipelines.
 */

/** Keywords that indicate a crisis situation requiring immediate safety response. */
const CRISIS_KEYWORDS: string[] = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'self harm',
  'self-harm',
  'hurt myself',
  'want to end it',
  'overdose',
  'cut myself',
  'cutting myself',
  'hang myself',
  'jump off',
  'take my life',
  'not worth living',
  'better off dead',
  'no reason to live',
  'end it all',
  'harm myself',
];

export interface CrisisDetectionResult {
  /** Whether crisis keywords were detected. */
  isCrisis: boolean;
  /** The specific keywords that matched (empty if no crisis). */
  matchedKeywords: string[];
}

/**
 * Scans user text for crisis-indicating keywords.
 * Uses case-insensitive whole-phrase matching to reduce false positives.
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  if (!text || typeof text !== 'string') {
    return { isCrisis: false, matchedKeywords: [] };
  }

  const normalizedText = text.toLowerCase().trim();
  const matchedKeywords = CRISIS_KEYWORDS.filter((keyword) =>
    normalizedText.includes(keyword)
  );

  return {
    isCrisis: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

/** Hardcoded safety response spoken by the avatar when crisis is detected. */
export const CRISIS_AVATAR_RESPONSE =
  "I hear you, and I want you to know that you are not alone in this. " +
  "What you're feeling matters deeply. Right now, the most important thing " +
  "is to connect with someone who is trained to help. Please reach out to " +
  "a crisis helpline — they are free, confidential, and available 24/7. " +
  "I'm going to show you some numbers on screen. Will you stay with me?";

/** Emergency helpline data displayed in the crisis modal. */
export interface Helpline {
  region: string;
  name: string;
  number: string;
  description: string;
}

export const CRISIS_HELPLINES: Helpline[] = [
  {
    region: '🇮🇳 India',
    name: 'Vandrevala Foundation',
    number: '+91 9999 666 555',
    description: 'Free, 24/7 multilingual mental health support.',
  },
  {
    region: '🇮🇳 India',
    name: 'iCall (TISS)',
    number: '+91 9152 987 821',
    description: 'Mon–Sat 8am–10pm. Professional psychosocial support.',
  },
  {
    region: '🇺🇸🇨🇦 USA & Canada',
    name: 'Suicide & Crisis Lifeline',
    number: '988',
    description: 'Call or text 988, available 24/7.',
  },
  {
    region: '🇬🇧 United Kingdom',
    name: 'Samaritans',
    number: '116 123',
    description: 'Free, confidential support 24/7.',
  },
  {
    region: '🌍 International',
    name: 'Find a Helpline',
    number: 'findahelpline.com',
    description: 'Search for crisis support in your country.',
  },
];
