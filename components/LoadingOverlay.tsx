
import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="w-12 h-12 border-4 border-slate-400 border-t-cyan-400 rounded-full animate-spin"></div>
);

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
      <LoadingSpinner />
      <p className="mt-4 text-slate-200 text-lg font-medium">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
