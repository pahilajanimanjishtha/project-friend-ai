import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Navigation from './components/Navigation';
import Starfield from './components/Starfield';
import Home from './components/Home';
import PantheonGrid from './components/PantheonGrid';
import ChatSanctuary from './components/ChatSanctuary';
import PitchDeck from './components/PitchDeck';
import DecoyWiki from './components/DecoyWiki';
import OracleProfileCreator from './components/OracleProfileCreator';
import SanctuaryTools from './components/SanctuaryTools';
import MusicGenerator from './components/MusicGenerator';
import AdminPanel from './components/AdminPanel';
import TonyFloatingChat from './components/TonyFloatingChat';
import VisionMission from './components/VisionMission';
import Team from './components/Team';
import Waitlist from './components/Waitlist';
import PrivacyPolicy from './components/PrivacyPolicy';
import ChurnDashboard from './components/ChurnDashboard';
import LoginPage from './components/LoginPage';
import { ambientEngine } from './lib/ambientAudioEngine';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';

interface OracleProfile {
  name: string;
  dob: string;
  deityId: string;
  intention: string;
  themeStyle: 'celestial' | 'ancient' | 'gold' | 'neon';
  stats: {
    respect: number;
    resilience: number;
    mindfulness: number;
    grounding: number;
  };
  cardImage: string;
  generatedAt: string;
}

export type ViewType =
  | 'home' 
  | 'pantheon' 
  | 'chat' 
  | 'pitch' 
  | 'decoy' 
  | 'oracle' 
  | 'journal' 
  | 'mood'
  | 'slow'
  | 'community'
  | 'wellness'
  | 'clinical'
  | 'blog'
  | 'sync'
  | 'prescription'
  | 'videosanctuary'
  | 'music' 
  | 'admin' 
  | 'vision-mission' 
  | 'team' 
  | 'waitlist' 
  | 'policy' 
  | 'churn'
  | 'login';

const getViewFromPath = (pathName: string): ViewType => {
  const cleanPath = pathName.toLowerCase().replace(/\/$/, '') || '/';
  switch (cleanPath) {
    case '/team':
      return 'team';
    case '/vision-mission':
    case '/vision':
      return 'vision-mission';
    case '/waitlist':
    case '/contribute':
      return 'waitlist';
    case '/policy':
    case '/terms':
    case '/privacy':
      return 'policy';
    case '/admin':
      return 'admin';
    case '/churn':
      return 'churn';
    case '/pantheon':
    case '/storyboard':
      return 'pantheon';
    case '/chat':
    case '/sanctuary':
      return 'chat';
    case '/oracle':
      return 'oracle';
    case '/journal':
      return 'journal';
    case '/mood':
      return 'mood';
    case '/slow':
      return 'slow';
    case '/community':
      return 'community';
    case '/wellness':
      return 'wellness';
    case '/clinical':
      return 'clinical';
    case '/blog':
      return 'blog';
    case '/sync':
      return 'sync';
    case '/prescription':
      return 'prescription';
    case '/videosanctuary':
    case '/video':
      return 'videosanctuary';
    case '/music':
      return 'music';
    case '/pitch':
    case '/deck':
      return 'pitch';
    case '/decoy':
    case '/wiki':
      return 'decoy';
    case '/login':
    case '/signin':
      return 'login';
    case '/':
    case '/home':
    default:
      return 'home';
  }
};

const getPathFromView = (v: ViewType): string => {
  switch (v) {
    case 'team': return '/team';
    case 'vision-mission': return '/vision-mission';
    case 'waitlist': return '/waitlist';
    case 'policy': return '/policy';
    case 'admin': return '/admin';
    case 'churn': return '/churn';
    case 'pantheon': return '/pantheon';
    case 'chat': return '/chat';
    case 'oracle': return '/oracle';
    case 'journal': return '/journal';
    case 'mood': return '/mood';
    case 'slow': return '/slow';
    case 'community': return '/community';
    case 'wellness': return '/wellness';
    case 'clinical': return '/clinical';
    case 'blog': return '/blog';
    case 'sync': return '/sync';
    case 'prescription': return '/prescription';
    case 'videosanctuary': return '/videosanctuary';
    case 'music': return '/music';
    case 'pitch': return '/pitch';
    case 'decoy': return '/decoy';
    case 'login': return '/login';
    case 'home':
    default:
      return '/';
  }
};

