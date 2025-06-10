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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const dotenv_1 = require("dotenv");
// 메모리 최적화: GPU 프로세스 완전 비활성화
electron_1.app.disableHardwareAcceleration();
// 메모리 최적화: 추가 프로세스 플래그 설정
electron_1.app.commandLine.appendSwitch('--disable-gpu');
electron_1.app.commandLine.appendSwitch('--disable-gpu-process');
electron_1.app.commandLine.appendSwitch('--disable-gpu-sandbox');
electron_1.app.commandLine.appendSwitch('--disable-accelerated-video-decode');
electron_1.app.commandLine.appendSwitch('--disable-accelerated-video-encode');
electron_1.app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
electron_1.app.commandLine.appendSwitch('--disable-accelerated-compositing');
electron_1.app.commandLine.appendSwitch('--disable-software-rasterizer');
electron_1.app.commandLine.appendSwitch('--disable-background-timer-throttling');
electron_1.app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
electron_1.app.commandLine.appendSwitch('--disable-renderer-backgrounding');
electron_1.app.commandLine.appendSwitch('--disable-features', 'TranslateUI,BlinkGenPropertyTrees');
electron_1.app.commandLine.appendSwitch('--enable-features', 'VizDisplayCompositor');
electron_1.app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=256 --max-semi-space-size=8');
electron_1.app.commandLine.appendSwitch('--memory-pressure-off');
electron_1.app.commandLine.appendSwitch('--max_old_space_size', '256');
// Load environment variables early with explicit path
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
(0, dotenv_1.config)({ path: envPath });
const window_1 = require("./window");
const keyboard_1 = require("./keyboard");
const native_ipc_1 = require("./native-ipc");
const static_server_1 = require("./static-server");
// Import all remaining main directory modules for side effects and initialization
require("./app-lifecycle");
require("./auto-launch-manager");
require("./browser-detector");
require("./clipboard-watcher");
require("./constants");
require("./crash-reporter");
require("./data-collector");
require("./data-sync");
require("./dialog-manager");
require("./gpu-utils");
require("./handlers-manager");
require("./keyboard-advanced");
require("./menu-manager");
require("./menu");
require("./memory-manager");
require("./native-client");
require("./platform-manager");
require("./power-monitor");
require("./protocols");
require("./safe-storage");
require("./screenshot");
require("./security-manager");
require("./settings-manager");
require("./shortcuts");
require("./stats-manager");
require("./stub-functions");
require("./system-info");
require("./tracking-handlers");
require("./tray");
require("./update-manager");
require("./utils");
require("./web-contents-handlers");
require("./window-handlers");
// Load environment variables early
(0, dotenv_1.config)();
// Development mode detection - define early for all other code to use
const isDev = process.env.NODE_ENV === 'development';
const disableCSP = isDev || process.env.DISABLE_CSP === 'true';
const disableSecurity = isDev || process.env.DISABLE_SECURITY === 'true';
// Set essential environment variables
process.env.ELECTRON_STATIC = isDev ? 'false' : 'true';
process.env.STATIC_MODE = isDev ? 'development' : 'production';
console.log(`[electron] 환경변수 ELECTRON_STATIC: ${process.env.ELECTRON_STATIC}`);
console.log(`[electron] 환경변수 STATIC_MODE: ${process.env.STATIC_MODE}`);
console.log(`애플리케이션 시작 중 (개발 모드: ${isDev}, 보안 비활성화: ${disableSecurity}, CSP 비활성화: ${disableCSP})`);
// Set environment variables before importing Electron modules
if (disableSecurity || disableCSP) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    process.env.ELECTRON_OVERRIDE_CSP = '*';
}
// Hardware acceleration control - must be called before app ready
// 개발 모드에서도 환경변수로 하드웨어 가속 제어 가능
const disableHardwareAcceleration = process.env.GPU_MODE === 'software' ||
    process.env.DISABLE_GPU === 'true' ||
    process.env.HARDWARE_ACCELERATION === 'false' ||
    (isDev && process.env.HARDWARE_ACCELERATION !== 'true');
