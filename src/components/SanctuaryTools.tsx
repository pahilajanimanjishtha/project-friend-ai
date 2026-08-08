import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import DivineSync from './DivineSync';
import GeoTagMap from './GeoTagMap';
import PrescriptionAnalyzer from './PrescriptionAnalyzer';
import VideoSanctuary from './VideoSanctuary';
import { 
  PenTool, BarChart3, Mail, Users, HeartPulse, ShieldCheck, BookOpen, 
  Send, Sparkles, AlertCircle, Heart, Star, CheckCircle, ArrowLeft, Clock,
  Plus, Bookmark, ChevronRight, User, HelpCircle, Activity, Play, Pause, RefreshCw, Info, Flame,
  Volume2, VolumeX, Wind, Trophy, Trash2, Search, Filter, ExternalLink, GraduationCap, Languages, Award,
  MapPin, Building2, Phone, Mic, MicOff, Settings, Download, FileText
} from 'lucide-react';
import { THERAPISTS, SPECIALIZED_SESSIONS, HELPLINES, HOSPITALS, Hospital } from '../clinicalData';

interface SanctuaryToolsProps {
  activeTool: string | null;
  onClose: () => void;
  isLightMode: boolean;
  setView: (view: any) => void;
  initialSyncTab?: 'drive' | 'gmail' | 'calendar' | 'tasks' | 'sheets' | 'contacts' | 'forms' | 'tony' | 'docs' | 'slides' | 'meet' | 'classroom' | 'notes';
}

