import { ExportOptions, DatabaseExportResult } from '../types/database';
interface KeystrokeData {
    id?: number;
    timestamp: Date | number;
    key: string;
    keyCode?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    windowTitle?: string;
    appName?: string;
}
interface TypingSession {
    id?: number;
    timestamp: Date;
    keyCount: number;
    typingTime: number;
    windowTitle?: string;
    browserName?: string;
    accuracy?: number;
    wpm?: number;
}
interface SystemMetric {
    id?: number;
    timestamp: Date;
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage?: number;
}
interface TypingLogData {
    keyCount: number;
    typingTime: number;
    windowTitle?: string;
    window?: string;
    browserName?: string;
    appName?: string;
    app?: string;
    accuracy?: number;
    timestamp?: string | Date;
    key?: string;
    char?: string;
}
interface StatsParams {
    days?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    appName?: string;
}
interface DatabaseStats {
    success: boolean;
    totalSessions: number;
    totalKeystrokes: number;
    averageWpm?: number;
    averageAccuracy?: number;
    topApps?: Array<{
        appName: string;
        count: number;
    }>;
    dailyStats?: Array<{
        date: string;
        keystrokes: number;
        sessions: number;
    }>;
    error?: string;
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
    getRecentTypingSessions(limit?: number): Promise<TypingSession[]>;
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
   * 데이터베이스 Cleanup
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
    healthCheck(): Promise<boolean>; /**
     * 데이터 내보내기
     */
    exportData(options?: ExportOptions): Promise<DatabaseExportResult>;
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
    saveTypingLog(logData: TypingLogData): Promise<{
        success: boolean;
        id?: number;
        error?: string;
    }>;
    /**
     * 통계 데이터 조회 (IPC용)
     */
    getStats(params?: StatsParams): Promise<DatabaseStats | {
        success: false;
        error: string;
    }>;
}
export {};
//# sourceMappingURL=database.d.ts.map