/**
 * Loop 6 Setup 관련 IPC 핸들러
 * 
 * Setup 페이지에서 요청하는 다양한 Setup 기능들의 실제 구현
 */

import { ipcMain, app } from 'electron';
import SettingsManager from './settings-manager';
import { WindowManager } from './window';
import { getGPUManager, getGPUInfo, isHardwareAccelerationEnabled } from './gpuUtils';

// GPU 유틸리티 모듈 상태 확인
console.log('[설정IPC핸들러] GPU 유틸리티 모듈 로드됨:', {
  getGPUManager: typeof getGPUManager,
  getGPUInfo: typeof getGPUInfo,
  isHardwareAccelerationEnabled: typeof isHardwareAccelerationEnabled
});

// 새로운 타입 시스템 적용
import type { 
  SettingsIpcTypes
} from '../types/ipc';
import { 
  createSuccessResponse,
  createErrorResponse,
  createIpcError
} from '../types/ipc';
import { CHANNELS } from '../preload/channels';

// 타입 및 유틸리티 함수들 사용 확인
console.log('[설정IPC핸들러] 타입 시스템 로드됨:', {
  createSuccessResponse: typeof createSuccessResponse,
  createErrorResponse: typeof createErrorResponse,
  createIpcError: typeof createIpcError
});

// 채널 상수 확인
console.log('[설정IPC핸들러] CHANNELS 상수 로드됨:', typeof CHANNELS);

export class SettingsIpcHandlers {
  private static instance: SettingsIpcHandlers;
  private isRegistered = false;

  private constructor() {}

  static getInstance(): SettingsIpcHandlers {
    if (!SettingsIpcHandlers.instance) {
      SettingsIpcHandlers.instance = new SettingsIpcHandlers();
    }
    return SettingsIpcHandlers.instance;
  }

