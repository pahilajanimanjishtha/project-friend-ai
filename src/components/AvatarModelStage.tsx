import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { getAvatarById } from '../avatars';
import type { AvatarDirective, AvatarState } from '../lib/avatarCall';
import { avatarEngine, type AnimationFrameOutput } from '../lib/avatarAnimation';

export interface BoneEulerAngles {
  x: number;
  y: number;
  z: number;
}

export interface ArmPoseConfig {
  leftShoulder: BoneEulerAngles;
  leftArm: BoneEulerAngles;
  leftForearm: BoneEulerAngles;
  leftHand: BoneEulerAngles;
  rightShoulder: BoneEulerAngles;
  rightArm: BoneEulerAngles;
  rightForearm: BoneEulerAngles;
  rightHand: BoneEulerAngles;
}

export const DEFAULT_BASE_ATTENTION_POSE: ArmPoseConfig = {
  leftShoulder: { x: 0, y: 0, z: 0 },
  leftArm: { x: 1.35, y: 0.08, z: 0.02 },
  leftForearm: { x: 0.25, y: 0.05, z: 0.20 },
  leftHand: { x: 0.0, y: 0.0, z: 0.0 },
  rightShoulder: { x: 0, y: 0, z: 0 },
  rightArm: { x: 1.35, y: -0.08, z: -0.02 },
  rightForearm: { x: 0.25, y: -0.05, z: -0.20 },
  rightHand: { x: 0.0, y: 0.0, z: 0.0 },
};

interface StoredTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  euler: THREE.Euler;
}

interface StandardGlbRig {
  bones: Record<string, THREE.Object3D>;
  meshes: THREE.Mesh[];
  bindTransforms: Record<string, StoredTransform>;
}

function createStandardGlbRig(root: THREE.Object3D): StandardGlbRig {
  const bones: Record<string, THREE.Object3D> = {};
  const meshes: THREE.Mesh[] = [];
  const bindTransforms: Record<string, StoredTransform> = {};

  root.traverse((object) => {
    if (object.name) {
      bones[object.name] = object;
      bindTransforms[object.name] = {
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
        euler: object.rotation.clone(),
      };
    }
    if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  });

  const morphTargetNames = new Set<string>();
  for (const mesh of meshes) {
    Object.keys(mesh.morphTargetDictionary || {}).forEach((name) => morphTargetNames.add(name));
  }

  // STEP 1 & 2: Log authoritative bind transforms for armature inspection
  const keyBones = [
    'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
    'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
    'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  ];
  const loggedTransforms: Record<string, any> = {};
  for (const name of keyBones) {
    const t = bindTransforms[name];
    if (t) {
      loggedTransforms[name] = {
        quat: [t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w],
        eulerDeg: [
          THREE.MathUtils.radToDeg(t.euler.x).toFixed(1),
          THREE.MathUtils.radToDeg(t.euler.y).toFixed(1),
          THREE.MathUtils.radToDeg(t.euler.z).toFixed(1),
        ],
        trans: [t.position.x.toFixed(4), t.position.y.toFixed(4), t.position.z.toFixed(4)],
      };
    }
  }

  console.info('[Ema GLB Rig] Armature Bind Baseline Initialized:', {
    totalBones: Object.keys(bones).length,
    meshes: meshes.length,
    morphTargets: morphTargetNames.size,
    keyBoneBindTransforms: loggedTransforms,
  });

  return { bones, meshes, bindTransforms };
}

function setGlbMorph(rig: StandardGlbRig, name: string, value: number): void {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  for (const mesh of rig.meshes) {
    const dictionary = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;
    const index = dictionary?.[name];
    if (index !== undefined && influences) influences[index] = clamped;
  }
}

/**
 * Reset relevant bones to their true imported GLB bind transforms.
 */
function resetGlbToBindPose(rig: StandardGlbRig): void {
  for (const [name, bind] of Object.entries(rig.bindTransforms)) {
    const bone = rig.bones[name];
    if (bone) {
      bone.position.copy(bind.position);
      bone.quaternion.copy(bind.quaternion);
      bone.scale.copy(bind.scale);
    }
  }
}

/**
 * Apply relative rotation delta multiplied onto the original imported bind quaternion:
 * finalRotation = bindRotation × deltaRotation
 */
function applyGlbRelativeBoneRotation(
  rig: StandardGlbRig,
  names: string[],
  deltaEuler: BoneEulerAngles,
  blend: number = 1.0,
): void {
  const boneName = names.find((name) => rig.bones[name] && rig.bindTransforms[name]);
  if (!boneName) return;
  const bone = rig.bones[boneName];
  const bind = rig.bindTransforms[boneName];
  if (!bone || !bind) return;

  const deltaQ = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(deltaEuler.x, deltaEuler.y, deltaEuler.z, 'XYZ')
  );
  const targetQ = bind.quaternion.clone().multiply(deltaQ);

  if (blend >= 0.999) {
    bone.quaternion.copy(targetQ);
  } else {
    bone.quaternion.slerp(targetQ, blend);
  }
}

