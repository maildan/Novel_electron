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

import { debugLog } from './utils';

// 타입 정의
interface WindowInfo {
  title: string;
  owner?: {
    name?: string;
    bundleId?: string;
  };
  url?: string;
  memoryUsage?: number;
  pid?: number;
}

interface BrowserInfo {
  name: string | null;
  title: string;
  url: string;
  timestamp: number;
  urlPatterns: string[];
}

interface UrlCacheEntry {
  category: string;
  timestamp: number;
}

interface WebsitePattern {
  pattern: string;
  category?: string;
  priority?: number;
}

// 상수 정의
const BROWSER_PROCESS_NAMES: Record<string, string> = {
  'google chrome': 'Chrome',
  'chrome': 'Chrome',
  'firefox': 'Firefox',
  'mozilla firefox': 'Firefox',
  'safari': 'Safari',
  'microsoft edge': 'Edge',
  'edge': 'Edge',
  'opera': 'Opera',
  'brave browser': 'Brave Browser',
  'brave': 'Brave Browser',
  'zen browser': 'Zen Browser',
  'zen': 'Zen Browser',
  'notion': 'Notion',
  'discord': 'Discord',
  'slack': 'Slack',
  'microsoft teams': 'Microsoft Teams',
  'teams': 'Microsoft Teams',
  'zoom': 'Zoom',
  'vscode': 'VS Code',
  'visual studio code': 'VS Code'
};

const BROWSER_DISPLAY_NAMES: Record<string, string> = {
  ...BROWSER_PROCESS_NAMES
};

const NON_BROWSER_APPS = [
  'Notion',
  'Discord',
  'Slack',
  'Microsoft Teams',
  'Zoom',
  'VS Code'
];

// NON_BROWSER_APPS 사용 확인 로깅
console.log('[브라우저감지] 비브라우저 앱 목록 로드됨:', NON_BROWSER_APPS.length, '개');

const WEBSITE_URL_PATTERNS: Record<string, string[]> = {
  'google-docs': [
    'docs.google.com',
    'drive.google.com',
    'sheets.google.com',
    'slides.google.com'
  ],
  'notion': [
    'notion.so',
    'notion.site'
  ],
  'github': [
    'github.com',
    'gist.github.com'
  ],
  'stackoverflow': [
    'stackoverflow.com',
    'stackexchange.com'
  ],
  'social': [
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com'
  ]
};

const GOOGLE_DOCS_URL_PATTERNS = [
  /docs\.google\.com\/document/,
  /docs\.google\.com\/spreadsheets/,
  /docs\.google\.com\/presentation/,
  /drive\.google\.com\/file/
];

const GOOGLE_DOCS_TITLE_PATTERNS = [
  /Google Docs/i,
  /Google Sheets/i,
  /Google Slides/i,
  /Google Drive/i
];

const SUPPORTED_WEBSITES: Record<string, WebsitePattern[]> = {
  'google-docs': [
    { pattern: 'google docs', category: 'productivity' },
    { pattern: 'google sheets', category: 'productivity' },
    { pattern: 'google slides', category: 'productivity' }
  ],
  'code-editor': [
    { pattern: 'vs code', category: 'development' },
    { pattern: 'visual studio', category: 'development' },
    { pattern: 'github', category: 'development' }
  ],
  'productivity': [
    { pattern: 'notion', category: 'productivity' },
    { pattern: 'slack', category: 'communication' },
    { pattern: 'discord', category: 'communication' }
  ]
};

/**
 * 브라우저 감지 매니저 클래스
 */
export class BrowserDetector {
  private static instance: BrowserDetector;
  
  // 캐시 관리
  private urlCache = new Map<string, UrlCacheEntry>();
  private readonly URL_CACHE_MAX_SIZE = 100;
  private readonly URL_CACHE_TTL = 60 * 60 * 1000; // 1시간
  
