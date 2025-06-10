"use strict";
/**
 * Loop 6 애플리케이션 라이프사이클 관리
 * Loop 3의 고급 기능들을 TypeScript로 완전 마이그레이션
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = initializeApp;
exports.setupGlobalExceptionHandlers = setupGlobalExceptionHandlers;
exports.cleanupApp = cleanupApp;
exports.getAppState = getAppState;
exports.isAppReady = isAppReady;
const electron_1 = require("electron");
const memory_manager_1 = require("./memory-manager");
const debug_1 = require("../utils/debug");
const settings_manager_1 = __importDefault(require("./settings-manager"));
const stub_functions_1 = require("./stub-functions");
const appState = {
    isReady: false,
    gpuEnabled: false,
    securityInitialized: false,
    memoryManagerActive: false,
    keyboardMonitoringActive: false,
    settings: {}
};
/**
 * GPU 설정 구성 및 적용
 */
async function setupGpuConfiguration() {
    try {
        (0, debug_1.debugLog)('GPU 설정 적용 시작');
        // 설정 로드
        const userSettings = await settings_manager_1.default.getSettings();
        // 하드웨어 가속 설정 적용
        const useHardwareAcceleration = userSettings?.useHardwareAcceleration ?? true;
        const processingMode = userSettings?.processingMode || 'auto';
        const highPerformance = processingMode === 'gpu-intensive';
        (0, debug_1.debugLog)(`GPU 가속 설정 상태: ${useHardwareAcceleration ? '활성화됨' : '비활성화됨'}, 모드: ${processingMode}`);
        // GPU 정보는 기본값으로 설정
        appState.gpuEnabled = useHardwareAcceleration;
        // Electron 하드웨어 가속 설정
        if (useHardwareAcceleration && !electron_1.app.isReady()) {
            // 앱이 준비되기 전에만 하드웨어 가속 설정 가능
            (0, debug_1.debugLog)('Electron 하드웨어 가속 활성화');
        }
        else if (!useHardwareAcceleration && !electron_1.app.isReady()) {
            electron_1.app.disableHardwareAcceleration();
            (0, debug_1.debugLog)('Electron 하드웨어 가속 비활성화');
        }
    }
    catch (error) {
        (0, debug_1.errorLog)('GPU 설정 중 오류 발생:', error);
        appState.gpuEnabled = false;
    }
}
/**
 * 보안 설정 초기화
 */
async function initializeSecuritySettings() {
    try {
        (0, debug_1.debugLog)('보안 설정 초기화 시작');
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            // 개발 모드에서는 보안 제한 완화
            (0, debug_1.debugLog)('개발 모드: 보안 제한 완화');
            process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
        }
        // 프로토콜 설정
        await (0, stub_functions_1.setupProtocols)();
        // 세이프 스토리지 설정
        await (0, stub_functions_1.setupSafeStorage)();
        appState.securityInitialized = true;
        (0, debug_1.debugLog)('보안 설정 초기화 완료');
    }
    catch (error) {
        (0, debug_1.errorLog)('보안 설정 초기화 중 오류 발생:', error);
    }
}
/**
 * 키보드 모니터링 초기화
 */
async function initializeKeyboardMonitoring() {
    try {
        const userSettings = await settings_manager_1.default.getSettings();
        if (userSettings?.keyboard?.autoStart) {
            await (0, stub_functions_1.initKeyboardMonitoring)();
            appState.keyboardMonitoringActive = true;
            (0, debug_1.debugLog)('키보드 모니터링 초기화 완료');
        }
        else {
            (0, debug_1.debugLog)('키보드 모니터링 비활성화됨');
        }
    }
    catch (error) {
        (0, debug_1.errorLog)('키보드 모니터링 초기화 중 오류 발생:', error);
    }
}
/**
 * 시스템 모니터링 초기화
 */
async function initializeSystemMonitoring() {
    try {
        // 메모리 관리자 초기화
        (0, memory_manager_1.setupMemoryManager)();
        appState.memoryManagerActive = true;
        // 전력 모니터링 설정
        (0, stub_functions_1.setupPowerMonitoring)();
        // 시스템 정보 모듈 초기화
        (0, stub_functions_1.initSystemInfoModule)();
        // 타이핑 통계 모듈 초기화
        (0, stub_functions_1.initTypingStatsModule)();
        (0, debug_1.debugLog)('시스템 모니터링 초기화 완료');
    }
    catch (error) {
        (0, debug_1.errorLog)('시스템 모니터링 초기화 중 오류 발생:', error);
    }
}
/**
 * 추가 기능 초기화
 */
