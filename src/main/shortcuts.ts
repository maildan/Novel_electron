/**
 * 전역 단축키 관리 모듈
 * 
 * Electron 앱에서 전역 및 로컬 키보드 단축키를 관리합니다.
 * 고급 단축키 매칭, 충돌 감지, 그리고 동적 등록/해제를 지원합니다.
 */

import { globalShortcut, BrowserWindow, ipcMain, app } from 'electron';

// 타입 정의
interface ShortcutData {
  callback?: () => void;
  description: string;
  timestamp: number;
  category?: string;
  enabled?: boolean;
}

interface LocalShortcutData {
  callback: () => void;
  timestamp: number;
  enabled?: boolean;
}

interface ShortcutConfig {
  accelerator: string;
  description: string;
  category?: string;
  callback?: () => void;
}

interface ParsedShortcut {
  modifiers: string[];
  key: string;
  isValid: boolean;
}

// 내부 상태
const registeredShortcuts = new Map<string, ShortcutData>();
const localShortcuts = new Map<number, Map<string, LocalShortcutData>>();
const shortcutHistory = new Array<{ action: string; accelerator: string; timestamp: number }>();
const conflictMap = new Map<string, string[]>();

// 설정
const MAX_HISTORY_ENTRIES = 100;
const SHORTCUT_CATEGORIES = {
  SYSTEM: 'system',
  DEVELOPMENT: 'development',
  UI: 'ui',
  CUSTOM: 'custom'
} as const;

/**
 * 단축키 문자열 파싱
 */
function parseShortcut(accelerator: string): ParsedShortcut {
  try {
    if (!accelerator || typeof accelerator !== 'string') {
      return { modifiers: [], key: '', isValid: false };
    }

    const parts = accelerator.split('+').map(part => part.trim());
    
    if (parts.length === 0) {
      return { modifiers: [], key: '', isValid: false };
    }

    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1).map(mod => mod.toLowerCase());

    return {
      modifiers,
      key: key.toLowerCase(),
      isValid: key.length > 0
    };

  } catch (error) {
    console.error(`단축키 파싱 오류 (${accelerator}):`, error);
    return { modifiers: [], key: '', isValid: false };
  }
}

/**
 * 단축키 충돌 검사
 */
function checkShortcutConflict(accelerator: string): string[] {
  const conflicts: string[] = [];
  
  // 전역 단축키와 충돌 검사
  if (registeredShortcuts.has(accelerator)) {
    conflicts.push('전역 단축키');
  }

  // 시스템 단축키와 충돌 검사 (macOS)
  if (process.platform === 'darwin') {
    const systemShortcuts = [
      'Command+Space',
      'Command+Tab',
      'Command+Q',
      'Command+W',
      'Command+C',
      'Command+V',
      'Command+X',
      'Command+Z'
    ];

    if (systemShortcuts.includes(accelerator)) {
      conflicts.push('시스템 단축키');
    }
  }

  return conflicts;
}

/**
 * 단축키 히스토리 추가
 */
function addToHistory(action: string, accelerator: string): void {
  shortcutHistory.unshift({
    action,
    accelerator,
    timestamp: Date.now()
  });

  // 히스토리 크기 제한
  if (shortcutHistory.length > MAX_HISTORY_ENTRIES) {
    shortcutHistory.splice(MAX_HISTORY_ENTRIES);
  }
}

/**
 * 전역 단축키 등록
 */
