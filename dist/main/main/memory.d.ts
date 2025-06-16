export interface ReactMemoryInfo {
    total: number;
    used: number;
    free: number;
    percentage: number;
}
export interface ReactMemoryData {
    main: ReactMemoryInfo;
    renderer: ReactMemoryInfo;
    gpu?: ReactMemoryInfo;
    system: ReactMemoryInfo;
    timestamp: number;
}
export interface MemoryStats {
    main: ReactMemoryInfo;
    renderer: ReactMemoryInfo[];
    system: {
        total: number;
        free: number;
        used: number;
    };
    gpu?: {
        used: number;
        total: number;
    };
}
export declare class MemoryManager {
    private static instance;
    private cleanupInterval;
    private monitoringInterval;
    private memoryThreshold;
    private forceGcThreshold;
    private cleanupIntervalMs;
    private lastCleanup;
    private memoryHistory;
    private maxHistorySize;
    private aggressiveMode;
    private ultraLowMemoryMode;
    private constructor();
    static getInstance(): MemoryManager;
    /**
   * 메모리 관리자 초기화
   */
    private initialize;
    /**
     * Node.js memoryUsage를 React 컴포넌트가 기대하는 ReactMemoryInfo 형태로 변환 (RSS 기반)
     */
    private convertNodeMemoryToMemoryInfo;
    /**
   * 현재 메모리 사용량 조회
   */
    getCurrentMemoryUsage(): MemoryStats;
    /**
   * 렌더러 프로세스 메모리 사용량 조회
   */
    private getRendererMemoryUsage;
    /**
   * 시스템 메모리 정보 조회
   */
    private getSystemMemoryInfo;
    /**
     * GPU 메모리 정보 조회 (네이티브 모듈 사용)
     */
    private getGpuMemoryInfo;
    /**
     * 메모리 Cleanup 수행
     */
    performCleanup(force?: boolean): Promise<void>;
    /**
   * 렌더러 프로세스 메모리 Cleanup
   */
    private cleanupRendererProcesses;
    /**
     * 캐시 Cleanup
     */
    private clearCaches;
    /**
   * 메모리 부족 상황 처리
   */
    private handleOutOfMemory;
    /**
   * 긴급 메모리 Cleanup
   */
    private emergencyCleanup;
    /**
   * 메모리 히스토리 업데이트
   */
    private updateMemoryHistory;
    /**
   * 메모리 모니터링 시작
   */
    private startMonitoring;
    /**
   * 정기 Cleanup 타이머 시작
   */
    private startCleanupTimer;
    /**
   * 메모리 통계 조회
   */
    getMemoryStats(): {
        current: MemoryStats;
        history: MemoryStats[];
        averageUsage: number;
    };
    /**
   * 리소스 Cleanup
   */
    dispose(): void;
    /**
     * 메모리 사용량 조회 (IPC용)
     */
    getMemoryUsage(): Promise<ReactMemoryData>;
    /**
     * 메모리 최적화 실행 (IPC용)
     */
    optimize(): Promise<any>;
    /**
   * 렌더러 프로세스 적극적 Cleanup
   */
    private aggressiveRendererCleanup;
    /**
   * 모든 캐시 적극적 Cleanup
   */
    private aggressiveCacheCleanup;
    /**
   * 세션 데이터 Cleanup
   */
    private clearSessionData;
}
//# sourceMappingURL=memory.d.ts.map