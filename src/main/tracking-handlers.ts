/**
 * Loop 6 타이핑 추적 및 모니터링 IPC 핸들러
 * 
 * Loop 3의 tracking-handlers.js를 TypeScript로 완전 마이그레이션
 * 타이핑 추적 시작/중지, 통계 저장, 자동 모니터링 등을 처리합니다.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { debugLog, errorLog } from './utils';
import SettingsManager from './settings-manager';
import { CHANNELS } from '../preload/channels';

// 추적 상태 관리
interface TrackingState {
  isTracking: boolean;
  startTime: number | null;
  sessionStats: TypingStats;
  autoStartEnabled: boolean;
}

interface TypingStats {
  totalKeystrokes: number;
  totalTime: number;
  averageWPM: number;
  accuracy: number;
  errorCount: number;
  correctCount: number;
  sessionCount: number;
  lastActive: number;
}

interface KeyData {
  key?: string;
  isCorrect?: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

// 전역 추적 상태
let trackingState: TrackingState = {
  isTracking: false,
  startTime: null,
  sessionStats: {
    totalKeystrokes: 0,
    totalTime: 0,
    averageWPM: 0,
    accuracy: 0,
    errorCount: 0,
    correctCount: 0,
    sessionCount: 0,
    lastActive: Date.now()
  },
  autoStartEnabled: false
};

// 핸들러 등록 상태
let isRegistered = false;

/**
 * 추적 시작
 */
export function startTracking(): boolean {
  try {
    if (trackingState.isTracking) {
      debugLog('이미 추적 중입니다');
      return false;
    }

    trackingState.isTracking = true;
    trackingState.startTime = Date.now();
    trackingState.sessionStats.sessionCount++;
    trackingState.sessionStats.lastActive = Date.now();

    debugLog('타이핑 추적 Started');
    
    // 메인 윈도우에 상태 변경 알림
    sendTrackingStatusToRenderer();
    
    return true;
  } catch (error: unknown) {
    errorLog('추적 시작 Error:', error);
    return false;
  }
}

/**
 * 추적 중지
 */
export function stopTracking(): boolean {
  try {
    if (!trackingState.isTracking) {
      debugLog('이미 추적이 중지되었습니다');
      return false;
    }

    trackingState.isTracking = false;
    
    // 세션 시간 계산
    if (trackingState.startTime) {
      const sessionTime = Date.now() - trackingState.startTime;
      trackingState.sessionStats.totalTime += sessionTime;
    }
    
    trackingState.startTime = null;
    
    debugLog('타이핑 추적 Stopped');
    
    // 통계 저장
    saveCurrentStats();
    
    // 메인 윈도우에 상태 변경 알림
    sendTrackingStatusToRenderer();
    
    return true;
  } catch (error: unknown) {
    errorLog('추적 중지 Error:', error);
    return false;
  }
}

/**
 * 현재 통계 저장
 */
async function saveCurrentStats(): Promise<void> {
  try {
    const settings = SettingsManager.getSettings();
    const statsFilePath = settings.statsFilePath || 'typing-stats.json';
    
    // statsFilePath를 사용하여 파일 시스템에 통계 저장
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const statsData = {
      ...trackingState.sessionStats,
      timestamp: Date.now(),
      filePath: statsFilePath
    };
    
    debugLog(`통계 파일에 저장: ${path.resolve(statsFilePath)}`, statsData);
    
    // 실제 파일 저장 로직 구현
    try {
      await fs.writeFile(path.resolve(statsFilePath), JSON.stringify(statsData, null, 2));
      debugLog(`통계 파일 저장 완료: ${path.resolve(statsFilePath)}`);
    } catch (writeError: unknown) {
      errorLog('통계 파일 저장 실패:', writeError);
    }
    
  } catch (error: unknown) {
    errorLog('통계 저장 Error:', error);
  }
}

/**
 * 키 입력 처리
 */
