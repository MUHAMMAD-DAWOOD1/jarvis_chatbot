import React, { useState } from 'react';

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

interface CodeBlockProps {
  language: string | undefined;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="code-block-container my-2 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
            <div className="code-block-header flex justify-between items-center px-4 py-1.5 bg-slate-800">
                <span className="text-xs font-sans text-slate-400 uppercase">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50" disabled={isCopied}>
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm scrollbar-hide">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;
