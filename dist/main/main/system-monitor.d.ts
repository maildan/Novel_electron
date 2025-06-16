import { EventEmitter } from 'events';
interface SystemMetrics {
    cpu: {
        usage: number;
        processes: number;
        temperature?: number;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        percentage: number;
    };
    gpu?: {
        usage: number;
        memory: number;
        temperature?: number;
    };
    disk: {
        total: number;
        free: number;
        used: number;
        percentage: number;
    };
    network: {
        downloadSpeed: number;
        uploadSpeed: number;
    };
    power: {
        isOnBattery: boolean;
        batteryLevel?: number;
        isCharging?: boolean;
    };
    timestamp: number;
}
export declare class SystemMonitor extends EventEmitter {
    private static instance;
    private monitoringInterval;
    private networkMonitorInterval;
    private isMonitoring;
    private metricsHistory;
    private maxHistorySize;
    private alertThresholds;
    private dbManager;
    private memoryManager;
    private lastNetworkStats;
    private constructor();
    static getInstance(): SystemMonitor;
    /**
   * 시스템 모니터 초기화
   */
    private initialize;
    /**
   * 모니터링 시작
   */
    startMonitoring(): void;
    /**
   * 모니터링 중지
   */
    stopMonitoring(): void;
    /**
   * 시스템 메트릭 수집
   */
    private collectMetrics;
    /**
     * CPU 메트릭 수집
     */
    private getCpuMetrics;
    /**
     * CPU 사용률 계산
     */
    private calculateCpuUsage;
    /**
     * CPU 온도 조회 (네이티브 모듈 사용)
     */
    private getCpuTemperature;
    /**
   * 메모리 메트릭 수집
   */
    private getMemoryMetrics;
    /**
     * GPU 메트릭 수집
     */
    private getGpuMetrics;
    /**
   * 디스크 메트릭 수집
   */
    private getDiskMetrics;
    /**
   * 전원 메트릭 수집
   */
    private getPowerMetrics;
    /**
   * 배터리 레벨 조회
   */
    private getBatteryLevel;
    /**
   * 충전 상태 확인
   */
    private isCharging;
    /**
   * 네트워크 통계 업데이트
   */
    private updateNetworkStats;
    /**
   * 메트릭 처리 및 분석
   */
    private processMetrics;
    /**
   * 성능 알림 확인
   */
    private checkAlerts;
    /**
   * 전원 모니터링 Setup
   */
    private setupPowerMonitoring;
    /**
   * 현재 메트릭 조회
   */
    getCurrentMetrics(): SystemMetrics | null;
    /**
   * 메트릭 히스토리 조회
   */
    getMetricsHistory(minutes?: number): SystemMetrics[];
    /**
   * 평균 메트릭 계산
   */
    getAverageMetrics(minutes?: number): Partial<SystemMetrics> | null;
    /**
   * 시스템 상태 확인
   */
    getSystemHealth(): {
        status: 'good' | 'warning' | 'critical';
        issues: string[];
        score: number;
    };
    /**
   * 타이핑 메트릭 업데이트
   */
    updateTypingMetrics(data: any): void;
    /**
     * 시스템 정보 조회 (IPC 핸들러용)
     */
    getSystemInfo(): Promise<any>;
    /**
     * CPU 사용률 조회 (IPC 핸들러용)
     */
    getCpuUsage(): Promise<any>;
    /**
     * GPU 정보 조회 (IPC 핸들러용)
     */
    getGpuInfo(): Promise<any>;
}
export {};
//# sourceMappingURL=system-monitor.d.ts.map