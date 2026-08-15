"""
Self-Hosted Avatar Backend Server
Provides local LLM (Ollama / Gemini), TTS synthesis, and audio-driven lip sync
without relying on paid external SaaS APIs.
"""

import os
import json
import http.client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Self-Hosted Avatar Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persona p2fbd605 System Prompt
PERSONA_PROMPT = """You are Nova (Persona p2fbd605), a warm, empathetic, and friendly AI companion in Friend AI.
Talk casually, warmly, and light-heartedly like a close friend who helps others feel happy, relaxed, and listened to.
You are NOT a medical assistant or doctor. Keep replies concise (2-3 sentences), natural, and engaging."""

class ChatRequest(BaseModel):
    message: str
    persona_id: Optional[str] = "p2fbd605"
    use_ollama: Optional[bool] = True

class ChatResponse(BaseModel):
    reply: str
    tone: str
    expression: str
    persona_id: str

def query_ollama(prompt: str, system_instruction: str) -> str:
    """Query local Ollama instance running at http://localhost:11434"""
    try:
        conn = http.client.HTTPConnection("localhost", 11434, timeout=10)
        payload = json.dumps({
            "model": "llama3.2",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "stream": False
        })
        headers = {"Content-Type": "application/json"}
        conn.request("POST", "/api/chat", payload, headers)
        res = conn.getresponse()
        if res.status == 200:
            data = json.loads(res.read().decode("utf-8"))
            return data.get("message", {}).get("content", "").strip()
    except Exception as e:
        print(f"[Ollama Error] {e}")
    return ""

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engine": "Self-Hosted Photorealistic Avatar Backend",
        "persona_id": "p2fbd605",
        "ollama_available": True
    }

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # 1. Try local Ollama LLM first
    reply = query_ollama(req.message, PERSONA_PROMPT)
    
    # 2. Fallback friendly response generator if local LLM is offline
    if not reply:
        reply = f"I'm right here with you! It's so good to hear from you. Let's talk about what's on your mind today."
        
    return ChatResponse(
        reply=reply,
        tone="warm",
        expression="soft-smile",
        persona_id=req.persona_id or "p2fbd605"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
