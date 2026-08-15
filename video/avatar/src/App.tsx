import { useCallback, useEffect, useRef, useState } from "react";
import Daily, { type DailyCall } from "@daily-co/daily-js";
import { createConversation, endConversation } from "./api";
import { detectCrisis } from "./safety";

type Status = "idle" | "connecting" | "live" | "error";
type Mode = "text" | "voice" | "video";
type Line = { id: string; role: "you" | "nova"; text: string; timestamp: number };
type CrisisState = { level: "urgent" | "support"; source: string } | null;

const START_MODES: { id: Mode; title: string; detail: string; icon: string }[] = [
  { id: "video", title: "Face to face", detail: "Camera + microphone", icon: "◉" },
  { id: "voice", title: "Voice only", detail: "Microphone only", icon: "◌" },
  { id: "text", title: "Chat first", detail: "No permissions needed", icon: "⌁" },
];

function Icon({ name }: { name: "mic" | "micOff" | "camera" | "cameraOff" | "phone" | "send" | "shield" | "close" | "message" }) {
  const paths: Record<string, React.ReactNode> = {
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8"/></>,
    micOff: <><path d="m4 4 16 16M9 9v2a3 3 0 0 0 4.4 2.6M15 10V6a3 3 0 0 0-5.3-1.9M6 11a6 6 0 0 0 9.2 5.1M12 17v4M8 21h8"/></>,
    camera: <><path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="m16 10 5-3v10l-5-3"/></>,
    cameraOff: <><path d="m3 3 18 18M16 10l5-3v10l-2.5-1.5M14 19H5a2 2 0 0 1-2-2V7c0-.5.2-1 .5-1.3M7 5h7a2 2 0 0 1 2 2v6"/></>,
    phone: <path d="M21 15.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 2.8 2 2 0 0 1 3.1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 8.7a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    shield: <><path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z"/><path d="M12 8v4M12 16h.01"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    message: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-4-.9L3 20l1.6-4A7.6 7.6 0 0 1 4 13.5 7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 8 5.5Z"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("video");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState<{ role: "you" | "nova"; text: string } | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [crisis, setCrisis] = useState<CrisisState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const callRef = useRef<DailyCall | null>(null);
  const conversationIdRef = useRef("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const hasTriggeredUrgentRef = useRef(false);

  useEffect(() => { transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" }); }, [lines]);
  useEffect(() => () => { cleanup(false); }, []);

  const addLine = useCallback((role: Line["role"], text: string) => {
    const clean = text.trim(); if (!clean) return;
    setLines(previous => {
      const last = previous[previous.length - 1];
      if (last?.role === role && last.text === clean) return previous;
      return [...previous, { id: `${Date.now()}-${Math.random()}`, role, text: clean, timestamp: Date.now() }];
    });
  }, []);

  const showCrisis = useCallback((text: string, source: string) => {
    const match = detectCrisis(text); if (!match) return;
    setCrisis({ level: match.level, source });
    if (match.level === "urgent" && !hasTriggeredUrgentRef.current) {
      hasTriggeredUrgentRef.current = true;
      const call = callRef.current;
      // Stop a normal reply and use Tavus itself to speak an immediate, safe handoff.
      call?.sendAppMessage({ message_type: "conversation", event_type: "conversation.interrupt", conversation_id: conversationIdRef.current, properties: {} }, "*");
      call?.sendAppMessage({ message_type: "conversation", event_type: "conversation.echo", conversation_id: conversationIdRef.current, properties: { modality: "text", text: "I’m really glad you told me. I’m concerned about your immediate safety. Please contact local emergency services now, or call or message someone you trust and stay with them if you can. The support options on your screen can help you reach a trained crisis counselor.", done: true } }, "*");
    }
  }, []);

  const cleanup = useCallback((reset = true) => {
    const id = conversationIdRef.current; conversationIdRef.current = ""; if (id) void endConversation(id);
    const call = callRef.current; callRef.current = null;
    if (call) void call.leave().catch(() => {}).finally(() => { void call.destroy().catch(() => {}); });
    [videoRef, audioRef, selfVideoRef].forEach(ref => { if (ref.current) ref.current.srcObject = null; });
    if (reset) { setStatus("idle"); setMicOn(false); setCamOn(false); setCaption(null); setCrisis(null); }
  }, []);

  const start = useCallback(async (chosen: Mode) => {
    setError(""); setCaption(null); setLines([]); setCrisis(null); hasTriggeredUrgentRef.current = false; setMode(chosen); setStatus("connecting");
    const wantAudio = chosen !== "text"; const wantVideo = chosen === "video";
    try {
      const { conversation_url, conversation_id } = await createConversation();
      const call = Daily.createCallObject({ audioSource: wantAudio, videoSource: wantVideo, subscribeToTracksAutomatically: true }); callRef.current = call;
      call.on("track-started", (event: any) => {
        const track = event?.track; if (!track) return;
        if (event.participant?.local) { if (track.kind === "video" && selfVideoRef.current) selfVideoRef.current.srcObject = new MediaStream([track]); return; }
        if (track.kind === "video" && videoRef.current) { videoRef.current.srcObject = new MediaStream([track]); setStatus("live"); }
        if (track.kind === "audio" && audioRef.current) audioRef.current.srcObject = new MediaStream([track]);
      });
      call.on("track-stopped", (event: any) => { if (event?.participant?.local && event?.track?.kind === "video" && selfVideoRef.current) selfVideoRef.current.srcObject = null; });
      call.on("app-message", (event: any) => {
        const data = event?.data; const type = data?.event_type; const role = data?.properties?.role; const text = String(data?.properties?.speech || data?.properties?.text || "");
        if (type === "conversation.utterance.streaming" && text) { setCaption({ role: role === "replica" ? "nova" : "you", text }); if (role !== "replica") showCrisis(text, "live caption"); return; }
        if (type !== "conversation.utterance" || !text) return;
        const speaker = role === "replica" ? "nova" : "you"; setCaption({ role: speaker, text }); addLine(speaker, text); if (speaker === "you") showCrisis(text, "live transcript");
      });
      call.on("left-meeting", () => cleanup());
      conversationIdRef.current = conversation_id; await call.join({ url: conversation_url }); setMicOn(wantAudio); setCamOn(wantVideo);
    } catch (reason: any) { cleanup(false); setStatus("error"); setError(reason?.message || "Could not start the Tavus conversation."); }
  }, [addLine, cleanup, showCrisis]);

  const toggleMic = useCallback(() => { const call = callRef.current; if (!call) return; const next = !micOn; call.setLocalAudio(next); setMicOn(next); }, [micOn]);
  const toggleCam = useCallback(() => { const call = callRef.current; if (!call) return; const next = !camOn; call.setLocalVideo(next); setCamOn(next); }, [camOn]);
  const send = useCallback((event: React.FormEvent) => { event.preventDefault(); const text = input.trim(); const call = callRef.current; if (!text || !call) return; addLine("you", text); showCrisis(text, "chat message"); call.sendAppMessage({ message_type: "conversation", event_type: "conversation.respond", conversation_id: conversationIdRef.current, properties: { text } }, "*"); setInput(""); }, [addLine, input, showCrisis]);
  const live = status === "connecting" || status === "live";

  return <div className="app-shell">
    <header className="meet-header"><a className="wordmark" href="/" aria-label="Friend AI home"><span className="wordmark-orbit"/><span>friend<span>AI</span></span></a><div className="session-name"><span className="presence"/>Private support room <span className="session-dot">•</span> {live ? "Live now" : "Ready to join"}</div><button className="header-action" onClick={() => setSidebarOpen(open => !open)} aria-label="Toggle chat transcript"><Icon name="message"/> <span>Chat</span></button></header>
    <main className="call-page">
      {!live ? <section className="welcome-card"><div className="welcome-glow"/><p className="eyebrow">Friendly Everyday AI Companion</p><h1>A warm space to talk,<br/><em>face to face.</em></h1><p className="welcome-copy">Nova listens, chats naturally, shares great ideas, and is always here as your everyday AI friend.</p><div className="join-options">{START_MODES.map(option => <button key={option.id} className={`join-option ${option.id === "video" ? "join-option--primary" : ""}`} onClick={() => start(option.id)}><span className="mode-icon">{option.icon}</span><strong>{option.title}</strong><small>{option.detail}</small></button>)}</div>{error && <p className="error-banner">{error}</p>}<p className="privacy-note"><Icon name="shield"/> You control your camera and microphone during the call.</p></section> : <div className={`meeting-grid ${sidebarOpen ? "meeting-grid--chat" : ""}`}>
        <section className="stage-card" aria-label="Nova video call"><video ref={videoRef} className="avatar-video" autoPlay playsInline muted/><audio ref={audioRef} autoPlay/>{status === "connecting" && <div className="connecting"><span className="spinner"/>Nova is joining your room…</div>}<div className="stage-top"><div className="avatar-name"><span className="avatar-dot"/>Nova <span>• AI companion</span></div><div className="call-duration">LIVE</div></div>{camOn && <div className="self-view"><video ref={selfVideoRef} autoPlay playsInline muted/><span>You</span></div>}{caption && <div className="caption-box" role="status" aria-live="polite"><b>{caption.role === "nova" ? "Nova" : "You"}</b><span>{caption.text}</span></div>}</section>
        {sidebarOpen && <aside className="chat-panel"><div className="panel-head"><div><p className="eyebrow">Live transcript</p><h2>Conversation</h2></div><button onClick={() => setSidebarOpen(false)} aria-label="Close chat panel"><Icon name="close"/></button></div><div className="messages" ref={transcriptRef}>{lines.length ? lines.map(line => <article key={line.id} className={`message message--${line.role}`}><span>{line.role === "nova" ? "Nova" : "You"}</span><p>{line.text}</p></article>) : <div className="empty-chat"><Icon name="message"/><p>{mode === "text" ? "Send a message when you’re ready." : "Speak naturally, or send a message below."}</p></div>}</div><form className="chat-composer" onSubmit={send}><input value={input} onChange={event => setInput(event.target.value)} placeholder="Type a message…" aria-label="Type a message to Nova"/><button type="submit" aria-label="Send message"><Icon name="send"/></button></form></aside>}
      </div>}
    </main>
    {live && <footer className="control-dock"><button className={`control ${micOn ? "" : "control--off"}`} onClick={toggleMic} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}><Icon name={micOn ? "mic" : "micOff"}/><span>{micOn ? "Mute" : "Unmute"}</span></button><button className={`control ${camOn ? "" : "control--off"}`} onClick={toggleCam} aria-label={camOn ? "Turn camera off" : "Turn camera on"}><Icon name={camOn ? "camera" : "cameraOff"}/><span>{camOn ? "Camera" : "Camera off"}</span></button><button className="control control--end" onClick={() => cleanup()} aria-label="End call"><Icon name="phone"/><span>End call</span></button></footer>}
    {crisis && <div className="safety-overlay" role="alertdialog" aria-modal="true" aria-labelledby="safety-title"><section className="safety-modal"><button className="safety-close" onClick={() => setCrisis(null)} aria-label="Close safety notice"><Icon name="close"/></button><div className="safety-icon"><Icon name="shield"/></div><p className="eyebrow">Your safety comes first</p><h2 id="safety-title">You don’t have to carry this alone.</h2><p>{crisis.level === "urgent" ? "It sounds like you may be in immediate danger. Please contact emergency help now or reach someone you trust who can stay with you." : "I heard that things feel very heavy. You deserve support from a real person, especially if you feel unsafe."}</p><div className="help-grid"><a href="tel:112"><strong>112</strong><span>India emergency</span></a><a href="tel:9152987821"><strong>iCALL</strong><span>+91 9152987821</span></a><a href="https://findahelpline.com" target="_blank" rel="noreferrer"><strong>Find support</strong><span>Local crisis lines</span></a></div><p className="safety-footnote">If you can, move away from anything you could use to hurt yourself and contact a trusted person now. This app cannot contact emergency services for you.</p><button className="safety-button" onClick={() => setCrisis(null)}>I understand — return to call</button></section></div>}
  </div>;
}
