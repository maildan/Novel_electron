/**
 * 통계 처리 시스템 (TypeScript)
 *
 * 기능:
 * - Worker 스레드 기반 통계 처리
 * - 타이핑 패턴 분석
 * - 메모리 최적화 및 처리 모드 관리
 * - 한글 입력 처리
 */
interface TypingData {
    keyChar: string;
    timestamp: number;
    browserName?: string;
    activeWindow?: string;
    isSpecialKey?: boolean;
    keyCode?: number;
}
interface WorkerMemoryInfo {
    heapUsed: number;
    heapTotal: number;
    heapUsedMB: number;
    heapTotalMB: number;
}
interface HangulState {
    isComposing: boolean;
    lastComposedText: string;
    composingBuffer: string;
}
type ProcessingMode = 'normal' | 'cpu-intensive' | 'gpu-intensive';
/**
 * 통계 처리 매니저 클래스
 */
export declare class StatsManager {
    private static instance;
    private statWorker;
    private worker;
    private workerInitialized;
    private workerMemoryUsage;
    private lastWorkerCheck;
    private pendingTasks;
    private buffer;
    private sessionBuffers;
    private readonly MEMORY_THRESHOLD;
    private processingMode;
    private hangulState;
    private appState;
    private constructor();
    static getInstance(): StatsManager;
    /**
   * 통계 시스템 초기화
   */
    initialize(): Promise<boolean>;
    /**
   * 워커 초기화
   */
    private initializeWorker;
    /**
   * 워커 메시지 처리
   */
    private handleWorkerMessage;
    /**
   * 키 입력 처리
   */
    processKeyInput(data: TypingData): Promise<void>;
    /**
   * 한글 입력 처리
   */
    private isHangulInput;
    private processHangulInput;
    /**
   * 타이핑 패턴 업데이트
   */
    private updateTypingPattern;
    /**
   * 워커 메모리 정보 업데이트
   */
    private updateWorkerMemoryInfo;
    /**
   * 대기 중인 작업 처리
   */
    private processPendingTasks;
    /**
   * 저메모리 모드로 전환
   */
    private switchToLowMemoryMode;
    /**
   * 폴백 모드로 전환
   */
    private switchToFallbackMode;
    /**
     * 워커 Error 처리
     */
    private handleWorkerError;
    /**
   * 통계 상태 조회
   */
    getStatsStatus(): {
        workerInitialized: boolean;
        processingMode: ProcessingMode;
        workerMemoryUsage: WorkerMemoryInfo;
        pendingTasksCount: number;
        hangulState: HangulState;
    };
    /**
   * 통계 데이터 가져오기
   */
    getStats(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
   * 타이핑 패턴 분석
   */
    analyzeTypingPattern(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
   * Setup 업데이트
   */
    updateSettings(settings: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
   * 메모리 최적화
   */
    optimizeMemory(): Promise<Record<string, unknown>>;
    /**
   * 모듈 재시작
   */
    restart(): Promise<void>;
    /**
   * 초기화 상태 확인
   */
    isInitialized(): boolean;
    /**
   * Cleanup 작업
   */
    cleanup(): Promise<void>;
}
export declare const statsManager: StatsManager;
export default statsManager;
//# sourceMappingURL=stats-manager.d.ts.map