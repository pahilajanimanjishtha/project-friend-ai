/**
 * avatarAnimation.ts
 *
 * Real-time Animation Orchestrator for 3D Humanoid Avatars.
 * Manages State Machine transitions, organic blinking physics,
 * eye saccades, emotional blendshapes, and audio-locked viseme synthesis.
 */

import {
  type AvatarDirective,
  type AvatarEmotion,
  type AvatarGesture,
  type AvatarState,
} from './avatarCall';
import {
  type VisemeTimeline,
  type VisemeWeights,
  getVisemeWeightsAtTime,
  getZeroVisemeWeights,
  visemeWeightsToBlendshapes,
} from './visemeTimeline';
import {
  type AvatarPose,
  computeGesturePose,
  getDefaultPose,
  getEmotionBlendshapes,
} from './gestureLibrary';
import { audioController } from './audioPlayback';

export interface FacialMorphTargets {
  // Visemes
  viseme_sil: number;
  viseme_PP: number;
  viseme_FF: number;
  viseme_TH: number;
  viseme_DD: number;
  viseme_kk: number;
  viseme_CH: number;
  viseme_SS: number;
  viseme_nn: number;
  viseme_RR: number;
  viseme_aa: number;
  viseme_E: number;
  viseme_I: number;
  viseme_O: number;
  viseme_U: number;

  // Primary FACS / Blendshapes
  jawOpen: number;
  mouthWide: number;
  mouthPucker: number;
  mouthFunnel: number;
  mouthSmile: number;
  mouthFrown: number;
  lipLowerDown: number;
  lipUpperUp: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeSquint: number;
  browInnerUp: number;
  browDown: number;
  browOuterUp: number;
  cheekPuff: number;
  eyeLookX: number; // -1 (left) to +1 (right)
  eyeLookY: number; // -1 (down) to +1 (up)
}

export interface AnimationFrameOutput {
  state: AvatarState;
  pose: AvatarPose;
  morphs: FacialMorphTargets;
  amplitude: number;
  audioTime: number;
  isSpeaking: boolean;
  activeViseme: string;
  activeGesture: AvatarGesture;
  gestureActive: boolean;
}

export class AvatarAnimationEngine {
  private currentState: AvatarState = 'idle';
  private currentEmotion: AvatarEmotion = 'warm';
  private emotionIntensity: number = 0.6;
  private currentGesture: AvatarGesture = 'idle';
  private gestureStartTime: number = 0;
  private gestureDuration: number = 2.5;

  private activeTimeline: VisemeTimeline | null = null;

  // Blinking system
  private nextBlinkTime: number = 2.5;
  private blinkDuration: number = 0.18;
  private isBlinking: boolean = false;
  private blinkStartTime: number = 0;

  // Eye saccade system
  private eyeTargetX: number = 0;
  private eyeTargetY: number = 0;
  private eyeCurrentX: number = 0;
  private eyeCurrentY: number = 0;
  private nextSaccadeTime: number = 1.8;

  constructor() {
    this.scheduleNextBlink(0);
  }

  public setState(state: AvatarState) {
    this.currentState = state;
  }

  public getState(): AvatarState {
    return this.currentState;
  }

  public getEyeTarget(): { x: number; y: number } {
    return { x: this.eyeCurrentX, y: this.eyeCurrentY };
  }

  public applyDirective(directive: AvatarDirective) {
    if (directive.emotion) this.currentEmotion = directive.emotion;
    if (directive.intensity !== undefined) this.emotionIntensity = directive.intensity;
    if (directive.gesture && directive.gesture !== 'idle') {
      this.triggerGesture(directive.gesture);
    }
  }

  public triggerGesture(gesture: AvatarGesture, durationSec: number = 2.8) {
    this.currentGesture = gesture;
    this.gestureStartTime = performance.now() / 1000;
    this.gestureDuration = durationSec;
  }

  public setSpeechTimeline(timeline: VisemeTimeline) {
    this.activeTimeline = timeline;
    this.currentState = 'speaking';
  }

  public clearSpeechTimeline() {
    this.activeTimeline = null;
    if (this.currentState === 'speaking') {
      this.currentState = 'idle';
    }
  }

  private scheduleNextBlink(currentTime: number) {
    // Human average blink is every 3 to 5 seconds
    this.nextBlinkTime = currentTime + 2.4 + Math.random() * 2.8;
  }

  private updateBlinking(currentTime: number): { blinkL: number; blinkR: number } {
    if (!this.isBlinking && currentTime >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkStartTime = currentTime;
      this.blinkDuration = 0.16 + Math.random() * 0.06;
    }

    if (this.isBlinking) {
      const elapsed = currentTime - this.blinkStartTime;
      if (elapsed >= this.blinkDuration) {
        this.isBlinking = false;
        this.scheduleNextBlink(currentTime);
        return { blinkL: 0, blinkR: 0 };
      }

      // Eyelid closes faster than it opens (realistic asymmetric blink curve)
      const progress = elapsed / this.blinkDuration;
      const weight = progress < 0.4 ? progress / 0.4 : 1 - (progress - 0.4) / 0.6;
      const clamped = Math.max(0, Math.min(1, weight));
      return { blinkL: clamped, blinkR: clamped };
    }

    return { blinkL: 0, blinkR: 0 };
  }

