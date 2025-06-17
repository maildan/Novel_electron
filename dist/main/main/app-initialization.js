"use strict";
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
exports.appState = void 0;
exports.initializeManagers = initializeManagers;
exports.registerAllIpcHandlers = registerAllIpcHandlers;
exports.initializeCoreSystem = initializeCoreSystem;
exports.onAppReady = onAppReady;
/**
 * 애플리케이션 초기화 로직
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
// 매니저들 import
const window_1 = require("./window");
const keyboard_1 = require("./keyboard");
const database_1 = require("./database");
const memory_1 = require("./memory");
const system_monitor_1 = require("./system-monitor");
const ipc_handlers_1 = require("./ipc-handlers");
const static_server_1 = require("./static-server");
// IPC 핸들러들 import
const handlers_manager_1 = require("./handlers-manager");
const windowHandlers_1 = require("./windowHandlers");
const keyboardHandlers_1 = require("./keyboardHandlers");
// 중복 방지를 위해 주석 처리 - handlers-manager에서 중앙 관리
// import { registerSystemInfoIpcHandlers } from './systemInfoIpc';
// import { registerNativeIpcHandlers } from './native-ipc';
// 환경 설정
const app_config_1 = require("./app-config");
// 데이터 수집기 (임시)
const dataCollector = {
    log: (category, message) => {
        console.log(`[${category}] ${message}`);
    }
};
// 앱 상태 초기화
exports.appState = {
    isInitialized: false,
    windowManager: null,
    settingsManagerInitialized: false,
    keyboardManager: null,
    staticServer: null,
    protocolsRegistered: false,
    securityInitialized: false,
    ipcHandlersRegistered: false,
    keyboardInitialized: false
};
/**
 * 핵심 매니저들 초기화
 */
function initializeManagers() {
    console.log('핵심 매니저 초기화 중...');
    dataCollector.log('system', '핵심 매니저 초기화 시작');
    try {
        // Initialize in dependency order - settings manager first as other managers may depend on it
        exports.appState.windowManager = window_1.WindowManager.getInstance();
        exports.appState.keyboardManager = keyboard_1.KeyboardManager.getInstance();
        // 데이터베이스 매니저 인스턴스 생성
        const databaseManager = new database_1.DatabaseManager();
        console.log('데이터베이스 매니저 초기화됨:', typeof databaseManager);
        // 메모리 매니저 인스턴스 생성 
        const memoryManager = memory_1.MemoryManager.getInstance();
        console.log('메모리 매니저 초기화됨:', typeof memoryManager);
        // 시스템 모니터 인스턴스 생성
        const systemMonitor = system_monitor_1.SystemMonitor.getInstance();
        console.log('시스템 모니터 초기화됨:', typeof systemMonitor);
        // IPC 핸들러 인스턴스 확인
        const ipcHandlers = ipc_handlers_1.IpcHandlers.getInstance();
        console.log('IPC 핸들러 초기화됨:', typeof ipcHandlers);
        // Initialize static server for production builds
        const isStaticMode = process.env.ELECTRON_STATIC === 'true' || process.env.STATIC_MODE === 'true' || !app_config_1.isDev;
        console.log(`환경변수 ELECTRON_STATIC: ${process.env.ELECTRON_STATIC}`);
        console.log(`환경변수 STATIC_MODE: ${process.env.STATIC_MODE}`);
        console.log(`isDev: ${app_config_1.isDev}`);
        console.log(`isStaticMode: ${isStaticMode}`);
        if (isStaticMode) {
            console.log('정적 서버 모드 활성화됨');
            const staticPath = path.join(__dirname, '../../../out'); // Next.js static export 경로
            console.log(`정적 파일 경로: ${staticPath}`);
            exports.appState.staticServer = new static_server_1.StaticServer(staticPath, 5500);
        }
        else {
            console.log('정적 서버 모드 비활성화됨');
        }
        console.log('핵심 매니저 초기화 Success');
        dataCollector.log('system', '핵심 매니저 초기화 Completed');
    }
    catch (error) {
        console.error('매니저 초기화 Error:', error);
        throw error;
    }
}
/**
 * IPC 핸들러들 등록
 */
