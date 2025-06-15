/**
 * Loop 6 애플리케이션 라이프사이클 관리
 * Loop 3의 고급 기능들을 TypeScript로 완전 마이그레이션
 */

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window';
import { setupAllHandlers } from './handlers-manager';
import { setupMemoryManager, checkAndOptimizeMemoryIfNeeded } from './memory-manager';
import { debugLog, errorLog } from '../utils/debug';
import { KeyboardManager } from './keyboard';
import SettingsManager from './settings-manager';
import { initScreenshot } from './screenshot';
import { initSystemInfo } from './system-info';
import {
  setupProtocols,
  setupSafeStorage,
  initKeyboardMonitoring,
  setupPowerMonitoring,
  initSystemInfoModule,
  initTypingStatsModule,
  setupClipboardWatcher,
  setupCrashReporter,
  initScreenshotModule,
  setupGlobalShortcuts,
  setupTray,
  setupMenu,
  loadSettings,
  initDatabase,
  createWindow,
  setupIpcHandlers,
  initUpdates,
  getMainWindow,
  destroyTray,
  closeDatabase
} from './stub-functions';

// 앱 상태 관리
interface AppState {
  isReady: boolean;
  gpuEnabled: boolean;
  securityInitialized: boolean;
  memoryManagerActive: boolean;
  keyboardMonitoringActive: boolean;
  settings: any;
}

const appState: AppState = {
  isReady: false,
  gpuEnabled: false,
  securityInitialized: false,
  memoryManagerActive: false,
  keyboardMonitoringActive: false,
  settings: {}
};

/**
 * GPU Setup 구성 및 적용
 */
async function setupGpuConfiguration(): Promise<void> {
  try {
    debugLog('GPU Setup 적용 시작');
    
    // Setup 로드
    const userSettings = await SettingsManager.getSettings();
    
    // 하드웨어 가속 Setup 적용
    const useHardwareAcceleration = userSettings?.useHardwareAcceleration ?? true;
    const processingMode = userSettings?.processingMode || 'auto';
    const highPerformance = processingMode === 'gpu-intensive';
    
    debugLog(`GPU 가속 Setup 상태: ${useHardwareAcceleration ? '활성화됨' : '비활성화됨'}, 모드: ${processingMode}`);
    
    // GPU 정보는 기본값으로 Setup
    appState.gpuEnabled = useHardwareAcceleration;
    
    // Electron 하드웨어 가속 Setup
    if (useHardwareAcceleration && !app.isReady()) {
      // 앱이 준비되기 전에만 하드웨어 가속 Setup 가능
      debugLog('Electron 하드웨어 가속 활성화');
    } else if (!useHardwareAcceleration && !app.isReady()) {
      app.disableHardwareAcceleration();
      debugLog('Electron 하드웨어 가속 비활성화');
    }
    
  } catch (error) {
    errorLog('GPU Setup 중 Error 발생:', error);
    appState.gpuEnabled = false;
  }
}

/**
 * 보안 Setup 초기화
 */
async function initializeSecuritySettings(): Promise<void> {
  try {
    debugLog('보안 Setup 초기화 시작');
    
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // 개발 모드에서는 보안 제한 완화
      debugLog('개발 모드: 보안 제한 완화');
      process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    }
    
    // 프로토콜 Setup
    await setupProtocols();
    
    // 세이프 스토리지 Setup
    await setupSafeStorage();
    
    appState.securityInitialized = true;
    debugLog('보안 Setup 초기화 Completed');
    
  } catch (error) {
    errorLog('보안 Setup 초기화 중 Error 발생:', error);
  }
}

/**
 * 키보드 모니터링 초기화
 */
async function initializeKeyboardMonitoring(): Promise<void> {
  try {
    const userSettings = await SettingsManager.getSettings();
    
    if (userSettings?.keyboard?.autoStart) {
      await initKeyboardMonitoring();
      appState.keyboardMonitoringActive = true;
      debugLog('키보드 모니터링 초기화 Completed');
    } else {
      debugLog('키보드 모니터링 비활성화됨');
    }
  } catch (error) {
    errorLog('키보드 모니터링 초기화 중 Error 발생:', error);
  }
}

/**
 * 시스템 모니터링 초기화
 */
async function initializeSystemMonitoring(): Promise<void> {
  try {
    // 메모리 관리자 초기화
    setupMemoryManager();
    appState.memoryManagerActive = true;
    
    // 전력 모니터링 Setup
    setupPowerMonitoring();
    
    // 시스템 정보 모듈 초기화
    initSystemInfoModule();
    
    // 타이핑 통계 모듈 초기화
    initTypingStatsModule();
    
    debugLog('시스템 모니터링 초기화 Completed');
  } catch (error) {
    errorLog('시스템 모니터링 초기화 중 Error 발생:', error);
  }
}

