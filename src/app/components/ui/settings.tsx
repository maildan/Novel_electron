'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Monitor, Moon, Sun, Minimize2, Maximize2, Eye, Bell, Cpu, Zap, Activity } from 'lucide-react';
import { useSettings, type SettingsState, type WindowModeType } from '../../../hooks/useSettings';
import { useTheme } from './ThemeProvider';

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
  const [localSettings, setLocalSettings] = useState<SettingsState>(settings);

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

  const handleCategoryChange = (category: keyof SettingsState['enabledCategories'], value: boolean) => {
    setLocalSettings((prev: SettingsState) => ({
      ...prev,
      enabledCategories: {
        ...prev.enabledCategories,
        [category]: value
      }
    }));
  };

  const handleProcessingModeChange = (mode: SettingsState['processingMode']) => {
    setLocalSettings((prev: SettingsState) => ({ ...prev, processingMode: mode }));
    if (mode === 'gpu-intensive' || mode === 'cpu-intensive') {
      setNeedsRestart(true);
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

  const changeWindowMode = (mode: WindowModeType) => {
    setLocalSettings((prev: SettingsState) => ({ ...prev, windowMode: mode }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">설정을 불러오는 중 오류가 발생했습니다: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">설정</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>초기화</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>저장</span>
          </button>
        </div>
      </div>

      {showSaveConfirm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 font-medium">설정이 성공적으로 저장되었습니다!</p>
        </div>
      )}

      {needsRestart && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-600 font-medium">
            일부 설정을 적용하려면 애플리케이션을 다시 시작해야 합니다.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일반 설정 */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>일반 설정</span>
          </h2>

          <div className="space-y-4">
            {/* 다크 모드 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>다크 모드</span>
                <span className="text-xs text-gray-500">({theme})</span>
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

            {/* 창 모드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">창 모드</label>
              <div className="grid grid-cols-1 gap-2">
                {(['windowed', 'fullscreen', 'fullscreen-auto-hide'] as WindowModeType[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => changeWindowMode(mode)}
                    className={`p-2 text-left rounded border transition-colors ${
                      localSettings.windowMode === mode
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {mode === 'windowed' && <Minimize2 className="h-4 w-4" />}
                      {mode === 'fullscreen' && <Maximize2 className="h-4 w-4" />}
                      {mode === 'fullscreen-auto-hide' && <Eye className="h-4 w-4" />}
                      <span>
                        {mode === 'windowed' && '창 모드'}
                        {mode === 'fullscreen' && '전체 화면'}
                        {mode === 'fullscreen-auto-hide' && '전체 화면 (자동 숨김)'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 애니메이션 */}
            <div className="flex items-center justify-between">
              <span>애니메이션 효과</span>
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

            {/* 알림 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>알림 활성화</span>
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

        {/* 성능 설정 */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Cpu className="h-5 w-5" />
            <span>성능 설정</span>
          </h2>

          <div className="space-y-4">
            {/* GPU 가속 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>GPU 가속</span>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, enableGPUAcceleration: !prev.enableGPUAcceleration }))}
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
                <span>메모리 최적화</span>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, enableMemoryOptimization: !prev.enableMemoryOptimization }))}
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
              <label className="text-sm font-medium text-gray-700">처리 모드</label>
              <select
                value={localSettings.processingMode}
                onChange={(e) => handleProcessingModeChange(e.target.value as SettingsState['processingMode'])}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">자동</option>
                <option value="normal">일반</option>
                <option value="cpu-intensive">CPU 집약적</option>
                <option value="gpu-intensive">GPU 집약적</option>
              </select>
            </div>

            {/* 메모리 임계값 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                최대 메모리 임계값: {localSettings.maxMemoryThreshold}MB
              </label>
              <input
                type="range"
                min="100"
                max="2048"
                step="50"
                value={localSettings.maxMemoryThreshold}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, maxMemoryThreshold: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 타이핑 분석 설정 */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">타이핑 분석</h2>

          <div className="space-y-4">
            {/* 카테고리 활성화 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">분석 카테고리</label>
              <div className="space-y-2">
                {Object.entries(localSettings.enabledCategories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">
                      {category === 'docs' && '문서'}
                      {category === 'office' && '오피스'}
                      {category === 'coding' && '코딩'}
                      {category === 'sns' && 'SNS'}
                    </span>
                    <button
                      onClick={() => handleCategoryChange(category as keyof SettingsState['enabledCategories'], !enabled)}
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
              </div>
            </div>

            {/* 실시간 통계 */}
            <div className="flex items-center justify-between">
              <span>실시간 통계 표시</span>
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

        {/* 데이터 설정 */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">데이터 및 개인정보</h2>

          <div className="space-y-4">
            {/* 데이터 수집 */}
            <div className="flex items-center justify-between">
              <span>데이터 수집 허용</span>
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
              <span>자동 저장</span>
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
              <label className="text-sm font-medium text-gray-700">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
