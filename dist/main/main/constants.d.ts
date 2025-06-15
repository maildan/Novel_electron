/**
 * 애플리케이션 상수 및 초기 상태 정의
 *
 * Loop 6의 핵심 상수, 타입 정의, 그리고 초기 상태를 관리합니다.
 * 모든 모듈에서 공통으로 사용되는 Setup값과 열거형을 포함합니다.
 */
export declare const isDev: boolean;
export declare const APP_VERSION: string;
export declare const APP_NAME = "Loop 6";
export declare const APP_DESCRIPTION = "Advanced Typing Analysis Desktop Application";
export declare const ENVIRONMENT: {
    readonly isDev: boolean;
    readonly isProduction: boolean;
    readonly isTest: boolean;
    readonly nodeEnv: string;
    readonly port: number;
    readonly electronPort: number;
};
export declare const PATHS: {
    readonly userData: string;
    readonly documents: string;
    readonly downloads: string;
    readonly temp: string;
    readonly logs: string;
    readonly config: string;
    readonly database: string;
    readonly screenshots: string;
    readonly cache: string;
    readonly backup: string;
};
export declare const TIMINGS: {
    readonly IDLE_TIMEOUT: 5000;
    readonly MEMORY_CHECK_INTERVAL: 30000;
    readonly BACKGROUND_ACTIVITY_INTERVAL: 10000;
    readonly KEYBOARD_DEBOUNCE: 50;
    readonly UI_UPDATE_INTERVAL: 1000;
    readonly STATS_UPDATE_INTERVAL: 5000;
    readonly AUTOSAVE_INTERVAL: 30000;
    readonly GC_INTERVAL: 60000;
    readonly LOG_ROTATION_INTERVAL: 86400000;
    readonly SCREENSHOT_COOLDOWN: 1000;
    readonly CLIPBOARD_WATCH_INTERVAL: 500;
    readonly TRAY_UPDATE_INTERVAL: 2000;
    readonly PERFORMANCE_MONITORING_INTERVAL: 5000;
};
export declare const MEMORY_THRESHOLDS: {
    readonly LOW: number;
    readonly MEDIUM: number;
    readonly HIGH: number;
    readonly CRITICAL: number;
    readonly EMERGENCY: number;
};
export declare const GPU_CONFIG: {
    readonly DEFAULT_LEVEL: 1;
    readonly MIN_LEVEL: 0;
    readonly MAX_LEVEL: 3;
    readonly FALLBACK_ENABLED: true;
    readonly DETECTION_TIMEOUT: 5000;
    readonly INITIALIZATION_TIMEOUT: 10000;
};
export declare const WINDOW_CONFIG: {
    readonly MIN_WIDTH: 800;
    readonly MIN_HEIGHT: 600;
    readonly DEFAULT_WIDTH: 1200;
    readonly DEFAULT_HEIGHT: 800;
    readonly MAX_WIDTH: 2560;
    readonly MAX_HEIGHT: 1440;
    readonly MINI_VIEW_WIDTH: 300;
    readonly MINI_VIEW_HEIGHT: 200;
    readonly MINI_VIEW_MIN_WIDTH: 200;
    readonly MINI_VIEW_MIN_HEIGHT: 150;
};
export declare const KEYBOARD_CONFIG: {
    readonly DEBOUNCE_TIME: 50;
    readonly TYPING_TIMEOUT: 2000;
    readonly IDLE_DETECTION_TIME: 5000;
    readonly MAX_TYPING_SPEED: 300;
    readonly MIN_TYPING_SPEED: 1;
    readonly ACCURACY_THRESHOLD: 80;
};
export declare const DATABASE_CONFIG: {
    readonly MAX_CONNECTIONS: 10;
    readonly CONNECTION_TIMEOUT: 5000;
    readonly QUERY_TIMEOUT: 10000;
    readonly BACKUP_INTERVAL: 86400000;
    readonly CLEANUP_INTERVAL: 604800000;
    readonly MAX_LOG_ENTRIES: 10000;
    readonly MAX_STATS_ENTRIES: 5000;
};
export declare const LOGGING_CONFIG: {
    readonly MAX_FILE_SIZE: number;
    readonly MAX_FILES: 5;
    readonly LOG_LEVEL: "debug" | "info";
    readonly CONSOLE_LOG_ENABLED: true;
    readonly FILE_LOG_ENABLED: true;
    readonly ERROR_REPORTING_ENABLED: true;
};
export type WindowModeType = 'windowed' | 'fullscreen' | 'maximized' | 'fullscreen-auto-hide';
export type ProcessingModeType = 'auto' | 'normal' | 'cpu-intensive' | 'gpu-intensive';
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';
export type ThemeType = 'light' | 'dark' | 'system';
export type GPUModeType = 'auto' | 'software' | 'hardware';
export interface AppCategories {
    docs: boolean;
    office: boolean;
    coding: boolean;
    sns: boolean;
    browser: boolean;
    game: boolean;
    media: boolean;
    other: boolean;
}
export interface TypingStats {
    keyCount: number;
    typingTime: number;
    startTime: number | null;
    lastActiveTime: number | null;
    currentWindow: string | null;
    currentBrowser: string | null;
    totalChars: number;
    totalWords: number;
    totalCharsNoSpace: number;
    pages: number;
    accuracy: number;
    wpm: number;
    session: {
        startTime: number;
        totalTime: number;
        keystrokes: number;
        errors: number;
    };
}
export interface MemoryInfo {
    lastCheck: number;
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    arrayBuffers: number;
}
export interface SystemInfo {
    platform: string;
    arch: string;
    version: string;
    totalMemory: number;
    freeMemory: number;
    cpuUsage: number;
    uptime: number;
}
export interface AppState {
    mainWindow: Electron.BrowserWindow | null;
    miniViewWindow: Electron.BrowserWindow | null;
    isTracking: boolean;
    isInitialized: boolean;
    isRestarting: boolean;
    inBackgroundMode: boolean;
    allowQuit: boolean;
    keyboardListener: any;
    lastActiveTime: number;
    idleTime: number;
    windowMode: WindowModeType;
    autoHideToolbar: boolean;
    autoHideCssKey: string | null;
    backgroundCssKey: string | null;
    tray: Electron.Tray | null;
    updateInterval: NodeJS.Timeout | null;
    miniViewStatsInterval: NodeJS.Timeout | null;
    memoryCheckInterval: NodeJS.Timeout | null;
    lastGcTime: number;
    memoryUsage: MemoryInfo;
    currentStats: TypingStats;
    lastActiveWindowInfo: any;
    systemInfo: SystemInfo | null;
    gpuEnabled: boolean;
    gpuResources: any;
    miniViewLastMode: 'icon' | 'normal';
    settings: AppSettings;
}
export interface AppSettings {
    enabledCategories: AppCategories;
    autoStartMonitoring: boolean;
    resumeAfterIdle: boolean;
    idleTimeout: number;
    theme: ThemeType;
    windowMode: WindowModeType;
    darkMode: boolean;
    minimizeToTray: boolean;
    showTrayNotifications: boolean;
    enableMiniView: boolean;
    enableAnimations: boolean;
    fontSize: number;
    fontFamily: string;
    useHardwareAcceleration: boolean;
    enableGPUAcceleration: boolean;
    gpuAccelerationLevel: number;
    processingMode: ProcessingModeType;
    reduceMemoryInBackground: boolean;
    enableMemoryOptimization: boolean;
    enableBackgroundCleanup: boolean;
    garbageCollectionInterval: number;
    maxMemoryThreshold: number;
    memoryCleanupInterval: number;
    memoryThreshold: number;
    autoCleanupLogs: boolean;
    maxHistoryItems: number;
    logRetentionDays: number;
    enableDataCollection: boolean;
    enableAnalytics: boolean;
    dataRetentionDays: number;
    enableAutoSave: boolean;
    autoSaveInterval: number;
    enableWPMDisplay: boolean;
    enableAccuracyDisplay: boolean;
    enableRealTimeStats: boolean;
    enableTypingSound: boolean;
    enableKeyboardShortcuts: boolean;
    statsFilePath: string;
    enableTypingAnalysis: boolean;
    enableRealTimeAnalysis: boolean;
    statsCollectionInterval: number;
    enableKeyboardDetection: boolean;
    enablePatternLearning: boolean;
    keyboard: {
        autoStart: boolean;
        enableHangulSupport: boolean;
        enableJamoTracking: boolean;
        hangulMode: 'auto' | 'force' | 'disable';
        jamoSeparation: boolean;
        trackingInterval: number;
    };
    windowSettings: {
        miniSize: {
            width: number;
            height: number;
        };
        opacity: number;
        alwaysOnTop: boolean;
        autoHide: boolean;
        position: {
            x: number;
            y: number;
        };
    };
    windowOpacity: number;
    alwaysOnTop: boolean;
    enableSystemMonitoring: boolean;
    enablePerformanceLogging: boolean;
    monitoringInterval: number;
    enableCPUMonitoring: boolean;
    enableMemoryMonitoring: boolean;
    enableDiskMonitoring: boolean;
    enableNotifications: boolean;
    enableTrayNotifications: boolean;
    enableDebugMode: boolean;
    enableConsoleLogging: boolean;
    enableErrorReporting: boolean;
    logLevel: LogLevelType;
}
export declare const DEFAULT_SETTINGS: AppSettings;
export declare const INITIAL_APP_STATE: AppState;
export declare const SPECIAL_KEYS: readonly ["Alt", "Control", "Shift", "Meta", "CapsLock", "Tab", "Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "PrintScreen", "ScrollLock", "Pause", "Insert", "Home", "PageUp", "PageDown", "End", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ContextMenu", "AltGraph", "Dead", "Backspace", "Enter", "NumLock", "NumpadEnter", "NumpadDivide", "NumpadMultiply", "NumpadSubtract", "NumpadAdd", "NumpadDecimal"];
export declare const BROWSER_PROCESS_NAMES: {
    readonly Chrome: readonly ["chrome", "google chrome", "chromium"];
    readonly Firefox: readonly ["firefox", "mozilla firefox"];
    readonly Safari: readonly ["safari", "webkit"];
    readonly Edge: readonly ["edge", "msedge", "microsoft edge"];
    readonly Opera: readonly ["opera", "operagx", "operaair"];
    readonly Brave: readonly ["brave"];
    readonly Vivaldi: readonly ["vivaldi"];
    readonly Arc: readonly ["arc"];
    readonly Whale: readonly ["whale", "naver whale"];
    readonly Yandex: readonly ["yandex"];
    readonly Maxthon: readonly ["maxthon"];
    readonly QQBrowser: readonly ["qqbrowser"];
    readonly 'Tor Browser': readonly ["tor browser", "torbrowser"];
    readonly Falkon: readonly ["falkon"];
    readonly Konqueror: readonly ["konqueror"];
    readonly Midori: readonly ["midori"];
    readonly Waterfox: readonly ["waterfox"];
    readonly SeaMonkey: readonly ["seamonkey"];
    readonly 'Pale Moon': readonly ["palemoon"];
    readonly 'UC Browser': readonly ["ucbrowser", "uc browser"];
    readonly Coccoc: readonly ["coccoc"];
    readonly Iridium: readonly ["iridium"];
    readonly Slimjet: readonly ["slimjet"];
    readonly Epic: readonly ["epic"];
    readonly 'K-Meleon': readonly ["k-meleon"];
    readonly Cent: readonly ["cent browser", "centbrowser"];
    readonly 'SRWare Iron': readonly ["iron"];
    readonly 'Comodo Dragon': readonly ["dragon"];
    readonly Sleipnir: readonly ["sleipnir"];
    readonly Torch: readonly ["torch"];
    readonly Basilisk: readonly ["basilisk"];
    readonly Otter: readonly ["otter browser", "otterbrowser"];
    readonly Cliqz: readonly ["cliqz"];
    readonly Chromodo: readonly ["chromodo"];
    readonly Beaker: readonly ["beaker"];
    readonly Kiwi: readonly ["kiwi"];
    readonly Matter: readonly ["matter"];
    readonly Maiar: readonly ["maiar"];
    readonly DuckDuckGo: readonly ["duckduckgo", "ddg"];
    readonly Sidekick: readonly ["sidekick"];
    readonly Min: readonly ["min"];
    readonly SigmaOS: readonly ["sigmaos"];
    readonly ZenBrowser: readonly ["zenbrowser", "zen"];
    readonly Orion: readonly ["orion"];
};
export declare const BROWSER_DISPLAY_NAMES: {
    readonly chrome: "Google Chrome";
    readonly firefox: "Mozilla Firefox";
    readonly msedge: "Microsoft Edge";
    readonly edge: "Microsoft Edge";
    readonly safari: "Apple Safari";
    readonly opera: "Opera";
    readonly brave: "Brave Browser";
    readonly vivaldi: "Vivaldi";
    readonly arc: "Arc Browser";
    readonly whale: "Naver Whale";
    readonly yandex: "Yandex Browser";
    readonly maxthon: "Maxthon";
    readonly qqbrowser: "QQ Browser";
    readonly 'tor browser': "Tor Browser";
    readonly falkon: "Falkon";
    readonly konqueror: "Konqueror";
    readonly midori: "Midori";
    readonly waterfox: "Waterfox";
    readonly seamonkey: "SeaMonkey";
    readonly palemoon: "Pale Moon";
    readonly ucbrowser: "UC Browser";
    readonly coccoc: "Coc Coc";
    readonly iridium: "Iridium";
    readonly slimjet: "Slimjet";
    readonly epic: "Epic Privacy Browser";
    readonly 'k-meleon': "K-Meleon";
    readonly centbrowser: "Cent Browser";
    readonly iron: "SRWare Iron";
    readonly dragon: "Comodo Dragon";
    readonly sleipnir: "Sleipnir";
    readonly torch: "Torch Browser";
    readonly basilisk: "Basilisk";
    readonly otterbrowser: "Otter Browser";
    readonly cliqz: "Cliqz";
    readonly chromodo: "Chromodo";
    readonly beaker: "Beaker Browser";
    readonly kiwi: "Kiwi Browser";
    readonly matter: "Matter";
    readonly maiar: "Maiar";
    readonly duckduckgo: "DuckDuckGo Browser";
    readonly sidekick: "Sidekick Browser";
    readonly min: "Min Browser";
    readonly sigmaos: "SigmaOS";
    readonly zenbrowser: "Zen Browser";
    readonly orion: "Orion Browser";
};
export declare const ERROR_CODES: {
    readonly UNKNOWN: "UNKNOWN_ERROR";
    readonly INITIALIZATION: "INITIALIZATION_ERROR";
    readonly DATABASE: "DATABASE_ERROR";
    readonly KEYBOARD: "KEYBOARD_ERROR";
    readonly WINDOW: "WINDOW_ERROR";
    readonly MEMORY: "MEMORY_ERROR";
    readonly GPU: "GPU_ERROR";
    readonly NETWORK: "NETWORK_ERROR";
    readonly FILE_SYSTEM: "FILE_SYSTEM_ERROR";
    readonly PERMISSION: "PERMISSION_ERROR";
    readonly CONFIGURATION: "CONFIGURATION_ERROR";
};
export declare const IPC_CHANNELS: {
    readonly APP_READY: "app:ready";
    readonly APP_QUIT: "app:quit";
    readonly APP_RESTART: "app:restart";
    readonly APP_VERSION: "app:version";
    readonly WINDOW_MINIMIZE: "window:minimize";
    readonly WINDOW_MAXIMIZE: "window:maximize";
    readonly WINDOW_CLOSE: "window:close";
    readonly WINDOW_FOCUS: "window:focus";
    readonly WINDOW_SHOW: "window:show";
    readonly WINDOW_HIDE: "window:hide";
    readonly KEYBOARD_START: "keyboard:start";
    readonly KEYBOARD_STOP: "keyboard:stop";
    readonly KEYBOARD_STATS: "keyboard:stats";
    readonly KEYBOARD_EVENT: "keyboard:event";
    readonly MEMORY_STATUS: "memory:status";
    readonly MEMORY_OPTIMIZE: "memory:optimize";
    readonly MEMORY_SETTINGS: "memory:settings";
    readonly GPU_STATUS: "gpu:status";
    readonly GPU_SETTINGS: "gpu:settings";
    readonly GPU_TEST: "gpu:test";
    readonly SYSTEM_INFO: "system:info";
    readonly SYSTEM_PERFORMANCE: "system:performance";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_SET: "settings:set";
    readonly SETTINGS_RESET: "settings:reset";
    readonly STATS_GET: "stats:get";
    readonly STATS_SAVE: "stats:save";
    readonly STATS_CLEAR: "stats:clear";
    readonly SCREENSHOT_TAKE: "screenshot:take";
    readonly SCREENSHOT_SAVE: "screenshot:save";
    readonly CLIPBOARD_READ: "clipboard:read";
    readonly CLIPBOARD_WRITE: "clipboard:write";
    readonly CLIPBOARD_WATCH: "clipboard:watch";
    readonly DB_QUERY: "db:query";
    readonly DB_INIT: "db:init";
    readonly DB_BACKUP: "db:backup";
    readonly NOTIFICATION_SHOW: "notification:show";
    readonly NOTIFICATION_CLICK: "notification:click";
    readonly ERROR_REPORT: "error:report";
    readonly ERROR_LOG: "error:log";
};
export declare const SUPPORTED_WEBSITES: {
    readonly docs: readonly [{
        readonly pattern: "docs.google.com/document";
        readonly name: "구글 문서";
    }, {
        readonly pattern: "docs.google.com/spreadsheets";
        readonly name: "구글 스프레드시트";
    }, {
        readonly pattern: "docs.google.com/presentation";
        readonly name: "구글 프레젠테이션";
    }, {
        readonly pattern: "notion.so";
        readonly name: "Notion";
    }, {
        readonly pattern: "onenote.com";
        readonly name: "OneNote";
    }, {
        readonly pattern: "evernote.com";
        readonly name: "Evernote";
    }, {
        readonly pattern: "quip.com";
        readonly name: "Quip";
    }, {
        readonly pattern: "dropbox.com/paper";
        readonly name: "Dropbox Paper";
    }, {
        readonly pattern: "roamresearch.com";
        readonly name: "Roam Research";
    }, {
        readonly pattern: "hackmd.io";
        readonly name: "HackMD";
    }, {
        readonly pattern: "workflowy.com";
        readonly name: "WorkFlowy";
    }, {
        readonly pattern: "dynalist.io";
        readonly name: "Dynalist";
    }, {
        readonly pattern: "coda.io";
        readonly name: "Coda";
    }, {
        readonly pattern: "obsidian.md";
        readonly name: "Obsidian";
    }, {
        readonly pattern: "bear.app";
        readonly name: "Bear";
    }, {
        readonly pattern: "craft.do";
        readonly name: "Craft";
    }];
    readonly office: readonly [{
        readonly pattern: "office.com";
        readonly name: "Microsoft Office";
    }, {
        readonly pattern: "office.com/word";
        readonly name: "Word 온라인";
    }, {
        readonly pattern: "office.com/excel";
        readonly name: "Excel 온라인";
    }, {
        readonly pattern: "office.com/powerpoint";
        readonly name: "PowerPoint 온라인";
    }, {
        readonly pattern: "hancom.com";
        readonly name: "한컴오피스";
    }, {
        readonly pattern: "zoho.com/docs";
        readonly name: "Zoho Docs";
    }, {
        readonly pattern: "zoho.com/writer";
        readonly name: "Zoho Writer";
    }, {
        readonly pattern: "zoho.com/sheet";
        readonly name: "Zoho Sheet";
    }, {
        readonly pattern: "zoho.com/show";
        readonly name: "Zoho Show";
    }, {
        readonly pattern: "office365.com";
        readonly name: "Office 365";
    }, {
        readonly pattern: "microsoft365.com";
        readonly name: "Microsoft 365";
    }, {
        readonly pattern: "onedrive.com";
        readonly name: "OneDrive";
    }, {
        readonly pattern: "sharepoint.com";
        readonly name: "SharePoint";
    }, {
        readonly pattern: "onlyoffice.com";
        readonly name: "ONLYOFFICE";
    }, {
        readonly pattern: "libreoffice.org/online";
        readonly name: "LibreOffice Online";
    }, {
        readonly pattern: "cryptpad.fr";
        readonly name: "CryptPad";
    }];
    readonly coding: readonly [{
        readonly pattern: "github.com";
        readonly name: "GitHub";
    }, {
        readonly pattern: "gitlab.com";
        readonly name: "GitLab";
    }, {
        readonly pattern: "bitbucket.org";
        readonly name: "Bitbucket";
    }, {
        readonly pattern: "codesandbox.io";
        readonly name: "CodeSandbox";
    }, {
        readonly pattern: "codepen.io";
        readonly name: "CodePen";
    }, {
        readonly pattern: "replit.com";
        readonly name: "Replit";
    }, {
        readonly pattern: "jsfiddle.net";
        readonly name: "JSFiddle";
    }, {
        readonly pattern: "stackblitz.com";
        readonly name: "StackBlitz";
    }, {
        readonly pattern: "playcode.io";
        readonly name: "PlayCode";
    }, {
        readonly pattern: "glitch.com";
        readonly name: "Glitch";
    }, {
        readonly pattern: "stackoverflow.com";
        readonly name: "Stack Overflow";
    }, {
        readonly pattern: "github.dev";
        readonly name: "GitHub Dev";
    }, {
        readonly pattern: "gitpod.io";
        readonly name: "Gitpod";
    }, {
        readonly pattern: "vscode.dev";
        readonly name: "VS Code Web";
    }, {
        readonly pattern: "observable.com";
        readonly name: "Observable";
    }, {
        readonly pattern: "jupyter.org";
        readonly name: "Jupyter";
    }, {
        readonly pattern: "kaggle.com";
        readonly name: "Kaggle";
    }];
    readonly sns: readonly [{
        readonly pattern: "facebook.com";
        readonly name: "Facebook";
    }, {
        readonly pattern: "twitter.com";
        readonly name: "Twitter";
    }, {
        readonly pattern: "instagram.com";
        readonly name: "Instagram";
    }, {
        readonly pattern: "slack.com";
        readonly name: "Slack";
    }, {
        readonly pattern: "discord.com";
        readonly name: "Discord";
    }, {
        readonly pattern: "telegram.org";
        readonly name: "Telegram";
    }, {
        readonly pattern: "linkedin.com";
        readonly name: "LinkedIn";
    }, {
        readonly pattern: "reddit.com";
        readonly name: "Reddit";
    }, {
        readonly pattern: "pinterest.com";
        readonly name: "Pinterest";
    }, {
        readonly pattern: "tumblr.com";
        readonly name: "Tumblr";
    }, {
        readonly pattern: "whatsapp.com";
        readonly name: "WhatsApp";
    }, {
        readonly pattern: "tiktok.com";
        readonly name: "TikTok";
    }, {
        readonly pattern: "snapchat.com";
        readonly name: "Snapchat";
    }, {
        readonly pattern: "teams.microsoft.com";
        readonly name: "Microsoft Teams";
    }, {
        readonly pattern: "web.skype.com";
        readonly name: "Skype";
    }, {
        readonly pattern: "line.me";
        readonly name: "LINE";
    }, {
        readonly pattern: "kakaotalk.com";
        readonly name: "KakaoTalk";
    }, {
        readonly pattern: "wechat.com";
        readonly name: "WeChat";
    }, {
        readonly pattern: "weibo.com";
        readonly name: "Weibo";
    }];
    readonly email: readonly [{
        readonly pattern: "mail.google.com";
        readonly name: "Gmail";
    }, {
        readonly pattern: "outlook.live.com";
        readonly name: "Outlook";
    }, {
        readonly pattern: "outlook.office.com";
        readonly name: "Outlook (Office)";
    }, {
        readonly pattern: "mail.yahoo.com";
        readonly name: "Yahoo Mail";
    }, {
        readonly pattern: "protonmail.com";
        readonly name: "ProtonMail";
    }, {
        readonly pattern: "tutanota.com";
        readonly name: "Tutanota";
    }, {
        readonly pattern: "zoho.com/mail";
        readonly name: "Zoho Mail";
    }, {
        readonly pattern: "mail.ru";
        readonly name: "Mail.ru";
    }, {
        readonly pattern: "gmx.com";
        readonly name: "GMX";
    }, {
        readonly pattern: "fastmail.com";
        readonly name: "FastMail";
    }, {
        readonly pattern: "hey.com";
        readonly name: "HEY";
    }];
};
export declare const WEBSITE_URL_PATTERNS: {
    readonly docs: readonly ["docs.google.com", "sheets.google.com", "slides.google.com", "notion.so", "evernote.com", "onenote.com", "dropbox.com/paper", "coda.io", "quip.com", "roamresearch.com"];
    readonly office: readonly ["office.com", "microsoft365.com", "onedrive.com", "sharepoint.com", "office365.com", "zoho.com/docs", "hancom.com", "onlyoffice.com"];
    readonly coding: readonly ["github.com", "stackoverflow.com", "gitlab.com", "bitbucket.org", "codesandbox.io", "replit.com", "codepen.io", "github.dev", "gitpod.io"];
    readonly sns: readonly ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "slack.com", "discord.com", "telegram.org", "reddit.com"];
    readonly email: readonly ["mail.google.com", "outlook.live.com", "outlook.office.com", "mail.yahoo.com", "protonmail.com"];
};
export declare const GOOGLE_DOCS_URL_PATTERNS: readonly ["docs.google.com/document", "docs.google.com/spreadsheets", "docs.google.com/presentation"];
export declare const GOOGLE_DOCS_TITLE_PATTERNS: readonly ["google docs", "google 문서", "google 스프레드시트", "google 프레젠테이션", "google sheets", "google slides"];
export declare const SETTINGS_FILE_PATH: string;
export declare const STATS_DATA_PATH: string;
export declare const STATS_EXPORT_PATH: string;
declare const _default: {
    APP_VERSION: string;
    APP_NAME: string;
    APP_DESCRIPTION: string;
    ENVIRONMENT: {
        readonly isDev: boolean;
        readonly isProduction: boolean;
        readonly isTest: boolean;
        readonly nodeEnv: string;
        readonly port: number;
        readonly electronPort: number;
    };
    PATHS: {
        readonly userData: string;
        readonly documents: string;
        readonly downloads: string;
        readonly temp: string;
        readonly logs: string;
        readonly config: string;
        readonly database: string;
        readonly screenshots: string;
        readonly cache: string;
        readonly backup: string;
    };
    TIMINGS: {
        readonly IDLE_TIMEOUT: 5000;
        readonly MEMORY_CHECK_INTERVAL: 30000;
        readonly BACKGROUND_ACTIVITY_INTERVAL: 10000;
        readonly KEYBOARD_DEBOUNCE: 50;
        readonly UI_UPDATE_INTERVAL: 1000;
        readonly STATS_UPDATE_INTERVAL: 5000;
        readonly AUTOSAVE_INTERVAL: 30000;
        readonly GC_INTERVAL: 60000;
        readonly LOG_ROTATION_INTERVAL: 86400000;
        readonly SCREENSHOT_COOLDOWN: 1000;
        readonly CLIPBOARD_WATCH_INTERVAL: 500;
        readonly TRAY_UPDATE_INTERVAL: 2000;
        readonly PERFORMANCE_MONITORING_INTERVAL: 5000;
    };
    MEMORY_THRESHOLDS: {
        readonly LOW: number;
        readonly MEDIUM: number;
        readonly HIGH: number;
        readonly CRITICAL: number;
        readonly EMERGENCY: number;
    };
    GPU_CONFIG: {
        readonly DEFAULT_LEVEL: 1;
        readonly MIN_LEVEL: 0;
        readonly MAX_LEVEL: 3;
        readonly FALLBACK_ENABLED: true;
        readonly DETECTION_TIMEOUT: 5000;
        readonly INITIALIZATION_TIMEOUT: 10000;
    };
    WINDOW_CONFIG: {
        readonly MIN_WIDTH: 800;
        readonly MIN_HEIGHT: 600;
        readonly DEFAULT_WIDTH: 1200;
        readonly DEFAULT_HEIGHT: 800;
        readonly MAX_WIDTH: 2560;
        readonly MAX_HEIGHT: 1440;
        readonly MINI_VIEW_WIDTH: 300;
        readonly MINI_VIEW_HEIGHT: 200;
        readonly MINI_VIEW_MIN_WIDTH: 200;
        readonly MINI_VIEW_MIN_HEIGHT: 150;
    };
    KEYBOARD_CONFIG: {
        readonly DEBOUNCE_TIME: 50;
        readonly TYPING_TIMEOUT: 2000;
        readonly IDLE_DETECTION_TIME: 5000;
        readonly MAX_TYPING_SPEED: 300;
        readonly MIN_TYPING_SPEED: 1;
        readonly ACCURACY_THRESHOLD: 80;
    };
    DATABASE_CONFIG: {
        readonly MAX_CONNECTIONS: 10;
        readonly CONNECTION_TIMEOUT: 5000;
        readonly QUERY_TIMEOUT: 10000;
        readonly BACKUP_INTERVAL: 86400000;
        readonly CLEANUP_INTERVAL: 604800000;
        readonly MAX_LOG_ENTRIES: 10000;
        readonly MAX_STATS_ENTRIES: 5000;
    };
    LOGGING_CONFIG: {
        readonly MAX_FILE_SIZE: number;
        readonly MAX_FILES: 5;
        readonly LOG_LEVEL: "debug" | "info";
        readonly CONSOLE_LOG_ENABLED: true;
        readonly FILE_LOG_ENABLED: true;
        readonly ERROR_REPORTING_ENABLED: true;
    };
    DEFAULT_SETTINGS: AppSettings;
    INITIAL_APP_STATE: AppState;
    SPECIAL_KEYS: readonly ["Alt", "Control", "Shift", "Meta", "CapsLock", "Tab", "Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "PrintScreen", "ScrollLock", "Pause", "Insert", "Home", "PageUp", "PageDown", "End", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ContextMenu", "AltGraph", "Dead", "Backspace", "Enter", "NumLock", "NumpadEnter", "NumpadDivide", "NumpadMultiply", "NumpadSubtract", "NumpadAdd", "NumpadDecimal"];
    BROWSER_PROCESS_NAMES: {
        readonly Chrome: readonly ["chrome", "google chrome", "chromium"];
        readonly Firefox: readonly ["firefox", "mozilla firefox"];
        readonly Safari: readonly ["safari", "webkit"];
        readonly Edge: readonly ["edge", "msedge", "microsoft edge"];
        readonly Opera: readonly ["opera", "operagx", "operaair"];
        readonly Brave: readonly ["brave"];
        readonly Vivaldi: readonly ["vivaldi"];
        readonly Arc: readonly ["arc"];
        readonly Whale: readonly ["whale", "naver whale"];
        readonly Yandex: readonly ["yandex"];
        readonly Maxthon: readonly ["maxthon"];
        readonly QQBrowser: readonly ["qqbrowser"];
        readonly 'Tor Browser': readonly ["tor browser", "torbrowser"];
        readonly Falkon: readonly ["falkon"];
        readonly Konqueror: readonly ["konqueror"];
        readonly Midori: readonly ["midori"];
        readonly Waterfox: readonly ["waterfox"];
        readonly SeaMonkey: readonly ["seamonkey"];
        readonly 'Pale Moon': readonly ["palemoon"];
        readonly 'UC Browser': readonly ["ucbrowser", "uc browser"];
        readonly Coccoc: readonly ["coccoc"];
        readonly Iridium: readonly ["iridium"];
        readonly Slimjet: readonly ["slimjet"];
        readonly Epic: readonly ["epic"];
        readonly 'K-Meleon': readonly ["k-meleon"];
        readonly Cent: readonly ["cent browser", "centbrowser"];
        readonly 'SRWare Iron': readonly ["iron"];
        readonly 'Comodo Dragon': readonly ["dragon"];
        readonly Sleipnir: readonly ["sleipnir"];
        readonly Torch: readonly ["torch"];
        readonly Basilisk: readonly ["basilisk"];
        readonly Otter: readonly ["otter browser", "otterbrowser"];
        readonly Cliqz: readonly ["cliqz"];
        readonly Chromodo: readonly ["chromodo"];
        readonly Beaker: readonly ["beaker"];
        readonly Kiwi: readonly ["kiwi"];
        readonly Matter: readonly ["matter"];
        readonly Maiar: readonly ["maiar"];
        readonly DuckDuckGo: readonly ["duckduckgo", "ddg"];
        readonly Sidekick: readonly ["sidekick"];
        readonly Min: readonly ["min"];
        readonly SigmaOS: readonly ["sigmaos"];
        readonly ZenBrowser: readonly ["zenbrowser", "zen"];
        readonly Orion: readonly ["orion"];
    };
    BROWSER_DISPLAY_NAMES: {
        readonly chrome: "Google Chrome";
        readonly firefox: "Mozilla Firefox";
        readonly msedge: "Microsoft Edge";
        readonly edge: "Microsoft Edge";
        readonly safari: "Apple Safari";
        readonly opera: "Opera";
        readonly brave: "Brave Browser";
        readonly vivaldi: "Vivaldi";
        readonly arc: "Arc Browser";
        readonly whale: "Naver Whale";
        readonly yandex: "Yandex Browser";
        readonly maxthon: "Maxthon";
        readonly qqbrowser: "QQ Browser";
        readonly 'tor browser': "Tor Browser";
        readonly falkon: "Falkon";
        readonly konqueror: "Konqueror";
        readonly midori: "Midori";
        readonly waterfox: "Waterfox";
        readonly seamonkey: "SeaMonkey";
        readonly palemoon: "Pale Moon";
        readonly ucbrowser: "UC Browser";
        readonly coccoc: "Coc Coc";
        readonly iridium: "Iridium";
        readonly slimjet: "Slimjet";
        readonly epic: "Epic Privacy Browser";
        readonly 'k-meleon': "K-Meleon";
        readonly centbrowser: "Cent Browser";
        readonly iron: "SRWare Iron";
        readonly dragon: "Comodo Dragon";
        readonly sleipnir: "Sleipnir";
        readonly torch: "Torch Browser";
        readonly basilisk: "Basilisk";
        readonly otterbrowser: "Otter Browser";
        readonly cliqz: "Cliqz";
        readonly chromodo: "Chromodo";
        readonly beaker: "Beaker Browser";
        readonly kiwi: "Kiwi Browser";
        readonly matter: "Matter";
        readonly maiar: "Maiar";
        readonly duckduckgo: "DuckDuckGo Browser";
        readonly sidekick: "Sidekick Browser";
        readonly min: "Min Browser";
        readonly sigmaos: "SigmaOS";
        readonly zenbrowser: "Zen Browser";
        readonly orion: "Orion Browser";
    };
    ERROR_CODES: {
        readonly UNKNOWN: "UNKNOWN_ERROR";
        readonly INITIALIZATION: "INITIALIZATION_ERROR";
        readonly DATABASE: "DATABASE_ERROR";
        readonly KEYBOARD: "KEYBOARD_ERROR";
        readonly WINDOW: "WINDOW_ERROR";
        readonly MEMORY: "MEMORY_ERROR";
        readonly GPU: "GPU_ERROR";
        readonly NETWORK: "NETWORK_ERROR";
        readonly FILE_SYSTEM: "FILE_SYSTEM_ERROR";
        readonly PERMISSION: "PERMISSION_ERROR";
        readonly CONFIGURATION: "CONFIGURATION_ERROR";
    };
    IPC_CHANNELS: {
        readonly APP_READY: "app:ready";
        readonly APP_QUIT: "app:quit";
        readonly APP_RESTART: "app:restart";
        readonly APP_VERSION: "app:version";
        readonly WINDOW_MINIMIZE: "window:minimize";
        readonly WINDOW_MAXIMIZE: "window:maximize";
        readonly WINDOW_CLOSE: "window:close";
        readonly WINDOW_FOCUS: "window:focus";
        readonly WINDOW_SHOW: "window:show";
        readonly WINDOW_HIDE: "window:hide";
        readonly KEYBOARD_START: "keyboard:start";
        readonly KEYBOARD_STOP: "keyboard:stop";
        readonly KEYBOARD_STATS: "keyboard:stats";
        readonly KEYBOARD_EVENT: "keyboard:event";
        readonly MEMORY_STATUS: "memory:status";
        readonly MEMORY_OPTIMIZE: "memory:optimize";
        readonly MEMORY_SETTINGS: "memory:settings";
        readonly GPU_STATUS: "gpu:status";
        readonly GPU_SETTINGS: "gpu:settings";
        readonly GPU_TEST: "gpu:test";
        readonly SYSTEM_INFO: "system:info";
        readonly SYSTEM_PERFORMANCE: "system:performance";
        readonly SETTINGS_GET: "settings:get";
        readonly SETTINGS_SET: "settings:set";
        readonly SETTINGS_RESET: "settings:reset";
        readonly STATS_GET: "stats:get";
        readonly STATS_SAVE: "stats:save";
        readonly STATS_CLEAR: "stats:clear";
        readonly SCREENSHOT_TAKE: "screenshot:take";
        readonly SCREENSHOT_SAVE: "screenshot:save";
        readonly CLIPBOARD_READ: "clipboard:read";
        readonly CLIPBOARD_WRITE: "clipboard:write";
        readonly CLIPBOARD_WATCH: "clipboard:watch";
        readonly DB_QUERY: "db:query";
        readonly DB_INIT: "db:init";
        readonly DB_BACKUP: "db:backup";
        readonly NOTIFICATION_SHOW: "notification:show";
        readonly NOTIFICATION_CLICK: "notification:click";
        readonly ERROR_REPORT: "error:report";
        readonly ERROR_LOG: "error:log";
    };
};
export default _default;
//# sourceMappingURL=constants.d.ts.map