const enableWebGL = process.env.WEBGL_ENABLED !== 'false';
const gpuPowerPreference = process.env.GPU_POWER_PREFERENCE || 'default';
if (disableHardwareAcceleration) {
    console.log('🔧 GPU 모드: 소프트웨어 렌더링 - 하드웨어 가속 비활성화됨');
    electron_1.app.disableHardwareAcceleration();
    // 추가 GPU 관련 스위치 비활성화
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
    electron_1.app.commandLine.appendSwitch('disable-gpu-rasterization');
    electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
}
else if (process.env.HARDWARE_ACCELERATION === 'true') {
    console.log('⚡ GPU 모드: 하드웨어 가속 활성화');
    electron_1.app.commandLine.appendSwitch('enable-gpu-rasterization');
    electron_1.app.commandLine.appendSwitch('enable-zero-copy');
    if (process.env.GPU_VSYNC === 'true') {
        electron_1.app.commandLine.appendSwitch('enable-gpu-vsync');
    }
    if (process.env.GPU_ANTIALIASING === 'true') {
        electron_1.app.commandLine.appendSwitch('enable-gpu-antialiasing');
    }
}
// Development mode command line switches
if (isDev) {
    console.log('개발 모드: 보안 우회 및 CSP 제거 활성화...');
    // Security related command line switches
    electron_1.app.commandLine.appendSwitch('disable-web-security');
    electron_1.app.commandLine.appendSwitch('allow-insecure-localhost');
    electron_1.app.commandLine.appendSwitch('ignore-certificate-errors');
    electron_1.app.commandLine.appendSwitch('disable-site-isolation-trials');
    electron_1.app.commandLine.appendSwitch('allow-running-insecure-content');
    console.log('모든 CSP 제한이 완전히 비활성화됨');
}
// GPU related command line switches
if (!disableHardwareAcceleration) {
    electron_1.app.commandLine.appendSwitch('enable-hardware-acceleration');
    electron_1.app.commandLine.appendSwitch('ignore-gpu-blacklist');
}
else {
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
}
// Debug GPU process crash limit disable
electron_1.app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
if (isDev) {
    electron_1.app.commandLine.appendSwitch('debug-gpu');
}
// Environment logging
console.log(`[환경변수] NODE_ENV: ${process.env.NODE_ENV || '설정되지 않음'}`);
console.log(`[환경변수] NEXT_PORT: ${process.env.NEXT_PORT || '3000'}`);
console.log(`[환경변수] GPU_MODE: ${process.env.GPU_MODE || '설정되지 않음'}`);
console.log(`[환경변수] MongoDB URI: ${process.env.MONGODB_URI ? '설정됨' : '설정되지 않음'}`);
console.log(`[환경변수] Supabase URL: ${process.env.SUPABASE_URL ? '설정됨' : '설정되지 않음'}`);
// Import additional required modules (avoid duplicates)
const settings_manager_1 = require("./settings-manager");
const handlers_manager_1 = require("./handlers-manager");
const data_collector_1 = require("./data-collector");
const appState = {
    isInitializing: true,
    isReady: false,
    mainWindow: null,
    settings: {},
    windowManager: null,
    settingsManagerInitialized: false,
    keyboardManager: null,
    staticServer: null,
    protocolsRegistered: false,
    securityInitialized: false,
    ipcHandlersRegistered: false,
    keyboardInitialized: false
};
exports.appState = appState;
// Initialize managers
function initializeManagers() {
    console.log('핵심 매니저 초기화 중...');
    data_collector_1.dataCollector.log('system', '핵심 매니저 초기화 시작');
    try {
        // Initialize in dependency order - settings manager first as other managers may depend on it
        appState.windowManager = window_1.WindowManager.getInstance();
        appState.keyboardManager = keyboard_1.KeyboardManager.getInstance();
        // Initialize static server for production builds
        const isStaticMode = process.env.ELECTRON_STATIC === 'true' || process.env.STATIC_MODE === 'true' || !isDev;
        console.log(`환경변수 ELECTRON_STATIC: ${process.env.ELECTRON_STATIC}`);
        console.log(`환경변수 STATIC_MODE: ${process.env.STATIC_MODE}`);
        console.log(`isDev: ${isDev}`);
        console.log(`isStaticMode: ${isStaticMode}`);
        if (isStaticMode) {
            console.log('정적 서버 모드 활성화됨');
            const staticPath = path.join(__dirname, '../../../out'); // Next.js static export 경로
            console.log(`정적 파일 경로: ${staticPath}`);
            appState.staticServer = new static_server_1.StaticServer(staticPath, 5500);
        }
        else {
            console.log('정적 서버 모드 비활성화됨');
        }
        console.log('핵심 매니저 초기화 성공');
        data_collector_1.dataCollector.log('system', '핵심 매니저 초기화 완료');
    }
    catch (error) {
        console.error('매니저 초기화 오류:', error);
        throw error;
    }
}
// Initialize all core systems
async function initializeCoreSystem() {
    console.log('핵심 시스템 초기화 중...');
    data_collector_1.dataCollector.log('system', '핵심 시스템 초기화 시작');
    try {
        // Initialize settings manager first - other managers may depend on settings
        await (0, settings_manager_1.initializeSettingsManager)();
        appState.settingsManagerInitialized = true;
        console.log('설정 관리자 초기화됨');
        data_collector_1.dataCollector.log('system', '설정 관리자 초기화 완료');
        // Initialize static server for production builds
        if (appState.staticServer) {
            try {
                const staticPort = await appState.staticServer.start();
                process.env.STATIC_SERVER_URL = `http://localhost:${staticPort}`;
                console.log(`정적 서버 시작됨: http://localhost:${staticPort}`);
                data_collector_1.dataCollector.log('system', '정적 서버 시작 완료');
            }
            catch (error) {
                console.error('정적 서버 시작 실패:', error);
                // Don't fail the entire app if static server fails, fallback to dev mode
            }
        }
        // Initialize window manager
        if (appState.windowManager) {
            // WindowManager doesn't need initialization, it's ready on getInstance
            console.log('윈도우 관리자 준비됨');
            data_collector_1.dataCollector.log('system', '윈도우 관리자 준비 완료');
        }
        // Initialize keyboard manager
        if (appState.keyboardManager) {
            console.log('키보드 관리자 준비됨');
            data_collector_1.dataCollector.log('system', '키보드 관리자 준비 완료');
        }
        console.log('핵심 시스템 초기화 완료');
        data_collector_1.dataCollector.log('system', '핵심 시스템 초기화 완료');
    }
    catch (error) {
        console.error('Error initializing core system:', error);
        throw error;
    }
}
// Initialize UI components
async function initializeUIComponents() {
    console.log('Initializing UI components...');
    try {
        // Create main window
        if (appState.windowManager) {
            appState.mainWindow = await appState.windowManager.createMainWindow();
        }
        // Initialize advanced keyboard system after main window is created
        if (appState.mainWindow && appState.keyboardManager) {
            try {
                await appState.keyboardManager.initialize(appState.mainWindow);
                appState.keyboardInitialized = true;
                console.log('Advanced keyboard system initialized');
            }
            catch (error) {
                console.error('Failed to initialize keyboard system:', error);
                // Don't fail the entire app if keyboard fails
            }
        }
        console.log('UI components initialized successfully');
    }
    catch (error) {
        console.error('Error initializing UI components:', error);
        throw error;
    }
}
// Setup IPC handlers
async function setupIPCHandlers() {
    if (!appState.ipcHandlersRegistered) {
        console.log('Setting up IPC handlers...');
        try {
            // Setup all handlers using our handlers manager
            await (0, handlers_manager_1.setupAllHandlers)();
            // Register native module IPC handlers
            console.log('Registering native module IPC handlers...');
            (0, native_ipc_1.registerNativeIpcHandlers)();
            appState.ipcHandlersRegistered = true;
            console.log('All IPC handlers registered successfully');
        }
        catch (error) {
            console.error('Error setting up IPC handlers:', error);
            throw error;
        }
    }
}
// Setup development-specific security bypasses
function setupDevelopmentSecurity() {
    if (isDev || disableSecurity) {
        console.log('Development environment: disabling security settings');
        // Remove CSP headers
        electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const responseHeaders = { ...details.responseHeaders };
            delete responseHeaders['content-security-policy'];
            delete responseHeaders['content-security-policy-report-only'];
            callback({ responseHeaders });
        });
        appState.securityInitialized = true;
        console.log('Development security settings applied');
    }
}
// Main application ready handler
async function onAppReady() {
    console.log('App ready event received');
    try {
        // Initialize managers
        initializeManagers();
        // Initialize core system
        await initializeCoreSystem();
        // Setup development security
        setupDevelopmentSecurity();
        // Setup IPC handlers
        await setupIPCHandlers();
        // Initialize UI components
        await initializeUIComponents();
        appState.isReady = true;
        appState.isInitializing = false;
        console.log('Application initialization complete');
    }
    catch (error) {
        console.error('Error during app initialization:', error);
        electron_1.app.quit();
    }
}
// Event handlers
electron_1.app.whenReady().then(onAppReady);
electron_1.app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', async (event) => {
    console.log('Before quit event received');
    // Prevent immediate quit to allow cleanup
    event.preventDefault();
    try {
        // Allow managers to perform cleanup
        await cleanup();
        // Now allow the app to quit
        electron_1.app.exit(0);
    }
    catch (error) {
        console.error('Error during cleanup:', error);
        electron_1.app.exit(1);
    }
});
electron_1.app.on('activate', async () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        if (appState.windowManager) {
            await appState.windowManager.createWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, '../preload/preload.js')
                }
            });
        }
    }
});
// Cleanup function
async function cleanup() {
    console.log('Performing application cleanup...');
    try {
        // Cleanup in reverse order of initialization
        // Cleanup static server first
        if (appState.staticServer) {
            try {
                await appState.staticServer.stop();
                console.log('Static server cleanup completed');
            }
            catch (error) {
                console.error('Error during static server cleanup:', error);
            }
        }
        // Cleanup keyboard system
        if (appState.keyboardManager && appState.keyboardInitialized) {
            try {
                await appState.keyboardManager.cleanup();
                console.log('Keyboard system cleanup completed');
            }
            catch (error) {
                console.error('Error during keyboard cleanup:', error);
            }
        }
        // Cleanup native module IPC handlers
        try {
            (0, native_ipc_1.cleanupNativeIpcHandlers)();
            console.log('Native module IPC handlers cleanup completed');
        }
        catch (error) {
            console.error('Error during native module cleanup:', error);
        }
        if (appState.windowManager) {
            // WindowManager doesn't have cleanup method, just destroy windows
            electron_1.BrowserWindow.getAllWindows().forEach(window => {
                if (!window.isDestroyed()) {
                    window.destroy();
                }
            });
        }
        // Clear manager references
        appState.settingsManagerInitialized = false;
        appState.keyboardManager = null;
        appState.staticServer = null;
        appState.keyboardInitialized = false;
        console.log('Application cleanup complete');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't crash the app, just log the error
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't crash the app, just log the error
});
// Enable live reload for development
if (isDev) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '../../../node_modules/.bin/electron'),
            hardResetMethod: 'exit'
        });
    }
    catch (error) {
        console.log('electron-reload not available:', error.message);
    }
}
//# sourceMappingURL=main.js.map