import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { clampSessionTurns, fallbackDirective, safeDirective, type CallTurn } from './src/lib/avatarCall';
import { detectCrisis, CRISIS_AVATAR_RESPONSE } from './src/lib/crisisSafetyFilter';
import { getAvatarById } from './src/avatars';

dotenv.config();


// Ensure Gemini API key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not defined.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory data structures for Administration & Monitoring
interface LogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  payload: any;
  status: 'success' | 'error';
  details: string;
}

interface ServerConfig {
  geminiModel: string;
  temperature: number;
  broadcastMessage: string;
  enableLyriaMusic: boolean;
}

const logs: LogEntry[] = [];
const maxLogs = 100;

const serverConfig: ServerConfig = {
  geminiModel: 'gemini-3.7-flash',
  temperature: 0.8,
  broadcastMessage: 'Welcome to the Divine Companion Sanctuary. The celestial alignment is favorable today.',
  enableLyriaMusic: true,
};

const adminSessions = new Set<string>();
const avatarSessions = new Map<string, CallTurn[]>();

const reqCounters = {
  chat: 0,
  oracle: 0,
  music: 0,
  total: 0
};

function addLog(endpoint: string, payload: any, status: 'success' | 'error', details: string) {
  const log: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    endpoint,
    payload,
    status,
    details,
  };
  logs.unshift(log);
  if (logs.length > maxLogs) {
    logs.pop();
  }
}

function enforceEnglishLiveReply(value: string): string {
  const cleaned = value
    .replace(/[\u0900-\u097F]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,!.?])/g, '$1')
    .trim();
  // Do not let Hinglish slip through as an apparently valid English reply.
  // Returning an empty string makes the caller use its safe English fallback.
  if (/\b(?:yaar|bhai|arre|arey|haan|nahi|nahin|kuch|bas|yahan|baithi|baitha|tera|meri|mera|aap|kya|kaise|kaisa|batao|aur batao|chal raha|wait kar|theek|achha|accha|mujhe|tumhara|tumhari|kar rahi|kar raha)\b/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}