async function registerAllIpcHandlers() {
    console.log('IPC 핸들러 등록 중...');
    dataCollector.log('system', 'IPC 핸들러 등록 시작');
    try {
        // 통합 핸들러 매니저로 모든 핸들러 등록
        const handlersSetup = await (0, handlers_manager_1.setupAllHandlers)();
        if (!handlersSetup) {
            throw new Error('핸들러 등록에 실패했습니다');
        }
        // setupAllHandlers()에서 모든 핸들러를 등록하므로 개별 호출은 불필요 (중복 방지)
        // 핸들러들이 이미 handlers-manager에서 중앙화되어 등록됨
        // BrowserWindow 관련 정보 로깅
        const allWindows = electron_1.BrowserWindow.getAllWindows();
        console.log(`현재 BrowserWindow 개수: ${allWindows.length}`);
        exports.appState.ipcHandlersRegistered = true;
        console.log('IPC 핸들러 등록 Success');
        dataCollector.log('system', 'IPC 핸들러 등록 Completed');
    }
    catch (error) {
        console.error('IPC 핸들러 등록 Error:', error);
        throw error;
    }
}
/**
 * 핵심 시스템 초기화
 */
async function initializeCoreSystem() {
    console.log('핵심 시스템 초기화 중...');
    dataCollector.log('system', '핵심 시스템 초기화 시작');
    try {
        // Initialize settings manager first - other managers may depend on settings
        // 설정 매니저 초기화는 다른 매니저들이 시작되기 전에 완료되어야 함
        if (!exports.appState.settingsManagerInitialized) {
            // 설정 매니저 초기화 로직이 있다면 여기에 추가
            exports.appState.settingsManagerInitialized = true;
        }
        // Initialize keyboard system if keyboard manager is available
        if (exports.appState.keyboardManager && !exports.appState.keyboardInitialized) {
            console.log('키보드 시스템 초기화 중...');
            await exports.appState.keyboardManager.initialize();
            // 키보드 핸들러도 초기화
            await (0, keyboardHandlers_1.initializeKeyboardHandlers)();
            exports.appState.keyboardInitialized = true;
            console.log('키보드 시스템 초기화 완료');
        }
        // 윈도우 핸들러 초기화
        (0, windowHandlers_1.initializeWindowHandlers)();
        console.log('윈도우 핸들러 초기화 완료');
        // Start static server if available
        if (exports.appState.staticServer) {
            console.log('정적 서버 시작 중...');
            // path 모듈을 사용하여 로그 디렉토리 확인
            const logPath = path.join(electron_1.app.getPath('userData'), 'logs');
            console.log(`로그 디렉토리 경로: ${logPath}`);
            await exports.appState.staticServer.start();
            console.log('정적 서버 시작 완료');
        }
        exports.appState.isInitialized = true;
        console.log('핵심 시스템 초기화 Success');
        dataCollector.log('system', '핵심 시스템 초기화 Completed');
    }
    catch (error) {
        console.error('핵심 시스템 초기화 Error:', error);
        throw error;
    }
}
/**
 * 앱 준비 완료 핸들러
 */
async function onAppReady() {
    console.log('Electron app is ready');
    dataCollector.log('system', 'Electron 앱 준비 완료');
    try {
        // Initialize managers first
        initializeManagers();
        // Register IPC handlers
        await registerAllIpcHandlers();
        // Initialize core systems
        await initializeCoreSystem();
        // Create main window
        if (exports.appState.windowManager) {
            console.log('메인 윈도우 생성 중...');
            await exports.appState.windowManager.createMainWindow();
            console.log('메인 윈도우 생성 완료');
        }
        console.log('앱 초기화 완료');
        dataCollector.log('system', '앱 초기화 완료');
    }
    catch (error) {
        console.error('앱 초기화 중 오류:', error);
        dataCollector.log('system', `앱 초기화 오류: ${error}`);
        // Show error dialog and quit
        electron_1.app.quit();
    }
}
//# sourceMappingURL=app-initialization.js.map