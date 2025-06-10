/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
export declare function registerNativeIpcHandlers(): void;
/**
 * 네이티브 모듈 IPC 핸들러 정리
 */
export declare function cleanupNativeIpcHandlers(): void;
export declare function getNativeModuleStatus(): {
    loaded: boolean;
    error: string | null;
    functions: number;
    version: string | null;
    available: boolean;
};
//# sourceMappingURL=native-ipc.d.ts.map