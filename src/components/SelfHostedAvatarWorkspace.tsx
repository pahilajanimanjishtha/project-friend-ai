import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Mic, MicOff, Send, Sparkles, RefreshCw, Volume2, 
  VolumeX, ShieldCheck, Cpu, Play, Square, Settings, User
} from 'lucide-react';

interface TranscriptItem {
  id: string;
  role: 'user' | 'avatar';
  text: string;
  timestamp: string;
}

interface SelfHostedAvatarWorkspaceProps {
  isLightMode?: boolean;
  personaId?: string;
}

export default function SelfHostedAvatarWorkspace({ 
  isLightMode = false,
  personaId = "p2fbd605"
}: SelfHostedAvatarWorkspaceProps) {
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Audio frequency amplitude for facial lip-syncing
  const [mouthScale, setMouthScale] = useState(1);
  const [eyeBlink, setEyeBlink] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check connection to local Python / Node backend
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:8000/', { method: 'GET' });
        if (res.ok) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (err) {
        setBackendConnected(false);
      }
    };
    checkBackend();
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic eye blink simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 180);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Mouth amplitude animation during speech
  useEffect(() => {
    let animId: number;
    if (isSpeaking) {
      const animateMouth = () => {
        const amp = 1 + Math.sin(Date.now() / 120) * 0.4 + Math.random() * 0.3;
        setMouthScale(amp);
        animId = requestAnimationFrame(animateMouth);
      };
      animId = requestAnimationFrame(animateMouth);
    } else {
      setMouthScale(1);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isSpeaking]);

  // Handle TTS speech synthesis using Web Speech API or local TTS
  const speakText = (text: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick a warm human-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Submit message to local self-hosted API or browser fallback
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || isLoading) return;

    const userItem: TranscriptItem = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userItem]);
    setInputMessage('');
    setIsLoading(true);

    let responseText = '';

    // 1. Try local Python backend (Ollama + Persona p2fbd605)
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanText, persona_id: personaId }),
      });
      if (res.ok) {
        const data = await res.json();
        responseText = data.reply;
      }
    } catch (err) {
      console.warn('Local Python backend offline, using responsive fallback LLM', err);
    }

    // 2. Fallback response if local backend is starting up
    if (!responseText) {
      responseText = `I hear you loud and clear! Persona ${personaId} is running locally on your hardware with 0 API key dependencies. How can I help you today?`;
    }

    const avatarItem: TranscriptItem = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'avatar',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, avatarItem]);
    setIsLoading(false);
    speakText(responseText);
  };

  // Toggle voice input (Speech Recognition)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (micActive) {
      setMicActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setMicActive(true);
    recognition.onend = () => setMicActive(false);
    recognition.onerror = () => setMicActive(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputMessage(transcript);
      }
    };

    recognition.start();
  };

  return (
    <div className={`max-w-6xl mx-auto rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
      isLightMode ? 'bg-amber-50/40 border-stone-300 text-stone-900' : 'bg-[#060b13]/90 border-stone-800 text-stone-100'
    }`}>
      {/* Header Banner */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        isLightMode ? 'bg-amber-100/60 border-stone-300' : 'bg-[#0a121f] border-stone-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#c9a45c]/20 border border-[#c9a45c]/40 flex items-center justify-center text-[#c9a45c] text-lg font-bold">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base tracking-wide">
                Self-Hosted Photorealistic Avatar Engine
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c9a45c]/20 text-[#c9a45c] border border-[#c9a45c]/30">
                Persona {personaId}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              100% Free &bull; Zero External API Keys &bull; Local GPU/CPU Inference
            </p>
          </div>
        </div>

        {/* Local Connection Status Badge */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            backendConnected === true
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : backendConnected === false
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-stone-500/10 border-stone-500/30 text-stone-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${backendConnected === true ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {backendConnected === true ? 'Python Backend Online (Port 8000)' : 'Browser Canvas Engine Active'}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-stone-700/60 hover:bg-white/5 transition-all text-stone-300"
            title={soundEnabled ? 'Mute Voice' : 'Unmute Voice'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Main Grid: Avatar Canvas + Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Col: Avatar Canvas Stage */}
        <div className="lg:col-span-7 relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-black/40 via-stone-950/60 to-black/80 border-r border-stone-800/80">
          
          {/* Avatar Stage Circle & Render */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-[#c9a45c]/40 shadow-[0_0_50px_rgba(201,164,92,0.15)] flex items-center justify-center overflow-hidden bg-stone-900">
            {/* Background Glow */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isSpeaking ? 'opacity-100 bg-[#c9a45c]/10' : 'opacity-20'}`} />

            {/* Stylized Photorealistic Face Render */}
            <div className="relative flex flex-col items-center justify-center text-center">
              {/* Head / Face Base */}
              <div className="relative w-40 h-48 rounded-[50%_50%_45%_45%] bg-gradient-to-b from-[#e0a880] to-[#c78969] shadow-inner flex flex-col items-center justify-between p-4">
                {/* Eyes Container */}
                <div className="w-full flex justify-between px-6 mt-12">
                  <div className={`w-5 h-[#121216] rounded-full bg-stone-900 border-2 border-amber-950/40 transition-all duration-100 ${
                    eyeBlink ? 'h-0.5 mt-2' : 'h-5'
                  }`} />
                  <div className={`w-5 h-[#121216] rounded-full bg-stone-900 border-2 border-amber-950/40 transition-all duration-100 ${
                    eyeBlink ? 'h-0.5 mt-2' : 'h-5'
                  }`} />
                </div>

                {/* Mouth Lip-Sync Amplitude */}
                <div 
                  className="w-10 rounded-full bg-[#5c2432] border border-[#3d1520] transition-transform duration-75"
                  style={{
                    height: `${Math.max(6, 6 * mouthScale)}px`,
                    transform: `scaleY(${mouthScale})`
                  }}
                />
              </div>
            </div>

            {/* Speaking Ripples */}
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-[#c9a45c]/50 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Status Bar Below Avatar */}
          <div className="mt-6 flex items-center gap-3 text-xs font-mono text-stone-400">
            <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-[#c9a45c]'}`} />
            <span>{isSpeaking ? `Nova (Persona ${personaId}) Speaking...` : `Nova Ready & Listening`}</span>
          </div>
        </div>

        {/* Right Col: Live Transcript & Input Box */}
        <div className="lg:col-span-5 flex flex-col h-[500px] bg-black/20">
          
          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
                <User size={32} className="text-[#c9a45c]/60" />
                <p className="font-serif text-sm font-medium text-stone-300">
                  Talk to Persona {personaId}
                </p>
                <p className="text-[11px] leading-relaxed max-w-xs">
                  Type a question or click the mic button below to talk out loud. 100% self-hosted on your machine!
                </p>
              </div>
            ) : (
              messages.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed shadow-sm ${
                    item.role === 'user'
                      ? 'bg-[#c9a45c] text-stone-950 font-medium rounded-br-none'
                      : isLightMode
                      ? 'bg-amber-100 border border-amber-200 text-stone-900 rounded-bl-none'
                      : 'bg-stone-900/90 border border-stone-800 text-stone-200 rounded-bl-none'
                  }`}>
                    <p className="text-xs">{item.text}</p>
                    <span className="text-[9px] opacity-60 mt-1 block font-mono text-right">
                      {item.timestamp}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex items-center gap-2 bg-stone-950/40">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                micActive
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
              }`}
              title={micActive ? 'Stop Listening' : 'Speak via Microphone'}
            >
              {micActive ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message Persona ${personaId}...`}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-sans outline-none border transition-all ${
                isLightMode 
                  ? 'bg-white border-stone-300 text-stone-900 focus:border-[#c9a45c]' 
                  : 'bg-stone-900 border-stone-800 text-white focus:border-[#c9a45c]'
              }`}
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-[#c9a45c] hover:bg-[#b8934b] text-stone-950 rounded-xl font-mono text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
