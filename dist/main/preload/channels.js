"use strict";
/**
 * IPC 채널 정의
 *
 * 모든 IPC 채널들을 중앙 집중식으로 관리합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNELS = void 0;
exports.CHANNELS = {
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
    START_MONITORING: 'start-monitoring',
    STOP_MONITORING: 'stop-monitoring',
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
    // 타이핑 추적
    TRACKING_START_MONITORING: 'tracking:start-monitoring',
    TRACKING_STOP_MONITORING: 'tracking:stop-monitoring',
    TRACKING_GET_STATUS: 'tracking:get-status',
    TRACKING_SAVE_STATS: 'tracking:save-stats',
    TRACKING_RESET: 'tracking:reset',
    TRACKING_PROCESS_KEY: 'tracking:process-key',
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
    GET_VERSION: 'app:getVersion',
    // 앱 제어
    APP_RESTART: 'app:restart',
    APP_QUIT: 'app:quit'
};
//# sourceMappingURL=channels.js.map