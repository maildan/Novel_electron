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
    console.log('🔍 ThemeProvider: 테마 계산 중', {
      theme: settings.theme,
      darkMode: settings.darkMode
    });
    
    // 1순위: theme 설정이 명시적으로 light 또는 dark인 경우 (가장 높은 우선순위)
    if (settings.theme === 'light') {
      return 'light';
    } else if (settings.theme === 'dark') {
      return 'dark';
    }
    
    // 2순위: system 테마인 경우 시스템 설정 사용
    if (settings.theme === 'system') {
      return getSystemTheme();
    }
    
    // 3순위: darkMode 설정이 있는 경우 (하위 호환성)
    if (typeof settings.darkMode === 'boolean') {
      return settings.darkMode ? 'dark' : 'light';
    }
    
    // 4순위: 기본값 - 시스템 테마 사용
    return getSystemTheme();
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
    console.log('🌙 ThemeProvider: 다크모드 설정 시작', enabled);
    console.log('🔍 ThemeProvider: 현재 설정 상태:', { 
      darkMode: settings.darkMode, 
      theme: settings.theme 
    });
    
    try {
      const newTheme = enabled ? 'dark' : 'light';
      
      // 1단계: 설정 업데이트
      console.log('1️⃣ ThemeProvider: darkMode 설정 업데이트 중...', enabled);
      await updateSetting('darkMode', enabled);
      
      console.log('2️⃣ ThemeProvider: theme 설정 업데이트 중...', newTheme);
      await updateSetting('theme', newTheme);
      
      // 2단계: 즉시 DOM에 적용
      console.log('3️⃣ ThemeProvider: DOM에 테마 적용 중...', enabled ? 'dark' : 'light');
      setResolvedTheme(enabled ? 'dark' : 'light');
      applyThemeToDOM(enabled ? 'dark' : 'light');
      
      // 3단계: localStorage에도 저장 (백업용)
      try {
        localStorage.setItem('darkMode', enabled.toString());
        localStorage.setItem('theme', newTheme);
        console.log('4️⃣ ThemeProvider: localStorage 백업 저장 완료');
      } catch (error) {
        console.error('❌ ThemeProvider: localStorage 저장 실패', error);
      }
      
      // 4단계: 최종 확인
      console.log('✅ ThemeProvider: 다크모드 설정 완료', { 
        enabled, 
        theme: newTheme,
        localStorage: {
          darkMode: localStorage.getItem('darkMode'),
          theme: localStorage.getItem('theme')
        }
      });
      
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

  // 기본 context 값 (서버 렌더링 또는 초기화 중)
  const defaultContextValue: ThemeContextType = {
    theme: 'system',
    resolvedTheme: 'light',
    isDarkMode: false,
    toggleTheme: () => {},
    toggleDarkMode: () => {},
    setTheme: () => {},
    setDarkMode: () => {}
  };

  // mounted 상태에 따라 context 값 결정
  const contextValue: ThemeContextType = mounted ? {
    theme: settings.theme,
    resolvedTheme,
    isDarkMode: resolvedTheme === 'dark',
    toggleTheme,
    toggleDarkMode,
    setTheme,
    setDarkMode
  } : defaultContextValue;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
