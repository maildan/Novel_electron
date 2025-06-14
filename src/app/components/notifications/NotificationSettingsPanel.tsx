'use client';

import React from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  MemoryStick, 
  CheckSquare, 
  FileText,
  CornerDownRight
} from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import { NotificationSettings } from './types';

/**
 * 알림 설정 패널 컴포넌트
 * 사용자가 요청한 모든 알림 설정 옵션 포함
 */
interface NotificationSettingsPanelProps {
  className?: string;
}

export function NotificationSettingsPanel({ className = '' }: NotificationSettingsPanelProps) {
  const { settings, updateSettings } = useNotifications();

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleSelectChange = (key: keyof NotificationSettings, value: string | number) => {
    updateSettings({ [key]: value });
  };

  // 토글 스위치 컴포넌트
  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    disabled = false 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked 
          ? 'bg-blue-600 dark:bg-blue-500' 
          : 'bg-gray-200 dark:bg-gray-700'
        }
      `}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  // 설정 섹션 컴포넌트
  const SettingSection = ({ 
    icon, 
    title, 
    description, 
    children 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="ml-4">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            알림 설정
          </h2>
        </div>

        <div className="space-y-0">
          {/* 알림 전체 활성화/비활성화 */}
          <SettingSection
            icon={<Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            title="알림 활성화"
            description="모든 알림을 활성화하거나 비활성화합니다"
          >
            <ToggleSwitch
              checked={settings.enabled}
              onChange={(checked) => handleToggle('enabled', checked)}
            />
          </SettingSection>

          {/* 시스템 알림 */}
          <SettingSection
            icon={<Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            title="시스템 알림"
            description="시스템 상태, 연결, 오류 관련 알림"
          >
            <ToggleSwitch
              checked={settings.systemNotifications}
              onChange={(checked) => handleToggle('systemNotifications', checked)}
              disabled={!settings.enabled}
            />
          </SettingSection>

          {/* 메모리 경고 */}
          <SettingSection
            icon={<MemoryStick className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
            title="메모리 경고"
            description="메모리 사용률이 높을 때 경고 알림"
          >
            <ToggleSwitch
              checked={settings.memoryWarnings}
              onChange={(checked) => handleToggle('memoryWarnings', checked)}
              disabled={!settings.enabled}
            />
          </SettingSection>

          {/* 작업 완료 알림 */}
          <SettingSection
            icon={<CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />}
            title="작업 완료 알림"
            description="TaskManager 작업이 완료되었을 때 알림"
          >
            <ToggleSwitch
              checked={settings.taskCompletions}
              onChange={(checked) => handleToggle('taskCompletions', checked)}
              disabled={!settings.enabled}
            />
          </SettingSection>

          {/* 주간 리포트 */}
          <SettingSection
            icon={<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            title="주간 리포트"
            description="매주 활동 요약 리포트 알림"
          >
            <ToggleSwitch
              checked={settings.weeklyReports}
              onChange={(checked) => handleToggle('weeklyReports', checked)}
              disabled={!settings.enabled}
            />
          </SettingSection>

          {/* 사운드 설정 */}
          <SettingSection
            icon={settings.soundEnabled 
              ? <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              : <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            }
            title="알림 사운드"
            description="알림 시 사운드 재생"
          >
            <ToggleSwitch
              checked={settings.soundEnabled}
              onChange={(checked) => handleToggle('soundEnabled', checked)}
              disabled={!settings.enabled}
            />
          </SettingSection>

          {/* 자동 숨김 설정 */}
          <SettingSection
            icon={<CornerDownRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            title="자동 숨김"
            description="일정 시간 후 알림을 자동으로 제거"
          >
            <div className="flex items-center space-x-3">
              <ToggleSwitch
                checked={settings.autoHide}
                onChange={(checked) => handleToggle('autoHide', checked)}
                disabled={!settings.enabled}
              />
              {settings.autoHide && (
                <select
                  value={settings.autoHideDelay}
                  onChange={(e) => handleSelectChange('autoHideDelay', parseInt(e.target.value))}
                  disabled={!settings.enabled}
                  className="
                    px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                >
                  <option value={3000}>3초</option>
                  <option value={5000}>5초</option>
                  <option value={10000}>10초</option>
                  <option value={30000}>30초</option>
                </select>
              )}
            </div>
          </SettingSection>

          {/* 알림 위치 */}
          <SettingSection
            icon={<CornerDownRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            title="알림 위치"
            description="토스트 알림이 나타날 위치 (향후 구현 예정)"
          >
            <select
              value={settings.position}
              onChange={(e) => handleSelectChange('position', e.target.value)}
              disabled={!settings.enabled}
              className="
                px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="top-right">우상단</option>
              <option value="top-left">좌상단</option>
              <option value="bottom-right">우하단</option>
              <option value="bottom-left">좌하단</option>
            </select>
          </SettingSection>
        </div>

        {/* 설정 정보 */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            알림 설정은 브라우저 로컬 스토리지에 저장되며, 
            페이지를 새로고침해도 유지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
