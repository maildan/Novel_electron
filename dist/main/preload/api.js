"use strict";
/**
 * Electron API 모듈
 *
 * 모든 Electron IPC API들을 정의하고 export합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.electronAPI = void 0;
const electron_1 = require("electron");
const channels_1 = require("./channels");
// 데이터베이스 API
const databaseAPI = {
    saveTypingSession: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SAVE_TYPING_SESSION, data),
    getRecentSessions: (limit) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_RECENT_SESSIONS, limit),
    getStatistics: (days) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_STATISTICS, days),
    cleanup: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.DB_CLEANUP),
    healthCheck: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.DB_HEALTH_CHECK),
    getKeystrokeData: (params) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_KEYSTROKE_DATA, params),
    getSessions: (params) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_SESSIONS, params),
    exportData: (params) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.EXPORT_DATA, params),
    importData: (params) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.IMPORT_DATA, params),
    clearData: (params) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.CLEAR_DATA, params)
};
// 네이티브 모듈 API
const nativeAPI = {
    // 메모리 관련
    getMemoryUsage: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_MEMORY_USAGE),
    startMemoryMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_START_MEMORY_MONITORING),
    getMemoryStats: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_MEMORY_STATS),
    optimizeMemory: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY),
    cleanupMemory: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_CLEANUP_MEMORY),
    optimizeMemoryAdvanced: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
    resetMemoryMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
    // GPU 관련
    getGpuInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_GPU_INFO),
    getGpuMemoryStats: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
    runGpuAcceleration: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
    runGpuBenchmark: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
    // 시스템 관련
    getSystemInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_SYSTEM_INFO),
    isNativeModuleAvailable: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_IS_AVAILABLE),
    getNativeModuleInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_MODULE_INFO),
    getNativeModuleVersion: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_MODULE_VERSION),
    initializeNativeModules: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_INITIALIZE),
    cleanupNativeModules: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_CLEANUP),
    getTimestamp: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_TIMESTAMP),
    // 워커 관련
    addWorkerTask: (taskData) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
    getWorkerTaskStatus: (taskId) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
    getWorkerStats: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_WORKER_STATS),
    getPendingTaskCount: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
    resetWorkerPool: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_RESET_WORKER_POOL),
    executeCpuTask: (taskData) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
    processDataParallel: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
    // 유틸리티 관련
    calculateFileHash: (filePath) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_CALCULATE_FILE_HASH, filePath),
    calculateDirectorySize: (dirPath) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, dirPath),
    calculateStringSimilarity: (str1, str2) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, str1, str2),
    validateJson: (jsonStr) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_VALIDATE_JSON, jsonStr),
    encodeBase64: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_ENCODE_BASE64, data),
    decodeBase64: (encodedData) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_DECODE_BASE64, encodedData),
    generateUuid: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GENERATE_UUID),
    getTimestampString: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_TIMESTAMP_STRING),
    getEnvVar: (name) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_ENV_VAR, name),
    getProcessId: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_PROCESS_ID),
    startPerformanceMeasurement: (label) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, label),
    endPerformanceMeasurement: (measurementId) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, measurementId),
    // 기존 함수들 (호환성 유지)
    startKeystrokeTracking: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_START_KEYSTROKE_TRACKING),
    stopKeystrokeTracking: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_STOP_KEYSTROKE_TRACKING),
    getKeystrokeStats: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_KEYSTROKE_STATS),
    startFileMonitoring: (path) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_START_FILE_MONITORING, path),
    stopFileMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_STOP_FILE_MONITORING),
    getProcessList: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_PROCESS_LIST),
    getNetworkConnections: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_NETWORK_CONNECTIONS),
    hashData: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_HASH_DATA, data),
};
// 시스템 API
const systemAPI = {
    getInfo: () => electron_1.ipcRenderer.invoke('systemGetInfo'),
    startMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SYSTEM_START_MONITORING),
    stopMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SYSTEM_STOP_MONITORING),
    getCurrentMetrics: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_CURRENT_METRICS),
    getMetricsHistory: (minutes) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_METRICS_HISTORY, minutes),
    getAverageMetrics: (minutes) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_AVERAGE_METRICS, minutes),
    getHealth: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_SYSTEM_HEALTH),
    getSystemInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_SYSTEM_INFO),
    getMemoryUsage: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_MEMORY_USAGE),
    optimizeMemory: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.OPTIMIZE_MEMORY),
    cleanup: (force) => electron_1.ipcRenderer.invoke('systemCleanup', force),
    getUsage: () => electron_1.ipcRenderer.invoke('systemGetUsage'),
    getStats: () => electron_1.ipcRenderer.invoke('systemGetStats'),
    getLoopProcesses: () => electron_1.ipcRenderer.invoke('systemGetLoopProcesses'),
    // 새로운 시스템 정보 API
    getCpuInfo: () => electron_1.ipcRenderer.invoke('system:getCpuInfo'),
    getProcesses: () => electron_1.ipcRenderer.invoke('system:getProcesses'),
    gpu: {
        getInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GPU_GET_INFO),
        compute: (data) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GPU_COMPUTE, data),
        enable: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GPU_ENABLE),
        disable: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GPU_DISABLE),
    },
    native: {
        getStatus: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.NATIVE_GET_STATUS),
    }
};
// 메모리 API
const memoryAPI = {
    cleanup: (force) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MEMORY_CLEANUP, force),
    getUsage: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MEMORY_GET_USAGE),
    getStats: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MEMORY_GET_STATS),
    getInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MEMORY_GET_INFO),
    optimize: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MEMORY_OPTIMIZE),
    forceGc: () => electron_1.ipcRenderer.invoke('memoryForceGc'),
    setThreshold: (threshold) => electron_1.ipcRenderer.invoke('memory:setThreshold', threshold),
};
// Setup API
const settingsAPI = {
    // 기본 CRUD
    get: (key) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_GET, key),
    set: (key, value) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_SET, key, value),
    getAll: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_GET_ALL),
    update: (key, value) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_UPDATE, key, value),
    updateMultiple: (settings) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_UPDATE_MULTIPLE, settings),
    reset: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_RESET),
    save: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_SAVE),
    load: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SETTINGS_LOAD),
    // 추가 기능들 (호환성을 위해)
    getSetting: (key) => electron_1.ipcRenderer.invoke('settingsGetSetting', key),
    export: (filePath) => electron_1.ipcRenderer.invoke('settingsExport', filePath),
    import: (filePath) => electron_1.ipcRenderer.invoke('settingsImport', filePath),
    validate: (settings) => electron_1.ipcRenderer.invoke('settingsValidate', settings),
    createBackup: () => electron_1.ipcRenderer.invoke('settingsCreateBackup'),
    getHistory: () => electron_1.ipcRenderer.invoke('settingsGetHistory'),
    clearHistory: () => electron_1.ipcRenderer.invoke('settingsClearHistory'),
};
// 윈도우 API
const windowAPI = {
    create: (options) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.WINDOW_CREATE, options),
    minimize: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MINIMIZE_WINDOW),
    maximize: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.MAXIMIZE_WINDOW),
    toggleMaximize: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.TOGGLE_MAXIMIZE),
    close: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.CLOSE_WINDOW),
    toggleDevTools: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.TOGGLE_DEVTOOLS),
    unmaximize: () => electron_1.ipcRenderer.invoke('window:unmaximize'),
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
    getVersion: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_VERSION),
    getInfo: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_APP_INFO),
    getName: () => electron_1.ipcRenderer.invoke('app:getName'),
    getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
    quit: () => electron_1.ipcRenderer.invoke('app:quit'),
    relaunch: () => electron_1.ipcRenderer.invoke('app:relaunch'),
    restart: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.APP_RESTART),
    isPackaged: () => electron_1.ipcRenderer.invoke('app:isPackaged'),
    getLocale: () => electron_1.ipcRenderer.invoke('app:getLocale'),
    focus: () => electron_1.ipcRenderer.invoke('app:focus'),
};
// Config API - 기존 config 시스템 지원
const configAPI = {
    get: (key) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_CONFIG, key),
    set: (key, value) => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SET_CONFIG, key, value),
    getAll: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.GET_ALL_CONFIG),
    reset: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.RESET_CONFIG)
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
exports.electronAPI = {
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
    // 키보드 모니터링 및 권한 관련 API
    getKeyboardPermissions: () => electron_1.ipcRenderer.invoke('getKeyboardPermissions'),
    toggleKeyboardMonitoring: () => electron_1.ipcRenderer.invoke('toggleKeyboardMonitoring'),
    getTypingStats: () => electron_1.ipcRenderer.invoke('getTypingStats'),
    resetTypingStats: () => electron_1.ipcRenderer.invoke('resetTypingStats'),
    getHangulCompositionState: () => electron_1.ipcRenderer.invoke('getHangulCompositionState'),
    openPermissionsSettings: () => electron_1.ipcRenderer.invoke('openPermissionsSettings'),
    // 모니터링 관련 API (최상위 레벨에서도 접근 가능)
    startMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SYSTEM_START_MONITORING),
    stopMonitoring: () => electron_1.ipcRenderer.invoke(channels_1.CHANNELS.SYSTEM_STOP_MONITORING),
    getTrackingStatus: () => electron_1.ipcRenderer.invoke('get-tracking-status'),
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
    on: (channel, listener) => {
        electron_1.ipcRenderer.on(channel, listener);
    },
    off: (channel, listener) => {
        electron_1.ipcRenderer.off(channel, listener);
    },
    once: (channel, listener) => {
        electron_1.ipcRenderer.once(channel, listener);
    },
    // 유틸리티
    utils: {
        removeAllListeners: (channel) => {
            electron_1.ipcRenderer.removeAllListeners(channel);
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
        log: (message, ...args) => {
            console.log('[Preload] ${message}', ...args);
        }
    }
};
//# sourceMappingURL=api.js.map