/**
 * 데이터 동기화 모듈 (TypeScript)
 *
 * 기능:
 * - MongoDB와 Supabase 간의 데이터 동기화
 * - 타이핑 통계 실시간 전송 (3초마다)
 * - 주기적 데이터 백업 (1주일마다)
 * - 장애 복구 메커니즘
 */
interface TypingLogData {
    _id?: string;
    idempotencyKey?: string;
    userId: string;
    sessionId: string;
    keyChar: string;
    timestamp: Date;
    browserName?: string;
    activeWindow?: string;
    queuedAt?: Date;
}
interface SyncStatus {
    lastMongoSync: Date | null;
    lastSupabaseSync: Date | null;
    pendingItemsCount: number;
    failedItems: FailedItem[];
    syncErrors: SyncError[];
    isFullSyncRunning: boolean;
    isConnected?: boolean;
    lastSync?: Date;
    pendingItems?: number;
    syncInProgress?: boolean;
    errors?: string[];
}
interface FailedItem {
    data: TypingLogData;
    error: string;
    timestamp: Date;
}
interface SyncError {
    timestamp: Date;
    service: 'mongodb' | 'supabase';
    error: string;
    itemsCount: number;
}
declare class DataSyncManager {
    private dataQueue;
    private isProcessingQueue;
    private lastSyncTime;
    private syncInterval;
    private fullSyncTimeout;
    private pendingQueue;
    private failedQueue;
    private syncErrors;
    private syncInProgress;
    private config;
    private syncStatus;
    private mongoClient;
    private supabaseClient;
    /**
   * 모듈 초기화
   */
    initialize(): Promise<boolean>;
    /**
   * 실시간 데이터 전송 시작
   */
    private startRealTimeSync;
    /**
   * 타이핑 로그 데이터를 대기열에 추가
   */
    addToQueue(data: TypingLogData): void;
    /**
   * 대기열 처리
   */
    private processQueue;
    /**
     * 주기적 전체 동기화 (1주일마다)
     */
    private scheduleFullSync;
    /**
     * MongoDB의 모든 데이터 가져오기
     */
    private fetchAllMongoData;
    /**
   * 현재 동기화 상태 반환
   */
    getStatus(): Promise<SyncStatus>;
    /**
   * 수동 동기화 실행
   */
    syncNow(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
   * 동기화 Setup 업데이트
   */
    updateConfig(config: Record<string, unknown>): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
   * Failed한 항목 재시도
   */
    retryFailedItems(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
   * 모듈 재시작
   */
    restart(): Promise<void>;
    /**
   * 초기화 상태 확인
   */
    isInitialized(): boolean;
    /**
   * 동기화 상태 조회
   */
    getSyncStatus(): SyncStatus;
    /**
   * 수동 동기화 실행
   */
    manualSync(): Promise<boolean>;
    /**
   * Cleanup 작업
   */
    cleanup(): void;
    /**
   * 연결 상태 확인
   */
    private isConnected;
    /**
   * 전체 동기화 실행
   */
    private performFullSync;
    /**
     * 대기열 처리 (별칭)
     */
    private processPendingQueue;
    /**
   * 동기화 중지
   */
    stop(): void;
}
declare const dataSyncManager: DataSyncManager;
export default dataSyncManager;
export type { TypingLogData, SyncStatus };
export { DataSyncManager };
//# sourceMappingURL=data-sync.d.ts.map