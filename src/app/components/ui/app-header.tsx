'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { WindowControls } from './window-controls';

interface AppHeaderProps {
  api?: any;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  autoHide?: boolean;
  isDarkMode?: boolean;
}

export const AppHeader = memo(function AppHeader({
  api,
  isVisible = true,
  onVisibilityChange,
  autoHide = false,
  isDarkMode = false
}: AppHeaderProps) {
  const [visibility, setVisibility] = useState(isVisible);
  const lastMouseY = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouseInsideHeader = useRef(false);

  useEffect(() => {
    setVisibility(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(visibility);
    }
  }, [visibility, onVisibilityChange]);

  useEffect(() => {
    if (!autoHide) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentY = e.clientY;
      
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        mouseInsideHeader.current = e.clientY <= headerRect.bottom;
      }

      if (currentY <= 50 || mouseInsideHeader.current) {
        setVisibility(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (currentY > lastMouseY.current && currentY > 100) {
        if (!timeoutRef.current && !mouseInsideHeader.current) {
          timeoutRef.current = setTimeout(() => {
            setVisibility(false);
            timeoutRef.current = null;
          }, 1000);
        }
      }

      lastMouseY.current = currentY;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoHide]);

  const headerClasses = `
    fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
    ${visibility ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
    ${isDarkMode 
      ? 'bg-gray-900/95 border-b border-gray-700/50' 
      : 'bg-white/95 border-b border-gray-200/50'
    }
    backdrop-blur-sm
  `;

  return (
    <header 
      ref={headerRef}
      className={headerClasses}
      style={{
        height: '60px',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}
          `}>
            <span className="text-white font-bold text-sm">L6</span>
          </div>
          <h1 className={`
            font-semibold text-lg
            ${isDarkMode ? 'text-white' : 'text-gray-900'}
          `}>
            Loop 6
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            <div className={`
              w-2 h-2 rounded-full
              ${api ? 'bg-green-500' : 'bg-red-500'}
            `} />
            <span className={`
              text-xs
              ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
            `}>
              {api ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <WindowControls isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </header>
  );
});

export default AppHeader;
