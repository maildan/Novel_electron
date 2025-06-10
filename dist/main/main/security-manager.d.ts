/**
 * 보안 설정 관리 모듈
 *
 * Electron 앱의 보안 헤더, CSP(Content Security Policy), 요청 필터링 등을 관리합니다.
 * 개발 환경과 프로덕션 환경에서 다른 보안 정책을 적용합니다.
 */
import { BrowserWindow } from 'electron';
export interface SecurityConfig {
    csp: {
        enabled: boolean;
        strictMode: boolean;
        allowUnsafeInline: boolean;
        allowUnsafeEval: boolean;
        allowedDomains: string[];
    };
    headers: {
        enabled: boolean;
        xFrameOptions: string;
        xContentTypeOptions: string;
        xXSSProtection: string;
    };
    navigation: {
        restrictExternalNavigation: boolean;
        allowedProtocols: string[];
        allowedDomains: string[];
    };
    windows: {
        restrictWindowOpen: boolean;
        allowedProtocols: string[];
    };
}
export interface IMEState {
    isComposing: boolean;
    lastCompletedText: string;
    compositionStart?: number;
    lastTimestamp?: number;
}
/**
 * 보안 관리자 클래스
 */
export declare class SecurityManager {
    private config;
    private imeState;
    private isInitialized;
    constructor(config?: Partial<SecurityConfig>);
    /**
     * 보안 관리자 초기화
     */
    initialize(): Promise<boolean>;
    /**
     * 특정 창에 대한 요청 보안 검사 설정
     */
    setupRequestSecurity(window: BrowserWindow): boolean;
    /**
     * CSP 업데이트
     */
    updateCSP(newConfig: Partial<SecurityConfig['csp']>): boolean;
    /**
     * IME 상태 가져오기
     */
    getIMEState(): IMEState;
    /**
     * IME 상태 초기화
     */
    resetIMEState(): void;
    /**
     * 기본 설정 가져오기
     */
    private getDefaultConfig;
    /**
     * 설정 병합
     */
    private mergeConfig;
    /**
     * CSP 문자열 생성
     */
    private generateCSPString;
    /**
     * 보안 헤더 생성
     */
    private getSecurityHeaders;
    /**
     * 보안 헤더 적용
     */
    private applySecurityHeaders;
    /**
     * 특정 세션에 CSP 등록
     */
    private registerCSPForSession;
    /**
     * 모든 세션에 CSP 적용
     */
    private applyCSPToAllSessions;
    /**
     * 웹 콘텐츠 보안 설정
     */
    private setupWebContentsSecurity;
    /**
     * URL이 창 열기에 허용되는지 확인
     */
    private isUrlAllowedForWindow;
    /**
     * URL이 네비게이션에 허용되는지 확인
     */
    private isUrlAllowedForNavigation;
    /**
     * 키보드 이벤트 핸들러 설정
     */
    private setupKeyboardEventHandlers;
    /**
     * 기존 키보드 핸들러 제거
     */
    private removeExistingKeyboardHandlers;
}
/**
 * 보안 관리자 인스턴스 가져오기
 */
export declare function getSecurityManager(config?: Partial<SecurityConfig>): SecurityManager;
/**
 * 편의 함수들
 */
export declare const security: {
    /**
     * 보안 관리자 초기화
     */
    initialize(config?: Partial<SecurityConfig>): Promise<boolean>;
    /**
     * 특정 창에 요청 보안 설정
     */
    setupRequestSecurity(window: BrowserWindow): boolean;
    /**
     * CSP 업데이트
     */
    updateCSP(newConfig: Partial<SecurityConfig["csp"]>): boolean;
    /**
     * IME 상태 가져오기
     */
    getIMEState(): IMEState;
    /**
     * IME 상태 초기화
     */
    resetIMEState(): void;
};
export default security;
//# sourceMappingURL=security-manager.d.ts.map