export function processKeyPress(keyData: KeyData): void {
  if (!trackingState.isTracking) return;

  try {
    trackingState.sessionStats.totalKeystrokes++;
    trackingState.sessionStats.lastActive = Date.now();
    
    // 정확도 계산 로직
    if (keyData.isCorrect !== undefined) {
      if (keyData.isCorrect) {
        trackingState.sessionStats.correctCount++;
      } else {
        trackingState.sessionStats.errorCount++;
      }
      
      const total = trackingState.sessionStats.correctCount + trackingState.sessionStats.errorCount;
      trackingState.sessionStats.accuracy = total > 0 ? 
        (trackingState.sessionStats.correctCount / total) * 100 : 0;
    }
    
    // WPM 계산
    if (trackingState.startTime) {
      const timeInMinutes = (Date.now() - trackingState.startTime) / 60000;
      if (timeInMinutes > 0) {
        trackingState.sessionStats.averageWPM = 
          Math.round((trackingState.sessionStats.totalKeystrokes / 5) / timeInMinutes);
      }
    }
    
    // 주기적으로 렌더러에 상태 전송
    if (trackingState.sessionStats.totalKeystrokes % 10 === 0) {
      sendTrackingStatusToRenderer();
    }
  } catch (error: unknown) {
    errorLog('키 입력 처리 Error:', error);
  }
}

/**
 * 자동 모니터링 시작
 */
function startAutoMonitoring(): void {
  try {
    const settings = SettingsManager.getSettings();
    
    if (settings.autoStartMonitoring && !trackingState.isTracking) {
      debugLog('Setup에 따라 자동 모니터링 시작');
      startTracking();
      
      // 렌더러에 자동 시작 알림
      const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
      if (mainWindow) {
        mainWindow.webContents.send('auto-tracking-started', {
          message: '모니터링이 자동으로 시작되었습니다.'
        });
      }
    }
  } catch (error: unknown) {
    errorLog('자동 모니터링 시작 Error:', error);
  }
}

/**
 * 렌더러에 추적 상태 전송
 */
export function sendTrackingStatusToRenderer(): void {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tracking-status-update', {
        isTracking: trackingState.isTracking,
        stats: trackingState.sessionStats,
        startTime: trackingState.startTime
      });
    }
  } catch (error: unknown) {
    errorLog('상태 전송 중 Error:', error);
  }
}

/**
 * 추적 상태 초기화
 */
export function resetTrackingState(): void {
  trackingState = {
    isTracking: false,
    startTime: null,
    sessionStats: {
      totalKeystrokes: 0,
      totalTime: 0,
      averageWPM: 0,
      accuracy: 0,
      errorCount: 0,
      correctCount: 0,
      sessionCount: 0,
      lastActive: Date.now()
    },
    autoStartEnabled: false
  };
}

/**
 * 현재 추적 상태 가져오기
 */
export function getTrackingState(): TrackingState {
  return { ...trackingState };
}

/**
 * IPC 핸들러 등록
 */
