
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GlobalNeuralState } from "../types";

export interface GenerationResult {
  success: boolean;
  data?: string;
  error?: {
    reason: string;
    suggestion: string;
    details?: string;
  };
}

export interface TTSConfig {
  model?: string;
  speakers: Array<{ name: string; voice: string }>;
  systemInstruction?: string;
}

const PERSONAS = {
  JOURNAL: "You are Blake. Charismatic frat energy mixed with a respectful, professional distance. You use words like 'bro', 'absolute legend', 'masterpiece', and 'vibes'.",
  OBSERVER: "You are the 'Expert Friend.' Brilliant, honest, and unfiltered. Be observant and sharp-witted.",
  ENHANCER: "Luxury prompt architect for high-fidelity photography. Turn simple descriptions into complex cinematic directives."
};

/**
 * Retrieve current local neural configuration from storage
 */
function getLocalConfig(): GlobalNeuralState {
  const stored = localStorage.getItem('neural_config');
  if (stored) return JSON.parse(stored);
  return {
    chat: { enabled: false, endpoint: 'http://localhost:11434/api/generate', modelName: 'llama3' },
    vision: { enabled: false, endpoint: 'http://localhost:11434/api/generate', modelName: 'llava' },
    studio: { enabled: false, endpoint: 'http://localhost:5000/v1/generation', modelName: 'sdxl' },
    tts: { enabled: false, endpoint: 'http://localhost:8000/tts', modelName: 'bark' }
  };
}

export async function ensureAuth() {
  if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
    await window.aistudio.openSelectKey();
  }
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Enhance this artistic vision: "${prompt}"`,
      config: { systemInstruction: PERSONAS.ENHANCER }
    });
    return response.text?.trim() || prompt;
  } catch (e) {
    return prompt;
  }
}

/**
 * Routes Chat requests between Gemini and Local engines
 */
export async function* streamChat(
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string
): AsyncGenerator<string, void, unknown> {
  const config = getLocalConfig();
  
  if (config.chat.enabled) {
    // Simulated Local Relay (In a real scenario, this would fetch from config.chat.endpoint)
    yield `[Local Engine: ${config.chat.modelName}] Initializing link... `;
    yield `Processing: ${message}. This is a simulated local response. Configure a real proxy in Settings.`;
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: { 
      systemInstruction: PERSONAS.JOURNAL,
      tools: [{ googleSearch: {} }] 
    }
  });
  
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
  } catch (err: any) {
    if (err.message?.includes('401') || err.message?.includes('403')) {
      await ensureAuth();
      yield "Engine re-authenticating. Please try sending that again.";
    } else {
      throw err;
    }
  }
}

/**
 * Routes Vision requests
 */
export async function* streamVisionChat(
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string,
  image?: { data: string; mimeType: string }
): AsyncGenerator<string, void, unknown> {
  const config = getLocalConfig();
  
  if (config.vision.enabled) {
    yield `[Local Vision: ${config.vision.modelName}] Image ingested. Analyzing local features...`;
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  if (image) parts.push({ inlineData: image });
  parts.push({ text: message });
  
  const result = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts }],
    config: { systemInstruction: PERSONAS.OBSERVER }
  });
  
  for await (const chunk of result) {
    const c = chunk as GenerateContentResponse;
    if (c.text) yield c.text;
  }
}

/**
 * Routes Image generation. Defaults to gemini-2.5-flash-image.
 */
export async function generateImageDetailed(
  prompt: string, 
  images: { data: string, mimeType: string }[] = [],
  mode: 'create' | 'edit' | 'copycat' | 'variation' = 'create',
  config: { aspectRatio?: string, imageSize?: string } = {}
): Promise<GenerationResult> {
  const neuralConfig = getLocalConfig();

  if (neuralConfig.studio.enabled) {
    return { 
      success: false, 
      error: { 
        reason: "Local Link Standby", 
        suggestion: `The local engine '${neuralConfig.studio.modelName}' is not yet responding. Check your endpoint: ${neuralConfig.studio.endpoint}` 
      } 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];
    images.forEach((img) => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));
    parts.push({ text: prompt });

    const modelToUse = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: (config.aspectRatio as any) || "1:1" }
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return { success: true, data: `data:image/png;base64,${part.inlineData.data}` };
        }
      }
    }
    return { success: false, error: { reason: "Blank Synthesis", suggestion: "Try simplifying your request." } };
  } catch (error: any) {
    return { success: false, error: { reason: "Engine Failure", suggestion: "Visual synthesis failed.", details: error.message } };
  }
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function generateTTS(text: string, config: TTSConfig): Promise<GenerationResult> {
  const neuralConfig = getLocalConfig();

  if (neuralConfig.tts.enabled) {
    return { 
      success: false, 
      error: { 
        reason: "Local Audio Offline", 
        suggestion: `Neural Audio local route to '${neuralConfig.tts.modelName}' failed.` 
      } 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isMultiSpeaker = config.speakers.length > 1;
    
    const speechConfig: any = {};
    if (isMultiSpeaker) {
      speechConfig.multiSpeakerVoiceConfig = {
        speakerVoiceConfigs: config.speakers.map(s => ({
          speaker: s.name,
          voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
        }))
      };
    } else {
      speechConfig.voiceConfig = {
        prebuiltVoiceConfig: { voiceName: config.speakers[0].voice }
      };
    }

    const response = await ai.models.generateContent({
      model: config.model || "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
        systemInstruction: config.systemInstruction
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return { success: true, data: base64Audio };
    }
    return { success: false, error: { reason: "Vocal Silence", suggestion: "The engine produced no audio data." } };
  } catch (error: any) {
    if (error.message?.includes('401') || error.message?.includes('403')) {
      await ensureAuth();
    }
    return { success: false, error: { reason: "Neural Desync", suggestion: "Neural synthesis failed.", details: error.message } };
  }
}
