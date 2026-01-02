
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateContentStream, generateImage, generateVideo, editImage, generateSpeech, startLiveSession } from './services/geminiService';
import type { LiveSession } from './services/geminiService';
import type { Message, AppMode, Attachment, GroundingSource, VoiceProfile, TranscriptEntry, User, ChatSession } from './types';
import { Sender } from './types';
import ChatHistory from './components/ChatHistory';
import ChatInput from './components/ChatInput';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import ImmersiveVoiceUI from './components/ImmersiveVoiceUI';
import Sidebar from './components/Sidebar';
import { interruptStreamedAudio, playCompleteAudio, playStreamedAudio, startMicrophoneStream, stopAllAudio, stopMicrophoneStream, initializeAudioContext } from './utils/audio';
import type { LiveServerMessage } from '@google/genai';
import NavBar from './components/NavBar';
import SplashScreen from './components/SplashScreen';
import RateLimitModal from './components/RateLimitModal';
import { checkUsage, incrementUsage } from './utils/rateLimiter';
import Auth from './components/Auth';
import { getCurrentUser, logout } from './services/authService';
import { getSessions, getSessionMessages, saveSession, deleteSession } from './services/chatHistoryService';
import { getSmartGreeting } from './utils/greetingUtils';

const suggestionChips = [
    'Write a first draft',
    'Get advice',
    'Learn something new',
    'Create an image',
    'Make a plan',
];

const modes: { id: AppMode, label: string }[] = [
    { id: 'coding', label: 'Coding' },
    { id: 'image', label: 'Image' },
    { id: 'video', label: 'Video' },
];

const voiceProfiles: VoiceProfile[] = [
  { id: 'ava-cheerful', name: 'Ava', icon: '😊', voiceId: 'Zephyr', tone: 'cheerful' },
  { id: 'chloe-calm', name: 'Chloe', icon: '🧘‍♀️', voiceId: 'Kore', tone: 'calm' },
  { id: 'liam-default', name: 'Liam', icon: '💬', voiceId: 'Puck', tone: 'default' },
  { id: 'noah-formal', name: 'Noah', icon: '🧑‍🏫', voiceId: 'Charon', tone: 'formal' },
  { id: 'leo-default', name: 'Leo', icon: '🗣️', voiceId: 'Fenrir', tone: 'default' },
];


const ModeButton: React.FC<{ label: string, onClick: () => void, isSelected: boolean, key?: any, disabled?: boolean, title?: string }> = ({ label, onClick, isSelected, disabled, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`border rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
            isSelected 
            ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {label}
    </button>
);

const SuggestionChip: React.FC<{ text: string, onClick: (text: string) => void, key?: any }> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/80 transition-colors"
    >
        {text}
    </button>
);

const AspectRatioSelector: React.FC<{ selected: string, onSelect: (val: string) => void }> = ({ selected, onSelect }) => (
    <div className="flex items-center justify-center gap-2 my-4 animate-fadeIn">
        {['1:1', '16:9', '9:16'].map(ratio => (
            <button 
                key={ratio}
                onClick={() => onSelect(ratio)}
                className={`px-3 py-1 text-xs border rounded-md transition-colors ${selected === ratio ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
            >
                {ratio}
            </button>
        ))}
    </div>
);

