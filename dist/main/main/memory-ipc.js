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
exports.registerMemoryIpcHandlers = registerMemoryIpcHandlers;
exports.cleanupMemoryIpcHandlers = cleanupMemoryIpcHandlers;
const electron_1 = require("electron");
const memory_1 = require("./memory");
const native_client_1 = require("./native-client");
const native_ipc_1 = require("./native-ipc");
const os = __importStar(require("os"));
const ipc_1 = require("../types/ipc");
const channels_1 = require("../preload/channels");
/**
 * MemoryStats를 ReactMemoryData로 변환
 */
function convertMemoryStatsToReactFormat(stats) {
    console.log('[메모리 IPC] 메모리 통계를 React 포맷으로 변환:', stats);
    // 시스템 메모리 (실제 물리 메모리)
    const systemTotal = os.totalmem();
    const systemFree = os.freemem();
    const systemUsed = systemTotal - systemFree;
    const systemPercentage = (systemUsed / systemTotal) * 100;
    // 프로세스 메모리 (RSS 기준)
    const mainProcess = stats.main;
    const rendererProcesses = Array.isArray(stats.renderer) ? stats.renderer : [stats.renderer];
    // 메인 프로세스 메모리 (RSS 기준으로 백분율 계산)
    const mainRss = mainProcess.rss || 0;
    const mainHeapTotal = mainProcess.heapTotal || 0;
    const mainHeapUsed = mainProcess.heapUsed || 0;
    const mainPercentage = mainRss > 0 ? (mainHeapUsed / mainRss) * 100 : 0;
    // ReactMemoryInfo 타입 검증
    const memoryInfo = {
        total: mainHeapTotal,
        used: mainHeapUsed,
        free: mainHeapTotal - mainHeapUsed,
        percentage: mainPercentage
    };
    console.log('[Memory] React 메모리 정보:', memoryInfo);
    // 렌더러 프로세스 메모리 집계
    let rendererRss = 0;
    let rendererHeapTotal = 0;
    let rendererHeapUsed = 0;
    rendererProcesses.forEach((renderer) => {
        rendererRss += renderer.rss || 0;
        rendererHeapTotal += renderer.heapTotal || 0;
        rendererHeapUsed += renderer.heapUsed || 0;
    });
    const rendererPercentage = rendererRss > 0 ? (rendererHeapUsed / rendererRss) * 100 : 0;
    // 렌더러 힙 메모리 사용률 로깅
    console.log('[메모리 IPC] 렌더러 힙 메모리 정보:', {
        heapTotal: Math.round(rendererHeapTotal / (1024 * 1024)),
        heapUsed: Math.round(rendererHeapUsed / (1024 * 1024)),
        heapFree: Math.round((rendererHeapTotal - rendererHeapUsed) / (1024 * 1024))
    });
    // GPU 메모리 (사용 가능한 경우)
    let gpu = undefined;
    if (stats.gpu) {
        gpu = {
            total: parseFloat(stats.gpu.memoryTotal || '0'),
            used: parseFloat(stats.gpu.memoryUsed || '0'),
            free: parseFloat(stats.gpu.memoryFree || '0'),
            percentage: parseFloat(stats.gpu.utilization || '0')
        };
    }
    return {
        main: {
            total: Math.round(mainRss / (1024 * 1024)), // RSS를 total로 사용
            used: Math.round(mainHeapUsed / (1024 * 1024)),
            free: Math.round((mainRss - mainHeapUsed) / (1024 * 1024)),
            percentage: Math.round(mainPercentage * 10) / 10 // RSS 대비 heap 사용률
        },
        renderer: {
            total: Math.round(rendererRss / (1024 * 1024)), // RSS를 total로 사용
            used: Math.round(rendererHeapUsed / (1024 * 1024)),
            free: Math.round((rendererRss - rendererHeapUsed) / (1024 * 1024)),
            percentage: Math.round(rendererPercentage * 10) / 10 // RSS 대비 heap 사용률
        },
        system: {
            total: Math.round(systemTotal / (1024 * 1024)),
            used: Math.round(systemUsed / (1024 * 1024)),
            free: Math.round(systemFree / (1024 * 1024)),
            percentage: Math.round(systemPercentage * 10) / 10
        },
        // 애플리케이션 총 사용량 계산
        application: {
            total: Math.round((mainRss + rendererRss) / (1024 * 1024)),
            used: Math.round((mainHeapUsed + rendererHeapUsed) / (1024 * 1024)),
            free: Math.round(((mainRss + rendererRss) - (mainHeapUsed + rendererHeapUsed)) / (1024 * 1024)),
            percentage: Math.round(((mainHeapUsed + rendererHeapUsed) / (mainRss + rendererRss)) * 100 * 10) / 10
        },
        gpu,
        timestamp: Date.now()
    };
}
/**
 * 메모리 관련 IPC 핸들러 등록
 */