  /**
   * Setup 관련 IPC 핸들러 등록
   */
  register(): void {
    if (this.isRegistered) {
      console.log('Setup IPC 핸들러가 이미 등록되어 있습니다');
      return;
    }

    console.log('Setup IPC 핸들러 등록 중...');

    // 처리 모드 Setup
    ipcMain.handle('setProcessingMode', async (event, mode: string): Promise<SettingsIpcTypes.SettingsIpcResponse<{ mode: string }>> => {
      try {
        console.log(`[설정IPC] 처리 모드 설정 요청: ${mode}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('processingMode', mode);
        
        // GPU 정보 확인 및 로깅
        const gpuInfo = await getGPUInfo();
        console.log('[설정IPC] 현재 GPU 정보:', gpuInfo);
        
        // 하드웨어 가속 상태 확인
        const hwAccelEnabled = isHardwareAccelerationEnabled();
        console.log('[설정IPC] 하드웨어 가속 상태:', hwAccelEnabled);
        
        // 처리 모드에 따른 추가 Setup
        switch (mode) {
          case 'gpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', true);
            break;
          case 'cpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', false);
            break;
          case 'auto': {
            // GPU 사용 가능 여부에 따라 자동 Setup
            const gpuAvailable = await this.checkGPUAvailability();
            await SettingsManager.updateSetting('enableGPUAcceleration', gpuAvailable);
            break;
          }
        }

        const response: SettingsIpcTypes.SettingsIpcResponse<{ mode: string }> = {
          success: true,
          data: { mode },
          message: `처리 모드가 '${mode}'로 설정되었습니다.`,
          timestamp: Date.now()
        };
        
        return response;
      } catch (error) {
        console.error('처리 모드 Setup Failed:', error);
        
        const errorResponse: SettingsIpcTypes.SettingsIpcResponse<{ mode: string }> = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          message: `처리 모드 설정에 실패했습니다.`,
          timestamp: Date.now()
        };
        
        return errorResponse;
      }
    });

    // GPU 가속 Setup
    ipcMain.handle('setGPUAcceleration', async (event, enabled: boolean): Promise<SettingsIpcTypes.SettingsIpcResponse<{ enabled: boolean; gpuInfo?: any }>> => {
      try {
        console.log(`[설정IPC] GPU 가속 설정 요청: ${enabled}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('enableGPUAcceleration', enabled);
        
        // GPU 관련 Setup 적용 (재시작 필요)
        console.log(`GPU 가속 ${enabled ? '활성화' : '비활성화'}`);
        
        const response: SettingsIpcTypes.SettingsIpcResponse<{ enabled: boolean; gpuInfo?: any }> = {
          success: true,
          data: { enabled },
          message: `GPU 가속이 ${enabled ? '활성화' : '비활성화'}되었습니다. 재시작 후 적용됩니다.`,
          requiresRestart: true,
          timestamp: Date.now()
        };
        
        return response;
      } catch (error) {
        console.error('GPU 가속 Setup Failed:', error);
        
        const errorResponse: SettingsIpcTypes.SettingsIpcResponse<{ enabled: boolean; gpuInfo?: any }> = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          message: `GPU 가속 설정에 실패했습니다.`,
          timestamp: Date.now()
        };
        
        return errorResponse;
      }
    });

    // 메모리 최적화 실행
    ipcMain.handle('optimizeMemory', async () => {
      try {
        // 가비지 컬렉션 강제 실행
        if (global.gc) {
          global.gc();
        }

        // 프로세스 메모리 Cleanup
        const memoryBefore = process.memoryUsage();
        
        // Node.js 메모리 최적화
        if (process.platform !== 'win32') {
          process.nextTick(() => {
            if (global.gc) global.gc();
          });
        }

        const memoryAfter = process.memoryUsage();
        const savedMemory = Math.round((memoryBefore.heapUsed - memoryAfter.heapUsed) / 1024 / 1024);

        return {
          success: true,
          message: `메모리 최적화 Completed${savedMemory > 0 ? ` (${savedMemory}MB 절약)` : ''}`,
          memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
          memoryAfter: Math.round(memoryAfter.heapUsed / 1024 / 1024),
          saved: savedMemory
        };
      } catch (error) {
        console.error('메모리 최적화 Failed:', error);
        return {
          success: false,
          message: `메모리 최적화 Failed: ${error}`
        };
      }
    });

    // 전체화면 모드 Setup
    ipcMain.handle('setFullscreenMode', async (event, mode: 'windowed' | 'fullscreen' | 'fullscreen-auto-hide') => {
      try {
        console.log(`[설정IPC] 전체화면 모드 설정 요청: ${mode}, 요청자: ${event.sender.id}`);
        const windowManager = WindowManager.getInstance();
        const mainWindow = windowManager.getMainWindow();
        
        if (!mainWindow) {
          return {
            success: false,
            message: '메인 윈도우를 찾을 수 없습니다'
          };
        }

        switch (mode) {
          case 'windowed':
            mainWindow.setFullScreen(false);
            mainWindow.setAutoHideMenuBar(false);
            break;
          case 'fullscreen':
            mainWindow.setFullScreen(true);
            mainWindow.setAutoHideMenuBar(false);
            break;
          case 'fullscreen-auto-hide':
            mainWindow.setFullScreen(true);
            mainWindow.setAutoHideMenuBar(true);
            break;
        }

        await SettingsManager.updateSetting('windowMode', mode);

        return {
          success: true,
          message: `화면 모드가 ${mode}로 변경되었습니다`,
          mode
        };
      } catch (error) {
        console.error('화면 모드 Setup Failed:', error);
        return {
          success: false,
          message: `화면 모드 Setup Failed: ${error}`
        };
      }
    });

    // 알림 Setup
    ipcMain.handle('setNotifications', async (event, enabled: boolean) => {
      try {
        console.log(`[설정IPC] 알림 설정 요청: ${enabled}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('enableNotifications', enabled);
        
        return {
          success: true,
          message: `알림이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('알림 Setup Failed:', error);
        return {
          success: false,
          message: `알림 Setup Failed: ${error}`
        };
      }
    });

    // 애니메이션 Setup
    ipcMain.handle('setAnimations', async (event, enabled: boolean) => {
      try {
        console.log(`[설정IPC] 애니메이션 설정 요청: ${enabled}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('enableAnimations', enabled);
        
        return {
          success: true,
          message: `애니메이션이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('애니메이션 Setup Failed:', error);
        return {
          success: false,
          message: `애니메이션 Setup Failed: ${error}`
        };
      }
    });

    // 데이터 수집 Setup
    ipcMain.handle('setDataCollection', async (event, enabled: boolean) => {
      try {
        console.log(`[설정IPC] 데이터 수집 설정 요청: ${enabled}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('enableDataCollection', enabled);
        
        return {
          success: true,
          message: `데이터 수집이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('데이터 수집 Setup Failed:', error);
        return {
          success: false,
          message: `데이터 수집 Setup Failed: ${error}`
        };
      }
    });

    // 자동 저장 Setup
    ipcMain.handle('setAutoSave', async (event, enabled: boolean) => {
      try {
        console.log(`[설정IPC] 자동 저장 설정 요청: ${enabled}, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('enableAutoSave', enabled);
        
        return {
          success: true,
          message: `자동 저장이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('자동 저장 Setup Failed:', error);
        return {
          success: false,
          message: `자동 저장 Setup Failed: ${error}`
        };
      }
    });

    // 데이터 보관 기간 Setup
    ipcMain.handle('setDataRetention', async (event, days: number) => {
      try {
        console.log(`[설정IPC] 데이터 보관 기간 설정 요청: ${days}일, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('dataRetentionDays', days);
        
        return {
          success: true,
          message: `데이터 보관 기간이 ${days}일로 Setup되었습니다`,
          days
        };
      } catch (error) {
        console.error('데이터 보관 기간 Setup Failed:', error);
        return {
          success: false,
          message: `데이터 보관 기간 Setup Failed: ${error}`
        };
      }
    });

    // 메모리 임계값 Setup
    ipcMain.handle('setMemoryThreshold', async (event, threshold: number) => {
      try {
        console.log(`[설정IPC] 메모리 임계값 설정 요청: ${threshold}MB, 요청자: ${event.sender.id}`);
        await SettingsManager.updateSetting('maxMemoryThreshold', threshold);
        
        return {
          success: true,
          message: `메모리 임계값이 ${threshold}MB로 Setup되었습니다`,
          threshold
        };
      } catch (error) {
        console.error('메모리 임계값 Setup Failed:', error);
        return {
          success: false,
          message: `메모리 임계값 Setup Failed: ${error}`
        };
      }
    });

    // 앱 재시작
    ipcMain.handle('restartApp', async (event, reason?: string) => {
      try {
        console.log(`[설정IPC] 앱 재시작 요청: ${reason || 'Setup 변경'}, 요청자: ${event.sender.id}`);
        console.log(`🔄 애플리케이션 재시작 요청: ${reason || 'Setup 변경'}`);
        
        // 잠시 대기 후 재시작 (UI에 피드백 시간 제공)
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);

        return {
          success: true,
          message: '애플리케이션이 재시작됩니다...'
        };
      } catch (error) {
        console.error('❌ 앱 재시작 Failed:', error);
        return {
          success: false,
          message: `재시작 Failed: ${error}`
        };
      }
    });

    this.isRegistered = true;
    console.log('Setup IPC 핸들러 등록 Completed');
  }

  /**
   * GPU 사용 가능 여부 확인
   */
  private async checkGPUAvailability(): Promise<boolean> {
    try {
      // GPU 정보 확인 로직 (간단한 구현)
      return app.commandLine.hasSwitch('disable-gpu') ? false : true;
    } catch (error) {
      console.error('GPU 사용 가능 여부 확인 Failed:', error);
      return false;
    }
  }

  /**
 * 핸들러 Cleanup
 */
  cleanup(): void {
    if (this.isRegistered) {
      // IPC 핸들러 제거는 Electron에서 자동으로 처리됨
      this.isRegistered = false;
      console.log('Setup IPC 핸들러 Cleanup Completed');
    }
  }
}

export default SettingsIpcHandlers.getInstance();
