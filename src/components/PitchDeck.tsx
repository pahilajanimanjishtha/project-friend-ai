import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Presentation, Target, Sparkles, TrendingUp, Layers, Award } from 'lucide-react';

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "The Vision & Mission",
      subtitle: "Reimagining Digital Therapeutics",
      icon: Target,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Most mental health apps are clinical, cold, or superficial. They treat wellness as a set of checkboxes. 
          </p>
          <div className="p-6 rounded-xl border-2 border-brown bg-brown-deep/50 space-y-3">
            <span className="text-xs uppercase tracking-wider text-periwinkle font-bold">The Friend AI Paradigm</span>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              We merge mythological archetypes, classical Indian visual arts (Warli, Pichwai, Aipan, Pata Chitra), and established clinical frameworks (Dialectical Behavior Therapy, Somatic Experiencing, Narrative Therapy) to form an immersive, therapeutic sanctuary.
            </p>
          </div>
          <p className="text-sage text-xs italic opacity-85">
            "Art has the power to structure the chaotic underworld of our thoughts."
          </p>
        </div>
      )
    },
    {
      title: "The Integration Matrix",
      subtitle: "Blends of Tradition & Science",
      icon: Layers,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-xs md:text-sm">
            Our technology utilizes nine highly customized therapeutic entities matching myth with classical art:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep/40">
              <span className="font-serif text-xs text-sage block font-bold mb-1">Warli Art + DBT (Athena)</span>
              <p className="text-sage text-[11px] leading-relaxed opacity-85">
                Athena uses simple stick-figure motifs of community and movement to guide Dialectical Behavior Therapy.
              </p>
            </div>
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep/40">
              <span className="font-serif text-xs text-periwinkle block font-bold mb-1">Pichwai Art + Somatics (Sisyphus)</span>
              <p className="text-sage text-[11px] leading-relaxed opacity-85">
                Sisyphus pairs the detailed, meditative devotion of temple paintings with physical heavy-burden somatic anchors.
              </p>
            </div>
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep/40">
              <span className="font-serif text-xs text-[#e07070] block font-bold mb-1">Manjusha Art + Narrative (Sappho)</span>
              <p className="text-sage text-[11px] leading-relaxed opacity-85">
                Sappho structures lived wounds into sequential, celebrated poetic narratives.
              </p>
            </div>
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep/40">
              <span className="font-serif text-xs text-[#9fa6ff] block font-bold mb-1">Aipan Art + Compassion (Persephone)</span>
              <p className="text-sage text-[11px] leading-relaxed opacity-85">
                Persephone hosts transition grief holding space in symmetric, floor-painting geometry.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Business & Market model",
      subtitle: "A Viable Wellness Ecosystem",
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            The global wellness economy is a multi-billion dollar market. Consumers are hungry for genuine creative connections and emotional health solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep text-center">
              <span className="block font-serif text-lg text-periwinkle font-bold">Freemium</span>
              <span className="text-[10px] text-sage uppercase tracking-widest block mt-1 font-semibold">Core Sanctuary Chat</span>
            </div>
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep text-center">
              <span className="block font-serif text-lg text-sage font-bold">B2B Wellness</span>
              <span className="text-[10px] text-sage uppercase tracking-widest block mt-1 font-semibold">Corporate Subscriptions</span>
            </div>
            <div className="p-4 rounded-xl border-2 border-brown bg-brown-deep text-center">
              <span className="block font-serif text-lg text-[#e07070] font-bold">Art Packages</span>
              <span className="text-[10px] text-sage uppercase tracking-widest block mt-1 font-semibold">Premium visual assets</span>
            </div>
          </div>
          <p className="text-sage text-xs leading-relaxed text-center opacity-85">
            By gamifying mental health with classical art therapy, we increase engagement by over 2.4x compared to traditional journaling apps.
          </p>
        </div>
      )
    },
    {
      title: "System Architecture",
      subtitle: "Secure & Intelligent Framework",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 text-xs md:text-sm">
            Built using modern, lightweight server-side technologies to maintain user privacy, security, and lightning-fast responses:
          </p>
          <div className="p-5 rounded-xl border-2 border-brown bg-brown-deep/50 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-periwinkle/10 text-periwinkle border border-periwinkle/20 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
              <div>
                <span className="text-xs text-white font-medium block">Server-Side Prompt Engineering</span>
                <span className="text-[11px] text-sage opacity-85">Gemini 3.5-flash is initialized only on the server, injecting strict therapeutic boundaries and art-myth personas to guarantee secure and specialized chat.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-sage/10 text-sage border border-sage/20 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
              <div>
                <span className="text-xs text-white font-medium block">Privacy & Caching Layer</span>
                <span className="text-[11px] text-sage opacity-85">Chat transcripts reside solely in client state, ensuring complete corporate compliance and personal confidentiality.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Growth & Execution",
      subtitle: "The Road to Scale",
      icon: Award,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            We are positioning Friend AI as the foremost boutique therapeutic companion applet. Our immediate roadmap is built on art integration, interactive journaling, and community exhibitions.
          </p>
          <div className="p-6 rounded-xl border-2 border-sage/20 bg-sage/5">
            <h4 className="font-serif text-sage text-sm font-bold mb-2">Upcoming Milestones</h4>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-300">
              <li>Launch of the Sanctuary Companion beta to 10k wellness subscribers.</li>
              <li>Dynamic visual synthesis integration using Gemini 3.1-flash-lite-image.</li>
              <li>Collaborative partnerships with classical Indian art guilds.</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const ActiveIcon = slides[currentSlide].icon;

  return (
    <div className="relative min-h-screen text-white pt-24 pb-20 px-6 max-w-5xl mx-auto z-10 flex flex-col justify-center">
      {/* Slide Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-periwinkle/10 text-periwinkle rounded-xl border border-periwinkle/20">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-sage font-mono block font-bold">Startup Pitch Deck</span>
            <span className="font-serif text-sm text-white">Friend AI Concept Brief</span>
          </div>
        </div>

        {/* Bullet Nav dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                currentSlide === i ? 'bg-periwinkle w-6' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Slide Card Container as Bento */}
      <div className="relative min-h-[420px] rounded-[24px] border-2 border-brown bg-sage-dark p-8 md:p-12 flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(3,7,15,0.8)]">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <ActiveIcon className="w-64 h-64 text-white" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs uppercase tracking-widest text-periwinkle font-bold block mb-1">
                Slide 0{currentSlide + 1}
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-light tracking-tight text-white">
                {slides[currentSlide].title}
              </h2>
              <p className="text-sage text-xs uppercase tracking-widest block mt-1">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            <div className="border-t-2 border-brown pt-6 relative z-10">
              {slides[currentSlide].content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer controls */}
        <div className="flex justify-between items-center border-t-2 border-brown pt-6 mt-8">
          <span className="text-xs text-sage font-mono">
            0{currentSlide + 1} / 0{slides.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="p-3 rounded-xl border-2 border-brown hover:border-sage bg-brown-deep/50 hover:bg-brown-deep transition-all text-sage hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-xl bg-periwinkle text-white hover:bg-periwinkle-hover transition-all cursor-pointer shadow-[0_0_15px_rgba(159,166,255,0.2)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