export function registerGlobalShortcut(
  accelerator: string,
  callback: () => void,
  description = '',
  category?: string
): boolean {
  try {
    // 입력 검증
    if (!accelerator || typeof accelerator !== 'string') {
      throw new Error('유효한 단축키 문자열이 필요합니다.');
    }

    if (typeof callback !== 'function') {
      throw new Error('유효한 콜백 함수가 필요합니다.');
    }

    // 단축키 파싱
    const parsed = parseShortcut(accelerator);
    if (!parsed.isValid) {
      throw new Error(`유효하지 않은 단축키 형식: ${accelerator}`);
    }

    // 이미 등록된 단축키 확인
    if (registeredShortcuts.has(accelerator)) {
      console.warn(`단축키가 이미 등록되어 있습니다: ${accelerator}`);
      return false;
    }

    // 충돌 검사
    const conflicts = checkShortcutConflict(accelerator);
    if (conflicts.length > 0) {
      console.warn(`단축키 충돌 감지 (${accelerator}):`, conflicts);
      conflictMap.set(accelerator, conflicts);
    }

    // 전역 단축키 등록
    const success = globalShortcut.register(accelerator, () => {
      try {
        const shortcutData = registeredShortcuts.get(accelerator);
        if (shortcutData?.enabled !== false) {
          callback();
          addToHistory('triggered', accelerator);
        }
      } catch (error) {
        console.error(`단축키 실행 오류 (${accelerator}):`, error);
      }
    });

    if (success) {
      // 등록 성공 시 데이터 저장
      registeredShortcuts.set(accelerator, {
        callback,
        description,
        category: category || SHORTCUT_CATEGORIES.CUSTOM,
        timestamp: Date.now(),
        enabled: true
      });

      addToHistory('registered', accelerator);
      console.log(`전역 단축키 등록 성공: ${accelerator} (${description})`);
      return true;
    } else {
      console.error(`전역 단축키 등록 실패: ${accelerator}`);
      return false;
    }

  } catch (error) {
    console.error(`단축키 등록 오류 (${accelerator}):`, error);
    return false;
  }
}

/**
 * 전역 단축키 해제
 */
export function unregisterGlobalShortcut(accelerator: string): boolean {
  try {
    if (!registeredShortcuts.has(accelerator)) {
      console.warn(`등록되지 않은 단축키입니다: ${accelerator}`);
      return false;
    }

    // 전역 단축키 해제
    globalShortcut.unregister(accelerator);

    // 데이터 제거
    registeredShortcuts.delete(accelerator);
    conflictMap.delete(accelerator);

    addToHistory('unregistered', accelerator);
    console.log(`전역 단축키 해제 성공: ${accelerator}`);
    return true;

  } catch (error) {
    console.error(`단축키 해제 오류 (${accelerator}):`, error);
    return false;
  }
}

/**
 * 모든 전역 단축키 해제
 */
export function unregisterAllGlobalShortcuts(): void {
  try {
    const shortcuts = Array.from(registeredShortcuts.keys());
    
    globalShortcut.unregisterAll();
    registeredShortcuts.clear();
    conflictMap.clear();

    for (const accelerator of shortcuts) {
      addToHistory('unregistered', accelerator);
    }

    console.log('모든 전역 단축키가 해제되었습니다.');
  } catch (error) {
    console.error('모든 단축키 해제 중 오류 발생:', error);
  }
}

/**
 * 단축키 활성화/비활성화
 */
export function toggleGlobalShortcut(accelerator: string, enabled: boolean): boolean {
  try {
    const shortcutData = registeredShortcuts.get(accelerator);
    if (!shortcutData) {
      return false;
    }

    shortcutData.enabled = enabled;
    registeredShortcuts.set(accelerator, shortcutData);

    addToHistory(enabled ? 'enabled' : 'disabled', accelerator);
    console.log(`단축키 ${enabled ? '활성화' : '비활성화'}: ${accelerator}`);
    return true;

  } catch (error) {
    console.error(`단축키 토글 오류 (${accelerator}):`, error);
    return false;
  }
}

/**
 * 로컬 윈도우 단축키 등록
 */
