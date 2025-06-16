export declare class IpcHandlers {
    private static instance;
    private isInitialized;
    private constructor();
    static getInstance(): IpcHandlers;
    /**
     * IPC 핸들러 등록
     */
    register(): Promise<void>;
    /**
   * 데이터 동기화 핸들러 등록
   */
    private registerDataSyncHandlers;
    /**
   * 통계 핸들러 등록
   */
    private registerStatsHandlers;
    /**
   * 브라우저 감지 핸들러 등록
   */
    private registerBrowserHandlers;
    /**
   * 자동 시작 핸들러 등록
   */
    private registerAutoLaunchHandlers;
    /**
   * 보안 핸들러 등록
   */
    private registerSecurityHandlers;
    /**
   * 유틸리티 핸들러 등록
   */
    private registerUtilityHandlers;
    /**
   * 핸들러 제거
   */
    cleanup(): void;
    /**
   * 리소스 Cleanup
   */
    dispose(): void;
}
export declare const ipcHandlers: IpcHandlers;
export default ipcHandlers;
//# sourceMappingURL=ipc-handlers.d.ts.map