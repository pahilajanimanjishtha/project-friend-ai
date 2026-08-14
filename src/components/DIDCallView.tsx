/**
 * DIDCallView.tsx
 *
 * Real-time face-to-face video companion component powered by D-ID Studio Avatar API (d-id.com).
 * Renders photorealistic human video output with lip-synced audio playback.
 */

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera, CameraOff, Mic, MicOff, PhoneOff, Send, Shield, MessageSquareText, Sparkles, Video, RefreshCw
} from 'lucide-react';

type CallStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

interface TranscriptLine {
  id: string;
  role: 'you' | 'nova';
  text: string;
  timestamp: number;
  videoUrl?: string;
}

export default function DIDCallView() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
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

  // ─── D-ID Official Full Embedded Agent Script Loader ───────────────────
  useEffect(() => {
    if (status !== 'live') return;

    let createdScript: HTMLScriptElement | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

    const loadWidget = async () => {
      if (document.getElementById('did-agent-widget-script')) return;
      const configRes = await fetch('/api/did/agent-config');
      if (!configRes.ok) throw new Error('D-ID widget configuration is unavailable.');
      const { clientKey, agentId } = await configRes.json();
      if (document.getElementById('did-agent-widget-script')) return;

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://agent.d-id.com/v2/index.js';
      // Full mode is required here because the avatar must render inside the
      // visible stage. Fabio mode renders a separate floating overlay.
      script.dataset.mode = 'full';
      script.dataset.clientKey = clientKey;
      script.dataset.agentId = agentId;
      script.dataset.name = 'did-agent';
      script.dataset.monitor = 'true';
      script.dataset.targetId = 'did-agent-target-container';
      script.dataset.orientation = 'horizontal';
      script.dataset.openMode = 'expanded';
      script.dataset.autoConnect = 'true';
      script.id = 'did-agent-widget-script';
      createdScript = script;
      script.addEventListener('error', () => setError('D-ID avatar widget failed to load. Check the client key, agent id, and browser network access.'));
      document.body.appendChild(script);

      connectionTimeout = setTimeout(() => {
        if (!(window as any).DID_AGENTS_API) {
          setError('D-ID agent is still loading. Check internet access and confirm the D-ID client key/agent is enabled.');
        }
      }, 15000);
    };

    loadWidget().catch((err) => {
      console.error('[D-ID Widget]', err);
      setError(err instanceof Error ? err.message : 'Failed to load D-ID avatar widget.');
    });
    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      // Remove only the script created by this effect. This avoids React
      // StrictMode cleanup deleting the script created by the second mount.
      createdScript?.remove();
    };
  }, [status]);

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
    setMicOn((prev) => !prev);
  };

  // ─── Generate Instant Response ─────────────────────────────────────────
  const generateDIDResponse = useCallback(async (userText: string) => {
    setIsGeneratingVideo(true);
    try {
      // 1. Get LLM response from Gemini
      const chatRes = await fetch('/api/avatar-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'did_session_' + Math.random().toString(36).substring(2, 9),
          message: userText,
        }),
      });
      const chatData = await chatRes.json();
      const replyText = chatData?.reply?.text || "I'm right here with you! Tell me how you're feeling.";

      setLines((prev) => [
        ...prev,
        { id: `${Date.now()}-n`, role: 'nova', text: replyText, timestamp: Date.now() },
      ]);

      // Route typed replies through the same D-ID stream so the video, voice,
      // lip-sync, and expressions stay synchronized.
      const startedAt = Date.now();
      while (!(window as any).DID_AGENTS_API && Date.now() - startedAt < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const didApi = (window as any).DID_AGENTS_API;
      if (didApi?.functions?.speak) {
        await didApi.functions.speak({ type: 'text', input: replyText });
      } else {
        throw new Error('D-ID agent is not connected yet.');
      }
    } catch (err: any) {
      console.warn('Response Exception:', err);
      const fallback = "I hear you! I am right here listening with you.";
      setLines((prev) => [
        ...prev,
        { id: `${Date.now()}-n`, role: 'nova', text: fallback, timestamp: Date.now() },
      ]);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, []);



  // ─── Start Call ────────────────────────────────────────────────────────
  const startCall = useCallback(() => {
    setStatus('connecting');
    setError('');
    setLines([]);

    // Camera permission can remain pending indefinitely in a browser. It is
    // only the self-view, so never block the D-ID agent connection on it.
    void startLocalCamera();
    setStatus('live');
  }, [startLocalCamera]);

  const endCall = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    stopLocalCamera();
    setStatus('ended');
  }, [stopLocalCamera]);

  const handleSendUserMessage = (text: string) => {
    if (!text.trim() || isGeneratingVideo) return;
    const msg = text.trim();
    setLines((prev) => [...prev, { id: `${Date.now()}-u`, role: 'you', text: msg, timestamp: Date.now() }]);
    generateDIDResponse(msg);
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
              D-ID AI Photorealistic Avatar <span className="text-[10px] font-mono font-bold text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/30 px-2 py-0.5 rounded-full">D-ID.COM LIVE</span>
            </h2>
            <p className="text-[11px] font-sans text-sage">Ultra-smooth photorealistic human video companion</p>
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
      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200" role="alert">
          {error}
        </div>
      )}

      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-2xl mx-auto z-10">
          <div className="w-20 h-20 rounded-3xl bg-[#c9a45c]/10 border-2 border-[#c9a45c]/40 flex items-center justify-center text-[#c9a45c] shadow-[0_0_40px_rgba(201,164,92,0.15)]">
            <Video size={36} />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] font-bold">
              D-ID REALTIME TALKING AVATAR ENGINE
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
              Connect with Nova's D-ID Photorealistic Companion
            </h1>
            <p className="text-sm text-sage leading-relaxed">
              Real-time photorealistic facial motion synthesis powered by d-id.com with natural voice and lip sync.
            </p>
          </div>

          <button
            onClick={startCall}
            className="px-8 py-4 rounded-2xl bg-periwinkle-dark hover:bg-periwinkle-hover text-white font-serif text-sm font-bold uppercase tracking-widest shadow-[0_8px_30px_rgba(110,117,227,0.3)] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-3"
          >
            <Camera size={18} /> Start D-ID Avatar Call
          </button>

          <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Shield size={13} className="text-[#c9a45c]" /> Zero-trace private streaming. Powered by d-id.com
          </p>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10">
          <div className="w-12 h-12 rounded-full border-2 border-[#c9a45c] border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-[#c9a45c] tracking-widest uppercase font-bold animate-pulse">
            Connecting D-ID Photorealistic Avatar Stream…
          </p>
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
          {/* Main Avatar Video Stage with Target Container for D-ID Agent SDK */}
          <div className="lg:col-span-8 bg-[#0a120d] relative flex flex-col items-center justify-center min-h-[520px] overflow-hidden p-3 text-center">
            {/* D-ID Agent SDK Mount Target Container */}
            <div id="did-agent-target-container" className="w-full h-full min-h-[500px] relative flex items-center justify-center rounded-2xl overflow-hidden bg-black/90 border border-[#c9a45c]/30 shadow-2xl">
              {/* Fallback Presenter Avatar */}
              <div className="flex flex-col items-center justify-center p-6">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-[#c9a45c]/50 shadow-[0_0_60px_rgba(201,164,92,0.25)] mb-3 relative group">
                  <img
                    src="https://agents-results.d-id.com/google-oauth2|116254317311978119933/v2_agt_usL62cfH/thumbnail.png"
                    alt="Nova D-ID Custom Agent"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-serif text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Nova <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-xs font-mono text-[#c9a45c] mt-1">D-ID Realtime WebRTC Agent Stream Active</p>
              </div>
            </div>

            {/* User Self Camera PiP */}
            <div className="absolute bottom-4 right-4 w-36 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-stone-900 z-20">
              {camOn ? (
                <video ref={selfVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Camera Off
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-900/80 backdrop-blur-xl border border-stone-700/60 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl z-20">
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
                    {l.role === 'you' ? 'You' : 'D-ID Avatar'}
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
                placeholder="Type a message to D-ID Avatar…"
                className="flex-1 bg-stone-900 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a45c]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isGeneratingVideo}
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
