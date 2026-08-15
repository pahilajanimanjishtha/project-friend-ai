export interface Character {
  id: string;
  name: string;
  alias: string;
  faction: 'olympian' | 'underworld' | 'titan' | 'muse';
  badge: string;
  role: string;
  simpleMeaning: string;
  helpFor: string;
  artStyle: string;
  quote: string;
  want: string;
  wound: string;
  secret: string;
  symbolName: string;
  colorScheme: {
    glow: string;
    text: string;
    badge: string;
    dim: string;
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  timestamp: string;
  sources?: { uri: string; title: string }[];
}

export interface ChatSession {
  characterId: string;
  messages: Message[];
}

/** A selectable companion avatar with full identity, style, and voice config. */
export interface Avatar {
  /** Unique identifier, e.g. 'ema' */
  id: string;
  /** Display name in uppercase, e.g. 'EMA' */
  name: string;
  /** Short character description shown under name */
  description: string;
  /** Longer tagline shown in the hero current-avatar banner */
  tagline: string;
  /** Emoji or extra personality marker */
  badge: string;
  /** High-resolution portrait image path */
  image: string;
  /** Skin tone color hex for legacy references */
  skinColor?: number;
  /** Hair color hex */
  hairColor?: number;
  /** Shirt / clothing color hex */
  shirtColor?: number;
  /** Glow accent color for the selection ring, e.g. '#6ee7f7' */
  glowColor: string;
  /** Background radial gradient stop for the avatar card */
  bgGradient: string;
  /** Voice gender hint used by TTS settings */
  voice: 'feminine' | 'masculine' | 'neutral';
  /** ElevenLabs voice used for this avatar's greetings and conversation */
  voiceId?: string;
  /** Accent hint forwarded to the conversation settings */
  accent: string;
  /** Short personality tag used when building the AI system prompt */
  personality: string;
  /** Tailored system prompt for the conversational LLM */
  systemPrompt?: string;
  /** Direct path to the rigged 3D VRM/GLB file, e.g. '/models/ema.vrm' */
  modelPath?: string;
  /** Explicit profile image path for selection cards */
  profileImage?: string;
  /** Dynamic animation profile dictating gesture energy and micro-motions */
  animationProfile?: 'gentle' | 'adventurous' | 'gentle_confident' | 'casual_genz';
  /** Provider IDs when configured */
  providers?: {
    did?: {
      sourceUrl?: string;
      agentId?: string;
      voiceId?: string;
    };
    heygen?: {
      avatarId?: string;
      voiceId?: string;
    };
    tavus?: {
      replicaId?: string;
      personaId?: string;
    };
  };
}
