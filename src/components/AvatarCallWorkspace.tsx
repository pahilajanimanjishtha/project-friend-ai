import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot, Camera, CameraOff, Captions, CircleHelp, Expand,
  ExternalLink, MessageSquareText, Mic, MicOff, PhoneOff,
  Settings2, Sparkles, Volume2, VolumeX, X, AlertTriangle, Phone,
} from 'lucide-react';
import AvatarModelStage from './AvatarModelStage';
import { CallTurn, fallbackDirective, safeDirective } from '../lib/avatarCall';
import { CRISIS_HELPLINES, type Helpline } from '../lib/crisisSafetyFilter';

// ── Types ────────────────────────────────────────────────────────────────────
type Settings = {
  appearance: string;
  voice: 'feminine' | 'masculine' | 'neutral';
  accent: string;
  language: string;
  personality: string;
};

// ── Constants ────────────────────────────────────────────────────────────────
const STARTER_TURN: CallTurn = {
  role: 'assistant',
  text: "Hi, I'm Nova! I'm here as your warm and friendly companion. How are you feeling today?",
  timestamp: new Date().toISOString(),
  directive: { tone: 'warm', expression: 'soft-smile', gesture: 'nod' },
};

const INITIAL_SETTINGS: Settings = {
  appearance: 'Nova · calm blue',
  voice: 'feminine',
  accent: 'Indian English',
  language: 'English (India)',
  personality: 'Warm, friendly, and supportive everyday companion',
};

