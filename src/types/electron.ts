// ElectronAPI 타입 정의
// 네이티브 모듈 타입 정의들

export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  timestamp: string;
}

export interface MemoryStats {
  usage: MemoryUsage;
  peakUsage: MemoryUsage;
  averageUsage: MemoryUsage;
  totalSamples: number;
  monitoringDurationMs: string;
}

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
}

export interface GpuMemoryStats {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  utilizationPercent: number;
  bandwidthMbps: number;
  temperature: number;
}

export interface GpuAccelerationResult {
  success: boolean;
  timeTakenMs: number;
  memoryUsedMb: number;
  computeUnitsUsed: number;
  errorMessage?: string;
  fallbackUsed: boolean;
}

export interface WorkerTaskStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  resultData?: string;
  errorMessage?: string;
  startTime: string;
  completionTime?: string;
}

export interface WorkerStats {
  activeThreads: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalProcessingTimeMs: string;
  averageTaskTimeMs: string;
  memoryUsageMb: number;
}

export interface SystemInfo {
  version: string;
  target: string;
  arch: string;
  os: string;
  cpuCount: number;
}

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

export interface ElectronAPI {
  system: {
    getInfo: () => Promise<any>;
    getCurrentMetrics: () => Promise<any>;
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
    getLoopProcesses: () => Promise<any>;
    native: {
      getStatus: () => Promise<{
        success: boolean;
        data?: any;
        error?: string;
        timestamp: number;
      }>;
    };
    gpu: {
      getInfo: () => Promise<GpuInfo>;
    };
  };
  memory: {
    getInfo: () => Promise<any>;
    cleanup: () => Promise<any>;
    optimize: () => Promise<any>;
  };
  // 네이티브 모듈 API 추가
  native: {
    // 메모리 관련
    getMemoryUsage: () => Promise<{ success: boolean; data?: MemoryUsage; error?: string }>;
    startMemoryMonitoring: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    getMemoryStats: () => Promise<{ success: boolean; data?: MemoryStats; error?: string }>;
    optimizeMemory: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    cleanupMemory: () => Promise<{ success: boolean; data?: GpuAccelerationResult; error?: string }>;
    optimizeMemoryAdvanced: () => Promise<{ success: boolean; data?: GpuAccelerationResult; error?: string }>;
    resetMemoryMonitoring: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    
    // GPU 관련
    getGpuInfo: () => Promise<{ success: boolean; data?: GpuInfo; error?: string }>;
    getGpuMemoryStats: () => Promise<{ success: boolean; data?: GpuMemoryStats; error?: string }>;
    runGpuAcceleration: (data: string) => Promise<{ success: boolean; data?: GpuAccelerationResult; error?: string }>;
    runGpuBenchmark: () => Promise<{ success: boolean; data?: GpuAccelerationResult; error?: string }>;
    
    // 시스템 관련
    getSystemInfo: () => Promise<{ success: boolean; data?: SystemInfo; error?: string }>;
    isNativeModuleAvailable: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    getNativeModuleInfo: () => Promise<{ success: boolean; data?: NativeModuleInfo; error?: string }>;
    getNativeModuleVersion: () => Promise<{ success: boolean; data?: string; error?: string }>;
    initializeNativeModules: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    cleanupNativeModules: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    getTimestamp: () => Promise<{ success: boolean; data?: string; error?: string }>;
    
    // 워커 관련
    addWorkerTask: (taskData: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    getWorkerTaskStatus: (taskId: string) => Promise<{ success: boolean; data?: WorkerTaskStatus; error?: string }>;
    getWorkerStats: () => Promise<{ success: boolean; data?: WorkerStats; error?: string }>;
    getPendingTaskCount: () => Promise<{ success: boolean; data?: number; error?: string }>;
    resetWorkerPool: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    executeCpuTask: (taskData: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    processDataParallel: (data: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    
    // 유틸리티 관련
    calculateFileHash: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    calculateDirectorySize: (dirPath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    calculateStringSimilarity: (str1: string, str2: string) => Promise<{ success: boolean; data?: number; error?: string }>;
    validateJson: (jsonStr: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    encodeBase64: (data: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    decodeBase64: (encodedData: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    generateUuid: () => Promise<{ success: boolean; data?: string; error?: string }>;
    getTimestampString: () => Promise<{ success: boolean; data?: string; error?: string }>;
    getEnvVar: (name: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    getProcessId: () => Promise<{ success: boolean; data?: number; error?: string }>;
    startPerformanceMeasurement: (label: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    endPerformanceMeasurement: (measurementId: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  };
  window: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
  };
  config: {
    getAll: () => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    reset: () => Promise<void>;
  };
  database: {
    saveTypingSession: (session: any) => Promise<void>;
    getRecentSessions: (limit: number) => Promise<any>;
    getStatistics: (days: number) => Promise<any>;
    exportData: (options: any) => Promise<void>;
    clearData: (options: any) => Promise<void>;
  };
}

// Window 인터페이스 확장
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
