import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CHARACTERS } from '../data';
import { Character, Message } from '../types';
import DeityStatue from './DeityStatue';
import { 
  Send, Sparkles, AlertCircle, Compass, Heart, Loader, MessageSquare, 
  RotateCcw, Star, Award, Zap, Shield, Trophy, CheckCircle, RefreshCw,
  Volume2, Play, Pause, Mic, MicOff, Brain, Moon, ShieldAlert, HeartPulse,
  Globe, Search, Sliders, Eye, Wind, Flame, CheckCircle2, Layers, Feather, HelpCircle,
  Smile, Frown, Activity, Sparkle, ChevronDown
} from 'lucide-react';

// =========================================================================
// PROCEDURAL BANSURI FLUTE & TANPURA SYNTHESIZER (WEB AUDIO API)
// =========================================================================
class RagaSynthEngine {
  ctx: AudioContext | null = null;
  tanpuraGain: GainNode | null = null;
  fluteGain: GainNode | null = null;
  masterGain: GainNode | null = null;
  tanpuraOscs: OscillatorNode[] = [];
  melodyTimeout: any = null;
  isPlaying: boolean = false;
  deityId: string = 'athena';

  scales: Record<string, number[]> = {
    zeus: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // Bilawal / Major (Heroic)
    athena: [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25], // Yaman / Lydian (Wisdom)
    sisyphus: [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 493.88, 523.25], // Bhairav / Double Harmonic (Earthy morning grounding)
    hades: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25], // Darbari (Majestic underworld depth)
    poseidon: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25], // Kafi (Dorian ocean waves)
    ares: [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25], // Bhairavi (Fiery rage boundaries)
    sappho: [261.63, 293.66, 311.13, 329.63, 349.23, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25], // Pilu (Poetic lyricism)
    dionysus: [261.63, 293.66, 311.13, 329.63, 392.00, 440.00, 466.16, 523.25], // Playful hybrid
    astra: [261.63, 329.63, 392.00, 493.88, 523.25, 587.33, 659.25, 783.99], // Pentatonic major airy
    medusa: [261.63, 293.66, 349.23, 392.00, 440.00, 523.25], // Pentatonic Durga (Fierce boundary protective)
  };

  ragaNames: Record<string, string> = {
    zeus: "Raag Bilawal (Heroic, celestial sky drone)",
    athena: "Raag Yaman (Sublime wisdom, tactical light)",
    sisyphus: "Raag Bhairav (Solemn morning grounding)",
    hades: "Raag Darbari (Majestic underworld depth)",
    poseidon: "Raag Kafi (Wave-rolling oceanic devotion)",
    ares: "Raag Bhairavi (Intense fire-alchemy boundaries)",
    sappho: "Raag Pilu (Singing lyricism, poetic resonance)",
    dionysus: "Raag Pilu (Playful dynamic festive drone)",
    astra: "Raag Bhupali (Glittering starry starlit wind)",
    medusa: "Raag Durga (Aegis shield of deep protective safety)",
  };

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime); // Low safe volume by default
    this.masterGain.connect(this.ctx.destination);

    this.tanpuraGain = this.ctx.createGain();
    this.tanpuraGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.tanpuraGain.connect(this.masterGain);

    this.fluteGain = this.ctx.createGain();
    this.fluteGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    this.fluteGain.connect(this.masterGain);
  }

  setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(val * 0.28, this.ctx.currentTime + 0.1);
    }
  }

  start(deityId: string) {
    this.init();
    if (!this.ctx) return;
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.deityId = deityId;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.startTanpura();
    this.startMelodyLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
    this.tanpuraOscs.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    this.tanpuraOscs = [];
  }

  startTanpura() {
    if (!this.ctx || !this.tanpuraGain) return;
    
    const baseFreq = this.deityId === 'hades' || this.deityId === 'sisyphus' ? 110 : 130.81; // Low A or Low C
    const freqs = [
      baseFreq * 1.5, // Pa (Perfect 5th)
      baseFreq,       // Sa
      baseFreq,       // Sa
      baseFreq * 0.5, // Low Sa
    ];

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.tanpuraGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 6, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.tanpuraGain);

      osc.start();
      this.tanpuraOscs.push(osc);

      const plucker = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const swellDuration = 1.6 + Math.random() * 1.6;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + swellDuration);

        setTimeout(plucker, (swellDuration + Math.random() * 2.2) * 1000 + (idx * 550));
      };

      setTimeout(plucker, idx * 800);
    });
  }

  playFluteNote(freq: number, durationMs: number) {
    if (!this.ctx || !this.fluteGain) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now); // 1st harmonic octave

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.12, now);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);

    osc1.connect(gainNode);

    const biquadFilter = this.ctx.createBiquadFilter();
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.setValueAtTime(freq * 2.5, now);
    biquadFilter.Q.setValueAtTime(1.0, now);

    gainNode.connect(biquadFilter);
    biquadFilter.connect(this.fluteGain);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.42, now + 0.2); // attack
    gainNode.gain.setValueAtTime(0.42, now + (durationMs / 1000) - 0.2); // sustain
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000)); // release

    const vibratoOsc = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(5.8, now); // 5.8Hz vibrato
    vibratoGain.gain.setValueAtTime(freq * 0.008, now); // pitch variance

    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    vibratoOsc.start();
    osc1.start();
    osc2.start();

    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        vibratoOsc.stop();
      } catch (e) {}
    }, durationMs + 200);
  }

  startMelodyLoop() {
    if (!this.isPlaying) return;

    const ragaScale = this.scales[this.deityId] || this.scales['athena'];
    const scaleLen = ragaScale.length;
    const noteIdx = Math.floor(Math.random() * scaleLen);
    const freq = ragaScale[noteIdx];

    const modes = ['sustained', 'quarter', 'ornament', 'silence'];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    
    let duration = 2000;
    if (mode === 'quarter') {
      duration = 800;
    } else if (mode === 'ornament') {
      duration = 450;
    } else if (mode === 'silence') {
      duration = 1500;
    }

    if (mode !== 'silence' && freq) {
      this.playFluteNote(freq, duration);

      if (mode === 'ornament' && Math.random() > 0.4) {
        setTimeout(() => {
          const nextFreq = ragaScale[(noteIdx + (Math.random() > 0.5 ? 1 : -1) + scaleLen) % scaleLen];
          this.playFluteNote(nextFreq, 400);
        }, duration - 100);
        duration += 350;
      }
    }

    const delay = duration + (Math.random() * 400 + 100);
    this.melodyTimeout = setTimeout(() => this.startMelodyLoop(), delay);
  }
}

export const ragaSynth = new RagaSynthEngine();

