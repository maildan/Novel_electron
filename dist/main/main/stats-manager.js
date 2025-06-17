"use strict";
/**
 * 통계 처리 시스템 (TypeScript)
 *
 * 기능:
 * - Worker 스레드 기반 통계 처리
 * - 타이핑 패턴 분석
 * - 메모리 최적화 및 처리 모드 관리
 * - 한글 입력 처리
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsManager = exports.StatsManager = void 0;
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const utils_1 = require("./utils");
const data_sync_1 = __importDefault(require("./data-sync"));
/**
 * 통계 처리 매니저 클래스
 */
class StatsManager {
    constructor() {
        // 워커 관련
        this.statWorker = null;
        this.worker = null; // 호환성을 위한 별칭
        this.workerInitialized = false;
        this.workerMemoryUsage = {
            heapUsed: 0,
            heapTotal: 0,
            heapUsedMB: 0,
            heapTotalMB: 0
        };
        this.lastWorkerCheck = 0;
        this.pendingTasks = [];
        // 데이터 버퍼
        this.buffer = [];
        this.sessionBuffers = new Map();
        // 메모리 및 처리 모드
        this.MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
        this.processingMode = 'normal';
        // 한글 입력 상태
        this.hangulState = {
            isComposing: false,
            lastComposedText: '',
            composingBuffer: ''
        };
        // 앱 상태 참조 (나중에 의존성 주입으로 Setup)
        this.appState = {};
    }
    static getInstance() {
        if (!StatsManager.instance) {
            StatsManager.instance = new StatsManager();
        }
        return StatsManager.instance;
    }
    /**
   * 통계 시스템 초기화
   */
    async initialize() {
        try {
            (0, utils_1.debugLog)('통계 처리 시스템 초기화 시작');
            // 워커 초기화
            await this.initializeWorker();
            (0, utils_1.debugLog)('통계 처리 시스템 초기화 Completed');
            return true;
        }
        catch (error) {
            console.error('통계 처리 시스템 초기화 Error:', error);
            return false;
        }
    }
    /**
   * 워커 초기화
   */
    async initializeWorker() {
        try {
            if (this.statWorker) {
                return;
            }
            // 워커 스크립트 경로 (컴파일된 위치)
            const workerPath = path_1.default.join(__dirname, 'workers/stats-worker.js');
            this.statWorker = new worker_threads_1.Worker(workerPath);
            this.worker = this.statWorker; // 호환성을 위한 별칭
            // 워커 메시지 핸들러 Setup
            this.statWorker.on('message', this.handleWorkerMessage.bind(this));
            // 워커 Error 핸들러
            this.statWorker.on('error', (error) => {
                console.error('워커 Error:', error);
                this.handleWorkerError(error);
            });
            // 워커 종료 핸들러
            this.statWorker.on('exit', (code) => {
                (0, utils_1.debugLog)(`워커 종료됨, 코드: ${code}`);
                this.statWorker = null;
                this.workerInitialized = false;
                // 코드에 따른 재시작 로직
                if (code !== 0) {
                    (0, utils_1.debugLog)(`워커가 비정상 종료됨(${code}), 재시작 시도 예정`);
                }
            });
            // 워커 초기화 메시지 전송
            this.statWorker.postMessage({
                type: 'initialize',
                action: 'initialize',
                id: `init-${Date.now()}`,
                config: {
                    memoryThreshold: this.MEMORY_THRESHOLD,
                    processingMode: this.processingMode
                }
            });
            (0, utils_1.debugLog)('통계 워커 초기화 Started');
        }
        catch (error) {
            console.error('워커 초기화 Error:', error);
            this.workerInitialized = false;
            this.statWorker = null;
            // 워커 없이도 기본 기능 동작하도록 폴백 모드 활성화
            (0, utils_1.debugLog)('워커 초기화 Failed: 폴백 모드로 전환');
            this.switchToFallbackMode();
        }
    }
    /**
   * 워커 메시지 처리
   */
    handleWorkerMessage(message) {
        switch (message.type) {
            case 'pattern-analyzed':
                if (message.result) {
                    this.updateTypingPattern(message.result);
                }
                if (message.memoryInfo) {
                    this.updateWorkerMemoryInfo(message.memoryInfo);
                }
                break;
            case 'initialized':
                this.workerInitialized = true;
                (0, utils_1.debugLog)('워커 초기화 Completed:', message.timestamp);
                this.processPendingTasks();
                break;
            case 'memory-optimized':
                (0, utils_1.debugLog)('워커 메모리 최적화 Completed:', {
                    before: `${Math.round((message.before || 0) / (1024 * 1024))}MB`,
                    after: `${Math.round((message.after || 0) / (1024 * 1024))}MB`,
                    reduction: `${Math.round((message.reduction || 0) / (1024 * 1024))}MB`,
                    emergency: message.emergency
                });
                break;
            case 'memory-warning':
                (0, utils_1.debugLog)('워커 메모리 Warning:', message.message, `${Math.round((message.memoryInfo?.heapUsedMB || 0))}MB`);
                // 메모리 사용량이 임계치를 초과하면 처리 모드 변경
                if (message.memoryInfo && message.memoryInfo.heapUsed > this.MEMORY_THRESHOLD) {
                    this.switchToLowMemoryMode();
                }
                break;
            case 'error':
                console.error('워커 Error:', message.error);
                if (message.memoryInfo) {
                    this.updateWorkerMemoryInfo(message.memoryInfo);
                }
                break;
            case 'worker-ready':
                this.workerInitialized = true;
                (0, utils_1.debugLog)('워커 준비 Completed');
                break;
            default:
                (0, utils_1.debugLog)('알 수 없는 워커 메시지:', message);
        }
    }
    /**
   * 키 입력 처리
   */
    async processKeyInput(data) {
        try {
            // 한글 입력 처리
            if (this.isHangulInput(data.keyChar)) {
                this.processHangulInput(data);
            }
            // 워커에 데이터 전송
            if (this.statWorker && this.workerInitialized) {
                this.statWorker.postMessage({
                    action: 'process-typing',
                    data: data
                });
            }
            else {
                // 워커가 준비되지 않은 경우 대기열에 추가
                this.pendingTasks.push({
                    action: 'process-typing',
                    data: data
                });
            }
            // 데이터 동기화 큐에 추가
            data_sync_1.default.addToQueue({
                userId: 'current-user', // 실제 구현에서는 사용자 ID 사용
                sessionId: `session-${Date.now()}`, // 실제 구현에서는 세션 ID 관리
                keyChar: data.keyChar,
                timestamp: new Date(data.timestamp),
                browserName: data.browserName,
                activeWindow: data.activeWindow
            });
        }
        catch (error) {
            console.error('키 입력 처리 Error:', error);
        }
    }
    /**
   * 한글 입력 처리
   */
    isHangulInput(char) {
        // 한글 유니코드 범위 확인
        const charCode = char.charCodeAt(0);
        return (charCode >= 0xAC00 && charCode <= 0xD7AF) || // 완성형 한글
            (charCode >= 0x1100 && charCode <= 0x11FF) || // 초성
            (charCode >= 0x3130 && charCode <= 0x318F); // 자모
    }
    processHangulInput(data) {
        // 한글 조합 상태 처리 로직
        // 실제 구현에서는 더 복잡한 한글 처리 로직 필요
        if (data.keyChar.length === 1) {
            this.hangulState.composingBuffer += data.keyChar;
        }
    }
    /**
   * 타이핑 패턴 업데이트
   */
    updateTypingPattern(pattern) {
        // 패턴 데이터를 앱 상태에 저장
        (0, utils_1.debugLog)('타이핑 패턴 업데이트:', {
            averageWPM: Math.round(pattern.averageWPM),
            peakWPM: Math.round(pattern.peakWPM),
            accuracy: Math.round(pattern.accuracy * 100) + '%'
        });
    }
    /**
   * 워커 메모리 정보 업데이트
   */
    updateWorkerMemoryInfo(memoryInfo) {
        this.workerMemoryUsage = memoryInfo;
        this.lastWorkerCheck = Date.now();
    }
    /**
   * 대기 중인 작업 처리
   */
    processPendingTasks() {
        if (!this.statWorker || !this.workerInitialized) {
            return;
        }
        (0, utils_1.debugLog)('대기 중인 작업 ${this.pendingTasks.length}개 처리 시작');
        while (this.pendingTasks.length > 0) {
            const task = this.pendingTasks.shift();
            this.statWorker.postMessage(task);
        }
    }
    /**
   * 저메모리 모드로 전환
   */
    switchToLowMemoryMode() {
        try {
            // 이미 저메모리 모드인 경우 또는 사용자가 처리 모드를 수동으로 지정한 경우 중단
            if (this.processingMode !== 'normal' ||
                (this.appState.settings?.processingMode && this.appState.settings.processingMode !== 'auto')) {
                return;
            }
            (0, utils_1.debugLog)('메모리 사용량 임계치 초과: 저메모리 모드로 전환');
            // GPU 지원 여부 확인 및 가능한 경우 GPU 모드로 전환
            const gpuEnabled = this.appState.settings?.useHardwareAcceleration === true;
            if (gpuEnabled) {
                this.processingMode = 'gpu-intensive';
                (0, utils_1.debugLog)('GPU 가속 처리 모드 활성화 (성능 향상)');
                // GPU 메모리 최적화
                if (global.gc) {
                    global.gc();
                    (0, utils_1.debugLog)('GPU 모드 전환 전 메모리 Cleanup 수행');
                }
            }
            else {
                this.processingMode = 'cpu-intensive';
                (0, utils_1.debugLog)('CPU 집약적 처리 모드 활성화 (메모리 최적화)');
            }
            // 워커에 모드 변경 알림
            if (this.statWorker && this.workerInitialized) {
                this.statWorker.postMessage({
                    action: 'change-processing-mode',
                    mode: this.processingMode
                });
            }
        }
        catch (error) {
            console.error('저메모리 모드 전환 Error:', error);
        }
    }
    /**
   * 폴백 모드로 전환
   */
    switchToFallbackMode() {
        (0, utils_1.debugLog)('워커 없는 폴백 모드로 전환');
        // 워커 없이 기본적인 통계 처리만 수행
    }
    /**
     * 워커 Error 처리
     */
    handleWorkerError(error) {
        console.error('워커 실행 Error:', error);
        this.workerInitialized = false;
        // 워커 재시작 시도
        setTimeout(() => {
            (0, utils_1.debugLog)('워커 재시작 시도');
            this.initializeWorker().catch(err => {
                console.error('워커 재시작 Failed:', err);
            });
        }, 5000);
    }
    /**
   * 통계 상태 조회
   */
    getStatsStatus() {
        return {
            workerInitialized: this.workerInitialized,
            processingMode: this.processingMode,
            workerMemoryUsage: this.workerMemoryUsage,
            pendingTasksCount: this.pendingTasks.length,
            hangulState: this.hangulState
        };
    }
    /**
   * 통계 데이터 가져오기
   */
    async getStats(options) {
        try {
            // options를 사용하여 통계 필터링 및 설정
            const includeDetail = options?.detail === true;
            const timeRange = options?.timeRange || 'all';
            const sessionId = options?.sessionId;
            // 통계 데이터 수집 로직
            const baseData = {
                totalKeystrokes: this.buffer.length,
                sessionsCount: this.sessionBuffers.size,
                lastUpdated: new Date()
            };
            if (includeDetail) {
                baseData.detailedInfo = {
                    bufferSize: this.buffer.length,
                    activeWorkers: this.workerInitialized ? 1 : 0,
                    timeRange: timeRange
                };
            }
            if (sessionId && this.sessionBuffers.has(sessionId)) {
                const sessionData = this.sessionBuffers.get(sessionId);
                baseData.sessionData = sessionData;
            }
            return {
                success: true,
                data: baseData
            };
        }
        catch (error) {
            console.error('통계 가져오기 Error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
   * 타이핑 패턴 분석
   */
    async analyzeTypingPattern(data) {
        try {
            // data를 사용하여 타이핑 패턴 분석
            const keystrokes = data.keystrokes || 0;
            const timeMs = data.timeMs || 1;
            const errors = data.errors || 0;
            const corrections = data.corrections || 0;
            // 타이핑 패턴 분석 로직
            const wpm = Math.round((keystrokes / 5) / (timeMs / 60000));
            const accuracy = Math.round(((keystrokes - errors) / keystrokes) * 100) || 0;
            return {
                success: true,
                pattern: {
                    wordsPerMinute: Math.max(0, wpm),
                    accuracy: Math.max(0, Math.min(100, accuracy)),
                    totalKeystrokes: keystrokes,
                    timeSpent: timeMs,
                    errorRate: keystrokes > 0 ? (errors / keystrokes) * 100 : 0,
                    correctionRate: keystrokes > 0 ? (corrections / keystrokes) * 100 : 0,
                    commonMistakes: [] // TODO: 실제 오타 패턴 분석
                }
            };
        }
        catch (error) {
            console.error('타이핑 패턴 분석 Error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
   * Setup 업데이트
   */
    async updateSettings(settings) {
        try {
            // settings를 사용하여 실제 설정 업데이트
            const bufferSize = settings.bufferSize;
            const autoSaveInterval = settings.autoSaveInterval;
            const enableWorker = settings.enableWorker;
            // 버퍼 크기 업데이트
            if (bufferSize && bufferSize > 0) {
                // TODO: 실제 버퍼 크기 설정
                (0, utils_1.debugLog)(`버퍼 크기 업데이트: ${bufferSize}`);
            }
            // 자동 저장 간격 업데이트
            if (autoSaveInterval && autoSaveInterval > 0) {
                // TODO: 실제 자동 저장 간격 설정
                (0, utils_1.debugLog)(`자동 저장 간격 업데이트: ${autoSaveInterval}ms`);
            }
            // 워커 활성화/비활성화
            if (typeof enableWorker === 'boolean') {
                if (enableWorker && !this.workerInitialized) {
                    await this.initializeWorker();
                }
                else if (!enableWorker && this.workerInitialized) {
                    this.statWorker?.terminate();
                    this.workerInitialized = false;
                }
            }
            return {
                success: true,
                updatedSettings: Object.keys(settings).length,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('Setup 업데이트 Error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
   * 메모리 최적화
   */
    async optimizeMemory() {
        try {
            // 메모리 최적화 로직
            this.buffer = [];
            this.sessionBuffers.clear();
            return { success: true };
        }
        catch (error) {
            console.error('메모리 최적화 Error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
   * 모듈 재시작
   */
    async restart() {
        this.cleanup();
        await this.initialize();
    }
    /**
   * 초기화 상태 확인
   */
    isInitialized() {
        return this.statWorker !== null;
    }
    /**
   * Cleanup 작업
   */
    async cleanup() {
        try {
            (0, utils_1.debugLog)('통계 처리 시스템 Cleanup 시작');
            if (this.statWorker) {
                await this.statWorker.terminate();
                this.statWorker = null;
            }
            this.workerInitialized = false;
            this.pendingTasks = [];
            (0, utils_1.debugLog)('통계 처리 시스템 Cleanup Completed');
        }
        catch (error) {
            console.error('통계 처리 시스템 Cleanup Error:', error);
        }
    }
}
exports.StatsManager = StatsManager;
// 단일 인스턴스 export
exports.statsManager = StatsManager.getInstance();
exports.default = exports.statsManager;
//# sourceMappingURL=stats-manager.js.map