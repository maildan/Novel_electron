export interface NativeModule {
    calculateTypingStats?: (data: any) => any;
    optimizeMemory?: () => any;
    gpuAccelerate?: (task: string, data: any) => any;
    getGpuInfo?: () => any;
    runGpuAcceleration?: (data: any) => any;
    runGpuBenchmark?: () => any;
    getMemoryInfo?: () => any;
    cleanupMemory?: () => any;
    getGpuMemoryStats?: () => GpuMemoryStats;
    optimizeMemoryAdvanced?: () => GpuAccelerationResult;
    isAvailable: boolean;
}
export interface GpuInfo {
    name: string;
    vendor: string;
    memoryTotal: string;
    memoryUsed: string;
    memoryAvailable: string;
    utilization: number;
    computeCapability: string;
    driverVersion: string;
    isIntegrated: boolean;
    supportsCompute: boolean;
    timestamp: string;
}
export interface GpuMemoryStats {
    appMemoryMb: number;
    gpuMemoryMb: number;
    cpuMemoryMb: number;
    totalOffloadedMb: number;
    optimizationScore: number;
    lastOptimization: string;
    activeOffloads: number;
}
export interface GpuAccelerationResult {
    success: boolean;
    executionTimeMs: number;
    memorySavedMb: number;
    performanceGain: number;
    usedGpu: boolean;
    errorMessage?: string;
}
declare class NativeModuleLoader {
    private static instance;
    private nativeModule;
    private isLoaded;
    private loadError;
    private constructor();
    static getInstance(): NativeModuleLoader;
    static resolveNativeModulePath(): string;
    loadModule(): Promise<NativeModule>;
    private createModuleWrapper;
    private loadFallbackModule;
    private calculateTypingStatsJS;
    private optimizeMemoryJS;
    getLoadError(): string | null;
    isModuleLoaded(): boolean;
}
export declare const nativeModuleLoader: NativeModuleLoader;
export declare function loadNativeModule(): Promise<NativeModule>;
export declare function getNativeModuleStatus(): {
    isLoaded: boolean;
    error: string;
};
export declare function getGpuInfo(): Promise<GpuInfo>;
export declare function getGpuMemoryStats(): Promise<GpuMemoryStats>;
export declare function runGpuAcceleration(data: any): Promise<GpuAccelerationResult>;
export declare function runGpuBenchmark(): Promise<GpuAccelerationResult>;
export declare function optimizeMemoryAdvanced(): Promise<GpuAccelerationResult>;
export declare function getMemoryInfo(): Promise<any>;
export declare function optimizeMemory(): Promise<any>;
export declare function cleanupMemory(): Promise<GpuAccelerationResult>;
export default nativeModuleLoader;
//# sourceMappingURL=index.d.ts.map