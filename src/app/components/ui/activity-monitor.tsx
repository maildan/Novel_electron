'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Activity, Cpu, MemoryStick, HardDrive, Zap, RefreshCw, AlertTriangle, Monitor } from 'lucide-react'

interface ProcessInfo {
  pid: number
  name: string
  cpuUsage: number
  memoryUsage: number
  memoryPercent: number
  status: string
  ppid?: number
  user?: string
}

interface CPUInfo {
  usage: number
  temperature?: number
  model: string
  cores: number
  threads: number
  speed: number
}

interface SystemInfo {
  cpu: CPUInfo
  processes: ProcessInfo[]
  uptime: number
  loadAverage: number[]
  platform: string
  arch: string
  hostname: string
  timestamp: number
}

interface MemoryInfo {
  total: number
  used: number
  free: number
  percentage: number
}

interface ActivityMonitorProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export const ActivityMonitor: React.FC<ActivityMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 3000
}) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
  const [loopProcesses, setLoopProcesses] = useState<ProcessInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo | null>(null)

  // 시스템 정보 가져오기
  const fetchSystemInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        // 시스템 정보 가져오기
        const systemResponse = await window.electronAPI.system.getInfo()
        
        if (systemResponse.success && systemResponse.data) {
          setSystemInfo(systemResponse.data)
        } else {
          throw new Error(systemResponse.error || '시스템 정보를 가져올 수 없습니다')
        }

        // 메모리 정보 가져오기
        const memoryResponse = await window.electronAPI.memory.getInfo()
        
        if (memoryResponse.success && memoryResponse.data) {
          setMemoryInfo(memoryResponse.data.system)
        }

        // Loop 프로세스 정보 가져오기
        const loopResponse = await window.electronAPI.system.getLoopProcesses()
        
        if (loopResponse.success && loopResponse.data) {
          setLoopProcesses(loopResponse.data)
        }
      }
    } catch (err) {
      console.error('시스템 정보 가져오기 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 자동 새로고침
  useEffect(() => {
    fetchSystemInfo()
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemInfo, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchSystemInfo, autoRefresh, refreshInterval])

  // 메모리 크기 포맷팅
  const formatMemorySize = (megabytes: number) => {
    if (megabytes >= 1024) {
      return `${(megabytes / 1024).toFixed(1)} GB`
    }
    return `${megabytes.toFixed(1)} MB`
  }

  // 업타임 포맷팅
  const formatUptime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}일 ${hours % 24}시간`
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`
    return `${minutes}분 ${seconds % 60}초`
  }

  // 사용량에 따른 색상
  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 프로세스 상태에 따른 아이콘
  const getProcessIcon = (name: string) => {
    if (name.toLowerCase().includes('main')) return <Cpu className="w-3 h-3" />
    if (name.toLowerCase().includes('renderer')) return <Monitor className="w-3 h-3" />
    if (name.toLowerCase().includes('gpu')) return <Zap className="w-3 h-3" />
    return <Activity className="w-3 h-3" />
  }

  const getProcessColor = (name: string) => {
    if (name.toLowerCase().includes('main')) return 'text-blue-500'
    if (name.toLowerCase().includes('renderer')) return 'text-green-500'
    if (name.toLowerCase().includes('gpu')) return 'text-purple-500'
    return 'text-gray-500'
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">활성 상태 모니터</h3>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSystemInfo}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {systemInfo ? (
        <div className="p-4 space-y-6">
          {/* CPU 및 메모리 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium text-gray-900">CPU</h4>
                <span className={`text-sm font-semibold ${getUsageColor(systemInfo.cpu.usage)}`}>
                  {systemInfo.cpu.usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemInfo.cpu.usage)}`}
                  style={{ width: `${Math.min(systemInfo.cpu.usage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {systemInfo.cpu.cores}코어 • {systemInfo.cpu.model}
              </div>
            </div>

            {/* 메모리 */}
            {memoryInfo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MemoryStick className="w-4 h-4 text-green-500" />
                  <h4 className="font-medium text-gray-900">메모리</h4>
                  <span className={`text-sm font-semibold ${getUsageColor(memoryInfo.percentage)}`}>
                    {memoryInfo.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(memoryInfo.percentage)}`}
                    style={{ width: `${Math.min(memoryInfo.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {formatMemorySize(memoryInfo.used)} / {formatMemorySize(memoryInfo.total)} 사용됨
                </div>
              </div>
            )}
          </div>

          {/* 프로세스 목록 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Loop 프로세스</h4>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-3 text-xs font-medium text-gray-500 border-b border-gray-200">
                <div>프로세스</div>
                <div className="text-right">PID</div>
                <div className="text-right">CPU</div>
                <div className="text-right">메모리</div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {loopProcesses.length > 0 ? loopProcesses.map((process) => (
                  <div
                    key={process.pid}
                    className={`grid grid-cols-4 gap-4 p-3 text-sm hover:bg-white cursor-pointer transition-colors ${
                      selectedProcess?.pid === process.pid ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedProcess(process)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={getProcessColor(process.name)}>
                        {getProcessIcon(process.name)}
                      </span>
                      <span className="truncate">{process.name}</span>
                    </div>
                    <div className="text-right text-gray-500">{process.pid}</div>
                    <div className={`text-right ${getUsageColor(process.cpuUsage)}`}>
                      {process.cpuUsage.toFixed(1)}%
                    </div>
                    <div className="text-right font-medium">
                      {formatMemorySize(process.memoryUsage)}
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loop 프로세스를 찾을 수 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">시스템 정보</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">업타임</span>
                <div className="font-medium">{formatUptime(systemInfo.uptime)}</div>
              </div>
              <div>
                <span className="text-gray-500">플랫폼</span>
                <div className="font-medium">{systemInfo.platform}</div>
              </div>
              <div>
                <span className="text-gray-500">아키텍처</span>
                <div className="font-medium">{systemInfo.arch}</div>
              </div>
              <div>
                <span className="text-gray-500">호스트명</span>
                <div className="font-medium">{systemInfo.hostname}</div>
              </div>
              {memoryInfo && (
                <>
                  <div>
                    <span className="text-gray-500">총 메모리</span>
                    <div className="font-medium">{formatMemorySize(memoryInfo.total)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">여유 메모리</span>
                    <div className="font-medium text-green-600">{formatMemorySize(memoryInfo.free)}</div>
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-500">로드 평균</span>
                <div className="font-medium">{systemInfo.loadAverage.map(l => l.toFixed(2)).join(', ')}</div>
              </div>
              <div>
                <span className="text-gray-500">CPU 속도</span>
                <div className="font-medium">{systemInfo.cpu.speed} MHz</div>
              </div>
            </div>
          </div>

          {/* 선택된 프로세스 상세 정보 */}
          {selectedProcess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">프로세스 상세 정보</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">이름</span>
                  <div className="font-medium">{selectedProcess.name}</div>
                </div>
                <div>
                  <span className="text-blue-600">PID</span>
                  <div className="font-medium">{selectedProcess.pid}</div>
                </div>
                <div>
                  <span className="text-blue-600">CPU 사용률</span>
                  <div className="font-medium">{selectedProcess.cpuUsage.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-blue-600">메모리 사용량</span>
                  <div className="font-medium">{formatMemorySize(selectedProcess.memoryUsage)}</div>
                </div>
                {selectedProcess.ppid && (
                  <div>
                    <span className="text-blue-600">부모 PID</span>
                    <div className="font-medium">{selectedProcess.ppid}</div>
                  </div>
                )}
                <div>
                  <span className="text-blue-600">상태</span>
                  <div className="font-medium">{selectedProcess.status}</div>
                </div>
                <div>
                  <span className="text-blue-600">메모리 비율</span>
                  <div className="font-medium">{selectedProcess.memoryPercent.toFixed(1)}%</div>
                </div>
                {selectedProcess.user && (
                  <div>
                    <span className="text-blue-600">사용자</span>
                    <div className="font-medium">{selectedProcess.user}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>시스템 정보를 불러오는 중...</p>
        </div>
      )}
    </div>
  )
}

export default ActivityMonitor
