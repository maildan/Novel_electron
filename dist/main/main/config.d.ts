export declare class AppConfig {
    static readonly APP_NAME = "Loop";
    static readonly APP_VERSION = "6.0.0";
    static readonly NEXT_PORT: string;
    static get version(): string;
    static get isDev(): boolean;
    static get port(): string;
    static readonly DATABASE_PATH: string;
    static readonly NATIVE_MODULE_PATH: string;
    static readonly LOG_PATH: string;
    static readonly WINDOW_CONFIG: {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        show: boolean;
        webPreferences: {
            nodeIntegration: boolean;
            contextIsolation: boolean;
            enableRemoteModule: boolean;
            preload: string;
            webSecurity: boolean;
            allowRunningInsecureContent: boolean;
            backgroundThrottling: boolean;
            v8CacheOptions: "none";
            enableWebSQL: boolean;
            disableBlinkFeatures: string;
            experimentalFeatures: boolean;
            enablePreferredSizeMode: boolean;
            spellcheck: boolean;
            offscreen: boolean;
            additionalArguments: string[];
        };
    };
    static readonly KEYBOARD_CONFIG: {
        enableHook: boolean;
        captureModifiers: boolean;
        captureSpecialKeys: boolean;
        bufferSize: number;
        flushInterval: number;
    };
    static readonly MEMORY_CONFIG: {
        optimizationInterval: number;
        thresholdMB: number;
        aggressiveThresholdMB: number;
        enableAutoOptimization: boolean;
    };
    static readonly SYSTEM_MONITOR_CONFIG: {
        updateInterval: number;
        historyLength: number;
        enableCpuMonitoring: boolean;
        enableMemoryMonitoring: boolean;
        enableGpuMonitoring: boolean;
    };
    static readonly memory: {
        threshold: number;
        forceGcThreshold: number;
        cleanupInterval: number;
    };
    static readonly monitoring: {
        thresholds: {
            cpu: {
                warning: number;
                critical: number;
            };
            memory: {
                warning: number;
                critical: number;
            };
            gpu: {
                warning: number;
                critical: number;
            };
        };
    };
    static readonly gpu: {
        mode: string;
    };
    static readonly server: {
        url: string;
    };
    static readonly development: {
        openDevTools: boolean;
    };
    static get isDevelopment(): boolean;
    static get isProduction(): boolean;
    static get nextUrl(): string;
    private static configStore;
    static get(key: string): any;
    static set(key: string, value: any): void;
    static getAll(): Record<string, any>;
    static reset(): void;
}
//# sourceMappingURL=config.d.ts.map