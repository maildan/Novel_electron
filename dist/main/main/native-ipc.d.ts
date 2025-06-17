/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
export declare function registerNativeIpcHandlers(): void;
/**
 * 네이티브 모듈 IPC 핸들러 정리
 */
export declare function cleanupNativeIpcHandlers(): void;
/**
 * 네이티브 모듈 상태 정보 조회 (기존 memory-ipc.ts와 연동)
 */
export declare function getNativeModuleStatus(): {
    loaded: boolean;
    error: string;
    functions: number;
    version: string;
    available: boolean;
};
//# sourceMappingURL=native-ipc.d.ts.map