"use strict";
/**
 * Preload Script for Loop 6
 *
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 네이티브 모듈 API
const nativeAPI = {
    // 메모리 관련
    getMemoryUsage: () => electron_1.ipcRenderer.invoke('native:getMemoryUsage'),
    startMemoryMonitoring: () => electron_1.ipcRenderer.invoke('native:startMemoryMonitoring'),
    getMemoryStats: () => electron_1.ipcRenderer.invoke('native:getMemoryStats'),
    optimizeMemory: () => electron_1.ipcRenderer.invoke('native:optimizeMemory'),
    cleanupMemory: () => electron_1.ipcRenderer.invoke('native:cleanupMemory'),
    optimizeMemoryAdvanced: () => electron_1.ipcRenderer.invoke('native:optimizeMemoryAdvanced'),
    resetMemoryMonitoring: () => electron_1.ipcRenderer.invoke('native:resetMemoryMonitoring'),
    // GPU 관련
    getGpuInfo: () => electron_1.ipcRenderer.invoke('native:getGpuInfo'),
    getGpuMemoryStats: () => electron_1.ipcRenderer.invoke('native:getGpuMemoryStats'),
    runGpuAcceleration: (data) => electron_1.ipcRenderer.invoke('native:runGpuAcceleration', data),
    runGpuBenchmark: () => electron_1.ipcRenderer.invoke('native:runGpuBenchmark'),
    // 시스템 관련
    getSystemInfo: () => electron_1.ipcRenderer.invoke('native:getSystemInfo'),
    isNativeModuleAvailable: () => electron_1.ipcRenderer.invoke('native:isNativeModuleAvailable'),
    getNativeModuleInfo: () => electron_1.ipcRenderer.invoke('native:getNativeModuleInfo'),
    getNativeModuleVersion: () => electron_1.ipcRenderer.invoke('native:getNativeModuleVersion'),
    initializeNativeModules: () => electron_1.ipcRenderer.invoke('native:initializeNativeModules'),
    cleanupNativeModules: () => electron_1.ipcRenderer.invoke('native:cleanupNativeModules'),
    getTimestamp: () => electron_1.ipcRenderer.invoke('native:getTimestamp'),
    // 워커 관련
    addWorkerTask: (taskData) => electron_1.ipcRenderer.invoke('native:addWorkerTask', taskData),
    getWorkerTaskStatus: (taskId) => electron_1.ipcRenderer.invoke('native:getWorkerTaskStatus', taskId),
    getWorkerStats: () => electron_1.ipcRenderer.invoke('native:getWorkerStats'),
    getPendingTaskCount: () => electron_1.ipcRenderer.invoke('native:getPendingTaskCount'),
    resetWorkerPool: () => electron_1.ipcRenderer.invoke('native:resetWorkerPool'),
    executeCpuTask: (taskData) => electron_1.ipcRenderer.invoke('native:executeCpuTask', taskData),
    processDataParallel: (data) => electron_1.ipcRenderer.invoke('native:processDataParallel', data),
    // 유틸리티 관련
    calculateFileHash: (filePath) => electron_1.ipcRenderer.invoke('native:calculateFileHash', filePath),
    calculateDirectorySize: (dirPath) => electron_1.ipcRenderer.invoke('native:calculateDirectorySize', dirPath),
    calculateStringSimilarity: (str1, str2) => electron_1.ipcRenderer.invoke('native:calculateStringSimilarity', str1, str2),
    validateJson: (jsonStr) => electron_1.ipcRenderer.invoke('native:validateJson', jsonStr),
    encodeBase64: (data) => electron_1.ipcRenderer.invoke('native:encodeBase64', data),
    decodeBase64: (encodedData) => electron_1.ipcRenderer.invoke('native:decodeBase64', encodedData),
    generateUuid: () => electron_1.ipcRenderer.invoke('native:generateUuid'),
    getTimestampString: () => electron_1.ipcRenderer.invoke('native:getTimestampString'),
    getEnvVar: (name) => electron_1.ipcRenderer.invoke('native:getEnvVar', name),
    getProcessId: () => electron_1.ipcRenderer.invoke('native:getProcessId'),
    startPerformanceMeasurement: (label) => electron_1.ipcRenderer.invoke('native:startPerformanceMeasurement', label),
    endPerformanceMeasurement: (measurementId) => electron_1.ipcRenderer.invoke('native:endPerformanceMeasurement', measurementId),
};
// 시스템 API
const systemAPI = {
    getInfo: () => electron_1.ipcRenderer.invoke('system:getInfo'),
    startMonitoring: () => electron_1.ipcRenderer.invoke('system:startMonitoring'),
    stopMonitoring: () => electron_1.ipcRenderer.invoke('system:stopMonitoring'),
    getCurrentMetrics: () => electron_1.ipcRenderer.invoke('system:getCurrentMetrics'),
    getMetricsHistory: (minutes) => electron_1.ipcRenderer.invoke('system:getMetricsHistory', minutes),
    cleanup: (force) => electron_1.ipcRenderer.invoke('system:cleanup', force),
    getUsage: () => electron_1.ipcRenderer.invoke('system:getUsage'),
    getStats: () => electron_1.ipcRenderer.invoke('system:getStats'),
    optimizeMemory: () => electron_1.ipcRenderer.invoke('system:optimizeMemory'),
    getLoopProcesses: () => electron_1.ipcRenderer.invoke('system:getLoopProcesses'),
    gpu: {
        getInfo: () => electron_1.ipcRenderer.invoke('gpu:getInfo'),
        compute: (data) => electron_1.ipcRenderer.invoke('gpu:compute', data),
        enable: () => electron_1.ipcRenderer.invoke('gpu:enable'),
        disable: () => electron_1.ipcRenderer.invoke('gpu:disable'),
    },
    native: {
        getStatus: () => electron_1.ipcRenderer.invoke('system:native:getStatus'),
    }
};
// 메모리 API
const memoryAPI = {
    cleanup: (force) => electron_1.ipcRenderer.invoke('memory:cleanup', force),
    getUsage: () => electron_1.ipcRenderer.invoke('memory:getUsage'),
    getStats: () => electron_1.ipcRenderer.invoke('memory:getStats'),
    getInfo: () => electron_1.ipcRenderer.invoke('memory:getInfo'),
    optimize: () => electron_1.ipcRenderer.invoke('memory:optimize'),
    forceGc: () => electron_1.ipcRenderer.invoke('memory:forceGc'),
    setThreshold: (threshold) => electron_1.ipcRenderer.invoke('memory:setThreshold', threshold),
};
// 설정 API - IPC 핸들러와 직접 연결
const settingsAPI = {
    get: () => electron_1.ipcRenderer.invoke('settings:get'),
    getSetting: (key) => electron_1.ipcRenderer.invoke('settings:getSetting', key),
    update: (key, value) => electron_1.ipcRenderer.invoke('settings:update', key, value),
    updateMultiple: (settings) => electron_1.ipcRenderer.invoke('settings:updateMultiple', settings),
    reset: () => electron_1.ipcRenderer.invoke('settings:reset'),
    export: (filePath) => electron_1.ipcRenderer.invoke('settings:export', filePath),
    import: (filePath) => electron_1.ipcRenderer.invoke('settings:import', filePath),
    validate: (settings) => electron_1.ipcRenderer.invoke('settings:validate', settings),
    createBackup: () => electron_1.ipcRenderer.invoke('settings:createBackup'),
    getHistory: () => electron_1.ipcRenderer.invoke('settings:getHistory'),
    clearHistory: () => electron_1.ipcRenderer.invoke('settings:clearHistory'),
};
// 윈도우 API
const windowAPI = {
    minimize: () => electron_1.ipcRenderer.invoke('minimizeWindow'),
    maximize: () => electron_1.ipcRenderer.invoke('maximizeWindow'),
    unmaximize: () => electron_1.ipcRenderer.invoke('window:unmaximize'),
    close: () => electron_1.ipcRenderer.invoke('closeWindow'),
    setAlwaysOnTop: (flag) => electron_1.ipcRenderer.invoke('setAlwaysOnTop', flag),
    setOpacity: (opacity) => electron_1.ipcRenderer.invoke('setWindowOpacity', opacity),
    setSize: (width, height) => electron_1.ipcRenderer.invoke('window:setSize', width, height),
    setPosition: (x, y) => electron_1.ipcRenderer.invoke('window:setPosition', x, y),
    center: () => electron_1.ipcRenderer.invoke('window:center'),
    focus: () => electron_1.ipcRenderer.invoke('focusWindow'),
    blur: () => electron_1.ipcRenderer.invoke('window:blur'),
    show: () => electron_1.ipcRenderer.invoke('window:show'),
    hide: () => electron_1.ipcRenderer.invoke('window:hide'),
    setFullScreen: (flag) => electron_1.ipcRenderer.invoke('window:setFullScreen', flag),
    isFullScreen: () => electron_1.ipcRenderer.invoke('window:isFullScreen'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
    isMinimized: () => electron_1.ipcRenderer.invoke('window:isMinimized'),
    isVisible: () => electron_1.ipcRenderer.invoke('window:isVisible'),
    isFocused: () => electron_1.ipcRenderer.invoke('window:isFocused'),
    setWindowMode: (mode) => electron_1.ipcRenderer.invoke('setWindowMode', mode),
    getWindowStatus: () => electron_1.ipcRenderer.invoke('getWindowStatus'),
    setWindowBounds: (bounds) => electron_1.ipcRenderer.invoke('setWindowBounds', bounds),
};
// 앱 API
const appAPI = {
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    getName: () => electron_1.ipcRenderer.invoke('app:getName'),
    getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
    quit: () => electron_1.ipcRenderer.invoke('app:quit'),
    relaunch: () => electron_1.ipcRenderer.invoke('app:relaunch'),
    isPackaged: () => electron_1.ipcRenderer.invoke('app:isPackaged'),
    getLocale: () => electron_1.ipcRenderer.invoke('app:getLocale'),
    focus: () => electron_1.ipcRenderer.invoke('app:focus'),
};
// IPC 렌더러 - 이벤트 리스너와 메시지 전송을 위한 안전한 래퍼
const ipcRendererAPI = {
    // 메시지 전송
    send: (channel, ...args) => {
        console.log('📤 IPC Send:', channel, args);
        electron_1.ipcRenderer.send(channel, ...args);
    },
    // 메시지 요청 (응답 대기)
    invoke: async (channel, ...args) => {
        console.log('📞 IPC Invoke:', channel, args);
        try {
            const result = await electron_1.ipcRenderer.invoke(channel, ...args);
            console.log('✅ IPC Invoke Response:', channel, result);
            return result;
        }
        catch (error) {
            console.error('❌ IPC Invoke Error:', channel, error);
            throw error;
        }
    },
    // 이벤트 리스너 등록
    on: (channel, listener) => {
        console.log('👂 IPC On:', channel);
        const subscription = (event, ...args) => {
            console.log('📥 IPC Event:', channel, args);
            listener(event, ...args);
        };
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            console.log('🔇 IPC Off:', channel);
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    },
    // 일회성 이벤트 리스너
    once: (channel, listener) => {
        console.log('👂 IPC Once:', channel);
        const subscription = (event, ...args) => {
            console.log('📥 IPC Event (Once):', channel, args);
            listener(event, ...args);
        };
        electron_1.ipcRenderer.once(channel, subscription);
    },
    // 리스너 제거
    removeListener: (channel, listener) => {
        console.log('🔇 IPC Remove Listener:', channel);
        electron_1.ipcRenderer.removeListener(channel, listener);
    },
    // 모든 리스너 제거
    removeAllListeners: (channel) => {
        console.log('🔇 IPC Remove All Listeners:', channel);
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
};
// 전체 Electron API 객체
const electronAPI = {
    // 최상위 레벨에 invoke 메서드 노출
    invoke: async (channel, ...args) => {
        console.log('📞 IPC Invoke:', channel, args);
        try {
            const result = await electron_1.ipcRenderer.invoke(channel, ...args);
            console.log('✅ IPC Invoke Response:', channel, result);
            return result;
        }
        catch (error) {
            console.error('❌ IPC Invoke Error:', channel, error);
            throw error;
        }
    },
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
        log: (message, ...args) => {
            console.log(`[Preload] ${message}`, ...args);
        }
    }
};
// Context Bridge를 통해 안전하게 API 노출
try {
    electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('✅ Electron API가 성공적으로 노출되었습니다.');
    console.log('🔌 사용 가능한 API:', Object.keys(electronAPI));
}
catch (error) {
    console.error('❌ Electron API 노출 실패:', error);
}
//# sourceMappingURL=preload.js.map