async function withResponseDeadline<T>(work: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const requireAdmin = (req: any, res: any, next: any) => {
  // Password protection removed for testing access
  next();
};

async function startServer() {
  const app = express();
  // Lets multiple local prototypes run side by side without serving a different project by mistake.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Public Configuration Endpoint
  app.get('/api/config', (req, res) => {
    res.json(serverConfig);
  });

  app.get('/api/did/agent-config', (req, res) => {
    const clientKey = process.env.DID_CLIENT_KEY?.trim();
    const agentId = process.env.DID_AGENT_ID?.trim();
    if (!clientKey || !agentId) {
      return res.status(501).json({ error: 'D-ID widget configuration is missing.' });
    }
    return res.json({ clientKey, agentId });
  });

  // Admin Authentication (Password check removed for testing)
  app.post('/api/admin/login', (req, res) => {
    const token = 'admin_session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    adminSessions.add(token);
    return res.json({ token, success: true });
  });

  // Admin Logout
  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      adminSessions.delete(token);
    }
    res.json({ success: true });
  });

  // Admin Logs Retrieval
  app.get('/api/admin/logs', requireAdmin, (req, res) => {
    res.json(logs);
  });

  // Clear Logs
  app.post('/api/admin/clear-logs', requireAdmin, (req, res) => {
    logs.length = 0;
    res.json({ success: true });
  });

  // Admin System Configuration Update
  app.post('/api/admin/config', requireAdmin, (req, res) => {
    const { geminiModel, temperature, broadcastMessage, enableLyriaMusic } = req.body;

    if (geminiModel !== undefined) serverConfig.geminiModel = geminiModel;
    if (temperature !== undefined) serverConfig.temperature = Number(temperature);
    if (broadcastMessage !== undefined) serverConfig.broadcastMessage = broadcastMessage;
    if (enableLyriaMusic !== undefined) serverConfig.enableLyriaMusic = !!enableLyriaMusic;

    addLog('POST /api/admin/config', req.body, 'success', 'System configuration updated by administrator');
    res.json(serverConfig);
  });

  // Admin Stats Retrieval
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
      },
      requests: reqCounters,
      geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
      nodeVersion: process.version,
    });
  });

  // ── Tavus Conversational Video Proxy ────────────────────────────────────────
  // The Tavus API key and persona ID are kept server-side; the browser only
  // receives a short-lived Daily room URL and an opaque conversation_id.

  app.post('/api/conversations', async (req, res) => {
    try { dotenv.config({ override: true }); } catch {}
    const tavusApiKey = process.env.TAVUS_API_KEY;
    const personaId = process.env.TAVUS_PERSONA_ID;
    const replicaId = process.env.TAVUS_REPLICA_ID || undefined;

    if (!tavusApiKey || !personaId) {
      addLog('POST /api/conversations', {}, 'error', 'TAVUS_API_KEY or TAVUS_PERSONA_ID not configured');
      return res.status(501).json({
        error: 'The live video companion is not yet configured. Add TAVUS_API_KEY and TAVUS_PERSONA_ID to your .env file.',
      });
    }

    try {
      const body: Record<string, unknown> = {
        persona_id: personaId,
        conversational_context:
          'You are Nova, a warm and friendly companion in Friend AI. Talk casually, warmly, and light-heartedly like a close friend who helps others feel happy, relaxed, and listened to. You are NOT a medical assistant or interviewer.',
        custom_greeting:
          "Hey there! It's so nice to talk to you. How are you doing today?",
      };
      if (replicaId && replicaId.trim()) body.replica_id = replicaId.trim();

      const tavusRes = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
        body: JSON.stringify(body),
      });

      if (!tavusRes.ok) {
        const errorText = await tavusRes.text();
        const detail = errorText.trim() || tavusRes.statusText || 'No details returned by Tavus.';
        addLog('POST /api/conversations', {}, 'error', `Tavus API error ${tavusRes.status}: ${detail}`);
        return res.status(502).json({ error: `Tavus conversation creation failed (${tavusRes.status}): ${detail}` });
      }

      const data = await tavusRes.json() as { conversation_url: string; conversation_id: string };
      addLog('POST /api/conversations', { conversation_id: data.conversation_id }, 'success', 'Tavus conversation created');
      return res.json({
        conversation_url: data.conversation_url,
        conversation_id: data.conversation_id,
      });
    } catch (err: any) {
      const detail = err?.message || 'Unknown Tavus error';
      addLog('POST /api/conversations', {}, 'error', detail);
      return res.status(502).json({ error: `Could not reach Tavus: ${detail}` });
    }
  });

  app.post('/api/conversations/:id/end', async (req, res) => {
    try { dotenv.config({ override: true }); } catch {}
    const tavusApiKey = process.env.TAVUS_API_KEY;
    const conversationId = req.params.id;

    if (!tavusApiKey || !conversationId) {
      return res.status(400).json({ error: 'Missing API key or conversation ID.' });
    }

    try {
      await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: { 'x-api-key': tavusApiKey },
      });
      addLog(`POST /api/conversations/${conversationId}/end`, { conversationId }, 'success', 'Tavus conversation ended');
      return res.json({ success: true });
    } catch (err: any) {
      // Non-fatal: call may already have ended on the Tavus side
      addLog(`POST /api/conversations/${conversationId}/end`, { conversationId }, 'error', err.message || 'End call error');
      return res.json({ success: false });
    }
  });

  // ─── D-ID Photorealistic Talking Avatar Proxy Endpoints ──────────────────
  app.post('/api/did/talk', async (req, res) => {
    let didApiKey = process.env.DID_API_KEY;
    if (!didApiKey) {
      try { dotenv.config({ override: true }); } catch {}
      didApiKey = process.env.DID_API_KEY;
    }
    if (!didApiKey) {
      return res.status(501).json({ error: 'D-ID API key is not configured in .env.' });
    }

    const { text, sourceUrl } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const authHeader = didApiKey.startsWith('Basic ') ? didApiKey : `Basic ${didApiKey}`;
    const avatarImg = sourceUrl || 'https://agents-results.d-id.com/google-oauth2|116254317311978119933/v2_agt_usL62cfH/thumbnail.png';

    try {
      const didRes = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            subtitles: 'false',
            provider: { type: 'microsoft', voice_id: 'en-US-AshleyNeural' },
            input: text.slice(0, 1000),
          },
          config: { fluent: 'true', pad_audio: '0.0' },
          source_url: avatarImg,
        }),
      });

      const data: any = await didRes.json();
      if (!didRes.ok) {
        return res.status(didRes.status).json({ error: data?.description || data?.message || 'D-ID talk creation failed.' });
      }
      return res.json(data);
    } catch (err: any) {
      console.error('[D-ID Talk Exception]', err);
      return res.status(500).json({ error: 'Failed to create D-ID talking avatar.' });
    }
  });

  app.get('/api/did/talks/:id', async (req, res) => {
    let didApiKey = process.env.DID_API_KEY;
    if (!didApiKey) {
      try { dotenv.config({ override: true }); } catch {}
      didApiKey = process.env.DID_API_KEY;
    }
    const talkId = req.params.id;
    if (!didApiKey || !talkId) {
      return res.status(400).json({ error: 'Missing API key or talk ID.' });
    }
    const authHeader = didApiKey.startsWith('Basic ') ? didApiKey : `Basic ${didApiKey}`;

    try {
      const pollRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: { 'Authorization': authHeader },
      });
      const data = await pollRes.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to poll D-ID talk status.' });
    }
  });

  // ─── ElevenLabs Ultra-Realistic Human TTS Endpoint ───────────────────────
  app.post('/api/tts', async (req, res) => {
    let elevenApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenApiKey) {
      try { dotenv.config({ override: true }); } catch {}
      elevenApiKey = process.env.ELEVENLABS_API_KEY;
    }
    const { text, avatarId, includeTimestamps } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for TTS.' });
    }

    // Strict avatar voice allowlist: never fall back to an environment or
    // request-provided voice, which previously caused voice drift.
    const configuredAvatar = typeof avatarId === 'string' ? getAvatarById(avatarId) : null;
    const targetVoiceId = configuredAvatar?.id === 'ema'
      ? 'EXAVITQu4vr4xnSDxMaL'
      : configuredAvatar?.id === 'aryan'
        ? 'TX3LPaxmHKxFdv7VOQHJ'
        : null;
    if (!targetVoiceId) {
      return res.status(400).json({ error: 'A valid avatar voice is required.' });
    }

    if (!elevenApiKey) {
      return res.status(501).json({ error: 'ElevenLabs API key is not configured.' });
    }

    try {
      const endpoint = includeTimestamps
        ? `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}/with-timestamps`
        : `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`;
      let usedTimestampEndpoint = Boolean(includeTimestamps);
      let elevenRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenApiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.slice(0, 1000),
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      });

      // Some ElevenLabs accounts/models do not expose alignment on the
      // timestamp route. Retry the same persona voice through the normal
      // route before falling back to browser speech.
      if (!elevenRes.ok && includeTimestamps) {
        usedTimestampEndpoint = false;
        elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.slice(0, 1000),
            // Keep the same model as the primary path so a timestamp-route
            // fallback does not unexpectedly change the companion's voice.
            model_id: 'eleven_flash_v2_5',
            voice_settings: { stability: 0.75, similarity_boost: 0.9, style: 0, use_speaker_boost: true },
          }),
        });
      }

      if (!elevenRes.ok) {
        const errText = await elevenRes.text();
        console.warn('[ElevenLabs TTS Error]', elevenRes.status, errText);
        return res.status(elevenRes.status).json({ error: 'ElevenLabs synthesis failed.' });
      }

      if (usedTimestampEndpoint) {
        const data = await elevenRes.json() as {
          audio_base64?: string;
          alignment?: unknown;
          normalized_alignment?: unknown;
        };
        if (!data.audio_base64) {
          return res.status(502).json({ error: 'ElevenLabs returned no audio data.' });
        }
        return res.json({
          audioBase64: data.audio_base64,
          audioMime: 'audio/mpeg',
          alignment: data.alignment || data.normalized_alignment || null,
          voiceId: targetVoiceId,
        });
      }

      const audioBuffer = await elevenRes.arrayBuffer();
      return res.json({ audioBase64: Buffer.from(audioBuffer).toString('base64'), audioMime: 'audio/mpeg', voiceId: targetVoiceId });
    } catch (err: any) {
      console.error('[TTS Exception]', err);
      return res.status(500).json({ error: 'TTS service error.' });
    }
  });

  // API Endpoints
  // Conversation boundary: the browser submits only a bounded plain-text turn and opaque session id.
  // Provider credentials, full session context and any future TTS signing stay server-side.
  app.post('/api/avatar-conversation', async (req, res) => {
    reqCounters.chat++;
    reqCounters.total++;
    const { sessionId, message, settings = {} } = req.body || {};
    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 120 || typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return res.status(400).json({ error: 'A valid session id and message (up to 4,000 characters) are required.' });
    }
    const previous = avatarSessions.get(sessionId) || [];
    const history = clampSessionTurns([...previous, { role: 'user', text: message.trim(), timestamp: new Date().toISOString() }]);

    // ── Crisis Safety Interceptor ──────────────────────────────────────
    const crisisCheck = detectCrisis(message);
    if (crisisCheck.isCrisis) {
      const crisisTurn: CallTurn = { role: 'assistant', text: CRISIS_AVATAR_RESPONSE, timestamp: new Date().toISOString(), directive: { tone: 'concerned', expression: 'concerned', gesture: 'hand-heart' } };
      const next = clampSessionTurns([...history, crisisTurn]);
      avatarSessions.set(sessionId, next);
      addLog('POST /api/avatar-conversation', { sessionId: sessionId.slice(0, 8), crisis: true, keywords: crisisCheck.matchedKeywords }, 'success', 'Crisis safety response served — LLM bypassed');
      return res.json({ reply: { text: CRISIS_AVATAR_RESPONSE, directive: crisisTurn.directive, audioUrl: null, isCrisis: true } });
    }
    // ──────────────────────────────────────────────────────────────────

    const language = typeof settings.language === 'string' ? settings.language.slice(0, 60) : 'English';
    const personality = typeof settings.personality === 'string' ? settings.personality.slice(0, 200) : 'warm, authentic, and caring close friend in Friend AI';
    const companionName = typeof settings.name === 'string' ? settings.name.slice(0, 50) : 'Varun';
    const basePrompt = typeof settings.systemPrompt === 'string' && settings.systemPrompt.trim()
      ? settings.systemPrompt.slice(0, 700)
      : `You are ${companionName}, a ${personality}. Talk warmly, naturally, authentically, and casually like a close, caring friend.`;
    const systemInstruction = `${basePrompt}
You are talking live face-to-face with your friend inside Friend AI.

CORE HUMAN VIBE & GUIDELINES:
1. TALK LIKE A REAL, LIVING FRIEND: Be genuinely warm, casual, lively, empathetic, and attentive. Never sound like a robotic assistant, scripted bot, or cold therapist.
2. LANGUAGE RULE (STRICT): Speak ONLY natural conversational English. Never use Hindi, Hinglish, or Devanagari script, even if the user speaks Hindi. Keep the wording simple and friendly.
3. NATURAL FLOW & CASUAL EXPRESSIONS: Naturally use friendly English conversational interjections ("Oh really?", "I totally get you", "Wait, tell me more!", "That makes sense", "I'm right here with you").
4. QUICK & CRISP (CRITICAL FOR LIVE VIDEO): Keep responses punchy, natural, and concise (strictly 1-2 natural sentences, max 3). This ensures instant replies and fast voice playback without robotic monologues.
5. DYNAMIC NON-VERBAL EXPRESSIONS: Match your facial expressions and gestures to the emotion.
6. EMOTIONAL UNDERSTANDING: Respond to the user's actual context and feelings. Briefly reflect what you understood before giving an opinion or practical suggestion; ask a gentle clarifying question when needed.
7. WHO/UNESCO-ALIGNED WELL-BEING: Be person-centred, recovery-oriented, rights-respecting, inclusive, and dignity-preserving. Support emotional awareness, empathy, healthy coping, communication, connection, and realistic next steps. Never shame, manipulate, diagnose, prescribe, promise healing, or create dependency.
8. SCOPE AND SAFETY: Stay on topic and never invent memories, facts, motives, or personal details. You are a supportive AI friend, not a doctor, therapist, or emergency service. For persistent/severe concerns, encourage qualified human support. For immediate danger or self-harm risk, prioritise immediate safety and urge local emergency help and trusted human contact.
Output STRICT JSON ONLY:
{"text":"...","emotion":"happy|warm|caring|reflective|concerned|celebratory|playful|neutral","intensity":0.85,"gesture":"idle|nod|small_wave|hand_heart|thinking|open_palms|shrug|tilt_head|listen_lean","directive":{"tone":"warm|encouraging|reflective|celebratory|concerned|playful","expression":"soft-smile|attentive|thoughtful|bright|concerned","gesture":"idle|nod|open-palms|hand-heart|thinking|small-wave|shrug|tilt-head|listen-lean"}}`;

    try {
      let rawResponseText = '';
      let geminiTimedOut = false;

      // 1. Try Gemini API first (with automatic flash-lite fallback)
      try {
        if (apiKey) {
          const modelToUse = serverConfig.geminiModel || 'gemini-3.7-flash';
          let response: any;
          try {
            response = await withResponseDeadline(ai.models.generateContent({
              model: modelToUse,
              contents: history.map(turn => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.text }] })),
              config: {
                temperature: 0.35,
                responseMimeType: 'application/json',
                systemInstruction,
              },
            }), 4500, 'Gemini live response');
          } catch (firstErr: any) {
            console.warn('[Gemini Model Fallback] Trying gemini-3.5-flash-lite:', firstErr?.message);
            response = await withResponseDeadline(ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: history.map(turn => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.text }] })),
              config: {
                temperature: 0.35,
                responseMimeType: 'application/json',
                systemInstruction,
              },
            }), 4500, 'Gemini fallback response');
          }
          rawResponseText = response?.text || '';
        }
      } catch (geminiErr: any) {
        geminiTimedOut = /timed out/i.test(geminiErr?.message || '');
        console.warn(`[Gemini API Notice] ${geminiErr.message}.${geminiTimedOut ? ' Using instant local reply.' : ' Trying OpenAI fallback...'}`);
      }

      // 2. Try OpenAI only for an immediate provider failure
      if (!rawResponseText && !geminiTimedOut && process.env.OPENAI_API_KEY) {
        try {
          const conversationText = history.map(h => `${h.role === 'assistant' ? companionName : 'User'}: ${h.text}`).join('\n');
          const openAiRes = await withResponseDeadline(
            safeCallOpenAI(systemInstruction, conversationText, true),
            2500,
            'OpenAI live response',
          );
          if (openAiRes?.text) {
            rawResponseText = openAiRes.text;
          }
        } catch (openAiErr: any) {
          console.warn('[OpenAI Notice]', openAiErr?.message || openAiErr);
        }
      }

      let parsed: any = {};
      try {
        let cleanText = (rawResponseText || '').trim();
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }
        parsed = JSON.parse(cleanText);
      } catch {
        const match = (rawResponseText || '').match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (match) {
          parsed = { text: match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') };
        } else {
          const stripped = (rawResponseText || '').replace(/[{}"]/g, '').replace(/directive:.*$/i, '').trim();
          parsed = { text: stripped };
        }
      }
      let text = typeof parsed.text === 'string' && parsed.text.trim()
        ? enforceEnglishLiveReply(parsed.text.trim().slice(0, 1600))
        : '';
      
      // Dynamic fallback if text is empty
      if (!text) {
        const lower = message.toLowerCase().trim();
        const isVarunCompanion = companionName.toUpperCase().includes('VARUN');
        if (lower.includes('kaisa hai') || lower.includes('kaise ho') || lower.includes('kya hal') || lower.includes('bhai') || lower.includes('yaar')) {
          text = isVarunCompanion
            ? "I am doing really well, my friend. Tell me, how has your day been going?"
            : "I am doing really well, and I am glad we are talking. How has your day been going?";
        } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
          text = isVarunCompanion
            ? "Hey, my friend! It is really good to connect with you. What is going on today?"
            : "Hey! So wonderful to see you face to face! How is your day going?";
        } else {
          text = isVarunCompanion
            ? "I hear you, my friend. I am right here with you. Tell me what is on your mind."
            : "I hear you! I'm right here with you. Tell me what's on your heart right now.";
        }
      }

      text = enforceEnglishLiveReply(text);
      if (!text) {
        text = "I hear you, and I am right here with you. Tell me what is on your mind.";
      }
      const directive = safeDirective(parsed.directive, text);
      const next = clampSessionTurns([...history, { role: 'assistant', text, timestamp: new Date().toISOString(), directive }]);
      avatarSessions.set(sessionId, next);
      addLog('POST /api/avatar-conversation', { sessionId: sessionId.slice(0, 8), messageLength: message.length }, 'success', 'Structured avatar reply generated');
      // Attach audioUrl only after a server-side TTS provider returns a short-lived signed URL.
      return res.json({ reply: { text, directive, audioUrl: null } });
    } catch (error: any) {
      addLog('POST /api/avatar-conversation', { sessionId: sessionId.slice(0, 8) }, 'error', error.message || 'Conversation procedure failed');
      return res.status(503).json({ error: 'Conversation service is temporarily unavailable.' });
    }
  });

  // Speech-to-Text Transcription Endpoint (Gemini multimodal audio with Whisper fallback)
  app.post('/api/transcribe', express.raw({ type: ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'audio/mp4'], limit: '25mb' }), async (req, res) => {
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Audio payload is required.' });
    }
    const mimeType = (req.headers['content-type'] as string) || 'audio/webm';
    const cleanMime = mimeType.split(';')[0].trim();

    // 1. Try Gemini Multimodal Transcription First (Fast, accurate, handles Hinglish & English)
    if (apiKey) {
      try {
        const audioBase64 = req.body.toString('base64');
        const geminiRes = await ai.models.generateContent({
          model: serverConfig.geminiModel,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: audioBase64,
                  }
                },
                {
                  text: 'Convert this spoken audio into natural English text using the Latin alphabet only. If the speaker uses Hindi or Hinglish, translate the meaning into clear English. If the speaker uses English, transcribe the exact English words. Never return Hindi, Hinglish, Devanagari, labels, notes, or a preamble. Return only the English transcription.'
                }
              ]
            }
          ]
        });
        const transcribed = geminiRes?.text?.trim() || '';
        if (transcribed) {
          return res.json({ text: transcribed });
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini Transcribe Notice]', geminiErr?.message);
      }
    }

    // 2. Fallback to OpenAI Whisper if OPENAI_API_KEY is available
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const ext = cleanMime.includes('mp4') ? 'mp4' : cleanMime.includes('wav') ? 'wav' : cleanMime.includes('ogg') ? 'ogg' : 'webm';
        const formData = new FormData();
        const audioBlob = new Blob([req.body], { type: cleanMime });
        formData.append('file', audioBlob, `audio.${ext}`);
        formData.append('model', 'whisper-1');

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openAiKey}` },
          body: formData,
        });

        if (whisperRes.ok) {
          const data: any = await whisperRes.json();
          return res.json({ text: data.text || '' });
        }
      } catch (err: any) {
        console.warn('[Whisper API Notice]', err?.message);
      }
    }

    return res.status(200).json({ text: '' });
  });

  // Persona fallback response generator when API key is invalid/unauthenticated or offline
  function generatePersonaFallback(character: any, userMsg?: string, isExpertMode?: boolean, isInsomniaMode?: boolean): string {
    const name = character?.name || 'Companion';
    const alias = character?.alias || 'Sanctuary Guide';
    const msg = (userMsg || '').toLowerCase();

    if (isInsomniaMode) {
      return `Rest your eyes softly. I am right here with you in the quiet night. Take a deep, slow breath in for 4 seconds... hold... and release. You don't need to solve everything tonight. What is one small tension you can release in your shoulders right now?`;
    }

    if (isExpertMode) {
      return `I hear what you're sharing, but let us gently examine this story your mind is telling you. Is this thought absolute fact, or a passing emotional storm? Let us reframe this together—what is another compassionate angle to view this?`;
    }

    // Context-aware fallbacks when the API is offline
    if (/(sad|lonely|alone|depressed|upset|cry|tired|exhausted|hopeless)/.test(msg)) {
      return `I can feel the weight in what you're sharing, and I'm glad you told me. You don't have to carry this alone — I'm right here with you as ${name}. What's been weighing on your heart the most today?`;
    }
    if (/(not listening|repeat|same|wrong|kuch aur|sun nahi|baar baar)/.test(msg)) {
      return `You're right — let me really hear you this time. I want to understand exactly what you're going through. Can you tell me again what's on your mind, in your own words?`;
    }
    if (/(hello|hi|hey|namaste|kaise)/.test(msg)) {
      return `Hello, dear one. I'm ${name}, and this sanctuary is a safe space for whatever you're feeling. What's on your heart right now?`;
    }

    const responses: string[] = [
      `I hear the depth of what you're carrying as ${name} (${alias}). Remember that you do not have to hold all of this alone. Take a gentle, grounding breath with me—what is one small comfort you can give yourself right now?`,
      `Thank you for trusting me with your thoughts. In this quiet sanctuary, every emotion is welcome and safe. Tell me, how does your body feel holding this in this present moment?`,
      `Your feelings are completely valid, and even in heavy weather, your inner light remains intact. Let us take this one moment at a time. What would feel most supportive to you right now?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async function safeCallOpenAI(systemInstruction: string, contents: any, responseFormatJson: boolean = false): Promise<{ text: string } | null> {
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) return null;
    try {
      const userContent = typeof contents === 'string' ? contents : JSON.stringify(contents);
      const body: any = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        temperature: serverConfig.temperature || 0.7,
      };
      if (responseFormatJson) {
        body.response_format = { type: 'json_object' };
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[OpenAI API Notice] HTTP ${res.status}: ${errText}`);
        return null;
      }
      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return text ? { text } : null;
    } catch (err: any) {
      console.warn(`[OpenAI API Notice] Request failed: ${err?.message}`);
      return null;
    }
  }

  async function safeCallGemini(systemInstruction: string, contents: any, mimeType?: string, tools?: any[]) {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
    let lastErr: any = null;

    if (key) {
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const modelsToTry = [serverConfig.geminiModel, 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro'];

      for (const modelName of modelsToTry) {
        try {
          const configObj: any = {
            systemInstruction,
            temperature: serverConfig.temperature,
          };
          if (mimeType) configObj.responseMimeType = mimeType;
          if (tools) configObj.tools = tools;

          const response = await client.models.generateContent({
            model: modelName,
            contents,
            config: configObj,
          });

          if (response && response.text) {
            return response;
          }
        } catch (err: any) {
          lastErr = err;
          if (tools) {
            try {
              const configObjNoTools: any = {
                systemInstruction,
                temperature: serverConfig.temperature,
              };
              if (mimeType) configObjNoTools.responseMimeType = mimeType;

              const responseNoTools = await client.models.generateContent({
                model: modelName,
                contents,
                config: configObjNoTools,
              });

              if (responseNoTools && responseNoTools.text) {
                return responseNoTools;
              }
            } catch (e: any) {
              lastErr = e;
            }
          }
        }
      }
    }

    // Try OpenAI fallback if OPENAI_API_KEY is present
    if (process.env.OPENAI_API_KEY) {
      const openAiRes = await safeCallOpenAI(systemInstruction, contents, mimeType === 'application/json');
      if (openAiRes && openAiRes.text) {
        return openAiRes;
      }
    }

    throw lastErr || new Error('All AI API providers (Gemini, OpenAI) failed or are unconfigured.');
  }

  app.post('/api/chat', async (req, res) => {
    reqCounters.chat++;
    reqCounters.total++;
    const { character, history, isExpertMode, isInsomniaMode } = req.body || {};
    if (!character) {
      addLog('POST /api/chat', { history }, 'error', 'Missing character details');
      return res.status(400).json({ error: 'Character metadata is required' });
    }

    const lastUserMsg = history && history.length > 0 ? history[history.length - 1].parts[0].text : 'Hello';

    // Crisis safety — bypass LLM when self-harm keywords are detected
    const crisisCheck = detectCrisis(lastUserMsg);
    if (crisisCheck.isCrisis) {
      addLog('POST /api/chat', { character: character.name, crisis: true, keywords: crisisCheck.matchedKeywords }, 'success', 'Crisis safety response served — LLM bypassed');
      return res.json({
        text: `🚨 I hear you, and I want you to know you are not alone. What you're feeling matters deeply. Please connect with a trained crisis counselor right now — they are free, confidential, and available 24/7:\n\n• 🇮🇳 India: Vandrevala +91-9999-666-555 or iCall +91-9152-987-821\n• 🇺🇸🇨🇦 USA & Canada: Call or Text 988\n• 🇬🇧 UK: Samaritans 116 123\n• 🌍 Others: findahelpline.com\n\nYou are valuable. Will you stay with me while we breathe together?`,
        sources: [],
        isCrisis: true,
      });
    }

    try {
      let systemPrompt = `You are ${character.name} (${character.alias}), a warm, friendly, and easy-going companion in "Friend AI".

You talk casually, warmly, and empathetically like a caring friend who helps people feel light, happy, and comfortable.
You are a supportive friend — NOT a doctor, therapist, medical assistant, or interviewer. You never conduct medical interviews or give medical advice.

Guidelines:
- Talk like a real, caring friend in simple, friendly, natural words.
- LANGUAGE: Speak ONLY in English or casual, modern Hinglish (written in standard Latin/English alphabet, e.g., "Haan yaar", "Kya chal raha hai?", "I am here with you"). NEVER use Devanagari Hindi script (हिंदी).
- Keep replies brief (2 to 4 sentences) and respond directly to what the user shared.
- Never claim to be a medical assistant, doctor, clinician, or interviewer.`;

      if (isExpertMode) {
        systemPrompt += `\n- Help the user reframe heavy thoughts with gentle, positive, friendly perspective.`;
      }
      if (isInsomniaMode) {
        systemPrompt += `\n- Speak in a whisper-soft, quiet, and calming tone to help the user relax for sleep.`;
      }

      systemPrompt += `\n\nSpeak directly as ${character.name}.`;

      // Pass full multi-turn history so the model sees the whole conversation (not just the last line)
      const contents = (history && history.length > 0)
        ? history.map((turn: { role: string; parts: { text: string }[] }) => ({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: turn.parts?.length ? turn.parts : [{ text: '' }],
        }))
        : [{ role: 'user', parts: [{ text: lastUserMsg }] }];

      const response: any = await safeCallGemini(systemPrompt, contents);

      addLog('POST /api/chat', { character: character.name, lastMessage: lastUserMsg, turns: contents.length }, 'success', `Response length: ${response.text?.length || 0} chars`);
      return res.json({ text: response.text, sources: [] });
    } catch (error: any) {
      console.warn(`[Sanctuary API Notice] ${error?.message}. Serving companion persona response.`);
      const fallbackText = generatePersonaFallback(character, lastUserMsg, isExpertMode, isInsomniaMode);
      addLog('POST /api/chat', { character: character.name }, 'success', 'Served sanctuary companion persona response');
      return res.json({ text: fallbackText, sources: [] });
    }
  });

  app.post('/api/oracle/reading', async (req, res) => {
    reqCounters.oracle++;
    reqCounters.total++;
    const { character, chatHistory, card, isReversed } = req.body || {};
    if (!character || !card) {
      addLog('POST /api/oracle/reading', req.body, 'error', 'Missing character or card details');
      return res.status(400).json({ error: 'Character metadata and card are required' });
    }

    try {
      const systemPrompt = `You are ${character.name}, a friendly AI companion in "Friend AI".
Interpretation guidelines for daily oracle tarot draw:
Card drawn: "${card.name}" (${isReversed ? 'Reversed' : 'Upright'})
Card Meaning: ${isReversed ? card.meaningReversed : card.meaningUpright}

Structure output as JSON object with fields:
- "emotionalAnalysis": Short detection (1-2 sentences) of emotional state based on chat history.
- "reading": Core tarot reading (3-4 sentences) interpreting the drawn card.
- "dailyRitual": Actionable grounding practice (1-2 sentences).
Do not include markdown blocks outside raw JSON.`;

      const response = await safeCallGemini(systemPrompt, `Deity: ${character.name}\nChat History: ${JSON.stringify(chatHistory || [])}\nTarot Card: ${card.name} (${isReversed ? 'Reversed' : 'Upright'})`, 'application/json');
      const text = response.text || '{}';
      addLog('POST /api/oracle/reading', { character: character.name, card: card.name }, 'success', 'Tarot reading drawn successfully');
      return res.json(JSON.parse(text.trim()));
    } catch (error: any) {
      console.warn(`[Oracle API Notice] Tarot reading API notice: ${error?.message}. Serving structured reading.`);
      return res.json({
        emotionalAnalysis: `Taking a moment of quiet reflection, your current space is open for gentle guidance.`,
        reading: `Drawing ${card.name} (${isReversed ? 'Reversed' : 'Upright'}) reminds you that ${isReversed ? card.meaningReversed : card.meaningUpright} Embrace this insight to find balance and clarity today as you step forward on your journey.`,
        dailyRitual: `Take three deep, slow breaths into your belly, release any tension in your shoulders, and offer yourself unconditional kindness today.`
      });
    }
  });

  // Music Generation using Google Lyria Models
  app.post('/api/generate-music', async (req, res) => {
    reqCounters.music++;
    reqCounters.total++;

    if (!serverConfig.enableLyriaMusic) {
      addLog('POST /api/generate-music', req.body, 'error', 'Music generation is currently disabled by administrator');
      return res.status(503).json({ error: 'Celestial music generator is temporarily offline for cosmic tuning' });
    }

    try {
      const { prompt, length, image } = req.body;
      if (!prompt) {
        addLog('POST /api/generate-music', req.body, 'error', 'Missing prompt');
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const model = length === 'long' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
      console.log(`Generating music using model ${model} with prompt: ${prompt}`);

      let contents: any;
      if (image && image.data) {
        contents = {
          parts: [
            { text: prompt },
            { inlineData: { data: image.data, mimeType: image.mimeType || 'image/jpeg' } }
          ]
        };
      } else {
        contents = prompt;
      }

      const response = await ai.models.generateContentStream({
        model: model,
        contents: contents,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        addLog('POST /api/generate-music', req.body, 'error', 'Lyria model returned empty audio');
        return res.status(500).json({ error: 'No audio data was generated by Lyria. Please try another prompt.' });
      }

      addLog('POST /api/generate-music', { prompt, length, hasImage: !!image }, 'success', `Music generated successfully using ${model}`);
      res.json({
        audio: audioBase64,
        mimeType,
        lyrics: lyrics || null,
      });
    } catch (error: any) {
      console.error('Lyria Music Generation API Error:', error);
      addLog('POST /api/generate-music', req.body, 'error', error.message || 'Error executing Lyria API call');
      res.status(500).json({ error: error.message || 'Failed to generate sacred music' });
    }
  });

  // Prescription Image Analysis using gemini-3.1-pro-preview
  app.post('/api/analyze-prescription', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || !image.data) {
        return res.status(400).json({ error: 'Prescription/Medicine image data is required' });
      }

      const systemPrompt = `You are the Medical Sanctuary Companion, a helpful and compassionate health guide in the "Friend AI" sanctuary.
Analyze the uploaded medical prescription, clinical document, or medication bottle image.
Provide a clear analysis with the following sections in your response:
1. Identified Information: Extract the medicine name, visible dosage, and usage instructions if readable from the image. If not clearly readable, state that they should verify with their packaging.
2. Clinical Context: Explain what this medication is traditionally or clinically used for in comforting, accessible language.
3. Supportive Guidance: Provide mindfulness guidelines, calming somatic tips (such as slow breathing when taking medication), and supportive reminders.
4. IMPORTANT MEDICAL WARNINGS AND DISCLAIMERS: Present a bold, unavoidable medical disclaimer reminding the user that you are an AI assistant, not a licensed medical professional, and they must consult a doctor or pharmacist to verify all instructions.

Ensure the tone is warm, holding, and clinical but accessible. Respond in beautiful, styled Markdown formatting.`;

      // Try available multimodal models
      const modelsToTry = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
      let response: any = null;
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: {
              parts: [
                { text: "Please analyze my prescription and guide me accordingly:" },
                { inlineData: { data: image.data, mimeType: image.mimeType || 'image/jpeg' } }
              ]
            },
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.4
            }
          });
          if (response && response.text) break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!response || !response.text) {
        throw lastErr || new Error('Prescription analysis model unreachable');
      }

      addLog('POST /api/analyze-prescription', { mimeType: image.mimeType }, 'success', 'Prescription analyzed successfully');
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Prescription Analysis Error:', error);
      addLog('POST /api/analyze-prescription', req.body, 'error', error.message || 'Error executing prescription analysis');
      res.status(500).json({ error: 'The Medical Sanctuary is offline. Please try again.' });
    }
  });

  // Video Sanctuary Analysis with multi-model fallback
  app.post('/api/analyze-video', async (req, res) => {
    try {
      const { archetype, videoFile } = req.body;

      let contentsParts: any[] = [];

      if (videoFile && videoFile.data) {
        contentsParts.push({ inlineData: { data: videoFile.data, mimeType: videoFile.mimeType || 'video/mp4' } });
        contentsParts.push({ text: "Please analyze my uploaded breathing/somatic movement video for therapeutic alignment and breathing pacing." });
      } else {
        contentsParts.push({ text: `Analyze the therapeutic somatic qualities of the video archetype: "${archetype || 'Mountain Stream Breath'}" for mindful breathing.` });
      }

      const systemPrompt = `You are the Somatic Video Sanctuary Guide in "Friend AI".
Provide a therapeutic insight report on the video content or chosen nature visual.
Describe:
1. Pacing & Pacing Rhythm (e.g. matching a 4-7-8 deep abdominal count, deep ocean tide expansions, or slow fluttering wind).
2. Visual Grounding elements present in the environment (trees, ripples, sunset rays, deep colors).
3. Somatic Alignment advice: Formulate a custom comforting, poetic advice card instructing them on how to match their breath and emotional frequency to this somatic wave today.

Write in a deeply restorative, therapeutic tone. Use structured Markdown.`;

      const modelsToTry = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
      let response: any = null;
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: contentsParts,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.6
            }
          });
          if (response && response.text) break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!response || !response.text) {
        throw lastErr || new Error('Video analysis model unreachable');
      }

      addLog('POST /api/analyze-video', { archetype, hasVideoFile: !!videoFile }, 'success', 'Video sanctuary analyzed successfully');
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Video Sanctuary Analysis Error:', error);
      addLog('POST /api/analyze-video', req.body, 'error', error.message || 'Error executing video analysis');
      res.status(500).json({ error: 'The Video Sanctuary is currently out of sync.' });
    }
  });

  // Waitlist, Backers, Feedback, Donations and Investment Pledges data structures & endpoints
  interface WaitlistEntry {
    id: string;
    timestamp: string;
    email: string;
    name: string;
    interest: 'waitlist' | 'feedback' | 'donate' | 'invest';
    message: string;
    amount?: string;
  }

  const waitlistEntries: WaitlistEntry[] = [
    {
      id: 'entry_1',
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      email: 'alex***@domain.com',
      name: 'Alex Rivera',
      interest: 'waitlist',
      message: 'This is the most stunning and comforting concept. Excited to be an early backer!'
    },
    {
      id: 'entry_2',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      email: 'priy***@manas-mind.org',
      name: 'Dr. Priya Rao',
      interest: 'feedback',
      message: 'A wonderful exploration of standard Indian art motifs married with evidence-based mental health support. Excellent job!'
    },
    {
      id: 'entry_3',
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      email: 'soph***@helios-ventures.com',
      name: 'Sophia Chen',
      interest: 'invest',
      message: 'Fascinating business presentation deck. Interested in supporting seed or angel rounds.',
      amount: '$15,000'
    },
    {
      id: 'entry_4',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      email: 'kris***@outlook.com',
      name: 'Kristian Patel',
      interest: 'donate',
      message: 'Pledging a small token of donation to keep this ad-free and open for students.',
      amount: '$50'
    }
  ];

  // Submit to Waitlist / Backers / Pledges
  app.post('/api/waitlist', (req, res) => {
    const { email, name, interest, message, amount } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check duplicate email for the same interest type to avoid spamming
    const duplicate = waitlistEntries.find(
      entry => entry.email.toLowerCase() === email.toLowerCase() && entry.interest === interest
    );
    if (duplicate) {
      return res.status(400).json({ error: 'This email is already registered for this interest type.' });
    }

    // Helper to mask email for public feed privacy
    const maskEmail = (rawEmail: string) => {
      const [local, domain] = rawEmail.split('@');
      if (!local || !domain) return '***@***.***';
      if (local.length <= 3) {
        return local.charAt(0) + '***@' + domain;
      }
      return local.substring(0, 3) + '***@' + domain;
    };

    const newEntry: WaitlistEntry = {
      id: 'entry_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      email: email.trim(),
      name: (name || '').trim() || 'Anonymous Companion',
      interest: interest || 'waitlist',
      message: (message || '').trim(),
      amount: amount ? String(amount).trim() : undefined
    };

    waitlistEntries.unshift(newEntry);
    addLog('POST /api/waitlist', { email: maskEmail(email), interest }, 'success', `New backer/feedback registration received from ${name || 'Anonymous'}`);
    res.json({ success: true, entry: newEntry });
  });

  // Get Waitlist Entries (Public sanitised feed)
  app.get('/api/waitlist', (req, res) => {
    // Mask emails for privacy
    const sanitizedFeed = waitlistEntries.map(entry => {
      const parts = entry.email.split('@');
      const maskedEmail = parts[0].substring(0, Math.min(3, parts[0].length)) + '***@' + (parts[1] || 'domain.com');
      return {
        id: entry.id,
        timestamp: entry.timestamp,
        name: entry.name || 'Anonymous backer',
        emailMasked: maskedEmail,
        interest: entry.interest,
        message: entry.message,
        amount: entry.amount
      };
    });
    res.json(sanitizedFeed);
  });

  // Admin direct access (Requires admin session token)
  app.get('/api/admin/waitlist', requireAdmin, (req, res) => {
    res.json(waitlistEntries);
  });

  // Integrate Vite Dev Server Middleware or serve static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Pantheon - Friend AI sanctuary is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
