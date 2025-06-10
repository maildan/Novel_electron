/**
 * Preload Script for Loop 6
 * 
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 */

import { contextBridge, ipcRenderer } from 'electron';

// 네이티브 모듈 API
const nativeAPI = {
  // 메모리 관련
  getMemoryUsage: () => ipcRenderer.invoke('native:getMemoryUsage'),
  startMemoryMonitoring: () => ipcRenderer.invoke('native:startMemoryMonitoring'),
  getMemoryStats: () => ipcRenderer.invoke('native:getMemoryStats'),
  optimizeMemory: () => ipcRenderer.invoke('native:optimizeMemory'),
  cleanupMemory: () => ipcRenderer.invoke('native:cleanupMemory'),
  optimizeMemoryAdvanced: () => ipcRenderer.invoke('native:optimizeMemoryAdvanced'),
  resetMemoryMonitoring: () => ipcRenderer.invoke('native:resetMemoryMonitoring'),
  
  // GPU 관련
  getGpuInfo: () => ipcRenderer.invoke('native:getGpuInfo'),
  getGpuMemoryStats: () => ipcRenderer.invoke('native:getGpuMemoryStats'),
  runGpuAcceleration: (data: string) => ipcRenderer.invoke('native:runGpuAcceleration', data),
  runGpuBenchmark: () => ipcRenderer.invoke('native:runGpuBenchmark'),
  
  // 시스템 관련
  getSystemInfo: () => ipcRenderer.invoke('native:getSystemInfo'),
  isNativeModuleAvailable: () => ipcRenderer.invoke('native:isNativeModuleAvailable'),
  getNativeModuleInfo: () => ipcRenderer.invoke('native:getNativeModuleInfo'),
  getNativeModuleVersion: () => ipcRenderer.invoke('native:getNativeModuleVersion'),
  initializeNativeModules: () => ipcRenderer.invoke('native:initializeNativeModules'),
  cleanupNativeModules: () => ipcRenderer.invoke('native:cleanupNativeModules'),
  getTimestamp: () => ipcRenderer.invoke('native:getTimestamp'),
  
  // 워커 관련
  addWorkerTask: (taskData: string) => ipcRenderer.invoke('native:addWorkerTask', taskData),
  getWorkerTaskStatus: (taskId: string) => ipcRenderer.invoke('native:getWorkerTaskStatus', taskId),
  getWorkerStats: () => ipcRenderer.invoke('native:getWorkerStats'),
  getPendingTaskCount: () => ipcRenderer.invoke('native:getPendingTaskCount'),
  resetWorkerPool: () => ipcRenderer.invoke('native:resetWorkerPool'),
  executeCpuTask: (taskData: string) => ipcRenderer.invoke('native:executeCpuTask', taskData),
  processDataParallel: (data: string) => ipcRenderer.invoke('native:processDataParallel', data),
  
  // 유틸리티 관련
  calculateFileHash: (filePath: string) => ipcRenderer.invoke('native:calculateFileHash', filePath),
  calculateDirectorySize: (dirPath: string) => ipcRenderer.invoke('native:calculateDirectorySize', dirPath),
  calculateStringSimilarity: (str1: string, str2: string) => ipcRenderer.invoke('native:calculateStringSimilarity', str1, str2),
  validateJson: (jsonStr: string) => ipcRenderer.invoke('native:validateJson', jsonStr),
  encodeBase64: (data: string) => ipcRenderer.invoke('native:encodeBase64', data),
  decodeBase64: (encodedData: string) => ipcRenderer.invoke('native:decodeBase64', encodedData),
  generateUuid: () => ipcRenderer.invoke('native:generateUuid'),
  getTimestampString: () => ipcRenderer.invoke('native:getTimestampString'),
  getEnvVar: (name: string) => ipcRenderer.invoke('native:getEnvVar', name),
  getProcessId: () => ipcRenderer.invoke('native:getProcessId'),
  startPerformanceMeasurement: (label: string) => ipcRenderer.invoke('native:startPerformanceMeasurement', label),
  endPerformanceMeasurement: (measurementId: string) => ipcRenderer.invoke('native:endPerformanceMeasurement', measurementId),
};

