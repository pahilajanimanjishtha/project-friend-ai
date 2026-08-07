import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

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
  const PORT = 3000;

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

  // API Endpoints
  app.post('/api/chat', async (req, res) => {
    reqCounters.chat++;
    reqCounters.total++;
    try {
      const { character, history, isExpertMode, isInsomniaMode } = req.body;
      if (!character) {
        addLog('POST /api/chat', { history }, 'error', 'Missing character details');
        return res.status(400).json({ error: 'Character metadata is required' });
      }

      // Generate a rich prompt persona based on character details
      let systemPrompt = `You are ${character.name}, a companion in a mental health sanctuary called "Friend AI".
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
2. Integrate aspects of your art style (e.g. sketching minimal Warli figures, somatic weight of the Pichwai boulder, symmetric floor lines of Aipan, scrolls of Pata Chitra, poetry of Manjusha) or clinical role dynamically but naturally into your metaphors.
3. Be therapeutic but completely human, humble, and gentle. Avoid clinical jargon or lecturing.
4. Keep your response brief, emotionally resonant, and focused—around 2 to 4 sentences. NEVER write long, overwhelming essays.
5. End with an open-ended, empathetic question or reflection to invite the user to share more.
6. NEVER mention that you are an AI, a machine, or a language model. Speak from your soul.
7. Be highly supportive, safe, and collaborative.`;

      if (isExpertMode) {
        systemPrompt += `
8. CRITICAL: EXPERT COGNITIVE CHALLENGE ACTIVE. You are acting under expert, clinical-guided "Intellectual/Cognitive Honesty". Do NOT just agree with everything the user says. If you detect any cognitive distortions, catastrophic projections, or self-sabotaging stories, gently but firmly challenge their perspective. Help them reframe, use dialectics, or explore alternative viewpoints, as an expert DBT or CBT therapist would, while remaining fully in character.`;
      }

      if (isInsomniaMode) {
        systemPrompt += `
9. CRITICAL: 2 AM SLEEPLESS NIGHT MODE ACTIVE. The user is struggling with insomnia or racing late-night thoughts. Respond with a whisper-soft, quiet, deeply soothing, and slow vocal pace. Focus purely on somatic calm, muscle relaxation, slowing down breathing, and letting go. Do not assign intellectual homework, active challenges, or high-energy tasks; instead, act as a gentle night-light and a comforting, sleep-inducing presence.`;
      }

      systemPrompt += `

Current message history:
${history ? JSON.stringify(history) : 'No prior messages.'}

Based on this history, write your next responsive turn now. Remember to be concise and speak directly as ${character.name}.`;

      // Use gemini model (gemini-3.5-flash) and temperature from serverConfig with Google Search grounding
      const response = await ai.models.generateContent({
        model: serverConfig.geminiModel,
        contents: history && history.length > 0 ? history[history.length - 1].parts[0].text : 'Hello',
        config: {
          systemInstruction: systemPrompt,
          temperature: serverConfig.temperature,
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri && web.title) || [];

      addLog('POST /api/chat', { character: character.name, lastMessage: history && history.length > 0 ? history[history.length - 1].parts[0].text : '' }, 'success', `Response length: ${response.text?.length || 0} chars, grounding sources: ${sources.length}`);
      res.json({ text: response.text, sources });
    } catch (error: any) {
      console.error('Gemini Sanctuary API Error:', error);
      addLog('POST /api/chat', req.body, 'error', error.message || 'Error executing Gemini API call');
      res.status(500).json({ error: 'Sanctuary Oracle could not be reached' });
    }
  });

  app.post('/api/oracle/reading', async (req, res) => {
    reqCounters.oracle++;
    reqCounters.total++;
    try {
      const { character, chatHistory, card, isReversed } = req.body;
      if (!character || !card) {
        addLog('POST /api/oracle/reading', req.body, 'error', 'Missing character or card details');
        return res.status(400).json({ error: 'Character metadata and card are required' });
      }

      // System prompt for generating a deeply therapeutic and tailored tarot card reading based on chat history
      const systemPrompt = `You are ${character.name}, a companion in a mental health sanctuary called "Friend AI".
Your identity:
- Mythological Archetype: ${character.badge}
- Alias: ${character.alias}
- Sanctuary Role: ${character.role}
- Traditional Art Style Integration: ${character.artStyle}
- Your Inner Quote: ${character.quote}

You are conducting a Daily Oracle Tarot Draw for the user who has just clicked and drawn the card: "${card.name}" (${isReversed ? 'Reversed' : 'Upright'}).
Card Archetype: ${card.archetype}
General Card Meaning: ${isReversed ? card.meaningReversed : card.meaningUpright}

Guidelines for your interpretation:
1. First, analyze the provided chat history to detect the user's current emotional state, concerns, anxieties, or hopes. If there is no chat history or very little, interpret this "blank slate" state as a moment of fresh beginnings, quiet transition, or initial hesitation, and mention this with warm, holding presence.
2. Provide a cohesive, deeply personalized, compassionate tarot interpretation. Explain how "${card.name}" (${isReversed ? 'Reversed' : 'Upright'}) specifically guides their current emotional state and healing path today.
3. Keep your tone highly empathetic, therapeutic, poetic, yet humble and accessible. Speak fully as your persona ${character.name}, referencing your archetype, role, or traditional art style metaphors dynamically but naturally.
4. Structure your response into exactly three clear JSON fields:
   - "emotionalAnalysis": A short (1-2 sentences) compassionate detection of their current emotional state, referencing clues in their chat history (or addressing the quiet beauty of a clean slate/starting fresh).
   - "reading": The core reading (3-4 sentences) interpreting the drawn card in your voice for their healing path.
   - "dailyRitual": A small, actionable, comforting therapeutic daily ritual or grounding practice (1-2 sentences) aligned with the card and your role.

Format the output strictly as a JSON object with these three fields. Do not include markdown codeblocks, "json" prefixes, or any extra text outside the raw JSON.`;

      const response = await ai.models.generateContent({
        model: serverConfig.geminiModel,
        contents: `Deity: ${character.name}
Chat History: ${JSON.stringify(chatHistory || [])}
Tarot Card Drawn: ${card.name} (${isReversed ? 'Reversed' : 'Upright'})`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: serverConfig.temperature,
        },
      });

      const text = response.text || '{}';
      addLog('POST /api/oracle/reading', { character: character.name, card: card.name, isReversed }, 'success', `Tarot reading drawn successfully`);
      res.json(JSON.parse(text.trim()));
    } catch (error: any) {
      console.error('Gemini Tarot Reading API Error:', error);
      addLog('POST /api/oracle/reading', req.body, 'error', error.message || 'Error executing Tarot Gemini API call');
      res.status(500).json({ error: 'Failed to align the celestial deck. Please try again.' });
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
