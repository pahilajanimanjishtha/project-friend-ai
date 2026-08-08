// Ambient Audio Synthesizer for Project Friend AI
// Web Audio API based zero-dependency soundscape generator for 12 mythological archetypes.

export interface AmbientProfile {
  id: string;
  title: string;
  subtitle: string;
  type: 'breeze' | 'ocean' | 'rain' | 'fire' | 'stream' | 'cosmic';
  frequencies: [number, number]; // Harmonic base & fifth
  filterFreq: number;
  qFactor: number;
  lfoRate: number; // Hz for slow swell
  iconName: string;
}

export const AMBIENT_PROFILES: Record<string, AmbientProfile> = {
  'persephone-soul': {
    id: 'persephone-soul',
    title: 'Lavender Spring Breeze & Gentle Ethereal Drone',
    subtitle: 'Soothing intuitive meadow wind',
    type: 'breeze',
    frequencies: [220, 329.63], // A3 + E4
    filterFreq: 600,
    qFactor: 2.5,
    lfoRate: 0.1,
    iconName: 'Wind',
  },
  'sisyphus': {
    id: 'sisyphus',
    title: 'Mountain Breeze & Deep Earth Stone Resonance',
    subtitle: 'Grounded somatic hill anchor',
    type: 'breeze',
    frequencies: [130.81, 196.00], // C3 + G3
    filterFreq: 300,
    qFactor: 1.8,
    lfoRate: 0.08,
    iconName: 'Compass',
  },
  'athena': {
    id: 'athena',
    title: 'Starlit Mountain Wind & High Wisdom Harmonics',
    subtitle: 'Clear DBT focus & mental stillness',
    type: 'breeze',
    frequencies: [293.66, 440.00], // D4 + A4
    filterFreq: 1100,
    qFactor: 3.2,
    lfoRate: 0.12,
    iconName: 'Sparkles',
  },
  'persephone-witness': {
    id: 'persephone-witness',
    title: 'Gentle Autumn Rain & Underworld Reflection',
    subtitle: 'Quiet rainfall for quiet grieving',
    type: 'rain',
    frequencies: [164.81, 246.94], // E3 + B3
    filterFreq: 800,
    qFactor: 2.0,
    lfoRate: 0.15,
    iconName: 'Cloud',
  },
  'dionysus': {
    id: 'dionysus',
    title: 'Night Forest Stream & Sacred Bamboo Flute',
    subtitle: 'Reframing joy & flowing waters',
    type: 'stream',
    frequencies: [196.00, 293.66], // G3 + D4
    filterFreq: 750,
    qFactor: 2.8,
    lfoRate: 0.14,
    iconName: 'Music',
  },
  'astra': {
    id: 'astra',
    title: 'Cosmic Constellation Sparkle & Solar Breeze',
    subtitle: 'Celestial pathfinder harmonics',
    type: 'cosmic',
    frequencies: [349.23, 523.25], // F4 + C5
    filterFreq: 1400,
    qFactor: 4.0,
    lfoRate: 0.18,
    iconName: 'Star',
  },
  'zeus': {
    id: 'zeus',
    title: 'Sky Temple Resonance & Soft Rolling Thunder',
    subtitle: 'Sovereign clarity & quiet sky strength',
    type: 'breeze',
    frequencies: [98.00, 146.83], // G2 + D3
    filterFreq: 250,
    qFactor: 1.5,
    lfoRate: 0.05,
    iconName: 'Zap',
  },
  'hades': {
    id: 'hades',
    title: 'Subterranean Sanctuary Hum & Cave Resonance',
    subtitle: 'Honest quiet & deep root grounding',
    type: 'breeze',
    frequencies: [65.41, 98.00], // C2 + G2
    filterFreq: 200,
    qFactor: 1.2,
    lfoRate: 0.04,
    iconName: 'Shield',
  },
  'sappho': {
    id: 'sappho',
    title: 'Lyrical Stream Waters & Soft Harp Harmonics',
    subtitle: 'Narrative poetry & emotional release',
    type: 'stream',
    frequencies: [220.00, 277.18], // A3 + C#4
    filterFreq: 900,
    qFactor: 3.0,
    lfoRate: 0.16,
    iconName: 'Music',
  },
  'ares': {
    id: 'ares',
    title: 'Warm Hearth Fire Crackle & Soothing Flame',
    subtitle: 'Rage alchemy & boundary warmth',
    type: 'fire',
    frequencies: [146.83, 220.00], // D3 + A3
    filterFreq: 450,
    qFactor: 2.2,
    lfoRate: 0.1,
    iconName: 'Flame',
  },
  'poseidon': {
    id: 'poseidon',
    title: 'Oceanic Tide Rhythm & Deep Water Wave Flow',
    subtitle: 'Pacifying storms & Jhulelal tides',
    type: 'ocean',
    frequencies: [87.31, 130.81], // F2 + C3
    filterFreq: 350,
    qFactor: 1.6,
    lfoRate: 0.07,
    iconName: 'Compass',
  },
  'medusa': {
    id: 'medusa',
    title: 'Emerald Sanctuary Shield & Protective Breeze',
    subtitle: 'Fierce safety & somatic comfort',
    type: 'breeze',
    frequencies: [164.81, 207.65], // E3 + G#3
    filterFreq: 550,
    qFactor: 2.4,
    lfoRate: 0.09,
    iconName: 'ShieldCheck',
  },
};

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentArchetypeId: string = 'persephone-soul';
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private targetVolume: number = 0.35;
  private listeners: Set<(isPlaying: boolean, archetypeId: string) => void> = new Set();

  constructor() {
    // Engine initializes lazily on first user interaction
  }

  public subscribe(fn: (isPlaying: boolean, archetypeId: string) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isPlaying, this.currentArchetypeId));
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(archetypeId?: string): boolean {
    if (archetypeId && archetypeId !== this.currentArchetypeId) {
      this.currentArchetypeId = archetypeId;
    }
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  public setArchetype(archetypeId: string) {
    if (this.currentArchetypeId === archetypeId) return;
    this.currentArchetypeId = archetypeId;
    if (this.isPlaying) {
      // Smooth crossfade transition
      this.transitionToArchetype(archetypeId);
    } else {
      this.notify();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentArchetypeId(): string {
    return this.currentArchetypeId;
  }

  public getCurrentProfile(): AmbientProfile {
    return AMBIENT_PROFILES[this.currentArchetypeId] || AMBIENT_PROFILES['persephone-soul'];
  }

  public start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stopNodes();
    }

    const profile = this.getCurrentProfile();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, this.ctx.currentTime + 2.0);
    this.masterGain.connect(this.ctx.destination);

    // Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = profile.type === 'rain' ? 'highpass' : 'bandpass';
    this.filterNode.frequency.setValueAtTime(profile.filterFreq, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(profile.qFactor, this.ctx.currentTime);
    this.filterNode.connect(this.masterGain);

    // Swelling LFO to modulate filter frequency naturally
    this.lfoNode = this.ctx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.setValueAtTime(profile.lfoRate, this.ctx.currentTime);

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(profile.filterFreq * 0.3, this.ctx.currentTime);

    this.lfoNode.connect(this.lfoGain);
    this.lfoGain.connect(this.filterNode.frequency);
    this.lfoNode.start();

    // Osc 1 (Fundamental Sine/Triangle Pad)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = profile.type === 'fire' || profile.type === 'breeze' ? 'triangle' : 'sine';
    this.osc1.frequency.setValueAtTime(profile.frequencies[0], this.ctx.currentTime);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(this.filterNode);
    this.osc1.start();

    // Osc 2 (Harmonic Fifth Pad)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(profile.frequencies[1], this.ctx.currentTime);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.filterNode);
    this.osc2.start();

    // Organic Pink/White Noise Generator for Nature Ambience
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.08; // scale volume
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.noiseNode.connect(noiseGain);
    noiseGain.connect(this.filterNode);
    this.noiseNode.start();

    this.isPlaying = true;
    this.notify();
  }

  private transitionToArchetype(archetypeId: string) {
    if (!this.ctx || !this.masterGain) return;
    
    // Smooth fade out current
    this.masterGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
    setTimeout(() => {
      if (this.isPlaying) {
        this.start(); // Restart with new profile
      }
    }, 850);
  }

  public stop() {
    if (!this.ctx || !this.masterGain) {
      this.isPlaying = false;
      this.notify();
      return;
    }

    // Fade out cleanly over 0.8s
    this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
    setTimeout(() => {
      this.stopNodes();
      this.isPlaying = false;
      this.notify();
    }, 850);
  }

  private stopNodes() {
    try {
      if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); this.osc1 = null; }
      if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); this.osc2 = null; }
      if (this.noiseNode) { this.noiseNode.stop(); this.noiseNode.disconnect(); this.noiseNode = null; }
      if (this.lfoNode) { this.lfoNode.stop(); this.lfoNode.disconnect(); this.lfoNode = null; }
      if (this.masterGain) { this.masterGain.disconnect(); this.masterGain = null; }
    } catch (e) {
      console.warn('AmbientAudioEngine cleanup exception:', e);
    }
  }

  public setVolume(val: number) {
    this.targetVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, this.ctx.currentTime + 0.1);
    }
  }
}

export const ambientEngine = new AmbientAudioEngine();
