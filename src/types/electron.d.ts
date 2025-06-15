// ElectronAPI 타입 정의
interface NativeModuleAPI {
  // 메모리 관련
  getMemoryUsage: () => Promise<any>;
  startMemoryMonitoring: () => Promise<any>;
  getMemoryStats: () => Promise<any>;
  optimizeMemory: () => Promise<any>;
  cleanupMemory: () => Promise<any>;
  optimizeMemoryAdvanced: () => Promise<any>;
  resetMemoryMonitoring: () => Promise<any>;
  
  // GPU 관련
  getGpuInfo: () => Promise<any>;
  getGpuMemoryStats: () => Promise<any>;
  runGpuAcceleration: (data: string) => Promise<any>;
  runGpuBenchmark: () => Promise<any>;
  
  // 시스템 관련
  getSystemInfo: () => Promise<any>;
  isNativeModuleAvailable: () => Promise<any>;
  getNativeModuleInfo: () => Promise<any>;
  getNativeModuleVersion: () => Promise<any>;
  initializeNativeModules: () => Promise<any>;
  cleanupNativeModules: () => Promise<any>;
  getTimestamp: () => Promise<any>;
  
  // 워커 관련
  addWorkerTask: (taskData: string) => Promise<any>;
  getWorkerTaskStatus: (taskId: string) => Promise<any>;
  getWorkerStats: () => Promise<any>;
  getPendingTaskCount: () => Promise<any>;
  resetWorkerPool: () => Promise<any>;
  executeCpuTask: (taskData: string) => Promise<any>;
  processDataParallel: (data: string) => Promise<any>;
  
  // 유틸리티 관련
  calculateFileHash: (filePath: string) => Promise<any>;
  calculateDirectorySize: (dirPath: string) => Promise<any>;
  calculateStringSimilarity: (str1: string, str2: string) => Promise<any>;
  validateJson: (jsonStr: string) => Promise<any>;
  encodeBase64: (data: string) => Promise<any>;
  decodeBase64: (encodedData: string) => Promise<any>;
  generateUuid: () => Promise<any>;
  getTimestampString: () => Promise<any>;
  getEnvVar: (name: string) => Promise<any>;
  getProcessId: () => Promise<any>;
  startPerformanceMeasurement: (label: string) => Promise<any>;
  endPerformanceMeasurement: (measurementId: string) => Promise<any>;
}

interface ElectronAPI {
  // IPC 호출을 위한 invoke 메서드
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  
  system: {
    getInfo: () => Promise<any>;
    getCurrentMetrics: () => Promise<any>;
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
    getLoopProcesses: () => Promise<any>;
    native: NativeModuleAPI;
    gpu: {
      getInfo: () => Promise<any>;
    };
  };
  memory: {
    getInfo: () => Promise<any>;
    cleanup: () => Promise<any>;
    optimize: () => Promise<any>;
  };
  window: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
  };
  settings: {
    get: () => Promise<any>;
    getSetting: (key: string) => Promise<any>;
    update: (key: string, value: any) => Promise<any>;
    updateMultiple: (settings: Record<string, any>) => Promise<any>;
    reset: () => Promise<any>;
    export: (filePath: string) => Promise<any>;
    import: (filePath: string) => Promise<any>;
    validate: (settings: Record<string, any>) => Promise<any>;
    createBackup: () => Promise<any>;
    getHistory: () => Promise<any>;
    clearHistory: () => Promise<any>;
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
  // 최상위 네이티브 API 추가
  native: NativeModuleAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
