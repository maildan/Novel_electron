'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getGpuInfo, 
  getGpuMemoryStats, 
  runGpuAcceleration, 
  runGpuBenchmark,
  optimizeMemoryAdvanced,
  cleanupMemory,
  type GpuInfo as NativeGpuInfo,
  type GpuMemoryStats,
  type GpuAccelerationResult
} from '@/native-modules'

interface GpuInfo {
  available: boolean
  accelerationEnabled: boolean
  vendor?: string
  model?: string
  memory?: number
  driverVersion?: string
  computeCapability?: string
  isIntegrated?: boolean
  supportsCompute?: boolean
}

interface GpuComputationResult {
  success: boolean
  result?: any
  executionTime?: number
  memorySaved?: number
  performanceGain?: number
  usedGpu?: boolean
  error?: string
}

interface GpuMemoryInfo {
  appMemoryMb: number
  gpuMemoryMb: number
  cpuMemoryMb: number
  totalOffloadedMb: number
  optimizationScore: number
  lastOptimization: string
  activeOffloads: number
}

export enum GpuTaskType {
  TypingStatistics = 'typing-statistics',
  MemoryOptimization = 'memory-optimization',
  DataAnalysis = 'data-analysis',
  MemoryCleanup = 'memory-cleanup',
  Benchmark = 'benchmark'
}

interface UseNativeGpuReturn {
  gpuInfo: GpuInfo | null
  memoryStats: GpuMemoryInfo | null
  available: boolean
  enabled: boolean
  loading: boolean
  error: string | null
  fetchGpuInfo: () => Promise<void>
  fetchMemoryStats: () => Promise<void>
  toggleGpuAcceleration: (enable: boolean) => Promise<void>
  computeWithGpu: (taskType: GpuTaskType, data?: any) => Promise<GpuComputationResult>
  optimizeMemory: () => Promise<GpuComputationResult>
  cleanupGpuMemory: () => Promise<GpuComputationResult>
  runBenchmark: () => Promise<GpuComputationResult>
  isGpuTask: (taskType: string) => boolean
  isMemoryOptimized: () => boolean
}

/**
 * 강화된 네이티브 GPU 가속 훅
 * 메모리 오프로딩 및 고급 GPU 기능을 제공합니다.
 * 
 * 주요 기능:
 * - GPU 메모리 오프로딩으로 앱 메모리를 100MB 이하로 최적화
 * - 실시간 메모리 모니터링 및 자동 최적화
 * - GPU 가속화를 통한 성능 향상
 * - 고급 GPU 벤치마킹 및 통계
 */
