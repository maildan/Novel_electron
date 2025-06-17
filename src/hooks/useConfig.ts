'use client'

import { useState, useEffect, useCallback } from 'react'

interface AppConfig {
  theme: 'light' | 'dark' | 'auto'
  language: string
  autoSave: boolean
  notifications: boolean
  soundEnabled: boolean
  monitoring: boolean
  privacy: boolean
  [key: string]: unknown
}

interface UseConfigReturn {
  config: AppConfig | null
  isLoading: boolean
  error: string | null
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  resetConfig: () => Promise<void>
  refreshConfig: () => Promise<void>
}

const defaultConfig: AppConfig = {
  theme: 'light',
  language: 'ko',
  autoSave: true,
  notifications: true,
  soundEnabled: false,
  monitoring: true,
  privacy: true
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.config.getAll()
        setConfig(data || defaultConfig)
      } else {
        // Fallback for non-Electron environments
        setConfig(defaultConfig)
      }
    } catch (err) {
      console.error('Failed to load config:', err)
      setError(err instanceof Error ? err.message : '설정을 불러오는데 실패했습니다')
      setConfig(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateConfig = useCallback(async <K extends keyof AppConfig>(
    key: K, 
    value: AppConfig[K]
  ) => {
    try {
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.config.set(key as string, value)
        
        // Update local state
        setConfig(prev => prev ? { ...prev, [key]: value } : { ...defaultConfig, [key]: value })
      }
    } catch (err) {
      console.error('Failed to update config:', err)
      setError(err instanceof Error ? err.message : '설정 업데이트에 실패했습니다')
    }
  }, [])

  const resetConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.config.reset()
        setConfig(defaultConfig)
      }
    } catch (err) {
      console.error('Failed to reset config:', err)
      setError(err instanceof Error ? err.message : '설정 초기화에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshConfig = useCallback(async () => {
    await loadConfig()
  }, [loadConfig])

  // Load initial config
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig,
    refreshConfig
  }
}

export default useConfig
