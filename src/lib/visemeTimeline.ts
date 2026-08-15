/**
 * visemeTimeline.ts
 *
 * Industry-standard 15-viseme mapping (Oculus/ReadyPlayerMe/VRM compliant)
 * with time-synchronized keyframe interpolation and smooth blendshape transitions.
 */

export type VisemeName =
  | 'viseme_sil'
  | 'viseme_PP'
  | 'viseme_FF'
  | 'viseme_TH'
  | 'viseme_DD'
  | 'viseme_kk'
  | 'viseme_CH'
  | 'viseme_SS'
  | 'viseme_nn'
  | 'viseme_RR'
  | 'viseme_aa'
  | 'viseme_E'
  | 'viseme_I'
  | 'viseme_O'
  | 'viseme_U';

export interface VisemeKeyframe {
  viseme: VisemeName;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  weight: number;    // 0.0 to 1.0 peak weight
}

export interface VisemeTimeline {
  duration: number;
  keyframes: VisemeKeyframe[];
}

export interface CharacterAlignment {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

export type VisemeWeights = Record<VisemeName, number>;

export const ALL_VISEME_NAMES: VisemeName[] = [
  'viseme_sil',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
  'viseme_nn',
  'viseme_RR',
  'viseme_aa',
  'viseme_E',
  'viseme_I',
  'viseme_O',
  'viseme_U',
];

export function getZeroVisemeWeights(): VisemeWeights {
  return {
    viseme_sil: 1.0,
    viseme_PP: 0.0,
    viseme_FF: 0.0,
    viseme_TH: 0.0,
    viseme_DD: 0.0,
    viseme_kk: 0.0,
    viseme_CH: 0.0,
    viseme_SS: 0.0,
    viseme_nn: 0.0,
    viseme_RR: 0.0,
    viseme_aa: 0.0,
    viseme_E: 0.0,
    viseme_I: 0.0,
    viseme_O: 0.0,
    viseme_U: 0.0,
  };
}

/**
 * Maps sub-word character sequences to realistic viseme targets.
 */
function charGroupToViseme(chars: string): VisemeName {
  const c = chars.toLowerCase();
  if (/^[pbm]/.test(c)) return 'viseme_PP';
  if (/^[fv]/.test(c)) return 'viseme_FF';
  if (/^th/.test(c)) return 'viseme_TH';
  if (/^(ch|sh|j|zh)/.test(c)) return 'viseme_CH';
  if (/^[szc]/.test(c)) return 'viseme_SS';
  if (/^[dt]/.test(c)) return 'viseme_DD';
  if (/^[kgq]/.test(c)) return 'viseme_kk';
  if (/^[nl]/.test(c)) return 'viseme_nn';
  if (/^[rw]/.test(c)) return 'viseme_RR';
  if (/^(oo|u|ou)/.test(c)) return 'viseme_U';
  if (/^(o|aw|oa)/.test(c)) return 'viseme_O';
  if (/^(ee|ea|i|y)/.test(c)) return 'viseme_I';
  if (/^(e|ai|ay)/.test(c)) return 'viseme_E';
  if (/^(a|ah)/.test(c)) return 'viseme_aa';
  return 'viseme_sil';
}

/**
 * Builds a time-coded viseme timeline from spoken text and audio duration.
 */
export function createVisemeTimeline(text: string, durationSec: number): VisemeTimeline {
  const clean = text.trim();
  if (!clean || durationSec <= 0) {
    return { duration: Math.max(0.1, durationSec), keyframes: [] };
  }

  // Break text into words and punctuation
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { duration: durationSec, keyframes: [] };
  }

  const keyframes: VisemeKeyframe[] = [];
  const totalLetters = words.reduce((acc, w) => acc + w.length, 0);
  const timePerLetter = (durationSec * 0.9) / Math.max(1, totalLetters);
  let currentTime = durationSec * 0.05; // small start padding

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let charIdx = 0;

    while (charIdx < word.length) {
      const pair = word.slice(charIdx, charIdx + 2).toLowerCase();
      const single = word.slice(charIdx, charIdx + 1).toLowerCase();

      let targetViseme: VisemeName = 'viseme_sil';
      let consumed = 1;

      if (['th', 'ch', 'sh', 'oo', 'ee', 'ea', 'ai', 'ay', 'oa', 'ou'].includes(pair)) {
        targetViseme = charGroupToViseme(pair);
        consumed = 2;
      } else {
        targetViseme = charGroupToViseme(single);
        consumed = 1;
      }

      const isVowel = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'].includes(targetViseme);
      const stepDuration = Math.max(0.06, timePerLetter * (isVowel ? 1.4 : 0.85) * consumed);
      const endTime = Math.min(durationSec, currentTime + stepDuration);

      if (targetViseme !== 'viseme_sil') {
        keyframes.push({
          viseme: targetViseme,
          startTime: currentTime,
          endTime: endTime,
          weight: isVowel ? 0.95 : 0.8,
        });
      }

      currentTime = endTime;
      charIdx += consumed;
    }

