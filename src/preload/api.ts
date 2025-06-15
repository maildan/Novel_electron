/**
 * Electron API 모듈
 * 
 * 모든 Electron IPC API들을 정의하고 export합니다.
 */

import { ipcRenderer } from 'electron';
import { CHANNELS } from './channels';

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

// 데이터베이스 API
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

// 네이티브 모듈 API
const nativeAPI = {
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
};

// 시스템 API
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
    getStatus: () => ipcRenderer.invoke(CHANNELS.NATIVE_GET_STATUS),
  }
};

// 메모리 API
const memoryAPI = {
  cleanup: (force?: boolean) => ipcRenderer.invoke(CHANNELS.MEMORY_CLEANUP, force),
  getUsage: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_USAGE),
  getStats: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_STATS),
  getInfo: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_INFO),
  optimize: () => ipcRenderer.invoke(CHANNELS.MEMORY_OPTIMIZE),
  forceGc: () => ipcRenderer.invoke('memoryForceGc'),
  setThreshold: (threshold: number) => ipcRenderer.invoke('memory:setThreshold', threshold),
};

// 설정 API
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
  
  // 추가 기능들 (호환성을 위해)
  getSetting: (key: string) => ipcRenderer.invoke('settingsGetSetting', key),
  export: (filePath: string) => ipcRenderer.invoke('settingsExport', filePath),
  import: (filePath: string) => ipcRenderer.invoke('settingsImport', filePath),
  validate: (settings: Record<string, any>) => ipcRenderer.invoke('settingsValidate', settings),
  createBackup: () => ipcRenderer.invoke('settingsCreateBackup'),
  getHistory: () => ipcRenderer.invoke('settingsGetHistory'),
  clearHistory: () => ipcRenderer.invoke('settingsClearHistory'),
};

// 윈도우 API
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

// 앱 API
const appAPI = {
  getVersion: () => ipcRenderer.invoke(CHANNELS.GET_VERSION),
  getInfo: () => ipcRenderer.invoke(CHANNELS.GET_APP_INFO),
  getName: () => ipcRenderer.invoke('app:getName'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  quit: () => ipcRenderer.invoke('app:quit'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  restart: () => ipcRenderer.invoke(CHANNELS.APP_RESTART),
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

// 전체 Electron API 객체
export const electronAPI = {
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
      console.log(`[Preload] ${message}`, ...args);
    }
  }
};

export type ElectronAPI = typeof electronAPI;
