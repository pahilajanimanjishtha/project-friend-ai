import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Code, Paintbrush, HeartPulse, Sparkles, Activity, 
  ShieldCheck, GraduationCap, Award, Info, Scale, ExternalLink, Linkedin 
} from 'lucide-react';

interface TeamProps {
  isLightMode?: boolean;
}

interface Member {
  name: string;
  role: string;
  id?: string; // Google Drive ID
  imageUrl?: string; // Direct image URL
  category: 'tech' | 'medical' | 'strategy' | 'mascot';
  badge: string;
  color: string;
  description: string;
  icon?: React.ComponentType<any>;
  linkedin?: string;
}

interface TeamMemberCardProps {
  member: Member;
  isLightMode: boolean;
  idx: number;
}

// Sub-component to manage image fallback state cleanly
const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, isLightMode, idx }) => {
  const [imageError, setImageError] = useState(false);
  const IconComponent = member.icon || (member.category === 'tech' ? Code : member.category === 'medical' ? HeartPulse : Scale);

  // Smart preview thumbnail URL from Google Drive or direct image URL
  const imageUrl = member.imageUrl 
    ? member.imageUrl 
    : member.id 
      ? `https://drive.google.com/thumbnail?id=${member.id}&sz=w500` 
      : null;

  // Initials for avatar fallback
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ delay: idx * 0.04, duration: 0.4 }}
      className={`p-6 rounded-[24px] border-2 flex flex-col md:flex-row gap-5 items-center md:items-start transition-all duration-300 relative group ${
        isLightMode 
          ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800 hover:border-[#c9a45c]/50 hover:shadow-[0_8px_30px_rgba(201,164,92,0.12)]' 
          : 'bg-[#07130e] border-[#112d24] text-white hover:border-[#c9a45c]/50 hover:bg-[#0a1e16] hover:shadow-[0_0_25px_rgba(201,164,92,0.08)]'
      }`}
    >
      {/* Decorative Corner Accent */}
      <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-[22px] border-t-2 border-r-2 border-transparent group-hover:border-[#c9a45c]/30 transition-all duration-300 pointer-events-none" />

      {/* Portrait / Avatar Section */}
      <div className="shrink-0 relative">
        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 relative flex items-center justify-center transition-all duration-300 group-hover:scale-[1.03] ${
          isLightMode ? 'border-[#dfd2be] bg-white' : 'border-[#112d24] bg-black/40'
        }`}>
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={member.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 ${
                member.name === 'Sarvesh Pahilajani' 
                  ? 'scale-[1.9] origin-[50%_17%] object-top' 
                  : member.name === 'Rishabh Kothiyal'
                    ? 'scale-[1.3] origin-[50%_18%] object-top'
                    : 'object-center'
              }`}
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center font-serif text-xl font-bold relative ${
              member.category === 'tech' 
                ? 'bg-blue-500/10 text-blue-400' 
                : member.category === 'medical' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-[#c9a45c]'
            }`}>
              {/* Backing subtle pattern */}
              <div className="absolute inset-0 opacity-10 flex items-center justify-center font-mono text-[9px] overflow-hidden select-none">
                {Array(5).fill(initials).join(' ')}
              </div>
              <span className="relative tracking-wider">{initials}</span>
              <IconComponent className="w-4 h-4 opacity-45 mt-1.5 absolute bottom-3" />
            </div>
          )}
        </div>

        {/* Floating miniature category badge on bottom of portrait */}
        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-xl border-2 flex items-center justify-center shadow-md ${
          isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#07130e] border-[#112d24]'
        }`}>
          <IconComponent className={`w-3.5 h-3.5 ${member.color.split(' ')[0]}`} />
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 flex-1 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
            <h3 className="font-serif text-lg font-bold text-[#c9a45c] group-hover:text-amber-300 transition-colors duration-300">
              {member.name}
            </h3>
            <span className={`text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border font-bold inline-block mx-auto md:mx-0 shrink-0 ${member.color}`}>
              {member.badge}
            </span>
          </div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">{member.role}</p>
        </div>
        <p className={`text-xs leading-relaxed opacity-85 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
          {member.description}
        </p>

        {/* Action Link for authentic presentation */}
        {member.linkedin && (
          <div className="pt-1 flex items-center justify-center md:justify-start gap-1.5">
            <a 
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[9px] font-mono tracking-wider uppercase flex items-center gap-1.5 transition-all ${
                isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-[#c9a45c]'
              }`}
            >
              Verify Credentials <Linkedin className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Team({ isLightMode = false }: TeamProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'tech' | 'medical' | 'strategy'>('all');

  const members: Member[] = [
    {
      name: "Manjishtha Pahilajani",
      role: "Founder & Creative Visionary",
      id: "1yyTci0jNTaw9P80ADLp4392OGZjAS9Ty",
      category: "tech",
      badge: "Founder",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "A visionary humanities scholar, history gold-medalist, and poet who pioneered Project Friend AI. She bridges the gap between classical Indian art aesthetics, secure decentralized AI architectures, and compassionate mental health tech.",
      linkedin: "https://www.linkedin.com/in/manjishtha-pahilajani"
    },
    {
      name: "Altaf Jasnaik",
      role: "Lead UI/UX & Interactive Design",
      id: "1zhycLLjaRMKlZvxG_8w_OovmBd8tr_AW",
      category: "tech",
      badge: "Tech & Design",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      description: "Directs the visual geometry and interactive layout, ensuring that classical Indian design motifs and mental-health-focused user experiences are beautifully responsive and intuitive.",
      linkedin: "https://www.linkedin.com/in/discoveraltafjasnaik/"
    },
    {
      name: "Suryateja Vakkanti",
      role: "AI Systems & Design Collaborator",
      id: "1neyqLFJLzDaMwK7h7bF0AgGHSo1BkR8B",
      category: "tech",
      badge: "AI Systems",
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      description: "Spearheads secure conversational boundaries and AI modeling interfaces, implementing clean client-side logic and localized security paradigms.",
      linkedin: "https://www.linkedin.com/in/suryateja-vakkanti"
    },
    {
      name: "Rishabh Kothiyal",
      role: "Technical & Design Collaborator",
      category: "tech",
      badge: "Tech & Design",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "An expert software engineering collaborator focused on high-performance interactive layout structures and scalable system integration.",
      imageUrl: "/rishabh_kothiyal.svg",
      linkedin: "https://www.linkedin.com/in/rishabhkothiyal/"
    },
    {
      name: "Dr. Asha Pahilajani",
      role: "Senior Clinical & Medical Grounding Advisor",
      id: "1hasuBioyfa3kvH5wNc33Tv4iGBK-bnqQ",
      category: "medical",
      badge: "Medical Advisor",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Provides senior clinical and medical oversight, ensuring that conversational therapies, breathing algorithms, and de-escalation scripts remain fully aligned with psychological guidelines.",
      linkedin: "https://www.linkedin.com/in/dr-asha-pahilajani-a6356b370/"
    },
    {
      name: "Dr. Raghav Kapoor",
      role: "Somatic Neurology Advisor",
      icon: Activity,
      category: "medical",
      badge: "Neurology Advisor",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: "Additional Director & Consultant in Neurology at Fortis Escorts Heart Institute (MBBS, MD, DM). Guides neurological research on somatic breathing exercises and vagal tone enhancement.",
      linkedin: "https://www.linkedin.com/in/dr-raghav-kapoor-0b96635b/"
    },
    {
      name: "Sarvesh Pahilajani",
      role: "Systems Architect & Tech Advisor",
      id: "1O97VZFbYJ4LFRbFrIwCYF1ScVT3ncmOe",
      category: "tech",
      badge: "Engineering Advisor",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "Advises on full-stack architecture and localized client-side databases, guaranteeing robust offline performance and high-performance privacy vaults.",
      linkedin: "https://www.linkedin.com/in/sarvesh-pahilajani-a3b58a230"
    },
    {
      name: "Vatsala Choudhary",
      role: "Psychological Research Coordinator",
      id: "1POkFxiZvhumT4r2b-Ojs3aKk39E3_uNX",
      category: "medical",
      badge: "Research Lead",
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      description: "Leads research on evidence-based therapies like CBT and mindfulness protocols, translating academic psychology insights into direct user journeys.",
      linkedin: "https://www.linkedin.com/in/vatsalachoudhary?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
    },
    {
      name: "Adv. Kunal Dutta",
      role: "Legal & Ethics Compliance Counsel",
      id: "1KxJt5nZT0T6WHYfHKlS0yOvE1uS5NcQT",
      category: "strategy",
      badge: "Legal Counsel",
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
      description: "Ensures Project Friend AI complies with digital data protection, privacy guidelines, and ethical standards for machine learning tools.",
      linkedin: "https://www.linkedin.com/in/kunal-dutta-424a43137/"
    },
    {
      name: "Vinod Kumar Pahilajani",
      role: "Senior Executive & Corporate Advisor",
      id: "1nmqaL6oziW3pikRRPxpXmaYl6ZdUQ69B",
      category: "strategy",
      badge: "Strategic Counsel",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      description: "Provides senior strategic counsel on organizational scaling, operational excellence, and corporate governance to drive long-term impact.",
      linkedin: "https://www.linkedin.com/in/vinod-pahilajani-45484817/"
    },
    {
      name: "Eshan Dutta",
      role: "Brand & Strategy Advisor",
      category: "strategy",
      badge: "Strategic Advisor",
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      description: "Provides guidance on digital marketing, brand outreach strategy, and expanding user engagement for the Friend AI platform.",
      linkedin: "https://www.linkedin.com/in/eshan-dutta/"
    },
    {
      name: "Sombit Mitra",
      role: "Sales Executive",
      category: "strategy",
      badge: "Sales Executive",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "A B.Tech Computer Science and Engineering student from Ghaziabad in his 3rd year, managing outreach, market expansion, and user acquisition pipelines.",
      imageUrl: "https://images.unsplash.com/photo-1581382575275-97901c2635b7?auto=format&fit=crop&q=80&w=500"
    },
    {
      name: "Sparsh Sachdeva",
      role: "Strategy & Legal Consultant",
      category: "strategy",
      badge: "Consultant",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Advises on corporate strategy, regulatory compliance, and transactional framework structures for emerging technology initiatives.",
      linkedin: "https://www.linkedin.com/in/spurshsachdeva"
    },
    {
      name: "Akhil Singh",
      role: "Strategy & Operations Consultant",
      category: "strategy",
      badge: "Consultant",
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      description: "Consults on strategic scaling pipelines, operational excellence models, and user onboarding flows to drive brand growth.",
      linkedin: "https://www.linkedin.com/in/akhil-singh-569164193"
    },
    {
      name: "Tony",
      role: "Chief Mascot & Joy Specialist",
      icon: Sparkles,
      category: "mascot",
      badge: "Canine Leader",
      color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      description: "Our beloved pug companion who lives in the corner of your screen! Offers sweet daily logs, conversational comfort, and unconditional support."
    }
  ];

  // Filter members based on active tab
  const filteredMembers = members.filter(member => {
    if (activeFilter === 'all') return member.category !== 'mascot'; // Hide mascot from main grids to keep it professional, or keep it. Let's show mascot under strategy/all
    return member.category === activeFilter;
  });

  const filterTabs = [
    { id: 'all', label: 'All Team & Advisors', count: members.filter(m => m.category !== 'mascot').length },
    { id: 'tech', label: 'Tech & Design', count: members.filter(m => m.category === 'tech').length },
    { id: 'medical', label: 'Clinical & Medical', count: members.filter(m => m.category === 'medical').length },
    { id: 'strategy', label: 'Strategic & Legal', count: members.filter(m => m.category === 'strategy').length }
  ] as const;

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-white pt-24 pb-20 px-6 max-w-5xl mx-auto z-10 flex flex-col justify-center">
      {/* Header Banner */}
      <div className="text-center mb-8 space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-3 bg-[#c9a45c]/10 text-[#c9a45c] rounded-2xl border border-[#c9a45c]/25 mb-1"
        >
          <Users className="w-6 h-6" />
        </motion.div>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c9a45c] block font-bold"
        >
          People Behind the Sanctuary
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white"
        >
          Our Interdisciplinary Team
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          Meet the minds uniting classical Indian arts, clinical psychology, somatic neurology, and compliance to create your secure digital sanctuary.
        </motion.p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center mb-10">
        <div className={`p-1 rounded-2xl border flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-full ${
          isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-black/30 border-brown'
        }`}>
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-[#c9a45c] text-black shadow-md'
                  : isLightMode
                    ? 'text-slate-700 hover:bg-slate-200/50 hover:text-slate-950'
                    : 'text-slate-300 hover:bg-[#c9a45c]/10 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                activeFilter === tab.id
                  ? 'bg-black/15 text-black'
                  : 'bg-black/30 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="relative">
        <motion.div 
          layout 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, idx) => (
              <TeamMemberCard 
                key={member.name} 
                member={member} 
                isLightMode={isLightMode} 
                idx={idx} 
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Mascot Corner Segment (Subtle bottom bar) */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className={`mt-16 p-6 rounded-[24px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${
          isLightMode ? 'bg-[#f4f0e6]/60 border-[#dfd2be]' : 'bg-brown-deep/20 border-brown'
        }`}
      >
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="p-3 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full shrink-0">
            <Sparkles className="w-6 h-6 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold text-[#c9a45c]">Looking for Tony?</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mt-1">
              Our chief joy advisor is always on active duty! Find him floating in his chat container at the bottom right corner of your sanctuary, ready to fetch comfort and bark words of support.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-3.5 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold inline-block">
            🐾 100% Good Boy Certified
          </span>
        </div>
      </motion.div>
    </div>
  );
}