/**
 * 추가 기능 초기화
 */
async function initializeAdditionalFeatures(): Promise<void> {
  try {
    // 클립보드 워처 Setup
    setupClipboardWatcher();
    
    // 크래시 리포터 Setup
    setupCrashReporter();
    
    // 스크린샷 모듈 초기화
    initScreenshotModule(app);
    
    // 글로벌 단축키 Setup
    setupGlobalShortcuts();
    
    // 시스템 트레이 Setup
    const userSettings = await SettingsManager.getSettings();
    if (userSettings?.minimizeToTray) {
      setupTray();
    }
    
    // 메뉴 Setup
    setupMenu();
    
    debugLog('추가 기능 초기화 Completed');
  } catch (error) {
    errorLog('추가 기능 초기화 중 Error 발생:', error);
  }
}

/**
 * 애플리케이션 초기화
 */
export async function initializeApp(): Promise<void> {
  try {
    debugLog('Loop 6 애플리케이션 초기화 시작');
    
    // 1. Setup 로드
    await loadSettings();
    appState.settings = await SettingsManager.getSettings();
    
    // 2. 단일 인스턴스 보장
    setupSingleInstance();
    
    // 3. 보안 Setup 초기화
    await initializeSecuritySettings();
    
    // 4. GPU Setup 구성
    await setupGpuConfiguration();
    
    // 5. 기본 앱 이벤트 Setup
    setupAppEvents();
    
    // 6. 데이터베이스 초기화
    await initDatabase();
    
    // 7. 메인 윈도우 생성
    await createWindow();
    
    // 8. IPC 핸들러 Setup
    setupIpcHandlers();
    
    // 9. 시스템 모니터링 초기화
    await initializeSystemMonitoring();
    
    // 10. 키보드 모니터링 초기화
    await initializeKeyboardMonitoring();
    
    // 11. 자동 업데이트 초기화
    initUpdates();
    
    // 12. 추가 기능 초기화
    await initializeAdditionalFeatures();
    
    // 13. 메모리 상태 초기 확인
    await checkAndOptimizeMemoryIfNeeded();
    
    appState.isReady = true;
    debugLog('Loop 6 애플리케이션 초기화 Completed');
    
  } catch (error) {
    errorLog('애플리케이션 초기화 중 Error 발생:', error);
    throw error;
  }
}

/**
 * 단일 인스턴스 보장
 */
function setupSingleInstance(): void {
  const gotTheLock = app.requestSingleInstanceLock();
  
  if (!gotTheLock) {
    debugLog('이미 다른 인스턴스가 실행 중입니다. 앱을 종료합니다.');
    app.quit();
    return;
  }
  
  // 두 번째 인스턴스가 실행되었을 때
  app.on('second-instance', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * 앱 기본 이벤트 Setup
 */
function setupAppEvents(): void {
  // macOS에서는 모든 창이 닫혀도 앱을 유지
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  // macOS에서 독 아이콘 클릭 시 창 생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // 앱 종료 시 Cleanup 작업
  app.on('will-quit', async () => {
    await cleanupApp();
  });
  
  // 앱 완전 종료 시
  app.on('before-quit', async () => {
    debugLog('애플리케이션 종료 준비');
  });
}

/**
 * 전역 예외 핸들러 Setup
 */
export function setupGlobalExceptionHandlers(): void {
  // 처리되지 않은 Promise 거부
  process.on('unhandledRejection', (reason, promise) => {
    errorLog('처리되지 않은 Promise 거부:', reason);
    errorLog('Promise:', promise);
  });
  
  // 처리되지 않은 예외
  process.on('uncaughtException', (error) => {
    errorLog('처리되지 않은 예외:', error);
    
    // 중요한 Error의 경우 앱 종료
    if (error.message.includes('EADDRINUSE') || 
        error.message.includes('permission denied')) {
      process.exit(1);
    }
  });
}

/**
 * 애플리케이션 Cleanup
 */
export async function cleanupApp(): Promise<void> {
  try {
    debugLog('애플리케이션 Cleanup 시작');
    
    // 트레이 아이콘 제거
    destroyTray();
    
    // 데이터베이스 연결 종료
    await closeDatabase();
    
    // 네이티브 모듈 Cleanup
    // 필요한 경우 네이티브 모듈의 Cleanup 함수 호출
    
    debugLog('애플리케이션 Cleanup Completed');
  } catch (error) {
    errorLog('애플리케이션 Cleanup 중 Error 발생:', error);
  }
}

/**
 * 앱 상태 가져오기
 */
export function getAppState(): AppState {
  return { ...appState };
}

/**
 * 앱 준비 상태 확인
 */
export function isAppReady(): boolean {
  return appState.isReady;
}
