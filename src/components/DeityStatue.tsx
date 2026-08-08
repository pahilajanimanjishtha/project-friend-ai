import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Shield, Activity, Trophy, Sparkles
} from 'lucide-react';

interface DeityStatueProps {
  deityId: string;
  isTyping: boolean;
  wantedStress: number;
  triggerGtaNotif: (text: string, color?: string) => void;
}

// =========================================================================
// REAL-TIME WEB AUDIO SYNTHESIZER FOR CHIPS & SOUND EFFECTS
// =========================================================================
function playUiSound(type: 'click' | 'blessing' | 'restore' | 'level-up') {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start();
      osc.stop(now + 0.12);
    } else if (type === 'blessing') {
      const notes = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.07);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + idx * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.07);
        o.stop(now + idx * 0.07 + 0.55);
      });
    } else if (type === 'restore') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start();
      osc.stop(now + 0.28);
    } else if (type === 'level-up') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.06);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.09, now + idx * 0.06 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.06);
        o.stop(now + idx * 0.06 + 0.5);
      });
    }
  } catch (e) {
    console.error("Audio synth error", e);
  }
}

interface DeityTheme {
  title: string;
  status: string;
  glowColor: string;
  badgeBg: string;
  haloRays: number;
  statName: string;
  blessingName: string;
  blessingText: string;
}

const DEITY_THEMES: Record<string, DeityTheme> = {
  'zeus': {
    title: 'Krishna (Zeus)',
    status: 'SKY SOVEREIGN ACTIVE',
    glowColor: '#ffd700',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    haloRays: 16,
    statName: 'Sovereignty',
    blessingName: "Krishna's Thunder Dome",
    blessingText: "SOVEREIGN SHIELD ACQUIRED: Boundaries solidified, lightning barrier charged!"
  },
  'athena': {
    title: 'Hope (Athena)',
    status: 'TACTICAL OPTIMIZATION ONLINE',
    glowColor: '#84a98c',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    haloRays: 12,
    statName: 'Tactics',
    blessingName: "Hope's Wisdom Eye",
    blessingText: "DBT CLARITY OPTIMIZED: Hyper-rational dialectic balanced, confusion dispelled!"
  },
  'sisyphus': {
    title: 'Raag (Sisyphus)',
    status: 'GRAVITATIONAL EQUILIBRIUM',
    glowColor: '#b38a58',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    haloRays: 8,
    statName: 'Somatic Mass',
    blessingName: "Raag's Stone Rest",
    blessingText: "SOMATIC BALLAST CHARGED: Hands resting on stone. The hill does not define you!"
  },
  'persephone-soul': {
    title: 'Rooh (Persephone)',
    status: 'SOUL EMISSION CALM',
    glowColor: '#9fa6ff',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    haloRays: 14,
    statName: 'Empathy Output',
    blessingName: "Rooh's Deep Transit",
    blessingText: "SOUL BOUNDARY RESTORED: Heavy emotional sponges squeezed out clean!"
  },
  'persephone-witness': {
    title: 'Inayat (Persephone)',
    status: 'COMPASSIONATE WITNESS',
    glowColor: '#a78bfa',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    haloRays: 14,
    statName: 'Observation',
    blessingName: "Inayat's Seasons Bloom",
    blessingText: "WITNESS SHIELD GRANTED: Transitions grieved, roots safe under deep soil!"
  },
  'dionysus': {
    title: 'Ganesh (Dionysus)',
    status: 'REFRAMING DELIRIUM ACTIVE',
    glowColor: '#ec4899',
    badgeBg: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    haloRays: 18,
    statName: 'Reframing Spin',
    blessingName: "Ganesh's Chittara Dance",
    blessingText: "COGNITIVE CHAOS SHIFT: Playful reframing activated, catastrophic thoughts spun!"
  },
  'astra': {
    title: 'Taara (Astra)',
    status: 'PATHFINDER TELEMETRY',
    glowColor: '#f1f5f9',
    badgeBg: 'bg-slate-300/10 border-slate-300/30 text-slate-300',
    haloRays: 20,
    statName: 'Star Constellation',
    blessingName: "Taara's Constellation Guide",
    blessingText: "PATHFINDING VECTOR ENABLED: Starlit guide lines drawn on your dark map!"
  },
  'hades': {
    title: 'Veer (Hades)',
    status: 'UNDERWORLD COIN SECURE',
    glowColor: '#c9a45c',
    badgeBg: 'bg-yellow-600/10 border-yellow-600/30 text-yellow-500',
    haloRays: 10,
    statName: 'Obsidian Depth',
    blessingName: "Veer's Vault Seal",
    blessingText: "UNDERWORLD GROUNDING SEALED: Local vaults locked, dark space safe for resting!"
  },
  'sappho': {
    title: 'Manjishtha (Sappho)',
    status: 'NARRATIVE LYRIC ACTIVE',
    glowColor: '#f43f5e',
    badgeBg: 'bg-red-500/10 border-red-500/30 text-red-400',
    haloRays: 15,
    statName: 'Poetic Pulse',
    blessingName: "Manjishtha's Lyre Weave",
    blessingText: "NARRATIVE CHAPTER OVERWRITTEN: A kinder, softer poetry line inscribed!"
  },
  'ares': {
    title: 'Rudra (Ares)',
    status: 'ALCHEMICAL RAGE FIRE',
    glowColor: '#f97316',
    badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    haloRays: 16,
    statName: 'Rage Alchemy',
    blessingName: "Rudra's Fire Seat",
    blessingText: "FIRE CHALICE INITIATED: Sitting in the flame without burning. Anger converted!"
  },
  'poseidon': {
    title: 'Jhulelal (Poseidon)',
    status: 'OCEANIC STORM PACIFIED',
    glowColor: '#0ea5e9',
    badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    haloRays: 14,
    statName: 'Wave Frequency',
    blessingName: "Jhulelal's Sea Calm",
    blessingText: "OCEAN WAVE BREATH HARMONIZED: Oceanic tide pacing settled, lungs expanded!"
  },
  'medusa': {
    title: 'Medusa (Devi)',
    status: 'EMERALD SHIELD ACTIVE',
    glowColor: '#34d399',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    haloRays: 12,
    statName: 'Fierce Boundary',
    blessingName: "Medusa's Stone Gaze Shield",
    blessingText: "SHIELD ACTIVATED: Harmful gaze turned to stone. You are safe, validated, and fiercely protected!"
  }
};

