import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Sparkles, Image as ImageIcon, Play, Pause, Download, Volume2, 
  RefreshCw, Trash2, Heart, Music4, Info, FileUp, HelpCircle
} from 'lucide-react';

interface SavedTrack {
  id: string;
  title: string;
  prompt: string;
  audioUrl: string;
  lyrics: string | null;
  lengthType: 'short' | 'long';
  createdAt: string;
}

interface MusicGeneratorProps {
  isLightMode: boolean;
}

const INSPIRATIONAL_PROMPTS = [
  { text: "🧸 Calm bedtime lullaby with sweet starry music box bells", label: "Bedtime Lullaby" },
  { text: "☀️ Happy sunshine adventure with playful acoustic guitar and clapping", label: "Happy Adventure" },
  { text: "🌳 Magical whisper of forest trees with soft wooden flutes and birds", label: "Magical Forest" },
  { text: "🌊 Peaceful beach sunset with slow waves and gentle keyboard chords", label: "Ocean Waves" },
  { text: "🌌 Cosmic spaceships sailing through a soft purple nebula synth sky", label: "Cosmic Sky" }
];

const LOADING_STEPS = [
  "Thinking of the perfect melody... 💭",
  "Tuning our magical forest instruments... 🎻",
  "Plucking the silver guitar strings... 🎸",
  "Lyria is humming the rhythm... 🎙️",
  "Adding some stardust sparkle... ✨",
  "Polishing the magical song chest... 💎"
];

