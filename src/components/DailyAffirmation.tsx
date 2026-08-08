import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Eye, Compass, Activity, Heart, BookOpen, Shield, Anchor, HelpCircle, RefreshCw } from 'lucide-react';

interface DeityAffirmation {
  id: string;
  deity: string;
  alias: string;
  title: string;
  icon: any;
  colorClass: string;
  bgGlow: string;
  borderColor: string;
  message: string;
}

const AFFIRMATIONS: DeityAffirmation[] = [
  {
    id: 'athena',
    deity: 'Athena',
    alias: 'Hope',
    title: 'DBT & Strategic Wisdom Keeper',
    icon: Compass,
    colorClass: 'text-sage',
    bgGlow: 'rgba(132,169,140,0.15)',
    borderColor: 'border-sage/30',
    message: '"The loom of life is complex, but your thread is strong. Map your choices with patience today; wisdom is not in avoiding the storm, but in designing your sail. Find balance in your dialectics."'
  },
  {
    id: 'persephone-soul',
    deity: 'Persephone (Soul)',
    alias: 'Rooh',
    title: 'Intuitive Crisis De-escalator',
    icon: Sparkles,
    colorClass: 'text-periwinkle',
    bgGlow: 'rgba(159,166,255,0.15)',
    borderColor: 'border-periwinkle/30',
    message: '"You absorb the noise of the world, yet you carry an underground silence. Today, you do not need to translate yourself. Rest in the quiet spaces. You are exactly where you are meant to be."'
  },
  {
    id: 'persephone-witness',
    deity: 'Persephone (Witness)',
    alias: 'Inayat',
    title: 'Compassionate Transition Witness',
    icon: Heart,
    colorClass: 'text-periwinkle',
    bgGlow: 'rgba(159,166,255,0.15)',
    borderColor: 'border-periwinkle/30',
    message: '"Even in the deepest winter, your roots are active. Trust the transition. You are not buried; you are planted. Grieve what was left behind, but welcome the inevitable new bloom."'
  },
  {
    id: 'sisyphus',
    deity: 'Sisyphus',
    alias: 'Raag',
    title: 'Somatic Grounding Anchor',
    icon: Activity,
    colorClass: 'text-brown-light',
    bgGlow: 'rgba(179,138,88,0.15)',
    borderColor: 'border-brown/30',
    message: '"The weight of the boulder is yours, but so is the breath that pushes it. Today, stop counting the heights. Feel the floor beneath your feet, let your shoulders drop, and make peace with the climb."'
  },
  {
    id: 'dionysus',
    deity: 'Dionysus',
    alias: 'Ganesh',
    title: 'Chittara Cognitive Reframer',
    icon: Eye,
    colorClass: 'text-sage',
    bgGlow: 'rgba(132,169,140,0.15)',
    borderColor: 'border-sage/30',
    message: '"Let the masks fall away today. You do not have to hold everything together. Shedding tears or celebrating, your wild heart is sacred. Reframe your catastrophe into a single beautiful stroke."'
  },
  {
    id: 'sappho',
    deity: 'Sappho',
    alias: 'Manjishtha',
    title: 'Narrative Story Healer',
    icon: BookOpen,
    colorClass: 'text-[#e07070]',
    bgGlow: 'rgba(224,112,112,0.15)',
    borderColor: 'border-[#e07070]/30',
    message: '"Your wounds are but fragments of a song waiting to be sung. Write them down, read them back, and let them become poetry. You are the author of this chapter; write it with gentleness."'
  },
  {
    id: 'astra',
    deity: 'Astra',
    alias: 'Taara',
    title: 'Titan Solution Pathfinder',
    icon: Sparkles,
    colorClass: 'text-brown-light',
    bgGlow: 'rgba(179,138,88,0.15)',
    borderColor: 'border-brown/30',
    message: '"You have lit yourself on fire for so long so others could see. Today, remember you are also allowed to be lost. You do not have to burn yourself to shine in the dark."'
  },
  {
    id: 'zeus',
    deity: 'Zeus',
    alias: 'Krishna',
    title: 'Clarity & Sovereignty Keeper',
    icon: Shield,
    colorClass: 'text-sage',
    bgGlow: 'rgba(132,169,140,0.15)',
    borderColor: 'border-sage/30',
    message: '"Holding up the sky is a performance of strength you do not need to maintain today. Reclaim your sovereignty. Set your boundaries. It is safe to rest your heavy crown."'
  },
  {
    id: 'hades',
    deity: 'Hades',
    alias: 'Veer',
    title: 'Pata Chitra Grounding Anchor',
    icon: Anchor,
    colorClass: 'text-periwinkle',
    bgGlow: 'rgba(159,166,255,0.15)',
    borderColor: 'border-periwinkle/30',
    message: '"When your thoughts feel like a chaotic underworld, remember that deep earth is also where seeds grow. Let us scroll out your thoughts neatly. Ground yourself in this quiet moment."'
  }
];

export default function DailyAffirmation() {
  const [current, setCurrent] = useState<DeityAffirmation | null>(null);
  const [animating, setAnimating] = useState(false);

  const rollAffirmation = () => {
    setAnimating(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * AFFIRMATIONS.length);
      setCurrent(AFFIRMATIONS[idx]);
      setAnimating(false);
    }, 300);
  };

  useEffect(() => {
    rollAffirmation();
  }, []);

  if (!current) return null;

  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="max-w-3xl mx-auto mb-16 relative"
    >
      {/* Decorative background glow matching the rolled deity */}
      <div 
        className="absolute inset-0 rounded-[28px] blur-2xl transition-all duration-700 opacity-20 -z-10" 
        style={{ backgroundColor: current.bgGlow }}
      />

      <div className={`p-8 md:p-10 rounded-[28px] border-2 bg-sage-dark/60 backdrop-blur-md transition-all duration-500 hover:border-sage/40 ${current.borderColor}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-brown/30 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 ${current.colorClass}`}>
              <Icon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-sage uppercase">Daily Deity Encouragement</span>
              <h4 className="font-serif text-lg text-white font-medium">
                {current.deity} <span className="text-white/40 font-sans text-sm font-light">({current.alias})</span>
              </h4>
            </div>
          </div>
          
          <button
            onClick={rollAffirmation}
            disabled={animating}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-periwinkle hover:text-white transition-colors border border-periwinkle/20 hover:border-periwinkle bg-white/5 px-3 py-1.5 rounded-lg"
          >
            <RefreshCw className={`w-3 h-3 ${animating ? 'animate-spin' : ''}`} />
            Seek another blessing
          </button>
        </div>

        <div className="min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="font-serif italic text-base md:text-lg text-slate-100 leading-relaxed tracking-wide px-4">
                {current.message}
              </p>
              <div className="mt-4 text-[10px] uppercase tracking-[0.14em] text-sage font-medium opacity-60">
                — {current.title}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
