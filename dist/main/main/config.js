"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
const path_1 = require("path");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
class AppConfig {
    // version 별칭 추가
    static get version() {
        return this.APP_VERSION;
    }
    // isDev 별칭 추가
    static get isDev() {
        return electron_is_dev_1.default;
    }
    // port 별칭 추가
    static get port() {
        return this.NEXT_PORT;
    }
    // 호환성을 위한 속성들
    static get isDevelopment() {
        return electron_is_dev_1.default;
    }
    static get isProduction() {
        return !electron_is_dev_1.default;
    }
    static get nextUrl() {
        // 정적 모드인지 확인
        const isStatic = process.env.ELECTRON_STATIC === 'true' || !electron_is_dev_1.default;
        if (isStatic) {
            // 환경변수로 정적 서버 URL이 Setup되어 있으면 사용
            return process.env.STATIC_SERVER_URL || `http://localhost:${this.NEXT_PORT}`;
        }
        else {
            // 개발 모드에서는 Next.js 서버 사용
            return `http://localhost:${this.NEXT_PORT}`;
        }
    }
    static get(key) {
        return this.configStore.get(key);
    }
    static set(key, value) {
        this.configStore.set(key, value);
    }
    static getAll() {
        return Object.fromEntries(this.configStore);
    }
    static reset() {
        this.configStore.clear();
    }
}
exports.AppConfig = AppConfig;
_a = AppConfig;
AppConfig.APP_NAME = 'Loop';
AppConfig.APP_VERSION = '6.0.0';
AppConfig.NEXT_PORT = process.env.NEXT_PORT || '5500';
AppConfig.DATABASE_PATH = electron_is_dev_1.default
    ? (0, path_1.join)(process.cwd(), 'prisma', 'dev.db')
    : (0, path_1.join)(process.resourcesPath, 'data', 'app.db');
AppConfig.NATIVE_MODULE_PATH = electron_is_dev_1.default
    ? (0, path_1.join)(process.cwd(), 'native-modules', 'target', 'debug')
    : (0, path_1.join)(process.resourcesPath, 'native-modules');
AppConfig.LOG_PATH = electron_is_dev_1.default
    ? (0, path_1.join)(process.cwd(), 'logs')
    : (0, path_1.join)(process.resourcesPath, 'logs');
AppConfig.WINDOW_CONFIG = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // 로딩 Completed 후 표시
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: (0, path_1.join)(__dirname, 'preload.js'), // Loop 6 preload 스크립트
        webSecurity: !electron_is_dev_1.default,
        allowRunningInsecureContent: electron_is_dev_1.default,
        // 메모리 최적화 Setup
        backgroundThrottling: true, // 백그라운드 스로틀링 활성화
        v8CacheOptions: 'none', // V8 캐시 비활성화
        enableWebSQL: false, // WebSQL 비활성화
        disableBlinkFeatures: 'Auxclick', // 불필요한 Blink 기능 비활성화
        experimentalFeatures: false, // 실험적 기능 비활성화
        enablePreferredSizeMode: false, // 선호 크기 모드 비활성화
        spellcheck: false, // 맞춤법 검사 비활성화
        offscreen: false, // 오프스크린 렌더링 비활성화
        additionalArguments: [
            '--max-old-space-size=256', // V8 힙 크기 제한
            '--max-semi-space-size=8', // 세미 스페이스 크기 제한
            '--memory-pressure-off', // 메모리 압력 감지 끄기
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-features=VizDisplayCompositor',
        ]
    }
};
AppConfig.KEYBOARD_CONFIG = {
    enableHook: true,
    captureModifiers: true,
    captureSpecialKeys: true,
    bufferSize: 1000,
    flushInterval: 100 // ms
};
AppConfig.MEMORY_CONFIG = {
    optimizationInterval: 30000, // 30초
    thresholdMB: 200,
    aggressiveThresholdMB: 500,
    enableAutoOptimization: true
};
AppConfig.SYSTEM_MONITOR_CONFIG = {
    updateInterval: 1000, // 1초
    historyLength: 300, // 5분 (300초)
    enableCpuMonitoring: true,
    enableMemoryMonitoring: true,
    enableGpuMonitoring: true
};
// 추가 구성 객체들
AppConfig.memory = {
    threshold: 200, // MB
    forceGcThreshold: 500, // MB
    cleanupInterval: 300000 // 5분
};
AppConfig.monitoring = {
    thresholds: {
        cpu: {
            warning: 70, // %
            critical: 85 // %
        },
        memory: {
            warning: 75, // %
            critical: 90 // %
        },
        gpu: {
            warning: 80, // %
            critical: 95 // %
        }
    }
};
AppConfig.gpu = {
    mode: process.env.GPU_MODE || 'hardware'
};
AppConfig.server = {
    url: `http://localhost:${_a.NEXT_PORT}`
};
AppConfig.development = {
    openDevTools: true
};
// Setup 관리 메서드들
AppConfig.configStore = new Map();
//# sourceMappingURL=config.js.map