import { contextBridge, ipcRenderer } from 'electron'

// 타입 정의
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
  timestamp: number
}

interface NativeModuleStatus {
  available: boolean
  fallbackMode: boolean
  version: string
  features: {
    memory: boolean
    gpu: boolean
    worker: boolean
  }
  timestamp: number
  loadError?: string
}

interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// IPC 채널 정의
const CHANNELS = {
  // 데이터베이스
  SAVE_TYPING_SESSION: 'db:saveTypingSession',
  GET_RECENT_SESSIONS: 'db:getRecentSessions',
  GET_STATISTICS: 'db:getStatistics',
  DB_CLEANUP: 'db:cleanup',
  DB_HEALTH_CHECK: 'db:healthCheck',
  GET_KEYSTROKE_DATA: 'db:getKeystrokeData',
  GET_SESSIONS: 'db:getSessions',
  EXPORT_DATA: 'db:exportData',
  IMPORT_DATA: 'db:importData',
  CLEAR_DATA: 'db:clearData',

  // 시스템 모니터링
  START_MONITORING: 'system:startMonitoring',
  STOP_MONITORING: 'system:stopMonitoring',
  GET_CURRENT_METRICS: 'system:getCurrentMetrics',
  GET_METRICS_HISTORY: 'system:getMetricsHistory',
  GET_AVERAGE_METRICS: 'system:getAverageMetrics',
  GET_SYSTEM_HEALTH: 'system:getHealth',
  GET_SYSTEM_INFO: 'system:getSystemInfo',
  GET_MEMORY_USAGE: 'system:getMemoryUsage',
  OPTIMIZE_MEMORY: 'system:optimizeMemory',
  
  // 메모리 관리
  MEMORY_CLEANUP: 'memory:cleanup',
  MEMORY_GET_USAGE: 'memory:getUsage',
  MEMORY_GET_STATS: 'memory:getStats',
  MEMORY_GET_INFO: 'memory:getInfo',
  MEMORY_OPTIMIZE: 'memory:optimize',

  // GPU 관리
  GPU_GET_INFO: 'gpu:getInfo',
  GPU_COMPUTE: 'gpu:compute',
  GPU_ENABLE: 'gpu:enable',
  GPU_DISABLE: 'gpu:disable',

  // 네이티브 모듈
  NATIVE_GET_STATUS: 'system:native:getStatus',
  
  // 네이티브 모듈 - 메모리 관련
  NATIVE_GET_MEMORY_USAGE: 'native:getMemoryUsage',
  NATIVE_START_MEMORY_MONITORING: 'native:startMemoryMonitoring', 
  NATIVE_GET_MEMORY_STATS: 'native:getMemoryStats',
  NATIVE_OPTIMIZE_MEMORY: 'native:optimizeMemory',
  NATIVE_CLEANUP_MEMORY: 'native:cleanupMemory',
  NATIVE_OPTIMIZE_MEMORY_ADVANCED: 'native:optimizeMemoryAdvanced',
  NATIVE_RESET_MEMORY_MONITORING: 'native:resetMemoryMonitoring',
  
  // 네이티브 모듈 - GPU 관련
  NATIVE_GET_GPU_INFO: 'native:getGpuInfo',
  NATIVE_GET_GPU_MEMORY_STATS: 'native:getGpuMemoryStats',
  NATIVE_RUN_GPU_ACCELERATION: 'native:runGpuAcceleration',
  NATIVE_RUN_GPU_BENCHMARK: 'native:runGpuBenchmark',
  
  // 네이티브 모듈 - 시스템 관련
  NATIVE_GET_SYSTEM_INFO: 'native:getSystemInfo',
  NATIVE_IS_AVAILABLE: 'native:isNativeModuleAvailable',
  NATIVE_GET_MODULE_INFO: 'native:getNativeModuleInfo',
  NATIVE_GET_MODULE_VERSION: 'native:getNativeModuleVersion',
  NATIVE_INITIALIZE: 'native:initializeNativeModules',
  NATIVE_CLEANUP: 'native:cleanupNativeModules',
  NATIVE_GET_TIMESTAMP: 'native:getTimestamp',
  
  // 네이티브 모듈 - 워커 관련
  NATIVE_ADD_WORKER_TASK: 'native:addWorkerTask',
  NATIVE_GET_WORKER_TASK_STATUS: 'native:getWorkerTaskStatus',
  NATIVE_GET_WORKER_STATS: 'native:getWorkerStats',
  NATIVE_GET_PENDING_TASK_COUNT: 'native:getPendingTaskCount',
  NATIVE_RESET_WORKER_POOL: 'native:resetWorkerPool',
  NATIVE_EXECUTE_CPU_TASK: 'native:executeCpuTask',
  NATIVE_PROCESS_DATA_PARALLEL: 'native:processDataParallel',
  
  // 네이티브 모듈 - 유틸리티 관련
  NATIVE_CALCULATE_FILE_HASH: 'native:calculateFileHash',
  NATIVE_CALCULATE_DIRECTORY_SIZE: 'native:calculateDirectorySize',
  NATIVE_CALCULATE_STRING_SIMILARITY: 'native:calculateStringSimilarity',
  NATIVE_VALIDATE_JSON: 'native:validateJson',
  NATIVE_ENCODE_BASE64: 'native:encodeBase64',
  NATIVE_DECODE_BASE64: 'native:decodeBase64',
  NATIVE_GENERATE_UUID: 'native:generateUuid',
  NATIVE_GET_TIMESTAMP_STRING: 'native:getTimestampString',
  NATIVE_GET_ENV_VAR: 'native:getEnvVar',
  NATIVE_GET_PROCESS_ID: 'native:getProcessId',
  NATIVE_START_PERFORMANCE_MEASUREMENT: 'native:startPerformanceMeasurement',
  NATIVE_END_PERFORMANCE_MEASUREMENT: 'native:endPerformanceMeasurement',

  // 기존 채널들 (호환성 유지)
  NATIVE_START_KEYSTROKE_TRACKING: 'native:start-keystroke-tracking',
  NATIVE_STOP_KEYSTROKE_TRACKING: 'native:stop-keystroke-tracking',
  NATIVE_GET_KEYSTROKE_STATS: 'native:get-keystroke-stats',
  NATIVE_START_FILE_MONITORING: 'native:start-file-monitoring',
  NATIVE_STOP_FILE_MONITORING: 'native:stopFileMonitoring',
  NATIVE_GET_PROCESS_LIST: 'native:getProcessList',
  NATIVE_GET_NETWORK_CONNECTIONS: 'native:getNetworkConnections',
  NATIVE_HASH_DATA: 'native:hashData',

  // 윈도우 관리
  WINDOW_CREATE: 'window:create',
  MINIMIZE_WINDOW: 'minimizeWindow',
  MAXIMIZE_WINDOW: 'maximizeWindow',
  TOGGLE_MAXIMIZE: 'window:toggleMaximize',
  CLOSE_WINDOW: 'closeWindow',
  TOGGLE_DEVTOOLS: 'window:toggleDevtools',

  // 설정 관리
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',
  GET_ALL_CONFIG: 'config:getAllConfig',
  RESET_CONFIG: 'config:reset',

  // 앱 정보
  GET_APP_INFO: 'app:getInfo',
  GET_VERSION: 'app:getVersion'
} as const

