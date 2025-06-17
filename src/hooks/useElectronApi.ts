import { useState, useEffect } from 'react';

// 타입 정의들
interface TypingStats {
  keyCount: number;
  typingTime: number;
  startTime: string | null;
  lastActiveTime: string | null;
  currentWindow: string | null;
  currentBrowser: string | null;
  totalChars: number;
  totalWords: number;
  totalCharsNoSpace: number;
  pages: number;
  accuracy: number;
}

interface BrowserInfo {
  name: string | null;
  isGoogleDocs: boolean;
  title: string | null;
}

interface DebugInfo {
  isTracking: boolean;
  currentStats: TypingStats;
  platform: string;
  electronVersion: string;
  nodeVersion: string;
}

interface Settings {
  darkMode: boolean;
  windowMode: string;
  [key: string]: unknown;
}

interface ElectronAPI {
  windowControl: (action: string) => void;
  onTypingStatsUpdate: (callback: (data: TypingStats) => void) => () => void;
  onStatsSaved: (callback: (data: TypingStats) => void) => () => void;
  startTracking: () => void;
  stopTracking: () => void;
  saveStats: (data?: TypingStats) => Promise<boolean>;
  loadSettings: () => Settings;
  saveSettings: (settings: Settings) => boolean;
  getCurrentBrowserInfo: () => Promise<BrowserInfo>;
  getDebugInfo: () => Promise<DebugInfo>;
  setDarkMode: (darkMode: boolean) => Promise<{ success: boolean }>;
  setWindowMode: (mode: string) => Promise<{ success: boolean }>;
  getWindowMode: () => Promise<string>;
  checkAutoStart: () => void;
  onAutoTrackingStarted: () => () => void;
  onSwitchTab: () => () => void;
  onOpenSaveStatsDialog: () => () => void;
  requestStatsUpdate: () => void;
  onMiniViewStatsUpdate: () => () => void;
  toggleMiniView: () => void;
  updateTraySettings: () => Promise<{ success: boolean }>;
  quitApp: () => void;
  toggleWindow: () => void;
  onBackgroundModeChange: () => () => void;
  onTrayCommand: () => () => void;
  restartApp: () => void;
  showRestartPrompt: () => void;
  closeWindow: () => void;
  getDarkMode: () => Promise<boolean>;
}

// 더미 일렉트론 API 생성 함수
const createDummyElectronAPI = (): ElectronAPI => ({
  windowControl: (action) => console.log(`개발용 windowControl 호출: ${action}`),
  onTypingStatsUpdate: (_callback) => {
    console.log('개발용 onTypingStatsUpdate 리스너 등록');
    return () => console.log('개발용 onTypingStatsUpdate 리스너 제거');
  },
  onStatsSaved: (_callback) => {
    console.log('개발용 onStatsSaved 리스너 등록');
    return () => console.log('개발용 onStatsSaved 리스너 제거');
  },
  startTracking: () => console.log('개발용 startTracking 호출'),
  stopTracking: () => console.log('개발용 stopTracking 호출'),
  saveStats: (data?) => {
    console.log('개발용 saveStats 호출:', data);
    return Promise.resolve(true);
  },
  loadSettings: () => {
    console.log('개발용 loadSettings 호출');
    return { darkMode: false, windowMode: 'normal' };
  },
  saveSettings: (settings) => {
    console.log('개발용 saveSettings 호출:', settings);
    return true;
  },
  getCurrentBrowserInfo: () => Promise.resolve({ name: null, isGoogleDocs: false, title: null }),
  getDebugInfo: () => Promise.resolve({
    isTracking: false,
    currentStats: {
      keyCount: 0,
      typingTime: 0,
      startTime: null,
      lastActiveTime: null,
      currentWindow: null,
      currentBrowser: null,
      totalChars: 0,
      totalWords: 0,
      totalCharsNoSpace: 0,
      pages: 0,
      accuracy: 100
    },
    platform: 'web',
    electronVersion: 'N/A',
    nodeVersion: 'N/A'
  }),
  setDarkMode: () => Promise.resolve({ success: true }),
  setWindowMode: () => Promise.resolve({ success: true }),
  getWindowMode: () => Promise.resolve('windowed'),
  checkAutoStart: () => {},
  onAutoTrackingStarted: () => () => {},
  onSwitchTab: () => () => {},
  onOpenSaveStatsDialog: () => () => {},
  requestStatsUpdate: () => {},
  onMiniViewStatsUpdate: () => () => {},
  toggleMiniView: () => {},
  updateTraySettings: () => Promise.resolve({ success: true }),
  quitApp: () => console.log('개발용 quitApp 호출'),
  toggleWindow: () => console.log('개발용 toggleWindow 호출'),
  onBackgroundModeChange: () => () => {},
  onTrayCommand: () => () => {},
  restartApp: () => console.log('개발용 restartApp 호출'),
  showRestartPrompt: () => console.log('개발용 showRestartPrompt 호출'),
  closeWindow: () => console.log('개발용 closeWindow 호출'),
  getDarkMode: () => Promise.resolve(false)
});

export function useElectronApi() {
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    // 브라우저 환경 확인
    if (typeof window !== 'undefined') {
      // window 객체에 electronAPI가 있는지 확인
      const globalWindow = window as unknown as { electronAPI?: ElectronAPI };
      const electronAPI = globalWindow.electronAPI;
      
      if (electronAPI) {
        // Electron 환경에서 실행 중
        setApi(electronAPI);
        console.log('Electron API 연결됨');
      } else {
        // 웹 브라우저 환경에서 실행 중 - 더미 API 사용
        console.log('웹 브라우저 환경에서 실행 중 - 더미 API 사용');
        setApi(createDummyElectronAPI());
      }
    }
  }, []);

  return api;
}

export default useElectronApi;
