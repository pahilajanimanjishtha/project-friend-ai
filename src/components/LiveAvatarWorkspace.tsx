/**
 * LiveAvatarWorkspace.tsx
 *
 * Real-Time 3D Digital Human Interactive Call Workspace.
 * Features:
 *  - Continuous, auto-recovering Web Speech Recognition with interim transcription HUD
 *  - Ultra-fast <50ms response engine & zero-delay conversational lip-sync
 *  - Floating glassmorphism live subtitles directly on the 3D video viewport
 *  - Interactive emotion/gesture triggers, state telemetry, and voice interruption
 */

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera, CameraOff, Mic, MicOff, PhoneOff, Send,
  MessageSquareText, Sparkles, AlertTriangle,
  ZapOff, Volume2, Mic as MicIcon
} from 'lucide-react';
import { AVATARS, getAvatarById } from '../avatars';
import type { Avatar } from '../types';
import {
  applyEmaLisp,
  safeDirective,
  type AvatarDirective,
  type AvatarEmotion,
  type AvatarGesture,
  type AvatarState,
} from '../lib/avatarCall';
import { createVisemeTimeline, createVisemeTimelineFromAlignment, type CharacterAlignment } from '../lib/visemeTimeline';
import { audioController } from '../lib/audioPlayback';
import { avatarEngine, type AnimationFrameOutput } from '../lib/avatarAnimation';
import AvatarModelStage from './AvatarModelStage';

type CallStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

interface TranscriptLine {
  id: string;
  role: 'you' | 'companion';
  text: string;
  timestamp: number;
  emotion?: AvatarEmotion;
  gesture?: AvatarGesture;
}

function base64ToAudioBlob(base64: string, mime: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function normalizeAlignment(value: any): CharacterAlignment | null {
  if (!value || !Array.isArray(value.characters)) return null;
  const starts = value.characterStartTimesSeconds || value.character_start_times_seconds;
  const ends = value.characterEndTimesSeconds || value.character_end_times_seconds;
  if (!Array.isArray(starts) || !Array.isArray(ends)) return null;
  return {
    characters: value.characters,
    characterStartTimesSeconds: starts,
    characterEndTimesSeconds: ends,
  };
}

function chooseBrowserVoice(avatar: Avatar): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const female = avatar.voice === 'feminine';
  const preferred = female
    ? [/samantha/i, /zira/i, /aria/i, /jenny/i, /female/i, /google us english/i]
    : [/daniel/i, /alex/i, /guy/i, /david/i, /male/i, /google uk english male/i];
  return preferred.flatMap((pattern) => voices.filter((voice) => pattern.test(voice.name)))
    .find((voice) => /^en(-|_)/i.test(voice.lang))
    || voices.find((voice) => /^en(-|_)/i.test(voice.lang) && voice.name.toLowerCase() !== (female ? 'daniel' : 'samantha'))
    || voices[0];
}

function isEnglishTranscript(text: string): boolean {
  return !/[\u0900-\u097F]/.test(text)
    && !/\b(?:arey|arre|haan|bhai|yaar|aur batao|batao|aap|kya|kaise|kaisa|hoon|theek)\b/i.test(text);
}

