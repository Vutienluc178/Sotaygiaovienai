import React from 'react';

interface AlertBannerProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, type, onClose }) => {
  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-[slideDown_0.3s_ease-out] ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="opacity-80 hover:opacity-100 font-bold">&times;</button>
    </div>
  );
};