const VideoAspectRatioSelector: React.FC<{ selected: '16:9' | '9:16', onSelect: (val: '16:9' | '9:16') => void }> = ({ selected, onSelect }) => (
    <div className="flex items-center justify-center gap-2 my-4 animate-fadeIn">
        <p className="text-sm text-slate-400 mr-2">Aspect Ratio:</p>
        {(['16:9', '9:16'] as const).map(ratio => (
            <button 
                key={ratio}
                onClick={() => onSelect(ratio)}
                className={`px-3 py-1 text-xs border rounded-md transition-colors ${selected === ratio ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
            >
                {ratio === '16:9' ? 'Landscape' : 'Portrait'}
            </button>
        ))}
    </div>
);

const InsecureContextWarning: React.FC = () => (
    <div className="bg-orange-900/50 border border-orange-700 text-orange-300 px-4 py-3 rounded-lg mb-4 max-w-4xl mx-auto text-sm animate-fadeIn" role="alert">
        <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l5.25 10.002c.622 1.186-.28 2.649-1.503 2.649H4.504c-1.223 0-2.125-1.463-1.503-2.649l5.25-10.002zM10 12a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
            <div>
                <strong className="font-bold">Insecure Connection:</strong>
                <span className="block sm:inline ml-1">Voice features are disabled. Please use an HTTPS connection to enable microphone access.</span>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showSplash, setShowSplash] = useState<boolean>(true);
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [appMode, setAppMode] = useState<AppMode>('web');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(voiceProfiles[0].id);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [isSecureContext, setIsSecureContext] = useState<boolean>(false);
    const [rateLimitInfo, setRateLimitInfo] = useState<{isLimited: boolean, resetTime: string | null}>({ isLimited: false, resetTime: null });
    const [liveTranscript, setLiveTranscript] = useState('');
    const [voiceStatus, setVoiceStatus] = useState<'listening' | 'speaking' | 'idle' | 'processing'>('idle');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [greeting, setGreeting] = useState("Hello");

    // Ref to track voice status synchronously for audio callbacks
    const voiceStatusRef = useRef<'listening' | 'speaking' | 'idle' | 'processing'>('idle');
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const transcriptRef = useRef<TranscriptEntry[]>([]);

    const selectedProfile = useMemo(() => voiceProfiles.find(p => p.id === selectedProfileId)!, [selectedProfileId]);
    
    const backgroundClass = useMemo(() => {
        if (!hasStartedChat || isVoiceSessionActive) {
            return 'bg-live-gradient';
        }
        return `bg-mode-${appMode}`;
    }, [hasStartedChat, isVoiceSessionActive, appMode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Fetch smart greeting on mount
    useEffect(() => {
        getSmartGreeting().then(setGreeting);
    }, []);

    useEffect(() => {
        setIsSecureContext(window.isSecureContext);
        setCurrentUser(getCurrentUser());
        setIsInitializing(false);
    }, []);

    // Load sessions when user logs in
    useEffect(() => {
        if (currentUser) {
            const loadedSessions = getSessions(currentUser.id);
            setSessions(loadedSessions);
            
            // If sessions exist, load the most recent one? No, start fresh or let user pick. 
            // Let's start fresh for now as per typical flow, unless user clicks history.
            setMessages([]);
            setHasStartedChat(false);
            setCurrentSessionId(null);
        }
    }, [currentUser]);
    
    // Auto-save session when messages change
    useEffect(() => {
        if (currentUser && currentSessionId && messages.length > 0) {
            // Don't save if it's just the empty bot placeholder
            const hasRealContent = messages.some(m => m.text.trim() !== '');
            if (hasRealContent) {
                 const updatedSession = saveSession(currentUser.id, currentSessionId, messages);
                 // Update the sessions list to reflect title/preview changes
                 setSessions(prev => {
                     const idx = prev.findIndex(s => s.id === updatedSession.id);
                     if (idx !== -1) {
                         const newArr = [...prev];
                         newArr[idx] = updatedSession;
                         // Re-sort by recency
                         return newArr.sort((a, b) => b.updatedAt - a.updatedAt);
                     }
                     return [updatedSession, ...prev];
                 });
            }
        }
    }, [messages, currentUser, currentSessionId]);


    useEffect(() => {
        document.body.className = '';
        document.body.classList.add(theme);
    }, [theme]);
    
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
        setHasStartedChat(false);
        setMessages([]);
        setSessions([]);
        setCurrentSessionId(null);
    };

    const handleThemeToggle = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const handleNewChatClick = useCallback(() => {
        setHasStartedChat(false);
        setMessages([]);
        setAppMode('web');
        setCurrentSessionId(null);
        if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile on selection
    }, []);
    
    const handleSelectSession = useCallback((sessionId: string) => {
        const msgs = getSessionMessages(sessionId);
        setMessages(msgs);
        setCurrentSessionId(sessionId);
        setHasStartedChat(true);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, []);

    const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!currentUser) return;
        deleteSession(currentUser.id, sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        
        if (currentSessionId === sessionId) {
            handleNewChatClick();
        }
    }, [currentUser, currentSessionId, handleNewChatClick]);

    const callGeminiAPI = useCallback(async (currentMessages: Message[], userMessage: Message, botMessageId?: number) => {
        setIsLoading(true);
        if (appMode === 'image') {
            setLoadingMessage(attachment ? 'Applying creative edits...' : 'Generating your masterpiece...');
        } else if (appMode === 'video') {
            setLoadingMessage('Directing your video, action!');
        } else if (appMode === 'coding') {
            setLoadingMessage("Working on the code...");
        } else {
            setLoadingMessage("Thinking...");
        }

        try {
            if (appMode === 'image') {
                const imageB64 = attachment 
                    ? await editImage(userMessage.text, userMessage.attachment!)
                    : await generateImage(userMessage.text, aspectRatio as any);
                const imageUrl = `data:image/png;base64,${imageB64}`;
                setMessages(prev => [...prev, {
                    id: Date.now() + 1, text: `Here is the image I created for you.`, sender: Sender.Bot, imageUrl
                }]);
            } else if (appMode === 'video') {
                const videoDataUrl = await generateVideo(
                    userMessage.text, 
                    userMessage.attachment ? { data: userMessage.attachment.data, mimeType: userMessage.attachment.mimeType } : null,
                    setLoadingMessage,
                    videoAspectRatio
                );
                setMessages(prev => [...prev, {
                    id: Date.now() + 1, text: `Here is the video I generated.`, sender: Sender.Bot, videoUrl: videoDataUrl
                }]);
            } else {
                 if (!botMessageId) {
                     throw new Error("botMessageId not provided for text-based chat mode.");
                 }
                 const stream = generateContentStream(currentMessages, appMode);

                 for await (const chunk of stream) {
                     setMessages(prev => prev.map(msg => {
                         if (msg.id === botMessageId) {
                             const updatedMsg = { ...msg };
                             updatedMsg.text += chunk.text;
                             
                             const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                             if (groundingChunks) {
                                const newSources: GroundingSource[] = groundingChunks
                                    .map((c: any) => {
                                        const source = c.web || c.maps;
                                        return source ? { title: source.title, uri: source.uri } : null;
                                    })
                                    .filter((s: any): s is GroundingSource => s !== null);

                                 const existingUris = new Set(updatedMsg.sources?.map(s => s.uri));
                                 newSources.forEach(source => {
                                     if (!existingUris.has(source.uri)) {
                                         updatedMsg.sources?.push(source);
                                         existingUris.add(source.uri);
                                     }
                                 });
                             }
                             return updatedMsg;
                         }
                         return msg;
                     }));
                 }
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => {
                const filtered = botMessageId ? prev.filter(m => m.id !== botMessageId) : prev;
                return [...filtered, { id: Date.now() + 1, text: `I seem to be having trouble. ${errorMessage}`, sender: Sender.Bot }];
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [appMode, attachment, aspectRatio, videoAspectRatio]);


    const handleSendMessage = useCallback(async (text: string) => {
        if (!currentUser) return;
        const usageStatus = checkUsage(currentUser.id);
        if (!usageStatus.isAllowed && usageStatus.resetTime) {
            setRateLimitInfo({
                isLimited: true,
                resetTime: usageStatus.resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            return;
        }

        if (!text.trim() && !attachment || isLoading) return;
        
        incrementUsage(currentUser.id);
        setHasStartedChat(true);
        
        // Handle Session Creation
        let activeSessionId = currentSessionId;
        let isNewSession = false;
        if (!activeSessionId) {
            activeSessionId = `session_${Date.now()}`;
            setCurrentSessionId(activeSessionId);
            isNewSession = true;
        }
        
        setSearchQuery('');
        const userMessage: Message = { 
            id: Date.now(),
            text, 
            sender: Sender.User,
            attachment: attachment ? { data: await attachment.file.text(), mimeType: attachment.file.type } : undefined,
        };
        
        setAttachment(null);

        const historyForApi = [...messages, userMessage];
        
        // Save new session immediately to list with title
        if (isNewSession) {
             const title = text.length > 30 ? text.substring(0, 30) + "..." : text;
             const newSession = saveSession(currentUser.id, activeSessionId, [userMessage], title);
             setSessions(prev => [newSession, ...prev]);
        }

        if (appMode === 'image' || appMode === 'video') {
            setMessages(historyForApi);
            callGeminiAPI(historyForApi, userMessage);
        } else {
            const botMessageId = Date.now() + 1;
            const emptyBotMessage: Message = { id: botMessageId, text: '', sender: Sender.Bot, sources: [] };
            setMessages([...historyForApi, emptyBotMessage]);
            callGeminiAPI(historyForApi, userMessage, botMessageId);
        }
    }, [messages, isLoading, attachment, appMode, callGeminiAPI, currentUser, currentSessionId]);

    const handleEditAndSubmit = useCallback(async (messageId: number, newText: string) => {
        if (!currentUser) return;
        const usageStatus = checkUsage(currentUser.id);
        if (!usageStatus.isAllowed && usageStatus.resetTime) {
            setRateLimitInfo({
                isLimited: true,
                resetTime: usageStatus.resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            return;
        }

        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        incrementUsage(currentUser.id);

        const historyToKeep = messages.slice(0, messageIndex);
        
        const editedUserMessage: Message = {
            id: Date.now(),
            text: newText,
            sender: Sender.User
        };
        
        const historyForApi = [...historyToKeep, editedUserMessage];
        
        const botMessageId = Date.now() + 1;
        const emptyBotMessage: Message = { id: botMessageId, text: '', sender: Sender.Bot, sources: [] };
        setMessages([...historyForApi, emptyBotMessage]);

        callGeminiAPI(historyForApi, editedUserMessage, botMessageId);

    }, [messages, callGeminiAPI, currentUser]);
    
    const handlePlayAudio = useCallback(async (text: string) => {
        try {
            const audioData = await generateSpeech(text, selectedProfile.voiceId, selectedProfile.tone);
            await playCompleteAudio(audioData);
        } catch (error)
 {
            console.error("TTS error:", error);
            alert("Sorry, I couldn't generate the audio for that.");
        }
    }, [selectedProfile]);

    const handleSuggestionClick = (text: string) => {
        if (text === 'Create an image') {
            setAppMode('image');
            if (!hasStartedChat) {
                setHasStartedChat(true);
            }
            return;
        }
        handleSendMessage(text);
    };

    const handleAttachmentChange = (newAttachment: Attachment | null) => {
        setAttachment(newAttachment);
    };
    
    // Synchronize Ref with State for use in callbacks
    useEffect(() => {
        voiceStatusRef.current = voiceStatus;
    }, [voiceStatus]);

    const handleStartVoiceSession = useCallback(async () => {
        if (!isSecureContext || !currentUser) {
            console.warn("Attempted to start voice session in an insecure context or without a user.");
            return;
        }

        await initializeAudioContext();

        const usageStatus = checkUsage(currentUser.id);
        if (!usageStatus.isAllowed && usageStatus.resetTime) {
            setRateLimitInfo({
                isLimited: true,
                resetTime: usageStatus.resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            return;
        }

        transcriptRef.current = [];
        setLiveTranscript("Initializing...");
        setVoiceStatus('idle');
        voiceStatusRef.current = 'idle';
        
        const onMessage = (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            const textData = message.serverContent?.outputTranscription?.text;

            if (audioData) {
                // Pass a callback to be executed exactly when this audio chunk starts playing
                playStreamedAudio(audioData, () => {
                    setVoiceStatus('speaking');
                    
                    // Synchronization logic:
                    // If we were not speaking before (i.e., switching from listening to speaking),
                    // we should clear the previous transcript (the user's query) and start the new bot response.
                    setLiveTranscript(prev => {
                        if (voiceStatusRef.current !== 'speaking') {
                            // We just started speaking.
                            voiceStatusRef.current = 'speaking';
                            return textData || '';
                        }
                        // We are continuing to speak, append the text.
                        return prev + (textData || '');
                    });
                });
            } else if (textData) {
                 // Received text without audio (rare for output, but possible). 
                 // If we are currently speaking, append it.
                 if (voiceStatusRef.current === 'speaking') {
                     setLiveTranscript(prev => prev + textData);
                 }
            }

            if (message.serverContent?.interrupted) {
                interruptStreamedAudio();
                setVoiceStatus('listening');
            }
            
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                if (text) {
                    setVoiceStatus('listening');
                    setLiveTranscript(text);
                }
            }
            
            if (message.serverContent?.turnComplete) {
                setVoiceStatus('listening');
            }
        };

        const onError = (e: ErrorEvent) => {
            console.error("Live session error:", e);
            setIsVoiceSessionActive(false);
        };
        
        const onClose = () => {
            stopMicrophoneStream();
            stopAllAudio();
            setIsVoiceSessionActive(false);
            setVoiceStatus('idle');
            setLiveTranscript("");
        };

        try {
            sessionPromiseRef.current = startLiveSession({ onMessage, onError, onClose }, selectedProfile.voiceId, selectedProfile.tone);
            await startMicrophoneStream(sessionPromiseRef.current);
            incrementUsage(currentUser.id);
            setIsVoiceSessionActive(true);
            if (!hasStartedChat) setHasStartedChat(true);
        } catch (error) {
            console.error("Failed to start voice session:", error);
            const msg = error instanceof Error ? error.message : "Could not start microphone. Please check permissions.";
            alert(msg);
        }
    }, [hasStartedChat, selectedProfile, isSecureContext, currentUser]);

    const handleStopVoiceSession = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
    }, []);

    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        try {
            const regex = new RegExp(searchQuery, 'i');
            return messages.filter(msg => msg.text && regex.test(msg.text));
        } catch (e) {
            return messages;
        }
    }, [messages, searchQuery]);

    const renderContent = () => {
        if (isInitializing) {
            return null; 
        }
        
        if (!currentUser) {
            return <Auth onLoginSuccess={handleLoginSuccess} />;
        }

        return (
            <div className={`app-container relative min-h-screen flex flex-col md:flex-row ${backgroundClass} transition-all duration-500`}>
                <NavBar 
                    user={currentUser} 
                    onLogout={handleLogout} 
                    onNewChatClick={handleNewChatClick} 
                    theme={theme} 
                    onThemeToggle={handleThemeToggle} 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />
                
                <Sidebar 
                    isOpen={isSidebarOpen}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChatClick}
                    onDeleteSession={handleDeleteSession}
                    theme={theme}
                />

                <div className="flex-1 flex flex-col w-full md:w-auto min-w-0 md:h-screen transition-all duration-300">
                    {hasStartedChat && <Header appMode={isVoiceSessionActive ? null : appMode} searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
                    
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
                        {!isSecureContext && <InsecureContextWarning />}
                        
                        { hasStartedChat ? (
                            <ChatHistory messages={filteredMessages} isLoading={isLoading} searchQuery={searchQuery} onPlayAudio={handlePlayAudio} onEditSubmit={handleEditAndSubmit} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="animate-fadeIn">
                                    <h1 className="text-3xl sm:text-5xl font-bold text-slate-100">{greeting}, {currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)}</h1>
                                    <p className="mt-2 text-lg sm:text-xl text-slate-500">How can I help you today?</p>
                                </div>

                                <div className="my-8 w-full max-w-2xl animate-fadeIn animate-fadeIn-delay-2">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {modes.map(mode => (
                                            <ModeButton
                                                key={mode.id}
                                                label={mode.label}
                                                isSelected={appMode === mode.id}
                                                onClick={() => setAppMode(mode.id)}
                                            />
                                        ))}
                                    </div>
                                    {appMode === 'image' && <AspectRatioSelector selected={aspectRatio} onSelect={setAspectRatio} />}
                                    {appMode === 'video' && <VideoAspectRatioSelector selected={videoAspectRatio} onSelect={setVideoAspectRatio} />}
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fadeIn animate-fadeIn-delay-3">
                                    {suggestionChips.map(chip => (
                                        <SuggestionChip key={chip} text={chip} onClick={handleSuggestionClick} />
                                    ))}
                                </div>

                                <div className="w-full max-w-md mx-auto animate-fadeIn animate-fadeIn-delay-4 pb-20 md:pb-0">
                                    <ChatInput
                                        onSendMessage={handleSendMessage}
                                        disabled={isLoading}
                                        placeholder="Or just start typing..."
                                        attachment={attachment}
                                        onAttachmentChange={handleAttachmentChange}
                                        appMode={appMode}
                                        isSecureContext={isSecureContext}
                                        onStartVoiceSession={handleStartVoiceSession}
                                    />
                                </div>
                            </div>
                        ) }
                    </main>

                    {hasStartedChat && (
                        <div className="mt-auto w-full max-w-4xl mx-auto px-4 md:px-0 pb-20 md:pb-4">
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                disabled={isLoading || isVoiceSessionActive}
                                placeholder={appMode === 'image' ? "Describe the image you want to create or edit..." : "Ask Jarvis anything..."}
                                attachment={attachment}
                                onAttachmentChange={handleAttachmentChange}
                                appMode={appMode}
                                isSecureContext={isSecureContext}
                                onStartVoiceSession={handleStartVoiceSession}
                            />
                        </div>
                    )}
                </div>

                { isVoiceSessionActive && <ImmersiveVoiceUI onStop={handleStopVoiceSession} status={voiceStatus} theme={theme} transcript={liveTranscript} /> }
                { isLoading && loadingMessage && (appMode === 'image' || appMode === 'video') && <LoadingOverlay message={loadingMessage} /> }
            </div>
        );
    }
    
    return (
        <>
            {showSplash && <SplashScreen />}
            {!showSplash && (
              <>
                {rateLimitInfo.isLimited && rateLimitInfo.resetTime && (
                    <RateLimitModal
                        resetTime={rateLimitInfo.resetTime}
                        onClose={() => setRateLimitInfo({ isLimited: false, resetTime: null })}
                    />
                )}
                {renderContent()}
              </>
            )}
        </>
    );
};

export default App;
