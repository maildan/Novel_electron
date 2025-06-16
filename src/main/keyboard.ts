/**
 * 고급 키보드 모니터링 및 입력 처리 모듈
 * 전역 단축키, IME 조합, 한글 처리, 타이핑 분석을 담당합니다
 */
import { ipcMain, globalShortcut, BrowserWindow, app, shell } from 'electron';
import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi';

// app, shell 모듈 사용 함수 (한국어 디버깅)
function checkElectronModules() {
  const moduleInfo = {
    앱준비상태: app.isReady(),
    앱버전: app.getVersion(),
    shell사용가능: typeof shell.openExternal === 'function'
  };
  console.log('[키보드 모듈] Electron 앱 상태 확인:', moduleInfo);
  return moduleInfo; // 함수 반환값 추가하여 실제 사용
}

// active-win 동적 가져오기
let activeWin: any = null;
async function loadActiveWin() {
  if (!activeWin) {
    try {
      activeWin = await import('active-win');
      console.log('[active-win] 모듈 로드 성공:', typeof activeWin);
    } catch (error) {
      console.warn('[active-win] 모듈 로드 실패:', error);
    }
  }
  return activeWin;
}

// 간단한 디버그 로깅
function debugLog(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[키보드 ${timestamp}] ${message}`, ...args);
}

// 플랫폼 Setup
const PLATFORM_KEY_CONFIGS = {
  darwin: {
    commandKey: 'Meta',
    ctrlKey: 'Control',
    altKey: 'Alt',
    shiftKey: 'Shift'
  },
  win32: {
    commandKey: 'Super',
    ctrlKey: 'Control',
    altKey: 'Alt',
    shiftKey: 'Shift'
  },
  linux: {
    commandKey: 'Super',
    ctrlKey: 'Control',
    altKey: 'Alt',
    shiftKey: 'Shift'
  }
};

// 현재 플랫폼 설정 가져오기
const currentPlatformConfig = PLATFORM_KEY_CONFIGS[process.platform as keyof typeof PLATFORM_KEY_CONFIGS] || PLATFORM_KEY_CONFIGS.win32;
console.log('[키보드 초기화] 현재 플랫폼 키 설정:', currentPlatformConfig);

// 한글 조합 테이블
const CHOSEONG_TABLE: Record<string, number> = {
  'ㄱ': 0, 'ㄲ': 1, 'ㄴ': 2, 'ㄷ': 3, 'ㄸ': 4, 'ㄹ': 5, 'ㅁ': 6, 'ㅂ': 7, 'ㅃ': 8,
  'ㅅ': 9, 'ㅆ': 10, 'ㅇ': 11, 'ㅈ': 12, 'ㅉ': 13, 'ㅊ': 14, 'ㅋ': 15, 'ㅌ': 16, 'ㅍ': 17, 'ㅎ': 18
};

const JUNGSEONG_TABLE: Record<string, number> = {
  'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅖ': 7, 'ㅗ': 8,
  'ㅘ': 9, 'ㅙ': 10, 'ㅚ': 11, 'ㅛ': 12, 'ㅜ': 13, 'ㅝ': 14, 'ㅞ': 15, 'ㅟ': 16,
  'ㅠ': 17, 'ㅡ': 18, 'ㅢ': 19, 'ㅣ': 20
};

const JONGSEONG_TABLE: Record<string, number> = {
  '': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3, 'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7, 'ㄹ': 8,
  'ㄺ': 9, 'ㄻ': 10, 'ㄼ': 11, 'ㄽ': 12, 'ㄾ': 13, 'ㄿ': 14, 'ㅀ': 15, 'ㅁ': 16,
  'ㅂ': 17, 'ㅄ': 18, 'ㅅ': 19, 'ㅆ': 20, 'ㅇ': 21, 'ㅈ': 22, 'ㅊ': 23, 'ㅋ': 24, 'ㅌ': 25, 'ㅍ': 26, 'ㅎ': 27
};

// 쌍자음 매핑
const DOUBLE_CONSONANTS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};
console.log('[키보드 초기화] 쌍자음 매핑 테이블 로드:', Object.keys(DOUBLE_CONSONANTS).length, '개');

// 한글 조합 상태
interface HangulComposerState {
  choBuffer: string;
  jungBuffer: string;
  jongBuffer: string;
  compositionState: number; // 0: 초성 대기, 1: 중성 대기, 2: 종성 대기
  result: string;
}

// IME 조합 상태 관리
interface IMEComposition {
  isComposing: boolean;
  lastComposedText: string;
  compositionStart: number;
  compositionBuffer: string;
  lastCompletedText: string;
  lastWindowInfo: any;
  totalTypingCount: number;
}

// 권한 상태
interface PermissionStatus {
  screenRecording: boolean | null;
  accessibility: boolean | null;
}

// 전역 상태
let mainWindow: BrowserWindow | null = null;
let keyboardInitialized = false;
let keyboardHandlersRegistered = false;
let isListening = false;

// 핸들러 등록 상태 확인 함수
function checkHandlerRegistration() {
  console.log('[키보드 상태] 핸들러 등록:', keyboardHandlersRegistered, '초기화:', keyboardInitialized, '리스닝:', isListening);
  return keyboardHandlersRegistered;
}

const permissionStatus: PermissionStatus = {
  screenRecording: null,
  accessibility: null
};

const composerState: HangulComposerState = {
  choBuffer: '',
  jungBuffer: '',
  jongBuffer: '',
  compositionState: 0,
  result: ''
};

const imeComposition: IMEComposition = {
  isComposing: false,
  lastComposedText: '',
  compositionStart: 0,
  compositionBuffer: '',
  lastCompletedText: '',
  lastWindowInfo: null,
  totalTypingCount: 0
};

// 키 이벤트 처리 큐
const keyEventQueue: any[] = [];
let keyEventProcessor: NodeJS.Timeout | null = null;

/**
 * 자모에서 한글 음절 조합
 */
function composeHangul(cho: string, jung: string, jong: string = ''): string {
  if (!CHOSEONG_TABLE.hasOwnProperty(cho) ||
      !JUNGSEONG_TABLE.hasOwnProperty(jung) ||
      (jong && !JONGSEONG_TABLE.hasOwnProperty(jong))) {
    return '';
  }

  const LIndex = CHOSEONG_TABLE[cho];
  const VIndex = JUNGSEONG_TABLE[jung];
  const TIndex = JONGSEONG_TABLE[jong || ''];

  const SBase = 0xAC00;
  const LCount = 19;
  const VCount = 21;
  const TCount = 28;
  console.log('[한글 조합] 조합 매개변수:', { LIndex, VIndex, TIndex, LCount });
  const NCount = VCount * TCount;
  const TOffset = SBase + (LIndex * NCount) + (VIndex * TCount) + TIndex;

  const composed = String.fromCharCode(TOffset);
  
  // 조합된 음절을 다시 분해해서 검증 (decomposeHangul 함수 사용)
  const decomposed = decomposeHangul(composed);
  console.log('[한글 조합 검증] 원본:', { cho, jung, jong }, '분해 결과:', decomposed);
  
  return composed;
}

/**
 * 한글 음절을 자모로 분해
 */
function decomposeHangul(syllable: string): { cho: string; jung: string; jong: string } {
  console.log('[한글 분해] 분해할 음절:', syllable);
  if (!/^[가-힣]$/.test(syllable)) {
    return { cho: '', jung: '', jong: '' };
  }

  const code = syllable.charCodeAt(0) - 0xAC00;
  
  const jong = code % 28;
  const jung = Math.floor((code % 588) / 28);
  const cho = Math.floor(code / 588);
  
  const choList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const jungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const jongList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  return {
    cho: choList[cho],
    jung: jungList[jung],
    jong: jongList[jong]
  };
}

/**
 * 한글 조합을 위한 개별 자모 입력 처리
 */
function processJamo(char: string): { result: string; reset: boolean } {
  // 한글이 아닌 문자들
  if (!/^[ㄱ-ㅎㅏ-ㅣ]$/.test(char)) {
    const result = finishComposition();
    return {
      result: result + char,
      reset: true
    };
  }
  
  switch (composerState.compositionState) {
    case 0: // 초성 대기
      if (char in CHOSEONG_TABLE) {
        composerState.choBuffer = char;
        composerState.compositionState = 1;
        return { result: '', reset: false };
      }
      if (char in JUNGSEONG_TABLE) {
        return { result: char, reset: true };
      }
      return { result: char, reset: true };
    
    case 1: // 중성 대기
      if (char in JUNGSEONG_TABLE) {
        composerState.jungBuffer = char;
        composerState.compositionState = 2;
        return {
          result: composeHangul(composerState.choBuffer, composerState.jungBuffer),
          reset: false
        };
      } else {
        const result = composerState.choBuffer;
        composerState.choBuffer = char;
        composerState.compositionState = char in CHOSEONG_TABLE ? 1 : 0;
        return { result, reset: false };
      }
    
    case 2: // 종성 대기
      if (char in JONGSEONG_TABLE) {
        composerState.jongBuffer = char;
        return {
          result: composeHangul(
            composerState.choBuffer,
            composerState.jungBuffer,
            composerState.jongBuffer
          ),
          reset: false
        };
      } else if (char in CHOSEONG_TABLE) {
        const result = composeHangul(
          composerState.choBuffer,
          composerState.jungBuffer,
          composerState.jongBuffer
        );
        composerState.choBuffer = char;
        composerState.jungBuffer = '';
        composerState.jongBuffer = '';
        composerState.compositionState = 1;
        return { result, reset: false };
      } else if (char in JUNGSEONG_TABLE) {
        const result = composeHangul(
          composerState.choBuffer,
          composerState.jungBuffer,
          composerState.jongBuffer
        );
        // 모음으로 시작하는 새로운 조합을 위해 초기화
        composerState.choBuffer = '';
        composerState.jungBuffer = char;
        composerState.jongBuffer = '';
        composerState.compositionState = 0;
        return { result: result + char, reset: false };
      }
      break;
  }
  
  return { result: char, reset: true };
}

/**
 * 한글 조합 완료
 */
function finishComposition(): string {
  const result = composeHangul(
    composerState.choBuffer,
    composerState.jungBuffer,
    composerState.jongBuffer
  );
  
  // 상태 초기화
  composerState.choBuffer = '';
  composerState.jungBuffer = '';
  composerState.jongBuffer = '';
  composerState.compositionState = 0;
  
  return result;
}

/**
 * 키가 특수키(출력 불가능)인지 확인
 */
function isSpecialKey(keyCode: number): boolean {
  const specialKeys: number[] = [
    UiohookKey.Escape, UiohookKey.F1, UiohookKey.F2, UiohookKey.F3, UiohookKey.F4,
    UiohookKey.F5, UiohookKey.F6, UiohookKey.F7, UiohookKey.F8, UiohookKey.F9,
    UiohookKey.F10, UiohookKey.F11, UiohookKey.F12, UiohookKey.PrintScreen,
    UiohookKey.ScrollLock, UiohookKey.Insert, UiohookKey.Home,
    UiohookKey.PageUp, UiohookKey.Delete, UiohookKey.End, UiohookKey.PageDown,
    UiohookKey.ArrowRight, UiohookKey.ArrowLeft, UiohookKey.ArrowDown, UiohookKey.ArrowUp,
    UiohookKey.NumLock, UiohookKey.Ctrl, UiohookKey.Shift, UiohookKey.Alt,
    UiohookKey.Meta, UiohookKey.CtrlRight, UiohookKey.ShiftRight, UiohookKey.AltRight,
    UiohookKey.MetaRight, UiohookKey.CapsLock
  ];

  return specialKeys.includes(keyCode);
}

/**
 * 키 코드를 문자열 표현으로 변환
 */
function getKeyString(keyCode: number): string {
  const keyMap: Record<number, string> = {
    [UiohookKey.Space]: ' ',
    [UiohookKey.Enter]: 'Enter',
    [UiohookKey.Tab]: 'Tab',
    [UiohookKey.Backspace]: 'Backspace',
    // 숫자 키
    11: '0', 2: '1', 3: '2', 4: '3', 5: '4', 
    6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
    // 알파벳 키
    [UiohookKey.A]: 'a', [UiohookKey.B]: 'b', [UiohookKey.C]: 'c', [UiohookKey.D]: 'd',
    [UiohookKey.E]: 'e', [UiohookKey.F]: 'f', [UiohookKey.G]: 'g', [UiohookKey.H]: 'h',
    [UiohookKey.I]: 'i', [UiohookKey.J]: 'j', [UiohookKey.K]: 'k', [UiohookKey.L]: 'l',
    [UiohookKey.M]: 'm', [UiohookKey.N]: 'n', [UiohookKey.O]: 'o', [UiohookKey.P]: 'p',
    [UiohookKey.Q]: 'q', [UiohookKey.R]: 'r', [UiohookKey.S]: 's', [UiohookKey.T]: 't',
    [UiohookKey.U]: 'u', [UiohookKey.V]: 'v', [UiohookKey.W]: 'w', [UiohookKey.X]: 'x',
    [UiohookKey.Y]: 'y', [UiohookKey.Z]: 'z'
  };

  return keyMap[keyCode] || `Key${keyCode}`;
}

/**
 * Process key event queue
 */
function processKeyEventQueue(): void {
  if (keyEventQueue.length === 0) return;
  
  try {
    while (keyEventQueue.length > 0) {
      const event = keyEventQueue.shift();
      if (event) {
        processKeyEvent(event);
      }
    }
  } catch (error) {
    console.error('Key event queue processing error:', error);
  }
}

/**
 * Process individual key event
 */
async function processKeyEvent(event: UiohookKeyboardEvent): Promise<void> {
  try {
    // 타이핑 분석에서 특수 키 제외
    if (isSpecialKey(event.keycode)) return;

    // 활성 창 정보 가져오기
    let windowInfo = null;
    if (activeWin) {
      try {
        windowInfo = await activeWin();
      } catch (error) {
        console.warn('활성 창 가져오기 Failed:', error);
      }
    }
    
    if (windowInfo) {
      // 타이핑 통계 업데이트
      updateTypingStats(windowInfo, event);
      
      // 한글 조합 처리
      const keyString = getKeyString(event.keycode);
      if (/^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(keyString)) {
        const compositionResult = processJamo(keyString);
        if (compositionResult.result) {
          debugLog('Hangul composition: ${compositionResult.result}');
        }
      }
      
      // 렌더러 프로세스로 전송
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('key-event', {
          key: keyString,
          keyCode: event.keycode,
          timestamp: Date.now(),
          windowInfo,
          shiftKey: event.shiftKey || false,
          ctrlKey: event.ctrlKey || false,
          altKey: event.altKey || false,
          metaKey: event.metaKey || false
        });
      }
    }
  } catch (error) {
    console.error('Key event processing error:', error);
  }
}

/**
 * Update typing statistics
 */
function updateTypingStats(windowInfo: any, event: UiohookKeyboardEvent): void {
  try {
    // 타이핑 카운트 증가
    imeComposition.totalTypingCount++;
    
    // 통계 업데이트 전송
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('typing-stats-update', {
        appName: windowInfo.owner?.name || 'Unknown',
        windowTitle: windowInfo.title || '',
        typingCount: imeComposition.totalTypingCount,
        timestamp: Date.now(),
        key: getKeyString(event.keycode)
      });
    }
  } catch (error) {
    console.error('Typing stats update error:', error);
  }
}

/**
 * Setup keyboard event listeners
 */
function setupKeyboardEventListeners(): void {
  try {
    // 키 다운 이벤트
    uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
      keyEventQueue.push(event);
    });

    // 키 업 이벤트 (조합 Completed 감지용)
    uIOhook.on('keyup', (event: UiohookKeyboardEvent) => {
      // 조합 Completed 처리
      if (event.keycode === UiohookKey.Space || event.keycode === UiohookKey.Enter) {
        const result = finishComposition();
        if (result && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('hangul-composition-complete', {
            result,
            timestamp: Date.now()
          });
        }
      }
    });

    debugLog('Keyboard event listeners setup completed');
  } catch (error) {
    console.error('Keyboard event listeners setup error:', error);
  }
}

/**
 * Register global shortcuts
 */
function registerGlobalShortcuts(): void {
  try {
    // 창 가시성 토글
    const registered = globalShortcut.register('CommandOrControl+Shift+L', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    
    if (registered) {
      debugLog('Register global shortcuts: CommandOrControl+Shift+L');
    } else {
      console.warn('Failed to register global shortcut');
    }

    // 통계 리셋 단축키
    globalShortcut.register('CommandOrControl+Shift+R', () => {
      imeComposition.totalTypingCount = 0;
      imeComposition.lastComposedText = '';
      imeComposition.compositionBuffer = '';
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('typing-stats-reset', {
          timestamp: Date.now()
        });
      }
      
      debugLog('Typing statistics reset');
    });

  } catch (error) {
    console.error('Global shortcut registration error:', error);
  }
}

/**
 * Setup keyboard IPC handlers
 */
function setupKeyboardIpcHandlers(): void {
  // 타이핑 통계 가져오기
  ipcMain.handle('getTypingStats', async () => {
    return {
      totalTypingCount: imeComposition.totalTypingCount,
      compositionState: { ...composerState },
      imeState: { ...imeComposition },
      isListening
    };
  });
  
  // 타이핑 통계 리셋
  ipcMain.handle('resetTypingStats', async () => {
    imeComposition.totalTypingCount = 0;
    imeComposition.lastComposedText = '';
    imeComposition.compositionBuffer = '';
    imeComposition.lastCompletedText = '';
    
    // 조합 상태 리셋
    composerState.choBuffer = '';
    composerState.jungBuffer = '';
    composerState.jongBuffer = '';
    composerState.compositionState = 0;
    composerState.result = '';
    
    return true;
  });
  
  // 키보드 권한 상태 가져오기
  ipcMain.handle('getKeyboardPermissions', async () => {
    return { ...permissionStatus };
  });

  // 시스템 권한 Setup 열기
  ipcMain.handle('openPermissionsSettings', async () => {
    try {
      const { shell } = require('electron');
      if (process.platform === 'darwin') {
        // macOS - 보안 및 개인정보 환경설정 열기
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
        return { success: true, message: '시스템 환경Setup이 열렸습니다' };
      } else if (process.platform === 'win32') {
        // Windows - 개인정보 설정 열기
        await shell.openExternal('ms-settings:privacy-general');
        return { success: true, message: '개인정보 Setup이 열렸습니다' };
      } else {
        // Linux - 시스템 설정 열기 (배포판별 상이함)
        await shell.openExternal('gnome-control-center');
        return { success: true, message: '시스템 Setup이 열렸습니다' };
      }
    } catch (error) {
      console.error('권한 Setup 열기 Failed:', error);
      return { success: false, message: '시스템 Setup 열기에 Failed했습니다' };
    }
  });

  // 키보드 모니터링 토글
  ipcMain.handle('toggleKeyboardMonitoring', async () => {
    if (isListening) {
      await stopKeyboardMonitoring();
    } else {
      await startKeyboardMonitoring();
    }
    return isListening;
  });

  // 한글 조합 상태 가져오기
  ipcMain.handle('getHangulCompositionState', async () => {
    return { ...composerState };
  });
  
  debugLog('Keyboard IPC handlers registered');
}

/**
 * Start keyboard monitoring
 */
async function startKeyboardMonitoring(): Promise<void> {
  try {
    if (isListening) {
      debugLog('Keyboard monitoring already active');
      return;
    }

    // 이벤트 리스너 Setup
    setupKeyboardEventListeners();

    // uIOhook 시작
    uIOhook.start();
    isListening = true;
    
    debugLog('Keyboard monitoring started');
  } catch (error) {
    console.error('Failed to start keyboard monitoring:', error);
    throw error;
  }
}

/**
 * Stop keyboard monitoring
 */
async function stopKeyboardMonitoring(): Promise<void> {
  try {
    if (!isListening) return;

    uIOhook.stop();
    isListening = false;
    
    debugLog('Keyboard monitoring stopped');
  } catch (error) {
    console.error('Failed to stop keyboard monitoring:', error);
  }
}

/**
 * Initialize advanced keyboard system
 */
export async function initAdvancedKeyboard(window: BrowserWindow): Promise<void> {
  mainWindow = window;
  
  if (keyboardInitialized) {
    debugLog('고급 키보드 시스템이 이미 초기화되어 있습니다');
    return;
  }
  
  try {
    debugLog('Initializing advanced keyboard system...');
    
    // Electron 모듈 상태 확인
    const moduleStatus = checkElectronModules();
    debugLog('모듈 상태 확인 결과:', moduleStatus);
    
    // active-win 모듈 로드 시도
    await loadActiveWin();
    
    // 핸들러 등록 상태 확인
    checkHandlerRegistration();
    
    // 전역 단축키 등록
    registerGlobalShortcuts();
    
    // IPC 핸들러 설정
    setupKeyboardIpcHandlers();
    
    // 키 이벤트 프로세서 시작
    keyEventProcessor = setInterval(processKeyEventQueue, 16); // ~60fps
    
    // 키보드 모니터링 시작
    await startKeyboardMonitoring();
    
    keyboardInitialized = true;
    debugLog('Advanced keyboard system initialization completed');
  } catch (error) {
    console.error('Advanced keyboard initialization error:', error);
    throw error;
  }
}

/**
 * Cleanup keyboard resources
 */
export async function cleanupAdvancedKeyboard(): Promise<void> {
  try {
    debugLog('Cleaning up advanced keyboard system...');
    
    // 키보드 모니터링 중지
    await stopKeyboardMonitoring();
    
    // 전역 단축키 해제
    globalShortcut.unregisterAll();
    
    // 키 이벤트 프로세서 제거
    if (keyEventProcessor) {
      clearInterval(keyEventProcessor);
      keyEventProcessor = null;
    }
    
    // 이벤트 큐 Cleanup
    keyEventQueue.length = 0;
    
    // 대기 중인 조합 Completed
    finishComposition();
    
    // 상태 변수 초기화
    keyboardInitialized = false;
    keyboardHandlersRegistered = false;
    isListening = false;
    
    debugLog('Advanced keyboard system cleanup completed');
  } catch (error) {
    console.error('Advanced keyboard cleanup error:', error);
  }
}

/**
 * Get keyboard system status
 */
export function getKeyboardStatus(): {
  initialized: boolean;
  listening: boolean;
  queueSize: number;
  totalTypingCount: number;
  compositionState: HangulComposerState;
} {
  return {
    initialized: keyboardInitialized,
    listening: isListening,
    queueSize: keyEventQueue.length,
    totalTypingCount: imeComposition.totalTypingCount,
    compositionState: { ...composerState }
  };
}

/**
 * KeyboardManager class for compatibility with handlers
 */
export class KeyboardManager {
  private static instance: KeyboardManager;
  private mainWindow: BrowserWindow | null = null;
  
  static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }
  
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }
  
  async initialize(window?: BrowserWindow): Promise<void> {
    if (window) {
      this.mainWindow = window;
    }
    if (this.mainWindow) {
      await initAdvancedKeyboard(this.mainWindow);
    }
  }
  
  async start(): Promise<void> {
    await startKeyboardMonitoring();
  }
  
  async stop(): Promise<void> {
    await stopKeyboardMonitoring();
  }
  
  async cleanup(): Promise<void> {
    await cleanupAdvancedKeyboard();
  }
  
  getStatus() {
    return getKeyboardStatus();
  }
  
  isInitialized(): boolean {
    return keyboardInitialized;
  }
  
  isListening(): boolean {
    return isListening;
  }
  
  async startListening(callback?: (event: any) => void): Promise<boolean> {
    console.log('[키보드 리스닝] 시작 요청, 콜백 함수:', typeof callback);
    try {
      if (callback) {
        console.log('[키보드 리스닝] 콜백 함수가 제공됨, 등록 시도');
        // 콜백이 제공된 경우 이벤트 리스너 등록
      }
      await startKeyboardMonitoring();
      return true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      return false;
    }
  }
  
  async stopListening(): Promise<void> {
    await stopKeyboardMonitoring();
  }
  
  // dispose 메서드 추가 (cleanup과 동일한 기능)
  async dispose(): Promise<void> {
    await this.cleanup();
  }
}