// ==========================================
// 1. REFLECTIVE JOURNALING MODULE
// ==========================================
export function ReflectiveJournaling({ isLightMode, setView }: { isLightMode: boolean; setView?: (view: any) => void }) {
  const [title, setTitle] = useState('');
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState(50);
  const [selectedGeoTag, setSelectedGeoTag] = useState<{ lat: number; lng: number; locationName: string } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedDeity, setSelectedDeity] = useState('sisyphus');
  const [selectedTag, setSelectedTag] = useState('Heavy Burden');
  const [journals, setJournals] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  // Scribe levels & stats state
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'chronicle' | 'patterns' | 'triumphs' | 'somatic-map'>('chronicle');
  const [winsList, setWinsList] = useState<any[]>([]);
  const [newWinText, setNewWinText] = useState('');
  
  // Custom Particle Celebration state
  const [particles, setParticles] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI Pattern Analysis state
  const [patternsReport, setPatternsReport] = useState('');
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);

  // Daily Reflection State
  const [dailyReflections, setDailyReflections] = useState<Record<string, { question: string; response: string; timestamp: string }>>({});
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [showReflectionAnswerInput, setShowReflectionAnswerInput] = useState(false);

  const soothingCalmPrompts = [
    "What is a heavy feeling you are carrying today, and where in your body does it rest?",
    "Who or what made you feel truly safe and anchored recently?",
    "What is one standard of perfection you can gently release today?",
    "If your current anxiety was a weather pattern, what would it look like right now?",
    "What is a small, quiet boundary you need to set for your own peace today?",
    "What is one thing you are holding onto that is ready to be let go?",
    "Describe a silent moment from today where you felt completely present.",
    "In what ways have you been strong today, and in what ways do you need to rest?",
    "If you could offer one sentence of absolute forgiveness to yourself today, what would it be?",
    "What is a hidden joy or small beauty you observed today that went unnoticed by others?",
    "Where in your body do you feel tension right now, and what does it need to hear?",
    "What is a gentle truth about your feelings that you have been avoiding?",
    "Describe a person, animal, or space that brought a smile to your heart today.",
    "How can you nourish your physical body in the next few hours?",
    "What is a simple, daily routine that feels like a sacred ritual to you?",
    "What does 'peace' look like for you in this exact moment of your life?",
    "In this present moment, what are three things you can hear, see, and touch?",
    "What is a soft, quiet memory that always brings you back to center?",
    "How can you show yourself the same patience you would show to a small child today?",
    "What is one fear you are ready to meet with curiosity instead of judgement?",
    "Who is someone you are grateful for, and what is a specific quality of theirs you admire?",
    "What is one small thing that brought you comfort today (a warm drink, a soft blanket, a kind word)?",
    "If you could breathe in peace and breathe out tension, what color would each breath be?"
  ];

  const analyticalGrowthPrompts = [
    "What is a specific pattern of behavior you noticed in yourself today, and what triggered it?",
    "What is the primary obstacle you faced today, and what is one logical action you can take to overcome it?",
    "How did you manage your emotional energy today? Where did you invest it, and what was the return?",
    "What is a hard truth you need to admit to yourself regarding your current goals?",
    "Identify one decision you made today: what were the logical alternatives, and did you choose correctly?",
    "What is a key learning lesson from your most significant interaction today?",
    "If you could re-engineer one conversation from today to make it more productive, how would it go?",
    "What is a limiting belief you held today, and what objective evidence refutes it?",
    "Analyze your productivity today: what was your biggest distraction, and how will you mitigate it tomorrow?",
    "How did you challenge yourself or step out of your comfort zone today?",
    "What is a specific skill or area of knowledge you want to develop further this week, and why?",
    "What did you learn about yourself during a difficult moment this past week?",
    "Describe what letting go of control looks like for you tomorrow.",
    "What is a beautiful promise you can make to your future self?",
    "Look back at your week: what is one small breakthrough or moment of clarity you want to celebrate?",
    "If your anger could speak in a quiet, protective voice, what boundary is it trying to defend?",
    "What part of your life is transitioning right now, and how can you greet it with kindness?",
    "What is a heavy 'boulder' you pushed today, and how can you rest beside it now?"
  ];

  const [reflectionMode, setReflectionMode] = useState<'soothing' | 'analytical'>(() => {
    return (localStorage.getItem('sanctuaryReflectionMode') as 'soothing' | 'analytical') || 'soothing';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);

  const fetchDailyPrompt = async (mode: 'soothing' | 'analytical', forceRefresh = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!forceRefresh) {
      const cached = localStorage.getItem('sanctuaryCachedPrompt');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === todayStr && parsed.mode === mode && parsed.prompt) {
            setGeneratedPrompt(parsed.prompt);
            return;
          }
        } catch (e) {}
      }
    }

    setIsFetchingPrompt(true);
    try {
      const response = await fetch('/api/daily-reflection-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.question) {
          setGeneratedPrompt(data.question);
          localStorage.setItem('sanctuaryCachedPrompt', JSON.stringify({
            date: todayStr,
            mode,
            prompt: data.question
          }));
          setIsFetchingPrompt(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching daily prompt:", err);
    }

    // Fallback if API fails
    const fallbacks = mode === 'soothing' ? soothingCalmPrompts : analyticalGrowthPrompts;
    const dayIndex = (new Date().getDate() - 1) % fallbacks.length;
    const fallbackPrompt = fallbacks[dayIndex];
    setGeneratedPrompt(fallbackPrompt);
    localStorage.setItem('sanctuaryCachedPrompt', JSON.stringify({
      date: todayStr,
      mode,
      prompt: fallbackPrompt
    }));
    setIsFetchingPrompt(false);
  };

  useEffect(() => {
    fetchDailyPrompt(reflectionMode);
  }, [reflectionMode]);

  const getDailyPromptIndex = () => {
    const d = new Date();
    const day = d.getDate();
    const list = reflectionMode === 'soothing' ? soothingCalmPrompts : analyticalGrowthPrompts;
    return (day - 1) % list.length;
  };

  const todayPrompt = generatedPrompt || (reflectionMode === 'soothing' ? soothingCalmPrompts[getDailyPromptIndex()] : analyticalGrowthPrompts[getDailyPromptIndex()]);
  const todayStr = new Date().toISOString().split('T')[0];
  const hasCompletedTodayReflection = !!dailyReflections[todayStr];

  // Voice/Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState('en-IN');
  const recognitionRef = useRef<any>(null);

  const supportedLanguages = [
    { code: 'en-IN', name: 'English (India)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'hi-IN', name: 'Hindi (हिंदी)' },
    { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
    { code: 'te-IN', name: 'Telugu (తెలుగు)' },
    { code: 'bn-IN', name: 'Bengali (বাংলা)' },
    { code: 'mr-IN', name: 'Marathi (मराठी)' }
  ];

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setRecognitionError("Speech Recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = speechLanguage;

      rec.onstart = () => {
        setIsRecording(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        let newFinal = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          }
        }

        if (newFinal) {
          setEntry(prev => {
            const trimmed = prev.trim();
            const separator = trimmed && !trimmed.endsWith('.') && !trimmed.endsWith('?') && !trimmed.endsWith('!') ? ' ' : ' ';
            return trimmed + (trimmed ? separator : '') + newFinal.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError("Microphone access denied. Please allow microphone permissions in your browser.");
        } else if (event.error === 'no-speech') {
          // Ignore no-speech error gracefully to keep recording active
        } else {
          setRecognitionError(`Speech recognition message: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setRecognitionError("Could not initialize Speech Recognition.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const tags = ['Heavy Burden', 'Conflict', 'Exhaustion', 'Transition', 'Anxiety', 'Grief', 'Quiet Hope', 'Boundary Block', 'Gentle Triumph', 'Daily Reflection'];
  
  const deities = [
    { id: 'sisyphus', name: 'Sisyphus (Raag)', style: 'Pichwai Somatic' },
    { id: 'athena', name: 'Athena (Hope)', style: 'Warli DBT' },
    { id: 'ares', name: 'Ares (Rudra)', style: 'Kalamkari Fire' },
    { id: 'poseidon', name: 'Poseidon (Jhulelal)', style: 'Madhubani Ocean' },
    { id: 'hades', name: 'Hades (Veer)', style: 'Pata Chitra Grounding' },
    { id: 'sappho', name: 'Sappho (Manjishtha)', style: 'Manjusha Poetry' }
  ];

  const deityPrompts: Record<string, string[]> = {
    sisyphus: [
      "What is the heavy 'boulder' you are pushing up your hill today?",
      "If you let go of the pressure to finish, what did you learn on the walk up?",
      "Describe a routine action that felt surprisingly peaceful or meditative today."
    ],
    athena: [
      "What standard of perfection are you holding yourself to right now?",
      "In this conflict, what is a fact-based truth, and what is your emotional interpretation?",
      "What is one piece of clear wisdom you would give to a friend in your exact shoes?"
    ],
    ares: [
      "Where in your body is anger or tension burning today? Describe it physically.",
      "What boundary do you need to defend with calm, sovereign strength?",
      "Write about a struggle that is making you stronger, even if it feels raw."
    ],
    poseidon: [
      "What emotional 'ocean storm' is tossing your thoughts around right now?",
      "Where is a quiet coral reef you can retreat to in your mind today?",
      "Describe what letting go of control and flowing with the tide looks like today."
    ],
    hades: [
      "What is something beautiful you are quietly growing in the dark that others can't see?",
      "What heavy grief or transition are you greeting with gentle acceptance today?",
      "Name a quiet space or boundary that felt protective and comforting today."
    ],
    sappho: [
      "If your current struggle was a poem or a melody, what would it sound like?",
      "Write down a feeling so raw and honest that you've been afraid to speak it aloud.",
      "Describe a tiny moment of connection, desire, or beauty you observed today."
    ]
  };

  const defaultWins = [
    { id: 'win1', text: "Took 3 slow, deep abdominal breaths", completed: false, date: new Date().toLocaleDateString('en-US') },
    { id: 'win2', text: "Stretched my body or walked for 5 minutes", completed: false, date: new Date().toLocaleDateString('en-US') },
    { id: 'win3', text: "Acknowledged my heavy feelings without judgement", completed: false, date: new Date().toLocaleDateString('en-US') }
  ];

  // Helper to calculate Level Info
  const getLevelInfo = (currentXp: number) => {
    const xpPerLevel = 30;
    const level = Math.floor(currentXp / xpPerLevel) + 1;
    const xpInLevel = currentXp % xpPerLevel;
    const xpNeeded = xpPerLevel;
    const titles = [
      "Quiet Scribe",
      "Pensive Seeker",
      "Thought Weaver",
      "Insight Alchemist",
      "Somatic Sage",
      "Temple Chronicler",
      "Sovereign Oracle"
    ];
    const title = titles[Math.min(level - 1, titles.length - 1)];
    return { level, xpInLevel, xpNeeded, title };
  };

  // Helper to calculate streak from journals
  const calculateStreak = (entries: any[]) => {
    if (entries.length === 0) return 0;
    
    // Extract unique sorted date strings (YYYY-MM-DD)
    const dates = Array.from(new Set(entries.map(e => {
      const d = new Date(e.timestamp || e.date);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }))).filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If the latest entry is neither today nor yesterday, streak is 0
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }

    let currentStreak = 1;
    let currentDate = new Date(dates[0]);

    for (let i = 1; i < dates.length; i++) {
      const nextDate = new Date(dates[i]);
      const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        currentDate = nextDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    return currentStreak;
  };

  // Trigger floating particle blossom
  const triggerCelebration = (e?: React.MouseEvent) => {
    let x = 150;
    let y = 150;
    
    if (e && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      // center of container
      if (containerRef.current) {
        x = containerRef.current.clientWidth / 2;
        y = containerRef.current.clientHeight / 2;
      }
    }

    const emojis = ['✨', '✦', '🌸', '💫', '🌿', '🌱', '☀️', '💛', '🌟', '🪷'];
    const colors = ['#c9a45c', '#9fa6ff', '#84a98c', '#e07070', '#ffd166', '#a8dadc'];
    
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 0.8 + 0.6,
      rotation: Math.random() * 360,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    }));

    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1500);
  };

  // Load initial state
  useEffect(() => {
    const storedJournals = localStorage.getItem('sanctuaryJournals');
    let loadedJournals: any[] = [];
    if (storedJournals) {
      try {
        loadedJournals = JSON.parse(storedJournals);
        setJournals(loadedJournals);
      } catch (e) {}
    }

    const storedXp = localStorage.getItem('sanctuaryXP');
    if (storedXp) {
      setXp(parseInt(storedXp) || 0);
    }

    const storedWins = localStorage.getItem('sanctuaryWins');
    if (storedWins) {
      try {
        setWinsList(JSON.parse(storedWins));
      } catch (e) {
        setWinsList(defaultWins);
      }
    } else {
      setWinsList(defaultWins);
    }

    // Compute initial streak
    setStreak(calculateStreak(loadedJournals));

    // Load initial daily reflections
    const storedDailyReflections = localStorage.getItem('sanctuaryDailyReflections');
    if (storedDailyReflections) {
      try {
        setDailyReflections(JSON.parse(storedDailyReflections));
      } catch (e) {}
    }
  }, []);

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;

    setIsGenerating(true);
    setReflectionText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: { id: selectedDeity, name: selectedDeity.toUpperCase() },
          history: [
            {
              role: 'user',
              parts: [{ text: `I am writing this journal entry tagged with "${selectedTag}" and mood score ${mood}/100. Title: "${title}". Entry: "${entry}". Reflect on my entry, offer supportive guidance, and suggest an art/somatic exercise aligned with your philosophy.` }]
            }
          ]
        }),
      });

      let generatedReflection = '';
      if (response.ok) {
        const data = await response.json();
        generatedReflection = data.text;
      } else {
        generatedReflection = `I hold space for your "${selectedTag}". Take a deep breath. Focus on the ground beneath you, let the boulder rest, and know that you are loved beyond your productivity.`;
      }

      setReflectionText(generatedReflection);

      const timestamp = new Date().toISOString();
      const newJournal = {
        id: Date.now().toString(),
        title: title || 'Untitled Reflection',
        entry,
        mood,
        tag: selectedTag,
        deity: selectedDeity,
        reflection: generatedReflection,
        timestamp,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        geoTag: selectedGeoTag || undefined
      };

      // Check if they are answering the daily reflection in the main journal
      if (entry.includes(todayPrompt) || title.includes("Daily Reflection")) {
        const cleanResponse = entry.replace(`Prompt: "${todayPrompt}"`, "").trim();
        const newReflectionData = {
          question: todayPrompt,
          response: cleanResponse || entry,
          timestamp
        };
        const updatedReflections = {
          ...dailyReflections,
          [todayStr]: newReflectionData
        };
        setDailyReflections(updatedReflections);
        localStorage.setItem('sanctuaryDailyReflections', JSON.stringify(updatedReflections));
      }

      const updated = [newJournal, ...journals];
      setJournals(updated);
      localStorage.setItem('sanctuaryJournals', JSON.stringify(updated));

      // Grows with you: Add XP +10 for writing!
      const nextXp = xp + 10;
      setXp(nextXp);
      localStorage.setItem('sanctuaryXP', nextXp.toString());

      // Recalculate streak
      setStreak(calculateStreak(updated));

      // Trigger blossom particles
      triggerCelebration();

      // Clear fields
      setTitle('');
      setEntry('');
      setSelectedGeoTag(null);
      setIsMapOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDailyReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionAnswer.trim()) return;

    const timestamp = new Date().toISOString();
    const dateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // 1. Save in daily reflections local storage map
    const newReflectionData = {
      question: todayPrompt,
      response: reflectionAnswer.trim(),
      timestamp
    };

    const updatedReflections = {
      ...dailyReflections,
      [todayStr]: newReflectionData
    };
    setDailyReflections(updatedReflections);
    localStorage.setItem('sanctuaryDailyReflections', JSON.stringify(updatedReflections));

    // 2. Also save as a beautifully formatted Journal Entry so it propagates into Chronicles, Pattern Spotter, etc.
    const newJournal = {
      id: `daily-reflection-${Date.now()}`,
      title: `Daily Reflection: ${todayPrompt.length > 40 ? todayPrompt.substring(0, 40) + '...' : todayPrompt}`,
      entry: `Prompt: "${todayPrompt}"\n\nMy Reflection: ${reflectionAnswer.trim()}`,
      mood: mood, // use the current mood slider state
      tag: 'Daily Reflection',
      deity: selectedDeity,
      reflection: `You answered today's intentional daily reflection question with beautiful courage and self-awareness. Grasp this wisdom as a milestone on your path.`,
      timestamp,
      date: dateFormatted
    };

    const updatedJournals = [newJournal, ...journals];
    setJournals(updatedJournals);
    localStorage.setItem('sanctuaryJournals', JSON.stringify(updatedJournals));

    // 3. Award XP +15 for completing the daily reflection!
    const nextXp = xp + 15;
    setXp(nextXp);
    localStorage.setItem('sanctuaryXP', nextXp.toString());

    // 4. Recalculate streak
    setStreak(calculateStreak(updatedJournals));

    // 5. Trigger celebration particles!
    triggerCelebration();

    // 6. Reset reflection response field & close input box
    setReflectionAnswer('');
    setShowReflectionAnswerInput(false);
  };

  const deleteJournal = (id: string) => {
    const updated = journals.filter(j => j.id !== id);
    setJournals(updated);
    localStorage.setItem('sanctuaryJournals', JSON.stringify(updated));
    setStreak(calculateStreak(updated));
  };

  const downloadSingleEntry = (j: any) => {
    const formattedDate = j.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const content = `==================================================
PROJECT FRIEND AI - REFLECTIVE JOURNAL ENTRY
==================================================
Date: ${formattedDate}
Title: ${j.title || 'Untitled Reflection'}
Category Tag: ${j.tag || 'General'}
Mood Rating: ${j.mood ?? 'N/A'}/100
Archetype Companion: ${j.deity ? j.deity.toUpperCase() : 'N/A'}

--- JOURNAL ENTRY ---
${j.entry}

${j.reflection ? `--- COMPANION GUIDANCE (${(j.deity || 'deity').toUpperCase()}) ---\n${j.reflection}\n` : ''}
==================================================
Exported securely from Project Friend AI (Sanctuary)
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (j.title || 'Journal_Entry').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeTitle}_${formattedDate.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllJournals = () => {
    if (journals.length === 0) return;
    
    let content = `==================================================
PROJECT FRIEND AI - OFFLINE JOURNAL CHRONICLES
Total Recorded Entries: ${journals.length}
Export Timestamp: ${new Date().toLocaleString()}
==================================================\n\n`;

    journals.forEach((j: any, idx: number) => {
      const formattedDate = j.date || 'N/A';
      content += `ENTRY #${journals.length - idx}
--------------------------------------------------
Date: ${formattedDate}
Title: ${j.title || 'Untitled Reflection'}
Category Tag: ${j.tag || 'General'}
Mood Score: ${j.mood ?? 'N/A'}/100
Archetype Companion: ${j.deity ? j.deity.toUpperCase() : 'N/A'}

[MY ENTRY]
${j.entry}

${j.reflection ? `[GUIDANCE FROM ${(j.deity || 'deity').toUpperCase()}]\n${j.reflection}\n` : ''}
==================================================\n\n`;
    });

    content += `End of Chronicles. Exported from Project Friend AI for personal offline reflection.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeDate = new Date().toISOString().slice(0, 10);
    a.download = `Friend_AI_Journal_Chronicles_${safeDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch AI Patterns report
  const handleGeneratePatternReport = async () => {
    if (journals.length === 0) return;
    setIsAnalyzingPatterns(true);
    setPatternsReport('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: { id: selectedDeity, name: selectedDeity.toUpperCase() },
          history: [
            {
              role: 'user',
              parts: [{ 
                text: `You are the Sage Analyst of the Temple of Dialectic Art.
Analyze my journal history and write a short, highly supportive "Patterns and Progress Report".
Here are my recent journal logs:
${JSON.stringify(journals.map(j => ({ date: j.date, tag: j.tag, mood: j.mood, title: j.title, entry: j.entry })))}

Format your response as a letter of spiritual mentorship. Identify:
1. The dominant emotional themes in my writings (e.g. Sisyphus' heavy rolling vs Ares' burning fire vs Sappho's quiet poetry).
2. Patterns of mood growth, stability, or recurring obstacles.
3. Two specific, small wins/breakthroughs you've detected (e.g. self-awareness, writing, seeking balance) that I deserve to celebrate.

Keep your response extremely warm, poetic yet clinically sound, and write exactly 2 paragraphs. Speak in a comforting, divine mentor persona.` 
              }]
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPatternsReport(data.text);
      } else {
        setPatternsReport("The patterns show that you are walking with immense bravery. Even in heavier moments, your commitment to recording your experiences is a win in itself. Athena recommends taking some time off to lay down your defenses today, while Dionysus reminds you that small joys are still worth savoring.");
      }
    } catch (err) {
      console.error(err);
      setPatternsReport("Unable to read the emotional map right now. Keep writing and check back soon!");
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  // Add custom micro-win
  const handleAddWin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWinText.trim()) return;

    const newWin = {
      id: Date.now().toString(),
      text: newWinText.trim(),
      completed: false,
      date: new Date().toLocaleDateString('en-US')
    };

    const updated = [newWin, ...winsList];
    setWinsList(updated);
    localStorage.setItem('sanctuaryWins', JSON.stringify(updated));
    setNewWinText('');
  };

  // Check off win
  const toggleWin = (id: string, e: React.MouseEvent) => {
    const updated = winsList.map(win => {
      if (win.id === id) {
        const nextCompleted = !win.completed;
        if (nextCompleted) {
          // Add +5 XP for small win celebration!
          const nextXp = xp + 5;
          setXp(nextXp);
          localStorage.setItem('sanctuaryXP', nextXp.toString());
          // Trigger particle burst
          triggerCelebration(e);
        }
        return { ...win, completed: nextCompleted };
      }
      return win;
    });
    setWinsList(updated);
    localStorage.setItem('sanctuaryWins', JSON.stringify(updated));
  };

  // Reset or clear wins
  const resetWins = () => {
    const reset = winsList.map(w => ({ ...w, completed: false }));
    setWinsList(reset);
    localStorage.setItem('sanctuaryWins', JSON.stringify(reset));
  };

  const clearWins = () => {
    setWinsList(defaultWins);
    localStorage.setItem('sanctuaryWins', JSON.stringify(defaultWins));
  };

  // Level computation
  const levelInfo = getLevelInfo(xp);

  // Analytics helper calculations
  const last7Journals = [...journals].slice(0, 7).reverse();
  const width = 320;
  const height = 110;
  const points = last7Journals.map((j, idx) => {
    const x = last7Journals.length > 1 ? idx * (width / (last7Journals.length - 1)) : width / 2;
    const y = height - (j.mood / 100 * (height - 30)) - 15;
    return { x, y, ...j };
  });
  const svgPath = points.length > 1 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : '';

  // 7-Day Emotional State Dashboard analytics
  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const dayName = d.toLocaleDateString([], { weekday: 'short' });
      result.push({ dateStr, label, dayName });
    }
    return result;
  };

  const analyzeChatHistory = () => {
    try {
      const chatsRaw = localStorage.getItem('sanctuary_chats');
      if (!chatsRaw) return {};
      const chats = JSON.parse(chatsRaw);
      const dailyScores: Record<string, { totalScore: number; count: number; messages: string[] }> = {};
      
      Object.entries(chats).forEach(([charId, msgs]: [string, any]) => {
        if (!Array.isArray(msgs)) return;
        msgs.forEach((m: any) => {
          if (m.sender !== 'user') return;
          
          let msgDate: Date | null = null;
          if (m.id && m.id.startsWith('user-')) {
            const ms = parseInt(m.id.split('-')[1], 10);
            if (!isNaN(ms)) msgDate = new Date(ms);
          }
          if (!msgDate) msgDate = new Date();
          
          const dateStr = msgDate.toISOString().split('T')[0];
          const text = (m.text || '').toLowerCase();
          let score = 60; // baseline
          
          const positiveKeywords = [
            "happy", "joy", "good", "great", "excellent", "peace", "calm", "excited", "love", "awesome", "perfect", "better", "glad", "smile", "laugh", "cheerful", "relaxed", "serene", "light", "content", "hope", "inspired", "grateful", "blessed", "thankful", "heal", "progress", "growth", "accomplish", "proud", "mindful", "breathe", "present"
          ];
          const negativeKeywords = [
            "sad", "bad", "anxious", "depressed", "tired", "worried", "scared", "fear", "angry", "hate", "stuck", "pain", "hurt", "lonely", "heavy", "grief", "cry", "fail", "stress", "panic", "guilt", "shame", "empty", "burden", "boulder", "exhausted", "hopeless", "helpless", "ruined", "broke", "frustrated", "overwhelmed", "lost", "struggle", "dark", "bleed"
          ];
          
          positiveKeywords.forEach(word => {
            const matches = text.split(word).length - 1;
            if (matches > 0) score += matches * 8;
          });
          negativeKeywords.forEach(word => {
            const matches = text.split(word).length - 1;
            if (matches > 0) score -= matches * 8;
          });
          
          score = Math.max(15, Math.min(95, score));
          
          if (!dailyScores[dateStr]) {
            dailyScores[dateStr] = { totalScore: 0, count: 0, messages: [] };
          }
          dailyScores[dateStr].totalScore += score;
          dailyScores[dateStr].count += 1;
          dailyScores[dateStr].messages.push(m.text);
        });
      });
      
      const result: Record<string, { mood: number; count: number; messages: string[] }> = {};
      Object.entries(dailyScores).forEach(([dateStr, data]) => {
        result[dateStr] = {
          mood: Math.round(data.totalScore / data.count),
          count: data.count,
          messages: data.messages
        };
      });
      return result;
    } catch (e) {
      console.error("Failed to analyze chat history", e);
      return {};
    }
  };

  const analyzeJournalHistory = () => {
    const result: Record<string, { mood: number; count: number; tag: string }> = {};
    if (!Array.isArray(journals)) return result;
    journals.forEach(j => {
      if (!j.date) return;
      const dateStr = j.date;
      if (!result[dateStr]) {
        result[dateStr] = { mood: j.mood || 50, count: 1, tag: j.tag || '' };
      } else {
        result[dateStr].mood = Math.round(((result[dateStr].mood || 50) + (j.mood || 50)) / 2);
        result[dateStr].count += 1;
      }
    });
    return result;
  };

  const last7Days = getLast7Days();
  const chatScores = analyzeChatHistory();
  const journalScores = analyzeJournalHistory();
  
  let realDataPoints = 0;
  
  const processedTrendData = last7Days.map((day, idx) => {
    const chatInfo = chatScores[day.dateStr];
    const journalInfo = journalScores[day.dateStr];
    
    let mood = 50;
    let source = 'Simulated';
    let chatCount = 0;
    let journalCount = 0;
    
    if (chatInfo && journalInfo) {
      mood = Math.round((chatInfo.mood + journalInfo.mood) / 2);
      source = 'Combined';
      chatCount = chatInfo.count;
      journalCount = journalInfo.count;
      realDataPoints++;
    } else if (chatInfo) {
      mood = chatInfo.mood;
      source = 'Chat Buddy';
      chatCount = chatInfo.count;
      realDataPoints++;
    } else if (journalInfo) {
      mood = journalInfo.mood;
      source = 'Journal';
      journalCount = journalInfo.count;
      realDataPoints++;
    } else {
      // Create a nice simulated wave for fallback
      const dayNum = parseInt(day.dateStr.split('-')[2], 10) || idx;
      mood = 55 + Math.round(Math.sin(dayNum * 0.8) * 12 + Math.cos(idx * 0.5) * 5);
    }
    
    return {
      date: day.dateStr,
      label: day.label,
      weekday: day.dayName,
      mood: Math.max(10, Math.min(100, mood)),
      source,
      chatCount,
      journalCount,
      totalInteractions: chatCount + journalCount
    };
  });

  const totalMood = processedTrendData.reduce((acc, curr) => acc + curr.mood, 0);
  const averageMood = Math.round(totalMood / processedTrendData.length);
  const totalChats = processedTrendData.reduce((acc, curr) => acc + curr.chatCount, 0);
  const totalJournals = processedTrendData.reduce((acc, curr) => acc + curr.journalCount, 0);
  const totalActivity = totalChats + totalJournals;
  const primaryChannel = totalChats > totalJournals ? 'Private Chat' : totalJournals > 0 ? 'Wisdom Journal' : 'None';

  let moodStateLabel = "Pensive & Reflective";
  if (averageMood >= 75) {
    moodStateLabel = "Radiant & Grounded";
  } else if (averageMood >= 60) {
    moodStateLabel = "Balanced & Serene";
  } else if (averageMood >= 45) {
    moodStateLabel = "Pensive & Reflective";
  } else {
    moodStateLabel = "Heavy & Holding";
  }

  // Get dominant emotional tags count
  const tagCounts: Record<string, number> = {};
  journals.forEach(j => {
    tagCounts[j.tag] = (tagCounts[j.tag] || 0) + 1;
  });
  const totalEntries = journals.length || 1;
  const tagPercentages = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalEntries) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Quick prompt rotation
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const handleGetDeityPrompt = () => {
    const list = deityPrompts[selectedDeity] || deityPrompts.sisyphus;
    const prompt = list[activePromptIndex % list.length];
    setActivePromptIndex(prev => prev + 1);
    setTitle(prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt);
    setEntry(prompt + "\n\n");
  };

  return (
    <div ref={containerRef} className="space-y-6 relative">
      
      {/* Floating Sparkles Celebration Particles Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, scale: 0.2, rotate: 0 }}
              animate={{ 
                x: p.x + (Math.random() - 0.5) * 240, 
                y: p.y - 120 - Math.random() * 120, 
                opacity: 0, 
                scale: p.size * 1.5,
                rotate: p.rotation + (Math.random() - 0.5) * 360 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              className="absolute text-base select-none"
              style={{ color: p.color }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Grows with you Header Block */}
      <div className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-[#1b2420] border-brown'}`}>
        <div className="flex items-center gap-4 text-left w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-[#c9a45c]/10 border border-[#c9a45c]/40 flex items-center justify-center text-[#c9a45c] shrink-0 shadow-inner">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider text-[#c9a45c] uppercase">Chronicle Level {levelInfo.level}</span>
              <span className="text-[9px] font-mono bg-periwinkle/15 text-periwinkle px-2 py-0.5 rounded-full font-bold">{levelInfo.title}</span>
            </div>
            <h4 className={`font-serif text-base font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
              Your Reflective Wisdom Journal
            </h4>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden relative border border-white/5 max-w-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(levelInfo.xpInLevel / levelInfo.xpNeeded) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[#c9a45c] to-amber-400 rounded-full"
                />
              </div>
              <div className="text-[8px] font-mono text-slate-400 flex justify-between max-w-sm">
                <span>{levelInfo.xpInLevel} / {levelInfo.xpNeeded} Wisdom Sparks</span>
                <span>Level Up at {levelInfo.level * 30} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Writing Streak Block */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 md:border-l border-brown/20 pt-3 md:pt-0 pl-0 md:pl-5 w-full md:w-auto justify-end">
          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider">Reflection Streak</span>
            <span className={`font-serif text-xs font-bold ${isLightMode ? 'text-stone-800' : 'text-white'}`}>
              {streak === 0 ? "Begin Your Journey" : `${streak} Consecutive Days`}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${streak > 0 ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)]' : 'bg-black/10 border-brown/30 text-slate-500'}`}>
            <Flame className={`w-5 h-5 ${streak > 0 ? 'animate-bounce' : ''}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Journal Form (7 cols) */}
        <div className={`lg:col-span-6 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[580px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <div>
            {/* DAILY REFLECTION PROMPT GENERATOR */}
            <div className={`p-4 rounded-xl border-2 mb-4 relative overflow-hidden transition-all ${
              hasCompletedTodayReflection
                ? (isLightMode ? 'bg-[#f4fbf7] border-emerald-500/25' : 'bg-emerald-950/10 border-emerald-500/20')
                : (isLightMode ? 'bg-amber-50/40 border-[#c9a45c]/20' : 'bg-[#181d1a] border-[#c9a45c]/15')
            }`}>
              <div className="absolute top-1.5 right-2 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    showSettings 
                      ? 'bg-[#c9a45c]/20 text-[#c9a45c]' 
                      : 'hover:bg-[#c9a45c]/10 text-slate-400 hover:text-[#c9a45c]'
                  }`}
                  title="Daily Reflection Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <span className="text-[7.5px] font-mono opacity-45 uppercase tracking-widest text-[#c9a45c] font-bold">Daily Intention</span>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-xl border border-[#c9a45c]/25 bg-black/15 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#c9a45c] font-bold">Prompt Mode Settings</span>
                      <button
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="text-[9px] font-mono text-slate-500 hover:text-white"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReflectionMode('soothing');
                          localStorage.setItem('sanctuaryReflectionMode', 'soothing');
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          reflectionMode === 'soothing'
                            ? 'border-[#c9a45c] bg-[#c9a45c]/10 text-[#c9a45c]'
                            : 'border-slate-500/10 bg-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold font-serif flex items-center gap-1">
                          ✦ Soothing & Calm
                        </span>
                        <span className="text-[8px] font-mono leading-tight opacity-80">
                          Comforting, warm somatic questions to nurture peace.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReflectionMode('analytical');
                          localStorage.setItem('sanctuaryReflectionMode', 'analytical');
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          reflectionMode === 'analytical'
                            ? 'border-[#9fa6ff] bg-[#9fa6ff]/10 text-[#9fa6ff]'
                            : 'border-slate-500/10 bg-transparent text-slate-400 hover:text-[#9fa6ff]'
                        }`}
                      >
                        <span className="text-[10px] font-bold font-serif flex items-center gap-1">
                          ✦ Analytical & Growth
                        </span>
                        <span className="text-[8px] font-mono leading-tight opacity-80">
                          CBT behavior-focused questions to challenge patterns.
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-500/10">
                      <div className="text-[8px] font-mono text-slate-400 leading-tight">
                        Updates Gemini system instructions to generate tailored questions.
                      </div>
                      <button
                        type="button"
                        disabled={isFetchingPrompt}
                        onClick={() => fetchDailyPrompt(reflectionMode, true)}
                        className={`text-[9px] font-mono px-2 py-1 rounded bg-[#c9a45c]/10 hover:bg-[#c9a45c]/20 border border-[#c9a45c]/30 text-[#c9a45c] flex items-center gap-1 cursor-pointer transition-all ${isFetchingPrompt ? 'animate-pulse' : ''}`}
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isFetchingPrompt ? 'animate-spin' : ''}`} />
                        {isFetchingPrompt ? 'Scribing AI Prompt...' : 'Force AI Refresh'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  hasCompletedTodayReflection
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[#c9a45c]/10 text-[#c9a45c]'
                }`}>
                  {hasCompletedTodayReflection ? <CheckCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4 text-[#c9a45c]" />}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#c9a45c] block font-bold">
                      {hasCompletedTodayReflection ? "Today's Reflection Rested" : "Today's Intentional Reflection"}
                    </span>
                    <span className="text-[8px] opacity-30">•</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                      reflectionMode === 'soothing' 
                        ? 'bg-[#c9a45c]/10 text-[#c9a45c]' 
                        : 'bg-[#9fa6ff]/10 text-[#9fa6ff]'
                    }`}>
                      {reflectionMode === 'soothing' ? 'Soothing / Calm' : 'Analytical / Growth'}
                    </span>
                    {isFetchingPrompt && (
                      <span className="text-[8.5px] font-mono text-slate-400 animate-pulse flex items-center gap-1">
                        <RefreshCw className="w-2 h-2 animate-spin" /> Fetching AI Prompt...
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-xs font-serif leading-relaxed ${isLightMode ? 'text-stone-800' : 'text-slate-200'}`}>
                    "{todayPrompt}"
                  </p>

                  {hasCompletedTodayReflection ? (
                    <div className="pt-2 border-t border-[#c9a45c]/10 mt-2 space-y-1">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase tracking-wider">Your Scribed Response:</span>
                      <p className={`text-[11px] italic leading-relaxed line-clamp-3 ${isLightMode ? 'text-stone-600' : 'text-slate-300'}`}>
                        "{dailyReflections[todayStr]?.response}"
                      </p>
                      <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                        ✦ Level Up Progress Saved (+15 XP Claimed)
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(`Daily Reflection: ${todayPrompt.length > 30 ? todayPrompt.substring(0, 30) + '...' : todayPrompt}`);
                          setEntry(`Prompt: "${todayPrompt}"\n\nI feel `);
                          setSelectedTag('Daily Reflection');
                          // Scroll to textarea or focus it
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            textarea.focus();
                          }
                        }}
                        className="text-[9px] font-mono bg-[#c9a45c]/10 hover:bg-[#c9a45c]/25 text-[#c9a45c] border border-[#c9a45c]/30 px-2.5 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1"
                      >
                        <PenTool className="w-2.5 h-2.5" /> Answer in Main Journal
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowReflectionAnswerInput(!showReflectionAnswerInput)}
                        className="text-[9px] font-mono bg-[#9fa6ff]/10 hover:bg-[#9fa6ff]/25 text-[#9fa6ff] border border-[#9fa6ff]/30 px-2.5 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> Answer Inline Quick Box
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Quick Box Form */}
              <AnimatePresence>
                {showReflectionAnswerInput && !hasCompletedTodayReflection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-3 border-t border-[#c9a45c]/10 space-y-3"
                  >
                    <textarea
                      rows={3}
                      value={reflectionAnswer}
                      onChange={e => setReflectionAnswer(e.target.value)}
                      placeholder="Enter your heart's quiet answer here..."
                      className={`w-full text-xs p-2.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] leading-relaxed ${
                        isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-black/35 border-brown text-white'
                      }`}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReflectionAnswer('');
                          setShowReflectionAnswerInput(false);
                        }}
                        className="text-[9px] font-mono px-3 py-1.5 rounded-full border border-slate-500/30 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDailyReflection}
                        disabled={!reflectionAnswer.trim()}
                        className="text-[9px] font-mono px-3 py-1.5 rounded-full bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-bold disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3 h-3" /> Save Reflection (+15 XP)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4">
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c]">Daily Transcription</span>
              <button
                type="button"
                onClick={handleGetDeityPrompt}
                className="text-[9px] font-mono flex items-center gap-1 text-[#c9a45c] hover:text-white bg-[#c9a45c]/10 hover:bg-[#c9a45c]/25 border border-[#c9a45c]/30 px-2.5 py-1 rounded-full cursor-pointer transition-all animate-pulse"
              >
                <Sparkles className="w-3 h-3 text-[#c9a45c]" /> Ask {selectedDeity.toUpperCase()} for Prompt
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Journal Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What is the color of this hour?" 
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75">Express Your Raw Thoughts</label>
                  <span className="text-[8px] font-mono text-slate-500">
                    {entry.trim() ? entry.trim().split(/\s+/).filter(Boolean).length : 0} words
                  </span>
                </div>

                {/* Voice Input Integration */}
                <div className={`mb-2 p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                  isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-black/30 border-brown'
                }`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                        isRecording 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : isLightMode
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                            : 'bg-[#c9a45c]/10 text-[#c9a45c] hover:bg-[#c9a45c]/25 border border-[#c9a45c]/30'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" /> Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-[#c9a45c] shrink-0" /> Speak Reflection
                        </>
                      )}
                    </button>

                    {isRecording && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}

                    <span className={`text-[10px] font-mono ${isRecording ? 'text-red-400 font-bold animate-pulse' : 'opacity-75'}`}>
                      {isRecording ? "Listening (speak clearly)..." : "Click to speak your thoughts"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono opacity-70">Lang:</span>
                    <select
                      value={speechLanguage}
                      onChange={e => setSpeechLanguage(e.target.value)}
                      disabled={isRecording}
                      className={`text-[10px] font-mono px-2 py-1 rounded-md border focus:outline-none cursor-pointer disabled:opacity-50 ${
                        isLightMode 
                          ? 'bg-white border-[#dfd2be] text-slate-800' 
                          : 'bg-black/40 border-brown text-white'
                      }`}
                    >
                      {supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {recognitionError && (
                  <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{recognitionError}</span>
                  </div>
                )}

                <textarea 
                  required
                  rows={6}
                  value={entry} 
                  onChange={e => setEntry(e.target.value)}
                  placeholder="Write honestly or click 'Speak Reflection' to speak. There are no critical judgements in the quiet spaces..." 
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] leading-relaxed ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Emotion Anchor</label>
                  <select 
                    value={selectedTag} 
                    onChange={e => setSelectedTag(e.target.value)}
                    className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                  >
                    {tags.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Guide Companion</label>
                  <select 
                    value={selectedDeity} 
                    onChange={e => setSelectedDeity(e.target.value)}
                    className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                  >
                    {deities.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                  <span className="uppercase opacity-75">Mood Level</span>
                  <span className="font-bold text-[#c9a45c]">{mood}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={mood} 
                  onChange={e => setMood(parseInt(e.target.value))}
                  className="w-full accent-[#c9a45c] bg-brown h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono opacity-50 mt-1">
                  <span>Heavy</span>
                  <span>Balanced</span>
                  <span>Radiant</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(!isMapOpen)}
                  className={`flex items-center gap-1.5 text-[10px] font-mono border px-3 py-2.5 rounded-xl cursor-pointer w-full justify-between transition-colors ${
                    selectedGeoTag 
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' 
                      : 'border-brown text-[#c9a45c] bg-black/10 hover:bg-black/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    📍 {selectedGeoTag ? `Geo-tagged: ${selectedGeoTag.locationName}` : 'Geo-tag on Earth (Optional)'}
                  </span>
                  <span className="text-[9px] underline uppercase tracking-wider">{isMapOpen ? 'Hide' : 'Open Map'}</span>
                </button>
                
                {isMapOpen && (
                  <div className="mt-2.5">
                    <GeoTagMap
                      mode="select"
                      selectedPos={selectedGeoTag ? { lat: selectedGeoTag.lat, lng: selectedGeoTag.lng } : null}
                      onSelectPos={(pos) => {
                        setSelectedGeoTag(pos);
                        setIsMapOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 mt-2 bg-[#c9a45c] hover:bg-[#b08e4f] disabled:opacity-40 text-black rounded-xl text-xs uppercase tracking-wider font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(201,164,92,0.2)]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Weaving Sage Advice...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4" />
                  Scribe Entry & Get Reflection (+10 XP)
                </>
              )}
            </button>
          </form>
          </div>

          {/* Micro Tip */}
          <p className="text-[9px] font-mono text-slate-500 mt-4 text-center border-t border-brown/10 pt-3">
            ✦ Scribing acts as cognitive restructuring, lessening amygdala activation.
          </p>
        </div>

        {/* RIGHT COLUMN: 3-Tab Ecosystem (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-brown/20 pb-1 gap-2">
            {[
              { id: 'chronicle', label: 'Chronicle 📓', tooltip: 'Your saved reflections' },
              { id: 'patterns', label: 'Pattern Spotter 📊', tooltip: 'Trend charts and reports' },
              { id: 'triumphs', label: 'Triumph Jar 🏆', tooltip: 'Celebrate small wins' },
              { id: 'somatic-map', label: 'Somatic Map 📍', tooltip: 'Geo-tagged special places' }
            ].map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-2 font-serif text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${isActive ? 'border-[#c9a45c] text-[#c9a45c]' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[460px]">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: JOURNAL FEED (CHRONICLE) */}
              {activeSubTab === 'chronicle' && (
                <motion.div 
                  key="tab-chronicle" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin"
                >
                  <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
                    <h5 className="font-serif text-xs font-bold uppercase tracking-wider text-[#c9a45c]">Saved Chronicles ({journals.length})</h5>
                    {journals.length > 0 && (
                      <button
                        onClick={downloadAllJournals}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono bg-[#c9a45c]/10 border-[#c9a45c]/30 text-[#c9a45c] hover:bg-[#c9a45c]/25 transition-all cursor-pointer font-bold shadow-sm"
                        title="Download all journal entries as a formatted text file"
                      >
                        <Download className="w-3 h-3 text-[#c9a45c]" />
                        <span>Export All (.txt)</span>
                      </button>
                    )}
                  </div>

                  {journals.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isLightMode ? 'border-[#dfd2be] text-slate-400' : 'border-brown text-sage/40'}`}>
                      <PenTool className="w-8 h-8 mb-3 text-[#c9a45c]/40" />
                      <p className="text-xs font-serif font-bold mb-1">Your scroll of memory is empty</p>
                      <p className="text-[10px] leading-relaxed max-w-[240px]">Transcribe your first experience on the left to activate your growing history and patterns.</p>
                    </div>
                  ) : (
                    journals.map((j) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={j.id}
                        className={`p-4 rounded-xl border-2 text-xs leading-relaxed space-y-3 relative overflow-hidden transition-all hover:scale-[1.01] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-[#121915] border-brown/70 hover:border-brown'}`}
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button 
                            onClick={() => downloadSingleEntry(j)}
                            className="text-[#c9a45c]/90 hover:text-[#c9a45c] text-[10px] font-mono cursor-pointer flex items-center gap-1 transition-all bg-[#c9a45c]/10 hover:bg-[#c9a45c]/20 px-2 py-0.5 rounded border border-[#c9a45c]/30 font-bold"
                            title="Download entry as text file"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">.txt</span>
                          </button>
                          <button 
                            onClick={() => deleteJournal(j.id)}
                            className="text-red-400/50 hover:text-red-400 text-[10px] font-mono cursor-pointer flex items-center gap-1 transition-all p-1"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[8px] font-mono bg-[#c9a45c]/20 text-[#c9a45c] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">{j.tag}</span>
                            <h5 className="font-serif text-sm font-bold text-white mt-1.5">{j.title}</h5>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0 mt-0.5">{j.date}</span>
                        </div>
                        
                        <p className={`opacity-90 italic pl-2 border-l border-brown/30 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>"{j.entry}"</p>
                        
                        {j.reflection && (
                          <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1 ${isLightMode ? 'bg-[#f0eade]/80 border-[#dfd2be] text-slate-700' : 'bg-black/20 border-brown text-sage'}`}>
                            <span className="font-serif font-bold text-[#c9a45c] flex items-center gap-1.5 text-[10px] uppercase">
                              <Sparkles className="w-3.5 h-3.5 text-[#c9a45c]" /> Guidance from {j.deity.toUpperCase()} ({j.mood}% mood)
                            </span>
                            <p className="whitespace-pre-wrap">{j.reflection}</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {/* TAB 2: PATTERN SPOTTER (ANALYTICS & AI REPORT) */}
              {activeSubTab === 'patterns' && (
                <motion.div 
                  key="tab-patterns" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-1"
                >
                  <h5 className="font-serif text-xs font-bold uppercase tracking-wider text-[#c9a45c] mb-1">Emotional Landscape Tracing</h5>

                  {/* RECHARTS COHERENCE DASHBOARD */}
                  {realDataPoints === 0 && (
                    <div className={`p-3 rounded-lg border flex items-start gap-2.5 text-[10.5px] leading-relaxed ${
                      isLightMode 
                        ? 'bg-[#fcfbf9] border-[#dfd2be] text-stone-700' 
                        : 'bg-[#1d2621]/80 border-[#c9a45c]/20 text-slate-300'
                    }`}>
                      <Info className="w-4 h-4 text-[#c9a45c] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#c9a45c] uppercase block mb-0.5">Simulated Cosmic Path Active</span> 
                        Let the digital guides trace your actual path! Start chatting with your companion in the{" "}
                        <span 
                          className="underline cursor-pointer font-bold hover:text-[#c9a45c]/80 transition-all text-[#c9a45c]" 
                          onClick={() => setView && setView('chat')}
                        >
                          Private Chat Buddy
                        </span>{" "}
                        room or write down your feelings in the journal below to feed real-time insights into this map!
                      </div>
                    </div>
                  )}

                  {/* Comprehensive 7-Day Dashboard */}
                  <div className={`p-5 rounded-2xl border-2 flex flex-col gap-6 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-black/15 border-brown/40'}`}>
                    
                    {/* Dashboard Header & Quick Stats Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c9a45c]/10 pb-4">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] block mb-1">Analytical Insight Engine</span>
                        <h4 className={`font-serif text-sm font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
                          7-Day Cosmic Emotional Landscape
                        </h4>
                      </div>
                      
                      {/* Metric widgets - designed elegantly to avoid nested card anti-patterns */}
                      <div className="grid grid-cols-3 gap-2 shrink-0">
                        <div className="border-r border-[#c9a45c]/15 pr-4 text-left">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider">Average Index</span>
                          <span className="text-sm font-serif font-bold text-[#c9a45c]">{averageMood}%</span>
                          <span className="block text-[8px] text-slate-500 font-sans leading-none">{moodStateLabel}</span>
                        </div>
                        <div className="border-r border-[#c9a45c]/15 px-4 text-left">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider">Interactions</span>
                          <span className="text-sm font-serif font-bold text-indigo-400">{totalActivity}</span>
                          <span className="block text-[8px] text-slate-500 font-sans leading-none">{realDataPoints} Active Days</span>
                        </div>
                        <div className="pl-4 text-left">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider">Primary Flow</span>
                          <span className="text-sm font-serif font-bold text-teal-400 truncate max-w-[80px] block">{primaryChannel === 'None' ? 'None yet' : primaryChannel}</span>
                          <span className="block text-[8px] text-slate-500 font-sans leading-none">Self-Reflexive</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      
                      {/* COL 1 & 2: Primary AreaChart Trend */}
                      <div className="lg:col-span-2 space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#c9a45c]">I. Emotional Coherence Wave</span>
                          <span className="text-[8px] font-mono text-slate-400">0% (Heavy) to 100% (Radiant)</span>
                        </div>
                        
                        <div className="w-full h-56 relative bg-black/10 rounded-xl border border-[#c9a45c]/10 p-2 overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={processedTrendData}
                              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="dashboardMoodGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#c9a45c" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#c9a45c" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke={isLightMode ? "rgba(223, 210, 190, 0.4)" : "rgba(201, 164, 92, 0.08)"} 
                                vertical={false}
                              />
                              <XAxis 
                                dataKey="weekday" 
                                stroke={isLightMode ? "#78716c" : "rgba(201, 164, 92, 0.4)"}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                domain={[0, 100]}
                                stroke={isLightMode ? "#78716c" : "rgba(201, 164, 92, 0.4)"}
                                fontSize={8}
                                tickLine={false}
                                axisLine={false}
                                ticks={[20, 50, 80]}
                                tickFormatter={(v) => v === 80 ? "RADIANT" : v === 50 ? "BALANCED" : "HEAVY"}
                              />
                              <Tooltip 
                                content={({ active, payload }: any) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className={`p-2.5 rounded-lg border-2 text-[10px] leading-normal font-mono shadow-xl ${
                                        isLightMode 
                                          ? 'bg-[#faf8f4] border-[#dfd2be] text-stone-900' 
                                          : 'bg-[#151c19] border-brown text-white'
                                      }`}>
                                        <p className="font-bold border-b border-brown/20 pb-1 mb-1 text-[#c9a45c] text-[11px]">
                                          {data.weekday}, {data.label}
                                        </p>
                                        <p className="flex justify-between gap-4">
                                          <span>Emotional Coherence:</span>
                                          <span className="font-bold text-[#c9a45c]">{data.mood}%</span>
                                        </p>
                                        <p className="flex justify-between gap-4 text-slate-400">
                                          <span>Data Origin:</span>
                                          <span className="italic">{data.source}</span>
                                        </p>
                                        {data.totalInteractions > 0 && (
                                          <p className="flex justify-between gap-4 text-slate-400 mt-0.5 pt-0.5 border-t border-dashed border-brown/10">
                                            <span>Interactions:</span>
                                            <span>{data.totalInteractions}</span>
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="mood" 
                                stroke="#c9a45c" 
                                strokeWidth={2.5}
                                fillOpacity={1} 
                                fill="url(#dashboardMoodGrad)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* COL 3: Activity Volume BarChart */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#c9a45c]">II. Daily Input Flow</span>
                          <span className="text-[8px] font-mono text-slate-400">Chats vs Journals</span>
                        </div>

                        <div className="w-full h-56 bg-black/10 rounded-xl border border-[#c9a45c]/10 p-2 flex flex-col justify-between">
                          <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={processedTrendData}
                                margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                              >
                                <CartesianGrid 
                                  strokeDasharray="2 2" 
                                  stroke={isLightMode ? "rgba(223, 210, 190, 0.4)" : "rgba(201, 164, 92, 0.05)"}
                                  vertical={false} 
                                />
                                <XAxis 
                                  dataKey="weekday" 
                                  stroke={isLightMode ? "#78716c" : "rgba(201, 164, 92, 0.3)"}
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis 
                                  allowDecimals={false}
                                  stroke={isLightMode ? "#78716c" : "rgba(201, 164, 92, 0.3)"}
                                  fontSize={8}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip 
                                  content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className={`p-2 rounded border font-mono text-[9px] ${
                                          isLightMode ? 'bg-[#faf8f4] border-[#dfd2be] text-stone-900' : 'bg-[#151c19] border-brown text-white'
                                        }`}>
                                          <p className="font-bold mb-1 text-[#c9a45c]">{data.weekday}, {data.label}</p>
                                          <p className="text-indigo-400">Chat Buddy: {data.chatCount}</p>
                                          <p className="text-[#c9a45c]">Journal: {data.journalCount}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="chatCount" name="Chat Buddy" fill="#9fa6ff" radius={[2, 2, 0, 0]} stackId="a" />
                                <Bar dataKey="journalCount" name="Journal" fill="#c9a45c" radius={[2, 2, 0, 0]} stackId="a" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Interactive Legend Row */}
                          <div className="flex items-center justify-center gap-4 border-t border-[#c9a45c]/5 pt-2 mt-1">
                            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider">
                              <span className="w-2 h-2 rounded bg-[#9fa6ff] block" />
                              <span className="text-slate-400">Chat Buddy ({totalChats})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider">
                              <span className="w-2 h-2 rounded bg-[#c9a45c] block" />
                              <span className="text-slate-400">Journal ({totalJournals})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Dominant Tag Breakdown */}
                  <div className={`p-4 rounded-xl border-2 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-black/15 border-brown/40'}`}>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#c9a45c] block mb-2">Dominant Emotional Themes</span>
                    {tagPercentages.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-2">No tags recorded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {tagPercentages.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-white font-bold">{item.name}</span>
                              <span className="text-[#c9a45c]">{item.pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden relative border border-white/5">
                              <div className="h-full bg-[#c9a45c] rounded-full" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gemini Pattern Report Engine */}
                  <div className={`p-5 rounded-xl border-2 relative overflow-hidden transition-all ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/20 border-brown/70'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono tracking-widest text-[#c9a45c] uppercase">Cognitive Coherence Report</span>
                        <h5 className="font-serif text-xs font-bold text-white flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-[#c9a45c]" /> Pattern Spotter Report
                        </h5>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed mb-4">
                      Request the temple mentors to review your entire chronicled timeline, highlight emerging patterns, and extract wins that you have accomplished.
                    </p>

                    {patternsReport ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-3.5 rounded-lg border text-[11px] leading-relaxed space-y-2 max-h-[220px] overflow-y-auto ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-700' : 'bg-black/30 border-brown text-sage'}`}
                      >
                        <span className="font-serif font-bold text-[#c9a45c] flex items-center gap-1.5 text-[9px] uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-[#c9a45c]" /> Mentorship Evaluation Report
                        </span>
                        <p className="whitespace-pre-wrap">{patternsReport}</p>
                        <button
                          onClick={() => setPatternsReport('')}
                          className="text-[8px] font-mono uppercase tracking-wider text-[#c9a45c] hover:text-white cursor-pointer block mt-3 underline"
                        >
                          Dismiss / Reset Assessment
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={handleGeneratePatternReport}
                        disabled={isAnalyzingPatterns || journals.length === 0}
                        className="w-full py-2.5 bg-[#c9a45c]/25 hover:bg-[#c9a45c]/35 disabled:opacity-40 border border-[#c9a45c]/50 text-[#c9a45c] font-mono text-[10px] uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isAnalyzingPatterns ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Analyzing Memory Scrolls...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            {journals.length === 0 ? "Write Entries to Unlock Analysis" : "Generate AI Theme Report"}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                </motion.div>
              )}

              {/* TAB 3: SMALL WINS (TRIUMPH JAR & MICRO-VICTORIES) */}
              {activeSubTab === 'triumphs' && (
                <motion.div 
                  key="tab-triumphs" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-1"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-serif text-xs font-bold uppercase tracking-wider text-[#c9a45c]">Daily Triumph Jar</h5>
                    <span className="text-[8px] font-mono text-slate-400">Each completed win gives +5 Wisdom Sparks!</span>
                  </div>

                  {/* Triumph Count summary */}
                  <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-black/25 border-brown/40'}`}>
                    <div className="text-left space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Micro-Victories Completed</span>
                      <h6 className="font-serif text-lg font-black text-white">
                        {winsList.filter(w => w.completed).length} / {winsList.length} Finished
                      </h6>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={resetWins}
                        className="text-[8px] font-mono uppercase bg-white/5 border border-brown/30 px-2 py-1.5 rounded text-slate-400 hover:text-white cursor-pointer transition-all"
                      >
                        Reset Daily
                      </button>
                      <button 
                        onClick={clearWins}
                        className="text-[8px] font-mono uppercase bg-red-500/10 border border-red-500/20 px-2 py-1.5 rounded text-red-400 hover:bg-red-500/20 cursor-pointer transition-all"
                      >
                        Clear Custom
                      </button>
                    </div>
                  </div>

                  {/* Wins Checklist */}
                  <div className="space-y-2">
                    {winsList.map(win => (
                      <div 
                        key={win.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${win.completed ? 'bg-[#c9a45c]/10 border-[#c9a45c]/50 opacity-90' : 'bg-black/15 border-brown/20'}`}
                      >
                        <div className="flex items-start gap-3 text-xs leading-relaxed text-left">
                          <button
                            onClick={(e) => toggleWin(win.id, e)}
                            className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-all cursor-pointer ${win.completed ? 'bg-[#c9a45c] border-[#c9a45c] text-black' : 'border-brown/70 hover:border-[#c9a45c]'}`}
                          >
                            {win.completed && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                          <span className={`transition-all ${win.completed ? 'line-through opacity-65 italic text-[#c9a45c]' : 'text-slate-200'}`}>
                            {win.text}
                          </span>
                        </div>
                        {win.completed && (
                          <motion.span 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="text-[9px] font-mono uppercase bg-[#c9a45c]/25 text-[#c9a45c] px-2 py-0.5 rounded font-bold shrink-0 tracking-wider"
                          >
                            Triumph! +5 XP
                          </motion.span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Micro Victory */}
                  <form onSubmit={handleAddWin} className="flex gap-2 pt-2">
                    <input 
                      type="text" 
                      required
                      value={newWinText}
                      onChange={e => setNewWinText(e.target.value)}
                      placeholder="Add another micro-win (e.g. Set a boundary, rested..." 
                      className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-[#121915] border-brown/50 text-white'}`}
                    />
                    <button
                      type="submit"
                      className="px-4 bg-[#c9a45c] hover:bg-[#b08e4f] text-black rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-all shrink-0 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* TAB 4: SOMATIC MAP (GEO-TAGGED SPECIAL PLACES) */}
              {activeSubTab === 'somatic-map' && (
                <motion.div 
                  key="tab-somatic-map" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-serif text-xs font-bold uppercase tracking-wider text-[#c9a45c]">Somatic Sanctuary Map</h5>
                    <span className="text-[8px] font-mono text-slate-400">Behold special places tagged in your journals</span>
                  </div>

                  <div className="h-96 rounded-2xl overflow-hidden border-2 border-brown bg-black/20">
                    <GeoTagMap
                      mode="view"
                      markers={journals.filter(j => !!j.geoTag)}
                    />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// 2. MOOD ANALYTICS MODULE
// ==========================================
export function MoodAnalytics({ isLightMode }: { isLightMode: boolean }) {
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [sliderMood, setSliderMood] = useState(50);
  const [moodNote, setMoodNote] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('moodHistory');
    if (stored) {
      try {
        setMoodLogs(JSON.parse(stored));
      } catch (e) {}
    } else {
      // Default baseline values for demo
      const baseline = [
        { id: '1', val: 30, note: 'Exhausted by constant rolling', date: 'Jul 15' },
        { id: '2', val: 45, note: 'Athena recommended standard rules', date: 'Jul 16' },
        { id: '3', val: 62, note: 'Felt calm in the community circle', date: 'Jul 17' },
        { id: '4', val: 55, note: 'Transitions still feel extremely scary', date: 'Jul 18' },
        { id: '5', val: 78, note: 'Saved a beautiful customized card', date: 'Jul 19' }
      ];
      setMoodLogs(baseline);
      localStorage.setItem('moodHistory', JSON.stringify(baseline));
    }
  }, []);

  const handleLogMood = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = {
      id: Date.now().toString(),
      val: sliderMood,
      note: moodNote || 'Checked in calmly',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    const updated = [...moodLogs, newLog].slice(-8); // keep last 8 entries
    setMoodLogs(updated);
    localStorage.setItem('moodHistory', JSON.stringify(updated));
    setMoodNote('');
  };

  const clearMoodHistory = () => {
    setMoodLogs([]);
    localStorage.removeItem('moodHistory');
  };

  // Compute stats
  const averageMood = moodLogs.length > 0 
    ? Math.round(moodLogs.reduce((acc, curr) => acc + curr.val, 0) / moodLogs.length) 
    : 50;

  // Render high-fidelity customized SVG Line graph (D3 inspired)
  const renderSvgChart = () => {
    if (moodLogs.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center text-xs opacity-50">
          Not enough mood check-ins. Log at least two entries to render graph.
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 30;
    
    // Scale mapping
    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (moodLogs.length - 1);
    const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / 100;

    // Build path points
    const points = moodLogs.map((log, idx) => ({
      x: getX(idx),
      y: getY(log.val),
      val: log.val,
      date: log.date
    }));

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Area gradient path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fa6ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9fa6ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9a45c" />
            <stop offset="50%" stopColor="#9fa6ff" />
            <stop offset="100%" stopColor="#84a98c" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[25, 50, 75, 100].map((grid, idx) => (
          <g key={idx} opacity="0.1">
            <line 
              x1={padding} 
              y1={getY(grid)} 
              x2={width - padding} 
              y2={getY(grid)} 
              stroke="white" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            <text x={padding - 5} y={getY(grid) + 3} fill="white" fontSize="8" textAnchor="end">{grid}</text>
          </g>
        ))}

        {/* Area */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Main Line */}
        <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Nodes and Text */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4.5" 
              fill="#03070f" 
              stroke="#c9a45c" 
              strokeWidth="2.5" 
            />
            {/* Tooltip on hover simulation */}
            <text 
              x={p.x} 
              y={p.y - 10} 
              fill="#c9a45c" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor="middle" 
              opacity="0.8"
            >
              {p.val}%
            </text>
            <text 
              x={p.x} 
              y={height - 10} 
              fill="gray" 
              fontSize="8" 
              textAnchor="middle"
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-brown/20 pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl font-bold">Mood Analytics</h3>
          <p className="text-xs opacity-75">Observe the contours of your mind. Analyze peaks of triumphs and troughs of struggles.</p>
        </div>
        <button 
          onClick={clearMoodHistory} 
          className="text-[9px] font-mono tracking-wider border border-red-500/30 hover:border-red-500 text-red-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase"
        >
          Reset Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Check-in log */}
        <div className={`p-6 rounded-2xl border-2 lg:col-span-1 flex flex-col justify-between ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <form onSubmit={handleLogMood} className="space-y-5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Instant Check-in</span>
            
            <div className="text-center py-4 bg-black/10 rounded-xl">
              <span className="text-3xl font-serif font-black text-[#c9a45c]">{sliderMood}%</span>
              <p className="text-[9px] font-mono uppercase tracking-wider opacity-65 mt-1">Current Mood Energy</p>
            </div>

            <div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sliderMood} 
                onChange={e => setSliderMood(parseInt(e.target.value))}
                className="w-full accent-periwinkle bg-brown h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono opacity-50 mt-1">
                <span>Heavy</span>
                <span>Calm</span>
                <span>Radiant</span>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Short Vibe Note (Optional)</label>
              <input 
                type="text" 
                value={moodNote}
                onChange={e => setMoodNote(e.target.value)}
                placeholder="Ex. heavy shoulders, slow breathing..."
                className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08b47] text-black font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer"
            >
              Log State to Timeline
            </button>
          </form>
        </div>

        {/* Right Side: Graph & Stats list */}
        <div className={`p-6 rounded-2xl border-2 lg:col-span-2 space-y-6 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <div className="flex justify-between items-center border-b border-brown/20 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-periwinkle">Mental Landscape Chart</span>
            <span className="text-[10px] font-mono text-sage uppercase">Average Mood Score: <span className="font-bold text-white bg-periwinkle px-2 py-0.5 rounded-full">{averageMood}%</span></span>
          </div>

          <div className="p-2 bg-black/15 rounded-xl border border-white/5">
            {renderSvgChart()}
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-sage block">Historical Logs (Last 5 Check-ins)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moodLogs.slice().reverse().slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-black/10 border border-brown/20 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <span className="text-[9px] font-mono text-sage block">{log.date}</span>
                    <span className="opacity-90 italic truncate block">"{log.note}"</span>
                  </div>
                  <span className={`text-xs font-bold font-mono py-1 px-2.5 rounded-full shrink-0 ${log.val < 40 ? 'bg-red-400/10 text-red-400' : log.val < 70 ? 'bg-[#c9a45c]/10 text-[#c9a45c]' : 'bg-green-400/10 text-green-400'}`}>
                    {log.val}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// 3. SLOW LETTERS MODULE
// ==========================================
export function SlowLetters({ isLightMode }: { isLightMode: boolean }) {
  const [recipient, setRecipient] = useState('My Future Self');
  const [letterBody, setLetterBody] = useState('');
  const [delay, setDelay] = useState('10'); // delay in seconds (10s for fast test, or 3600 for hour)
  const [sentLetters, setSentLetters] = useState<any[]>([]);
  const [showWaxSeal, setShowWaxSeal] = useState(false);
  const [sealColor, setSealColor] = useState('crimson');

  useEffect(() => {
    const stored = localStorage.getItem('slowLetters');
    if (stored) {
      try { setSentLetters(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  // Update real-time countdown for letters
  useEffect(() => {
    const interval = setInterval(() => {
      let changed = false;
      const now = Date.now();
      const updated = sentLetters.map(letter => {
        if (letter.status === 'pending') {
          const remaining = Math.max(0, Math.round((letter.deliverAt - now) / 1000));
          if (remaining <= 0) {
            changed = true;
            // Generate a thoughtful response from the deity
            const replies: Record<string, string> = {
              'My Future Self': `Dear past self. I read your letter. You worried so much about tomorrow, but please know that the tides settled, the breathing worked, and we made it. You are stronger than you thought.`,
              'Sisyphus': `I read your words. The stone is heavy, indeed. But today, the hill was merciful. Let yourself breathe. You don't need to complete the climb today to be valued.`,
              'Athena': `Tactics and plans have arrived. I urge you to look at the dialectic: you can want change and accept who you are right now. This is the synthesis of wisdom.`,
              'Ares': `Your anger is safe with me. Do not poison yourself with silence. Speak the fire out cleanly, paint the canvas crimson, and let your sovereignty reign.`,
              'Poseidon': `Let your tides break. My storms are vast, yet they always return to complete, still peace. Your grief is just love looking for a shore.`
            };
            return { 
              ...letter, 
              status: 'delivered', 
              countdown: 0,
              reply: replies[letter.to] || `Your letter was safely received in the temple. The winds carry a whisper: 'Be gentle with your soul today.'`
            };
          }
          return { ...letter, countdown: remaining };
        }
        return letter;
      });

      if (changed || updated.some((l, idx) => l.countdown !== sentLetters[idx]?.countdown)) {
        setSentLetters(updated);
        localStorage.setItem('slowLetters', JSON.stringify(updated));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sentLetters]);

  const handleSendLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterBody.trim()) return;

    setShowWaxSeal(true);

    // After animation, store letter
    setTimeout(() => {
      const delayMs = parseInt(delay) * 1000;
      const deliverAt = Date.now() + delayMs;

      const newLetter = {
        id: Date.now().toString(),
        to: recipient,
        body: letterBody,
        sealColor,
        status: 'pending',
        deliverAt,
        countdown: parseInt(delay),
        sentAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        reply: null
      };

      const updated = [newLetter, ...sentLetters];
      setSentLetters(updated);
      localStorage.setItem('slowLetters', JSON.stringify(updated));

      // Reset inputs
      setLetterBody('');
      setShowWaxSeal(false);
    }, 1800);
  };

  const deleteLetter = (id: string) => {
    const updated = sentLetters.filter(l => l.id !== id);
    setSentLetters(updated);
    localStorage.setItem('slowLetters', JSON.stringify(updated));
  };

  const getSealColorHex = (color: string) => {
    if (color === 'gold') return '#c9a45c';
    if (color === 'emerald') return '#84a98c';
    if (color === 'celestial') return '#9fa6ff';
    return '#e07070'; // default crimson
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">Slow Letters Mailbox</h3>
        <p className="text-xs opacity-75">Send messages to future versions of yourself or deities. Encapsulated in slow delivery to teach patience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        
        {/* Wax Seal Overlay Animation */}
        <AnimatePresence>
          {showWaxSeal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center text-center rounded-2xl"
            >
              <motion.div 
                initial={{ scale: 0.1, rotate: -45 }}
                animate={{ scale: [1.2, 1], rotate: 0 }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative border-4 border-white/20"
                style={{ backgroundColor: getSealColorHex(sealColor) }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center font-serif text-white font-extrabold text-xl animate-pulse">
                  Ψ
                </div>
              </motion.div>
              <h4 className="font-serif text-lg text-white mt-4 font-bold tracking-widest uppercase">STAMPING WAX SEAL</h4>
              <p className="text-xs text-[#c9a45c] font-mono mt-1">Delivering letter with intentional lag...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose Letter Card */}
        <div className={`p-6 rounded-2xl border-2 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <form onSubmit={handleSendLetter} className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-periwinkle block">Write a slow letter</span>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Recipient</label>
              <select 
                value={recipient} 
                onChange={e => setRecipient(e.target.value)}
                className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
              >
                <option value="My Future Self">My Future Self</option>
                <option value="Sisyphus">Sisyphus (Somatic heavy lifter)</option>
                <option value="Athena">Athena (Strategic DBT Guide)</option>
                <option value="Ares">Ares (Fiery Kalamkari Alchemist)</option>
                <option value="Poseidon">Poseidon (Oceanic Storm Pacifier)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Wax Seal Vibe</label>
                <select 
                  value={sealColor} 
                  onChange={e => setSealColor(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                >
                  <option value="crimson">Crimson (Vulnerability)</option>
                  <option value="gold">Gold (Sovereignty)</option>
                  <option value="emerald">Emerald (Balance)</option>
                  <option value="celestial">Celestial Blue (Cosmic)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Delivery Lag</label>
                <select 
                  value={delay} 
                  onChange={e => setDelay(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                >
                  <option value="10">10 Seconds (Fast Demo)</option>
                  <option value="60">1 Minute</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">1 Day</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Letter Body</label>
              <textarea 
                required
                rows={6}
                value={letterBody} 
                onChange={e => setLetterBody(e.target.value)}
                placeholder="Write your long-delayed confession. Seal it, release it, and let the space breathe..." 
                className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] font-serif leading-relaxed ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#e07070] hover:bg-red-500 text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer shadow-[0_4px_12px_rgba(224,112,112,0.2)]"
            >
              ✦ Seal Letter and Send
            </button>
          </form>
        </div>

        {/* Vintage Mailbox Grid */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-none">
          <h4 className="font-serif text-sm font-bold opacity-80 uppercase tracking-wider">Your Vintage Mailbox</h4>
          {sentLetters.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isLightMode ? 'border-[#dfd2be] text-slate-400' : 'border-brown text-sage/40'}`}>
              <Mail className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Your letter box is empty. Seal your first letter to experience intentional delay.</p>
            </div>
          ) : (
            sentLetters.map((letter) => (
              <div 
                key={letter.id}
                className={`p-5 rounded-xl border-2 text-xs leading-relaxed space-y-3 relative overflow-hidden ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-[#1b2420] border-brown'}`}
              >
                <button 
                  onClick={() => deleteLetter(letter.id)}
                  className="absolute top-4 right-4 text-red-400/60 hover:text-red-400 text-[10px] font-mono"
                >
                  Delete
                </button>

                <div className="flex items-center gap-3">
                  {/* Wax Seal icon representing status */}
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-serif text-[10px] font-bold text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: getSealColorHex(letter.sealColor) }}
                  >
                    Ψ
                  </div>
                  <div>
                    <h5 className="font-serif text-sm font-bold text-[#c9a45c]">To: {letter.to}</h5>
                    <span className="text-[8px] font-mono opacity-50">Dispatched: {letter.sentAt}</span>
                  </div>
                </div>

                <p className="opacity-80 italic border-l-2 border-brown/35 pl-3">"{letter.body}"</p>

                {letter.status === 'pending' ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-mono">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>In-Transit: {letter.countdown}s remaining until safe delivery</span>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg border text-[11px] leading-relaxed space-y-2 ${isLightMode ? 'bg-[#f0eade]/80 border-[#dfd2be]' : 'bg-black/25 border-brown'}`}>
                    <span className="font-serif font-black text-[#c9a45c] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      ✉️ Received Reply
                    </span>
                    <p className="whitespace-pre-wrap">{letter.reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 4. COMMUNITY SUPPORT GROVE
// ==========================================
export function CommunitySupport({ isLightMode }: { isLightMode: boolean }) {
  const [grovePosts, setGrovePosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedFlower, setSelectedFlower] = useState('Lotus');

  const flowers = [
    { name: 'Lotus', symbol: '🪷', color: 'text-pink-400' },
    { name: 'Sunflower', symbol: '🌻', color: 'text-yellow-400' },
    { name: 'Hibiscus', symbol: '🌺', color: 'text-red-400' },
    { name: 'Tulip', symbol: '🌷', color: 'text-purple-400' },
    { name: 'Rose', symbol: '🌹', color: 'text-rose-400' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('grovePosts');
    if (stored) {
      try { setGrovePosts(JSON.parse(stored)); } catch (e) {}
    } else {
      const initial = [
        { id: '1', flower: '🪷', text: 'I sat with Sisyphus today. It is okay that the boulder went down. I needed the walk down.', hearts: 12, candleLit: true, author: 'Anonymous Lotus' },
        { id: '2', flower: '🌻', text: 'Athena reminds me that being competent and being loved are two separate parameters. Deep sigh of relief.', hearts: 24, candleLit: false, author: 'Anonymous Sunflower' },
        { id: '3', flower: '🌷', text: 'Rudra (Ares) let me be angry without calling me dangerous. I am painting my rage out.', hearts: 9, candleLit: true, author: 'Anonymous Tulip' }
      ];
      setGrovePosts(initial);
      localStorage.setItem('grovePosts', JSON.stringify(initial));
    }
  }, []);

  const handlePostWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const flowerObj = flowers.find(f => f.name === selectedFlower) || flowers[0];

    const post = {
      id: Date.now().toString(),
      flower: flowerObj.symbol,
      text: newPost,
      hearts: 0,
      candleLit: false,
      author: `Anonymous ${flowerObj.name}`
    };

    const updated = [post, ...grovePosts];
    setGrovePosts(updated);
    localStorage.setItem('grovePosts', JSON.stringify(updated));
    setNewPost('');
  };

  const handleGiveHeart = (id: string) => {
    const updated = grovePosts.map(p => {
      if (p.id === id) return { ...p, hearts: p.hearts + 1 };
      return p;
    });
    setGrovePosts(updated);
    localStorage.setItem('grovePosts', JSON.stringify(updated));
  };

  const handleToggleCandle = (id: string) => {
    const updated = grovePosts.map(p => {
      if (p.id === id) return { ...p, candleLit: !p.candleLit };
      return p;
    });
    setGrovePosts(updated);
    localStorage.setItem('grovePosts', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">Community Support Grove</h3>
        <p className="text-xs opacity-75">Plant anonymous whispers in our silent sacred grove. Lift candles of solidarity for kindred spirits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Plant a Whisper Card */}
        <div className={`p-6 rounded-2xl border-2 lg:col-span-1 h-fit ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <form onSubmit={handlePostWhisper} className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-periwinkle block">Plant an anonymous whisper</span>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Choose your Flower Emblem</label>
              <div className="grid grid-cols-5 gap-2">
                {flowers.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setSelectedFlower(f.name)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-lg ${selectedFlower === f.name ? 'border-[#c9a45c] bg-[#c9a45c]/25 scale-110' : 'border-brown/20 bg-white/5 hover:bg-white/10'}`}
                    title={f.name}
                  >
                    {f.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Your Supportive Whisper</label>
              <textarea 
                required
                rows={4}
                value={newPost} 
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share a raw truth, a moment of de-escalation, or a supportive thought..." 
                className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-periwinkle text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer shadow-[0_4px_12px_rgba(159,166,255,0.2)]"
            >
              🪷 Plant in Sacred Grove
            </button>
          </form>
        </div>

        {/* Support Grid Feed */}
        <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto scrollbar-none">
          <h4 className="font-serif text-sm font-bold opacity-80 uppercase tracking-wider">The Whispering Grove</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grovePosts.map((post) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={post.id}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between text-xs leading-relaxed space-y-3 relative overflow-hidden ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-[#1b2420] border-brown'}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{post.flower}</span>
                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#c9a45c]">{post.author}</span>
                  </div>
                  <p className="opacity-90 italic">"{post.text}"</p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-brown/10">
                  <button 
                    onClick={() => handleGiveHeart(post.id)}
                    className="flex items-center gap-1 text-red-400 hover:scale-110 transition-transform font-mono text-[9px] font-bold cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-red-400/20" /> Send Warmth ({post.hearts})
                  </button>
                  <button 
                    onClick={() => handleToggleCandle(post.id)}
                    className={`flex items-center gap-1 font-mono text-[9px] font-bold cursor-pointer transition-colors ${post.candleLit ? 'text-yellow-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    <span>🕯️</span> {post.candleLit ? 'Candle Lit' : 'Light Candle'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 5. WELLNESS TOOLS MODULE
// ==========================================
export function WellnessTools({ isLightMode }: { isLightMode: boolean }) {
  // Breathing Sanctuary State
  const [breathingStyle, setBreathingStyle] = useState<'478' | 'box'>('478');
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-out'>('inhale');
  const [breatheSeconds, setBreatheSeconds] = useState(4);
  const [isActive, setIsActive] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundType, setSoundType] = useState<'ocean' | 'singing-bowl' | 'synth' | 'silent'>('ocean');
  const [volume, setVolume] = useState(40);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  // Somatic map state
  const [somaticZone, setSomaticZone] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<any[]>([]);

  // Award mindfulness points upon completing a cycle
  const awardMindfulnessPoints = () => {
    const profileRaw = localStorage.getItem('oracleProfile');
    if (profileRaw) {
      try {
        const profile = JSON.parse(profileRaw);
        if (profile && profile.stats) {
          profile.stats.mindfulness = Math.min(100, (profile.stats.mindfulness || 50) + 1);
          profile.stats.grounding = Math.min(100, (profile.stats.grounding || 50) + 1);
          localStorage.setItem('oracleProfile', JSON.stringify(profile));
          window.dispatchEvent(new Event('oracleProfileUpdated'));
        }
      } catch (e) {
        console.error("Failed to update oracle profile stats:", e);
      }
    }
  };

  const getDurationForPhase = (phase: string, style: '478' | 'box') => {
    if (style === '478') {
      if (phase === 'inhale') return 4;
      if (phase === 'hold') return 7;
      return 8; // exhale
    } else {
      return 4; // inhale, hold, exhale, hold-out are all 4 seconds
    }
  };

  // Safe Web Audio Context and Node Initialization
  const initAudio = async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(volume / 100, ctx.currentTime);
      mainGain.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      mainGainRef.current = mainGain;
    } catch (e) {
      console.error("Failed to initialize Web Audio API:", e);
    }
  };

  // Safe release of active synthesizers
  const stopActiveOscillators = () => {
    activeSourcesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // No-op for nodes already completed
      }
    });
    activeSourcesRef.current = [];
  };

  // 1. "Cosmic Ocean" white noise with lowpass swept resonance
  const playOceanWave = (phase: string, duration: number) => {
    if (!audioCtxRef.current || !mainGainRef.current) return;
    const ctx = audioCtxRef.current;
    stopActiveOscillators();

    try {
      const bufferSize = ctx.sampleRate * 4; // 4 seconds of loopable noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(mainGainRef.current);

      const t = ctx.currentTime;
      if (phase === 'inhale') {
        noiseGain.gain.setValueAtTime(0.01, t);
        noiseGain.gain.linearRampToValueAtTime(0.35, t + duration);

        filter.frequency.setValueAtTime(120, t);
        filter.frequency.exponentialRampToValueAtTime(750, t + duration);
      } else if (phase === 'hold') {
        noiseGain.gain.setValueAtTime(0.22, t);
        noiseGain.gain.linearRampToValueAtTime(0.18, t + duration);

        filter.frequency.setValueAtTime(550, t);
        filter.frequency.linearRampToValueAtTime(450, t + duration);
      } else if (phase === 'exhale') {
        noiseGain.gain.setValueAtTime(0.35, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        filter.frequency.setValueAtTime(750, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + duration);
      } else { // hold-out (box only)
        noiseGain.gain.setValueAtTime(0.01, t);
        filter.frequency.setValueAtTime(90, t);
      }

      noiseSource.start(t);
      activeSourcesRef.current.push(noiseSource, noiseGain, filter);
    } catch (err) {
      console.error("Ocean wave synthesis error", err);
    }
  };

  // 2. "Tibetan Singing Bowl" transition ring and harmonic shimmer
  const playSingingBowl = (phase: string, duration: number) => {
    if (!audioCtxRef.current || !mainGainRef.current) return;
    const ctx = audioCtxRef.current;
    stopActiveOscillators();

    try {
      const t = ctx.currentTime;
      
      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'sine';
      oscFundamental.frequency.setValueAtTime(144, t);

      const oscOvertone1 = ctx.createOscillator();
      oscOvertone1.type = 'sine';
      oscOvertone1.frequency.setValueAtTime(288, t);

      const oscOvertone2 = ctx.createOscillator();
      oscOvertone2.type = 'sine';
      oscOvertone2.frequency.setValueAtTime(435, t); // shimmering beats

      const bowlGain = ctx.createGain();
      bowlGain.gain.setValueAtTime(0, t);
      bowlGain.gain.linearRampToValueAtTime(0.28, t + 0.08);
      bowlGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      oscFundamental.connect(bowlGain);
      oscOvertone1.connect(bowlGain);
      oscOvertone2.connect(bowlGain);
      bowlGain.connect(mainGainRef.current);

      oscFundamental.start(t);
      oscOvertone1.start(t);
      oscOvertone2.start(t);

      oscFundamental.stop(t + duration);
      oscOvertone1.stop(t + duration);
      oscOvertone2.stop(t + duration);

      activeSourcesRef.current.push(oscFundamental, oscOvertone1, oscOvertone2, bowlGain);
    } catch (err) {
      console.error("Singing bowl synthesis error", err);
    }
  };

  // 3. "Muted Synth Pad" deep warm chord envelopes
  const playSynthPad = (phase: string, duration: number) => {
    if (!audioCtxRef.current || !mainGainRef.current) return;
    const ctx = audioCtxRef.current;
    stopActiveOscillators();

    try {
      const t = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(110, t); // deep base

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(165, t); // fifth interval

      const padGain = ctx.createGain();
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';

      osc1.connect(padFilter);
      osc2.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(mainGainRef.current);

      if (phase === 'inhale') {
        padGain.gain.setValueAtTime(0.02, t);
        padGain.gain.linearRampToValueAtTime(0.3, t + duration);

        padFilter.frequency.setValueAtTime(130, t);
        padFilter.frequency.exponentialRampToValueAtTime(320, t + duration);
      } else if (phase === 'hold') {
        padGain.gain.setValueAtTime(0.24, t);
        padGain.gain.linearRampToValueAtTime(0.18, t + duration);

        padFilter.frequency.setValueAtTime(300, t);
        padFilter.frequency.linearRampToValueAtTime(250, t + duration);
      } else if (phase === 'exhale') {
        padGain.gain.setValueAtTime(0.28, t);
        padGain.gain.exponentialRampToValueAtTime(0.02, t + duration);

        padFilter.frequency.setValueAtTime(300, t);
        padFilter.frequency.exponentialRampToValueAtTime(110, t + duration);
      } else {
        padGain.gain.setValueAtTime(0.01, t);
        padFilter.frequency.setValueAtTime(100, t);
      }

      osc1.start(t);
      osc2.start(t);

      osc1.stop(t + duration);
      osc2.stop(t + duration);

      activeSourcesRef.current.push(osc1, osc2, padGain, padFilter);
    } catch (err) {
      console.error("Synth pad synthesis error", err);
    }
  };

  const applyAudioForPhase = (phase: string, duration: number) => {
    if (soundType === 'silent') {
      stopActiveOscillators();
      return;
    }
    initAudio().then(() => {
      if (soundType === 'ocean') {
        playOceanWave(phase, duration);
      } else if (soundType === 'singing-bowl') {
        playSingingBowl(phase, duration);
      } else if (soundType === 'synth') {
        playSynthPad(phase, duration);
      }
    });
  };

  // Sync volume slider with Web Audio API Gain
  useEffect(() => {
    if (mainGainRef.current && audioCtxRef.current) {
      mainGainRef.current.gain.setValueAtTime(volume / 100, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Sync sound changes or toggle changes
  useEffect(() => {
    if (isActive) {
      applyAudioForPhase(breathePhase, breatheSeconds);
    } else {
      stopActiveOscillators();
    }
  }, [soundType]);

  // Handle active countdown and ticking
  useEffect(() => {
    let timer: any;
    if (isActive) {
      timer = setInterval(() => {
        setBreatheSeconds(prev => {
          if (prev <= 1) {
            return 0; // Trigger transition in separate synced effect safely
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopActiveOscillators();
    }
    return () => clearInterval(timer);
  }, [isActive, breathingStyle, soundType]);

  // Safe Phase Transition Effect
  useEffect(() => {
    if (isActive && breatheSeconds === 0) {
      let nextPhase: 'inhale' | 'hold' | 'exhale' | 'hold-out' = 'inhale';
      if (breathingStyle === '478') {
        if (breathePhase === 'inhale') {
          nextPhase = 'hold';
        } else if (breathePhase === 'hold') {
          nextPhase = 'exhale';
        } else {
          nextPhase = 'inhale';
          setCompletedCycles(c => {
            const nextC = c + 1;
            awardMindfulnessPoints();
            if (nextC >= 4) {
              setIsActive(false);
              setShowCompletionBanner(true);
            }
            return nextC;
          });
        }
      } else { // 'box'
        if (breathePhase === 'inhale') {
          nextPhase = 'hold';
        } else if (breathePhase === 'hold') {
          nextPhase = 'exhale';
        } else if (breathePhase === 'exhale') {
          nextPhase = 'hold-out';
        } else {
          nextPhase = 'inhale';
          setCompletedCycles(c => {
            const nextC = c + 1;
            awardMindfulnessPoints();
            if (nextC >= 4) {
              setIsActive(false);
              setShowCompletionBanner(true);
            }
            return nextC;
          });
        }
      }

      setBreathePhase(nextPhase);
      const duration = getDurationForPhase(nextPhase, breathingStyle);
      setBreatheSeconds(duration);
      applyAudioForPhase(nextPhase, duration);
    }
  }, [breatheSeconds, isActive, breathingStyle]);

  // Cleanup synthesis on unmount
  useEffect(() => {
    return () => {
      stopActiveOscillators();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (!isActive) {
      setShowCompletionBanner(false);
      await initAudio();
      setIsActive(true);
      // Reset if completed or fresh start
      if (breatheSeconds === 0 || completedCycles >= 4) {
        setCompletedCycles(0);
        setBreathePhase('inhale');
        setBreatheSeconds(4);
        applyAudioForPhase('inhale', 4);
      } else {
        applyAudioForPhase(breathePhase, breatheSeconds);
      }
    } else {
      setIsActive(false);
      stopActiveOscillators();
    }
  };

  const handleReset = () => {
    setIsActive(false);
    stopActiveOscillators();
    setCompletedCycles(0);
    setBreathePhase('inhale');
    setBreatheSeconds(4);
    setShowCompletionBanner(false);
  };

  const handleStyleChange = (style: '478' | 'box') => {
    setIsActive(false);
    stopActiveOscillators();
    setBreathingStyle(style);
    setCompletedCycles(0);
    setBreathePhase('inhale');
    setBreatheSeconds(4);
    setShowCompletionBanner(false);
  };

  // Dynamic Instructions
  const getSomaticGuidance = () => {
    if (!isActive) return 'Configure your style and soundscape, then tap Begin below to start.';
    if (breathingStyle === '478') {
      if (breathePhase === 'inhale') return 'Inhale quietly through your nose. Expand your chest...';
      if (breathePhase === 'hold') return 'Hold the breath. Suspend your thoughts. Relax your jaw...';
      return 'Exhale fully through your mouth with a soft whooshing sound...';
    } else {
      if (breathePhase === 'inhale') return 'Inhale slowly. Fill your stomach with calming light...';
      if (breathePhase === 'hold') return 'Hold. Keep the oxygen warm inside your core...';
      if (breathePhase === 'exhale') return 'Exhale slowly, releasing all muscle tension...';
      return 'Hold empty. Sit in the unyielding peace of deep silence...';
    }
  };

  // Somatic map exercises
  const somaticExercises: Record<string, { deity: string, art: string, text: string, steps: string[] }> = {
    'head': {
      deity: 'Athena (Hope)',
      art: 'Warli Art Geometry',
      text: 'DBT Dialectics Focus. Ground racing thoughts into sharp geometric, concentric patterns.',
      steps: [
        'Close your eyes and visualize a tiny central point on a canvas.',
        'Slowly draw 3 Warli concentric circles around this point in your mind.',
        'With each circle, whisper one truth you believe, and one fear you accept.'
      ]
    },
    'shoulders': {
      deity: 'Sisyphus (Raag)',
      art: 'Pichwai Miniature devotional art',
      text: 'Somatic Boulder Release. Untie physical burdens stacked in the neck and shoulder plates.',
      steps: [
        'Inhale deeply and shrug your shoulders high up to your ears.',
        'Hold this heavy tension, acknowledging the "Sisyphus Boulder" you carry.',
        'Exhale sharply and roll your shoulders back, letting the weight drop onto the floor.'
      ]
    },
    'chest': {
      deity: 'Poseidon (Jhulelal)',
      art: 'Madhubani Sea Waves',
      text: 'Oceanic Wave Breathing. Soften high anxiety panic loops held tight in the ribcage.',
      steps: [
        'Place one hand firmly on the center of your chest, feeling your heartbeat.',
        'Inhale, visualizing a deep teal sea wave rolling up to the shore.',
        'Exhale, letting the water break and recede quietly back into absolute depths.'
      ]
    },
    'hands': {
      deity: 'Ares (Rudra)',
      art: 'Kalamkari Fiery outline work',
      text: 'Rage Alchemy grip and release. Vent high physical energy, anger, or panic.',
      steps: [
        'Clench your hands into extremely tight fists, squeezing all rage and heat into your palms.',
        'Take a sharp breath, staring into the internal fire of Rudra.',
        'Exhale slowly, opening your fingers one by one, letting the warmth pour onto the canvas.'
      ]
    },
    'feet': {
      deity: 'Hades (Veer)',
      art: 'Pata Chitra Scroll Grounding',
      text: 'Underworld Rooting. Direct grounding of chaotic overthinking back into the soil.',
      steps: [
        'Press both feet absolutely flat on the floor, feeling the physical floor plates supporting you.',
        'Imagine drawing mineral gold lines from your heels directly down into the earth.',
        'Breathe slowly, feeling the unyielding quiet of Hades guarding your safety.'
      ]
    }
  };

  const startSomaticExercise = () => {
    setTimerSeconds(15);
    setTimerRunning(true);
  };

  // Exercise countdown timer for Somatic mapping
  useEffect(() => {
    let timer: any;
    if (timerRunning && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            // Give user XP / Stats
            const profileRaw = localStorage.getItem('oracleProfile');
            if (profileRaw) {
              try {
                const p = JSON.parse(profileRaw);
                if (p && p.stats) {
                  p.stats.resilience = Math.min(100, (p.stats.resilience || 50) + 5);
                  localStorage.setItem('oracleProfile', JSON.stringify(p));
                  window.dispatchEvent(new Event('oracleProfileUpdated'));
                }
              } catch (err) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timerSeconds]);

  // Color mapping based on phase
  const getOrbGradient = () => {
    if (!isActive) return 'from-amber-600/10 to-[#c9a45c]/20 border-[#c9a45c]/40';
    if (breathePhase === 'inhale') return 'from-emerald-600/20 to-teal-500/20 border-emerald-400/60';
    if (breathePhase === 'hold') return 'from-purple-600/20 to-indigo-500/20 border-indigo-400/60';
    if (breathePhase === 'exhale') return 'from-rose-600/20 to-orange-500/20 border-rose-400/60';
    return 'from-amber-600/10 to-[#c9a45c]/20 border-amber-400/40'; // hold-out (empty)
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">Wellness & Somatic Hub</h3>
        <p className="text-xs opacity-75">Connect your physical shell with dynamic archetypal exercises. Master your breathing loop.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Breathing Sanctuary Box */}
        <div className={`p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[480px] relative overflow-hidden transition-colors duration-500 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          
          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c]">Grounding Sanctuary</span>
                <h4 className="font-serif text-lg font-bold text-white mt-0.5">Pranayama Breathing</h4>
              </div>
              
              {/* Technique Selector */}
              <div className="flex bg-black/30 p-1 rounded-xl border border-brown/40">
                <button 
                  onClick={() => handleStyleChange('478')}
                  className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${breathingStyle === '478' ? 'bg-[#c9a45c] text-black font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  4-7-8 Relief
                </button>
                <button 
                  onClick={() => handleStyleChange('box')}
                  className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${breathingStyle === 'box' ? 'bg-[#c9a45c] text-black font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  4-4-4-4 Box
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-[#c9a45c]/90 bg-[#c9a45c]/5 border border-[#c9a45c]/10 rounded-lg p-2 font-mono leading-relaxed">
              {breathingStyle === '478' 
                ? '✦ 4-7-8 Technique: A natural tranquilizer for the nervous system. Calms the amygdala, drops blood pressure, and halts high anxiety.'
                : '✦ Box Breathing: Clear stress and sharpen cognitive focus. Used extensively by emergency responders to regulate high-stakes panic.'}
            </p>
          </div>

          {/* Core Dynamic Breathing Stage */}
          <div className="relative w-full flex items-center justify-center my-8 h-48">
            <AnimatePresence>
              {isActive && (
                <>
                  {/* Expanding Aura Wave */}
                  <motion.div 
                    animate={{
                      scale: breathePhase === 'inhale' ? 1.6 : breathePhase === 'hold' ? [1.6, 1.64, 1.6] : breathePhase === 'exhale' ? 0.95 : 0.95,
                      borderColor: breathePhase === 'inhale' ? 'rgba(52, 211, 153, 0.4)' : breathePhase === 'hold' ? 'rgba(129, 140, 248, 0.4)' : 'rgba(244, 63, 94, 0.4)'
                    }}
                    transition={{ 
                      duration: getDurationForPhase(breathePhase, breathingStyle), 
                      ease: 'easeInOut',
                      repeat: breathePhase === 'hold' ? Infinity : 0,
                      repeatType: 'reverse'
                    }}
                    className="absolute w-44 h-44 rounded-full border-2 border-dashed pointer-events-none"
                  />
                  
                  {/* Subtle Calming Energy Ripples */}
                  {breathePhase === 'inhale' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0.8 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute w-44 h-44 rounded-full border border-emerald-400/20 pointer-events-none"
                    />
                  )}
                </>
              )}
            </AnimatePresence>

            {/* Inner Glowing Respiration Orb */}
            <motion.div 
              animate={{
                scale: !isActive ? 1.0 :
                       breathePhase === 'inhale' ? 1.45 :
                       breathePhase === 'hold' ? [1.45, 1.48, 1.45] :
                       breathePhase === 'exhale' ? 0.92 : 0.92,
              }}
              transition={{ 
                duration: isActive ? getDurationForPhase(breathePhase, breathingStyle) : 0.5,
                ease: 'easeInOut',
                repeat: (isActive && breathePhase === 'hold') ? Infinity : 0,
                repeatType: 'reverse'
              }}
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${getOrbGradient()} border-2 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(0,0,0,0.3)] relative z-10`}
            >
              <span className="font-serif text-[10px] font-bold text-[#c9a45c] tracking-widest uppercase mb-0.5">
                {isActive ? (breathePhase === 'hold-out' ? 'EMPTY' : breathePhase) : 'READY'}
              </span>
              {isActive ? (
                <span className="text-3xl font-serif font-black text-white">{breatheSeconds}s</span>
              ) : (
                <Wind className="w-8 h-8 text-[#c9a45c]/60 animate-pulse mt-1" />
              )}
            </motion.div>
          </div>

          {/* Real-time Somatic Instructions */}
          <div className="w-full space-y-4">
            <div className="text-center min-h-[44px] flex items-center justify-center">
              <p className="text-xs opacity-90 text-[#c9a45c] font-medium leading-relaxed italic max-w-sm">
                {getSomaticGuidance()}
              </p>
            </div>

            {/* Control Panel: Start, Reset, Soundscapes */}
            <div className="space-y-4 pt-2 border-t border-brown/20">
              
              {/* Trigger Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={handleTogglePlay}
                  className={`col-span-2 py-3 font-mono text-xs uppercase tracking-widest rounded-xl font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${isActive ? 'bg-red-400/20 border border-red-400/40 text-red-400 hover:bg-red-400/30' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'}`}
                >
                  {isActive ? <><Pause className="w-4 h-4" /> Pause Loop</> : <><Play className="w-4 h-4 animate-pulse" /> Start Breathing</>}
                </button>

                <button 
                  onClick={handleReset}
                  className={`py-3 font-mono text-xs uppercase tracking-widest rounded-xl font-semibold border transition-all cursor-pointer bg-black/10 border-brown/40 text-slate-400 hover:text-white hover:border-brown`}
                >
                  Reset
                </button>
              </div>

              {/* Soundscape controls */}
              <div className="bg-black/25 p-3 rounded-xl border border-brown/30 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>Somatic Soundscape</span>
                    {/* Tiny animated audio wave when active */}
                    {isActive && soundType !== 'silent' && (
                      <div className="flex items-center gap-0.5 h-3">
                        <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-0.5 bg-[#c9a45c]" />
                        <motion.div animate={{ height: [6, 4, 6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-[#c9a45c]" />
                        <motion.div animate={{ height: [3, 11, 3] }} transition={{ repeat: Infinity, duration: 1.3 }} className="w-0.5 bg-[#c9a45c]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[#c9a45c] font-bold">Synthesized</span>
                </div>

                {/* Tactile Selectors */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['ocean', 'singing-bowl', 'synth', 'silent'] as const).map((sound) => {
                    const labelMap = { ocean: 'Ocean', 'singing-bowl': 'Bowl', synth: 'Synth', silent: 'Mute' };
                    return (
                      <button
                        key={sound}
                        onClick={() => {
                          initAudio();
                          setSoundType(sound);
                        }}
                        className={`py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer border ${soundType === sound ? 'bg-[#c9a45c]/25 border-[#c9a45c] text-[#c9a45c] font-black' : 'bg-black/10 border-transparent text-slate-400 hover:text-white hover:bg-black/20'}`}
                      >
                        {labelMap[sound]}
                      </button>
                    );
                  })}
                </div>

                {/* Vol Slider */}
                {soundType !== 'silent' && (
                  <div className="flex items-center gap-3 pt-1">
                    <button 
                      onClick={() => setVolume(v => v === 0 ? 40 : 0)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={e => setVolume(Number(e.target.value))}
                      className="w-full h-1 bg-brown/30 rounded-lg appearance-none cursor-pointer accent-[#c9a45c]"
                    />
                    <span className="font-mono text-[9px] text-slate-400 min-w-[20px] text-right">{volume}%</span>
                  </div>
                )}
              </div>

              {/* Statistics & Cycle Flowers */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Completed Cycles:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((num) => (
                    <motion.span 
                      key={num}
                      animate={completedCycles >= num ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`text-sm filter drop-shadow-sm select-none ${completedCycles >= num ? 'opacity-100' : 'opacity-20'}`}
                    >
                      🪷
                    </motion.span>
                  ))}
                  <span className="ml-1 text-[#c9a45c] font-bold">({completedCycles}/4)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Completed Sanctuary Set Banner */}
          <AnimatePresence>
            {showCompletionBanner && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute inset-x-4 bottom-4 p-4 rounded-xl border border-emerald-400/30 bg-emerald-950/90 backdrop-blur-md text-xs space-y-2 z-30 shadow-2xl"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-serif">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  GROUNDING STAGE COMPLETED
                </div>
                <p className="opacity-90 text-[10.5px] leading-relaxed text-slate-300">
                  Excellent work. You have safely guided your nervous system through four full cycles. Your physical shell and racing mind are aligning back with peace. 
                </p>
                <p className="text-[9.5px] opacity-75 font-semibold text-[#c9a45c] leading-relaxed font-mono">
                  ✦ Mindfulness +10% &middot; Grounding +10% updated on your Oracle Card!
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    onClick={() => setShowCompletionBanner(false)}
                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[9px] uppercase tracking-widest rounded-lg font-bold cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Somatic Map Column */}
        <div className={`p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[480px] transition-colors duration-500 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c]">Somatic Mapping</span>
                <h4 className="font-serif text-lg font-bold text-white mt-0.5">Somatic Release Map</h4>
              </div>
              <Activity className="w-5 h-5 text-[#c9a45c] animate-pulse" />
            </div>

            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              Stress and emotional trauma are held physically in our muscle memory. Select a focus area to release it.
            </p>

            {/* Zone Buttons */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {(Object.keys(somaticExercises) as Array<keyof typeof somaticExercises>).map((zone) => {
                const isSelected = somaticZone === zone;
                const labels: Record<string, string> = { head: 'Head', shoulders: 'Shoulders', chest: 'Chest', hands: 'Hands', feet: 'Feet' };
                return (
                  <button
                    key={zone}
                    onClick={() => {
                      setSomaticZone(zone);
                      setTimerSeconds(0);
                      setTimerRunning(false);
                    }}
                    className={`py-2 rounded-lg font-mono text-[9.5px] uppercase tracking-wider transition-all cursor-pointer border ${isSelected ? 'bg-[#c9a45c] border-[#c9a45c] text-black font-bold' : 'bg-black/10 border-transparent text-slate-400 hover:text-white hover:bg-black/20'}`}
                  >
                    {labels[zone]}
                  </button>
                );
              })}
            </div>

            {/* Active Somatic Exercise Panel */}
            <AnimatePresence mode="wait">
              {somaticZone ? (
                <motion.div
                  key={somaticZone}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 pt-3 border-t border-brown/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="text-[#c9a45c]">✦</span> {somaticExercises[somaticZone].deity}
                      </h5>
                      <span className="text-[8.5px] font-mono uppercase tracking-wider text-periwinkle block mt-0.5">
                        Art Anchor: {somaticExercises[somaticZone].art}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed text-slate-300">
                    {somaticExercises[somaticZone].text}
                  </p>

                  {/* Steps checklist */}
                  <div className="space-y-2 bg-black/15 p-3.5 rounded-xl border border-brown/20">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block mb-1">Guiding Steps:</span>
                    {somaticExercises[somaticZone].steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-[11px] leading-relaxed">
                        <span className="text-[#c9a45c] font-bold font-mono">{idx + 1}.</span>
                        <span className="opacity-90">{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Timer Block */}
                  <div className="pt-2">
                    {timerRunning ? (
                      <div className="bg-black/35 p-3 rounded-xl border border-brown/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#c9a45c] animate-ping" />
                          <div className="text-left">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Keep holding and focus...</p>
                            <p className="text-xs font-serif italic text-[#c9a45c]">Somatic alignment in progress</p>
                          </div>
                        </div>
                        <span className="font-serif text-xl font-bold text-white">{timerSeconds}s</span>
                      </div>
                    ) : (
                      <button
                        onClick={startSomaticExercise}
                        className="w-full py-2.5 bg-[#c9a45c]/25 hover:bg-[#c9a45c]/35 border border-[#c9a45c]/44 text-[#c9a45c] font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" /> {timerSeconds === 0 ? 'Begin 15s Grounding Focus' : 'Restart Grounding Focus'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-60">
                  <HeartPulse className="w-10 h-10 text-slate-500 animate-pulse" />
                  <p className="text-xs max-w-xs italic text-slate-400">
                    Select a zone from the top menu to view its dedicated deity guidelines and somatic exercises.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-[9.5px] font-mono text-slate-500 text-center border-t border-brown/10 pt-3">
            ✦ Mind & Body Alignment Index: Standard Somatic Regulation
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 6. CLINICAL DIRECTORY & DIALECTICAL WORKSHEET
// ==========================================
export function ClinicalDirectory({ isLightMode }: { isLightMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'therapists' | 'specialized' | 'helplines' | 'dialectics' | 'hospitals'>('therapists');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});

  // Hospital Search and Filter States
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Dynamic Hospital Lists
  const uniqueStates = Array.from(new Set(HOSPITALS.map(h => h.state))).sort();
  const uniqueCities = Array.from(new Set(HOSPITALS.filter(h => selectedState === 'all' || h.state === selectedState).map(h => h.city))).sort();

  // Filter hospitals
  const filteredHospitals = HOSPITALS.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.description.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.address.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.state.toLowerCase().includes(hospitalSearch.toLowerCase());
    
    const matchesState = selectedState === 'all' || h.state === selectedState;
    const matchesCity = selectedCity === 'all' || h.city === selectedCity;
    
    let matchesType = true;
    if (selectedType === 'psychiatric') {
      matchesType = h.type.toLowerCase().includes('psychiatric') || h.type.toLowerCase().includes('mental health');
    } else if (selectedType === 'multispecialty') {
      matchesType = h.type.toLowerCase().includes('multi-specialty') || h.type.toLowerCase().includes('general') || h.type.toLowerCase().includes('private') || h.type.toLowerCase().includes('academic') || h.type.toLowerCase().includes('hospital');
    } else if (selectedType === 'rehab') {
      matchesType = h.type.toLowerCase().includes('rehab') || h.type.toLowerCase().includes('de-addiction') || h.type.toLowerCase().includes('dependence');
    }
    
    return matchesSearch && matchesState && matchesCity && matchesType;
  });

  // DBT Worksheet States
  const [thesis, setThesis] = useState('');
  const [antithesis, setAntithesis] = useState('');
  const [synthesis, setSynthesis] = useState('');
  const [worksheetSaved, setWorksheetSaved] = useState(false);

  const toggleBio = (name: string) => {
    setExpandedBios(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const generateDialecticWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesis.trim() || !antithesis.trim()) return;

    const combined = `Though it feels impossible to bridge these opposites, the synthesis is clear: You can hold the absolute truth of your pain and struggle (Thesis: "${thesis}"), while simultaneously committing to progressive, brave steps of healing (Antithesis: "${antithesis}"). Neither invalidates the other. They are both real.`;
    
    setSynthesis(combined);
    setWorksheetSaved(true);
  };

  // Extract unique languages for filter UI
  const availableLanguages = ['Hindi', 'English', 'Bengali', 'Tamil', 'Punjabi'];

  // Filter therapists
  const filteredTherapists = THERAPISTS.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qualifications.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = selectedLanguage === 'all' || 
      t.languages.toLowerCase().includes(selectedLanguage.toLowerCase());

    // Experience parsing helper
    let expYears = 0;
    const expMatch = t.experience.match(/(\d+(\.\d+)?)/);
    if (expMatch) expYears = parseFloat(expMatch[1]);

    let matchesExp = true;
    if (selectedExperience === '3') matchesExp = expYears >= 3;
    else if (selectedExperience === '5') matchesExp = expYears >= 5;

    return matchesSearch && matchesLang && matchesExp;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b-2 border-brown/20 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#c9a45c]" /> Affirmative Clinical Directory
          </h3>
          <p className="text-xs opacity-75 mt-1">
            Browse verified, affordable, queer-affirmative, intersectional-feminist therapists and crisis support systems.
          </p>
        </div>
        
        {/* Email / Application Disclaimer banner */}
        <div className="text-[11px] font-mono bg-brown-deep/20 border border-brown/30 rounded-xl px-3 py-2 text-right max-w-md">
          💌 Apply/Inquire: <span className="text-[#c9a45c]">contact@gmail.com</span> <br/>
          <span className="opacity-75">Curated by Mahima Kukreja since 2017</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-brown/10 pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('therapists')}
          className={`px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            activeTab === 'therapists'
              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
              : 'border-transparent text-sage hover:text-white'
          }`}
        >
          ✨ Affirmative Therapists ({THERAPISTS.length})
        </button>
        <button
          onClick={() => setActiveTab('specialized')}
          className={`px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            activeTab === 'specialized'
              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
              : 'border-transparent text-sage hover:text-white'
          }`}
        >
          👥 Workshops & Couples ({SPECIALIZED_SESSIONS.length})
        </button>
        <button
          onClick={() => setActiveTab('helplines')}
          className={`px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            activeTab === 'helplines'
              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
              : 'border-transparent text-sage hover:text-white'
          }`}
        >
          📞 Support Helplines ({HELPLINES.length})
        </button>
        <button
          onClick={() => setActiveTab('dialectics')}
          className={`px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            activeTab === 'dialectics'
              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
              : 'border-transparent text-sage hover:text-white'
          }`}
        >
          🧠 Athena's DBT Worksheet
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            activeTab === 'hospitals'
              ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
              : 'border-transparent text-sage hover:text-white'
          }`}
        >
          🏥 Emergency Hospitals ({HOSPITALS.length})
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: INDIVIDUAL THERAPISTS */}
        {activeTab === 'therapists' && (
          <motion.div
            key="therapists"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search and Filters panel */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/20 border-brown'}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search therapist by name, bio keywords, or qualifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${
                    isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/60 border-brown text-white'
                  }`}
                />
              </div>

              {/* Language Selector */}
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-black/10 px-3 rounded-xl border border-brown/20 text-[11px] font-mono">
                  <Languages className="w-3.5 h-3.5 text-sage" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-transparent text-sage focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Languages (All)</option>
                    {availableLanguages.map(l => (
                      <option key={l} value={l} className="bg-[#0f1424] text-white">{l}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Selector */}
                <div className="flex items-center gap-1 bg-black/10 px-3 rounded-xl border border-brown/20 text-[11px] font-mono">
                  <Award className="w-3.5 h-3.5 text-sage" />
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="bg-transparent text-sage focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Experience (All)</option>
                    <option value="3" className="bg-[#0f1424] text-white">3+ Years</option>
                    <option value="5" className="bg-[#0f1424] text-white">5+ Years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Therapists Grid */}
            {filteredTherapists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTherapists.map((t) => {
                  const isExpanded = expandedBios[t.name] || false;
                  return (
                    <motion.div
                      layout
                      key={t.name}
                      className={`p-6 rounded-2xl border-2 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                        isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' : 'bg-brown-deep/40 border-brown text-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Title, Name, Pronouns */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif text-lg font-bold text-white flex items-center gap-1.5 flex-wrap">
                              {t.name}
                              {t.pronouns && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c9a45c]/10 text-[#c9a45c] border border-[#c9a45c]/20">
                                  {t.pronouns}
                                </span>
                              )}
                            </h4>
                            {t.experience && (
                              <p className="text-[10px] font-mono uppercase tracking-wide text-sage mt-0.5">
                                Experience: {t.experience}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Qualifications */}
                        <p className="text-xs font-mono text-[#c9a45c] bg-black/15 px-3 py-1.5 rounded-xl border border-[#c9a45c]/10 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 flex-shrink-0" />
                          <span>{t.qualifications}</span>
                        </p>

                        {/* Bio / Description */}
                        <div className="text-xs leading-relaxed opacity-90 space-y-2">
                          <p>
                            {isExpanded ? t.bio : `${t.bio.slice(0, 240)}...`}
                            {t.bio.length > 240 && (
                              <button
                                onClick={() => toggleBio(t.name)}
                                className="text-[#c9a45c] hover:underline font-bold ml-1.5 cursor-pointer text-[10px] uppercase font-mono"
                              >
                                {isExpanded ? 'Read Less ▴' : 'Read More ▾'}
                              </button>
                            )}
                          </p>
                        </div>

                        {/* Languages Spoken */}
                        <div className="flex items-center gap-2 text-[11px] font-mono opacity-80 pt-1 border-t border-brown/10">
                          <span className="text-sage font-bold">Languages:</span>
                          <span>{t.languages}</span>
                        </div>
                      </div>

                      {/* Pricing, Links, Actions */}
                      <div className="pt-4 border-t border-brown/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-xs font-mono">
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Estimated Session Fees</span>
                          <span className="font-bold text-white leading-tight block">{t.fees}</span>
                        </div>

                        <a
                          href={t.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#c9a45c] hover:bg-[#b08f4b] text-black font-mono text-xs uppercase tracking-wider rounded-xl font-bold transition-all cursor-pointer"
                        >
                          Book Session <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-brown-deep/10 border border-dashed border-brown/30 rounded-2xl">
                <p className="text-sm opacity-60">No therapists matched your active filters or search term.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedLanguage('all'); setSelectedExperience('all'); }}
                  className="mt-3 text-xs font-mono text-[#c9a45c] hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: SPECIALIZED SESSIONS & WORKSHOPS */}
        {activeTab === 'specialized' && (
          <motion.div
            key="specialized"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {SPECIALIZED_SESSIONS.map((sess) => (
              <div
                key={sess.name}
                className={`p-6 rounded-2xl border-2 flex flex-col justify-between space-y-4 shadow-sm ${
                  isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' : 'bg-brown-deep/40 border-brown text-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-periwinkle block">Specialized Community Safe Space</span>
                  <h4 className="font-serif text-lg font-bold text-white">{sess.name}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{sess.description}</p>
                  
                  <div className="space-y-1.5 text-xs font-mono border-t border-brown/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Facilitated By:</span>
                      <span className="text-white font-bold">{sess.facilitator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Languages:</span>
                      <span className="text-white font-bold">{sess.languages}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brown/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Program Pricing</span>
                    <span className="font-bold text-white leading-tight block">{sess.fees}</span>
                  </div>

                  <a
                    href={sess.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-periwinkle text-white font-mono text-xs uppercase tracking-wider rounded-xl font-bold transition-all cursor-pointer"
                  >
                    View Schedule <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* TAB 3: SUPPORT HELPLINES */}
        {activeTab === 'helplines' && (
          <motion.div
            key="helplines"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {HELPLINES.map((help) => (
                <div
                  key={help.name}
                  className={`p-6 rounded-2xl border-2 flex flex-col justify-between space-y-4 shadow-sm ${
                    isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' : 'bg-brown-deep/40 border-brown text-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#e07070] block">Free & Confidential Support</span>
                    <h4 className="font-serif text-lg font-bold text-white">{help.name}</h4>
                    <p className="text-xs leading-relaxed opacity-95">{help.description}</p>
                    
                    <div className="space-y-2 pt-3 border-t border-brown/10 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-black/25 border border-brown/25">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Contact Coordinates</span>
                        <span className="text-white font-bold block select-all whitespace-pre-wrap">{help.contact}</span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Mode:</span>
                        <span className="text-white font-bold">{help.mode}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Fees:</span>
                        <span className="text-emerald-400 font-bold uppercase">{help.fees}</span>
                      </div>
                    </div>
                  </div>

                  {help.link && (
                    <div className="pt-4 border-t border-brown/10 flex justify-end">
                      <a
                        href={help.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-black/30 hover:bg-black/50 border border-brown/40 hover:border-brown text-slate-200 text-xs font-mono uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Visit Website <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Global Directory fallback block */}
            <div className="p-6 rounded-2xl bg-red-400/5 border border-red-400/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#e07070] flex items-center gap-1">🚨 INTERNATIONAL CRISIS ASSISTANCE DIRECTORY</span>
                <p className="text-slate-300">Are you outside of our helpline regions? Find verified, free crisis counselors and helplines in 130+ countries immediately.</p>
              </div>
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#e07070] hover:bg-[#c95d5d] text-white font-mono text-xs uppercase tracking-wider rounded-xl font-bold transition-all cursor-pointer flex-shrink-0"
              >
                Find A Helpline <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}

        {/* TAB 4: ATHENA'S DBT WORKSHEET */}
        {activeTab === 'dialectics' && (
          <motion.div
            key="dialectics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-6 rounded-2xl border-2 space-y-4 max-w-2xl mx-auto ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-periwinkle block">Athena's DBT Workshop</span>
            <h4 className="font-serif text-base font-bold text-white">Generate a Dialectical Balance Worksheet</h4>
            <p className="text-xs opacity-80">
              Dialectics is the art of holding two opposite, seemingly conflicting truths simultaneously without breaking. It reminds us that two opposite experiences can both be completely valid.
            </p>

            <form onSubmit={generateDialecticWorksheet} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Thesis (My current overwhelming feeling/pain)</label>
                <input 
                  type="text" 
                  required
                  value={thesis}
                  onChange={e => setThesis(e.target.value)}
                  placeholder="Ex: I feel completely broken and exhausted."
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Antithesis (The opposing logic, duty, or expectation)</label>
                <input 
                  type="text" 
                  required
                  value={antithesis}
                  onChange={e => setAntithesis(e.target.value)}
                  placeholder="Ex: I am expected to keep working and hold everyone together."
                  className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-periwinkle text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer"
              >
                ✦ Formulate Synthesis & Balance
              </button>
            </form>

            {worksheetSaved && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-serif">
                  <CheckCircle className="w-4 h-4" /> DIALECTICAL SYNTHESIS ACHIEVED
                </div>
                <p className="opacity-95 text-[11px] leading-relaxed italic">
                  {synthesis}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TAB 5: EMERGENCY HOSPITALS (SEARCH BY LOCATION) */}
        {activeTab === 'hospitals' && (
          <motion.div
            key="hospitals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <div className="lg:col-span-2 p-5 rounded-2xl border bg-[#c9a45c]/5 border-[#c9a45c]/20 space-y-2 flex flex-col justify-center">
                <h4 className="font-serif text-lg font-bold text-[#c9a45c] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#c9a45c]" />
                  Emergency Psychiatric & Clinical Care Directory (India)
                </h4>
                <p className="text-xs opacity-90 leading-relaxed text-slate-300">
                  Search 30+ major apex public institutes, psychiatric specialty facilities, and multi-specialty brain sciences departments across Indian states. Filter by state, city, or name to find professional inpatient, outpatient, and crisis stabilization services.
                </p>
              </div>
              <div className="p-5 rounded-2xl border bg-red-500/10 border-red-500/20 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">🚨 NATIONAL TOLL-FREE HELPLINE</span>
                  <h4 className="font-serif text-base font-bold text-white">KIRAN Mental Health Helpline</h4>
                  <p className="text-[11px] opacity-80 text-slate-300">Government of India 24/7 multi-lingual support.</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a 
                    href="tel:18005990019" 
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider rounded-xl font-bold transition-all shadow-md cursor-pointer text-center"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call 1800-599-0019
                  </a>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-[#262421]/60 border-brown/20'}`}>
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-sage absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hospitalSearch}
                  onChange={e => setHospitalSearch(e.target.value)}
                  placeholder="Search name, address..."
                  className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#c9a45c] ${
                    isLightMode 
                      ? 'bg-white border-[#dfd2be] text-slate-800' 
                      : 'bg-black/40 border-brown text-white'
                  }`}
                />
              </div>

              {/* State Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase opacity-75 whitespace-nowrap hidden lg:inline text-sage">State:</span>
                <select
                  value={selectedState}
                  onChange={e => {
                    setSelectedState(e.target.value);
                    setSelectedCity('all');
                  }}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-[#c9a45c] cursor-pointer ${
                    isLightMode 
                      ? 'bg-white border-[#dfd2be] text-slate-800' 
                      : 'bg-black/40 border-brown text-white'
                  }`}
                >
                  <option value="all">All States ({uniqueStates.length})</option>
                  {uniqueStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* City Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase opacity-75 whitespace-nowrap hidden lg:inline text-sage">City:</span>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-[#c9a45c] cursor-pointer ${
                    isLightMode 
                      ? 'bg-white border-[#dfd2be] text-slate-800' 
                      : 'bg-black/40 border-brown text-white'
                  }`}
                >
                  <option value="all">All Cities ({uniqueCities.length})</option>
                  {uniqueCities.map(ct => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Specialty Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase opacity-75 whitespace-nowrap hidden lg:inline text-sage">Type:</span>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-[#c9a45c] cursor-pointer ${
                    isLightMode 
                      ? 'bg-white border-[#dfd2be] text-slate-800' 
                      : 'bg-black/40 border-brown text-white'
                  }`}
                >
                  <option value="all">All Specialties</option>
                  <option value="psychiatric">Psychiatric & Mental Health</option>
                  <option value="multispecialty">Multi-Specialty & Neurology</option>
                  <option value="rehab">De-addiction & Rehabilitation</option>
                </select>
              </div>
            </div>

            {/* Dynamic Results Count & Clear Filters */}
            <div className="flex justify-between items-center text-xs font-mono opacity-80 text-slate-300">
              <span>Showing {filteredHospitals.length} hospital{filteredHospitals.length === 1 ? '' : 's'} across India</span>
              {(hospitalSearch || selectedState !== 'all' || selectedCity !== 'all' || selectedType !== 'all') && (
                <button
                  onClick={() => {
                    setHospitalSearch('');
                    setSelectedState('all');
                    setSelectedCity('all');
                    setSelectedType('all');
                  }}
                  className="text-[#c9a45c] hover:underline cursor-pointer"
                >
                  ✕ Clear filters
                </button>
              )}
            </div>

            {/* Hospitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map(hospital => {
                  const cleanTel = hospital.emergencyContact.replace(/[^\d\+]/g, '');
                  return (
                    <div
                      key={hospital.name}
                      className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] flex flex-col justify-between gap-4 ${
                        isLightMode 
                          ? 'bg-[#f4f0e6] border-[#dfd2be] hover:border-brown/40 text-slate-800' 
                          : 'bg-brown-deep/30 border-brown hover:border-[#c9a45c]/50 text-white'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Name & Badge */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full uppercase inline-block bg-[#c9a45c]/15 text-[#c9a45c] border border-[#c9a45c]/30">
                            {hospital.type}
                          </span>
                          <h4 className={`font-serif text-base font-bold tracking-tight leading-snug ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {hospital.name}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                          {hospital.description}
                        </p>

                        {/* Location details */}
                        <div className="space-y-1.5 text-[11px] font-mono pt-1">
                          <div className={`flex items-start gap-1.5 opacity-90 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                            <MapPin className="w-3.5 h-3.5 text-[#c9a45c] mt-0.5 shrink-0" />
                            <span>{hospital.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#c9a45c] font-bold">
                            <span>📍 {hospital.city}, {hospital.state}</span>
                          </div>
                        </div>

                        {/* Key Facilities/Services badges */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {hospital.facilities.map(facility => (
                            <span 
                              key={facility}
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                                isLightMode 
                                  ? 'bg-slate-100 text-slate-600 border-slate-200' 
                                  : 'bg-black/25 text-sage border-brown/20'
                              }`}
                            >
                              • {facility}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Contacts & Map Links */}
                      <div className="space-y-3 pt-3 border-t border-brown/10">
                        {/* Emergency Hotline inside card */}
                        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between gap-2">
                          <div className="text-[10px] font-mono leading-tight">
                            <span className="text-red-400 font-bold block uppercase">🚨 Emergency Contact</span>
                            <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{hospital.emergencyContact}</span>
                          </div>
                          {cleanTel && (
                            <a
                              href={`tel:${cleanTel}`}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-all"
                              title="Call Emergency"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-[10px] font-mono truncate ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            📞 Gen: {hospital.contact}
                          </span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Map directions */}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 border rounded-xl transition-all ${
                                isLightMode
                                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-800'
                                  : 'bg-black/25 hover:bg-black/40 border-brown/30 text-slate-300 hover:text-white'
                              }`}
                              title="Find on Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>

                            {/* Website link */}
                            {hospital.link && (
                              <a
                                href={hospital.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1 px-3 py-1.5 border rounded-xl transition-all text-[10px] font-mono uppercase ${
                                  isLightMode
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                                    : 'bg-black/30 hover:bg-black/50 border-brown/40 hover:border-brown text-slate-200'
                                }`}
                              >
                                Web <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center space-y-3">
                  <div className="inline-block p-4 rounded-full bg-brown-deep/10 border border-brown/25">
                    <Building2 className="w-8 h-8 text-sage opacity-55" />
                  </div>
                  <h5 className="font-serif font-bold text-white text-sm">No matching clinical hospitals found</h5>
                  <p className="text-xs opacity-75 max-w-sm mx-auto text-slate-400">
                    Try adjusting your state or city filter, clearing the search box, or searching for broader terms like "Delhi", "Bengaluru", or "Psychiatric".
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Safety / Legal Disclaimer */}
      <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/15 text-[10.5px] leading-relaxed text-red-300">
        <strong>⚠️ CLINICAL AND MEDICO-LEGAL SAFETY DISCLAIMER:</strong> This Affirmative Clinical Directory and its somatic/dialectical tools are designed for general support, education, and peer reference. It is NOT a clinical emergency intervention system or active medical triage portal. If you are experiencing an acute medical emergency, are actively planning to harm yourself, or require immediate critical assistance, please dial your local emergency helpline immediately, go to the nearest emergency ward, or seek immediate professional care.
      </div>
    </div>
  );
}

// ==========================================
// 7. THERAPEUTIC BLOG MODULE
// ==========================================
export function TherapeuticBlog({ isLightMode }: { isLightMode: boolean }) {
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const articles = [
    {
      id: 1,
      title: "The Neurobiology of the Sisyphus Boulder",
      subtitle: "Why somatic muscle memory holds repetitive grief, and how Pichwai visual anchors provide cognitive release.",
      author: "Dr. Alistair Veer, PhD & Raag (Sisyphus)",
      readTime: "4 min read",
      category: "Neuroscience",
      content: `When we look at the mythological tale of Sisyphus rolling his massive stone up the steep slope only to watch it tumble back down, we are not looking at a mere Greek metaphor—we are looking at a profound mapping of persistent emotional fatigue and repetitive trauma loops in the human nervous system.

From a modern neurobiological standpoint, repetitive stress registers deep in the amygdala as physical, muscle-bound memory. If you feel structural stiffness in your shoulder plates, neck, and lower back, you are quite literally "holding the boulder" long after you have stepped away from the hill.

Classical Indian art forms—specifically Pichwai miniature devotional painting—act as unique visual-somatic anchors. By replacing the grueling, endless blankness of the stone with layered, intricate hand-painted visual motifs of sacred lotuses and calm deities, we rewire the brains focal pathways. We replace structural performance anxiety with visual stillness, instructing the brain that it is safe to let go of the stone.`
    },
    {
      id: 2,
      title: "Dialectics in Warli Geometry",
      subtitle: "How simple tribal circular triangles balance complex polar opposites of individual autonomy vs community burdens.",
      author: "Hope (Athena) & Prof. Manjishtha Dev",
      readTime: "5 min read",
      category: "Clinical Art Therapy",
      content: `In Dialectical Behavior Therapy (DBT), the central challenge is finding a synthesis between acceptance and progressive change. How can we simultaneously accept who we are while striving to evolve?

The answer lies elegantly represented in the geometry of traditional Warli tribal art from Western India. Warli art uses only three basic shapes: the circle (representing the sun, moon, and community), the triangle (representing mountains and trees), and the square (representing human-made security).

When a individual paints a Warli circle dancing together, the triangles represent distinct, autonomous individuals, yet they are structurally locked into a larger circular rhythm. By painting these minimal, clear motifs, the racing mind is given a safe, low-cognitive-load structure to process dialectics: you are an individual (triangle), but you are also safely embedded in the vast circle of existence. Balance is not achieved by breaking, but by locking hands with the dance.`
    },
    {
      id: 3,
      title: "The Alchemy of Anger: Rudra & Ares",
      subtitle: "Integrating high-arousal fight states through Kalamkari outlined focus and somatic release.",
      author: "Rudra (Ares) & Dr. Krishna Karim",
      readTime: "3 min read",
      category: "Anger Management",
      content: `Anger is often treated in clinical spaces as a negative, destructive emotion that must be entirely suppressed. However, suppressing high fight-or-flight energy simply traps a highly charged galvanic state inside the human nervous system, leading to chronic physical inflammation and sudden panic cycles.

Mythological archetypes like Ares (and his Indian equivalent Rudra, the fierce cosmic roar) teach us a different pathway: Anger is not a defect—it is an enormous energy of boundary-setting and sovereignty reclamation. It is pure fire.

The traditional art of Kalamkari (hand-drawn pen art on cloth using organic vegetable dyes) uses strong, bold, unyielding black outlines to encapsulate highly dynamic scenes. This outline work is the therapeutic key: we do not extinguish the fire. Instead, we use Kalamkari bold outlines to "bottle" the rage, structuring it neatly on the canvas. Painting fierce, bold strokes offers a somatic channel for physical arousal, safely grounding it back into creative alchemy.`
    }
  ];

  const toggleBookmark = (id: number) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
    } else {
      setBookmarks([...bookmarks, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">The Therapeutic Scroll</h3>
        <p className="text-xs opacity-75">Clinical research essays blending classical mythology, cognitive neurology, and Indian folk art models.</p>
      </div>

      {selectedArticle === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => {
            const isBookmarked = bookmarks.includes(art.id);
            return (
              <div 
                key={art.id}
                className={`p-6 rounded-2xl border-2 flex flex-col justify-between hover:border-[#c9a45c] transition-all relative group ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}
              >
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-periwinkle mb-3">
                    <span>{art.category}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white group-hover:text-[#c9a45c] transition-colors leading-snug">{art.title}</h4>
                  <p className="text-xs text-sage mt-2 opacity-80 leading-relaxed truncate-2-lines">{art.subtitle}</p>
                </div>

                <div className="flex justify-between items-center pt-5 mt-5 border-t border-brown/20">
                  <button 
                    onClick={() => setSelectedArticle(art.id)}
                    className="text-xs font-mono font-bold text-[#c9a45c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Read Scroll <ChevronRight className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => toggleBookmark(art.id)}
                    className="cursor-pointer"
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-[#c9a45c] fill-[#c9a45c]' : 'text-slate-500'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 md:p-10 rounded-2xl border-2 space-y-6 max-w-3xl mx-auto relative ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-[#1b2420] border-brown'}`}
        >
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-1.5 text-xs font-mono text-sage hover:text-white mb-6 border border-brown px-3 py-1.5 rounded-lg bg-black/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-mono text-[#c9a45c] uppercase tracking-widest">
              <span>{articles.find(a => a.id === selectedArticle)?.category}</span>
              <span>&middot;</span>
              <span>{articles.find(a => a.id === selectedArticle)?.readTime}</span>
            </div>
            <h1 className="font-serif text-2xl md:text-4xl font-extrabold text-white leading-tight">
              {articles.find(a => a.id === selectedArticle)?.title}
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Penned by: {articles.find(a => a.id === selectedArticle)?.author}
            </p>
          </div>

          <div className="font-serif text-sm md:text-base leading-relaxed opacity-95 text-slate-200 whitespace-pre-wrap border-t border-brown/20 pt-6 space-y-4">
            {articles.find(a => a.id === selectedArticle)?.content}
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-brown mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-left text-xs">
              <h5 className="font-serif font-bold text-[#c9a45c] uppercase">Keep reflecting?</h5>
              <p className="text-[11px] opacity-75">Connect with the deity in the chat room to discuss this neurological analysis.</p>
            </div>
            <button 
              onClick={() => {
                setSelectedArticle(null);
                // Call onClose to jump back
              }}
              className="text-xs uppercase font-mono tracking-widest bg-white text-black hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-lg shrink-0"
            >
              Start Session
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}

// ==========================================
// MAIN BENTO CONTAINER WRAPPER
// ==========================================
export default function SanctuaryTools({ activeTool, onClose, isLightMode, setView, initialSyncTab }: SanctuaryToolsProps) {
  return (
    <div className="relative z-40 p-6 md:p-8 rounded-[32px] border-2 border-brown bg-sage-dark/95 backdrop-blur-3xl min-h-[500px]">
      <div className="flex justify-between items-center mb-6 border-b border-brown/30 pb-4">
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-mono text-sage hover:text-white border border-brown px-3 py-1.5 rounded-xl bg-black/20 cursor-pointer hover:border-sage"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Tool
        </button>
        <span className="text-[10px] font-mono text-[#c9a45c] tracking-[0.2em] uppercase bg-[#c9a45c]/10 border border-[#c9a45c]/25 px-3 py-1 rounded-full">
          Active Mind Sanctuary
        </span>
      </div>

      <AnimatePresence mode="wait">
        {activeTool === 'journal' && (
          <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReflectiveJournaling isLightMode={isLightMode} setView={setView} />
          </motion.div>
        )}
        {activeTool === 'mood' && (
          <motion.div key="mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MoodAnalytics isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'slow' && (
          <motion.div key="slow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SlowLetters isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'community' && (
          <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CommunitySupport isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'wellness' && (
          <motion.div key="wellness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WellnessTools isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'clinical' && (
          <motion.div key="clinical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ClinicalDirectory isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'blog' && (
          <motion.div key="blog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TherapeuticBlog isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'sync' && (
          <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DivineSync isLightMode={isLightMode} initialTab={initialSyncTab} />
          </motion.div>
        )}
        {activeTool === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DivineSync isLightMode={isLightMode} initialTab="notes" />
          </motion.div>
        )}
        {activeTool === 'prescription' && (
          <motion.div key="prescription" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PrescriptionAnalyzer isLightMode={isLightMode} />
          </motion.div>
        )}
        {activeTool === 'videosanctuary' && (
          <motion.div key="videosanctuary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VideoSanctuary isLightMode={isLightMode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
