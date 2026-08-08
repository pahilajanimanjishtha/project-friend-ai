import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Compass, ShieldAlert, ShieldCheck, HeartHandshake, Eye, Palette, Activity, User,
  MessageSquare, PenTool, BarChart3, Mail, Users, HeartPulse, BookOpen, ChevronRight, HelpCircle,
  Cloud, Music, Pill, Video, StickyNote
} from 'lucide-react';
import DailyAffirmation from './DailyAffirmation';
import SanctuaryTools from './SanctuaryTools';

interface HomeProps {
  setView: (view: 'home' | 'pantheon' | 'chat' | 'pitch' | 'decoy' | 'oracle' | 'journal' | 'music') => void;
  isLightMode?: boolean;
}

export default function Home({ setView, isLightMode = false }: HomeProps) {
  const [savedProfile, setSavedProfile] = useState<any | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [initialSyncTab, setInitialSyncTab] = useState<'drive' | 'gmail' | 'calendar' | 'tasks' | 'sheets' | 'contacts' | 'forms' | 'tony' | 'docs' | 'slides' | 'meet' | 'classroom' | undefined>(undefined);
  const toolRef = useRef<HTMLDivElement>(null);

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

  const bentoCards = [
    {
      id: 'chat',
      title: "Private Chat Buddy",
      description: "A safe, friendly space to talk about how you feel. It is totally private — like a secret diary just for you!",
      icon: MessageSquare,
      emoji: "💬",
      color: "from-blue-500/10 to-indigo-500/10",
      border: "hover:border-indigo-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(110,117,227,0.12)]",
      action: () => setView('chat')
    },
    {
      id: 'journal',
      title: "Happy Diary",
      description: "Write down what happened today! Keep a lovely diary of your adventures and look at all the good things you did.",
      icon: PenTool,
      emoji: "📓",
      color: "from-amber-500/10 to-orange-500/10",
      border: "hover:border-orange-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]",
      action: () => setActiveTool('journal')
    },
    {
      id: 'mood',
      title: "Feeling Chart",
      description: "See a cool color chart of how you feel! Track if you are happy, sleepy, or excited each day.",
      icon: BarChart3,
      emoji: "📊",
      color: "from-emerald-500/10 to-teal-500/10",
      border: "hover:border-teal-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(20,184,166,0.12)]",
      action: () => setActiveTool('mood')
    },
    {
      id: 'slow',
      title: "Slow Letters",
      description: "Send friendly letters that arrive slowly! Write nice notes to others and get cute letters back.",
      icon: Mail,
      emoji: "✉️",
      color: "from-pink-500/10 to-rose-500/10",
      border: "hover:border-rose-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]",
      action: () => setActiveTool('slow')
    },
    {
      id: 'community',
      title: "Friendly Circle",
      description: "Meet nice friends in a safe, quiet circle! Play together and share things you love.",
      icon: Users,
      emoji: "🪷",
      color: "from-purple-500/10 to-fuchsia-500/10",
      border: "hover:border-purple-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
      action: () => setActiveTool('community')
    },
    {
      id: 'wellness',
      title: "Breathe & Relax",
      description: "Take deep breaths with a beautiful moving circle! Relax your body and feel super calm and happy.",
      icon: HeartPulse,
      emoji: "🌿",
      color: "from-green-500/10 to-emerald-500/10",
      border: "hover:border-green-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.12)]",
      action: () => setActiveTool('wellness')
    },
    {
      id: 'clinical',
      title: "Helper Friends",
      description: "Need helper friends? Find phone numbers and websites of kind helpers who can assist you anytime.",
      icon: ShieldCheck,
      emoji: "⚕️",
      color: "from-red-500/10 to-orange-500/10",
      border: "hover:border-red-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]",
      action: () => setActiveTool('clinical')
    },
    {
      id: 'blog',
      title: "Happy Brain Stories",
      description: "Read short, happy stories about how our brains work! Learn fun tricks to keep your mind smiling.",
      icon: BookOpen,
      emoji: "📚",
      color: "from-cyan-500/10 to-sky-500/10",
      border: "hover:border-cyan-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]",
      action: () => setActiveTool('blog')
    },
    {
      id: 'sync',
      title: "Workspace & Meet Hub",
      description: "Spawn live Google Meet rooms, save diaries to Google Drive, and draft emails to your helpful guides!",
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
      title: "12 Friendly Guides",
      description: "Meet 12 friendly guides! Each helper has a special story and super powers to help you feel happy and brave.",
      icon: Sparkles,
      emoji: "🎨",
      color: "from-amber-500/10 to-yellow-500/10",
      border: "hover:border-yellow-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.12)]",
      action: () => setView('pantheon')
    },
    {
      id: 'music',
      title: "Happy Music Maker",
      description: "Compose magical songs using simple words! Pick your music size, add a picture, and listen!",
      icon: Music,
      emoji: "🎵",
      color: "from-amber-500/10 to-red-500/10",
      border: "hover:border-amber-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
      action: () => setView('music')
    },
    {
      id: 'prescription',
      title: "Prescription Analyzer",
      description: "Scan your prescriptions or medicine packages to receive calm, beautiful neurological descriptions and somatic breathing exercises.",
      icon: Pill,
      emoji: "💊",
      color: "from-emerald-500/10 to-amber-500/10",
      border: "hover:border-emerald-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]",
      action: () => setActiveTool('prescription')
    },
    {
      id: 'videosanctuary',
      title: "Video Sanctuary",
      description: "Guided nature breathing exercises with visual circles, rhythmic waves, and deep therapeutic somatic video insights.",
      icon: Video,
      emoji: "🎬",
      color: "from-blue-500/10 to-purple-500/10",
      border: "hover:border-purple-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
      action: () => setActiveTool('videosanctuary')
    },
    {
      id: 'notes',
      title: "Notes Sync (Keep)",
      description: "View, create, color-code, pin, and sync your personal Google Keep notes directly to Google Drive & Tasks.",
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
          The Happy Brain Playground 🌟
        </motion.div>
 
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`font-serif text-4xl sm:text-6xl tracking-tight leading-[1.1] font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}
        >
          A happy home for <br className="hidden sm:inline" />
          <span className="text-[#c9a45c] font-serif font-black italic">your mind.</span>
        </motion.h1>
 
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          Twelve super fun tools to help you feel awesome! Talk to nice helpers, write in a diary, breathe slowly, and keep your mind smiling.
        </motion.p>
 
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => setView('chat')}
            className="w-full sm:w-auto font-serif text-xs uppercase tracking-[0.16em] bg-periwinkle-dark hover:bg-periwinkle-hover text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(110,117,227,0.3)] cursor-pointer"
          >
            Start Chatting Now!
          </button>
          <button
            onClick={() => setView('pantheon')}
            className={`w-full sm:w-auto font-serif text-xs uppercase tracking-[0.16em] border-2 px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/5 cursor-pointer ${isLightMode ? 'border-slate-300 text-stone-800' : 'border-brown text-sage'}`}
          >
            Meet the Helpers
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
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
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
                <p className="text-[10px] text-slate-500 mt-0.5">Friendly Guide: <span className="text-[#c9a45c] font-semibold">{savedProfile.deityId.toUpperCase()}</span> &middot; Happiness Level: <span className="text-[#c9a45c] font-bold">{Math.round((savedProfile.stats.respect + savedProfile.stats.resilience + savedProfile.stats.mindfulness + savedProfile.stats.grounding) / 4)}%</span></p>
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
      <DailyAffirmation />
 
      {/* Nine Bento-Grid Interactive Features Section */}
      <div className="py-20 relative z-10">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#c9a45c] block">Super Fun Play Area</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            Twelve Fun Things to Do!
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">Click any card below to start playing and feeling happy!</p>
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
                {/* Subtle ambient star background in card */}
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
                    {/* Top-Left Squircle Icon Container */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[#c9a45c] border ${isLightMode ? 'bg-[#dfd2be]/30 border-[#dfd2be]' : 'bg-[#1c2e25] border-[#274c3c]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Top-Right Miniature Custom Visual Graphic */}
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
              A Note from Your Helpers
            </span>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#e07070] mb-3">
              Keeping You Safe & Happy
            </h3>
            <p className={`text-sm leading-relaxed tracking-wide mb-4 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              These AI buddies are super nice to talk to and help you relax. But remember, they are computer friends, not real doctors or therapists!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500 mt-6">
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
