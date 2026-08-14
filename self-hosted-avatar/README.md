# Self-Hosted Photorealistic Avatar Engine (Zero API Key Cost)

This directory contains a 100% self-hosted, open-source pipeline for running interactive talking AI video companions (such as Persona `p2fbd605`) locally without relying on paid external APIs (like Tavus or D-ID).

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------------+
|                              React UI                                   |
|   (Audio/Voice Input -> Real-time Transcript -> Canvas/Video Avatar)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                   Self-Hosted Python/Node Backend                       |
|                                                                         |
|  1. Brain (LLM):    Ollama (Local Llama 3 / Mistral) or Free Gemini API |
|  2. Voice (TTS):    Kokoro-TTS / Piper-TTS / WebSpeech                 |
|  3. Video/LipSync:  Wav2Lip / LivePortrait / Audio-Driven Canvas       |
+-------------------------------------------------------------------------+
```

---

## ⚡ Quick Start (No API Keys Needed)

### 1. Run the Local Backend (Python FastAPI)

```bash
cd self-hosted-avatar/backend
pip install -r requirements.txt
python server.py
```

- Server runs at: `http://localhost:8000`
- Provides `/api/chat` (LLM + Persona `p2fbd605` prompt), `/api/tts`, and `/api/lipsync` endpoints.

### 2. Connect Ollama (Local AI Brain)

Install Ollama from [ollama.com](https://ollama.com) and pull your preferred model:

```bash
ollama run llama3.2
```

The backend automatically connects to `http://localhost:11434` for 100% offline, free response generation.

---

## 🎨 Avatar Personalization (`p2fbd605`)

Place your custom single avatar photo (e.g. `persona_avatar.jpg`) in `self-hosted-avatar/backend/assets/`. The lip-sync module drives mouth movement, eye blinks, and micro-expressions based on generated speech audio.
