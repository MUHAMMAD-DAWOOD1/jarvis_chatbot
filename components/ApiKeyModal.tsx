

import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSave();
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md mx-auto animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-100 mb-3">Provide Your API Key</h2>
        <p className="text-slate-400 mb-6 text-sm">
          To use this application, you need a Google Gemini API key. Your key is stored securely in your browser's local storage and is never sent to our servers.
        </p>
        <div className="mb-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your API key here"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            aria-label="API Key Input"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full bg-cyan-600 text-white rounded-lg py-3 font-semibold hover:bg-cyan-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Save and Continue
        </button>
        <p className="text-center text-xs text-slate-500 mt-4">
          You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;