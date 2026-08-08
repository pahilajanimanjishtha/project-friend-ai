import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { 
  Menu, X, Sparkles, Layout, MessageSquare, Presentation, User, Sun, Moon, 
  PenTool, Music, ChevronDown, BarChart3, Mail, Users, HeartPulse, 
  ShieldCheck, BookOpen, Cloud, Pill, Video, Volume2, VolumeX, Headphones, Sliders, TrendingUp, StickyNote
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambient Audio Controller States
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(ambientEngine.getIsPlaying());
  const [ambientArchetype, setAmbientArchetype] = useState<string>(selectedCharId || ambientEngine.getCurrentArchetypeId());
  const [audioPopoverOpen, setAudioPopoverOpen] = useState<boolean>(false);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const audioPopoverRef = useRef<HTMLDivElement>(null);

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
      if (audioPopoverRef.current && !audioPopoverRef.current.contains(event.target as Node)) {
        setAudioPopoverOpen(false);
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

  const abilities = [
    { id: 'chat', label: 'Private Chat Buddy', icon: MessageSquare, description: 'Talk about your feelings in a private space' },
    { id: 'pantheon', label: '12 Friendly Guides', icon: Sparkles, description: 'Meet the 12 companion guides and stories' },
    { id: 'oracle', label: 'Oracle Soul Card', icon: User, description: 'Create your custom companion tarot profile' },
    { id: 'journal', label: 'Happy Diary', icon: PenTool, description: 'Write down what happened today' },
    { id: 'mood', label: 'Feeling Chart', icon: BarChart3, description: 'Color tracking for your moods and energy' },
    { id: 'slow', label: 'Slow Letters', icon: Mail, description: 'Send and receive letters that arrive slowly' },
    { id: 'community', label: 'Friendly Circle', icon: Users, description: 'Meet companion guides in a quiet circle' },
    { id: 'wellness', label: 'Breathe & Relax', icon: HeartPulse, description: 'Deep breathing loop with moving circles' },
    { id: 'clinical', label: 'Helper Friends', icon: ShieldCheck, description: 'Emergency website & helpline directories' },
    { id: 'blog', label: 'Happy Brain Stories', icon: BookOpen, description: 'Neurological science and story scrolls' },
    { id: 'sync', label: 'Workspace Hub', icon: Cloud, description: 'Spawn Meets, save Drive diaries, & draft emails' },
    { id: 'notes', label: 'Notes Sync (Keep)', icon: StickyNote, description: 'View, create, & sync personal Keep notes to Drive' },
    { id: 'music', label: 'Happy Music Maker', icon: Music, description: 'Compose word-based magical songs' },
    { id: 'prescription', label: 'Prescription Analyzer', icon: Pill, description: 'Scan medicine packages for calm insights' },
    { id: 'videosanctuary', label: 'Video Sanctuary', icon: Video, description: 'Somatic natural breathing video guides' },
    { id: 'churn', label: 'Churn & Revenue Insights', icon: TrendingUp, description: 'MRR tracking, churn drivers, & retention cohorts' },
    { id: 'pitch', label: 'Investor Pitch Deck', icon: Presentation, description: 'Sanctuary pitch deck & clinical model' },
    { id: 'admin', label: 'Admin Console', icon: Sliders, description: 'Admin metrics, waitlist & server broadcast' },
    { id: 'policy', label: 'Terms & Privacy Policy', icon: ShieldCheck, description: 'GDPR Article 22 & Clinical Safety Brief' },
  ];

  const handleLinkClick = (viewId: string) => {
    setView(viewId);
    setDesktopDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileAccordionOpen(false);

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-brown bg-brown-deep/85 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
        >
          <span className="font-serif tracking-[0.16em] uppercase text-sm md:text-base font-bold text-periwinkle hover:opacity-80 transition-opacity">
            Friend AI <span className="text-white/40 font-sans font-light">✦</span>
          </span>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {/* Home */}
          <button
            onClick={() => handleLinkClick('home')}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
              currentView === 'home' ? 'text-periwinkle' : 'text-sage hover:text-white'
            }`}
          >
            Home
          </button>

          {/* Features Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
              className={`flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                abilities.some(a => a.id === currentView) ? 'text-periwinkle' : 'text-sage hover:text-white'
              }`}
            >
              Features
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Container */}
            {desktopDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[460px] max-h-[480px] overflow-y-auto rounded-2xl border-2 border-brown bg-[#0a0f1d] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-fadeIn grid grid-cols-2 gap-2 z-50 scrollbar-none">
                <div className="col-span-2 pb-2 mb-1 border-b border-white/5 flex justify-between items-center">
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
                      className={`flex items-start gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-periwinkle/10 border-periwinkle/30 text-white' 
                          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-periwinkle/20 text-periwinkle' : 'bg-white/5 text-[#c9a45c]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block text-xs font-serif font-bold tracking-wide text-white">{item.label}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 leading-normal">{item.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vision & Mission */}
          <button
            onClick={() => handleLinkClick('vision-mission')}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
              currentView === 'vision-mission' ? 'text-periwinkle' : 'text-sage hover:text-white'
            }`}
          >
            Vision &amp; Mission
          </button>

          {/* Team */}
          <button
            onClick={() => handleLinkClick('team')}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
              currentView === 'team' ? 'text-periwinkle' : 'text-sage hover:text-white'
            }`}
          >
            Team
          </button>

          {/* Terms & Privacy */}
          <button
            onClick={() => handleLinkClick('policy')}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
              currentView === 'policy' ? 'text-periwinkle' : 'text-sage hover:text-white'
            }`}
          >
            Terms &amp; Policy
          </button>

          {/* Contribute Waitlist */}
          <button
            onClick={() => handleLinkClick('waitlist')}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
              currentView === 'waitlist' ? 'text-[#c9a45c] font-extrabold' : 'text-[#c9a45c]/80 hover:text-[#c9a45c]'
            }`}
          >
            Contribute 🏛️
          </button>
        </div>

        {/* CTA & Panic escape */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Ambient Soundscape Toggle */}
          <div className="relative" ref={audioPopoverRef}>
            <button
              onClick={() => {
                const nextState = ambientEngine.toggle(selectedCharId);
                setAudioPopoverOpen(nextState);
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                ambientPlaying
                  ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] shadow-[0_0_15px_rgba(201,164,92,0.3)]'
                  : isLightMode
                  ? 'bg-[#eae4d3] text-stone-600 border-[#dfd2be] hover:bg-[#dfd2be]/50'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              title={ambientPlaying ? "Ambient Sound Active (Click for soundscape settings)" : "Turn On Ambient Soundscape"}
            >
              {ambientPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#c9a45c] animate-pulse" />
                  <span className="text-[10px] font-serif font-bold uppercase tracking-wider hidden lg:inline text-[#c9a45c]">
                    Ambiance
                  </span>
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#c9a45c] animate-[ping_1.2s_infinite_100ms] h-full rounded-full" />
                    <span className="w-0.5 bg-[#c9a45c] animate-[ping_1.2s_infinite_300ms] h-2/3 rounded-full" />
                    <span className="w-0.5 bg-[#c9a45c] animate-[ping_1.2s_infinite_200ms] h-5/6 rounded-full" />
                  </div>
                </>
              ) : (
                <VolumeX className="w-4 h-4 opacity-70" />
              )}
            </button>

            {/* Audio Popover Dropdown */}
            {audioPopoverOpen && (
              <div className={`absolute right-0 mt-3 w-80 rounded-2xl p-4 border shadow-2xl z-50 transition-all ${
                isLightMode 
                  ? 'bg-white border-stone-200 text-slate-800' 
                  : 'bg-[#0f172a] border-white/15 text-slate-100 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#c9a45c]" />
                    <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#c9a45c]">
                      Ambient Soundscape
                    </span>
                  </div>
                  <button 
                    onClick={() => setAudioPopoverOpen(false)}
                    className="text-xs opacity-50 hover:opacity-100 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Active Soundscape Badge */}
                {(() => {
                  const profile = ambientEngine.getCurrentProfile();
                  return (
                    <div className={`p-3 rounded-xl border mb-3 ${
                      ambientPlaying 
                        ? 'bg-[#c9a45c]/10 border-[#c9a45c]/30' 
                        : 'bg-black/20 border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] font-bold">
                          Archetype Ambiance
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                          ambientPlaying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-stone-500/20 text-slate-400'
                        }`}>
                          {ambientPlaying ? 'ACTIVE 🎵' : 'PAUSED'}
                        </span>
                      </div>
                      <h4 className="font-serif text-xs font-bold text-white leading-tight">
                        {profile.title}
                      </h4>
                      <p className="text-[10px] opacity-70 mt-1 leading-normal">
                        {profile.subtitle}
                      </p>
                    </div>
                  );
                })()}

                {/* Volume Slider */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-[#c9a45c]" /> Volume
                    </span>
                    <span>{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={ambientVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAmbientVolume(val);
                      ambientEngine.setVolume(val);
                    }}
                    className="w-full accent-[#c9a45c] cursor-pointer"
                  />
                </div>

                {/* Quick Archetype Selector for Soundscape preview */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Tune Ambiance by Archetype:
                  </span>
                  {CHARACTERS.map((char) => {
                    const isSelected = char.id === ambientArchetype;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          if (setSelectedCharId) setSelectedCharId(char.id);
                          ambientEngine.setArchetype(char.id);
                          if (!ambientPlaying) {
                            ambientEngine.start();
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#c9a45c]/20 border-[#c9a45c]/50 text-white font-bold'
                            : 'bg-black/10 border-white/5 hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#c9a45c]' : 'bg-slate-600'}`} />
                          <span className="text-xs font-serif">{char.name} ({char.alias})</span>
                        </div>
                        <span className="text-[9px] font-mono opacity-60 uppercase">{char.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Play / Stop Master Toggle */}
                <button
                  onClick={() => ambientEngine.toggle(selectedCharId)}
                  className={`w-full mt-3 py-2 rounded-xl font-serif text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    ambientPlaying
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-[#c9a45c] text-stone-950 hover:bg-[#c9a45c]/90'
                  }`}
                >
                  {ambientPlaying ? 'Pause Ambiance' : 'Start Ambiance'}
                </button>
              </div>
            )}
          </div>

          {setIsLightMode && (
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isLightMode ? 'bg-[#eae4d3] text-amber-600 border-[#dfd2be] hover:bg-[#dfd2be]/50' : 'bg-white/5 text-yellow-400 border-white/10 hover:bg-white/10'}`}
              title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLightMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
          )}
          <button
            onClick={() => handleLinkClick('decoy')}
            className="font-serif text-[10px] tracking-[0.12em] uppercase text-[#e07070] border border-[#e07070]/30 hover:border-[#e07070] px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
            title="Instant Safe Exit"
          >
            Secret Escape 🚪
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleLinkClick('login')}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-all text-left cursor-pointer"
                title="View Profile & Clinical Safety Brief"
              >
                <div className="flex flex-col items-end shrink-0 select-none">
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] font-mono text-[#c9a45c] tracking-wider uppercase font-bold">
                    Connected ✦
                  </span>
                </div>
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-[#c9a45c] object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
              <button
                onClick={async () => {
                  setUser(null);
                  await logOut();
                  setView('login');
                }}
                title="Log Out of Sanctuary"
                className="font-serif text-[10px] tracking-[0.12em] uppercase text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleLinkClick('login')}
              title="Sign In / Login Page & Clinical Safety Brief"
              className="font-serif text-[10px] tracking-[0.12em] uppercase text-white bg-amber-600 hover:bg-amber-700 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              🔑 Sign In / Login
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/70 hover:text-white p-2 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#03070f]/95 backdrop-blur-xl border-b border-brown px-6 pt-4 pb-6 space-y-3">
          <div className="flex flex-col space-y-3 text-left">
            <button
              onClick={() => handleLinkClick('home')}
              className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-periwinkle' : 'text-sage hover:text-white'
              }`}
            >
              Home
            </button>

            {/* Features Accordion */}
            <div className="border-y border-brown/40 py-2">
              <button
                onClick={() => setMobileAccordionOpen(!mobileAccordionOpen)}
                className={`flex items-center justify-between text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                  abilities.some(a => a.id === currentView) ? 'text-periwinkle' : 'text-sage hover:text-white'
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
                        className={`flex items-center gap-3 py-2 text-left text-xs tracking-wide transition-colors cursor-pointer ${
                          isActive ? 'text-periwinkle font-bold' : 'text-slate-400 hover:text-white'
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

            {/* Vision & Mission Link */}
            <button
              onClick={() => handleLinkClick('vision-mission')}
              className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                currentView === 'vision-mission' ? 'text-periwinkle' : 'text-sage hover:text-white'
              }`}
            >
              Vision &amp; Mission
            </button>

            {/* Team Link */}
            <button
              onClick={() => handleLinkClick('team')}
              className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                currentView === 'team' ? 'text-periwinkle' : 'text-sage hover:text-white'
              }`}
            >
              Team
            </button>

            {/* Terms & Policy Link */}
            <button
              onClick={() => handleLinkClick('policy')}
              className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                currentView === 'policy' ? 'text-periwinkle' : 'text-sage hover:text-white'
              }`}
            >
              Terms &amp; Policy
            </button>

            {/* Contribute Link */}
            <button
              onClick={() => handleLinkClick('waitlist')}
              className={`flex items-center gap-3 text-left w-full py-2 text-xs uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer ${
                currentView === 'waitlist' ? 'text-[#c9a45c] font-bold' : 'text-[#c9a45c]/85 hover:text-[#c9a45c]'
              }`}
            >
              Contribute 🏛️
            </button>
            
            {/* Quick Actions */}
            <div className="pt-4 border-t border-brown flex flex-col gap-2">
              <button
                onClick={() => {
                  ambientEngine.toggle(selectedCharId);
                }}
                className={`w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  ambientPlaying 
                    ? 'bg-[#c9a45c]/20 text-[#c9a45c] border border-[#c9a45c] font-bold shadow-[0_0_15px_rgba(201,164,92,0.2)]'
                    : isLightMode 
                    ? 'bg-[#eae4d3] text-stone-700 border border-[#dfd2be]' 
                    : 'bg-white/5 text-slate-300 border border-white/10'
                }`}
              >
                {ambientPlaying ? (
                  <><Volume2 className="w-4 h-4 text-[#c9a45c] animate-pulse" /> Ambiance Active 🎵</>
                ) : (
                  <><VolumeX className="w-4 h-4 opacity-70" /> Enable Archetype Sound</>
                )}
              </button>

              {setIsLightMode && (
                <button
                  onClick={() => {
                    setIsLightMode(!isLightMode);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${isLightMode ? 'bg-[#eae4d3] text-amber-600 border border-[#dfd2be]' : 'bg-white/5 text-yellow-400 border border-white/10'}`}
                >
                  {isLightMode ? (
                    <><Moon className="w-4 h-4" /> Dark Mode</>
                  ) : (
                    <><Sun className="w-4 h-4" /> Light Mode</>
                  )}
                </button>
              )}
              {user ? (
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    setUser(null);
                    await logOut();
                    setView('login');
                  }}
                  className="w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase text-red-400 bg-red-950/40 border border-red-500/40 py-3 rounded-xl font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  Log Out of Sanctuary
                </button>
              ) : (
                <button
                  onClick={() => handleLinkClick('login')}
                  className="w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase text-amber-300 bg-amber-900/40 border border-amber-500/40 py-3 rounded-xl font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  🔑 Sign In / Login Page &amp; Disclaimer
                </button>
              )}
              <button
                onClick={() => handleLinkClick('decoy')}
                className="w-full font-serif text-[11px] text-center tracking-[0.14em] uppercase text-[#e07070] border border-[#e07070]/30 py-3 rounded-xl transition-all duration-300 cursor-pointer"
              >
                ⚠️ Secret Escape 🚪
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
  );
}
