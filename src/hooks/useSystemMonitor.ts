'use client'

import { useState, useEffect, useCallback } from 'react'

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  uptime: string
  timestamp: number
}

interface UseSystemMonitorReturn {
  metrics: SystemMetrics | null
  isMonitoring: boolean
  error: string | null
  startMonitoring: () => void
  stopMonitoring: () => void
  refreshMetrics: () => void
}

export const useSystemMonitor = (autoStart = false): UseSystemMonitorReturn => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.system.getCurrentMetrics()
        setMetrics({
          ...data,
          timestamp: Date.now()
        })
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch system metrics:', err)
      setError(err instanceof Error ? err.message : '시스템 메트릭을 가져오는데 실패했습니다')
    }
  }, [])

  const startMonitoring = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.system.startMonitoring()
        setIsMonitoring(true)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to start monitoring:', err)
      setError(err instanceof Error ? err.message : '모니터링 시작에 실패했습니다')
    }
  }, [])

  const stopMonitoring = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.system.stopMonitoring()
        setIsMonitoring(false)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to stop monitoring:', err)
      setError(err instanceof Error ? err.message : '모니터링 중지에 실패했습니다')
    }
  }, [])

  const refreshMetrics = useCallback(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    if (autoStart) {
      startMonitoring()
    }

    // Initial fetch
    fetchMetrics()

    // Set up polling interval
    const interval = setInterval(fetchMetrics, 2000) // Update every 2 seconds

    return () => {
      clearInterval(interval)
      if (isMonitoring) {
        stopMonitoring()
      }
    }
  }, [autoStart, fetchMetrics, startMonitoring, stopMonitoring, isMonitoring])

  return {
    metrics,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
    refreshMetrics
  }
}

export default useSystemMonitor
