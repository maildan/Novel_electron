'use client';

import { useState, useEffect, useCallback } from 'react';
import { useElectron } from './useElectron';
import { 
  AppSettings, 
  SettingsState, 
  DEFAULT_SETTINGS, 
  mergeSettings, 
  validateSettings,
  type WindowModeType,
  type ThemeType,
  type ProcessingModeType,
  type SettingsKey,
  type SettingsValue
} from '../types/settings';

// 타입들을 re-export하여 settings.tsx에서 사용할 수 있도록 함
export type { 
  AppSettings, 
  SettingsState, 
  WindowModeType, 
  ThemeType, 
  ProcessingModeType, 
  SettingsKey, 
  SettingsValue 
};

// 기본 설정 값 - 공통 타입에서 가져옴
const defaultSettings: SettingsState = DEFAULT_SETTINGS;
export function useSettings() {
  const { isElectron, electronAPI } = useElectron();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 설정 로드 (초기화 및 재로드용)
  const loadSettings = useCallback(async () => {
    console.debug('📥 useSettings: 설정 로드 시작'); // 규칙 11번
    setIsLoading(true);
    setError(null);
    
    try {
      console.debug('🔍 useSettings: Electron 환경:', isElectron);
      console.debug('🔍 useSettings: electronAPI 존재:', !!electronAPI);
      
      if (isElectron && electronAPI && electronAPI.settings) {
        console.debug('🔌 useSettings: Electron Settings API를 통해 설정 로드');
        
        try {
          const loadedSettings = await electronAPI.settings.getAll();
          console.debug('✅ useSettings: 설정 로드 성공:', loadedSettings);
          
          if (loadedSettings && typeof loadedSettings === 'object') {
            // 백엔드에서 로드된 설정이 있으면 해당 설정을 우선 사용
            const mergedSettings = mergeSettings(defaultSettings, loadedSettings);
            const isValid = validateSettings(mergedSettings);
            
            console.debug('[설정 검증] 병합된 설정:', {isValid: isValid, settingCount: Object.keys(mergedSettings).length});
            
            if (isValid) {
              setSettings(mergedSettings);
              console.debug('📝 useSettings: 백엔드 설정으로 상태 업데이트 완료');
            } else {
              console.warn('[설정 검증] 유효하지 않은 설정, 기본값 사용');
              setSettings(defaultSettings);
            }
            
            // localStorage에도 동기화 (백업용)
            try {
              localStorage.setItem('loop-settings', JSON.stringify(mergedSettings));
              console.debug('✅ useSettings: localStorage 백업 저장 완료');
            } catch (storageError) {
              console.warn('⚠️ useSettings: localStorage 백업 저장 실패:', storageError);
            }
          } else {
            console.warn('⚠️ useSettings: 백엔드에서 유효한 설정을 가져오지 못함, 기본값으로 폴백');
            setSettings(defaultSettings);
            
            // 기본값을 백엔드에 저장
            try {
              const saveResult = await electronAPI.settings.updateMultiple({...defaultSettings});
              console.debug('✅ useSettings: 기본 설정을 백엔드에 저장 완료:', saveResult);
            } catch (defaultSaveError) {
              console.warn('⚠️ useSettings: 기본 설정 백엔드 저장 실패:', defaultSaveError);
            }
          }
        } catch (ipcError) {
          console.error('❌ useSettings: IPC 설정 로드 실패:', ipcError);
          // IPC 실패 시 localStorage 폴백 시도
          await loadFromLocalStorage();
        }
      } else {
        console.debug('🌐 useSettings: 웹 환경에서 localStorage 사용');
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ useSettings: 설정 로드 중 예외 발생:', error);
      setError(`설정 로드 실패: ${error}`);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
      console.debug('� useSettings: 설정 로드 완료'); // 규칙 11번
    }
  }, [isElectron, electronAPI]);

  // localStorage에서 설정 로드하는 헬퍼 함수
  const loadFromLocalStorage = useCallback(async () => {
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
  }, []);

  // COPILOT 규칙 11번: 디버깅 로그 추가
  // 설정 저장
  const saveSettings = useCallback(async (newSettings: Partial<SettingsState>) => {
    console.group('💾 useSettings: 설정 저장 프로세스 시작');
    console.log('📥 저장할 설정:', newSettings);
    console.log('📊 현재 설정 상태:', settings);
    
    const updatedSettings = { ...settings, ...newSettings };
    console.log('🔄 병합된 설정:', updatedSettings);
    
    try {
      // 우선 React 상태를 즉시 업데이트
      setSettings(updatedSettings);
      console.log('✅ React 상태 업데이트 완료');
      
      // Electron 환경에서 저장
      if (isElectron && electronAPI && electronAPI.settings) {
        console.log('🔌 Electron Settings API를 통해 설정 저장 중...');
        console.log('🔍 전송할 데이터:', newSettings);
        
        try {
          const startTime = Date.now();
          const result = await electronAPI.settings.updateMultiple(newSettings);
          const endTime = Date.now();
          
          console.log('⏱️ 저장 소요 시간:', (endTime - startTime) + 'ms');
          console.log('📤 IPC 호출 결과:', result);
          
          if (!result) {
            console.error('❌ Electron 설정 저장 실패 - false 반환');
            setError('백엔드 저장 실패');
          } else {
            console.log('✅ Electron 백엔드 저장 성공');
            setError(null); // 오류 상태 클리어
            
            // 저장 후 검증을 위해 다시 로드
            console.log('🔄 저장 검증을 위해 설정 다시 로드 중...');
            try {
              const verifySettings = await electronAPI.settings.getAll();
              console.log('✔️ 저장 검증 결과:', verifySettings);
            } catch (verifyError) {
              console.warn('⚠️ 저장 검증 실패:', verifyError);
            }
          }
        } catch (ipcError) {
          console.error('❌ Electron 설정 저장 IPC 오류:', ipcError);
          setError(`백엔드 저장 실패: ${ipcError}`);
        }
      } else {
        console.log('🌐 웹 환경에서 localStorage에 저장');
      }
      
      // localStorage에 항상 저장 (백업용)
      try {
        const storageKey = 'loop-settings';
        localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
        console.log('✅ localStorage 저장 완료');
        console.log('💾 localStorage 저장된 데이터:', localStorage.getItem(storageKey));
      } catch (storageError) {
        console.error('❌ localStorage 저장 실패:', storageError);
        if (!isElectron) {
          setError(`로컬 저장 실패: ${storageError}`);
        }
      }
      
      console.log('🏁 설정 저장 프로세스 완료');
      console.groupEnd();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설정 저장 실패';
      setError(errorMessage);
      console.error('💥 설정 저장 중 치명적 오류:', err);
      console.groupEnd();
      
      // 저장 실패 시 이전 상태로 롤백
      console.log('🔄 저장 실패로 인한 상태 롤백');
      setSettings(settings);
    }
  }, [settings, isElectron, electronAPI]);

  // 설정 리셋
  const resetSettings = useCallback(async () => {
    console.debug('🔄 useSettings: 설정 리셋 시작'); // 규칙 11번
    setSettings(defaultSettings);
    
    try {
      if (isElectron && electronAPI && electronAPI.settings) {
        try {
          const result = await electronAPI.settings.reset();
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
    
    // theme과 darkMode를 동시에 업데이트하여 동기화
    const updatedSettings: Partial<SettingsState> = { theme: newTheme };
    
    // darkMode도 함께 업데이트 (system인 경우 시스템 설정에 따라 결정)
    if (newTheme === 'system') {
      // 시스템 다크모드 감지
      const systemDarkMode = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      updatedSettings.darkMode = systemDarkMode;
    } else {
      updatedSettings.darkMode = newTheme === 'dark';
    }
    
    console.debug('🔄 useSettings: 동기화된 설정 업데이트', updatedSettings);
    saveSettings(updatedSettings);
  }, [settings.theme, saveSettings]);

  // 다크모드 토글
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !settings.darkMode;
    console.debug('🌙 useSettings: 다크모드 토글', settings.darkMode, '->', newDarkMode);
    
    // darkMode와 theme을 동시에 업데이트하여 동기화
    const updatedSettings: Partial<SettingsState> = {
      darkMode: newDarkMode,
      theme: newDarkMode ? 'dark' : 'light'  // darkMode와 theme을 일치시킴
    };
    
    console.debug('🔄 useSettings: 동기화된 다크모드 설정 업데이트', updatedSettings);
    saveSettings(updatedSettings);
  }, [settings.darkMode, saveSettings]);

  // GPU 가속 토글
  const toggleGPUAcceleration = useCallback(() => {
    console.debug('⚡ useSettings: GPU 가속 토글', !settings.enableGPUAcceleration); // 규칙 11번
    updateSetting('enableGPUAcceleration', !settings.enableGPUAcceleration);
  }, [settings.enableGPUAcceleration, updateSetting]);

  // 초기 로드 및 Electron API 감지 - COPILOT 규칙 11번: 디버깅 로그
  useEffect(() => {
    console.debug('🔄 useSettings: 컴포넌트 마운트, 설정 로드 시작'); // 규칙 11번
    loadSettings();
  }, [loadSettings]);

  // Electron API 준비 상태 감지하여 재로드
  useEffect(() => {
    if (isElectron && electronAPI && electronAPI.settings) {
      console.debug('🔌 useSettings: Electron Settings API 준비됨, 설정 재로드'); // 규칙 11번
      loadSettings();
    }
  }, [isElectron, electronAPI, loadSettings]);

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
      gpuAccelerationLevel: settings.gpuAccelerationLevel
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
