'use client';

import { useState, useEffect, useCallback } from 'react';
import { useElectron } from './useElectron';

export type WindowModeType = 'windowed' | 'fullscreen' | 'maximized' | 'fullscreen-auto-hide';

export interface SettingsState {
  // 타이핑 설정
  enableWPMDisplay: boolean;
  enableAccuracyDisplay: boolean;
  enableRealTimeStats: boolean;
  enableTypingSound: boolean;
  enableKeyboardShortcuts: boolean;
  
  // 타이핑 분석 설정 (새로 추가)
  enableTypingAnalysis: boolean;
  enableRealTimeAnalysis: boolean;
  statsCollectionInterval: number;
  enableKeyboardDetection: boolean;
  enablePatternLearning: boolean;
  
  // GPU 설정
  enableGPUAcceleration: boolean;
  gpuAccelerationLevel: number;
  enableGPUFallback: boolean;
  
  // 메모리 설정
  enableMemoryOptimization: boolean;
  enableBackgroundCleanup: boolean;
  memoryCleanupInterval: number;
  memoryThreshold: number;
  
  // 시스템 모니터링 설정
  enableSystemMonitoring: boolean;
  enablePerformanceLogging: boolean;
  monitoringInterval: number;
  enableCPUMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableDiskMonitoring: boolean;
  
  // UI 설정
  theme: 'light' | 'dark' | 'system';
  windowMode: WindowModeType;
  enableAnimations: boolean;
  enableNotifications: boolean;
  fontSize: number;
  fontFamily: string;
  
  // 데이터 설정
  enableDataCollection: boolean;
  enableAnalytics: boolean;
  dataRetentionDays: number;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  
  // 개발자 설정
  enableDebugMode: boolean;
  enableConsoleLogging: boolean;
  enableErrorReporting: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // 기존 호환성 유지
  enabledCategories: {
    docs: boolean;
    office: boolean;
    coding: boolean;
    sns: boolean;
  };
  autoStartMonitoring: boolean;
  resumeAfterIdle: boolean;
  darkMode: boolean;
  minimizeToTray: boolean;
  showTrayNotifications: boolean;
  reduceMemoryInBackground: boolean;
  enableMiniView: boolean;
  useHardwareAcceleration: boolean;
  processingMode: 'auto' | 'normal' | 'cpu-intensive' | 'gpu-intensive';
  maxMemoryThreshold: number;
}

// 기본 설정 값 - COPILOT 규칙 15번(타입 선언 엄격화) 적용
const defaultSettings: SettingsState = {
  // 타이핑 설정
  enableWPMDisplay: true,
  enableAccuracyDisplay: true,
  enableRealTimeStats: true,
  enableTypingSound: false,
  enableKeyboardShortcuts: true,
  
  // 타이핑 분석 설정 (새로 추가)
  enableTypingAnalysis: true,
  enableRealTimeAnalysis: true,
  statsCollectionInterval: 5,
  enableKeyboardDetection: true,
  enablePatternLearning: true,
  
  // GPU 설정
  enableGPUAcceleration: true,
  gpuAccelerationLevel: 1,
  enableGPUFallback: true,
  
  // 메모리 설정
  enableMemoryOptimization: true,
  enableBackgroundCleanup: true,
  memoryCleanupInterval: 300000, // 5분
  memoryThreshold: 80, // 80%
  
  // 시스템 모니터링 설정
  enableSystemMonitoring: true,
  enablePerformanceLogging: false,
  monitoringInterval: 1000, // 1초
  enableCPUMonitoring: true,
  enableMemoryMonitoring: true,
  enableDiskMonitoring: false,
  
  // UI 설정
  theme: 'system',
  windowMode: 'windowed',
  enableAnimations: true,
  enableNotifications: true,
  fontSize: 14,
  fontFamily: 'system-ui',
  
  // 데이터 설정
  enableDataCollection: true,
  enableAnalytics: false,
  dataRetentionDays: 30,
  enableAutoSave: true,
  autoSaveInterval: 10000, // 10초
  
  // 개발자 설정
  enableDebugMode: false,
  enableConsoleLogging: true,
  enableErrorReporting: true,
  logLevel: 'info',
  
  // 기존 호환성 유지
  enabledCategories: {
    docs: true,
    office: true,
    coding: true,
    sns: true
  },
  autoStartMonitoring: true,
  resumeAfterIdle: true,
  darkMode: false,
  minimizeToTray: true,
  showTrayNotifications: true,
  reduceMemoryInBackground: true,
  enableMiniView: true,
  useHardwareAcceleration: false,
  processingMode: 'auto',
  maxMemoryThreshold: 100
};

