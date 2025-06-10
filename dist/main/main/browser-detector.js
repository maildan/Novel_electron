"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserDetector = exports.BrowserDetector = void 0;
exports.detectBrowserName = detectBrowserName;
exports.isGoogleDocsWindow = isGoogleDocsWindow;
const utils_1 = require("./utils");
// 상수 정의
const BROWSER_PROCESS_NAMES = {
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
const BROWSER_DISPLAY_NAMES = {
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
const WEBSITE_URL_PATTERNS = {
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
const SUPPORTED_WEBSITES = {
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
class BrowserDetector {
    constructor() {
        // 캐시 관리
        this.urlCache = new Map();
        this.URL_CACHE_MAX_SIZE = 100;
        this.URL_CACHE_TTL = 60 * 60 * 1000; // 1시간
        // 마지막 브라우저 정보 캐싱
        this.lastKnownBrowserInfo = {
            name: null,
            title: '',
            url: '',
            timestamp: 0,
            urlPatterns: []
        };
    }
    static getInstance() {
        if (!BrowserDetector.instance) {
            BrowserDetector.instance = new BrowserDetector();
        }
        return BrowserDetector.instance;
    }
    /**
     * 브라우저 감지 시스템 초기화
     */
    async initialize() {
        try {
            (0, utils_1.debugLog)('브라우저 감지 시스템 초기화 시작');
            // 플랫폼별 초기화
            if (process.platform === 'darwin') {
                await this.initializeMacOS();
            }
            else if (process.platform === 'win32') {
                await this.initializeWindows();
            }
            else {
                await this.initializeLinux();
            }
            (0, utils_1.debugLog)('브라우저 감지 시스템 초기화 완료');
            return true;
        }
        catch (error) {
            console.error('브라우저 감지 시스템 초기화 오류:', error);
            return false;
        }
    }
    /**
     * macOS 초기화
     */
    async initializeMacOS() {
        try {
            // active-win 모듈 동적 로드
            const activeWin = await Promise.resolve().then(() => __importStar(require('active-win')));
            (0, utils_1.debugLog)('macOS 브라우저 감지 모듈 로드 완료');
        }
        catch (error) {
            (0, utils_1.debugLog)('active-win 모듈 로드 실패, 폴백 모드 사용:', error);
        }
    }
    /**
     * Windows 초기화
     */
    async initializeWindows() {
        // Windows 특정 초기화 로직
        (0, utils_1.debugLog)('Windows 브라우저 감지 초기화');
    }
    /**
     * Linux 초기화
     */
    async initializeLinux() {
        // Linux 특정 초기화 로직
        (0, utils_1.debugLog)('Linux 브라우저 감지 초기화');
    }
    /**
     * 현재 활성 브라우저 이름 감지
     */
    async detectBrowserName() {
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
        }
        catch (error) {
            console.error('브라우저 이름 감지 오류:', error);
            return null;
        }
    }
    /**
     * 활성 윈도우 정보 가져오기
     */
    async getActiveWindow() {
        try {
            if (process.platform === 'darwin') {
                const activeWin = await Promise.resolve().then(() => __importStar(require('active-win')));
                const windowInfo = await activeWin();
                return windowInfo;
            }
            else {
                // Windows/Linux 구현
                return null;
            }
        }
        catch (error) {
            (0, utils_1.debugLog)('활성 윈도우 정보 가져오기 실패:', error);
            return null;
        }
    }
    /**
     * 프로세스 이름으로 브라우저 감지
     */
    detectFromProcessName(windowInfo) {
        if (!windowInfo.owner?.name) {
            return null;
        }
        const processName = windowInfo.owner.name.toLowerCase();
        return BROWSER_PROCESS_NAMES[processName] || null;
    }
    /**
     * Bundle ID로 브라우저 감지 (macOS)
     */
    detectFromBundleId(bundleId) {
        const bundleMap = {
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
    detectFromTitle(title) {
        const titleParts = title.split(' - ');
        const lastPart = titleParts[titleParts.length - 1];
        if (lastPart && Object.values(BROWSER_DISPLAY_NAMES).some(name => lastPart.includes(name))) {
            const siteName = titleParts[0];
            for (const [key, patterns] of Object.entries(SUPPORTED_WEBSITES)) {
                if (Array.isArray(patterns)) {
                    const matches = patterns.some(pattern => typeof pattern.pattern === 'string' &&
                        siteName.toLowerCase().includes(pattern.pattern.toLowerCase()));
                    if (matches) {
                        (0, utils_1.debugLog)(`타이틀 기반 웹사이트 감지: ${key}`);
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
    async isGoogleDocsWindow() {
        try {
            const windowInfo = await this.getActiveWindow();
            if (!windowInfo) {
                return false;
            }
            // 제목에서 Google Docs 패턴 확인
            if (windowInfo.title) {
                const titleMatch = GOOGLE_DOCS_TITLE_PATTERNS.some(pattern => pattern.test(windowInfo.title));
                if (titleMatch) {
                    return true;
                }
            }
            // URL에서 Google Docs 패턴 확인 (가능한 경우)
            if (windowInfo.url) {
                const urlMatch = GOOGLE_DOCS_URL_PATTERNS.some(pattern => pattern.test(windowInfo.url));
                if (urlMatch) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Google Docs 윈도우 감지 오류:', error);
            return false;
        }
    }
    /**
     * URL 패턴 감지
     */
    detectUrlPatterns(urlString) {
        if (!urlString) {
            return [];
        }
        const patterns = [];
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
        }
        catch (error) {
            (0, utils_1.debugLog)('URL 패턴 감지 오류:', error);
        }
        return patterns;
    }
    /**
     * URL 캐시 관리
     */
    cacheUrl(url, category) {
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
    getCachedUrlCategory(url) {
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
    updateBrowserInfo(info) {
        this.lastKnownBrowserInfo = {
            ...this.lastKnownBrowserInfo,
            ...info,
            timestamp: Date.now()
        };
    }
    /**
     * 마지막 브라우저 정보 조회
     */
    getLastKnownBrowserInfo() {
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
     * 캐시 정리
     */
    clearCache() {
        this.urlCache.clear();
        (0, utils_1.debugLog)('브라우저 감지 캐시 정리 완료');
    }
    /**
     * 정리 작업
     */
    cleanup() {
        this.clearCache();
        (0, utils_1.debugLog)('브라우저 감지 시스템 정리 완료');
    }
    /**
     * 활성 브라우저 정보 가져오기
     */
    async getActiveBrowser() {
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
        }
        catch (error) {
            console.error('활성 브라우저 감지 오류:', error);
            return null;
        }
    }
    /**
     * 설치된 브라우저 목록 가져오기
     */
    async getInstalledBrowsers() {
        try {
            // 설치된 브라우저 감지 로직
            return Object.values(BROWSER_PROCESS_NAMES);
        }
        catch (error) {
            console.error('설치된 브라우저 목록 가져오기 오류:', error);
            return [];
        }
    }
    /**
     * Google Docs 감지
     */
    async detectGoogleDocs() {
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
        }
        catch (error) {
            console.error('Google Docs 감지 오류:', error);
            return false;
        }
    }
    /**
     * 설정 업데이트
     */
    async updateSettings(settings) {
        try {
            // 설정 업데이트 로직
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 모듈 재시작
     */
    async restart() {
        // 재시작 로직
        await this.initialize();
    }
    /**
     * 초기화 상태 확인
     */
    isInitialized() {
        return true; // 간단한 구현
    }
}
exports.BrowserDetector = BrowserDetector;
// 단일 인스턴스 export
exports.browserDetector = BrowserDetector.getInstance();
exports.default = exports.browserDetector;
// 호환성을 위한 함수 export
async function detectBrowserName() {
    return exports.browserDetector.detectBrowserName();
}
async function isGoogleDocsWindow() {
    return exports.browserDetector.isGoogleDocsWindow();
}
//# sourceMappingURL=browser-detector.js.map