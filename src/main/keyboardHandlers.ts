/**
 * Loop 6 키보드 이벤트 처리 IPC 핸들러
 * 
 * Loop 3의 keyboard-handlers.js를 TypeScript로 완전 마이그레이션
 * 키보드 이벤트 리스너 설정/관리, 한글 입력 처리, IME 지원 등을 담당합니다.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { debugLog, errorLog } from './utils';
import { KeyboardManager } from './keyboard';
import SettingsManager from './settings-manager';
import { processKeyPress } from './tracking-handlers';

// 키보드 핸들러 상태 관리
interface KeyboardHandlerState {
  isRegistered: boolean;
  keyboardManager: KeyboardManager | null;
  isListening: boolean;
  lastKeyTime: number;
  keySequence: string[];
  maxSequenceLength: number;
}

// 한글 처리를 위한 자모 정보
interface JamoInfo {
  initial: string[];  // 초성
  medial: string[];   // 중성
  final: string[];    // 종성
}

// 한글 자모 맵핑
const HANGUL_JAMO: JamoInfo = {
  initial: [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ],
  medial: [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
    'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
  ],
  final: [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ',
    'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
    'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ]
};

// 전역 키보드 핸들러 상태
let keyboardState: KeyboardHandlerState = {
  isRegistered: false,
  keyboardManager: null,
  isListening: false,
  lastKeyTime: 0,
  keySequence: [],
  maxSequenceLength: 10
};

/**
 * 한글 문자의 자모 개수 계산
 */
export function getJamoCount(char: string): number {
  if (!char || char.length === 0) return 0;
  
  // 한글 완성형 문자 범위 확인 (가-힣)
  const isHangulComplete = /[\uAC00-\uD7AF]/.test(char);
  if (!isHangulComplete) {
    // 한글이 아니면 1개로 계산
    return 1;
  }
  
  try {
    // 초성, 중성, 종성 분리
    const charCode = char.charCodeAt(0);
    const baseCode = 0xAC00; // '가'의 유니코드
    
    if (charCode < baseCode) return 1;
    
    // 종성 존재 여부 확인
    const hasJongseong = (charCode - baseCode) % 28 !== 0;
    
    // 초성 + 중성 + (종성 있으면 추가)
    return hasJongseong ? 3 : 2;
  } catch (error: any) {
    errorLog('자모 개수 계산 오류:', error);
    return 1; // 오류 시 기본값
  }
}

/**
 * 한글 문자를 자모로 분해
 */
export function decomposeHangul(char: string): string[] {
  if (!char || char.length === 0) return [];
  
  const isHangulComplete = /[\uAC00-\uD7AF]/.test(char);
  if (!isHangulComplete) {
    return [char]; // 한글이 아니면 그대로 반환
  }
  
  try {
    const charCode = char.charCodeAt(0);
    const baseCode = 0xAC00; // '가'
    const index = charCode - baseCode;
    
    // 초성, 중성, 종성 인덱스 계산
    const initialIndex = Math.floor(index / (21 * 28));
    const medialIndex = Math.floor((index % (21 * 28)) / 28);
    const finalIndex = index % 28;
    
    const result = [
      HANGUL_JAMO.initial[initialIndex],
      HANGUL_JAMO.medial[medialIndex]
    ];
    
    // 종성이 있으면 추가
    if (finalIndex > 0) {
      result.push(HANGUL_JAMO.final[finalIndex]);
    }
    
    return result;
  } catch (error: any) {
    errorLog('한글 분해 오류:', error);
    return [char];
  }
}

/**
 * 키보드 이벤트 처리
 */
function handleKeyboardEvent(eventData: any): void {
  try {
    const currentTime = Date.now();
    keyboardState.lastKeyTime = currentTime;
    
    // 키 시퀀스에 추가 (최대 길이 유지)
    keyboardState.keySequence.push(eventData.key || '');
    if (keyboardState.keySequence.length > keyboardState.maxSequenceLength) {
      keyboardState.keySequence.shift();
    }
    
    // 한글 처리
    let jamoCount = 1;
    if (eventData.key && typeof eventData.key === 'string') {
      jamoCount = getJamoCount(eventData.key);
    }
    
    // 키 데이터 확장
    const extendedKeyData = {
      ...eventData,
      timestamp: currentTime,
      jamoCount,
      sequence: [...keyboardState.keySequence]
    };
    
    // 추적 핸들러로 전달
    processKeyPress(extendedKeyData);
    
    // 렌더러에 키 이벤트 전송
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (mainWindow) {
      mainWindow.webContents.send('keyboard-event', extendedKeyData);
    }
    
  } catch (error: any) {
    errorLog('키보드 이벤트 처리 오류:', error);
  }
}

/**
 * 키보드 리스너 설정
 */
export async function setupKeyboardListenerIfNeeded(): Promise<boolean> {
  try {
    if (keyboardState.isListening && keyboardState.keyboardManager) {
      debugLog('키보드 리스너가 이미 활성화되어 있습니다');
      return true;
    }
    
    if (!keyboardState.keyboardManager) {
      keyboardState.keyboardManager = new KeyboardManager();
    }
    
    // 키보드 이벤트 리스너 설정
    const success = await keyboardState.keyboardManager.startListening(handleKeyboardEvent);
    
    if (success) {
      keyboardState.isListening = true;
      debugLog('키보드 리스너 설정 성공');
      return true;
    } else {
      debugLog('키보드 리스너 설정 실패');
      return false;
    }
  } catch (error: any) {
    errorLog('키보드 리스너 설정 오류:', error);
    return false;
  }
}

/**
 * 키보드 리스너 정리
 */