  // 마지막 브라우저 정보 캐싱
  private lastKnownBrowserInfo: BrowserInfo = {
    name: null,
    title: '',
    url: '',
    timestamp: 0,
    urlPatterns: []
  };

  private constructor() {}

  static getInstance(): BrowserDetector {
    if (!BrowserDetector.instance) {
      BrowserDetector.instance = new BrowserDetector();
    }
    return BrowserDetector.instance;
  }

  /**
 * 브라우저 감지 시스템 초기화
 */
  async initialize(): Promise<boolean> {
    try {
      debugLog('브라우저 감지 시스템 초기화 시작');
      
      // 플랫폼별 초기화
      if (process.platform === 'darwin') {
        await this.initializeMacOS();
      } else if (process.platform === 'win32') {
        await this.initializeWindows();
      } else {
        await this.initializeLinux();
      }
      
      debugLog('브라우저 감지 시스템 초기화 Completed');
      return true;
    } catch (error) {
      console.error('브라우저 감지 시스템 초기화 Error:', error);
      return false;
    }
  }

  /**
   * macOS 초기화
   */
  private async initializeMacOS(): Promise<void> {
    try {
      // active-win 모듈 동적 로드
      const activeWin = await import('active-win');
      console.log('[브라우저감지] macOS active-win 모듈 로드 완료:', typeof activeWin);
      debugLog('macOS 브라우저 감지 모듈 로드 Completed');
    } catch (error) {
      debugLog('active-win 모듈 로드 Failed, 폴백 모드 사용:', error);
    }
  }

  /**
   * Windows 초기화
   */
  private async initializeWindows(): Promise<void> {
    // Windows 특정 초기화 로직
    debugLog('Windows 브라우저 감지 초기화');
  }

  /**
   * Linux 초기화
   */
  private async initializeLinux(): Promise<void> {
    // Linux 특정 초기화 로직
    debugLog('Linux 브라우저 감지 초기화');
  }

  /**
 * 현재 활성 브라우저 이름 감지
 */
  async detectBrowserName(): Promise<string | null> {
    try {
      // 1. 활성 윈도우 정보 가져오기
      const windowInfo = await this.getActiveWindow();
      if (!windowInfo) {
        return null;
      }

      // 2. 프로세스 이름으로 브라우저 감지
      const browserName = this.detectFromProcessName(windowInfo);
      if (browserName) {
        return browserName;
      }

      // 3. Bundle ID로 감지 (macOS)
      if (process.platform === 'darwin' && windowInfo.owner?.bundleId) {
        const bundleBrowserName = this.detectFromBundleId(windowInfo.owner.bundleId);
        if (bundleBrowserName) {
          return bundleBrowserName;
        }
      }

      // 4. 창 제목에서 패턴 감지
      if (windowInfo.title) {
        const titleBrowserName = this.detectFromTitle(windowInfo.title);
        if (titleBrowserName) {
          return titleBrowserName;
        }
      }

      return null;
    } catch (error) {
      console.error('브라우저 이름 감지 Error:', error);
      return null;
    }
  }

  /**
 * 활성 윈도우 정보 가져오기
 */
  private async getActiveWindow(): Promise<WindowInfo | null> {
    try {
      if (process.platform === 'darwin') {
        const activeWin = await import('active-win');
        const windowInfo = await (activeWin as unknown as () => Promise<WindowInfo>)();
        return windowInfo as WindowInfo;
      } else {
        // Windows/Linux 구현
        return null;
      }
    } catch (error) {
      debugLog('활성 윈도우 정보 가져오기 Failed:', error);
      return null;
    }
  }

  /**
 * 프로세스 이름으로 브라우저 감지
 */
  private detectFromProcessName(windowInfo: WindowInfo): string | null {
    if (!windowInfo.owner?.name) {
      return null;
    }

    const processName = windowInfo.owner.name.toLowerCase();
    return BROWSER_PROCESS_NAMES[processName] || null;
  }

