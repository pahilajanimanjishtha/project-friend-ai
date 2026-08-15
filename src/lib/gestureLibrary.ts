/**
 * gestureLibrary.ts
 *
 * Procedural bone trajectories, emotional blendshape modifiers,
 * and keyframe postures for full humanoid avatar gestures.
 */

import type { AvatarEmotion, AvatarGesture } from './avatarCall';

export interface BoneEulerAngles {
  x: number; // pitch (radians)
  y: number; // yaw   (radians)
  z: number; // roll  (radians)
}

export interface AvatarPose {
  head: BoneEulerAngles;
  neck: BoneEulerAngles;
  spine: BoneEulerAngles;
  chest: BoneEulerAngles;
  leftUpperArm: BoneEulerAngles;
  leftForearm: BoneEulerAngles;
  rightUpperArm: BoneEulerAngles;
  rightForearm: BoneEulerAngles;
}

export interface FacialExpressionWeights {
  browInnerUp: number;
  browDown: number;
  browOuterUp: number;
  eyeSquint: number;
  mouthSmile: number;
  mouthFrown: number;
  cheekPuff: number;
}

export function getDefaultPose(): AvatarPose {
  return {
    head: { x: 0, y: 0, z: 0 },
    neck: { x: 0, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    chest: { x: 0, y: 0, z: 0 },
    // Arms are intentionally neutral here. The imported GLB rest pose is the
    // authoritative attention pose; gestures provide temporary overrides.
    leftUpperArm: { x: 0, y: 0, z: 0 },
    leftForearm: { x: 0, y: 0, z: 0 },
    rightUpperArm: { x: 0, y: 0, z: 0 },
    rightForearm: { x: 0.0, y: 0, z: 0 },
  };
}

export function getEmotionBlendshapes(emotion: AvatarEmotion, intensity: number = 0.6): FacialExpressionWeights {
  const i = Math.max(0, Math.min(1, intensity));

  switch (emotion) {
    case 'happy':
    case 'celebratory':
      return {
        browInnerUp: 0.2 * i,
        browDown: 0.0,
        browOuterUp: 0.3 * i,
        eyeSquint: 0.25 * i,
        mouthSmile: 0.85 * i,
        mouthFrown: 0.0,
        cheekPuff: 0.3 * i,
      };
    case 'concerned':
      return {
        browInnerUp: 0.65 * i,
        browDown: 0.4 * i,
        browOuterUp: 0.0,
        eyeSquint: 0.2 * i,
        mouthSmile: 0.0,
        mouthFrown: 0.45 * i,
        cheekPuff: 0.0,
      };
    case 'reflective':
      return {
        browInnerUp: 0.3 * i,
        browDown: 0.2 * i,
        browOuterUp: 0.2 * i,
        eyeSquint: 0.15 * i,
        mouthSmile: 0.25 * i,
        mouthFrown: 0.0,
        cheekPuff: 0.0,
      };
    case 'caring':
    case 'warm':
      return {
        browInnerUp: 0.25 * i,
        browDown: 0.0,
        browOuterUp: 0.2 * i,
        eyeSquint: 0.15 * i,
        mouthSmile: 0.6 * i,
        mouthFrown: 0.0,
        cheekPuff: 0.15 * i,
      };
    case 'playful':
      return {
        browInnerUp: 0.4 * i,
        browDown: 0.0,
        browOuterUp: 0.4 * i,
        eyeSquint: 0.3 * i,
        mouthSmile: 0.8 * i,
        mouthFrown: 0.0,
        cheekPuff: 0.2 * i,
      };
    case 'neutral':
    default:
      return {
        browInnerUp: 0.05,
        browDown: 0.0,
        browOuterUp: 0.05,
        eyeSquint: 0.0,
        mouthSmile: 0.2,
        mouthFrown: 0.0,
        cheekPuff: 0.0,
      };
  }
}

/**
 * Computes real-time procedural bone rotations for an active gesture at time `elapsedSec`.
 */
export function computeGesturePose(
  gesture: AvatarGesture,
  elapsedSec: number,
  isSpeaking: boolean,
  gestureProgress: number = 1.0,
): AvatarPose {
  const pose = getDefaultPose();
  const t = elapsedSec;
  const p = Math.max(0, Math.min(1, gestureProgress));

  // Base idle breathing & micro-swaying (always active as underlying layer)
  const breathing = Math.sin(t * 1.6) * 0.02;
  const swayYaw = Math.sin(t * 0.7) * 0.025;
  const swayPitch = Math.cos(t * 0.5) * 0.015;

  pose.spine.x = breathing;
  pose.chest.x = breathing * 0.8;
  pose.head.y = swayYaw;
  pose.head.x = swayPitch;

  // If speaking, add vocal cadence head dynamics
  if (isSpeaking) {
    pose.head.x += Math.sin(t * 3.5) * 0.025;
    pose.head.y += Math.cos(t * 2.1) * 0.02;
    pose.neck.z += Math.sin(t * 1.8) * 0.015;
  }

  // Gesture-specific overrides with smooth progress blending
  switch (gesture) {
    case 'small-wave': {
      // Right arm raises up and oscillates in friendly greeting
      const waveArmAngleX = -1.4 * p;
      const waveArmAngleZ = 0.5 * p;
      const waveForearm = (0.9 + Math.sin(t * 7.5) * 0.35) * p;
      pose.rightUpperArm.x = waveArmAngleX;
      pose.rightUpperArm.z = waveArmAngleZ;
      pose.rightForearm.x = waveForearm;
      pose.head.z = -0.06 * p; // slight tilt toward wave
      pose.head.y += 0.04 * p;
      break;
    }

    case 'hand-heart': {
      // Right hand gently brought to chest
      pose.rightUpperArm.x = -0.85 * p;
      pose.rightUpperArm.y = -0.4 * p;
      pose.rightUpperArm.z = 0.3 * p;
      pose.rightForearm.x = 1.35 * p;
      pose.head.z = 0.08 * p; // warm tilt
      pose.head.x += 0.04 * p;
      pose.chest.x += 0.03 * p;
      break;
    }

    case 'open-palms': {
      // Welcoming open arms
      const openZ = 0.45 * p;
      pose.leftUpperArm.x = -0.4 * p;
      pose.leftUpperArm.z = -openZ;
      pose.leftForearm.x = 0.65 * p;

      pose.rightUpperArm.x = -0.4 * p;
      pose.rightUpperArm.z = openZ;
      pose.rightForearm.x = 0.65 * p;

      pose.head.x += -0.03 * p; // slight chin up
      break;
    }

    case 'thinking': {
      // Hand near chin / head tilted thoughtfully
      pose.head.z = -0.12 * p;
      pose.head.x = -0.08 * p;
      pose.head.y = 0.1 * p;
      pose.rightUpperArm.x = -0.9 * p;
      pose.rightUpperArm.y = -0.3 * p;
      pose.rightForearm.x = 1.4 * p;
      break;
    }

    case 'nod': {
      // Rhythmic affirmative nod with spring damping
      const nodPitch = Math.sin(t * 4.5) * 0.12 * p;
      pose.head.x += nodPitch;
      pose.neck.x += nodPitch * 0.5;
      break;
    }

    case 'tilt-head': {
      pose.head.z = 0.14 * p;
      pose.head.x += 0.02 * p;
      break;
    }

    case 'listen-lean': {
      // Attentive forward lean toward screen
      pose.spine.x = 0.09 * p;
      pose.chest.x = 0.08 * p;
      pose.head.x = -0.05 * p;
      pose.head.z = 0.05 * p;
      break;
    }

    case 'shrug': {
      pose.leftUpperArm.z = -0.35 * p;
      pose.leftForearm.x = 0.5 * p;
      pose.rightUpperArm.z = 0.35 * p;
      pose.rightForearm.x = 0.5 * p;
      pose.head.z = 0.08 * p;
      pose.chest.x -= 0.04 * p;
      break;
    }

    case 'idle':
    default:
      // standard natural posture
      break;
  }

  return pose;
}