  private updateSaccades(currentTime: number, dt: number) {
    if (currentTime >= this.nextSaccadeTime) {
      // Natural gaze shifts within +/- 12 degrees
      if (this.currentState === 'thinking') {
        // Look up-right when thinking
        this.eyeTargetX = 0.35 + (Math.random() - 0.5) * 0.2;
        this.eyeTargetY = 0.4 + (Math.random() - 0.5) * 0.15;
      } else if (this.currentState === 'listening') {
        // Direct focused eye contact with micro-drift
        this.eyeTargetX = (Math.random() - 0.5) * 0.12;
        this.eyeTargetY = (Math.random() - 0.5) * 0.08;
      } else {
        this.eyeTargetX = (Math.random() - 0.5) * 0.35;
        this.eyeTargetY = (Math.random() - 0.5) * 0.25;
      }
      this.nextSaccadeTime = currentTime + 1.2 + Math.random() * 2.2;
    }

    // Smooth spring interpolation for eye saccades
    const speed = 12.0;
    this.eyeCurrentX += (this.eyeTargetX - this.eyeCurrentX) * Math.min(1.0, dt * speed);
    this.eyeCurrentY += (this.eyeTargetY - this.eyeCurrentY) * Math.min(1.0, dt * speed);
  }

  /**
   * Main animation tick called once per render frame.
   */
  public update(nowSec: number, dt: number): AnimationFrameOutput {
    const isAudioPlaying = audioController.isPlaying();
    const audioTime = audioController.getCurrentTime();
    const amplitude = audioController.getAmplitude();

    // Auto-transition speaking state based on audio playback
    if (isAudioPlaying && this.currentState !== 'speaking') {
      this.currentState = 'speaking';
    } else if (!isAudioPlaying && this.currentState === 'speaking') {
      this.currentState = 'idle';
      this.activeTimeline = null;
    }

    // 1. Blinking
    const { blinkL, blinkR } = this.updateBlinking(nowSec);

    // 2. Gaze saccades
    this.updateSaccades(nowSec, dt);

    // 3. Emotional base expression weights
    const emo = getEmotionBlendshapes(this.currentEmotion, this.emotionIntensity);

    // 4. Visemes calculation
    let visemeWeights: VisemeWeights = getZeroVisemeWeights();
    if (this.currentState === 'speaking') {
      if (this.activeTimeline) {
        visemeWeights = getVisemeWeightsAtTime(this.activeTimeline, audioTime);
      }
    }

    const mouthBlendshapes = visemeWeightsToBlendshapes(visemeWeights, amplitude);
    const activeViseme = Object.entries(visemeWeights)
      .filter(([name]) => name !== 'viseme_sil')
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'viseme_sil';

    // 5. Gestures & Pose
    let gestureProgress = 1.0;
    if (this.currentGesture !== 'idle') {
      const elapsedGesture = nowSec - this.gestureStartTime;
      if (elapsedGesture >= this.gestureDuration) {
        this.currentGesture = 'idle';
      } else {
        // Ease in / ease out
        const half = this.gestureDuration / 2;
        gestureProgress =
          elapsedGesture < half
            ? elapsedGesture / half
            : 1 - (elapsedGesture - half) / half;
      }
    }

    // Effective gesture selection based on state
    let activeGesture = this.currentGesture;
    if (activeGesture === 'idle') {
      if (this.currentState === 'listening') activeGesture = 'listen-lean';
      else if (this.currentState === 'thinking') activeGesture = 'thinking';
    }

    const pose = computeGesturePose(
      activeGesture,
      nowSec,
      this.currentState === 'speaking',
      gestureProgress,
    );

    // 6. Assemble Composite Morph Targets
    const morphs: FacialMorphTargets = {
      ...visemeWeights,
      jawOpen: mouthBlendshapes.jawOpen,
      mouthWide: Math.max(mouthBlendshapes.mouthWide, emo.mouthSmile * 0.4),
      mouthPucker: mouthBlendshapes.mouthPucker,
      mouthFunnel: mouthBlendshapes.mouthFunnel,
      mouthSmile: Math.max(mouthBlendshapes.mouthSmile, emo.mouthSmile),
      mouthFrown: emo.mouthFrown,
      lipLowerDown: mouthBlendshapes.lipLowerDown,
      lipUpperUp: mouthBlendshapes.lipUpperUp,
      eyeBlinkLeft: blinkL,
      eyeBlinkRight: blinkR,
      eyeSquint: Math.max(emo.eyeSquint, (blinkL + blinkR) * 0.2),
      browInnerUp: emo.browInnerUp,
      browDown: emo.browDown,
      browOuterUp: emo.browOuterUp,
      cheekPuff: emo.cheekPuff,
      eyeLookX: this.eyeCurrentX,
      eyeLookY: this.eyeCurrentY,
    };

    return {
      state: this.currentState,
      pose,
      morphs,
      amplitude,
      audioTime,
      isSpeaking: this.currentState === 'speaking',
      activeViseme,
      activeGesture,
      // listen-lean is an automatic torso/head behavior, not an arm gesture.
      // Keep the GLB arm rest pose untouched during LISTENING.
      gestureActive: this.currentGesture !== 'idle',
    };
  }
}

export const avatarEngine = new AvatarAnimationEngine();