export function cleanupKeyboardListener(): boolean {
  try {
    if (keyboardState.keyboardManager && keyboardState.isListening) {
      keyboardState.keyboardManager.stopListening();
      keyboardState.isListening = false;
      debugLog('키보드 리스너 정리 완료');
      return true;
    }
    return false;
  } catch (error: any) {
    errorLog('키보드 리스너 정리 중 오류:', error);
    return false;
  }
}

/**
 * 한글 입력 테스트
 */
async function testHangulInput(): Promise<{ success: boolean; result: any }> {
  try {
    const testChars = ['가', '나', '다', '라', '마', '한', '글', '테', '스', '트'];
    const results = testChars.map(char => ({
      char,
      jamoCount: getJamoCount(char),
      decomposed: decomposeHangul(char)
    }));
    
    debugLog('한글 입력 테스트 결과:', results);
    
    return {
      success: true,
      result: {
        testChars: results,
        listenerActive: keyboardState.isListening,
        managerAvailable: !!keyboardState.keyboardManager
      }
    };
  } catch (error: any) {
    errorLog('한글 입력 테스트 오류:', error);
    return {
      success: false,
      result: { error: error.message }
    };
  }
}

/**
 * 키보드 상태 정보 가져오기
 */
export function getKeyboardStatus(): any {
  return {
    isListening: keyboardState.isListening,
    managerAvailable: !!keyboardState.keyboardManager,
    lastKeyTime: keyboardState.lastKeyTime,
    recentKeys: keyboardState.keySequence.slice(-5),
    settings: SettingsManager.getSettings().keyboard || {}
  };
}

/**
 * IPC 핸들러 등록
 */
export function registerKeyboardHandlers(): void {
  if (keyboardState.isRegistered) {
    debugLog('키보드 관련 IPC 핸들러가 이미 등록되어 있습니다');
    return;
  }

  debugLog('키보드 관련 IPC 핸들러 등록 중...');

  // 키보드 리스너 시작 핸들러
  ipcMain.handle('start-keyboard-listener', async () => {
    try {
      const success = await setupKeyboardListenerIfNeeded();
      return {
        success,
        message: success ? '키보드 리스너 시작됨' : '키보드 리스너 시작 실패',
        status: getKeyboardStatus()
      };
    } catch (error: any) {
      errorLog('키보드 리스너 시작 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 키보드 리스너 중지 핸들러
  ipcMain.handle('stop-keyboard-listener', async () => {
    try {
      const success = cleanupKeyboardListener();
      return {
        success,
        message: success ? '키보드 리스너 중지됨' : '키보드 리스너 중지 실패',
        status: getKeyboardStatus()
      };
    } catch (error: any) {
      errorLog('키보드 리스너 중지 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 키보드 상태 조회 핸들러
  ipcMain.handle('get-keyboard-status', async () => {
    try {
      return {
        success: true,
        status: getKeyboardStatus()
      };
    } catch (error: any) {
      errorLog('키보드 상태 조회 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 한글 입력 테스트 핸들러
  ipcMain.handle('test-hangul-input', async () => {
    try {
      return await testHangulInput();
    } catch (error: any) {
      errorLog('한글 입력 테스트 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 자모 개수 계산 핸들러
  ipcMain.handle('get-jamo-count', async (event, char: string) => {
    try {
      const count = getJamoCount(char);
      return {
        success: true,
        char,
        jamoCount: count,
        decomposed: decomposeHangul(char)
      };
    } catch (error: any) {
      errorLog('자모 개수 계산 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 키 시퀀스 조회 핸들러
  ipcMain.handle('get-key-sequence', async () => {
    try {
      return {
        success: true,
        sequence: [...keyboardState.keySequence],
        lastKeyTime: keyboardState.lastKeyTime
      };
    } catch (error: any) {
      errorLog('키 시퀀스 조회 오류:', error);
      return { success: false, message: error.message };
    }
  });

  // 키보드 설정 업데이트 핸들러
  ipcMain.handle('update-keyboard-settings', async (event, settings) => {
    try {
      const currentSettings = SettingsManager.getSettings();
      await SettingsManager.updateMultipleSettings({
        ...currentSettings,
        keyboard: { ...currentSettings.keyboard, ...settings }
      });
      
      return {
        success: true,
        message: '키보드 설정 업데이트 완료',
        settings: SettingsManager.getSettings().keyboard
      };
    } catch (error: any) {
      errorLog('키보드 설정 업데이트 오류:', error);
      return { success: false, message: error.message };
    }
  });

  keyboardState.isRegistered = true;
  debugLog('키보드 관련 IPC 핸들러 등록 완료');
}

/**
 * 키보드 핸들러 초기화
 */
export async function initializeKeyboardHandlers(): Promise<void> {
  try {
    // 설정에서 자동 시작 여부 확인
    const settings = SettingsManager.getSettings();
    
    if (settings.keyboard?.autoStart !== false) {
      await setupKeyboardListenerIfNeeded();
    }
    
    debugLog('키보드 핸들러 초기화 완료');
  } catch (error: any) {
    errorLog('키보드 핸들러 초기화 오류:', error);
  }
}

/**
 * 키보드 핸들러 정리
 */
export function cleanupKeyboardHandlers(): void {
  cleanupKeyboardListener();
  
  if (keyboardState.keyboardManager) {
    keyboardState.keyboardManager = null;
  }
  
  keyboardState.isRegistered = false;
  keyboardState.keySequence = [];
  
  debugLog('키보드 핸들러 정리 완료');
}

// 기본 내보내기
export default {
  registerKeyboardHandlers,
  setupKeyboardListenerIfNeeded,
  cleanupKeyboardListener,
  getJamoCount,
  decomposeHangul,
  getKeyboardStatus,
  initializeKeyboardHandlers,
  cleanupKeyboardHandlers,
  testHangulInput: () => testHangulInput()
};