export function registerLocalShortcut(
  window: BrowserWindow,
  accelerator: string,
  callback: () => void
): boolean {
  if (!window || window.isDestroyed()) {
    console.error('유효한 BrowserWindow가 필요합니다.');
    return false;
  }

  try {
    const windowId = window.id;
    const parsed = parseShortcut(accelerator);

    if (!parsed.isValid) {
      throw new Error(`유효하지 않은 단축키 형식: ${accelerator}`);
    }

    // 윈도우 단축키 맵 초기화
    if (!localShortcuts.has(windowId)) {
      localShortcuts.set(windowId, new Map());
    }

    const windowShortcuts = localShortcuts.get(windowId)!;

    // 기존 단축키 확인
    if (windowShortcuts.has(accelerator)) {
      console.warn(`윈도우에 이미 등록된 단축키입니다: ${accelerator}`);
    }

    // 리스너 제한 확인 및 조정
    const webContents = window.webContents;
    const currentListenerCount = webContents.listenerCount('before-input-event');
    
    if (currentListenerCount >= webContents.getMaxListeners() - 2) {
      const newMaxListeners = Math.max(30, webContents.getMaxListeners() * 1.5);
      webContents.setMaxListeners(newMaxListeners);
      console.log(`리스너 최대 수 증가: ${newMaxListeners}`);
    }

    // 단축키 이벤트 리스너 등록
    const eventHandler = (event: Electron.Event, input: Electron.Input) => {
      if (input.type === 'keyDown') {
        const isMatch = matchShortcutInput(accelerator, input);
        
        if (isMatch) {
          event.preventDefault();
          
          try {
            const shortcutData = windowShortcuts.get(accelerator);
            if (shortcutData?.enabled !== false) {
              callback();
              console.log(`로컬 단축키 실행: ${accelerator}`);
            }
          } catch (error) {
            console.error(`로컬 단축키 실행 오류 (${accelerator}):`, error);
          }
        }
      }
    };

    webContents.on('before-input-event', eventHandler);

    // 단축키 데이터 저장
    windowShortcuts.set(accelerator, {
      callback,
      timestamp: Date.now(),
      enabled: true
    });

    // 윈도우 종료 시 정리
    window.once('closed', () => {
      localShortcuts.delete(windowId);
    });

    console.log(`로컬 단축키 등록 성공: ${accelerator} (윈도우 ID: ${windowId})`);
    return true;

  } catch (error) {
    console.error(`로컬 단축키 등록 오류 (${accelerator}):`, error);
    return false;
  }
}

/**
 * 입력과 단축키 매칭
 */
function matchShortcutInput(accelerator: string, input: Electron.Input): boolean {
  try {
    const parsed = parseShortcut(accelerator);
    if (!parsed.isValid) return false;

    // 수정자 키 확인
    const hasCommandOrControl = input.control || input.meta;
    const hasShift = input.shift;
    const hasAlt = input.alt;

    // 수정자 키 매칭 확인
    const requiredCommandOrControl = parsed.modifiers.some(
      mod => mod === 'ctrl' || mod === 'control' || mod === 'commandorcontrol' || mod === 'cmd' || mod === 'command'
    );
    const requiredShift = parsed.modifiers.includes('shift');
    const requiredAlt = parsed.modifiers.includes('alt');

    // 키 매칭 확인
    const keyMatch = input.key.toLowerCase() === parsed.key;

    return (
      keyMatch &&
      hasCommandOrControl === requiredCommandOrControl &&
      hasShift === requiredShift &&
      hasAlt === requiredAlt
    );

  } catch (error) {
    console.error(`단축키 매칭 오류 (${accelerator}):`, error);
    return false;
  }
}

/**
 * 단축키 관리 초기화
 */
export function initializeShortcuts(): void {
  try {
    // 앱 종료 시 모든 단축키 해제
    app.on('will-quit', () => {
      console.log('앱 종료 - 모든 단축키 해제 중...');
      unregisterAllGlobalShortcuts();
    });

    // IPC 핸들러 등록
    setupIpcHandlers();

    console.log('단축키 관리 시스템이 초기화되었습니다.');

  } catch (error) {
    console.error('단축키 초기화 오류:', error);
  }
}

/**
 * IPC 핸들러 설정
 */
