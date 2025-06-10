'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface MemoryStats {
  used: number
  total: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface MemoryManagementOptions {
  debugMode?: boolean
  checkInterval?: number
  memoryThreshold?: number
  autoCleanup?: boolean
  onMemoryWarning?: (stats: MemoryStats) => void
  onMemoryCleanup?: () => void
}

interface UseMemoryManagementReturn {
  memoryStats: MemoryStats | null
  isMonitoring: boolean
  lastCleanupTime: number | null
  startMonitoring: () => void
  stopMonitoring: () => void
  runCleanup: () => Promise<void>
  getMemoryInfo: () => Promise<MemoryStats | null>
}

export const useMemoryManagement = ({
  debugMode = false,
  checkInterval = 30000, // 30초
  memoryThreshold = 80, // 80% 임계치
  autoCleanup = true,
  onMemoryWarning,
  onMemoryCleanup
}: MemoryManagementOptions = {}): UseMemoryManagementReturn => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastCleanupTime, setLastCleanupTime] = useState<number | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const memoryWarningShownRef = useRef<boolean>(false)
  const previousMemoryRef = useRef<number>(0)
  const CLEANUP_COOLDOWN = 60000 // 1분 쿨다운

  // 브라우저 메모리 정보 가져오기
  const getBrowserMemoryInfo = useCallback((): MemoryInfo | null => {
    if (typeof window === 'undefined') return null
    
    // Performance API 사용
    if (window.performance && (window.performance as any).memory) {
      return (window.performance as any).memory as MemoryInfo
    }
    
    return null
  }, [])

  // Electron 메모리 정보 가져오기
  const getElectronMemoryInfo = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const response = await window.electronAPI.memory.getInfo()
        return response.success ? response.data : null
      }
    } catch (error) {
      if (debugMode) {
        console.error('Electron 메모리 정보 가져오기 실패:', error)
      }
    }
    return null
  }, [debugMode])

  // 메모리 정보 수집
  const getMemoryInfo = useCallback(async (): Promise<MemoryStats | null> => {
    try {
      // Electron 메모리 정보 우선 시도
      const electronMemory = await getElectronMemoryInfo()
      if (electronMemory) {
        const stats: MemoryStats = {
          used: electronMemory.main.used / (1024 * 1024), // MB로 변환
          total: electronMemory.main.total / (1024 * 1024),
          percentage: electronMemory.main.percentage,
          trend: 'stable'
        }
        
        // 트렌드 계산
        if (previousMemoryRef.current > 0) {
          const diff = stats.used - previousMemoryRef.current
          if (Math.abs(diff) > 5) { // 5MB 이상 변화
            stats.trend = diff > 0 ? 'up' : 'down'
          }
        }
        previousMemoryRef.current = stats.used
        
        return stats
      }

      // 브라우저 메모리 정보 폴백
      const browserMemory = getBrowserMemoryInfo()
      if (browserMemory) {
        const usedMB = browserMemory.usedJSHeapSize / (1024 * 1024)
        const totalMB = browserMemory.totalJSHeapSize / (1024 * 1024)
        const percentage = (usedMB / totalMB) * 100
        
        const stats: MemoryStats = {
          used: usedMB,
          total: totalMB,
          percentage,
          trend: 'stable'
        }
        
        // 트렌드 계산
        if (previousMemoryRef.current > 0) {
          const diff = stats.used - previousMemoryRef.current
          if (Math.abs(diff) > 2) { // 2MB 이상 변화
            stats.trend = diff > 0 ? 'up' : 'down'
          }
        }
        previousMemoryRef.current = stats.used
        
        return stats
      }
    } catch (error) {
      if (debugMode) {
        console.error('메모리 정보 가져오기 실패:', error)
      }
    }
    
    return null
  }, [getBrowserMemoryInfo, getElectronMemoryInfo, debugMode])

  // 메모리 정리 실행
  const runCleanup = useCallback(async (): Promise<void> => {
    const now = Date.now()
    
    // 쿨다운 체크
    if (lastCleanupTime && (now - lastCleanupTime) < CLEANUP_COOLDOWN) {
      if (debugMode) {
        console.log('메모리 정리 쿨다운 중...')
      }
      return
    }

    try {
      if (debugMode) {
        console.log('메모리 정리 시작...')
      }

      // Electron 메모리 정리
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.memory.cleanup()
      }

      // 브라우저 가비지 컬렉션 (가능한 경우)
      if (window.gc) {
        window.gc()
      }

      // DOM 정리
      if (typeof document !== 'undefined') {
        // 이벤트 리스너 정리
        const obsoleteElements = document.querySelectorAll('[data-memory-cleanup]')
        obsoleteElements.forEach(el => {
          el.remove()
        })
      }

      setLastCleanupTime(now)
      onMemoryCleanup?.()
      
      if (debugMode) {
        console.log('메모리 정리 완료')
      }
    } catch (error) {
      if (debugMode) {
        console.error('메모리 정리 실패:', error)
      }
    }
  }, [lastCleanupTime, debugMode, onMemoryCleanup])

  // 메모리 상태 확인
  const checkMemoryUsage = useCallback(async () => {
    const stats = await getMemoryInfo()
    if (!stats) return

    setMemoryStats(stats)

    if (debugMode) {
      console.log(`메모리 사용량: ${stats.used.toFixed(1)}MB (${stats.percentage.toFixed(1)}%)`)
    }

    // 임계치 확인
    if (stats.percentage >= memoryThreshold) {
      if (!memoryWarningShownRef.current) {
        memoryWarningShownRef.current = true
        onMemoryWarning?.(stats)
        
        if (debugMode) {
          console.warn(`메모리 사용량이 임계치(${memoryThreshold}%)를 초과했습니다`)
        }
      }

      // 자동 정리
      if (autoCleanup) {
        await runCleanup()
      }
    } else {
      memoryWarningShownRef.current = false
    }
  }, [getMemoryInfo, memoryThreshold, autoCleanup, runCleanup, onMemoryWarning, debugMode])

  // 모니터링 시작
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)
    checkMemoryUsage() // 즉시 한 번 실행
    
    intervalRef.current = setInterval(checkMemoryUsage, checkInterval)
    
    if (debugMode) {
      console.log(`메모리 모니터링 시작 (${checkInterval}ms 간격)`)
    }
  }, [isMonitoring, checkMemoryUsage, checkInterval, debugMode])

  // 모니터링 중지
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return

    setIsMonitoring(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (debugMode) {
      console.log('메모리 모니터링 중지')
    }
  }, [isMonitoring, debugMode])

  // 컴포넌트 마운트/언마운트 시 자동 시작/중지
  useEffect(() => {
    startMonitoring()
    
    return () => {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring])

  // 페이지 visibility 변경 시 모니터링 조절
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMonitoring()
      } else {
        startMonitoring()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startMonitoring, stopMonitoring])

  return {
    memoryStats,
    isMonitoring,
    lastCleanupTime,
    startMonitoring,
    stopMonitoring,
    runCleanup,
    getMemoryInfo
  }
}

export default useMemoryManagement