export default function App() {
  const [viewState, setViewState] = useState<ViewType>(() => getViewFromPath(window.location.pathname));

  const setView = (newView: ViewType | ((prev: ViewType) => ViewType)) => {
    setViewState((prev) => {
      const resolved = typeof newView === 'function' ? newView(prev) : newView;
      const targetPath = getPathFromView(resolved);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: resolved }, '', targetPath);
      }
      return resolved;
    });
  };

  useEffect(() => {
    const handlePopState = () => {
      const current = getViewFromPath(window.location.pathname);
      setViewState(current);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const view = viewState;
  const [selectedCharId, setSelectedCharId] = useState<string>('persephone-soul');
  const [savedProfile, setSavedProfile] = useState<OracleProfile | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  
  // Persistent Light/Dark Mode State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('isLightMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isLightMode', isLightMode.toString());
  }, [isLightMode]);

  // Firebase Auth & Local Auth State Listener
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthState = (currentUser: FirebaseUser | null) => {
      const savedDemo = localStorage.getItem('sanctuary_demo_google_user');
      const isAuthFlag = localStorage.getItem('sanctuary_user_authenticated') === 'true';

      if (!isAuthFlag) {
        setUser(null);
        setIsLoggedIn(false);
        setAuthLoading(false);
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        if (localStorage.getItem('extreme_crisis_flag') === 'true') {
          setView('clinical');
        }
      } else if (savedDemo) {
        try {
          const parsedDemo = JSON.parse(savedDemo);
          setUser(parsedDemo as FirebaseUser);
          setIsLoggedIn(true);
          if (localStorage.getItem('extreme_crisis_flag') === 'true') {
            setView('clinical');
          }
        } catch (e) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setAuthLoading(false);
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

  // Sync active character archetype with ambient sound engine
  useEffect(() => {
    if (selectedCharId) {
      ambientEngine.setArchetype(selectedCharId);
    }
  }, [selectedCharId]);

  // Fetch public config (e.g. administrative broadcast banners) on startup
  useEffect(() => {
    const fetchPublicConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.broadcastMessage) {
            setBroadcastMessage(data.broadcastMessage);
          }
        }
      } catch (err) {
        console.error('Failed to align remote celestial public configs', err);
      }
    };
    fetchPublicConfig();
  }, []);

  // Load saved profile on startup
  useEffect(() => {
    const stored = localStorage.getItem('oracleProfile');
    if (stored) {
      try {
        setSavedProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored oracle profile", e);
      }
    }
  }, []);

  const handleProfileSaved = (profile: OracleProfile) => {
    setSavedProfile(profile);
  };

  // If we are in decoy view, we render the Wikipedia page standalone to look 100% convincing
  if (view === 'decoy') {
    return <DecoyWiki setView={setView} setSelectedCharId={setSelectedCharId} />;
  }

  // Loading state while verifying auth
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-serif text-sm ${isLightMode ? 'bg-[#faf8f4] text-stone-800' : 'bg-[#03070f] text-stone-300'}`}>
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#c9a45c] mx-auto flex items-center justify-center text-black font-bold text-lg">
            Ω
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#c9a45c]">
            Verifying Sanctuary Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Check extreme crisis override
  const isExtremeCrisis = localStorage.getItem('extreme_crisis_flag') === 'true';
  const isPublicView = ['home', 'pantheon', 'vision-mission', 'team', 'policy', 'waitlist', 'decoy', 'login'].includes(view);
  const requiresAuth = !isLoggedIn || !user;

  // Active view determination
  let activeView = view;
  if (requiresAuth && !isPublicView) {
    activeView = 'login';
  } else if (isExtremeCrisis && view !== 'policy') {
    activeView = 'clinical';
  }

  return (
    <div className={`relative min-h-screen font-sans selection:bg-[#c9a45c]/30 selection:text-[#c9a45c] overflow-x-hidden transition-colors duration-500 ${isLightMode ? 'bg-[#faf8f4] text-slate-800' : 'bg-[#03070f] text-white'}`}>
      {/* Background twinkle */}
      {!isLightMode && <Starfield />}

      {/* Navigation Header */}
      <Navigation 
        currentView={activeView} 
        setView={setView} 
        isLightMode={isLightMode} 
        setIsLightMode={setIsLightMode} 
        selectedCharId={selectedCharId}
        setSelectedCharId={setSelectedCharId}
      />

      {/* Main Container */}
      <main className="relative z-10 pt-20 md:pt-24 pb-12">
        {activeView === 'home' && broadcastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-6 pt-8 pb-2"
          >
            <div className={`relative overflow-hidden p-4 rounded-2xl border-2 flex items-center justify-between gap-4 shadow-lg ${isLightMode ? 'bg-amber-50 border-[#c9a45c]/40 text-stone-950' : 'bg-[#0a120d]/90 border-[#c9a45c]/30 text-emerald-100'}`}>
              <div className="flex items-center gap-3 text-left">
                <span className="w-8 h-8 rounded-lg bg-[#c9a45c]/10 flex items-center justify-center text-[#c9a45c] shrink-0 text-base">
                  📜
                </span>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c] block font-bold">
                    Sacred Sanctuary Projections
                  </span>
                  <p className="font-serif text-xs leading-relaxed mt-0.5">
                    {broadcastMessage}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setBroadcastMessage('')}
                className="text-xs text-[#c9a45c] hover:text-[#c9a45c]/80 p-1 cursor-pointer font-mono font-bold"
                title="Dismiss Banner"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {activeView === 'home' && <Home setView={setView} isLightMode={isLightMode} />}
        {activeView === 'pantheon' && (
          <PantheonGrid setView={setView} setSelectedCharId={setSelectedCharId} isLightMode={isLightMode} />
        )}
        {activeView === 'chat' && (
          <ChatSanctuary selectedCharId={selectedCharId} setSelectedCharId={setSelectedCharId} isLightMode={isLightMode} />
        )}
        {activeView === 'oracle' && (
          <OracleProfileCreator onProfileSaved={handleProfileSaved} savedProfile={savedProfile} isLightMode={isLightMode} />
        )}
        {activeView === 'pitch' && <PitchDeck isLightMode={isLightMode} />}
        {['journal', 'mood', 'slow', 'community', 'wellness', 'clinical', 'blog', 'sync', 'prescription', 'videosanctuary'].includes(activeView) && (
          <div className="max-w-7xl mx-auto px-6 py-6 md:py-10">
            <SanctuaryTools 
              activeTool={activeView} 
              onClose={() => setView('home')} 
              isLightMode={isLightMode} 
              setView={setView} 
            />
          </div>
        )}
        {activeView === 'music' && (
          <MusicGenerator isLightMode={isLightMode} />
        )}
        {activeView === 'admin' && (
          <AdminPanel isLightMode={isLightMode} setView={setView} />
        )}
        {activeView === 'vision-mission' && (
          <VisionMission isLightMode={isLightMode} />
        )}
        {activeView === 'team' && (
          <Team isLightMode={isLightMode} />
        )}
        {activeView === 'waitlist' && (
          <Waitlist isLightMode={isLightMode} />
        )}
        {activeView === 'policy' && (
          <PrivacyPolicy isLightMode={isLightMode} setView={setView} />
        )}
        {activeView === 'churn' && (
          <ChurnDashboard isLightMode={isLightMode} />
        )}
        {activeView === 'login' && (
          <LoginPage 
            isLightMode={isLightMode} 
            setView={setView} 
            onLoginSuccess={(profile) => {
              setIsLoggedIn(true);
              localStorage.setItem('sanctuary_user_authenticated', 'true');
              const savedDemo = localStorage.getItem('sanctuary_demo_google_user');
              if (savedDemo) {
                try {
                  setUser(JSON.parse(savedDemo));
                } catch(e) {}
              }
              if (profile) setSavedProfile(profile);
              setView('home');
            }}
            savedProfile={savedProfile}
          />
        )}
      </main>

      {/* Quick Panic Escape Widget (Pandora's Box) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tony the Floating Dog Chatbot */}
        <TonyFloatingChat isLightMode={isLightMode} />

        <button
          onClick={() => setView('decoy')}
          title="Pandora's Box - Instant Safe Exit"
          className="flex items-center gap-2 font-serif text-[10px] tracking-[0.14em] uppercase text-white bg-brown-deep/90 border-2 border-[#e07070]/40 hover:border-[#e07070] px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.04] shadow-[0_0_20px_rgba(224,112,112,0.25)] cursor-pointer backdrop-blur-md"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#e07070] animate-pulse" />
          Pandora's Box
        </button>
      </div>

      {/* Small Ambient Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-[#03070f]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs text-center md:text-left">
          <p className="font-serif tracking-wider uppercase text-[10px]">
            Friend AI &middot; The Pantheon Companion Sanctuary
          </p>
          <div className="flex gap-6 font-serif uppercase tracking-widest text-[9px] flex-wrap justify-center">
            <button onClick={() => setView('home')} className="hover:text-[#c9a45c] transition-colors">
              Home
            </button>
            <button onClick={() => setView('pantheon')} className="hover:text-[#c9a45c] transition-colors">
              Storyboard
            </button>
            <button onClick={() => setView('chat')} className="hover:text-[#c9a45c] transition-colors">
              Sanctuary
            </button>
            <button onClick={() => setView('pitch')} className="hover:text-[#c9a45c] transition-colors">
              Deck
            </button>
            <button onClick={() => setView('policy')} className="hover:text-[#c9a45c] transition-colors text-[#c9a45c]/90 font-semibold">
              Terms &amp; Policy 📜
            </button>
            <button onClick={() => setView('waitlist')} className="text-[#c9a45c] hover:text-[#c9a45c]/85 transition-colors font-bold">
              Contribute 🏛️
            </button>
            <button onClick={() => setView('decoy')} className="text-[#e07070]/70 hover:text-[#e07070] transition-colors">
              Pandora's Box
            </button>
            <button onClick={() => setView('admin')} className="text-amber-500/80 hover:text-amber-500 transition-colors flex items-center gap-1 font-bold">
              Admin Area ⚙️
            </button>
          </div>
          <p className="text-[9px] font-mono tracking-widest">
            DESIGNED WITH SOUL &middot; POWERED BY GEMINI
          </p>
        </div>
      </footer>
    </div>
  );
}
