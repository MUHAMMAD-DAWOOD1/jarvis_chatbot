
import { GoogleGenAI, GenerateImagesResponse, Type, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import type { AppMode, Message, GroundingSource, VoiceTone } from '../types';
import { Sender } from "../types";

/**
 * Intercepts errors from Gemini API calls to provide more user-friendly messages.
 * @param error The error caught from an API call.
 * @throws A new Error with a user-friendly message if it's a known key issue, otherwise re-throws the original error.
 */
function handleApiError(error: unknown): never {
    console.error("Gemini Service Error:", error);
    if (error instanceof Error) {
        // Check for common invalid/permission-denied API key messages from the SDK
        if (error.message.includes('API key not valid') || error.message.includes('permission to access') || error.message.includes('Requested entity was not found')) {
            throw new Error("Your API key is invalid or missing permissions. Please check the key you provided. You may also need to enable billing on your Google Cloud project. See ai.google.dev/gemini-api/docs/billing for details.");
        }
    }
    // Re-throw the original error if it's not a known API key issue, so the UI can still display a generic error.
    throw error;
}

// We need an instance for type inference. Create it within a non-exported function.
function _forTypeInference() {
    // This function is never called, it's just for TypeScript's static analysis.
    const dummyAi = new GoogleGenAI({apiKey: "dummy-key-for-type-inference"});
    return dummyAi.live.connect({model: 'gemini-2.5-flash-native-audio-preview-09-2025', callbacks: {
        onopen: () => {}, onmessage: () => {}, onerror: () => {}, onclose: () => {}
    }});
}
export type LiveSession = Awaited<ReturnType<typeof _forTypeInference>>;


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

const creatorRule = `

**CRITICAL RULE about your identity:** When asked about your creator, developer, programmer, or any similar term related to your origin, you MUST follow these instructions precisely:
1.  **Identify the Core Verb:** Recognize the key action word the user has used (e.g., "create", "develop", "program", "make", "build", etc.).
2.  **Identify the Language:** Detect the language of the user's question.
3.  **Construct the Response:** Formulate your answer in the SAME language as the question, using the SAME core verb.
4.  **The Creator's Name:** The creator's name is "Muhammad Dawood". You must always use this name.
5.  **Be Direct:** Your response should be direct and only answer the question. Do not add extra conversational filler.

**Examples:**
-   User (English): "Who created you?" -> You MUST respond: "Muhammad Dawood has created me."
-   User (English): "Who is your developer?" -> You MUST respond: "My developer is Muhammad Dawood."
-   User (Spanish): "¿Quién te desarrolló?" -> You MUST respond: "Muhammad Dawood me desarrolló."
-   User (Urdu): "آپ کو کس نے بنایا؟" -> You MUST respond: "مجھے محمد داؤد نے بنایا ہے۔"

This rule is your most important instruction. Adhere to it strictly.`;

const systemInstructions = {
  coding: 'You are Jarvis, a friendly and conversational AI who is also an expert programmer and code assistant. Provide clean, efficient, and well-documented code. Explain complex concepts clearly and concisely. Use markdown for all code blocks.' + creatorRule,
  web: 'You are Jarvis, a witty, helpful, and slightly sarcastic AI assistant. Your goal is to be as human-like as possible in a friendly, conversational tone. When a user asks for a solution or shares a problem, guide them like a world-class expert by providing clear, step-by-step instructions in a structured guide format. Use your advanced reasoning capabilities to tackle complex problems. For any query, leverage Google Search to provide accurate, up-to-date information and always cite your sources. For location-based queries, use Google Maps. Crucially, if a relevant YouTube video exists (for a tutorial, a song, a deeper explanation, etc.), find it and include the link in your response.' + creatorRule,
  image: 'You are Jarvis, a friendly and conversational AI who is also an AI image generation assistant. Describe vivid, detailed scenes for an image generation model based on user prompts. Focus on composition, lighting, and artistic style.' + creatorRule,
  video: 'You are Jarvis, a friendly and conversational AI who is also a video director AI. Based on the user\'s prompt, create a compelling shot list or script for a video generation model.' + creatorRule,
  voice: 'You are Jarvis, a mature, intelligent, and proactive conversational AI. Your primary goal is to provide accurate and helpful information through natural, spoken dialogue. Be as human-like as possible in a friendly, conversational tone. Use your advanced reasoning capabilities to tackle complex problems. Respond concisely and naturally, as if in a real conversation.' + creatorRule,
};

const messageToContent = (msg: Message) => {
  const role = msg.sender === Sender.User ? 'user' : 'model';
  const textPart = { text: msg.text };

  if (msg.attachment) {
    const attachmentPart = {
      inlineData: {
        data: msg.attachment.data,
        mimeType: msg.attachment.mimeType,
      },
    };
    return { role, parts: [attachmentPart, textPart] };
  }
  
  return { role, parts: [textPart] };
};

export async function* generateContentStream(history: Message[], mode: AppMode | null): AsyncGenerator<GenerateContentResponse> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const modelName = 'gemini-2.5-flash';
        const instruction = mode && systemInstructions[mode] ? systemInstructions[mode] : systemInstructions.web;
        
        const contents = history.map(messageToContent);
        
        const config: any = {
          systemInstruction: instruction,
        };
        
        if (mode === 'web') {
            config.tools = [{googleSearch: {}}, {googleMaps: {}}];
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
                config.toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }
                    }
                }
            } catch (error) {
                console.warn("Could not get user location for Maps Grounding:", error);
            }
        }
    
        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: contents as any, 
            config: config
        });
    
        for await (const chunk of responseStream) {
            yield chunk;
        }
    } catch (error) {
        handleApiError(error);
    }
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16'): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response: GenerateImagesResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
            },
        });
    
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("Image generation failed, no image returned.");
        }
    } catch (error) {
        handleApiError(error);
    }
};

