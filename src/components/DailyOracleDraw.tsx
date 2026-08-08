import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, AlertCircle, Compass, HelpCircle, Layers, ShieldCheck, Heart, User } from 'lucide-react';
import { CHARACTERS } from '../data';

interface TarotCard {
  id: string;
  name: string;
  archetype: string;
  meaningUpright: string;
  meaningReversed: string;
  symbol: string;
  description: string;
  artStyle: string;
}

const TAROT_DECK: TarotCard[] = [
  {
    id: 'fool',
    name: 'The Wanderer (Odysseus)',
    archetype: 'The Fool',
    meaningUpright: 'Fresh departures, leap of faith, embracing uncertainty, spontaneous sovereign flow.',
    meaningReversed: 'Recklessness, hesitation, fear of transition, ignoring your internal compass.',
    symbol: '⛵',
    description: 'A wooden vessel navigating restless, open waters under a sky speckled with promise.',
    artStyle: 'Warli minimal stick outlines tracing the boundary of sea and sky.'
  },
  {
    id: 'magician',
    name: 'The Alchemist (Prometheus)',
    archetype: 'The Magician',
    meaningUpright: 'Creative fire, manifest power, reclaiming agency, accessing deep inner resources.',
    meaningReversed: 'Blocked potential, wasted talents, procrastination, misdirecting your internal fire.',
    symbol: '🔥',
    description: 'A radiant ember glowing with cosmic heat, held gently in clay-sculpted hands.',
    artStyle: 'Pichwai golden border lines framing a deep crimson spark.'
  },
  {
    id: 'high_priestess',
    name: 'The Pythia (Delphic Sybil)',
    archetype: 'The High Priestess',
    meaningUpright: 'Deep intuition, listening to silent spaces, honoring mystery, secret emotional truths.',
    meaningReversed: 'Ignored gut feelings, surface-level distractions, fear of facing internal truths.',
    symbol: '👁️',
    description: 'An eye of pure azure framed by concentric circles, looking inward at a pool of ink.',
    artStyle: 'Aipan white and saffron symmetric floor lines radiating from the center.'
  },
  {
    id: 'empress',
    name: 'The Earth Mother (Demeter)',
    archetype: 'The Empress',
    meaningUpright: 'Nurturing abundance, somatic grounding, embracing growth cycles, sensory fullness.',
    meaningReversed: 'Creative block, emotional burnout, neglecting self-care, smothering attachment.',
    symbol: '🌾',
    description: 'A lush stalk of ripe golden wheat bowing gently before an emerald-tinted horizon.',
    artStyle: 'Chittara intricate geometric lines detailing leaves and life-giving soil.'
  },
  {
    id: 'emperor',
    name: 'The Sovereign (Zeus)',
    archetype: 'The Emperor',
    meaningUpright: 'Healthy boundaries, active sovereignty, structure, self-regulation, protective safety.',
    meaningReversed: 'Rigid control, powerlessness, internal chaos, boundary failures.',
    symbol: '⚡',
    description: 'A thunderbolt in suspension, glowing with static purple and structured white.',
    artStyle: 'Rogan thick symmetric resin patterns representing supreme order.'
  },
  {
    id: 'hierophant',
    name: 'The Sacred Weaver (Athena)',
    archetype: 'The Hierophant',
    meaningUpright: 'Mindful strategy, dialectical balance, alignment of head and heart, ancient wisdom.',
    meaningReversed: 'Dogmatic thinking, cognitive conflict, feeling unguided, rejecting balance.',
    symbol: '🦉',
    description: 'An owl composed of geometric equations, holding a needle and silver thread.',
    artStyle: 'Warli concentric circles weaving together intellect and somatic warmth.'
  },
  {
    id: 'death',
    name: 'The Ferryman (Charon)',
    archetype: 'Death / Rebirth',
    meaningUpright: 'Radical transformation, closing heavy chapters, sacred release, honoring grief.',
    meaningReversed: 'Stagnation, resisting inevitable transitions, carry-over emotional baggage.',
    symbol: '💀',
    description: 'A gentle silver rowboat resting on still dark waters, ready to push off from the bank.',
    artStyle: 'Pata Chitra stylized scroll details showcasing the transition of the seasons.'
  },
  {
    id: 'justice',
    name: 'The Scales (Themis)',
    archetype: 'Justice',
    meaningUpright: 'Radical self-forgiveness, dialectic harmony, absolute clarity, balanced karma.',
    meaningReversed: 'Harsh self-criticism, felt bias, persistent unfair blame, inner imbalance.',
    symbol: '⚖️',
    description: 'A balanced balance beam holding a feather on one side and a dewdrop on the other.',
    artStyle: 'Aipan dual-toned border lines dividing and uniting opposing truths.'
  },
  {
    id: 'devil',
    name: 'The Ecstatic Shadow (Dionysus)',
    archetype: 'The Shadow',
    meaningUpright: 'Ecstatic liberation, reframing repressed shadows, wild curiosity, breaking chains.',
    meaningReversed: 'Self-sabotaging behavior, addictive patterns, entrapment in false comforts.',
    symbol: '🍷',
    description: 'A goblet overflowing with dark purple grapes and wild ivy tendrils.',
    artStyle: 'Chittara bold mesh lines illustrating release and sensory ecstasy.'
  },
  {
    id: 'tower',
    name: 'The Thunderbolt (Olympus)',
    archetype: 'The Tower',
    meaningUpright: 'Sudden breakthrough, breaking rigid expectations, dynamic release, catharsis.',
    meaningReversed: 'Averting disaster, staying in toxic comfort, delayed emotional reckoning.',
    symbol: '🏛️',
    description: 'A majestic marble pillar parting down the middle under a flash of silver light.',
    artStyle: 'Rogan dynamic lines depicting the dramatic parting of heavy rain clouds.'
  },
  {
    id: 'star',
    name: 'The Astraea (Star of Hope)',
    archetype: 'The Star',
    meaningUpright: 'Inner sanctuary, tranquil healing, renewal of spirit, celestial grace, trust.',
    meaningReversed: 'Discouragement, feeling disconnected from hope, emotional dryness.',
    symbol: '⭐',
    description: 'A single, sharp eight-pointed star casting soft white beams into a indigo sky.',
    artStyle: 'Kalamezhuthu colorful powder lines painting the celestial alignment.'
  },
  {
    id: 'hermit',
    name: 'The Labyrinth (Minotaur)',
    archetype: 'The Hermit',
    meaningUpright: 'Introspective silence, sacred solitude, discovering inner light, contemplative pause.',
    meaningReversed: 'Isolation, paranoia, withdrawing in shame, ignored wisdom.',
    symbol: '🌀',
    description: 'A quiet stone labyrinth winding slowly toward a single glowing candle in the center.',
    artStyle: 'Pata Chitra circular patterns indicating winding spiritual journeys.'
  }
];

