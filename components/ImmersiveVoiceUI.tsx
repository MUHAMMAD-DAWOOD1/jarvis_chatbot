
import React, { useState } from 'react';
import AudioVisualizer from './AudioVisualizer';
import { inputAnalyser, outputAnalyser } from '../utils/audio';

interface ImmersiveVoiceUIProps {
    onStop: () => void;
    status: 'listening' | 'speaking' | 'idle' | 'processing';
    theme: 'light' | 'dark';
    transcript?: string;
}

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const CcIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);


const StatusBadge: React.FC<{ status: string, theme: 'light' | 'dark' }> = ({ status, theme }) => {
    let color = 'bg-slate-500';
    let text = 'Connecting...';
    let textColor = 'text-slate-500';
    
    if (status === 'listening') {
        color = 'bg-cyan-500';
        textColor = 'text-cyan-500';
        text = 'Listening';
    } else if (status === 'speaking') {
        color = 'bg-purple-500';
        textColor = 'text-purple-500';
        text = 'Speaking';
    } else if (status === 'processing') {
        color = 'bg-amber-500';
        textColor = 'text-amber-500';
        text = 'Processing';
    }

    // Adjust colors for light mode readability
    if (theme === 'light') {
       if (status === 'listening') { textColor = 'text-cyan-700'; color = 'bg-cyan-600'; }
       else if (status === 'speaking') { textColor = 'text-purple-700'; color = 'bg-purple-600'; }
       else if (status === 'processing') { textColor = 'text-amber-700'; color = 'bg-amber-600'; }
       else { textColor = 'text-slate-600'; color = 'bg-slate-500'; }
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${theme === 'light' ? 'bg-white/60 border-slate-200' : 'bg-slate-800/40 border-slate-700'} border backdrop-blur-sm transition-all shadow-sm`}>
            <span className={`block w-2 h-2 rounded-full ${color} animate-pulse`}></span>
            <span className={`text-sm font-medium ${textColor}`}>{text}</span>
        </div>
    );
}

const ImmersiveVoiceUI: React.FC<ImmersiveVoiceUIProps> = ({ onStop, status, theme, transcript }) => {
    const isLight = theme === 'light';
    const [showTranscript, setShowTranscript] = useState(false);

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between ${isLight ? 'bg-slate-50/95' : 'bg-slate-900/95'} backdrop-blur-xl animate-fadeIn overflow-hidden transition-colors duration-500`}>
            
            {/* Top Area: Status & Controls */}
            <div className="relative z-20 w-full pt-12 px-8 flex items-center justify-center">
                 <div className="absolute right-8 top-12">
                    <button 
                        onClick={() => setShowTranscript(!showTranscript)}
                        className={`p-3 rounded-full backdrop-blur-sm transition-all ${isLight ? 'bg-white/60 hover:bg-white/80' : 'bg-slate-800/60 hover:bg-slate-800/80'} ${showTranscript ? 'ring-2 ring-cyan-400' : ''}`}
                        title={showTranscript ? "Hide Transcript" : "Show Transcript"}
                    >
                        <CcIcon active={showTranscript} />
                    </button>
                 </div>
                 <StatusBadge status={status} theme={theme} />
            </div>
            
             {/* Transcript Area */}
             <div className="relative z-20 flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center px-6 text-center">
                {showTranscript && transcript && (
                    <div className="animate-fadeIn overflow-y-auto max-h-[40vh] scrollbar-hide">
                        <p className={`text-2xl md:text-4xl font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                            {transcript}
                        </p>
                    </div>
                )}
            </div>

            {/* Center Controls */}
            <div className="relative z-20 flex flex-col items-center justify-center pb-20">
                <button
                    onClick={onStop}
                    className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400/50"
                    aria-label="End session"
                >
                    <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-50"></span>
                    <StopIcon />
                </button>
                <p className={`mt-4 text-xs font-medium tracking-widest uppercase opacity-70 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>End Session</p>
            </div>

            {/* Bottom Area: Wave Visualizer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {inputAnalyser && outputAnalyser && <AudioVisualizer inputAnalyser={inputAnalyser} outputAnalyser={outputAnalyser} theme={theme} status={status} />}
            </div>
        </div>
    );
};

export default ImmersiveVoiceUI;
