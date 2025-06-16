/**
 * 네이티브 모듈 타입 정의
 * 
 * Loop 6에서 사용하는 모든 네이티브 모듈 관련 타입들을 통합 관리합니다.
 * 기존에 electron.d.ts, electron.ts, native-client.ts에 분산되어 있던 타입들을 정리했습니다.
 */

// 기본 메모리 사용량 타입
export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  timestamp: string;
}

// 메모리 통계 타입
export interface MemoryStats {
  usage: MemoryUsage;
  peakUsage: MemoryUsage;
  averageUsage: MemoryUsage;
  totalSamples: number;
  monitoringDurationMs: string;
}

// React 컴포넌트에서 사용하는 메모리 정보 타입
export interface ReactMemoryInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

// React 컴포넌트용 메모리 데이터 구조
export interface ReactMemoryData {
  main: ReactMemoryInfo;
  renderer: ReactMemoryInfo;
  gpu?: ReactMemoryInfo;
  system: ReactMemoryInfo;
  application?: ReactMemoryInfo;
  timestamp: number;
}

// GPU 정보 타입
export interface GpuInfo {
  vendor: string;
  name: string;
  driverVersion: string;
  memoryMb: number;
  isDiscrete: boolean;
  isIntegrated: boolean;
  computeUnits: number;
  maxClockSpeed: number;
  temperature: number;
  powerUsage: number;
  utilization: number;
  fallback: boolean;
  // 추가 필드들
  memoryTotal?: string;
  memoryUsed?: string;
  memoryFree?: string;
  timestamp?: string;
}

// GPU 메모리 통계
export interface GpuMemoryStats {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  utilizationPercent: number;
  bandwidthMbps: number;
  temperature: number;
}

// GPU 통계 타입
export interface GpuStats {
  current: GpuInfo;
  peakUtilization: number;
  averageUtilization: number;
  peakMemoryUsed: string;
  averageMemoryUsed: string;
  totalSamples: number;
  monitoringDurationMs: string;
}

// GPU 가속 결과
export interface GpuAccelerationResult {
  success: boolean;
  timeTakenMs: number;
  memoryUsedMb: number;
  computeUnitsUsed: number;
  errorMessage?: string;
  fallbackUsed: boolean;
}

// 시스템 정보 타입
export interface SystemInfo {
  platform: string;
  arch: string;
  cpuCount: number;
  totalMemory: string;
  hostname: string;
  uptime: string;
  loadAverage: number[];
  // 추가 필드들
  version?: string;
  target?: string;
  os?: string;
}

// 워커 태스크 상태
export interface WorkerTaskStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  resultData?: string;
  errorMessage?: string;
  startTime: string;
  completionTime?: string;
}

// 워커 통계
export interface WorkerStats {
  activeThreads: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalProcessingTimeMs: string;
  averageTaskTimeMs: string;
  memoryUsageMb: number;
}

// 네이티브 모듈 정보
export interface NativeModuleInfo {
  name: string;
  version: string;
  description: string;
  features: {
    gpuCompute: boolean;
    memoryOptimization: boolean;
    workerThreads: boolean;
    advancedAnalytics: boolean;
  };
  platform: {
    os: string;
    arch: string;
    family: string;
  };
  buildInfo: {
    rustcVersion: string;
    target: string;
    profile: string;
  };
}

// 네이티브 모듈 상태
export interface NativeModuleStatus {
  available: boolean;
  fallbackMode: boolean;
  version: string;
  features: {
    memory: boolean;
    gpu: boolean;
    worker: boolean;
  };
  timestamp: number;
  loadError?: string;
}

// 네이티브 모듈 API 인터페이스
export interface NativeModuleAPI {
  // 메모리 관련
  getMemoryUsage(): Promise<MemoryUsage | null>;
  startMemoryMonitoring(): Promise<boolean>;
  getMemoryStats(): Promise<MemoryStats | null>;
  optimizeMemory(): Promise<boolean>;
  cleanupMemory(): Promise<boolean>;
  optimizeMemoryAdvanced(): Promise<boolean>;
  resetMemoryMonitoring(): Promise<boolean>;
  
  // GPU 관련
  getGpuInfo(): Promise<GpuInfo | null>;
  getGpuMemoryStats(): Promise<GpuMemoryStats | null>;
  runGpuAcceleration(data: string): Promise<GpuAccelerationResult>;
  runGpuBenchmark(): Promise<any>;
  
  // 시스템 관련
  getSystemInfo(): Promise<SystemInfo | null>;
  isNativeModuleAvailable(): Promise<boolean>;
  getNativeModuleInfo(): Promise<NativeModuleInfo | null>;
  getNativeModuleVersion(): Promise<string>;
  initializeNativeModules(): Promise<boolean>;
  cleanupNativeModules(): Promise<boolean>;
  getTimestamp(): Promise<number>;
  
  // 워커 관련
  addWorkerTask(taskData: string): Promise<string>;
  getWorkerTaskStatus(taskId: string): Promise<WorkerTaskStatus | null>;
  getWorkerStats(): Promise<WorkerStats | null>;
  getPendingTaskCount(): Promise<number>;
  resetWorkerPool(): Promise<boolean>;
  executeCpuTask(taskData: string): Promise<any>;
  processDataParallel(data: string): Promise<any>;
  
  // 유틸리티 관련
  calculateFileHash(filePath: string): Promise<string>;
  calculateDirectorySize(dirPath: string): Promise<number>;
  calculateStringSimilarity(str1: string, str2: string): Promise<number>;
  validateJson(jsonStr: string): Promise<boolean>;
  encodeBase64(data: string): Promise<string>;
  decodeBase64(encodedData: string): Promise<string>;
  generateUuid(): Promise<string>;
  getTimestampString(): Promise<string>;
  getEnvVar(name: string): Promise<string | null>;
  getProcessId(): Promise<number>;
  startPerformanceMeasurement(label: string): Promise<string>;
  endPerformanceMeasurement(measurementId: string): Promise<number>;
}

// 네이티브 모듈 클라이언트 상태
export interface ModuleStatus {
  isLoaded: boolean;
  isAvailable: boolean;
  error: Error | null;
  version: string | null;
  loadTime: number;
}

// 타입 가드 함수들
export function isMemoryUsage(obj: any): obj is MemoryUsage {
  return obj && 
    typeof obj.rss === 'string' &&
    typeof obj.heapTotal === 'string' &&
    typeof obj.heapUsed === 'string' &&
    typeof obj.external === 'string' &&
    typeof obj.timestamp === 'string';
}

export function isGpuInfo(obj: any): obj is GpuInfo {
  return obj &&
    typeof obj.vendor === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.driverVersion === 'string' &&
    typeof obj.memoryMb === 'number';
}

export function isSystemInfo(obj: any): obj is SystemInfo {
  return obj &&
    typeof obj.platform === 'string' &&
    typeof obj.arch === 'string' &&
    typeof obj.cpuCount === 'number' &&
    typeof obj.totalMemory === 'string';
}
