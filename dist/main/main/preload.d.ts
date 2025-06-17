/**
 * Preload Script for Loop 6
 *
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 *
 * 이 파일은 preload/index.ts의 모든 중요한 기능을 통합한 authoritative preload script입니다.
 */
interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
interface GpuComputeData {
    operation: 'multiply' | 'add' | 'benchmark' | 'custom';
    parameters: Record<string, number | string>;
    data?: number[];
}
interface TypingSessionData {
    keyCount: number;
    typingTime: number;
    timestamp: string;
    windowTitle?: string;
    browserName?: string;
    accuracy?: number;
}
interface ExportParams {
    format?: 'json' | 'csv';
    dateRange?: {
        start: string;
        end: string;
    };
}
interface DataQueryParams {
    limit?: number;
    offset?: number;
    dateRange?: {
        start: string;
        end: string;
    };
}
interface WindowCreateOptions {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    resizable?: boolean;
    movable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    show?: boolean;
    alwaysOnTop?: boolean;
    fullscreen?: boolean;
    transparent?: boolean;
    frame?: boolean;
    title?: string;
}
interface WindowBounds {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
type IpcEventListener = (event: Electron.IpcRendererEvent, ...args: unknown[]) => void;
declare const electronAPI: {
    invoke: (channel: string, ...args: unknown[]) => Promise<any>;
    database: {
        saveTypingSession: (data: TypingSessionData) => Promise<any>;
        getRecentSessions: (limit?: number) => Promise<any>;
        getStatistics: (days?: number) => Promise<any>;
        cleanup: () => Promise<any>;
        healthCheck: () => Promise<any>;
        getKeystrokeData: (params: DataQueryParams) => Promise<any>;
        getSessions: (params: DataQueryParams) => Promise<any>;
        exportData: (params: ExportParams) => Promise<any>;
        importData: (params: {
            filePath: string;
        }) => Promise<any>;
        clearData: (params: {
            confirm: boolean;
        }) => Promise<any>;
    };
    ipcRenderer: {
        send: (channel: string, ...args: unknown[]) => void;
        invoke: (channel: string, ...args: unknown[]) => Promise<any>;
        on: (channel: string, listener: IpcEventListener) => () => void;
        once: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
        removeListener: (channel: string, listener: (...args: unknown[]) => void) => void;
        removeAllListeners: (channel: string) => void;
    };
    system: {
        getInfo: () => Promise<any>;
        startMonitoring: () => Promise<any>;
        stopMonitoring: () => Promise<any>;
        getCurrentMetrics: () => Promise<any>;
        getMetricsHistory: (minutes?: number) => Promise<any>;
        getAverageMetrics: (minutes?: number) => Promise<any>;
        getHealth: () => Promise<any>;
        getSystemInfo: () => Promise<any>;
        getMemoryUsage: () => Promise<any>;
        optimizeMemory: () => Promise<any>;
        cleanup: (force?: boolean) => Promise<any>;
        getUsage: () => Promise<any>;
        getStats: () => Promise<any>;
        getLoopProcesses: () => Promise<any>;
        getCpuInfo: () => Promise<any>;
        getProcesses: () => Promise<any>;
        gpu: {
            getInfo: () => Promise<any>;
            compute: (data: GpuComputeData) => Promise<any>;
            enable: () => Promise<any>;
            disable: () => Promise<any>;
        };
        native: {
            getStatus: () => Promise<APIResponse<any>>;
        };
    };
    memory: {
        cleanup: (force?: boolean) => Promise<any>;
        getUsage: () => Promise<APIResponse<any>>;
        getStats: () => Promise<any>;
        getInfo: () => Promise<any>;
        optimize: () => Promise<any>;
        forceGc: () => Promise<any>;
        setThreshold: (threshold: number) => Promise<any>;
    };
    settings: {
        get: (key?: string) => Promise<any>;
        set: (key: string, value: unknown) => Promise<any>;
        getAll: () => Promise<any>;
        update: (key: string, value: unknown) => Promise<any>;
        updateMultiple: (settings: Record<string, unknown>) => Promise<any>;
        reset: () => Promise<any>;
        save: () => Promise<any>;
        load: () => Promise<any>;
        getSetting: (key: string) => Promise<any>;
        export: (filePath: string) => Promise<any>;
        import: (filePath: string) => Promise<any>;
        validate: (settings: Record<string, unknown>) => Promise<any>;
        createBackup: () => Promise<any>;
        getHistory: () => Promise<any>;
        clearHistory: () => Promise<any>;
    };
    window: {
        create: (options?: WindowCreateOptions) => Promise<any>;
        minimize: () => Promise<any>;
        maximize: () => Promise<any>;
        toggleMaximize: () => Promise<any>;
        close: () => Promise<any>;
        toggleDevTools: () => Promise<any>;
        unmaximize: () => Promise<any>;
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
        setWindowBounds: (bounds: WindowBounds) => Promise<any>;
    };
    app: {
        getVersion: () => Promise<any>;
        getInfo: () => Promise<any>;
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
        startKeystrokeTracking: () => Promise<any>;
        stopKeystrokeTracking: () => Promise<any>;
        getKeystrokeStats: () => Promise<any>;
        startFileMonitoring: (path: string) => Promise<any>;
        stopFileMonitoring: () => Promise<any>;
        getProcessList: () => Promise<any>;
        getNetworkConnections: () => Promise<any>;
        hashData: (data: string) => Promise<any>;
    };
    config: {
        get: (key?: string) => Promise<any>;
        set: (key: string, value: unknown) => Promise<any>;
        getAll: () => Promise<any>;
        reset: () => Promise<any>;
    };
    on: (channel: string, listener: (...args: unknown[]) => void) => void;
    off: (channel: string, listener: (...args: unknown[]) => void) => void;
    once: (channel: string, listener: (...args: unknown[]) => void) => void;
    utils: {
        removeAllListeners: (channel: string) => void;
        platform: NodeJS.Platform;
        versions: NodeJS.ProcessVersions;
    };
    debug: {
        getProcessInfo: () => {
            versions: NodeJS.ProcessVersions;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            env: string;
        };
        log: (message: string, ...args: unknown[]) => void;
    };
};
export type ElectronAPI = typeof electronAPI;
export {};
//# sourceMappingURL=preload.d.ts.map