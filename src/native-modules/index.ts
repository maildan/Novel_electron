// 네이티브 모듈 로더 - TypeScript 버전
import * as path from 'path'
import { app } from 'electron'

// 한국어 디버깅 로그 함수
function debugLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = data 
    ? `[${timestamp}] [네이티브모듈] ${message}: ${JSON.stringify(data)}`
    : `[${timestamp}] [네이티브모듈] ${message}`;
  console.log(logMessage);
}

// 로거 함수들 (COPILOT_GUIDE.md 규칙에 따른 한국어 로깅)
const logger = {
  info: (message: string, data?: any) => debugLog(`ℹ️ ${message}`, data),
  debug: (message: string, data?: any) => debugLog(`🔍 ${message}`, data),
  warn: (message: string, data?: any) => debugLog(`⚠️ ${message}`, data),
  error: (message: string, data?: any) => debugLog(`❌ ${message}`, data),
};

// 플랫폼별 파일 확장자
const extensions: Record<string, string> = {
  'win32': '.dll',
  'darwin': '.dylib',
  'linux': '.so'
}

const extension = extensions[process.platform] || '.so'

// 플랫폼별 접두사
const prefix = process.platform === 'win32' ? '' : 'lib'

export interface NativeModule {
  calculateTypingStats?: (data: any) => any
  optimizeMemory?: () => any
  gpuAccelerate?: (task: string, data: any) => any
  getGpuInfo?: () => any
  runGpuAcceleration?: (data: any) => any
  runGpuBenchmark?: () => any
  getMemoryInfo?: () => any
  cleanupMemory?: () => any
  // 새로운 고급 GPU 기능들
  getGpuMemoryStats?: () => GpuMemoryStats
  optimizeMemoryAdvanced?: () => GpuAccelerationResult
  isAvailable: boolean
}

// GPU 관련 타입 정의
export interface GpuInfo {
  name: string
  vendor: string
  memoryTotal: string
  memoryUsed: string
  memoryAvailable: string
  utilization: number
  computeCapability: string
  driverVersion: string
  isIntegrated: boolean
  supportsCompute: boolean
  timestamp: string
}

export interface GpuMemoryStats {
  appMemoryMb: number
  gpuMemoryMb: number
  cpuMemoryMb: number
  totalOffloadedMb: number
  optimizationScore: number
  lastOptimization: string
  activeOffloads: number
}

export interface GpuAccelerationResult {
  success: boolean
  executionTimeMs: number
  memorySavedMb: number
  performanceGain: number
  usedGpu: boolean
  errorMessage?: string
}

class NativeModuleLoader {
  private static instance: NativeModuleLoader
  private nativeModule: any = null
  private isLoaded = false
  private loadError: string | null = null

  private constructor() {}

  static getInstance(): NativeModuleLoader {
    if (!NativeModuleLoader.instance) {
      NativeModuleLoader.instance = new NativeModuleLoader()
    }
    return NativeModuleLoader.instance
  }

  static resolveNativeModulePath() {
    const isDev = process.env.NODE_ENV === 'development';
    const isTsNode = !!process.env.TS_NODE_DEV || !!process.env.TS_NODE_PROJECT;
    let modulePath: string;

    if (isDev && isTsNode) {
      // ts-node 개발 환경: src/native-modules/index.js (ts-node가 on-the-fly 트랜스파일)
      modulePath = path.join(process.cwd(), 'src', 'native-modules');
    } else if (isDev) {
      // 빌드된 개발 환경: native-modules/index.js
      modulePath = path.join(process.cwd(), 'native-modules');
    } else {
      // 프로덕션: resources/native-modules
      const resourcesPath = process.resourcesPath || path.dirname(app.getAppPath());
      modulePath = path.join(resourcesPath, 'native-modules');
    }
    return modulePath;
  }

