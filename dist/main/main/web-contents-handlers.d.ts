/**
 * 웹 콘텐츠 이벤트 핸들러 모듈
 *
 * Electron 웹 콘텐츠 관련 이벤트 처리 및 보안 설정을 관리합니다.
 * - 새 윈도우 열기 제한 및 보안 검사
 * - 컨텍스트 메뉴 설정 및 커스터마이징
 * - 권한 요청 처리 (알림, 카메라, 마이크 등)
 * - 오류 처리 및 충돌 복구
 * - iframe/webview 보안 설정
 */
import { WebContents } from 'electron';
/**
 * 허용된 URL 패턴 관리 클래스
 */
declare class URLManager {
    private static allowedPatterns;
    private static blockedPatterns;
    /**
     * URL이 허용되는지 확인
     */
    static isAllowed(url: string): boolean;
    /**
     * 안전한 URL인지 확인 (webview용)
     */
    static isSafeForWebview(url: string): boolean;
    /**
     * 허용된 패턴 추가
     */
    static addAllowedPattern(pattern: string): void;
    /**
     * 차단된 패턴 추가
     */
    static addBlockedPattern(pattern: string): void;
}
/**
 * 권한 관리 클래스
 */
declare class PermissionManager {
    private static allowedPermissions;
    private static restrictedPermissions;
    /**
     * 권한 요청 처리
     */
    static handlePermissionRequest(webContents: WebContents, permission: string, callback: (granted: boolean) => void, details?: any): void;
    /**
     * 권한 요청 다이얼로그 표시
     */
    private static showPermissionDialog;
}
/**
 * 웹 콘텐츠 생성 시 보안 및 기능 설정
 */
export declare function setupWebContentsHandlers(contents: WebContents): void;
/**
 * 앱 전체 웹 콘텐츠 이벤트 핸들러 설정
 */
export declare function initializeWebContentsHandlers(): void;
/**
 * URL 관리 유틸리티 내보내기
 */
export { URLManager };
/**
 * 기본 내보내기
 */
declare const _default: {
    setupWebContentsHandlers: typeof setupWebContentsHandlers;
    initializeWebContentsHandlers: typeof initializeWebContentsHandlers;
    URLManager: typeof URLManager;
    PermissionManager: typeof PermissionManager;
};
export default _default;
//# sourceMappingURL=web-contents-handlers.d.ts.map