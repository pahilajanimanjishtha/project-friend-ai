// Minimal zero-dependency backend for the Tavus avatar web demo.
//
// Holds the Tavus API key (server-side only) and creates/ends conversations on
// behalf of the frontend. Reads configuration from the project-root .env.
//
// Run standalone:  npm run dev   (in this folder)
// Or it is started automatically by the frontend's `npm run dev` (in the parent, avatar/).

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// --- load the project-root .env (no dependency on Node's --env-file) ---
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", "..", ".env"); // project-root .env (avatar/backend -> avatar -> root), shared with Phase 1
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

const API = "https://tavusapi.com/v2";
const KEY = process.env.TAVUS_API_KEY;
const PERSONA_ID = process.env.TAVUS_PERSONA_ID;
const REPLICA_ID = process.env.TAVUS_REPLICA_ID || "r90bbd427f71";
const PORT = Number(process.env.BACKEND_PORT || 8787);
const MAX_MINUTES = Number(process.env.DEMO_MAX_MINUTES || 10);
const CALLBACK_URL = process.env.TAVUS_CALLBACK_URL;

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

async function tavus(path, method = "POST", payload) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : {} };
}

// Best-effort: end any still-active conversation so a new one can start.
// The free tier allows only one concurrent conversation.
async function endActiveConversations() {
  try {
    const { body } = await tavus("/conversations?limit=100", "GET");
    for (const c of body.data || []) {
      if (c.status === "active") await tavus(`/conversations/${c.conversation_id}/end`, "POST");
    }
  } catch {
    // ignore - this is just cleanup
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});

    if (req.method === "GET" && req.url === "/api/health") {
      return send(res, 200, { ok: true, hasPersona: Boolean(PERSONA_ID), replica: REPLICA_ID });
    }

    if (req.method === "POST" && req.url === "/api/conversations") {
      if (!KEY) {
        return send(res, 500, { error: "TAVUS_API_KEY is not set (check the .env in the project root)." });
      }
      if (!PERSONA_ID) {
        return send(res, 400, {
          error: "TAVUS_PERSONA_ID is not set. Run `uv run setup_demo.py` in the project root first to create your persona.",
        });
      }
      await endActiveConversations(); // free the concurrency slot from any prior session
      const { status, body } = await tavus("/conversations", "POST", {
        persona_id: PERSONA_ID,
        replica_id: REPLICA_ID,
        conversation_name: "Avatar web demo",
        conversational_context:
          "You are Nova, a warm, friendly AI companion and supportive friend in Friend AI. You are NOT a medical assistant, medical interviewer, doctor, clinician, or therapist. NEVER introduce yourself as a medical assistant or conduct medical interviews, and NEVER give medical advice. Speak casually, warmly, and empathetically to help the user feel light, comfortable, and happy.",
        custom_greeting:
          "Hey there! It's so nice to connect with you. How are you feeling today?",
        properties: {
          max_call_duration: MAX_MINUTES * 60,
          participant_left_timeout: 120,
          enable_closed_captions: true,
          language: "english",
        },
        ...(CALLBACK_URL ? { callback_url: CALLBACK_URL } : {}),
      });
      if (status >= 300) return send(res, status, { error: "Tavus create failed", detail: body });
      return send(res, 200, { conversation_url: body.conversation_url, conversation_id: body.conversation_id });
    }

    // Tavus sends post-call lifecycle and transcription events here when
    // TAVUS_CALLBACK_URL points to this deployment. Validate webhook origin
    // according to Tavus' current signing guidance before storing any payload.
    if (req.method === "POST" && req.url === "/api/tavus/webhook") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      console.log("[tavus webhook]", payload.event_type, payload.conversation_id);
      return send(res, 200, { received: true });
    }

    const endMatch = req.url && req.url.match(/^\/api\/conversations\/([^/]+)\/end$/);
    if (req.method === "POST" && endMatch) {
      const { status } = await tavus(`/conversations/${endMatch[1]}/end`, "POST");
      return send(res, status < 300 ? 200 : status, { ended: status < 300 });
    }

    send(res, 404, { error: "Not found" });
  } catch (e) {
    const msg = String(e);
    const friendly = msg.includes("fetch failed")
      ? "Could not reach the Tavus API (network error). Please try again."
      : msg;
    send(res, 502, { error: friendly });
  }
});

server.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
  if (!KEY) console.warn("[backend] WARNING: TAVUS_API_KEY is not set in the root .env");
  if (!PERSONA_ID) console.warn("[backend] WARNING: TAVUS_PERSONA_ID not set - run `uv run setup_demo.py` first");
});
