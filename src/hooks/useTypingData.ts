'use client'

import { useState, useEffect, useCallback } from 'react'

interface TypingSession {
  id: string
  timestamp: number
  wpm: number
  accuracy: number
  duration: number
  wordsTyped: number
  errors: number
}

interface TypingStats {
  totalSessions: number
  averageWpm: number
  averageAccuracy: number
  totalWords: number
  totalTime: number
  totalErrors: number
  bestWpm: number
  bestAccuracy: number
  streak: number
}

interface UseTypingDataReturn {
  sessions: TypingSession[]
  stats: TypingStats | null
  isLoading: boolean
  error: string | null
  saveSession: (sessionData: Omit<TypingSession, 'id' | 'timestamp'>) => Promise<void>
  getRecentSessions: (limit?: number) => Promise<void>
  getStatistics: (days?: number) => Promise<void>
  exportData: () => Promise<void>
  clearData: () => Promise<void>
}

export const useTypingData = (): UseTypingDataReturn => {
  const [sessions, setSessions] = useState<TypingSession[]>([])
  const [stats, setStats] = useState<TypingStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSession = useCallback(async (sessionData: Omit<TypingSession, 'id' | 'timestamp'>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const sessionWithTimestamp = {
          ...sessionData,
          timestamp: Date.now()
        }
        
        await window.electronAPI.database.saveTypingSession(sessionWithTimestamp)
        
        // Refresh data after saving
        await getRecentSessions()
        await getStatistics()
      }
    } catch (err) {
      console.error('Failed to save typing session:', err)
      setError(err instanceof Error ? err.message : '타이핑 세션 저장에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRecentSessions = useCallback(async (limit = 10) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.database.getRecentSessions(limit)
        setSessions(data || [])
      }
    } catch (err) {
      console.error('Failed to get recent sessions:', err)
      setError(err instanceof Error ? err.message : '최근 세션을 가져오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getStatistics = useCallback(async (days = 30) => {
    try {
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.database.getStatistics(days)
        setStats(data || null)
      }
    } catch (err) {
      console.error('Failed to get statistics:', err)
      setError(err instanceof Error ? err.message : '통계를 가져오는데 실패했습니다')
    }
  }, [])

  const exportData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.database.exportData({
          format: 'json',
          includeStats: true
        })
      }
    } catch (err) {
      console.error('Failed to export data:', err)
      setError(err instanceof Error ? err.message : '데이터 내보내기에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.database.clearData({ confirmDelete: true })
        
        // Reset local state
        setSessions([])
        setStats(null)
      }
    } catch (err) {
      console.error('Failed to clear data:', err)
      setError(err instanceof Error ? err.message : '데이터 삭제에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    getRecentSessions()
    getStatistics()
  }, [getRecentSessions, getStatistics])

  return {
    sessions,
    stats,
    isLoading,
    error,
    saveSession,
    getRecentSessions,
    getStatistics,
    exportData,
    clearData
  }
}

export default useTypingData
