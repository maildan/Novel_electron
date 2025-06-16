/**
 * theme-manager.ts
 * 
 * 테마 관리 기능 제공
 * TODO: 구체적인 테마 처리 로직 구현 필요
 */

import { nativeTheme, BrowserWindow } from 'electron';

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accentColor?: string;
  customColors?: Record<string, string>;
}

/**
 * 현재 테마 가져오기
 */
export function getCurrentTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

/**
 * 테마 변경
 */
export function setTheme(theme: 'light' | 'dark' | 'system'): void {
  nativeTheme.themeSource = theme;
  
  // 모든 윈도우에 테마 변경 알림
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send('theme-changed', {
        theme: getCurrentTheme(),
        source: theme
      });
    }
  });
}

/**
 * 시스템 테마 변경 감지
 */
export function setupThemeListener(): void {
  nativeTheme.on('updated', () => {
    const currentTheme = getCurrentTheme();
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('theme-changed', {
          theme: currentTheme,
          source: nativeTheme.themeSource
        });
      }
    });
  });
}

// 테마 관리자 초기화
setupThemeListener();
console.log('[theme-manager] 테마 관리자 모듈 로드됨');
