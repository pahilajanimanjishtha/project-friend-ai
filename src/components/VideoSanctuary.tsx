import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RefreshCw, Upload, Sparkles, Wind, Eye, Video, Compass, HelpCircle, Volume2, VolumeX } from 'lucide-react';

interface VideoSanctuaryProps {
  isLightMode: boolean;
}

interface VideoArchetype {
  id: string;
  name: string;
  description: string;
  pacing: string;
  duration: string;
  bgGradient: string;
  emoji: string;
}

const ARCHETYPES: VideoArchetype[] = [
  {
    id: 'forest',
    name: 'Deep Forest Breath',
    description: 'Ancient cedar boughs swaying in calm Himalayan drafts. Deep moss-green focus.',
    pacing: '4-7-8 Somatic',
    duration: '4 rounds',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    emoji: '🌲'
  },
  {
    id: 'ocean',
    name: 'Madhubani Ocean Scent',
    description: 'Symmetric waves rolling onto sand in an infinite tide. Restorative visual pacing.',
    pacing: '5-5-5 Box Breathing',
    duration: '5 rounds',
    bgGradient: 'from-blue-950 via-sky-950 to-slate-950',
    emoji: '🌊'
  },
  {
    id: 'stream',
    name: 'Mountain Stream Calm',
    description: 'Clear glacial waters flowing down pebbles, mimicking refreshing cool inhales.',
    pacing: '4-4 Relaxed',
    duration: '6 rounds',
    bgGradient: 'from-cyan-950 via-slate-900 to-indigo-950',
    emoji: '🏔️'
  },
  {
    id: 'sunset',
    name: 'Golden Horizon Alignment',
    description: 'A slow sun sinking below dunes, guiding the gradual release of warm exhales.',
    pacing: '4-2-4 Grounding',
    duration: '4 rounds',
    bgGradient: 'from-amber-950 via-orange-950 to-slate-950',
    emoji: '🌅'
  }
];

