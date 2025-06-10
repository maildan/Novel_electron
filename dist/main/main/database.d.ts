interface KeystrokeData {
    id?: number;
    timestamp: Date;
    key: string;
    windowTitle?: string;
    appName?: string;
}
interface SystemMetric {
    id?: number;
    timestamp: Date;
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage?: number;
}
export declare class DatabaseManager {
    private db;
    private isInitialized;
    private dbPath;
    constructor();
    /**
     * 데이터베이스 초기화
     */
    initialize(): Promise<void>;
    /**
     * 테이블 생성
     */
    private createTables;
    /**
     * 타이핑 세션 저장
     */
    saveTypingSession(data: {
        duration?: number;
        startTime?: Date;
        endTime?: Date;
    }): Promise<void>;
    /**
     * 키스트로크 데이터 저장
     */
    saveKeystroke(data: KeystrokeData): Promise<void>;
    /**
     * 시스템 메트릭 저장
     */
    saveSystemMetric(data: SystemMetric): Promise<void>;
    /**
     * 최근 타이핑 세션 조회
     */
    getRecentTypingSessions(limit?: number): Promise<any[]>;
    /**
     * 통계 데이터 조회
     */
    getStatistics(days?: number): Promise<{
        totalSessions: number;
        averageWpm: number;
        averageAccuracy: number;
        totalKeystrokes: number;
    }>;
    /**
     * 데이터베이스 정리
     */
    cleanup(): Promise<void>;
    /**
     * 연결 종료
     */
    disconnect(): Promise<void>;
    /**
     * 키스트로크 데이터 저장 (배치)
     */
    saveKeystrokes(keystrokes: Array<{
        key: string;
        timestamp: number;
        keyCode: number;
        shiftKey: boolean;
        ctrlKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        appName?: string;
        windowTitle?: string;
    }>): Promise<void>;
    /**
     * 헬스 체크
     */
    healthCheck(): Promise<boolean>;
    /**
     * 데이터 내보내기
     */
    exportData(options?: {
        format?: 'json' | 'csv';
        tables?: string[];
    }): Promise<any>;
    /**
     * 데이터 가져오기
     */
    importData(filePath: string): Promise<void>;
    /**
     * 연결 종료 (close 메서드 별칭)
     */
    close(): Promise<void>;
    /**
     * 타이핑 로그 저장 (IPC용)
     */
    saveTypingLog(logData: any): Promise<{
        success: boolean;
        id?: number;
        error?: string;
    }>;
    /**
     * 통계 데이터 조회 (IPC용)
     */
    getStats(params?: any): Promise<any>;
}
export {};
//# sourceMappingURL=database.d.ts.map