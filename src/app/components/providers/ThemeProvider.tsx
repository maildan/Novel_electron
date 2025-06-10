'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from '../../../hooks/useSettings';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // 실제 적용된 테마 (system 해석 후)
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// 테마 컨텍스트 생성
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 테마 컨텍스트 훅
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, updateSetting } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // 시스템 테마 감지
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 실제 테마 계산
  const resolveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  };

  // 테마 적용
  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    console.log('🎨 ThemeProvider: 테마 적용', resolvedTheme);
    
    if (typeof document !== 'undefined') {
      // HTML 요소에 클래스 적용
      const root = document.documentElement;
      const body = document.body;
      
      if (resolvedTheme === 'dark') {
        root.classList.add('dark', 'dark-mode');
        body.classList.add('dark', 'dark-mode');
        root.setAttribute('data-theme', 'dark');
        body.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark', 'dark-mode');
        body.classList.remove('dark', 'dark-mode');
        root.setAttribute('data-theme', 'light');
        body.setAttribute('data-theme', 'light');
      }
      
      // 메타 테마 컬러 설정
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff');
      }
    }
    
    setActualTheme(resolvedTheme);
  };

  // 초기 테마 설정
  useEffect(() => {
    console.log('🔄 ThemeProvider: 초기화 시작', { 
      settingsTheme: settings.theme, 
      darkMode: settings.darkMode 
    });
    
    // 설정에서 테마 결정 (darkMode 설정이 우선)
    let initialTheme: Theme;
    if (settings.darkMode !== undefined) {
      // darkMode 설정이 있으면 그것을 사용
      initialTheme = settings.darkMode ? 'dark' : 'light';
    } else {
      // theme 설정 사용
      initialTheme = settings.theme || 'system';
    }
    
    console.log('🎯 ThemeProvider: 결정된 초기 테마', initialTheme);
    
    const resolved = resolveTheme(initialTheme);
    applyTheme(resolved);
    
    setMounted(true);
  }, [settings.theme, settings.darkMode]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!mounted || settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      console.log('🌙 ThemeProvider: 시스템 테마 변경 감지');
      const resolved = resolveTheme('system');
      applyTheme(resolved);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, settings.theme]);

  // 설정 변경 시 테마 업데이트
  useEffect(() => {
    if (!mounted) return;
    
    const currentTheme = settings.darkMode !== undefined 
      ? (settings.darkMode ? 'dark' : 'light')
      : (settings.theme || 'system');
    
    const resolved = resolveTheme(currentTheme);
    if (resolved !== actualTheme) {
      console.log('⚡ ThemeProvider: 설정 변경으로 테마 업데이트', currentTheme, '->', resolved);
      applyTheme(resolved);
    }
  }, [settings.theme, settings.darkMode, actualTheme, mounted]);

  // 테마 전환 함수
  const toggleTheme = () => {
    console.log('🔄 ThemeProvider: 테마 토글 시작', actualTheme);
    
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    
    // 설정 업데이트 (우선순위: darkMode > theme)
    if (settings.darkMode !== undefined) {
      updateSetting('darkMode', newTheme === 'dark');
    } else {
      updateSetting('theme', newTheme);
    }
    
    console.log('✅ ThemeProvider: 테마 토글 완료', newTheme);
  };

  // 테마 설정 함수
  const setTheme = (theme: Theme) => {
    console.log('🎨 ThemeProvider: 테마 설정', theme);
    
    if (theme === 'system') {
      updateSetting('theme', 'system');
      // system 모드에서는 darkMode는 false로 설정
      updateSetting('darkMode', false);
    } else {
      // 명시적 테마 설정
      updateSetting('darkMode', theme === 'dark');
      updateSetting('theme', theme);
    }
  };

  const currentTheme: Theme = settings.darkMode !== undefined 
    ? (settings.darkMode ? 'dark' : 'light')
    : (settings.theme || 'system');

  // 하이드레이션 문제 방지
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      actualTheme, 
      toggleTheme, 
      setTheme 
    }}>
      <div 
        suppressHydrationWarning 
        className={actualTheme}
        data-theme={actualTheme}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
