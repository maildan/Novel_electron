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
// 네이티브 모듈 로드
let nativeModule = null;
let nativeModuleError = null;
function loadNativeModule() {
    try {
        // 플랫폼별 네이티브 모듈 경로 결정
        const platform = process.platform;
        const arch = process.arch;
        const moduleFileName = `typing-stats-native.${platform}-${arch}.node`;
        // 여러 가능한 경로들 시도
        const possiblePaths = [
            path.join(__dirname, '../../native-modules', moduleFileName),
            path.join(__dirname, '../..', 'native-modules', moduleFileName),
            path.join(process.cwd(), 'native-modules', moduleFileName),
            path.join(process.cwd(), 'dist', 'native-modules', moduleFileName),
        ];
        console.log('[Native IPC] 네이티브 모듈 로드 시도:', {
            platform,
            arch,
            fileName: moduleFileName,
            possiblePaths
        });
        for (const modulePath of possiblePaths) {
            try {
                if (fs.existsSync(modulePath)) {
                    console.log('[Native IPC] 네이티브 모듈 파일 발견:', modulePath);
                    nativeModule = require(modulePath);
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
                error: nativeModuleError || '네이티브 모듈이 로드되지 않았습니다'
            };
        }
        const func = nativeModule[functionName];
        if (typeof func !== 'function') {
            return {
                success: false,
                error: `함수 '${functionName}'을 찾을 수 없습니다`
            };
        }
        const result = func(...args);
        return { success: true, data: result };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Native IPC] ${functionName} 호출 오류:`, errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }
}
// JSON 파싱 헬퍼
function safeJsonParse(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    }
    catch {
        return jsonStr; // JSON이 아니면 원본 문자열 반환
    }
}
/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
function registerNativeIpcHandlers() {
    console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 시작');
    // 네이티브 모듈 로드
    loadNativeModule();
    // 메모리 관련 핸들러
    electron_1.ipcMain.handle('native:getMemoryUsage', () => {
        const result = safeNativeCall('getMemoryUsage');
        return result;
    });
    electron_1.ipcMain.handle('native:startMemoryMonitoring', () => {
        return safeNativeCall('startMemoryMonitoring');
    });
    electron_1.ipcMain.handle('native:getMemoryStats', () => {
        const result = safeNativeCall('getMemoryStats');
        return result;
    });
    electron_1.ipcMain.handle('native:optimizeMemory', () => {
        return safeNativeCall('optimizeMemory');
    });
    electron_1.ipcMain.handle('native:cleanupMemory', () => {
        return safeNativeCall('cleanupMemory');
    });
    electron_1.ipcMain.handle('native:optimizeMemoryAdvanced', () => {
        return safeNativeCall('optimizeMemoryAdvanced');
    });
    electron_1.ipcMain.handle('native:resetMemoryMonitoring', () => {
        return safeNativeCall('resetMemoryMonitoring');
    });
    // GPU 관련 핸들러
    electron_1.ipcMain.handle('native:getGpuInfo', () => {
        const result = safeNativeCall('getGpuInfo');
        return result;
    });
    electron_1.ipcMain.handle('native:getGpuMemoryStats', () => {
        return safeNativeCall('getGpuMemoryStats');
    });
    electron_1.ipcMain.handle('native:runGpuAcceleration', (_, data) => {
        return safeNativeCall('runGpuAcceleration', data);
    });
    electron_1.ipcMain.handle('native:runGpuBenchmark', () => {
        return safeNativeCall('runGpuBenchmark');
    });
    // 시스템 관련 핸들러
    electron_1.ipcMain.handle('native:getSystemInfo', () => {
        const result = safeNativeCall('getSystemInfo');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle('native:isNativeModuleAvailable', () => {
        return safeNativeCall('isNativeModuleAvailable');
    });
    electron_1.ipcMain.handle('native:getNativeModuleInfo', () => {
        const result = safeNativeCall('getNativeModuleInfo');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle('native:getNativeModuleVersion', () => {
        return safeNativeCall('getNativeModuleVersion');
    });
    electron_1.ipcMain.handle('native:initializeNativeModules', () => {
        return safeNativeCall('initializeNativeModules');
    });
    electron_1.ipcMain.handle('native:cleanupNativeModules', () => {
        return safeNativeCall('cleanupNativeModules');
    });
    electron_1.ipcMain.handle('native:getTimestamp', () => {
        return safeNativeCall('getTimestamp');
    });
    // 워커 관련 핸들러
    electron_1.ipcMain.handle('native:addWorkerTask', (_, taskData) => {
        return safeNativeCall('addWorkerTask', taskData);
    });
    electron_1.ipcMain.handle('native:getWorkerTaskStatus', (_, taskId) => {
        const result = safeNativeCall('getWorkerTaskStatus', taskId);
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle('native:getWorkerStats', () => {
        const result = safeNativeCall('getWorkerStats');
        if (result.success && typeof result.data === 'string') {
            result.data = safeJsonParse(result.data);
        }
        return result;
    });
    electron_1.ipcMain.handle('native:getPendingTaskCount', () => {
        return safeNativeCall('getPendingTaskCount');
    });
    electron_1.ipcMain.handle('native:resetWorkerPool', () => {
        return safeNativeCall('resetWorkerPool');
    });
    electron_1.ipcMain.handle('native:executeCpuTask', (_, taskData) => {
        return safeNativeCall('executeCpuTask', taskData);
    });
    electron_1.ipcMain.handle('native:processDataParallel', (_, data) => {
        return safeNativeCall('processDataParallel', data);
    });
    // 유틸리티 관련 핸들러
    electron_1.ipcMain.handle('native:calculateFileHash', (_, filePath) => {
        return safeNativeCall('calculateFileHash', filePath);
    });
    electron_1.ipcMain.handle('native:calculateDirectorySize', (_, dirPath) => {
        return safeNativeCall('calculateDirectorySize', dirPath);
    });
    electron_1.ipcMain.handle('native:calculateStringSimilarity', (_, str1, str2) => {
        return safeNativeCall('calculateStringSimilarity', str1, str2);
    });
    electron_1.ipcMain.handle('native:validateJson', (_, jsonStr) => {
        return safeNativeCall('validateJson', jsonStr);
    });
    electron_1.ipcMain.handle('native:encodeBase64', (_, data) => {
        return safeNativeCall('encodeBase64', data);
    });
    electron_1.ipcMain.handle('native:decodeBase64', (_, encodedData) => {
        return safeNativeCall('decodeBase64', encodedData);
    });
    electron_1.ipcMain.handle('native:generateUuid', () => {
        return safeNativeCall('generateUuid');
    });
    electron_1.ipcMain.handle('native:getTimestampString', () => {
        return safeNativeCall('getTimestampString');
    });
    electron_1.ipcMain.handle('native:getEnvVar', (_, name) => {
        return safeNativeCall('getEnvVar', name);
    });
    electron_1.ipcMain.handle('native:getProcessId', () => {
        return safeNativeCall('getProcessId');
    });
    electron_1.ipcMain.handle('native:startPerformanceMeasurement', (_, label) => {
        return safeNativeCall('startPerformanceMeasurement', label);
    });
    electron_1.ipcMain.handle('native:endPerformanceMeasurement', (_, measurementId) => {
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
        'native:getMemoryUsage',
        'native:startMemoryMonitoring',
        'native:getMemoryStats',
        'native:optimizeMemory',
        'native:cleanupMemory',
        'native:optimizeMemoryAdvanced',
        'native:resetMemoryMonitoring',
        'native:getGpuInfo',
        'native:getGpuMemoryStats',
        'native:runGpuAcceleration',
        'native:runGpuBenchmark',
        'native:getSystemInfo',
        'native:isNativeModuleAvailable',
        'native:getNativeModuleInfo',
        'native:getNativeModuleVersion',
        'native:initializeNativeModules',
        'native:cleanupNativeModules',
        'native:getTimestamp',
        'native:addWorkerTask',
        'native:getWorkerTaskStatus',
        'native:getWorkerStats',
        'native:getPendingTaskCount',
        'native:resetWorkerPool',
        'native:executeCpuTask',
        'native:processDataParallel',
        'native:calculateFileHash',
        'native:calculateDirectorySize',
        'native:calculateStringSimilarity',
        'native:validateJson',
        'native:encodeBase64',
        'native:decodeBase64',
        'native:generateUuid',
        'native:getTimestampString',
        'native:getEnvVar',
        'native:getProcessId',
        'native:startPerformanceMeasurement',
        'native:endPerformanceMeasurement'
    ];
    handlers.forEach(handler => {
        electron_1.ipcMain.removeHandler(handler);
    });
    console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 정리 완료');
}
// 네이티브 모듈 상태 정보 조회 (기존 memory-ipc.ts와 연동)
function getNativeModuleStatus() {
    return {
        loaded: !!nativeModule,
        error: nativeModuleError,
        functions: nativeModule ? Object.keys(nativeModule).length : 0,
        version: nativeModule?.getNativeModuleVersion?.() || null,
        available: nativeModule?.isNativeModuleAvailable?.() || false
    };
}
//# sourceMappingURL=native-ipc.js.map