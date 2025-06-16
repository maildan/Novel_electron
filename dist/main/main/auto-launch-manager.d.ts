/**
 * 시스템 자동 시작 관리 모듈
 *
 * 애플리케이션이 시스템 시작 시 자동으로 실행되도록 Setup합니다.
 * 다양한 운영체제에서 작동하는 자동 시작 기능을 제공합니다.
 */
export interface AutoLaunchSettings {
    enabled: boolean;
    startMinimized: boolean;
    path?: string;
}
export interface AutoLaunchStatus {
    isEnabled: boolean;
    isSupported: boolean;
    path: string | null;
    error?: string;
}
/**
 * 자동 시작 관리자 클래스
 */
export declare class AutoLaunchManager {
    private appName;
    private executablePath;
    private isInitialized;
    constructor();
    /**
   * 자동 시작 관리자 초기화
   */
    initialize(): Promise<boolean>;
    /**
   * 자동 시작 활성화
   */
    enable(settings?: Partial<AutoLaunchSettings>): Promise<boolean>;
    /**
   * 자동 시작 비활성화
   */
    disable(): Promise<boolean>;
    /**
   * 자동 시작 상태 확인
   */
    getStatus(): Promise<AutoLaunchStatus>;
    /**
   * 자동 시작 Setup 토글
   */
    toggle(settings?: Partial<AutoLaunchSettings>): Promise<boolean>;
    /**
   * 실행 파일 경로 가져오기
   */
    private getExecutablePath;
    /**
   * 플랫폼 지원 여부 확인
   */
    private isPlatformSupported;
    /**
   * 플랫폼별 자동 시작 활성화
   */
    private enableForPlatform;
    /**
   * 플랫폼별 자동 시작 비활성화
   */
    private disableForPlatform;
    /**
   * 플랫폼별 자동 시작 상태 확인
   */
    private checkStatusForPlatform;
    /**
     * Windows 자동 시작 활성화
     */
    private enableWindows;
    /**
     * Windows 자동 시작 비활성화
     */
    private disableWindows;
    /**
     * Windows 자동 시작 상태 확인
     */
    private checkStatusWindows;
    /**
     * macOS 자동 시작 활성화
     */
    private enableMacOS;
    /**
     * macOS 자동 시작 비활성화
     */
    private disableMacOS;
    /**
     * macOS 자동 시작 상태 확인
     */
    private checkStatusMacOS;
    /**
     * Linux 자동 시작 활성화
     */
    private enableLinux;
    /**
     * Linux 자동 시작 비활성화
     */
    private disableLinux;
    /**
     * Linux 자동 시작 상태 확인
     */
    private checkStatusLinux;
}
/**
 * 자동 시작 관리자 인스턴스 가져오기
 */
export declare function getAutoLaunchManager(): AutoLaunchManager;
/**
 * 편의 함수들
 */
export declare const autoLaunch: {
    /**
   * 자동 시작 초기화
   */
    initialize(): Promise<boolean>;
    /**
   * 자동 시작 활성화
   */
    enable(settings?: Partial<AutoLaunchSettings>): Promise<boolean>;
    /**
   * 자동 시작 비활성화
   */
    disable(): Promise<boolean>;
    /**
   * 자동 시작 상태 확인
   */
    getStatus(): Promise<AutoLaunchStatus>;
    /**
   * 자동 시작 토글
   */
    toggle(settings?: Partial<AutoLaunchSettings>): Promise<boolean>;
};
export default autoLaunch;
//# sourceMappingURL=auto-launch-manager.d.ts.map