import React from 'react';
import type { VoiceProfile } from '../types';

interface VoiceControlsProps {
    profiles: VoiceProfile[];
    selectedProfileId: string;
    onProfileChange: (profileId: string) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
    profiles,
    selectedProfileId,
    onProfileChange,
}) => {
    return (
        <div className="w-full max-w-md mx-auto mb-4 animate-fadeIn">
             <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                Choose a Voice Personality
            </label>
            <div className="flex overflow-x-auto space-x-4 p-2 scrollbar-hide">
                {profiles.map(profile => (
                    <button
                        key={profile.id}
                        onClick={() => onProfileChange(profile.id)}
                        className={`
                            flex flex-col items-center justify-center flex-shrink-0 w-24 h-24
                            border rounded-xl transition-all duration-200
                            ${selectedProfileId === profile.id
                                ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-lg'
                                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70'
                            }
                        `}
                    >
                        <span className="text-3xl">{profile.icon}</span>
                        <span className="text-xs mt-1 text-slate-200">{profile.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VoiceControls;