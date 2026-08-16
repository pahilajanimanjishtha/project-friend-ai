import { useState, useEffect, useRef } from 'react';
import React from 'react';
import {
  Menu, X, Sparkles, Layout, MessageSquare, Presentation, User, Sun, Moon,
  PenTool, Music, ChevronDown, BarChart3, Mail, Users, HeartPulse,
  ShieldCheck, BookOpen, Cloud, Pill, Video, Volume2, VolumeX, Sliders, TrendingUp, StickyNote, Wind, Brain, Palette, Cpu,
  CircleUser, FileText, HeartHandshake, LogOut
} from 'lucide-react';
import { auth, signInWithGoogle, logOut, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ambientEngine } from '../lib/ambientAudioEngine';
import { CHARACTERS } from '../data';

interface NavigationProps {
  currentView: string;
  setView: (view: any) => void;
  isLightMode?: boolean;
  setIsLightMode?: (val: boolean) => void;
  selectedCharId?: string;
  setSelectedCharId?: (id: string) => void;
  user?: FirebaseUser | null;
}

export default function Navigation({
  currentView,
  setView,
  isLightMode = false,
  setIsLightMode,
  selectedCharId,
  setSelectedCharId,
  user: propUser
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSoundOpen, setSidebarSoundOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Ambient Audio Controller States
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(ambientEngine.getIsPlaying());
  const [ambientArchetype, setAmbientArchetype] = useState<string>(selectedCharId || ambientEngine.getCurrentArchetypeId());

  useEffect(() => {
    const unsubscribe = ambientEngine.subscribe((isPlaying, archetypeId) => {
      setAmbientPlaying(isPlaying);
      setAmbientArchetype(archetypeId);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedCharId) {
      ambientEngine.setArchetype(selectedCharId);
    }
  }, [selectedCharId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(propUser !== undefined ? propUser : null);

  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    const checkAuthState = (currentUser: FirebaseUser | null) => {
      const isAuthFlag = localStorage.getItem('sanctuary_user_authenticated') === 'true';
      const savedDemo = localStorage.getItem('sanctuary_demo_google_user');

      if (!isAuthFlag) {
        setUser(null);
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        syncDataWithFirestore(currentUser);
      } else if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      checkAuthState(currentUser);
    });

    const handleAuthEvent = () => {
      checkAuthState(auth.currentUser);
    };

    window.addEventListener('storage', handleAuthEvent);
    window.addEventListener('sanctuary_auth_state_changed', handleAuthEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleAuthEvent);
      window.removeEventListener('sanctuary_auth_state_changed', handleAuthEvent);
    };
  }, []);

  const syncDataWithFirestore = async (currentUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      const localProfile = localStorage.getItem('oracleProfile');
      const localChats = localStorage.getItem('sanctuary_chats');
      const localJournals = localStorage.getItem('sanctuaryJournals');
      const localXP = localStorage.getItem('sanctuaryXP');

      if (userSnap.exists()) {
        const cloudData = userSnap.data();

        // Restore from cloud if empty locally
        if (cloudData.oracleProfile && !localProfile) {
          localStorage.setItem('oracleProfile', JSON.stringify(cloudData.oracleProfile));
        }
        if (cloudData.sanctuary_chats && !localChats) {
          localStorage.setItem('sanctuary_chats', JSON.stringify(cloudData.sanctuary_chats));
        }
        if (cloudData.sanctuaryJournals && !localJournals) {
          localStorage.setItem('sanctuaryJournals', JSON.stringify(cloudData.sanctuaryJournals));
        }
        if (cloudData.sanctuaryXP && !localXP) {
          localStorage.setItem('sanctuaryXP', String(cloudData.sanctuaryXP));
        }
      }

      // Sync local changes to cloud
      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        updatedAt: new Date().toISOString(),
        ...(localProfile ? { oracleProfile: JSON.parse(localProfile) } : {}),
        ...(localChats ? { sanctuary_chats: JSON.parse(localChats) } : {}),
        ...(localJournals ? { sanctuaryJournals: JSON.parse(localJournals) } : {}),
        ...(localXP ? { sanctuaryXP: parseInt(localXP) || 0 } : {})
      }, { merge: true });

    } catch (error) {
      console.error("Firestore automatic background sync failure:", error);
    }
  };

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesktopDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prevent body scroll when sidebar / mobile drawer is open
  useEffect(() => {
    if (sidebarOpen || mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, mobileMenuOpen]);

  // Track page scroll to make the navbar more solid when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const abilities = [
    { id: 'chat', label: '🎥 Live 3D Companion Call', icon: Video, description: 'Real-time studio HD 3D video companion call with lip sync and gestures' },
    { id: 'customize', label: '🎭 Customize Your Avatar', icon: Palette, description: 'Choose your companion avatar, voice style, and gesture personality' },
    { id: 'self-hosted', label: '⚡ Self-Hosted Avatar Engine (Zero API Keys)', icon: Cpu, description: '100% free local AI avatar engine for Persona p2fbd605' },
    { id: 'sanctuary', label: '💬 AI Companion Sanctuary Chat', icon: MessageSquare, description: 'Private AI companion chat with specialized listening archetypes' },
    { id: 'somatic-reset', label: '🧘 Somatic Reset (5-4-3-2-1)', icon: Wind, description: '5-4-3-2-1 sensory grounding & box breathing pacer' },
    { id: 'cbt-reframe', label: '🧠 CBT Reframe & Unburden', icon: Brain, description: 'Spot unhelpful thoughts & formulate reframes' },
    { id: 'pantheon', label: '🎨 12 Archetypal Guides', icon: Sparkles, description: 'Explore companion guides, mythic stories, & art styles' },
    { id: 'oracle', label: '🃏 Oracle Soul Profile', icon: User, description: 'Create your custom companion tarot card profile' },
    { id: 'journal', label: '📓 Mindful Reflection Journal', icon: PenTool, description: 'Private daily growth diary and thought log' },
    { id: 'mood', label: '📊 Mood & Energy Analytics', icon: BarChart3, description: 'Visual emotional tracking charts for daily patterns' },
    { id: 'slow', label: '✉️ Slow Reflective Letters', icon: Mail, description: 'Send and receive letters that arrive at a peaceful pace' },
    { id: 'community', label: '🪷 Peer Sanctuary Circle', icon: Users, description: 'Safe community circle for shared reflections' },
    { id: 'wellness', label: '🌿 Somatic Breathing Pacer', icon: HeartPulse, description: 'Deep breathing loop with visual rhythm waves' },
    { id: 'clinical', label: '⚕️ Emergency Crisis Directories', icon: ShieldCheck, description: '24/7 emergency helplines & regional medical resources' },
    { id: 'blog', label: '📚 Psychoeducation & Brain Articles', icon: BookOpen, description: 'Science-backed mindfulness and reframing scrolls' },
    { id: 'sync', label: '🌌 Workspace & Meet Hub', icon: Cloud, description: 'Google Keep sync, Drive backups, & Google Meet rooms' },
    { id: 'notes', label: '📌 Google Keep Notes Sync', icon: StickyNote, description: 'View, create, color-code, & sync personal Keep notes' },
    { id: 'music', label: '🎵 AI Ambient Music Generator', icon: Music, description: 'Compose custom calming soundscapes' },
    { id: 'prescription', label: '💊 Prescription Helper & Safety', icon: Pill, description: 'Scan medicine packaging for clear info & breathing pairing' },
    { id: 'videosanctuary', label: '🎬 Somatic Video Sanctuary', icon: Video, description: 'Guided nature breathing videos for deep relaxation' },
    { id: 'churn', label: '📈 Platform Analytics & Metrics', icon: TrendingUp, description: 'User engagement, retention cohorts, & metrics' },
    { id: 'pitch', label: '📊 Project Vision & Architecture', icon: Presentation, description: 'Clinical art integration model & pitch deck' },
    { id: 'admin', label: '⚙️ Admin Console', icon: Sliders, description: 'Platform configuration, waitlist, & status' },
    { id: 'policy', label: '🛡️ Safety & Privacy Policy', icon: ShieldCheck, description: 'Privacy policy, GDPR terms, & safety brief' },
  ];

  const handleLinkClick = (viewId: string) => {
    if (viewId === 'somatic-reset') {
      localStorage.setItem('open_chat_tool', 'somatic-reset');
      setView('sanctuary');
      window.dispatchEvent(new Event('open_chat_tool'));
      return;
    }
    if (viewId === 'cbt-reframe') {
      localStorage.setItem('open_chat_tool', 'cbt-reframe');
      setView('sanctuary');
      window.dispatchEvent(new Event('open_chat_tool'));
      return;
    }

    setDesktopDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileAccordionOpen(false);
    setSidebarOpen(false);

    setView(viewId);

    setTimeout(() => {
      if (viewId === 'login') {
        const el = document.getElementById('login-card-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 80);
  };

  const handleLogout = async () => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    setUser(null);
    await logOut();
    setView('login');
  };

  return (
    <>
      <style>{`
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-track { background: ${isLightMode ? '#e9e2d2' : '#040a14'}; }
      *::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #c9a45c, #8a6d33);
        border-radius: 8px;
        border: 2px solid ${isLightMode ? '#e9e2d2' : '#040a14'};
      }
      *::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #d9bb7c, #9a7c3c); }
      *::-webkit-scrollbar-corner { background: ${isLightMode ? '#e9e2d2' : '#040a14'}; }
      * { scrollbar-width: thin; scrollbar-color: #c9a45c ${isLightMode ? '#e9e2d2' : '#040a14'}; }
      html { scroll-behavior: smooth; }
      @keyframes navDropIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      .nav-drop-in { animation: navDropIn 0.22s ease-out; }
      @keyframes navFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .nav-fade-in { animation: navFadeIn 0.2s ease-out; }
      @keyframes navSlideIn { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
      .nav-slide-in { animation: navSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    `}</style>
      <nav className={`fixed top-2 left-0 right-0 z-50 border-b-2 transition-all duration-300 ${isLightMode ? 'border-[#dfd2be]' : 'border-brown'} ${scrolled ? (isLightMode ? 'bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.12)]' : 'bg-brown-deep/95 shadow-[0_8px_30px_rgba(0,0,0,0.45)]') : (isLightMode ? 'bg-white/85' : 'bg-brown-deep/85')} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleLinkClick('home')}
            className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
          >
            <span className="font-serif tracking-[0.18em] uppercase text-sm md:text-base font-bold text-[#c9a45c] hover:text-[#e6cd94] transition-colors drop-shadow-[0_0_14px_rgba(201,164,92,0.35)]">
              Friend AI
            </span>
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {/* Home */}
            <button
              onClick={() => handleLinkClick('home')}
              className={`group relative flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#c9a45c]' : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-slate-300 hover:text-white')
                }`}
            >
              <span className={`absolute left-3.5 right-3.5 bottom-0 h-[2px] rounded-full bg-[#c9a45c] transition-transform duration-300 origin-left ${currentView === 'home' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              Home
            </button>
            <span className={`select-none ${isLightMode ? 'text-stone-400' : 'text-slate-700'}`}>·</span>

            {/* Features Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                className={`group relative flex items-center gap-1 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${abilities.some(a => a.id === currentView) ? 'text-[#c9a45c]' : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-slate-300 hover:text-white')
                  }`}
              >
                <span className={`absolute left-3.5 right-3.5 bottom-0 h-[2px] rounded-full bg-[#c9a45c] transition-transform duration-300 origin-left ${abilities.some(a => a.id === currentView) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                Features
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Container */}
              {desktopDropdownOpen && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[460px] max-h-[480px] overflow-y-auto rounded-2xl border border-[#c9a45c]/25 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] nav-drop-in grid grid-cols-2 gap-2 z-50 scrollbar-none ${isLightMode ? 'bg-[#faf6ec]' : 'bg-[#07131c]'}`}>
                  <div className="col-span-2 pb-2.5 mb-2 border-b border-[#c9a45c]/15 flex justify-between items-center">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c] font-bold">App Abilities &amp; Tools</span>
                    <span className="text-[8px] font-mono text-slate-500">Select any module</span>
                  </div>
                  {abilities.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleLinkClick(item.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer ${isActive
                          ? `bg-[#c9a45c]/10 border-[#c9a45c]/30 ${isLightMode ? 'text-stone-900' : 'text-white'}`
                          : `${isLightMode ? 'hover:bg-black/5 hover:border-stone-300 text-stone-600' : 'hover:bg-white/5 hover:border-white/10 text-slate-300'}`
                          }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isActive ? 'bg-[#c9a45c]/20 text-[#c9a45c]' : (isLightMode ? 'bg-black/5 text-stone-500' : 'bg-white/5 text-slate-400')}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className={`block text-xs font-serif font-bold tracking-wide ${isLightMode ? 'text-stone-900' : 'text-white'}`}>{item.label}</span>
                          <span className={`block text-[9px] mt-0.5 leading-normal ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>{item.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span className={`select-none ${isLightMode ? 'text-stone-400' : 'text-slate-700'}`}>·</span>

            {/* Team */}
            <button
              onClick={() => handleLinkClick('team')}
              className={`group relative flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${currentView === 'team' ? 'text-[#c9a45c]' : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-slate-300 hover:text-white')
                }`}
            >
              <span className={`absolute left-3.5 right-3.5 bottom-0 h-[2px] rounded-full bg-[#c9a45c] transition-transform duration-300 origin-left ${currentView === 'team' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              Team
            </button>
            <span className={`select-none ${isLightMode ? 'text-stone-400' : 'text-slate-700'}`}>·</span>

            {/* Games */}
            <button
              onClick={() => handleLinkClick('games')}
              className={`group relative flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${currentView === 'games' ? 'text-[#c9a45c]' : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-slate-300 hover:text-white')
                }`}
              title="Games & Fun Corner"
            >
              <span className={`absolute left-3.5 right-3.5 bottom-0 h-[2px] rounded-full bg-[#c9a45c] transition-transform duration-300 origin-left ${currentView === 'games' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              Games 🎮
            </button>
            <span className={`select-none ${isLightMode ? 'text-stone-400' : 'text-slate-700'}`}>·</span>

            {/* Vision & Mission */}
            <button
              onClick={() => handleLinkClick('vision-mission')}
              className={`group relative flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${currentView === 'vision-mission' ? 'text-[#c9a45c]' : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-slate-300 hover:text-white')
                }`}
            >
              <span className={`absolute left-3.5 right-3.5 bottom-0 h-[2px] rounded-full bg-[#c9a45c] transition-transform duration-300 origin-left ${currentView === 'vision-mission' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              Vision &amp; Mission
            </button>
          </div>

          {/* Right side: Sign-In + Sidebar toggle */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <button
                onClick={() => handleLinkClick('login')}
                className={`hidden md:flex items-center gap-2.5 p-1.5 rounded-xl transition-all text-left cursor-pointer ${isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}
                title="View Profile & Clinical Safety Brief"
              >
                <div className="flex flex-col items-end shrink-0 select-none">
                  <span className={`text-[10px] font-mono font-bold ${isLightMode ? 'text-stone-700' : 'text-slate-300'}`}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] font-mono text-[#c9a45c] tracking-wider uppercase font-bold">
                    Connected
                  </span>
                </div>
                <img
                  src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-[#c9a45c] object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ) : (
              <button
                onClick={() => handleLinkClick('login')}
                title="Sign In / Login Page & Clinical Safety Brief"
                className="inline-flex font-serif text-[10px] tracking-[0.14em] uppercase text-white bg-amber-600 hover:bg-amber-500 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_18px_rgba(217,119,6,0.35)] ring-1 ring-amber-400/30 hover:ring-amber-400/60 hover:scale-[1.03] cursor-pointer items-center gap-2"
              >
                🔑 Sign In
              </button>
            )}

            {/* Sidebar toggle (all screens) */}
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open Menu"
              className={`flex items-center gap-2 p-2.5 rounded-xl border border-[#c9a45c]/25 bg-[#c9a45c]/10 text-[#c9a45c] hover:bg-[#c9a45c]/20 transition-all cursor-pointer ${isLightMode ? 'hover:text-stone-900 hover:border-[#c9a45c]/60' : 'hover:text-white hover:border-[#c9a45c]/60'}`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-[0.12em] font-bold">Menu</span>
            </button>

            {/* Mobile nav-links hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 focus:outline-none ${isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-white/70 hover:text-white'}`}
              title="Page Links"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer (page links) */}
        {mobileMenuOpen && (
          <div className={`md:hidden backdrop-blur-xl border-b px-6 pt-4 pb-6 space-y-3 max-h-[calc(100vh-88px)] overflow-y-auto ${isLightMode ? 'bg-white/95 border-[#dfd2be]' : 'bg-[#03070f]/95 border-brown'}`}>
            <div className="flex flex-col space-y-3 text-left">
              <button
                onClick={() => handleLinkClick('home')}
                className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${currentView === 'home' ? (isLightMode ? 'text-indigo-600' : 'text-periwinkle') : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-sage hover:text-white')
                  }`}
              >
                Home
              </button>

              {/* Features Accordion */}
              <div className={`border-y py-2 ${isLightMode ? 'border-stone-300' : 'border-brown/40'}`}>
                <button
                  onClick={() => setMobileAccordionOpen(!mobileAccordionOpen)}
                  className={`flex items-center justify-between text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${abilities.some(a => a.id === currentView) ? (isLightMode ? 'text-indigo-600' : 'text-periwinkle') : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-sage hover:text-white')
                    }`}
                >
                  <span>Features Abilities</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileAccordionOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileAccordionOpen && (
                  <div className="grid grid-cols-1 gap-2 pl-4 mt-2">
                    {abilities.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleLinkClick(item.id)}
                          className={`flex items-center gap-3 py-2 text-left text-xs tracking-wide transition-colors cursor-pointer ${isActive ? (isLightMode ? 'text-indigo-600 font-bold' : 'text-periwinkle font-bold') : (isLightMode ? 'text-stone-500 hover:text-stone-800' : 'text-slate-400 hover:text-white')
                            }`}
                        >
                          <Icon className="w-4 h-4 text-[#c9a45c] shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Team */}
              <button
                onClick={() => handleLinkClick('team')}
                className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${currentView === 'team' ? (isLightMode ? 'text-indigo-600' : 'text-periwinkle') : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-sage hover:text-white')
                  }`}
              >
                Team
              </button>

              {/* Games */}
              <button
                onClick={() => handleLinkClick('games')}
                className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${currentView === 'games' ? (isLightMode ? 'text-indigo-600' : 'text-periwinkle') : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-sage hover:text-white')
                  }`}
              >
                Games 🎮
              </button>

              {/* Vision & Mission */}
              <button
                onClick={() => handleLinkClick('vision-mission')}
                className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${currentView === 'vision-mission' ? (isLightMode ? 'text-indigo-600' : 'text-periwinkle') : (isLightMode ? 'text-stone-600 hover:text-stone-900' : 'text-sage hover:text-white')
                  }`}
              >
                Vision &amp; Mission
              </button>

              {/* Quick Actions */}
              <div className={`pt-4 border-t flex flex-col gap-2 ${isLightMode ? 'border-stone-300' : 'border-brown'}`}>
                <button
                  onClick={() => handleLinkClick('login')}
                  className={`w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase border py-3 rounded-xl font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${isLightMode ? 'text-amber-700 bg-amber-100 border-amber-400/50' : 'text-amber-300 bg-amber-900/40 border-amber-500/40'}`}
                >
                  🔑 {user ? 'My Profile' : 'Sign In / Login'}
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase text-white bg-periwinkle-dark py-3 rounded-xl font-bold hover:bg-periwinkle-hover transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sliders className="w-4 h-4" /> Open Settings Menu
                </button>
                <button
                  onClick={() => handleLinkClick('chat')}
                  className="w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase text-white bg-periwinkle-dark py-3 rounded-xl font-bold hover:bg-periwinkle-hover transition-all duration-300 cursor-pointer"
                >
                  Start Chatting
                </button>
              </div>
            </div>
          </div>
        )}

    </nav>

    {/* Sidebar (slidebar) Drawer — kept OUTSIDE <nav> because the navbar's backdrop-filter
        would otherwise turn position:fixed into a containing block and squash the drawer
        to the nav bar's height */}
    {sidebarOpen && (
      <div className="fixed inset-0 z-[60]">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm nav-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
            <aside
              ref={sidebarRef}
              className={`absolute right-0 top-0 h-full w-[320px] max-w-[88vw] overflow-y-auto border-l-2 nav-slide-in ${isLightMode ? 'bg-[#faf6ec] border-[#dfd2be] text-slate-800' : 'bg-[#040a14] border-[#c9a45c]/20 text-white'
                }`}
            >
              {/* Sidebar Header */}
              <div className={`flex items-center justify-between px-6 py-5 border-b ${isLightMode ? 'border-[#dfd2be]' : 'border-white/10'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a45c] shadow-[0_0_8px_rgba(201,164,92,0.9)]" />
                  <Sliders className="w-4 h-4 text-[#c9a45c]" />
                  <span className="font-serif text-sm font-bold uppercase tracking-[0.18em] text-[#c9a45c]">
                    Sanctuary Menu
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Close Menu"
                  className={`flex items-center gap-2 p-2.5 rounded-xl border border-[#c9a45c]/25 bg-[#c9a45c]/10 text-[#c9a45c] hover:bg-[#c9a45c]/20 transition-all cursor-pointer ${isLightMode ? 'hover:text-stone-900 hover:border-[#c9a45c]/60' : 'hover:text-white hover:border-[#c9a45c]/60'}`}
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-[0.12em] font-bold">Close</span>
                </button>
              </div>

              <div className="p-4 space-y-2">
                {/* User Profile */}
                <button
                  onClick={() => handleLinkClick('login')}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${isLightMode
                    ? 'bg-white/70 border-[#dfd2be] hover:border-[#c9a45c]/60'
                    : 'bg-white/5 border-white/10 hover:border-[#c9a45c]/50 hover:bg-white/10 hover:translate-x-[2px] active:scale-[0.99]'
                    }`}
                  title="View Profile & Clinical Safety Brief"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-[#c9a45c] object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-[#c9a45c] bg-[#c9a45c]/15 flex items-center justify-center shrink-0">
                      <CircleUser className="w-5 h-5 text-[#c9a45c]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`block text-xs font-serif font-bold truncate ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      {user ? (user.displayName || user.email?.split('@')[0]) : 'Guest Explorer'}
                    </span>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[#c9a45c] font-bold">
                      {user ? 'Connected' : 'Sign in to sync'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-auto opacity-40 -rotate-90" />
                </button>

                {/* Sound (Ambient Soundscape) */}
                <div className={`w-fit rounded-xl border overflow-hidden transition-all ${isLightMode ? 'bg-white/70 border-[#dfd2be]' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex items-center gap-2 p-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${ambientPlaying ? 'bg-[#c9a45c]/20 text-[#c9a45c]' : 'bg-white/5 text-slate-400'}`}>
                      {ambientPlaying ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </div>
                    <button
                      role="switch"
                      aria-checked={ambientPlaying}
                      onClick={() => ambientEngine.toggle(selectedCharId)}
                      className={`relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer ${ambientPlaying ? 'bg-[#c9a45c]' : 'bg-slate-600/50'}`}
                      title={ambientPlaying ? 'Turn off Ambient Soundscape' : 'Turn on Ambient Soundscape'}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-300 ${ambientPlaying ? 'translate-x-4' : ''}`} />
                    </button>
                    <button
                      onClick={() => setSidebarSoundOpen(!sidebarSoundOpen)}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-auto"
                      title={sidebarSoundOpen ? 'Collapse settings' : 'Expand settings'}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-300 ${sidebarSoundOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {sidebarSoundOpen && (
                    <div className={`w-[240px] px-3 pb-3 pt-1 space-y-3 border-t ${isLightMode ? 'border-[#dfd2be]' : 'border-white/10'}`}>
                      <div className="p-3 rounded-xl border border-white/10 bg-black/10">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c] font-bold block mb-1">
                          <Volume2 className="w-3 h-3 inline mr-1" /> Device Volume
                        </span>
                        <p className="text-[10px] opacity-70 leading-normal">
                          Volume is controlled by your device volume buttons.
                        </p>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        <span className={`text-[9px] font-mono uppercase tracking-wider block ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          Tune by Archetype:
                        </span>
                        {CHARACTERS.map((char) => {
                          const isSelected = char.id === ambientArchetype;
                          return (
                            <button
                              key={char.id}
                              onClick={() => {
                                if (setSelectedCharId) setSelectedCharId(char.id);
                                ambientEngine.setArchetype(char.id);
                                if (!ambientPlaying) ambientEngine.start();
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${isSelected
                                ? `bg-[#c9a45c]/20 border-[#c9a45c]/50 font-bold ${isLightMode ? 'text-amber-700' : 'text-white'}`
                                : (isLightMode ? 'bg-black/5 border-stone-300 hover:bg-stone-200 text-slate-700' : 'bg-black/10 border-white/5 hover:bg-white/5 text-slate-300')
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[#c9a45c]' : 'bg-slate-600'}`} />
                                <span className="text-xs font-serif truncate">{char.name} {char.alias ? `(${char.alias})` : ''}</span>
                              </div>
                              <span className="text-[9px] font-mono opacity-60 uppercase shrink-0">{char.badge}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => ambientEngine.toggle(selectedCharId)}
                        className={`w-full py-2 rounded-xl font-serif text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${ambientPlaying
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                          : 'bg-[#c9a45c] text-stone-950 hover:bg-[#c9a45c]/90'
                          }`}
                      >
                        {ambientPlaying ? 'Pause Ambiance' : 'Start Ambiance'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme */}
                {setIsLightMode && (
                  <div className={`w-fit rounded-xl border overflow-hidden transition-all ${isLightMode ? 'bg-white/70 border-[#dfd2be]' : 'bg-white/5 border-white/10'
                    }`}>
                    <div className="flex items-center gap-2 p-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isLightMode ? 'bg-amber-500/15 text-amber-600' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                      </div>
                      <button
                        role="switch"
                        aria-checked={isLightMode}
                        onClick={() => setIsLightMode(!isLightMode)}
                        className={`relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer ${isLightMode ? 'bg-[#c9a45c]' : 'bg-slate-600/50'}`}
                        title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-300 ${isLightMode ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Connected */}
                <button
                  onClick={() => handleLinkClick('login')}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${isLightMode
                    ? 'bg-white/70 border-[#dfd2be] hover:border-[#c9a45c]/60'
                    : 'bg-white/5 border-white/10 hover:border-[#c9a45c]/50 hover:bg-white/10'
                    }`}
                  title="Connection status & profile"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${user ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className={`block text-xs font-serif font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    {user ? 'Connected' : 'Guest'}
                  </span>
                  <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold font-mono shrink-0 ${user ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-500/20 text-slate-400'}`}>
                    {user ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </button>

                {/* Contribute */}
                <button
                  onClick={() => handleLinkClick('waitlist')}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${isLightMode
                    ? 'bg-white/70 border-[#dfd2be] hover:border-[#c9a45c]/60'
                    : 'bg-white/5 border-white/10 hover:border-[#c9a45c]/50 hover:bg-white/10 hover:translate-x-[2px] active:scale-[0.99]'
                    }`}
                >
                  <div className="p-2 rounded-xl shrink-0 bg-[#c9a45c]/15 text-[#c9a45c]">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className={`block text-xs font-serif font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      Contribute
                    </span>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      Join the waitlist 🏛️
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 opacity-40 -rotate-90" />
                </button>

                {/* Terms & Policy */}
                <button
                  onClick={() => handleLinkClick('policy')}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${isLightMode
                    ? 'bg-white/70 border-[#dfd2be] hover:border-[#c9a45c]/60'
                    : 'bg-white/5 border-white/10 hover:border-[#c9a45c]/50 hover:bg-white/10 hover:translate-x-[2px] active:scale-[0.99]'
                    }`}
                >
                  <div className="p-2 rounded-xl shrink-0 bg-blue-500/15 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className={`block text-xs font-serif font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      Terms &amp; Policy
                    </span>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      GDPR &amp; Clinical Safety Brief
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 opacity-40 -rotate-90" />
                </button>
              </div>

              {/* Log Out (pinned to bottom) */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${isLightMode
                    ? 'bg-red-500/5 border-red-200 hover:border-red-400'
                    : 'bg-red-950/20 border-red-500/20 hover:border-red-500/50 hover:bg-red-950/40'
                    }`}
                >
                  <div className="p-1.5 rounded-lg shrink-0 bg-red-500/15 text-red-400">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="block text-xs font-serif font-bold text-red-400">
                    {user ? 'Log Out' : 'Sign In'}
                  </span>
                </button>
              </div>

              {/* Sidebar Footer */}
              <div className={`px-6 py-4 border-t ${isLightMode ? 'border-[#dfd2be]' : 'border-white/10'}`}>
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 text-center">
                  Friend AI · Your Digital Sanctuary
                </p>
              </div>
            </aside>
      </div>
    )}
    </>
  );
}