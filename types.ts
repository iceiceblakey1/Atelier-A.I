
export enum AppView {
  CHAT = 'CHAT',
  VISION = 'VISION',
  STUDIO = 'STUDIO',
  TTS = 'TTS',
  SETTINGS = 'SETTINGS'
}

export enum StudioMode {
  MASTERPIECE = 'MASTERPIECE',
  COPYCAT = 'COPYCAT',
  VARIATION = 'VARIATION'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface GeneratedImage {
  id?: string;
  url: string;
  prompt: string;
}

export interface LocalNeuralConfig {
  enabled: boolean;
  endpoint: string;
  modelName: string;
}

export interface GlobalNeuralState {
  chat: LocalNeuralConfig;
  vision: LocalNeuralConfig;
  studio: LocalNeuralConfig;
  tts: LocalNeuralConfig;
}
