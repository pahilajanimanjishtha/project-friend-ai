import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AvatarDirective } from '../lib/avatarCall';

interface AvatarModelStageProps {
  directive: AvatarDirective;
  amplitude: number;
  modelUrl?: string;
}

/** Three.js renderer with a graceful procedural avatar until /models/friend-avatar.glb is supplied. */
export default function AvatarModelStage({ directive, amplitude, modelUrl = '/models/friend-avatar.glb' }: AvatarModelStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const headRef = useRef<THREE.Group | null>(null);
  const gestureRef = useRef<THREE.Group | null>(null);
  const directiveRef = useRef(directive);
  const amplitudeRef = useRef(amplitude);
  directiveRef.current = directive;
  amplitudeRef.current = amplitude;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.15, 5.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff5df, 0x18214b, 2.5));
    const key = new THREE.DirectionalLight(0xffe0b1, 3.2); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.PointLight(0x9287ff, 18, 10); rim.position.set(-3, 1, 2); scene.add(rim);
    const avatar = new THREE.Group(); scene.add(avatar);
    const skin = new THREE.MeshStandardMaterial({ color: 0xc78969, roughness: .72 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x191822, roughness: .75 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x5066b8, roughness: .62 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.78, 1.45, 12, 24), shirt); torso.position.y = -1.5; avatar.add(torso);
    const head = new THREE.Group(); head.position.y = .35; avatar.add(head); headRef.current = head;
    const face = new THREE.Mesh(new THREE.SphereGeometry(.96, 32, 24), skin); face.scale.set(.88, 1.06, .82); head.add(face);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.98, 32, 24, 0, Math.PI * 2, 0, 1.75), hair); hairCap.scale.set(.91, 1.08, .85); hairCap.position.y = .12; head.add(hairCap);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x171525 });
    [-.31, .31].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), eyeMaterial); eye.position.set(x, .27, .76); head.add(eye); });
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 12), new THREE.MeshStandardMaterial({ color: 0x663444 })); mouth.scale.set(1.6, .18, .2); mouth.position.set(0, -.28, .75); head.add(mouth); mouthRef.current = mouth;
    const arms = new THREE.Group(); arms.position.y = -1.0; avatar.add(arms); gestureRef.current = arms;
    [-1, 1].forEach(direction => { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.14, 1.0, 8, 14), shirt); arm.position.set(direction * .82, -.2, 0); arm.rotation.z = direction * -.28; arms.add(arm); });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshBasicMaterial({ color: 0x111a3a, transparent: true, opacity: .6 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.3; scene.add(floor);

    // The production GLB may expose named morph targets (e.g. mouthOpen) and animation clips.
    // This loader keeps the procedural avatar as a reliable fallback during asset delivery.
    const loader = new GLTFLoader();
    loader.load(modelUrl, gltf => { avatar.visible = false; gltf.scene.scale.setScalar(1.75); gltf.scene.position.y = -2.15; scene.add(gltf.scene); }, undefined, () => undefined);
    let frame = 0;
    const animate = () => { frame = requestAnimationFrame(animate); const d = directiveRef.current; const amp = amplitudeRef.current; if (mouthRef.current) mouthRef.current.scale.y = .18 + Math.min(.7, amp * 2.8); if (headRef.current) headRef.current.rotation.z = d.gesture === 'thinking' ? -.07 : Math.sin(Date.now() / 900) * .025; if (gestureRef.current) gestureRef.current.rotation.z = d.gesture === 'open-palms' ? Math.sin(Date.now() / 450) * .22 : d.gesture === 'hand-heart' ? -.24 : 0; renderer.render(scene, camera); };
    animate();
    const resize = () => { renderer.setSize(host.clientWidth, host.clientHeight); camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.dispose(); host.removeChild(renderer.domElement); };
  }, [modelUrl]);
  return <div ref={hostRef} className="absolute inset-0" aria-label={`3D avatar, ${directive.expression} expression`} role="img" />;
}
