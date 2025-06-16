/**
 * Loop 6 키보드 이벤트 처리 IPC 핸들러
 *
 * Loop 3의 keyboard-handlers.js를 TypeScript로 완전 마이그레이션
 * Setup keyboard event listeners/관리, 한글 입력 처리, IME 지원 등을 담당합니다.
 */
/**
 * 한글 문자의 자모 개수 계산
 */
export declare function getJamoCount(char: string): number;
/**
 * 한글 문자를 자모로 분해
 */
export declare function decomposeHangul(char: string): string[];
/**
 * 키보드 리스너 Setup
 */
export declare function setupKeyboardListenerIfNeeded(): Promise<boolean>;
/**
 * 키보드 리스너 Cleanup
 */
export declare function cleanupKeyboardListener(): boolean;
/**
 * 키보드 상태 정보 가져오기
 */
export declare function getKeyboardStatus(): any;
/**
 * IPC 핸들러 등록
 */
export declare function registerKeyboardHandlers(): void;
/**
 * 키보드 핸들러 초기화
 */
export declare function initializeKeyboardHandlers(): Promise<void>;
/**
 * 키보드 핸들러 Cleanup
 */
export declare function cleanupKeyboardHandlers(): void;
declare const _default: {
    registerKeyboardHandlers: typeof registerKeyboardHandlers;
    setupKeyboardListenerIfNeeded: typeof setupKeyboardListenerIfNeeded;
    cleanupKeyboardListener: typeof cleanupKeyboardListener;
    getJamoCount: typeof getJamoCount;
    decomposeHangul: typeof decomposeHangul;
    getKeyboardStatus: typeof getKeyboardStatus;
    initializeKeyboardHandlers: typeof initializeKeyboardHandlers;
    cleanupKeyboardHandlers: typeof cleanupKeyboardHandlers;
    testHangulInput: () => Promise<{
        success: boolean;
        result: any;
    }>;
};
export default _default;
//# sourceMappingURL=keyboardHandlers.d.ts.map