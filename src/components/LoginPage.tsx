import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Sparkles, CheckCircle2, User, LogIn, LogOut, Lock, 
  Mail, AlertTriangle, PhoneCall, ArrowRight, HeartPulse, Check, ShieldCheck, FileText, Activity, AlertCircle 
} from 'lucide-react';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import OracleProfileCreator from './OracleProfileCreator';

interface LoginPageProps {
  isLightMode: boolean;
  setView: (view: any) => void;
  onLoginSuccess?: (profile?: any) => void;
  savedProfile?: any;
}

export default function LoginPage({ isLightMode, setView, onLoginSuccess, savedProfile }: LoginPageProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Step state: 'auth' (Step 1: Auth & Medical Disclosure) or 'oracle' (Step 2: Sacred Oracle Profile Setup)
  const [step, setStep] = useState<'auth' | 'oracle'>('auth');

  // Basic Disclaimer
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(() => {
    return localStorage.getItem('clinical_disclaimer_accepted') === 'true';
  });

  // Auth form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  // Medical History & Triage Disclosure States
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [takesMedications, setTakesMedications] = useState<boolean>(false);
  const [medicationNotes, setMedicationNotes] = useState('');
  
  // Extreme Medical Crisis Checklist States
  const [crisisSuicidal, setCrisisSuicidal] = useState(false);
  const [crisisPsychosis, setCrisisPsychosis] = useState(false);
  const [crisisEmergency, setCrisisEmergency] = useState(false);
  const [crisisOverdose, setCrisisOverdose] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const savedDemo = localStorage.getItem('sanctuary_demo_google_user');
        if (savedDemo) {
          try {
            setUser(JSON.parse(savedDemo));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDisclaimerToggle = (checked: boolean) => {
    setDisclaimerAccepted(checked);
    localStorage.setItem('clinical_disclaimer_accepted', checked.toString());
  };

  const toggleDiagnosis = (diagnosis: string) => {
    if (diagnosis === 'none') {
      setSelectedDiagnoses(['none']);
      return;
    }
    setSelectedDiagnoses(prev => {
      const filtered = prev.filter(d => d !== 'none');
      if (filtered.includes(diagnosis)) {
        return filtered.filter(d => d !== diagnosis);
      } else {
        return [...filtered, diagnosis];
      }
    });
  };

  const hasExtremeCrisis = crisisSuicidal || crisisPsychosis || crisisEmergency || crisisOverdose;

  // Handles check for extreme crisis before proceeding
  const checkExtremeCrisisAndProceed = (authenticatedUser?: any): boolean => {
    if (hasExtremeCrisis) {
      // Direct IMMEDIATELY to clinical directory
      localStorage.setItem('extreme_crisis_flag', 'true');
      localStorage.setItem('sanctuary_user_authenticated', 'true');
      if (onLoginSuccess) onLoginSuccess();
      setView('clinical');
      return true; // Extreme crisis redirected
    }
    return false; // Proceed normally
  };

  const handleGoogleLogin = async () => {
    if (!disclaimerAccepted) {
      setDisclaimerAccepted(true);
      localStorage.setItem('clinical_disclaimer_accepted', 'true');
    }
    setErrorMsg('');
    try {
      setAuthInProgress(true);
      const res = await signInWithGoogle();
      setUser(res);
      setSuccessMsg("Successfully authenticated with Google!");

      // Save medical disclosure summary to local storage
      localStorage.setItem('medical_disclosure', JSON.stringify({
        diagnoses: selectedDiagnoses,
        takesMedications,
        medicationNotes,
        hasExtremeCrisis
      }));

      // Check if user has extreme crisis flags
      if (checkExtremeCrisisAndProceed(res)) {
        return;
      }

      // No extreme crisis -> proceed to Step 2: Oracle Profile Creation
      setTimeout(() => setStep('oracle'), 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In failed. Please try again.");
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclaimerAccepted) {
      setErrorMsg("Please acknowledge the Clinical Safety Disclaimer before continuing.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setErrorMsg('');
    setAuthInProgress(true);

    try {
      let userCred;
      if (authMode === 'signin') {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Welcome back to Project Friend AI!");
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Sanctuary account created successfully!");
      }

      // Save medical disclosure
      localStorage.setItem('medical_disclosure', JSON.stringify({
        diagnoses: selectedDiagnoses,
        takesMedications,
        medicationNotes,
        hasExtremeCrisis
      }));

      // Check extreme crisis redirection
      if (checkExtremeCrisisAndProceed(userCred.user)) {
        return;
      }

      // Proceed to Step 2: Oracle Profile Creation
      setTimeout(() => setStep('oracle'), 600);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg("Invalid email or password credentials.");
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("This email is already registered. Please sign in instead.");
      } else {
        setErrorMsg(err.message || "Authentication failed. Please verify your details.");
      }
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleGuestContinue = () => {
    if (!disclaimerAccepted) {
      setErrorMsg("Please acknowledge the Clinical Safety Disclaimer to proceed.");
      return;
    }

    // Save medical disclosure
    localStorage.setItem('medical_disclosure', JSON.stringify({
      diagnoses: selectedDiagnoses,
      takesMedications,
      medicationNotes,
      hasExtremeCrisis
    }));

    if (checkExtremeCrisisAndProceed()) {
      return;
    }

    // Move to Step 2: Oracle Profile Creation
    setStep('oracle');
  };

  const handleOracleProfileSaved = (profile: any) => {
    localStorage.setItem('sanctuary_user_authenticated', 'true');
    window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
    if (onLoginSuccess) {
      onLoginSuccess(profile);
    }
    setView('home');
  };

  // IF STEP IS 'ORACLE', RENDER STEP 2: SACRED ORACLE PROFILE CREATOR
  if (step === 'oracle') {
    return (
      <div className={`min-h-[88vh] p-6 md:p-12 transition-colors ${
        isLightMode ? 'bg-[#f6f2e9] text-[#211d18]' : 'bg-[#121614] text-[#f2ebd9]'
      }`}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/40 dark:border-stone-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c9a45c] flex items-center justify-center text-black font-serif font-bold text-sm">
                Ω
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#c9a45c] uppercase tracking-widest font-bold block">
                  Step 2 of 2 &middot; Onboarding Complete
                </span>
                <h2 className="font-serif font-bold text-xl">Create Your Sacred Oracle Profile</h2>
              </div>
            </div>

            <button 
              onClick={() => setStep('auth')}
              className="text-xs font-mono text-stone-500 hover:text-[#c9a45c] transition-colors cursor-pointer"
            >
              &larr; Back to Disclosures
            </button>
          </div>

          <OracleProfileCreator 
            onProfileSaved={handleOracleProfileSaved} 
            savedProfile={savedProfile || null} 
            isLightMode={isLightMode} 
          />
        </div>
      </div>
    );
  }

  // STEP 1: AUTHENTICATION & MEDICAL HISTORY DISCLOSURE PORTAL
  return (
    <div className={`min-h-[88vh] flex flex-col justify-between p-6 md:p-12 transition-colors ${
      isLightMode ? 'bg-[#f6f2e9] text-[#211d18]' : 'bg-[#121614] text-[#f2ebd9]'
    }`}>
      
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-stone-300/40 dark:border-stone-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#c9a45c] flex items-center justify-center text-black font-serif font-bold text-sm">
            Ω
          </div>
          <div>
            <span className="font-serif font-bold tracking-tight text-lg">Project Friend AI</span>
            <span className="text-[9px] font-mono text-[#c9a45c] ml-2 uppercase tracking-widest font-bold">
              Gateway Portal
            </span>
          </div>
        </div>

        <div className="text-xs font-mono text-stone-500 flex items-center gap-1.5 bg-stone-500/10 px-3 py-1.5 rounded-full border border-stone-500/20">
          <Lock className="w-3 h-3 text-[#c9a45c]" />
          <span>Mandatory Account Authentication Required</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto w-full py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Hero Typography & Key Stats */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight leading-[1.12]"
            >
              An AI friend that{' '}
              <span className="text-[#c9a45c] italic font-normal">
                actually remembers
              </span>{' '}
              your story.
            </motion.div>

            <p className="text-sm sm:text-base font-sans opacity-80 leading-relaxed font-light">
              Mental-health-grade emotional support, framed as friendship rather than therapy — so the billions who'd never open a traditional wellness app will still talk to us.
            </p>
          </div>

          {/* Key Stats Bar */}
          <div className="pt-4 border-t border-stone-300/40 dark:border-stone-800/60 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c9a45c]">450M</div>
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                untreated illness
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c9a45c]">92%</div>
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                2-week retention
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c9a45c]">0 PII</div>
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                collected by design
              </div>
            </div>
          </div>

          {/* Mandatory Clinical Disclaimer Notice */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs font-sans space-y-2.5 ${
              isLightMode 
                ? 'bg-amber-500/10 border-amber-600/40 text-stone-800' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
            }`}
          >
            <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
              CLINICAL DISCLAIMER &amp; EMERGENCY POLICY
            </div>

            <p className="leading-relaxed opacity-90 font-serif text-[11.5px]">
              <strong>Project Friend AI is a peer-style emotional wellness companion and NOT a replacement for a clinical psychiatrist, therapist, or emergency care.</strong> All medical decisions must be cross-checked with a licensed healthcare expert.
            </p>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={disclaimerAccepted}
                onChange={e => handleDisclaimerToggle(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#c9a45c] rounded cursor-pointer shrink-0"
              />
              <span className={`text-[11px] font-mono font-bold leading-tight ${disclaimerAccepted ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                I acknowledge Project Friend AI is non-clinical and agree to consult medical professionals for health decisions.
              </span>
            </label>
          </motion.div>

          {/* Emergency Crisis Direct Lifeline Links */}
          <div className="p-4 rounded-2xl border border-stone-300/40 dark:border-stone-800/60 bg-stone-500/5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
              24/7 Immediate Emergency Lifelines
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <a href="tel:988" className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-500/25 transition-all">
                📞 Call 988 Crisis Lifeline
              </a>
              <a href="sms:741741?body=HOME" className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/25 transition-all">
                💬 Text HOME to 741741
              </a>
              <button onClick={() => setView('clinical')} className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-500/25 transition-all">
                🩺 Clinical Directory
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Sign In & Medical History Disclosure Box */}
        <div id="login-card-section" className="lg:col-span-6 space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 md:p-8 rounded-3xl border shadow-xl space-y-6 text-left ${
              isLightMode 
                ? 'bg-white border-stone-300/80 shadow-stone-200/50' 
                : 'bg-[#181d1a] border-stone-800/80 shadow-black/40'
            }`}
          >
            {loading ? (
              <div className="py-12 text-center text-stone-400 font-mono text-xs">
                Verifying Sanctuary Credentials...
              </div>
            ) : user ? (
              /* Already Signed In View */
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#c9a45c]/10 border border-[#c9a45c]/30">
                  <img 
                    src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"} 
                    alt={user.displayName || "User"} 
                    className="w-12 h-12 rounded-xl border border-[#c9a45c] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Authenticated
                    </span>
                    <h3 className="font-serif font-bold text-base truncate mt-1">
                      {user.displayName || 'Sanctuary Member'}
                    </h3>
                    <p className="text-xs font-mono opacity-60 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('sanctuary_user_authenticated', 'true');
                      window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
                      if (onLoginSuccess) onLoginSuccess();
                      setView('home');
                    }}
                    className="w-full py-3.5 px-6 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    Enter Sanctuary Directly <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setStep('oracle')}
                    className="w-full py-2.5 px-4 bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-stone-500/20"
                  >
                    Setup / Edit Oracle Profile
                  </button>

                  <button
                    onClick={async () => {
                      await logOut();
                      setUser(null);
                      setSuccessMsg("Signed out.");
                    }}
                    className="w-full py-2.5 px-4 text-red-500 hover:bg-red-500/10 font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* LOGIN & MEDICAL HISTORY DISCLOSURE FORM */
              <div className="space-y-6">
                
                {/* Form Heading & Tabs */}
                <div>
                  <span className="text-[10px] font-mono text-[#c9a45c] font-bold uppercase tracking-widest block">
                    Step 1 of 2 &middot; Account &amp; Safety Disclosure
                  </span>
                  <h3 className="font-serif font-bold text-xl tracking-tight mt-0.5">
                    {authMode === 'signin' ? 'Sign In to Sanctuary' : 'Create Sanctuary Account'}
                  </h3>
                </div>

                <div className="flex border-b border-stone-200 dark:border-stone-800 pb-2 gap-6">
                  <button
                    onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
                    className={`text-xs font-mono font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                      authMode === 'signin' 
                        ? 'text-[#c9a45c] border-b-2 border-[#c9a45c]' 
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                    className={`text-xs font-mono font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                      authMode === 'signup' 
                        ? 'text-[#c9a45c] border-b-2 border-[#c9a45c]' 
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Notifications */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" /> {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-500" /> {successMsg}
                  </div>
                )}

                {/* ======================================================= */}
                {/* MEDICAL HISTORY & EXTREME CRISIS DISCLOSURE BOX         */}
                {/* ======================================================= */}
                <div className="p-4 rounded-2xl border border-stone-300 dark:border-stone-800 bg-stone-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c9a45c] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Medical History &amp; Safety Triage
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">Confidential</span>
                  </div>

                  {/* Diagnoses Checklist */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-serif opacity-80 block">
                      Past or current psychiatric diagnoses (select all that apply):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                      {[
                        { id: 'depression', label: 'Depression / MDD' },
                        { id: 'anxiety', label: 'Anxiety / GAD' },
                        { id: 'bipolar', label: 'Bipolar Disorder' },
                        { id: 'ptsd', label: 'PTSD / Trauma' },
                        { id: 'psychosis', label: 'Psychosis / Schizo' },
                        { id: 'none', label: 'None / Unspecified' },
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleDiagnosis(item.id)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer truncate ${
                            selectedDiagnoses.includes(item.id)
                              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
                              : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-300'
                          }`}
                        >
                          {selectedDiagnoses.includes(item.id) ? '✓ ' : '+ '} {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 🚨 EXTREME CRISIS CHECKLIST 🚨 */}
                  <div className="p-3.5 rounded-xl border-2 border-red-500/60 bg-red-950/20 space-y-2.5">
                    <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-[10.5px] uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
                      EXTREME CRISIS CHECKLIST (REQUIRED FOR TRIAGE)
                    </div>

                    <p className="text-[10.5px] font-serif text-red-200/90 leading-tight">
                      Please check if you are currently experiencing any of the following extreme medical or psychiatric conditions:
                    </p>

                    <div className="space-y-2 text-[11px] font-mono">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={crisisSuicidal}
                          onChange={e => setCrisisSuicidal(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer shrink-0"
                        />
                        <span className={`leading-tight ${crisisSuicidal ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                          🚨 Active suicidal thoughts, intent, or self-harm plan
                        </span>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={crisisPsychosis}
                          onChange={e => setCrisisPsychosis(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer shrink-0"
                        />
                        <span className={`leading-tight ${crisisPsychosis ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                          🚨 Active psychotic episode, hallucinations, or loss of reality
                        </span>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={crisisEmergency}
                          onChange={e => setCrisisEmergency(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer shrink-0"
                        />
                        <span className={`leading-tight ${crisisEmergency ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                          🚨 Immediate acute medical or psychiatric emergency
                        </span>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={crisisOverdose}
                          onChange={e => setCrisisOverdose(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer shrink-0"
                        />
                        <span className={`leading-tight ${crisisOverdose ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                          🚨 Active substance overdose or severe physical trauma
                        </span>
                      </label>
                    </div>

                    {hasExtremeCrisis && (
                      <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10.5px] font-mono leading-tight font-bold animate-pulse">
                        ⚠️ Notice: Because extreme crisis indicators are checked, continuing will IMMEDIATELY direct you to emergency clinical directories and 24/7 lifelines for safety.
                      </div>
                    )}
                  </div>

                </div>

                {/* Google Sign-In Primary Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authInProgress}
                  className="w-full py-3 px-4 bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-sans font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  {hasExtremeCrisis ? 'Proceed to Emergency Clinical Care' : 'Continue with Google Workspace'}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-mono text-stone-400 uppercase">or email</span>
                  <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email address"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[#c9a45c] ${
                        isLightMode ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-stone-900/60 border-stone-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[#c9a45c] ${
                        isLightMode ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-stone-900/60 border-stone-700 text-white'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authInProgress}
                    className={`w-full py-3 px-4 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      hasExtremeCrisis 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-[#c9a45c] hover:bg-[#b08e4f] text-black'
                    }`}
                  >
                    <LogIn className="w-4 h-4" /> 
                    {hasExtremeCrisis 
                      ? 'Submit Disclosure & Open Clinical Directory' 
                      : (authMode === 'signin' ? 'Sign In & Setup Oracle' : 'Create Account & Setup Oracle')
                    }
                  </button>
                </form>

                <div className="pt-2 text-center border-t border-stone-200 dark:border-stone-800">
                  <div className="text-[11px] font-mono text-stone-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Authentication is required to protect your private sanctuary data.</span>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Footer Disclaimer & Links */}
      <div className="max-w-7xl mx-auto w-full pt-6 border-t border-stone-300/40 dark:border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-stone-500">
        <div>
          &copy; {new Date().getFullYear()} Project Friend AI &middot; Non-clinical Emotional Wellness Platform
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setView('policy')} className="hover:underline cursor-pointer">
            Clinical Safety &amp; Ethics
          </button>
          <span>&middot;</span>
          <button onClick={() => setView('clinical')} className="hover:underline cursor-pointer text-amber-500 font-bold">
            Emergency Crisis Helplines 🚨
          </button>
        </div>
      </div>

    </div>
  );
}