export default function LiveAvatarWorkspace() {
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => {
    return localStorage.getItem('sanctuary_selected_avatar_id') || 'ema';
  });
  const currentAvatar: Avatar = getAvatarById(selectedAvatarId);
  const isAisha = currentAvatar.id === 'ema';

  const [status, setStatus] = useState<CallStatus>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Real-Time Floating Live Subtitles & Captions
  const [liveCaption, setLiveCaption] = useState<{
    speaker: 'you' | 'companion';
    text: string;
    isInterim?: boolean;
  } | null>(null);

  // Avatar Live State & Telemetry
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [activeDirective, setActiveDirective] = useState<AvatarDirective>({
    tone: 'warm',
    expression: 'soft-smile',
    gesture: 'idle',
    emotion: 'warm',
    intensity: 0.6,
  });
  const [liveTelemetry, setLiveTelemetry] = useState<{
    amplitude: number;
    jawOpen: number;
    blink: number;
    audioTime: number;
    audioDuration: number;
    activeViseme: string;
    audioSource: string;
  }>({
    amplitude: 0,
    jawOpen: 0,
    blink: 0,
    audioTime: 0,
    audioDuration: 0,
    activeViseme: 'viseme_sil',
    audioSource: 'idle',
  });
  const [ttsStatus, setTtsStatus] = useState('idle');
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'en-US'>('en-US');

  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const transcribingRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  // SpeechRecognition callbacks can retain an older React closure. Keep the
  // request lock in a ref so one utterance can never create parallel replies.
  const isSendingRef = useRef(false);

  const transcribeRecording = useCallback(async (fallback: string) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return isEnglishTranscript(fallback) ? fallback : '';
    const audioBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(recorderChunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      recorder.stop();
    });
    recorderRef.current = null;
    if (audioBlob.size < 1200) return fallback;
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': audioBlob.type || 'audio/webm' },
        body: audioBlob,
      });
      if (response.ok) {
        const data = await response.json();
        if (typeof data?.text === 'string' && data.text.trim()) {
          const translated = data.text.trim();
          return isEnglishTranscript(translated) ? translated : '';
        }
      }
    } catch (error) {
      console.warn('[SpeechRec] server transcription unavailable:', error);
    }
    return isEnglishTranscript(fallback) ? fallback : '';
  }, []);

  // Fresh mutable refs for async event handlers
  const micOnRef = useRef(micOn);
  const statusRef = useRef(status);
  micOnRef.current = micOn;
  statusRef.current = status;

  // Sync selected avatar on storage changes
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('sanctuary_selected_avatar_id') || 'ema';
      setSelectedAvatarId(saved);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'live') {
      timerRef.current = setInterval(() => setElapsed((v) => v + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatElapsed = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    return audioController.onLifecycle((event) => {
      console.info(`[Ema Audio] ${event}`);
      if (event === 'AUDIO_INTERRUPTED') {
        avatarEngine.clearSpeechTimeline();
        avatarEngine.setState('listening');
      }
      if (event === 'AUDIO_ENDED') {
        avatarEngine.clearSpeechTimeline();
        avatarEngine.setState('idle');
      }
      setTtsStatus(event.toLowerCase());
    });
  }, []);

  // ── Frame Hook from Three.js Renderer ─────────────────────────────────
  const handleFrameUpdate = useCallback((out: AnimationFrameOutput) => {
    setAvatarState(out.state);
    setLiveTelemetry({
      amplitude: out.amplitude,
      jawOpen: Math.round(out.morphs.jawOpen * 100) / 100,
      blink: Math.round((out.morphs.eyeBlinkLeft + out.morphs.eyeBlinkRight) * 50) / 100,
      audioTime: Math.round(audioController.getDebugState().currentTime * 100) / 100,
      audioDuration: Math.round(audioController.getDebugState().duration * 100) / 100,
      activeViseme: out.activeViseme,
      audioSource: audioController.getDebugState().source,
    });
  }, []);

  // ── Local Camera PiP ───────────────────────────────────────────────────
  const startLocalCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStreamRef.current = stream;
      if (selfVideoRef.current) selfVideoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      setCamOn(false);
    }
  }, []);

  const stopLocalCamera = useCallback(() => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  const toggleCamera = () => {
    if (camOn) stopLocalCamera();
    else startLocalCamera();
  };

  const toggleMute = () => {
    setMicOn((prev) => {
      const next = !prev;
      if (!next && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      } else if (next && recognitionRef.current && statusRef.current === 'live') {
        try { recognitionRef.current.start(); } catch {}
      }
      return next;
    });
  };

  // ── Interruption Controller ───────────────────────────────────────────
  const interruptAvatar = useCallback(() => {
    audioController.interrupt();
    avatarEngine.clearSpeechTimeline();
    avatarEngine.setState('interrupted');
    setTimeout(() => {
      avatarEngine.setState('listening');
    }, 400);
  }, []);

  // ── ElevenLabs Audio & Time-Locked Lip Sync ──────────────────────────
  const speakAvatarText = useCallback(
    async (text: string, directive?: AvatarDirective) => {
      if (!text) return;
      const spokenText = text;

      if (directive) {
        setActiveDirective(directive);
        avatarEngine.applyDirective(directive);
      }

      setLiveCaption({ speaker: 'companion', text, isInterim: false });
      setTtsStatus('requesting-elevenlabs');

      try {
        console.info('[LiveAvatar Pipeline] TTS REQUEST', { characters: spokenText.length });
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText,
            avatarId: currentAvatar.id,
            voiceId: currentAvatar.voiceId,
            includeTimestamps: true,
          }),
        });
        if (!ttsRes.ok) throw new Error(`ElevenLabs TTS failed (${ttsRes.status})`);

        const payload = await ttsRes.json() as {
          audioBase64?: string;
          audioMime?: string;
          alignment?: unknown;
        };
        if (!payload.audioBase64) throw new Error('ElevenLabs returned no audio');

        const blob = base64ToAudioBlob(payload.audioBase64, payload.audioMime || 'audio/mpeg');
        const alignment = normalizeAlignment(payload.alignment);
        const fallbackDuration = alignment
          ? Math.max(...alignment.characterEndTimesSeconds, 0.1)
          : Math.max(spokenText.length * 0.065, 1.0);
        const timeline = alignment
          ? createVisemeTimelineFromAlignment(alignment)
          : createVisemeTimeline(spokenText, fallbackDuration);

        avatarEngine.setSpeechTimeline(timeline);
        avatarEngine.setState('speaking');
        setTtsStatus(`elevenlabs-ready${alignment ? '-aligned' : '-fallback-timing'}`);
        const playback = await audioController.playAudioBlob(blob);
        // ElevenLabs audio duration is authoritative. Rebuild the fallback
        // timeline after playback starts so lips stay locked to real audio.
        if (!alignment && playback.duration > 0) {
          avatarEngine.setSpeechTimeline(createVisemeTimeline(spokenText, playback.duration));
        }
      } catch (error) {
        console.warn('[LiveAvatar TTS] ElevenLabs fallback to browser voice synthesis:', error);
        setTtsStatus('browser-speech-fallback');

        // Clean Web Speech Synthesis Fallback (guaranteed audio output)
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(spokenText);
          utterance.lang = isAisha ? 'en-US' : 'en-IN';
          utterance.voice = chooseBrowserVoice(currentAvatar);
          utterance.rate = 0.98;
          utterance.pitch = isAisha ? 1.12 : 0.92;

          const dur = Math.max(spokenText.length * 0.07, 1.2);
          const timeline = createVisemeTimeline(spokenText, dur);
          avatarEngine.setSpeechTimeline(timeline);
          avatarEngine.setState('speaking');
          // Keep the GLB/VRM mouth animation alive even when ElevenLabs is
          // unavailable and browser speech is used as the audio fallback.
          audioController.startSyntheticPlayback(dur, () => {
            avatarEngine.clearSpeechTimeline();
            avatarEngine.setState('idle');
          });

          utterance.onend = () => {
            audioController.interrupt();
            avatarEngine.clearSpeechTimeline();
            avatarEngine.setState('idle');
          };
          utterance.onerror = () => {
            audioController.interrupt();
            avatarEngine.clearSpeechTimeline();
            avatarEngine.setState('idle');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          avatarEngine.clearSpeechTimeline();
          avatarEngine.setState('idle');
        }
      }
    },
    [isAisha, currentAvatar.voiceId],
  );

  // ── Send Message Flow ──────────────────────────────────────────────────
  const handleSendUserMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isSendingRef.current) return;

    // Guard against echo loop (avatar hearing its own TTS playback)
    if (audioController.isPlaying()) {
      console.info('[LiveAvatar] Ignoring input during active avatar speech');
      return;
    }

    // Guard against identical turn submissions fired in quick succession
    const trimmed = userMsg.trim();
    if (
      trimmed.toLowerCase() === lastSentRef.current.text.toLowerCase() &&
      Date.now() - lastSentRef.current.time < 3000
    ) {
      console.info('[LiveAvatar] Ignoring duplicate rapid transcript');
      return;
    }
    lastSentRef.current = { text: trimmed, time: Date.now() };

    console.info('[LiveAvatar Pipeline] USER MESSAGE:', { transcript: trimmed });

    isSendingRef.current = true;
    setIsSending(true);
    avatarEngine.setState('thinking');

    // Display user speech caption immediately
    setLiveCaption({ speaker: 'you', text: trimmed, isInterim: false });

    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: 'you', text: trimmed, timestamp: Date.now() },
    ]);

    let reply: string;
    let directive: AvatarDirective;
    try {
      const res = await fetch('/api/avatar-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: trimmed,
          settings: {
            name: currentAvatar.name,
            language: 'English',
            avatarId: currentAvatar.id,
            personality: currentAvatar.personality,
            voice: currentAvatar.voice,
            accent: currentAvatar.accent,
            systemPrompt: currentAvatar.systemPrompt,
          },
        }),
      });

      const data = await res.json();
      reply = data?.reply?.text || (isAisha
        ? `I hear you, and I'm right here with you! Tell me more.`
        : `I'm listening, my friend. Tell me more about what you're thinking.`);
      directive = safeDirective(data?.reply?.directive, reply);
    } catch {
      reply = isAisha
        ? `I hear you! I'm right here listening with you. What's on your heart right now?`
        : `I'm here with you, brother. Take your time, what's on your mind?`;
      directive = safeDirective({ emotion: 'warm', gesture: 'nod', intensity: 0.7 }, reply);
    }

    setLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-c`,
        role: 'companion',
        text: reply,
        timestamp: Date.now(),
        emotion: directive.emotion,
        gesture: directive.gesture,
      },
    ]);

    try {
      await speakAvatarText(reply, directive);
    } catch {
      setError(`${currentAvatar.name} voice unavailable: check ElevenLabs voice configuration.`);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // ── Start Call Session with short-turn, auto-restarting speech recognition ─
  const startCall = useCallback(async () => {
    setStatus('connecting');
    setError('');
    setLines([]);
    setLiveCaption(null);

    // Non-blocking camera startup
    startLocalCamera().catch(() => {});

    setStatus('live');

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        try {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          micStreamRef.current = null;
        }
        const rec = new SpeechRecognitionClass();
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        // Supports Indian accents, Hindi, and English speech without mangling
        rec.lang = speechLang;

        const restart = (delay = 150) => {
          if (!micOnRef.current || statusRef.current !== 'live') return;
          window.setTimeout(() => {
            if (!micOnRef.current || statusRef.current !== 'live') return;
            try {
              rec.start();
              console.info('[SpeechRec] listening');
            } catch (error) {
              console.debug('[SpeechRec] restart pending', error);
            }
          }, delay);
        };

        rec.onstart = () => {
          console.info('[SpeechRec] microphone capture started');
          if (micStreamRef.current && typeof MediaRecorder !== 'undefined' && !recorderRef.current) {
            const recorder = new MediaRecorder(micStreamRef.current);
            recorderChunksRef.current = [];
            recorder.ondataavailable = (event) => {
              if (event.data.size) recorderChunksRef.current.push(event.data);
            };
            recorder.start();
            recorderRef.current = recorder;
          }
        };

        rec.onresult = (e: any) => {
          if (!micOnRef.current || audioController.isPlaying()) return;
          let interimStr = '';
          let finalStr = '';

          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalStr += transcript;
            } else {
              interimStr += transcript;
            }
          }

          if (interimStr.trim() && !audioController.isPlaying()) {
            avatarEngine.setState('listening');
            // Never expose raw browser recognition text: it can be Hindi or
            // incorrect. The committed line comes from the server transcript.
            setLiveCaption({ speaker: 'you', text: 'Listening…', isInterim: true });
          }

          // Use the browser result only to detect an utterance boundary. The
          // recorded audio is sent to Gemini/Whisper before the turn is sent.
          if (finalStr.trim() && !audioController.isPlaying() && !isSendingRef.current && !transcribingRef.current) {
            const browserTranscript = finalStr.trim();
            transcribingRef.current = true;
            console.info('[SpeechRec] browser boundary detected:', browserTranscript);
            setLiveCaption({ speaker: 'you', text: 'Processing…', isInterim: true });
            // Prefer the accurate server transcript, but never make the user
            // wait for a slow model/network round-trip before replying.
            const browserFallback = isEnglishTranscript(browserTranscript) ? browserTranscript : '';
            const transcriptDeadline = browserFallback ? 700 : 2500;
            const fastTranscript = Promise.race<string>([
              transcribeRecording(browserTranscript),
              new Promise<string>((resolve) => window.setTimeout(() => resolve(browserFallback), transcriptDeadline)),
            ]);
            void fastTranscript.then((transcript) => {
              if (transcript && !audioController.isPlaying()) void handleSendUserMessage(transcript);
            }).finally(() => {
              transcribingRef.current = false;
              restart(150);
            });
          }
        };

        rec.onend = () => {
          console.info('[SpeechRec] turn ended; restarting');
          if (!transcribingRef.current) restart();
        };

        rec.onerror = (e: any) => {
          console.warn('[SpeechRec] recognition error', e?.error || e);
          restart(350);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (recErr) {
        console.warn('[SpeechRec] initialization failed:', recErr);
        setError('Microphone transcription is unavailable in this browser. Please use Chrome on localhost or type your message.');
      }
    } else {
      setError('This browser does not support live microphone transcription. Please use Chrome on localhost or type your message.');
    }

    // Initial Greeting based on selected companion
    const greeting = isAisha
      ? `Hey! I'm Aisha, your caring friend. It's so wonderful to connect with you face to face! How's your day treating you so far?`
      : `Hey there! I am Aryan, your companion and friend. I'm right here with you. How are you feeling today?`;
    const directive = safeDirective({ emotion: 'happy', gesture: 'small-wave', intensity: 0.8 }, greeting);
    setLines([{ id: '1', role: 'companion', text: greeting, timestamp: Date.now(), emotion: 'happy', gesture: 'small-wave' }]);
    await speakAvatarText(greeting, directive);
  }, [currentAvatar.name, isAisha, speakAvatarText, startLocalCamera, transcribeRecording]);

  // ── End Session ───────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    recorderRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    interruptAvatar();
    stopLocalCamera();
    setStatus('ended');
    setLiveCaption(null);
  }, [interruptAvatar, stopLocalCamera]);

  useEffect(() => () => { endCall(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) {
      const msg = draft;
      setDraft('');
      handleSendUserMessage(msg);
    }
  };

  // Quick Emotion / Gesture triggers for interactive exploration
  const triggerQuickAction = (actionText: string, gesture: AvatarGesture, emotion: AvatarEmotion) => {
    avatarEngine.triggerGesture(gesture);
    handleSendUserMessage(actionText);
  };

  return (
    <div className="min-h-[85vh] bg-[#070e17] text-white rounded-3xl border border-white/10 overflow-hidden flex flex-col relative shadow-2xl">
      {/* ── Top Bar / Header ────────────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-white/10 bg-[#0b1626]/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-lg"
            style={{
              background: `${currentAvatar.glowColor}20`,
              borderColor: `${currentAvatar.glowColor}50`,
              color: currentAvatar.glowColor,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-white flex items-center gap-2">
              <span>{currentAvatar.name}</span>
              <span className="text-xs">{currentAvatar.badge}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE 3D VRM
              </span>
            </h2>
            <p className="text-[11px] font-sans text-slate-300">
              {currentAvatar.description}
            </p>
          </div>
        </div>

        {/* Companion Switcher (AISHA vs ARYAN) */}
        <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 p-1 rounded-2xl shadow-inner">
          {AVATARS.map((av) => {
            const isSelected = selectedAvatarId === av.id;
            return (
              <button
                key={av.id}
                onClick={async () => {
                  if (selectedAvatarId === av.id) return;
                  setSelectedAvatarId(av.id);
                  localStorage.setItem('sanctuary_selected_avatar_id', av.id);
                  window.dispatchEvent(new Event('storage'));
                  if (status === 'live') {
                    interruptAvatar();
                    const greeting = av.id === 'ema'
                      ? `Hey! I'm Aisha, your caring friend. It's so wonderful to connect with you face to face! How's your day treating you so far?`
                      : `Hey there! I am Aryan, your companion and friend. I'm right here with you. How are you feeling today?`;
                    const dir = safeDirective({ emotion: 'happy', gesture: 'small-wave', intensity: 0.8 }, greeting);
                    setLines([{ id: `${Date.now()}-c`, role: 'companion', text: greeting, timestamp: Date.now(), emotion: 'happy', gesture: 'small-wave' }]);
                    void speakAvatarText(greeting, dir);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 shadow-md border'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                style={isSelected ? { color: av.glowColor, borderColor: `${av.glowColor}60` } : {}}
              >
                <span>{av.name}</span>
                <span className="text-xs">{av.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Call Status, Language Toggle & Timer Badge */}
        {status === 'live' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const next = speechLang === 'en-IN' ? 'en-US' : 'en-IN';
                setSpeechLang(next);
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.lang = next;
                  } catch {}
                }
              }}
              title="Click to toggle English input mode"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/15 text-[11px] font-mono font-semibold text-cyan-300 transition-all cursor-pointer shadow-sm"
            >
              <span>🌐</span>
              <span>{speechLang === 'en-IN' ? 'English (India)' : 'English (US)'}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{formatElapsed(elapsed)}</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Initial Idle Screen ─────────────────────────────────────────── */}
      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-lg mx-auto z-10">
          <div
            className="w-28 h-28 rounded-3xl overflow-hidden border-2 shadow-2xl p-1 relative group"
            style={{ borderColor: currentAvatar.glowColor }}
          >
            <img
              src={currentAvatar.profileImage || currentAvatar.image}
              alt={currentAvatar.name}
              className="w-full h-full object-cover rounded-2xl"
            />
            <div
              className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
              style={{ background: currentAvatar.glowColor }}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-white">
              Connect Face-to-Face with {currentAvatar.name}
            </h3>
            <p className="text-xs font-sans text-slate-300 leading-relaxed max-w-md">
              Real-time conversational 3D VRM engine with natural speech lip-sync,
              expressive gestures, and continuous microphone listening.
            </p>
          </div>

          <button
            onClick={startCall}
            className="px-8 py-4 rounded-2xl text-slate-950 font-serif text-sm font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-xl flex items-center gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${currentAvatar.glowColor}, #ffffff)`,
              boxShadow: `0 0 30px ${currentAvatar.glowColor}40`,
            }}
          >
            <Sparkles size={18} />
            <span>Enter Live 3D Session</span>
          </button>
        </div>
      )}

      {/* ── Connecting Screen ───────────────────────────────────────────── */}
      {status === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
          <div
            className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: currentAvatar.glowColor, borderTopColor: 'transparent' }}
          />
          <p
            className="text-xs font-mono font-bold uppercase tracking-widest animate-pulse"
            style={{ color: currentAvatar.glowColor }}
          >
            Initializing 3D Rig & Audio Pipeline for {currentAvatar.name}…
          </p>
        </div>
      )}

      {/* ── Error Screen ───────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto z-10">
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-100 text-xs space-y-3 text-left">
            <div className="font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} /> Connection Notice
            </div>
            <p className="leading-relaxed opacity-90">{error}</p>
          </div>
          <button
            onClick={startCall}
            className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Try Reconnecting
          </button>
        </div>
      )}

      {/* ── Ended Screen ───────────────────────────────────────────────── */}
      {status === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
          <h2 className="font-serif text-2xl font-bold text-white">Call Ended</h2>
          <p className="text-xs font-sans text-slate-300 max-w-sm">
            Thank you for spending time with {currentAvatar.name}. Take care of yourself.
          </p>
          <button
            onClick={startCall}
            className="px-6 py-3 rounded-xl text-slate-950 font-serif text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-105"
            style={{ background: currentAvatar.glowColor }}
          >
            Start New Session
          </button>
        </div>
      )}

      {/* ── Live 3D Video Stage & Controls ─────────────────────────────── */}
      {status === 'live' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative overflow-hidden">
          {/* Main 3D Avatar Stage */}
          <div className="lg:col-span-8 bg-[#040811] relative flex items-center justify-center min-h-[480px] overflow-hidden">
            {/* Real-Time Three.js Humanoid Avatar Rig */}
            <div className="absolute inset-0">
              <AvatarModelStage
                avatarId={selectedAvatarId}
                directive={activeDirective}
                state={avatarState}
                onFrameUpdate={handleFrameUpdate}
                className="w-full h-full"
              />
            </div>

            {/* Top Right: Instant Interruption Trigger */}
            {avatarState === 'speaking' && (
              <button
                onClick={interruptAvatar}
                className="absolute top-4 right-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 z-20 cursor-pointer shadow-lg backdrop-blur-md"
                title="Interrupt Avatar Speech"
              >
                <ZapOff size={13} /> Interrupt
              </button>
            )}

            {/* User Camera PiP */}
            <div className="absolute bottom-28 right-4 w-36 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-stone-900 z-20">
              {camOn ? (
                <video
                  ref={selfVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-400">
                  Camera Off
                </div>
              )}
            </div>

            {/* ── High-Visibility Floating Live Subtitles HUD (Always Visible on 3D Stage) ── */}
            {liveCaption && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-[92%] bg-black/85 backdrop-blur-xl border border-white/20 p-3.5 rounded-2xl shadow-2xl z-30 transition-all text-center animate-fade-in pointer-events-none">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ background: liveCaption.speaker === 'you' ? '#38bdf8' : currentAvatar.glowColor }}
                  />
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: liveCaption.speaker === 'you' ? '#38bdf8' : currentAvatar.glowColor }}
                  >
                    {liveCaption.speaker === 'you' ? '🎙️ You (Speaking)' : `✨ ${currentAvatar.name} (Live)`}
                  </span>
                </div>
                <p className="text-sm font-sans font-medium text-white leading-relaxed">
                  {liveCaption.text}
                  {liveCaption.isInterim && <span className="opacity-50 animate-pulse">…</span>}
                </p>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl z-20">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  micOn
                    ? 'bg-stone-800 text-white hover:bg-stone-700'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  camOn
                    ? 'bg-stone-800 text-white hover:bg-stone-700'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {camOn ? <Camera size={18} /> : <CameraOff size={18} />}
              </button>

              <button
                onClick={endCall}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <PhoneOff size={16} /> End
              </button>
            </div>
          </div>

          {/* Right Side Transcript Panel */}
          <div className="lg:col-span-4 border-l border-white/10 bg-[#09121f] flex flex-col h-[75vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <MessageSquareText size={16} /> Live Transcript
              </span>
              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <MicIcon size={12} className={micOn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                {micOn ? 'LISTENING' : 'MUTED'}
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`p-3.5 rounded-2xl max-w-[88%] shadow-md ${
                    l.role === 'you'
                      ? 'ml-auto bg-white/10 text-white border border-white/15'
                      : 'mr-auto bg-[#0f1d33] text-slate-200 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="block text-[9px] font-mono font-bold uppercase tracking-widest"
                      style={{
                        color: l.role === 'you' ? '#ffffff' : currentAvatar.glowColor,
                      }}
                    >
                      {l.role === 'you' ? 'You' : currentAvatar.name}
                    </span>
                    {l.emotion && (
                      <span className="text-[8px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {l.emotion}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{l.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleFormSubmit}
              className="p-3 border-t border-white/10 bg-[#0b1626] flex gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Speak or type to ${currentAvatar.name}…`}
                className="flex-1 bg-stone-900/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending}
                className="px-3.5 py-2 rounded-xl text-slate-950 font-bold disabled:opacity-40 transition-all cursor-pointer shadow-md"
                style={{ background: currentAvatar.glowColor }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
