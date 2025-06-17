/**
 * Data collection and logging system
 * Continuous data collection according to COPILOT_GUIDE.md rules
 */
interface LogEntry {
    timestamp: string;
    type: 'system' | 'keyboard' | 'memory' | 'gpu' | 'error' | 'performance';
    message: string;
    data?: Record<string, unknown>;
    source: string;
}
export declare class DataCollector {
    private logPath;
    private sessionId;
    constructor();
    private ensureLogDirectory;
    log(type: LogEntry['type'], message: string, data?: Record<string, unknown>, source?: string): void;
    logSystemInfo(info: Record<string, unknown>): void;
    logKeyboardEvent(event: Record<string, unknown>): void;
    logMemoryUsage(usage: Record<string, unknown>): void;
    logGpuInfo(info: Record<string, unknown>): void;
    logError(error: Error, context?: string): void;
    logPerformance(metric: string, value: number, unit?: string): void;
    generateDailyReport(): void;
}
export declare const dataCollector: DataCollector;
export {};
//# sourceMappingURL=data-collector.d.ts.map