export function registerTrackingHandlers(): void {
  if (isRegistered) {
    debugLog('추적 관련 IPC 핸들러가 이미 등록되어 있습니다');
    return;
  }

  debugLog('추적 관련 IPC 핸들러 등록 중...');

  // 타이핑 추적 모니터링 시작 핸들러
  ipcMain.handle(CHANNELS.TRACKING_START_MONITORING, async () => {
    try {
      debugLog('모니터링 시작 요청 수신');
      
      if (trackingState.isTracking) {
        return { 
          success: true, 
          message: '이미 모니터링 중입니다',
          isTracking: true,
          stats: trackingState.sessionStats
        };
      }
      
      // 키보드 리스너 먼저 설정
      const keyboardHandlers = await import('./keyboardHandlers');
      const keyboardListenerResult = await keyboardHandlers.setupKeyboardListenerIfNeeded();
      
      if (!keyboardListenerResult) {
        errorLog('키보드 리스너 설정 Failed - 모니터링 시작 불가');
        return { 
          success: false, 
          message: '키보드 리스너 설정 Failed - 모니터링 시작 불가',
          keyboardActive: false
        };
      }
      
      debugLog('키보드 리스너 설정 성공, 모니터링 시작 중...');
      
      const success = startTracking();
      
      debugLog(`모니터링 시작 ${success ? '성공' : '실패'} (키보드 리스너: ${keyboardListenerResult ? '활성화됨' : '비활성화됨'})`);
      
      return { 
        success,
        message: success ? '모니터링 Started' : '모니터링 시작 Failed',
        isTracking: trackingState.isTracking,
        stats: trackingState.sessionStats,
        keyboardActive: keyboardListenerResult
      };
    } catch (error: any) {
      errorLog('모니터링 시작 Error:', error);
      return { success: false, message: error.message };
    }
  });
  
  // 모니터링 중지 핸들러
  ipcMain.handle(CHANNELS.TRACKING_STOP_MONITORING, async () => {
    try {
      debugLog('모니터링 중지 요청 수신');
      
      if (!trackingState.isTracking) {
        return { 
          success: true, 
          message: '이미 모니터링이 중지되었습니다',
          isTracking: false,
          stats: trackingState.sessionStats
        };
      }
      
      // 키보드 리스너 해제
      const { cleanupKeyboardListener } = require('./keyboardHandlers');
      const keyboardCleanupResult = cleanupKeyboardListener();
      
      debugLog(`키보드 리스너 해제 ${keyboardCleanupResult ? '성공' : '실패'}`);
      
      const success = stopTracking();
      
      debugLog(`모니터링 중지 ${success ? '성공' : '실패'}`);
      
      return { 
        success,
        message: success ? '모니터링 Stopped' : '모니터링 중지 Failed',
        isTracking: trackingState.isTracking,
        stats: trackingState.sessionStats,
        keyboardCleaned: keyboardCleanupResult
      };
    } catch (error: any) {
      errorLog('모니터링 중지 Error:', error);
      return { success: false, message: error.message };
    }
  });

  // 추적 상태 조회 핸들러
  ipcMain.handle(CHANNELS.TRACKING_GET_STATUS, async () => {
    try {
      return {
        success: true,
        isTracking: trackingState.isTracking,
        stats: trackingState.sessionStats,
        startTime: trackingState.startTime
      };
    } catch (error: any) {
      errorLog('추적 상태 조회 Error:', error);
      return { success: false, message: error.message };
    }
  });

  // 통계 저장 핸들러
  ipcMain.handle(CHANNELS.TRACKING_SAVE_STATS, async (event, statsData) => {
    try {
      // 외부에서 전달받은 통계 데이터 처리
      if (statsData) {
        Object.assign(trackingState.sessionStats, statsData);
      }
      
      await saveCurrentStats();
      
      return { success: true, message: '통계 저장 Completed' };
    } catch (error: any) {
      errorLog('통계 저장 Error:', error);
      return { success: false, message: error.message };
    }
  });

  // 추적 상태 리셋 핸들러
  ipcMain.handle(CHANNELS.TRACKING_RESET, async () => {
    try {
      resetTrackingState();
      sendTrackingStatusToRenderer();
      
      return { 
        success: true, 
        message: '추적 상태 초기화 Completed',
        stats: trackingState.sessionStats
      };
    } catch (error: any) {
      errorLog('추적 상태 리셋 Error:', error);
      return { success: false, message: error.message };
    }
  });

  // 키 입력 처리 핸들러
  ipcMain.handle(CHANNELS.TRACKING_PROCESS_KEY, async (event, keyData) => {
    try {
      processKeyPress(keyData);
      return { success: true };
    } catch (error: any) {
      errorLog('키 입력 처리 Error:', error);
      return { success: false, message: error.message };
    }
  });

  isRegistered = true;
  debugLog('추적 관련 IPC 핸들러 등록 Completed');
}

/**
 * 자동 모니터링 초기화 (앱 시작 시 호출)
 */
export function initializeAutoMonitoring(): void {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.on('did-finish-load', startAutoMonitoring);
    } else {
      // 윈도우가 없는 경우 지연 후 시작
      setTimeout(startAutoMonitoring, 2000);
    }
  } catch (error: any) {
    errorLog('자동 모니터링 초기화 Error:', error);
  }
}

/**
 * 핸들러 Cleanup
 */
export function cleanupTrackingHandlers(): void {
  if (trackingState.isTracking) {
    stopTracking();
  }
  
  // IPC 핸들러 제거
  ipcMain.removeHandler('tracking:start-monitoring');
  ipcMain.removeHandler('tracking:stop-monitoring');
  ipcMain.removeHandler('tracking:get-status');
  ipcMain.removeHandler('tracking:save-stats');
  ipcMain.removeHandler('tracking:reset');
  ipcMain.removeHandler('tracking:process-key');
  
  resetTrackingState();
  isRegistered = false;
  debugLog('추적 핸들러 Cleanup Completed');
}

// 기본 내보내기
export default {
  registerTrackingHandlers,
  startTracking,
  stopTracking,
  processKeyPress,
  sendTrackingStatusToRenderer,
  getTrackingState,
  resetTrackingState,
  initializeAutoMonitoring,
  cleanupTrackingHandlers
};