function registerMemoryIpcHandlers() {
    console.log('[Memory IPC] 메모리 관련 IPC 핸들러 등록 시작');
    // 메모리 정보 조회 (React 컴포넌트용)
    electron_1.ipcMain.handle(channels_1.CHANNELS.MEMORY_GET_INFO, async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            // MemoryManager에서 직접 ReactMemoryData 형태로 데이터 가져오기
            const reactData = await memoryManager.getMemoryUsage();
            // 추가 통계 변환을 위해 convertMemoryStatsToReactFormat 사용
            const processStats = process.memoryUsage();
            const enhancedData = convertMemoryStatsToReactFormat(processStats);
            console.log('[Memory IPC] 향상된 메모리 데이터:', enhancedData);
            console.log('[Memory IPC] 메모리 정보 조회 Success:', {
                main: `${reactData.main.used}MB / ${reactData.main.total}MB (${reactData.main.percentage.toFixed(1)}%)`,
                renderer: `${reactData.renderer.used}MB / ${reactData.renderer.total}MB (${reactData.renderer.percentage.toFixed(1)}%)`,
                system: `${reactData.system.used}MB / ${reactData.system.total}MB (${reactData.system.percentage.toFixed(1)}%)`
            });
            return (0, ipc_1.createSuccessResponse)(reactData);
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 정보 조회 Error:', error);
            const ipcError = (0, ipc_1.createIpcError)('MEMORY_INFO_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getMemoryInfo' }, error instanceof Error ? error.stack : undefined);
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    // 메모리 정보 조회 (호환성을 위한 'memory:getInfo' 핸들러는 제거됨 - CHANNELS.MEMORY_GET_INFO만 사용)
    // 메모리 최적화 실행
    electron_1.ipcMain.handle(channels_1.CHANNELS.MEMORY_OPTIMIZE, async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            // 최적화 전 메모리 사용량 측정
            const beforeStats = await memoryManager.getMemoryUsage();
            const beforeUsage = beforeStats.main.used + beforeStats.renderer.used;
            const startTime = Date.now();
            await memoryManager.performCleanup(true);
            const optimizationTime = Date.now() - startTime;
            // 최적화 후 메모리 사용량 측정
            const afterStats = await memoryManager.getMemoryUsage();
            const afterUsage = afterStats.main.used + afterStats.renderer.used;
            const freedMemory = beforeUsage - afterUsage;
            const result = {
                beforeUsage,
                afterUsage,
                freedMemory,
                optimizationTime,
                success: true
            };
            console.log('[Memory IPC] 메모리 최적화 완료:', result);
            return (0, ipc_1.createSuccessResponse)(result);
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 최적화 Error:', error);
            const ipcError = (0, ipc_1.createIpcError)('MEMORY_OPTIMIZE_ERROR', error instanceof Error ? error.message : String(error), { operation: 'optimizeMemory' }, error instanceof Error ? error.stack : undefined);
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    // 메모리 Cleanup (가비지 컬렉션)
    electron_1.ipcMain.handle(channels_1.CHANNELS.MEMORY_CLEANUP, async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            // cleanup 전 메모리 사용량
            const beforeStats = await memoryManager.getMemoryUsage();
            const beforeUsage = beforeStats.main.used + beforeStats.renderer.used;
            await memoryManager.performCleanup(true);
            // 강제 가비지 컬렉션
            if (global.gc) {
                global.gc();
                console.log('[Memory IPC] 강제 가비지 컬렉션 실행됨');
            }
            // cleanup 후 메모리 사용량 측정
            const afterStats = await memoryManager.getMemoryUsage();
            const afterUsage = afterStats.main.used + afterStats.renderer.used;
            const freedMemory = beforeUsage - afterUsage;
            return (0, ipc_1.createSuccessResponse)({ freedMemory });
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 Cleanup Error:', error);
            const ipcError = (0, ipc_1.createIpcError)('MEMORY_CLEANUP_ERROR', error instanceof Error ? error.message : String(error), { operation: 'memoryCleanup' }, error instanceof Error ? error.stack : undefined);
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    // 네이티브 모듈 상태 조회
    electron_1.ipcMain.handle(channels_1.CHANNELS.NATIVE_GET_STATUS, async () => {
        try {
            const status = native_client_1.nativeClient.getStatus();
            const available = native_client_1.nativeClient.isAvailable();
            const nativeModuleStatus = (0, native_ipc_1.getNativeModuleStatus)();
            console.log('[Memory IPC] 네이티브 모듈 상태 확인:', {
                isLoaded: status.isLoaded,
                isAvailable: status.isAvailable,
                available: available,
                version: status.version,
                error: status.error ? status.error.message : null,
                nativeModule: nativeModuleStatus
            });
            // NativeModuleStatus 형식으로 변환
            const moduleStatus = {
                available: nativeModuleStatus.loaded ? nativeModuleStatus.available : available,
                fallbackMode: !available,
                version: nativeModuleStatus.version || status.version || '1.0.0',
                features: {
                    memory: true,
                    gpu: available,
                    worker: available,
                    filesystem: true,
                    network: true
                },
                timestamp: Date.now(),
                loadError: status.error ? status.error.message : nativeModuleStatus.error || undefined
            };
            return (0, ipc_1.createSuccessResponse)(moduleStatus);
        }
        catch (error) {
            console.error('[Memory IPC] 네이티브 모듈 상태 조회 Error:', error);
            const ipcError = (0, ipc_1.createIpcError)('NATIVE_STATUS_ERROR', error instanceof Error ? error.message : String(error), { operation: 'getNativeStatus' }, error instanceof Error ? error.stack : undefined);
            return (0, ipc_1.createErrorResponse)(ipcError);
        }
    });
    console.log('[Memory IPC] 메모리 관련 IPC 핸들러 등록 Completed');
}
/**
 * 메모리 관련 IPC 핸들러 Cleanup
 */
function cleanupMemoryIpcHandlers() {
    electron_1.ipcMain.removeHandler(channels_1.CHANNELS.MEMORY_GET_INFO);
    electron_1.ipcMain.removeHandler(channels_1.CHANNELS.MEMORY_OPTIMIZE);
    electron_1.ipcMain.removeHandler(channels_1.CHANNELS.MEMORY_CLEANUP);
    electron_1.ipcMain.removeHandler(channels_1.CHANNELS.NATIVE_GET_STATUS);
    console.log('[Memory IPC] 메모리 관련 IPC 핸들러 Cleanup Completed');
}
// 모듈 로드 시 자동으로 핸들러 등록
try {
    registerMemoryIpcHandlers();
}
catch (error) {
    console.error('[Memory IPC] 핸들러 등록 중 오류:', error);
}
//# sourceMappingURL=memory-ipc.js.map