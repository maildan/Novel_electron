'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Monitor, 
  Moon, 
  Sun, 
  Minimize2, 
  Maximize2, 
  Eye, 
  Bell, 
  Cpu, 
  Zap, 
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
type SettingCategory = 'general' | 'typing' | 'performance' | 'data';

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

export function Settings({ onSave, initialSettings }: SettingsProps) {
  const { 
    settings, 
    isLoading,
    error,
    saveSettings,
    resetSettings,  
  } = useSettings();
  
  const { 
    theme, 
    isDarkMode, 
    toggleDarkMode: themeToggleDarkMode, 
    toggleTheme,
    setTheme 
  } = useTheme();
  
  const [needsRestart, setNeedsRestart] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [restartReason, setRestartReason] = useState('');
  const [localSettings, setLocalSettings] = useState<SettingsState>(settings);
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general');

  // 설정이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // 초기 설정이 제공된 경우 업데이트
  useEffect(() => {
    if (initialSettings) {
      setLocalSettings(initialSettings);
    }
  }, [initialSettings]);

  // GPU 가속 토글 핸들러 - 사용자 확인 추가
  const handleGPUAccelerationToggle = async () => {
    const newValue = !localSettings.enableGPUAcceleration;
    
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
    
    setLocalSettings(prev => ({ ...prev, enableGPUAcceleration: newValue }));
    
    // GPU 설정 변경 시 IPC 호출 및 재시작 권장
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('setGPUAcceleration', newValue);
        if (result.success) {
          console.log(`GPU 가속: ${newValue ? '활성화' : '비활성화'}`);
          if (result.requiresRestart) {
            setRestartReason(`GPU 가속 ${actionText}`);
            setShowRestartDialog(true);
            setNeedsRestart(true);
          }
        }
      }
    } catch (error) {
      console.error('GPU 가속 설정 실패:', error);
      // 오류 발생 시 설정 롤백
      setLocalSettings(prev => ({ ...prev, enableGPUAcceleration: !newValue }));
    }
  };

  const handleProcessingModeChange = async (mode: SettingsState['processingMode']) => {
    const currentMode = localSettings.processingMode;
    
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
    
    setLocalSettings((prev: SettingsState) => ({ ...prev, processingMode: mode }));
    
    if (requiresRestart) {
      const modeText = mode === 'gpu-intensive' ? 'GPU 집약적 모드' : 'CPU 집약적 모드';
      setRestartReason(`처리 모드 변경 (${modeText})`);
      setShowRestartDialog(true);
      setNeedsRestart(true);
    }
    
    // 처리 모드 변경을 즉시 적용
    try {
      if (window.electronAPI) {
        // 처리 모드에 따른 설정 적용 (향후 구현)
        console.log(`처리 모드 변경: ${mode}`);
      }
    } catch (error) {
      console.error('처리 모드 변경 실패:', error);
      // 오류 발생 시 설정 롤백
      setLocalSettings((prev: SettingsState) => ({ ...prev, processingMode: currentMode }));
    }
  };

  const handleWindowModeChange = async (mode: WindowModeType) => {
    setLocalSettings((prev: SettingsState) => ({ ...prev, windowMode: mode }));
    
    // 윈도우 모드 변경을 즉시 적용하기 위해 설정 저장
    try {
      const updatedSettings = { ...localSettings, windowMode: mode };
      await saveSettings(updatedSettings);
      console.log(`윈도우 모드 변경: ${mode}`);
    } catch (error) {
      console.error('윈도우 모드 변경 실패:', error);
    }
  };

  const handleMemoryOptimization = async () => {
    const newValue = !localSettings.enableMemoryOptimization;
    setLocalSettings(prev => ({ ...prev, enableMemoryOptimization: newValue }));
    
    // 메모리 최적화가 활성화되면 실제 최적화 실행
    if (newValue) {
      try {
        if (window.electronAPI?.memory?.optimize) {
          const result = await window.electronAPI.memory.optimize();
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
    try {
      await saveSettings(localSettings);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
      onSave?.(localSettings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      setLocalSettings(settings);
      setNeedsRestart(false);
    } catch (error) {
      console.error('설정 초기화 실패:', error);
    }
  };

  const toggleDarkMode = async () => {
    console.log('⚙️ Settings: 다크모드 토글 버튼 클릭');
    await themeToggleDarkMode();
  };

  // 카테고리별 콘텐츠 렌더링
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                일반 설정
              </h3>
              
              <div className="space-y-4">
                {/* 다크 모드 토글 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span className="text-gray-900 dark:text-white">다크 모드 ({theme})</span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${
                          localSettings.windowMode === mode.value
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
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">애니메이션 효과</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableAnimations: !prev.enableAnimations }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableAnimations ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableAnimations ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 알림 활성화 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-gray-900 dark:text-white">알림 활성화</span>
                  </div>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableNotifications: !prev.enableNotifications }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableNotifications ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                {Object.entries(localSettings.enabledCategories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white capitalize">{category}</span>
                    <button
                      onClick={() => setLocalSettings(prev => ({
                        ...prev,
                        enabledCategories: {
                          ...prev.enabledCategories,
                          [category]: !enabled
                        }
                      }))}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                
                {/* 실시간 통계 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">실시간 통계</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableRealTimeStats: !prev.enableRealTimeStats }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableRealTimeStats ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableRealTimeStats ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                성능 설정
              </h3>
              
              <div className="space-y-4">
                {/* GPU 가속 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-gray-900 dark:text-white">GPU 가속</span>
                  </div>
                  <button
                    onClick={handleGPUAccelerationToggle}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableGPUAcceleration ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableGPUAcceleration ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 메모리 최적화 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-gray-900 dark:text-white">메모리 최적화</span>
                  </div>
                  <button
                    onClick={handleMemoryOptimization}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableMemoryOptimization ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableMemoryOptimization ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 처리 모드 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">처리 모드</label>
                  <select
                    value={localSettings.processingMode}
                    onChange={(e) => handleProcessingModeChange(e.target.value as SettingsState['processingMode'])}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">자동</option>
                    <option value="normal">일반</option>
                    <option value="cpuIntensive">CPU 집약적</option>
                    <option value="gpuIntensive">GPU 집약적</option>
                  </select>
                </div>

                {/* 메모리 임계값 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    최대 메모리 임계값: {localSettings.maxMemoryThreshold}MB
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={localSettings.maxMemoryThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, maxMemoryThreshold: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 시스템 모니터링 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                시스템 모니터링
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    메모리 모니터
                  </h4>
                  <MemoryMonitor />
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Gauge className="h-4 w-4 mr-2" />
                    활성 상태
                  </h4>
                  <ActivityMonitor />
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    시스템 정보
                  </h4>
                  <NativeModuleStatus />
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
                타이핑 분석 설정
              </h3>
              
              <div className="space-y-4">
                {/* 분석 활성화 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">타이핑 분석 활성화</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableTypingAnalysis: !prev.enableTypingAnalysis }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableTypingAnalysis ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableTypingAnalysis ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 실시간 분석 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">실시간 분석</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableRealTimeAnalysis: !prev.enableRealTimeAnalysis }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableRealTimeAnalysis ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableRealTimeAnalysis ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 통계 수집 주기 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    통계 수집 주기: {localSettings.statsCollectionInterval}초
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={localSettings.statsCollectionInterval}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, statsCollectionInterval: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* 키보드 레이아웃 감지 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">키보드 레이아웃 자동 감지</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableKeyboardDetection: !prev.enableKeyboardDetection }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableKeyboardDetection ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableKeyboardDetection ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 타이핑 패턴 학습 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">타이핑 패턴 학습</span>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enablePatternLearning: !prev.enablePatternLearning }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enablePatternLearning ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enablePatternLearning ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                성능 설정
              </h3>
              
              <div className="space-y-4">
                {/* GPU 가속 */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white">GPU 가속</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      변경 시 애플리케이션이 재시작됩니다
                    </span>
                  </div>
                  <button
                    onClick={handleGPUAccelerationToggle}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableGPUAcceleration ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableGPUAcceleration ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 메모리 최적화 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">메모리 최적화</span>
                  <button
                    onClick={handleMemoryOptimization}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableMemoryOptimization ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableMemoryOptimization ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                        className={`w-full flex flex-col items-start space-y-1 px-4 py-3 rounded-lg border transition-colors ${
                          localSettings.processingMode === mode.value
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
                    메모리 임계값: {localSettings.maxMemoryThreshold}MB
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={localSettings.maxMemoryThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, maxMemoryThreshold: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 시스템 모니터링 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                시스템 모니터링
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    메모리 모니터
                  </h4>
                  <MemoryMonitor />
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Gauge className="h-4 w-4 mr-2" />
                    활성 상태
                  </h4>
                  <ActivityMonitor />
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    시스템 정보
                  </h4>
                  <NativeModuleStatus />
                </div>
              </div>
            </div>
          </div>
        );

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
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white">데이터 수집 허용</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      앱 개선을 위한 익명 사용 데이터 수집
                    </span>
                  </div>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableDataCollection: !prev.enableDataCollection }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableDataCollection ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableDataCollection ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 자동 저장 */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white">자동 저장</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      설정 변경 시 자동으로 저장
                    </span>
                  </div>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, enableAutoSave: !prev.enableAutoSave }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      localSettings.enableAutoSave ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings.enableAutoSave ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 데이터 보관 기간 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    데이터 보관 기간: {localSettings.dataRetentionDays}일
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="365"
                    step="7"
                    value={localSettings.dataRetentionDays}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-950">
      {/* 좌측 카테고리 네비게이션 */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
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
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
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

        {/* 저장/초기화 버튼 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
          
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>
      </div>

      {/* 우측 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto p-6">
        {renderCategoryContent()}
      </div>

      {/* 저장 확인 메시지 */}
      {showSaveConfirm && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          설정이 저장되었습니다!
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
