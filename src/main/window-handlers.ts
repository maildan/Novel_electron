/**
 * Loop 6 윈도우 관리 IPC 핸들러
 * 
 * Loop 3의 window-handlers.js를 TypeScript로 완전 마이그레이션
 * 윈도우 모드 변경, 미니뷰, 창 제어 등 UI 관련 기능을 처리합니다.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { WindowManager } from './window';
import SettingsManager from './settings-manager';
import { WindowModeType } from './constants';

// 윈도우 핸들러 상태
interface WindowHandlerState {
  isRegistered: boolean;
  windowManager: WindowManager | null;
}

// 전역 윈도우 핸들러 상태
let windowState: WindowHandlerState = {
  isRegistered: false,
  windowManager: null
};

/**
 * 윈도우 모드 적용
 */
function applyWindowMode(mode: WindowModeType): boolean {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (!mainWindow) {
      console.error('메인 윈도우를 찾을 수 없습니다');
      return false;
    }

    console.log(`윈도우 모드 적용: ${mode}`);

    switch (mode) {
      case 'windowed':
        mainWindow.setFullScreen(false);
        mainWindow.setAlwaysOnTop(false);
        mainWindow.show();
        mainWindow.focus();
        break;

      case 'fullscreen':
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setFullScreen(true);
        break;

      case 'maximized':
        mainWindow.setFullScreen(false);
        mainWindow.setAlwaysOnTop(false);
        mainWindow.maximize();
        break;

      case 'fullscreen-auto-hide':
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setFullScreen(true);
        mainWindow.setAutoHideMenuBar(true);
        break;

      default:
        console.error(`지원되지 않는 윈도우 모드: ${mode}`);
        return false;
    }

    // 설정 저장
    SettingsManager.updateSetting('windowMode', mode);
    
    console.log(`윈도우 모드 적용 완료: ${mode}`);
    return true;
  } catch (error: any) {
    console.error('윈도우 모드 적용 오류:', error);
    return false;
  }
}

/**
 * 윈도우 위치 및 크기 설정
 */
function setWindowBounds(bounds: { x?: number; y?: number; width?: number; height?: number }): boolean {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (!mainWindow) {
      console.error('메인 윈도우를 찾을 수 없습니다');
      return false;
    }

    if (bounds.width !== undefined && bounds.height !== undefined) {
      mainWindow.setSize(bounds.width, bounds.height);
    }

    if (bounds.x !== undefined && bounds.y !== undefined) {
      mainWindow.setPosition(bounds.x, bounds.y);
    }

    console.log('윈도우 크기/위치 설정 완료:', bounds);
    return true;
  } catch (error: any) {
    console.error('윈도우 크기/위치 설정 오류:', error);
    return false;
  }
}

/**
 * 윈도우 상태 정보 가져오기
 */
function getWindowStatus(): any {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (!mainWindow) {
      return { error: '메인 윈도우를 찾을 수 없습니다' };
    }

    const bounds = mainWindow.getBounds();
    const settings = SettingsManager.getSettings();

    return {
      mode: settings.windowMode || 'windowed',
      bounds,
      isFullScreen: mainWindow.isFullScreen(),
      isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
      isVisible: mainWindow.isVisible(),
      isMinimized: mainWindow.isMinimized(),
      isMaximized: mainWindow.isMaximized(),
      isFocused: mainWindow.isFocused(),
      title: mainWindow.getTitle()
    };
  } catch (error: any) {
    console.error('윈도우 상태 조회 오류:', error);
    return { error: error.message };
  }
}

/**
 * 윈도우 투명도 설정
 */
function setWindowOpacity(opacity: number): boolean {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (!mainWindow) {
      console.error('메인 윈도우를 찾을 수 없습니다');
      return false;
    }

    // 0.0 ~ 1.0 범위로 제한
    const clampedOpacity = Math.max(0.0, Math.min(1.0, opacity));
    mainWindow.setOpacity(clampedOpacity);
    
    // 설정 저장
    SettingsManager.updateSetting('windowOpacity', clampedOpacity);
    
    console.log(`윈도우 투명도 설정: ${clampedOpacity}`);
    return true;
  } catch (error: any) {
    console.error('윈도우 투명도 설정 오류:', error);
    return false;
  }
}

/**
 * 윈도우 항상 위에 설정
 */
function setAlwaysOnTop(alwaysOnTop: boolean): boolean {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (!mainWindow) {
      console.error('메인 윈도우를 찾을 수 없습니다');
      return false;
    }

    mainWindow.setAlwaysOnTop(alwaysOnTop);
    
    // 설정 저장
    SettingsManager.updateSetting('alwaysOnTop', alwaysOnTop);
    
    console.log(`윈도우 항상 위에 설정: ${alwaysOnTop}`);
    return true;
  } catch (error: any) {
    console.error('윈도우 항상 위에 설정 오류:', error);
    return false;
  }
}

/**
 * 모든 윈도우에 상태 브로드캐스트
 */
