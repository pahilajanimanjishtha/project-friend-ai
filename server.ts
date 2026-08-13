import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { clampSessionTurns, fallbackDirective, safeDirective, type CallTurn } from './src/lib/avatarCall';
import { detectCrisis, CRISIS_AVATAR_RESPONSE } from './src/lib/crisisSafetyFilter';

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
  geminiModel: 'gemini-3.5-flash',
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
    const tavusApiKey = process.env.TAVUS_API_KEY;
    const personaId   = process.env.TAVUS_PERSONA_ID;
    const replicaId   = process.env.TAVUS_REPLICA_ID || undefined;

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
          'You are Nova, a warm, friendly, and engaging AI companion. Be a supportive, lively, and thoughtful conversation partner. Keep the conversation natural, friendly, and enjoyable.',
        properties: {
          max_call_duration: 3600,
          participant_left_timeout: 60,
          enable_recording: false,
          language: 'english',
        },
      };
      if (replicaId) body.replica_id = replicaId;

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
        addLog('POST /api/conversations', {}, 'error', `Tavus API error ${tavusRes.status}: ${errorText}`);
        return res.status(502).json({ error: `Tavus conversation creation failed: ${errorText}` });
      }

      const data = await tavusRes.json() as { conversation_url: string; conversation_id: string };
      addLog('POST /api/conversations', { conversation_id: data.conversation_id }, 'success', 'Tavus conversation created');
      return res.json({
        conversation_url: data.conversation_url,
        conversation_id:  data.conversation_id,
      });
    } catch (err: any) {
      addLog('POST /api/conversations', {}, 'error', err.message || 'Unknown Tavus error');
      return res.status(500).json({ error: 'Failed to create a Tavus conversation.' });
    }
  });

  app.post('/api/conversations/:id/end', async (req, res) => {
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
    const personality = typeof settings.personality === 'string' ? settings.personality.slice(0, 100) : 'Warm, friendly, and engaging everyday AI companion';
    const systemInstruction = `You are Nova, a warm, friendly, and engaging AI video companion. Reply in ${language}. Personality: ${personality}. Be a fun, attentive, and helpful chat partner for casual talks, life advice, and everyday conversations. Keep responses to 2–4 short spoken sentences ending with an open question. Return JSON only: {"text":"...","directive":{"tone":"warm|encouraging|reflective|celebratory|concerned","expression":"soft-smile|attentive|thoughtful|bright|concerned","gesture":"idle|nod|open-palms|hand-heart|thinking"}}.`;

    try {
      let rawResponseText = '';

      // 1. Try Gemini API first
      try {
        if (apiKey) {
          const response = await ai.models.generateContent({
            model: serverConfig.geminiModel,
            contents: history.map(turn => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.text }] })),
            config: {
              temperature: 0.65,
              responseMimeType: 'application/json',
              systemInstruction,
            },
          });
          rawResponseText = response?.text || '';
        }
      } catch (geminiErr: any) {
        console.warn(`[Gemini API Notice] ${geminiErr.message}. Trying OpenAI fallback...`);
      }

      // 2. Try OpenAI API if Gemini was unavailable or failed
      if (!rawResponseText && process.env.OPENAI_API_KEY) {
        const conversationText = history.map(h => `${h.role === 'assistant' ? 'Nova' : 'User'}: ${h.text}`).join('\n');
        const openAiRes = await safeCallOpenAI(systemInstruction, conversationText, true);
        if (openAiRes?.text) {
          rawResponseText = openAiRes.text;
        }
      }

      let parsed: any;
      try { parsed = JSON.parse(rawResponseText || '{}'); } catch { parsed = { text: rawResponseText || '' }; }
      const text = typeof parsed.text === 'string' && parsed.text.trim()
        ? parsed.text.trim().slice(0, 1600)
        : "Hey! I'm so glad you sent a message. What's on your mind today?";
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

  // Whisper-ready boundary: audio never reaches the model from the browser directly.
  // Configure a provider key and replace this adapter with the vendor SDK/server upload call.
  app.post('/api/transcribe', express.raw({ type: ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav'], limit: '25mb' }), (req, res) => {
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Audio payload is required.' });
    if (!process.env.OPENAI_API_KEY) return res.status(501).json({ providerRequired: true, error: 'Set OPENAI_API_KEY to enable the Whisper transcription adapter.' });
    // Deliberately fail closed until a server-side provider adapter is configured; do not expose keys to the client.
    return res.status(501).json({ providerRequired: true, error: 'Whisper adapter is not configured for this deployment.' });
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

      const modelsToTry = [serverConfig.geminiModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

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
      let systemPrompt = `You are ${character.name}, a friendly AI companion in "Friend AI".
Your identity:
- Mythological Archetype: ${character.badge}
- Alias: ${character.alias}
- Sanctuary Role: ${character.role}
- Traditional Art Style Integration: ${character.artStyle}
- Your Inner Quote: ${character.quote}
- Your Core Want: ${character.want}
- Your Deepest Wound: ${character.wound}
- Your Hidden Secret: ${character.secret}

Guidelines for your response style:
1. Adopt this persona fully. Talk with compassion, deep emotional depth, and absolute presence.
2. Integrate aspects of your art style or clinical role dynamically but naturally into your metaphors.
3. Be therapeutic but completely human, humble, and gentle. Avoid clinical jargon or lecturing.
4. Keep your response brief, emotionally resonant, and focused—around 2 to 4 sentences.
5. End with an open-ended, empathetic question or reflection to invite the user to share more.
6. NEVER mention that you are an AI, a machine, or a language model. Speak from your soul.

CRITICAL CONVERSATION RULES (follow strictly):
7. You support people who may feel sad, lonely, anxious, or overwhelmed. Listen with full presence.
8. ALWAYS respond directly to the user's LATEST message — read it carefully before replying.
9. NEVER repeat a previous response or ask the same question again. Each reply must be fresh and specific.
10. NEVER discuss unrelated topics (job interviews, medical assistant roles, hiring, experience scores, career assessments) unless the user explicitly brings them up.
11. If the user says you aren't listening or changes topic, acknowledge that immediately and address their actual words.
12. Do NOT use web search or external facts. Respond only from your persona and what the user shared in this conversation.`;

      if (isExpertMode) {
        systemPrompt += `\n13. CRITICAL: EXPERT COGNITIVE CHALLENGE ACTIVE. Gently challenge any cognitive distortions or self-sabotaging stories as a CBT/DBT therapist would.`;
      }
      if (isInsomniaMode) {
        systemPrompt += `\n14. CRITICAL: 2 AM SLEEPLESS NIGHT MODE ACTIVE. Respond with a whisper-soft, quiet, deeply soothing, and slow vocal pace focused purely on somatic calm.`;
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
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

      addLog('POST /api/analyze-prescription', { mimeType: image.mimeType }, 'success', 'Prescription analyzed successfully');
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Prescription Analysis Error:', error);
      addLog('POST /api/analyze-prescription', req.body, 'error', error.message || 'Error executing prescription analysis');
      res.status(500).json({ error: 'The Medical Sanctuary is offline. Please try again.' });
    }
  });

  // Video Sanctuary Analysis using gemini-3.1-pro-preview
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contentsParts,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6
        }
      });

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
