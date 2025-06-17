'use client'

import React, { useState } from 'react'
import { Settings, User, Monitor, Shield } from 'lucide-react'

interface SettingsData {
  theme: 'light' | 'dark' | 'auto'
  language: string
  autoSave: boolean
  notifications: boolean
  soundEnabled: boolean
  monitoring: boolean
  privacy: boolean
}

interface SettingsPanelProps {
  settings?: SettingsData
  onSettingsChange?: (settings: SettingsData) => void
  className?: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings,
  onSettingsChange,
  className = ''
}) => {
  const defaultSettings: SettingsData = {
    theme: 'light',
    language: 'ko',
    autoSave: true,
    notifications: true,
    soundEnabled: false,
    monitoring: true,
    privacy: true
  }

  const [currentSettings, setCurrentSettings] = useState<SettingsData>(settings || defaultSettings)

  const handleSettingChange = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    const newSettings = { ...currentSettings, [key]: value }
    setCurrentSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const SettingSection: React.FC<{
    icon: React.ReactNode
    title: string
    children: React.ReactNode
  }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )

  const Toggle: React.FC<{
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    description?: string
  }> = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-700">{label}</div>
        {description && (
          <div className="text-sm text-gray-500">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const Select: React.FC<{
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }> = ({ label, value, options, onChange }) => (
    <div className="flex items-center justify-between">
      <div className="font-medium text-gray-700">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 일반 설정 */}
      <SettingSection
        icon={<Settings className="w-5 h-5 text-blue-500" />}
        title="일반 설정"
      >
        <Select
          label="테마"
          value={currentSettings.theme}
          options={[
            { value: 'light', label: '라이트' },
            { value: 'dark', label: '다크' },
            { value: 'auto', label: '자동' }
          ]}
          onChange={(value) => handleSettingChange('theme', value as 'light' | 'dark' | 'auto')}
        />
        <Select
          label="언어"
          value={currentSettings.language}
          options={[
            { value: 'ko', label: '한국어' },
            { value: 'en', label: 'English' },
            { value: 'ja', label: '日本語' }
          ]}
          onChange={(value) => handleSettingChange('language', value)}
        />
        <Toggle
          label="자동 저장"
          description="타이핑 세션을 자동으로 저장합니다"
          checked={currentSettings.autoSave}
          onChange={(checked) => handleSettingChange('autoSave', checked)}
        />
      </SettingSection>

      {/* 알림 설정 */}
      <SettingSection
        icon={<User className="w-5 h-5 text-green-500" />}
        title="알림 설정"
      >
        <Toggle
          label="알림 활성화"
          description="중요한 이벤트에 대한 알림을 받습니다"
          checked={currentSettings.notifications}
          onChange={(checked) => handleSettingChange('notifications', checked)}
        />
        <Toggle
          label="사운드 활성화"
          description="알림 시 사운드를 재생합니다"
          checked={currentSettings.soundEnabled}
          onChange={(checked) => handleSettingChange('soundEnabled', checked)}
        />
      </SettingSection>

      {/* 모니터링 설정 */}
      <SettingSection
        icon={<Monitor className="w-5 h-5 text-purple-500" />}
        title="모니터링 설정"
      >
        <Toggle
          label="시스템 모니터링"
          description="시스템 성능을 실시간으로 모니터링합니다"
          checked={currentSettings.monitoring}
          onChange={(checked) => handleSettingChange('monitoring', checked)}
        />
      </SettingSection>

      {/* 개인정보 설정 */}
      <SettingSection
        icon={<Shield className="w-5 h-5 text-red-500" />}
        title="개인정보 설정"
      >
        <Toggle
          label="개인정보 보호 모드"
          description="타이핑 데이터를 로컬에만 저장합니다"
          checked={currentSettings.privacy}
          onChange={(checked) => handleSettingChange('privacy', checked)}
        />
      </SettingSection>
    </div>
  )
}

export default SettingsPanel
