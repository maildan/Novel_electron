"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// IPC 채널 정의
const CHANNELS = {
    // 데이터베이스
    SAVE_TYPING_SESSION: 'db:save-typing-session',
    GET_RECENT_SESSIONS: 'db:get-recent-sessions',
    GET_STATISTICS: 'db:get-statistics',
    DB_CLEANUP: 'db:cleanup',
    DB_HEALTH_CHECK: 'db:health-check',
    GET_KEYSTROKE_DATA: 'db:get-keystroke-data',
    GET_SESSIONS: 'db:get-sessions',
    EXPORT_DATA: 'db:export-data',
    IMPORT_DATA: 'db:import-data',
    CLEAR_DATA: 'db:clear-data',
    // 시스템 모니터링
    START_MONITORING: 'system:start-monitoring',
    STOP_MONITORING: 'system:stop-monitoring',
    GET_CURRENT_METRICS: 'system:get-current-metrics',
    GET_METRICS_HISTORY: 'system:get-metrics-history',
    GET_AVERAGE_METRICS: 'system:get-average-metrics',
    GET_SYSTEM_HEALTH: 'system:get-health',
    GET_SYSTEM_INFO: 'system:get-system-info',
    GET_MEMORY_USAGE: 'system:get-memory-usage',
    OPTIMIZE_MEMORY: 'system:optimize-memory',
    // 메모리 관리
    MEMORY_CLEANUP: 'memory:cleanup',
    MEMORY_GET_USAGE: 'memory:get-usage',
    MEMORY_GET_STATS: 'memory:get-stats',
    MEMORY_GET_INFO: 'memory:get-info',
    MEMORY_OPTIMIZE: 'memory:optimize',
    // GPU 관리
    GPU_GET_INFO: 'gpu:get-info',
    GPU_COMPUTE: 'gpu:compute',
    GPU_ENABLE: 'gpu:enable',
    GPU_DISABLE: 'gpu:disable',
    // 네이티브 모듈
    NATIVE_GET_STATUS: 'system:native:get-status',
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
    NATIVE_STOP_FILE_MONITORING: 'native:stop-file-monitoring',
    NATIVE_GET_PROCESS_LIST: 'native:get-process-list',
    NATIVE_GET_NETWORK_CONNECTIONS: 'native:get-network-connections',
    NATIVE_HASH_DATA: 'native:hash-data',
    // 윈도우 관리
    WINDOW_CREATE: 'window:create',
    MINIMIZE_WINDOW: 'window:minimize',
    MAXIMIZE_WINDOW: 'window:maximize',
    TOGGLE_MAXIMIZE: 'window:toggle-maximize',
    CLOSE_WINDOW: 'window:close',
    TOGGLE_DEVTOOLS: 'window:toggle-devtools',
    // 설정 관리
    GET_CONFIG: 'config:get',
    SET_CONFIG: 'config:set',
    GET_ALL_CONFIG: 'config:get-all',
    RESET_CONFIG: 'config:reset',
    // 앱 정보
    GET_APP_INFO: 'app:get-info',
    GET_VERSION: 'app:get-version'
};
// 안전한 IPC API 정의
const electronAPI = {
    // 데이터베이스 API
    database: {
        saveTypingSession: (data) => electron_1.ipcRenderer.invoke(CHANNELS.SAVE_TYPING_SESSION, data),
        getRecentSessions: (limit) => electron_1.ipcRenderer.invoke(CHANNELS.GET_RECENT_SESSIONS, limit),
        getStatistics: (days) => electron_1.ipcRenderer.invoke(CHANNELS.GET_STATISTICS, days),
        cleanup: () => electron_1.ipcRenderer.invoke(CHANNELS.DB_CLEANUP),
        healthCheck: () => electron_1.ipcRenderer.invoke(CHANNELS.DB_HEALTH_CHECK),
        getKeystrokeData: (params) => electron_1.ipcRenderer.invoke(CHANNELS.GET_KEYSTROKE_DATA, params),
        getSessions: (params) => electron_1.ipcRenderer.invoke(CHANNELS.GET_SESSIONS, params),
        exportData: (params) => electron_1.ipcRenderer.invoke(CHANNELS.EXPORT_DATA, params),
        importData: (params) => electron_1.ipcRenderer.invoke(CHANNELS.IMPORT_DATA, params),
        clearData: (params) => electron_1.ipcRenderer.invoke(CHANNELS.CLEAR_DATA, params)
    },
    // 시스템 모니터링 API
    system: {
        startMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.START_MONITORING),
        stopMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.STOP_MONITORING),
        getCurrentMetrics: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_CURRENT_METRICS),
        getMetricsHistory: (minutes) => electron_1.ipcRenderer.invoke(CHANNELS.GET_METRICS_HISTORY, minutes),
        getAverageMetrics: (minutes) => electron_1.ipcRenderer.invoke(CHANNELS.GET_AVERAGE_METRICS, minutes),
        getHealth: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_SYSTEM_HEALTH),
        getSystemInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_SYSTEM_INFO),
        getMemoryUsage: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_MEMORY_USAGE),
        optimizeMemory: () => electron_1.ipcRenderer.invoke(CHANNELS.OPTIMIZE_MEMORY),
        // 새로운 시스템 정보 API
        getInfo: () => electron_1.ipcRenderer.invoke('system:getInfo'),
        getCpuInfo: () => electron_1.ipcRenderer.invoke('system:getCpuInfo'),
        getProcesses: () => electron_1.ipcRenderer.invoke('system:getProcesses'),
        getLoopProcesses: () => electron_1.ipcRenderer.invoke('system:getLoopProcesses'),
        native: {
            getStatus: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_STATUS),
            // 메모리 관련
            getMemoryUsage: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_USAGE),
            startMemoryMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_MEMORY_MONITORING),
            getMemoryStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_STATS),
            optimizeMemory: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY),
            cleanupMemory: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP_MEMORY),
            optimizeMemoryAdvanced: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
            resetMemoryMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
            // GPU 관련
            getGpuInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_INFO),
            getGpuMemoryStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
            runGpuAcceleration: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
            runGpuBenchmark: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
            // 시스템 관련
            getSystemInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_SYSTEM_INFO),
            isNativeModuleAvailable: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_IS_AVAILABLE),
            getNativeModuleInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_INFO),
            getNativeModuleVersion: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_VERSION),
            initializeNativeModules: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_INITIALIZE),
            cleanupNativeModules: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP),
            getTimestamp: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP),
            // 워커 관련
            addWorkerTask: (taskData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
            getWorkerTaskStatus: (taskId) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
            getWorkerStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_STATS),
            getPendingTaskCount: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
            resetWorkerPool: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RESET_WORKER_POOL),
            executeCpuTask: (taskData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
            processDataParallel: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
            // 유틸리티 관련
            calculateFileHash: (filePath) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_FILE_HASH, filePath),
            calculateDirectorySize: (dirPath) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, dirPath),
            calculateStringSimilarity: (str1, str2) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, str1, str2),
            validateJson: (jsonStr) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_VALIDATE_JSON, jsonStr),
            encodeBase64: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_ENCODE_BASE64, data),
            decodeBase64: (encodedData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_DECODE_BASE64, encodedData),
            generateUuid: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GENERATE_UUID),
            getTimestampString: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP_STRING),
            getEnvVar: (name) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_ENV_VAR, name),
            getProcessId: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_ID),
            startPerformanceMeasurement: (label) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, label),
            endPerformanceMeasurement: (measurementId) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, measurementId),
            // 기존 함수들 (호환성 유지)
            startKeystrokeTracking: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_KEYSTROKE_TRACKING),
            stopKeystrokeTracking: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_STOP_KEYSTROKE_TRACKING),
            getKeystrokeStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_KEYSTROKE_STATS),
            startFileMonitoring: (path) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_FILE_MONITORING, path),
            stopFileMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_STOP_FILE_MONITORING),
            getProcessList: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_LIST),
            getNetworkConnections: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_NETWORK_CONNECTIONS),
            hashData: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_HASH_DATA, data),
        },
        gpu: {
            getInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.GPU_GET_INFO),
            compute: (data) => electron_1.ipcRenderer.invoke(CHANNELS.GPU_COMPUTE, data),
            enable: () => electron_1.ipcRenderer.invoke(CHANNELS.GPU_ENABLE),
            disable: () => electron_1.ipcRenderer.invoke(CHANNELS.GPU_DISABLE),
        }
    },
    // 메모리 관리 API
    memory: {
        cleanup: (force) => electron_1.ipcRenderer.invoke(CHANNELS.MEMORY_CLEANUP, force),
        getUsage: () => electron_1.ipcRenderer.invoke(CHANNELS.MEMORY_GET_USAGE),
        getStats: () => electron_1.ipcRenderer.invoke(CHANNELS.MEMORY_GET_STATS),
        getInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.MEMORY_GET_INFO),
        optimize: () => electron_1.ipcRenderer.invoke(CHANNELS.MEMORY_OPTIMIZE)
    },
    // 네이티브 모듈 API (최상위)
    native: {
        // 메모리 관련
        getMemoryUsage: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_USAGE),
        startMemoryMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_MEMORY_MONITORING),
        getMemoryStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MEMORY_STATS),
        optimizeMemory: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY),
        cleanupMemory: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP_MEMORY),
        optimizeMemoryAdvanced: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED),
        resetMemoryMonitoring: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RESET_MEMORY_MONITORING),
        // GPU 관련
        getGpuInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_INFO),
        getGpuMemoryStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS),
        runGpuAcceleration: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, data),
        runGpuBenchmark: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RUN_GPU_BENCHMARK),
        // 시스템 관련
        getSystemInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_SYSTEM_INFO),
        isNativeModuleAvailable: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_IS_AVAILABLE),
        getNativeModuleInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_INFO),
        getNativeModuleVersion: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_MODULE_VERSION),
        initializeNativeModules: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_INITIALIZE),
        cleanupNativeModules: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CLEANUP),
        getTimestamp: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP),
        // 워커 관련
        addWorkerTask: (taskData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_ADD_WORKER_TASK, taskData),
        getWorkerTaskStatus: (taskId) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, taskId),
        getWorkerStats: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_WORKER_STATS),
        getPendingTaskCount: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT),
        resetWorkerPool: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_RESET_WORKER_POOL),
        executeCpuTask: (taskData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_EXECUTE_CPU_TASK, taskData),
        processDataParallel: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, data),
        // 유틸리티 관련
        calculateFileHash: (filePath) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_FILE_HASH, filePath),
        calculateDirectorySize: (dirPath) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, dirPath),
        calculateStringSimilarity: (str1, str2) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, str1, str2),
        validateJson: (jsonStr) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_VALIDATE_JSON, jsonStr),
        encodeBase64: (data) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_ENCODE_BASE64, data),
        decodeBase64: (encodedData) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_DECODE_BASE64, encodedData),
        generateUuid: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GENERATE_UUID),
        getTimestampString: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_TIMESTAMP_STRING),
        getEnvVar: (name) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_ENV_VAR, name),
        getProcessId: () => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_GET_PROCESS_ID),
        startPerformanceMeasurement: (label) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, label),
        endPerformanceMeasurement: (measurementId) => electron_1.ipcRenderer.invoke(CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, measurementId),
    },
    // 윈도우 관리 API
    window: {
        create: (options) => electron_1.ipcRenderer.invoke(CHANNELS.WINDOW_CREATE, options),
        minimize: () => electron_1.ipcRenderer.invoke(CHANNELS.MINIMIZE_WINDOW),
        maximize: () => electron_1.ipcRenderer.invoke(CHANNELS.MAXIMIZE_WINDOW),
        toggleMaximize: () => electron_1.ipcRenderer.invoke(CHANNELS.TOGGLE_MAXIMIZE),
        close: () => electron_1.ipcRenderer.invoke(CHANNELS.CLOSE_WINDOW),
        toggleDevTools: () => electron_1.ipcRenderer.invoke(CHANNELS.TOGGLE_DEVTOOLS)
    },
    // 설정 관리 API
    config: {
        get: (key) => electron_1.ipcRenderer.invoke(CHANNELS.GET_CONFIG, key),
        set: (key, value) => electron_1.ipcRenderer.invoke(CHANNELS.SET_CONFIG, key, value),
        getAll: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_ALL_CONFIG),
        reset: () => electron_1.ipcRenderer.invoke(CHANNELS.RESET_CONFIG)
    },
    // 앱 정보 API
    app: {
        getInfo: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_APP_INFO),
        getVersion: () => electron_1.ipcRenderer.invoke(CHANNELS.GET_VERSION)
    },
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
    }
};
// Context Bridge를 통해 API 노출
try {
    electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('✅ Preload script: electronAPI 노출 성공');
    // CSS 스타일 주입 함수 추가
    electron_1.contextBridge.exposeInMainWorld('injectStyles', () => {
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
        const loadStylesheet = (href) => {
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
}
catch (error) {
    console.error('❌ Preload script: electronAPI 노출 실패:', error);
}
// 개발 모드에서 디버깅 정보
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 개발 모드: preload script 로드됨');
    console.log('📡 사용 가능한 채널:', Object.values(CHANNELS));
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
//# sourceMappingURL=index.js.map