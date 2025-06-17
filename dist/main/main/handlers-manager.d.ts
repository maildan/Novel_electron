/**
 * Loop 6 IPC 핸들러 통합 관리자
 *
 * 모든 IPC 핸들러를 관리하고 초기화하는 중앙 관리자입니다.
 * Loop 3의 handlers/index.js를 완전히 마이그레이션하고 확장했습니다.
 */
import { registerTrackingHandlers, cleanupTrackingHandlers } from './tracking-handlers';
import { registerKeyboardHandlers, cleanupKeyboardHandlers } from './keyboardHandlers';
import { registerWindowHandlers, cleanupWindowHandlers } from './windowHandlers';
/**
 * IPC 핸들러 중복 등록 방지 유틸리티
 */
/**
 * 모든 IPC 핸들러를 순서대로 등록
 */
export declare function setupAllHandlers(): Promise<boolean>;
/**
 * 핸들러 등록 상태 확인
 */
export declare function isHandlerRegistered(handlerName: string): boolean;
/**
 * 등록된 모든 핸들러 목록 가져오기
 */
export declare function getRegisteredHandlers(): string[];
/**
 * 핸들러 초기화 순서 가져오기
 */
export declare function getInitializationOrder(): string[];
/**
 * 특정 핸들러 재등록
 */
export declare function reregisterHandler(handlerName: string): boolean;
/**
 * 모든 핸들러 Cleanup
 */
export declare function cleanupAllHandlers(): void;
/**
 * 핸들러 상태 진단 - 반환 타입 인터페이스
 */
interface HandlersDiagnosticResult {
    isAllSetup: boolean;
    registeredHandlers: string[];
    initializationOrder: string[];
    settingsInitialized: boolean;
    timestamp: string;
}
/**
 * 핸들러 상태 진단
 */
export declare function diagnoseHandlers(): HandlersDiagnosticResult;
/**
 * 핸들러 상태 리셋
 */
export declare function resetHandlersState(): void;
export { registerTrackingHandlers, registerKeyboardHandlers, registerWindowHandlers };
declare const _default: {
    setupAllHandlers: typeof setupAllHandlers;
    cleanupAllHandlers: typeof cleanupAllHandlers;
    isHandlerRegistered: typeof isHandlerRegistered;
    getRegisteredHandlers: typeof getRegisteredHandlers;
    getInitializationOrder: typeof getInitializationOrder;
    reregisterHandler: typeof reregisterHandler;
    diagnoseHandlers: typeof diagnoseHandlers;
    resetHandlersState: typeof resetHandlersState;
    tracking: {
        register: typeof registerTrackingHandlers;
        cleanup: typeof cleanupTrackingHandlers;
    };
    keyboard: {
        register: typeof registerKeyboardHandlers;
        cleanup: typeof cleanupKeyboardHandlers;
    };
    window: {
        register: typeof registerWindowHandlers;
        cleanup: typeof cleanupWindowHandlers;
    };
};
export default _default;
//# sourceMappingURL=handlers-manager.d.ts.map