function broadcastWindowStatus(): void {
  try {
    const status = getWindowStatus();
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('window-status-update', status);
      }
    });
  } catch (error: any) {
    console.error('윈도우 상태 브로드캐스트 오류:', error);
  }
}

/**
 * IPC 핸들러 등록
 */
export function registerWindowHandlers(): void {
  if (windowState.isRegistered) {
    console.log('윈도우 관련 IPC 핸들러가 이미 등록되어 있습니다');
    return;
  }

  console.log('윈도우 관련 IPC 핸들러 등록 중...');

  // 윈도우 모드 변경 핸들러
  ipcMain.handle('set-window-mode', async (event, mode: WindowModeType) => {
    try {
      console.log(`윈도우 모드 변경 요청: ${mode}`);
      
      const success = applyWindowMode(mode);
      const status = getWindowStatus();
      
      // 상태 브로드캐스트
      broadcastWindowStatus();
      
      return {
        success,
        message: success ? `윈도우 모드가 ${mode}로 변경되었습니다` : '윈도우 모드 변경 실패',
        mode,
        status
      };
    } catch (error: any) {
      console.error('윈도우 모드 변경 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 상태 조회 핸들러
  ipcMain.handle('get-window-status', async () => {
    try {
      const status = getWindowStatus();
      return {
        success: true,
        status
      };
    } catch (error: any) {
      console.error('윈도우 상태 조회 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 크기/위치 설정 핸들러
  ipcMain.handle('set-window-bounds', async (event, bounds) => {
    try {
      const success = setWindowBounds(bounds);
      const status = getWindowStatus();
      
      broadcastWindowStatus();
      
      return {
        success,
        message: success ? '윈도우 크기/위치 설정 완료' : '윈도우 크기/위치 설정 실패',
        status
      };
    } catch (error: any) {
      console.error('윈도우 크기/위치 설정 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 투명도 설정 핸들러
  ipcMain.handle('set-window-opacity', async (event, opacity: number) => {
    try {
      const success = setWindowOpacity(opacity);
      const status = getWindowStatus();
      
      return {
        success,
        message: success ? `윈도우 투명도가 ${opacity}로 설정되었습니다` : '윈도우 투명도 설정 실패',
        opacity,
        status
      };
    } catch (error: any) {
      console.error('윈도우 투명도 설정 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 항상 위에 설정 핸들러
  ipcMain.handle('set-always-on-top', async (event, alwaysOnTop: boolean) => {
    try {
      const success = setAlwaysOnTop(alwaysOnTop);
      const status = getWindowStatus();
      
      broadcastWindowStatus();
      
      return {
        success,
        message: success ? `항상 위에 설정: ${alwaysOnTop}` : '항상 위에 설정 실패',
        alwaysOnTop,
        status
      };
    } catch (error: any) {
      console.error('항상 위에 설정 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 최소화 핸들러
  ipcMain.handle('minimize-window', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
      if (mainWindow) {
        mainWindow.minimize();
        return { success: true, message: '윈도우 최소화됨' };
      }
      return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
    } catch (error: any) {
      console.error('윈도우 최소화 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 최대화 핸들러
  ipcMain.handle('maximize-window', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        const status = getWindowStatus();
        broadcastWindowStatus();
        return { success: true, message: '윈도우 최대화 토글됨', status };
      }
      return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
    } catch (error: any) {
      console.error('윈도우 최대화 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 닫기 핸들러
  ipcMain.handle('close-window', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
      if (mainWindow) {
        mainWindow.close();
        return { success: true, message: '윈도우 닫기 요청됨' };
      }
      return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
    } catch (error: any) {
      console.error('윈도우 닫기 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 윈도우 포커스 핸들러
  ipcMain.handle('focus-window', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return { success: true, message: '윈도우 포커스됨' };
      }
      return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
    } catch (error: any) {
      console.error('윈도우 포커스 오류:', error);
      return { success: false, message: error.message };
    }
  });

  windowState.isRegistered = true;
  console.log('윈도우 관련 IPC 핸들러 등록 완료');
}

/**
 * 윈도우 핸들러 초기화
 */
export function initializeWindowHandlers(): void {
  try {
    windowState.windowManager = WindowManager.getInstance();
    
    // 설정에서 초기 윈도우 모드 적용
    const settings = SettingsManager.getSettings();
    if (settings.windowMode) {
      applyWindowMode(settings.windowMode);
    }
    
    console.log('윈도우 핸들러 초기화 완료');
  } catch (error: any) {
    console.error('윈도우 핸들러 초기화 오류:', error);
  }
}

/**
 * 윈도우 핸들러 정리
 */
export function cleanupWindowHandlers(): void {
  windowState.isRegistered = false;
  windowState.windowManager = null;
  console.log('윈도우 핸들러 정리 완료');
}

// 기본 내보내기
export default {
  registerWindowHandlers,
  applyWindowMode,
  setWindowBounds,
  getWindowStatus,
  setWindowOpacity,
  setAlwaysOnTop,
  initializeWindowHandlers,
  cleanupWindowHandlers,
  broadcastWindowStatus
};
