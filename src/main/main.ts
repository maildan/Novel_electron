import { app, BrowserWindow, ipcMain, session, dialog, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

// 메모리 최적화: GPU 프로세스 완전 비활성화
app.disableHardwareAcceleration();

// 메모리 최적화: 추가 프로세스 플래그 설정
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-process');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-accelerated-video-decode');
app.commandLine.appendSwitch('--disable-accelerated-video-encode');
app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('--disable-accelerated-compositing');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-features', 'TranslateUI,BlinkGenPropertyTrees');
app.commandLine.appendSwitch('--enable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=256 --max-semi-space-size=8');
app.commandLine.appendSwitch('--memory-pressure-off');
app.commandLine.appendSwitch('--max_old_space_size', '256');

// Load environment variables early with explicit path
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
config({ path: envPath });

// Import all main directory modules for comprehensive initialization
import { AppConfig } from './config';
import { WindowManager } from './window';
import { KeyboardManager } from './keyboard';
import { DatabaseManager } from './database';
import { MemoryManager } from './memory';
import { SystemMonitor } from './system-monitor';
import { IpcHandlers } from './ipc-handlers';
import { registerWindowHandlers, initializeWindowHandlers } from './windowHandlers';
import { registerKeyboardHandlers, initializeKeyboardHandlers } from './keyboardHandlers';
import { registerSystemInfoIpcHandlers } from './systemInfoIpc';
import { registerNativeIpcHandlers, cleanupNativeIpcHandlers } from './native-ipc';
import { StaticServer } from './static-server';

// Import all remaining main directory modules for side effects and initialization
import './app-lifecycle';
import './auto-launch-manager';
import './browser-detector';
import './clipboard-watcher';
import './constants';
import './crash-reporter';
import './data-collector';
import './data-sync';
import './dialog-manager';
import './gpuUtils';
import './handlers-manager';
import './keyboard-advanced';
import './menu-manager';
import './menu';
import './memory-manager';
import './native-client';
import './platform-manager';
import './power-monitor';
import './protocols';
import './safe-storage';
import './screenshot';
import './security-manager';
import './settings-manager';
import './shortcuts';
import './stats-manager';
import './stub-functions';
import './system-info';
import './tracking-handlers';
import './tray';
import './update-manager';
import './utils';
import './web-contents-handlers';
import './windowHandlers';

// Load environment variables early
config();

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
  app.disableHardwareAcceleration();
  
  // 추가 GPU 관련 스위치 비활성화
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-rasterization');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
} else if (process.env.HARDWARE_ACCELERATION === 'true') {
  console.log('⚡ GPU 모드: 하드웨어 가속 활성화');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  
  if (process.env.GPU_VSYNC === 'true') {
    app.commandLine.appendSwitch('enable-gpu-vsync');
  }
  
  if (process.env.GPU_ANTIALIASING === 'true') {
    app.commandLine.appendSwitch('enable-gpu-antialiasing');
  }
}

// Development mode command line switches
if (isDev) {
  console.log('개발 모드: 보안 우회 및 CSP 제거 활성화...');
  
  // Security related command line switches
  app.commandLine.appendSwitch('disable-web-security');
  app.commandLine.appendSwitch('allow-insecure-localhost');
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('disable-site-isolation-trials');
  app.commandLine.appendSwitch('allow-running-insecure-content');
  
  console.log('모든 CSP 제한이 완전히 비활성화됨');
}