function setupIpcHandlers(): void {
  // 전역 단축키 등록 요청
  ipcMain.handle('shortcuts:register-global', (event, config: ShortcutConfig) => {
    return registerGlobalShortcut(
      config.accelerator,
      () => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window && !window.isDestroyed()) {
          window.webContents.send('shortcut-triggered', {
            accelerator: config.accelerator,
            timestamp: Date.now()
          });
        }
      },
      config.description,
      config.category
    );
  });

  // 전역 단축키 해제 요청
  ipcMain.handle('shortcuts:unregister-global', (event, { accelerator }) => {
    return unregisterGlobalShortcut(accelerator);
  });

  // 단축키 토글 요청
  ipcMain.handle('shortcuts:toggle-global', (event, { accelerator, enabled }) => {
    return toggleGlobalShortcut(accelerator, enabled);
  });

  // 등록된 단축키 목록 조회
  ipcMain.handle('shortcuts:get-all', () => {
    const shortcuts = [];
    
    for (const [accelerator, data] of registeredShortcuts.entries()) {
      shortcuts.push({
        accelerator,
        description: data.description,
        category: data.category,
        timestamp: data.timestamp,
        enabled: data.enabled,
        conflicts: conflictMap.get(accelerator) || []
      });
    }

    return shortcuts;
  });

  // 단축키 히스토리 조회
  ipcMain.handle('shortcuts:get-history', () => {
    return shortcutHistory.slice(0, 50); // 최근 50개만 반환
  });

  // 단축키 충돌 검사
  ipcMain.handle('shortcuts:check-conflicts', (event, { accelerator }) => {
    return checkShortcutConflict(accelerator);
  });
}

/**
 * 기본 앱 단축키 설정
 */
export function setupDefaultShortcuts(): void {
  try {
    const defaultShortcuts: ShortcutConfig[] = [];

    // 개발 환경 단축키
    if (process.env.NODE_ENV === 'development') {
      defaultShortcuts.push({
        accelerator: 'CommandOrControl+Shift+I',
        description: '개발자 도구 열기/닫기',
        category: SHORTCUT_CATEGORIES.DEVELOPMENT
      });

      defaultShortcuts.push({
        accelerator: 'F5',
        description: '페이지 새로고침',
        category: SHORTCUT_CATEGORIES.DEVELOPMENT
      });
    }

    // 시스템 단축키
    defaultShortcuts.push({
      accelerator: 'CommandOrControl+Shift+R',
      description: '앱 다시 시작',
      category: SHORTCUT_CATEGORIES.SYSTEM
    });

    // UI 단축키
    defaultShortcuts.push({
      accelerator: 'CommandOrControl+,',
      description: '설정 열기',
      category: SHORTCUT_CATEGORIES.UI
    });

    // 기본 단축키 등록
    for (const shortcut of defaultShortcuts) {
      const success = registerGlobalShortcut(
        shortcut.accelerator,
        () => handleDefaultShortcut(shortcut.accelerator),
        shortcut.description,
        shortcut.category
      );

      if (!success) {
        console.warn(`기본 단축키 등록 실패: ${shortcut.accelerator}`);
      }
    }

    console.log(`기본 단축키 ${defaultShortcuts.length}개 등록 완료`);

  } catch (error) {
    console.error('기본 단축키 설정 오류:', error);
  }
}

/**
 * 기본 단축키 핸들러
 */
function handleDefaultShortcut(accelerator: string): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  switch (accelerator) {
    case 'CommandOrControl+Shift+I':
      if (focusedWindow) {
        focusedWindow.webContents.toggleDevTools();
      }
      break;

    case 'F5':
      if (focusedWindow) {
        focusedWindow.webContents.reload();
      }
      break;

    case 'CommandOrControl+Shift+R':
      app.relaunch();
      app.exit(0);
      break;

    case 'CommandOrControl+,':
      if (focusedWindow) {
        focusedWindow.webContents.send('open-settings');
      }
      break;

    default:
      console.log(`처리되지 않은 기본 단축키: ${accelerator}`);
  }
}

/**
 * 단축키 통계 조회
 */
export function getShortcutStats(): {
  totalRegistered: number;
  totalConflicts: number;
  totalHistory: number;
  categoryCounts: Record<string, number>;
} {
  const categoryCounts: Record<string, number> = {};

  for (const [, data] of registeredShortcuts.entries()) {
    const category = data.category || 'unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  return {
    totalRegistered: registeredShortcuts.size,
    totalConflicts: conflictMap.size,
    totalHistory: shortcutHistory.length,
    categoryCounts
  };
}
