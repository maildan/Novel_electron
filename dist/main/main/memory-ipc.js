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
/**
 * MemoryStats를 ReactMemoryData로 변환
 */
function convertMemoryStatsToReactFormat(stats) {
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
    electron_1.ipcMain.handle('memory:getInfo', async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            // MemoryManager에서 직접 ReactMemoryData 형태로 데이터 가져오기
            const reactData = await memoryManager.getMemoryUsage();
            console.log('[Memory IPC] 메모리 정보 조회 성공:', {
                main: `${reactData.main.used}MB / ${reactData.main.total}MB (${reactData.main.percentage.toFixed(1)}%)`,
                renderer: `${reactData.renderer.used}MB / ${reactData.renderer.total}MB (${reactData.renderer.percentage.toFixed(1)}%)`,
                system: `${reactData.system.used}MB / ${reactData.system.total}MB (${reactData.system.percentage.toFixed(1)}%)`
            });
            return { success: true, data: reactData };
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 정보 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // 메모리 최적화 실행
    electron_1.ipcMain.handle('memory:optimize', async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            await memoryManager.performCleanup(true);
            console.log('[Memory IPC] 메모리 최적화 실행됨');
            return { success: true, message: '메모리 최적화 완료' };
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 최적화 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // 메모리 정리 (가비지 컬렉션)
    electron_1.ipcMain.handle('memory:cleanup', async () => {
        try {
            const memoryManager = memory_1.MemoryManager.getInstance();
            await memoryManager.performCleanup(true);
            // 강제 가비지 컬렉션
            if (global.gc) {
                global.gc();
                console.log('[Memory IPC] 강제 가비지 컬렉션 실행됨');
            }
            return { success: true, message: '메모리 정리 완료' };
        }
        catch (error) {
            console.error('[Memory IPC] 메모리 정리 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // 네이티브 모듈 상태 조회
    electron_1.ipcMain.handle('system:native:getStatus', () => {
        try {
            const status = native_client_1.nativeClient.getStatus();
            const available = native_client_1.nativeClient.isAvailable();
            // 새로운 네이티브 모듈 상태도 가져오기
            const nativeModuleStatus = (0, native_ipc_1.getNativeModuleStatus)();
            console.log('[Memory IPC] 네이티브 모듈 상태 확인:', {
                isLoaded: status.isLoaded,
                isAvailable: status.isAvailable,
                available: available,
                version: status.version,
                error: status.error ? status.error.message : null,
                nativeModule: nativeModuleStatus
            });
            // 네이티브 모듈이 실제로 로드되었다면 해당 정보 사용
            const effectiveStatus = nativeModuleStatus.loaded ? nativeModuleStatus : status;
            const effectiveAvailable = nativeModuleStatus.loaded ? nativeModuleStatus.available : available;
            // 더 풍부한 시스템 정보 수집
            const cpuInfo = os.cpus();
            const loadAvg = os.loadavg();
            const uptime = os.uptime();
            const freeMemory = os.freemem();
            const totalMemory = os.totalmem();
            // React 컴포넌트가 기대하는 형식으로 데이터 구성
            const nativeModuleInfo = {
                uiohook: {
                    available: effectiveAvailable,
                    version: effectiveStatus.version || nativeModuleStatus.version || '1.0.0',
                    initialized: effectiveAvailable,
                    loadError: status.error ? status.error.message : nativeModuleStatus.error,
                    fallbackMode: !effectiveAvailable,
                    features: {
                        keyboardHook: effectiveAvailable,
                        mouseHook: effectiveAvailable,
                        globalEvents: effectiveAvailable
                    }
                },
                system: {
                    platform: os.platform(),
                    arch: os.arch(),
                    node: process.version,
                    electron: process.versions.electron || 'N/A',
                    chrome: process.versions.chrome || 'N/A',
                    hostname: os.hostname(),
                    uptime: uptime,
                    cpuCount: cpuInfo.length,
                    cpuModel: cpuInfo[0]?.model || 'Unknown',
                    loadAverage: {
                        '1min': loadAvg[0],
                        '5min': loadAvg[1],
                        '15min': loadAvg[2]
                    },
                    memory: {
                        total: totalMemory,
                        free: freeMemory,
                        used: totalMemory - freeMemory,
                        percentage: ((totalMemory - freeMemory) / totalMemory) * 100
                    }
                },
                permissions: {
                    accessibility: available,
                    input: available,
                    screenRecording: null, // macOS에서만 관련됨
                    microphone: null,
                    camera: null
                },
                performance: {
                    processUptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
                    pid: process.pid,
                    ppid: process.ppid || null
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    isDev: process.env.NODE_ENV === 'development',
                    userAgent: process.env.npm_config_user_agent || 'Unknown',
                    workingDirectory: process.cwd()
                }
            };
            return {
                success: true,
                data: nativeModuleInfo,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('[Memory IPC] 네이티브 모듈 상태 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now()
            };
        }
    });
    console.log('[Memory IPC] 메모리 관련 IPC 핸들러 등록 완료');
}
/**
 * 메모리 관련 IPC 핸들러 정리
 */
function cleanupMemoryIpcHandlers() {
    electron_1.ipcMain.removeHandler('memory:getInfo');
    electron_1.ipcMain.removeHandler('memory:optimize');
    electron_1.ipcMain.removeHandler('memory:cleanup');
    electron_1.ipcMain.removeHandler('system:native:getStatus');
    console.log('[Memory IPC] 메모리 관련 IPC 핸들러 정리 완료');
}
//# sourceMappingURL=memory-ipc.js.map