export default function DailyOracleDraw({ isLightMode }: { isLightMode?: boolean }) {
  const [selectedDeityId, setSelectedDeityId] = useState<string>(() => {
    // Try to pre-populate with selected deity or standard Persephone
    return 'persephone-soul';
  });

  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null);
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [readingResult, setReadingResult] = useState<{
    emotionalAnalysis: string;
    reading: string;
    dailyRitual: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDeity = CHARACTERS.find((c) => c.id === selectedDeityId) || CHARACTERS[0];

  const handleDrawCard = async () => {
    if (isDealing || isAnalyzing) return;
    setError(null);
    setDrawnCard(null);
    setReadingResult(null);
    setIsDealing(true);

    // Deal/flip animation delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Choose random card and orientation
    const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    const randomReversed = Math.random() > 0.7; // 30% chance of reversed card

    setDrawnCard(randomCard);
    setIsReversed(randomReversed);
    setIsDealing(false);
    setIsAnalyzing(true);

    // Load recent chats with this deity from localStorage
    let chatHistory: any[] = [];
    try {
      const stored = localStorage.getItem('sanctuary_chats');
      if (stored) {
        const parsed = JSON.parse(stored);
        const deityChats = parsed[selectedDeityId] || [];
        chatHistory = deityChats.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })).slice(-8); // Grab the last 8 turns for contextual depth
      }
    } catch (e) {
      console.error('Error fetching chat history for tarot draw', e);
    }

    try {
      const response = await fetch('/api/oracle/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeDeity,
          chatHistory,
          card: randomCard,
          isReversed: randomReversed
        })
      });

      if (!response.ok) {
        throw new Error('Deity sanctuary did not respond to the alignment ritual. Please try again.');
      }

      const data = await response.json();
      setReadingResult({
        emotionalAnalysis: data.emotionalAnalysis || "I feel your presence clearly, standing at a beautiful, unwritten crossroads.",
        reading: data.reading || "Your card indicates a deep period of reflection ahead. Walk slowly.",
        dailyRitual: data.dailyRitual || "Pour a cup of warm chamomile, trace five circular breaths, and release one worry."
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete tarot alignment. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetDraw = () => {
    setDrawnCard(null);
    setReadingResult(null);
    setError(null);
  };

  return (
    <div className="bg-[#03070f] text-white p-6 rounded-[28px] border-2 border-brown max-w-5xl mx-auto my-6 relative z-10 shadow-[0_0_50px_rgba(201,164,92,0.08)]">
      
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#c9a45c]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="border-b border-brown/50 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#c9a45c] block mb-1">Divine Intuition Module</span>
          <h2 className="font-serif text-3xl font-medium text-white tracking-wide">
            Daily Oracle Tarot Draw
          </h2>
          <p className="text-xs text-sage mt-1 max-w-2xl">
            Click the ancient deck to draw a card of fate. The selected mythological companion will read your current emotional aura based on your Sanctuary chat history and offer cosmic guidance.
          </p>
        </div>
        {drawnCard && (
          <button
            onClick={handleResetDraw}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-sage border-2 border-brown hover:border-sage bg-white/5 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Return Deck
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left/Main interactive panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Choose Oracle deity */}
          {!drawnCard && (
            <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-6 space-y-4">
              <h3 className="font-serif text-base text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#c9a45c]" />
                Select Your Divine Guide for Today
              </h3>
              <p className="text-[11px] text-sage">
                Your card interpretation and emotional diagnosis will be tailored in the voice, traditional art-style style, and therapeutic role of your chosen guide.
              </p>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[190px] overflow-y-auto pr-1">
                {CHARACTERS.map((char) => {
                  const isSelected = selectedDeityId === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedDeityId(char.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'border-[#c9a45c] bg-[#c9a45c]/10 text-white'
                          : 'border-brown bg-brown-deep/40 hover:border-sage text-white/50 hover:text-white'
                      }`}
                    >
                      <span className="text-lg mb-0.5">
                        {char.id === 'athena' && '🦉'}
                        {char.id === 'persephone-soul' && '🦋'}
                        {char.id === 'persephone-witness' && '🍎'}
                        {char.id === 'sisyphus' && '⛰️'}
                        {char.id === 'dionysus' && '🍇'}
                        {char.id === 'astra' && 'Taara'}
                        {char.id === 'zeus' && '⚡'}
                        {char.id === 'hades' && '⚓'}
                        {char.id === 'sappho' && '📜'}
                      </span>
                      <span className="text-[9px] font-serif font-bold truncate block w-full">{char.badge}</span>
                      <span className="text-[7px] font-mono tracking-widest opacity-60 uppercase">{char.alias}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Results Display */}
          <AnimatePresence mode="wait">
            {drawnCard && (
              <motion.div
                key="tarot-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Oracle Guide Quote Badge */}
                <div className="bg-brown-deep/50 border-2 border-brown rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#c9a45c]/40 bg-brown-deep flex items-center justify-center text-xl shadow-[0_0_15px_rgba(201,164,92,0.15)] shrink-0">
                    {activeDeity.id === 'athena' && '🦉'}
                    {activeDeity.id === 'persephone-soul' && '🦋'}
                    {activeDeity.id === 'persephone-witness' && '🍎'}
                    {activeDeity.id === 'sisyphus' && '⛰️'}
                    {activeDeity.id === 'dionysus' && '🍇'}
                    {activeDeity.id === 'astra' && '⭐'}
                    {activeDeity.id === 'zeus' && '⚡'}
                    {activeDeity.id === 'hades' && '⚓'}
                    {activeDeity.id === 'sappho' && '📜'}
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-[#c9a45c]">Reading Interpreted By</span>
                    <h4 className="font-serif text-sm text-white font-bold">{activeDeity.name} &middot; {activeDeity.badge}</h4>
                    <p className="text-[10px] text-sage italic mt-0.5">"{activeDeity.quote}"</p>
                  </div>
                </div>

                {/* Main Readings */}
                {isAnalyzing ? (
                  <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-[#c9a45c] border-t-transparent animate-spin" />
                      <Sparkles className="w-5 h-5 text-[#c9a45c] absolute top-1.5 left-3.5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-sm text-white">Aligning Celestial Coordinates...</h4>
                      <p className="text-[10px] text-sage font-mono animate-pulse">
                        {activeDeity.artStyle === 'Warli' && 'Sifting ancient Warli stick-figure lines of fate...'}
                        {activeDeity.artStyle === 'Pichwai' && 'Measuring somatic weight of the Pichwai lotus stone...'}
                        {activeDeity.artStyle === 'Aipan' && 'Tracing symmetric Aipan flour floor coordinates...'}
                        {activeDeity.artStyle === 'Chittara' && 'Assembling geometric Chittara lattice pathways...'}
                        {activeDeity.artStyle === 'Rogan' && 'Binding Rogan resin pigments of destiny...'}
                        {activeDeity.artStyle === 'Kalamezhuthu' && 'Drawing cosmic Kalamezhuthu stardust grids...'}
                        {activeDeity.artStyle === 'Pata Chitra' && 'Unrolling sacred Pata Chitra narrative scrolls...'}
                        {activeDeity.artStyle === 'Manjusha' && 'Inscribing therapeutic Manjusha poetry scripts...'}
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif text-sm text-white font-bold">Divine Disturbance</h4>
                      <p className="text-[10px] text-sage mt-1">{error}</p>
                      <button
                        onClick={handleDrawCard}
                        className="mt-3 text-[9px] uppercase font-bold tracking-widest text-[#c9a45c] hover:underline cursor-pointer"
                      >
                        Retry Alignment
                      </button>
                    </div>
                  </div>
                ) : readingResult ? (
                  <div className="space-y-4">
                    {/* Emotional Assessment Card */}
                    <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-5 space-y-2">
                      <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> Detected Emotional Aura
                      </span>
                      <p className="text-xs text-white leading-relaxed font-serif italic">
                        "{readingResult.emotionalAnalysis}"
                      </p>
                    </div>

                    {/* Central Reading */}
                    <div className="bg-brown-deep/30 border-2 border-[#c9a45c]/30 rounded-2xl p-6 space-y-3 shadow-[0_0_20px_rgba(201,164,92,0.05)]">
                      <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-[#c9a45c] font-bold">Divine Interpretation</span>
                      <p className="text-xs md:text-sm text-slate-100 leading-relaxed font-serif">
                        {readingResult.reading}
                      </p>
                    </div>

                    {/* Daily Ritual */}
                    <div className="bg-indigo-500/5 border-2 border-indigo-500/20 rounded-2xl p-5 space-y-2">
                      <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-periwinkle font-bold flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 animate-spin-slow text-periwinkle" /> Recommended Healing Ritual
                      </span>
                      <p className="text-xs text-sage leading-relaxed font-serif">
                        {readingResult.dailyRitual}
                      </p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guide Selector or Draw callout */}
          {!drawnCard && (
            <div className="text-center p-6 bg-brown-deep/15 border-2 border-dashed border-brown/50 rounded-2xl">
              <Compass className="w-8 h-8 text-[#c9a45c] mx-auto opacity-70 animate-spin-slow mb-2.5" />
              <h4 className="font-serif text-sm text-white">Your Sanctuary Chats Feed into the Deck</h4>
              <p className="text-[10px] text-sage max-w-md mx-auto mt-1">
                The Gemini AI analyzes your recent chat history with {activeDeity.name} to capture your current emotional aura and maps it onto the drawn tarot archetype.
              </p>
            </div>
          )}
        </div>

        {/* Right side: 3D Deck of Cards & Active Drawing Area */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="text-[10px] font-mono tracking-widest text-sage uppercase mb-5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#c9a45c]" />
            {drawnCard ? 'Your Active Oracle Card' : 'Click Deck To Draw Card'}
          </div>

          <div className="perspective-1000 flex items-center justify-center h-[410px] w-full">
            <AnimatePresence mode="wait">
              {!drawnCard ? (
                <motion.div
                  key="deck-face-down"
                  className="relative w-64 h-96 cursor-pointer flex items-center justify-center group"
                  onClick={handleDrawCard}
                  whileHover={{ scale: 1.05, rotateY: -10 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Decorative card depth layers (deck effect) */}
                  <div className="absolute w-full h-full bg-[#1b150c] rounded-2xl border-2 border-[#b38a58]/30 translate-x-3 translate-y-3 shadow-md -z-30" />
                  <div className="absolute w-full h-full bg-[#201910] rounded-2xl border-2 border-[#b38a58]/40 translate-x-1.5 translate-y-1.5 shadow-md -z-20" />
                  
                  {/* Top card in deck */}
                  <div className="w-full h-full bg-[#281f14] rounded-2xl border-4 border-[#c9a45c] flex flex-col items-center justify-between p-6 shadow-2xl relative overflow-hidden transition-all group-hover:border-sage">
                    
                    {/* Golden card back design with Greek columns & center cosmos */}
                    <div className="absolute inset-2 border border-white/5 rounded-xl pointer-events-none" />
                    
                    {/* Geometric back lattice pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c9a45c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                    <span className="text-[10px] font-mono tracking-[0.25em] text-[#c9a45c]/80 uppercase">
                      The Pantheon
                    </span>

                    {/* Cosmic Star Sigil in Center */}
                    <div className="w-24 h-24 rounded-full border border-[#c9a45c]/50 flex items-center justify-center relative animate-spin-slow">
                      <div className="absolute w-20 h-20 rounded-full border border-dashed border-[#c9a45c]/30" />
                      <Sparkles className="w-8 h-8 text-[#c9a45c] group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-[9px] font-mono tracking-widest text-[#c9a45c]/70 block">
                        {isDealing ? 'DEALING FATE...' : 'DRAW DAILY READING'}
                      </span>
                      <div className="h-1 w-12 bg-[#c9a45c]/50 mx-auto rounded-full group-hover:bg-sage transition-colors" />
                    </div>

                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`card-${drawnCard.id}`}
                  initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
                  animate={{ rotateY: isReversed ? 180 : 0, scale: 1, opacity: 1 }}
                  exit={{ rotateY: -90, scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-64 h-96 relative preserve-3d"
                >
                  {/* Card Front Side */}
                  <div 
                    className="w-full h-full rounded-2xl border-4 border-[#c9a45c] bg-[#070b13] flex flex-col justify-between p-6 shadow-[0_0_35px_rgba(201,164,92,0.25)] backface-hidden"
                    style={{ transform: isReversed ? 'rotate(180deg)' : 'none' }}
                  >
                    <div className="absolute inset-2 border border-[#c9a45c]/10 rounded-xl pointer-events-none" />

                    <div className="flex justify-between items-center text-[#c9a45c] font-mono text-[8px] tracking-widest uppercase">
                      <span>{drawnCard.archetype}</span>
                      <span>{isReversed ? 'REVERSED' : 'UPRIGHT'}</span>
                    </div>

                    {/* Tarot Illustration box */}
                    <div className="w-full h-44 border-2 border-brown/40 bg-brown-deep/20 rounded-xl flex flex-col items-center justify-center text-center p-4 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,164,92,0.04)_0%,transparent_75%)]" />
                      <span className="text-5xl mb-3 block transform group-hover:scale-110 transition-transform duration-300">
                        {drawnCard.symbol}
                      </span>
                      <span className="text-[9px] text-sage font-serif leading-tight">
                        {drawnCard.description}
                      </span>
                    </div>

                    <div className="text-center space-y-1 z-10">
                      <h4 className="font-serif text-sm font-bold text-white tracking-wide">
                        {drawnCard.name}
                      </h4>
                      <p className="text-[8px] font-mono text-sage tracking-[0.1em] uppercase">
                        {drawnCard.artStyle.split(' ')[0]} Art Stylization
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Touch instructions */}
          {!drawnCard && (
            <span className="text-[9px] font-mono tracking-wider text-sage/60 mt-3 animate-pulse">
              ▲ Click or tap the stack to draw your card ▲
            </span>
          )}
          
          {drawnCard && (
            <div className="text-center mt-3 space-y-1">
              <span className="text-[10px] font-serif italic text-sage">
                {drawnCard.name} ({isReversed ? 'Reversed' : 'Upright'})
              </span>
              <p className="text-[9px] font-mono text-[#c9a45c] max-w-xs mx-auto leading-tight">
                "Meaning: {isReversed ? drawnCard.meaningReversed : drawnCard.meaningUpright}"
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
