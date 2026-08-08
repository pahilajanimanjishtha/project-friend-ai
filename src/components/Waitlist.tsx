import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Mail, Heart, Landmark, MessageSquare, CheckCircle2, 
  ArrowRight, Coins, Gift, AlertCircle, HelpCircle, ChevronRight,
  ShieldCheck, FileText, Compass, Megaphone
} from 'lucide-react';

interface BackerEntry {
  id: string;
  timestamp: string;
  name: string;
  emailMasked: string;
  interest: 'waitlist' | 'feedback' | 'donate' | 'invest';
  message: string;
  amount?: string;
}

interface WaitlistProps {
  isLightMode: boolean;
}

export default function Waitlist({ isLightMode }: WaitlistProps) {
  // Form values
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState<'waitlist' | 'feedback' | 'donate' | 'invest'>('waitlist');
  const [message, setMessage] = useState('');
  
  // Custom amounts depending on action
  const [donationPledge, setDonationPledge] = useState('20');
  const [investmentBracket, setInvestmentBracket] = useState('5000');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEntry, setSuccessEntry] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live wall of backers
  const [backers, setBackers] = useState<BackerEntry[]>([]);
  const [backersLoading, setBackersLoading] = useState(true);

  // Fetch Backers list
  const fetchBackers = async () => {
    try {
      const res = await fetch('/api/waitlist');
      if (res.ok) {
        const data = await res.json();
        setBackers(data);
      }
    } catch (err) {
      console.error('Failed to align backer registers', err);
    } finally {
      setBackersLoading(false);
    }
  };

  useEffect(() => {
    fetchBackers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Calculate actual amount based on interest selection
    let finalAmount = undefined;
    if (interest === 'donate') {
      finalAmount = isCustom ? `$${customAmount}` : `$${donationPledge}`;
    } else if (interest === 'invest') {
      finalAmount = isCustom ? `$${customAmount}` : `$${Number(investmentBracket).toLocaleString()}`;
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || 'Anonymous Backer',
          interest,
          message,
          amount: finalAmount
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to file your backing scroll');
      }

      const data = await res.json();
      setSuccessEntry(data.entry);
      
      // Reset form
      setEmail('');
      setName('');
      setMessage('');
      setCustomAmount('');
      setIsCustom(false);

      // Refresh backers list
      fetchBackers();
    } catch (err: any) {
      setErrorMessage(err.message || 'The scrolls are currently damp. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for interest badge colors
  const getInterestTag = (type: string) => {
    switch (type) {
      case 'waitlist':
        return { label: 'Waitlist', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
      case 'feedback':
        return { label: 'Feedback', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' };
      case 'donate':
        return { label: 'Donation Pledge', color: 'bg-[#c9a45c]/10 text-[#c9a45c] border border-[#c9a45c]/20' };
      case 'invest':
        return { label: 'Seed Investor', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
      default:
        return { label: 'Backer', color: 'bg-stone-500/10 text-stone-400 border border-stone-500/20' };
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-6 py-12 md:py-16 min-h-screen text-left`}>
      {/* HEADER SECTION */}
      <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 border-2 border-[#c9a45c]/40 bg-[#c9a45c]/10 text-[#c9a45c] px-4 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Contribute to Pantheon 🏛️
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`font-serif text-3xl sm:text-5xl tracking-tight leading-[1.1] font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}
        >
          Shape the future of <br className="hidden sm:inline" />
          <span className="text-[#c9a45c] italic font-serif font-black">Friend AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans ${isLightMode ? 'text-slate-600' : 'text-sage'}`}
        >
          We are building the first mental health sanctuary that synthesizes ancient mythological archetypes with somatic feedback loops. Choose your path below to join our exclusive waitlist, suggest guidance modules, pledge a micro-donation, or explore early investment rounds.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto items-start">
        {/* LEFT COLUMN: THE INTERACTIVE FORM */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden ${
              isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#060b13] border-[#c9a45c]/20'
            }`}
          >
            {/* Background embellishments */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a45c]/5 rounded-full filter blur-xl"></div>
            
            <h3 className={`font-serif text-xl sm:text-2xl font-bold mb-1 ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
              Contributors Register
            </h3>
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-6 block border-b border-white/5 pb-3">
              Secure Submission Scroll
            </p>

            {successEntry ? (
              /* SUCCESS PANEL */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-[#c9a45c]/10 border border-[#c9a45c] flex items-center justify-center text-[#c9a45c] mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-bold text-white">Scroll Dispatched!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Hermes has registered your submission on the sacred bronze tablets. The council of friendly guides will review your intention and align the stars.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border text-left max-w-md mx-auto space-y-3 font-mono text-xs ${
                  isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-[#090f16] border-[#c9a45c]/20'
                }`}>
                  <div>
                    <span className="text-slate-500 block uppercase text-[9px] tracking-wider">REGISTRATION ID</span>
                    <span className="text-white font-bold">{successEntry.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] tracking-wider">INTENT</span>
                      <span className="text-[#c9a45c] font-bold uppercase">{successEntry.interest}</span>
                    </div>
                    {successEntry.amount && (
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px] tracking-wider">PLEDGE SIZE</span>
                        <span className="text-emerald-400 font-bold">{successEntry.amount}</span>
                      </div>
                    )}
                  </div>
                  {successEntry.message && (
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] tracking-wider">MESSAGE PREVIEW</span>
                      <p className="text-slate-300 italic">"{successEntry.message}"</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSuccessEntry(null)}
                  className="font-serif text-xs uppercase tracking-[0.16em] bg-white/5 hover:bg-white/10 text-[#c9a45c] border border-[#c9a45c]/40 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                >
                  File another scroll
                </button>
              </motion.div>
            ) : (
              /* INTERACTIVE FORM CONTENT */
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Interest Selector Tabs */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    My Contribution Path
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => { setInterest('waitlist'); setIsCustom(false); }}
                      className={`py-3 px-1 rounded-xl border font-serif text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        interest === 'waitlist'
                          ? 'bg-[#c9a45c]/10 border-[#c9a45c] text-white'
                          : 'bg-transparent border-white/5 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-[#c9a45c]" />
                      <span>Waitlist</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setInterest('feedback'); setIsCustom(false); }}
                      className={`py-3 px-1 rounded-xl border font-serif text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        interest === 'feedback'
                          ? 'bg-[#c9a45c]/10 border-[#c9a45c] text-white'
                          : 'bg-transparent border-white/5 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>Feedback</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setInterest('donate'); setIsCustom(false); }}
                      className={`py-3 px-1 rounded-xl border font-serif text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        interest === 'donate'
                          ? 'bg-[#c9a45c]/10 border-[#c9a45c] text-white'
                          : 'bg-transparent border-white/5 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>Donate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setInterest('invest'); setIsCustom(false); }}
                      className={`py-3 px-1 rounded-xl border font-serif text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        interest === 'invest'
                          ? 'bg-[#c9a45c]/10 border-[#c9a45c] text-white'
                          : 'bg-transparent border-white/5 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span>Invest</span>
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Email Address <span className="text-[#c9a45c] font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sanctuary@domain.com"
                      className={`w-full text-xs p-3.5 pl-10 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${
                        isLightMode 
                          ? 'bg-white border-[#dfd2be] text-slate-800' 
                          : 'bg-[#121c17]/60 border-white/5 text-white'
                      }`}
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Your Name / Moniker (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Patron Hermes / Sophia Chen"
                    className={`w-full text-xs p-3.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${
                      isLightMode 
                        ? 'bg-white border-[#dfd2be] text-slate-800' 
                        : 'bg-[#121c17]/60 border-white/5 text-white'
                    }`}
                  />
                </div>

                {/* CONDITIONAL INTEREST ARCHE-INPUTS: DONATE */}
                {interest === 'donate' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#c9a45c]">
                      Pledge Donation size
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['5', '20', '100', '500'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setDonationPledge(val); setIsCustom(false); }}
                          className={`py-2 px-1 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                            donationPledge === val && !isCustom
                              ? 'bg-[#c9a45c] text-black border-[#c9a45c]'
                              : 'bg-transparent border-white/5 text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="checkbox"
                        id="custom-pledge"
                        checked={isCustom}
                        onChange={(e) => setIsCustom(e.target.checked)}
                        className="rounded border-white/10 accent-[#c9a45c]"
                      />
                      <label htmlFor="custom-pledge" className="text-[10px] text-slate-400 cursor-pointer font-serif select-none">
                        Pledge custom donation instead
                      </label>
                    </div>

                    {isCustom && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <input
                          type="text"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="e.g. $15"
                          className="w-full text-xs p-3 rounded-lg border border-[#c9a45c] bg-black/35 text-white pl-8 focus:outline-none"
                        />
                        <span className="absolute left-3.5 top-3 text-xs text-[#c9a45c] font-bold font-mono">$</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* CONDITIONAL INTEREST ARCHE-INPUTS: INVEST */}
                {interest === 'invest' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      Target Investment Interest
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: '1000', label: '$1k' },
                        { val: '5000', label: '$5k' },
                        { val: '25000', label: '$25k' },
                        { val: '100000', label: '$100k' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => { setInvestmentBracket(item.val); setIsCustom(false); }}
                          className={`py-2 px-1 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                            investmentBracket === item.val && !isCustom
                              ? 'bg-emerald-500 text-black border-emerald-500'
                              : 'bg-transparent border-white/5 text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="checkbox"
                        id="custom-invest"
                        checked={isCustom}
                        onChange={(e) => setIsCustom(e.target.checked)}
                        className="rounded border-white/10 accent-emerald-500"
                      />
                      <label htmlFor="custom-invest" className="text-[10px] text-slate-400 cursor-pointer font-serif select-none">
                        Specify custom investment target
                      </label>
                    </div>

                    {isCustom && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <input
                          type="text"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="e.g. $10,000"
                          className="w-full text-xs p-3 rounded-lg border border-emerald-500 bg-black/35 text-white pl-8 focus:outline-none"
                        />
                        <span className="absolute left-3.5 top-3 text-xs text-emerald-400 font-bold font-mono">$</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Message / Feedback Box */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {interest === 'waitlist' && "Why are you interested / What guides do you like most? (Optional)"}
                    {interest === 'feedback' && "Your Feedback or module requests? (Required)"}
                    {interest === 'donate' && "Wishes of alignment or feedback? (Optional)"}
                    {interest === 'invest' && "Affiliation / Investment brief? (Optional)"}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required={interest === 'feedback'}
                    placeholder={
                      interest === 'feedback' 
                        ? "Please type down which tools you'd love us to build next, or any bugs you faced!"
                        : "Write down your messages here for the friendly guides..."
                    }
                    rows={4}
                    className={`w-full text-xs p-3.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] resize-none ${
                      isLightMode 
                        ? 'bg-white border-[#dfd2be] text-slate-800' 
                        : 'bg-[#121c17]/60 border-white/5 text-white'
                    }`}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#c9a45c] hover:bg-[#b08c48] disabled:opacity-55 text-black font-serif font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Engraving Sacred Tablet...
                    </span>
                  ) : (
                    <>
                      <span>Submit Backing Intent</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN: SCROLL OF HONOR (LIVE FEED) */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-3xl border-2 flex flex-col ${
            isLightMode ? 'bg-[#fcfaf5] border-[#dfd2be]' : 'bg-[#04080e]/60 border-white/5'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-serif text-base font-bold text-white">Scroll of Sacred Patrons</h4>
                <p className="text-[10px] text-slate-400">Public wall of friendly alignments</p>
              </div>
              <Compass className="w-5 h-5 text-[#c9a45c] animate-spin" style={{ animationDuration: '30s' }} />
            </div>

            {backersLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-[#c9a45c] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Calling Oracles...</p>
              </div>
            ) : backers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Be the first to leave your imprint on the register!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {backers.map((backer) => {
                  const tag = getInterestTag(backer.interest);
                  return (
                    <div 
                      key={backer.id}
                      className={`p-3.5 rounded-xl border transition-all text-left space-y-2 ${
                        isLightMode 
                          ? 'bg-white border-stone-200' 
                          : 'bg-black/30 border-white/5 hover:border-[#c9a45c]/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-serif font-bold text-xs text-white block">
                            {backer.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {backer.emailMasked}
                          </span>
                        </div>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${tag.color}`}>
                          {tag.label}
                        </span>
                      </div>

                      {backer.amount && (
                        <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-1 rounded inline-flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          <span>Pledge: {backer.amount}</span>
                        </div>
                      )}

                      {backer.message && (
                        <p className={`text-xs italic leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                          "{backer.message}"
                        </p>
                      )}

                      <div className="text-[8px] font-mono text-slate-500 text-right">
                        {new Date(backer.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SINCERE PITCH STATEMENT */}
          <div className={`p-6 rounded-3xl border border-dashed text-left space-y-3 ${
            isLightMode ? 'border-[#dfd2be] bg-[#fdfcf9]' : 'border-[#c9a45c]/20 bg-[#c9a45c]/5'
          }`}>
            <h5 className="font-serif text-sm font-bold text-[#c9a45c]">Why Support Friend AI?</h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mental wellness is not a generic template. By pairing evidence-based tools (CBT, DBT guides, medication tracking, and somatic breathing) with beautiful mythological stories and Indian hand-sketched art aesthetics, we create a playground where minds can heal playfully and securely.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-[#c9a45c] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Secure &amp; Community Authoritative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
