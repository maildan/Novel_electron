'use client';

import React from 'react';

interface WindowControlsProps {
  className?: string;
  isDarkMode?: boolean;
}

export function WindowControls({ className, isDarkMode = false }: WindowControlsProps) {
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.window.toggleMaximize();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.window.close();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <button 
        className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors" 
        onClick={handleMinimize}
        aria-label="최소화"
      >
        <span className="sr-only">&#8211;</span>
      </button>
      <button 
        className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors" 
        onClick={handleMaximize}
        aria-label="최대화"
      >
        <span className="sr-only">&#x25A1;</span>
      </button>
      <button 
        className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors" 
        onClick={handleClose}
        aria-label="닫기"
      >
        <span className="sr-only">&#x2715;</span>
      </button>
    </div>
  );
}
