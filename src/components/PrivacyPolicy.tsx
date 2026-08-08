import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Lock, Eye, AlertTriangle, Check, Copy, ExternalLink, 
  MessageSquare, HardDrive, Globe, Mail, Users, FileText, HeartHandshake, Shield
} from 'lucide-react';

interface PrivacyPolicyProps {
  isLightMode?: boolean;
  setView?: (view: any) => void;
}

export default function PrivacyPolicy({ isLightMode = false, setView }: PrivacyPolicyProps) {
  const [copied, setCopied] = useState(false);

  const fullPolicyText = `# Privacy Policy — Project Friend AI

Last updated: July 29, 2026. This draft is based on a technical review of the app's actual code.

## 1. What this app is
Project Friend AI is a supportive chat companion. It is not a licensed therapist, doctor, or crisis service, and no claim in this app should be read as clinical or medical advice or oversight. If you're in crisis, see Section 7 for real hotline numbers.

## 2. What we collect and why

### Chat messages
When you chat with a companion, your message is sent to Google's Gemini API to generate a reply. Google's own terms govern how they process that request; we don't control that separately.

Your side of the conversation is also checked against a fixed list of keywords (e.g. terms related to self-harm or suicide). This is a simple keyword match, not an AI risk score or clinical assessment — if it matches, you're shown crisis hotline information. (No "alarm score," no differential privacy, no clinical review board evaluates your messages — despite language elsewhere describing one. That doesn't exist.)

### Chat history and journal entries
Stored locally in your browser (localStorage), not on our servers. (Currently stored as plain text, not encrypted — despite "AES-256 vault" language elsewhere in the app. If you clear your browser data, it's gone; it also means anyone with access to your unlocked device/browser profile can read it.)

### The public "Solace Wall"
Messages you post there are visible to every user of the app, along with whatever location text you type in (default "Anonymous" if left blank). They're held in server memory, capped at 50 entries, and cleared whenever the server restarts — not written to a permanent database.

### Waitlist / investor / feedback form
If you submit your name, email, message, or a pledge amount, it's stored and viewable by anyone with admin access.

### Optional Google Workspace connection
If you choose to connect your Google account (a separate, explicit sign-in step), the app can request permissions to your own Google account, only for matching features (Drive, Gmail, Tasks, Calendar, Sheets, Contacts, Docs/Slides, Meet, Classroom).

We only see data your Google account authorizes for the session you're using it; we don't separately copy or store your Gmail/Drive/Calendar/Contacts data on our own servers. You can revoke this access anytime in your Google Account's security settings.

### Administrative access
There is an admin panel. It can view: aggregate usage counters, waitlist submissions, and short-term in-memory request logs (which may include the content of requests made while using the app, retained only until the server restarts).

## 3. What we don't do
- We don't sell your data.
- We don't run advertising trackers.
- We don't have the "differential privacy," "multi-agent trusted monitoring," or "clinical advisory board" infrastructure described elsewhere in the app.

## 4. Third parties involved
- Google Gemini API — processes chat message content to generate responses.
- Firebase / Google Cloud — hosts the Solace Wall data and (if used) authentication.
- Google OAuth — only if you opt into the Workspace connection above.

## 5. Your choices
- Clear your browser's site data to delete local chat history and journals.
- Don't post anything to the Solace Wall you don't want publicly visible.
- Revoke Google account access anytime via myaccount.google.com/permissions.

## 6. Children
This app is not directed at, and should not be used by, anyone under 13.

## 7. If you're in crisis right now
This app cannot help in an emergency. Please contact:
- USA & Canada: Call or text 988
- UK: Samaritans 116 123
- India: Vandrevala Foundation +91-9152987821 / AASRA +91-9820466726
- Or your local emergency number.

## 8. Contact
Questions about this policy: support@projectfriend.ai`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPolicyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const workspaceScopes = [
    { scope: 'Drive', feature: 'Save/export journal entries and files to your Drive' },
    { scope: 'Gmail (read)', feature: 'View your inbox within the app' },
    { scope: 'Gmail (send)', feature: 'Send "self-reflection" emails to yourself' },
    { scope: 'Tasks', feature: 'Create/view reminders' },
    { scope: 'Calendar', feature: 'Create/view wellness check-in events' },
    { scope: 'Sheets', feature: 'Export mood logs to a spreadsheet' },
    { scope: 'Contacts', feature: 'View your contacts' },
    { scope: 'Docs / Slides', feature: 'Create exported documents/presentations' },
    { scope: 'Meet', feature: 'Create meeting links' },
    { scope: 'Classroom', feature: 'View your courses' },
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto transition-colors duration-300 ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-8 border-2 mb-8 relative overflow-hidden shadow-xl ${
          isLightMode 
            ? 'bg-gradient-to-br from-amber-50 via-stone-50 to-sky-50 border-[#c9a45c]/30' 
            : 'bg-gradient-to-br from-[#0c1322] via-[#09182a] to-[#040914] border-[#c9a45c]/30 shadow-[0_0_50px_rgba(201,164,92,0.1)]'
        }`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-[#c9a45c]" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-[#c9a45c]/20 text-[#c9a45c] border border-[#c9a45c]/40 font-bold">
                Official Document &middot; Transparency Brief
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                Code Review Verified
              </span>
            </div>
            
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                isLightMode 
                  ? 'bg-white border-stone-300 hover:border-[#c9a45c] text-slate-700' 
                  : 'bg-white/5 border-white/10 hover:border-[#c9a45c] text-slate-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#c9a45c]" />}
              <span>{copied ? 'Copied Privacy Policy!' : 'Copy Policy Text'}</span>
            </button>
          </div>

          <h1 className="font-serif italic text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#c9a45c]">
            Privacy Policy — Project Friend AI
          </h1>
          <p className="font-mono text-xs text-slate-400">
            Last updated: July 29, 2026 &middot; Based on a technical code review of actual application data handling.
          </p>
        </div>
      </motion.div>

      {/* Main Sections */}
      <div className="space-y-8">
        
        {/* Section 1: What this app is */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a45c]/10 border border-[#c9a45c]/30 flex items-center justify-center text-[#c9a45c] font-bold font-mono text-sm">
              1
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              1. What this app is
            </h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            Project Friend AI is a supportive chat companion. <strong>It is not a licensed therapist, doctor, or crisis service, and no claim in this app should be read as clinical or medical advice or oversight.</strong> If you're in crisis, see Section 7 for real hotline numbers.
          </p>
        </motion.section>

        {/* Section 2: What we collect and why */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a45c]/10 border border-[#c9a45c]/30 flex items-center justify-center text-[#c9a45c] font-bold font-mono text-sm">
              2
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              2. What we collect and why
            </h2>
          </div>

          {/* Sub-item: Chat messages */}
          <div className="space-y-2 border-l-2 border-sky-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-sky-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat messages
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              When you chat with a companion, your message is sent to <strong>Google's Gemini API</strong> to generate a reply. Google's own terms govern how they process that request; we don't control that separately.
            </p>
            <p className="text-sm leading-relaxed opacity-90">
              Your side of the conversation is also checked against a fixed list of keywords (e.g. terms related to self-harm or suicide). This is a simple keyword match, not an AI risk score or clinical assessment — if it matches, you're shown crisis hotline information.
            </p>
            <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Note on Technical Reality:</strong> No "alarm score," no differential privacy, no clinical review board evaluates your messages — despite promotional language elsewhere describing one. That does not exist in the codebase.
              </span>
            </div>
          </div>

          {/* Sub-item: Chat history and journal entries */}
          <div className="space-y-2 border-l-2 border-emerald-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Chat history and journal entries
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              Stored locally in your browser (<code>localStorage</code>), not on our servers.
            </p>
            <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Storage Notice:</strong> Currently stored as plain text, not encrypted — despite "AES-256 vault" language elsewhere in the app. If you clear your browser data, it's gone; it also means anyone with access to your unlocked device/browser profile can read it.
              </span>
            </div>
          </div>

          {/* Sub-item: The public Solace Wall */}
          <div className="space-y-2 border-l-2 border-purple-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-purple-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              The public "Solace Wall"
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              Messages you post there are <strong>visible to every user of the app</strong>, along with whatever location text you type in (default "Anonymous" if left blank). They're held in server memory, capped at 50 entries, and cleared whenever the server restarts — not written to a permanent database.
            </p>
          </div>

          {/* Sub-item: Waitlist / investor / feedback form */}
          <div className="space-y-2 border-l-2 border-amber-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Waitlist / investor / feedback form
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              If you submit your name, email, message, or a pledge amount, it's stored and viewable by anyone with admin access.
            </p>
          </div>

          {/* Sub-item: Optional Google Workspace connection */}
          <div className="space-y-3 border-l-2 border-blue-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-blue-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Optional Google Workspace connection
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              If you choose to connect your Google account (a separate, explicit sign-in step), the app can request the following permissions <strong>to your own Google account</strong>, only for the matching feature:
            </p>

            <div className="overflow-x-auto my-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isLightMode ? 'border-stone-200 bg-stone-100' : 'border-white/10 bg-white/5'}`}>
                    <th className="p-2.5 font-mono uppercase text-[#c9a45c] font-bold">Scope</th>
                    <th className="p-2.5 font-mono uppercase text-slate-400 font-bold">Feature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-mono">
                  {workspaceScopes.map((row, i) => (
                    <tr key={i} className={isLightMode ? 'hover:bg-amber-50/30' : 'hover:bg-white/5'}>
                      <td className="p-2.5 font-bold text-sky-400">{row.scope}</td>
                      <td className="p-2.5 opacity-90">{row.feature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm leading-relaxed opacity-90">
              We only see data your Google account authorizes for the session you're using it; we don't separately copy or store your Gmail/Drive/Calendar/Contacts data on our own servers. You can revoke this access anytime in your Google Account's{' '}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noreferrer"
                className="text-[#c9a45c] underline hover:text-amber-300 inline-flex items-center gap-1"
              >
                security settings <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
          </div>

          {/* Sub-item: Administrative access */}
          <div className="space-y-2 border-l-2 border-rose-500/30 pl-4 py-1">
            <h3 className="font-mono text-sm font-bold text-rose-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Administrative access
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              There is an admin panel. It can view: aggregate usage counters, waitlist submissions, and short-term in-memory request logs (which may include the content of requests made while using the app, retained only until the server restarts).
            </p>
            <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Note on Admin Tools:</strong> The panel's "SQL Playground" and "BigQuery Studio" tabs run against hardcoded sample data, not real user records.
              </span>
            </div>
          </div>
        </motion.section>

        {/* Section 3: What we don't do */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
              3
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              3. What we don't do
            </h2>
          </div>
          <ul className="space-y-2 text-sm opacity-90 list-disc pl-6 font-sans">
            <li>We don't sell your data.</li>
            <li>We don't run advertising trackers.</li>
            <li>We don't have the "differential privacy," "multi-agent trusted monitoring," or "clinical advisory board" infrastructure described elsewhere in the app.</li>
          </ul>
        </motion.section>

        {/* Section 4: Third parties involved */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
              4
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              4. Third parties involved
            </h2>
          </div>
          <ul className="space-y-2 text-sm opacity-90 list-disc pl-6">
            <li><strong>Google Gemini API</strong> — processes chat message content to generate responses.</li>
            <li><strong>Firebase / Google Cloud</strong> — hosts the Solace Wall data and (if used) authentication.</li>
            <li><strong>Google OAuth</strong> — only if you opt into the Workspace connection above.</li>
          </ul>
        </motion.section>

        {/* Section 5: Your choices */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono text-sm">
              5
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              5. Your choices
            </h2>
          </div>
          <ul className="space-y-2 text-sm opacity-90 list-disc pl-6">
            <li>Clear your browser's site data to delete local chat history and journals.</li>
            <li>Don't post anything to the Solace Wall you don't want publicly visible.</li>
            <li>
              Revoke Google account access anytime via{' '}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noreferrer"
                className="text-[#c9a45c] underline hover:text-amber-300 inline-flex items-center gap-1 font-mono text-xs"
              >
                myaccount.google.com/permissions <ExternalLink className="w-3 h-3" />
              </a>.
            </li>
          </ul>
        </motion.section>

        {/* Section 6: Children */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              6
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              6. Children
            </h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            This app is not directed at, and should not be used by, anyone under 13.
          </p>
        </motion.section>

        {/* Section 7: Crisis Hotline Information */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl font-bold tracking-wide uppercase">
              7. If you're in crisis right now
            </h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90 mb-3">
            This app cannot help in an emergency. Please contact:
          </p>
          <ul className="pl-4 space-y-1.5 font-mono text-xs text-rose-300">
            <li>&bull; <strong>USA &amp; Canada:</strong> Call or text <strong>988</strong></li>
            <li>&bull; <strong>UK:</strong> Samaritans <strong>116 123</strong></li>
            <li>&bull; <strong>India:</strong> Vandrevala Foundation <strong>+91-9152987821</strong> / AASRA <strong>+91-9820466726</strong></li>
            <li>&bull; Or your local emergency number.</li>
          </ul>
        </motion.section>

        {/* Section 8: Contact */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border ${
            isLightMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a45c]/10 border border-[#c9a45c]/30 flex items-center justify-center text-[#c9a45c] font-bold font-mono text-sm">
              8
            </div>
            <h2 className="font-serif text-xl font-bold text-[#c9a45c] tracking-wide">
              8. Contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            Questions about this policy:{' '}
            <a href="mailto:support@projectfriend.ai" className="text-[#c9a45c] font-mono hover:underline">
              support@projectfriend.ai
            </a>
          </p>
        </motion.section>

      </div>

      {/* Footer Navigation Back */}
      {setView && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setView('home')}
            className="px-6 py-3 rounded-2xl bg-[#c9a45c] hover:bg-[#c9a45c]/90 text-stone-950 font-serif font-bold uppercase text-xs tracking-widest shadow-lg transition-transform hover:scale-105 cursor-pointer"
          >
             Return to Sanctuary Home
          </button>
        </div>
      )}
    </div>
  );
}
