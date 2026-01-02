
export enum Sender {
  User = 'USER',
  Bot = 'BOT',
  System = 'SYSTEM',
}

// FIX: Add 'complex' to AppMode to allow for advanced reasoning mode.
// FIX: Add 'music' to AppMode to support the new Music mode.
export type AppMode = 'coding' | 'web' | 'image' | 'video';

// FIX: Define and export the Attachment interface to be used across the application.
export interface Attachment {
  file: File;
  previewUrl: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: number;
  text: string;
  sender: Sender;
  imageUrl?: string;
  videoUrl?: string;
  sources?: GroundingSource[];
  // For attachments in user messages, not for rendering
  attachment?: {
    data: string; // base64
    mimeType: string;
  }
}

export type VoiceTone = 'default' | 'cheerful' | 'formal' | 'calm';

export type VoiceProfile = {
  id: string;
  name: string;
  icon: string;
  voiceId: string;
  tone: VoiceTone;
};

export interface TranscriptEntry {
  sender: Sender;
  text: string;
}

export interface User {
  id: string;
  username: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  preview: string;
}