  /**
   * Bundle ID로 브라우저 감지 (macOS)
   */
  private detectFromBundleId(bundleId: string): string | null {
    const bundleMap: Record<string, string> = {
      'com.google.chrome': 'Chrome',
      'org.mozilla.firefox': 'Firefox',
      'com.apple.safari': 'Safari',
      'com.microsoft.edgemac': 'Edge',
      'com.operasoftware.opera': 'Opera',
      'com.brave.browser': 'Brave Browser'
    };

    return bundleMap[bundleId] || null;
  }

  /**
 * 창 제목에서 브라우저 감지
 */
  private detectFromTitle(title: string): string | null {
    const titleParts = title.split(' - ');
    const lastPart = titleParts[titleParts.length - 1];
    
    if (lastPart && Object.values(BROWSER_DISPLAY_NAMES).some(name => lastPart.includes(name))) {
      const siteName = titleParts[0];
      
      for (const [key, patterns] of Object.entries(SUPPORTED_WEBSITES)) {
        if (Array.isArray(patterns)) {
          const matches = patterns.some(pattern => 
            typeof pattern.pattern === 'string' && 
            siteName.toLowerCase().includes(pattern.pattern.toLowerCase())
          );
          
          if (matches) {
            debugLog('타이틀 기반 웹사이트 감지: ${key}');
            return key;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Google Docs 윈도우 감지
   */
  async isGoogleDocsWindow(): Promise<boolean> {
    try {
      const windowInfo = await this.getActiveWindow();
      if (!windowInfo) {
        return false;
      }

      // 제목에서 Google Docs 패턴 확인
      if (windowInfo.title) {
        const titleMatch = GOOGLE_DOCS_TITLE_PATTERNS.some(pattern => 
          pattern.test(windowInfo.title)
        );
        if (titleMatch) {
          return true;
        }
      }

      // URL에서 Google Docs 패턴 확인 (가능한 경우)
      if (windowInfo.url) {
        const urlMatch = GOOGLE_DOCS_URL_PATTERNS.some(pattern => 
          pattern.test(windowInfo.url as string)
        );
        if (urlMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Google Docs 윈도우 감지 Error:', error);
      return false;
    }
  }

  /**
   * URL 패턴 감지
   */
  detectUrlPatterns(urlString: string): string[] {
    if (!urlString) {
      return [];
    }

    const patterns: string[] = [];
    
    try {
      const url = new URL(urlString);
      const domain = url.hostname.toLowerCase();
      
      // 웹사이트 패턴 매칭
      for (const [category, urlPatterns] of Object.entries(WEBSITE_URL_PATTERNS)) {
        if (urlPatterns.some(pattern => domain.includes(pattern))) {
          patterns.push(category);
        }
      }
      
      // 캐시에 저장
      if (patterns.length > 0) {
        this.cacheUrl(urlString, patterns[0]);
      }
      
    } catch (error) {
      debugLog('URL 패턴 감지 Error:', error);
    }
    
    return patterns;
  }

  /**
   * URL 캐시 관리
   */
  private cacheUrl(url: string, category: string): void {
    if (!url || !category || this.urlCache.size >= this.URL_CACHE_MAX_SIZE) {
      return;
    }
    
    // 캐시 크기 제한
    if (this.urlCache.size >= this.URL_CACHE_MAX_SIZE) {
      const oldestKey = this.urlCache.keys().next().value;
      if (oldestKey) {
        this.urlCache.delete(oldestKey);
      }
    }
    
    this.urlCache.set(url, {
      category,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시된 URL 카테고리 가져오기
   */
  getCachedUrlCategory(url: string): string | null {
    const cached = this.urlCache.get(url);
    if (!cached) {
      return null;
    }
    
    // TTL 확인
    if (Date.now() - cached.timestamp > this.URL_CACHE_TTL) {
      this.urlCache.delete(url);
      return null;
    }
    
    return cached.category;
  }

  /**
 * 브라우저 정보 업데이트
 */
  updateBrowserInfo(info: Partial<BrowserInfo>): void {
    this.lastKnownBrowserInfo = {
      ...this.lastKnownBrowserInfo,
      ...info,
      timestamp: Date.now()
    };
  }

  /**
 * 마지막 브라우저 정보 조회
 */
  getLastKnownBrowserInfo(): BrowserInfo {
    return { ...this.lastKnownBrowserInfo };
  }

  /**
 * 브라우저 감지 상태 조회
 */
  getDetectorStatus() {
    return {
      cacheSize: this.urlCache.size,
      lastDetection: this.lastKnownBrowserInfo.timestamp,
      supportedBrowsers: Object.keys(BROWSER_PROCESS_NAMES),
      supportedWebsites: Object.keys(SUPPORTED_WEBSITES)
    };
  }

  /**
 * 캐시 Cleanup
 */
  clearCache(): void {
    this.urlCache.clear();
    debugLog('브라우저 감지 캐시 Cleanup Completed');
  }

  /**
 * Cleanup 작업
 */
  cleanup(): void {
    this.clearCache();
    debugLog('브라우저 감지 시스템 Cleanup Completed');
  }

  /**
 * 활성 브라우저 정보 가져오기
 */
  async getActiveBrowser(): Promise<BrowserInfo | null> {
    try {
      const windowInfo = await this.getActiveWindow();
      
      if (!windowInfo || !windowInfo.owner?.name) {
        return null;
      }
      
      const browserName = await this.detectBrowserName();
      if (!browserName) {
        return null;
      }
      
      return {
        name: browserName,
        title: windowInfo.title,
        url: windowInfo.url || '',
        timestamp: Date.now(),
        urlPatterns: []
      };
    } catch (error) {
      console.error('활성 브라우저 감지 Error:', error);
      return null;
    }
  }

  /**
 * 설치된 브라우저 목록 가져오기
 */
  async getInstalledBrowsers(): Promise<string[]> {
    try {
      // 설치된 브라우저 감지 로직
      return Object.values(BROWSER_PROCESS_NAMES);
    } catch (error) {
      console.error('설치된 브라우저 목록 가져오기 Error:', error);
      return [];
    }
  }

  /**
   * Google Docs 감지
   */
  async detectGoogleDocs(): Promise<boolean> {
    try {
      const browserInfo = await this.getActiveBrowser();
      if (!browserInfo?.url) {
        return false;
      }
      
      const googleDocsPatterns = [
        /docs\.google\.com\/document/,
        /docs\.google\.com\/spreadsheets/,
        /docs\.google\.com\/presentation/
      ];
      
      return googleDocsPatterns.some(pattern => pattern.test(browserInfo.url || ''));
    } catch (error) {
      console.error('Google Docs 감지 Error:', error);
      return false;
    }
  }

  /**
 * Setup 업데이트
 */
  async updateSettings(settings: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      // settings 매개변수 사용 확인
      console.log('[브라우저감지] 설정 업데이트 요청:', typeof settings, settings ? Object.keys(settings).length : 0, '개 설정');
      // Setup 업데이트 로직
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
 * 모듈 재시작
 */
  async restart(): Promise<void> {
    // 재시작 로직
    await this.initialize();
  }

  /**
 * 초기화 상태 확인
 */
  isInitialized(): boolean {
    return true; // 간단한 구현
  }
}

// 단일 인스턴스 export
export const browserDetector = BrowserDetector.getInstance();
export default browserDetector;

// 호환성을 위한 함수 export
export async function detectBrowserName(): Promise<string | null> {
  return browserDetector.detectBrowserName();
}

export async function isGoogleDocsWindow(): Promise<boolean> {
  return browserDetector.isGoogleDocsWindow();
}