export function useSettings() {
  const { isElectron, electronAPI } = useElectron();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // COPILOT 규칙 11번: 디버깅 로그 추가
  // 설정 로드
  const loadSettings = useCallback(async () => {
    console.debug('📥 useSettings: 설정 로드 시작'); // 규칙 11번
    setIsLoading(true);
    setError(null);
    
    try {
      console.debug('🔍 useSettings: Electron 환경:', isElectron);
      console.debug('🔍 useSettings: electronAPI 존재:', !!electronAPI);
      
      if (isElectron && electronAPI && electronAPI.ipcRenderer) {
        console.debug('🔌 useSettings: Electron IPC를 통해 설정 로드');
        
        try {
          const loadedSettings = await electronAPI.ipcRenderer.invoke('settings:get');
          console.debug('✅ useSettings: 설정 로드 성공:', loadedSettings);
          
          if (loadedSettings && typeof loadedSettings === 'object') {
            // 백엔드에서 로드된 설정이 있으면 해당 설정을 우선 사용
            const mergedSettings = { ...defaultSettings, ...loadedSettings };
            setSettings(mergedSettings);
            console.debug('📝 useSettings: 백엔드 설정으로 상태 업데이트 완료');
          } else {
            console.warn('⚠️ useSettings: 백엔드에서 유효한 설정을 가져오지 못함');
            // 백엔드 로드 실패 시 localStorage 시도
            try {
              const storedSettings = localStorage.getItem('loop-settings');
              if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                console.debug('✅ useSettings: localStorage 백업에서 설정 로드:', parsedSettings);
                setSettings({ ...defaultSettings, ...parsedSettings });
              } else {
                console.debug('📝 useSettings: 백업 설정도 없음, 기본값 사용');
                setSettings(defaultSettings);
              }
            } catch (storageError) {
              console.error('❌ useSettings: localStorage 백업 로드도 실패:', storageError);
              setSettings(defaultSettings);
            }
          }
        } catch (ipcError) {
          console.error('❌ useSettings: IPC 설정 로드 실패:', ipcError);
          // IPC 실패 시 localStorage에서 시도
          try {
            const storedSettings = localStorage.getItem('loop-settings');
            if (storedSettings) {
              const parsedSettings = JSON.parse(storedSettings);
              console.debug('✅ useSettings: IPC 실패 후 localStorage에서 설정 로드:', parsedSettings);
              setSettings({ ...defaultSettings, ...parsedSettings });
            } else {
              console.debug('📝 useSettings: localStorage도 없음, 기본값 사용');
              setSettings(defaultSettings);
            }
          } catch (storageError) {
            console.error('❌ useSettings: 모든 설정 로드 실패, 기본값 사용');
            setError(`설정 로드 실패: ${ipcError}`);
            setSettings(defaultSettings);
          }
        }
      } else {
        console.debug('🌐 useSettings: 웹 환경에서 localStorage 사용');
        
        try {
          const storedSettings = localStorage.getItem('loop-settings');
          if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            console.debug('✅ useSettings: localStorage에서 설정 로드:', parsedSettings);
            setSettings({ ...defaultSettings, ...parsedSettings });
          } else {
            console.debug('📝 useSettings: localStorage에 설정 없음, 기본값 사용');
            setSettings(defaultSettings);
          }
        } catch (storageError) {
          console.error('❌ useSettings: localStorage 설정 로드 실패:', storageError);
          setError(`설정 로드 실패: ${storageError}`);
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('❌ useSettings: 설정 로드 중 예외 발생:', error);
      setError(`설정 로드 실패: ${error}`);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
      console.debug('🏁 useSettings: 설정 로드 완료'); // 규칙 11번
    }
  }, [isElectron, electronAPI]);

  // COPILOT 규칙 11번: 디버깅 로그 추가
  // 설정 저장
  const saveSettings = useCallback(async (newSettings: Partial<SettingsState>) => {
    console.debug('💾 useSettings: 설정 저장 시작', newSettings); // 규칙 11번
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      // Electron 환경에서 저장
      if (isElectron && electronAPI && electronAPI.ipcRenderer) {
        console.debug('🔌 useSettings: Electron IPC를 통해 설정 저장');
        try {
          const result = await electronAPI.ipcRenderer.invoke('settings:updateMultiple', newSettings);
          console.debug('✅ useSettings: Electron 설정 저장 결과:', result);
          
          if (!result) {
            throw new Error('Electron 설정 저장 실패');
          }
        } catch (ipcError) {
          console.error('❌ useSettings: Electron 설정 저장 실패:', ipcError);
          // Electron 저장이 실패해도 localStorage는 시도
        }
      } else {
        console.debug('🌐 useSettings: 웹 환경에서 localStorage에 저장');
      }
      
      // localStorage에 항상 저장 (백업용)
      try {
        localStorage.setItem('loop-settings', JSON.stringify(updatedSettings));
        console.debug('✅ useSettings: localStorage 저장 완료');
      } catch (storageError) {
        console.error('❌ useSettings: localStorage 저장 실패:', storageError);
      }
      
      console.debug('🏁 useSettings: 설정 저장 완료'); // 규칙 11번
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설정 저장 실패';
      setError(errorMessage);
      console.error('❌ useSettings: 설정 저장 중 오류:', err);
    }
  }, [settings, isElectron, electronAPI]);

  // 설정 리셋
  const resetSettings = useCallback(async () => {
    console.debug('🔄 useSettings: 설정 리셋 시작'); // 규칙 11번
    setSettings(defaultSettings);
    
    try {
      if (isElectron && electronAPI && electronAPI.ipcRenderer) {
        try {
          const result = await electronAPI.ipcRenderer.invoke('settings:reset');
          console.debug('✅ useSettings: Electron 설정 리셋 결과:', result);
        } catch (err) {
          console.warn('⚠️ useSettings: Electron 설정 리셋 실패:', err);
        }
      }
      
      localStorage.removeItem('loop-settings');
      console.debug('✅ useSettings: localStorage 설정 제거 완료');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설정 리셋 실패';
      setError(errorMessage);
      console.error('❌ useSettings: 설정 리셋 중 오류:', err);
    }
  }, [isElectron, electronAPI]);

  // COPILOT 규칙 15번: 타입 선언 엄격화
  // 개별 설정 업데이트
  const updateSetting = useCallback(<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    console.debug(`🔧 useSettings: 개별 설정 업데이트 - ${String(key)}:`, value); // 규칙 11번
    saveSettings({ [key]: value } as Partial<SettingsState>);
  }, [saveSettings]);

  // 테마 토글
  const toggleTheme = useCallback(() => {
    const newTheme = settings.theme === 'light' ? 'dark' :
                     settings.theme === 'dark' ? 'system' : 'light';
    console.debug('🎨 useSettings: 테마 변경', settings.theme, '->', newTheme);
    updateSetting('theme', newTheme);
  }, [settings.theme, updateSetting]);

  // 다크모드 토글
  const toggleDarkMode = useCallback(() => {
    console.debug('🌙 useSettings: 다크모드 토글', !settings.darkMode); // 규칙 11번
    updateSetting('darkMode', !settings.darkMode);
  }, [settings.darkMode, updateSetting]);

  // GPU 가속 토글
  const toggleGPUAcceleration = useCallback(() => {
    console.debug('⚡ useSettings: GPU 가속 토글', !settings.enableGPUAcceleration); // 규칙 11번
    updateSetting('enableGPUAcceleration', !settings.enableGPUAcceleration);
  }, [settings.enableGPUAcceleration, updateSetting]);

  // 초기 로드 - COPILOT 규칙 11번: 디버깅 로그
  useEffect(() => {
    console.debug('🔄 useSettings: 컴포넌트 마운트, 설정 로드 시작'); // 규칙 11번
    loadSettings();
  }, [loadSettings]);

  return {
    // 상태
    settings,
    isLoading,
    error,
    
    // 액션
    saveSettings,
    resetSettings,
    updateSetting,
    loadSettings,
    toggleTheme,
    toggleDarkMode,
    toggleGPUAcceleration,
    
    // 편의 함수 - COPILOT 규칙 13번: 모듈화
    darkMode: settings.darkMode,
    getGPUSettings: () => ({
      enableGPUAcceleration: settings.enableGPUAcceleration,
      gpuAccelerationLevel: settings.gpuAccelerationLevel,
      enableGPUFallback: settings.enableGPUFallback
    }),
    getMemorySettings: () => ({
      enableMemoryOptimization: settings.enableMemoryOptimization,
      enableBackgroundCleanup: settings.enableBackgroundCleanup,
      memoryThreshold: settings.memoryThreshold,
      monitoringInterval: settings.monitoringInterval,
    }),
    getSystemSettings: () => ({
      enableSystemMonitoring: settings.enableSystemMonitoring,
      enableCPUMonitoring: settings.enableCPUMonitoring,
      enableMemoryMonitoring: settings.enableMemoryMonitoring,
      enableDiskMonitoring: settings.enableDiskMonitoring
    })
  };
}
