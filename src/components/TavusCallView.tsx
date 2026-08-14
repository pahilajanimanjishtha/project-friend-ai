/**
 * TavusCallView.tsx
 *
 * Self-contained Google Meet-style video call component powered by the Tavus
 * Conversational Video API and Daily WebRTC (via @daily-co/daily-js).
 *
 * Architecture:
 *  - Fetches a short-lived Daily room URL from our own server proxy (/api/conversations)
 *    so the Tavus API key is NEVER exposed to the browser.
 *  - Joins the Daily room; subscribes to track-started for Tavus avatar video/audio
 *    and local webcam tracks (PiP).
 *  - Listens to app-message events for conversation.utterance / utterance.streaming
 *    to drive real-time captions, transcript, and crisis detection.
 *  - On crisis keyword match, immediately interrupts Nova and forces the safety
 *    script via conversation.interrupt + conversation.echo, then shows the modal.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Daily, { type DailyCall } from '@daily-co/daily-js';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Captions,
  MessageSquareText,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Shield,
  X,
} from 'lucide-react';
import { CRISIS_HELPLINES, type Helpline } from '../lib/crisisSafetyFilter';

// ── Types ─────────────────────────────────────────────────────────────────────

type CallStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error';
type StartMode = 'video' | 'voice' | 'text';

interface TranscriptLine {
  id: string;
  role: 'you' | 'nova';
  text: string;
  timestamp: number;
}

interface Caption {
  role: 'you' | 'nova';
  text: string;
}

interface CrisisState {
  level: 'urgent' | 'support';
}

// ── Crisis phrase detection ───────────────────────────────────────────────────
// Client-side quick match for *immediate* UI action. The server also runs
// a more exhaustive check on every text message sent to /api/avatar-conversation.

const URGENT_PATTERNS: RegExp[] = [
  /\b(?:want|going|plan(?:ning)?|thinking)\s+to\s+(?:kill|hurt)\s+myself\b/i,
  /\b(?:end|take)\s+my\s+life\b/i,
  /\b(?:suicide|suicidal)\b/i,
  /\b(?:self[-\s]?harm|cut\s+myself|cutting\s+myself)\b/i,
  /\bi\s+(?:do\s*not|don't)\s+want\s+to\s+live\b/i,
  /\b(?:hang\s+myself|jump\s+off|overdose)\b/i,
];
const SUPPORT_PATTERNS: RegExp[] = [
  /\bdepressed\b/i,
  /\bhopeless\b/i,
  /\bcan'?t\s+go\s+on\b/i,
  /\bwant\s+to\s+disappear\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
];

function detectCrisisClient(text: string): CrisisState | null {
  if (URGENT_PATTERNS.some((re) => re.test(text)))
    return { level: 'urgent' };
  if (SUPPORT_PATTERNS.some((re) => re.test(text)))
    return { level: 'support' };
  return null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function createConversation(): Promise<{
  conversation_url: string;
  conversation_id: string;
}> {
  const r = await fetch('/api/conversations', { method: 'POST' });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(
      (e as { error?: string }).error ||
        `Failed to create conversation (HTTP ${r.status})`
    );
  }
  return r.json();
}

async function endConversation(id: string): Promise<void> {
  await fetch(`/api/conversations/${id}/end`, { method: 'POST' }).catch(
    () => {}
  );
}

// ── Start-mode options ────────────────────────────────────────────────────────

const START_MODES: {
  id: StartMode;
  label: string;
  detail: string;
  icon: React.ReactNode;
  primary?: boolean;
}[] = [
  {
    id: 'video',
    label: 'Face to face',
    detail: 'Camera + microphone',
    icon: <Camera size={20} />,
    primary: true,
  },
  {
    id: 'voice',
    label: 'Voice only',
    detail: 'Microphone, no camera',
    icon: <Mic size={20} />,
  },
  {
    id: 'text',
    label: 'Chat only',
    detail: 'No permissions needed',
    icon: <MessageSquareText size={20} />,
  },
];

export default function TavusCallView() {
  // ─── Call state ───────────────────────────────────────────────────────
  const [status, setStatus] = useState<CallStatus>('idle');
  const [mode, setMode] = useState<StartMode>('video');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState('');

  // ─── UI state ─────────────────────────────────────────────────────────
  const [caption, setCaption] = useState<Caption | null>(null);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [draft, setDraft] = useState('');
  const [crisis, setCrisis] = useState<CrisisState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // ─── Refs ─────────────────────────────────────────────────────────────
  const callRef = useRef<DailyCall | null>(null);
  const conversationIdRef = useRef('');
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const sessionIdRef = useRef('session_' + Math.random().toString(36).substring(2, 11));
  const hasTriggeredUrgentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────
  const isLive = status === 'connecting' || status === 'live';

  // ─── Timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(
        () => setElapsed((v) => v + 1),
        1000
      );
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  const formatElapsed = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ─── Auto-scroll transcript ───────────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => () => { cleanup(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add transcript line (deduplicates back-to-back identical lines) ──
  const addLine = useCallback((role: TranscriptLine['role'], text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === role && last.text === clean) return prev;
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text: clean,
          timestamp: Date.now(),
        },
      ];
    });
  }, []);

  // ─── Crisis trigger ───────────────────────────────────────────────────
  const triggerCrisis = useCallback(
    (text: string) => {
      const match = detectCrisisClient(text);
      if (!match) return;
      setCrisis(match);

      if (match.level === 'urgent' && !hasTriggeredUrgentRef.current) {
        hasTriggeredUrgentRef.current = true;
        const call = callRef.current;
        if (call) {
          // Interrupt whatever Nova is saying
          call.sendAppMessage(
            {
              message_type: 'conversation',
              event_type: 'conversation.interrupt',
              conversation_id: conversationIdRef.current,
              properties: {},
            },
            '*'
          );
          // Force Nova to speak the safety handoff script
          call.sendAppMessage(
            {
              message_type: 'conversation',
              event_type: 'conversation.echo',
              conversation_id: conversationIdRef.current,
              properties: {
                modality: 'text',
                text:
                  "I'm really glad you told me. I'm worried about your safety right now. " +
                  'Please contact local emergency services or a crisis line — I\'m showing you some numbers on screen. ' +
                  'Is there someone you trust who can be with you right now?',
                done: true,
              },
            },
            '*'
          );
        }
      }
    },
    []
  );

  // ─── Cleanup ──────────────────────────────────────────────────────────
  const cleanup = useCallback((reset = true) => {
    const id = conversationIdRef.current;
    conversationIdRef.current = '';
    if (id) void endConversation(id);

    const call = callRef.current;
    callRef.current = null;
    if (call) {
      void call
        .leave()
        .catch(() => {})
        .finally(() => void call.destroy().catch(() => {}));
    }

    [avatarVideoRef, audioRef, selfVideoRef].forEach((ref) => {
      if (ref.current) ref.current.srcObject = null;
    });

    if (reset) {
      setStatus('ended');
      setMicOn(false);
      setCamOn(false);
      setCaption(null);
      setCrisis(null);
      setElapsed(0);
      hasTriggeredUrgentRef.current = false;
    }
  }, []);

  // ─── Start call ───────────────────────────────────────────────────────
  const start = useCallback(
    async (chosen: StartMode) => {
      setError('');
      setCaption(null);
      setLines([]);
      setCrisis(null);
      hasTriggeredUrgentRef.current = false;
      setMode(chosen);
      setStatus('connecting');
      setElapsed(0);

      const wantAudio = chosen !== 'text';
      const wantVideo = chosen === 'video';

      try {
        const { conversation_url, conversation_id } =
          await createConversation();

        const call = Daily.createCallObject({
          audioSource: wantAudio,
          videoSource: wantVideo,
          subscribeToTracksAutomatically: true,
        });
        callRef.current = call;

        // ── Track routing ───────────────────────────────────────────────
        call.on('track-started', (event: any) => {
          const track = event?.track;
          if (!track) return;

          if (event.participant?.local) {
            // Local user camera → PiP
            if (track.kind === 'video' && selfVideoRef.current) {
              selfVideoRef.current.srcObject = new MediaStream([track]);
            }
            return;
          }

          // Remote (Tavus avatar) tracks
          if (track.kind === 'video' && avatarVideoRef.current) {
            avatarVideoRef.current.srcObject = new MediaStream([track]);
            setStatus('live');
          }
          if (track.kind === 'audio' && audioRef.current) {
            audioRef.current.srcObject = new MediaStream([track]);
          }
        });

        call.on('track-stopped', (event: any) => {
          if (
            event?.participant?.local &&
            event?.track?.kind === 'video' &&
            selfVideoRef.current
          ) {
            selfVideoRef.current.srcObject = null;
          }
        });

        // ── Tavus real-time transcript events ───────────────────────────
        call.on('app-message', (event: any) => {
          const data = event?.data;
          const type = data?.event_type;
          const role = data?.properties?.role;
          const text = String(
            data?.properties?.speech ||
              data?.properties?.text ||
              ''
          );

          if (type === 'conversation.utterance.streaming' && text) {
            const speaker = role === 'replica' ? 'nova' : 'you';
            setCaption({ role: speaker, text });
            if (speaker === 'you') triggerCrisis(text);
            return;
          }

          if (type === 'conversation.utterance' && text) {
            const speaker = role === 'replica' ? 'nova' : 'you';
            setCaption({ role: speaker, text });
            addLine(speaker, text);
            if (speaker === 'you') triggerCrisis(text);
          }
        });

        call.on('left-meeting', () => cleanup());

        conversationIdRef.current = conversation_id;
        await call.join({ url: conversation_url });
        setMicOn(wantAudio);
        setCamOn(wantVideo);
      } catch (reason: any) {
        cleanup(false);
        setStatus('error');
        setError(
          reason?.message || 'Could not start the conversation. Please try again.'
        );
      }
    },
    [addLine, cleanup, triggerCrisis]
  );

  // ─── Controls ─────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = !micOn;
    call.setLocalAudio(next);
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = !camOn;
    call.setLocalVideo(next);
    setCamOn(next);
  }, [camOn]);

  // ─── Text chat (for live video, voice, and text modes) ─────────────────
  const sendMessage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || isSending) return;
      addLine('you', text);
      triggerCrisis(text);
      setDraft('');
      setIsSending(true);

      const call = callRef.current;
      // If Tavus call is active, send app message so replica speaks it
      if (call && status === 'live') {
        try {
          call.sendAppMessage(
            {
              message_type: 'conversation',
              event_type: 'conversation.respond',
              conversation_id: conversationIdRef.current,
              properties: { text },
            },
            '*'
          );
        } catch (err) {
          console.warn('Tavus sendAppMessage error:', err);
        }
      }

      // If in text mode, or if call is not connected, get direct response from backend AI API
      if (!call || status !== 'live' || mode === 'text') {
        try {
          const res = await fetch('/api/avatar-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              message: text,
              settings: {
                language: 'English',
                personality: 'Warm, friendly, and engaging everyday AI companion',
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const replyText = data?.reply?.text;
            if (replyText) {
              addLine('nova', replyText);
              setCaption({ role: 'nova', text: replyText });
            }
          }
        } catch (apiErr) {
          console.error('Chat error:', apiErr);
        }
      }
      setIsSending(false);
    },
    [addLine, draft, triggerCrisis, isSending, status, mode]
  );

  // ─── Restart after ended ──────────────────────────────────────────────
  const restart = useCallback(() => {
    setStatus('idle');
    setLines([]);
    setCaption(null);
    setCrisis(null);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="tavus-shell">
      {/* ── Idle / Error / Ended screen ─────────────────────────────── */}
      {!isLive && (
        <WelcomeScreen
          status={status}
          error={error}
          onStart={start}
          onRestart={restart}
        />
      )}

      {/* ── Live meeting layout ──────────────────────────────────────── */}
      {isLive && (
        <>
          {/* Hidden audio element for avatar voice */}
          <audio ref={audioRef} autoPlay />

          {/* ── Header ────────────────────────────────────────────────── */}
          <header className="meet-header">
            <div className="meet-wordmark">
              <span className="meet-orb" />
              <span>
                friend<span>AI</span>
              </span>
            </div>

            <div className="meet-session">
              <span className="meet-pulse" />
              Private support room
              <span className="meet-live-dot">
                {status === 'live' ? `• ${formatElapsed(elapsed)}` : '• Connecting…'}
              </span>
            </div>

            <button
              className="meet-header-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle transcript"
            >
              <MessageSquareText size={16} />
              <span>Transcript</span>
            </button>
          </header>

          {/* ── Main grid ─────────────────────────────────────────────── */}
          <div
            className={`meet-grid${sidebarOpen ? ' meet-grid--sidebar' : ''}`}
          >
            {/* ── Video stage ─────────────────────────────────────────── */}
            <section className="meet-stage" aria-label="Nova video call">
              {/* Avatar video (full bleed) */}
              <video
                ref={avatarVideoRef}
                className="meet-avatar-video"
                autoPlay
                playsInline
                muted
              />

              {/* Connecting overlay */}
              {status === 'connecting' && (
                <div className="meet-connecting">
                  <span className="meet-spinner" />
                  Nova is joining your room…
                </div>
              )}

              {/* Stage top bar */}
              <div className="meet-stage-top">
                <div className="meet-name-badge">
                  <span className="meet-badge-dot" />
                  Nova
                  <span className="meet-badge-sub">
                    &nbsp;· AI companion
                  </span>
                </div>
                {status === 'live' && (
                  <div className="meet-live-badge">LIVE</div>
                )}
              </div>

              {/* PiP — user's local camera */}
              <div className="meet-pip">
                {camOn ? (
                  <video
                    ref={selfVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="meet-pip-video"
                  />
                ) : (
                  <div className="meet-pip-off">
                    <CameraOff size={18} />
                    <span>Camera off</span>
                  </div>
                )}
                <span className="meet-pip-label">You</span>
              </div>

              {/* Real-time captions */}
              {caption && status === 'live' && (
                <div
                  className="meet-caption"
                  role="status"
                  aria-live="polite"
                >
                  <Captions size={14} className="meet-caption-icon" />
                  <b>{caption.role === 'nova' ? 'Nova' : 'You'}</b>
                  <span>{caption.text}</span>
                </div>
              )}
            </section>

            {/* ── Chat sidebar ────────────────────────────────────────── */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  key="sidebar"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                  className="meet-sidebar"
                >
                  <div className="meet-sidebar-head">
                    <div>
                      <p className="meet-eyebrow">Live transcript</p>
                      <h2>Conversation</h2>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Close sidebar"
                      className="meet-icon-btn"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="meet-messages">
                    {lines.length === 0 ? (
                      <div className="meet-empty">
                        <MessageSquareText size={22} />
                        <p>
                          {mode === 'text'
                            ? 'Send a message when you are ready.'
                            : 'Speak naturally, or type below.'}
                        </p>
                      </div>
                    ) : (
                      lines.map((line) => (
                        <article
                          key={line.id}
                          className={`meet-msg meet-msg--${line.role}`}
                        >
                          <span>
                            {line.role === 'nova' ? 'Nova' : 'You'}
                          </span>
                          <p>{line.text}</p>
                        </article>
                      ))
                    )}
                    <div ref={transcriptEndRef} />
                  </div>

                  <form className="meet-composer" onSubmit={sendMessage}>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message to Nova…"
                      aria-label="Type a message to Nova"
                    />
                    <button
                      type="submit"
                      aria-label="Send message"
                      disabled={!draft.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* ── Control dock (Google Meet style) ────────────────────── */}
          <footer className="meet-dock">
            <button
              className={`meet-ctrl${micOn ? '' : ' meet-ctrl--off'}`}
              onClick={toggleMic}
              aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              <span>{micOn ? 'Mute' : 'Unmute'}</span>
            </button>

            <button
              className={`meet-ctrl${camOn ? '' : ' meet-ctrl--off'}`}
              onClick={toggleCam}
              aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {camOn ? <Camera size={18} /> : <CameraOff size={18} />}
              <span>{camOn ? 'Camera' : 'Camera off'}</span>
            </button>

            <button
              className="meet-ctrl meet-ctrl--end"
              onClick={() => cleanup()}
              aria-label="End call"
            >
              <PhoneOff size={18} />
              <span>End call</span>
            </button>
          </footer>
        </>
      )}

      {/* ── Crisis emergency modal ───────────────────────────────────── */}
      <AnimatePresence>
        {crisis && (
          <CrisisModal
            level={crisis.level}
            onClose={() => setCrisis(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Welcome / Idle / Error / Ended screen ────────────────────────────────────

function WelcomeScreen({
  status,
  error,
  onStart,
  onRestart,
}: {
  status: CallStatus;
  error: string;
  onStart: (m: StartMode) => void;
  onRestart: () => void;
}) {
  if (status === 'ended') {
    return (
      <div className="tavus-welcome">
        <div className="tavus-glow" />
        <p className="meet-eyebrow">Session ended</p>
        <h1>
          Take care
          <br />
          <em>of yourself.</em>
        </h1>
        <p className="tavus-copy">
          Your conversation with Nova has ended. You can start a new session whenever you are ready.
        </p>
        <button className="tavus-restart-btn" onClick={onRestart}>
          Start a new session
        </button>
        <p className="tavus-privacy">
          <Shield size={13} /> This conversation was private and not stored.
        </p>
      </div>
    );
  }

  return (
    <div className="tavus-welcome">
      <div className="tavus-glow" />
      <p className="meet-eyebrow">Private, supportive conversation</p>
      <h1>
        A calm place to talk,
        <br />
        <em>face to face.</em>
      </h1>
      <p className="tavus-copy">
        Nova listens without judgment, helps you slow down, and stays within
        non-clinical emotional support. Your camera and microphone stay in your control.
      </p>

      <div className="tavus-modes">
        {START_MODES.map((m) => (
          <button
            key={m.id}
            className={`tavus-mode-btn${m.primary ? ' tavus-mode-btn--primary' : ''}`}
            onClick={() => onStart(m.id)}
          >
            <span className="tavus-mode-icon">{m.icon}</span>
            <strong>{m.label}</strong>
            <small>{m.detail}</small>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-100 text-xs space-y-2 max-w-md mx-auto text-left my-4 backdrop-blur-md shadow-lg">
          <div className="font-bold font-mono text-[11px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚠️ {error.includes('out of conversational credits') ? 'Tavus Video Quota Reached' : error.includes('Invalid access token') ? 'Invalid Tavus API Key' : 'Connection Notice'}
          </div>
          <p className="leading-relaxed opacity-90">
            {error.includes('out of conversational credits')
              ? 'Your Tavus developer account has used all free conversational video minutes. Please top up or generate a fresh API key on app.tavus.io.'
              : error.includes('Invalid access token')
              ? 'The Tavus API Key in your .env file is invalid or expired. Please generate a fresh API key on app.tavus.io -> API Keys, paste it into TAVUS_API_KEY in .env, and restart dev server.'
              : error}
          </p>
        </div>
      )}

      <p className="tavus-privacy">
        <Shield size={13} /> You control your camera and microphone at all
        times. This is not emergency or clinical care.
      </p>
    </div>
  );
}

// ── Crisis Modal ──────────────────────────────────────────────────────────────

function CrisisModal({
  level,
  onClose,
}: {
  level: 'urgent' | 'support';
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="crisis-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
    >
      <motion.div
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="crisis-modal"
      >
        <button
          className="crisis-close"
          onClick={onClose}
          aria-label="Close safety notice"
        >
          <X size={18} />
        </button>

        <div className="crisis-icon-wrap">
          <AlertTriangle size={24} />
        </div>

        <p className="meet-eyebrow crisis-eyebrow">Your safety comes first</p>
        <h2 id="crisis-title">You don't have to carry this alone.</h2>

        <p className="crisis-body">
          {level === 'urgent'
            ? 'It sounds like you may be in immediate danger. Please contact emergency help now or reach someone you trust who can stay with you.'
            : 'I heard that things feel very heavy right now. You deserve real human support — especially if you feel unsafe.'}
        </p>

        <div className="crisis-helplines">
          {CRISIS_HELPLINES.map((line: Helpline) => (
            <a
              key={`${line.region}-${line.name}`}
              href={
                line.number.startsWith('http')
                  ? line.number
                  : `tel:${line.number.replace(/\s/g, '')}`
              }
              target={line.number.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="crisis-helpline"
            >
              <div>
                <p className="crisis-helpline-region">{line.region}</p>
                <p className="crisis-helpline-name">{line.name}</p>
                <p className="crisis-helpline-desc">{line.description}</p>
              </div>
              <span className="crisis-helpline-num">
                <Phone size={11} />
                {line.number}
              </span>
            </a>
          ))}
        </div>

        <p className="crisis-footnote">
          If you can, move to a safe space and contact a trusted person or
          emergency service now. This app cannot contact emergency services on
          your behalf.
        </p>

        <button className="crisis-return-btn" onClick={onClose}>
          I understand — return to call
        </button>
      </motion.div>
    </motion.div>
  );
}
