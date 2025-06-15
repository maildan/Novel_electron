/**
 * Loop 6 Setup 관련 IPC 핸들러
 *
 * Setup 페이지에서 요청하는 다양한 Setup 기능들의 실제 구현
 */
export declare class SettingsIpcHandlers {
    private static instance;
    private isRegistered;
    private constructor();
    static getInstance(): SettingsIpcHandlers;
    /**
     * Setup 관련 IPC 핸들러 등록
     */
    register(): void;
    /**
     * GPU 사용 가능 여부 확인
     */
    private checkGPUAvailability;
    /**
   * 핸들러 Cleanup
   */
    cleanup(): void;
}
declare const _default: SettingsIpcHandlers;
export default _default;
//# sourceMappingURL=settingsIpcHandlers.d.ts.map