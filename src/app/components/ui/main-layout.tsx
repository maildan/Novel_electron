'use client';

import React, { memo, useRef, ReactNode } from 'react';
import { WindowControls } from './window-controls';

interface MainLayoutProps {
  children: ReactNode;
  darkMode?: boolean;
  windowMode?: string;
  isHeaderVisible?: boolean;
  className?: string;
}

export const MainLayout = memo(function MainLayout({
  children,
  darkMode = false,
  windowMode = 'normal',
  isHeaderVisible = true,
  className
}: MainLayoutProps) {
  const headerDetectionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`
        min-h-screen flex flex-col
        ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
        ${windowMode === 'fullscreen-auto-hide' ? 'overflow-hidden' : ''}
        ${className || ''}
      `}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Header with Window Controls */}
      {isHeaderVisible && (
        <header className={`
          flex items-center justify-between p-4 border-b
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Loop</h1>
            
            {/* Navigation Links */}
            <nav className="flex items-center space-x-4">
              <a 
                href="/" 
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                홈
              </a>
              <a 
                href="/analysis" 
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                로그 분석
              </a>
            </nav>
          </div>
          
          <WindowControls />
        </header>
      )}

      {/* Auto-hide detection area for fullscreen mode */}
      {windowMode === 'fullscreen-auto-hide' && (
        <div
          ref={headerDetectionRef}
          className="absolute top-0 left-0 right-0 h-4 z-50 pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className={`
        p-4 border-t text-center text-sm
        ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'}
      `}>
        <p>&copy; 2024 Loop. All rights reserved.</p>
      </footer>
    </div>
  );
});

export default MainLayout;
