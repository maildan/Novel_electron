/**
 * Loop 6 설정 관련 IPC 핸들러
 * 
 * 설정 페이지에서 요청하는 다양한 설정 기능들의 실제 구현
 */

import { ipcMain, app } from 'electron';
import SettingsManager from './settings-manager';
import { WindowManager } from './window';
import { getGPUManager, getGPUInfo, isHardwareAccelerationEnabled } from './gpuUtils';

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
   * 설정 관련 IPC 핸들러 등록
   */
  register(): void {
    if (this.isRegistered) {
      console.log('설정 IPC 핸들러가 이미 등록되어 있습니다');
      return;
    }

    console.log('설정 IPC 핸들러 등록 중...');

    // 처리 모드 설정
    ipcMain.handle('setProcessingMode', async (event, mode: string) => {
      try {
        await SettingsManager.updateSetting('processingMode', mode);
        
        // 처리 모드에 따른 추가 설정
        switch (mode) {
          case 'gpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', true);
            break;
          case 'cpu-intensive':
            await SettingsManager.updateSetting('enableGPUAcceleration', false);
            break;
          case 'auto':
            // GPU 사용 가능 여부에 따라 자동 설정
            const gpuAvailable = await this.checkGPUAvailability();
            await SettingsManager.updateSetting('enableGPUAcceleration', gpuAvailable);
            break;
        }

        return {
          success: true,
          message: `처리 모드가 ${mode}로 설정되었습니다`,
          mode
        };
      } catch (error) {
        console.error('처리 모드 설정 실패:', error);
        return {
          success: false,
          message: `처리 모드 설정 실패: ${error}`
        };
      }
    });

    // GPU 가속 설정
    ipcMain.handle('setGPUAcceleration', async (event, enabled: boolean) => {
      try {
        await SettingsManager.updateSetting('enableGPUAcceleration', enabled);
        
        // GPU 관련 설정 적용 (재시작 필요)
        console.log(`GPU 가속 ${enabled ? '활성화' : '비활성화'}`);
        
        return {
          success: true,
          message: `GPU 가속이 ${enabled ? '활성화' : '비활성화'}되었습니다. 재시작 후 적용됩니다.`,
          requiresRestart: true
        };
      } catch (error) {
        console.error('GPU 가속 설정 실패:', error);
        return {
          success: false,
          message: `GPU 가속 설정 실패: ${error}`
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

        // 프로세스 메모리 정리
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
          message: `메모리 최적화 완료${savedMemory > 0 ? ` (${savedMemory}MB 절약)` : ''}`,
          memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
          memoryAfter: Math.round(memoryAfter.heapUsed / 1024 / 1024),
          saved: savedMemory
        };
      } catch (error) {
        console.error('메모리 최적화 실패:', error);
        return {
          success: false,
          message: `메모리 최적화 실패: ${error}`
        };
      }
    });

    // 전체화면 모드 설정
    ipcMain.handle('setFullscreenMode', async (event, mode: 'windowed' | 'fullscreen' | 'fullscreen-auto-hide') => {
      try {
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
        console.error('화면 모드 설정 실패:', error);
        return {
          success: false,
          message: `화면 모드 설정 실패: ${error}`
        };
      }
    });

    // 알림 설정
    ipcMain.handle('setNotifications', async (event, enabled: boolean) => {
      try {
        await SettingsManager.updateSetting('enableNotifications', enabled);
        
        return {
          success: true,
          message: `알림이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('알림 설정 실패:', error);
        return {
          success: false,
          message: `알림 설정 실패: ${error}`
        };
      }
    });

    // 애니메이션 설정
    ipcMain.handle('setAnimations', async (event, enabled: boolean) => {
      try {
        await SettingsManager.updateSetting('enableAnimations', enabled);
        
        return {
          success: true,
          message: `애니메이션이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('애니메이션 설정 실패:', error);
        return {
          success: false,
          message: `애니메이션 설정 실패: ${error}`
        };
      }
    });

    // 데이터 수집 설정
    ipcMain.handle('setDataCollection', async (event, enabled: boolean) => {
      try {
        await SettingsManager.updateSetting('enableDataCollection', enabled);
        
        return {
          success: true,
          message: `데이터 수집이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('데이터 수집 설정 실패:', error);
        return {
          success: false,
          message: `데이터 수집 설정 실패: ${error}`
        };
      }
    });

    // 자동 저장 설정
    ipcMain.handle('setAutoSave', async (event, enabled: boolean) => {
      try {
        await SettingsManager.updateSetting('enableAutoSave', enabled);
        
        return {
          success: true,
          message: `자동 저장이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
          enabled
        };
      } catch (error) {
        console.error('자동 저장 설정 실패:', error);
        return {
          success: false,
          message: `자동 저장 설정 실패: ${error}`
        };
      }
    });

    // 데이터 보관 기간 설정
    ipcMain.handle('setDataRetention', async (event, days: number) => {
      try {
        await SettingsManager.updateSetting('dataRetentionDays', days);
        
        return {
          success: true,
          message: `데이터 보관 기간이 ${days}일로 설정되었습니다`,
          days
        };
      } catch (error) {
        console.error('데이터 보관 기간 설정 실패:', error);
        return {
          success: false,
          message: `데이터 보관 기간 설정 실패: ${error}`
        };
      }
    });

    // 메모리 임계값 설정
    ipcMain.handle('setMemoryThreshold', async (event, threshold: number) => {
      try {
        await SettingsManager.updateSetting('maxMemoryThreshold', threshold);
        
        return {
          success: true,
          message: `메모리 임계값이 ${threshold}MB로 설정되었습니다`,
          threshold
        };
      } catch (error) {
        console.error('메모리 임계값 설정 실패:', error);
        return {
          success: false,
          message: `메모리 임계값 설정 실패: ${error}`
        };
      }
    });

    this.isRegistered = true;
    console.log('설정 IPC 핸들러 등록 완료');
  }

  /**
   * GPU 사용 가능 여부 확인
   */
  private async checkGPUAvailability(): Promise<boolean> {
    try {
      // GPU 정보 확인 로직 (간단한 구현)
      return app.commandLine.hasSwitch('disable-gpu') ? false : true;
    } catch (error) {
      console.error('GPU 사용 가능 여부 확인 실패:', error);
      return false;
    }
  }

  /**
   * 핸들러 정리
   */
  cleanup(): void {
    if (this.isRegistered) {
      // IPC 핸들러 제거는 Electron에서 자동으로 처리됨
      this.isRegistered = false;
      console.log('설정 IPC 핸들러 정리 완료');
    }
  }
}

export default SettingsIpcHandlers.getInstance();
