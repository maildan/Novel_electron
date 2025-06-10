/**
 * Loop 6 윈도우 관리 IPC 핸들러
 *
 * Loop 3의 window-handlers.js를 TypeScript로 완전 마이그레이션
 * 윈도우 모드 변경, 미니뷰, 창 제어 등 UI 관련 기능을 처리합니다.
 */
import { WindowModeType } from './constants';
/**
 * 윈도우 모드 적용
 */
declare function applyWindowMode(mode: WindowModeType): boolean;
/**
 * 윈도우 위치 및 크기 설정
 */
declare function setWindowBounds(bounds: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}): boolean;
/**
 * 윈도우 상태 정보 가져오기
 */
declare function getWindowStatus(): any;
/**
 * 윈도우 투명도 설정
 */
declare function setWindowOpacity(opacity: number): boolean;
/**
 * 윈도우 항상 위에 설정
 */
declare function setAlwaysOnTop(alwaysOnTop: boolean): boolean;
/**
 * 모든 윈도우에 상태 브로드캐스트
 */
declare function broadcastWindowStatus(): void;
/**
 * IPC 핸들러 등록
 */
export declare function registerWindowHandlers(): void;
/**
 * 윈도우 핸들러 초기화
 */
export declare function initializeWindowHandlers(): void;
/**
 * 윈도우 핸들러 정리
 */
export declare function cleanupWindowHandlers(): void;
declare const _default: {
    registerWindowHandlers: typeof registerWindowHandlers;
    applyWindowMode: typeof applyWindowMode;
    setWindowBounds: typeof setWindowBounds;
    getWindowStatus: typeof getWindowStatus;
    setWindowOpacity: typeof setWindowOpacity;
    setAlwaysOnTop: typeof setAlwaysOnTop;
    initializeWindowHandlers: typeof initializeWindowHandlers;
    cleanupWindowHandlers: typeof cleanupWindowHandlers;
    broadcastWindowStatus: typeof broadcastWindowStatus;
};
export default _default;
//# sourceMappingURL=window-handlers.d.ts.map