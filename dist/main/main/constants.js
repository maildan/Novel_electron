"use strict";
/**
 * 애플리케이션 상수 및 초기 상태 정의
 *
 * Loop 6의 핵심 상수, 타입 정의, 그리고 초기 상태를 관리합니다.
 * 모든 모듈에서 공통으로 사용되는 Setup값과 열거형을 포함합니다.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATS_EXPORT_PATH = exports.STATS_DATA_PATH = exports.SETTINGS_FILE_PATH = exports.GOOGLE_DOCS_TITLE_PATTERNS = exports.GOOGLE_DOCS_URL_PATTERNS = exports.WEBSITE_URL_PATTERNS = exports.SUPPORTED_WEBSITES = exports.IPC_CHANNELS = exports.ERROR_CODES = exports.BROWSER_DISPLAY_NAMES = exports.BROWSER_PROCESS_NAMES = exports.SPECIAL_KEYS = exports.INITIAL_APP_STATE = exports.DEFAULT_SETTINGS = exports.LOGGING_CONFIG = exports.DATABASE_CONFIG = exports.KEYBOARD_CONFIG = exports.WINDOW_CONFIG = exports.GPU_CONFIG = exports.MEMORY_THRESHOLDS = exports.TIMINGS = exports.PATHS = exports.ENVIRONMENT = exports.APP_DESCRIPTION = exports.APP_NAME = exports.APP_VERSION = exports.isDev = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
// 개발 모드 확인
exports.isDev = process.env.NODE_ENV === 'development';
// 앱 버전 정보
exports.APP_VERSION = electron_1.app?.getVersion() || '6.0.0';
exports.APP_NAME = 'Loop 6';
exports.APP_DESCRIPTION = 'Advanced Typing Analysis Desktop Application';
// 환경 Setup
exports.ENVIRONMENT = {
    isDev: exports.isDev,
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.NEXT_PORT || '5500', 10),
    electronPort: parseInt(process.env.ELECTRON_PORT || '3000', 10)
};
// 파일 경로 상수 - Loop 6 자체 userData 폴더 사용
exports.PATHS = {
    get userData() {
        // Loop 6 프로젝트 내부의 userData 폴더 사용
        const projectUserData = path_1.default.join(process.cwd(), 'userData');
        return projectUserData;
    },
    get documents() { return electron_1.app?.getPath('documents') || path_1.default.join(process.cwd(), 'documents'); },
    get downloads() { return electron_1.app?.getPath('downloads') || path_1.default.join(process.cwd(), 'downloads'); },
    get temp() { return electron_1.app?.getPath('temp') || path_1.default.join(process.cwd(), 'temp'); },
    get logs() { return path_1.default.join(this.userData, 'logs'); },
    get config() { return path_1.default.join(this.userData, 'config'); },
    get database() { return path_1.default.join(this.userData, 'database'); },
    get screenshots() { return path_1.default.join(this.userData, 'screenshots'); },
    get cache() { return path_1.default.join(this.userData, 'cache'); },
    get backup() { return path_1.default.join(this.userData, 'backup'); }
};
// 타이밍 상수
exports.TIMINGS = {
    IDLE_TIMEOUT: 5000, // 5초
    MEMORY_CHECK_INTERVAL: 30000, // 30초
    BACKGROUND_ACTIVITY_INTERVAL: 10000, // 10초
    KEYBOARD_DEBOUNCE: 50, // 50ms
    UI_UPDATE_INTERVAL: 1000, // 1초
    STATS_UPDATE_INTERVAL: 5000, // 5초
    AUTOSAVE_INTERVAL: 30000, // 30초
    GC_INTERVAL: 60000, // 1분
    LOG_ROTATION_INTERVAL: 86400000, // 24시간
    SCREENSHOT_COOLDOWN: 1000, // 1초
    CLIPBOARD_WATCH_INTERVAL: 500, // 0.5초
    TRAY_UPDATE_INTERVAL: 2000, // 2초
    PERFORMANCE_MONITORING_INTERVAL: 5000 // 5초
};
// 메모리 임계값
exports.MEMORY_THRESHOLDS = {
    LOW: 50 * 1024 * 1024, // 50MB
    MEDIUM: 100 * 1024 * 1024, // 100MB
    HIGH: 150 * 1024 * 1024, // 150MB
    CRITICAL: 200 * 1024 * 1024, // 200MB
    EMERGENCY: 300 * 1024 * 1024 // 300MB
};
// GPU Setup
exports.GPU_CONFIG = {
    DEFAULT_LEVEL: 1,
    MIN_LEVEL: 0,
    MAX_LEVEL: 3,
    FALLBACK_ENABLED: true,
    DETECTION_TIMEOUT: 5000,
    INITIALIZATION_TIMEOUT: 10000
};
// 창 Setup
exports.WINDOW_CONFIG = {
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    MAX_WIDTH: 2560,
    MAX_HEIGHT: 1440,
    MINI_VIEW_WIDTH: 300,
    MINI_VIEW_HEIGHT: 200,
    MINI_VIEW_MIN_WIDTH: 200,
    MINI_VIEW_MIN_HEIGHT: 150
};
// 키보드 Setup
exports.KEYBOARD_CONFIG = {
    DEBOUNCE_TIME: 50,
    TYPING_TIMEOUT: 2000,
    IDLE_DETECTION_TIME: 5000,
    MAX_TYPING_SPEED: 300, // WPM
    MIN_TYPING_SPEED: 1, // WPM
    ACCURACY_THRESHOLD: 80 // %
};
// 데이터베이스 Setup
exports.DATABASE_CONFIG = {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
    QUERY_TIMEOUT: 10000,
    BACKUP_INTERVAL: 86400000, // 24시간
    CLEANUP_INTERVAL: 604800000, // 7일
    MAX_LOG_ENTRIES: 10000,
    MAX_STATS_ENTRIES: 5000
};
// 로깅 Setup
exports.LOGGING_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5,
    LOG_LEVEL: exports.isDev ? 'debug' : 'info',
    CONSOLE_LOG_ENABLED: true,
    FILE_LOG_ENABLED: true,
    ERROR_REPORTING_ENABLED: true
};
// 기본 Setup값
exports.DEFAULT_SETTINGS = {
    // 카테고리
    enabledCategories: {
        docs: true,
        office: true,
        coding: true,
        sns: true,
        browser: true,
        game: false,
        media: true,
        other: true
    },
    // 기본 Setup
    autoStartMonitoring: true,
    resumeAfterIdle: true,
    idleTimeout: 300,
    // UI Setup
    theme: 'system',
    windowMode: 'windowed',
    darkMode: false,
    minimizeToTray: true,
    showTrayNotifications: true,
    enableMiniView: true,
    enableAnimations: true,
    fontSize: 14,
    fontFamily: 'system-ui',
    // 성능 Setup
    useHardwareAcceleration: false,
    enableGPUAcceleration: true,
    gpuAccelerationLevel: 1,
    processingMode: 'auto',
    // 메모리 Setup
    reduceMemoryInBackground: true,
    enableMemoryOptimization: true,
    enableBackgroundCleanup: true,
    garbageCollectionInterval: 60000,
    maxMemoryThreshold: 100,
    memoryCleanupInterval: 300000,
    memoryThreshold: 80,
    // 데이터 Setup
    autoCleanupLogs: true,
    maxHistoryItems: 500,
    logRetentionDays: 30,
    enableDataCollection: true,
    enableAnalytics: false,
    dataRetentionDays: 30,
    enableAutoSave: true,
    autoSaveInterval: 10000,
    // 타이핑 Setup
    enableWPMDisplay: true,
    enableAccuracyDisplay: true,
    enableRealTimeStats: true,
    enableTypingSound: false,
    enableKeyboardShortcuts: true,
    statsFilePath: 'typing-stats.json',
    // 분석 Setup
    enableTypingAnalysis: true,
    enableRealTimeAnalysis: true,
    statsCollectionInterval: 30,
    enableKeyboardDetection: true,
    enablePatternLearning: true,
    // 키보드 Setup
    keyboard: {
        autoStart: true,
        enableHangulSupport: true,
        enableJamoTracking: true,
        hangulMode: 'auto',
        jamoSeparation: true,
        trackingInterval: 50
    },
    // 윈도우 Setup
    windowSettings: {
        miniSize: { width: 400, height: 300 },
        opacity: 1.0,
        alwaysOnTop: false,
        autoHide: false,
        position: { x: 100, y: 100 }
    },
    // 추가 윈도우 관련 Setup
    windowOpacity: 1.0,
    alwaysOnTop: false,
    // 시스템 모니터링
    enableSystemMonitoring: true,
    enablePerformanceLogging: false,
    monitoringInterval: 1000,
    enableCPUMonitoring: true,
    enableMemoryMonitoring: true,
    enableDiskMonitoring: false,
    // 알림 Setup
    enableNotifications: true,
    enableTrayNotifications: true,
    // 개발자 Setup
    enableDebugMode: exports.isDev,
    enableConsoleLogging: true,
    enableErrorReporting: true,
    logLevel: exports.isDev ? 'debug' : 'info'
};
// 초기 앱 상태
exports.INITIAL_APP_STATE = {
    // 창 관리
    mainWindow: null,
    miniViewWindow: null,
    // 추적 상태
    isTracking: false,
    isInitialized: false,
    isRestarting: false,
    inBackgroundMode: false,
    allowQuit: false,
    // 키보드
    keyboardListener: null,
    lastActiveTime: Date.now(),
    idleTime: 0,
    // 창 모드
    windowMode: 'windowed',
    autoHideToolbar: false,
    autoHideCssKey: null,
    backgroundCssKey: null,
    // 트레이
    tray: null,
    // 인터벌과 타이머
    updateInterval: null,
    miniViewStatsInterval: null,
    memoryCheckInterval: null,
    // 메모리 관리
    lastGcTime: Date.now(),
    memoryUsage: {
        lastCheck: Date.now(),
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
        external: 0,
        arrayBuffers: 0
    },
    // 통계
    currentStats: {
        keyCount: 0,
        typingTime: 0,
        startTime: null,
        lastActiveTime: null,
        currentWindow: null,
        currentBrowser: null,
        totalChars: 0,
        totalWords: 0,
        totalCharsNoSpace: 0,
        pages: 0,
        accuracy: 100,
        wpm: 0,
        session: {
            startTime: Date.now(),
            totalTime: 0,
            keystrokes: 0,
            errors: 0
        }
    },
    // 시스템 정보
    lastActiveWindowInfo: null,
    systemInfo: null,
    // GPU
    gpuEnabled: false,
    gpuResources: null,
    // 미니뷰
    miniViewLastMode: 'icon',
    // Setup
    settings: exports.DEFAULT_SETTINGS
};
// 특수키 목록
exports.SPECIAL_KEYS = [
    'Alt', 'Control', 'Shift', 'Meta', 'CapsLock', 'Tab',
    'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Home', 'PageUp', 'PageDown', 'End', 'Delete',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'ContextMenu', 'AltGraph', 'Dead',
    'Backspace', 'Enter', 'NumLock', 'NumpadEnter', 'NumpadDivide', 'NumpadMultiply',
    'NumpadSubtract', 'NumpadAdd', 'NumpadDecimal'
];
// 브라우저 프로세스 매핑
exports.BROWSER_PROCESS_NAMES = {
    'Chrome': ['chrome', 'google chrome', 'chromium'],
    'Firefox': ['firefox', 'mozilla firefox'],
    'Safari': ['safari', 'webkit'],
    'Edge': ['edge', 'msedge', 'microsoft edge'],
    'Opera': ['opera', 'operagx', 'operaair'],
    'Brave': ['brave'],
    'Vivaldi': ['vivaldi'],
    'Arc': ['arc'],
    'Whale': ['whale', 'naver whale'],
    'Yandex': ['yandex'],
    'Maxthon': ['maxthon'],
    'QQBrowser': ['qqbrowser'],
    'Tor Browser': ['tor browser', 'torbrowser'],
    'Falkon': ['falkon'],
    'Konqueror': ['konqueror'],
    'Midori': ['midori'],
    'Waterfox': ['waterfox'],
    'SeaMonkey': ['seamonkey'],
    'Pale Moon': ['palemoon'],
    'UC Browser': ['ucbrowser', 'uc browser'],
    'Coccoc': ['coccoc'],
    'Iridium': ['iridium'],
    'Slimjet': ['slimjet'],
    'Epic': ['epic'],
    'K-Meleon': ['k-meleon'],
    'Cent': ['cent browser', 'centbrowser'],
    'SRWare Iron': ['iron'],
    'Comodo Dragon': ['dragon'],
    'Sleipnir': ['sleipnir'],
    'Torch': ['torch'],
    'Basilisk': ['basilisk'],
    'Otter': ['otter browser', 'otterbrowser'],
    'Cliqz': ['cliqz'],
    'Chromodo': ['chromodo'],
    'Beaker': ['beaker'],
    'Kiwi': ['kiwi'],
    'Matter': ['matter'],
    'Maiar': ['maiar'],
    'DuckDuckGo': ['duckduckgo', 'ddg'],
    'Sidekick': ['sidekick'],
    'Min': ['min'],
    'SigmaOS': ['sigmaos'],
    'ZenBrowser': ['zenbrowser', 'zen'],
    'Orion': ['orion']
};
// 브라우저 표시 이름
exports.BROWSER_DISPLAY_NAMES = {
    'chrome': 'Google Chrome',
    'firefox': 'Mozilla Firefox',
    'msedge': 'Microsoft Edge',
    'edge': 'Microsoft Edge',
    'safari': 'Apple Safari',
    'opera': 'Opera',
    'brave': 'Brave Browser',
    'vivaldi': 'Vivaldi',
    'arc': 'Arc Browser',
    'whale': 'Naver Whale',
    'yandex': 'Yandex Browser',
    'maxthon': 'Maxthon',
    'qqbrowser': 'QQ Browser',
    'tor browser': 'Tor Browser',
    'falkon': 'Falkon',
    'konqueror': 'Konqueror',
    'midori': 'Midori',
    'waterfox': 'Waterfox',
    'seamonkey': 'SeaMonkey',
    'palemoon': 'Pale Moon',
    'ucbrowser': 'UC Browser',
    'coccoc': 'Coc Coc',
    'iridium': 'Iridium',
    'slimjet': 'Slimjet',
    'epic': 'Epic Privacy Browser',
    'k-meleon': 'K-Meleon',
    'centbrowser': 'Cent Browser',
    'iron': 'SRWare Iron',
    'dragon': 'Comodo Dragon',
    'sleipnir': 'Sleipnir',
    'torch': 'Torch Browser',
    'basilisk': 'Basilisk',
    'otterbrowser': 'Otter Browser',
    'cliqz': 'Cliqz',
    'chromodo': 'Chromodo',
    'beaker': 'Beaker Browser',
    'kiwi': 'Kiwi Browser',
    'matter': 'Matter',
    'maiar': 'Maiar',
    'duckduckgo': 'DuckDuckGo Browser',
    'sidekick': 'Sidekick Browser',
    'min': 'Min Browser',
    'sigmaos': 'SigmaOS',
    'zenbrowser': 'Zen Browser',
    'orion': 'Orion Browser'
};
// 에러 코드
exports.ERROR_CODES = {
    UNKNOWN: 'UNKNOWN_ERROR',
    INITIALIZATION: 'INITIALIZATION_ERROR',
    DATABASE: 'DATABASE_ERROR',
    KEYBOARD: 'KEYBOARD_ERROR',
    WINDOW: 'WINDOW_ERROR',
    MEMORY: 'MEMORY_ERROR',
    GPU: 'GPU_ERROR',
    NETWORK: 'NETWORK_ERROR',
    FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    CONFIGURATION: 'CONFIGURATION_ERROR'
};
// IPC 채널
exports.IPC_CHANNELS = {
    // 앱 관리
    APP_READY: 'app:ready',
    APP_QUIT: 'app:quit',
    APP_RESTART: 'app:restart',
    APP_VERSION: 'app:version',
    // 창 관리
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_FOCUS: 'window:focus',
    WINDOW_SHOW: 'window:show',
    WINDOW_HIDE: 'window:hide',
    // 키보드
    KEYBOARD_START: 'keyboard:start',
    KEYBOARD_STOP: 'keyboard:stop',
    KEYBOARD_STATS: 'keyboard:stats',
    KEYBOARD_EVENT: 'keyboard:event',
    // 메모리
    MEMORY_STATUS: 'memory:status',
    MEMORY_OPTIMIZE: 'memory:optimize',
    MEMORY_SETTINGS: 'memory:settings',
    // GPU
    GPU_STATUS: 'gpu:status',
    GPU_SETTINGS: 'gpu:settings',
    GPU_TEST: 'gpu:test',
    // 시스템
    SYSTEM_INFO: 'system:info',
    SYSTEM_PERFORMANCE: 'system:performance',
    // Setup
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_RESET: 'settings:reset',
    // 통계
    STATS_GET: 'stats:get',
    STATS_SAVE: 'stats:save',
    STATS_CLEAR: 'stats:clear',
    // 스크린샷
    SCREENSHOT_TAKE: 'screenshot:take',
    SCREENSHOT_SAVE: 'screenshot:save',
    // 클립보드
    CLIPBOARD_READ: 'clipboard:read',
    CLIPBOARD_WRITE: 'clipboard:write',
    CLIPBOARD_WATCH: 'clipboard:watch',
    // 데이터베이스
    DB_QUERY: 'db:query',
    DB_INIT: 'db:init',
    DB_BACKUP: 'db:backup',
    // 알림
    NOTIFICATION_SHOW: 'notification:show',
    NOTIFICATION_CLICK: 'notification:click',
    // 에러
    ERROR_REPORT: 'error:report',
    ERROR_LOG: 'error:log'
};
// 지원되는 웹사이트 카테고리
exports.SUPPORTED_WEBSITES = {
    // 문서 작업
    docs: [
        { pattern: 'docs.google.com/document', name: '구글 문서' },
        { pattern: 'docs.google.com/spreadsheets', name: '구글 스프레드시트' },
        { pattern: 'docs.google.com/presentation', name: '구글 프레젠테이션' },
        { pattern: 'notion.so', name: 'Notion' },
        { pattern: 'onenote.com', name: 'OneNote' },
        { pattern: 'evernote.com', name: 'Evernote' },
        { pattern: 'quip.com', name: 'Quip' },
        { pattern: 'dropbox.com/paper', name: 'Dropbox Paper' },
        { pattern: 'roamresearch.com', name: 'Roam Research' },
        { pattern: 'hackmd.io', name: 'HackMD' },
        { pattern: 'workflowy.com', name: 'WorkFlowy' },
        { pattern: 'dynalist.io', name: 'Dynalist' },
        { pattern: 'coda.io', name: 'Coda' },
        { pattern: 'obsidian.md', name: 'Obsidian' },
        { pattern: 'bear.app', name: 'Bear' },
        { pattern: 'craft.do', name: 'Craft' }
    ],
    // 오피스 웹앱
    office: [
        { pattern: 'office.com', name: 'Microsoft Office' },
        { pattern: 'office.com/word', name: 'Word 온라인' },
        { pattern: 'office.com/excel', name: 'Excel 온라인' },
        { pattern: 'office.com/powerpoint', name: 'PowerPoint 온라인' },
        { pattern: 'hancom.com', name: '한컴오피스' },
        { pattern: 'zoho.com/docs', name: 'Zoho Docs' },
        { pattern: 'zoho.com/writer', name: 'Zoho Writer' },
        { pattern: 'zoho.com/sheet', name: 'Zoho Sheet' },
        { pattern: 'zoho.com/show', name: 'Zoho Show' },
        { pattern: 'office365.com', name: 'Office 365' },
        { pattern: 'microsoft365.com', name: 'Microsoft 365' },
        { pattern: 'onedrive.com', name: 'OneDrive' },
        { pattern: 'sharepoint.com', name: 'SharePoint' },
        { pattern: 'onlyoffice.com', name: 'ONLYOFFICE' },
        { pattern: 'libreoffice.org/online', name: 'LibreOffice Online' },
        { pattern: 'cryptpad.fr', name: 'CryptPad' }
    ],
    // 코딩 관련
    coding: [
        { pattern: 'github.com', name: 'GitHub' },
        { pattern: 'gitlab.com', name: 'GitLab' },
        { pattern: 'bitbucket.org', name: 'Bitbucket' },
        { pattern: 'codesandbox.io', name: 'CodeSandbox' },
        { pattern: 'codepen.io', name: 'CodePen' },
        { pattern: 'replit.com', name: 'Replit' },
        { pattern: 'jsfiddle.net', name: 'JSFiddle' },
        { pattern: 'stackblitz.com', name: 'StackBlitz' },
        { pattern: 'playcode.io', name: 'PlayCode' },
        { pattern: 'glitch.com', name: 'Glitch' },
        { pattern: 'stackoverflow.com', name: 'Stack Overflow' },
        { pattern: 'github.dev', name: 'GitHub Dev' },
        { pattern: 'gitpod.io', name: 'Gitpod' },
        { pattern: 'vscode.dev', name: 'VS Code Web' },
        { pattern: 'observable.com', name: 'Observable' },
        { pattern: 'jupyter.org', name: 'Jupyter' },
        { pattern: 'kaggle.com', name: 'Kaggle' }
    ],
    // SNS/메신저
    sns: [
        { pattern: 'facebook.com', name: 'Facebook' },
        { pattern: 'twitter.com', name: 'Twitter' },
        { pattern: 'instagram.com', name: 'Instagram' },
        { pattern: 'slack.com', name: 'Slack' },
        { pattern: 'discord.com', name: 'Discord' },
        { pattern: 'telegram.org', name: 'Telegram' },
        { pattern: 'linkedin.com', name: 'LinkedIn' },
        { pattern: 'reddit.com', name: 'Reddit' },
        { pattern: 'pinterest.com', name: 'Pinterest' },
        { pattern: 'tumblr.com', name: 'Tumblr' },
        { pattern: 'whatsapp.com', name: 'WhatsApp' },
        { pattern: 'tiktok.com', name: 'TikTok' },
        { pattern: 'snapchat.com', name: 'Snapchat' },
        { pattern: 'teams.microsoft.com', name: 'Microsoft Teams' },
        { pattern: 'web.skype.com', name: 'Skype' },
        { pattern: 'line.me', name: 'LINE' },
        { pattern: 'kakaotalk.com', name: 'KakaoTalk' },
        { pattern: 'wechat.com', name: 'WeChat' },
        { pattern: 'weibo.com', name: 'Weibo' }
    ],
    // 이메일
    email: [
        { pattern: 'mail.google.com', name: 'Gmail' },
        { pattern: 'outlook.live.com', name: 'Outlook' },
        { pattern: 'outlook.office.com', name: 'Outlook (Office)' },
        { pattern: 'mail.yahoo.com', name: 'Yahoo Mail' },
        { pattern: 'protonmail.com', name: 'ProtonMail' },
        { pattern: 'tutanota.com', name: 'Tutanota' },
        { pattern: 'zoho.com/mail', name: 'Zoho Mail' },
        { pattern: 'mail.ru', name: 'Mail.ru' },
        { pattern: 'gmx.com', name: 'GMX' },
        { pattern: 'fastmail.com', name: 'FastMail' },
        { pattern: 'hey.com', name: 'HEY' }
    ]
};
// 웹사이트 URL 패턴 정의
exports.WEBSITE_URL_PATTERNS = {
    docs: ['docs.google.com', 'sheets.google.com', 'slides.google.com', 'notion.so', 'evernote.com', 'onenote.com', 'dropbox.com/paper', 'coda.io', 'quip.com', 'roamresearch.com'],
    office: ['office.com', 'microsoft365.com', 'onedrive.com', 'sharepoint.com', 'office365.com', 'zoho.com/docs', 'hancom.com', 'onlyoffice.com'],
    coding: ['github.com', 'stackoverflow.com', 'gitlab.com', 'bitbucket.org', 'codesandbox.io', 'replit.com', 'codepen.io', 'github.dev', 'gitpod.io'],
    sns: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'slack.com', 'discord.com', 'telegram.org', 'reddit.com'],
    email: ['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'mail.yahoo.com', 'protonmail.com']
};
// Google Docs URL 패턴
exports.GOOGLE_DOCS_URL_PATTERNS = [
    'docs.google.com/document',
    'docs.google.com/spreadsheets',
    'docs.google.com/presentation'
];
// Google Docs 제목 패턴
exports.GOOGLE_DOCS_TITLE_PATTERNS = [
    'google docs',
    'google 문서',
    'google 스프레드시트',
    'google 프레젠테이션',
    'google sheets',
    'google slides'
];
// 파일 경로 확장
exports.SETTINGS_FILE_PATH = path_1.default.join(exports.PATHS.userData, 'settings.json');
exports.STATS_DATA_PATH = path_1.default.join(exports.PATHS.userData, 'stats.json');
exports.STATS_EXPORT_PATH = path_1.default.join(exports.PATHS.userData, 'exports');
// 내보내기
exports.default = {
    APP_VERSION: exports.APP_VERSION,
    APP_NAME: exports.APP_NAME,
    APP_DESCRIPTION: exports.APP_DESCRIPTION,
    ENVIRONMENT: exports.ENVIRONMENT,
    PATHS: exports.PATHS,
    TIMINGS: exports.TIMINGS,
    MEMORY_THRESHOLDS: exports.MEMORY_THRESHOLDS,
    GPU_CONFIG: exports.GPU_CONFIG,
    WINDOW_CONFIG: exports.WINDOW_CONFIG,
    KEYBOARD_CONFIG: exports.KEYBOARD_CONFIG,
    DATABASE_CONFIG: exports.DATABASE_CONFIG,
    LOGGING_CONFIG: exports.LOGGING_CONFIG,
    DEFAULT_SETTINGS: exports.DEFAULT_SETTINGS,
    INITIAL_APP_STATE: exports.INITIAL_APP_STATE,
    SPECIAL_KEYS: exports.SPECIAL_KEYS,
    BROWSER_PROCESS_NAMES: exports.BROWSER_PROCESS_NAMES,
    BROWSER_DISPLAY_NAMES: exports.BROWSER_DISPLAY_NAMES,
    ERROR_CODES: exports.ERROR_CODES,
    IPC_CHANNELS: exports.IPC_CHANNELS
};
//# sourceMappingURL=constants.js.map