// 안전한 IPC API 정의
const electronAPI = {
  // 데이터베이스 API
  database: {
    saveTypingSession: (data: any) => ipcRenderer.invoke(CHANNELS.SAVE_TYPING_SESSION, data),
    getRecentSessions: (limit?: number) => ipcRenderer.invoke(CHANNELS.GET_RECENT_SESSIONS, limit),
    getStatistics: (days?: number) => ipcRenderer.invoke(CHANNELS.GET_STATISTICS, days),
    cleanup: () => ipcRenderer.invoke(CHANNELS.DB_CLEANUP),
    healthCheck: () => ipcRenderer.invoke(CHANNELS.DB_HEALTH_CHECK),
    getKeystrokeData: (params: any) => ipcRenderer.invoke(CHANNELS.GET_KEYSTROKE_DATA, params),
    getSessions: (params: any) => ipcRenderer.invoke(CHANNELS.GET_SESSIONS, params),
    exportData: (params: any) => ipcRenderer.invoke(CHANNELS.EXPORT_DATA, params),
    importData: (params: any) => ipcRenderer.invoke(CHANNELS.IMPORT_DATA, params),
    clearData: (params: any) => ipcRenderer.invoke(CHANNELS.CLEAR_DATA, params)
  },

  // 시스템 모니터링 API
  system: {
    startMonitoring: () => ipcRenderer.invoke(CHANNELS.START_MONITORING),
    stopMonitoring: () => ipcRenderer.invoke(CHANNELS.STOP_MONITORING),
    getCurrentMetrics: () => ipcRenderer.invoke(CHANNELS.GET_CURRENT_METRICS),
    getMetricsHistory: (minutes?: number) => ipcRenderer.invoke(CHANNELS.GET_METRICS_HISTORY, minutes),
    getAverageMetrics: (minutes?: number) => ipcRenderer.invoke(CHANNELS.GET_AVERAGE_METRICS, minutes),
    getHealth: () => ipcRenderer.invoke(CHANNELS.GET_SYSTEM_HEALTH),
    getSystemInfo: () => ipcRenderer.invoke(CHANNELS.GET_SYSTEM_INFO),
    getMemoryUsage: () => ipcRenderer.invoke(CHANNELS.GET_MEMORY_USAGE),
    optimizeMemory: () => ipcRenderer.invoke(CHANNELS.OPTIMIZE_MEMORY),
    // 새로운 시스템 정보 API
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    getCpuInfo: () => ipcRenderer.invoke('system:getCpuInfo'),
    getProcesses: () => ipcRenderer.invoke('system:getProcesses'),
    getLoopProcesses: () => ipcRenderer.invoke('system:getLoopProcesses'),
    native: {
      getStatus: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_STATUS),
      
      // 메모리 관련
      getMemoryUsage: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_USAGE),
      startMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_START_MEMORY_MONITORING),
      getMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_STATS),
      optimizeMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY),
      cleanupMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP_MEMORY),
      optimizeMemoryAdvanced: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
      resetMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
      
      // GPU 관련
      getGpuInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_INFO),
      getGpuMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
      runGpuAcceleration: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
      runGpuBenchmark: () => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
      
      // 시스템 관련
      getSystemInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_SYSTEM_INFO),
      isNativeModuleAvailable: () => ipcRenderer.invoke(CHANNELS.NATIVE_IS_AVAILABLE),
      getNativeModuleInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_INFO),
      getNativeModuleVersion: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_VERSION),
      initializeNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_INITIALIZE),
      cleanupNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP),
      getTimestamp: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP),
      
      // 워커 관련
      addWorkerTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
      getWorkerTaskStatus: (taskId: string) => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
      getWorkerStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_STATS),
      getPendingTaskCount: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
      resetWorkerPool: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_WORKER_POOL),
      executeCpuTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
      processDataParallel: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
      
      // 유틸리티 관련
      calculateFileHash: (filePath: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_FILE_HASH, filePath),
      calculateDirectorySize: (dirPath: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, dirPath),
      calculateStringSimilarity: (str1: string, str2: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, str1, str2),
      validateJson: (jsonStr: string) => ipcRenderer.invoke(CHANNELS.NATIVE_VALIDATE_JSON, jsonStr),
      encodeBase64: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_ENCODE_BASE64, data),
      decodeBase64: (encodedData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_DECODE_BASE64, encodedData),
      generateUuid: () => ipcRenderer.invoke(CHANNELS.NATIVE_GENERATE_UUID),
      getTimestampString: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP_STRING),
      getEnvVar: (name: string) => ipcRenderer.invoke(CHANNELS.NATIVE_GET_ENV_VAR, name),
      getProcessId: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_ID),
      startPerformanceMeasurement: (label: string) => ipcRenderer.invoke(CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, label),
      endPerformanceMeasurement: (measurementId: string) => ipcRenderer.invoke(CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, measurementId),
      
      // 기존 함수들 (호환성 유지)
      startKeystrokeTracking: () => ipcRenderer.invoke(CHANNELS.NATIVE_START_KEYSTROKE_TRACKING),
      stopKeystrokeTracking: () => ipcRenderer.invoke(CHANNELS.NATIVE_STOP_KEYSTROKE_TRACKING),
      getKeystrokeStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_KEYSTROKE_STATS),
      startFileMonitoring: (path: string) => ipcRenderer.invoke(CHANNELS.NATIVE_START_FILE_MONITORING, path),
      stopFileMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_STOP_FILE_MONITORING),
      getProcessList: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_LIST),
      getNetworkConnections: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_NETWORK_CONNECTIONS),
      hashData: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_HASH_DATA, data),
    },
    gpu: {
      getInfo: () => ipcRenderer.invoke(CHANNELS.GPU_GET_INFO),
      compute: (data: any) => ipcRenderer.invoke(CHANNELS.GPU_COMPUTE, data),
      enable: () => ipcRenderer.invoke(CHANNELS.GPU_ENABLE),
      disable: () => ipcRenderer.invoke(CHANNELS.GPU_DISABLE),
    }
  },

  // 메모리 관리 API
  memory: {
    cleanup: (force?: boolean) => ipcRenderer.invoke(CHANNELS.MEMORY_CLEANUP, force),
    getUsage: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_USAGE),
    getStats: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_STATS),
    getInfo: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_INFO),
    optimize: () => ipcRenderer.invoke(CHANNELS.MEMORY_OPTIMIZE)
  },

  // 네이티브 모듈 API (최상위)
  native: {
    // 메모리 관련
    getMemoryUsage: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_USAGE),
    startMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_START_MEMORY_MONITORING),
    getMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_STATS),
    optimizeMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY),
    cleanupMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP_MEMORY),
    optimizeMemoryAdvanced: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
    resetMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
    
    // GPU 관련
    getGpuInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_INFO),
    getGpuMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
    runGpuAcceleration: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
    runGpuBenchmark: () => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
    
    // 시스템 관련
    getSystemInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_SYSTEM_INFO),
    isNativeModuleAvailable: () => ipcRenderer.invoke(CHANNELS.NATIVE_IS_AVAILABLE),
    getNativeModuleInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_INFO),
    getNativeModuleVersion: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_VERSION),
    initializeNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_INITIALIZE),
    cleanupNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP),
    getTimestamp: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP),
    
    // 워커 관련
    addWorkerTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
    getWorkerTaskStatus: (taskId: string) => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
    getWorkerStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_STATS),
    getPendingTaskCount: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
    resetWorkerPool: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_WORKER_POOL),
    executeCpuTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
    processDataParallel: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
    
    // 유틸리티 관련
    calculateFileHash: (filePath: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_FILE_HASH, filePath),
    calculateDirectorySize: (dirPath: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, dirPath),
    calculateStringSimilarity: (str1: string, str2: string) => ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, str1, str2),
    validateJson: (jsonStr: string) => ipcRenderer.invoke(CHANNELS.NATIVE_VALIDATE_JSON, jsonStr),
    encodeBase64: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_ENCODE_BASE64, data),
    decodeBase64: (encodedData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_DECODE_BASE64, encodedData),
    generateUuid: () => ipcRenderer.invoke(CHANNELS.NATIVE_GENERATE_UUID),
    getTimestampString: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP_STRING),
    getEnvVar: (name: string) => ipcRenderer.invoke(CHANNELS.NATIVE_GET_ENV_VAR, name),
    getProcessId: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_ID),
    startPerformanceMeasurement: (label: string) => ipcRenderer.invoke(CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, label),
    endPerformanceMeasurement: (measurementId: string) => ipcRenderer.invoke(CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, measurementId),
  },

  // 윈도우 관리 API
  window: {
    create: (options?: any) => ipcRenderer.invoke(CHANNELS.WINDOW_CREATE, options),
    minimize: () => ipcRenderer.invoke(CHANNELS.MINIMIZE_WINDOW),
    maximize: () => ipcRenderer.invoke(CHANNELS.MAXIMIZE_WINDOW),
    toggleMaximize: () => ipcRenderer.invoke(CHANNELS.TOGGLE_MAXIMIZE),
    close: () => ipcRenderer.invoke(CHANNELS.CLOSE_WINDOW),
    toggleDevTools: () => ipcRenderer.invoke(CHANNELS.TOGGLE_DEVTOOLS)
  },

  // 설정 관리 API
  config: {
    get: (key?: string) => ipcRenderer.invoke(CHANNELS.GET_CONFIG, key),
    set: (key: string, value: any) => ipcRenderer.invoke(CHANNELS.SET_CONFIG, key, value),
    getAll: () => ipcRenderer.invoke(CHANNELS.GET_ALL_CONFIG),
    reset: () => ipcRenderer.invoke(CHANNELS.RESET_CONFIG)
  },

  // 앱 정보 API
  app: {
    getInfo: () => ipcRenderer.invoke(CHANNELS.GET_APP_INFO),
    getVersion: () => ipcRenderer.invoke(CHANNELS.GET_VERSION)
  },

  // 이벤트 리스너 API
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, listener)
  },
  
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.off(channel, listener)
  },

  once: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.once(channel, listener)
  },

  // 유틸리티
  utils: {
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    },
    platform: process.platform,
    versions: process.versions
  }
}

