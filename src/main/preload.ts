/**
 * Preload Script for Loop 6
 * 
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 * 
 * 이 파일은 preload/index.ts의 모든 중요한 기능을 통합한 authoritative preload script입니다.
 */

import { contextBridge, ipcRenderer } from 'electron';

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

// 타입 검증 함수들
function validateMemoryData(data: unknown): data is MemoryData {
  return typeof data === 'object' && data !== null && 'main' in data && 'timestamp' in data;
}

function validateNativeModuleStatus(status: unknown): status is NativeModuleStatus {
  return typeof status === 'object' && status !== null && 'available' in status;
}

function createAPIResponse<T>(success: boolean, data?: T, error?: string): APIResponse<T> {
  return { success, data, error };
}

// IPC 채널 정의 - preload/index.ts에서 가져온 완전한 채널 목록
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

  // Setup 관리 (기존 config)
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',
  GET_ALL_CONFIG: 'config:getAllConfig',
  RESET_CONFIG: 'config:reset',

  // Setup 관리 (새로운 settings)
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_UPDATE_MULTIPLE: 'settings:update-multiple',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_LOAD: 'settings:load',

  // 앱 정보
  GET_APP_INFO: 'app:getInfo',
  GET_VERSION: 'app:getVersion'
} as const;

// 데이터베이스 API - preload/index.ts에서 가져온 완전한 database API
const databaseAPI = {
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
};

