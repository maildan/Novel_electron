/**
 * 브라우저 감지 시스템 (TypeScript)
 *
 * 기능:
 * - 활성 브라우저 및 웹사이트 감지
 * - Google Docs 특별 처리
 * - URL 패턴 매칭
 * - 브라우저별 최적화
 * - 크로스 플랫폼 지원
 */
interface BrowserInfo {
    name: string | null;
    title: string;
    url: string;
    timestamp: number;
    urlPatterns: string[];
}
/**
 * 브라우저 감지 매니저 클래스
 */
export declare class BrowserDetector {
    private static instance;
    private urlCache;
    private readonly URL_CACHE_MAX_SIZE;
    private readonly URL_CACHE_TTL;
    private lastKnownBrowserInfo;
    private constructor();
    static getInstance(): BrowserDetector;
    /**
   * 브라우저 감지 시스템 초기화
   */
    initialize(): Promise<boolean>;
    /**
     * macOS 초기화
     */
    private initializeMacOS;
    /**
     * Windows 초기화
     */
    private initializeWindows;
    /**
     * Linux 초기화
     */
    private initializeLinux;
    /**
   * 현재 활성 브라우저 이름 감지
   */
    detectBrowserName(): Promise<string | null>;
    /**
   * 활성 윈도우 정보 가져오기
   */
    private getActiveWindow;
    /**
   * 프로세스 이름으로 브라우저 감지
   */
    private detectFromProcessName;
    /**
     * Bundle ID로 브라우저 감지 (macOS)
     */
    private detectFromBundleId;
    /**
   * 창 제목에서 브라우저 감지
   */
    private detectFromTitle;
    /**
     * Google Docs 윈도우 감지
     */
    isGoogleDocsWindow(): Promise<boolean>;
    /**
     * URL 패턴 감지
     */
    detectUrlPatterns(urlString: string): string[];
    /**
     * URL 캐시 관리
     */
    private cacheUrl;
    /**
     * 캐시된 URL 카테고리 가져오기
     */
    getCachedUrlCategory(url: string): string | null;
    /**
   * 브라우저 정보 업데이트
   */
    updateBrowserInfo(info: Partial<BrowserInfo>): void;
    /**
   * 마지막 브라우저 정보 조회
   */
    getLastKnownBrowserInfo(): BrowserInfo;
    /**
   * 브라우저 감지 상태 조회
   */
    getDetectorStatus(): {
        cacheSize: number;
        lastDetection: number;
        supportedBrowsers: string[];
        supportedWebsites: string[];
    };
    /**
   * 캐시 Cleanup
   */
    clearCache(): void;
    /**
   * Cleanup 작업
   */
    cleanup(): void;
    /**
   * 활성 브라우저 정보 가져오기
   */
    getActiveBrowser(): Promise<BrowserInfo | null>;
    /**
   * 설치된 브라우저 목록 가져오기
   */
    getInstalledBrowsers(): Promise<string[]>;
    /**
     * Google Docs 감지
     */
    detectGoogleDocs(): Promise<boolean>;
    /**
   * Setup 업데이트
   */
    updateSettings(settings: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
   * 모듈 재시작
   */
    restart(): Promise<void>;
    /**
   * 초기화 상태 확인
   */
    isInitialized(): boolean;
}
export declare const browserDetector: BrowserDetector;
export default browserDetector;
export declare function detectBrowserName(): Promise<string | null>;
export declare function isGoogleDocsWindow(): Promise<boolean>;
//# sourceMappingURL=browser-detector.d.ts.map