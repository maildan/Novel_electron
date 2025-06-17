'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MemoryStick, Cpu, HardDrive, Zap, RefreshCw, AlertTriangle } from 'lucide-react'

interface MemoryInfo {
  total: number
  used: number
  free: number
  percentage: number
}

interface MemoryData {
  main: MemoryInfo
  renderer: MemoryInfo
  gpu?: MemoryInfo
  system: MemoryInfo
  application?: MemoryInfo // 애플리케이션 총 사용량 추가
  timestamp: number
}

interface MemoryMonitorProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ 
  className = '',
  autoRefresh = true,
  refreshInterval = 2000
}) => {
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_history, setHistory] = useState<MemoryData[]>([])
  const [isGCRunning, setIsGCRunning] = useState(false)

  // 히스토리 로깅 함수
  const logHistoryUpdate = useCallback((newData: MemoryData) => {
    console.log('메모리 히스토리 업데이트:', {
      timestamp: new Date().toISOString(),
      mainUsed: newData.main.used,
      historyLength: _history.length
    });
  }, [_history.length]);

  // 메모리 정보 가져오기
  const fetchMemoryInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const response = await window.electronAPI.memory.getInfo()
        
        if (response.success && response.data) {
          const newData: MemoryData = {
            ...response.data,
            timestamp: Date.now()
          }
          
          setMemoryData(newData)
          logHistoryUpdate(newData)
          setHistory(prev => {
            const updated = [...prev, newData]
            // 최근 60개 데이터만 유지 (2분간 데이터)
            return updated.slice(-60)
          })
        } else {
          setError(response.error || '메모리 정보를 가져올 수 없습니다')
        }
      }
    } catch (err) {
      console.error('메모리 정보 가져오기 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 가비지 컬렉션 실행
  const runGarbageCollection = useCallback(async () => {
    try {
      setIsGCRunning(true)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const response = await window.electronAPI.memory.cleanup()
        
        if (response.success) {
          // GC 후 메모리 정보 새로고침
          setTimeout(fetchMemoryInfo, 1000)
        } else {
          setError(response.error || 'GC 실행 실패')
        }
      }
    } catch (err) {
      console.error('GC 실행 실패:', err)
      setError(err instanceof Error ? err.message : 'GC 실행 중 오류')
    } finally {
      setIsGCRunning(false)
    }
  }, [fetchMemoryInfo])

  // 메모리 최적화
  const optimizeMemory = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const response = await window.electronAPI.memory.optimize()
        
        if (response.success) {
          setTimeout(fetchMemoryInfo, 1000)
        } else {
          setError(response.error || '메모리 최적화 실패')
        }
      }
    } catch (err) {
      console.error('메모리 최적화 실패:', err)
      setError(err instanceof Error ? err.message : '메모리 최적화 중 오류')
    }
  }, [fetchMemoryInfo])

  // 자동 새로고침 설정
  useEffect(() => {
    fetchMemoryInfo() // 초기 로드
    
    if (autoRefresh) {
      const interval = setInterval(fetchMemoryInfo, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchMemoryInfo, autoRefresh, refreshInterval])

  // 메모리 사용량에 따른 색상 결정
  const getUsageColor = (percentage: number) => {
    if (percentage >= 85) return 'text-red-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 메모리 크기 포맷팅 (이미 MB 단위로 입력받음)
  const formatMemorySize = (megabytes: number) => {
    if (megabytes >= 1024) {
      return `${(megabytes / 1024).toFixed(1)} GB`
    }
    return `${megabytes.toFixed(1)} MB`
  }

  // 메모리 정보 카드 컴포넌트
  const MemoryCard: React.FC<{
    title: string
    icon: React.ReactNode
    info: MemoryInfo
  }> = ({ title, icon, info }) => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">사용됨</span>
          <span className={`font-medium ${getUsageColor(info.percentage)}`}>
            {formatMemorySize(info.used)} ({info.percentage.toFixed(1)}%)
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(info.percentage)}`}
            style={{ width: `${Math.min(info.percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>여유: {formatMemorySize(info.free)}</span>
          <span>전체: {formatMemorySize(info.total)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MemoryStick className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">메모리 모니터</h3>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMemoryInfo}
            disabled={isLoading}
            className={`
              relative inline-flex items-center justify-center
              w-10 h-6 rounded-full transition-all duration-300 cursor-pointer
              ${isLoading 
                ? 'bg-blue-500 opacity-60 cursor-not-allowed' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500'
              }
              focus:outline-none focus:ring-0
            `}
            title="새로고침"
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            <RefreshCw className={`w-3 h-3 text-white transition-transform duration-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={runGarbageCollection}
            disabled={isGCRunning}
            className={`
              relative inline-flex items-center justify-center
              px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer
              ${isGCRunning 
                ? 'bg-blue-500 text-white opacity-60 cursor-not-allowed' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500'
              }
              focus:outline-none focus:ring-0
            `}
            title="가비지 컬렉션 실행"
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            {isGCRunning ? '실행 중...' : 'GC'}
          </button>
          
          <button
            onClick={optimizeMemory}
            disabled={isLoading}
            className={`
              relative inline-flex items-center justify-center
              w-10 h-6 rounded-full transition-all duration-300 cursor-pointer
              ${isLoading 
                ? 'bg-green-500 opacity-60 cursor-not-allowed' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-green-500 dark:hover:bg-green-500'
              }
              focus:outline-none focus:ring-0
            `}
            title="메모리 최적화"
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            <Zap className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {memoryData ? (
        <div className="space-y-4">
          {/* 애플리케이션 총 사용량 요약 (맨 위에 표시) */}
          {memoryData.application && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">애플리케이션 총 메모리 사용량</h4>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {formatMemorySize(memoryData.application.used)} / {formatMemorySize(memoryData.application.total)}
                </span>
                <span className={`text-lg font-bold ${getUsageColor(memoryData.application.percentage)}`}>
                  {memoryData.application.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mt-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(memoryData.application.percentage)}`}
                  style={{ width: `${Math.min(memoryData.application.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 메모리 정보 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MemoryCard
              title="메인 프로세스"
              icon={<Cpu className="w-4 h-4 text-blue-500" />}
              info={memoryData.main}
            />
            
            <MemoryCard
              title="렌더러 프로세스"
              icon={<MemoryStick className="w-4 h-4 text-green-500" />}
              info={memoryData.renderer}
            />
            
            {memoryData.gpu && (
              <MemoryCard
                title="GPU 메모리"
                icon={<Zap className="w-4 h-4 text-purple-500" />}
                info={memoryData.gpu}
              />
            )}
            
            <MemoryCard
              title="시스템 메모리"
              icon={<HardDrive className="w-4 h-4 text-orange-500" />}
              info={memoryData.system}
            />
          </div>

          {/* 상세 메모리 사용량 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">메모리 사용량 상세</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">메인 프로세스</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMemorySize(memoryData.main.used)} / {formatMemorySize(memoryData.main.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">렌더러 프로세스</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMemorySize(memoryData.renderer.used)} / {formatMemorySize(memoryData.renderer.total)}
                  </span>
                </div>
                {memoryData.application && (
                  <div className="flex justify-between font-semibold text-blue-700 dark:text-blue-300 border-t border-gray-200 dark:border-gray-600 pt-2">
                    <span>애플리케이션 합계</span>
                    <span>
                      {formatMemorySize(memoryData.application.used)} / {formatMemorySize(memoryData.application.total)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">시스템 총 메모리</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMemorySize(memoryData.system.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">시스템 사용 중</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMemorySize(memoryData.system.used)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">시스템 여유</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatMemorySize(memoryData.system.free)}
                  </span>
                </div>
                {memoryData.gpu && (
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                    <span className="text-gray-600 dark:text-gray-400">GPU 메모리</span>
                    <span className="font-medium dark:text-gray-200">
                      {formatMemorySize(memoryData.gpu.used)} / {formatMemorySize(memoryData.gpu.total)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메모리 사용량 경고 */}
          {(memoryData.application && memoryData.application.percentage > 85) || memoryData.system.percentage > 90 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">높은 메모리 사용량 경고</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {memoryData.application && memoryData.application.percentage > 85 && 
                  "애플리케이션 메모리 사용량이 높습니다. "}
                {memoryData.system.percentage > 90 && 
                  "시스템 메모리 사용량이 높습니다. "}
                성능 저하를 방지하기 위해 메모리 최적화를 실행하거나 불필요한 프로그램을 종료하는 것을 권장합니다.
              </p>
            </div>
          ) : (memoryData.application && memoryData.application.percentage > 70) || memoryData.system.percentage > 80 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">메모리 사용량 주의</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                메모리 사용량이 증가하고 있습니다. 메모리 정리를 실행하여 성능을 개선할 수 있습니다.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MemoryStick className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>메모리 정보를 불러오는 중...</p>
        </div>
      )}
    </div>
  )
}

export default MemoryMonitor
