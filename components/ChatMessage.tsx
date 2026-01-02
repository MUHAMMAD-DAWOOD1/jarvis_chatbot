
import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Message } from '../types';
import { Sender } from '../types';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  message: Message;
  searchQuery: string;
  onPlayAudio: (text: string) => void;
  onEditSubmit: (messageId: number, newText: string) => void;
  key: number;
}

const ThumbsUpIcon = ({ filled }: { filled: boolean }) => (<svg xmlns="http://www.w.w3.org/2000/svg" className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 18.435V10h7zM7 10V7a3 3 0 013-3h1" /></svg>);
const ThumbsDownIcon = ({ filled }: { filled: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 5.565V14h-7zM17 14v3a3 3 0 01-3 3h-1" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>);
const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const SystemIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>);
const SpeakIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5 5 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>);
const LinkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, searchQuery, onPlayAudio, onEditSubmit }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const editTextAreaRef = React.useRef<HTMLTextAreaElement>(null);

  const highlightedText = useMemo(() => {
    if (!searchQuery.trim() || !message.text) return message.text;
    try {
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return message.text.replace(new RegExp(`(${escapedQuery})`, 'gi'), `<mark>$1</mark>`);
    } catch (e) {
        return message.text;
    }
  }, [message.text, searchQuery]);

  useEffect(() => {
    if (isEditing && editTextAreaRef.current) {
        editTextAreaRef.current.focus();
        editTextAreaRef.current.style.height = 'auto';
        editTextAreaRef.current.style.height = `${editTextAreaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editText]);

  if (message.sender === Sender.System) {
    return (
      <div className="flex justify-center items-center my-4 animate-fadeIn">
        <div className="flex items-center gap-3 text-sm text-cyan-300 bg-cyan-900/50 rounded-full px-4 py-2"><SystemIcon /><span>{message.text}</span></div>
      </div>
    );
  }

  const isUser = message.sender === Sender.User;
  const handleCopy = () => {
      if (message.text) {
          navigator.clipboard.writeText(message.text);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };
  
  const handleEditSave = () => {
      if (editText.trim() && editText.trim() !== message.text) {
        onEditSubmit(message.id, editText.trim());
      }
      setIsEditing(false);
  };

  const bubbleClasses = isUser ? 'bg-slate-700 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none';

  return (
    <div className={`flex flex-col my-4 animate-fadeIn group ${isUser ? 'items-end' : 'items-start'}`}>
      {isEditing ? (
        <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
            <textarea
                ref={editTextAreaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-2xl p-3 sm:p-4 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="flex justify-end items-center gap-2 mt-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors">Cancel</button>
                <button onClick={handleEditSave} className="px-4 py-1.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">Save & Submit</button>
            </div>
        </div>
      ) : (
        <>
            <div className={`relative p-3 sm:p-4 rounded-2xl max-w-lg md:max-w-xl lg:max-w-2xl inline-block ${bubbleClasses}`}>
                {isUser && (
                    <button onClick={() => setIsEditing(true)} className="absolute top-1 -left-8 p-1.5 rounded-full bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Edit message">
                        <EditIcon />
                    </button>
                )}
                {message.imageUrl && <img src={message.imageUrl} alt="Generated" className="mb-2 rounded-lg w-full max-w-lg" />}
                {message.videoUrl && <video src={message.videoUrl} controls className="mb-2 rounded-lg w-full max-w-lg" />}
                {message.text && (
                    <div className="markdown-content">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                pre: ({node, ...props}) => {
                                    const codeChild = node?.children[0];
                                    if (codeChild && codeChild.type === 'element' && codeChild.tagName === 'code') {
                                        const className = codeChild.properties?.className as string[] | undefined;
                                        const language = className?.[0]?.replace('language-', '');
                                        const codeString = (codeChild.children[0] as any)?.value || '';
                                        return <CodeBlock language={language} code={codeString} />;
                                    }
                                    return <pre {...props} className="bg-slate-900 p-4 rounded-md overflow-x-auto" />;
                                },
                                code: ({className, children, ...props}) => {
                                    return <code className={className} {...props}>{children}</code>;
                                }
                            }}
                        >
                            {highlightedText}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {message.sources && message.sources.length > 0 && (
                <div className="mt-2 max-w-lg md:max-w-xl lg:max-w-2xl w-full text-xs">
                    <h4 className="font-semibold text-slate-400 mb-1">Sources:</h4>
                    <div className="flex flex-col gap-1.5">
                        {message.sources.map((source, i) => (
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-cyan-400 bg-slate-800/50 p-2 rounded-md hover:bg-slate-700/70 truncate block">
                                <LinkIcon /> {source.title || source.uri}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {message.text && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-slate-400">
                {!isUser && (
                    <>
                    <button onClick={() => onPlayAudio(message.text)} className="p-1 hover:text-white transition-colors" aria-label="Read aloud"><SpeakIcon /></button>
                    <button onClick={() => setFeedback(prev => prev === 'like' ? null : 'like')} className={`p-1 transition-colors ${feedback === 'like' ? 'text-green-400' : 'hover:text-white'}`}><ThumbsUpIcon filled={feedback === 'like'} /></button>
                    <button onClick={() => setFeedback(prev => prev === 'dislike' ? null : 'dislike')} className={`p-1 transition-colors ${feedback === 'dislike' ? 'text-red-400' : 'hover:text-white'}`}><ThumbsDownIcon filled={feedback === 'dislike'} /></button>
                    </>
                )}
                <button onClick={handleCopy} className="flex items-center gap-1.5 p-1 hover:text-white transition-colors text-sm" aria-label="Copy message"><CopyIcon /><span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy'}</span></button>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default ChatMessage;