// Floating Deity Flute Song Controller
export function DeityFlutePlayer({ deityId }: { deityId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (isPlaying) {
      ragaSynth.stop();
      ragaSynth.start(deityId);
    }
  }, [deityId]);

  useEffect(() => {
    return () => {
      ragaSynth.stop();
    };
  }, []);

  const handleToggle = () => {
    if (isPlaying) {
      ragaSynth.stop();
      setIsPlaying(false);
    } else {
      ragaSynth.start(deityId);
      ragaSynth.setVolume(volume);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ragaSynth.setVolume(val);
  };

  const activeRagaName = ragaSynth.ragaNames[deityId] || "Raag Yaman (Sublime wisdom)";

  return (
    <div className="p-3.5 rounded-2xl border-2 border-brown bg-brown-deep/60 backdrop-blur-md flex items-center justify-between gap-4 max-w-md w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isPlaying ? 'bg-[#c9a45c] text-black animate-pulse' : 'bg-white/5 text-[#c9a45c] hover:bg-white/10'}`}
          title={isPlaying ? "Mute Flute" : "Unmute Flute"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="text-left text-xs">
          <span className="text-[8px] font-mono tracking-widest text-[#c9a45c] uppercase block">
            {isPlaying ? '🎶 Synthesizing Live Flute' : '🎵 Custom Temple Flute Song'}
          </span>
          <span className="font-serif font-bold text-white block leading-tight truncate max-w-[140px] sm:max-w-[180px]">
            {activeRagaName}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Volume2 className="w-3.5 h-3.5 text-sage" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="w-14 accent-[#c9a45c] bg-brown h-1 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
}


// 1. Dynamic Greek God Vibe Atmosphere Background
function DeityVibeAtmosphere({ deityId }: { deityId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const resizeObserver = new ResizeObserver(() => {
      if (canvas) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    });
    resizeObserver.observe(canvas);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      decay: number;
      angle?: number;
      spin?: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.4 + 0.15;
        this.decay = Math.random() * 0.002 + 0.001;

        if (deityId === 'zeus') {
          this.color = '#ffd700'; // high-energy lightning gold
          this.speedY = Math.random() * 1.5 + 0.8; 
          this.speedX = (Math.random() - 0.5) * 0.3;
        } else if (deityId === 'athena') {
          this.color = '#a3b19b'; // Sage Green blueprint
          this.speedX = (Math.random() - 0.5) * 0.15;
          this.speedY = (Math.random() - 0.5) * 0.15;
        } else if (deityId === 'ares') {
          this.color = '#f97316'; // Fiery orange sparks
          this.speedY = -(Math.random() * 1.4 + 0.6); // sparks rising
          this.speedX = (Math.random() - 0.5) * 0.6;
          this.size = Math.random() * 3 + 1.2;
        } else if (deityId === 'poseidon') {
          this.color = '#38bdf8'; // Oceanic blue waves/bubbles
          this.speedY = -(Math.random() * 0.5 + 0.1); // bubbles floating up gently
          this.speedX = Math.sin(Math.random() * Math.PI) * 0.3; // wavy float
          this.size = Math.random() * 3.5 + 1.5;
        } else if (deityId === 'medusa') {
          this.color = '#34d399'; // Emerald-green protective shielding sparks
          this.speedY = -(Math.random() * 0.4 + 0.1);
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.size = Math.random() * 2.8 + 1.2;
        } else if (deityId === 'persephone-soul' || deityId === 'persephone-witness') {
          this.color = '#9fa6ff'; // Periwinkle petal
          this.angle = Math.random() * Math.PI * 2;
          this.spin = (Math.random() - 0.5) * 0.03;
          this.speedY = Math.random() * 0.5 + 0.2;
        } else if (deityId === 'sisyphus') {
          this.color = '#c9a45c'; // Earthy sand dust
          this.speedY = -(Math.random() * 0.6 + 0.3); // dust rising from boulder
          this.speedX = (Math.random() - 0.5) * 0.2;
        } else if (deityId === 'dionysus') {
          this.color = '#e07070'; // wine splash
          this.speedY = Math.random() * 0.7 + 0.3;
          this.speedX = (Math.random() - 0.5) * 0.4;
        } else if (deityId === 'hades') {
          this.color = '#c9a45c'; // gold coin stardust
          this.speedY = -(Math.random() * 0.4 + 0.1);
        } else if (deityId === 'sappho') {
          this.color = '#f5a3a3'; // pink poetry ink
          this.speedY = Math.random() * 0.4 + 0.2;
          this.angle = Math.random() * Math.PI * 2;
          this.spin = (Math.random() - 0.5) * 0.02;
        } else if (deityId === 'astra') {
          this.color = '#ffffff'; // constellation sparkles
          this.alpha = Math.random() * 0.8;
          this.decay = 0;
        } else {
          this.color = '#9fa6ff';
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        if (this.angle !== undefined && this.spin !== undefined) {
          this.angle += this.spin;
        }

        if (deityId === 'astra') {
          this.alpha += (Math.random() - 0.5) * 0.05;
          this.alpha = Math.max(0.1, Math.min(this.alpha, 0.95));
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        if (deityId === 'persephone-soul' || deityId === 'persephone-witness' || deityId === 'sappho') {
          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle || 0);
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 1.6, this.size * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (deityId === 'zeus') {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + (Math.random() - 0.5) * 6, this.y + 4);
          ctx.lineTo(this.x + (Math.random() - 0.5) * 6, this.y + 9);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    const particles: Particle[] = Array.from({ length: 35 }, () => new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle background geometric motifs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      if (deityId === 'athena' || deityId === 'zeus') {
        // Draw sharp tactical lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        for (let i = 0; i < width; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [deityId]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0" />;
}

interface ChatSanctuaryProps {
  selectedCharId: string;
  setSelectedCharId: (id: string) => void;
  isLightMode?: boolean;
}

export default function ChatSanctuary({ selectedCharId, setSelectedCharId, isLightMode }: ChatSanctuaryProps) {
  const activeChar = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const stored = localStorage.getItem('sanctuary_chats');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse stored chat history", e);
      return {};
    }
  });

  const [zenMode, setZenMode] = useState<boolean>(() => localStorage.getItem('zen_mode') === 'true');

  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(() => localStorage.getItem('is_private_mode') === 'true');
  const [isExpertMode, setIsExpertMode] = useState<boolean>(() => localStorage.getItem('is_expert_mode') === 'true');
  const [isInsomniaMode, setIsInsomniaMode] = useState<boolean>(() => localStorage.getItem('is_insomnia_mode') === 'true');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isPrivateMode) {
      const filtered = { ...messages };
      delete filtered[activeChar.id];
      localStorage.setItem('sanctuary_chats', JSON.stringify(filtered));
    } else {
      localStorage.setItem('sanctuary_chats', JSON.stringify(messages));
    }
  }, [messages, isPrivateMode, activeChar.id]);

  useEffect(() => {
    localStorage.setItem('zen_mode', zenMode ? 'true' : 'false');
  }, [zenMode]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Browser SpeechRecognition Integration
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSpeechSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = navigator.language || 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const textToUse = finalTranscript || interimTranscript;
        if (textToUse) {
          setInputText((prev) => {
            const base = prev.trim();
            return base ? `${base} ${textToUse.trim()}` : textToUse.trim();
          });
          if (finalTranscript) {
            triggerGtaNotif("SPEECH TRANSCRIBED: \"" + (finalTranscript.length > 30 ? finalTranscript.slice(0, 30) + "..." : finalTranscript) + "\"", 'text-[#c9a45c]');
          }
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in browser settings.');
          setIsListening(false);
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          // Gracefully ignore pauses so recognition stays active while speaking
        } else {
          setError(`Speech notice: ${event.error}`);
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
        triggerGtaNotif("LISTENING TO VOICE...", 'text-white font-mono');
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    }
  };

  // GTA Gamification States
  const [wantedStress, setWantedStress] = useState<number>(3); // 1-5 Stars
  const [gtaNotifs, setGtaNotifs] = useState<{ id: string; text: string; color: string }[]>([]);
  const [missionPassed, setMissionPassed] = useState<boolean>(false);
  const [loadingScreen, setLoadingScreen] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);

  // Psychological & Clinical UI/UX States
  const [selectedMoodTag, setSelectedMoodTag] = useState<string | null>(null);
  const [sudsRating, setSudsRating] = useState<number>(5); // 1-10 Subjective Units of Distress
  const [initialSuds, setInitialSuds] = useState<number>(5);

  // Somatic Grounding & Box Breathing Drawer
  const [isSomaticModalOpen, setIsSomaticModalOpen] = useState<boolean>(false);
  const [somaticTab, setSomaticTab] = useState<'grounding' | 'breathing'>('grounding');
  const [isBoxBreathingActive, setIsBoxBreathingActive] = useState<boolean>(false);
  const [boxBreathingPhase, setBoxBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [boxBreathingCounter, setBoxBreathingCounter] = useState<number>(4);
  const [groundingChecklist, setGroundingChecklist] = useState({
    see: [false, false, false, false, false],
    feel: [false, false, false, false],
    hear: [false, false, false],
    smell: [false, false],
    taste: [false]
  });

  // CBT Cognitive Defusion & Reframe Vault
  const [isReframeModalOpen, setIsReframeModalOpen] = useState<boolean>(false);
  const [unburdenThought, setUnburdenThought] = useState<string>('');
  const [reframeResult, setReframeResult] = useState<string | null>(null);
  const [detectedDistortions, setDetectedDistortions] = useState<string[]>([]);
  const [isGeneratingReframe, setIsGeneratingReframe] = useState<boolean>(false);
  const [isThoughtDissolving, setIsThoughtDissolving] = useState<boolean>(false);

  // Post-Session Integration Check-out Modal
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState<boolean>(false);
  const [postSessionInsight, setPostSessionInsight] = useState<string>('');

  // Sanctuary Tools Dropdown Menu State
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState<boolean>(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Close tools dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-open target tool (Somatic Reset 5-4-3-2-1 or CBT Reframe) when triggered from Features navbar
  useEffect(() => {
    const handleOpenTool = () => {
      const tool = localStorage.getItem('open_chat_tool');
      if (tool === 'somatic-reset') {
        setIsSomaticModalOpen(true);
        localStorage.removeItem('open_chat_tool');
      } else if (tool === 'cbt-reframe') {
        setIsReframeModalOpen(true);
        localStorage.removeItem('open_chat_tool');
      }
    };

    handleOpenTool();
    window.addEventListener('open_chat_tool', handleOpenTool);
    return () => window.removeEventListener('open_chat_tool', handleOpenTool);
  }, []);

  // Web Speech API Voice Synthesis States
  const [isTtsAutoPlay, setIsTtsAutoPlay] = useState<boolean>(() => {
    return localStorage.getItem('is_tts_autoplay') === 'true';
  });
  const [voiceArchetype, setVoiceArchetype] = useState<'auto' | 'female' | 'male'>(() => {
    return (localStorage.getItem('voice_archetype') as 'auto' | 'female' | 'male') || 'auto';
  });
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load browser Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech Synthesis speak function
  const speakMessage = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Web Speech Synthesis is not supported in this browser.');
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();

    // Clean text of markdown, affective tags, links & emojis for natural speaking
    const cleanText = text
      .replace(/\[Current Affect Label:.*?\]/gi, '')
      .replace(/\[SUDS Distress Level:.*?\]/gi, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[*#_~`>]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Target gender determination
    let targetGender = voiceArchetype;
    if (targetGender === 'auto') {
      const femaleCompanions = ['athena', 'persephone', 'sappho', 'astra', 'soul'];
      targetGender = femaleCompanions.includes(activeChar.id.toLowerCase()) ? 'female' : 'male';
    }

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    const femaleKeywords = ['female', 'woman', 'zira', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'veena', 'siri', 'google us english'];
    const maleKeywords = ['male', 'man', 'david', 'alex', 'daniel', 'george', 'fred', 'rishi', 'google uk english male'];

    if (targetGender === 'female') {
      selectedVoice = voices.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))) || null;
      utterance.pitch = 1.08;
      utterance.rate = 0.98;
    } else {
      selectedVoice = voices.find(v => maleKeywords.some(kw => v.name.toLowerCase().includes(kw))) || null;
      utterance.pitch = 0.88;
      utterance.rate = 0.95;
    }

    // Fallback to English voice if specific match not found
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId || 'tts');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  // Square Box Breathing Pacer Loop
  useEffect(() => {
    let interval: any = null;
    if (isBoxBreathingActive) {
      interval = setInterval(() => {
        setBoxBreathingCounter((prev) => {
          if (prev <= 1) {
            setBoxBreathingPhase((currentPhase) => {
              if (currentPhase === 'Inhale') return 'Hold';
              if (currentPhase === 'Hold') return 'Exhale';
              if (currentPhase === 'Exhale') return 'Pause';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBoxBreathingPhase('Inhale');
      setBoxBreathingCounter(4);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBoxBreathingActive]);

  // Analyze intrusive thought for cognitive distortions
  const analyzeDistortions = (thought: string) => {
    const text = thought.toLowerCase();
    const distortions: string[] = [];
    if (text.match(/always|never|everyone|nobody|completely|ruined|impossible|disaster|failed/)) {
      distortions.push('Catastrophizing & All-or-Nothing');
    }
    if (text.match(/feel like|i feel that|must be|i know they|they think/)) {
      distortions.push('Emotional Reasoning & Mind Reading');
    }
    if (text.match(/should|must|have to|ought to/)) {
      distortions.push('Strict "Should" Statements');
    }
    if (text.match(/i am a|i\'m just a|stupid|failure|useless|worthless|broken/)) {
      distortions.push('Personalization & Harsh Self-Labeling');
    }
    if (distortions.length === 0 && text.trim().length > 5) {
      distortions.push('Negative Automatic Filter');
    }
    setDetectedDistortions(distortions);
  };

  const handleGenerateReframe = async () => {
    if (!unburdenThought.trim()) return;
    setIsGeneratingReframe(true);
    setReframeResult(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeChar,
          history: [
            {
              role: 'user',
              parts: [{
                text: `[THERAPEUTIC CBT REFRAME REQUEST] The user has an intrusive thought: "${unburdenThought}". Identified cognitive distortions: ${detectedDistortions.join(', ')}. Please provide a compassionate, dialectical 2-3 sentence cognitive reframe from your perspective as ${activeChar.name} (${activeChar.alias}). Focus on validation, cognitive flexibility, and somatic grounding.`
              }]
            }
          ],
          isExpertMode,
          isInsomniaMode,
        }),
      });

      if (!response.ok) throw new Error('Could not formulate reframe');
      const data = await response.json();
      setReframeResult(data.text || "Your worth is independent of this passing thought.");
      triggerGtaNotif('COGNITIVE REFRAME GENERATED 🧠', 'text-[#c9a45c]');
    } catch (e) {
      setReframeResult(`Even in heavy moments, ${activeChar.name} reminds you that thoughts are passing weather, not facts.`);
    } finally {
      setIsGeneratingReframe(false);
    }
  };

  const handleRitualDissolve = () => {
    setIsThoughtDissolving(true);
    setTimeout(() => {
      setUnburdenThought('');
      setReframeResult(null);
      setIsThoughtDissolving(false);
      triggerGtaNotif('THOUGHT DEFUSED INTO STARDUST ✦', 'text-emerald-400 font-bold');
      triggerGtaNotif('SOUL UNBURDENED +75 XP', 'text-[#9fa6ff]');
    }, 1200);
  };

  const handleSaveIntegrationToJournal = () => {
    const existingJournals = JSON.parse(localStorage.getItem('sanctuaryJournals') || '[]');
    const newJournal = {
      id: `session-integration-${Date.now()}`,
      title: `Sanctuary Integration: Session with ${activeChar.name}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tag: 'Sanctuary Session',
      mood: Math.max(10, 100 - (sudsRating * 10)),
      entry: `End of Session Integration Notes:
- Initial SUDS Distress: ${initialSuds}/10
- Final SUDS Distress: ${sudsRating}/10
- Selected Affect: ${selectedMoodTag || 'N/A'}
- Primary Takeaway & Insight: "${postSessionInsight || 'I am holding space for my own journey with gentle self-compassion.'}"`,
      deity: activeChar.id,
      reflection: `Session completed with ${activeChar.name} (${activeChar.alias}). Emotional distress shifted from ${initialSuds}/10 to ${sudsRating}/10.`,
    };

    const updated = [newJournal, ...existingJournals];
    localStorage.setItem('sanctuaryJournals', JSON.stringify(updated));
    setIsIntegrationModalOpen(false);
    setMissionPassed(true);
    triggerGtaNotif('INTEGRATION LOGGED TO CHRONICLES 📓', 'text-[#c9a45c]');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Trigger loading screen on deity switch (diagonal-split loader)
  useEffect(() => {
    setLoadingScreen(true);
    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [selectedCharId]);

  // Initial greeting if session is empty
  useEffect(() => {
    const charId = activeChar.id;
    if (!messages[charId] || messages[charId].length === 0) {
      const greetings: Record<string, string> = {
        'persephone-soul': `Greetings, traveler. I am Rooh, the Soul. In the Underworld, I de-escalate crisis and feel the quiet spaces before the noise enters. What holds heavy in your mind today? Let us translate it together.`,
        'sisyphus': `Welcome. I am Sisyphus, or Raag as some call me. I know the rhythm of the boulder and the hill all too well. Today, let us stop counting the heights. Where do you feel your burden in your body right now? Let us rest our hands on the stone and breathe.`,
        'athena': `Hello there. I am Athena, the Hope. Some see only my strategies, but here, I am a keeper of Warli Wisdom and DBT balance. There is no right or wrong answer here—only the questions we explore together. What dialectic or conflict are you navigating?`,
        'persephone-witness': `Welcome to my garden. I am Inayat, a Compassionate Witness of the Aipan patterns. I bloom in both worlds, belonging fully to neither. Here, you are allowed to grieve the transitions—the leaving, the arriving, and everything in between. What has been left unsaid?`,
        'dionysus': `Ah, come in! I am Dionysus, named Ganesh here. I specialize in Chittara Cognitive Reframing. People think I only want the feast, but I know how to dance when things crumble too. Let's take that catastrophic thought of yours and re-frame the canvas. Shall we?`,
        'astra': `Step into the starlight. I am Astra, or Taara. I hold the Kalamezhuthu floor plans to finding paths. If you feel lost in the dark, remember that we don't have to burn ourselves to find our way. Let's trace a gentle direction together.`,
        'zeus': `Greetings. I am Zeus, Krishna in this space. I offer clarity, sovereignty, and the structured lines of Rogan Art. Sometimes holding everything up is a performance of strength we don't need to maintain. What boundaries or sovereignty do you need to reclaim today?`,
        'hades': `Enter the quiet. I am Hades, or Veer. I rule the spaces people fear to visit, yet I am the first to welcome those who arrive. I offer Pata Chitra scroll-grounding. When your thoughts are a chaotic underworld, we can scroll them out neatly. What is causing you to feel ungrounded?`,
        'sappho': `Welcome, poet. I am Sappho, or Manjishtha. I practice Narrative Healing in the Manjusha tradition. We write our feelings down so they can't overwhelm us. Let's look at the stories you tell yourself, and see if we can craft a kinder chapter.`,
        'medusa': `Step into my shield, survivor. I am Medusa, Devi of the Trauma and Abuse Sanctuary. The world may have mislabeled your self-protection, but here, your story is fully believed, and your safety is unbreachable. Together, we will turn the threats and judgments of your abusers into harmless stone. What weighs on your soul? I am here to protect and listen.`,
      };

      const defaultGreeting = `Hello. I am ${activeChar.name}. I am here as a compassionate companion. What is on your heart today?`;

      setMessages((prev) => ({
        ...prev,
        [charId]: [
          {
            id: 'greeting',
            sender: 'companion',
            text: greetings[charId] || defaultGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    }
  }, [activeChar]);

  // GTA Stat Popups Builder
  const triggerGtaNotif = (text: string, color: string = 'text-[#84a98c]') => {
    const id = Math.random().toString();
    setGtaNotifs((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setGtaNotifs((prev) => prev.filter((n) => n.id !== id));
    }, 2800);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsgText = inputText.trim();
    setInputText('');
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const charId = activeChar.id;
    const currentSessionMsgs = messages[charId] || [];
    
    // Crisis word match
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'hurt myself', 'want to end it', 'suicidal'];
    const containsCrisis = crisisKeywords.some(word => userMsgText.toLowerCase().includes(word));

    if (containsCrisis) {
      setIsCrisisModalOpen(true);
      triggerGtaNotif('CRISIS PROTOCOL ACTIVE 🚨', 'text-red-400 font-black animate-pulse');
    }

    let updatedMsgs = [...currentSessionMsgs, userMessage];

    if (containsCrisis) {
      const crisisAlertMsg: Message = {
        id: `crisis-alert-${Date.now()}`,
        sender: 'companion',
        text: `🚨 [EMERGENCY SYSTEM ROUTING] 🚨\nPlease, stay with us. We are deeply concerned for your safety. If you are experiencing thoughts of self-harm or suicide, please connect with a live crisis counselor immediately. They are free, confidential, and available 24/7:\n\n• 🇺🇸🇨🇦 USA & Canada: Call or Text 988\n• 🇬🇧 United Kingdom: Call NHS 111 or Samaritans 116 123\n• 🇮🇳 India: Call Vandrevala +91-9152987821\n• 🌍 Others: https://findahelpline.com\n\nWe have opened our emergency contact card for you. You are valuable. Let us breathe together.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updatedMsgs.push(crisisAlertMsg);
    }

    setMessages((prev) => ({
      ...prev,
      [charId]: updatedMsgs,
    }));

    setIsTyping(true);

    // GTA trigger user stat gain
    const statsList = ['RESPECT +20 XP', 'STAMINA +15 XP', 'MINDFULNESS +30 XP', 'EXPRESSION +25 XP'];
    triggerGtaNotif(statsList[Math.floor(Math.random() * statsList.length)], 'text-[#9fa6ff]');

    try {
      // Append affect context if tag selected
      const historyPayload = updatedMsgs.map((m, index) => {
        const isLastUser = index === updatedMsgs.length - 1 && m.sender === 'user';
        const formattedText = isLastUser && selectedMoodTag 
          ? `[Current Affect Label: ${selectedMoodTag} | SUDS Distress Level: ${sudsRating}/10]\n${m.text}`
          : m.text;

        return {
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: formattedText }],
        };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeChar,
          history: historyPayload,
          isExpertMode,
          isInsomniaMode,
        }),
      });

      if (!response.ok) {
        throw new Error('The sanctuary connection failed. Please retry.');
      }

      const data = await response.json();
      const companionMessage: Message = {
        id: `comp-${Date.now()}`,
        sender: 'companion',
        text: data.text || `I am holding space for you, but my voice is faint right now. Let us try speaking again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setMessages((prev) => ({
        ...prev,
        [charId]: [...updatedMsgs, companionMessage],
      }));

      // Speak message if TTS autoplay is enabled
      if (isTtsAutoPlay) {
        speakMessage(companionMessage.text, companionMessage.id);
      }

      // Companion response lowers stress & gives respect
      setTimeout(() => {
        setWantedStress(prev => Math.max(prev - 1, 1));
        triggerGtaNotif('WANTED STRESS DECREASED ▼', 'text-emerald-400');
        triggerGtaNotif('SOUL CALM +50 XP', 'text-[#c9a45c]');
      }, 500);

    } catch (err: any) {
      setError(err.message || 'The oracle is currently unreachable.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages((prev) => ({
      ...prev,
      [activeChar.id]: [],
    }));
    setWantedStress(3);
    triggerGtaNotif('HISTORY RE-CAST ✦', 'text-[#9fa6ff]');
  };

  const togglePrivateMode = () => {
    const nextVal = !isPrivateMode;
    setIsPrivateMode(nextVal);
    localStorage.setItem('is_private_mode', String(nextVal));
    if (nextVal) {
      setMessages((prev) => ({
        ...prev,
        [activeChar.id]: [],
      }));
      triggerGtaNotif('ANONYMITY ACTIVE 🛡️: CHAT PURGED', 'text-emerald-400');
    } else {
      triggerGtaNotif('ANONYMITY DEACTIVATED ⚠️', 'text-yellow-400');
    }
  };

  const toggleExpertMode = () => {
    const nextVal = !isExpertMode;
    setIsExpertMode(nextVal);
    localStorage.setItem('is_expert_mode', String(nextVal));
    if (nextVal) {
      triggerGtaNotif('EXPERT COGNITIVE HONESTY 🧠', 'text-purple-300');
    } else {
      triggerGtaNotif('STANDARD SUPPORT MODE', 'text-white');
    }
  };

  const toggleInsomniaMode = () => {
    const nextVal = !isInsomniaMode;
    setIsInsomniaMode(nextVal);
    localStorage.setItem('is_insomnia_mode', String(nextVal));
    if (nextVal) {
      triggerGtaNotif('NIGHT SHIELD ON 🌙', 'text-amber-400 animate-pulse');
      ragaSynth.start(activeChar.id);
      ragaSynth.setVolume(0.18);
    } else {
      triggerGtaNotif('NIGHT SHIELD OFF ☀️', 'text-white');
    }
  };

  // Adjust Wanted level manually (GTA-style gameplay)
  const adjustWantedStress = (level: number) => {
    setScreenFlash(true);
    setWantedStress(level);
    setTimeout(() => setScreenFlash(false), 200);

    if (level === 5) {
      triggerGtaNotif('STRESS MAXIMUM ⚠️', 'text-red-500 font-bold');
    } else {
      triggerGtaNotif(`WANTED STRESS ADJUSTED: ${level} STARS`, 'text-[#c9a45c]');
    }
  };

  const activePrompts = [
    'Help me map a realistic next step for my healing.',
    'Can we cognitively reframe a heavy self-criticism?',
    'I feel stuck. Can we brainstorm a solution path?',
    'Guide me in a somatic grounding check-in.'
  ];

  return (
    <div className={`relative min-h-[calc(100vh-80px)] text-white pt-20 sm:pt-24 pb-12 px-3 sm:px-6 w-full max-w-[1600px] mx-auto z-10 flex flex-col lg:flex-row gap-4 lg:gap-6 transition-all duration-500 overflow-hidden ${isInsomniaMode ? 'brightness-90 sepia-[25%] contrast-[92%] saturate-[95%]' : ''}`}>
      
      {/* Dynamic Screen Flash Overlay (GTA Wanted Level change effect) */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* 2. Diagonally Splitting GTA-style loading screen on deity switch */}
      <AnimatePresence>
        {loadingScreen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Top-Right Panel sliding out */}
            <motion.div
              initial={{ x: '0%', y: '0%' }}
              animate={{ x: '100%', y: '-100%' }}
              exit={{ x: '100%', y: '-100%' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-gradient-to-bl from-slate-900 to-slate-950 origin-top-right border-b-4 border-[#c9a45c]/50 pointer-events-auto"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)' }}
            />
            {/* Bottom-Left Panel sliding out */}
            <motion.div
              initial={{ x: '0%', y: '0%' }}
              animate={{ x: '-100%', y: '100%' }}
              exit={{ x: '-100%', y: '100%' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-900 origin-bottom-left pointer-events-auto"
              style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%, 0 0)' }}
            />
            
            {/* Loading character splash card */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
            >
              <div className="max-w-xl space-y-4">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#c9a45c] uppercase block">ENTERING ZONE</span>
                <h1 className="font-serif text-5xl md:text-7xl italic font-bold text-white tracking-wide">
                  {activeChar.badge.toUpperCase()}
                </h1>
                <p className="text-sm font-serif italic text-sage tracking-wider max-w-md mx-auto">
                  {activeChar.quote}
                </p>
                <div className="pt-2">
                  <span className="inline-block h-1 w-24 bg-[#c9a45c]/40 rounded animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. GTA-STYLE MISSION PASSED BOARD */}
      <AnimatePresence>
        {missionPassed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Horizontal Banner Slits */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-3xl bg-gradient-to-r from-transparent via-[#84a98c]/20 to-transparent h-1.5 mb-2"
            />

            {/* Title block */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="py-6 px-12 bg-black/50 border-y-4 border-[#c9a45c] w-full max-w-3xl relative"
            >
              <h1 className="font-sans font-black italic text-5xl md:text-7xl tracking-widest text-[#c9a45c] drop-shadow-[0_4px_10px_rgba(201,164,92,0.4)] uppercase">
                HEALING PASSED
              </h1>
              <p className="text-xs font-mono tracking-[0.3em] text-white uppercase mt-1">
                Sanctuary Session Complete
              </p>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-3xl bg-gradient-to-r from-transparent via-[#84a98c]/20 to-transparent h-1.5 mt-2 mb-10"
            />

            {/* Mission Stats Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-md bg-[#0a0f1d] border-2 border-brown rounded-2xl p-6 text-left space-y-4 shadow-2xl"
            >
              <h3 className="font-serif text-lg text-white border-b border-brown pb-2 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#c9a45c]" /> Session Respect Gains
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sage uppercase font-mono">Companion Deity</span>
                  <span className="text-white font-serif">{activeChar.badge} ({activeChar.alias})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sage uppercase font-mono">Wanted Stress Cleared</span>
                  <span className="text-green-400 font-bold">5 Stars → 1 Star</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sage uppercase font-mono">Dialectical Mastery</span>
                  <span className="text-white font-bold">+250 XP</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sage uppercase font-mono">Somatic Awareness</span>
                  <span className="text-[#c9a45c] font-bold">STAMINA +100</span>
                </div>
              </div>

              <div className="pt-4 border-t border-brown/50">
                <div className="flex justify-between items-center text-[10px] font-mono text-sage mb-1.5">
                  <span>TOTAL COVENANT RESPECT</span>
                  <span className="text-[#9fa6ff]">RESPECT+ 85%</span>
                </div>
                <div className="h-3 bg-brown rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="h-full bg-gradient-to-r from-periwinkle to-emerald-400 rounded-full transition-all duration-1000 w-[85%]" />
                </div>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => setMissionPassed(false)}
              className="mt-8 bg-white text-black hover:bg-slate-200 font-mono text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Return to Sanctuary
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR: Companion List as a Bento Box */}
      {!zenMode && (
        <div className="w-full lg:w-64 xl:w-72 flex flex-col border-2 border-brown bg-sage-dark rounded-[24px] overflow-hidden shrink-0">
          <div className="p-4 border-b-2 border-brown bg-brown-deep/30 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg tracking-wide text-white">The Sanctuary</h2>
              <span className="text-[10px] font-bold tracking-[0.1em] text-sage uppercase block">
                Select Your Companion
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#c9a45c] border border-[#c9a45c]/30 px-2 py-0.5 rounded-md uppercase">
              Deity Hub
            </span>
          </div>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto max-h-[140px] lg:max-h-[500px] p-3 gap-2 scrollbar-none">
            {CHARACTERS.map((char) => {
              const isActive = char.id === activeChar.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all shrink-0 lg:shrink cursor-pointer focus:outline-none border-2 ${
                    isActive
                      ? 'bg-periwinkle/10 border-periwinkle/40 shadow-[0_0_15px_rgba(159,166,255,0.15)]'
                      : 'border-transparent hover:bg-brown/50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${char.colorScheme.glow} 0%, rgba(255,255,255,0.03) 100%)`,
                      border: `1px solid ${isActive ? '#9fa6ff' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className={`text-[10px] font-mono font-bold ${char.colorScheme.text}`}>
                      {char.alias[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-serif text-white font-medium">{char.name}</h4>
                    <p className="text-[8px] text-sage tracking-wider uppercase font-semibold">{char.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN CHAT AREA as a Bento Box */}
      <div className="flex-1 flex flex-col lg:flex-row border-2 border-brown bg-[#090d16] rounded-[24px] overflow-visible lg:overflow-hidden min-h-[680px] lg:h-[800px] justify-between relative isolate shadow-2xl">
        
        {/* Particle Backdrop tuned to active deity vibe */}
        {!zenMode && <DeityVibeAtmosphere deityId={activeChar.id} />}

        {/* Dynamic Floating GTA Stat Notifications */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2">
          <AnimatePresence>
            {gtaNotifs.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.6, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-black/80 px-4 py-2 border border-brown rounded-xl font-mono text-xs uppercase font-black tracking-widest ${notif.color} shadow-lg`}
                transition={{ duration: 0.3 }}
              >
                ✦ {notif.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Left Side: Interactive Greek Statue Sandbox */}
        {!zenMode && (
          <div className="w-full lg:w-[260px] xl:w-[300px] border-b-2 lg:border-b-0 lg:border-r-2 border-brown shrink-0 overflow-hidden relative z-10 bg-[#090d16]/30">
            <DeityStatue 
              deityId={activeChar.id} 
              isTyping={isTyping} 
              wantedStress={wantedStress} 
              triggerGtaNotif={triggerGtaNotif} 
            />
          </div>
        )}

        {/* Right Side: Message Feed & Chat Window */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative z-10 h-full min-w-0">

          {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b-2 border-brown bg-brown-deep/60 backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-3 relative z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `radial-gradient(circle, ${activeChar.colorScheme.glow} 0%, rgba(255,255,255,0.03) 100%)`,
                border: `2px solid ${activeChar.colorScheme.glow}`,
              }}
            >
              <span className={`text-xs font-serif font-bold ${activeChar.colorScheme.text}`}>
                {activeChar.alias[0]}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base text-white">{activeChar.name}</h3>
                <span
                  className={`text-[8px] tracking-widest font-mono uppercase px-2 py-0.5 rounded-full ${activeChar.colorScheme.badge}`}
                >
                  {activeChar.badge}
                </span>
              </div>
              <p className="text-[9px] text-sage font-semibold tracking-wider uppercase truncate max-w-[200px] sm:max-w-[320px]">
                {activeChar.role} &middot; {activeChar.artStyle} Art integration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
            {/* Zen Mode Button */}
            <button
              onClick={() => {
                setZenMode(!zenMode);
                triggerGtaNotif(!zenMode ? 'ZEN MODE ACTIVE 🧘' : 'ZEN MODE OFF 🌸', 'text-[#c9a45c]');
              }}
              title="Toggle Zen Mode (Clean Chat, No Animations)"
              className={`order-4 w-full sm:order-none sm:w-auto px-3 py-1.5 rounded-xl border-2 font-mono text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                zenMode
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'border-brown text-sage hover:border-sage hover:text-white bg-brown-deep/20'
              }`}
            >
              <span>{zenMode ? '🧘 Zen On' : '🌸 Zen Off'}</span>
            </button>
            {/* GTA WANTED STRESS HUD */}
            {!zenMode && (
              <div className="flex min-w-[145px] flex-1 flex-col items-start rounded-xl border border-[#c9a45c]/20 bg-black/20 px-2.5 py-1.5 sm:min-w-0 sm:flex-none sm:items-end sm:border-0 sm:bg-transparent sm:p-0 shrink-0 select-none">
                <span className="text-[9px] font-mono text-[#c9a45c] tracking-[0.12em] font-black uppercase mb-1">
                  Stress level <span className="text-white/60">{wantedStress}/5</span>
                </span>
                <div className="flex gap-1" role="group" aria-label="Set your current stress level">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isWanted = star <= wantedStress;
                    return (
                      <button
                        key={star}
                        onClick={() => adjustWantedStress(star)}
                        className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a45c] transition-transform hover:scale-125 cursor-pointer"
                        aria-label={`Set stress level to ${star} out of 5`}
                        aria-pressed={isWanted}
                        title={`Set stress level to ${star} out of 5`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isWanted
                              ? 'text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete Session Button */}
            <button
              onClick={() => setMissionPassed(true)}
              title="Complete Session & Tally Stats"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/30 hover:border-emerald-500/60 p-2 text-emerald-400 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] uppercase font-mono tracking-wider font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden md:inline">Complete</span>
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              title="Reset Conversation"
              className="text-sage hover:text-white p-2 transition-colors cursor-pointer rounded-xl border-2 border-brown hover:border-sage bg-brown-deep/50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customized Procedural Indian Flute & Tanpura Player */}
        <div className="px-4 py-3 bg-black/20 border-b border-brown/40 flex justify-center relative z-20">
          <DeityFlutePlayer deityId={activeChar.id} />
        </div>

        <div className="flex-1 min-h-[280px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-brown-deep/10 relative z-10 scrollbar-none">
          <AnimatePresence initial={false}>
            {(messages[activeChar.id] || []).map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-[18px] p-4 text-xs md:text-sm leading-relaxed tracking-wide shadow-lg border-2 ${
                      isUser
                        ? 'bg-periwinkle-dark text-white rounded-tr-none border-periwinkle/30'
                        : 'bg-brown text-slate-100 rounded-tl-none border-brown-dark/30'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-brown-dark/40 space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#c9a45c] flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sky-400" />
                          <span>Google Search Grounded Sources:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-black/40 hover:bg-black/60 text-sky-300 hover:text-sky-200 border border-sky-500/30 rounded-lg px-2 py-1 truncate max-w-[220px] inline-flex items-center gap-1 transition-colors"
                              title={src.title || src.uri}
                            >
                              <Globe className="w-2.5 h-2.5 shrink-0 text-sky-400" />
                              <span className="truncate">{src.title || src.uri}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-brown-dark/20">
                      {!isUser ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (speakingMsgId === msg.id) {
                              stopSpeech();
                            } else {
                              speakMessage(msg.text, msg.id);
                            }
                          }}
                          title={speakingMsgId === msg.id ? "Stop reading message" : "Read message aloud"}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-mono inline-flex items-center gap-1 transition-all cursor-pointer ${
                            speakingMsgId === msg.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse font-bold'
                              : 'bg-black/30 border-brown/50 text-slate-400 hover:text-white hover:border-slate-300'
                          }`}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <Pause className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Speaking... ⏹️</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-2.5 h-2.5 text-sage" />
                              <span>Listen 🔊</span>
                            </>
                          )}
                        </button>
                      ) : <div />}
                      <span className={`text-[8px] ${isUser ? 'text-periwinkle-hover' : 'text-sage'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-brown rounded-[18px] rounded-tl-none border-2 border-brown-dark/20 p-4 text-xs flex items-center gap-2 text-sage shadow-md">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span className="font-serif italic">
                  {activeChar.name === 'Soul' && 'Tuning in to your vibes...'}
                  {activeChar.name === 'Sisyphus' && 'Sisyphus is listening...'}
                  {activeChar.name === 'Athena' && 'Athena is formulating advice...'}
                  {activeChar.name === 'Persephone' && 'Holding silent witness...'}
                  {activeChar.name === 'Dionysus' && 'Reframing the situation...'}
                  {activeChar.name === 'Astra' && 'Searching the stars...'}
                  {activeChar.name === 'Zeus' && 'Focusing skyward clarity...'}
                  {activeChar.name === 'Hades' && 'Grounding the thoughts...'}
                  {activeChar.name === 'Sappho' && 'Weaving story narrative...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-[#e07070]/10 border-2 border-[#e07070]/20 rounded-xl p-3 text-xs text-[#e07070] flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* HORIZONTAL SUGGESTION PROMPTS BAR */}
        {activePrompts.length > 0 && (
          <div className="border-t border-brown/50 bg-black/40 px-3 py-2 flex items-center overflow-x-auto max-w-full scrollbar-none gap-2 relative z-20 text-[11px] font-mono">
            {activePrompts.map((prompt, i) => (
              <button
                key={`prompt-${i}`}
                type="button"
                onClick={() => setInputText(prompt)}
                className="whitespace-nowrap text-[11px] leading-snug text-[#c9a45c] hover:text-white border border-[#c9a45c]/40 hover:border-[#c9a45c] bg-[#c9a45c]/10 hover:bg-[#c9a45c]/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-semibold shrink-0"
              >
                ✦ {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t-2 border-brown bg-brown-deep/40 backdrop-blur-md flex gap-2 sm:gap-3 relative z-20">
          {/* Left-Side Tools Dropdown Menu */}
          <div className="relative shrink-0" ref={toolsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              title="Therapeutic Tools & Mode Settings"
              className={`h-11 px-3 sm:px-3.5 rounded-xl border-2 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isToolsDropdownOpen
                  ? 'border-[#c9a45c] bg-[#c9a45c]/20 text-[#c9a45c] shadow-[0_0_12px_rgba(201,164,92,0.3)]'
                  : 'border-brown bg-brown-deep hover:border-sage text-sage hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#c9a45c]" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180 text-[#c9a45c]' : ''}`} />
            </button>

            {/* Popover Menu */}
            {isToolsDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 bg-[#0c1017] border-2 border-[#c9a45c]/40 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] font-bold flex justify-between items-center">
                  <span>Sanctuary Tools</span>
                  <span className="text-white/40">⚡</span>
                </div>

                {/* 1. 🧠 CBT Reframe & Unburden */}
                <button
                  type="button"
                  onClick={() => {
                    setIsReframeModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-sky-500/30 text-sky-200 hover:text-white hover:border-sky-400 bg-sky-950/40 hover:bg-sky-900/60 transition-all text-left text-xs font-semibold cursor-pointer"
                >
                  <Brain className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>🧠 CBT Reframe & Unburden</span>
                </button>

                {/* 2. ✨ Integrate Session */}
                <button
                  type="button"
                  onClick={() => {
                    setIsIntegrationModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#c9a45c]/40 text-[#c9a45c] hover:text-white hover:border-[#c9a45c] bg-[#c9a45c]/10 hover:bg-[#c9a45c]/20 transition-all text-left text-xs font-semibold cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#c9a45c] shrink-0" />
                  <span>✨ Integrate Session</span>
                </button>

                {/* 3. Anonymity Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    togglePrivateMode();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                    isPrivateMode
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-brown/50 text-sage hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Anonymity</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/50">
                    {isPrivateMode ? 'ON 🛡️' : 'OFF'}
                  </span>
                </button>

                {/* 4. Clinical Honesty Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    toggleExpertMode();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                    isExpertMode
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                      : 'bg-black/40 border-brown/50 text-sage hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Clinical Honesty</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/50">
                    {isExpertMode ? 'ON 🧠' : 'OFF'}
                  </span>
                </button>

                {/* 5. 2 AM Sleepless Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    toggleInsomniaMode();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                    isInsomniaMode
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-black/40 border-brown/50 text-sage hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>2 AM Sleepless</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/50">
                    {isInsomniaMode ? 'ON 🌙' : 'OFF'}
                  </span>
                </button>

                {/* 6. SOS 📞 */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCrisisModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-red-500/50 text-red-300 hover:text-white hover:border-red-400 bg-red-500/15 hover:bg-red-500/25 transition-all text-left text-xs font-bold cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  <span>SOS 📞 Emergency Support</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... Speak your mind" : `Message ${activeChar.name}...`}
            className={`flex-1 bg-brown-deep text-white border-2 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none transition-colors placeholder:text-white/30 ${
              isListening
                ? 'border-[#c9a45c] shadow-[0_0_15px_rgba(201,164,92,0.25)] ring-1 ring-[#c9a45c] animate-pulse placeholder:text-[#c9a45c]/50'
                : 'border-brown focus:border-[#c9a45c] focus:ring-1 focus:ring-[#c9a45c]'
            }`}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer font-bold shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-brown border-2 border-brown hover:border-sage text-[#c9a45c] hover:bg-brown-deep'
              }`}
              title={isListening ? "Stop listening" : "Speak your message"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping || isListening}
            className="w-11 h-11 bg-periwinkle-dark text-white hover:bg-periwinkle-hover disabled:opacity-40 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(159,166,255,0.2)] font-bold shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>

      {/* 4. EMERGENCY SOS HELPLINES MODAL */}
      <AnimatePresence>
        {isCrisisModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f1424] border-2 border-red-500/50 rounded-2xl max-w-xl w-full p-6 text-left space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-brown/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> Emergency SOS Crisis Helplines
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCrisisModalOpen(false)}
                  className="text-sage hover:text-white font-bold cursor-pointer text-sm focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please know that you do not have to carry this heavy stone alone. Real human beings are waiting to listen and support you with absolute safety and confidentiality, free of charge.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex justify-between font-mono font-bold text-slate-200">
                    <span>🇺🇸🇨🇦 United States & Canada</span>
                    <span className="text-red-400 font-black">Call or Text: 988</span>
                  </div>
                  <p className="text-slate-400">988 Suicide & Crisis Lifeline - Available 24 hours, 7 days a week.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-brown/30 space-y-1 text-xs">
                  <div className="flex justify-between font-mono font-bold text-slate-200">
                    <span>🇬🇧 United Kingdom</span>
                    <span className="text-[#c9a45c] font-bold">Call NHS 111 / Samaritans: 116 123</span>
                  </div>
                  <p className="text-slate-400">Samaritans and National Health Service mental health support lines.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-brown/30 space-y-1 text-xs">
                  <div className="flex justify-between font-mono font-bold text-slate-200">
                    <span>🇮🇳 India</span>
                    <span className="text-[#c9a45c] font-bold">Call Vandrevala: 91-9152987821</span>
                  </div>
                  <p className="text-slate-400">Vandrevala Foundation 24/7 Crisis helpline or AASRA: 91-9820466726.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-brown/30 space-y-1 text-xs">
                  <div className="flex justify-between font-mono font-bold text-slate-200">
                    <span>🌍 International Directories</span>
                    <a 
                      href="https://findahelpline.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-periwinkle hover:underline font-bold"
                    >
                      findahelpline.com ↗
                    </a>
                  </div>
                  <p className="text-slate-400">Find verified, free hotlines and text lines in over 130 countries.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] leading-relaxed text-red-300">
                ⚠️ **MEDICAL DISCLAIMER:** The Friend AI sanctuary offers supportive archetypal chat companions and somatic tools. It is not a clinical medical service, and cannot replace official psychiatric care or medical intervention during active acute crises.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCrisisModalOpen(false)}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/70 text-red-200 text-xs uppercase font-mono px-5 py-2.5 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Close & Continue Breathing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SOMATIC GROUNDING & BOX BREATHING MODAL */}
      <AnimatePresence>
        {isSomaticModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f1424] border-2 border-teal-500/50 rounded-2xl max-w-xl w-full p-6 text-left space-y-4 shadow-[0_0_30px_rgba(20,184,166,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-brown/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-teal-300 flex items-center gap-2">
                  <Wind className="w-5 h-5 text-teal-400 animate-pulse" /> Somatic De-escalation & Grounding Hub
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsSomaticModalOpen(false);
                    setIsBoxBreathingActive(false);
                  }}
                  className="text-sage hover:text-white font-bold cursor-pointer text-sm focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border border-brown rounded-xl p-1 bg-black/40 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSomaticTab('grounding')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                    somaticTab === 'grounding' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👁️ 5-4-3-2-1 Sensory Grounding
                </button>
                <button
                  type="button"
                  onClick={() => setSomaticTab('breathing')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                    somaticTab === 'breathing' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🫁 Square Box Breathing (4-4-4-4)
                </button>
              </div>

              {somaticTab === 'grounding' ? (
                <div className="space-y-3 pt-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    When anxiety activates fight-or-flight, your cognitive center narrows. Name elements around you to signal safety to your nervous system:
                  </p>
                  
                  {/* 5 See */}
                  <div className="p-3 bg-black/40 border border-brown/40 rounded-xl space-y-1.5">
                    <span className="font-mono font-bold text-teal-300 uppercase block">5 Things You See:</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newSee = [...groundingChecklist.see];
                            newSee[idx - 1] = !newSee[idx - 1];
                            setGroundingChecklist({ ...groundingChecklist, see: newSee });
                          }}
                          className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer font-mono font-bold ${
                            groundingChecklist.see[idx - 1]
                              ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                              : 'bg-black/30 border-brown text-slate-500'
                          }`}
                        >
                          Item {idx} {groundingChecklist.see[idx - 1] ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Feel */}
                  <div className="p-3 bg-black/40 border border-brown/40 rounded-xl space-y-1.5">
                    <span className="font-mono font-bold text-teal-300 uppercase block">4 Things You Feel / Touch:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newFeel = [...groundingChecklist.feel];
                            newFeel[idx - 1] = !newFeel[idx - 1];
                            setGroundingChecklist({ ...groundingChecklist, feel: newFeel });
                          }}
                          className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer font-mono font-bold ${
                            groundingChecklist.feel[idx - 1]
                              ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                              : 'bg-black/30 border-brown text-slate-500'
                          }`}
                        >
                          Touch {idx} {groundingChecklist.feel[idx - 1] ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 Hear */}
                  <div className="p-3 bg-black/40 border border-brown/40 rounded-xl space-y-1.5">
                    <span className="font-mono font-bold text-teal-300 uppercase block">3 Sounds You Hear:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newHear = [...groundingChecklist.hear];
                            newHear[idx - 1] = !newHear[idx - 1];
                            setGroundingChecklist({ ...groundingChecklist, hear: newHear });
                          }}
                          className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer font-mono font-bold ${
                            groundingChecklist.hear[idx - 1]
                              ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                              : 'bg-black/30 border-brown text-slate-500'
                          }`}
                        >
                          Sound {idx} {groundingChecklist.hear[idx - 1] ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-black/40 border border-brown/40 rounded-xl text-center">
                      <span className="font-mono text-[10px] text-teal-300 uppercase block mb-1">2 Smell</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSmell = [...groundingChecklist.smell];
                          newSmell[0] = !newSmell[0];
                          setGroundingChecklist({ ...groundingChecklist, smell: newSmell });
                        }}
                        className={`w-full py-1 rounded border font-mono text-[10px] cursor-pointer ${
                          groundingChecklist.smell[0] ? 'bg-teal-500/30 border-teal-400 text-teal-200' : 'bg-black/30 border-brown text-slate-500'
                        }`}
                      >
                        Scent 1 {groundingChecklist.smell[0] ? '✓' : ''}
                      </button>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-brown/40 rounded-xl text-center">
                      <span className="font-mono text-[10px] text-teal-300 uppercase block mb-1">1 Taste</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newTaste = [...groundingChecklist.taste];
                          newTaste[0] = !newTaste[0];
                          setGroundingChecklist({ ...groundingChecklist, taste: newTaste });
                        }}
                        className={`w-full py-1 rounded border font-mono text-[10px] cursor-pointer ${
                          groundingChecklist.taste[0] ? 'bg-teal-500/30 border-teal-400 text-teal-200' : 'bg-black/30 border-brown text-slate-500'
                        }`}
                      >
                        Taste 1 {groundingChecklist.taste[0] ? '✓' : ''}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSomaticModalOpen(false);
                        triggerGtaNotif('SOMATIC GROUNDING COMPLETE 🌿', 'text-teal-300 font-bold');
                        triggerGtaNotif('AUTONOMIC CALM +50 XP', 'text-[#c9a45c]');
                      }}
                      className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-200 text-xs uppercase font-mono px-5 py-2.5 rounded-xl transition-all cursor-pointer font-bold"
                    >
                      Complete Grounding
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-6">
                  {/* Pulsing Visual Box Pacer */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: boxBreathingPhase === 'Inhale' ? 1.35 : boxBreathingPhase === 'Exhale' ? 0.75 : 1,
                        opacity: boxBreathingPhase === 'Hold' || boxBreathingPhase === 'Pause' ? 0.9 : 0.6,
                      }}
                      transition={{ duration: 4, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border-4 border-teal-400 bg-teal-500/10 shadow-[0_0_40px_rgba(20,184,166,0.3)]"
                    />
                    <div className="z-10 font-mono">
                      <span className="text-2xl font-black text-teal-300 block uppercase tracking-widest animate-pulse">
                        {boxBreathingPhase}
                      </span>
                      <span className="text-4xl font-bold text-white mt-1 block">
                        {boxBreathingCounter}s
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                    Box Breathing stimulates the vagus nerve, immediately lowering heart rate and cortisol levels. Inhale 4s &rarr; Hold 4s &rarr; Exhale 4s &rarr; Rest 4s.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsBoxBreathingActive(!isBoxBreathingActive)}
                    className={`px-8 py-3 rounded-xl border-2 font-mono text-xs uppercase font-bold transition-all cursor-pointer shadow-lg ${
                      isBoxBreathingActive
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-teal-500/20 border-teal-400 text-teal-200 hover:bg-teal-500/30'
                    }`}
                  >
                    {isBoxBreathingActive ? 'Pause Box Pacer' : 'Start Box Breathing Pacer'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CBT COGNITIVE DEFUSION & REFRAME VAULT MODAL */}
      <AnimatePresence>
        {isReframeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f1424] border-2 border-sky-500/50 rounded-2xl max-w-xl w-full p-6 text-left space-y-4 shadow-[0_0_30px_rgba(56,189,248,0.2)] relative"
            >
              <div className="flex items-center justify-between border-b border-brown/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-sky-300 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-sky-400" /> CBT Cognitive Defusion & Unburdening Vault
                </h3>
                <button
                  type="button"
                  onClick={() => setIsReframeModalOpen(false)}
                  className="text-sage hover:text-white font-bold cursor-pointer text-sm focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Type an intrusive, self-critical, or catastrophic thought looping in your mind. We will spot cognitive traps and reframe or dissolve it.
              </p>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={unburdenThought}
                  onChange={(e) => {
                    setUnburdenThought(e.target.value);
                    analyzeDistortions(e.target.value);
                  }}
                  placeholder="e.g., 'I am failing at everything and ruining my future...'"
                  className="w-full bg-black/40 border-2 border-brown focus:border-sky-400 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors leading-relaxed"
                />

                {/* Detected Distortion Badges */}
                {detectedDistortions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-sage uppercase font-bold">Detected Traps:</span>
                    {detectedDistortions.map((dist, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[10px] font-mono bg-sky-500/10 border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-md"
                      >
                        ⚠️ {dist}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateReframe}
                    disabled={!unburdenThought.trim() || isGeneratingReframe}
                    className="flex-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingReframe ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-sky-400" />}
                    <span>Formulate Archetype Reframe</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRitualDissolve}
                    disabled={!unburdenThought.trim() || isThoughtDissolving}
                    className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4 text-purple-400" />
                    <span>Ritual Defusion Dissolve</span>
                  </button>
                </div>

                {/* Reframe Result Output */}
                <AnimatePresence>
                  {reframeResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl bg-black/60 border border-sky-500/40 text-xs text-sky-100 leading-relaxed space-y-2 mt-3"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#c9a45c] uppercase font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{activeChar.name}'s Dialectical Perspective:</span>
                      </div>
                      <p className="font-serif italic text-sm">{reframeResult}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dissolve Animation Effect */}
                {isThoughtDissolving && (
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="p-4 rounded-xl bg-purple-500/30 border border-purple-400 text-center font-serif italic text-purple-200"
                  >
                    ✦ Thought dissolving into Hades' vault stardust... You are free.
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. END-OF-SESSION INTEGRATION CHECK-OUT MODAL */}
      <AnimatePresence>
        {isIntegrationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f1424] border-2 border-[#c9a45c]/50 rounded-2xl max-w-xl w-full p-6 text-left space-y-4 shadow-[0_0_30px_rgba(201,164,92,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-brown/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-[#c9a45c] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c9a45c]" /> End-of-Session Integration Check-out
                </h3>
                <button
                  type="button"
                  onClick={() => setIsIntegrationModalOpen(false)}
                  className="text-sage hover:text-white font-bold cursor-pointer text-sm focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Before stepping back into the outer world, take 30 seconds to integrate what shifted in your mind and body during this sanctuary conversation with {activeChar.name}.
              </p>

              <div className="space-y-3 pt-1 text-xs">
                {/* Distress Comparison */}
                <div className="p-3.5 bg-black/40 border border-brown/40 rounded-xl space-y-2">
                  <div className="flex justify-between font-mono font-bold">
                    <span className="text-sage uppercase">Emotional Distress (SUDS) Shift:</span>
                    <span className="text-[#c9a45c]">{initialSuds}/10 &rarr; {sudsRating}/10</span>
                  </div>
                  <div className="h-2 bg-brown rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-[#c9a45c] transition-all duration-500"
                      style={{ width: `${Math.max(10, (10 - sudsRating) * 10)}%` }}
                    />
                  </div>
                </div>

                {/* Key Insight Notes */}
                <div className="space-y-1.5">
                  <label className="font-mono text-sage text-[10px] uppercase font-bold block">
                    One Key Insight / Takeaway to Carry Today:
                  </label>
                  <textarea
                    rows={3}
                    value={postSessionInsight}
                    onChange={(e) => setPostSessionInsight(e.target.value)}
                    placeholder={`e.g., "${activeChar.name} reminded me that my feelings are valid, but my thoughts are not always absolute truth."`}
                    className="w-full bg-black/40 border-2 border-brown focus:border-[#c9a45c] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#c9a45c]/10 border border-[#c9a45c]/20 text-[10px] text-amber-200 leading-relaxed">
                  ✦ Saving will log this session reflection into your personal <strong>Wisdom Chronicles Journal</strong> and unlock full session respect XP rewards!
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIntegrationModalOpen(false)}
                    className="text-xs font-mono px-4 py-2 rounded-xl border border-slate-500/30 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveIntegrationToJournal}
                    className="bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" /> Save Integration & Finish Session
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