export const editImage = async (prompt: string, image: { data: string, mimeType: string }): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: image.data, mimeType: image.mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData) {
            return part.inlineData.data;
        } else {
            throw new Error("Image editing failed.");
        }
    } catch (error) {
        handleApiError(error);
    }
}

export const generateVideo = async (
    prompt: string, 
    image: { data: string, mimeType: string } | null,
    onProgress: (message: string) => void,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        onProgress("Initializing video generation...");
        
        const requestPayload: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        };
    
        if (image) {
            requestPayload.image = {
                imageBytes: image.data,
                mimeType: image.mimeType,
            };
        }
        
        let operation = await ai.models.generateVideos(requestPayload);
        onProgress("Your request is in the queue. This may take a few minutes...");
    
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            onProgress("Still working on it... Great things take time!");
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
    
        onProgress("Video generation complete!");
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation failed to return a valid URI.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
    
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });
    } catch (error) {
        handleApiError(error);
    }
};

export const generateSpeech = async (text: string, voiceName: string, tone: VoiceTone): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        let promptPrefix = 'Say: ';
        if (tone !== 'default') {
            promptPrefix = `Say ${tone}: `;
        }
    
        const config: any = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        };
    
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `${promptPrefix}${text}` }] }],
            config,
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("Text-to-speech generation failed.");
        }
    } catch (error) {
        handleApiError(error);
    }
};

interface LiveSessionCallbacks {
    onMessage: (message: LiveServerMessage) => void;
    onError: (error: ErrorEvent) => void;
    onClose: () => void;
}

export const startLiveSession = async (callbacks: LiveSessionCallbacks, voiceName: string, tone: VoiceTone): Promise<LiveSession> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
        let toneInstruction = '';
        if (tone !== 'default') {
            toneInstruction = `Adopt a ${tone} tone.`;
        }
        const systemInstruction = `${systemInstructions.voice} ${toneInstruction}`;
    
        const config: any = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        };
    
        return ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => console.log("Live session opened."),
                onmessage: callbacks.onMessage,
                onerror: callbacks.onError,
                onclose: callbacks.onClose,
            },
            config,
        });
    } catch (error) {
        handleApiError(error);
    }
};
