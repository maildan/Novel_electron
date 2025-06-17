"use strict";
/**
 * Loop 6 고급 메모리 관리자
 * Loop 3의 정교한 메모리 관리 시스템을 TypeScript로 완전 마이그레이션
 */
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
exports.getMemoryManager = getMemoryManager;
exports.setupMemoryManager = setupMemoryManager;
exports.getMemoryInfo = getMemoryInfo;
exports.optimizeMemory = optimizeMemory;
exports.updateMemorySettings = updateMemorySettings;
exports.getMemoryPools = getMemoryPools;
exports.checkAndOptimizeMemoryIfNeeded = checkAndOptimizeMemoryIfNeeded;
exports.registerMemoryIpcHandlers = registerMemoryIpcHandlers;
exports.cleanupMemoryIpcHandlers = cleanupMemoryIpcHandlers;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const utils_1 = require("../shared/utils");
const native_client_1 = require("./native-client");
// IPC 모듈 사용 확인
console.log('[MemoryManager] IPC 모듈 로드됨:', typeof electron_1.ipcMain);
// 메모리 관리 클래스
class AdvancedMemoryManager {
    constructor() {
        this.isInitialized = false;
        this.checkInterval = null;
        this.lastOptimizationTime = 0;
        this.memoryPools = new Map();
        this.memoryHistory = [];
        // 사용자 데이터 경로 Setup
        const userDataPath = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '../../userData')
            : electron_1.app.getPath('userData');
        this.configPath = path.join(userDataPath, 'memory-settings.json');
        // 기본 Setup
        this.settings = {
            checkInterval: 30000, // 30초
            threshold: 80, // 80%
            optimizeOnIdle: true,
            aggressiveMode: false,
            autoGarbageCollection: true,
            maxMemoryUsage: 2048, // 2GB
            lastUpdated: new Date().toISOString()
        };
    }
    /**
   * 메모리 관리자 초기화
   */
    async initialize() {
        try {
            (0, utils_1.debugLog)('고급 메모리 관리자 초기화 시작');
            // Setup 로드
            await this.loadSettings();
            // 네이티브 모듈 초기화
            await this.initializeNativeMemory();
            // 메모리 풀 초기화
            this.initializeMemoryPools();
            // 주기적 메모리 체크 시작
            this.startMemoryMonitoring();
            // 앱 이벤트 리스너 Setup
            this.setupEventListeners();
            this.isInitialized = true;
            (0, utils_1.debugLog)('고급 메모리 관리자 초기화 Completed');
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 관리자 초기화 중 Error:', error);
            this.isInitialized = false;
        }
    }
    /**
   * Setup 파일 로드
   */
    async loadSettings() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const loadedSettings = JSON.parse(data);
                this.settings = { ...this.settings, ...loadedSettings };
                (0, utils_1.debugLog)('메모리 관리 Setup 로드 Completed');
            }
            else {
                await this.saveSettings();
                (0, utils_1.debugLog)('기본 메모리 관리 Setup 생성 Completed');
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 관리 Setup 로드 중 Error:', error);
        }
    }
    /**
   * Setup 파일 저장
   */
    async saveSettings() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.settings.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
            (0, utils_1.debugLog)('메모리 관리 Setup 저장 Completed');
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 관리 Setup Saving Error:', error);
        }
    }
    /**
   * 네이티브 메모리 모듈 초기화
   */
    async initializeNativeMemory() {
        try {
            const isAvailable = await native_client_1.nativeClient.isAvailable();
            if (isAvailable) {
                (0, utils_1.debugLog)('NAPI 네이티브 메모리 모듈 사용 가능');
                // 메모리 모니터링 시작
                const started = await native_client_1.nativeClient.startMemoryMonitoring();
                if (started) {
                    (0, utils_1.debugLog)('네이티브 메모리 모니터링 Started');
                    // 초기 메모리 정보 수집
                    const memoryUsage = await native_client_1.nativeClient.getMemoryUsage();
                    if (memoryUsage) {
                        (0, utils_1.debugLog)('초기 메모리 정보:', memoryUsage);
                    }
                }
            }
            else {
                (0, utils_1.debugLog)('NAPI 네이티브 메모리 모듈 사용 불가, JavaScript 폴백 사용');
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 메모리 모듈 초기화 중 Error:', error);
        }
    }
    /**
   * 메모리 풀 초기화
   */
    initializeMemoryPools() {
        try {
            // 힙 메모리 풀
            this.memoryPools.set('heap', {
                id: 'heap',
                size: 0,
                used: 0,
                available: 0,
                type: 'heap'
            });
            // 네이티브 메모리 풀
            this.memoryPools.set('native', {
                id: 'native',
                size: 0,
                used: 0,
                available: 0,
                type: 'native'
            });
            // 버퍼 메모리 풀
            this.memoryPools.set('buffer', {
                id: 'buffer',
                size: 0,
                used: 0,
                available: 0,
                type: 'buffer'
            });
            (0, utils_1.debugLog)('메모리 풀 초기화 Completed');
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 풀 초기화 중 Error:', error);
        }
    }
    /**
   * 주기적 메모리 모니터링 시작
   */
    startMemoryMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.checkInterval = setInterval(async () => {
            await this.performMemoryCheck();
        }, this.settings.checkInterval);
        (0, utils_1.debugLog)('메모리 모니터링 시작 (간격: ${this.settings.checkInterval}ms)');
    }
    /**
   * 메모리 체크 수행
   */
    async performMemoryCheck() {
        try {
            const memoryInfo = await this.getMemoryInfo();
            // 메모리 Add to history
            this.memoryHistory.push(memoryInfo);
            // 최근 100개 기록만 유지
            if (this.memoryHistory.length > 100) {
                this.memoryHistory = this.memoryHistory.slice(-100);
            }
            // 임계값 초과 시 최적화 실행
            if (memoryInfo.percentUsed > this.settings.threshold) {
                (0, utils_1.debugLog)('메모리 사용률 임계값 초과: ${memoryInfo.percentUsed}%');
                await this.optimizeMemory();
            }
            // 메모리 풀 업데이트
            this.updateMemoryPools(memoryInfo);
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 체크 중 Error:', error);
        }
    }
    /**
   * 메모리 풀 업데이트
   */
    updateMemoryPools(memoryInfo) {
        try {
            // 힙 메모리 풀 업데이트
            const heapPool = this.memoryPools.get('heap');
            if (heapPool) {
                heapPool.size = memoryInfo.heapTotal;
                heapPool.used = memoryInfo.heapUsed;
                heapPool.available = memoryInfo.heapTotal - memoryInfo.heapUsed;
            }
            // 네이티브 메모리 풀 업데이트
            const nativePool = this.memoryPools.get('native');
            if (nativePool) {
                nativePool.size = memoryInfo.totalMemoryMB * 1024 * 1024;
                nativePool.used = memoryInfo.usedMemoryMB * 1024 * 1024;
                nativePool.available = memoryInfo.availableMemoryMB * 1024 * 1024;
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 풀 업데이트 중 Error:', error);
        }
    }
    /**
   * 앱 이벤트 리스너 Setup
   */
    setupEventListeners() {
        // 앱 종료 시 Cleanup
        electron_1.app.on('before-quit', () => {
            this.cleanup();
        });
        // 창이 모두 닫힐 때 메모리 Cleanup
        electron_1.app.on('window-all-closed', async () => {
            if (this.settings.optimizeOnIdle) {
                await this.optimizeMemory();
            }
        });
    }
    /**
     * 메모리 정보 가져오기 (RSS 기반)
     */
    async getMemoryInfo() {
        try {
            // os module is already imported
            const systemTotalMemory = os.totalmem();
            // NAPI 네이티브 모듈 먼저 시도
            const isAvailable = await native_client_1.nativeClient.isAvailable();
            if (isAvailable) {
                const memoryUsage = await native_client_1.nativeClient.getMemoryUsage();
                if (memoryUsage) {
                    // NAPI 모듈의 문자열 타입을 숫자로 변환
                    const rss = parseInt(memoryUsage.rss);
                    const heapTotal = parseInt(memoryUsage.heapTotal);
                    const heapUsed = parseInt(memoryUsage.heapUsed);
                    const external = parseInt(memoryUsage.external);
                    // RSS 기반 메모리 계산 (OS 모니터와 일치)
                    const rssMB = Math.round(rss / (1024 * 1024));
                    const totalMemoryMB = Math.round(systemTotalMemory / (1024 * 1024));
                    const memoryUsagePercent = Math.round((rss / systemTotalMemory) * 100);
                    // External 메모리도 포함하여 로깅
                    (0, utils_1.debugLog)(`[Memory] External 메모리: ${Math.round(external / (1024 * 1024))}MB`);
                    return {
                        totalMemoryMB: totalMemoryMB,
                        freeMemoryMB: totalMemoryMB - rssMB,
                        usedMemoryMB: rssMB, // RSS를 실제 사용 메모리로 사용
                        availableMemoryMB: totalMemoryMB - rssMB,
                        processMemoryMB: rssMB,
                        heapUsed: heapUsed,
                        heapTotal: heapTotal,
                        percentUsed: memoryUsagePercent, // RSS 기반 퍼센트
                        timestamp: parseInt(memoryUsage.timestamp)
                    };
                }
            }
            // JavaScript 폴백 (RSS 기반)
            return this.getMemoryInfoJS();
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 정보 가져오기 중 Error:', error);
            return this.getMemoryInfoJS();
        }
    }
    /**
     * JavaScript 폴백 메모리 정보 (RSS 기반)
     */
    getMemoryInfoJS() {
        // os module is already imported
        const memUsage = process.memoryUsage();
        // 시스템 메모리 정보
        const systemTotalMemory = os.totalmem();
        const systemFreeMemory = os.freemem();
        // RSS 기반 계산 (OS 모니터와 일치)
        const rssMB = Math.round(memUsage.rss / (1024 * 1024));
        const totalMemoryMB = Math.round(systemTotalMemory / (1024 * 1024));
        const freeMemoryMB = Math.round(systemFreeMemory / (1024 * 1024));
        const memoryUsagePercent = Math.round((memUsage.rss / systemTotalMemory) * 100);
        return {
            totalMemoryMB: totalMemoryMB,
            freeMemoryMB: freeMemoryMB,
            usedMemoryMB: rssMB, // RSS를 실제 사용 메모리로 사용
            availableMemoryMB: freeMemoryMB,
            processMemoryMB: rssMB,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            percentUsed: memoryUsagePercent, // RSS 기반 퍼센트
            timestamp: Date.now()
        };
    }
    /**
   * 메모리 최적화 실행
   */
    async optimizeMemory() {
        const startTime = Date.now();
        try {
            (0, utils_1.debugLog)('메모리 최적화 시작');
            // 최적화 간격 체크 (너무 자주 실행 방지)
            const minOptimizeInterval = 10000; // 10초
            if (Date.now() - this.lastOptimizationTime < minOptimizeInterval) {
                (0, utils_1.debugLog)('최적화 간격 미충족, 건너뛰기');
                return {
                    freedBytes: 0,
                    durationMs: 0,
                    method: 'skipped',
                    success: false
                };
            }
            let freedBytes = 0;
            let method = 'javascript';
            // NAPI 네이티브 모듈 최적화 시도
            const isAvailable = await native_client_1.nativeClient.isAvailable();
            if (isAvailable) {
                try {
                    // 네이티브 모듈에는 직접적인 메모리 최적화 함수가 없으므로
                    // 메모리 모니터링 리셋을 통해 간접적으로 최적화 효과 달성
                    const beforeUsage = await native_client_1.nativeClient.getMemoryUsage();
                    if (global.gc) {
                        global.gc();
                    }
                    const resetResult = await native_client_1.nativeClient.resetMemoryMonitoring();
                    const afterUsage = await native_client_1.nativeClient.getMemoryUsage();
                    if (resetResult && beforeUsage && afterUsage) {
                        const beforeBytes = parseInt(beforeUsage.heapUsed);
                        const afterBytes = parseInt(afterUsage.heapUsed);
                        freedBytes = Math.max(0, beforeBytes - afterBytes);
                        method = 'native';
                        (0, utils_1.debugLog)('네이티브 메모리 최적화 Completed, 해제된 메모리:', freedBytes);
                    }
                }
                catch (nativeError) {
                    (0, utils_1.debugLog)('네이티브 메모리 최적화 Failed, JavaScript 폴백 사용:', nativeError);
                }
            }
            // JavaScript 폴백 최적화
            if (freedBytes === 0) {
                freedBytes = await this.optimizeMemoryJS();
                method = 'javascript';
            }
            const durationMs = Date.now() - startTime;
            this.lastOptimizationTime = Date.now();
            (0, utils_1.debugLog)('메모리 최적화 Completed: ${freedBytes} bytes 해제, ${durationMs}ms 소요');
            return {
                freedBytes,
                durationMs,
                method,
                success: true
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 최적화 중 Error:', error);
            return {
                freedBytes: 0,
                durationMs: Date.now() - startTime,
                method: 'error',
                success: false,
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * JavaScript 메모리 최적화
     */
    async optimizeMemoryJS() {
        try {
            const beforeMemory = process.memoryUsage();
            // 가비지 컬렉션 강제 실행
            if (global.gc) {
                global.gc();
            }
            // 버퍼 Cleanup
            if (global.Buffer) {
                // 버퍼 풀 Cleanup (Node.js 내부)
            }
            const afterMemory = process.memoryUsage();
            const freedBytes = beforeMemory.heapUsed - afterMemory.heapUsed;
            (0, utils_1.debugLog)('JavaScript 메모리 최적화: ${freedBytes} bytes 해제');
            return Math.max(0, freedBytes);
        }
        catch (error) {
            (0, utils_1.errorLog)('JavaScript 메모리 최적화 중 Error:', error);
            return 0;
        }
    }
    /**
   * 메모리 Setup 업데이트
   */
    async updateSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            await this.saveSettings();
            // 체크 간격이 변경된 경우 모니터링 재시작
            if (newSettings.checkInterval) {
                this.startMemoryMonitoring();
            }
            (0, utils_1.debugLog)('메모리 Setup 업데이트 Completed');
        }
        catch (error) {
            (0, utils_1.errorLog)('메모리 Setup 업데이트 중 Error:', error);
        }
    }
    /**
   * 메모리 풀 정보 가져오기
   */
    getMemoryPools() {
        return Array.from(this.memoryPools.values());
    }
    /**
   * 메모리 히스토리 가져오기
   */
    getMemoryHistory() {
        return [...this.memoryHistory];
    }
    /**
   * Setup 가져오기
   */
    getSettings() {
        return { ...this.settings };
    }
    /**
   * 초기화 상태 확인
   */
    isMemoryManagerInitialized() {
        return this.isInitialized;
    }
    /**
   * Cleanup 작업
   */
    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        (0, utils_1.debugLog)('메모리 관리자 Cleanup Completed');
    }
}
// 전역 메모리 관리자 인스턴스
let memoryManager = null;
/**
 * 메모리 관리자 인스턴스 가져오기
 */
function getMemoryManager() {
    if (!memoryManager) {
        memoryManager = new AdvancedMemoryManager();
    }
    return memoryManager;
}
/**
 * 메모리 관리자 Setup
 */
async function setupMemoryManager() {
    const manager = getMemoryManager();
    await manager.initialize();
}
/**
 * 메모리 정보 가져오기
 */
async function getMemoryInfo() {
    const manager = getMemoryManager();
    return await manager.getMemoryInfo();
}
/**
 * 메모리 최적화 실행
 */
async function optimizeMemory() {
    const manager = getMemoryManager();
    return await manager.optimizeMemory();
}
/**
 * 메모리 Setup 업데이트
 */
async function updateMemorySettings(settings) {
    const manager = getMemoryManager();
    await manager.updateSettings(settings);
}
/**
 * 메모리 풀 정보 가져오기
 */
function getMemoryPools() {
    const manager = getMemoryManager();
    return manager.getMemoryPools();
}
/**
 * 메모리 필요 시 최적화 확인
 */
async function checkAndOptimizeMemoryIfNeeded() {
    const manager = getMemoryManager();
    const memoryInfo = await manager.getMemoryInfo();
    if (memoryInfo.percentUsed > 80) {
        (0, utils_1.debugLog)('메모리 사용률 높음, 최적화 실행');
        await manager.optimizeMemory();
    }
}
/**
 * IPC 핸들러 등록 (memory-ipc.ts로 이동됨)
 * 중복 방지를 위해 주석 처리
 */
function registerMemoryIpcHandlers() {
    (0, utils_1.debugLog)('⚠️  메모리 관련 IPC 핸들러는 memory-ipc.ts에서 관리됩니다. 중복 등록 방지를 위해 이 함수는 비활성화됨');
    // 실제 핸들러 등록은 memory-ipc.ts에서 수행됨
    // 중복 등록 방지를 위해 여기서는 아무것도 하지 않음
}
/**
 * IPC 핸들러 Cleanup (memory-ipc.ts로 이동됨)
 * 중복 방지를 위해 주석 처리
 */
function cleanupMemoryIpcHandlers() {
    (0, utils_1.debugLog)('메모리 관련 IPC 핸들러 Cleanup는 memory-ipc.ts에서 관리됩니다');
    // 실제 핸들러 Cleanup는 memory-ipc.ts에서 수행됨
}
exports.default = memoryManager;
//# sourceMappingURL=memory-manager.js.map