export default function VideoSanctuary({ isLightMode }: VideoSanctuaryProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<VideoArchetype>(ARCHETYPES[0]);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [videoMime, setVideoMime] = useState('video/mp4');
  
  // Breathing exercises engine states
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Rest');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  
  // Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const breathingInterval = useRef<NodeJS.Timeout | null>(null);

  // Stop breathing loop on unmount
  useEffect(() => {
    return () => {
      if (breathingInterval.current) clearInterval(breathingInterval.current);
    };
  }, []);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFileName(file.name);
    setVideoMime(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate file load
      setVideoFile(reader.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Breathing Loop Controller
  const startBreathingSession = () => {
    if (isBreathing) {
      stopBreathingSession();
      return;
    }

    setIsBreathing(true);
    setCompletedCycles(0);
    triggerBreathingPhase('Inhale', 4);
  };

  const stopBreathingSession = () => {
    setIsBreathing(false);
    setBreathPhase('Rest');
    setSecondsLeft(0);
    if (breathingInterval.current) {
      clearInterval(breathingInterval.current);
      breathingInterval.current = null;
    }
  };

  const triggerBreathingPhase = (phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest', duration: number) => {
    setBreathPhase(phase);
    setSecondsLeft(duration);

    if (breathingInterval.current) clearInterval(breathingInterval.current);

    let count = duration;
    breathingInterval.current = setInterval(() => {
      count--;
      setSecondsLeft(count);

      if (count <= 0) {
        clearInterval(breathingInterval.current!);
        
        // Go to next phase based on archetype settings
        if (selectedArchetype.id === 'forest') {
          // 4-7-8 breathing
          if (phase === 'Inhale') triggerBreathingPhase('Hold', 7);
          else if (phase === 'Hold') triggerBreathingPhase('Exhale', 8);
          else if (phase === 'Exhale') {
            setCompletedCycles(prev => prev + 1);
            triggerBreathingPhase('Inhale', 4);
          }
        } else if (selectedArchetype.id === 'ocean') {
          // 5-5-5 Box breathing
          if (phase === 'Inhale') triggerBreathingPhase('Hold', 5);
          else if (phase === 'Hold') triggerBreathingPhase('Exhale', 5);
          else if (phase === 'Exhale') {
            setCompletedCycles(prev => prev + 1);
            triggerBreathingPhase('Inhale', 5);
          }
        } else {
          // 4-4 symmetric breathing
          if (phase === 'Inhale') triggerBreathingPhase('Exhale', 4);
          else if (phase === 'Exhale') {
            setCompletedCycles(prev => prev + 1);
            triggerBreathingPhase('Inhale', 4);
          }
        }
      }
    }, 1000);
  };

  // Analyze Visual Style
  const triggerVideoAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype: selectedArchetype.name,
          videoFile: videoFile ? { data: videoFile.split(',')[1], mimeType: videoMime } : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.text);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to analyze the visual session.');
      }
    } catch (err) {
      console.error(err);
      setError('Somatic server is offline. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">Video Breathing Sanctuary & Somatic Insights</h3>
        <p className="text-xs opacity-75">
          Step into a restorative sanctuary. Select an organic, moving nature video archetype or upload your own somatic clip, practice therapeutic breathing cycles, and generate clinical insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Archetype & Upload List (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Choose Sanctuary Environment</span>
          <div className="space-y-2.5">
            {ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetype.id === arch.id;
              return (
                <button
                  key={arch.id}
                  onClick={() => {
                    setSelectedArchetype(arch);
                    setVideoFile(null);
                    setAnalysisResult(null);
                    setError(null);
                    if (isBreathing) stopBreathingSession();
                  }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-black/25 border-[#c9a45c] shadow-lg scale-[1.01]' 
                      : 'bg-black/10 border-brown/20 hover:border-brown'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{arch.emoji}</span>
                      <h4 className="font-serif text-xs font-bold text-white">{arch.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 pr-2">{arch.description}</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/30 px-2 py-0.5 rounded shrink-0">
                    {arch.pacing}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`p-4 rounded-2xl border-2 border-dashed border-brown/40 bg-black/15 text-center space-y-3`}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-periwinkle block">Upload Somatic Video</span>
            {videoFile ? (
              <div className="space-y-2">
                <p className="text-xs text-white font-mono flex items-center justify-center gap-1">
                  <Video className="w-3.5 h-3.5 text-emerald-400" /> {videoFileName}
                </p>
                <button
                  onClick={() => { setVideoFile(null); setVideoFileName(''); }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono rounded"
                >
                  Clear Upload
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-4 cursor-pointer space-y-1">
                <Upload className="w-5 h-5 text-periwinkle" />
                <span className="text-xs text-white">Upload your own clip</span>
                <span className="text-[9px] text-slate-400">Short .mp4 / .webm</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Breathing Exercise Screen (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`relative rounded-3xl overflow-hidden p-6 md:p-8 min-h-[380px] flex flex-col justify-between border border-brown/25 bg-gradient-to-br ${selectedArchetype.bgGradient} transition-all duration-700`}>
            
            {/* Top Info */}
            <div className="flex justify-between items-start text-xs font-mono relative z-10">
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-widest text-[#c9a45c] block">Sanctuary Zone</span>
                <span className="text-white font-serif text-sm font-bold">{selectedArchetype.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-widest text-[#c9a45c] block">Pacing Sequence</span>
                <span className="text-white font-bold">{selectedArchetype.pacing}</span>
              </div>
            </div>

            {/* Middle Breathing Graphic */}
            <div className="flex flex-col items-center justify-center py-8 relative z-10">
              <div className="relative flex items-center justify-center w-48 h-48">
                {/* Ripples */}
                <AnimatePresence>
                  {isBreathing && breathPhase === 'Inhale' && (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0.8 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: selectedArchetype.id === 'forest' ? 4 : 5, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border-2 border-[#c9a45c]/40"
                    />
                  )}
                </AnimatePresence>

                {/* Main breathing circle */}
                <motion.div
                  animate={{
                    scale: 
                      breathPhase === 'Inhale' ? 1.6 : 
                      breathPhase === 'Hold' ? 1.6 : 
                      breathPhase === 'Exhale' ? 0.75 : 
                      1.0,
                  }}
                  transition={{
                    duration: 
                      breathPhase === 'Inhale' ? (selectedArchetype.id === 'forest' ? 4 : 5) : 
                      breathPhase === 'Hold' ? (selectedArchetype.id === 'forest' ? 7 : 5) : 
                      breathPhase === 'Exhale' ? (selectedArchetype.id === 'forest' ? 8 : 5) : 
                      1.5,
                    ease: 'easeInOut'
                  }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#c9a45c]/70 to-[#fff]/10 border border-[#c9a45c] flex flex-col items-center justify-center shadow-lg"
                >
                  <Wind className="w-6 h-6 text-white animate-pulse" />
                </motion.div>

                {/* Overlay Counter */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-serif font-black text-white leading-none mt-1">
                    {secondsLeft > 0 ? secondsLeft : '✦'}
                  </span>
                </div>
              </div>

              {/* Phase Info */}
              <div className="text-center mt-6 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] block">Current Phase</span>
                <h4 className="font-serif text-lg font-bold text-white tracking-widest uppercase">{isBreathing ? breathPhase : 'Awaiting Breath'}</h4>
                <p className="text-[10px] text-slate-400 font-mono">Completed Cycles: <span className="text-[#c9a45c] font-bold">{completedCycles}</span></p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 relative z-10">
              <button
                onClick={startBreathingSession}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-900 font-mono text-xs uppercase tracking-widest rounded-xl font-black transition-all hover:scale-[1.02] cursor-pointer"
              >
                {isBreathing ? '✕ Stop Breathing' : '✦ Begin Guided Breath'}
              </button>

              <button
                onClick={triggerVideoAnalysis}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#c9a45c]/25 hover:bg-[#c9a45c]/40 border border-[#c9a45c]/44 text-[#c9a45c] font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {isAnalyzing ? 'Analyzing Video...' : 'Analyze Sanctuary Visual'}
              </button>
            </div>
          </div>

          {/* Video analysis report output */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 border border-brown/30 bg-black/15 rounded-3xl text-center space-y-3"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#c9a45c]/80 border-t-transparent animate-spin mx-auto" />
                <h4 className="font-serif text-xs font-bold text-white">Translating Somatic Frequencies...</h4>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                  Gemini-3.1-Pro-Preview is parsing the therapeutic nature visuals, organic tree/wave rhythm speeds, and outlining somatic calming reports...
                </p>
              </motion.div>
            )}

            {!isAnalyzing && error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 border border-red-500/20 bg-red-500/5 text-red-300 text-xs text-center rounded-2xl"
              >
                {error}
              </motion.div>
            )}

            {!isAnalyzing && analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 md:p-8 rounded-3xl border border-[#c9a45c]/30 bg-brown-deep/20 text-left space-y-4"
              >
                <div className="flex justify-between items-center border-b border-[#c9a45c]/20 pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c]">
                    Somatic Alignment Report & Analysis
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">gemini-3.1-pro-preview</span>
                </div>
                <div className="font-serif text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap space-y-3">
                  {analysisResult}
                </div>
                <div className="p-3.5 rounded-xl bg-black/25 border border-brown/25 text-[10px] leading-relaxed text-slate-400">
                  💡 <strong>Integrative Practice:</strong> Keep this report handy. Synchronizing your respiratory rates to these exact visual frequencies helps align your cardiac vagal tone, triggering spontaneous calm.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