async function initializeAdditionalFeatures() {
    try {
        // 클립보드 워처 설정
        (0, stub_functions_1.setupClipboardWatcher)();
        // 크래시 리포터 설정
        (0, stub_functions_1.setupCrashReporter)();
        // 스크린샷 모듈 초기화
        (0, stub_functions_1.initScreenshotModule)(electron_1.app);
        // 글로벌 단축키 설정
        (0, stub_functions_1.setupGlobalShortcuts)();
        // 시스템 트레이 설정
        const userSettings = await settings_manager_1.default.getSettings();
        if (userSettings?.minimizeToTray) {
            (0, stub_functions_1.setupTray)();
        }
        // 메뉴 설정
        (0, stub_functions_1.setupMenu)();
        (0, debug_1.debugLog)('추가 기능 초기화 완료');
    }
    catch (error) {
        (0, debug_1.errorLog)('추가 기능 초기화 중 오류 발생:', error);
    }
}
/**
 * 애플리케이션 초기화
 */
async function initializeApp() {
    try {
        (0, debug_1.debugLog)('Loop 6 애플리케이션 초기화 시작');
        // 1. 설정 로드
        await (0, stub_functions_1.loadSettings)();
        appState.settings = await settings_manager_1.default.getSettings();
        // 2. 단일 인스턴스 보장
        setupSingleInstance();
        // 3. 보안 설정 초기화
        await initializeSecuritySettings();
        // 4. GPU 설정 구성
        await setupGpuConfiguration();
        // 5. 기본 앱 이벤트 설정
        setupAppEvents();
        // 6. 데이터베이스 초기화
        await (0, stub_functions_1.initDatabase)();
        // 7. 메인 윈도우 생성
        await (0, stub_functions_1.createWindow)();
        // 8. IPC 핸들러 설정
        (0, stub_functions_1.setupIpcHandlers)();
        // 9. 시스템 모니터링 초기화
        await initializeSystemMonitoring();
        // 10. 키보드 모니터링 초기화
        await initializeKeyboardMonitoring();
        // 11. 자동 업데이트 초기화
        (0, stub_functions_1.initUpdates)();
        // 12. 추가 기능 초기화
        await initializeAdditionalFeatures();
        // 13. 메모리 상태 초기 확인
        await (0, memory_manager_1.checkAndOptimizeMemoryIfNeeded)();
        appState.isReady = true;
        (0, debug_1.debugLog)('Loop 6 애플리케이션 초기화 완료');
    }
    catch (error) {
        (0, debug_1.errorLog)('애플리케이션 초기화 중 오류 발생:', error);
        throw error;
    }
}
/**
 * 단일 인스턴스 보장
 */
function setupSingleInstance() {
    const gotTheLock = electron_1.app.requestSingleInstanceLock();
    if (!gotTheLock) {
        (0, debug_1.debugLog)('이미 다른 인스턴스가 실행 중입니다. 앱을 종료합니다.');
        electron_1.app.quit();
        return;
    }
    // 두 번째 인스턴스가 실행되었을 때
    electron_1.app.on('second-instance', () => {
        const mainWindow = (0, stub_functions_1.getMainWindow)();
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
/**
 * 앱 기본 이벤트 설정
 */
function setupAppEvents() {
    // macOS에서는 모든 창이 닫혀도 앱을 유지
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    // macOS에서 독 아이콘 클릭 시 창 생성
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            (0, stub_functions_1.createWindow)();
        }
    });
    // 앱 종료 시 정리 작업
    electron_1.app.on('will-quit', async () => {
        await cleanupApp();
    });
    // 앱 완전 종료 시
    electron_1.app.on('before-quit', async () => {
        (0, debug_1.debugLog)('애플리케이션 종료 준비');
    });
}
/**
 * 전역 예외 핸들러 설정
 */
function setupGlobalExceptionHandlers() {
    // 처리되지 않은 Promise 거부
    process.on('unhandledRejection', (reason, promise) => {
        (0, debug_1.errorLog)('처리되지 않은 Promise 거부:', reason);
        (0, debug_1.errorLog)('Promise:', promise);
    });
    // 처리되지 않은 예외
    process.on('uncaughtException', (error) => {
        (0, debug_1.errorLog)('처리되지 않은 예외:', error);
        // 중요한 오류의 경우 앱 종료
        if (error.message.includes('EADDRINUSE') ||
            error.message.includes('permission denied')) {
            process.exit(1);
        }
    });
}
/**
 * 애플리케이션 정리
 */
async function cleanupApp() {
    try {
        (0, debug_1.debugLog)('애플리케이션 정리 시작');
        // 트레이 아이콘 제거
        (0, stub_functions_1.destroyTray)();
        // 데이터베이스 연결 종료
        await (0, stub_functions_1.closeDatabase)();
        // 네이티브 모듈 정리
        // 필요한 경우 네이티브 모듈의 정리 함수 호출
        (0, debug_1.debugLog)('애플리케이션 정리 완료');
    }
    catch (error) {
        (0, debug_1.errorLog)('애플리케이션 정리 중 오류 발생:', error);
    }
}
/**
 * 앱 상태 가져오기
 */
function getAppState() {
    return { ...appState };
}
/**
 * 앱 준비 상태 확인
 */
function isAppReady() {
    return appState.isReady;
}
//# sourceMappingURL=app-lifecycle.js.map