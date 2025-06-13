'use client';

import React, { memo, useRef, useState, ReactNode } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
      {/* Header with Navigation and Window Controls */}
      {isHeaderVisible && (
        <header className={`
          flex items-center justify-between p-4 border-b
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className="flex items-center space-x-8">
            <h1 className="text-lg font-semibold">Loop</h1>
            
            {/* Desktop Horizontal Navigation */}
            <nav className="hidden md:block">
              <ul className="flex items-center space-x-6">
                <li>
                  <a 
                    href="/" 
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${darkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>🏠</span>
                    <span>홈</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="/analysis" 
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${darkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>📊</span>
                    <span>로그 분석</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="/typing" 
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${darkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>⌨️</span>
                    <span>타이핑 분석</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="/performance" 
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${darkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>⚡</span>
                    <span>성능</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="/settings" 
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${darkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>⚙️</span>
                    <span>설정</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className={`
                md:hidden p-2 rounded-md text-sm font-medium transition-colors
                ${darkMode 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              aria-label="메뉴 토글"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
            
            <WindowControls />
          </div>
        </header>
      )}

      {/* Mobile Navigation Menu */}
      {isHeaderVisible && isMobileMenuOpen && (
        <div className={`
          md:hidden border-b
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a 
                  href="/" 
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>🏠</span>
                  <span>홈</span>
                </a>
              </li>
              <li>
                <a 
                  href="/analysis" 
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>📊</span>
                  <span>로그 분석</span>
                </a>
              </li>
              <li>
                <a 
                  href="/typing" 
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>⌨️</span>
                  <span>타이핑 분석</span>
                </a>
              </li>
              <li>
                <a 
                  href="/performance" 
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>⚡</span>
                  <span>성능</span>
                </a>
              </li>
              <li>
                <a 
                  href="/settings" 
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>⚙️</span>
                  <span>설정</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Auto-hide detection area for fullscreen mode */}
      {windowMode === 'fullscreen-auto-hide' && (
        <div
          ref={headerDetectionRef}
          className="absolute top-0 left-0 right-0 h-4 z-50 pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
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