/**
 * Apply the runtime BASE ATTENTION POSE relative to the imported GLB bind baseline.
 */
function applyBaseAttentionPose(
  rig: StandardGlbRig,
  config: ArmPoseConfig = DEFAULT_BASE_ATTENTION_POSE,
  blend: number = 1.0,
): void {
  applyGlbRelativeBoneRotation(rig, ['LeftShoulder'], config.leftShoulder, blend);
  applyGlbRelativeBoneRotation(rig, ['LeftArm', 'LeftUpperArm'], config.leftArm, blend);
  applyGlbRelativeBoneRotation(rig, ['LeftForeArm', 'LeftLowerArm'], config.leftForearm, blend);
  applyGlbRelativeBoneRotation(rig, ['LeftHand'], config.leftHand, blend);

  applyGlbRelativeBoneRotation(rig, ['RightShoulder'], config.rightShoulder, blend);
  applyGlbRelativeBoneRotation(rig, ['RightArm', 'RightUpperArm'], config.rightArm, blend);
  applyGlbRelativeBoneRotation(rig, ['RightForeArm', 'RightLowerArm'], config.rightForearm, blend);
  applyGlbRelativeBoneRotation(rig, ['RightHand'], config.rightHand, blend);
}

function applyStandardGlbFrame(
  rig: StandardGlbRig,
  frame: AnimationFrameOutput | null,
  armConfig: ArmPoseConfig = DEFAULT_BASE_ATTENTION_POSE,
  isolatedPoseOnly: boolean = false,
): void {
  if (isolatedPoseOnly || !frame) {
    // Isolated Base Attention Pose Verification: only apply attention pose, no gestures/speech/eyes
    applyBaseAttentionPose(rig, armConfig, 1.0);
    return;
  }

  const { pose, morphs } = frame;

  // 1. Torso, Spine & Head adjustments relative to bind
  applyGlbRelativeBoneRotation(rig, ['Head'], pose.head, 0.25);
  applyGlbRelativeBoneRotation(rig, ['Neck', 'Neck1', 'Neck2'], pose.neck, 0.25);
  applyGlbRelativeBoneRotation(rig, ['Spine2', 'Spine1'], pose.chest, 0.2);
  applyGlbRelativeBoneRotation(rig, ['Spine'], pose.spine, 0.2);

  // 2. Base Attention Pose + Gesture Layering
  // Gestures are applied on top of the base attention pose and smoothly blend back
  if (frame.gestureActive) {
    // Check if gesture overrides left or right arm
    const hasLeftOverride = Math.abs(pose.leftUpperArm.x) > 0.01 || Math.abs(pose.leftUpperArm.z) > 0.01;
    const hasRightOverride = Math.abs(pose.rightUpperArm.x) > 0.01 || Math.abs(pose.rightUpperArm.z) > 0.01;

    if (hasLeftOverride) {
      applyGlbRelativeBoneRotation(rig, ['LeftArm', 'LeftUpperArm'], pose.leftUpperArm, 0.3);
      applyGlbRelativeBoneRotation(rig, ['LeftForeArm', 'LeftLowerArm'], pose.leftForearm, 0.3);
    } else {
      applyGlbRelativeBoneRotation(rig, ['LeftShoulder'], armConfig.leftShoulder, 0.15);
      applyGlbRelativeBoneRotation(rig, ['LeftArm', 'LeftUpperArm'], armConfig.leftArm, 0.15);
      applyGlbRelativeBoneRotation(rig, ['LeftForeArm', 'LeftLowerArm'], armConfig.leftForearm, 0.15);
      applyGlbRelativeBoneRotation(rig, ['LeftHand'], armConfig.leftHand, 0.15);
    }

    if (hasRightOverride) {
      applyGlbRelativeBoneRotation(rig, ['RightArm', 'RightUpperArm'], pose.rightUpperArm, 0.3);
      applyGlbRelativeBoneRotation(rig, ['RightForeArm', 'RightLowerArm'], pose.rightForearm, 0.3);
    } else {
      applyGlbRelativeBoneRotation(rig, ['RightShoulder'], armConfig.rightShoulder, 0.15);
      applyGlbRelativeBoneRotation(rig, ['RightArm', 'RightUpperArm'], armConfig.rightArm, 0.15);
      applyGlbRelativeBoneRotation(rig, ['RightForeArm', 'RightLowerArm'], armConfig.rightForearm, 0.15);
      applyGlbRelativeBoneRotation(rig, ['RightHand'], armConfig.rightHand, 0.15);
    }
  } else {
    // Default steady state (IDLE, LISTENING, THINKING, SPEAKING): always maintain Base Attention Pose
    applyBaseAttentionPose(rig, armConfig, 0.15);
  }

  // 3. ARKit-style Facial morph targets
  // The Aryan GLB exposes ARKit jaw/mouth targets rather than VRM visemes.
  // Drive the jaw more strongly from the synthesized viseme output and map
  // the supporting lip targets as well, so fallback/browser audio also moves
  // the GLB mouth.
  const glbJawOpen = Math.min(1, morphs.jawOpen * 1.25 + morphs.viseme_aa * 0.15);
  setGlbMorph(rig, 'jawOpen', glbJawOpen);
  setGlbMorph(rig, 'mouthFunnel', morphs.mouthFunnel);
  setGlbMorph(rig, 'mouthPucker', morphs.mouthPucker);
  setGlbMorph(rig, 'mouthStretchLeft', morphs.mouthWide);
  setGlbMorph(rig, 'mouthStretchRight', morphs.mouthWide);
  setGlbMorph(rig, 'mouthSmileLeft', morphs.mouthSmile);
  setGlbMorph(rig, 'mouthSmileRight', morphs.mouthSmile);
  setGlbMorph(rig, 'mouthFrownLeft', morphs.mouthFrown);
  setGlbMorph(rig, 'mouthFrownRight', morphs.mouthFrown);
  setGlbMorph(rig, 'mouthPressLeft', morphs.viseme_PP);
  setGlbMorph(rig, 'mouthPressRight', morphs.viseme_PP);
  setGlbMorph(rig, 'mouthLowerDownLeft', morphs.lipLowerDown);
  setGlbMorph(rig, 'mouthLowerDownRight', morphs.lipLowerDown);
  setGlbMorph(rig, 'mouthUpperUpLeft', morphs.lipUpperUp);
  setGlbMorph(rig, 'mouthUpperUpRight', morphs.lipUpperUp);
  setGlbMorph(rig, 'eyeBlinkLeft', morphs.eyeBlinkLeft);
  setGlbMorph(rig, 'eyeBlinkRight', morphs.eyeBlinkRight);
  setGlbMorph(rig, 'eyeSquintLeft', morphs.eyeSquint);
  setGlbMorph(rig, 'eyeSquintRight', morphs.eyeSquint);
  setGlbMorph(rig, 'browInnerUp', morphs.browInnerUp);
  setGlbMorph(rig, 'browDownLeft', morphs.browDown);
  setGlbMorph(rig, 'browDownRight', morphs.browDown);
  setGlbMorph(rig, 'eyeLookInLeft', Math.max(0, -morphs.eyeLookX));
  setGlbMorph(rig, 'eyeLookOutLeft', Math.max(0, morphs.eyeLookX));
  setGlbMorph(rig, 'eyeLookInRight', Math.max(0, morphs.eyeLookX));
  setGlbMorph(rig, 'eyeLookOutRight', Math.max(0, -morphs.eyeLookX));
  setGlbMorph(rig, 'eyeLookUpLeft', Math.max(0, morphs.eyeLookY));
  setGlbMorph(rig, 'eyeLookUpRight', Math.max(0, morphs.eyeLookY));
  setGlbMorph(rig, 'eyeLookDownLeft', Math.max(0, -morphs.eyeLookY));
  setGlbMorph(rig, 'eyeLookDownRight', Math.max(0, -morphs.eyeLookY));
  setGlbMorph(rig, 'eyeWideLeft', morphs.browInnerUp * 0.7);
  setGlbMorph(rig, 'eyeWideRight', morphs.browInnerUp * 0.7);
}

