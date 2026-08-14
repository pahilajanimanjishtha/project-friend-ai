export type AvatarTone = 'warm' | 'encouraging' | 'reflective' | 'celebratory' | 'concerned';
export type AvatarGesture = 'idle' | 'nod' | 'open-palms' | 'hand-heart' | 'thinking';

export interface AvatarDirective {
  tone: AvatarTone;
  expression: 'soft-smile' | 'attentive' | 'thoughtful' | 'bright' | 'concerned';
  gesture: AvatarGesture;
}

export interface CallTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  directive?: AvatarDirective;
}

export const MAX_SESSION_TURNS = 24;

export function clampSessionTurns(turns: CallTurn[]) {
  return turns.slice(-MAX_SESSION_TURNS);
}

export function fallbackDirective(text: string): AvatarDirective {
  const value = text.toLowerCase();
  if (/(great|proud|wonderful|celebrate|excited)/.test(value)) {
    return { tone: 'celebratory', expression: 'bright', gesture: 'open-palms' };
  }
  if (/(sorry|hard|worry|anxious|hurt|difficult)/.test(value)) {
    return { tone: 'concerned', expression: 'concerned', gesture: 'hand-heart' };
  }
  if (/(think|consider|notice|reflect|wonder)/.test(value)) {
    return { tone: 'reflective', expression: 'thoughtful', gesture: 'thinking' };
  }
  return { tone: 'warm', expression: 'soft-smile', gesture: 'nod' };
}

export function safeDirective(value: unknown, responseText: string): AvatarDirective {
  const fallback = fallbackDirective(responseText);
  if (!value || typeof value !== 'object') return fallback;
  const source = value as Partial<AvatarDirective>;
  const tones: AvatarTone[] = ['warm', 'encouraging', 'reflective', 'celebratory', 'concerned'];
  const expressions: AvatarDirective['expression'][] = ['soft-smile', 'attentive', 'thoughtful', 'bright', 'concerned'];
  const gestures: AvatarGesture[] = ['idle', 'nod', 'open-palms', 'hand-heart', 'thinking'];
  return {
    tone: tones.includes(source.tone as AvatarTone) ? source.tone as AvatarTone : fallback.tone,
    expression: expressions.includes(source.expression as AvatarDirective['expression']) ? source.expression as AvatarDirective['expression'] : fallback.expression,
    gesture: gestures.includes(source.gesture as AvatarGesture) ? source.gesture as AvatarGesture : fallback.gesture,
  };
}
