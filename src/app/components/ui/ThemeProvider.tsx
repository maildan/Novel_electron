'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from '../../../hooks/useSettings';

// 테마 타입 정의
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void;
  setDarkMode: (enabled: boolean) => void;
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
  const { settings, updateSetting, saveSettings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // 시스템 테마 감지
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 실제 적용할 테마 계산
  const calculateResolvedTheme = (): 'light' | 'dark' => {
    // darkMode 설정이 우선순위를 가짐
    if (typeof settings.darkMode === 'boolean') {
      return settings.darkMode ? 'dark' : 'light';
    }
    
    // theme 설정이 있을 때
    if (settings.theme === 'system') {
      return getSystemTheme();
    }
    return settings.theme as 'light' | 'dark';
  };

  // DOM에 테마 적용
  const applyThemeToDOM = (theme: 'light' | 'dark') => {
    console.log('🎨 ThemeProvider: DOM에 테마 적용', theme);
    
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // 기존 클래스 제거
    root.classList.remove('light', 'dark', 'dark-mode');
    body.classList.remove('light', 'dark', 'dark-mode');
    
    // 새 테마 클래스 추가
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Loop 3 호환성을 위한 dark-mode 클래스
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    }

    // data-theme 속성 설정
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    console.log('✅ ThemeProvider: 테마 DOM 적용 완료', {
      theme,
      rootClasses: root.className,
      bodyClasses: body.className
    });
  };

  // 다크모드 설정 함수
  const setDarkMode = async (enabled: boolean) => {
    console.log('🌙 ThemeProvider: 다크모드 설정', enabled);
    
    try {
      const newTheme = enabled ? 'dark' : 'light';
      
      // settings에 동시에 업데이트
      await updateSetting('darkMode', enabled);
      await updateSetting('theme', newTheme);
      
      // 즉시 DOM에 적용
      setResolvedTheme(enabled ? 'dark' : 'light');
      applyThemeToDOM(enabled ? 'dark' : 'light');
      
      // 로컬 스토리지에도 저장 (백업용)
      try {
        localStorage.setItem('darkMode', enabled.toString());
        localStorage.setItem('theme', newTheme);
      } catch (error) {
        console.error('❌ ThemeProvider: localStorage 저장 실패', error);
      }
      
      console.log('✅ ThemeProvider: 다크모드 설정 완료', { enabled, theme: newTheme });
    } catch (error) {
      console.error('❌ ThemeProvider: 다크모드 설정 실패', error);
    }
  };

  // 테마 설정 함수
  const setTheme = async (theme: Theme) => {
    console.log('🎨 ThemeProvider: 테마 설정', theme);
    await updateSetting('theme', theme);
    
    // darkMode 설정도 업데이트
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    await updateSetting('darkMode', resolved === 'dark');
  };

  // 테마 토글 함수
  const toggleTheme = async () => {
    const currentResolved = calculateResolvedTheme();
    const newTheme = currentResolved === 'light' ? 'dark' : 'light';
    console.log('🔄 ThemeProvider: 테마 토글', currentResolved, '->', newTheme);
    await setTheme(newTheme);
  };

  // 다크모드 토글 함수
  const toggleDarkMode = async () => {
    const currentDarkMode = settings.darkMode || resolvedTheme === 'dark';
    const newDarkMode = !currentDarkMode;
    console.log('🌙 ThemeProvider: 다크모드 토글', currentDarkMode, '->', newDarkMode);
    await setDarkMode(newDarkMode);
  };

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (settings.theme === 'system') {
        console.log('🔄 ThemeProvider: 시스템 테마 변경 감지');
        const newResolvedTheme = calculateResolvedTheme();
        setResolvedTheme(newResolvedTheme);
        applyThemeToDOM(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme]);

  // 설정 변경시 테마 적용
  useEffect(() => {
    if (!mounted) return;

    const newResolvedTheme = calculateResolvedTheme();
    console.log('⚙️ ThemeProvider: 설정 변경으로 테마 업데이트', {
      theme: settings.theme,
      darkMode: settings.darkMode,
      resolvedTheme: newResolvedTheme
    });
    
    setResolvedTheme(newResolvedTheme);
    applyThemeToDOM(newResolvedTheme);
  }, [settings.theme, settings.darkMode, mounted]);

  // 컴포넌트 마운트시 초기화
  useEffect(() => {
    console.log('🚀 ThemeProvider: 컴포넌트 마운트 및 초기화');
    
    // 초기 테마 설정
    const initialResolvedTheme = calculateResolvedTheme();
    setResolvedTheme(initialResolvedTheme);
    applyThemeToDOM(initialResolvedTheme);
    
    setMounted(true);
    
    console.log('✅ ThemeProvider: 초기화 완료', {
      settingsTheme: settings.theme,
      darkMode: settings.darkMode,
      resolvedTheme: initialResolvedTheme
    });
  }, []);

  // 서버 렌더링 시에는 children만 반환
  if (!mounted) {
    return <>{children}</>;
  }

  const contextValue: ThemeContextType = {
    theme: settings.theme,
    resolvedTheme,
    isDarkMode: resolvedTheme === 'dark',
    toggleTheme,
    toggleDarkMode,
    setTheme,
    setDarkMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
