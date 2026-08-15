/**
 * EmaAvatarCanvas.tsx
 *
 * Dedicated Real-Time VRM 3D Canvas for Ema and Companion Avatars.
 * Integrates Three.js, @pixiv/three-vrm, time-locked visemes, and FACS blendshapes.
 */

import React from 'react';
import AvatarModelStage from './AvatarModelStage';
import type { AvatarDirective, AvatarState } from '../lib/avatarCall';
import type { AnimationFrameOutput } from '../lib/avatarAnimation';

export interface EmaAvatarCanvasProps {
  avatarId?: string;
  directive?: AvatarDirective;
  state?: AvatarState;
  modelUrl?: string;
  onFrameUpdate?: (out: AnimationFrameOutput) => void;
  className?: string;
  debugMode?: boolean;
}

export default function EmaAvatarCanvas(props: EmaAvatarCanvasProps) {
  return <AvatarModelStage {...props} />;
}
