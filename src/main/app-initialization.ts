/**
 * 애플리케이션 초기화 로직
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// 매니저들 import
import { WindowManager } from './window';
import { KeyboardManager } from './keyboard';
import { DatabaseManager } from './database';
import { MemoryManager } from './memory';
import { SystemMonitor } from './system-monitor';
import { IpcHandlers } from './ipc-handlers';
import { StaticServer } from './static-server';

// IPC 핸들러들 import
import { setupAllHandlers } from './handlers-manager';
import { registerWindowHandlers, initializeWindowHandlers } from './windowHandlers';
import { registerKeyboardHandlers, initializeKeyboardHandlers } from './keyboardHandlers';
import { registerSystemInfoIpcHandlers } from './systemInfoIpc';
import { registerNativeIpcHandlers } from './native-ipc';

// 환경 설정
import { isDev } from './app-config';

// 데이터 수집기 (임시)
const dataCollector = {
  log: (category: string, message: string) => {
    console.log(`[${category}] ${message}`);
  }
};

// 앱 상태 인터페이스
export interface AppState {
  isInitialized: boolean;
  windowManager: WindowManager | null;
  settingsManagerInitialized: boolean;
  keyboardManager: KeyboardManager | null;
  staticServer: StaticServer | null;
  protocolsRegistered: boolean;
  securityInitialized: boolean;
  ipcHandlersRegistered: boolean;
  keyboardInitialized: boolean;
}

// 앱 상태 초기화
export const appState: AppState = {
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
export function initializeManagers(): void {
  console.log('핵심 매니저 초기화 중...');
  dataCollector.log('system', '핵심 매니저 초기화 시작');
  
  try {
    // Initialize in dependency order - settings manager first as other managers may depend on it
    appState.windowManager = WindowManager.getInstance();
    appState.keyboardManager = KeyboardManager.getInstance();
    
    // 데이터베이스 매니저 인스턴스 생성
    const databaseManager = new DatabaseManager();
    console.log('데이터베이스 매니저 초기화됨:', typeof databaseManager);
    
    // 메모리 매니저 인스턴스 생성 
    const memoryManager = MemoryManager.getInstance();
    console.log('메모리 매니저 초기화됨:', typeof memoryManager);
    
    // 시스템 모니터 인스턴스 생성
    const systemMonitor = SystemMonitor.getInstance();
    console.log('시스템 모니터 초기화됨:', typeof systemMonitor);
    
    // IPC 핸들러 인스턴스 확인
    const ipcHandlers = IpcHandlers.getInstance();
    console.log('IPC 핸들러 초기화됨:', typeof ipcHandlers);
    
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
    
    console.log('핵심 매니저 초기화 Success');
    dataCollector.log('system', '핵심 매니저 초기화 Completed');
  } catch (error) {
    console.error('매니저 초기화 Error:', error);
    throw error;
  }
}

/**
 * IPC 핸들러들 등록
 */
export async function registerAllIpcHandlers(): Promise<void> {
  console.log('IPC 핸들러 등록 중...');
  dataCollector.log('system', 'IPC 핸들러 등록 시작');
  
  try {
    // 통합 핸들러 매니저로 모든 핸들러 등록
    const handlersSetup = await setupAllHandlers();
    if (!handlersSetup) {
      throw new Error('핸들러 등록에 실패했습니다');
    }
    
    // 개별 IPC 핸들러들도 등록 확인
    registerWindowHandlers();
    registerKeyboardHandlers();
    registerSystemInfoIpcHandlers();
    registerNativeIpcHandlers();
    
    // BrowserWindow 관련 정보 로깅
    const allWindows = BrowserWindow.getAllWindows();
    console.log(`현재 BrowserWindow 개수: ${allWindows.length}`);
    
    appState.ipcHandlersRegistered = true;
    console.log('IPC 핸들러 등록 Success');
    dataCollector.log('system', 'IPC 핸들러 등록 Completed');
  } catch (error) {
    console.error('IPC 핸들러 등록 Error:', error);
    throw error;
  }
}

/**
 * 핵심 시스템 초기화
 */
export async function initializeCoreSystem(): Promise<void> {
  console.log('핵심 시스템 초기화 중...');
  dataCollector.log('system', '핵심 시스템 초기화 시작');
  
  try {
    // Initialize settings manager first - other managers may depend on settings
    // 설정 매니저 초기화는 다른 매니저들이 시작되기 전에 완료되어야 함
    if (!appState.settingsManagerInitialized) {
      // 설정 매니저 초기화 로직이 있다면 여기에 추가
      appState.settingsManagerInitialized = true;
    }
    
    // Initialize keyboard system if keyboard manager is available
    if (appState.keyboardManager && !appState.keyboardInitialized) {
      console.log('키보드 시스템 초기화 중...');
      await appState.keyboardManager.initialize();
      
      // 키보드 핸들러도 초기화
      await initializeKeyboardHandlers();
      
      appState.keyboardInitialized = true;
      console.log('키보드 시스템 초기화 완료');
    }
    
    // 윈도우 핸들러 초기화
    initializeWindowHandlers();
    console.log('윈도우 핸들러 초기화 완료');
    
    // Start static server if available
    if (appState.staticServer) {
      console.log('정적 서버 시작 중...');
      
      // path 모듈을 사용하여 로그 디렉토리 확인
      const logPath = path.join(app.getPath('userData'), 'logs');
      console.log(`로그 디렉토리 경로: ${logPath}`);
      
      await appState.staticServer.start();
      console.log('정적 서버 시작 완료');
    }
    
    appState.isInitialized = true;
    console.log('핵심 시스템 초기화 Success');
    dataCollector.log('system', '핵심 시스템 초기화 Completed');
  } catch (error) {
    console.error('핵심 시스템 초기화 Error:', error);
    throw error;
  }
}

/**
 * 앱 준비 완료 핸들러
 */
export async function onAppReady(): Promise<void> {
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
    if (appState.windowManager) {
      console.log('메인 윈도우 생성 중...');
      await appState.windowManager.createMainWindow();
      console.log('메인 윈도우 생성 완료');
    }
    
    console.log('앱 초기화 완료');
    dataCollector.log('system', '앱 초기화 완료');
  } catch (error) {
    console.error('앱 초기화 중 오류:', error);
    dataCollector.log('system', `앱 초기화 오류: ${error}`);
    
    // Show error dialog and quit
    app.quit();
  }
}
