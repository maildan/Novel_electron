import { EventEmitter } from 'events';
export interface SystemMetrics {
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
interface TypingMetrics {
    keyCount: number;
    typingTime: number;
    accuracy?: number;
    wpm?: number;
}
export interface SystemInfo {
    platform: string;
    arch: string;
    hostname: string;
    uptime: number;
    cpus: number;
    memory: {
        total: number;
        free: number;
        used: number;
        percentage: number;
    };
    loadAverage: number[];
}
export interface CpuUsage {
    usage: number;
    processes: number;
    cores: number;
    model?: string;
}
export interface GpuInfo {
    name: string;
    vendor: string;
    memory: number;
    utilization: number;
    temperature?: number;
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
    private initialize;
    private setupPowerMonitoring;
    startMonitoring(): Promise<void>;
    stopMonitoring(): void;
    private collectMetrics;
    private getCpuMetrics;
    private getMemoryMetrics;
    private getDiskMetrics;
    private getGpuMetrics;
    private getPowerMetrics;
    private addMetrics;
    private checkAlerts;
    private updateNetworkStats;
    getMetricsHistory(): SystemMetrics[];
    getCurrentMetrics(): SystemMetrics | null;
    getSystemHealth(): {
        status: 'good' | 'warning' | 'critical';
        issues: string[];
        score: number;
    };
    updateTypingMetrics(data: TypingMetrics): void;
    getSystemInfo(): Promise<SystemInfo>;
    getCpuUsage(): Promise<CpuUsage>;
    getGpuInfo(): Promise<GpuInfo>;
}
export {};
//# sourceMappingURL=system-monitor.d.ts.map