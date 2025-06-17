/**
 * Loop 6 IPC 핸들러 통합 관리자
 * 
 * 모든 IPC 핸들러를 관리하고 초기화하는 중앙 관리자입니다.
 * Loop 3의 handlers/index.js를 완전히 마이그레이션하고 확장했습니다.
 */

import { registerTrackingHandlers, cleanupTrackingHandlers, initializeAutoMonitoring } from './tracking-handlers';
import { registerKeyboardHandlers, cleanupKeyboardHandlers, initializeKeyboardHandlers } from './keyboardHandlers';
import { registerWindowHandlers, cleanupWindowHandlers, initializeWindowHandlers } from './windowHandlers';
import SettingsManager, { initializeSettingsManager } from './settings-manager';
import { IpcHandlers } from './ipc-handlers';
import { registerMemoryIpcHandlers } from './memory-ipc';
import { registerNativeIpcHandlers } from './native-client';
import { registerSystemInfoIpcHandlers } from './systemInfoIpc';
import settingsIpcHandlers from './settingsIpcHandlers';
import { ipcMain } from 'electron';
import { registerSystemMonitorIpcHandlers } from './system-monitor-ipc';

// 간단한 디버그 로깅
function debugLog(message: string, ...args: unknown[]): void {
  console.log(`[HandlersManager] ${message}`, ...args);
}

function errorLog(message: string, ...args: unknown[]): void {
  console.error(`[HandlersManager] ${message}`, ...args);
}

// 핸들러 관리 상태
interface HandlersState {
  isAllHandlersSetup: boolean;
  registeredHandlers: Set<string>;
  initializationOrder: string[];
}

// 전역 핸들러 상태 - 더 안전한 초기화
const handlersState: HandlersState = {
  isAllHandlersSetup: false,
  registeredHandlers: new Set(),
  initializationOrder: []
};

// 핸들러 상태 초기화 함수
function initializeHandlersState(): void {
  if (!handlersState.registeredHandlers) {
    handlersState.registeredHandlers = new Set();
  }
  if (!handlersState.initializationOrder) {
    handlersState.initializationOrder = [];
  }
  debugLog('핸들러 상태 초기화 완료');
}

/**
 * Setup 관련 핸들러 등록
 */
function registerSettingsHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('settings')) {
      debugLog('Setup 관련 핸들러 이미 등록됨');
      return;
    }
    
    // 설정 IPC 핸들러 등록 (setProcessingMode 등)
    settingsIpcHandlers.register();
    
    // 설정 관리자 초기화 및 IPC 핸들러 등록
    initializeSettingsManager();
    
    // SettingsManager 인스턴스 확인
    const settingsManager = SettingsManager;
    debugLog('SettingsManager 로드됨:', typeof settingsManager);
    
    debugLog('Setup 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('settings');
  } catch (error) {
    errorLog('Setup 핸들러 등록 Error:', error);
  }
}

/**
 * 시스템 정보 관련 핸들러 등록
 */
function registerSystemInfoHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('system-info')) {
      debugLog('시스템 정보 관련 핸들러 이미 등록됨');
      return;
    }
    
    // SystemInfo IPC 핸들러 등록
    registerSystemInfoIpcHandlers();
    debugLog('시스템 정보 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('system-info');
  } catch (error) {
    errorLog('시스템 정보 핸들러 등록 Error:', error);
    // 오류가 발생해도 다른 핸들러 등록은 계속 진행
  }
}

/**
 * 메모리 관련 핸들러 등록
 */
function registerMemoryHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('memory')) {
      debugLog('메모리 관련 핸들러 이미 등록됨');
      return;
    }
    
    // memory-ipc.ts에서 메모리 IPC 핸들러 등록
    registerMemoryIpcHandlers();
    debugLog('메모리 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('memory');
  } catch (error) {
    errorLog('메모리 핸들러 등록 Error:', error);
    // 오류가 발생해도 다른 핸들러 등록은 계속 진행
  }
}

/**
 * 네이티브 모듈 관련 핸들러 등록
 */
function registerNativeHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('native')) {
      debugLog('네이티브 모듈 관련 핸들러 이미 등록됨');
      return;
    }
    
    registerNativeIpcHandlers();
    debugLog('네이티브 모듈 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('native');
  } catch (error) {
    errorLog('네이티브 핸들러 등록 Error:', error);
  }
}

/**
 * 통합 IPC 핸들러 등록
 */
function registerIntegratedHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('integrated')) {
      debugLog('통합 IPC 핸들러 이미 등록됨');
      return;
    }
    
    const ipcHandlers = IpcHandlers.getInstance();
    ipcHandlers.register();
    debugLog('통합 IPC 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('integrated');
  } catch (error) {
    errorLog('통합 IPC 핸들러 등록 Error:', error);
  }
}

/**
 * 재시작 관련 핸들러 등록
 */
function registerRestartHandlers(): void {
  try {
    // 재시작 핸들러는 app-lifecycle.ts에서 처리
    debugLog('재시작 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('restart');
  } catch (error) {
    errorLog('재시작 핸들러 등록 Error:', error);
  }
}

/**
 * 시스템 모니터링 관련 핸들러 등록
 */
function registerSystemMonitorHandlers(): void {
  try {
    // 중복 등록 방지
    if (handlersState.registeredHandlers.has('system-monitor')) {
      debugLog('시스템 모니터링 관련 핸들러 이미 등록됨');
      return;
    }
    
    // SystemMonitor IPC 핸들러 등록
    registerSystemMonitorIpcHandlers();
    debugLog('시스템 모니터링 관련 핸들러 등록 Completed');
    handlersState.registeredHandlers.add('system-monitor');
  } catch (error) {
    errorLog('시스템 모니터링 핸들러 등록 Error:', error);
    // 오류가 발생해도 다른 핸들러 등록은 계속 진행
  }
}

/**
 * IPC 핸들러 중복 등록 방지 유틸리티
 */
// isIpcHandlerRegistered 함수도 사용되지 않으므로 제거됨
// 사용되지 않던 safeHandlerRegistration 함수 제거됨
// 대신 각 핸들러 등록 함수에서 중복 체크를 수행함

/**
 * 모든 IPC 핸들러를 순서대로 등록
 */
export async function setupAllHandlers(): Promise<boolean> {
  // 핸들러 상태 안전하게 초기화
  initializeHandlersState();
  
  // 이미 Setup되었으면 중복 Setup 방지
  if (handlersState.isAllHandlersSetup) {
    debugLog('모든 핸들러가 이미 Setup되어 있습니다.');
    return true;
  }

  try {
    debugLog('모든 IPC 핸들러 등록 시작...');

    // 초기화 순서 정의 (의존성 순서)
    const initOrder = [
      'settings',        // Setup 먼저
      'integrated',      // 통합 IPC 핸들러 (네이티브 모듈 포함)
      'system-info',     // 시스템 정보
      'system-monitor',  // 시스템 모니터링 (start-monitoring 핸들러 포함)
      'native',          // 네이티브 모듈
      'window',          // 윈도우 관리
      'memory',          // 메모리 관리
      'keyboard',        // 키보드 이벤트
      'tracking',        // 추적/모니터링
      'restart'          // 재시작 관련
    ];

    handlersState.initializationOrder = initOrder;

    // 각 핸들러 등록
    registerSettingsHandlers();
    registerIntegratedHandlers();
    registerSystemInfoHandlers();
    registerSystemMonitorHandlers(); // 시스템 모니터링 핸들러 등록 (start-monitoring 포함)
    registerNativeHandlers();
    registerWindowHandlers();
    registerMemoryHandlers();
    registerKeyboardHandlers();
    registerTrackingHandlers();
    registerRestartHandlers();

    // 핸들러 초기화
    initializeWindowHandlers();
    await initializeKeyboardHandlers();
    initializeAutoMonitoring();

    // 등록된 핸들러를 handlersState에 추가
    handlersState.registeredHandlers.add('keyboard');
    handlersState.registeredHandlers.add('tracking');
    handlersState.registeredHandlers.add('window');

    // 핸들러 Setup Completed
    handlersState.isAllHandlersSetup = true;
    
    // 등록된 핸들러 상세 로그
    debugLog(`모든 IPC 핸들러 등록 완료. 등록된 핸들러: ${Array.from(handlersState.registeredHandlers).join(', ')}`);
    
    // 실제 IPC 핸들러 등록 확인
    try {
      // TypeScript에서는 ipcMain._handlers에 직접 접근할 수 없으므로
      // listenerCount를 사용하여 간접적으로 확인
      const criticalHandlers = [
        'system:start-monitoring', 'get-current-metrics', 'get-metrics-history',
        'tracking:start-monitoring', 'tracking:stop-monitoring', 'tracking:get-status',
        'start-keyboard-listener', 'stop-keyboard-listener', 'get-keyboard-status',
        'memory:getInfo', 'systemGetInfo'
      ];
      
      debugLog('주요 핸들러 등록 상태 확인:');
      criticalHandlers.forEach(handler => {
        const listenerCount = ipcMain.listenerCount(handler);
        debugLog(`  - ${handler}: ${listenerCount > 0 ? '등록됨' : '등록되지 않음'} (리스너 수: ${listenerCount})`);
      });
    } catch (checkError) {
      debugLog('핸들러 등록 상태 확인 중 오류:', checkError);
    }
    
    return true;
  } catch (error) {
    errorLog('핸들러 Setup 중 Error 발생:', error);
    return false;
  }
}

/**
 * 핸들러 등록 상태 확인
 */
export function isHandlerRegistered(handlerName: string): boolean {
  return handlersState.registeredHandlers.has(handlerName);
}

/**
 * 등록된 모든 핸들러 목록 가져오기
 */
export function getRegisteredHandlers(): string[] {
  return Array.from(handlersState.registeredHandlers);
}

/**
 * 핸들러 초기화 순서 가져오기
 */
export function getInitializationOrder(): string[] {
  return [...handlersState.initializationOrder];
}

/**
 * 특정 핸들러 재등록
 */
export function reregisterHandler(handlerName: string): boolean {
  try {
    debugLog(`핸들러 재등록: ${handlerName}`);

    switch (handlerName) {
      case 'settings':
        registerSettingsHandlers();
        break;
      case 'system-info':
        registerSystemInfoHandlers();
        break;
      case 'window':
        registerWindowHandlers();
        break;
      case 'memory':
        registerMemoryHandlers();
        break;
      case 'keyboard':
        registerKeyboardHandlers();
        break;
      case 'tracking':
        registerTrackingHandlers();
        break;
      case 'restart':
        registerRestartHandlers();
        break;
      case 'system-monitor': // 시스템 모니터 핸들러 재등록 케이스 추가
        registerSystemMonitorHandlers();
        break;
      case 'native':
        registerNativeHandlers();
        break;
      case 'integrated':
        registerIntegratedHandlers();
        break;
      default:
        errorLog(`알 수 없는 핸들러: ${handlerName}`);
        return false;
    }

    return true;
  } catch (error) {
    errorLog(`핸들러 재등록 Error (${handlerName}):`, error);
    return false;
  }
}

/**
 * 모든 핸들러 Cleanup
 */
export function cleanupAllHandlers(): void {
  try {
    debugLog('모든 핸들러 Cleanup 시작...');

    // 역순으로 Cleanup
    cleanupTrackingHandlers();
    cleanupKeyboardHandlers();
    cleanupWindowHandlers();

    // 상태 초기화
    handlersState.isAllHandlersSetup = false;
    handlersState.registeredHandlers.clear();
    handlersState.initializationOrder = [];

    debugLog('모든 핸들러 Cleanup Completed');
  } catch (error) {
    errorLog('핸들러 Cleanup 중 Error:', error);
  }
}

/**
 * 핸들러 상태 진단 - 반환 타입 인터페이스
 */
interface HandlersDiagnosticResult {
  isAllSetup: boolean;
  registeredHandlers: string[];
  initializationOrder: string[];
  settingsInitialized: boolean;
  timestamp: string;
}

/**
 * 핸들러 상태 진단
 */
export function diagnoseHandlers(): HandlersDiagnosticResult {
  return {
    isAllSetup: handlersState.isAllHandlersSetup,
    registeredHandlers: Array.from(handlersState.registeredHandlers),
    initializationOrder: handlersState.initializationOrder,
    settingsInitialized: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * 핸들러 상태 리셋
 */
export function resetHandlersState(): void {
  handlersState.isAllHandlersSetup = false;
  handlersState.registeredHandlers.clear();
  handlersState.initializationOrder = [];
  debugLog('핸들러 상태 리셋 Completed');
}

// 레거시 호환성을 위한 개별 핸들러 노출
export {
  registerTrackingHandlers,
  registerKeyboardHandlers,
  registerWindowHandlers
};

// 기본 내보내기
export default {
  setupAllHandlers,
  cleanupAllHandlers,
  isHandlerRegistered,
  getRegisteredHandlers,
  getInitializationOrder,
  reregisterHandler,
  diagnoseHandlers,
  resetHandlersState,
  
  // 개별 핸들러 접근
  tracking: {
    register: registerTrackingHandlers,
    cleanup: cleanupTrackingHandlers
  },
  keyboard: {
    register: registerKeyboardHandlers,
    cleanup: cleanupKeyboardHandlers
  },
  window: {
    register: registerWindowHandlers,
    cleanup: cleanupWindowHandlers
  }
};