export default function MusicGenerator({ isLightMode }: MusicGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [lengthType, setLengthType] = useState<'short' | 'long'>('short');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Image reference support
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Error & Status
  const [error, setError] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);

  // Playback Track
  const [activeTrack, setActiveTrack] = useState<SavedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Tracks History
  const [tracks, setTracks] = useState<SavedTrack[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rotate loading steps
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle local storage load
  useEffect(() => {
    const saved = localStorage.getItem('lyria_sacred_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Note: Blob/ObjectURLs will not survive page reloads, so we notify if expired,
        // but for safety we load them or they might be external.
        setTracks(parsed);
      } catch (e) {
        console.error("Failed to parse saved tracks", e);
      }
    }
  }, []);

  // Update audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [activeTrack]);

  // Audio Playback helper
  const togglePlay = () => {
    if (!audioRef.current || !activeTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Image Upload Logic
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please pick a real picture file (PNG or JPEG)!");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = (reader.result as string).split(',')[1];
      setImageBase64(base64Str);
      setImagePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Generation Request
  const generateMusic = async () => {
    if (!prompt.trim()) {
      setError("Please write down what kind of music you'd like to create!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLyrics(null);

    try {
      const requestBody: any = {
        prompt: prompt.trim(),
        length: lengthType,
      };

      if (imageBase64) {
        requestBody.image = {
          data: imageBase64,
          mimeType: imageFile?.type || 'image/jpeg'
        };
      }

      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to communicate with Lyria');
      }

      const result = await response.json();

      // Convert base64 back to Blob URL on client
      const binary = atob(result.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const newTrack: SavedTrack = {
        id: Math.random().toString(36).substring(2, 9),
        title: prompt.trim().substring(0, 30) + (prompt.trim().length > 30 ? '...' : ''),
        prompt: prompt.trim(),
        audioUrl,
        lyrics: result.lyrics,
        lengthType,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedTracks = [newTrack, ...tracks];
      setTracks(updatedTracks);
      localStorage.setItem('lyria_sacred_tracks', JSON.stringify(updatedTracks));

      setActiveTrack(newTrack);
      setLyrics(result.lyrics);
      setIsPlaying(false);
      setCurrentTime(0);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while composing your music. Please try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tracks.filter(t => t.id !== id);
    setTracks(updated);
    localStorage.setItem('lyria_sacred_tracks', JSON.stringify(updated));
    if (activeTrack?.id === id) {
      setIsPlaying(false);
      setActiveTrack(null);
      setLyrics(null);
    }
  };

  const playSavedTrack = (track: SavedTrack) => {
    setActiveTrack(track);
    setLyrics(track.lyrics);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hidden audio element */}
      {activeTrack && (
        <audio 
          ref={audioRef} 
          src={activeTrack.audioUrl} 
          preload="auto"
        />
      )}

      {/* Hero Header */}
      <div className="text-center mb-10 space-y-3">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#c9a45c]"
        >
          <Music className="w-8 h-8 animate-pulse" />
        </motion.div>
        <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight">
          Happy Music Maker 🎵
        </h1>
        <p className={`text-sm max-w-xl mx-auto font-sans leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
          Make your own beautiful music using words! Write a warm idea, optionally add a picture to inspire the notes, and our friendly helper <strong className="text-[#c9a45c]">Lyria</strong> will play real instruments just for you!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Creation Workshop Block */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-2xl border-2 transition-all ${isLightMode ? 'bg-white border-[#dfd2be] shadow-sm' : 'bg-[#0b1329] border-[#222e4c]'}`}>
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              1. Write Your Music Dream
            </h2>

            {/* Prompt Text Input */}
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should your song feel like? e.g., 'A cozy rain evening with soft pianos and humming...'"
                rows={3}
                className={`w-full text-sm p-4 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] transition-all resize-none ${isLightMode ? 'bg-stone-50 border-stone-200 text-stone-800' : 'bg-slate-900/50 border-slate-700 text-white'}`}
                disabled={isGenerating}
              />

              {/* Instant suggestions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">Try one of these suggestions:</span>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATIONAL_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(item.text)}
                      disabled={isGenerating}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isLightMode ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Length toggle */}
            <div className="mt-6 pt-6 border-t border-slate-200/10">
              <h3 className="font-serif text-sm font-bold mb-3">2. Choose Your Song Size</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLengthType('short')}
                  disabled={isGenerating}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${lengthType === 'short' ? 'border-[#c9a45c] bg-[#c9a45c]/10 text-[#c9a45c]' : (isLightMode ? 'border-stone-200 hover:bg-stone-50 text-stone-600' : 'border-slate-800 hover:bg-slate-800/50 text-slate-400')}`}
                >
                  <Music4 className="w-4 h-4" />
                  <span>Short Song (under 30s)</span>
                  <span className="text-[9px] font-normal opacity-70">Fast & playful</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLengthType('long')}
                  disabled={isGenerating}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${lengthType === 'long' ? 'border-[#c9a45c] bg-[#c9a45c]/10 text-[#c9a45c]' : (isLightMode ? 'border-stone-200 hover:bg-stone-50 text-stone-600' : 'border-slate-800 hover:bg-slate-800/50 text-slate-400')}`}
                >
                  <Music className="w-4 h-4" />
                  <span>Long Song (Full-length)</span>
                  <span className="text-[9px] font-normal opacity-70">A complete sound journey</span>
                </button>
              </div>
            </div>

            {/* Optional Image upload to inspire */}
            <div className="mt-6 pt-6 border-t border-slate-200/10">
              <h3 className="font-serif text-sm font-bold mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                3. Add a Picture to Inspire (Optional)
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">Drop an image here to let Lyria compose music that matches the colors and mood of your picture!</p>

              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${isDragging ? 'border-[#c9a45c] bg-[#c9a45c]/5' : (isLightMode ? 'border-stone-300 hover:bg-stone-50' : 'border-slate-700 hover:bg-slate-800/30')}`}
                >
                  <FileUp className="w-6 h-6 text-slate-400 animate-bounce" />
                  <span className="text-xs font-bold">Drag your picture here or click to browse</span>
                  <span className="text-[10px] text-slate-500">Supports PNG, JPG up to 4MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className={`relative rounded-xl overflow-hidden border p-2 flex items-center gap-4 ${isLightMode ? 'bg-stone-50' : 'bg-slate-900/40'}`}>
                  <img 
                    src={imagePreview} 
                    alt="Inspiration Preview" 
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200/10 shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{imageFile?.name}</p>
                    <p className="text-[10px] text-slate-400">File attached successfully!</p>
                  </div>
                  <button
                    onClick={removeImage}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full cursor-pointer"
                    title="Remove picture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error messaging */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Submit button */}
            <div className="mt-6">
              <button
                onClick={generateMusic}
                disabled={isGenerating}
                className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${isGenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#c9a45c] to-amber-600 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating your Song...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Compose Magic Song 🔮</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loader status */}
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-2xl border text-center space-y-4 ${isLightMode ? 'bg-[#fffbf2] border-[#f1e3c8]' : 'bg-[#151c31] border-[#c9a45c]/30'}`}
              >
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-[#c9a45c]/20 border-t-[#c9a45c] animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm">Composing Beautiful Sounds</h3>
                  <p className="text-xs text-slate-400 mt-1">{LOADING_STEPS[loadingStep]}</p>
                </div>
                
                {/* Simulated visualizer bars */}
                <div className="flex justify-center items-end gap-1 h-6">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 24, 4] }}
                      transition={{ 
                        duration: 0.8 + (i % 3) * 0.2, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.05
                      }}
                      className="w-1 bg-[#c9a45c] rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Playback & History Block */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Player */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${isLightMode ? 'bg-white border-[#dfd2be] shadow-sm' : 'bg-[#0b1329] border-[#222e4c]'}`}>
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-periwinkle" />
              Music Player 📻
            </h2>

            {activeTrack ? (
              <div className="space-y-4 text-center">
                <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center relative shadow-inner ${isLightMode ? 'bg-stone-100' : 'bg-slate-900'}`}>
                  <Music className={`w-10 h-10 ${isPlaying ? 'text-[#c9a45c] animate-bounce' : 'text-slate-500'}`} />
                  
                  {/* Decorative glowing circles when playing */}
                  {isPlaying && (
                    <span className="absolute inset-0 rounded-2xl border-2 border-[#c9a45c] animate-ping opacity-50"></span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm truncate px-4">{activeTrack.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Inspired by: "{activeTrack.prompt}"</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#c9a45c]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Play Controls */}
                <div className="flex justify-center items-center gap-4 pt-2">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-[#c9a45c] text-white hover:bg-amber-600 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <a
                    href={activeTrack.audioUrl}
                    download={`lyria_song_${activeTrack.id}.wav`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer ${isLightMode ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}
                    title="Download Song to computer"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {/* Lyrics Section */}
                {lyrics && (
                  <div className="mt-4 pt-4 border-t border-slate-200/10 text-left">
                    <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1">
                      <Music4 className="w-3 h-3 text-amber-500" />
                      Sing-Along Lyrics 🎤
                    </h4>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line ${isLightMode ? 'bg-stone-50 text-stone-700' : 'bg-slate-900/60 text-slate-300'}`}>
                      {lyrics}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-500 text-xs">
                <Music className="w-10 h-10 mx-auto opacity-30 stroke-1" />
                <p>No active song is playing.</p>
                <p className="text-[11px] opacity-70">Create a new song to bring your player to life!</p>
              </div>
            )}
          </div>

          {/* History Chest */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${isLightMode ? 'bg-white border-[#dfd2be] shadow-sm' : 'bg-[#0b1329] border-[#222e4c]'}`}>
            <h2 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              My Song Chest 📦
            </h2>

            {tracks.length > 0 ? (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playSavedTrack(track)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${activeTrack?.id === track.id ? 'border-[#c9a45c] bg-[#c9a45c]/5' : (isLightMode ? 'border-stone-100 hover:bg-stone-50' : 'border-slate-800 hover:bg-slate-800/40')}`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate block">{track.title}</span>
                        <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                          {track.lengthType === 'short' ? '30s' : 'Full'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{track.prompt}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteTrack(track.id, e)}
                        className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer"
                        title="Delete track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                <p>Your song chest is currently empty.</p>
                <p className="text-[10px] opacity-70">Any song you make will show up here so you can listen to it again!</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
