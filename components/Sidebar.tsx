
import React from 'react';
import type { ChatSession } from '../types';

interface SidebarProps {
    isOpen: boolean;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
    theme: 'light' | 'dark';
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const ChatBubbleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, theme }) => {
    const isLight = theme === 'light';

    return (
        <div 
            className={`
                fixed md:relative z-40 flex-shrink-0 h-screen border-r 
                transition-all duration-300 ease-in-out overflow-hidden
                ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'}
                ${isLight ? 'bg-[#f1f5f9] border-slate-300' : 'bg-[#0B121C] border-slate-800'}
            `}
        >
            <div className="p-4 w-72 h-full flex flex-col">
                
                {/* New Chat Button */}
                <button
                    onClick={onNewChat}
                    className={`
                        flex items-center gap-3 w-full px-4 py-3 rounded-full mb-6 transition-all shadow-sm
                        ${isLight 
                            ? 'bg-white hover:bg-slate-200 text-slate-900 border border-slate-300' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'}
                    `}
                >
                    <PlusIcon />
                    <span className="font-semibold text-sm">New Chat</span>
                </button>

                {/* Recent Label */}
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Recent
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={`
                                group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-sm transition-all
                                ${currentSessionId === session.id
                                    ? (isLight ? 'bg-cyan-100 text-cyan-900 font-semibold' : 'bg-cyan-900/30 text-cyan-300 font-semibold')
                                    : (isLight ? 'text-slate-800 hover:bg-slate-200' : 'text-slate-200 hover:bg-slate-800')}
                            `}
                        >
                            <ChatBubbleIcon />
                            <span className="truncate flex-1 pr-6 font-medium">
                                {session.title}
                            </span>
                            
                            {/* Delete Button (visible on hover) */}
                            <button
                                onClick={(e) => onDeleteSession(e, session.id)}
                                className={`
                                    absolute right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity
                                    ${isLight ? 'hover:bg-slate-300 text-slate-600' : 'hover:bg-slate-600 text-slate-300'}
                                `}
                                title="Delete chat"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    
                    {sessions.length === 0 && (
                        <p className={`text-center text-xs mt-10 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            No recent chats
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
