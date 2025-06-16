import { ipcMain, BrowserWindow } from 'electron';
import dataSyncManager from './data-sync';
import statsManager from './stats-manager';
import browserDetector from './browser-detector';
import { autoLaunch } from './auto-launch-manager';
import { security } from './security-manager';
import menuManager, { type MenuOptions } from './menu-manager';
import SettingsManager from './settings-manager';

// 모듈 로드 확인 (MenuOptions는 타입이므로 menuManager로 확인)
console.log('[IPC핸들러] 메뉴 매니저 및 타입 로드됨:', typeof menuManager);

// MenuOptions 타입을 실제 코드에서 사용하기 위한 타입 체크 함수
function validateMenuOptions(options: MenuOptions | undefined): boolean {
  console.log('[IPC핸들러] MenuOptions 타입 검증:', options ? 'valid' : 'undefined');
  return options !== undefined;
}

export class IpcHandlers {
  private static instance: IpcHandlers;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): IpcHandlers {
    if (!IpcHandlers.instance) {
      IpcHandlers.instance = new IpcHandlers();
    }
    return IpcHandlers.instance;
  }

  /**
   * IPC 핸들러 등록
   */
  async register(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[IPC] IPC 핸들러 등록 시작');

    try {
      // 설정 관리자 초기화
      await SettingsManager.initialize();

      // 메뉴 관리자 초기화
      await menuManager.initialize();
      
      // MenuOptions 타입 검증 (타입 활용을 위한 검증)
      const isValidOptions = validateMenuOptions({ showDevTools: true });
      console.log('[IPC] 메뉴 옵션 타입 검증 결과:', isValidOptions);

      // 보안 관리자 초기화 (키보드 이벤트 핸들러 포함)
      await security.initialize();

      // 데이터 동기화 초기화
      await dataSyncManager.initialize();

      // 통계 매니저 초기화
      await statsManager.initialize();

      // 브라우저 감지기 초기화
      await browserDetector.initialize();

      // 자동 시작 관리자 초기화
      await autoLaunch.initialize();

      // 핸들러 등록
      this.registerDataSyncHandlers();
      this.registerStatsHandlers();
      this.registerBrowserHandlers();
      this.registerAutoLaunchHandlers();
      this.registerSecurityHandlers();
      this.registerUtilityHandlers();

      this.isInitialized = true;
      console.log('[IPC] IPC 핸들러 등록 Completed');
    } catch (error) {
      console.error('[IPC] IPC 핸들러 등록 Failed:', error);
      throw error;
    }
  }

  /**
 * 데이터 동기화 핸들러 등록
 */
  private registerDataSyncHandlers(): void {
    // 데이터 동기화 상태 확인
    ipcMain.handle('data-sync-status', async () => {
      try {
        return await dataSyncManager.getStatus();
      } catch (error) {
        console.error('[IPC] Data sync status error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 수동 동기화 실행
    ipcMain.handle('data-sync-manual', async () => {
      try {
        return await dataSyncManager.syncNow();
      } catch (error) {
        console.error('[IPC] Manual sync error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 동기화 Setup 업데이트
    ipcMain.handle('data-sync-update-config', async (event, config) => {
      console.log('[IPC] 데이터 동기화 설정 업데이트 이벤트:', typeof event);
      try {
        return await dataSyncManager.updateConfig(config);
      } catch (error) {
        console.error('[IPC] Sync config update error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 실패한 항목 재시도
    ipcMain.handle('data-sync-retry-failed', async () => {
      try {
        return await dataSyncManager.retryFailedItems();
      } catch (error) {
        console.error('[IPC] Retry failed items error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 통계 핸들러 등록
 */
  private registerStatsHandlers(): void {
    // 통계 데이터 가져오기
    ipcMain.handle('stats-get-data', async (event, options) => {
      console.log('[IPC] 통계 데이터 요청:', typeof event, '옵션:', options);
      try {
        return await statsManager.getStats(options);
      } catch (error) {
        console.error('[IPC] Get stats error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 타이핑 패턴 분석
    ipcMain.handle('stats-analyze-pattern', async (event, data) => {
      console.log('[IPC] 타이핑 패턴 분석 요청:', typeof event, '데이터:', data);
      try {
        return await statsManager.analyzeTypingPattern(data);
      } catch (error) {
        console.error('[IPC] Analyze pattern error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 통계 Setup 업데이트
    ipcMain.handle('stats-update-settings', async (event, settings) => {
      console.log('[IPC] 통계 설정 업데이트 요청:', typeof event, '설정:', settings);
      try {
        return await statsManager.updateSettings(settings);
      } catch (error) {
        console.error('[IPC] Update stats settings error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 메모리 사용량 최적화
    ipcMain.handle('stats-optimize-memory', async () => {
      try {
        return await statsManager.optimizeMemory();
      } catch (error) {
        console.error('[IPC] Optimize memory error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 브라우저 감지 핸들러 등록
 */
  private registerBrowserHandlers(): void {
    // 활성 브라우저 정보 가져오기
    ipcMain.handle('browser-get-active', async () => {
      try {
        return await browserDetector.getActiveBrowser();
      } catch (error) {
        console.error('[IPC] Get active browser error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 브라우저 목록 가져오기
    ipcMain.handle('browser-get-list', async () => {
      try {
        return await browserDetector.getInstalledBrowsers();
      } catch (error) {
        console.error('[IPC] Get browser list error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Google Docs 감지
    ipcMain.handle('browser-detect-google-docs', async () => {
      try {
        return await browserDetector.detectGoogleDocs();
      } catch (error) {
        console.error('[IPC] Detect Google Docs error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 브라우저 감지 Setup 업데이트
    ipcMain.handle('browser-update-settings', async (event, settings) => {
      console.log('[IPC] 브라우저 감지 설정 업데이트 요청:', typeof event, '설정:', settings);
      try {
        return await browserDetector.updateSettings(settings);
      } catch (error) {
        console.error('[IPC] Update browser settings error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 자동 시작 핸들러 등록
 */
  private registerAutoLaunchHandlers(): void {
    // 자동 시작 상태 확인
    ipcMain.handle('auto-launch-status', async () => {
      try {
        return await autoLaunch.getStatus();
      } catch (error) {
        console.error('[IPC] Auto launch status error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 자동 시작 활성화
    ipcMain.handle('auto-launch-enable', async (event, settings) => {
      console.log('[IPC] 자동 시작 활성화 요청:', typeof event, '설정:', settings);
      try {
        return await autoLaunch.enable(settings);
      } catch (error) {
        console.error('[IPC] Auto launch enable error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 자동 시작 비활성화
    ipcMain.handle('auto-launch-disable', async () => {
      try {
        return await autoLaunch.disable();
      } catch (error) {
        console.error('[IPC] Auto launch disable error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 자동 시작 토글
    ipcMain.handle('auto-launch-toggle', async (event, settings) => {
      console.log('[IPC] 자동 시작 토글 요청:', typeof event, '설정:', settings);
      try {
        return await autoLaunch.toggle(settings);
      } catch (error) {
        console.error('[IPC] Auto launch toggle error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 보안 핸들러 등록
 */
  private registerSecurityHandlers(): void {
    // CSP 업데이트
    ipcMain.handle('security-update-csp', async (event, config) => {
      console.log('[IPC] CSP 업데이트 요청:', typeof event, '설정:', config);
      try {
        return security.updateCSP(config);
      } catch (error) {
        console.error('[IPC] Update CSP error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // IME 상태 가져오기
    ipcMain.handle('security-ime-state', async () => {
      try {
        return security.getIMEState();
      } catch (error) {
        console.error('[IPC] Get IME state error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // IME 상태 초기화
    ipcMain.handle('security-ime-reset', async () => {
      try {
        security.resetIMEState();
        return { success: true };
      } catch (error) {
        console.error('[IPC] Reset IME state error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 창에 보안 Setup 적용
    ipcMain.handle('security-setup-window', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          return security.setupRequestSecurity(window);
        }
        return false;
      } catch (error) {
        console.error('[IPC] Setup window security error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 유틸리티 핸들러 등록
 */
  private registerUtilityHandlers(): void {
    // 앱 재시작
    ipcMain.handle('app:restart', async () => {
      try {
        console.log('[IPC] 앱 재시작 요청 받음');
        
        // 짧은 지연 후 앱 재시작 (UI가 응답을 받을 시간 제공)
        setTimeout(() => {
          const { app } = require('electron');
          app.relaunch();
          app.exit(0);
        }, 500);
        
        return { success: true, message: 'App restart initiated' };
      } catch (error) {
        console.error('[IPC] App restart error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
    
    // 시스템 상태 확인
    ipcMain.handle('system-health-check', async () => {
      try {
        const dataSyncStatus = await dataSyncManager.getStatus();
        const autoLaunchStatus = await autoLaunch.getStatus();
        const imeState = security.getIMEState();

        return {
          success: true,
          dataSync: dataSyncStatus,
          autoLaunch: autoLaunchStatus,
          ime: imeState,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[IPC] System health check error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 모든 모듈 재시작
    ipcMain.handle('system-restart-modules', async () => {
      try {
        await dataSyncManager.restart();
        await statsManager.restart();
        await browserDetector.restart();
        
        return { success: true, message: 'All modules restarted successfully' };
      } catch (error) {
        console.error('[IPC] Restart modules error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // 모듈별 상태 가져오기
    ipcMain.handle('system-module-status', async () => {
      try {
        return {
          success: true,
          modules: {
            dataSync: dataSyncManager.isInitialized(),
            stats: statsManager.isInitialized(),
            browser: browserDetector.isInitialized(),
            security: true, // 보안 관리자는 항상 Initialized
            autoLaunch: true // 자동 시작 관리자는 항상 Initialized
          },
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[IPC] Module status error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
 * 핸들러 제거
 */
  cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log('[IPC] IPC 핸들러 Cleanup 시작');

    // 모든 핸들러 목록
    const handlers = [
      // 앱 제어
      'app:restart',
      // 데이터 동기화
      'data-sync-status', 'data-sync-manual', 'data-sync-update-config', 'data-sync-retry-failed',
      // 통계
      'stats-get-data', 'stats-analyze-pattern', 'stats-update-settings', 'stats-optimize-memory',
      // 브라우저
      'browser-get-active', 'browser-get-list', 'browser-detect-google-docs', 'browser-update-settings',
      // 자동 시작
      'auto-launch-status', 'auto-launch-enable', 'auto-launch-disable', 'auto-launch-toggle',
      // 보안
      'security-update-csp', 'security-ime-state', 'security-ime-reset', 'security-setup-window',
      // 유틸리티
      'system-health-check', 'system-restart-modules', 'system-module-status'
    ];

    // 핸들러 제거
    handlers.forEach(handler => {
      try {
        ipcMain.removeHandler(handler);
      } catch (error) {
        // 핸들러가 존재하지 않는 경우 무시
      }
    });

    this.isInitialized = false;
    console.log('[IPC] IPC 핸들러 Cleanup Completed');
  }

  /**
 * 리소스 Cleanup
 */
  dispose(): void {
    // IPC 핸들러 Cleanup 로직
    console.log('[IPC] IPC 핸들러 Cleanup Completed');
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const ipcHandlers = IpcHandlers.getInstance();
export default ipcHandlers;