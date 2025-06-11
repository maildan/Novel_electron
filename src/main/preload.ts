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
  startMonitoring: () => ipcRenderer.invoke('system:startMonitoring'),
  stopMonitoring: () => ipcRenderer.invoke('system:stopMonitoring'),
  getCurrentMetrics: () => ipcRenderer.invoke('system:getCurrentMetrics'),
  getMetricsHistory: (minutes?: number) => ipcRenderer.invoke('system:getMetricsHistory', minutes),
  cleanup: (force?: boolean) => ipcRenderer.invoke('system:cleanup', force),
  getUsage: () => ipcRenderer.invoke('system:getUsage'),
  getStats: () => ipcRenderer.invoke('system:getStats'),
  optimizeMemory: () => ipcRenderer.invoke('system:optimizeMemory'),
  getLoopProcesses: () => ipcRenderer.invoke('system:getLoopProcesses'),
  gpu: {
    getInfo: () => ipcRenderer.invoke('gpu:getInfo'),
    compute: (data: any) => ipcRenderer.invoke('gpu:compute', data),
    enable: () => ipcRenderer.invoke('gpu:enable'),
    disable: () => ipcRenderer.invoke('gpu:disable'),
  },
  native: {
    getStatus: () => ipcRenderer.invoke('system:native:getStatus'),
  }
};

// 메모리 API
const memoryAPI = {
  cleanup: (force?: boolean) => ipcRenderer.invoke('memory:cleanup', force),
  getUsage: () => ipcRenderer.invoke('memory:getUsage'),
  getStats: () => ipcRenderer.invoke('memory:getStats'),
  getInfo: () => ipcRenderer.invoke('memory:getInfo'),
  optimize: () => ipcRenderer.invoke('memory:optimize'),
  forceGc: () => ipcRenderer.invoke('memory:forceGc'),
  setThreshold: (threshold: number) => ipcRenderer.invoke('memory:setThreshold', threshold),
};

// 설정 API - IPC 핸들러와 직접 연결
const settingsAPI = {
  get: () => ipcRenderer.invoke('settings:get'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:getSetting', key),
  update: (key: string, value: any) => ipcRenderer.invoke('settings:update', key, value),
  updateMultiple: (settings: Record<string, any>) => ipcRenderer.invoke('settings:updateMultiple', settings),
  reset: () => ipcRenderer.invoke('settings:reset'),
  export: (filePath: string) => ipcRenderer.invoke('settings:export', filePath),
  import: (filePath: string) => ipcRenderer.invoke('settings:import', filePath),
  validate: (settings: Record<string, any>) => ipcRenderer.invoke('settings:validate', settings),
  createBackup: () => ipcRenderer.invoke('settings:createBackup'),
  getHistory: () => ipcRenderer.invoke('settings:getHistory'),
  clearHistory: () => ipcRenderer.invoke('settings:clearHistory'),
};

// 윈도우 API
const windowAPI = {
  minimize: () => ipcRenderer.invoke('minimizeWindow'),
  maximize: () => ipcRenderer.invoke('maximizeWindow'),
  unmaximize: () => ipcRenderer.invoke('window:unmaximize'),
  close: () => ipcRenderer.invoke('closeWindow'),
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
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getName: () => ipcRenderer.invoke('app:getName'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  quit: () => ipcRenderer.invoke('app:quit'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
  getLocale: () => ipcRenderer.invoke('app:getLocale'),
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
