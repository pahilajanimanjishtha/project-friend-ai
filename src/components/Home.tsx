import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Compass, ShieldAlert, ShieldCheck, HeartHandshake, Eye, Palette, Activity, User,
  MessageSquare, PenTool, BarChart3, Mail, Users, HeartPulse, BookOpen, ChevronRight, HelpCircle,
  Cloud, Music, Pill, Video, StickyNote, ChevronLeft, CircleDot, Flame, Star, Zap, Shield, Volume2
} from 'lucide-react';
import DailyAffirmation from './DailyAffirmation';
import SanctuaryTools from './SanctuaryTools';
import { CHARACTERS } from '../data';
import { ambientEngine } from '../lib/ambientAudioEngine';

interface HomeProps {
  setView: (view: 'home' | 'pantheon' | 'chat' | 'pitch' | 'decoy' | 'oracle' | 'journal' | 'music' | 'games') => void;
  setSelectedCharId: (id: string) => void;
  isLightMode?: boolean;
}

export default function Home({ setView, setSelectedCharId, isLightMode = false }: HomeProps) {
  const [savedProfile, setSavedProfile] = useState<any | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [initialSyncTab, setInitialSyncTab] = useState<'drive' | 'gmail' | 'calendar' | 'tasks' | 'sheets' | 'contacts' | 'forms' | 'tony' | 'docs' | 'slides' | 'meet' | 'classroom' | undefined>(undefined);
  const toolRef = useRef<HTMLDivElement>(null);
  const guidesTrackRef = useRef<HTMLDivElement>(null);
  const guidesScrollerRef = useRef<HTMLDivElement>(null);
  const [guideOffset, setGuideOffset] = useState(0);
  const guideDirRef = useRef(1); // 1 = glide left (right-to-left), -1 = glide right (left-to-right)
  const guideOffsetRef = useRef(0);
  const guidePausedRef = useRef(false);
  const [flippedGuides, setFlippedGuides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem('oracleProfile');
    if (stored) {
      try {
        setSavedProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored oracle profile in Home", e);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTool && toolRef.current) {
      // Smoothly scroll the page to show the launched tool at the top of the screen
      toolRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTool]);

  const handleGuidesMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = guidesTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    // cursor on left half => glide left-to-right (negative direction)
    // cursor on right half => glide right-to-left (positive direction)
    const ratio = (e.clientX - rect.left) / rect.width;
    guideDirRef.current = ratio < 0.5 ? -1 : 1;
  };

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const track = guidesTrackRef.current;
      const scroller = guidesScrollerRef.current;
      if (track && scroller && !guidePausedRef.current) {
        const max = scroller.scrollWidth - track.clientWidth;
        if (max > 0) {
          guideOffsetRef.current += guideDirRef.current * 0.8;
          if (guideOffsetRef.current >= max) guideOffsetRef.current = 0;
          if (guideOffsetRef.current < 0) guideOffsetRef.current = max;
          setGuideOffset(guideOffsetRef.current);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const getGuideIcon = (name: string, color: string) => {
    const cls = `w-8 h-8 ${color}`;
    switch (name) {
      case 'butterfly': return <Sparkles className={cls} />;
      case 'boulder': return <CircleDot className={cls} />;
      case 'eye': return <Eye className={cls} />;
      case 'pomegranate': return <Flame className={cls} />;
      case 'grapes': return <Compass className={cls} />;
      case 'star': return <Star className={cls} />;
      case 'lightning': return <Zap className={cls} />;
      case 'trident': return <Compass className={cls} />;
      case 'lyre': return <Music className={cls} />;
      case 'shield': return <Shield className={cls} />;
      case 'fire': return <Flame className={cls} />;
      default: return <Sparkles className={cls} />;
    }
  };

  const handleGuideChat = (charId: string) => {
    setSelectedCharId(charId);
    setView('chat');
  };

  const toggleGuideFlip = (id: string) => {
    setFlippedGuides((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const bentoCards = [
    {
      id: 'chat',
      title: "Nova Live Video Call",
      description: "Face-to-face real-time AI video call with Nova for warm, supportive conversations, venting, and real-time listening.",
      icon: Video,
      emoji: "🎥",
      color: "from-blue-500/10 to-indigo-500/10",
      border: "hover:border-indigo-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(110,117,227,0.12)]",
      action: () => setView('chat')
    },
    {
      id: 'journal',
      title: "Mindful Reflection Journal",
      description: "Express your thoughts, capture daily reflections, and build a private personal growth diary.",
      icon: PenTool,
      emoji: "📓",
      color: "from-amber-500/10 to-orange-500/10",
      border: "hover:border-orange-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]",
      action: () => setActiveTool('journal')
    },
    {
      id: 'mood',
      title: "Mood & Energy Analytics",
      description: "Visual emotional tracking charts to monitor your daily mood patterns, energy levels, and emotional wellness.",
      icon: BarChart3,
      emoji: "📊",
      color: "from-emerald-500/10 to-teal-500/10",
      border: "hover:border-teal-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(20,184,166,0.12)]",
      action: () => setActiveTool('mood')
    },
    {
      id: 'slow',
      title: "Slow Letters & Reflection",
      description: "Write reflective notes to yourself or companion guides that arrive at a gentle, deliberate pace.",
      icon: Mail,
      emoji: "✉️",
      color: "from-pink-500/10 to-rose-500/10",
      border: "hover:border-rose-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]",
      action: () => setActiveTool('slow')
    },
    {
      id: 'community',
      title: "Peer Sanctuary Circle",
      description: "A serene, quiet community space to share reflections, read uplifting thoughts, and feel grounded.",
      icon: Users,
      emoji: "🪷",
      color: "from-purple-500/10 to-fuchsia-500/10",
      border: "hover:border-purple-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
      action: () => setActiveTool('community')
    },
    {
      id: 'wellness',
      title: "Somatic Breathing & Reset",
      description: "Guided 5-4-3-2-1 sensory grounding and box breathing exercises to reduce stress, anxiety, and overwhelm.",
      icon: HeartPulse,
      emoji: "🌿",
      color: "from-green-500/10 to-emerald-500/10",
      border: "hover:border-green-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.12)]",
      action: () => setActiveTool('wellness')
    },
    {
      id: 'clinical',
      title: "Emergency Crisis Directories",
      description: "Verified 24/7 emergency crisis support helplines, regional emergency contacts, and professional directories.",
      icon: ShieldCheck,
      emoji: "⚕️",
      color: "from-red-500/10 to-orange-500/10",
      border: "hover:border-red-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]",
      action: () => setActiveTool('clinical')
    },
    {
      id: 'blog',
      title: "Psychoeducation & Articles",
      description: "Short, insightful articles on cognitive reframing, somatic mindfulness, and brain science.",
      icon: BookOpen,
      emoji: "📚",
      color: "from-cyan-500/10 to-sky-500/10",
      border: "hover:border-cyan-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]",
      action: () => setActiveTool('blog')
    },
    {
      id: 'sync',
      title: "Workspace & Keep Sync Hub",
      description: "Integrated Google Keep note sync, Drive journal backups, and live meeting space tools.",
      icon: Cloud,
      emoji: "🌌",
      color: "from-[#c9a45c]/10 to-indigo-500/10",
      border: "hover:border-[#c9a45c]/50",
      glow: "hover:shadow-[0_0_20px_rgba(201,164,92,0.12)]",
      action: () => {
        setInitialSyncTab('meet');
        setActiveTool('sync');
      }
    },
    {
      id: 'pantheon',
      title: "12 Archetypal Companion Guides",
      description: "Explore 12 unique archetypal guides (Sisyphus, Persephone, Athena, etc.) tailored for specific emotional support.",
      icon: Sparkles,
      emoji: "🎨",
      color: "from-amber-500/10 to-yellow-500/10",
      border: "hover:border-yellow-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.12)]",
      action: () => setView('pantheon')
    },
    {
      id: 'music',
      title: "AI Ambient Soundscapes",
      description: "Generate relaxing ambient music and personalized soundscapes tailored to your mood and focus.",
      icon: Music,
      emoji: "🎵",
      color: "from-amber-500/10 to-red-500/10",
      border: "hover:border-amber-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
      action: () => setView('music')
    },
    {
      id: 'prescription',
      title: "Prescription Helper & Safety",
      description: "Scan medicine labels or packages for clear medication info, clinical context, and calming breathing pairings.",
      icon: Pill,
      emoji: "💊",
      color: "from-emerald-500/10 to-amber-500/10",
      border: "hover:border-emerald-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]",
      action: () => setActiveTool('prescription')
    },
    {
      id: 'videosanctuary',
      title: "Somatic Video Sanctuary",
      description: "Guided nature breathing video exercises with visual waves for deep physical relaxation.",
      icon: Video,
      emoji: "🎬",
      color: "from-blue-500/10 to-purple-500/10",
      border: "hover:border-purple-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
      action: () => setActiveTool('videosanctuary')
    },
    {
      id: 'notes',
      title: "Google Keep Notes Sync",
      description: "View, create, color-code, pin, and sync your personal Google Keep notes directly to Google Drive.",
      icon: StickyNote,
      emoji: "📌",
      color: "from-amber-500/10 to-emerald-500/10",
      border: "hover:border-amber-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
      action: () => {
        setActiveTool('sync');
        setInitialSyncTab('notes' as any);
      }
    }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-screen transition-colors duration-500 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
      
      {/* Active Interactive Tool Panel */}
      <div ref={toolRef} className={activeTool ? "mb-12 scroll-mt-24" : ""}>
        {activeTool && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SanctuaryTools 
              activeTool={activeTool} 
              onClose={() => {
                setActiveTool(null);
                setInitialSyncTab(undefined);
              }} 
              isLightMode={isLightMode} 
              setView={setView}
              initialSyncTab={initialSyncTab}
            />
          </motion.div>
        )}
      </div>

      {/* Main Hero Header */}
      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 border-2 border-[#c9a45c]/40 bg-[#c9a45c]/10 text-[#c9a45c] px-4 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          PROJECT FRIEND AI • EMOTIONAL WELLNESS SANCTUARY 🪷
        </motion.div>
 
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`font-serif text-4xl sm:text-6xl tracking-tight leading-[1.1] font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}
        >
          AI Companion for Emotional <br className="hidden sm:inline" />
          <span className="text-[#c9a45c] font-serif font-black italic">Wellness, Clarity & Peace.</span>
        </motion.h1>
 
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          Connect with warm real-time AI video companions, chat with empathetic listening guides, track your daily mood, practice somatic breathing, and express yourself in a safe, confidential space.
        </motion.p>
 
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => setView('chat')}
            className="w-full sm:w-auto font-serif text-xs uppercase tracking-[0.16em] bg-periwinkle-dark hover:bg-periwinkle-hover text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(110,117,227,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            🎥 Start Nova Live Video Call
          </button>
          <button
            onClick={() => setView('pantheon')}
            className={`w-full sm:w-auto font-serif text-xs uppercase tracking-[0.16em] border-2 px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/5 cursor-pointer ${isLightMode ? 'border-slate-300 text-stone-800' : 'border-brown text-sage'}`}
          >
            🎨 Meet 12 Companion Guides
          </button>
        </motion.div>
 
        {/* Mandatory Clinical Disclaimer Header Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-left max-w-3xl mx-auto shadow-md ${
            isLightMode 
              ? 'bg-amber-50/90 border-amber-300 text-stone-900' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs font-serif leading-relaxed">
              <span className="font-bold block text-amber-500 uppercase tracking-wider text-[10px] font-mono">
                Mandatory Clinical Safety Notice
              </span>
              <span>
                Project Friend AI does not claim to be a replacement for a clinical psychiatrist, psychologist, or medical healthcare provider. All medical advice must be cross-checked with a human expert.
              </span>
            </div>
          </div>
          <button
            onClick={() => setView('login' as any)}
            className={`shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}
          >
            Review Full Disclaimer &amp; Login &rarr;
          </button>
        </motion.div>

        {/* Oracle Profile Banner */}
        {savedProfile && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`mt-12 border-2 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto backdrop-blur-md ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-[#c9a45c]/40'}`}
          >
            <div className="flex items-center gap-4 text-left w-full sm:w-auto">
              <div className="w-12 h-16 rounded overflow-hidden shrink-0 border border-white/10 shadow-[0_0_15px_rgba(201,164,92,0.15)]">
                <img src={savedProfile.cardImage} alt="Oracle Card" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-widest text-[#c9a45c] uppercase block">Your Selected Helper Card</span>
                <h4 className={`font-serif text-sm font-bold mt-0.5 ${isLightMode ? 'text-stone-900' : 'text-white'}`}>{savedProfile.name}</h4>
                <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-500'}`}>Friendly Guide: <span className="text-[#c9a45c] font-semibold">{savedProfile.deityId.toUpperCase()}</span> &middot; Happiness Level: <span className="text-[#c9a45c] font-bold">{Math.round((savedProfile.stats.respect + savedProfile.stats.resilience + savedProfile.stats.mindfulness + savedProfile.stats.grounding) / 4)}%</span></p>
              </div>
            </div>
            <button 
              onClick={() => setView('oracle')}
              className={`w-full sm:w-auto text-[10px] uppercase tracking-wider font-mono border px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${isLightMode ? 'bg-[#eae4d3] border-[#dfd2be] text-stone-800 hover:bg-[#dfd2be]/50' : 'bg-white/5 border-brown text-[#c9a45c] hover:bg-[#c9a45c]/10 hover:border-[#c9a45c]'}`}
            >
              Show Full Card
            </button>
          </motion.div>
        )}
      </div>
 
      {/* Daily Affirmations from Deities */}
      <DailyAffirmation isLightMode={isLightMode} />
 
      {/* ===== COMMENTED OUT: Twelve Fun Things to Do! ===== */}
      {/*
      {/* Nine Bento-Grid Interactive Features Section
      <div className="py-20 relative z-10">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#c9a45c] block">Sanctuary Capabilities &amp; Interactive Tools</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            Everything You Need for Daily Peace
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">Click any capability below to launch real-time AI video, companion chat, somatic exercises, or workspace sync.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bentoCards.map((card, idx) => {
            const Icon = card.icon;
            
            // Helper for rendering custom top-right miniature visuals
            const renderMiniGraphic = (cardId: string) => {
              switch (cardId) {
                case 'chat':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex flex-col justify-center gap-1.5 shadow-md border border-slate-200/60 select-none">
                      <div className="w-5 h-2 bg-[#3b82f6] rounded-full self-start"></div>
                      <div className="w-5 h-2 bg-slate-200 rounded-full self-end"></div>
                    </div>
                  );
                case 'journal':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex flex-col justify-center gap-1 shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-[2px] bg-[#c9a45c]"></div>
                      <div className="w-3/4 h-[2px] bg-slate-300"></div>
                      <div className="w-full h-[2px] bg-slate-300"></div>
                      <div className="w-1/2 h-[2px] bg-[#c9a45c]"></div>
                    </div>
                  );
                case 'mood':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex flex-col justify-between shadow-md border border-slate-200/60 select-none">
                      <div className="h-full w-full flex items-end justify-between gap-1 p-0.5 bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px),linear-gradient(to_right,#f1f5f9_1px,transparent_1px)] bg-[size:4px_4px] rounded">
                        <div className="w-2 bg-[#ec4899] rounded-sm" style={{ height: '55%' }}></div>
                        <div className="w-2 bg-[#22c55e] rounded-sm" style={{ height: '80%' }}></div>
                        <div className="w-2 bg-[#3b82f6] rounded-sm" style={{ height: '70%' }}></div>
                      </div>
                    </div>
                  );
                case 'slow':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center relative">
                        <div className="w-5 h-4 border border-slate-300 rounded-sm relative flex items-center justify-center">
                          <div className="absolute top-0 inset-x-0 h-[5px] border-b border-slate-300 bg-slate-100 rounded-t-sm" style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></div>
                        </div>
                      </div>
                    </div>
                  );
                case 'community':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center -space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#a855f7] border border-white flex items-center justify-center text-[7px] text-white font-bold font-sans">1</div>
                        <div className="w-4 h-4 rounded-full bg-[#ec4899] border border-white flex items-center justify-center text-[7px] text-white font-bold font-sans">2</div>
                        <div className="w-4 h-4 rounded-full bg-[#10b981] border border-white flex items-center justify-center text-[7px] text-white font-bold font-sans">3</div>
                      </div>
                    </div>
                  );
                case 'wellness':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center relative overflow-hidden">
                        <div className="absolute w-5 h-5 rounded-full border border-[#22c55e]/30 animate-ping"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-[#22c55e] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        </div>
                      </div>
                    </div>
                  );
                case 'clinical':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center">
                        <div className="w-4 h-5 rounded-b bg-[#ef4444] text-white flex items-center justify-center text-[9px] font-bold" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}>
                          +
                        </div>
                      </div>
                    </div>
                  );
                case 'blog':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center relative">
                        <div className="w-5 h-5 border border-slate-300 rounded flex items-center justify-center bg-white relative">
                          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-300"></div>
                          <div className="absolute bottom-0 right-1 w-1 h-3.5 bg-[#c9a45c]"></div>
                        </div>
                      </div>
                    </div>
                  );
                case 'sync':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center relative">
                        <Cloud className="w-4 h-4 text-indigo-500 animate-pulse" />
                      </div>
                    </div>
                  );
                case 'prescription':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center text-[#c9a45c] select-none text-base">
                        💊
                      </div>
                    </div>
                  );
                case 'videosanctuary':
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center text-[#c9a45c] select-none text-base relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#c9a45c]/10 animate-pulse" />
                        🎬
                      </div>
                    </div>
                  );
                case 'pantheon':
                default:
                  return (
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200/60 select-none">
                      <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center text-[#c9a45c] relative">
                        <Sparkles className="w-4 h-4 animate-bounce" />
                      </div>
                    </div>
                  );
              }
            };

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                onClick={card.action}
                className={`group p-8 rounded-[28px] border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] hover:bg-[#eae4d3]' : 'bg-[#07130e] border-[#112d24] hover:bg-[#0a1e16] hover:shadow-[0_0_25px_rgba(20,184,166,0.15)]'}`}
              >
                {/* Subtle ambient star background in card
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]">
                  <div className="absolute top-[10%] left-[25%] w-[1.5px] h-[1.5px] rounded-full bg-white opacity-40 animate-pulse" />
                  <div className="absolute top-[20%] left-[45%] w-0.5 h-0.5 rounded-full bg-white opacity-25" />
                  <div className="absolute top-[40%] left-[15%] w-1 h-1 rounded-full bg-[#c9a45c] opacity-30 animate-pulse" />
                  <div className="absolute top-[55%] left-[75%] w-[1.5px] h-[1.5px] rounded-full bg-white opacity-40" />
                  <div className="absolute top-[75%] left-[35%] w-0.5 h-0.5 rounded-full bg-white opacity-20" />
                  <div className="absolute top-[85%] left-[65%] w-1 h-1 rounded-full bg-[#c9a45c] opacity-35 animate-pulse" />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    {/* Top-Left Squircle Icon Container
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[#c9a45c] border ${isLightMode ? 'bg-[#dfd2be]/30 border-[#dfd2be]' : 'bg-[#1c2e25] border-[#274c3c]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Top-Right Miniature Custom Visual Graphic
                    {renderMiniGraphic(card.id)}
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-[#c9a45c] tracking-wide mt-8">
                    {card.title}
                  </h3>
                  <p className={`text-sm mt-3.5 leading-relaxed font-sans ${isLightMode ? 'text-slate-600' : 'text-slate-400 font-normal'}`}>
                    {card.description}
                  </p>
                </div>
                
                <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-mono tracking-[0.18em] text-[#c9a45c] uppercase font-black pt-5 mt-6 border-t border-[#c9a45c]/10 group-hover:text-white transition-colors">
                  LAUNCH MODULE <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div> */}

      {/* 12 Friendly Guides Carousel */}
      <div className="py-20 relative z-10">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#c9a45c] block">Meet Your Helpers</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            12 Friendly Guides
          </h2>
          <p className={`text-xs max-w-lg mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-500'}`}>
            Move your cursor left or right across the cards to glide through the guides.
          </p>
        </div>

        <div
          ref={guidesTrackRef}
          onPointerMove={handleGuidesMove}
          className={`relative overflow-hidden rounded-[28px] border-2 cursor-crosshair touch-pan-x ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-[#03070f]/60 border-[#112d24] backdrop-blur-md'}`}
        >
          <div
            ref={guidesScrollerRef}
            className="flex gap-5 px-6 py-8 will-change-transform"
            style={{ transform: `translateX(${-guideOffset}px)` }}
          >
            {CHARACTERS.map((char) => {
              const isFlipped = !!flippedGuides[char.id];
              return (
                <div
                  key={char.id}
                  className="group shrink-0 w-[300px] h-[380px] cursor-pointer relative"
                  style={{ perspective: '1000px' }}
                  onClick={() => toggleGuideFlip(char.id)}
                  onPointerEnter={() => { guidePausedRef.current = true; }}
                  onPointerLeave={() => { guidePausedRef.current = false; }}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1)',
                    }}
                  >
                    {/* CARD FRONT */}
                    <div
                      className={`absolute inset-0 w-full h-full p-6 rounded-[24px] border-2 flex flex-col justify-between overflow-hidden ${isLightMode ? 'bg-white/70 border-[#dfd2be] hover:border-[#c9a45c]/60' : 'bg-[#07130e] border-[#112d24] hover:border-[#c9a45c]/50'}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        boxShadow: `0 0 30px ${char.colorScheme.glow}`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full blur-[50px] opacity-20 pointer-events-none"
                        style={{ background: `radial-gradient(circle, ${char.colorScheme.glow} 0%, transparent 70%)` }}
                      />
                      <div className="relative z-10 flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isLightMode ? 'bg-[#dfd2be]/30 border-[#dfd2be]' : 'bg-[#1c2e25] border-[#274c3c]'}`}
                          style={{ boxShadow: `0 0 18px ${char.colorScheme.glow}` }}
                        >
                          {getGuideIcon(char.symbolName, char.colorScheme.text)}
                        </div>
                        <div>
                          <span className={`text-[9px] font-mono uppercase tracking-[0.18em] font-bold ${char.colorScheme.text}`}>
                            {char.badge}
                          </span>
                          <h3 className="font-serif text-base font-bold leading-tight">
                            {char.name}
                          </h3>
                        </div>
                      </div>
                      <div className="relative z-10">
                        <p className="text-[11px] font-mono uppercase tracking-wider opacity-70 mb-3">
                          {char.role}
                        </p>
                        <p className={`text-xs italic leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {char.quote}
                        </p>
                      </div>
                      <div className={`relative z-10 flex items-center justify-between text-[8px] uppercase tracking-[0.12em] ${isLightMode ? 'text-slate-600' : 'text-slate-500'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCharId(char.id);
                            ambientEngine.start();
                          }}
                          className="flex items-center gap-1 font-mono text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/30 hover:bg-[#c9a45c]/25 px-2 py-1 rounded-md cursor-pointer transition-all"
                          title="Play nature/ethereal soundscape for this archetype"
                        >
                          <Volume2 className="w-2.5 h-2.5 text-[#c9a45c]" />
                          <span>Ambiance 🎵</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuideChat(char.id);
                          }}
                          className={`hover:underline font-bold cursor-pointer ${isLightMode ? 'text-indigo-600 hover:text-indigo-800' : 'text-periwinkle hover:text-white'}`}
                        >
                          Sanctuary chat →
                        </button>
                      </div>
                    </div>

                    {/* CARD BACK */}
                    <div
                      className={`absolute inset-0 w-full h-full p-6 rounded-[24px] border-2 flex flex-col justify-between ${isLightMode ? 'bg-white/85 border-[#c9a45c]/50' : 'bg-[#0a1512] border-[#c9a45c]/40'}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        boxShadow: `0 0 30px ${char.colorScheme.glow}`,
                      }}
                    >
                      <div>
                        <div className={`border-b pb-3 mb-4 flex justify-between items-start ${isLightMode ? 'border-[#dfd2be]' : 'border-brown'}`}>
                          <div>
                            <h4 className={`font-serif text-lg font-medium ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
                              {char.name}
                            </h4>
                            <span className={`text-[10px] font-bold tracking-[0.12em] uppercase opacity-80 ${isLightMode ? 'text-emerald-800' : 'text-sage'}`}>
                              {char.role} &middot; {char.artStyle}
                            </span>
                          </div>
                          <span className={`text-[8px] font-mono tracking-[0.14em] uppercase px-2.5 py-1 rounded-full ${char.colorScheme.badge}`}>
                            {char.badge}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase block mb-1 ${isLightMode ? 'text-emerald-800' : 'text-sage'}`}>
                              Want
                            </span>
                            <p className={`font-serif text-[11px] leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                              {char.want}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#e07070] uppercase block mb-1">
                              Wound
                            </span>
                            <p className={`font-serif text-[11px] leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                              {char.wound}
                            </p>
                          </div>
                          <div className={`pt-2 ${isLightMode ? 'border-[#dfd2be]' : 'border-brown'} border-t`}>
                            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase block mb-1 ${isLightMode ? 'text-indigo-600' : 'text-periwinkle'}`}>
                              Secret
                            </span>
                            <p className={`font-serif text-[11px] italic leading-relaxed opacity-95 ${isLightMode ? 'text-emerald-800' : 'text-sage'}`}>
                              {char.secret}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuideChat(char.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 font-serif text-[9px] tracking-[0.14em] uppercase text-white bg-periwinkle-dark py-2.5 rounded-xl font-bold hover:bg-periwinkle-hover transition-all cursor-pointer shadow-[0_0_15px_rgba(159,166,255,0.15)]"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Chat Sanctuary
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGuideFlip(char.id);
                          }}
                          className={`border-2 px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer ${isLightMode ? 'border-stone-400 text-stone-700 hover:border-stone-500 hover:text-stone-900' : 'border-brown hover:border-sage text-sage hover:text-white'}`}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.15em] opacity-60 ${isLightMode ? 'text-slate-600' : 'text-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            <ChevronLeft className="w-3.5 h-3.5" /> Cursor Left
          </span>
          <span className="flex items-center gap-1.5">
            Cursor Right <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Safety and Integrity Guidelines Bento Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={`p-8 md:p-12 rounded-[24px] border-2 relative z-10 ${isLightMode ? 'bg-[#f4f0e6] border-red-500/20' : 'bg-[#e07070]/5 border-[#e07070]/20 backdrop-blur-md'}`}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="p-4 rounded-xl bg-[#e07070]/10 text-[#e07070] border border-[#e07070]/20 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[#e07070] uppercase block mb-1">
              Safety &amp; Non-Clinical Boundaries
            </span>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#e07070] mb-3">
              Confidential Peer Support &amp; Privacy First
            </h3>
            <p className={`text-sm leading-relaxed tracking-wide mb-4 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              Project Friend AI provides supportive, peer-style emotional listening and mindful grounding. It is non-clinical and is not a substitute for clinical psychiatric treatment, medical diagnosis, or emergency intervention.
            </p>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-6 ${isLightMode ? 'text-slate-600' : 'text-slate-500'}`}>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#e07070] shrink-0 mt-0.5" />
                <span>Your chats are a secret and stays only on your computer.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#e07070] shrink-0 mt-0.5" />
                <span>If you feel very sick or need real help right away, please tell a parent, teacher, or call a kind doctor!</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
