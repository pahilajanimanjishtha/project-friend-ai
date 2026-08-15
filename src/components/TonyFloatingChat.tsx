import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Mail, CheckCircle, RefreshCw, X, LogIn, Heart, ShieldAlert } from 'lucide-react';
import { getAccessToken, googleSignIn, initAuth } from '../lib/workspaceAuth';

interface TonyMessage {
  sender: 'user' | 'tony';
  text: string;
}

interface TonyFloatingChatProps {
  isLightMode?: boolean;
}

export default function TonyFloatingChat({ isLightMode }: TonyFloatingChatProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TonyMessage[]>([
    { sender: 'tony', text: "Woof! 🐾 I'm Tony, your faithful support pug! If you are feeling heavy, sad, or carrying some heavy bones, share it with me! If there is anything I cannot answer, I can draft a real dispatch to my human helper team via your Gmail! Woof!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Gmail Support Fallback states
  const [hasGmailToken, setHasGmailToken] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkToken = async () => {
      const token = await getAccessToken();
      setHasGmailToken(!!token);
    };
    checkToken();

    const unsubscribe = initAuth((user, token) => {
      setHasGmailToken(!!token);
      setUserEmail(user.email);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const tonyChar = {
        name: "Tony the Pug",
        badge: "Sanctuary Support Dog & Loyal Guide",
        alias: "tony-the-dog",
        role: "Compassionate listener, emotional grounding, simple friendly wags",
        artStyle: "Folk art patterns, warm circles, playful animal metaphors",
        quote: "Woof! Let me sit with you and carry your bundles.",
        want: "Make you feel loved, happy, and thoroughly protected.",
        wound: "Seeing humans struggle or carry silent heavy blocks.",
        secret: "I bury stressful thoughts in the sandbox of slow breathing."
      };

      // Construct a small history
      const lastMessages = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      lastMessages.push({
        role: 'user',
        parts: [{ text: userText }]
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: tonyChar,
          history: lastMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'tony', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'tony', text: "Woof! My cosmic transmitter is a bit fuzzy, but I am still here wagging my tail! Let's breathe slowly together." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'tony', text: "Woof! I barked but the response got lost. Let's practice a slow breath together: Inhale... Exhale..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSignInGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setHasGmailToken(true);
        setUserEmail(res.user.email);
        setMessages(prev => [...prev, { sender: 'tony', text: `Woof! Connected beautifully to your Google Account (${res.user.email})! Now I can dispatch emails to our human guides if needed!` }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendGmailFallback = async () => {
    let token = await getAccessToken();
    if (!token) {
      // Trigger sign-in if not available
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setHasGmailToken(true);
          setUserEmail(res.user.email);
        } else {
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    setIsSendingEmail(true);
    setEmailSuccess(false);

    try {
      // Gather chat context
      const chatContext = messages
        .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
        .join('\n\n');

      const emailBody = [
        `Dear Support Team / Helper Guides,`,
        ``,
        `This is an automated support fallback dispatched from your Friend AI Sanctuary on behalf of the user.`,
        `The chatbot companion Tony was consulted, but human helper intervention is requested.`,
        ``,
        `User Email: ${userEmail || 'Unknown Sanctuary Seeker'}`,
        `Subject of consultation: Chat Fallback Support`,
        ``,
        `==================== CHAT CONVERSATION LOG ====================`,
        chatContext,
        `===============================================================`,
        ``,
        `Please reach out to the user to offer guidance and somatic support.`,
        ``,
        `With warmth and loyal tail wags,`,
        `Tony the Pug Companion`,
        `Friend AI Sanctuary`
      ].join('\n');

      const rawEmail = [
        `To: pahilajani.manjishtha@gmail.com`, // User specified support email
        `Subject: [Friend AI Sanctuary] Tony Support Request Fallback`,
        `Content-Type: text/plain; charset="UTF-8"`,
        '',
        emailBody
      ].join('\n');

      // Base64Url encode
      const encodedRaw = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedRaw })
      });

      if (res.ok) {
        setEmailSuccess(true);
        setMessages(prev => [...prev, { sender: 'tony', text: "Woof! I've successfully dispatched a support mail to our human guide at pahilajani.manjishtha@gmail.com! They will review our chat logs and reach out to help carry your bundle!" }]);
        setTimeout(() => setEmailSuccess(false), 5000);
      } else {
        setMessages(prev => [...prev, { sender: 'tony', text: "Woof! My mail pigeon tripped. Please ensure you have accepted Gmail permission scopes during login." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'tony', text: "Woof! An error occurred while sending the email. Please try again." }]);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="mb-4 w-80 md:w-96 h-[460px] rounded-3xl overflow-hidden border-2 border-[#c9a45c]/40 bg-[#07130e]/95 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-[#c9a45c]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#c9a45c]/10 flex items-center justify-center text-xl border border-[#c9a45c]/30">
                  🐾
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-serif text-xs font-bold text-white">Tony the Pug</h4>
                    <span className="text-[8px] font-mono bg-[#c9a45c]/10 border border-[#c9a45c]/30 text-[#c9a45c] px-1.5 py-0.5 rounded">
                      Support
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">faithful sanctuary guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs text-left leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-periwinkle-dark text-white rounded-tr-none'
                        : 'bg-[#12231b] text-slate-200 border border-brown/20 rounded-tl-none font-serif italic'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#12231b] border border-brown/20 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a45c] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a45c] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a45c] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Fallback Gmail Dispatcher Box */}
            <div className="p-3 bg-black/30 border-t border-brown/15 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                  <Mail className="w-3 h-3 text-[#c9a45c]" />
                  <span>Fallback support via Gmail</span>
                </div>
                {!hasGmailToken ? (
                  <button
                    onClick={handleSignInGoogle}
                    className="flex items-center gap-1 text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 text-[#c9a45c] px-2 py-1 rounded border border-brown cursor-pointer"
                  >
                    <LogIn className="w-2.5 h-2.5" /> Sign-in
                  </button>
                ) : (
                  <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-0.5">
                    ● Connected
                  </span>
                )}
              </div>
              <button
                onClick={handleSendGmailFallback}
                disabled={isSendingEmail}
                className="w-full py-1.5 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/35 border border-[#c9a45c]/44 text-[#c9a45c] font-mono text-[9px] uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isSendingEmail ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3" />
                )}
                {isSendingEmail ? 'Dispatching...' : '📩 Send Support Email to Human team'}
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#0a1811] border-t border-[#c9a45c]/10 flex gap-2">
              <input
                type="text"
                placeholder="Talk to Tony... Woof!"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-black/40 border border-brown/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a45c]"
              />
              <button
                type="submit"
                className="p-2 bg-periwinkle-dark hover:bg-periwinkle-hover text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Tony the Dog 🐾"
        className="flex items-center gap-2 bg-[#07130e] hover:bg-[#0a1e16] border-2 border-[#c9a45c] p-3.5 rounded-full shadow-[0_0_20px_rgba(201,164,92,0.35)] cursor-pointer text-xl relative group"
      >
        <span>🐾</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </motion.button>
    </div>
  );
}
