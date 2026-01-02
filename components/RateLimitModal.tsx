import React from 'react';

interface RateLimitModalProps {
  resetTime: string;
  onClose: () => void;
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RateLimitModal: React.FC<RateLimitModalProps> = ({ resetTime, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md mx-auto">
        <div className="flex items-center mb-4">
            <ClockIcon />
            <h2 className="text-2xl font-bold text-slate-100">Usage Limit Reached</h2>
        </div>
        <p className="text-slate-400 mb-6">
          You have sent the maximum number of messages for the current period. This is a measure to ensure fair usage for everyone.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-slate-300">Your message limit will reset at:</p>
            <p className="text-cyan-400 font-semibold text-lg mt-1">{resetTime}</p>
        </div>
        <button
            onClick={onClose}
            className="w-full mt-6 bg-cyan-600 text-white rounded-lg py-3 font-semibold hover:bg-cyan-500 transition-colors"
        >
            Understood
        </button>
      </div>
    </div>
  );
};

export default RateLimitModal;