// 타입 정의 내보내기
export type ElectronAPI = typeof electronAPI

// Context Bridge를 통해 API 노출
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  
  // 디버깅을 위해 실제 노출된 키들 확인
  const exposedKeys = Object.keys(electronAPI);
  console.log('✅ Electron API가 성공적으로 노출되었습니다.');
  console.log('🔌 사용 가능한 API:', exposedKeys);
  
  // native API가 포함되었는지 확인
  if (electronAPI.native) {
    console.log('✅ Native API가 최상위 레벨에서 사용 가능합니다.');
    console.log('🛠️ Native API 함수들:', Object.keys(electronAPI.native));
  } else {
    console.warn('⚠️ Native API가 최상위 레벨에서 누락되었습니다.');
  }
  
  // system.native도 확인
  if (electronAPI.system?.native) {
    console.log('✅ System.Native API도 사용 가능합니다.');
  }
  
  // CSS 스타일 주입 함수 추가
  contextBridge.exposeInMainWorld('injectStyles', () => {
    // 기본 CSS 변수를 문서에 적용
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --background-color: #f9f9f9;
        --text-color: #333;
        --primary-color: #0070f3;
        --text-secondary: #666;
        --border-color: #e0e0e0;
        --card-bg: #ffffff;
        --header-bg: #ffffff;
        --footer-bg: #f0f0f0;
      }
      
      body {
        background-color: var(--background-color);
        color: var(--text-color);
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
          Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
      }
      
      .dark-mode, [data-theme="dark"] {
        --background-color: #121212;
        --text-color: #e0e0e0;
        --text-secondary: #a0a0a0;
        --border-color: #333;
        --card-bg: #1e1e1e;
        --header-bg: #1e1e1e;
        --footer-bg: #121212;
      }
    `;
    document.head.appendChild(style);
    
    // 외부 스타일시트 로드
    const loadStylesheet = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };
    
    // 로드할 스타일 목록
    loadStylesheet('/assets/fonts/font.css');
    loadStylesheet('/assets/styles/electron-styles.css');
    
    console.log('✅ 스타일 시트 주입 성공');
    return true;
  });
} catch (error) {
  console.error('❌ Preload script: electronAPI 노출 실패:', error)
}

// 개발 모드에서 디버깅 정보
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 개발 모드: preload script 로드됨')
  console.log('📡 사용 가능한 채널:', Object.values(CHANNELS))
  
  // DOM이 로드되면 CSS를 주입하는 스크립트 실행
  window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.textContent = `
      if (window.injectStyles) {
        console.log('🎨 스타일 주입 시작...');
        window.injectStyles();
      } else {
        console.error('❌ injectStyles 함수를 찾을 수 없습니다');
      }
    `;
    document.body.appendChild(script);
  });
}
