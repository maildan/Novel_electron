import { app, BrowserWindow } from 'electron';
import { AppConfig } from './config';
import { WindowManager } from './window';
import { KeyboardManager } from './keyboard';
import { ipcHandlers } from './ipc-handlers';

class ElectronApp {
  private windowManager: WindowManager;
  private keyboardManager: KeyboardManager;

  constructor() {
    this.windowManager = WindowManager.getInstance();
    this.keyboardManager = KeyboardManager.getInstance();
    this.initialize();
  }

  private initialize(): void {
    console.log('[App] Electron 애플리케이션 초기화 시작');
    
    // 개발 모드에서 보안 및 CSP 비활성화
    if (AppConfig.isDevelopment) {
      this.setupDevelopmentMode();
    }

    // GPU Setup
    this.setupGpuAcceleration();
    
    // 앱 준비 대기
    app.whenReady().then(() => {
      this.onReady();
    });

    // 모든 창이 닫혔을 때
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 앱 활성화 시 (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow();
      }
    });

    // 앱 종료 전
    app.on('before-quit', () => {
      this.cleanup();
    });

    // 보안 이벤트 처리
    this.setupSecurityHandlers();
  }

  private setupDevelopmentMode(): void {
    console.log('[App] 개발 모드 Setup - 보안 제한 비활성화');
    
    // 보안 Warning 비활성화
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    
    // CSP 및 보안 관련 명령줄 스위치
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('allow-insecure-localhost');
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    app.commandLine.appendSwitch('allow-running-insecure-content');
  }

  private setupGpuAcceleration(): void {
    // GPU 모드 Setup (기본값은 하드웨어 가속)
    const gpuMode = process.env.GPU_MODE || 'hardware';
    
    if (gpuMode === 'software') {
      console.log('[App] GPU 모드: Software - 하드웨어 가속 비활성화');
      app.disableHardwareAcceleration();
      app.commandLine.appendSwitch('disable-gpu');
      app.commandLine.appendSwitch('disable-gpu-compositing');
    } else {
      console.log('[App] GPU 모드: Hardware - 하드웨어 가속 활성화');
      app.commandLine.appendSwitch('enable-hardware-acceleration');
      app.commandLine.appendSwitch('ignore-gpu-blacklist');
    }

    // GPU 프로세스 크래시 제한 비활성화 (디버깅용)
    app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
    
    if (AppConfig.isDevelopment) {
      app.commandLine.appendSwitch('debug-gpu');
    }
  }

  private setupSecurityHandlers(): void {
    // 웹 컨텐츠 생성 시 보안 Setup
    app.on('web-contents-created', (event, contents) => {
      // 새 창 생성 제한
      contents.setWindowOpenHandler(({ url }) => {
        console.log('[Security] 새 창 생성 요청 차단:', url);
        return { action: 'deny' };
      });

      // 네비게이션 제한 (개발 모드 제외)
      if (!AppConfig.isDevelopment) {
        contents.on('will-navigate', (event, navigationUrl) => {
          const parsedUrl = new URL(navigationUrl);
          const allowedUrl = `http://localhost:${AppConfig.port}`;
          if (parsedUrl.origin !== allowedUrl) {
            console.log('[Security] 외부 네비게이션 차단:', navigationUrl);
            event.preventDefault();
          }
        });
      }
    });
  }

  private async onReady(): Promise<void> {
    console.log('[App] Electron 앱 준비 Completed');
    
    try {
      // 1. IPC 핸들러 등록 (Setup 관리자 포함)
      console.log('[App] IPC 핸들러 등록 중...');
      await ipcHandlers.register();
      
      // 2. 키보드 매니저 초기화
      console.log('[App] 키보드 매니저 초기화 중...');
      await this.keyboardManager.initialize();
      
      // 3. 메인 윈도우 생성
      console.log('[App] 메인 윈도우 생성 중...');
      await this.windowManager.createMainWindow();
      
      console.log('[App] 애플리케이션 초기화 Completed');
      
      // 개발 모드에서 개발자 도구 자동 열기
      if (AppConfig.isDevelopment) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.openDevTools();
        }
      }
      
    } catch (error) {
      console.error('[App] 애플리케이션 초기화 Failed:', error);
      app.quit();
    }
  }

  private cleanup(): void {
    console.log('[App] 애플리케이션 Cleanup 시작');
    
    try {
      // 키보드 매니저 Cleanup
      this.keyboardManager.dispose();
      
      console.log('[App] 애플리케이션 Cleanup Completed');
    } catch (error) {
      console.error('[App] Cleanup 중 Error:', error);
    }
  }
}

// 단일 인스턴스 보장
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.warn('[App] 이미 실행 중인 인스턴스가 있습니다. 종료합니다.');
  app.quit();
} else {
  app.on('second-instance', () => {
    // 두 번째 인스턴스 실행 시 첫 번째 인스턴스 윈도우에 포커스
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 애플리케이션 인스턴스 생성
  new ElectronApp();
}
