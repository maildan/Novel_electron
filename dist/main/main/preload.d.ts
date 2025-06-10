/**
 * Preload Script for Loop 6
 *
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 preload 스크립트입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 */
declare const electronAPI: {
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