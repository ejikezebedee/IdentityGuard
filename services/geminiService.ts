
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveServerMessage } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const geminiService = {
  /**
   * Core Chat for Identity Questions
   */
  async askIdentityAssistant(message: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction: "You are IdentityGuard Assistant, an expert in cybersecurity, digital privacy, and encryption. Provide accurate, safety-first advice on digital identity management.",
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "No response generated.";
  },

  /**
   * Search Grounding for Latest Security Threats
   */
  async searchSecurityThreats(query: string): Promise<{ text: string, sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  /**
   * Maps Grounding for Secure Locations
   */
  async findSecureOffices(lat: number, lng: number): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "What are some highly secure data centers or digital identity centers near me?",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });
    return response.text || "No locations found.";
  },

  /**
   * Image Generation: ID Card Visualization
   */
  async generateAliasVisual(prompt: string, aspectRatio: string = "1:1", size: string = "1K"): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A futuristic, secure digital identity card visual for the alias context: ${prompt}. Cyberpunk aesthetic, neon blue and indigo theme.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any
        }
      }
    });

    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  },

  /**
   * TTS: Voice Briefing
   */
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a professional and reassuring voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  /**
   * Video Generation using Veo
   */
  async generateSecurityHologram(prompt: string, isPortrait: boolean = false): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A 3D hologram of a rotating encrypted shield with glowing particles, theme: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: isPortrait ? '9:16' : '16:9'
      }
    });
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return `${downloadLink}&key=${API_KEY}`;
  },

  /**
   * Fast Response (Flash Lite)
   */
  async fastAnalysis(input: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Quickly summarize the security risk of this alias context: ${input}`,
    });
    return response.text || "";
  }
};