// 네이티브 모듈 API - preload/index.ts에서 가져온 완전한 native API
const nativeAPI = {
  // 메모리 관련 - CHANNELS 상수 사용
  getMemoryUsage: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_USAGE),
  startMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_START_MEMORY_MONITORING),
  getMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_STATS),
  optimizeMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY),
  cleanupMemory: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP_MEMORY),
  optimizeMemoryAdvanced: () => ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
  resetMemoryMonitoring: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
  
  // GPU 관련 - CHANNELS 상수 사용
  getGpuInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_INFO),
  getGpuMemoryStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
  runGpuAcceleration: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
  runGpuBenchmark: () => ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
  
  // 시스템 관련 - CHANNELS 상수 사용
  getSystemInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_SYSTEM_INFO),
  isNativeModuleAvailable: () => ipcRenderer.invoke(CHANNELS.NATIVE_IS_AVAILABLE),
  getNativeModuleInfo: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_INFO),
  getNativeModuleVersion: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_VERSION),
  initializeNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_INITIALIZE),
  cleanupNativeModules: () => ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP),
  getTimestamp: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP),
  
  // 워커 관련 - CHANNELS 상수 사용
  addWorkerTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
  getWorkerTaskStatus: (taskId: string) => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
  getWorkerStats: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_STATS),
  getPendingTaskCount: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
  resetWorkerPool: () => ipcRenderer.invoke(CHANNELS.NATIVE_RESET_WORKER_POOL),
  executeCpuTask: (taskData: string) => ipcRenderer.invoke(CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
  processDataParallel: (data: string) => ipcRenderer.invoke(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
  
  // 유틸리티 관련 - CHANNELS 상수 사용
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
};

// 시스템 API - 확장된 버전
const systemAPI = {
  getInfo: () => ipcRenderer.invoke('systemGetInfo'),
  startMonitoring: () => ipcRenderer.invoke(CHANNELS.START_MONITORING),
  stopMonitoring: () => ipcRenderer.invoke(CHANNELS.STOP_MONITORING),
  getCurrentMetrics: () => ipcRenderer.invoke(CHANNELS.GET_CURRENT_METRICS),
  getMetricsHistory: (minutes?: number) => ipcRenderer.invoke(CHANNELS.GET_METRICS_HISTORY, minutes),
  getAverageMetrics: (minutes?: number) => ipcRenderer.invoke(CHANNELS.GET_AVERAGE_METRICS, minutes),
  getHealth: () => ipcRenderer.invoke(CHANNELS.GET_SYSTEM_HEALTH),
  getSystemInfo: () => ipcRenderer.invoke(CHANNELS.GET_SYSTEM_INFO),
  getMemoryUsage: () => ipcRenderer.invoke(CHANNELS.GET_MEMORY_USAGE),
  optimizeMemory: () => ipcRenderer.invoke(CHANNELS.OPTIMIZE_MEMORY),
  cleanup: (force?: boolean) => ipcRenderer.invoke('systemCleanup', force),
  getUsage: () => ipcRenderer.invoke('systemGetUsage'),
  getStats: () => ipcRenderer.invoke('systemGetStats'),
  getLoopProcesses: () => ipcRenderer.invoke('systemGetLoopProcesses'),
  // 새로운 시스템 정보 API
  getCpuInfo: () => ipcRenderer.invoke('system:getCpuInfo'),
  getProcesses: () => ipcRenderer.invoke('system:getProcesses'),
  gpu: {
    getInfo: () => ipcRenderer.invoke(CHANNELS.GPU_GET_INFO),
    compute: (data: any) => ipcRenderer.invoke(CHANNELS.GPU_COMPUTE, data),
    enable: () => ipcRenderer.invoke(CHANNELS.GPU_ENABLE),
    disable: () => ipcRenderer.invoke(CHANNELS.GPU_DISABLE),
  },
  native: {
    getStatus: async () => {
      const status = await ipcRenderer.invoke(CHANNELS.NATIVE_GET_STATUS);
      // 네이티브 모듈 상태 검증
      if (validateNativeModuleStatus(status)) {
        console.log('네이티브 모듈 상태 확인됨:', status.available);
        return createAPIResponse(true, status);
      }
      return createAPIResponse(false, undefined, '네이티브 모듈 상태를 확인할 수 없습니다');
    },
  }
};

// 메모리 API - 확장된 버전
const memoryAPI = {
  cleanup: (force?: boolean) => ipcRenderer.invoke(CHANNELS.MEMORY_CLEANUP, force),
  getUsage: async () => {
    const usage = await ipcRenderer.invoke(CHANNELS.MEMORY_GET_USAGE);
    // 타입 검증을 통한 안전한 사용
    if (validateMemoryData(usage)) {
      console.log('검증된 메모리 데이터:', usage.timestamp);
      return createAPIResponse(true, usage);
    }
    return createAPIResponse(false, undefined, '메모리 데이터 형식이 올바르지 않습니다');
  },
  getStats: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_STATS),
  getInfo: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_INFO),
  optimize: () => ipcRenderer.invoke(CHANNELS.MEMORY_OPTIMIZE),
  forceGc: () => ipcRenderer.invoke('memoryForceGc'),
  setThreshold: (threshold: number) => ipcRenderer.invoke('memory:setThreshold', threshold),
};

// Setup API - preload/index.ts와 통합된 완전한 settings API
const settingsAPI = {
  // 기본 CRUD
  get: (key?: string) => ipcRenderer.invoke(CHANNELS.SETTINGS_GET, key),
  set: (key: string, value: any) => ipcRenderer.invoke(CHANNELS.SETTINGS_SET, key, value),
  getAll: () => ipcRenderer.invoke(CHANNELS.SETTINGS_GET_ALL),
  update: (key: string, value: any) => ipcRenderer.invoke(CHANNELS.SETTINGS_UPDATE, key, value),
  updateMultiple: (settings: Record<string, any>) => ipcRenderer.invoke(CHANNELS.SETTINGS_UPDATE_MULTIPLE, settings),
  reset: () => ipcRenderer.invoke(CHANNELS.SETTINGS_RESET),
  save: () => ipcRenderer.invoke(CHANNELS.SETTINGS_SAVE),
  load: () => ipcRenderer.invoke(CHANNELS.SETTINGS_LOAD),
  
  // 추가 기능들 (기존 main/preload.ts에서 가져옴)
  getSetting: (key: string) => ipcRenderer.invoke('settingsGetSetting', key),
  export: (filePath: string) => ipcRenderer.invoke('settingsExport', filePath),
  import: (filePath: string) => ipcRenderer.invoke('settingsImport', filePath),
  validate: (settings: Record<string, any>) => ipcRenderer.invoke('settingsValidate', settings),
  createBackup: () => ipcRenderer.invoke('settingsCreateBackup'),
  getHistory: () => ipcRenderer.invoke('settingsGetHistory'),
  clearHistory: () => ipcRenderer.invoke('settingsClearHistory'),
};

