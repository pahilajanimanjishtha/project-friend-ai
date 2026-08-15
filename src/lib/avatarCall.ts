export type AvatarTone = 'warm' | 'encouraging' | 'reflective' | 'celebratory' | 'concerned' | 'playful';

export type AvatarEmotion =
  | 'warm'
  | 'happy'
  | 'caring'
  | 'reflective'
  | 'concerned'
  | 'celebratory'
  | 'playful'
  | 'neutral';

export type AvatarGesture =
  | 'idle'
  | 'nod'
  | 'open-palms'
  | 'hand-heart'
  | 'thinking'
  | 'small-wave'
  | 'shrug'
  | 'tilt-head'
  | 'listen-lean';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'emotional'
  | 'gesture';

export interface AvatarDirective {
  tone: AvatarTone;
  expression: 'soft-smile' | 'attentive' | 'thoughtful' | 'bright' | 'concerned';
  gesture: AvatarGesture;
  emotion?: AvatarEmotion;
  intensity?: number; // 0.0 to 1.0
}

export interface SemanticAvatarPayload {
  text: string;
  emotion: AvatarEmotion;
  intensity: number;
  gesture: AvatarGesture;
  directive: AvatarDirective;
}

export interface CallTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  directive?: AvatarDirective;
  emotion?: AvatarEmotion;
  gesture?: AvatarGesture;
}

export const MAX_SESSION_TURNS = 24;

/**
 * Gives EMA a gentle, consistent lisp in spoken output without mangling the
 * readable transcript or the conversation model's context.
 */
export function applyEmaLisp(text: string): string {
  return text
    .replace(/s(?!h)/gi, (match) => (match === match.toUpperCase() ? 'TH' : 'th'))
    .replace(/z/gi, (match) => (match === match.toUpperCase() ? 'DH' : 'dh'));
}

export function clampSessionTurns(turns: CallTurn[]): CallTurn[] {
  return turns.slice(-MAX_SESSION_TURNS);
}

export function normalizeGesture(g: string | undefined): AvatarGesture {
  if (!g) return 'idle';
  const clean = g.toLowerCase().replace(/_/g, '-');
  const valid: AvatarGesture[] = [
    'idle',
    'nod',
    'open-palms',
    'hand-heart',
    'thinking',
    'small-wave',
    'shrug',
    'tilt-head',
    'listen-lean',
  ];
  return valid.includes(clean as AvatarGesture) ? (clean as AvatarGesture) : 'idle';
}

export function normalizeEmotion(e: string | undefined): AvatarEmotion {
  if (!e) return 'warm';
  const clean = e.toLowerCase();
  const valid: AvatarEmotion[] = [
    'warm',
    'happy',
    'caring',
    'reflective',
    'concerned',
    'celebratory',
    'playful',
    'neutral',
  ];
  return valid.includes(clean as AvatarEmotion) ? (clean as AvatarEmotion) : 'warm';
}

export function fallbackDirective(text: string): AvatarDirective {
  const value = text.toLowerCase();
  if (/(great|proud|wonderful|celebrate|excited|amazing|yay|awesome)/.test(value)) {
    return {
      tone: 'celebratory',
      expression: 'bright',
      gesture: 'open-palms',
      emotion: 'celebratory',
      intensity: 0.85,
    };
  }
  if (/(sorry|hard|worry|anxious|hurt|difficult|sad|cry|pain|lonely)/.test(value)) {
    return {
      tone: 'concerned',
      expression: 'concerned',
      gesture: 'hand-heart',
      emotion: 'concerned',
      intensity: 0.75,
    };
  }
  if (/(think|consider|notice|reflect|wonder|curious|perhaps|maybe)/.test(value)) {
    return {
      tone: 'reflective',
      expression: 'thoughtful',
      gesture: 'thinking',
      emotion: 'reflective',
      intensity: 0.6,
    };
  }
  if (/(hello|hi|hey|welcome|good morning|namaste)/.test(value)) {
    return {
      tone: 'warm',
      expression: 'bright',
      gesture: 'small-wave',
      emotion: 'happy',
      intensity: 0.7,
    };
  }
  return {
    tone: 'warm',
    expression: 'soft-smile',
    gesture: 'nod',
    emotion: 'warm',
    intensity: 0.5,
  };
}

export function safeDirective(value: unknown, responseText: string): AvatarDirective {
  const fallback = fallbackDirective(responseText);
  if (!value || typeof value !== 'object') return fallback;
  const source = value as Partial<AvatarDirective> & { emotion?: string; intensity?: number };

  const tones: AvatarTone[] = ['warm', 'encouraging', 'reflective', 'celebratory', 'concerned', 'playful'];
  const expressions: AvatarDirective['expression'][] = [
    'soft-smile',
    'attentive',
    'thoughtful',
    'bright',
    'concerned',
  ];

  const tone = tones.includes(source.tone as AvatarTone) ? (source.tone as AvatarTone) : fallback.tone;
  const expression = expressions.includes(source.expression as AvatarDirective['expression'])
    ? (source.expression as AvatarDirective['expression'])
    : fallback.expression;
  const gesture = normalizeGesture(source.gesture as string);
  const emotion = normalizeEmotion(source.emotion || tone);
  const rawIntensity = typeof source.intensity === 'number' ? source.intensity : fallback.intensity ?? 0.6;
  const intensity = Math.max(0, Math.min(1, rawIntensity));

  return {
    tone,
    expression,
    gesture,
    emotion,
    intensity,
  };
}
