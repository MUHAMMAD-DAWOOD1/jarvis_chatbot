
import React, { useState, useRef, useEffect } from 'react';
// FIX: Import Attachment type from the central types file.
import type { AppMode, Attachment } from '../types';

// REMOVED: Local definition of Attachment is no longer needed.

// FIX: Define an interface for the SpeechRecognition API to resolve TypeScript errors.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  attachment: Attachment | null;
  onAttachmentChange: (attachment: Attachment | null) => void;
  appMode: AppMode;
  isSecureContext: boolean;
  onStartVoiceSession: () => void;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
);
const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
);
const VoiceChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10v4" />
        <path d="M12 8v8" />
        <path d="M17 6v12" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);

// Utility to convert file to base64 for message passing
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder, attachment, onAttachmentChange, appMode, isSecureContext, onStartVoiceSession }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [justBecameSendable, setJustBecameSendable] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const wasSendable = useRef(false);
  const isSendable = text.trim() !== '' || !!attachment;

  useEffect(() => {
    if (isSendable && !wasSendable.current) {
        setJustBecameSendable(true);
        const timer = setTimeout(() => setJustBecameSendable(false), 500); // Duration of animation
        return () => clearTimeout(timer);
    }
    wasSendable.current = isSendable;
  }, [isSendable]);


  useEffect(() => {
    if (!isSecureContext || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        return;
    }

    // FIX: Use type assertion on window to access potentially prefixed SpeechRecognition API.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setText(finalTranscript + interimTranscript);
    };
    
    recognition.onend = () => {
        setIsListening(false);
        finalTranscript = '';
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
  }, [isSecureContext]);

  const handleSpeechToTextClick = () => {
    if (!isSecureContext) {
        alert("Speech-to-text requires a secure (HTTPS) connection.");
        return;
    }
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };
  
  const handleVoiceChatClick = () => {
    if (!isSecureContext) {
      alert("Voice chat requires a secure (HTTPS) connection.");
      return;
    }
    onStartVoiceSession();
  };

  const handleAttachmentClick = () => {
      fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const base64 = await fileToBase64(file);
          // Hack: store base64 in file.text() so it can be retrieved later in App.tsx
          Object.defineProperty(file, 'text', {
              value: async () => base64,
              writable: false
          });
          onAttachmentChange({ file, previewUrl: URL.createObjectURL(file) });
      }
      if(fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() || attachment) {
      onSendMessage(text);
      setText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  return (
    <div>
        {attachment && (
            <div className="mb-2 p-2 bg-slate-700/50 rounded-lg flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3">
                    <img src={attachment.previewUrl} alt="Attachment preview" className="w-12 h-12 rounded-md object-cover" />
                    <span className="text-sm text-slate-300 truncate">{attachment.file.name}</span>
                </div>
                <button onClick={() => onAttachmentChange(null)} className="p-1 rounded-full bg-slate-600 hover:bg-slate-500 text-white">
                    <CloseIcon />
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200 gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,text/plain,.md" className="hidden" />
            <button type="button" onClick={handleAttachmentClick} className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors" aria-label="Add file">
                <PlusIcon />
            </button>
            <textarea
                ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none resize-none px-2 py-2 max-h-48 text-base scrollbar-hide"
                rows={1} disabled={disabled}
            />
            <div className="flex items-center gap-1 self-end">
                 {isSendable ? (
                    <button
                        type="submit"
                        disabled={disabled}
                        className={`p-3 rounded-full bg-cyan-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-500 transition-all duration-200 transform hover:scale-110 ${justBecameSendable ? 'animate-pulse' : ''}`}
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                 ) : (
                    <>
                        <button type="button" onClick={handleSpeechToTextClick} disabled={disabled}
                            className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-700 ${!isSecureContext ? 'cursor-not-allowed opacity-50' : ''} ${isListening ? 'text-red-500 animate-mic-pulse' : ''}`}
                            aria-label="Use microphone for text"
                            title={!isSecureContext ? "Speech-to-text requires a secure (HTTPS) connection" : (isListening ? "Stop listening" : "Use microphone for text")}
                        >
                            <MicIcon />
                        </button>
                        <button type="button" onClick={handleVoiceChatClick} disabled={disabled}
                            className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-700 ${!isSecureContext ? 'cursor-not-allowed opacity-50' : ''}`}
                            aria-label="Start voice chat"
                            title={!isSecureContext ? "Voice chat requires a secure (HTTPS) connection" : "Start voice chat"}
                        >
                            <VoiceChatIcon />
                        </button>
                    </>
                 )}
            </div>
        </form>
    </div>
  );
};

export default ChatInput;
