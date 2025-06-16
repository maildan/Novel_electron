/**
 * 네이티브 모듈 타입 정의
 *
 * Loop 6에서 사용하는 모든 네이티브 모듈 관련 타입들을 통합 관리합니다.
 * 기존에 electron.d.ts, electron.ts, native-client.ts에 분산되어 있던 타입들을 정리했습니다.
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
    application?: ReactMemoryInfo;
    timestamp: number;
}
export interface GpuInfo {
    vendor: string;
    name: string;
    driverVersion: string;
    memoryMb: number;
    isDiscrete: boolean;
    isIntegrated: boolean;
    computeUnits: number;
    maxClockSpeed: number;
    temperature: number;
    powerUsage: number;
    utilization: number;
    fallback: boolean;
    memoryTotal?: string;
    memoryUsed?: string;
    memoryFree?: string;
    timestamp?: string;
}
export interface GpuMemoryStats {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    utilizationPercent: number;
    bandwidthMbps: number;
    temperature: number;
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
export interface GpuAccelerationResult {
    success: boolean;
    timeTakenMs: number;
    memoryUsedMb: number;
    computeUnitsUsed: number;
    errorMessage?: string;
    fallbackUsed: boolean;
}
export interface SystemInfo {
    platform: string;
    arch: string;
    cpuCount: number;
    totalMemory: string;
    hostname: string;
    uptime: string;
    loadAverage: number[];
    version?: string;
    target?: string;
    os?: string;
}
export interface WorkerTaskStatus {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    resultData?: string;
    errorMessage?: string;
    startTime: string;
    completionTime?: string;
}
export interface WorkerStats {
    activeThreads: number;
    pendingTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalProcessingTimeMs: string;
    averageTaskTimeMs: string;
    memoryUsageMb: number;
}
export interface NativeModuleInfo {
    name: string;
    version: string;
    description: string;
    features: {
        gpuCompute: boolean;
        memoryOptimization: boolean;
        workerThreads: boolean;
        advancedAnalytics: boolean;
    };
    platform: {
        os: string;
        arch: string;
        family: string;
    };
    buildInfo: {
        rustcVersion: string;
        target: string;
        profile: string;
    };
}
export interface NativeModuleStatus {
    available: boolean;
    fallbackMode: boolean;
    version: string;
    features: {
        memory: boolean;
        gpu: boolean;
        worker: boolean;
    };
    timestamp: number;
    loadError?: string;
}
export interface NativeModuleAPI {
    getMemoryUsage(): Promise<MemoryUsage | null>;
    startMemoryMonitoring(): Promise<boolean>;
    getMemoryStats(): Promise<MemoryStats | null>;
    optimizeMemory(): Promise<boolean>;
    cleanupMemory(): Promise<boolean>;
    optimizeMemoryAdvanced(): Promise<boolean>;
    resetMemoryMonitoring(): Promise<boolean>;
    getGpuInfo(): Promise<GpuInfo | null>;
    getGpuMemoryStats(): Promise<GpuMemoryStats | null>;
    runGpuAcceleration(data: string): Promise<GpuAccelerationResult>;
    runGpuBenchmark(): Promise<any>;
    getSystemInfo(): Promise<SystemInfo | null>;
    isNativeModuleAvailable(): Promise<boolean>;
    getNativeModuleInfo(): Promise<NativeModuleInfo | null>;
    getNativeModuleVersion(): Promise<string>;
    initializeNativeModules(): Promise<boolean>;
    cleanupNativeModules(): Promise<boolean>;
    getTimestamp(): Promise<number>;
    addWorkerTask(taskData: string): Promise<string>;
    getWorkerTaskStatus(taskId: string): Promise<WorkerTaskStatus | null>;
    getWorkerStats(): Promise<WorkerStats | null>;
    getPendingTaskCount(): Promise<number>;
    resetWorkerPool(): Promise<boolean>;
    executeCpuTask(taskData: string): Promise<any>;
    processDataParallel(data: string): Promise<any>;
    calculateFileHash(filePath: string): Promise<string>;
    calculateDirectorySize(dirPath: string): Promise<number>;
    calculateStringSimilarity(str1: string, str2: string): Promise<number>;
    validateJson(jsonStr: string): Promise<boolean>;
    encodeBase64(data: string): Promise<string>;
    decodeBase64(encodedData: string): Promise<string>;
    generateUuid(): Promise<string>;
    getTimestampString(): Promise<string>;
    getEnvVar(name: string): Promise<string | null>;
    getProcessId(): Promise<number>;
    startPerformanceMeasurement(label: string): Promise<string>;
    endPerformanceMeasurement(measurementId: string): Promise<number>;
}
export interface ModuleStatus {
    isLoaded: boolean;
    isAvailable: boolean;
    error: Error | null;
    version: string | null;
    loadTime: number;
}
export declare function isMemoryUsage(obj: any): obj is MemoryUsage;
export declare function isGpuInfo(obj: any): obj is GpuInfo;
export declare function isSystemInfo(obj: any): obj is SystemInfo;
//# sourceMappingURL=native.d.ts.map