/** Format seconds as MM:SS */
function formatDuration(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AvatarCallWorkspace() {
  // ─── Call State ──────────────────────────────────────────────────────
  const [turns, setTurns] = useState<CallTurn[]>([STARTER_TURN]);
  const [draft, setDraft] = useState('');
  const [caption, setCaption] = useState('Ready when you are.');
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  // ─── Media State ─────────────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [amplitude, setAmplitude] = useState(0.03);
  const [cameraOn, setCameraOn] = useState(false);

  // ─── UI State ────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [panel, setPanel] = useState<'transcript' | 'tools'>('transcript');
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);

  // ─── Refs ────────────────────────────────────────────────────────────
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // ─── Derived ─────────────────────────────────────────────────────────
  const activeDirective = turns[turns.length - 1]?.directive || STARTER_TURN.directive!;
  const userTurns = turns.filter((t) => t.role === 'user');

  // ─── Timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // ─── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    cancelAnimationFrame(animationRef.current || 0);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  // ─── Auto-scroll transcript ──────────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // ─── Audio amplitude reader (drives mouth morph) ─────────────────────
  const readAmplitude = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const rms = Math.sqrt(
      data.reduce((sum, s) => sum + Math.pow((s - 128) / 128, 2), 0) / data.length
    );
    setAmplitude(Math.min(0.75, rms * 3));
    animationRef.current = requestAnimationFrame(readAmplitude);
  }, []);

  // ─── Camera PiP ──────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      cameraStreamRef.current = stream;
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch {
      setCaption('Camera access was blocked. You can still use the call without video.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera();
    else startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  // ─── Microphone ──────────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = navigator.language || 'en-US';
          rec.onresult = (event: any) => {
            let finalStr = '';
            let interimStr = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript;
              } else {
                interimStr += event.results[i][0].transcript;
              }
            }
            const recognized = finalStr || interimStr;
            if (recognized) {
              setDraft((prev) => (prev ? `${prev} ${recognized.trim()}` : recognized.trim()));
              setCaption(`Listening: "${recognized.trim()}"`);
            }
          };
          rec.onerror = (err: any) => {
            console.warn('Speech recognition notice:', err.error);
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn('Web Speech API setup notice:', e);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (!blob.size) return;
        setCaption('Processing audio…');
        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': blob.type },
            body: blob,
          });
          const data = await res.json();
          if (res.ok && data.text) {
            setDraft((prev) => (prev ? `${prev} ${data.text}` : data.text));
            setCaption(data.text);
          }
        } catch {
          // If server-side transcribe is offline, browser Web Speech API already captured the text!
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      readAmplitude();
    } catch {
      setCaption('Microphone access was blocked. You can still type your message.');
    }
  }, [readAmplitude]);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setRecording(false);
    setAmplitude(0.03);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    micStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setMuted(next);
  }, [muted]);

  // ─── TTS (Browser Speech or Audio URL) ───────────────────────────────
  const speak = useCallback((text: string, audioUrl?: string) => {
    window.speechSynthesis?.cancel();
    setSpeaking(true);

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      ctx.createMediaElementSource(audio).connect(analyser).connect(ctx.destination);
      analyserRef.current = analyser;
      audio.onended = () => { setSpeaking(false); setAmplitude(0.03); };
      void audio.play().then(readAmplitude);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.language === 'Hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.96;
    utterance.onboundary = () => setAmplitude(0.2 + Math.random() * 0.28);
    utterance.onend = () => { setSpeaking(false); setAmplitude(0.03); };
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis?.speak(utterance);
  }, [settings.language, readAmplitude]);

  // ─── Send Message ────────────────────────────────────────────────────
  const send = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;

    const userTurn: CallTurn = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, userTurn]);
    setDraft('');
    setCaption(text);
    setLoading(true);

    try {
      const res = await fetch('/api/avatar-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: text,
          settings,
        }),
      });

      if (!res.ok) throw new Error('Conversation service unavailable');
      const data = await res.json();

      // Crisis detection — show emergency modal
      if (data.reply?.isCrisis) {
        setCrisisModalOpen(true);
      }

      const assistantTurn: CallTurn = {
        role: 'assistant',
        text: data.reply.text,
        timestamp: new Date().toISOString(),
        directive: safeDirective(data.reply.directive, data.reply.text),
      };
      setTurns((prev) => [...prev, assistantTurn]);
      setCaption(assistantTurn.text);
      speak(assistantTurn.text, data.reply.audioUrl);
    } catch {
      const reply = "I'm still with you. The secure conversation service is unavailable right now, so let's take this one thought at a time—what feels most important about that?";
      const assistantTurn: CallTurn = {
        role: 'assistant',
        text: reply,
        timestamp: new Date().toISOString(),
        directive: fallbackDirective(reply),
      };
      setTurns((prev) => [...prev, assistantTurn]);
      setCaption(reply);
      speak(reply);
    } finally {
      setLoading(false);
    }
  }, [draft, loading, settings, speak]);

  // ─── End Call ────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    stopMic();
    stopCamera();
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setSpeaking(false);
  }, [stopMic, stopCamera]);

  // ─── Status line ─────────────────────────────────────────────────────
  const status = useMemo(() => {
    if (recording) return muted ? 'Mic muted' : 'Listening';
    if (speaking) return 'Nova is speaking';
    return 'Call in progress';
  }, [recording, muted, speaking]);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-6 sm:py-6 text-slate-100">
      <div className="min-h-[calc(100vh-9rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1122] shadow-2xl shadow-black/40">

        {/* ─── Header Bar ─────────────────────────────────────────────── */}
        <header className="flex min-h-16 items-center justify-between border-b border-white/10 bg-[#10172d]/90 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-cyan-300 text-slate-950">
              <Bot size={19} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                Nova · Companion call
              </h1>
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Private session · {formatDuration(elapsed)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              aria-label="Open call settings"
            >
              <Settings2 size={18} />
            </button>
            <button
              className="hidden rounded-lg p-2 text-slate-300 hover:bg-white/10 sm:block"
              aria-label="Expand call"
            >
              <Expand size={18} />
            </button>
          </div>
        </header>

        {/* ─── Main Grid ──────────────────────────────────────────────── */}
        <div className="grid min-h-[calc(100vh-13rem)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ─── Video Area (Google Meet-style) ───────────────────────── */}
          <main className="flex min-h-[610px] flex-col p-3 sm:p-5">

            {/* Avatar video stage */}
            <div className="relative flex min-h-[430px] flex-1 items-end justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_22%,#394f98_0%,#182550_33%,#0b1023_73%)]">
              {/* Dot grid overlay */}
              <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#a9d3ff_1px,transparent_1px)] [background-size:28px_28px]" />

              {/* 3D Avatar */}
              <AvatarModelStage
                directive={activeDirective}
                amplitude={speaking ? amplitude : recording && !muted ? amplitude : 0.025}
              />

              {/* Status badge (top-left) */}
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs backdrop-blur">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {status}
              </div>

              {/* Tone badge (top-right) */}
              <div className="absolute right-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[.16em] text-cyan-200">
                {activeDirective.tone}
              </div>

              {/* Live captions (bottom overlay, Google Meet-style) */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 backdrop-blur-md sm:left-6 sm:right-auto sm:max-w-md">
                <p className="text-xs leading-relaxed text-slate-100">
                  <Captions className="mr-2 inline h-3.5 w-3.5 text-cyan-300" />
                  {caption}
                </p>
              </div>

              {/* ─── User Camera PiP (bottom-right, Google Meet-style) ─── */}
              <div className={`absolute bottom-4 right-4 overflow-hidden rounded-2xl border-2 shadow-xl transition-all duration-300 ${
                cameraOn
                  ? 'h-[140px] w-[190px] border-cyan-300/50 bg-slate-950'
                  : 'h-[100px] w-[140px] border-white/10 bg-slate-950/70'
              }`}>
                {cameraOn ? (
                  <video
                    ref={pipVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500">
                    <CameraOff size={22} />
                    <span className="text-[9px] font-medium uppercase tracking-wider">Camera off</span>
                  </div>
                )}
                {/* User name tag */}
                <div className="absolute bottom-1.5 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                  You
                </div>
              </div>
            </div>

            {/* ─── Message Input ──────────────────────────────────────── */}
            <form onSubmit={send} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="call-message">Message Nova</label>
              <input
                id="call-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message to Nova…"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
              />
              <button
                disabled={!draft.trim() || loading}
                className="rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Thinking…' : 'Send'}
              </button>
            </form>

            {/* ─── Control Bar (Google Meet-style) ────────────────────── */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {/* Mic toggle */}
              <button
                onClick={recording ? stopMic : startMic}
                className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                  recording
                    ? 'border-red-400 bg-red-500 text-white'
                    : 'border-white/15 bg-white/10 hover:bg-white/20'
                }`}
                aria-label={recording ? 'Stop recording' : 'Start microphone capture'}
              >
                <Mic size={20} />
              </button>

              {/* Mute toggle */}
              <button
                disabled={!recording}
                onClick={toggleMute}
                className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20 disabled:opacity-40"
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Camera toggle */}
              <button
                onClick={toggleCamera}
                className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                  cameraOn
                    ? 'border-cyan-300/50 bg-cyan-300/20 text-cyan-200'
                    : 'border-white/15 bg-white/10 hover:bg-white/20'
                }`}
                aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>

              {/* Speaker mute */}
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  audioRef.current?.pause();
                  setSpeaking(false);
                }}
                className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                aria-label="Mute avatar audio"
              >
                {speaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {/* End call */}
              <button
                onClick={endCall}
                className="ml-2 flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                <PhoneOff size={18} />
                Leave
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-500">
              Your microphone stays in this browser until you choose a transcription provider.
              Live captions use your selected transcription path.
            </p>
          </main>

          {/* ─── Sidebar (Transcript / Tools) ─────────────────────────── */}
          <aside className="border-t border-white/10 bg-[#0a0f20] xl:border-l xl:border-t-0">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setPanel('transcript')}
                className={`flex-1 px-4 py-4 text-xs font-semibold ${
                  panel === 'transcript' ? 'border-b-2 border-cyan-300 text-cyan-200' : 'text-slate-400'
                }`}
              >
                <MessageSquareText className="mr-2 inline h-4 w-4" />
                Transcript
              </button>
              <button
                onClick={() => setPanel('tools')}
                className={`flex-1 px-4 py-4 text-xs font-semibold ${
                  panel === 'tools' ? 'border-b-2 border-cyan-300 text-cyan-200' : 'text-slate-400'
                }`}
              >
                <CircleHelp className="mr-2 inline h-4 w-4" />
                API & tools
              </button>
            </div>

            {panel === 'transcript' ? (
              <div className="max-h-[660px] space-y-4 overflow-y-auto p-4" aria-live="polite">
                {turns.map((turn, i) => (
                  <article
                    key={`${turn.timestamp}-${i}`}
                    className={`rounded-2xl p-3 ${
                      turn.role === 'user' ? 'ml-7 bg-cyan-300/10' : 'mr-3 bg-white/5'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                      <span>{turn.role === 'user' ? 'You' : 'Nova'}</span>
                      <span>
                        {new Date(turn.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">{turn.text}</p>
                  </article>
                ))}
                <div
                  ref={transcriptEndRef}
                  className="rounded-xl border border-dashed border-white/10 p-3 text-[10px] leading-relaxed text-slate-500"
                >
                  {userTurns.length
                    ? `${userTurns.length} spoken or typed turns in this local view.`
                    : 'Your call transcript will appear here.'}
                </div>
              </div>
            ) : (
              <ToolReference />
            )}
          </aside>
        </div>
      </div>

      {/* ─── Settings Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            close={() => setSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Crisis Emergency Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {crisisModalOpen && (
          <CrisisModal close={() => setCrisisModalOpen(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Crisis Emergency Modal ───────────────────────────────────────────────────
function CrisisModal({ close }: { close: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
    >
      <motion.div
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        className="w-full max-w-lg rounded-3xl border-2 border-red-400/40 bg-gradient-to-b from-[#1a0a0a] to-[#11182e] p-6 shadow-2xl shadow-red-500/10"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-500/20 text-red-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2
                id="crisis-modal-title"
                className="text-lg font-semibold text-red-300"
              >
                You're not alone
              </h2>
              <p className="text-xs text-red-200/60">
                Free, confidential help is available right now.
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
            aria-label="Close crisis help"
          >
            <X size={18} />
          </button>
        </div>

        {/* Helplines */}
        <div className="space-y-3">
          {CRISIS_HELPLINES.map((line: Helpline) => (
            <div
              key={`${line.region}-${line.name}`}
              className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {line.region}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {line.name}
                  </p>
                </div>
                <a
                  href={`tel:${line.number.replace(/\s/g, '')}`}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                >
                  <Phone size={12} />
                  {line.number}
                </a>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {line.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
          Nova is an AI companion, not a licensed therapist. In a crisis, always
          speak to a trained human professional.
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Settings Panel Modal ─────────────────────────────────────────────────────
function SettingsPanel({
  settings,
  setSettings,
  close,
}: {
  settings: Settings;
  setSettings: (v: Settings) => void;
  close: () => void;
}) {
  const update = (key: keyof Settings, value: string) =>
    setSettings({ ...settings, [key]: value });

  const fields = [
    ['appearance', 'Avatar appearance', ['Nova · calm blue', 'Mira · warm rose', 'Ari · neutral slate']],
    ['voice', 'Voice gender', ['feminine', 'masculine', 'neutral']],
    ['accent', 'Voice accent', ['Indian English', 'US English', 'British English']],
    ['language', 'Conversation language', ['English (India)', 'English (US)', 'Hindi']],
    ['personality', 'Conversation personality', ['Grounded and gently direct', 'Warm and encouraging', 'Reflective and curious']],
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-settings-title"
    >
      <motion.div
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#11182e] p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="call-settings-title" className="font-semibold">
              Call settings
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Preferences apply to this browser session.
            </p>
          </div>
          <button onClick={close} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label, choices]) => (
            <label key={key} className="text-xs font-medium text-slate-300">
              {label}
              <select
                value={settings[key]}
                onChange={(e) => update(key, e.target.value)}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/60"
              >
                {choices.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <button
          onClick={close}
          className="mt-6 w-full rounded-xl bg-cyan-300 py-3 text-sm font-semibold text-slate-950"
        >
          Save settings
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Tool Reference Panel ─────────────────────────────────────────────────────
function ToolReference() {
  const tools = [
    ['Coqui TTS', 'Self-hosted TTS; infrastructure-priced.'],
    ['Whisper', 'Speech-to-text; use a server upload or live transcription gateway.'],
    ['Rhubarb', 'Offline phoneme cue generation for pre-rendered audio.'],
    ['Three.js', 'Browser GLB rendering and morph-target animation.'],
    ['ElevenLabs', 'Hosted expressive TTS; plans start at $6/month.'],
    ['Azure TTS', 'Neural TTS billed by characters; 0.5M characters/month free on F0.'],
    ['OpenAI', 'GPT-Transcribe is $0.0045/min; GPT-Live-Transcribe is $0.017/min.'],
  ];

  return (
    <div className="space-y-4 p-4 text-xs text-slate-300">
      <div>
        <p className="font-semibold text-white">Production audio stack</p>
        <p className="mt-1 leading-relaxed text-slate-400">
          Keep provider keys on the server. Browser capture feeds a signed upload
          or realtime gateway; streamed TTS audio drives the analyser-backed mouth
          morph.
        </p>
      </div>
      <div className="grid gap-2">
        {tools.map(([name, detail]) => (
          <div key={name} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
            <span className="font-semibold text-cyan-200">{name}</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{detail}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 leading-relaxed text-amber-100/75">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        Estimated monthly scenarios, before model/chat costs: 100 hours via
        OpenAI GPT-Transcribe ≈ $27; 100 hours live transcription ≈ $102;
        Azure&apos;s first 5 transcription hours and 0.5M neural-TTS characters
        may be free. Verify provider/region pricing before launch.
      </div>
      <a
        className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100"
        href="https://openai.com/api/pricing/"
        target="_blank"
        rel="noreferrer"
      >
        OpenAI pricing <ExternalLink size={12} />
      </a>
      <p className="text-[10px] text-slate-500">
        Pricing verified 13 Aug 2026 from public provider pages; usage, region,
        voice tier, and taxes can change.
      </p>
    </div>
  );
}