export const useNativeGpu = (): UseNativeGpuReturn => {
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null)
  const [memoryStats, setMemoryStats] = useState<GpuMemoryInfo | null>(null)
  const [available, setAvailable] = useState<boolean>(false)
  const [enabled, setEnabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 네이티브 GPU 정보를 내부 형식으로 변환
  const convertGpuInfo = useCallback((nativeInfo: NativeGpuInfo): GpuInfo => ({
    available: true,
    accelerationEnabled: nativeInfo.supportsCompute,
    vendor: nativeInfo.vendor,
    model: nativeInfo.name,
    memory: parseFloat(nativeInfo.memoryTotal.replace(/[^\d.]/g, '')), // "8 GB" -> 8
    driverVersion: nativeInfo.driverVersion,
    computeCapability: nativeInfo.computeCapability,
    isIntegrated: nativeInfo.isIntegrated,
    supportsCompute: nativeInfo.supportsCompute
  }), [])

  // 네이티브 메모리 통계를 내부 형식으로 변환
  const convertMemoryStats = useCallback((nativeStats: GpuMemoryStats): GpuMemoryInfo => ({
    appMemoryMb: nativeStats.appMemoryMb,
    gpuMemoryMb: nativeStats.gpuMemoryMb,
    cpuMemoryMb: nativeStats.cpuMemoryMb,
    totalOffloadedMb: nativeStats.totalOffloadedMb,
    optimizationScore: nativeStats.optimizationScore,
    lastOptimization: new Date(parseInt(nativeStats.lastOptimization)).toISOString(),
    activeOffloads: nativeStats.activeOffloads
  }), [])

  // GPU 정보 가져오기
  const fetchGpuInfo = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 GPU 정보 조회 중...')
      const nativeInfo = await getGpuInfo()
      
      if (nativeInfo && nativeInfo.name !== 'Unknown GPU') {
        const info = convertGpuInfo(nativeInfo)
        setGpuInfo(info)
        setAvailable(true)
        setEnabled(info.supportsCompute || false)
        console.log('✅ GPU 정보 조회 성공:', info)
      } else {
        setGpuInfo({ 
          available: false, 
          accelerationEnabled: false,
          vendor: 'Unknown',
          model: 'No GPU detected'
        })
        setAvailable(false)
        setEnabled(false)
        console.log('⚠️ GPU를 찾을 수 없습니다')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'GPU 정보 조회 실패'
      setError(errorMsg)
      setAvailable(false)
      setEnabled(false)
      console.error('❌ GPU 정보 조회 오류:', errorMsg)
    } finally {
      setLoading(false)
    }
  }, [convertGpuInfo])

  // GPU 메모리 통계 가져오기
  const fetchMemoryStats = useCallback(async () => {
    try {
      console.log('📊 GPU 메모리 통계 조회 중...')
      const nativeStats = await getGpuMemoryStats()
      const stats = convertMemoryStats(nativeStats)
      setMemoryStats(stats)
      console.log('✅ GPU 메모리 통계 조회 성공:', stats)
      
      // 메모리 사용량이 100MB 초과 시 자동 경고
      if (stats.appMemoryMb > 100) {
        console.warn(`⚠️ 앱 메모리 사용량이 목표를 초과했습니다: ${stats.appMemoryMb.toFixed(2)}MB`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'GPU 메모리 통계 조회 실패'
      console.error('❌ GPU 메모리 통계 조회 오류:', errorMsg)
    }
  }, [convertMemoryStats])

  // GPU 가속 활성화/비활성화
  const toggleGpuAcceleration = useCallback(async (enable: boolean) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`🔄 GPU 가속 ${enable ? '활성화' : '비활성화'} 중...`)
      
      if (enable && !available) {
        throw new Error('GPU를 사용할 수 없습니다')
      }

      setEnabled(enable)
      
      // GPU 가속 활성화 시 벤치마크 실행
      if (enable) {
        const benchmarkResult = await runBenchmark()
        if (benchmarkResult.success) {
          console.log(`✨ GPU 벤치마크 성공: ${benchmarkResult.performanceGain}% 성능 향상`)
        } else {
          console.warn('⚠️ GPU 벤치마크 실패, 하지만 가속은 활성화됨')
        }
      }
      
      console.log(`✅ GPU 가속 ${enable ? '활성화' : '비활성화'} 완료`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'GPU 가속 설정 실패'
      setError(errorMsg)
      console.error('❌ GPU 가속 설정 오류:', errorMsg)
    } finally {
      setLoading(false)
    }
  }, [available])

  // GPU 컴퓨팅 실행
  const computeWithGpu = useCallback(async (taskType: GpuTaskType, data?: any): Promise<GpuComputationResult> => {
    if (!available || !enabled) {
      return {
        success: false,
        error: 'GPU가 사용할 수 없거나 비활성화됨'
      }
    }

    try {
      console.log(`🚀 GPU 컴퓨팅 시작: ${taskType}`)
      let result: GpuAccelerationResult

      switch (taskType) {
        case GpuTaskType.MemoryOptimization:
          result = await optimizeMemoryAdvanced()
          break
        case GpuTaskType.MemoryCleanup:
          result = await cleanupMemory()
          break
        case GpuTaskType.Benchmark:
          result = await runGpuBenchmark()
          break
        default:
          result = await runGpuAcceleration(data || {})
      }

      console.log(`✅ GPU 컴퓨팅 완료: ${taskType}`, result)
      
      // 성능 향상 로그
      if (result.performanceGain > 0) {
        console.log(`🚀 성능 향상: ${result.performanceGain}%`)
      }
      
      // 메모리 절약 로그
      if (result.memorySavedMb > 0) {
        console.log(`💾 메모리 절약: ${result.memorySavedMb}MB`)
      }
      
      return {
        success: result.success,
        result: result,
        executionTime: result.executionTimeMs,
        memorySaved: result.memorySavedMb,
        performanceGain: result.performanceGain,
        usedGpu: result.usedGpu,
        error: result.errorMessage
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'GPU 컴퓨팅 실패'
      console.error(`❌ GPU 컴퓨팅 오류: ${taskType}`, errorMsg)
      
      return {
        success: false,
        error: errorMsg
      }
    }
  }, [available, enabled])

  // 메모리 최적화 - 100MB 목표 달성
  const optimizeMemory = useCallback(async (): Promise<GpuComputationResult> => {
    console.log('🎯 메모리 최적화 시작 - 목표: 100MB 이하')
    const result = await computeWithGpu(GpuTaskType.MemoryOptimization)
    
    if (result.success && result.memorySaved && result.memorySaved > 0) {
      console.log(`🎉 메모리 최적화 성공: ${result.memorySaved}MB 절약`)
      // 최적화 후 메모리 통계 업데이트
      await fetchMemoryStats()
    }
    
    return result
  }, [computeWithGpu, fetchMemoryStats])

  // GPU 메모리 정리
  const cleanupGpuMemory = useCallback(async (): Promise<GpuComputationResult> => {
    console.log('🧹 GPU 메모리 정리 시작')
    const result = await computeWithGpu(GpuTaskType.MemoryCleanup)
    
    if (result.success) {
      console.log('✨ GPU 메모리 정리 완료')
      // 정리 후 메모리 통계 업데이트
      await fetchMemoryStats()
    }
    
    return result
  }, [computeWithGpu, fetchMemoryStats])

  // 벤치마크 실행
  const runBenchmark = useCallback(async (): Promise<GpuComputationResult> => {
    console.log('⚡ GPU 벤치마크 실행 중...')
    return computeWithGpu(GpuTaskType.Benchmark)
  }, [computeWithGpu])

  // GPU 작업 여부 확인
  const isGpuTask = useCallback((taskType: string): boolean => {
    return Object.values(GpuTaskType).includes(taskType as GpuTaskType)
  }, [])

  // 메모리 최적화 상태 확인
  const isMemoryOptimized = useCallback((): boolean => {
    if (!memoryStats) return false
    
    const isUnder100MB = memoryStats.appMemoryMb < 100
    const hasGoodScore = memoryStats.optimizationScore > 80
    
    return isUnder100MB && hasGoodScore
  }, [memoryStats])

  // 초기화
  useEffect(() => {
    console.log('🚀 GPU 훅 초기화 중...')
    fetchGpuInfo()
  }, [fetchGpuInfo])

  // 메모리 통계 주기적 업데이트 (GPU 활성화 시)
  useEffect(() => {
    if (available && enabled) {
      fetchMemoryStats()
      
      const interval = setInterval(() => {
        fetchMemoryStats()
      }, 5000) // 5초마다 업데이트

      return () => clearInterval(interval)
    }
  }, [available, enabled, fetchMemoryStats])

  // 자동 메모리 최적화 (메모리 사용량이 100MB 초과 시)
  useEffect(() => {
    if (memoryStats && memoryStats.appMemoryMb > 100 && available && enabled) {
      console.log(`🔥 자동 메모리 최적화 트리거: ${memoryStats.appMemoryMb.toFixed(2)}MB > 100MB`)
      
      // 디바운싱을 위한 타이머
      const optimizationTimer = setTimeout(() => {
        optimizeMemory().then(result => {
          if (result.success) {
            console.log('🎯 자동 메모리 최적화 완료')
          } else {
            console.warn('⚠️ 자동 메모리 최적화 실패:', result.error)
          }
        })
      }, 2000) // 2초 후 실행

      return () => clearTimeout(optimizationTimer)
    }
  }, [memoryStats, available, enabled, optimizeMemory])

  return {
    gpuInfo,
    memoryStats,
    available,
    enabled,
    loading,
    error,
    fetchGpuInfo,
    fetchMemoryStats,
    toggleGpuAcceleration,
    computeWithGpu,
    optimizeMemory,
    cleanupGpuMemory,
    runBenchmark,
    isGpuTask,
    isMemoryOptimized
  }
}

export default useNativeGpu