// GPU related command line switches
if (!disableHardwareAcceleration) {
  app.commandLine.appendSwitch('enable-hardware-acceleration');
  app.commandLine.appendSwitch('ignore-gpu-blacklist');
} else {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

// Debug GPU process crash limit disable
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');

if (isDev) {
  app.commandLine.appendSwitch('debug-gpu');
}

// Environment logging
console.log(`[환경변수] NODE_ENV: ${process.env.NODE_ENV || '설정되지 않음'}`);
console.log(`[환경변수] NEXT_PORT: ${process.env.NEXT_PORT || '3000'}`);
console.log(`[환경변수] GPU_MODE: ${process.env.GPU_MODE || '설정되지 않음'}`);
console.log(`[환경변수] MongoDB URI: ${process.env.MONGODB_URI ? '설정됨' : '설정되지 않음'}`);
console.log(`[환경변수] Supabase URL: ${process.env.SUPABASE_URL ? '설정됨' : '설정되지 않음'}`);

// Import additional required modules (avoid duplicates)
import { initializeSettingsManager } from './settings-manager';
import { setupAllHandlers } from './handlers-manager';
import { initAdvancedKeyboard, cleanupAdvancedKeyboard } from './keyboard';
import { dataCollector } from './data-collector';

// Application state management
interface AppState {
  isInitializing: boolean;
  isReady: boolean;
  mainWindow: BrowserWindow | null;
  settings: any;
  windowManager: WindowManager | null;
  settingsManagerInitialized: boolean;
  keyboardManager: KeyboardManager | null;
  staticServer: StaticServer | null;
  protocolsRegistered: boolean;
  securityInitialized: boolean;
  ipcHandlersRegistered: boolean;
  keyboardInitialized: boolean;
}

const appState: AppState = {
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

// Initialize managers
function initializeManagers(): void {
  console.log('핵심 매니저 초기화 중...');
  dataCollector.log('system', '핵심 매니저 초기화 시작');
  
  try {
    // Initialize in dependency order - settings manager first as other managers may depend on it
    appState.windowManager = WindowManager.getInstance();
    appState.keyboardManager = KeyboardManager.getInstance();
    
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
      appState.staticServer = new StaticServer(staticPath, 5500);
    } else {
      console.log('정적 서버 모드 비활성화됨');
    }
    
    console.log('핵심 매니저 초기화 성공');
    dataCollector.log('system', '핵심 매니저 초기화 완료');
  } catch (error) {
    console.error('매니저 초기화 오류:', error);
    throw error;
  }
}

// Initialize all core systems
async function initializeCoreSystem(): Promise<void> {
  console.log('핵심 시스템 초기화 중...');
  dataCollector.log('system', '핵심 시스템 초기화 시작');
  
  try {
    // Initialize settings manager first - other managers may depend on settings
    await initializeSettingsManager();
    appState.settingsManagerInitialized = true;
    console.log('설정 관리자 초기화됨');
    dataCollector.log('system', '설정 관리자 초기화 완료');
    
    // Initialize static server for production builds
    if (appState.staticServer) {
      try {
        const staticPort = await appState.staticServer.start();
        process.env.STATIC_SERVER_URL = `http://localhost:${staticPort}`;
        console.log(`정적 서버 시작됨: http://localhost:${staticPort}`);
        dataCollector.log('system', '정적 서버 시작 완료');
      } catch (error) {
        console.error('정적 서버 시작 실패:', error);
        // Don't fail the entire app if static server fails, fallback to dev mode
      }
    }
    
    // Initialize window manager
    if (appState.windowManager) {
      // WindowManager doesn't need initialization, it's ready on getInstance
      console.log('윈도우 관리자 준비됨');
      dataCollector.log('system', '윈도우 관리자 준비 완료');
    }
    
    // Initialize keyboard manager
    if (appState.keyboardManager) {
      console.log('키보드 관리자 준비됨');
      dataCollector.log('system', '키보드 관리자 준비 완료');
    }
    
    console.log('핵심 시스템 초기화 완료');
    dataCollector.log('system', '핵심 시스템 초기화 완료');
  } catch (error) {
    console.error('Error initializing core system:', error);
    throw error;
  }
}

// Initialize UI components
async function initializeUIComponents(): Promise<void> {
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
      } catch (error) {
        console.error('Failed to initialize keyboard system:', error);
        // Don't fail the entire app if keyboard fails
      }
    }
    
    console.log('UI components initialized successfully');
  } catch (error) {
    console.error('Error initializing UI components:', error);
    throw error;
  }
}

// Setup IPC handlers
async function setupIPCHandlers(): Promise<void> {
  if (!appState.ipcHandlersRegistered) {
    console.log('Setting up IPC handlers...');
    
    try {
      // Setup all handlers using our handlers manager
      await setupAllHandlers();
      
      // Register native module IPC handlers
      console.log('Registering native module IPC handlers...');
      registerNativeIpcHandlers();
      
      appState.ipcHandlersRegistered = true;
      console.log('All IPC handlers registered successfully');
    } catch (error) {
      console.error('Error setting up IPC handlers:', error);
      throw error;
    }
  }
}

// Setup development-specific security bypasses
function setupDevelopmentSecurity(): void {
  if (isDev || disableSecurity) {
    console.log('Development environment: disabling security settings');
    
    // Remove CSP headers
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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
async function onAppReady(): Promise<void> {
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
  } catch (error) {
    console.error('Error during app initialization:', error);
    app.quit();
  }
}

// Event handlers
app.whenReady().then(onAppReady);

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  console.log('Before quit event received');
  
  // Prevent immediate quit to allow cleanup
  event.preventDefault();
  
  try {
    // Allow managers to perform cleanup
    await cleanup();
    
    // Now allow the app to quit
    app.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    app.exit(1);
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (appState.windowManager) {
      await appState.windowManager.createWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, '../preload/index.js')
        }
      });
    }
  }
});

// Cleanup function
async function cleanup(): Promise<void> {
  console.log('Performing application cleanup...');
  
  try {
    // Cleanup in reverse order of initialization
    
    // Cleanup static server first
    if (appState.staticServer) {
      try {
        await appState.staticServer.stop();
        console.log('Static server cleanup completed');
      } catch (error) {
        console.error('Error during static server cleanup:', error);
      }
    }
    
    // Cleanup keyboard system
    if (appState.keyboardManager && appState.keyboardInitialized) {
      try {
        await appState.keyboardManager.cleanup();
        console.log('Keyboard system cleanup completed');
      } catch (error) {
        console.error('Error during keyboard cleanup:', error);
      }
    }
    
    // Cleanup native module IPC handlers
    try {
      cleanupNativeIpcHandlers();
      console.log('Native module IPC handlers cleanup completed');
    } catch (error) {
      console.error('Error during native module cleanup:', error);
    }
    
    if (appState.windowManager) {
      // WindowManager doesn't have cleanup method, just destroy windows
      BrowserWindow.getAllWindows().forEach(window => {
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
  } catch (error) {
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
  } catch (error: any) {
    console.log('electron-reload not available:', error.message);
  }
}

export { appState };
