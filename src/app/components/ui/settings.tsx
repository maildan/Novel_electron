'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Moon, 
  Sun, 
  Minimize2, 
  Maximize2, 
  Eye, 
  Bell, 
  Activity, 
  User, 
  BarChart3,
  Database, 
  Shield,
  HardDrive,
  Gauge
} from 'lucide-react';
import { useSettings, type SettingsState, type WindowModeType } from '../../../hooks/useSettings';
import { useTheme } from './ThemeProvider';
import Restart from './restart';
import MemoryMonitor from './memory-monitor';
import ActivityMonitor from './activity-monitor';
import NativeModuleStatus from './native-module-status';

// 설정 카테고리 타입
type SettingCategory = 'general' | 'typing' | 'performance' | 'data' | 'typing-advanced';

// 확장된 ElectronAPI 헬퍼 함수들
const getElectronAPI = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const electronAPI = (window as unknown as { electronAPI?: unknown }).electronAPI;
  if (!electronAPI) {
    return null;
  }
  return electronAPI as {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    settings?: { updateMultiple: (settings: Record<string, unknown>) => Promise<{ success: boolean; error?: string }> };
    memory?: { optimize: () => Promise<{ success: boolean; error?: string }> };
    app?: { restart: () => void };
  };
};

// 성능 설정 탭 타입
type PerformanceTab = 'settings' | 'memory' | 'activity' | 'system';

// 설정 카테고리 정의
const settingCategories = [
  { id: 'general' as SettingCategory, label: '일반 설정', icon: User },
  { id: 'typing' as SettingCategory, label: '타이핑 분석', icon: BarChart3 },
  { id: 'performance' as SettingCategory, label: '성능 설정', icon: Activity },
  { id: 'data' as SettingCategory, label: '데이터 및 개인정보', icon: Shield },
];

interface SettingsProps {
  onSave?: (settings: SettingsState) => void;
  initialSettings?: SettingsState;
}