  async loadModule(): Promise<NativeModule> {
    if (this.isLoaded) {
      return this.createModuleWrapper()
    }

    try {
      logger.info('네이티브 모듈 로드 시작')
      const modulePath = NativeModuleLoader.resolveNativeModulePath()
      logger.debug(`네이티브 모듈 require 경로: ${modulePath}`)

      // 파일 존재 확인
      const fs = require('fs')
      const indexPath = path.join(modulePath, 'index.js')
      if (!fs.existsSync(indexPath)) {
        throw new Error(`네이티브 모듈 index.js를 찾을 수 없습니다: ${indexPath}`)
      }

      // 네이티브 모듈 로드
      this.nativeModule = require(modulePath)
      this.isLoaded = true
      this.loadError = null
      logger.info('네이티브 모듈 로드 성공', {
        available: this.nativeModule.isNativeModuleAvailable?.() || 'unknown',
        version: this.nativeModule.getNativeModuleVersion?.() || 'unknown'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.loadError = errorMessage
      this.isLoaded = false
      logger.error('네이티브 모듈 로드 실패', { error: errorMessage })
      logger.warn('자바스크립트 폴백 모드로 실행됩니다')
    }
    return this.createModuleWrapper()
  }

  private createModuleWrapper(): NativeModule {
    if (this.nativeModule && this.isLoaded) {
      logger.debug('네이티브 모듈 래퍼 생성 - 네이티브 기능 사용')
      return {
        calculateTypingStats: this.nativeModule.calculateTypingStats?.bind(this.nativeModule),
        optimizeMemory: this.nativeModule.optimizeMemory?.bind(this.nativeModule),
        gpuAccelerate: this.nativeModule.gpuAccelerate?.bind(this.nativeModule),
        getGpuInfo: this.nativeModule.getGpuInfo?.bind(this.nativeModule),
        runGpuAcceleration: this.nativeModule.runGpuAcceleration?.bind(this.nativeModule),
        runGpuBenchmark: this.nativeModule.runGpuBenchmark?.bind(this.nativeModule),
        getMemoryInfo: this.nativeModule.getMemoryUsage?.bind(this.nativeModule), // getMemoryUsage 사용
        cleanupMemory: this.nativeModule.cleanupMemory?.bind(this.nativeModule),
        // 새로운 고급 GPU 기능들 추가
        getGpuMemoryStats: this.nativeModule.getGpuMemoryStats?.bind(this.nativeModule),
        optimizeMemoryAdvanced: this.nativeModule.optimizeMemory?.bind(this.nativeModule),
        isAvailable: true
      }
    }

    // 폴백 구현
    logger.debug('네이티브 모듈 래퍼 생성 - 폴백 모드')
    return this.loadFallbackModule()
  }

  private loadFallbackModule(): NativeModule {
    logger.warn('폴백 모듈 로드됨 - 성능이 제한될 수 있습니다')
    return {
      calculateTypingStats: (data: any) => {
        logger.debug('네이티브 모듈 미사용 - JS 폴백으로 타이핑 통계 계산')
        return this.calculateTypingStatsJS(data)
      },
      optimizeMemory: () => {
        logger.debug('네이티브 모듈 미사용 - JS 폴백으로 메모리 최적화')
        return this.optimizeMemoryJS()
      },
      gpuAccelerate: (task: string, data: any) => {
        logger.debug('네이티브 모듈 미사용 - GPU 가속 사용 불가')
        return null
      },
      getGpuInfo: () => ({ 
        name: 'Fallback GPU',
        vendor: 'JavaScript',
        memoryTotal: '0',
        memoryUsed: '0',
        memoryAvailable: '0',
        utilization: 0,
        computeCapability: '0.0',
        driverVersion: 'N/A',
        isIntegrated: true,
        supportsCompute: false,
        timestamp: Date.now().toString()
      }),
      runGpuAcceleration: (data: any) => ({ 
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: 'GPU 가속 사용 불가 - 네이티브 모듈 없음'
      }),
      runGpuBenchmark: () => ({ 
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: 'GPU 벤치마크 사용 불가 - 네이티브 모듈 없음'
      }),
      getMemoryInfo: () => ({ 
        total: process.memoryUsage().heapTotal, 
        used: process.memoryUsage().heapUsed, 
        available: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed 
      }),
      cleanupMemory: () => {
        if (global.gc) {
          global.gc()
          return { 
            success: true,
            executionTimeMs: 1,
            memorySavedMb: 0,
            performanceGain: 0,
            usedGpu: false
          }
        }
        return { 
          success: false,
          executionTimeMs: 0,
          memorySavedMb: 0,
          performanceGain: 0,
          usedGpu: false,
          errorMessage: 'GC 사용 불가'
        }
      },
      // 새로운 고급 GPU 기능들 폴백
      getGpuMemoryStats: () => ({
        appMemoryMb: process.memoryUsage().heapUsed / (1024 * 1024),
        gpuMemoryMb: 0,
        cpuMemoryMb: process.memoryUsage().heapUsed / (1024 * 1024),
        totalOffloadedMb: 0,
        optimizationScore: 0,
        lastOptimization: Date.now().toString(),
        activeOffloads: 0
      }),
      optimizeMemoryAdvanced: () => ({
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: '고급 메모리 최적화 사용 불가 - 네이티브 모듈 없음'
      }),
      isAvailable: false
    }
  }

  // 자바스크립트 폴백 구현들
  private calculateTypingStatsJS(data: any) {
    try {
      const { keystrokes, timeSpent } = data
      
      if (!keystrokes || !timeSpent) {
        return { error: 'Invalid data provided' }
      }

      const wpm = (keystrokes / 5) / (timeSpent / 60000) // 분당 단어수
      const accuracy = data.accuracy || 95 // 기본 정확도
      
      return {
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        performance_index: Math.round(wpm * (accuracy / 100)),
        calculated_with: 'javascript'
      }
    } catch (error) {
      debugLog('JS 폴백 타이핑 통계 계산 실패', error)
      return { error: 'Calculation failed' }
    }
  }

  private optimizeMemoryJS() {
    try {
      // 기본 메모리 정리 작업
      if (global.gc) {
        global.gc()
      }
      
      return {
        success: true,
        memory_freed: 0, // 실제 해제된 메모리는 측정 불가
        method: 'javascript_gc'
      }
    } catch (error) {
      debugLog('JS 폴백 메모리 최적화 실패', error)
      return { error: 'Memory optimization failed' }
    }
  }

  getLoadError(): string | null {
    return this.loadError
  }

  isModuleLoaded(): boolean {
    return this.isLoaded
  }
}

// 전역 인스턴스 생성
export const nativeModuleLoader = NativeModuleLoader.getInstance()

// 편의 함수들
export async function loadNativeModule(): Promise<NativeModule> {
  return await nativeModuleLoader.loadModule()
}

export function getNativeModuleStatus() {
  return {
    isLoaded: nativeModuleLoader.isModuleLoaded(),
    error: nativeModuleLoader.getLoadError()
  }
}

// API 라우트에서 사용할 수 있는 추가 함수들
export async function getGpuInfo(): Promise<GpuInfo> {
  const module = await loadNativeModule()
  return module.getGpuInfo?.() || { 
    name: 'Unknown GPU',
    vendor: 'Unknown',
    memoryTotal: '0',
    memoryUsed: '0',
    memoryAvailable: '0',
    utilization: 0,
    computeCapability: '0.0',
    driverVersion: 'N/A',
    isIntegrated: true,
    supportsCompute: false,
    timestamp: Date.now().toString()
  }
}

export async function getGpuMemoryStats(): Promise<GpuMemoryStats> {
  const module = await loadNativeModule()
  return module.getGpuMemoryStats?.() || {
    appMemoryMb: 0,
    gpuMemoryMb: 0,
    cpuMemoryMb: 0,
    totalOffloadedMb: 0,
    optimizationScore: 0,
    lastOptimization: Date.now().toString(),
    activeOffloads: 0
  }
}

export async function runGpuAcceleration(data: any): Promise<GpuAccelerationResult> {
  const module = await loadNativeModule()
  return module.runGpuAcceleration?.(JSON.stringify(data)) || { 
    success: false,
    executionTimeMs: 0,
    memorySavedMb: 0,
    performanceGain: 0,
    usedGpu: false,
    errorMessage: 'GPU 가속 사용 불가'
  }
}

export async function runGpuBenchmark(): Promise<GpuAccelerationResult> {
  const module = await loadNativeModule()
  return module.runGpuBenchmark?.() || { 
    success: false,
    executionTimeMs: 0,
    memorySavedMb: 0,
    performanceGain: 0,
    usedGpu: false,
    errorMessage: 'GPU 벤치마크 사용 불가'
  }
}

export async function optimizeMemoryAdvanced(): Promise<GpuAccelerationResult> {
  const module = await loadNativeModule()
  return module.optimizeMemoryAdvanced?.() || {
    success: false,
    executionTimeMs: 0,
    memorySavedMb: 0,
    performanceGain: 0,
    usedGpu: false,
    errorMessage: '고급 메모리 최적화 사용 불가'
  }
}

export async function getMemoryInfo() {
  const module = await loadNativeModule()
  return module.getMemoryInfo?.() || { total: 0, used: 0, available: 0 }
}

export async function optimizeMemory() {
  const module = await loadNativeModule()
  return module.optimizeMemory?.() || { success: true, freed: 0 }
}

export async function cleanupMemory(): Promise<GpuAccelerationResult> {
  const module = await loadNativeModule()
  return module.cleanupMemory?.() || { 
    success: false,
    executionTimeMs: 0,
    memorySavedMb: 0,
    performanceGain: 0,
    usedGpu: false,
    errorMessage: '메모리 정리 사용 불가'
  }
}

export default nativeModuleLoader
