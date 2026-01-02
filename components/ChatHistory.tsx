
import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  searchQuery: string;
  onPlayAudio: (text: string) => void;
  onEditSubmit: (messageId: number, newText: string) => void;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 my-4 justify-start animate-fadeIn">
    <div className="p-4 rounded-2xl max-w-lg md:max-w-xl lg:max-w-2xl inline-block bg-slate-800 text-slate-200 rounded-bl-none">
      <div className="flex items-center justify-center gap-1.5">
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, searchQuery, onPlayAudio, onEditSubmit }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isInitialLoad.current = false;
    } else {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const hasSearchResults = messages.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {isSearching && (
          <div className="text-center text-slate-400 mb-4 text-sm animate-fadeIn">
              {hasSearchResults 
                ? `${messages.length} ${messages.length === 1 ? 'result' : 'results'} found for "${searchQuery}"` 
                : `No results found for "${searchQuery}"`}
          </div>
      )}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} searchQuery={searchQuery} onPlayAudio={onPlayAudio} onEditSubmit={onEditSubmit} />
      ))}
      {isLoading && <LoadingIndicator />}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatHistory;