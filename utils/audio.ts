
import type { LiveSession } from "../services/geminiService";
import type { Blob } from "@google/genai";

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
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

// For single, complete audio files (e.g., TTS button)
let ttsAudioContext: AudioContext | null = null;
export const playCompleteAudio = async (base64Audio: string) => {
    if (!ttsAudioContext) {
        ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ttsAudioContext,
        24000,
        1,
    );

    const source = ttsAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ttsAudioContext.destination);
    source.start();
};


// For real-time streaming audio from Live API
let liveOutputAudioContext: AudioContext | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();
export let outputAnalyser: AnalyserNode | null = null;

const getLiveOutputAudioContext = () => {
    if (!liveOutputAudioContext) {
        liveOutputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAnalyser = liveOutputAudioContext.createAnalyser();
        outputAnalyser.fftSize = 256;
        nextStartTime = 0;
        sources.clear();
    }
    return liveOutputAudioContext;
}

export const initializeAudioContext = async () => {
    const ctx = getLiveOutputAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
};

export const interruptStreamedAudio = () => {
    if (!liveOutputAudioContext) return;

    for (const source of sources.values()) {
        source.stop();
        sources.delete(source);
    }
    // By resetting start time, the next audio chunk will play immediately
    // without being queued after silent, interrupted chunks.
    nextStartTime = 0;
}

export const playStreamedAudio = async (base64Audio: string, onStart?: () => void) => {
    const ctx = getLiveOutputAudioContext();
    if (!outputAnalyser) return;
    
    nextStartTime = Math.max(nextStartTime, ctx.currentTime);
    
    const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAnalyser);
    outputAnalyser.connect(ctx.destination);
    
    source.addEventListener('ended', () => {
        sources.delete(source);
    });

    const startDelay = nextStartTime - ctx.currentTime;
    if (onStart) {
        if (startDelay > 0) {
            setTimeout(() => onStart(), startDelay * 1000);
        } else {
            onStart();
        }
    }

    source.start(nextStartTime);
    nextStartTime += audioBuffer.duration;
    sources.add(source);
}

export const stopAllAudio = () => {
    for (const source of sources.values()) {
        source.stop();
        sources.delete(source);
    }
    nextStartTime = 0;
    if (liveOutputAudioContext) {
        const ctx = liveOutputAudioContext;
        liveOutputAudioContext = null;
        outputAnalyser = null;
        ctx.close().catch(e => console.error("Error closing audio context:", e));
    }
};

// For streaming microphone input to Live API
let inputAudioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let muteNode: GainNode | null = null;
export let inputAnalyser: AnalyserNode | null = null;

export const startMicrophoneStream = async (sessionPromise: Promise<LiveSession>) => {
    try {
        if (!inputAudioContext) {
            inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        
        if (inputAudioContext.state === 'suspended') {
            await inputAudioContext.resume();
        }
        
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const source = inputAudioContext.createMediaStreamSource(mediaStream);
        scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        inputAnalyser = inputAudioContext.createAnalyser();
        inputAnalyser.fftSize = 256;
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`.
            sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        };

        source.connect(inputAnalyser);
        inputAnalyser.connect(scriptProcessor);
        
        // Workaround for browsers: ScriptProcessorNode often stops firing if not connected to destination.
        // We connect it to a mute node, then to destination, to keep the audio clock running without feedback.
        muteNode = inputAudioContext.createGain();
        muteNode.gain.value = 0;
        scriptProcessor.connect(muteNode);
        muteNode.connect(inputAudioContext.destination);

    } catch (error) {
        console.error("Microphone access error:", error);
        throw error; // Propagate error to be handled by the caller
    }
};

export const stopMicrophoneStream = () => {
    mediaStream?.getTracks().forEach(track => track.stop());
    scriptProcessor?.disconnect();
    muteNode?.disconnect();
    inputAudioContext?.close().then(() => {
        inputAudioContext = null;
        inputAnalyser = null;
        scriptProcessor = null;
        muteNode = null;
    });
    mediaStream = null;
}
