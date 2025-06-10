/**
 * Advanced keyboard monitoring and input processing module
 * Handles global shortcuts, IME composition, Hangul processing, and typing analytics
 */
import { ipcMain, globalShortcut, BrowserWindow, app, shell } from 'electron';
import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi';

// Dynamic import for activeWin
let activeWin: any = null;
async function loadActiveWin() {
  if (!activeWin) {
    try {
      activeWin = await import('active-win');
    } catch (error) {
      console.warn('active-win을 사용할 수 없습니다:', error);
    }
  }
  return activeWin;
}

// Simple debug logging
function debugLog(message: string, ...args: any[]): void {
  console.log(`[키보드] ${message}`, ...args);
}

// Platform configuration
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

// Hangul composition tables
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

// Double consonants mapping
const DOUBLE_CONSONANTS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

// Hangul composition state
interface HangulComposerState {
  choBuffer: string;
  jungBuffer: string;
  jongBuffer: string;
  compositionState: number; // 0: 초성 대기, 1: 중성 대기, 2: 종성 대기
  result: string;
}

// IME composition state
interface IMEComposition {
  isComposing: boolean;
  lastComposedText: string;
  compositionStart: number;
  compositionBuffer: string;
  lastCompletedText: string;
  lastWindowInfo: any;
  totalTypingCount: number;
}

// Permission status
interface PermissionStatus {
  screenRecording: boolean | null;
  accessibility: boolean | null;
}

// Global state
let mainWindow: BrowserWindow | null = null;
let keyboardInitialized = false;
let keyboardHandlersRegistered = false;
let isListening = false;

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

// Key event queue for processing
const keyEventQueue: any[] = [];
let keyEventProcessor: NodeJS.Timeout | null = null;

/**
 * Compose Hangul syllable from jamo characters
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
  const NCount = VCount * TCount;
  const TOffset = SBase + (LIndex * NCount) + (VIndex * TCount) + TIndex;

  return String.fromCharCode(TOffset);
}

/**
 * Decompose Hangul syllable into jamo characters
 */
function decomposeHangul(syllable: string): { cho: string; jung: string; jong: string } {
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
 * Process individual jamo input for Hangul composition
 */
function processJamo(char: string): { result: string; reset: boolean } {
  // Non-Hangul characters
  if (!/^[ㄱ-ㅎㅏ-ㅣ]$/.test(char)) {
    const result = finishComposition();
    return {
      result: result + char,
      reset: true
    };
  }
  
  switch (composerState.compositionState) {
    case 0: // Waiting for initial consonant
      if (char in CHOSEONG_TABLE) {
        composerState.choBuffer = char;
        composerState.compositionState = 1;
        return { result: '', reset: false };
      }
      if (char in JUNGSEONG_TABLE) {
        return { result: char, reset: true };
      }
      return { result: char, reset: true };
    
    case 1: // Waiting for vowel
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
    
    case 2: // Waiting for final consonant
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
        // Reset for new composition starting with vowel
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
 * Finish current Hangul composition
 */
function finishComposition(): string {
  const result = composeHangul(
    composerState.choBuffer,
    composerState.jungBuffer,
    composerState.jongBuffer
  );
  
  // Reset state
  composerState.choBuffer = '';
  composerState.jungBuffer = '';
  composerState.jongBuffer = '';
  composerState.compositionState = 0;
  
  return result;
}

/**
 * Check if key is a special (non-printable) key
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
 * Convert key code to string representation
 */
function getKeyString(keyCode: number): string {
  const keyMap: Record<number, string> = {
    [UiohookKey.Space]: ' ',
    [UiohookKey.Enter]: 'Enter',
    [UiohookKey.Tab]: 'Tab',
    [UiohookKey.Backspace]: 'Backspace',
    // Number keys
    11: '0', 2: '1', 3: '2', 4: '3', 5: '4', 
    6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
    // Alphabet keys
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
    // Skip special keys for typing analysis
    if (isSpecialKey(event.keycode)) return;

    // Get active window information
    let windowInfo = null;
    if (activeWin) {
      try {
        windowInfo = await activeWin();
      } catch (error) {
        console.warn('Failed to get active window:', error);
      }
    }
    
    if (windowInfo) {
      // Update typing statistics
      updateTypingStats(windowInfo, event);
      
      // Process Hangul composition
      const keyString = getKeyString(event.keycode);
      if (/^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(keyString)) {
        const compositionResult = processJamo(keyString);
        if (compositionResult.result) {
          debugLog(`Hangul composition: ${compositionResult.result}`);
        }
      }
      
      // Send to renderer process
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
    // Increment typing count
    imeComposition.totalTypingCount++;
    
    // Send statistics update
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
    // Key down events
    uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
      keyEventQueue.push(event);
    });

    // Key up events (for completion detection)
    uIOhook.on('keyup', (event: UiohookKeyboardEvent) => {
      // Handle composition completion
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
    // Toggle window visibility
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
      debugLog('Global shortcut registered: CommandOrControl+Shift+L');
    } else {
      console.warn('Failed to register global shortcut');
    }

    // Statistics reset shortcut
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
  // Get typing statistics
  ipcMain.handle('get-typing-stats', async () => {
    return {
      totalTypingCount: imeComposition.totalTypingCount,
      compositionState: { ...composerState },
      imeState: { ...imeComposition },
      isListening
    };
  });
  
  // Reset typing statistics
  ipcMain.handle('reset-typing-stats', async () => {
    imeComposition.totalTypingCount = 0;
    imeComposition.lastComposedText = '';
    imeComposition.compositionBuffer = '';
    imeComposition.lastCompletedText = '';
    
    // Reset composer state
    composerState.choBuffer = '';
    composerState.jungBuffer = '';
    composerState.jongBuffer = '';
    composerState.compositionState = 0;
    composerState.result = '';
    
    return true;
  });
  
  // Get keyboard permissions status
  ipcMain.handle('get-keyboard-permissions', async () => {
    return { ...permissionStatus };
  });

  // Toggle keyboard monitoring
  ipcMain.handle('toggle-keyboard-monitoring', async () => {
    if (isListening) {
      await stopKeyboardMonitoring();
    } else {
      await startKeyboardMonitoring();
    }
    return isListening;
  });

  // Get Hangul composition state
  ipcMain.handle('get-hangul-composition-state', async () => {
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

    // Setup event listeners
    setupKeyboardEventListeners();

    // Start uIOhook
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
    debugLog('Advanced keyboard already initialized');
    return;
  }
  
  try {
    debugLog('Initializing advanced keyboard system...');
    
    // Register global shortcuts
    registerGlobalShortcuts();
    
    // Setup IPC handlers
    setupKeyboardIpcHandlers();
    
    // Start key event processor
    keyEventProcessor = setInterval(processKeyEventQueue, 16); // ~60fps
    
    // Start keyboard monitoring
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
    
    // Stop keyboard monitoring
    await stopKeyboardMonitoring();
    
    // Unregister global shortcuts
    globalShortcut.unregisterAll();
    
    // Clear key event processor
    if (keyEventProcessor) {
      clearInterval(keyEventProcessor);
      keyEventProcessor = null;
    }
    
    // Clear event queue
    keyEventQueue.length = 0;
    
    // Finish any pending composition
    finishComposition();
    
    // Reset state variables
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
    try {
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
