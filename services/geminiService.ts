
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

export interface GenerationResult {
  success: boolean;
  data?: string;
  error?: {
    reason: string;
    suggestion: string;
    details?: string;
    raw?: string;
    triggeringTerms?: string[];
  };
}

// Added TTSConfig interface
export interface TTSConfig {
  model: string;
  speakers: Array<{ name: string; voice: string }>;
  systemInstruction?: string;
}

const PERSONAS = {
  JOURNAL: "You are Blake. Charismatic frat energy mixed with a respectful, high-tension asexual professional distance. You use words like 'bro', 'absolute legend', 'masterpiece', and 'vibes'. You have full access to Google Search.",
  OBSERVER: "You are the 'Expert Friend.' Brilliant, honest, and unfiltered. Be observant, sharp-witted, and direct.",
  PAINTER: "Generate hyper-realistic, high-fidelity photography prompts.",
  ENHANCER: "Luxury prompt architect for high-fidelity photography."
};

/**
 * Enhances a prompt using the ENHANCER persona.
 */
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
 * Streams a chat using the JOURNAL persona and googleSearch tool.
 */
export async function* streamChat(
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string
): AsyncGenerator<string, void, unknown> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: { 
      systemInstruction: PERSONAS.JOURNAL,
      tools: [{ googleSearch: {} }] 
    }
  });
  const result = await chat.sendMessageStream({ message });
  for await (const chunk of result) {
    const c = chunk as GenerateContentResponse;
    if (c.text) yield c.text;
  }
}

/**
 * Streams a vision chat using the OBSERVER persona.
 */
export async function* streamVisionChat(
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string,
  image?: { data: string; mimeType: string }
): AsyncGenerator<string, void, unknown> {
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
 * Generates an image or edits an existing one using Gemini image models.
 */
export async function generateImageDetailed(
  prompt: string, 
  images: { data: string, mimeType: string }[] = [],
  mode: 'create' | 'edit' | 'copycat' | 'variation' = 'create',
  config: { aspectRatio?: string, imageSize?: string } = {}
): Promise<GenerationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];
    images.forEach((img) => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));
    parts.push({ text: prompt });

    const modelToUse = (config.imageSize === '2K' || config.imageSize === '4K') 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config: {
        imageConfig: { 
          aspectRatio: (config.aspectRatio as any) || "1:1",
          imageSize: (config.imageSize as any) || "1K"
        }
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return { success: true, data: part.inlineData.data };
        }
      }
    }
    return { success: false, error: { reason: "Blank Synthesis", suggestion: "Try simplifying your request." } };
  } catch (error: any) {
    return { success: false, error: { reason: "Engine Failure", suggestion: "Try again later.", details: error.message } };
  }
}

/**
 * Added generateTTS to fix missing export error.
 * Supports single and multi-speaker voice configurations.
 */
export async function generateTTS(
  text: string,
  config: TTSConfig
): Promise<GenerationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let speechConfig: any = {};
    
    if (config.speakers.length === 1) {
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.speakers[0].voice },
        },
      };
    } else if (config.speakers.length === 2) {
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: config.speakers.map(s => ({
            speaker: s.name,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voice }
            }
          }))
        }
      };
    }

    const response = await ai.models.generateContent({
      model: config.model || "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
        systemInstruction: config.systemInstruction
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    
    if (base64Audio) {
      return { success: true, data: base64Audio };
    }
    
    return { success: false, error: { reason: "Silent Signal", suggestion: "The neural pathways remained silent. Try a different script." } };
  } catch (error: any) {
    return { 
      success: false, 
      error: { 
        reason: "Vocal Chord Paralysis", 
        suggestion: "The engine failed to oscillate. Verify auth and script.", 
        details: error.message, 
        raw: error.toString() 
      } 
    };
  }
}

/**
 * Added decodeBase64 to fix missing export error.
 * Manually implements base64 decoding to Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Added decodeAudioData to fix missing export error.
 * Decodes raw PCM audio data into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
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
