/**
 * Loop 6 고급 메모리 관리자
 * Loop 3의 정교한 메모리 관리 시스템을 TypeScript로 완전 마이그레이션
 */
interface MemorySettings {
    checkInterval: number;
    threshold: number;
    optimizeOnIdle: boolean;
    aggressiveMode: boolean;
    autoGarbageCollection: boolean;
    maxMemoryUsage: number;
    lastUpdated: string;
}
interface MemoryInfo {
    totalMemoryMB: number;
    freeMemoryMB: number;
    usedMemoryMB: number;
    availableMemoryMB: number;
    processMemoryMB: number;
    heapUsed: number;
    heapTotal: number;
    percentUsed: number;
    timestamp: number;
}
interface MemoryOptimizationResult {
    freedBytes: number;
    durationMs: number;
    method: string;
    success: boolean;
    details?: any;
}
interface MemoryPool {
    id: string;
    size: number;
    used: number;
    available: number;
    type: 'heap' | 'native' | 'buffer';
}
declare class AdvancedMemoryManager {
    private settings;
    private configPath;
    private isInitialized;
    private checkInterval;
    private lastOptimizationTime;
    private memoryPools;
    private memoryHistory;
    constructor();
    /**
     * 메모리 관리자 초기화
     */
    initialize(): Promise<void>;
    /**
     * 설정 파일 로드
     */
    private loadSettings;
    /**
     * 설정 파일 저장
     */
    private saveSettings;
    /**
     * 네이티브 메모리 모듈 초기화
     */
    private initializeNativeMemory;
    /**
     * 메모리 풀 초기화
     */
    private initializeMemoryPools;
    /**
     * 주기적 메모리 모니터링 시작
     */
    private startMemoryMonitoring;
    /**
     * 메모리 체크 수행
     */
    private performMemoryCheck;
    /**
     * 메모리 풀 업데이트
     */
    private updateMemoryPools;
    /**
     * 앱 이벤트 리스너 설정
     */
    private setupEventListeners;
    /**
     * 메모리 정보 가져오기 (RSS 기반)
     */
    getMemoryInfo(): Promise<MemoryInfo>;
    /**
     * JavaScript 폴백 메모리 정보 (RSS 기반)
     */
    private getMemoryInfoJS;
    /**
     * 메모리 최적화 실행
     */
    optimizeMemory(): Promise<MemoryOptimizationResult>;
    /**
     * JavaScript 메모리 최적화
     */
    private optimizeMemoryJS;
    /**
     * 메모리 설정 업데이트
     */
    updateSettings(newSettings: Partial<MemorySettings>): Promise<void>;
    /**
     * 메모리 풀 정보 가져오기
     */
    getMemoryPools(): MemoryPool[];
    /**
     * 메모리 히스토리 가져오기
     */
    getMemoryHistory(): MemoryInfo[];
    /**
     * 설정 가져오기
     */
    getSettings(): MemorySettings;
    /**
     * 초기화 상태 확인
     */
    isMemoryManagerInitialized(): boolean;
    /**
     * 정리 작업
     */
    cleanup(): void;
}
declare let memoryManager: AdvancedMemoryManager | null;
/**
 * 메모리 관리자 인스턴스 가져오기
 */
export declare function getMemoryManager(): AdvancedMemoryManager;
/**
 * 메모리 관리자 설정
 */
export declare function setupMemoryManager(): Promise<void>;
/**
 * 메모리 정보 가져오기
 */
export declare function getMemoryInfo(): Promise<MemoryInfo>;
/**
 * 메모리 최적화 실행
 */
export declare function optimizeMemory(): Promise<MemoryOptimizationResult>;
/**
 * 메모리 설정 업데이트
 */
export declare function updateMemorySettings(settings: Partial<MemorySettings>): Promise<void>;
/**
 * 메모리 풀 정보 가져오기
 */
export declare function getMemoryPools(): MemoryPool[];
/**
 * 메모리 필요 시 최적화 확인
 */
export declare function checkAndOptimizeMemoryIfNeeded(): Promise<void>;
/**
 * IPC 핸들러 등록
 */
export declare function registerMemoryIpcHandlers(): void;
/**
 * IPC 핸들러 정리
 */
export declare function cleanupMemoryIpcHandlers(): void;
export default memoryManager;
//# sourceMappingURL=memory-manager.d.ts.map