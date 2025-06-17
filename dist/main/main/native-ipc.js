"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNativeIpcHandlers = registerNativeIpcHandlers;
exports.cleanupNativeIpcHandlers = cleanupNativeIpcHandlers;
exports.getNativeModuleStatus = getNativeModuleStatus;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ipc_1 = require("../types/ipc");
const channels_1 = require("../preload/channels");
// 타입 정보 로깅 함수
function logTypeInformation() {
    console.debug('[네이티브 IPC] 타입 정보 초기화:', {
        NativeIpcTypes: 'namespace imported',
        SystemIpcTypes: 'namespace imported',
        typesRegistered: true
    });
}
// 네이티브 모듈 로드
let nativeModule = null;
let nativeModuleError = null;
async function loadNativeModule() {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        const currentDir = __dirname;
        console.log('[Native IPC] 네이티브 모듈 로딩 시도...');
        console.log('[Native IPC] 현재 디렉토리:', currentDir);
        console.log('[Native IPC] 개발 모드:', isDev);
        const possiblePaths = [
            path.join(currentDir, '../native-modules'),
            path.join(currentDir, '../../../native-modules'),
            path.join(currentDir, '../../native-modules'),
            path.join(process.cwd(), 'native-modules'),
            path.join(process.cwd(), 'src/native-modules')
        ];
        const moduleFileName = process.platform === 'win32' ?
            'native_modules.node' :
            process.platform === 'darwin' ?
                'libnative_modules.dylib' :
                'libnative_modules.so';
        for (const basePath of possiblePaths) {
            const modulePath = path.join(basePath, moduleFileName);
            try {
                console.log(`[Native IPC] 경로에서 로드 시도: ${modulePath}`);
                if (fs.existsSync(modulePath)) {
                    console.log('[Native IPC] 네이티브 모듈 파일 발견:', modulePath);
                    nativeModule = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
                    // 초기화 시도
                    if (nativeModule && typeof nativeModule.initializeNativeModules === 'function') {
                        const initialized = nativeModule.initializeNativeModules();
                        console.log('[Native IPC] 네이티브 모듈 초기화:', initialized);
                    }
                    console.log('[Native IPC] 네이티브 모듈 로드 성공:', {
                        version: nativeModule?.getNativeModuleVersion?.() || 'unknown',
                        functions: Object.keys(nativeModule || {}).length
                    });
                    nativeModuleError = null;
                    return;
                }
            }
            catch (error) {
                console.error(`[Native IPC] 경로에서 로드 실패 ${modulePath}:`, error);
            }
        }
        throw new Error(`네이티브 모듈을 찾을 수 없습니다: ${moduleFileName}`);
    }
    catch (error) {
        nativeModuleError = error instanceof Error ? error.message : String(error);
        console.error('[Native IPC] 네이티브 모듈 로드 실패:', nativeModuleError);
        nativeModule = null;
    }
}
// 안전한 네이티브 함수 호출 래퍼
function safeNativeCall(functionName, ...args) {
    try {
        if (!nativeModule) {
            return {
                success: false,
                error: `네이티브 모듈이 로드되지 않음: ${nativeModuleError}`
            };
        }
        const func = nativeModule[functionName];
        if (typeof func !== 'function') {
            return {
                success: false,
                error: `함수 '${String(functionName)}'를 찾을 수 없음`
            };
        }
        // this 컨텍스트 문제 해결을 위해 직접 호출
        const result = func(...args);
        return { success: true, data: result };
    }
    catch (error) {
        console.error(`[Native IPC] ${String(functionName)} 호출 오류:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
// JSON 파싱 헬퍼
function safeJsonParse(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error('[Native IPC] JSON 파싱 오류:', error);
        return null;
    }
}
/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
function registerNativeIpcHandlers() {
    console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 시작');
    // 타입 정보 로깅
    logTypeInformation();
    // 네이티브 모듈 로드
    loadNativeModule().catch(error => {
        console.error('[Native IPC] 네이티브 모듈 로드 실패:', error);
    });
    // 메모리 관련 핸들러
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_MEMORY_USAGE, async () => {
        try {
            const result = safeNativeCall('getMemoryUsage');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_USAGE_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getMemoryUsage' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_START_MEMORY_MONITORING, async () => {
        try {
            const result = safeNativeCall('startMemoryMonitoring');
            return (0, ipc_1.createSuccessResponse)({
                success: result.success,
                monitoringId: String(result.data || 'default')
            });
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_MONITORING_ERROR', error instanceof Error ? error.message : String(error), { operation: 'startMemoryMonitoring' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_MEMORY_STATS, async () => {
        try {
            const result = safeNativeCall('getMemoryStats');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_STATS_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getMemoryStats' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY, async () => {
        try {
            const result = safeNativeCall('optimizeMemory');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_OPTIMIZE_ERROR', error instanceof Error ? error.message : String(error), { operation: 'optimizeMemory' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_CLEANUP_MEMORY, async () => {
        try {
            const result = safeNativeCall('cleanupMemory');
            return (0, ipc_1.createSuccessResponse)({ freedMemory: result?.freedMemory || 0 });
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_CLEANUP_ERROR', error instanceof Error ? error.message : String(error), { operation: 'cleanupMemory' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED, async () => {
        try {
            const result = safeNativeCall('optimizeMemoryAdvanced');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_OPTIMIZE_ADVANCED_ERROR', error instanceof Error ? error.message : String(error), { operation: 'optimizeMemoryAdvanced' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_RESET_MEMORY_MONITORING, async () => {
        try {
            const result = safeNativeCall('resetMemoryMonitoring');
            return (0, ipc_1.createSuccessResponse)({ success: result.success });
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_MEMORY_RESET_ERROR', error instanceof Error ? error.message : String(error), { operation: 'resetMemoryMonitoring' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    // GPU 관련 핸들러
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_GPU_INFO, async () => {
        try {
            const result = safeNativeCall('getGpuInfo');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_GPU_INFO_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getGpuInfo' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_GPU_MEMORY_STATS, async () => {
        try {
            const result = safeNativeCall('getGpuMemoryStats');
            return (0, ipc_1.createSuccessResponse)(result.data);
        }
        catch (error) {
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_GPU_MEMORY_STATS_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getGpuMemoryStats' });
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_RUN_GPU_ACCELERATION, (_, data) => {
        return safeNativeCall('runGpuAcceleration', data);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_RUN_GPU_BENCHMARK, () => {
        return safeNativeCall('runGpuBenchmark');
    });
    // 시스템 관련 핸들러
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_SYSTEM_INFO, () => {
        const result = safeNativeCall('getSystemInfo');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_IS_AVAILABLE, () => {
        return safeNativeCall('isNativeModuleAvailable');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_MODULE_INFO, () => {
        const result = safeNativeCall('getNativeModuleInfo');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_MODULE_VERSION, () => {
        return safeNativeCall('getNativeModuleVersion');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_INITIALIZE, () => {
        return safeNativeCall('initializeNativeModules');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_CLEANUP, () => {
        return safeNativeCall('cleanupNativeModules');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_TIMESTAMP, () => {
        return safeNativeCall('getTimestamp');
    });
    // 워커 관련 핸들러
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_ADD_WORKER_TASK, (_, taskData) => {
        return safeNativeCall('addWorkerTask', taskData);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, (_, taskId) => {
        const result = safeNativeCall('getWorkerTaskStatus', taskId);
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_WORKER_STATS, () => {
        const result = safeNativeCall('getWorkerStats');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_PENDING_TASK_COUNT, () => {
        return safeNativeCall('getPendingTaskCount');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_RESET_WORKER_POOL, () => {
        return safeNativeCall('resetWorkerPool');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_EXECUTE_CPU_TASK, (_, taskData) => {
        return safeNativeCall('executeCpuTask', taskData);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, (_, data) => {
        return safeNativeCall('processDataParallel', data);
    });
    // 유틸리티 관련 핸들러
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_CALCULATE_FILE_HASH, (_, filePath) => {
        return safeNativeCall('calculateFileHash', filePath);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, (_, dirPath) => {
        return safeNativeCall('calculateDirectorySize', dirPath);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, (_, str1, str2) => {
        return safeNativeCall('calculateStringSimilarity', str1, str2);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_VALIDATE_JSON, (_, jsonStr) => {
        return safeNativeCall('validateJson', jsonStr);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_ENCODE_BASE64, (_, data) => {
        return safeNativeCall('encodeBase64', data);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_DECODE_BASE64, (_, encodedData) => {
        return safeNativeCall('decodeBase64', encodedData);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GENERATE_UUID, () => {
        return safeNativeCall('generateUuid');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_TIMESTAMP_STRING, () => {
        return safeNativeCall('getTimestampString');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_ENV_VAR, (_, name) => {
        return safeNativeCall('getEnvVar', name);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_PROCESS_ID, () => {
        return safeNativeCall('getProcessId');
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, (_, label) => {
        return safeNativeCall('startPerformanceMeasurement', label);
    });
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, (_, measurementId) => {
        return safeNativeCall('endPerformanceMeasurement', measurementId);
    });
    console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 완료:', {
        moduleLoaded: !!nativeModule,
        error: nativeModuleError,
        handlersCount: 27 // 등록된 핸들러 수
    });
}
/**
 * 네이티브 모듈 IPC 핸들러 정리
 */
function cleanupNativeIpcHandlers() {
    // 네이티브 모듈 정리
    if (nativeModule && typeof nativeModule.cleanupNativeModules === 'function') {
        try {
            nativeModule.cleanupNativeModules();
            console.log('[Native IPC] 네이티브 모듈 정리 완료');
        }
        catch (error) {
            console.error('[Native IPC] 네이티브 모듈 정리 오류:', error);
        }
    }
    // IPC 핸들러 제거
    const handlers = [
        channels_1.CHANNELS.NATIVE_GET_MEMORY_USAGE,
        channels_1.CHANNELS.NATIVE_START_MEMORY_MONITORING,
        channels_1.CHANNELS.NATIVE_GET_MEMORY_STATS,
        channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY,
        channels_1.CHANNELS.NATIVE_CLEANUP_MEMORY,
        channels_1.CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED,
        channels_1.CHANNELS.NATIVE_RESET_MEMORY_MONITORING,
        channels_1.CHANNELS.NATIVE_GET_GPU_INFO,
        channels_1.CHANNELS.NATIVE_GET_GPU_MEMORY_STATS,
        channels_1.CHANNELS.NATIVE_RUN_GPU_ACCELERATION,
        channels_1.CHANNELS.NATIVE_RUN_GPU_BENCHMARK,
        channels_1.CHANNELS.NATIVE_GET_SYSTEM_INFO,
        channels_1.CHANNELS.NATIVE_IS_AVAILABLE,
        channels_1.CHANNELS.NATIVE_GET_MODULE_INFO,
        channels_1.CHANNELS.NATIVE_GET_MODULE_VERSION,
        channels_1.CHANNELS.NATIVE_INITIALIZE,
        channels_1.CHANNELS.NATIVE_CLEANUP,
        channels_1.CHANNELS.NATIVE_GET_TIMESTAMP,
        channels_1.CHANNELS.NATIVE_ADD_WORKER_TASK,
        channels_1.CHANNELS.NATIVE_GET_WORKER_TASK_STATUS,
        channels_1.CHANNELS.NATIVE_GET_WORKER_STATS,
        channels_1.CHANNELS.NATIVE_GET_PENDING_TASK_COUNT,
        channels_1.CHANNELS.NATIVE_RESET_WORKER_POOL,
        channels_1.CHANNELS.NATIVE_EXECUTE_CPU_TASK,
        channels_1.CHANNELS.NATIVE_PROCESS_DATA_PARALLEL,
        channels_1.CHANNELS.NATIVE_CALCULATE_FILE_HASH,
        channels_1.CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE,
        channels_1.CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY,
        channels_1.CHANNELS.NATIVE_VALIDATE_JSON,
        channels_1.CHANNELS.NATIVE_ENCODE_BASE64,
        channels_1.CHANNELS.NATIVE_DECODE_BASE64,
        channels_1.CHANNELS.NATIVE_GENERATE_UUID,
        channels_1.CHANNELS.NATIVE_GET_TIMESTAMP_STRING,
        channels_1.CHANNELS.NATIVE_GET_ENV_VAR,
        channels_1.CHANNELS.NATIVE_GET_PROCESS_ID,
        channels_1.CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT,
        channels_1.CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT
    ];
    handlers.forEach(handler => {
        electron_1.ipcMain.removeHandler(handler);
    });
    console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 정리 완료');
}
/**
 * 네이티브 모듈 상태 정보 조회 (기존 memory-ipc.ts와 연동)
 */
function getNativeModuleStatus() {
    return {
        loaded: !!nativeModule,
        error: nativeModuleError,
        functions: nativeModule ? Object.keys(nativeModule).length : 0,
        version: nativeModule?.getNativeModuleVersion?.() || null,
        available: nativeModule?.isNativeModuleAvailable?.() || false
    };
}
// 네이티브 IPC 초기화 시 타입 정보 로깅
logTypeInformation();
//# sourceMappingURL=native-ipc.js.map