export interface Character {
  id: string;
  name: string;
  alias: string;
  faction: 'olympian' | 'underworld' | 'titan' | 'muse';
  badge: string;
  role: string;
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