export function Settings({ onSave }: SettingsProps) {
  // 초기 설정 로깅
  console.log('설정 컴포넌트 초기화 - 프롭스 확인:', { 
    hasOnSave: !!onSave,
    timestamp: new Date().toISOString()
  });

  const { 
    settings, 
    isLoading,
    error: settingsError,
    saveSettings,
    resetSettings,  
  } = useSettings();

  // 에러 로깅
  if (settingsError) {
    console.error('설정 에러 발생:', {
      error: settingsError,
      timestamp: new Date().toISOString()
    });
  }
  
  const { 
    theme, 
    isDarkMode, 
    toggleDarkMode: themeToggleDarkMode
  } = useTheme();

  // 테마 관련 로깅 함수들
  const logToggleTheme = () => {
    console.log('테마 토글 요청:', { 
      currentTheme: theme, 
      timestamp: new Date().toISOString() 
    });
  };

  const logSetTheme = (newTheme: string) => {
    console.log('테마 설정 요청:', { 
      newTheme, 
      currentTheme: theme, 
      timestamp: new Date().toISOString() 
    });
  };
  
  const [_needsRestart, setNeedsRestart] = useState(false);

  // 재시작 로깅 함수
  const logRestartNeeded = (needed: boolean, reason?: string) => {
    console.log('재시작 필요 상태 변경:', { 
      needed, 
      reason,
      timestamp: new Date().toISOString() 
    });
    setNeedsRestart(needed);
  };
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [activePerformanceTab, setActivePerformanceTab] = useState<PerformanceTab>('settings');
  const [restartReason, setRestartReason] = useState('');
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general');
  const [isGPUOnlyChange, setIsGPUOnlyChange] = useState(false);
  
  // 슬라이드 애니메이션 관련 상태
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextCategory, setNextCategory] = useState<SettingCategory | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');

  // 통합 설정 업데이트 및 저장 헬퍼 함수
  const updateSettingAndSave = async <K extends keyof SettingsState>(
    key: K, 
    value: SettingsState[K]
  ) => {
    console.log(`⚙️ Settings: ${key} 설정 변경:`, value);
    
    // GPU 가속화가 아닌 다른 설정 변경 시 GPU 전용 변경 플래그 리셋
    if (key !== 'enableGPUAcceleration' && key !== 'gpuAccelerationLevel') {
      setIsGPUOnlyChange(false);
    }
    
    try {
      // useSettings의 saveSettings를 직접 호출하여 백엔드 저장 + 전역 상태 업데이트
      await saveSettings({ [key]: value } as Partial<SettingsState>);
      console.log(`✅ Settings: ${key} 설정 저장 및 상태 동기화 완료`);
    } catch (error) {
      console.error(`❌ Settings: ${key} 설정 저장 실패:`, error);
    }
  };

  // 카테고리 전환 핸들러 - 애니메이션 설정에 따라 동작
  const handleCategoryChange = (newCategory: SettingCategory) => {
    if (newCategory === activeCategory || isTransitioning) return;
    
    // 카테고리 변경 로깅
    logToggleTheme();
    logSetTheme(newCategory);
    
    // 애니메이션이 비활성화된 경우 즉시 전환
    if (!settings.enableAnimations) {
      setActiveCategory(newCategory);
      return;
    }
    
    // 애니메이션이 활성화된 경우 슬라이드 애니메이션 적용
    const currentIndex = settingCategories.findIndex(cat => cat.id === activeCategory);
    const newIndex = settingCategories.findIndex(cat => cat.id === newCategory);
    const direction = newIndex > currentIndex ? 'right' : 'left';
    
    setIsTransitioning(true);
    setNextCategory(newCategory);
    setAnimationDirection(direction);
    
    // 애니메이션 완료 후 카테고리 변경
    setTimeout(() => {
      setActiveCategory(newCategory);
      setNextCategory(null);
      setIsTransitioning(false);
    }, 300); // 애니메이션 지속 시간과 동일
  };

  // GPU 가속 토글 핸들러 - 사용자 확인 추가
  const handleGPUAccelerationToggle = async () => {
    const newValue = !settings.enableGPUAcceleration;
    
    // 사용자 확인 다이얼로그
    const actionText = newValue ? '활성화' : '비활성화';
    const userConfirmed = window.confirm(
      `GPU 가속을 ${actionText}하시겠습니까?\n\n` +
      `이 설정을 변경하면 애플리케이션이 재시작됩니다.\n` +
      `계속하시겠습니까?`
    );
    
    if (!userConfirmed) {
      return; // 사용자가 취소한 경우 아무것도 하지 않음
    }
    
    // GPU 전용 변경임을 표시
    setIsGPUOnlyChange(true);
    
    // 설정 저장
    await updateSettingAndSave('enableGPUAcceleration', newValue);
    
    // GPU 설정 변경 시 IPC 호출 및 재시작 권장
    try {
      const electronAPI = getElectronAPI();
      if (electronAPI) {
        const result = await electronAPI.invoke('setGPUAcceleration', newValue) as { success: boolean; requiresRestart?: boolean };
        if (result.success) {
          console.log(`GPU 가속: ${newValue ? '활성화' : '비활성화'}`);
          if (result.requiresRestart) {
            setRestartReason(`GPU 가속 ${actionText}`);
            setShowRestartDialog(true);
            logRestartNeeded(true, 'GPU 가속 설정 변경');
          }
        }
      }
    } catch (error) {
      console.error('GPU 가속 설정 실패:', error);
      // 오류 발생 시 설정 롤백
      await updateSettingAndSave('enableGPUAcceleration', !newValue);
      // GPU 전용 변경 플래그도 리셋
      setIsGPUOnlyChange(false);
    }
  };

  const handleProcessingModeChange = async (mode: SettingsState['processingMode']) => {
    const currentMode = settings.processingMode;
    
    // 같은 모드를 선택한 경우 아무것도 하지 않음
    if (currentMode === mode) {
      return;
    }
    
    // 재시작이 필요한 모드인지 확인
    const requiresRestart = mode === 'gpu-intensive' || mode === 'cpu-intensive';
    
    if (requiresRestart) {
      const modeText = mode === 'gpu-intensive' ? 'GPU 집약적 모드' : 'CPU 집약적 모드';
      const userConfirmed = window.confirm(
        `처리 모드를 "${modeText}"로 변경하시겠습니까?\n\n` +
        `이 설정을 변경하면 애플리케이션이 재시작됩니다.\n` +
        `계속하시겠습니까?`
      );
      
      if (!userConfirmed) {
        return; // 사용자가 취소한 경우 아무것도 하지 않음
      }
    }
    
    // 설정 저장
    await updateSettingAndSave('processingMode', mode);
    
    if (requiresRestart) {
      const modeText = mode === 'gpu-intensive' ? 'GPU 집약적 모드' : 'CPU 집약적 모드';
      setRestartReason(`처리 모드 변경 (${modeText})`);
      setShowRestartDialog(true);
      logRestartNeeded(true, `처리 모드 변경: ${modeText}`);
    }
    
    // 처리 모드 변경을 즉시 적용
    try {
      const electronAPI = getElectronAPI();
      if (electronAPI) {
        // 처리 모드에 따른 설정 적용 (향후 구현)
        console.log(`처리 모드 변경: ${mode}`);
      }
    } catch (error) {
      console.error('처리 모드 변경 실패:', error);
      // 오류 발생 시 설정 롤백
      await updateSettingAndSave('processingMode', currentMode);
    }
  };

  const handleWindowModeChange = async (mode: WindowModeType) => {
    console.log(`⚙️ Settings: 윈도우 모드 변경: ${mode}`);
    await updateSettingAndSave('windowMode', mode);
  };

  const handleMemoryOptimization = async () => {
    const newValue = !settings.enableMemoryOptimization;
    
    // 설정 저장
    await updateSettingAndSave('enableMemoryOptimization', newValue);
    
    // 메모리 최적화가 활성화되면 실제 최적화 실행
    if (newValue) {
      try {
        const electronAPI = getElectronAPI();
        if (electronAPI?.memory?.optimize) {
          const result = await electronAPI.memory.optimize();
          console.log('메모리 최적화 완료:', result);
          // 간단한 피드백 제공
          setShowSaveConfirm(true);
          setTimeout(() => setShowSaveConfirm(false), 2000);
        }
      } catch (error) {
        console.error('메모리 최적화 실패:', error);
      }
    }
  };

  const handleSave = async () => {
    console.log('⚙️ Settings: 저장 시작');
    
    try {
      // 저장 중 상태 표시
      setShowSaveConfirm(false);
      
      // 백엔드 연결 상태 확인
      const electronAPI = getElectronAPI();
      if (electronAPI) {
        console.log('🔌 Settings: Electron IPC를 통한 저장 시도');
        
        try {
          // 백엔드에 설정 저장 요청
          const result = await electronAPI.settings?.updateMultiple?.(settings as unknown as Record<string, unknown>);
          console.log('📡 Settings: 백엔드 응답:', result);
          
          if (result && result.success !== false) {
            console.log('✅ Settings: 백엔드 저장 성공');
            
            // 저장 성공 메시지 표시
            setShowSaveConfirm(true);
            setTimeout(() => setShowSaveConfirm(false), 3000);
            
            // 부모 컴포넌트에 저장 완료 알림
            onSave?.(settings);

            // GPU 가속화 설정만 변경된 경우가 아니라면 앱 새로고침
            if (!isGPUOnlyChange) {
              console.log('🔄 Settings: GPU 가속화 외 설정 변경으로 인한 앱 새로고침');
              setTimeout(() => {
                const electronAPI = getElectronAPI();
                if (electronAPI?.app?.restart) {
                  // Electron 환경에서는 앱 재시작
                  electronAPI.app.restart();
                } else {
                  // 웹 환경에서는 페이지 새로고침
                  window.location.reload();
                }
              }, 1000); // 저장 완료 메시지를 보여준 후 새로고침
            } else {
              console.log('🎯 Settings: GPU 가속화만 변경됨 - 새로고침 건너뜀');
              // GPU 전용 변경 플래그 리셋
              setIsGPUOnlyChange(false);
            }
          } else {
            throw new Error('백엔드 저장 실패: ' + (result?.error || '알 수 없는 오류'));
          }
        } catch (ipcError) {
          console.error('❌ Settings: IPC 통신 오류:', ipcError);
          throw new Error('설정 저장 중 통신 오류가 발생했습니다.');
        }
      } else {
        console.log('🌐 Settings: 웹 환경에서 localStorage 저장');
        
        // 웹 환경에서는 localStorage 사용
        localStorage.setItem('loop-settings', JSON.stringify(settings));
        
        // 저장 성공 메시지 표시
        setShowSaveConfirm(true);
        setTimeout(() => setShowSaveConfirm(false), 3000);
        
        // 부모 컴포넌트에 저장 완료 알림
        onSave?.(settings);

        // GPU 가속화 설정만 변경된 경우가 아니라면 페이지 새로고침
        if (!isGPUOnlyChange) {
          console.log('🔄 Settings: GPU 가속화 외 설정 변경으로 인한 페이지 새로고침');
          setTimeout(() => {
            window.location.reload();
          }, 1000); // 저장 완료 메시지를 보여준 후 새로고침
        } else {
          console.log('🎯 Settings: GPU 가속화만 변경됨 - 새로고침 건너뜀');
          // GPU 전용 변경 플래그 리셋
          setIsGPUOnlyChange(false);
        }
      }
      
    } catch (error) {
      console.error('❌ Settings: 저장 중 오류', error);
      
      // 저장 실패 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '설정 저장에 실패했습니다.';
      alert(`저장 실패: ${errorMessage}\n\n다시 시도해주세요.`);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      // settings는 useSettings 훅에서 관리되므로 별도 상태 업데이트 불필요
      setNeedsRestart(false);
    } catch (error) {
      console.error('설정 초기화 실패:', error);
    }
  };

  const toggleDarkMode = async () => {
    console.log('⚙️ Settings: 다크모드 토글 버튼 클릭');
    
    // 현재 다크모드 상태의 반대값으로 설정
    const newDarkMode = !settings.darkMode;
    
    // 백엔드에 저장
    await updateSettingAndSave('darkMode', newDarkMode);
    
    // 테마 설정도 함께 업데이트 (darkMode가 true면 theme을 'dark'로 설정)
    const newTheme = newDarkMode ? 'dark' : 'light';
    await updateSettingAndSave('theme', newTheme);
    
    // ThemeProvider의 다크모드 토글도 호출 (DOM 업데이트용)
    await themeToggleDarkMode();
  };

  // 카테고리별 콘텐츠 렌더링 - 가시성 개선
  const renderCategoryContent = (category?: SettingCategory) => {
    const currentCategory = category || activeCategory;
    console.log('Settings: Rendering category content for:', currentCategory); // 디버깅용
    
    switch (currentCategory) {
      case 'general':
        console.log('Settings: Rendering general category'); // 디버깅용
        return (
          <div className="space-y-6" style={{ minHeight: '400px', visibility: 'visible' }}>
            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 p-6 settings-card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                일반 설정
              </h3>
              
              <div className="space-y-4">
                {/* 다크 모드 토글 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <div className="flex items-center space-x-2">
                      {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span>다크 모드 ({theme})</span>
                    </div>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={toggleDarkMode}
                      className={`toggle-switch ${isDarkMode ? 'active' : ''}`}
                      role="switch"
                      aria-checked={isDarkMode}
                      aria-label="다크 모드 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 창 모드 설정 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">창 모드</label>
                  <div className="space-y-2">
                    {[
                      { value: 'windowed', label: '창 모드', icon: Minimize2 },
                      { value: 'fullscreen', label: '전체 화면', icon: Maximize2 },
                      { value: 'fullscreenAutoHide', label: '전체 화면 (자동 숨김)', icon: Eye }
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => handleWindowModeChange(mode.value as WindowModeType)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 border ${settings.enableAnimations ? 'transition-colors' : ''} settings-action-button ${
                          settings.windowMode === mode.value
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <mode.icon className="h-4 w-4" />
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 애니메이션 효과 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>애니메이션 효과</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableAnimations', !settings.enableAnimations)}
                      className={`toggle-switch ${settings.enableAnimations ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableAnimations}
                      aria-label="애니메이션 효과 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 알림 활성화 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>알림 활성화</span>
                    </div>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableNotifications', !settings.enableNotifications)}
                      className={`toggle-switch ${settings.enableNotifications ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableNotifications}
                      aria-label="알림 활성화 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'typing':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                타이핑 분석
              </h3>
              
              <div className="space-y-4">
                {/* 분석 카테고리 토글들 */}
                {Object.entries(settings.enabledCategories).map(([category, enabled]) => (
                  <div key={category} className="settings-row">
                    <div className="settings-label">
                      <span>
                        {category === 'docs' && '문서'}
                        {category === 'office' && '오피스'}
                        {category === 'coding' && '코딩'}
                        {category === 'sns' && 'SNS'}
                        {category === 'browser' && '브라우저'}
                        {category === 'game' && '게임'}
                        {category === 'media' && '미디어'}
                        {category === 'other' && '기타'}
                      </span>
                    </div>
                    <div className="toggle-container">
                      <button
                        onClick={() => updateSettingAndSave('enabledCategories', {
                          ...settings.enabledCategories,
                          [category]: !enabled
                        })}
                        className={`toggle-switch ${enabled ? 'active' : ''}`}
                        role="switch"
                        aria-checked={enabled as boolean}
                        aria-label={`${category} 분석 토글`}
                      >
                        <div className="toggle-thumb" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* 실시간 통계 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>실시간 통계</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableRealTimeStats', !settings.enableRealTimeStats)}
                      className={`toggle-switch ${settings.enableRealTimeStats ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableRealTimeStats}
                      aria-label="실시간 통계 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'typing-advanced':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                타이핑 분석 설정
              </h3>
              
              <div className="space-y-4">
                {/* 분석 활성화 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>타이핑 분석 활성화</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableTypingAnalysis', !settings.enableTypingAnalysis)}
                      className={`toggle-switch ${settings.enableTypingAnalysis ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableTypingAnalysis}
                      aria-label="타이핑 분석 활성화 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 실시간 분석 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>실시간 분석</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableRealTimeAnalysis', !settings.enableRealTimeAnalysis)}
                      className={`toggle-switch ${settings.enableRealTimeAnalysis ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableRealTimeAnalysis}
                      aria-label="실시간 분석 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 통계 수집 주기 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    통계 수집 주기: {settings.statsCollectionInterval}초
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={settings.statsCollectionInterval}
                    onChange={(e) => {
                      // 슬라이더 이동 중에는 시각적 업데이트만, 실제 저장은 onMouseUp에서
                      const newValue = parseInt(e.target.value);
                      console.debug('[설정] 통계 수집 간격 슬라이더 조정:', {newValue, 현재값: settings.statsCollectionInterval});
                      // 임시로 DOM 값을 업데이트 (시각적 피드백)
                    }}
                    onMouseUp={(e) => updateSettingAndSave('statsCollectionInterval', parseInt((e.target as HTMLInputElement).value))}
                    className="w-full"
                  />
                </div>

                {/* 키보드 레이아웃 감지 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>키보드 레이아웃 자동 감지</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableKeyboardDetection', !settings.enableKeyboardDetection)}
                      className={`toggle-switch ${settings.enableKeyboardDetection ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableKeyboardDetection}
                      aria-label="키보드 레이아웃 자동 감지 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 타이핑 패턴 학습 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <span>타이핑 패턴 학습</span>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enablePatternLearning', !settings.enablePatternLearning)}
                      className={`toggle-switch ${settings.enablePatternLearning ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enablePatternLearning}
                      aria-label="타이핑 패턴 학습 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance': {
        const performanceTabs = [
          { id: 'settings' as PerformanceTab, label: '성능 설정', icon: Activity },
          { id: 'memory' as PerformanceTab, label: '메모리 모니터', icon: HardDrive },
          { id: 'activity' as PerformanceTab, label: '활성 상태', icon: Gauge },
          { id: 'system' as PerformanceTab, label: '시스템 정보', icon: Database },
        ];

        return (
          <div className="space-y-6">
            {/* 탭 네비게이션 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {performanceTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePerformanceTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg ${settings.enableAnimations ? 'transition-colors' : ''} ${
                        activePerformanceTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              
              {/* 탭 컨텐츠 */}
              <div className="p-6">
                {activePerformanceTab === 'settings' && renderPerformanceSettings()}
                {activePerformanceTab === 'memory' && renderMemoryMonitor()}
                {activePerformanceTab === 'activity' && renderActivityMonitor()}
                {activePerformanceTab === 'system' && renderSystemInfo()}
              </div>
            </div>
          </div>
        );
      }

      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                데이터 및 개인정보
              </h3>
              
              <div className="space-y-4">
                {/* 데이터 수집 허용 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <div className="flex flex-col">
                      <span>데이터 수집 허용</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        앱 개선을 위한 익명 사용 데이터 수집
                      </span>
                    </div>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableDataCollection', !settings.enableDataCollection)}
                      className={`toggle-switch ${settings.enableDataCollection ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableDataCollection}
                      aria-label="데이터 수집 허용 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 자동 저장 */}
                <div className="settings-row">
                  <div className="settings-label">
                    <div className="flex flex-col">
                      <span>자동 저장</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        설정 변경 시 자동으로 저장
                      </span>
                    </div>
                  </div>
                  <div className="toggle-container">
                    <button
                      onClick={() => updateSettingAndSave('enableAutoSave', !settings.enableAutoSave)}
                      className={`toggle-switch ${settings.enableAutoSave ? 'active' : ''}`}
                      role="switch"
                      aria-checked={settings.enableAutoSave}
                      aria-label="자동 저장 토글"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 데이터 보관 기간 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    데이터 보관 기간: {settings.dataRetentionDays}일
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="365"
                    step="7"
                    value={settings.dataRetentionDays}
                    onChange={(e) => {
                      // 실시간으로 설정 업데이트하고 저장
                      updateSettingAndSave('dataRetentionDays', parseInt(e.target.value));
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>7일</span>
                    <span>1년</span>
                  </div>
                </div>

                {/* 데이터 내보내기/삭제 버튼 */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        // 데이터 내보내기 로직 (향후 구현)
                        console.log('데이터 내보내기 요청');
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${settings.enableAnimations ? 'transition-colors' : ''}`}
                    >
                      <Database className="h-4 w-4" />
                      데이터 내보내기
                    </button>
                    
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(
                          '모든 저장된 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
                        );
                        if (confirmed) {
                          // 데이터 삭제 로직 (향후 구현)
                          console.log('데이터 삭제 요청');
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${settings.enableAnimations ? 'transition-colors' : ''}`}
                    >
                      <Shield className="h-4 w-4" />
                      모든 데이터 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>카테고리를 선택해주세요.</div>;
    }
  };

  // 성능 설정 탭별 렌더링 함수들
  const renderPerformanceSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        성능 설정
      </h3>
      
      <div className="space-y-4">
        {/* GPU 가속 */}
        <div className="settings-row">
          <div className="settings-label">
            <div className="flex flex-col">
              <span>GPU 가속</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                변경 시 애플리케이션이 재시작됩니다
              </span>
            </div>
          </div>
          <div className="toggle-container">
            <button
              onClick={handleGPUAccelerationToggle}
              className={`toggle-switch ${settings.enableGPUAcceleration ? 'active' : ''}`}
              role="switch"
              aria-checked={settings.enableGPUAcceleration}
              aria-label="GPU 가속 토글"
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* 메모리 최적화 */}
        <div className="settings-row">
          <div className="settings-label">
            <span>메모리 최적화</span>
          </div>
          <div className="toggle-container">
            <button
              onClick={handleMemoryOptimization}
              className={`toggle-switch ${settings.enableMemoryOptimization ? 'active' : ''}`}
              role="switch"
              aria-checked={settings.enableMemoryOptimization}
              aria-label="메모리 최적화 토글"
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* 처리 모드 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">처리 모드</label>
          <div className="space-y-2">
            {[
              { value: 'balanced', label: '균형 모드', description: '성능과 전력 소비의 균형' },
              { value: 'performance', label: '성능 우선', description: '최대 성능 모드' },
              { value: 'powerSaver', label: '절전 모드', description: '최소 전력 소비' },
              { value: 'gpu-intensive', label: 'GPU 집약적', description: 'GPU 활용 최대화 (재시작 필요)' },
              { value: 'cpu-intensive', label: 'CPU 집약적', description: 'CPU 활용 최대화 (재시작 필요)' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleProcessingModeChange(mode.value as SettingsState['processingMode'])}
                className={`w-full flex flex-col items-start space-y-1 px-4 py-3 rounded-lg border ${settings.enableAnimations ? 'transition-colors' : ''} ${
                  settings.processingMode === mode.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 메모리 임계값 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            메모리 임계값: {settings.maxMemoryThreshold}MB
          </label>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={settings.maxMemoryThreshold}
            onChange={(e) => {
              // 슬라이더 이동 중에는 시각적 업데이트만, 실제 저장은 onMouseUp에서
              console.debug('[설정] 메모리 임계값 슬라이더 조정:', {값: e.target.value, 현재값: settings.maxMemoryThreshold});
            }}
            onMouseUp={(e) => updateSettingAndSave('maxMemoryThreshold', parseInt((e.target as HTMLInputElement).value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderMemoryMonitor = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <HardDrive className="h-5 w-5 mr-2" />
        메모리 모니터
      </h3>
      <MemoryMonitor />
    </div>
  );

  const renderActivityMonitor = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Gauge className="h-5 w-5 mr-2" />
        활성 상태
      </h3>
      <ActivityMonitor />
    </div>
  );

  const renderSystemInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Database className="h-5 w-5 mr-2" />
        시스템 정보
      </h3>
      <NativeModuleStatus />
    </div>
  );

  if (isLoading) {
    console.log('Settings: Loading state'); // 디버깅용
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('Settings: Rendering main component'); // 디버깅용

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-950">
      {/* 좌측 카테고리 네비게이션 - border-radius 제거 */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col settings-navigation">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            설정
          </h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {settingCategories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 ${settings.enableAnimations ? 'transition-all duration-200' : ''} settings-action-button ${
                    activeCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 active'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <category.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 저장/초기화 버튼 - border-radius 제거, 슬라이드 효과 추가 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 ${settings.enableAnimations ? 'transition-all duration-200 hover:translate-x-0.5' : ''} focus:outline-none focus:ring-0`}
          >
            <Save className="h-4 w-4" />
            저장
          </button>
          
          <button
            onClick={handleReset}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 ${settings.enableAnimations ? 'transition-all duration-200 hover:translate-x-0.5' : ''} focus:outline-none focus:ring-0`}
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>
      </div>

      {/* 우측 콘텐츠 영역 - 순수 슬라이드 애니메이션 */}
      <div className="flex-1 settings-content-container">
        {/* 현재 활성 카테고리 */}
        <div 
          className={`settings-content-page active ${
            isTransitioning && settings.enableAnimations
              ? (animationDirection === 'right' ? 'settings-slide-out-left' : 'settings-slide-out-right')
              : ''
          }`}
          style={{ position: isTransitioning ? 'absolute' : 'relative' }}
        >
          <div className="p-6 min-h-full">
            {renderCategoryContent()}
          </div>
        </div>
        
        {/* 전환 중인 다음 카테고리 */}
        {isTransitioning && nextCategory && (
          <div 
            className={`settings-content-page ${
              settings.enableAnimations
                ? (animationDirection === 'right' ? 'settings-slide-in-right' : 'settings-slide-in-left')
                : ''
            }`}
            style={{ position: 'absolute' }}
          >
            <div className="p-6 min-h-full">
              {nextCategory && renderCategoryContent(nextCategory)}
            </div>
          </div>
        )}
      </div>

      {/* 저장 확인 메시지 - 개선된 스타일 */}
      {showSaveConfirm && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 shadow-lg z-50 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">설정이 성공적으로 저장되었습니다!</span>
        </div>
      )}

      {/* 재시작 다이얼로그 */}
      <Restart
        isVisible={showRestartDialog}
        reason={restartReason}
        onRestart={() => {
          console.log('🔄 애플리케이션 재시작 요청');
          setShowRestartDialog(false);
        }}
        onClose={() => {
          setShowRestartDialog(false);
          setNeedsRestart(true); // 재시작 필요 알림은 유지
        }}
      />
    </div>
  );
}
