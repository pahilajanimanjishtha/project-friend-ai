import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Calendar, Shield, Heart, Zap, Award, Star, Compass, Download, CheckCircle, RefreshCw, Eye, BookOpen } from 'lucide-react';
import { CHARACTERS } from '../data';
import DailyOracleDraw from './DailyOracleDraw';

interface OracleProfile {
  name: string;
  dob: string;
  deityId: string;
  intention: string;
  themeStyle: 'celestial' | 'ancient' | 'gold' | 'neon';
  stats: {
    respect: number;
    resilience: number;
    mindfulness: number;
    grounding: number;
  };
  cardImage: string; // Base64 data URI
  generatedAt: string;
}

interface OracleProfileCreatorProps {
  onProfileSaved: (profile: OracleProfile) => void;
  savedProfile: OracleProfile | null;
  isLightMode?: boolean;
}

export default function OracleProfileCreator({ onProfileSaved, savedProfile, isLightMode }: OracleProfileCreatorProps) {
  const [profile, setProfile] = useState<Omit<OracleProfile, 'cardImage' | 'generatedAt'>>({
    name: savedProfile?.name || 'Alethea',
    dob: savedProfile?.dob || '1996-10-12',
    deityId: savedProfile?.deityId || 'athena',
    intention: savedProfile?.intention || 'Strategic Clarity & Inner Truth',
    themeStyle: savedProfile?.themeStyle || 'celestial',
    stats: savedProfile?.stats || {
      respect: 85,
      resilience: 75,
      mindfulness: 90,
      grounding: 60,
    }
  });

  const [activeProfile, setActiveProfile] = useState<OracleProfile | null>(savedProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'tarot'>('profile');
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<Omit<OracleProfile, 'cardImage' | 'generatedAt'>>(profile);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate randomized stats based on name & deity
  const randomizeStats = (deityId: string) => {
    let respect = Math.floor(Math.random() * 25) + 65;
    let resilience = Math.floor(Math.random() * 25) + 65;
    let mindfulness = Math.floor(Math.random() * 25) + 65;
    let grounding = Math.floor(Math.random() * 25) + 65;

    if (deityId === 'athena' || deityId === 'zeus') respect += 10;
    if (deityId === 'sisyphus' || deityId === 'hades') grounding += 15;
    if (deityId === 'persephone-soul' || deityId === 'persephone-witness') resilience += 10;
    if (deityId === 'sappho' || deityId === 'dionysus') mindfulness += 10;

    setStep(prev => ({
      ...prev,
      deityId,
      stats: {
        respect: Math.min(respect, 100),
        resilience: Math.min(resilience, 100),
        mindfulness: Math.min(mindfulness, 100),
        grounding: Math.min(grounding, 100)
      }
    }));
  };

  const handleTextChange = (field: string, val: string) => {
    setStep(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const generateOracleCard = async () => {
    setIsGenerating(true);
    // Mimic deep calculation/ritual loading
    await new Promise(resolve => setTimeout(resolve, 1500));

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsGenerating(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // Set high resolution
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const selectedDeity = CHARACTERS.find(c => c.id === step.deityId) || CHARACTERS[0];

    // Draw background base based on theme selection
    let bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
    
    if (step.themeStyle === 'celestial') {
      bgGrad.addColorStop(0, '#101626');
      bgGrad.addColorStop(1, '#05070f');
    } else if (step.themeStyle === 'ancient') {
      bgGrad.addColorStop(0, '#2e2518');
      bgGrad.addColorStop(1, '#14100b');
    } else if (step.themeStyle === 'gold') {
      bgGrad.addColorStop(0, '#261c02');
      bgGrad.addColorStop(1, '#080601');
    } else { // neon
      bgGrad.addColorStop(0, '#211333');
      bgGrad.addColorStop(1, '#08030f');
    }
    
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stardust or constellations in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ornate Greek borders
    ctx.strokeStyle = step.themeStyle === 'gold' ? '#d4af37' : step.themeStyle === 'ancient' ? '#b38a58' : step.themeStyle === 'neon' ? '#bf96ff' : '#9fa6ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Draw ornamental corner circles
    const corners = [
      [20, 20], [width - 20, 20], [20, height - 20], [width - 20, height - 20]
    ];
    ctx.fillStyle = step.themeStyle === 'gold' ? '#d4af37' : step.themeStyle === 'ancient' ? '#b38a58' : step.themeStyle === 'neon' ? '#bf96ff' : '#9fa6ff';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Sacred Celestial Circle in the center upper
    const centerX = width / 2;
    const centerY = height * 0.38;
    const circleRadius = 110;

    // Outer glow ring
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius + 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = step.themeStyle === 'gold' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(159, 166, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred alignment glyphs (draw little ticks around circle)
    for (let deg = 0; deg < 360; deg += 30) {
      const angle = (deg * Math.PI) / 180;
      const startX = centerX + Math.cos(angle) * circleRadius;
      const startY = centerY + Math.sin(angle) * circleRadius;
      const endX = centerX + Math.cos(angle) * (circleRadius + 8);
      const endY = centerY + Math.sin(angle) * (circleRadius + 8);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw central Greek/Celestial symbol based on Deity ID
    ctx.fillStyle = step.themeStyle === 'gold' ? '#f3e5ab' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '56px serif';

    let symbol = '✦';
    if (step.deityId === 'athena') symbol = '👁️';
    else if (step.deityId === 'persephone-soul') symbol = '🦋';
    else if (step.deityId === 'persephone-witness') symbol = '🍎';
    else if (step.deityId === 'sisyphus') symbol = '⛰️';
    else if (step.deityId === 'dionysus') symbol = '🍇';
    else if (step.deityId === 'astra') symbol = '⭐';
    else if (step.deityId === 'zeus') symbol = '⚡';
    else if (step.deityId === 'hades') symbol = '⚓';
    else if (step.deityId === 'sappho') symbol = '📜';

    ctx.fillText(symbol, centerX, centerY);

    // Draw Laurel crown above the symbol
    ctx.font = '24px serif';
    ctx.fillText('𓋹  𓅊  𓋹', centerX, centerY - circleRadius - 40);

    // Text Section - Card Title
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = step.themeStyle === 'gold' ? '#d4af37' : '#9fa6ff';
    ctx.letterSpacing = '5px';
    ctx.fillText('SACRED ORACLE COVENANT', centerX, height * 0.11);

    // User Name
    ctx.font = '32px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '1px';
    ctx.fillText(step.name, centerX, height * 0.58);

    // Line separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, height * 0.62);
    ctx.lineTo(width - 100, height * 0.62);
    ctx.stroke();

    // Alignment details
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const dobFormatted = new Date(step.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    ctx.fillText(`Initiated on ${dobFormatted}`, centerX, height * 0.65);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#9fa6ff';
    ctx.letterSpacing = '2px';
    ctx.fillText(`PATRON DEITY: ${selectedDeity.badge.toUpperCase()} (${selectedDeity.alias.toUpperCase()})`, centerX, height * 0.69);

    // DRAW STATS - GTA STYLE Bars
    const statsY = height * 0.73;
    const barWidth = 140;
    const barHeight = 8;
    const gap = 15;

    ctx.textAlign = 'left';
    ctx.font = '10px monospace';
    ctx.letterSpacing = '1px';

    // Stat 1: RESPECT
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('SOVEREIGN RESPECT', 50, statsY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, statsY + 6, barWidth, barHeight);
    ctx.fillStyle = '#9fa6ff';
    ctx.fillRect(50, statsY + 6, barWidth * (step.stats.respect / 100), barHeight);

    // Stat 2: MINDFULNESS
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('WISDOM MINDFULNESS', 50, statsY + 32);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, statsY + 38, barWidth, barHeight);
    ctx.fillStyle = '#84a98c';
    ctx.fillRect(50, statsY + 38, barWidth * (step.stats.mindfulness / 100), barHeight);

    // Stat 3: RESILIENCE
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('SOUL RESILIENCE', width - 50 - barWidth, statsY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(width - 50 - barWidth, statsY + 6, barWidth, barHeight);
    ctx.fillStyle = '#e07070';
    ctx.fillRect(width - 50 - barWidth, statsY + 6, barWidth * (step.stats.resilience / 100), barHeight);

    // Stat 4: GROUNDING
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('SOMATIC GROUNDING', width - 50 - barWidth, statsY + 32);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(width - 50 - barWidth, statsY + 38, barWidth, barHeight);
    ctx.fillStyle = '#c9a45c';
    ctx.fillRect(width - 50 - barWidth, statsY + 38, barWidth * (step.stats.grounding / 100), barHeight);

    // Footer text
    ctx.textAlign = 'center';
    ctx.font = 'italic 10px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`"${step.intention}"`, centerX, height * 0.93);

    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.letterSpacing = '1px';
    ctx.fillText('FRIEND AI SECURE TEMPLE &bull; SANCTIFIED IN STATE', centerX, height * 0.96);

    const dataUri = canvas.toDataURL('image/png');
    const completeProfile: OracleProfile = {
      ...step,
      cardImage: dataUri,
      generatedAt: new Date().toLocaleDateString()
    };

    setActiveProfile(completeProfile);
    onProfileSaved(completeProfile);
    localStorage.setItem('oracleProfile', JSON.stringify(completeProfile));
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!activeProfile) return;
    const link = document.createElement('a');
    link.download = `Oracle_Profile_${activeProfile.name.replace(/\s+/g, '_')}.png`;
    link.href = activeProfile.cardImage;
    link.click();
  };

  if (activeTab === 'tarot') {
    return (
      <div className="space-y-6 my-12">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
          <div className="flex bg-[#070b13] p-1.5 rounded-2xl border-2 border-brown gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-3 font-serif text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#c9a45c]/25 text-[#c9a45c] font-bold border border-[#c9a45c]/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              Covenant Profile
            </button>
            <button
              onClick={() => setActiveTab('tarot')}
              className={`flex items-center gap-2 px-6 py-3 font-serif text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
                activeTab === 'tarot'
                  ? 'bg-[#c9a45c]/25 text-[#c9a45c] font-bold border border-[#c9a45c]/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#c9a45c]" />
              Daily Tarot Draw
            </button>
          </div>
        </div>
        <DailyOracleDraw isLightMode={isLightMode} />
      </div>
    );
  }

  return (
    <div className="space-y-6 my-12">
      <div className="max-w-5xl mx-auto px-4 flex justify-center">
        <div className="flex bg-[#070b13] p-1.5 rounded-2xl border-2 border-brown gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 font-serif text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#c9a45c]/25 text-[#c9a45c] font-bold border border-[#c9a45c]/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4" />
            Covenant Profile
          </button>
          <button
            onClick={() => setActiveTab('tarot')}
            className={`flex items-center gap-2 px-6 py-3 font-serif text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
              activeTab === 'tarot'
                ? 'bg-[#c9a45c]/25 text-[#c9a45c] font-bold border border-[#c9a45c]/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#c9a45c]" />
            Daily Tarot Draw
          </button>
        </div>
      </div>

      <div className="bg-[#03070f] text-white p-6 rounded-[28px] border-2 border-brown max-w-5xl mx-auto relative z-10 shadow-[0_0_50px_rgba(201,164,92,0.1)]">
      
      {/* Absolute Decorative Back Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-periwinkle/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brown-deep/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="border-b-2 border-brown pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#c9a45c]">Sacred Ritual Portal</span>
          <h2 className="font-serif text-3xl font-medium text-white tracking-wide mt-1">
            Oracle Profile Creator
          </h2>
          <p className="text-xs text-sage mt-1 max-w-xl">
            Sovereign alignment module. Generate your personalized, cryptographic tarot profile card with custom Greek deity associations and real-time canvas rendering.
          </p>
        </div>
        {activeProfile && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-white bg-[#c9a45c] hover:bg-[#c9a45c]/80 px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(201,164,92,0.2)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download PNG
            </button>
            <button
              onClick={() => setActiveProfile(null)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-sage border-2 border-brown hover:border-sage bg-white/5 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-cast Ritual
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Creation Form or Profile details */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {!activeProfile ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-6 space-y-4">
                  <h3 className="font-serif text-lg text-white mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c9a45c]" />
                    Step 1: Enter your mortal parameters
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-sage uppercase mb-1.5">
                        Initiate Name
                      </label>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => handleTextChange('name', e.target.value)}
                        className="w-full bg-brown-deep text-white border-2 border-brown rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#c9a45c] transition-colors"
                        placeholder="e.g. Alethea"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-sage uppercase mb-1.5">
                        Ascension Day (Date of Birth)
                      </label>
                      <input
                        type="date"
                        value={step.dob}
                        onChange={(e) => handleTextChange('dob', e.target.value)}
                        className="w-full bg-brown-deep text-white border-2 border-brown rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#c9a45c] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-sage uppercase mb-1.5">
                      Your Sacred Intention for Healing
                    </label>
                    <input
                      type="text"
                      value={step.intention}
                      onChange={(e) => handleTextChange('intention', e.target.value)}
                      className="w-full bg-brown-deep text-white border-2 border-brown rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#c9a45c] transition-colors"
                      placeholder="e.g. Seeking boundaries and tranquil stillness"
                    />
                  </div>
                </div>

                <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-6 space-y-4">
                  <h3 className="font-serif text-lg text-white mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-periwinkle" />
                    Step 2: Bind Patron Deity & Align Energies
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {CHARACTERS.map((char) => {
                      const isSelected = step.deityId === char.id;
                      return (
                        <button
                          key={char.id}
                          onClick={() => randomizeStats(char.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-[#c9a45c] bg-[#c9a45c]/10 text-white shadow-[0_0_10px_rgba(201,164,92,0.1)]'
                              : 'border-brown bg-brown-deep/40 hover:border-sage text-white/60 hover:text-white'
                          }`}
                        >
                          <span className="text-xl mb-1">
                            {char.id === 'athena' && '👁️'}
                            {char.id === 'persephone-soul' && '🦋'}
                            {char.id === 'persephone-witness' && '🍎'}
                            {char.id === 'sisyphus' && '⛰️'}
                            {char.id === 'dionysus' && '🍇'}
                            {char.id === 'astra' && '⭐'}
                            {char.id === 'zeus' && '⚡'}
                            {char.id === 'hades' && '⚓'}
                            {char.id === 'sappho' && '📜'}
                          </span>
                          <span className="text-[10px] font-serif font-bold truncate block w-full">{char.badge}</span>
                          <span className="text-[8px] font-mono tracking-wider opacity-65">{char.alias}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-brown/60">
                    <label className="block text-[10px] font-mono tracking-widest text-sage uppercase mb-1.5">
                      Select Card Art Theme Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['celestial', 'ancient', 'gold', 'neon'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setStep(prev => ({ ...prev, themeStyle: theme }))}
                          className={`py-2 text-[10px] font-mono tracking-wider rounded-lg border-2 uppercase cursor-pointer ${
                            step.themeStyle === theme
                              ? 'border-periwinkle bg-periwinkle/10 text-white'
                              : 'border-brown bg-brown-deep/20 text-white/50 hover:border-sage hover:text-white'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated/GTA Real-time Stat bars preview */}
                <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-6">
                  <h4 className="font-mono text-[10px] tracking-[0.15em] text-sage uppercase mb-4">
                    Current Calculated Divine Stats (GTA-Inspired)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/60">SOVEREIGN RESPECT</span>
                        <span className="text-[#9fa6ff] font-bold">{step.stats.respect}%</span>
                      </div>
                      <div className="h-2 bg-brown rounded-full overflow-hidden">
                        <div className="h-full bg-[#9fa6ff] transition-all duration-500" style={{ width: `${step.stats.respect}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/60">SOUL RESILIENCE</span>
                        <span className="text-[#e07070] font-bold">{step.stats.resilience}%</span>
                      </div>
                      <div className="h-2 bg-brown rounded-full overflow-hidden">
                        <div className="h-full bg-[#e07070] transition-all duration-500" style={{ width: `${step.stats.resilience}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/60">WISDOM MINDFULNESS</span>
                        <span className="text-[#84a98c] font-bold">{step.stats.mindfulness}%</span>
                      </div>
                      <div className="h-2 bg-brown rounded-full overflow-hidden">
                        <div className="h-full bg-[#84a98c] transition-all duration-500" style={{ width: `${step.stats.mindfulness}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/60">SOMATIC GROUNDING</span>
                        <span className="text-[#c9a45c] font-bold">{step.stats.grounding}%</span>
                      </div>
                      <div className="h-2 bg-brown rounded-full overflow-hidden">
                        <div className="h-full bg-[#c9a45c] transition-all duration-500" style={{ width: `${step.stats.grounding}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateOracleCard}
                  disabled={isGenerating}
                  className="w-full bg-periwinkle-dark text-white hover:bg-periwinkle-hover disabled:opacity-50 py-4 rounded-2xl font-serif text-base tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(159,166,255,0.3)] hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Aligning Divine Coordinates...' : 'Cast Custom Oracle Card'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-lg text-white font-medium">Sacred Oracle Card Anchored!</h3>
                    <p className="text-xs text-sage mt-1 leading-relaxed">
                      Your personalized ritual state has been preserved. Your divine stats are active, and your patron deity has received your intention. You can access your card or re-cast the ritual anytime.
                    </p>
                  </div>
                </div>

                <div className="bg-brown-deep/30 border-2 border-brown rounded-2xl p-6 space-y-4">
                  <h4 className="font-mono text-[10px] tracking-[0.15em] text-[#c9a45c] uppercase">
                    Your Active Covenant Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-white/40 block mb-0.5">Sovereign Name</span>
                      <strong className="text-slate-100 text-sm font-serif">{activeProfile.name}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block mb-0.5">Patron Deity</span>
                      <strong className="text-slate-100 text-sm font-serif">
                        {CHARACTERS.find(c => c.id === activeProfile.deityId)?.badge} ({CHARACTERS.find(c => c.id === activeProfile.deityId)?.alias})
                      </strong>
                    </div>
                    <div>
                      <span className="text-white/40 block mb-0.5">Zodiac/Initiation</span>
                      <strong className="text-slate-100 font-mono">
                        {new Date(activeProfile.dob).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-white/40 block mb-0.5">Healing Intention</span>
                      <strong className="text-slate-100 italic">{activeProfile.intention}</strong>
                    </div>
                  </div>
                  
                  {/* Detailed descriptions of Patron */}
                  <div className="pt-4 border-t border-brown text-xs text-sage leading-relaxed space-y-1.5">
                    <strong>Deity Alignment Message:</strong>
                    <p className="italic bg-brown-deep/40 p-3 rounded-xl border border-brown text-white/80">
                      {CHARACTERS.find(c => c.id === activeProfile.deityId)?.wound} {CHARACTERS.find(c => c.id === activeProfile.deityId)?.secret}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-[#c9a45c] text-white hover:bg-[#c9a45c]/90 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_15px_rgba(201,164,92,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Save/Download PNG
                  </button>
                  <button
                    onClick={() => setActiveProfile(null)}
                    className="flex-1 bg-white/5 text-white border-2 border-brown hover:border-sage py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Cast New Card
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: High Fidelity Canvas / Tarot Card View */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="text-[10px] font-mono tracking-widest text-sage uppercase mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> High-Fidelity Render Output
          </div>
          
          <div className="relative group rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border-2 border-brown/50 bg-[#070b13] p-1">
            {/* Real hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Display representation */}
            {activeProfile ? (
              <img
                src={activeProfile.cardImage}
                alt="Generated Oracle Card"
                className="w-full max-w-[340px] rounded-2xl border border-white/5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-[300px] h-[400px] md:w-[340px] md:h-[453px] rounded-2xl bg-brown-deep/20 border-2 border-dashed border-brown/50 flex flex-col items-center justify-center text-center p-6 space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(159,166,255,0.03)_0%,transparent_70%)] animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c9a45c]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-white">Tarot Render Ready</h4>
                  <p className="text-[10px] text-sage mt-1">
                    Fill out your mortal details and choose your patron deity to cast your customizable Oracle card.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
</div>
  );
}
