import React from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface VisionMissionProps {
  isLightMode?: boolean;
}

export default function VisionMission({ isLightMode = false }: VisionMissionProps) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] text-white pt-24 pb-20 px-6 max-w-5xl mx-auto z-10 flex flex-col justify-center">
      {/* Header Banner */}
      <div className="text-center mb-12 space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-3 bg-[#c9a45c]/10 text-[#c9a45c] rounded-2xl border border-[#c9a45c]/25 mb-2"
        >
          <Target className="w-6 h-6 animate-pulse" />
        </motion.div>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c9a45c] block font-bold"
        >
          Corporate Intent & Soul
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-white"
        >
          Our Vision &amp; Mission
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          A sacred convergence of therapeutic science, ancient mythology, and the timeless aesthetics of classical Indian folk arts.
        </motion.p>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-12">
        {/* Card 1: The Core Vision */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-8 rounded-[24px] border-2 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' 
              : 'bg-brown-deep/40 border-brown text-white'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-periwinkle/10 text-periwinkle flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">The Vision</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              According to the <strong>World Health Organization (WHO)</strong>, nearly 1 in 8 people—about 970 million individuals globally—live with a mental health disorder. In India, over 150 million citizens require active care, with a staggering 80% treatment gap due to deep social stigma and lack of accessible resources.
            </p>
            <p className="text-sm leading-relaxed opacity-90">
              We envision a fundamental transition of the digital landscape: moving away from toxic online spaces and dangerous hazards like the infamous <em>"Blue Whale"</em> challenge, and steering instead toward a therapeutic <strong>"Blue Ocean"</strong>—a vast, serene, and safe space of healing. By wrapping evidence-based practices in mythology and classical arts, we turn self-care into a daily joy.
            </p>
          </div>
          <div className="border-t border-[#c9a45c]/10 pt-4 mt-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] font-black block">
              Aesthetic Elevation &middot; Wellness Reimagined
            </span>
          </div>
        </motion.div>

        {/* Card 2: The Core Mission */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-8 rounded-[24px] border-2 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' 
              : 'bg-brown-deep/40 border-brown text-white'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">The Mission</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              Reports by <strong>UNESCO</strong> show that academic stress, isolation, and social media anxiety affect more than half of students and young adults globally and in India, severely disrupting their mental health and educational progression.
            </p>
            <p className="text-sm leading-relaxed opacity-90">
              Our mission is to democratize secure, compassionate therapeutic companionship. Through server-side Gemini intelligence, we provide immediate, confidential emotional first-aid with custom supportive characters—including Medusa for trauma and assault recovery—to guide survivors safely back to their own power.
            </p>
          </div>
          <div className="border-t border-[#c9a45c]/10 pt-4 mt-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] font-black block">
              Compassionate Companion &middot; Safe Sanctuary
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer Banner: The Integration Paradigm */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`p-8 md:p-10 rounded-[24px] border-2 text-center ${
          isLightMode ? 'bg-amber-50 border-emerald-500/10' : 'bg-[#10b981]/5 border-[#10b981]/20'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <ShieldCheck className="w-8 h-8 text-[#c9a45c] mx-auto animate-pulse" />
          <h4 className="font-serif text-lg font-bold text-[#c9a45c]">The Clinical Art Integration Matrix</h4>
          <p className="text-xs leading-relaxed opacity-85">
            We actively support the integration of five classical Indian art traditions (Warli, Pichwai, Manjusha, Aipan, and Rogan art) with validated psychological modalities like Dialectical Behavior Therapy (DBT), Somatic Experiencing, and Narrative Therapy. This guarantees that your self-care practices are grounded in both scientific efficacy and beautiful cultural heritage.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
