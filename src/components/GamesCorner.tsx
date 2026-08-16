import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface GamesCornerProps {
  isLightMode?: boolean;
  setView: (view: any) => void;
}

export default function GamesCorner({ isLightMode = false, setView }: GamesCornerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-screen transition-colors duration-500 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <button
          onClick={() => setView('home')}
          className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#c9a45c] border border-[#c9a45c]/30 hover:border-[#c9a45c]/60 hover:bg-[#c9a45c]/10 px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c9a45c] block font-bold"
        >
          Play Time!
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-serif text-3xl md:text-5xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}
        >
          Games Corner
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          One happy game to keep your mind smiling!
        </motion.p>
      </div>

      {/* Do Doodle — playable right here in a new screen */}
      <div className={`relative mt-12 rounded-[28px] border-2 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-[#07130e] border-[#112d24]'}`}>
        <div className="flex items-center justify-between px-6 py-4 bg-[#03070f]/95 border-b border-[#c9a45c]/25 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#c9a45c] shadow-[0_0_8px_rgba(201,164,92,0.9)]" />
            <span className="font-serif text-sm font-bold uppercase tracking-[0.18em] text-[#c9a45c]">
              Do Doodle 🎨
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              Draw &amp; Guess Multiplayer — full screen
            </span>
          </div>
          <button
            onClick={() => setView('home')}
            className="text-[10px] font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-[#c9a45c]/30 hover:border-[#c9a45c]/60 rounded-lg px-4 py-2 transition-colors cursor-pointer"
          >
            ✕ Close &amp; Exit
          </button>
        </div>
        <iframe
          src="https://do-doodle.netlify.app/"
          title="Do Doodle — Draw & Guess Multiplayer"
          className="w-full h-[70vh] block"
          allow="fullscreen; clipboard-write"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