interface AvatarModelStageProps {
  avatarId?: string;
  directive?: AvatarDirective;
  state?: AvatarState;
  modelUrl?: string;
  amplitude?: number;
  onFrameUpdate?: (out: AnimationFrameOutput) => void;
  className?: string;
  debugMode?: boolean;
}

export default function AvatarModelStage({
  avatarId = 'ema',
  directive,
  state,
  modelUrl,
  amplitude,
  onFrameUpdate,
  className = 'w-full h-full',
  debugMode = false,
}: AvatarModelStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarData = getAvatarById(avatarId);
  const effectiveModelUrl = modelUrl || avatarData.modelPath || '/models/ema.vrm';

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Arm Debug Mode & Live Tuning State (?armDebug=1)
  const isDebugUrl = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('armDebug') || new URLSearchParams(window.location.search).has('armdebug'));
  const [showArmDebug, setShowArmDebug] = useState<boolean>(debugMode || isDebugUrl);
  const [armConfig, setArmConfig] = useState<ArmPoseConfig>(DEFAULT_BASE_ATTENTION_POSE);
  const [symmetryLock, setSymmetryLock] = useState<boolean>(true);
  const isGlbOnlyUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('glbOnly');
  const [isIsolatedPose, setIsIsolatedPose] = useState<boolean>(isGlbOnlyUrl);

  const armConfigRef = useRef(armConfig);
  armConfigRef.current = armConfig;
  const isIsolatedPoseRef = useRef(isIsolatedPose);
  isIsolatedPoseRef.current = isIsolatedPose;

  // Keep refs for imperative loop access
  const directiveRef = useRef(directive);
  const stateRef = useRef(state);
  const onFrameUpdateRef = useRef(onFrameUpdate);
  directiveRef.current = directive;
  stateRef.current = state;
  onFrameUpdateRef.current = onFrameUpdate;

  useEffect(() => {
    if (directive) {
      avatarEngine.applyDirective(directive);
    }
  }, [directive]);

  useEffect(() => {
    if (state) {
      avatarEngine.setState(state);
    }
  }, [state]);

  const updateArmParam = (
    side: 'left' | 'right',
    bone: 'Shoulder' | 'Arm' | 'Forearm' | 'Hand',
    axis: 'x' | 'y' | 'z',
    value: number,
  ) => {
    setArmConfig((prev) => {
      const key = `${side}${bone}` as keyof ArmPoseConfig;
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          [axis]: value,
        },
      };

      if (symmetryLock) {
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherKey = `${otherSide}${bone}` as keyof ArmPoseConfig;
        // In local bone coordinate systems, Y and Z flips for left vs right arm symmetry
        const mirrorFactor = (axis === 'y' || axis === 'z') ? -1 : 1;
        next[otherKey] = {
          ...next[otherKey],
          [axis]: value * mirrorFactor,
        };
      }

      return next;
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setLoadError(null);
    const modelRequestUrl = `${effectiveModelUrl}${effectiveModelUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

    // ── 1. Scene, Camera & Renderer ──────────────────────────────────────────
    const scene = new THREE.Scene();
    const gazeTarget = new THREE.Object3D();
    gazeTarget.position.set(0, 1.34, 2.5);
    scene.add(gazeTarget);
    const camera = new THREE.PerspectiveCamera(
      22,
      container.clientWidth / container.clientHeight,
      0.1,
      50,
    );
    // Conversational framing: eye-level framing showing complete head, torso, arms, and hands
    camera.position.set(0, 1.36, 5.8);
    camera.lookAt(0, 1.22, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ── 2. Studio Lighting Setup ─────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x161e38, 1.4);
    scene.add(hemiLight);

    // Warm Key Light (Front-Right)
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.6);
    keyLight.position.set(1.8, 2.8, 2.5);
    scene.add(keyLight);

    // Soft Cool Fill Light (Front-Left)
    const fillLight = new THREE.DirectionalLight(0xdde8ff, 1.1);
    fillLight.position.set(-2.0, 1.6, 2.0);
    scene.add(fillLight);

    // Dynamic Rim Light (Character Aura Glow Accent)
    const rimColor = new THREE.Color(avatarData.glowColor || '#6ee7f7');
    const rimLight = new THREE.PointLight(rimColor, 18, 7);
    rimLight.position.set(-1.8, 2.0, -1.2);
    scene.add(rimLight);

    const backGlow = new THREE.PointLight(rimColor, 10, 5);
    backGlow.position.set(1.5, 0.8, -1.2);
    scene.add(backGlow);

    // ── 3. Load Real Avatar ──────────────────────────────────────────────────
    let currentVrm: VRM | null = null;
    let standardGlbRig: StandardGlbRig | null = null;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelRequestUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (vrm) {
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);

          // Normalize VRM scale & centering to match studio stage framing
          const sourceBounds = new THREE.Box3().setFromObject(vrm.scene);
          const sourceSize = sourceBounds.getSize(new THREE.Vector3());
          const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
          const targetHeight = 1.75;
          const normalizationScale = sourceSize.y > 0 ? targetHeight / sourceSize.y : 1.45;
          vrm.scene.scale.setScalar(normalizationScale);
          vrm.scene.position.set(
            -sourceCenter.x * normalizationScale,
            -sourceBounds.min.y * normalizationScale,
            -sourceCenter.z * normalizationScale,
          );
          vrm.scene.rotation.y = 0;

          // Set natural base attention pose for VRM arms immediately
          const humanoid = vrm.humanoid;
          if (humanoid) {
            const lua = humanoid.getNormalizedBoneNode('leftUpperArm');
            const lla = humanoid.getNormalizedBoneNode('leftLowerArm');
            const rua = humanoid.getNormalizedBoneNode('rightUpperArm');
            const rla = humanoid.getNormalizedBoneNode('rightLowerArm');
            if (lua) lua.rotation.set(0.08, 0.05, -1.25);
            if (lla) lla.rotation.set(0.12, 0.20, -0.15);
            if (rua) rua.rotation.set(0.08, -0.05, 1.25);
            if (rla) rla.rotation.set(0.12, -0.20, 0.15);
          }

          currentVrm = vrm;
          scene.add(vrm.scene);
          setIsLoading(false);
        } else {
          // Standard skinned GLB: normalize scale & center
          const sourceBounds = new THREE.Box3().setFromObject(gltf.scene);
          const sourceSize = sourceBounds.getSize(new THREE.Vector3());
          const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
          const targetHeight = 2.2;
          const normalizationScale = sourceSize.y > 0 ? targetHeight / sourceSize.y : 1;
          gltf.scene.scale.setScalar(normalizationScale);
          gltf.scene.position.set(
            -sourceCenter.x * normalizationScale,
            -sourceBounds.min.y * normalizationScale,
            -sourceCenter.z * normalizationScale,
          );

          // Standard GLB Rig & Bind Baseline
          standardGlbRig = createStandardGlbRig(gltf.scene);
          // Apply initial Base Attention Pose immediately upon loading
          applyBaseAttentionPose(standardGlbRig, armConfigRef.current, 1.0);
          scene.add(gltf.scene);
          setIsLoading(false);
        }
      },
      undefined,
      (err) => {
        console.warn(`[AvatarModelStage] Model load notice for ${modelRequestUrl}:`, err);
        setLoadError('Failed to load avatar model asset');
        setIsLoading(false);
      },
    );

    // ── 4. Main Real-Time Animation Loop ─────────────────────────────────────
    let frameId = 0;
    let lastTime = performance.now();

    const animate = (timeMs: number) => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const nowSec = timeMs / 1000;
      const dt = Math.min((timeMs - lastTime) / 1000, 0.05);
      lastTime = timeMs;

      const isolatedMode = isIsolatedPoseRef.current;
      const frameOutput = isolatedMode ? null : avatarEngine.update(nowSec, dt);
      if (frameOutput && onFrameUpdateRef.current) {
        onFrameUpdateRef.current(frameOutput);
      }

      const pose = frameOutput?.pose;
      const morphs = frameOutput?.morphs;

      if (currentVrm && frameOutput && pose && morphs) {
        // VRM humanoid animation
        const humanoid = currentVrm.humanoid;
        if (humanoid) {
          const headNode = humanoid.getNormalizedBoneNode('head');
          const neckNode = humanoid.getNormalizedBoneNode('neck');
          const spineNode = humanoid.getNormalizedBoneNode('spine');
          const chestNode = humanoid.getNormalizedBoneNode('chest') || humanoid.getNormalizedBoneNode('upperChest');
          const leftUpperArmNode = humanoid.getNormalizedBoneNode('leftUpperArm');
          const leftLowerArmNode = humanoid.getNormalizedBoneNode('leftLowerArm');
          const rightUpperArmNode = humanoid.getNormalizedBoneNode('rightUpperArm');
          const rightLowerArmNode = humanoid.getNormalizedBoneNode('rightLowerArm');

          if (headNode) headNode.rotation.set(pose.head.x, pose.head.y, pose.head.z);
          if (neckNode) neckNode.rotation.set(pose.neck.x, pose.neck.y, pose.neck.z);
          if (spineNode) spineNode.rotation.set(pose.spine.x, pose.spine.y, pose.spine.z);
          if (chestNode) chestNode.rotation.set(pose.chest.x, pose.chest.y, pose.chest.z);

          // VRM Base Attention Pose: brings T-pose arms down naturally beside torso
          const hasLeftGesture = Math.abs(pose.leftUpperArm.x) > 0.02 || Math.abs(pose.leftUpperArm.y) > 0.02 || Math.abs(pose.leftUpperArm.z) > 0.02;
          const hasRightGesture = Math.abs(pose.rightUpperArm.x) > 0.02 || Math.abs(pose.rightUpperArm.y) > 0.02 || Math.abs(pose.rightUpperArm.z) > 0.02;

          if (leftUpperArmNode) {
            if (hasLeftGesture) {
              leftUpperArmNode.rotation.set(pose.leftUpperArm.x, pose.leftUpperArm.y, pose.leftUpperArm.z);
            } else {
              leftUpperArmNode.rotation.set(0.08, 0.05, -1.25);
            }
          }
          if (leftLowerArmNode) {
            if (hasLeftGesture) {
              leftLowerArmNode.rotation.set(pose.leftForearm.x, pose.leftForearm.y, pose.leftForearm.z);
            } else {
              leftLowerArmNode.rotation.set(0.12, 0.20, -0.15);
            }
          }
          if (rightUpperArmNode) {
            if (hasRightGesture) {
              rightUpperArmNode.rotation.set(pose.rightUpperArm.x, pose.rightUpperArm.y, pose.rightUpperArm.z);
            } else {
              rightUpperArmNode.rotation.set(0.08, -0.05, 1.25);
            }
          }
          if (rightLowerArmNode) {
            if (hasRightGesture) {
              rightLowerArmNode.rotation.set(pose.rightForearm.x, pose.rightForearm.y, pose.rightForearm.z);
            } else {
              rightLowerArmNode.rotation.set(0.12, -0.20, 0.15);
            }
          }
        }

        const expr = currentVrm.expressionManager;
        if (expr) {
          // Precise natural conversational mouth visemes (only open during actual phonemes)
          expr.setValue('aa', Math.min(1.0, morphs.viseme_aa * 0.9 + morphs.jawOpen * 0.3));
          expr.setValue('ih', Math.min(1.0, morphs.viseme_I * 0.85 + morphs.viseme_FF * 0.4));
          expr.setValue('ou', Math.min(1.0, morphs.viseme_U * 0.85 + morphs.mouthPucker * 0.5));
          expr.setValue('ee', Math.min(1.0, morphs.viseme_E * 0.85 + morphs.mouthWide * 0.4));
          expr.setValue('oh', Math.min(1.0, morphs.viseme_O * 0.9 + morphs.mouthFunnel * 0.4));

          // Natural energetic open eyes with clean blink cycle
          expr.setValue('blink', Math.min(1.0, (morphs.eyeBlinkLeft + morphs.eyeBlinkRight) * 0.5));
          expr.setValue('blinkLeft', morphs.eyeBlinkLeft);
          expr.setValue('blinkRight', morphs.eyeBlinkRight);

          // Keep full-face eye-closing presets neutral so eyes stay wide, bright & lively
          expr.setValue('happy', 0.0);
          expr.setValue('relaxed', 0.0);
          expr.setValue('sad', Math.min(0.25, morphs.mouthFrown * 0.3));
          expr.setValue('surprised', Math.min(0.35, morphs.browInnerUp * 0.5));
        }

        // Direct mesh morph target micro-tuning on Face mesh for a bright, energetic, gentle smile
        const faceMesh = (currentVrm.scene.getObjectByName('Face (merged)(Clone)') ||
          currentVrm.scene.getObjectByName('Face')) as THREE.SkinnedMesh | undefined;
        if (faceMesh && faceMesh.morphTargetDictionary && faceMesh.morphTargetInfluences) {
          const dict = faceMesh.morphTargetDictionary;
          const infl = faceMesh.morphTargetInfluences;

          if (dict['Fcl_MTH_Up'] !== undefined) {
            infl[dict['Fcl_MTH_Up']] = Math.min(0.55, 0.2 + morphs.mouthSmile * 0.35);
          }
          if (dict['Fcl_BRW_Joy'] !== undefined) {
            infl[dict['Fcl_BRW_Joy']] = Math.min(0.45, 0.15 + morphs.browOuterUp * 0.3);
          }
          if (dict['Fcl_EYE_Natural'] !== undefined) {
            infl[dict['Fcl_EYE_Natural']] = 0.85;
          }
        }

        gazeTarget.position.set(morphs.eyeLookX * 0.18, 1.34 + morphs.eyeLookY * 0.12, 2.5);
        if (currentVrm.lookAt) currentVrm.lookAt.target = gazeTarget;
        currentVrm.update(delta);
      } else if (standardGlbRig) {
        applyStandardGlbFrame(
          standardGlbRig,
          frameOutput,
          armConfigRef.current,
          isolatedMode,
        );
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    // ── 5. Resize Handling ───────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (currentVrm) {
        VRMUtils.deepDispose(currentVrm.scene);
      }
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [effectiveModelUrl, avatarData]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label={`Real-Time 3D Avatar for ${avatarData.name}`}
        role="img"
      />

      {/* Arm Pose Debug Panel (?armDebug=1) */}
      {showArmDebug && (
        <div className="absolute top-2 left-2 z-40 bg-[#070d18]/95 border border-[#6ee7f7]/40 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs sm:max-w-sm max-h-[92vh] overflow-y-auto text-[11px] text-slate-200 font-mono space-y-2.5 select-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-[#6ee7f7] flex items-center gap-1.5">
              🛠️ ARM POSE DEBUG (?armDebug=1)
            </span>
            <button
              onClick={() => setShowArmDebug(false)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={symmetryLock}
                onChange={(e) => setSymmetryLock(e.target.checked)}
                className="rounded accent-[#6ee7f7]"
              />
              <span>Symmetric Mirroring</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isIsolatedPose}
                onChange={(e) => setIsIsolatedPose(e.target.checked)}
                className="rounded accent-[#f59e0b]"
              />
              <span className={isIsolatedPose ? 'text-amber-400 font-bold' : ''}>Isolate Pose Mode</span>
            </label>
          </div>

          {/* Left Upper Arm */}
          <div className="bg-white/5 p-2 rounded-lg space-y-1">
            <div className="flex justify-between font-bold text-sky-300 text-[10px]">
              <span>Left Upper Arm (Pitch X / Yaw Y / Roll Z)</span>
              <span>{armConfig.leftArm.x.toFixed(2)} / {armConfig.leftArm.y.toFixed(2)} / {armConfig.leftArm.z.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['x', 'y', 'z'] as const).map((ax) => (
                <div key={`lArm_${ax}`} className="space-y-0.5">
                  <span className="text-[9px] uppercase text-slate-400">{ax}</span>
                  <input
                    type="range"
                    min={-3.14}
                    max={3.14}
                    step={0.01}
                    value={armConfig.leftArm[ax]}
                    onChange={(e) => updateArmParam('left', 'Arm', ax, parseFloat(e.target.value))}
                    className="w-full h-1 accent-[#6ee7f7] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Left Forearm */}
          <div className="bg-white/5 p-2 rounded-lg space-y-1">
            <div className="flex justify-between font-bold text-sky-300 text-[10px]">
              <span>Left Forearm (Elbow Bend & Direction)</span>
              <span>{armConfig.leftForearm.x.toFixed(2)} / {armConfig.leftForearm.y.toFixed(2)} / {armConfig.leftForearm.z.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['x', 'y', 'z'] as const).map((ax) => (
                <div key={`lFore_${ax}`} className="space-y-0.5">
                  <span className="text-[9px] uppercase text-slate-400">{ax}</span>
                  <input
                    type="range"
                    min={-3.14}
                    max={3.14}
                    step={0.01}
                    value={armConfig.leftForearm[ax]}
                    onChange={(e) => updateArmParam('left', 'Forearm', ax, parseFloat(e.target.value))}
                    className="w-full h-1 accent-[#6ee7f7] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Upper Arm (if not symmetric lock) */}
          {!symmetryLock && (
            <div className="bg-white/5 p-2 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-emerald-300 text-[10px]">
                <span>Right Upper Arm</span>
                <span>{armConfig.rightArm.x.toFixed(2)} / {armConfig.rightArm.y.toFixed(2)} / {armConfig.rightArm.z.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['x', 'y', 'z'] as const).map((ax) => (
                  <div key={`rArm_${ax}`} className="space-y-0.5">
                    <span className="text-[9px] uppercase text-slate-400">{ax}</span>
                    <input
                      type="range"
                      min={-3.14}
                      max={3.14}
                      step={0.01}
                      value={armConfig.rightArm[ax]}
                      onChange={(e) => updateArmParam('right', 'Arm', ax, parseFloat(e.target.value))}
                      className="w-full h-1 accent-emerald-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(armConfig, null, 2));
                console.info('[Ema GLB Rig] Current Base Attention Pose JSON:', JSON.stringify(armConfig, null, 2));
              }}
              className="flex-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 py-1 rounded text-[10px] font-bold cursor-pointer transition-all"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={() => setArmConfig(DEFAULT_BASE_ATTENTION_POSE)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/40 py-1 rounded text-[10px] cursor-pointer transition-all"
            >
              🔄 Reset Default
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button for Debug Mode when not open */}
      {!showArmDebug && (
        <button
          onClick={() => setShowArmDebug(true)}
          className="absolute top-2 left-2 z-30 bg-black/60 hover:bg-black/80 text-[#6ee7f7] border border-[#6ee7f7]/30 px-2 py-1 rounded-lg text-[10px] font-mono backdrop-blur-md cursor-pointer transition-all opacity-70 hover:opacity-100"
          title="Open Arm Pose Debugger"
        >
          ⚙️ Arm Pose Debug
        </button>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#040811]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30 pointer-events-none">
          <div
            className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: avatarData.glowColor, borderTopColor: 'transparent' }}
          />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 animate-pulse">
            Loading {avatarData.name} 3D Rig…
          </p>
        </div>
      )}

      {/* Load Error Notice */}
      {loadError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-950/80 border border-red-500/40 p-3 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between z-30">
          <span>⚠️ {loadError}</span>
        </div>
      )}
    </div>
  );
}
