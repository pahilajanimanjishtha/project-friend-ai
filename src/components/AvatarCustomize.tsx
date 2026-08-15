import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Sparkles, Volume2, Video } from 'lucide-react';
import { AVATARS, getAvatarById } from '../avatars';
import type { Avatar } from '../types';
import type { AvatarDirective } from '../lib/avatarCall';
import { audioController } from '../lib/audioPlayback';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AvatarCustomizeProps {
  isLightMode?: boolean;
  onSelectAvatar?: (avatar: Avatar) => void;
}

// ── localStorage key ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'sanctuary_selected_avatar_id';

function base64ToAudioBlob(base64: string, mime: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

// ── High-Fidelity Character Portrait Stage ─────────────────────────────────────
function AvatarPortraitStage({
  avatar,
  speaking,
  isSelected,
  size = 'card',
}: {
  avatar: Avatar;
  speaking: boolean;
  isSelected?: boolean;
  size?: 'hero' | 'card';
}) {
  const isHero = size === 'hero';

  return (
    <div className={`relative flex items-center justify-center w-full h-full overflow-hidden`}>
      {/* Background ambient radial glow */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${avatar.glowColor}40 0%, transparent 75%)`,
          opacity: speaking || isSelected ? 0.9 : 0.4,
        }}
      />

      {/* Animated Aura Rings when speaking or selected */}
      {(speaking || isSelected) && (
        <>
          <div
            className={`absolute rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
              speaking ? 'animate-spin' : ''
            }`}
            style={{
              width: isHero ? 220 : 140,
              height: isHero ? 220 : 140,
              borderColor: `${avatar.glowColor}50`,
              animationDuration: '12s',
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none animate-pulse"
            style={{
              width: isHero ? 190 : 120,
              height: isHero ? 190 : 120,
              boxShadow: `0 0 35px ${avatar.glowColor}60`,
            }}
          />
        </>
      )}

      {/* Portrait Image Container */}
      <div
        className={`relative z-10 rounded-full overflow-hidden border-2 transition-transform duration-500 shadow-2xl flex items-center justify-center ${
          isHero ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-28 h-28 sm:w-32 sm:h-32'
        } ${speaking ? 'scale-105' : 'scale-100'}`}
        style={{
          borderColor: isSelected ? avatar.glowColor : 'rgba(255, 255, 255, 0.2)',
          boxShadow: isSelected
            ? `0 0 25px ${avatar.glowColor}80, inset 0 0 15px ${avatar.glowColor}40`
            : '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <img
          src={avatar.image}
          alt={avatar.name}
          className="w-full h-full object-cover object-top select-none transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Soft lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
      </div>

      {/* Speaking Soundwaves */}
      {speaking && (
        <div className="absolute bottom-2 z-20 flex items-end gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 bg-white rounded-full animate-bounce"
              style={{
                height: `${8 + (i % 3) * 6}px`,
                backgroundColor: avatar.glowColor,
                animationDelay: `${i * 120}ms`,
                animationDuration: '500ms',
              }}
            />
          ))}
          <span className="text-[9px] font-mono font-bold ml-1 text-white uppercase tracking-wider">
            Speaking
          </span>
        </div>
      )}
    </div>
  );
}

// ── Word-by-word caption hook ─────────────────────────────────────────────────
function useWordByWordCaption(
  text: string,
  active: boolean,
  onWordTick: (amp: number) => void,
) {
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !text) {
      setVisibleWords([]);
      return;
    }
    const words = text.split(' ');
    let index = 0;
    setVisibleWords([]);

    intervalRef.current = setInterval(() => {
      if (index >= words.length) {
        clearInterval(intervalRef.current!);
        return;
      }
      setVisibleWords((prev) => [...prev, words[index]]);
      onWordTick(0.3 + Math.random() * 0.4);
      index++;
    }, 180);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, active]);

  return visibleWords;
}

// ── Avatar Selection Card ─────────────────────────────────────────────────────
function AvatarCard({
  avatar,
  isSelected,
  onSelect,
  speaking,
}: {
  avatar: Avatar;
  isSelected: boolean;
  onSelect: (id: string) => void;
  speaking: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col cursor-pointer select-none ${
        isSelected
          ? 'border-transparent shadow-2xl'
          : 'border-white/10 hover:border-white/25 bg-[#0b1322]'
      }`}
      style={
        isSelected
          ? { boxShadow: `0 0 0 2px ${avatar.glowColor}, 0 0 40px ${avatar.glowColor}50` }
          : {}
      }
      onClick={() => onSelect(avatar.id)}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Select avatar ${avatar.name}`}
      id={`avatar-card-${avatar.id}`}
    >
      {/* Avatar Visual Preview Area */}
      <div
        className="relative h-56 flex items-center justify-center overflow-hidden"
        style={{ background: avatar.bgGradient }}
      >
        {/* Selected checkmark badge */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-30"
            style={{ background: avatar.glowColor }}
          >
            <Check className="w-4 h-4 text-slate-950 font-black" strokeWidth={3} />
          </motion.div>
        )}

        {/* Badge in top left */}
        <div className="absolute top-3 left-3 text-lg z-20 drop-shadow-md">
          {avatar.badge}
        </div>

        {/* Character Portrait Stage */}
        <AvatarPortraitStage
          avatar={avatar}
          speaking={speaking && isSelected}
          isSelected={isSelected}
          size="card"
        />
      </div>

      {/* Card info footer */}
      <div className="bg-[#0c1626] px-5 pt-4 pb-5 flex flex-col gap-3 border-t border-white/5">
        <div>
          <h3 className="font-serif text-xl font-black tracking-widest text-white uppercase flex items-center justify-between">
            <span>{avatar.name}</span>
            <span className="text-[10px] font-mono font-normal text-slate-400 normal-case tracking-normal">
              {avatar.accent}
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans min-h-[2.5em]">
            {avatar.description}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(avatar.id);
          }}
          className={`w-full py-2.5 rounded-xl text-[11px] font-bold tracking-[0.18em] uppercase font-mono transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
            isSelected
              ? 'text-slate-950 shadow-lg font-black'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
          style={isSelected ? { background: avatar.glowColor } : {}}
          aria-label={isSelected ? `${avatar.name} selected` : `Select ${avatar.name}`}
        >
          {isSelected ? (
            <>
              <Check size={14} strokeWidth={3} /> SELECTED
            </>
          ) : (
            'SELECT'
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AvatarCustomize({
  isLightMode = false,
  onSelectAvatar,
}: AvatarCustomizeProps) {
  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? 'ema';
  });

  const [speaking, setSpeaking] = useState(false);
  const [, setAmplitude] = useState(0.03);
  const [previewText, setPreviewText] = useState('');

  // Greeting snippets for each avatar (plain ASCII-safe strings)
  const GREETINGS: Record<string, string[]> = {
    ema: [
      "Hey! It is so good to see you. I am right here for you always.",
      "Take a deep breath. You matter so much, never forget that!",
      "I am always here when you need someone who truly listens.",
    ],
    aryan: [
      "Ah, a thoughtful mind arrives. Let us begin.",
      "Every emotion carries data. Let us decode yours with clarity.",
      "The unexamined moment is the one that passes unused.",
    ],
  };

  const currentAvatar = getAvatarById(selectedId);

  const triggerSpeech = useCallback(async (id: string) => {
    const greetings = GREETINGS[id] ?? GREETINGS['ema'];
    const text = greetings[Math.floor(Math.random() * greetings.length)];
    const avatar = getAvatarById(id);
    setPreviewText(text);
    setSpeaking(true);

    window.speechSynthesis?.cancel();
    audioController.interrupt();

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: avatar.voiceId, includeTimestamps: true }),
      });
      if (!response.ok) throw new Error(`TTS failed (${response.status})`);
      const payload = await response.json() as { audioBase64?: string; audioMime?: string };
      if (!payload.audioBase64) throw new Error('TTS returned no audio');
      await audioController.playAudioBlob(base64ToAudioBlob(payload.audioBase64, payload.audioMime || 'audio/mpeg'));
      setSpeaking(false);
      setAmplitude(0.03);
      return;
    } catch (error) {
      console.warn('[Avatar Greeting TTS] ElevenLabs unavailable; using browser fallback', error);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.94;
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === 'word') {
          setAmplitude(0.25 + Math.random() * 0.4);
          setTimeout(() => setAmplitude(0.04), 140);
        }
      };
      utterance.onend = () => {
        setSpeaking(false);
        setAmplitude(0.03);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setAmplitude(0.03);
      };
      window.speechSynthesis?.speak(utterance);
    }
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      localStorage.setItem(STORAGE_KEY, id);
      const av = getAvatarById(id);
      onSelectAvatar?.(av);
      triggerSpeech(id);
    },
    [onSelectAvatar, triggerSpeech],
  );

  const visibleWords = useWordByWordCaption(previewText, speaking, (amp) => {
    setAmplitude(amp);
    setTimeout(() => setAmplitude(0.04), 160);
  });

  // Initial greeting on mount
  useEffect(() => {
    const timer = setTimeout(() => triggerSpeech(selectedId), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isLightMode ? 'text-slate-900 bg-[#faf8f4]' : 'text-white bg-[#03070f]'
      }`}
    >
      {/* Hero: Current Avatar Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #162447 0%, #1f3b73 40%, #112240 100%)',
          minHeight: 340,
        }}
      >
        {/* Dot-grid background */}
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Animated glow blob */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none"
          style={{
            width: 380,
            height: 380,
            background: `radial-gradient(circle, ${currentAvatar.glowColor}80 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text side */}
          <div className="space-y-4 order-2 md:order-1">
            <motion.span
              key={currentAvatar.id + '-label'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/70 block flex items-center gap-2"
            >
              <span>Your Current Avatar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.span>

            <motion.h1
              key={currentAvatar.id + '-name'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-serif text-6xl sm:text-7xl font-black tracking-tight text-white"
            >
              {currentAvatar.name}
            </motion.h1>

            <motion.p
              key={currentAvatar.id + '-tag'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed whitespace-pre-line font-sans"
            >
              {currentAvatar.tagline}
            </motion.p>

            {/* Word-by-word caption */}
            <AnimatePresence mode="wait">
              {speaking && (
                <motion.div
                  key="caption-box"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 px-4 py-3 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md max-w-md shadow-xl"
                >
                  <p className="text-sm leading-relaxed text-white min-h-[1.4em]">
                    <Volume2
                      className="inline w-3.5 h-3.5 mr-2 animate-pulse"
                      style={{ color: currentAvatar.glowColor }}
                    />
                    {visibleWords.map((w, i) => (
                      <motion.span
                        key={`${w}-${i}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.12 }}
                        className="mr-1"
                      >
                        {w}
                      </motion.span>
                    ))}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => triggerSpeech(selectedId)}
                disabled={speaking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  background: speaking ? 'transparent' : `${currentAvatar.glowColor}20`,
                  borderColor: `${currentAvatar.glowColor}60`,
                  color: currentAvatar.glowColor,
                }}
                aria-label="Preview avatar greeting speech"
                id="preview-avatar-speech-btn"
              >
                <Volume2 className="w-4 h-4" />
                {speaking ? 'Speaking...' : 'Hear Greeting'}
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'chat' }));
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-white text-slate-950 hover:bg-slate-100 transition-all cursor-pointer shadow-lg hover:scale-105"
                id="start-call-hero-btn"
              >
                <Video className="w-4 h-4 text-emerald-600" />
                Start Call with {currentAvatar.name}
              </button>
            </div>
          </div>

          {/* Avatar Portrait Hero Stage */}
          <div className="order-1 md:order-2 flex justify-center">
            <div
              className="relative rounded-3xl overflow-hidden p-6"
              style={{
                width: 280,
                height: 280,
                background: currentAvatar.bgGradient,
                boxShadow: `0 0 60px ${currentAvatar.glowColor}50`,
              }}
            >
              <AvatarPortraitStage
                avatar={currentAvatar}
                speaking={speaking}
                isSelected={true}
                size="hero"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] block">
            Choose Your Companion
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            Select Your Avatar
          </h2>
          <p className={`text-sm max-w-lg mx-auto ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Pick a digital human companion that resonates with you. Each avatar features a unique visual identity,
            voice, and authentic personality with real-time video sync.
          </p>
        </div>

        {/* Avatar Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {AVATARS.map((avatar, idx) => (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
            >
              <AvatarCard
                avatar={avatar}
                isSelected={selectedId === avatar.id}
                onSelect={handleSelect}
                speaking={speaking}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Info Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className={`mt-16 p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-start gap-4 ${
            isLightMode
              ? 'bg-amber-50 border-amber-200'
              : 'bg-[#c9a45c]/5 border-[#c9a45c]/20'
          }`}
        >
          <div className="p-3 rounded-2xl bg-[#c9a45c]/15 text-[#c9a45c] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#c9a45c] mb-1">
              Real-Time Digital Human Call Experience
            </h3>
            <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
              Your selected avatar is powered by real-time conversational AI. When you connect,
              your speech is processed instantaneously, and the avatar responds with synchronized lip movements,
              natural facial expressions, and personality-driven empathetic speech.
            </p>
            <button
              className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-mono text-[#c9a45c] hover:text-white transition-colors cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'chat' }));
              }}
              id="go-to-video-call-btn"
              aria-label="Go to video call with selected avatar"
            >
              Start a call with {currentAvatar.name} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
