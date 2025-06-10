'use client';

import React from 'react';

interface MiniViewIconProps {
  isDarkMode: boolean;
  onClick: () => void;
  className?: string;
}

export const MiniViewIcon: React.FC<MiniViewIconProps> = ({ 
  isDarkMode, 
  onClick, 
  className 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      id="mini-view-icon"
      className={`
        fixed top-4 right-4 z-50 cursor-pointer transition-all duration-200 
        hover:scale-110 active:scale-95
        ${isDarkMode ? 'opacity-80 hover:opacity-100' : 'opacity-90 hover:opacity-100'}
        ${className || ''}
      `}
      onClick={handleClick}
      style={{
        outline: 'none',
        border: 'none',
        pointerEvents: 'auto',
      }}
    >
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        ${isDarkMode 
          ? 'bg-gray-800 border border-gray-600 shadow-lg' 
          : 'bg-white border border-gray-200 shadow-md'
        }
      `}>
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isDarkMode ? 'text-white' : 'text-gray-700'}
        >
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    </div>
  );
};

export default MiniViewIcon;
