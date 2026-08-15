import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CHARACTERS } from '../data';
import { Character } from '../types';
import { Star, Zap, Eye, Compass, Music, Flame, CircleDot, Sparkles, MessageSquare, RotateCw, Shield, Volume2 } from 'lucide-react';
import { ambientEngine } from '../lib/ambientAudioEngine';

interface PantheonGridProps {
  setView: (view: any) => void;
  setSelectedCharId: (id: string) => void;
  isLightMode?: boolean;
}

export default function PantheonGrid({ setView, setSelectedCharId, isLightMode }: PantheonGridProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'olympian' | 'underworld' | 'titan' | 'muse'>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredCharacters = CHARACTERS.filter(
    (char) => activeFilter === 'all' || char.faction === activeFilter
  );

  // Map symbolName to a beautiful Lucide icon
  const getSymbolIcon = (name: string, factionColor: string) => {
    const iconClass = `w-12 h-12 ${factionColor} transition-transform duration-500 group-hover:scale-110`;
    switch (name) {
      case 'butterfly':
        return <Sparkles className={iconClass} />;
      case 'boulder':
        return <CircleDot className={iconClass} />;
      case 'eye':
        return <Eye className={iconClass} />;
      case 'pomegranate':
        return <Flame className={iconClass} />;
      case 'grapes':
        return <Compass className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'lightning':
        return <Zap className={iconClass} />;
      case 'trident':
        return <Compass className={iconClass} />;
      case 'lyre':
        return <Music className={iconClass} />;
      case 'shield':
        return <Shield className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const handleStartChat = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation(); // prevent flip when clicking the chat CTA
    setSelectedCharId(charId);
    setView('chat');
  };

  return (
    <div className="relative min-h-screen text-white pt-24 pb-20 px-6 max-w-7xl mx-auto z-10">
      {/* Header */}
      <div className="text-center py-12">
        <span className="text-[11px] font-semibold tracking-[0.2em] text-sage uppercase block mb-3 font-bold">
          Character Storyboard
        </span>
        <h1 className="font-serif font-extralight text-4xl md:text-6xl tracking-tight text-white mb-3">
          The <span className="font-serif italic text-periwinkle">Pantheon</span>
        </h1>
        <p className="text-sage text-xs tracking-wide opacity-80">
          Click any bento card to reveal their soul, wants, and wounds
        </p>
      </div>

      {/* Filter Tabs in Bento Style */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {(['all', 'olympian', 'underworld', 'titan', 'muse'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`font-serif text-[11px] font-semibold tracking-[0.14em] uppercase border-2 px-5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              activeFilter === filter
                ? 'bg-periwinkle-dark border-periwinkle-dark text-white shadow-[0_0_15px_rgba(159,166,255,0.25)]'
                : 'border-brown text-sage bg-sage-dark hover:border-sage hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCharacters.map((char) => {
          const isFlipped = !!flippedCards[char.id];
          return (
            <div
              key={char.id}
              className="card-wrap h-[400px] cursor-pointer group"
              style={{ perspective: '1000px' }}
              onClick={() => {
                setSelectedCharId(char.id);
                toggleFlip(char.id);
              }}
            >
              <motion.div
                className="relative w-full h-full duration-700"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* CARD FRONT - BENTO CARD */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[24px] border-2 border-brown bg-sage-dark overflow-hidden flex flex-col justify-between p-6 transition-all duration-300 hover:border-sage"
                  style={{
                    backfaceVisibility: 'hidden',
                    boxShadow: `0 0 40px ${char.colorScheme.glow}`,
                  }}
                >
                  {/* Symbol / Glow Area */}
                  <div className="flex-1 flex items-center justify-center relative">
                    <div
                      className="absolute inset-0 rounded-full blur-[60px] opacity-25 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${char.colorScheme.glow} 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      {getSymbolIcon(char.symbolName, char.colorScheme.text)}
                    </div>
                  </div>

                  {/* Identity Detail */}
                  <div className="border-t-2 border-brown pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-[0.15em] text-sage uppercase opacity-80">
                        {char.alias}
                      </span>
                      <span
                        className={`text-[8px] font-mono tracking-[0.14em] uppercase px-2.5 py-1 rounded-full ${char.colorScheme.badge}`}
                      >
                        {char.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-serif text-2xl text-white font-normal">
                        {char.name}
                      </h3>
                      <span className="text-xs text-sage/75 font-sans">({char.alias})</span>
                    </div>

                    <div className="mb-2">
                      <span className="inline-block text-[11px] font-sans font-medium text-[#e0a96d] bg-[#e0a96d]/10 border border-[#e0a96d]/30 px-2 py-0.5 rounded-md">
                        ✨ {char.simpleMeaning}
                      </span>
                    </div>

                    <p className="font-sans text-slate-300 text-[11px] leading-relaxed mb-3 line-clamp-2">
                      {char.helpFor}
                    </p>

                    {/* Footer helper */}
                    <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.12em] text-sage">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCharId(char.id);
                          ambientEngine.start();
                        }}
                        className="flex items-center gap-1 font-mono text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/30 hover:bg-[#c9a45c]/25 px-2 py-0.5 rounded-md cursor-pointer transition-all"
                        title="Play nature/ethereal soundscape for this archetype"
                      >
                        <Volume2 className="w-2.5 h-2.5 text-[#c9a45c]" />
                        <span>Ambiance 🎵</span>
                      </button>
                      <button
                        onClick={(e) => handleStartChat(e, char.id)}
                        className="text-periwinkle hover:underline font-bold"
                      >
                        Sanctuary chat →
                      </button>
                    </div>
                  </div>
                </div>

                {/* CARD BACK - BENTO CARD */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[24px] border-2 border-brown bg-sage-dark p-6 flex flex-col justify-between"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div className="border-b-2 border-brown pb-3 mb-4 flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-xl text-white font-medium">
                          {char.name}
                        </h4>
                        <span className="text-[10px] font-bold tracking-[0.12em] text-sage uppercase opacity-80">
                          {char.role} &middot; {char.artStyle}
                        </span>
                      </div>
                      <span
                        className={`text-[8px] font-mono tracking-[0.14em] uppercase px-2.5 py-1 rounded-full ${char.colorScheme.badge}`}
                      >
                        {char.badge}
                      </span>
                    </div>

                    {/* Want, Wound, Secret */}
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-[#e0a96d]/30">
                        <span className="text-[9px] font-bold tracking-[0.1em] text-[#e0a96d] uppercase block mb-0.5">
                          ✨ Purpose & Guidance
                        </span>
                        <p className="font-sans text-[11px] text-slate-200 leading-snug">
                          <strong className="text-white">{char.simpleMeaning}:</strong> {char.helpFor}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-sage uppercase block mb-1">
                          Core Desire
                        </span>
                        <p className="font-serif text-xs text-slate-200 leading-relaxed">
                          {char.want}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#e07070] uppercase block mb-1">
                          Wound
                        </span>
                        <p className="font-serif text-xs text-slate-200 leading-relaxed">
                          {char.wound}
                        </p>
                      </div>

                      <div className="border-t-2 border-brown pt-3">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-periwinkle uppercase block mb-1">
                          Secret
                        </span>
                        <p className="font-serif text-xs italic text-sage leading-relaxed opacity-95">
                          {char.secret}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTAs */}
                  <div className="flex gap-2 pt-4 border-t-2 border-brown">
                    <button
                      onClick={(e) => handleStartChat(e, char.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 font-serif text-[9px] tracking-[0.14em] uppercase text-white bg-periwinkle-dark py-2.5 rounded-xl font-bold hover:bg-periwinkle-hover transition-all cursor-pointer shadow-[0_0_15px_rgba(159,166,255,0.15)]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat Sanctuary
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFlip(char.id);
                      }}
                      className="border-2 border-brown hover:border-sage text-sage hover:text-white px-3.5 py-2.5 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer"
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
  );
}
