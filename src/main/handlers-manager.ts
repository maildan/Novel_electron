/**
 * Loop 6 IPC 핸들러 통합 관리자
 * 
 * 모든 IPC 핸들러를 관리하고 초기화하는 중앙 관리자입니다.
 * Loop 3의 handlers/index.js를 완전히 마이그레이션하고 확장했습니다.
 */

import { registerTrackingHandlers, cleanupTrackingHandlers, initializeAutoMonitoring } from './tracking-handlers';
import { registerKeyboardHandlers, cleanupKeyboardHandlers, initializeKeyboardHandlers } from './keyboard-handlers';
import { registerWindowHandlers, cleanupWindowHandlers, initializeWindowHandlers } from './window-handlers';
import { SettingsManager } from './settings-manager';
import { IpcHandlers } from './ipc-handlers';
import { registerMemoryIpcHandlers } from './memory-ipc';
import { registerNativeIpcHandlers } from './native-client';
import { registerSystemInfoIpcHandlers } from './system-info-ipc';

// Simple debug logging
function debugLog(message: string, ...args: any[]): void {
  console.log(`[HandlersManager] ${message}`, ...args);
}

function errorLog(message: string, ...args: any[]): void {
  console.error(`[HandlersManager] ${message}`, ...args);
}

// 핸들러 관리 상태
interface HandlersState {
  isAllHandlersSetup: boolean;
  registeredHandlers: Set<string>;
  initializationOrder: string[];
}

// 전역 핸들러 상태
let handlersState: HandlersState = {
  isAllHandlersSetup: false,
  registeredHandlers: new Set(),
  initializationOrder: []
};

/**
 * 설정 관련 핸들러 등록 (SettingsManager에서 자동 처리)
 */
function registerSettingsHandlers(): void {
  debugLog('설정 관련 핸들러는 SettingsManager에서 자동 등록됩니다');
  handlersState.registeredHandlers.add('settings');
}

/**
 * 시스템 정보 관련 핸들러 등록
 */
function registerSystemInfoHandlers(): void {
  try {
    // 시스템 정보 핸들러를 실제로 등록
    registerSystemInfoIpcHandlers();
    debugLog('시스템 정보 관련 핸들러 등록 완료');
    handlersState.registeredHandlers.add('system-info');
  } catch (error) {
    errorLog('시스템 정보 핸들러 등록 오류:', error);
  }
}

/**
 * 메모리 관련 핸들러 등록
 */
function registerMemoryHandlers(): void {
  try {
    // 메모리 핸들러를 실제로 등록
    registerMemoryIpcHandlers();
    debugLog('메모리 관련 핸들러 등록 완료');
    handlersState.registeredHandlers.add('memory');
  } catch (error) {
    errorLog('메모리 핸들러 등록 오류:', error);
  }
}

/**
 * 네이티브 모듈 관련 핸들러 등록
 */
function registerNativeHandlers(): void {
  try {
    // 네이티브 핸들러를 실제로 등록
    registerNativeIpcHandlers();
    debugLog('네이티브 모듈 관련 핸들러 등록 완료');
    handlersState.registeredHandlers.add('native');
  } catch (error) {
    errorLog('네이티브 핸들러 등록 오류:', error);
  }
}

/**
 * 통합 IPC 핸들러 등록
 */
function registerIntegratedHandlers(): void {
  try {
    const ipcHandlers = IpcHandlers.getInstance();
    ipcHandlers.register();
    debugLog('통합 IPC 핸들러 등록 완료');
    handlersState.registeredHandlers.add('integrated');
  } catch (error) {
    errorLog('통합 IPC 핸들러 등록 오류:', error);
  }
}

/**
 * 재시작 관련 핸들러 등록
 */
function registerRestartHandlers(): void {
  try {
    // 재시작 핸들러는 app-lifecycle.ts에서 처리
    debugLog('재시작 관련 핸들러 등록 완료');
    handlersState.registeredHandlers.add('restart');
  } catch (error) {
    errorLog('재시작 핸들러 등록 오류:', error);
  }
}

/**
 * 모든 IPC 핸들러를 순서대로 등록
 */
export async function setupAllHandlers(): Promise<boolean> {
  // 이미 설정되었으면 중복 설정 방지
  if (handlersState.isAllHandlersSetup) {
    debugLog('모든 핸들러가 이미 설정되어 있습니다.');
    return true;
  }

  try {
    debugLog('모든 IPC 핸들러 등록 시작...');

    // 초기화 순서 정의 (의존성 순서)
    const initOrder = [
      'settings',      // 설정 먼저
      'integrated',    // 통합 IPC 핸들러 (네이티브 모듈 포함)
      'system-info',   // 시스템 정보
      'native',        // 네이티브 모듈
      'window',        // 윈도우 관리
      'memory',        // 메모리 관리
      'keyboard',      // 키보드 이벤트
      'tracking',      // 추적/모니터링
      'restart'        // 재시작 관련
    ];

    handlersState.initializationOrder = initOrder;

    // 각 핸들러 등록
    registerSettingsHandlers();
    registerIntegratedHandlers();
    registerSystemInfoHandlers();
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

    // 핸들러 설정 완료
    handlersState.isAllHandlersSetup = true;
    
    debugLog(`모든 IPC 핸들러 등록 완료. 등록된 핸들러: ${Array.from(handlersState.registeredHandlers).join(', ')}`);
    return true;
  } catch (error) {
    errorLog('핸들러 설정 중 오류 발생:', error);
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
      default:
        errorLog(`알 수 없는 핸들러: ${handlerName}`);
        return false;
    }

    return true;
  } catch (error) {
    errorLog(`핸들러 재등록 오류 (${handlerName}):`, error);
    return false;
  }
}

/**
 * 모든 핸들러 정리
 */
export function cleanupAllHandlers(): void {
  try {
    debugLog('모든 핸들러 정리 시작...');

    // 역순으로 정리
    cleanupTrackingHandlers();
    cleanupKeyboardHandlers();
    cleanupWindowHandlers();

    // 상태 초기화
    handlersState.isAllHandlersSetup = false;
    handlersState.registeredHandlers.clear();
    handlersState.initializationOrder = [];

    debugLog('모든 핸들러 정리 완료');
  } catch (error) {
    errorLog('핸들러 정리 중 오류:', error);
  }
}

/**
 * 핸들러 상태 진단
 */
export function diagnoseHandlers(): any {
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
  handlersState = {
    isAllHandlersSetup: false,
    registeredHandlers: new Set(),
    initializationOrder: []
  };
  debugLog('핸들러 상태 리셋 완료');
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
