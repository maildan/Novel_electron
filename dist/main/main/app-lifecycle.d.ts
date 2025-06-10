/**
 * Loop 6 애플리케이션 라이프사이클 관리
 * Loop 3의 고급 기능들을 TypeScript로 완전 마이그레이션
 */
interface AppState {
    isReady: boolean;
    gpuEnabled: boolean;
    securityInitialized: boolean;
    memoryManagerActive: boolean;
    keyboardMonitoringActive: boolean;
    settings: any;
}
/**
 * 애플리케이션 초기화
 */
export declare function initializeApp(): Promise<void>;
/**
 * 전역 예외 핸들러 설정
 */
export declare function setupGlobalExceptionHandlers(): void;
/**
 * 애플리케이션 정리
 */
export declare function cleanupApp(): Promise<void>;
/**
 * 앱 상태 가져오기
 */
export declare function getAppState(): AppState;
/**
 * 앱 준비 상태 확인
 */
export declare function isAppReady(): boolean;
export {};
//# sourceMappingURL=app-lifecycle.d.ts.map