
export enum AppView {
  CHAT = 'CHAT',
  VISION = 'VISION',
  STUDIO = 'STUDIO'
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