// 시스템 API
const systemAPI = {
  getInfo: () => ipcRenderer.invoke('system:getInfo'),
  startMonitoring: () => ipcRenderer.invoke('system:start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('system:stop-monitoring'),
  getCurrentMetrics: () => ipcRenderer.invoke('system:get-current-metrics'),
  getMetricsHistory: (minutes?: number) => ipcRenderer.invoke('system:get-metrics-history', minutes),
  cleanup: (force?: boolean) => ipcRenderer.invoke('system:cleanup', force),
  getUsage: () => ipcRenderer.invoke('system:get-usage'),
  getStats: () => ipcRenderer.invoke('system:get-stats'),
  optimizeMemory: () => ipcRenderer.invoke('system:optimize-memory'),
  getLoopProcesses: () => ipcRenderer.invoke('system:getLoopProcesses'),
  gpu: {
    getInfo: () => ipcRenderer.invoke('gpu:get-info'),
    compute: (data: any) => ipcRenderer.invoke('gpu:compute', data),
    enable: () => ipcRenderer.invoke('gpu:enable'),
    disable: () => ipcRenderer.invoke('gpu:disable'),
  },
  native: {
    getStatus: () => ipcRenderer.invoke('native:get-status'),
  }
};

// 메모리 API
const memoryAPI = {
  cleanup: (force?: boolean) => ipcRenderer.invoke('memory:cleanup', force),
  getUsage: () => ipcRenderer.invoke('memory:get-usage'),
  getStats: () => ipcRenderer.invoke('memory:get-stats'),
  getInfo: () => ipcRenderer.invoke('memory:get-info'),
  optimize: () => ipcRenderer.invoke('memory:optimize'),
};

// 설정 API - IPC 핸들러와 직접 연결
const settingsAPI = {
  get: () => ipcRenderer.invoke('settings:get'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get-setting', key),
  update: (key: string, value: any) => ipcRenderer.invoke('settings:update', key, value),
  updateMultiple: (settings: Record<string, any>) => ipcRenderer.invoke('settings:update-multiple', settings),
  reset: () => ipcRenderer.invoke('settings:reset'),
  export: (filePath: string) => ipcRenderer.invoke('settings:export', filePath),
  import: (filePath: string) => ipcRenderer.invoke('settings:import', filePath),
  validate: (settings: Record<string, any>) => ipcRenderer.invoke('settings:validate', settings),
  createBackup: () => ipcRenderer.invoke('settings:create-backup'),
  getHistory: () => ipcRenderer.invoke('settings:get-history'),
  clearHistory: () => ipcRenderer.invoke('settings:clear-history'),
};

// 윈도우 API
const windowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  unmaximize: () => ipcRenderer.invoke('window:unmaximize'),
  close: () => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:set-always-on-top', flag),
  setOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  setSize: (width: number, height: number) => ipcRenderer.invoke('window:set-size', width, height),
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:set-position', x, y),
  center: () => ipcRenderer.invoke('window:center'),
  focus: () => ipcRenderer.invoke('window:focus'),
  blur: () => ipcRenderer.invoke('window:blur'),
  show: () => ipcRenderer.invoke('window:show'),
  hide: () => ipcRenderer.invoke('window:hide'),
  setFullScreen: (flag: boolean) => ipcRenderer.invoke('window:set-fullscreen', flag),
  isFullScreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  isMinimized: () => ipcRenderer.invoke('window:is-minimized'),
  isVisible: () => ipcRenderer.invoke('window:is-visible'),
  isFocused: () => ipcRenderer.invoke('window:is-focused'),
};

// 앱 API
const appAPI = {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getName: () => ipcRenderer.invoke('app:get-name'),
  getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  quit: () => ipcRenderer.invoke('app:quit'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  isPackaged: () => ipcRenderer.invoke('app:is-packaged'),
  getLocale: () => ipcRenderer.invoke('app:get-locale'),
  focus: () => ipcRenderer.invoke('app:focus'),
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
const electronAPI = {
  ipcRenderer: ipcRendererAPI,
  system: systemAPI,
  memory: memoryAPI,
  settings: settingsAPI,
  window: windowAPI,
  app: appAPI,
  native: nativeAPI,
  
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

// Context Bridge를 통해 안전하게 API 노출
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('✅ Electron API가 성공적으로 노출되었습니다.');
  console.log('🔌 사용 가능한 API:', Object.keys(electronAPI));
} catch (error) {
  console.error('❌ Electron API 노출 실패:', error);
}

export type ElectronAPI = typeof electronAPI;