// 윈도우 API - 확장된 버전
const windowAPI = {
  create: (options?: any) => ipcRenderer.invoke(CHANNELS.WINDOW_CREATE, options),
  minimize: () => ipcRenderer.invoke(CHANNELS.MINIMIZE_WINDOW),
  maximize: () => ipcRenderer.invoke(CHANNELS.MAXIMIZE_WINDOW),
  toggleMaximize: () => ipcRenderer.invoke(CHANNELS.TOGGLE_MAXIMIZE),
  close: () => ipcRenderer.invoke(CHANNELS.CLOSE_WINDOW),
  toggleDevTools: () => ipcRenderer.invoke(CHANNELS.TOGGLE_DEVTOOLS),
  unmaximize: () => ipcRenderer.invoke('window:unmaximize'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('setAlwaysOnTop', flag),
  setOpacity: (opacity: number) => ipcRenderer.invoke('setWindowOpacity', opacity),
  setSize: (width: number, height: number) => ipcRenderer.invoke('window:setSize', width, height),
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:setPosition', x, y),
  center: () => ipcRenderer.invoke('window:center'),
  focus: () => ipcRenderer.invoke('focusWindow'),
  blur: () => ipcRenderer.invoke('window:blur'),
  show: () => ipcRenderer.invoke('window:show'),
  hide: () => ipcRenderer.invoke('window:hide'),
  setFullScreen: (flag: boolean) => ipcRenderer.invoke('window:setFullScreen', flag),
  isFullScreen: () => ipcRenderer.invoke('window:isFullScreen'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isMinimized: () => ipcRenderer.invoke('window:isMinimized'),
  isVisible: () => ipcRenderer.invoke('window:isVisible'),
  isFocused: () => ipcRenderer.invoke('window:isFocused'),
  setWindowMode: (mode: string) => ipcRenderer.invoke('setWindowMode', mode),
  getWindowStatus: () => ipcRenderer.invoke('getWindowStatus'),
  setWindowBounds: (bounds: any) => ipcRenderer.invoke('setWindowBounds', bounds),
};

// 앱 API - 확장된 버전
const appAPI = {
  getVersion: () => ipcRenderer.invoke(CHANNELS.GET_VERSION),
  getInfo: () => ipcRenderer.invoke(CHANNELS.GET_APP_INFO),
  getName: () => ipcRenderer.invoke('app:getName'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  quit: () => ipcRenderer.invoke('app:quit'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
  getLocale: () => ipcRenderer.invoke('app:getLocale'),
  focus: () => ipcRenderer.invoke('app:focus'),
};

// Config API - 기존 config 시스템 지원
const configAPI = {
  get: (key?: string) => ipcRenderer.invoke(CHANNELS.GET_CONFIG, key),
  set: (key: string, value: any) => ipcRenderer.invoke(CHANNELS.SET_CONFIG, key, value),
  getAll: () => ipcRenderer.invoke(CHANNELS.GET_ALL_CONFIG),
  reset: () => ipcRenderer.invoke(CHANNELS.RESET_CONFIG)
};

// IPC 렌더러 - 이벤트 리스너와 메시지 전송을 위한 안전한 래퍼
const ipcRendererAPI = {
  // 메시지 전송
  send: (channel: string, ...args: any[]) => {
    console.log('📤 IPC Send:', channel, args);
    ipcRenderer.send(channel, ...args);
  },
  
  // 메시지 요청 (응답 대기)
  invoke: async (channel: string, ...args: any[]) => {
    console.log('📞 IPC Invoke:', channel, args);
    try {
      const result = await ipcRenderer.invoke(channel, ...args);
      console.log('✅ IPC Invoke Response:', channel, result);
      return result;
    } catch (error) {
      console.error('❌ IPC Invoke Error:', channel, error);
      throw error;
    }
  },
  
  // 이벤트 리스너 등록
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
    console.log('👂 IPC On:', channel);
    const subscription = (event: any, ...args: any[]) => {
      console.log('📥 IPC Event:', channel, args);
      listener(event, ...args);
    };
    ipcRenderer.on(channel, subscription);
    return () => {
      console.log('🔇 IPC Off:', channel);
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  
  // 일회성 이벤트 리스너
  once: (channel: string, listener: (event: any, ...args: any[]) => void) => {
    console.log('👂 IPC Once:', channel);
    const subscription = (event: any, ...args: any[]) => {
      console.log('📥 IPC Event (Once):', channel, args);
      listener(event, ...args);
    };
    ipcRenderer.once(channel, subscription);
  },
  
  // 리스너 제거
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    console.log('🔇 IPC Remove Listener:', channel);
    ipcRenderer.removeListener(channel, listener);
  },
  
  // 모든 리스너 제거
  removeAllListeners: (channel: string) => {
    console.log('🔇 IPC Remove All Listeners:', channel);
    ipcRenderer.removeAllListeners(channel);
  }
};

// 전체 Electron API 객체 - 완전히 통합된 버전
const electronAPI = {
  // 최상위 레벨에 invoke 메서드 노출
  invoke: async (channel: string, ...args: any[]) => {
    console.log('📞 IPC Invoke:', channel, args);
    try {
      const result = await ipcRenderer.invoke(channel, ...args);
      console.log('✅ IPC Invoke Response:', channel, result);
      return result;
    } catch (error) {
      console.error('❌ IPC Invoke Error:', channel, error);
      throw error;
    }
  },
  
  // 모든 API 카테고리
  database: databaseAPI,
  ipcRenderer: ipcRendererAPI,
  system: systemAPI,
  memory: memoryAPI,
  settings: settingsAPI,
  window: windowAPI,
  app: appAPI,
  native: nativeAPI,
  config: configAPI,
  
  // 이벤트 리스너 API - preload/index.ts에서 가져온 기능
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
  },
  
  // 디버깅 정보
  debug: {
    getProcessInfo: () => ({
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV
    }),
    log: (message: string, ...args: any[]) => {
      console.log('[Preload] ${message}', ...args);
    }
  }
};

// CSS 스타일 주입 함수 - preload/index.ts에서 가져온 중요한 기능
const injectStyles = () => {
  // WCAG 기반 CSS 변수를 문서에 적용 (모듈화된 variables.css와 동기화)
  const style = document.createElement('style');
  style.textContent = `
    :root {
      /* WCAG 가이드라인 기반 라이트 모드 색상 팔레트 */
      --background: #ffffff;
      --foreground: #121212;
      --background-secondary: #f5f5f5;
      
      /* 텍스트 색상 - 4.5:1 대비 비율 확보 */
      --text-primary: #121212;
      --text-secondary: #424242;
      --text-tertiary: #616161;
      --text-disabled: #9e9e9e;
      
      /* 액센트 및 상호작용 색상 */
      --accent-primary: #3b82f6;
      --accent-secondary: #1d4ed8;
      --accent-tertiary: #60a5fa;
      
      /* 경계선 및 구분선 */
      --border-primary: #e0e0e0;
      --border-secondary: #f0f0f0;
      --border-focus: #3b82f6;
      
      /* 배경 및 표면 */
      --surface-primary: #ffffff;
      --surface-secondary: #fafafa;
      --surface-tertiary: #f5f5f5;
      --surface-hover: #f0f0f0;
      
      /* 상태 색상 */
      --success: #4caf50;
      --warning: #ff9800;
      --error: #f44336;
      --info: #2196f3;
      
      /* 그림자 */
      --shadow-light: rgba(0, 0, 0, 0.05);
      --shadow-medium: rgba(0, 0, 0, 0.1);
      --shadow-heavy: rgba(0, 0, 0, 0.15);
      
      /* 호버 및 포커스 효과 */
      --hover-opacity: 0.9;
      --focus-ring-width: 2px;
      --focus-ring-offset: 2px;
      
      /* 레거시 호환성 */
      --background-color: var(--background);
      --text-color: var(--text-primary);
      --primary-color: var(--accent-primary);
      --border-color: var(--border-primary);
      --card-bg: var(--surface-primary);
      --header-bg: var(--surface-primary);
      --footer-bg: var(--surface-tertiary);
      --hover-color: var(--surface-hover);
      --shadow-color: var(--shadow-medium);
      --focus-outline: var(--border-focus);
    }
    
    /* WCAG 가이드라인 기반 다크 모드 */
    .dark, [data-theme="dark"] {
      --background: #121212;
      --foreground: #e0e0e0;
      --background-secondary: #1e1e1e;
      
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --text-tertiary: #757575;
      --text-disabled: #616161;
      
      --accent-primary: #60a5fa;
      --accent-secondary: #3b82f6;
      --accent-tertiary: #93c5fd;
      
      --border-primary: #333333;
      --border-secondary: #2a2a2a;
      --border-focus: #60a5fa;
      
      --surface-primary: #1e1e1e;
      --surface-secondary: #242424;
      --surface-tertiary: #2a2a2a;
      --surface-hover: #333333;
      
      --success: #66bb6a;
      --warning: #ffb74d;
      --error: #ef5350;
      --info: #42a5f5;
      
      --shadow-light: rgba(0, 0, 0, 0.2);
      --shadow-medium: rgba(0, 0, 0, 0.3);
      --shadow-heavy: rgba(0, 0, 0, 0.4);
      
      /* 레거시 호환성 */
      --background-color: var(--background);
      --text-color: var(--text-primary);
      --border-color: var(--border-primary);
      --card-bg: var(--surface-primary);
      --header-bg: var(--surface-primary);
      --footer-bg: var(--surface-tertiary);
      --hover-color: var(--surface-hover);
      --shadow-color: var(--shadow-medium);
      --focus-outline: var(--border-focus);
    }
    
    /* 기본 스타일 */
    body {
      background-color: var(--background-color);
      color: var(--text-color);
      font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif);
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* 고대비 모드 지원 */
    @media (prefers-contrast: high) {
      :root {
        --text-primary: #000000;
        --text-secondary: #333333;
        --border-primary: #000000;
        --accent-primary: #0000ff;
      }
      
      .dark {
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-primary: #ffffff;
        --accent-primary: #66bb6a;
      }
    }
    
    /* 모션 감소 Setup 지원 */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // 외부 스타일시트 로드
  const loadStylesheet = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onerror = () => console.warn('⚠️ 스타일시트 로드 Failed: ${href}');
    document.head.appendChild(link);
  };
  
  // 로드할 스타일 목록
  try {
    loadStylesheet('/assets/fonts/font.css');
    loadStylesheet('/assets/styles/electron-styles.css');
    console.log('✅ 스타일 시트 주입 Success');
  } catch (error) {
    console.warn('⚠️ 외부 스타일시트 로드 중 Error:', error);
  }
  
  return true;
};

// Context Bridge를 통해 안전하게 API 노출
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  
  // 디버깅을 위해 실제 노출된 키들 확인
  const exposedKeys = Object.keys(electronAPI);
  console.log('✅ Electron API가 Success적으로 노출되었습니다.');
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
  contextBridge.exposeInMainWorld('injectStyles', injectStyles);
  
} catch (error) {
  console.error('❌ Preload script: electronAPI 노출 Failed:', error)
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

export type ElectronAPI = typeof electronAPI;
