/**
 * Loop 6 Setup 관련 IPC 핸들러
 * 
 * Setup 페이지에서 요청하는 다양한 Setup 기능들의 실제 구현
 */

import { ipcMain, app } from 'electron';
import SettingsManager from './settings-manager';
import { WindowManager } from './window';
import { getGPUManager, getGPUInfo, isHardwareAccelerationEnabled } from './gpuUtils';

// GPU 유틸리티 모듈 확인
console.log('[SettingsIpcHandlers] GPU 유틸리티 로드:', {
  getGPUManager: typeof getGPUManager,
  getGPUInfo: typeof getGPUInfo,
  isHardwareAccelerationEnabled: typeof isHardwareAccelerationEnabled
});

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
    ipcMain.handle('setProcessingMode', async (event, mode: string) => {
      console.log(`[SettingsIpc] 설정 요청: 'setProcessingMode', 발신자: ${event.sender.id}`);
      try {
        console.log(`[SettingsIpc] 처리 모드 설정 요청: ${mode}, 발신자: ${event.sender.id}`);
        await SettingsManager.updateSetting('processingMode', mode);
        
        // 처리 모드에 따른 추가 Setup
        switch (mode) {
          case 'gpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', true);
            break;
          case 'cpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', false);
            break;
          case 'auto':
            // GPU 사용 가능 여부에 따라 자동 Setup
            const gpuAvailable = await this.checkGPUAvailability();
            await SettingsManager.updateSetting('enableGPUAcceleration', gpuAvailable);
            break;
        }

        return {
          success: true,
          message: `처리 모드가 ${mode}로 Setup되었습니다`,
          mode
        };
      } catch (error) {
        console.error('처리 모드 Setup Failed:', error);
        return {
          success: false,
          message: `처리 모드 Setup Failed: ${error}`
        };
      }
    });

    // GPU 가속 Setup
    ipcMain.handle('setGPUAcceleration', async (event, enabled: boolean) => {
      console.log(`[SettingsIpc] 설정 요청: 'setGPUAcceleration', 발신자: ${event.sender.id}`);
      try {
        console.log(`[SettingsIpc] GPU 가속 설정 요청: ${enabled}, 발신자: ${event.sender.id}`);
        
        // GPU 정보 확인
        const gpuInfo = await getGPUInfo();
        console.log('[SettingsIpc] 현재 GPU 정보:', gpuInfo);
        
        // 하드웨어 가속 상태 확인
        const hwAccelEnabled = isHardwareAccelerationEnabled();
        console.log('[SettingsIpc] 하드웨어 가속 상태:', hwAccelEnabled);
        await SettingsManager.updateSetting('enableGPUAcceleration', enabled);
        
        // GPU 관련 Setup 적용 (재시작 필요)
        console.log(`GPU 가속 ${enabled ? '활성화' : '비활성화'}`);
        
        return {
          success: true,
          message: `GPU 가속이 ${enabled ? '활성화' : '비활성화'}되었습니다. 재시작 후 적용됩니다.`,
          requiresRestart: true
        };
      } catch (error) {
        console.error('GPU 가속 Setup Failed:', error);
        return {
          success: false,
          message: `GPU 가속 Setup Failed: ${error}`
        };
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
      console.log(`[SettingsIpc] 설정 요청: 'setFullscreenMode', 발신자: ${event.sender.id}`);
      try {
        console.log(`[SettingsIpc] 전체화면 모드 설정: ${mode}, 발신자: ${event.sender.id}`);
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
      console.log(`[SettingsIpc] 알림 설정 요청: ${enabled}, 발신자: ${event.sender.id}`);
      try {
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
      console.log(`[SettingsIpc] 애니메이션 설정 요청: ${enabled}, 발신자: ${event.sender.id}`);
      try {
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
      console.log(`[SettingsIpc] 데이터 수집 설정: ${enabled}, 발신자: ${event.sender.id}`);
      try {
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
      console.log(`[SettingsIpc] 자동 저장 설정: ${enabled}, 발신자: ${event.sender.id}`);
      try {
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
      console.log(`[SettingsIpc] 데이터 보존 설정: ${days}일, 발신자: ${event.sender.id}`);
      try {
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
      console.log(`[SettingsIpc] 메모리 임계값 설정: ${threshold}%, 발신자: ${event.sender.id}`);
      try {
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
