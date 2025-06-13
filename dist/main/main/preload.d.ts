/**
 * Preload Script for Loop 6
 *
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 */
declare const electronAPI: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void;
        once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
    };
    system: {
        getInfo: () => Promise<any>;
        startMonitoring: () => Promise<any>;
        stopMonitoring: () => Promise<any>;
        getCurrentMetrics: () => Promise<any>;
        getMetricsHistory: (minutes?: number) => Promise<any>;
        cleanup: (force?: boolean) => Promise<any>;
        getUsage: () => Promise<any>;
        getStats: () => Promise<any>;
        optimizeMemory: () => Promise<any>;
        getLoopProcesses: () => Promise<any>;
        gpu: {
            getInfo: () => Promise<any>;
            compute: (data: any) => Promise<any>;
            enable: () => Promise<any>;
            disable: () => Promise<any>;
        };
        native: {
            getStatus: () => Promise<any>;
        };
    };
    memory: {
        cleanup: (force?: boolean) => Promise<any>;
        getUsage: () => Promise<any>;
        getStats: () => Promise<any>;
        getInfo: () => Promise<any>;
        optimize: () => Promise<any>;
        forceGc: () => Promise<any>;
        setThreshold: (threshold: number) => Promise<any>;
    };
    settings: {
        get: () => Promise<any>;
        getSetting: (key: string) => Promise<any>;
        update: (key: string, value: any) => Promise<any>;
        updateMultiple: (settings: Record<string, any>) => Promise<any>;
        reset: () => Promise<any>;
        export: (filePath: string) => Promise<any>;
        import: (filePath: string) => Promise<any>;
        validate: (settings: Record<string, any>) => Promise<any>;
        createBackup: () => Promise<any>;
        getHistory: () => Promise<any>;
        clearHistory: () => Promise<any>;
    };
    window: {
        minimize: () => Promise<any>;
        maximize: () => Promise<any>;
        unmaximize: () => Promise<any>;
        close: () => Promise<any>;
        setAlwaysOnTop: (flag: boolean) => Promise<any>;
        setOpacity: (opacity: number) => Promise<any>;
        setSize: (width: number, height: number) => Promise<any>;
        setPosition: (x: number, y: number) => Promise<any>;
        center: () => Promise<any>;
        focus: () => Promise<any>;
        blur: () => Promise<any>;
        show: () => Promise<any>;
        hide: () => Promise<any>;
        setFullScreen: (flag: boolean) => Promise<any>;
        isFullScreen: () => Promise<any>;
        isMaximized: () => Promise<any>;
        isMinimized: () => Promise<any>;
        isVisible: () => Promise<any>;
        isFocused: () => Promise<any>;
        setWindowMode: (mode: string) => Promise<any>;
        getWindowStatus: () => Promise<any>;
        setWindowBounds: (bounds: any) => Promise<any>;
    };
    app: {
        getVersion: () => Promise<any>;
        getName: () => Promise<any>;
        getPath: (name: string) => Promise<any>;
        quit: () => Promise<any>;
        relaunch: () => Promise<any>;
        isPackaged: () => Promise<any>;
        getLocale: () => Promise<any>;
        focus: () => Promise<any>;
    };
    native: {
        getMemoryUsage: () => Promise<any>;
        startMemoryMonitoring: () => Promise<any>;
        getMemoryStats: () => Promise<any>;
        optimizeMemory: () => Promise<any>;
        cleanupMemory: () => Promise<any>;
        optimizeMemoryAdvanced: () => Promise<any>;
        resetMemoryMonitoring: () => Promise<any>;
        getGpuInfo: () => Promise<any>;
        getGpuMemoryStats: () => Promise<any>;
        runGpuAcceleration: (data: string) => Promise<any>;
        runGpuBenchmark: () => Promise<any>;
        getSystemInfo: () => Promise<any>;
        isNativeModuleAvailable: () => Promise<any>;
        getNativeModuleInfo: () => Promise<any>;
        getNativeModuleVersion: () => Promise<any>;
        initializeNativeModules: () => Promise<any>;
        cleanupNativeModules: () => Promise<any>;
        getTimestamp: () => Promise<any>;
        addWorkerTask: (taskData: string) => Promise<any>;
        getWorkerTaskStatus: (taskId: string) => Promise<any>;
        getWorkerStats: () => Promise<any>;
        getPendingTaskCount: () => Promise<any>;
        resetWorkerPool: () => Promise<any>;
        executeCpuTask: (taskData: string) => Promise<any>;
        processDataParallel: (data: string) => Promise<any>;
        calculateFileHash: (filePath: string) => Promise<any>;
        calculateDirectorySize: (dirPath: string) => Promise<any>;
        calculateStringSimilarity: (str1: string, str2: string) => Promise<any>;
        validateJson: (jsonStr: string) => Promise<any>;
        encodeBase64: (data: string) => Promise<any>;
        decodeBase64: (encodedData: string) => Promise<any>;
        generateUuid: () => Promise<any>;
        getTimestampString: () => Promise<any>;
        getEnvVar: (name: string) => Promise<any>;
        getProcessId: () => Promise<any>;
        startPerformanceMeasurement: (label: string) => Promise<any>;
        endPerformanceMeasurement: (measurementId: string) => Promise<any>;
    };
    debug: {
        getProcessInfo: () => {
            versions: NodeJS.ProcessVersions;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            env: string | undefined;
        };
        log: (message: string, ...args: any[]) => void;
    };
};
export type ElectronAPI = typeof electronAPI;
export {};
//# sourceMappingURL=preload.d.ts.map