    // Inter-word pause
    const hasPunctuation = /[.,!?;:]$/.test(word);
    currentTime += hasPunctuation ? 0.12 : 0.04;
  }

  return {
    duration: durationSec,
    keyframes,
  };
}

/**
 * Builds a timeline from provider-supplied character/audio alignment. The
 * phoneme classifier is still lightweight, but the timing comes from the
 * exact generated audio rather than text length or performance.now().
 */
export function createVisemeTimelineFromAlignment(alignment: CharacterAlignment): VisemeTimeline {
  const characters = alignment.characters || [];
  const starts = alignment.characterStartTimesSeconds || [];
  const ends = alignment.characterEndTimesSeconds || [];
  const duration = Math.max(0.1, ends.reduce((max, value) => Math.max(max, value || 0), 0));
  const keyframes: VisemeKeyframe[] = [];

  for (let index = 0; index < characters.length; index += 1) {
    const char = characters[index] || '';
    const startTime = Math.max(0, starts[index] || 0);
    const endTime = Math.max(startTime + 0.015, ends[index] || startTime + 0.015);
    const viseme = charGroupToViseme(char);
    if (viseme === 'viseme_sil' || /\s/.test(char)) continue;
    const isVowel = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'].includes(viseme);
    keyframes.push({
      viseme,
      startTime,
      endTime,
      weight: isVowel ? 0.95 : 0.72,
    });
  }

  return { duration, keyframes };
}

/**
 * Calculates smoothly blended viseme weights at exact audio playback time `t`.
 */
export function getVisemeWeightsAtTime(timeline: VisemeTimeline, currentTime: number): VisemeWeights {
  const weights = getZeroVisemeWeights();
  if (!timeline || timeline.keyframes.length === 0 || currentTime <= 0) {
    return weights;
  }

  let totalActiveWeight = 0;

  for (const kf of timeline.keyframes) {
    if (currentTime >= kf.startTime && currentTime <= kf.endTime) {
      const span = Math.max(0.001, kf.endTime - kf.startTime);
      const progress = (currentTime - kf.startTime) / span;

      // Smooth cosine bell curve
      const bell = Math.sin(progress * Math.PI);
      const currentWeight = bell * kf.weight;

      weights[kf.viseme] = Math.max(weights[kf.viseme], currentWeight);
      totalActiveWeight += currentWeight;
    }
  }

  // Silence weight is the inverse of active mouth articulation
  weights.viseme_sil = Math.max(0, 1 - Math.min(1, totalActiveWeight * 1.2));
  return weights;
}

/**
 * Translates viseme weights into standard facial blendshape targets
 * (jawOpen, mouthWide, mouthPucker, mouthSmile, etc.).
 */
export function visemeWeightsToBlendshapes(
  visemes: VisemeWeights,
  secondaryAmplitude: number = 0,
): {
  jawOpen: number;
  mouthWide: number;
  mouthPucker: number;
  mouthFunnel: number;
  mouthSmile: number;
  lipLowerDown: number;
  lipUpperUp: number;
} {
  const amp = Math.max(0, Math.min(1, secondaryAmplitude));

  const aa = visemes.viseme_aa;
  const o = visemes.viseme_O;
  const u = visemes.viseme_U;
  const e = visemes.viseme_E;
  const i = visemes.viseme_I;
  const ff = visemes.viseme_FF;
  const pp = visemes.viseme_PP;
  const ch = visemes.viseme_CH;
  const ss = visemes.viseme_SS;

  // Composite calculation
  const jaw = Math.min(1.0, aa * 0.95 + o * 0.65 + e * 0.5 + i * 0.35 + amp * 0.3);
  const wide = Math.min(1.0, e * 0.8 + i * 0.9 + ss * 0.4);
  const pucker = Math.min(1.0, u * 0.9 + o * 0.5);
  const funnel = Math.min(1.0, o * 0.8 + ch * 0.4);
  const lipDown = Math.min(1.0, ff * 0.7 + aa * 0.4);
  const lipUp = Math.min(1.0, ff * 0.6 + i * 0.3);

  // Closed lips (PP) forces jaw down close to zero
  const jawFactored = pp > 0.4 ? jaw * (1 - pp * 0.8) : jaw;

  return {
    jawOpen: Math.max(0.02, jawFactored),
    mouthWide: Math.max(0.1, wide),
    mouthPucker: pucker,
    mouthFunnel: funnel,
    mouthSmile: Math.max(0.15, wide * 0.5),
    lipLowerDown: lipDown,
    lipUpperUp: lipUp,
  };
}
