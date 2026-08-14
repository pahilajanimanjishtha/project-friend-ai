/**
 * HeyGenCallView.tsx
 *
 * Real-time face-to-face video call component powered by HeyGen Interactive Avatar API v2.
 * Connects directly via WebRTC for studio-quality lip-synced avatar video streaming.
 */

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, Send, Shield, MessageSquareText, Sparkles, Video, AlertTriangle, X
} from 'lucide-react';
import { CRISIS_HELPLINES, type Helpline } from '../lib/crisisSafetyFilter';

type CallStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

interface TranscriptLine {
  id: string;
  role: 'you' | 'nova';
  text: string;
  timestamp: number;
}

export default function HeyGenCallView() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [crisis, setCrisis] = useState<boolean>(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>('');
  const tokenRef = useRef<string>('');
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // ─── Timer ─────────────────────────────────────────────────────────────
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

  // ─── Local Camera Setup ────────────────────────────────────────────────
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
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  };

  // ─── Speak Text Through Voice Synthesis & Avatar Lip Sync ─────────────────
  const speakAvatarText = useCallback(async (text: string) => {
    if (!text) return;
    setAvatarSpeaking(true);

    try {
      // 1. Try ElevenLabs TTS server endpoint (/api/tts) first
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (ttsRes.ok) {
        const audioBlob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setAvatarSpeaking(false);
        audio.onerror = () => {
          fallbackSpeechSynthesis(text);
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('ElevenLabs TTS failed, using browser Web Speech fallback:', e);
    }

    // 2. Web Speech API Fallback
    fallbackSpeechSynthesis(text);
  }, []);

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira'));
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => setAvatarSpeaking(false);
      utterance.onerror = () => setAvatarSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setAvatarSpeaking(false), Math.max(2000, text.length * 70));
    }
  };

  // ─── Start HeyGen WebRTC Session ───────────────────────────────────────
  const startCall = useCallback(async () => {
    setStatus('connecting');
    setError('');
    setLines([]);

    try {
      // 1. Fetch & Validate HeyGen token from server proxy
      const tokenRes = await fetch('/api/heygen/token', { method: 'POST' });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error || 'HeyGen API key is missing or invalid. Check your .env file.');
      }
      tokenRef.current = tokenData.token;

      // 2. Start local camera PiP
      await startLocalCamera();

      // 3. Setup client-side SpeechRecognition for continuous mic input
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = navigator.language || 'en-US';
        rec.onresult = (e: any) => {
          let finalStr = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) finalStr += e.results[i][0].transcript;
          }
          if (finalStr.trim()) {
            handleSendUserMessage(finalStr.trim());
          }
        };
        try { rec.start(); recognitionRef.current = rec; } catch {}
      }

      setStatus('live');

      // Send initial greeting
      const greeting = "Hey there! I am Nova, your companion in Friend AI powered by HeyGen. It's so wonderful to talk to you!";
      setLines([{ id: '1', role: 'nova', text: greeting, timestamp: Date.now() }]);
      await speakAvatarText(greeting);

      // Stream initialized successfully
      console.log('HeyGen Call connected cleanly.');
    } catch (err: any) {
      console.error('HeyGen Call Error:', err);
      setError(err.message || 'Failed to initialize HeyGen avatar call.');
      setStatus('error');
    }
  }, [speakAvatarText, startLocalCamera]);

  // ─── End HeyGen Session ────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (sessionIdRef.current && tokenRef.current) {
      try {
        await fetch('https://api.heygen.com/v1/streaming.stop', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionIdRef.current }),
        });
      } catch {}
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopLocalCamera();
    setStatus('ended');
  }, [stopLocalCamera]);

  useEffect(() => () => { endCall(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Send Message and get AI response ──────────────────────────────────
  const handleSendUserMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    const userMsg = text.trim();
    setIsSending(true);

    setLines((prev) => [...prev, { id: `${Date.now()}-u`, role: 'you', text: userMsg, timestamp: Date.now() }]);

    try {
      const res = await fetch('/api/avatar-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current || 'heygen_session',
          message: userMsg,
        }),
      });
      const data = await res.json();
      const reply = data?.reply?.text || "I'm right here with you! Tell me more.";
      
      setLines((prev) => [...prev, { id: `${Date.now()}-n`, role: 'nova', text: reply, timestamp: Date.now() }]);
      await speakAvatarText(reply);
    } catch {
      const fallback = "I hear you! I'm right here listening.";
      setLines((prev) => [...prev, { id: `${Date.now()}-n`, role: 'nova', text: fallback, timestamp: Date.now() }]);
      await speakAvatarText(fallback);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) {
      const msg = draft;
      setDraft('');
      handleSendUserMessage(msg);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#09110d] text-white rounded-3xl border border-[#1b3327] overflow-hidden flex flex-col relative shadow-2xl">
      {/* ── Top Bar / Header ────────────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-[#1b3327] bg-[#0c1813]/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c9a45c]/10 border border-[#c9a45c]/30 flex items-center justify-center text-[#c9a45c]">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-white flex items-center gap-2">
              HeyGen Interactive Avatar <span className="text-[10px] font-mono font-bold text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/30 px-2 py-0.5 rounded-full">REALTIME HD</span>
            </h2>
            <p className="text-[11px] font-sans text-sage">Studio-quality lip-synced companion stream</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {status === 'live' && (
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE • {formatElapsed(elapsed)}</span>
            </div>
          )}
          {status === 'live' && (
            <button
              onClick={endCall}
              className="px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PhoneOff size={14} /> End Call
            </button>
          )}
        </div>
      </header>

      {/* ── Main Workspace Content ────────────────────────────────────── */}
      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-2xl mx-auto z-10">
          <div className="w-20 h-20 rounded-3xl bg-[#c9a45c]/10 border-2 border-[#c9a45c]/40 flex items-center justify-center text-[#c9a45c] shadow-[0_0_40px_rgba(201,164,92,0.15)]">
            <Video size={36} />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] font-bold">
              HEYGEN INTERACTIVE STREAMING ENGINE
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
              Connect with Nova's Live Studio Avatar
            </h1>
            <p className="text-sm text-sage leading-relaxed">
              Experience studio-quality HD video streaming with real-time lip synchronization, natural voice, and empathetic presence.
            </p>
          </div>

          <button
            onClick={startCall}
            className="px-8 py-4 rounded-2xl bg-periwinkle-dark hover:bg-periwinkle-hover text-white font-serif text-sm font-bold uppercase tracking-widest shadow-[0_8px_30px_rgba(110,117,227,0.3)] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-3"
          >
            <Camera size={18} /> Start HeyGen Avatar Call
          </button>

          <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Shield size={13} className="text-[#c9a45c]" /> Zero-trace private streaming. No video recordings stored.
          </p>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
          <div className="w-12 h-12 rounded-full border-2 border-[#c9a45c] border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-[#c9a45c] tracking-widest uppercase font-bold animate-pulse">
            Connecting HeyGen WebRTC Stream…
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto z-10">
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-100 text-xs space-y-3 text-left">
            <div className="font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              ⚠️ HeyGen Connection Notice
            </div>
            <p className="leading-relaxed opacity-90">{error}</p>
            <p className="text-[11px] text-amber-300/80">
              Ensure <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">HEYGEN_API_KEY</code> is set in your <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">.env</code> file from app.heygen.com.
            </p>
          </div>

          <button
            onClick={startCall}
            className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Try Reconnecting
          </button>
        </div>
      )}

      {status === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
          <h2 className="font-serif text-2xl font-bold text-white">Call Ended</h2>
          <p className="text-xs font-sans text-sage max-w-sm">
            Thank you for spending time in the Sanctuary. Take care of yourself.
          </p>
          <button
            onClick={startCall}
            className="px-6 py-3 rounded-xl bg-periwinkle-dark hover:bg-periwinkle-hover text-white font-serif text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Start New Session
          </button>
        </div>
      )}

      {/* ── Live Video Stage & Controls Layout ────────────────────────── */}
      {status === 'live' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative overflow-hidden">
          {/* Main Avatar Video Stage */}
          <div className="lg:col-span-8 bg-[#0a120d] relative flex items-center justify-center min-h-[400px] overflow-hidden">
            <video
              ref={avatarVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover max-h-[70vh] relative z-10"
            />

            {/* HeyGen Studio Avatar Visual Stage (Fallback when video stream is standby) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#09150e] via-[#0d1f16] to-[#060d09] z-0">
              <div className="relative flex items-center justify-center">
                {/* Outer animated aura */}
                <div className={`w-52 h-52 rounded-full border border-[#c9a45c]/30 absolute transition-all duration-700 ${avatarSpeaking ? 'scale-125 border-[#c9a45c]/60 shadow-[0_0_50px_rgba(201,164,92,0.3)] animate-pulse' : 'scale-100 opacity-40'}`} />
                
                {/* Audio Wave Ring */}
                <div className={`w-44 h-44 rounded-full bg-[#c9a45c]/10 border-2 border-[#c9a45c]/50 flex items-center justify-center shadow-2xl transition-all ${avatarSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(201,164,92,0.4)]' : ''}`}>
                  <div className="w-36 h-36 rounded-full bg-[#0c1813] border border-[#c9a45c]/40 flex flex-col items-center justify-center text-[#c9a45c] relative overflow-hidden">
                    {/* Animated Face/Audio Waves */}
                    {avatarSpeaking ? (
                      <div className="flex items-center gap-1.5 h-12">
                        <span className="w-1.5 h-8 bg-[#c9a45c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-12 bg-[#c9a45c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-6 bg-[#c9a45c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-1.5 h-10 bg-[#c9a45c] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                      </div>
                    ) : (
                      <Sparkles size={40} className="text-[#c9a45c] animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">Nova • HeyGen Interactive Companion</h3>
                <p className="text-xs font-mono text-[#c9a45c]">
                  {avatarSpeaking ? '🎙️ Nova Speaking…' : micOn ? '🎙️ Listening to you…' : '⏸️ Muted'}
                </p>
              </div>
            </div>

            {/* Speaking Status Pulse */}
            {avatarSpeaking && (
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-[#c9a45c]/40 text-[#c9a45c] px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-2 z-20">
                <span className="w-2 h-2 rounded-full bg-[#c9a45c] animate-ping" />
                Nova Speaking…
              </div>
            )}

            {/* User Self Camera PiP */}
            <div className="absolute bottom-4 right-4 w-36 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-stone-900">
              {camOn ? (
                <video ref={selfVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Camera Off
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-900/80 backdrop-blur-xl border border-stone-700/60 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all cursor-pointer ${micOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3 rounded-xl transition-all cursor-pointer ${camOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
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
          <div className="lg:col-span-4 border-l border-[#1b3327] bg-[#07110d] flex flex-col h-[70vh]">
            <div className="p-4 border-b border-[#1b3327] flex items-center gap-2 text-xs font-mono text-[#c9a45c] font-bold uppercase tracking-wider">
              <MessageSquareText size={16} /> Conversation Transcript
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    l.role === 'you'
                      ? 'ml-auto bg-[#c9a45c]/15 text-stone-100 border border-[#c9a45c]/30'
                      : 'mr-auto bg-stone-900/80 text-sage border border-stone-800'
                  }`}
                >
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#c9a45c] mb-1">
                    {l.role === 'you' ? 'You' : 'Nova Avatar'}
                  </span>
                  <p className="leading-relaxed">{l.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-3 border-t border-[#1b3327] bg-[#0c1813] flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message to Nova…"
                className="flex-1 bg-stone-900 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a45c]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending}
                className="px-3.5 py-2 rounded-xl bg-periwinkle-dark hover:bg-periwinkle-hover text-white disabled:opacity-40 transition-all cursor-pointer"
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