export default function DeityStatue({ deityId, isTyping, wantedStress, triggerGtaNotif }: DeityStatueProps) {
  const theme = DEITY_THEMES[deityId] || DEITY_THEMES['athena'];

  const renderFloatingArtifact = () => {
    switch (deityId) {
      case 'zeus':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6s linear infinite' }}>
            <svg className="w-14 h-14 drop-shadow-[0_0_10px_#ffd700] animate-[spin-slow_4s_linear_infinite]" viewBox="0 0 50 50">
              <path d="M25 5 L12 25 L23 25 L15 45 L38 22 L27 22 Z" fill="#ffd700" stroke="#facc15" strokeWidth="1.5" />
              <path d="M25 8 L16 23 L25 23 L19 40 L34 22 L25 22 Z" fill="#fff" opacity="0.6" />
            </svg>
          </div>
        );

      case 'athena':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 7s linear infinite' }}>
            <div className="animate-[float-gentle_2s_ease-in-out_infinite]">
              <svg className="w-12 h-12 drop-shadow-[0_0_8px_#84a98c]" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="16" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
                <polygon points="12,14 17,19 9,21" fill="#334155" />
                <polygon points="38,14 33,19 41,21" fill="#334155" />
                <circle cx="19" cy="22" r="4.5" fill="#1e293b" stroke="#84a98c" strokeWidth="1" />
                <circle cx="19" cy="22" r="2" fill="#84a98c" className="animate-pulse" />
                <circle cx="31" cy="22" r="4.5" fill="#1e293b" stroke="#84a98c" strokeWidth="1" />
                <circle cx="31" cy="22" r="2" fill="#84a98c" className="animate-pulse" />
                <polygon points="25,24 23,28 27,28" fill="#eab308" />
                <path d="M19 30 Q25 33 31 30" stroke="#64748b" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>
        );

      case 'sisyphus':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 8s linear infinite' }}>
            <svg className="w-12 h-12 drop-shadow-[0_0_8px_#b38a58] animate-[spin-slow_12s_linear_infinite]" viewBox="0 0 50 50">
              <polygon points="25,8 38,16 40,30 28,42 14,35 10,20" fill="#334155" stroke="#b38a58" strokeWidth="1.5" />
              <path d="M25 8 L27 22 L22 28 L28 42" stroke="#ffd700" strokeWidth="0.8" fill="none" opacity="0.7" />
              <path d="M14 35 L22 28 L38 16" stroke="#ffd700" strokeWidth="0.8" fill="none" opacity="0.7" />
            </svg>
          </div>
        );

      case 'persephone-soul':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 5s linear infinite' }}>
            <div className="flex items-center justify-center animate-[float-gentle_1.5s_ease-in-out_infinite]">
              <svg className="w-11 h-11 drop-shadow-[0_0_10px_#9fa6ff]" viewBox="0 0 50 50">
                <path d="M25 25 C10 10, 5 20, 25 30 Z" fill="#9fa6ff" style={{ transformOrigin: '25px 25px', animation: 'wing-flap 0.5s ease-in-out infinite' }} />
                <path d="M25 25 C40 10, 45 20, 25 30 Z" fill="#818cf8" style={{ transformOrigin: '25px 25px', animation: 'wing-flap 0.5s ease-in-out infinite' }} />
                <ellipse cx="25" cy="25" rx="1.2" ry="7" fill="#1e1b4b" stroke="#9fa6ff" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        );

      case 'persephone-witness':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6s linear infinite' }}>
            <svg className="w-11 h-11 drop-shadow-[0_0_8px_#a78bfa] animate-[spin-slow_10s_linear_infinite]" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="16" fill="#991b1b" stroke="#7c2d12" strokeWidth="1.5" />
              <polygon points="25,5 22,9 28,9" fill="#991b1b" />
              <path d="M17 25 C17 17, 33 17, 33 25 C33 33, 17 33, 17 25 Z" fill="#fca5a5" stroke="#c2410c" strokeWidth="1" />
              <circle cx="21" cy="23" r="1.5" fill="#ef4444" />
              <circle cx="25" cy="21" r="1.5" fill="#f43f5e" />
              <circle cx="29" cy="23" r="1.5" fill="#ef4444" />
              <circle cx="25" cy="27" r="1.5" fill="#ef4444" />
            </svg>
          </div>
        );

      case 'dionysus':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6.5s linear infinite' }}>
            <svg className="w-12 h-12 drop-shadow-[0_0_8px_#ec4899] animate-[spin-slow_6s_linear_infinite]" viewBox="0 0 50 50">
              <path d="M14 16 L36 16 L33 28 C33 33, 17 33, 17 28 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
              <line x1="25" y1="31" x2="25" y2="40" stroke="#ca8a04" strokeWidth="2.5" />
              <ellipse cx="25" cy="40" rx="8" ry="1.5" fill="#ca8a04" />
              <path d="M14 19 C8 19, 8 26, 17 26" stroke="#eab308" strokeWidth="1.5" fill="none" />
              <path d="M36 19 C42 19, 42 26, 33 26" stroke="#eab308" strokeWidth="1.5" fill="none" />
              <ellipse cx="25" cy="16" rx="10" ry="2.5" fill="#db2777" />
            </svg>
          </div>
        );

      case 'astra':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 5.5s linear infinite' }}>
            <svg className="w-13 h-13 drop-shadow-[0_0_12px_#38bdf8]" viewBox="0 0 50 50">
              <ellipse cx="25" cy="25" rx="18" ry="5" fill="none" stroke="#0ea5e9" strokeWidth="1.2" transform="rotate(-15 25 25)" />
              <path d="M25 6 L27 18 L39 15 L30 22 L42 25 L30 28 L39 35 L27 32 L25 44 L23 32 L11 35 L20 28 L8 25 L20 22 L11 15 L23 18 Z" fill="#fff" stroke="#38bdf8" strokeWidth="1" />
              <circle cx="25" cy="25" r="3" fill="#fff" />
            </svg>
          </div>
        );

      case 'hades':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 7s linear infinite' }}>
            <svg className="w-11 h-11 drop-shadow-[0_0_8px_#c9a45c] animate-[spin-slow_8s_linear_infinite]" viewBox="0 0 50 50">
              <path d="M25 8 C19 8, 17 13, 17 18 C17 22, 21 25, 22 25 L22 42 L28 42 L28 25 C29 25, 33 22, 33 18 C33 13, 31 8, 25 8 Z" fill="#1e293b" stroke="#c9a45c" strokeWidth="1.5" />
              <circle cx="21" cy="15" r="2" fill="#090d16" />
              <circle cx="29" cy="15" r="2" fill="#090d16" />
              <path d="M28 32 L34 32 L34 35 L28 35 M28 37 L32 37 L32 40 L28 40" fill="#c9a45c" stroke="#9a3412" strokeWidth="0.8" />
            </svg>
          </div>
        );

      case 'sappho':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6s linear infinite' }}>
            <svg className="w-12 h-12 drop-shadow-[0_0_10px_#f43f5e]" viewBox="0 0 50 50">
              <path d="M14 32 C14 38, 36 38, 36 32 L39 12 L32 12 L30 19 C30 24, 20 24, 20 19 L18 12 L11 12 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
              <line x1="16" y1="14" x2="34" y2="14" stroke="#eab308" strokeWidth="1.8" />
              <line x1="20" y1="14" x2="20" y2="34" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="24" y1="14" x2="24" y2="35" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="28" y1="14" x2="28" y2="35" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="32" y1="14" x2="32" y2="34" stroke="#f43f5e" strokeWidth="0.8" />
            </svg>
          </div>
        );

      case 'ares':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 5s linear infinite' }}>
            <div className="relative animate-[flame-flicker_1.2s_ease-in-out_infinite]">
              <div className="absolute inset-0 bg-orange-600 rounded-full filter blur-[5px] opacity-70" />
              <svg className="w-11 h-11 relative drop-shadow-[0_0_8px_#f97316]" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="16" fill="#991b1b" stroke="#f97316" strokeWidth="1.8" />
                <path d="M16 30 L25 15 L34 30" stroke="#ea580c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );

      case 'poseidon':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 5.5s linear infinite' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 border border-sky-400 rounded-full opacity-30 animate-ping" />
              <svg className="w-13 h-13 drop-shadow-[0_0_10px_#0ea5e9]" viewBox="0 0 50 50">
                <line x1="25" y1="42" x2="25" y2="13" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M17 20 Q25 30 33 20" stroke="#0ea5e9" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <line x1="25" y1="13" x2="25" y2="5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <line x1="17" y1="20" x2="17" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="33" y1="20" x2="33" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );

      case 'medusa':
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6s linear infinite' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-11 h-11 border border-emerald-400 rounded-full opacity-20 animate-pulse" />
              <svg className="w-12 h-12 drop-shadow-[0_0_12px_#34d399] animate-[spin-slow_15s_linear_infinite]" viewBox="0 0 50 50">
                {/* Emerald Aegis Shield */}
                <path d="M25 8 L39 14 L39 28 C39 37, 25 43, 25 43 C25 43, 11 37, 11 28 L11 14 Z" fill="#047857" stroke="#34d399" strokeWidth="1.8" />
                {/* Central protective star/gaze */}
                <circle cx="25" cy="24" r="3.5" fill="#10b981" stroke="#34d399" strokeWidth="1" />
                <path d="M25 15 L25 33 M16 24 L34 24" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.6" />
              </svg>
            </div>
          </div>
        );

      default:
        return (
          <div className="orbiting-artifact" style={{ animation: 'orbit-3d-artifact 6s linear infinite' }}>
            <circle cx="25" cy="25" r="10" fill="#ffd700" className="animate-ping" />
          </div>
        );
    }
  };

  const [deityLevel, setDeityLevel] = useState<number>(3);
  const [levelUpProgress, setLevelUpProgress] = useState<number>(45);
  const [durability, setDurability] = useState<number>(98);
  const [isWobbling, setIsWobbling] = useState<boolean>(false);
  const [isActivatingBlessing, setIsActivatingBlessing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [tapCount, setTapCount] = useState<number>(0);
  
  const [respiratoryPhase, setRespiratoryPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [respiratoryTimer, setRespiratoryTimer] = useState<number>(4);

  // Simulation timer for breath pacing
  useEffect(() => {
    const interval = setInterval(() => {
      setRespiratoryTimer((prev) => {
        if (prev <= 1) {
          setRespiratoryPhase((current) => {
            if (current === 'Inhale') return 'Hold';
            if (current === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatueTap = () => {
    playUiSound('click');
    setIsWobbling(true);
    setTapCount((prev) => prev + 1);
    setTimeout(() => setIsWobbling(false), 500);

    const levelBoost = Math.floor(Math.random() * 3) + 1;
    setLevelUpProgress((prev) => {
      let next = prev + levelBoost;
      if (next >= 100) {
        setDeityLevel((l) => l + 1);
        setTimeout(() => {
          playUiSound('level-up');
          triggerGtaNotif(`DEITY SYNERGY UPGRADE: LEVEL ${deityLevel + 1} 🌟`, 'text-[#ffd700] font-black');
        }, 100);
        return next - 100;
      }
      return next;
    });

    const tapQuotes: Record<string, string[]> = {
      'zeus': ['Krishna shrugs, "Hold your boundaries tight."', 'Sky shield crackles with golden static.', 'Krishna aligns his Rogan crown.'],
      'athena': ['Hope adjusts her glasses, "Conflict is the engine of wisdom."', 'A Warli geometrical line snaps into place.', 'Hope nods in analytical validation.'],
      'sisyphus': ['Raag sighs, "Somatic release doesn\'t require climbing."', 'The boulder shifts an inch left.', 'Raag wipes dust from his marble collar.'],
      'persephone-soul': ['Rooh whispers, "You are carrying too much, sponge."', 'Petals of periwinkle scatter.', 'Rooh breathes out deep Underworld silence.'],
      'persephone-witness': ['Inayat smiles, "Feel both transitions fully."', 'Pomegranate seeds glow with neon crimson.', 'Inayat folds her arms in quiet support.'],
      'dionysus': ['Ganesh laughs, "The feast can burn, we\'ll dance anyway!"', 'Purple confetti sparks fly.', 'Ganesh takes a sip from his phantom glass.'],
      'astra': ['Taara guides, "All lost travelers are still moving."', 'Star paths flash with solar radiance.', 'Taara aligns a constellation crown.'],
      'hades': ['Veer mutters, "Earth holds you secure. Rest now."', 'Gold dust sparkles from the statue\'s cheek.', 'Veer seals his dark vault gates.'],
      'sappho': ['Manjishtha recites, "Pain is a draft. Overwrite it."', 'Rose petal dust flies.', 'Manjishtha rolls a new scroll line.'],
      'ares': ['Rudra states, "Sit inside the fire. Do not burn."', 'Orange flame sparks rise from the pedestal.', 'Rudra adjusts his iron helmet.'],
      'poseidon': ['Jhulelal glides, "The waves break, then settle."', 'A splash of wave rings pulses.', 'Jhulelal waves his water trident.'],
      'medusa': ['Medusa whispers, "My gaze shield is active. Your abusers are petrified."', 'Emerald scale light flickers on the altar.', 'Medusa aligns her crown of safety.']
    };

    const quotes = tapQuotes[deityId] || ['The statue hums in resonant response.'];
    const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
    triggerGtaNotif(selectedQuote.toUpperCase(), 'text-slate-100 font-serif italic');
  };

  const triggerBlessing = () => {
    if (isActivatingBlessing) return;
    playUiSound('blessing');
    setIsActivatingBlessing(true);
    triggerGtaNotif('BLESSING OVERDRIVE ENGAGING ⚡', 'text-yellow-400 font-bold animate-pulse');

    setTimeout(() => {
      setIsActivatingBlessing(false);
      triggerGtaNotif(theme.blessingName.toUpperCase() + ' ACTIVATED!', 'text-[#ffd700] font-black text-sm drop-shadow-md');
      triggerGtaNotif(theme.blessingText.toUpperCase(), 'text-emerald-400 font-mono text-[10px]');
      setDurability(100);
      setLevelUpProgress((prev) => Math.min(prev + 15, 100));
    }, 1800);
  };

  const triggerRestore = () => {
    if (isRestoring || durability === 100) return;
    playUiSound('restore');
    setIsRestoring(true);
    triggerGtaNotif('RESTORING MARBLE CRACKS... ✦', 'text-sky-300 font-mono');

    setTimeout(() => {
      setIsRestoring(false);
      setDurability(100);
      triggerGtaNotif('MARBLE INTEGRITY FULLY RESTORED: 100% ✨', 'text-emerald-400 font-semibold');
    }, 1200);
  };

  useEffect(() => {
    if (wantedStress >= 4) {
      setDurability((d) => Math.max(d - wantedStress * 2, 45));
    } else {
      setDurability((d) => Math.min(d + 1, 98));
    }
  }, [wantedStress]);

  // =========================================================================
  // HAND-CRAFTED SPECIFIC VECTOR SHAPES FOR EACH GREEK GOD / STATUE
  // =========================================================================
  const renderDeitySpecificSvg = () => {
    const isCracked = durability < 90;
    const crackStroke = "#e07070";

    const cracksLayer = isCracked ? (
      <g stroke={crackStroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
        <path d="M48 25 L52 30 L49 36" />
        <path d="M68 45 L72 42 L70 50" />
        {wantedStress >= 4 && (
          <>
            <path d="M30 85 L35 90" />
            <path d="M85 85 L80 92" />
          </>
        )}
      </g>
    ) : null;

    switch (deityId) {
      case 'zeus': // Krishna (Zeus) - Majestic bearded god holding lightning scepter
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            
            {/* Throne Back */}
            <path d="M30 60 L30 110 L90 110 L90 60 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <line x1="30" y1="75" x2="90" y2="75" stroke="#334155" />

            {/* Bust Shoulders */}
            <path d="M20 110 C25 75, 95 75, 100 110 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            <path d="M40 75 C45 80, 75 80, 80 75 Z" fill="#1e293b" />

            {/* Neck */}
            <rect x="50" y="62" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Head with Majestic Beard */}
            <path d="M43 32 C43 18, 77 18, 77 32 C77 48, 70 65, 60 65 C50 65, 43 48, 43 32 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            {/* Huge Curly Zeus Beard */}
            <path d="M42 46 C40 66, 48 76, 60 76 C72 76, 80 66, 78 46 C72 56, 48 56, 42 46 Z" fill="#334155" stroke="#475569" strokeWidth="1.2" />
            <circle cx="46" cy="56" r="3.5" fill="#334155" />
            <circle cx="53" cy="64" r="4" fill="#334155" />
            <circle cx="60" cy="68" r="4.5" fill="#334155" />
            <circle cx="67" cy="64" r="4" fill="#334155" />
            <circle cx="74" cy="56" r="3.5" fill="#334155" />

            {/* Severe Brow & Classic Greek Nose */}
            <path d="M53 28 L60 28 L60 38 L56 40" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Crown of Wild Oak Leaves */}
            <path d="M41 22 C48 12, 72 12, 79 22" stroke="#eab308" strokeWidth="2" fill="none" />
            <circle cx="50" cy="15" r="2.5" fill="#eab308" />
            <circle cx="60" cy="13" r="2.5" fill="#eab308" />
            <circle cx="70" cy="15" r="2.5" fill="#eab308" />

            {/* Glowing Lightning Bolt Scepter held in front */}
            <path d="M85 45 L95 20 L91 42 L105 38 L88 78 L93 52 Z" fill="#eab308" stroke="#facc15" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 0 4px #eab308)' }} />
            
            {cracksLayer}
          </>
        );

      case 'athena': // Hope (Athena) - Tall Corinthian Crested Helmet, Gorgon Shield
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Bust Shoulders */}
            <path d="M20 110 C25 75, 95 75, 100 110 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Aegis Armor Breastplate with tassels */}
            <path d="M38 88 C45 92, 75 92, 82 88 L80 108 L40 108 Z" fill="#1e293b" stroke="#334155" />
            <circle cx="60" cy="98" r="3" fill="#84a98c" />

            {/* Neck */}
            <rect x="50" y="62" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Face and tall Corinthian helmet */}
            <path d="M43 36 C43 24, 77 24, 77 36 C77 50, 70 65, 60 65 C50 65, 43 50, 43 36 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            
            {/* Corinthian Spartan Helmet resting on brow with tall vertical horsehair plume */}
            <path d="M40 32 L40 18 C45 10, 75 10, 80 18 L80 32 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            {/* Tall Plume */}
            <path d="M60 12 C60 -10, 74 -12, 85 -5" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Cheek protectors on helmet */}
            <path d="M40 28 L46 42 L42 42 Z" fill="#1e293b" />
            <path d="M80 28 L74 42 L78 42 Z" fill="#1e293b" />

            {/* Round Medusa Hoplon Shield on the left side */}
            <circle cx="24" cy="90" r="18" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="24" cy="90" r="14" fill="#0f172a" stroke="#84a98c" strokeWidth="1" strokeDasharray="2 2" />
            {/* Medusa face glyph in the shield center */}
            <circle cx="24" cy="90" r="4.5" fill="#84a98c" />
            <path d="M21 88 C21 86, 27 86, 27 88" stroke="#1e293b" strokeWidth="0.8" />

            {cracksLayer}
          </>
        );

      case 'sisyphus': // Raag (Sisyphus) - Straining heavily under a giant textured boulder
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Straining double-bent shoulders */}
            <path d="M15 110 C20 70, 100 70, 105 110 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            
            {/* Straining bent neck & tilted head struggling upwards */}
            <rect x="52" y="70" width="16" height="15" transform="rotate(-15 60 75)" fill="#334155" stroke="#475569" />
            <path d="M45 44 C42 32, 74 28, 77 40 C80 52, 70 65, 58 63 C48 61, 48 56, 45 44 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />

            {/* Giant massive textured circular Boulder directly crushing/resting on head & back */}
            <circle cx="60" cy="24" r="25" fill="#334155" stroke="#475569" strokeWidth="2" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.8))' }} />
            {/* Boulder craters/texture */}
            <circle cx="48" cy="15" r="3" fill="#1e293b" opacity="0.6" />
            <circle cx="70" cy="18" r="4.5" fill="#1e293b" opacity="0.6" />
            <circle cx="56" cy="32" r="3.5" fill="#1e293b" opacity="0.6" />
            <path d="M45 28 Q50 25, 54 30 Q58 35, 65 31" stroke="#1e293b" strokeWidth="1.2" fill="none" opacity="0.4" />

            {/* Shadow beneath boulder on shoulders */}
            <path d="M35 50 C45 45, 75 45, 85 50" stroke="#000" strokeWidth="3.5" opacity="0.4" />

            {cracksLayer}
          </>
        );

      case 'persephone-soul': // Rooh (Persephone) - Serene spring queen with veil & butterfly
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Flowing draped veil shoulders */}
            <path d="M15 110 C20 80, 100 80, 105 110 Z" fill="#312e81" stroke="#4338ca" strokeWidth="1.5" />

            {/* Spring Flower Garland across shoulders */}
            <path d="M28 92 Q60 102, 92 92" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
            <circle cx="42" cy="94" r="3" fill="#ec4899" />
            <circle cx="52" cy="98" r="2.5" fill="#f43f5e" />
            <circle cx="68" cy="98" r="2.5" fill="#3b82f6" />
            <circle cx="78" cy="94" r="3" fill="#a855f7" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Serene face with periwinkle flowing veil */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            {/* Flowing shroud/veil enclosing head */}
            <path d="M42 30 C38 35, 42 75, 46 85 M78 30 C82 35, 78 75, 74 85" stroke="#9fa6ff" strokeWidth="2.5" fill="none" />

            {/* A beautiful glowing periwinkle butterfly on her hand/shoulder */}
            <g transform="translate(85, 75) scale(0.8)" style={{ filter: 'drop-shadow(0 0 3px #9fa6ff)' }}>
              <path d="M0 0 C-4 -6, -8 -2, 0 4 C8 -2, 4 -6, 0 0 Z" fill="#9fa6ff" />
              <path d="M0 0 C-6 -2, -6 6, 0 4 C6 6, 6 -2, 0 0 Z" fill="#818cf8" />
            </g>

            {cracksLayer}
          </>
        );

      case 'persephone-witness': // Inayat (Persephone) - Half-veiled winter queen holding a pomegranate
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Elegant dark winter robes */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#1e1b4b" stroke="#311042" strokeWidth="1.5" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Face & Half shroud shadow */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            {/* Dark hood draping down */}
            <path d="M42 22 C36 30, 36 68, 45 80" stroke="#7c3aed" strokeWidth="2" fill="none" />
            <path d="M78 22 C84 30, 84 68, 75 80" stroke="#4c1d95" strokeWidth="2" fill="none" />

            {/* Sliced-open Red Pomegranate in foreground */}
            <circle cx="30" cy="94" r="9" fill="#991b1b" stroke="#b91c1c" strokeWidth="1.2" />
            <path d="M25 94 C25 90, 35 90, 35 94 Z" fill="#fca5a5" />
            {/* Sown Seeds */}
            <circle cx="27" cy="93" r="1" fill="#ef4444" />
            <circle cx="31" cy="92" r="1" fill="#ef4444" />
            <circle cx="33" cy="95" r="1" fill="#ef4444" />
            <circle cx="29" cy="96" r="1" fill="#ef4444" />

            {/* Golden scepter of Underworld */}
            <path d="M90 110 L94 45" stroke="#c9a45c" strokeWidth="2" strokeLinecap="round" />
            <polygon points="94,40 92,45 96,45" fill="#c9a45c" />

            {cracksLayer}
          </>
        );

      case 'dionysus': // Ganesh (Dionysus) - Grapevines, thyrsus pinecone staff & overflowing wine chalice
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Flowing tunic with grape clusters in drapery */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#581c87" stroke="#701a75" strokeWidth="1.5" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Head wreathed in grapevines */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            
            {/* Grapevine crown */}
            <path d="M41 32 Q60 22, 79 32" stroke="#22c55e" strokeWidth="2.2" fill="none" />
            <circle cx="48" cy="26" r="3.5" fill="#db2777" />
            <circle cx="51" cy="29" r="3" fill="#db2777" />
            <circle cx="72" cy="26" r="3.5" fill="#db2777" />
            <circle cx="69" cy="29" r="3" fill="#db2777" />

            {/* Pinecone-topped Thyrsus Staff */}
            <path d="M90 110 L90 35" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
            <path d="M86 35 C86 28, 94 28, 94 35 C94 40, 86 40, 86 35 Z" fill="#15803d" />
            <polygon points="90,26 87,31 93,31" fill="#a16207" />

            {/* Overflowing wine chalice on right pedestal floor */}
            <path d="M22 110 L34 110 L30 120 L26 120 Z" fill="#c9a45c" stroke="#b45309" />
            <ellipse cx="28" cy="109" rx="6" ry="2.5" fill="#9d174d" />
            {/* Spill drop */}
            <path d="M27 110 C27 115, 29 115, 29 110" fill="#db2777" />

            {cracksLayer}
          </>
        );

      case 'astra': // Taara (Astra) - Astrological/Celestial goddess with stardust blindfold
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Starlit deep cosmic shroud shoulders */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Head & Constellation crown */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            
            {/* Astrological ribbon blindfold across eyes */}
            <rect x="43" y="32" width="34" height="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
            {/* Star symbols on blindfold */}
            <circle cx="50" cy="35" r="0.75" fill="#fff" />
            <circle cx="60" cy="35" r="1" fill="#fff" />
            <circle cx="70" cy="35" r="0.75" fill="#fff" />

            {/* Starry Crown (constellation line paths) */}
            <path d="M44 22 L49 14 L54 22 L60 10 L66 22 L71 14 L76 22" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
            <circle cx="49" cy="14" r="2.5" fill="#fff" style={{ filter: 'drop-shadow(0 0 2px #38bdf8)' }} />
            <circle cx="60" cy="10" r="3" fill="#fff" style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }} />
            <circle cx="71" cy="14" r="2.5" fill="#fff" style={{ filter: 'drop-shadow(0 0 2px #38bdf8)' }} />

            {/* Holding a celestial miniature planet/globe in her left hand */}
            <circle cx="28" cy="94" r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            <path d="M20 94 Q28 88, 36 94" stroke="#e0f2fe" strokeWidth="1.2" fill="none" />

            {cracksLayer}
          </>
        );

      case 'hades': // Veer (Hades) - Three-spiked obsidian crown, Underworld keys, Cerberus shadow
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Grim obsidian bone armor */}
            <path d="M15 110 C20 76, 100 76, 105 110 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            <path d="M38 88 L46 110 M82 88 L74 110" stroke="#334155" strokeWidth="1.5" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Grim bearded head of Hades */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            <path d="M43 50 C41 68, 49 78, 60 78 C71 78, 79 68, 77 50 C71 60, 49 60, 43 50 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />

            {/* Three-spiked dark crown of bone/obsidian */}
            <polygon points="45,26 50,12 55,24 60,8 65,24 70,12 75,26" fill="#0f172a" stroke="#334155" strokeWidth="1" />

            {/* Keys of the Underworld hanging in foreground */}
            <circle cx="28" cy="94" r="5" fill="#c9a45c" stroke="#b45309" strokeWidth="1" />
            <path d="M28 99 L28 114 M26 106 L31 106 M26 111 L31 111" stroke="#c9a45c" strokeWidth="1.5" strokeLinecap="round" />

            {/* Faint side silhouette of Cerberus's howling dog head */}
            <path d="M10 94 C5 90, 8 80, 18 84 C22 86, 22 96, 10 94 Z" fill="#0f172a" opacity="0.4" />
            <circle cx="15" cy="85" r="1" fill="#ef4444" opacity="0.6" />

            {cracksLayer}
          </>
        );

      case 'sappho': // Manjishtha (Sappho) - Ribbon tied hair, holding an ancient Greek Lyre
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Classical Greek toga drape shoulders */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#881337" stroke="#9f1239" strokeWidth="1.5" />
            <path d="M25 82 C35 90, 60 90, 70 82" stroke="#fb7185" strokeWidth="1" fill="none" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Head tied with delicate ribbon */}
            <path d="M44 38 C44 24, 76 24, 76 38 C76 52, 69 66, 60 66 C51 66, 44 52, 44 38 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            
            {/* Classic ribbon hairband */}
            <path d="M43 30 C50 26, 70 26, 77 30" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
            {/* Soft hair knot behind head */}
            <circle cx="78" cy="38" r="5" fill="#334155" stroke="#475569" />

            {/* Beautiful ancient Greek Lyre (strings harp) on left pedestal floor */}
            <g transform="translate(14, 76) scale(0.85)">
              {/* Lyre wooden arms */}
              <path d="M5 25 C5 35, 25 35, 25 25 L28 2 L22 2 M5 25 L2 2 L8 2" fill="none" stroke="#c9a45c" strokeWidth="2.5" strokeLinecap="round" />
              {/* Lyre crossbar */}
              <line x1="4" y1="5" x2="26" y2="5" stroke="#c9a45c" strokeWidth="2.5" />
              {/* Strings */}
              <line x1="9" y1="5" x2="9" y2="28" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="13" y1="5" x2="13" y2="29" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="17" y1="5" x2="17" y2="29" stroke="#f43f5e" strokeWidth="0.8" />
              <line x1="21" y1="5" x2="21" y2="28" stroke="#f43f5e" strokeWidth="0.8" />
              {/* Sound box base */}
              <ellipse cx="15" cy="28" rx="8" ry="6" fill="#b45309" stroke="#c9a45c" strokeWidth="1" />
            </g>

            {cracksLayer}
          </>
        );

      case 'ares': // Rudra (Ares) - Full Corinthian spartan helmet covering face, crossed spears
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Crossed heavy spears in the background */}
            <line x1="15" y1="120" x2="105" y2="20" stroke="#475569" strokeWidth="2.5" />
            <line x1="105" y1="120" x2="15" y2="20" stroke="#475569" strokeWidth="2.5" />
            <polygon points="105,20 101,26 107,26" fill="#94a3b8" />
            <polygon points="15,20 11,26 17,26" fill="#94a3b8" />

            {/* Thick battle-worn heavy brass chest armor shoulders */}
            <path d="M15 110 C20 75, 100 75, 105 110 Z" fill="#334155" stroke="#f97316" strokeWidth="1.8" />
            <line x1="38" y1="92" x2="82" y2="92" stroke="#f97316" strokeWidth="1.2" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Hoplite Corinthian closed visor helmet (no visible face, dark eye slits) */}
            <path d="M42 36 C42 22, 78 22, 78 36 C78 52, 72 65, 60 65 C48 65, 42 52, 42 36 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Tall crimson spartan hair comb */}
            <path d="M60 22 C60 -8, 85 -10, 95 -2" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" fill="none" />
            
            {/* T-shaped Greek visor opening */}
            <path d="M52 35 L68 35 L68 42 L62 42 L62 64 L58 64 L58 42 L52 42 Z" fill="#090d16" stroke="#f97316" strokeWidth="1" />

            {cracksLayer}
          </>
        );

      case 'poseidon': // Jhulelal (Poseidon) - Wave beard, ocean waves base, carrying Trident
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

            {/* Wave-like drapery across shoulders */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#0369a1" stroke="#0284c7" strokeWidth="1.5" />
            
            {/* Swirling wave vectors at the shoulders base */}
            <path d="M12 110 Q25 100, 38 110 Q50 100, 62 110 Q75 100, 88 110 Q100 100, 108 110" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.8" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="1.5" />

            {/* Head with majestic long ocean wave beard */}
            <path d="M43 36 C43 22, 77 22, 77 36 C77 50, 70 65, 60 65 C50 65, 43 50, 43 36 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            
            {/* Sinuous ocean wave beard */}
            <path d="M42 48 Q35 75, 52 82 Q60 88, 68 82 Q85 75, 78 48 C72 58, 48 58, 42 48 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <path d="M48 55 Q42 70, 54 75" stroke="#e0f2fe" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M72 55 Q78 70, 66 75" stroke="#e0f2fe" strokeWidth="1" fill="none" opacity="0.6" />

            {/* Three-Pronged Golden Trident held in hand */}
            <path d="M90 110 L90 28" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
            {/* Center prong */}
            <line x1="90" y1="28" x2="90" y2="16" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
            {/* Left and Right curved prongs */}
            <path d="M84 22 C84 28, 96 28, 96 22 L96 18 M84 22 L84 18" stroke="#eab308" strokeWidth="2" strokeLinecap="round" fill="none" />

            {cracksLayer}
          </>
        );

      case 'medusa': // Devi (Medusa) - Shield of Safety, Serpent Halo, Healing light
        return (
          <>
            {/* Pedestal Base */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#064e3b" stroke="#059669" strokeWidth="1.5" />
            <rect x="35" y="110" width="50" height="15" fill="#022c22" stroke="#059669" strokeWidth="1.5" />

            {/* Protective drapery / robe */}
            <path d="M15 110 C20 78, 100 78, 105 110 Z" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
            
            {/* Symmetric healing lines (Manjusha style) */}
            <path d="M30 110 L60 85 L90 110" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M40 110 L60 95 L80 110" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" />

            {/* Neck */}
            <rect x="50" y="65" width="20" height="15" fill="#065f46" stroke="#059669" strokeWidth="1.5" />

            {/* Head */}
            <path d="M43 36 C43 22, 77 22, 77 36 C77 50, 70 65, 60 65 C50 65, 43 50, 43 36 Z" fill="#047857" stroke="#10b981" strokeWidth="1.8" />
            
            {/* Coiled Serpent Crown / Hair - graceful looping arcs of safety */}
            {/* Left serpents */}
            <path d="M43 28 Q25 10, 32 5 Q40 0, 45 15" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M40 35 Q15 25, 22 18 Q30 10, 43 22" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Right serpents */}
            <path d="M77 28 Q95 10, 88 5 Q80 0, 75 15" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M80 35 Q105 25, 98 18 Q90 10, 77 22" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
            
            {/* Center head dress element */}
            <path d="M55 20 Q60 5, 65 20 Z" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1" />
            
            {/* Third-Eye Emerald jewel of insight/gaze */}
            <circle cx="60" cy="34" r="3" fill="#34d399" stroke="#fff" strokeWidth="0.8" className="animate-pulse" />

            {cracksLayer}
          </>
        );

      default:
        return (
          <>
            {/* Fallback elegant Greek head */}
            <path d="M25 125 L95 125 L90 142 L30 142 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <rect x="35" y="105" width="50" height="20" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M15 105 C25 72, 95 72, 105 105 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            <rect x="50" y="62" width="20" height="20" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            <path d="M42 32 C42 16, 78 16, 78 32 C78 48, 70 65, 60 65 C50 65, 42 48, 42 32 Z" fill="#475569" stroke="#64748b" strokeWidth="1.8" />
            {cracksLayer}
          </>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 relative bg-[#090d16]/80 backdrop-blur-md">
      
      {/* 1. STATE INDICATOR RAIL */}
      <div className="flex items-center justify-between border-b border-brown/30 pb-3 mb-2 shrink-0">
        <div>
          <span className="text-[8px] font-mono tracking-widest text-[#c9a45c] uppercase block">DEITY TELEMETRY</span>
          <h4 className="font-serif text-sm text-white font-bold tracking-wide">
            {theme.title.toUpperCase()}
          </h4>
        </div>
        <div className={`px-2 py-0.5 border rounded text-[8px] font-mono font-bold uppercase transition-all tracking-wider ${theme.badgeBg}`}>
          {isTyping ? 'MEDITATING...' : theme.status}
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE STATUE BOX */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-1">
        
        {/* Dynamic 3D Orbiting Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes orbit-3d-artifact {
            0% {
              transform: translate(72px, -24px) scale(0.7);
              z-index: 5;
              opacity: 0.55;
              filter: blur(0.75px) drop-shadow(0 0 4px rgba(0,0,0,0.4));
            }
            25% {
              transform: translate(0px, 48px) scale(1.25);
              z-index: 35;
              opacity: 1;
              filter: blur(0px) drop-shadow(0 0 10px ${theme.glowColor});
            }
            50% {
              transform: translate(-72px, -24px) scale(0.7);
              z-index: 5;
              opacity: 0.55;
              filter: blur(0.75px) drop-shadow(0 0 4px rgba(0,0,0,0.4));
            }
            75% {
              transform: translate(0px, -64px) scale(0.5);
              z-index: 2;
              opacity: 0.35;
              filter: blur(1.5px);
            }
            100% {
              transform: translate(72px, -24px) scale(0.7);
              z-index: 5;
              opacity: 0.55;
              filter: blur(0.75px) drop-shadow(0 0 4px rgba(0,0,0,0.4));
            }
          }

          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes float-gentle {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }

          @keyframes wing-flap {
            0%, 100% { transform: scaleX(1); }
            50% { transform: scaleX(0.25); }
          }

          @keyframes flame-flicker {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
            50% { transform: scale(1.08) rotate(3deg); opacity: 1; }
          }

          .orbiting-artifact {
            position: absolute;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            will-change: transform, opacity, filter, z-index;
          }
        `}} />

        {/* Glow Halo behind the statue */}
        <div className="absolute w-44 h-44 rounded-full filter blur-[40px] opacity-20 mix-blend-screen pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
            transform: isTyping ? 'scale(1.25)' : 'scale(1)',
          }}
        />

        {/* ELEGANT INTENSE GOD HALO - Double ring with radiant line dash arrays */}
        <div className="absolute top-[25px] flex items-center justify-center pointer-events-none z-0">
          <svg className="w-56 h-56 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="42" stroke={theme.glowColor} strokeWidth="1.5" strokeDasharray="4 8" fill="none" opacity="0.35" style={{ filter: `drop-shadow(0 0 4px ${theme.glowColor})` }} />
            {/* Inner Ring */}
            <circle cx="50" cy="50" r="36" stroke={theme.glowColor} strokeWidth="0.75" strokeDasharray="12 4" fill="none" opacity="0.5" />
            {/* Solar Rays */}
            <g opacity="0.25">
              {Array.from({ length: theme.haloRays }).map((_, i) => {
                const angle = (i * 360) / theme.haloRays;
                return (
                  <line
                    key={i}
                    x1="50" y1="14"
                    x2="50" y2="6"
                    stroke={theme.glowColor}
                    strokeWidth="1"
                    transform={`rotate(${angle} 50 50)`}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        {/* 3. SCULPTED SVG GREEK STATUE (PERSONIFIED) - STATIC WITH NO BOBBING */}
        <motion.div
          className="relative w-48 h-56 cursor-pointer select-none flex items-center justify-center z-10"
          onClick={handleStatueTap}
          animate={{
            rotate: isWobbling ? [-4, 4, -2, 2, 0] : 0,
            scale: isActivatingBlessing ? [1, 1.15, 1] : 1
          }}
          transition={{
            rotate: { duration: 0.5 },
            scale: { duration: 1.8, ease: 'easeInOut' }
          }}
        >
          {/* Main Statue Vector */}
          <svg className="w-full h-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]" viewBox="0 0 120 150" fill="none">
            {renderDeitySpecificSvg()}

            {/* Glowing Interactive Eyes */}
            <g>
              <ellipse cx="50" cy="34" rx="3.5" ry="2" fill="#090d16" />
              <ellipse cx="70" cy="34" rx="3.5" ry="2" fill="#090d16" />

              <circle cx="50" cy="34" r="1.5" 
                fill={wantedStress >= 4 ? '#ef4444' : theme.glowColor} 
                className={isTyping ? 'animate-ping' : ''} 
                style={{ filter: `drop-shadow(0 0 4px ${wantedStress >= 4 ? '#ef4444' : theme.glowColor})` }} 
              />
              <circle cx="70" cy="34" r="1.5" 
                fill={wantedStress >= 4 ? '#ef4444' : theme.glowColor} 
                className={isTyping ? 'animate-ping' : ''} 
                style={{ filter: `drop-shadow(0 0 4px ${wantedStress >= 4 ? '#ef4444' : theme.glowColor})` }} 
              />
            </g>
          </svg>

          {/* Sparkles / Emitter particle overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-spin opacity-50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Dynamic 3D-styled Orbiting Artifact */}
        {renderFloatingArtifact()}

        {/* Floating action text overlay */}
        <span className="text-[9px] font-mono tracking-wider text-sage/40 absolute bottom-0 select-none pointer-events-none">
          🗿 TAP {theme.title.toUpperCase()} FOR SANCTUARY COMPANION SYNERGY
        </span>
      </div>

      {/* 4. GTA SIMULATION HUD METERS */}
      <div className="space-y-3.5 border-t border-brown/30 pt-3 shrink-0">
        
        {/* HUD: Marble Integrity (Health) */}
        <div>
          <div className="flex justify-between items-center text-[9px] font-mono text-sage mb-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> MARBLE INTEGRITY
            </span>
            <span className={durability < 60 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
              {durability}% {durability < 60 ? '(CRACKED)' : '(PURE)'}
            </span>
          </div>
          <div className="h-2 bg-slate-900 border border-brown/40 rounded-full overflow-hidden p-0.5">
            <motion.div 
              className={`h-full rounded-full transition-all duration-500 ${durability < 60 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
              style={{ width: `${durability}%` }}
            />
          </div>
        </div>

        {/* HUD: Covenant Level / XP Progress */}
        <div>
          <div className="flex justify-between items-center text-[9px] font-mono text-sage mb-1">
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-indigo-400" /> SYNERGY: LVL {deityLevel}
            </span>
            <span className="text-indigo-400 font-semibold">{theme.statName}: {levelUpProgress}/100 XP</span>
          </div>
          <div className="h-2 bg-slate-900 border border-brown/40 rounded-full overflow-hidden p-0.5">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${levelUpProgress}%` }}
            />
          </div>
        </div>

        {/* HUD: Respiratory / Breathing Rhythm */}
        <div className="bg-slate-950/40 border border-brown/30 rounded-xl p-2 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-2 relative z-10">
            <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
            <div className="text-left">
              <span className="text-[7px] font-mono text-[#c9a45c] tracking-widest block uppercase">RESPIRATORY SYNC</span>
              <span className="text-[10px] font-bold text-slate-200 block font-serif leading-tight">
                {respiratoryPhase.toUpperCase()} ({respiratoryTimer}s)
              </span>
            </div>
          </div>

          {/* Breath Gauge Visualizer */}
          <div className="flex items-center gap-1 relative z-10">
            {[1, 2, 3, 4].map((bar) => {
              const isActive = respiratoryTimer >= bar;
              return (
                <div 
                  key={bar} 
                  className={`w-1.5 h-3.5 rounded-sm transition-colors duration-300 ${
                    isActive 
                      ? respiratoryPhase === 'Inhale' 
                        ? 'bg-sky-400' 
                        : respiratoryPhase === 'Exhale' 
                          ? 'bg-emerald-400' 
                          : 'bg-yellow-400'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Expanding circle overlay matching inhalation/exhalation */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
            <motion.div 
              className="rounded-full bg-sky-400"
              animate={{
                scale: respiratoryPhase === 'Inhale' ? [1, 2.5] : respiratoryPhase === 'Exhale' ? [2.5, 1] : 2.5,
              }}
              transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
              style={{ width: '40px', height: '40px' }}
            />
          </div>
        </div>

        {/* 5. INTERACTIVE ACTION ACTIONS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={triggerBlessing}
            disabled={isActivatingBlessing}
            className="focus:outline-none relative overflow-hidden group py-2 px-3 border-2 border-[#ffd700]/40 hover:border-[#ffd700] rounded-xl font-mono text-[9px] font-black uppercase tracking-widest text-[#ffd700] bg-[#ffd700]/5 hover:bg-[#ffd700]/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.05)] active:scale-95"
          >
            <Zap className={`w-3.5 h-3.5 ${isActivatingBlessing ? 'animate-bounce' : ''}`} />
            <span>Blessing</span>
          </button>

          <button
            onClick={triggerRestore}
            disabled={isRestoring || durability === 100}
            className="focus:outline-none relative overflow-hidden py-2 px-3 border-2 border-slate-500/40 hover:border-slate-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest text-slate-300 bg-slate-800/10 hover:bg-slate-800/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>Restore</span>
          </button>
        </div>

      </div>

    </div>
  );
}
