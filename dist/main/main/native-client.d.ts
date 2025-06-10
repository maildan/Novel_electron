/**
 * Loop 6 NAPI 네이티브 모듈 클라이언트
 *
 * 새로 빌드된 NAPI 네이티브 모듈과의 연동을 위한 클라이언트
 */
export interface MemoryUsage {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    timestamp: string;
}
export interface MemoryStats {
    usage: MemoryUsage;
    peakUsage: MemoryUsage;
    averageUsage: MemoryUsage;
    totalSamples: number;
    monitoringDurationMs: string;
}
export interface GpuInfo {
    name: string;
    vendor: string;
    driverVersion: string;
    memoryTotal: string;
    memoryUsed: string;
    memoryFree: string;
    utilization: number;
    temperature: number;
    timestamp: string;
}
export interface GpuStats {
    current: GpuInfo;
    peakUtilization: number;
    averageUtilization: number;
    peakMemoryUsed: string;
    averageMemoryUsed: string;
    totalSamples: number;
    monitoringDurationMs: string;
}
export interface SystemInfo {
    platform: string;
    arch: string;
    cpuCount: number;
    totalMemory: string;
    hostname: string;
    uptime: string;
    loadAverage: number[];
}
interface ModuleStatus {
    isLoaded: boolean;
    isAvailable: boolean;
    error: Error | null;
    version: string | null;
    loadTime: number;
}
declare class NativeModuleClient {
    private module;
    private status;
    constructor();
    /**
     * 네이티브 모듈 로드 (index.js를 통한 로드)
     */
    private loadModule;
    /**
     * 모듈 상태 확인
     */
    getStatus(): ModuleStatus;
    /**
     * 모듈 사용 가능 여부 확인
     */
    isAvailable(): boolean;
    getMemoryUsage(): MemoryUsage | null;
    startMemoryMonitoring(): boolean;
    getMemoryStats(): MemoryStats | null;
    resetMemoryMonitoring(): boolean;
    getGpuInfo(): GpuInfo | null;
    startGpuMonitoring(): boolean;
    getGpuStats(): GpuStats | null;
    resetGpuMonitoring(): boolean;
    getSystemInfo(): SystemInfo | null;
    generateUuid(): string | null;
    getTimestamp(): number | null;
    getTimestampString(): string | null;
    getNativeModuleInfo(): string | null;
    /**
     * 리소스 정리
     */
    cleanup(): void;
}
export declare const nativeClient: NativeModuleClient;
/**
 * 네이티브 모듈 관련 IPC 핸들러 등록
 */
export declare function registerNativeIpcHandlers(): void;
/**
 * 네이티브 모듈 관련 IPC 핸들러 정리
 */
export declare function cleanupNativeIpcHandlers(): void;
export {};
//# sourceMappingURL=native-client.d.ts.map