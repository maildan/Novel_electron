/**
 * 데이터 수집 및 로깅 시스템
 * COPILOT_GUIDE.md 규칙에 따른 지속적 데이터 수집
 */
interface LogEntry {
    timestamp: string;
    type: 'system' | 'keyboard' | 'memory' | 'gpu' | 'error' | 'performance';
    message: string;
    data?: any;
    source: string;
}
export declare class DataCollector {
    private logPath;
    private sessionId;
    constructor();
    private ensureLogDirectory;
    log(type: LogEntry['type'], message: string, data?: any, source?: string): void;
    logSystemInfo(info: any): void;
    logKeyboardEvent(event: any): void;
    logMemoryUsage(usage: any): void;
    logGpuInfo(info: any): void;
    logError(error: Error, context?: string): void;
    logPerformance(metric: string, value: number, unit?: string): void;
    generateDailyReport(): void;
}
export declare const dataCollector: DataCollector;
export {};
//# sourceMappingURL=data-collector.d.ts.map