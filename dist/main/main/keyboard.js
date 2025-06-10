"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardManager = void 0;
exports.initAdvancedKeyboard = initAdvancedKeyboard;
exports.cleanupAdvancedKeyboard = cleanupAdvancedKeyboard;
exports.getKeyboardStatus = getKeyboardStatus;
/**
 * Advanced keyboard monitoring and input processing module
 * Handles global shortcuts, IME composition, Hangul processing, and typing analytics
 */
const electron_1 = require("electron");
const uiohook_napi_1 = require("uiohook-napi");
// Dynamic import for activeWin
let activeWin = null;
async function loadActiveWin() {
    if (!activeWin) {
        try {
            activeWin = await Promise.resolve().then(() => __importStar(require('active-win')));
        }
        catch (error) {
            console.warn('active-win을 사용할 수 없습니다:', error);
        }
    }
    return activeWin;
}
// Simple debug logging
function debugLog(message, ...args) {
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
const CHOSEONG_TABLE = {
    'ㄱ': 0, 'ㄲ': 1, 'ㄴ': 2, 'ㄷ': 3, 'ㄸ': 4, 'ㄹ': 5, 'ㅁ': 6, 'ㅂ': 7, 'ㅃ': 8,
    'ㅅ': 9, 'ㅆ': 10, 'ㅇ': 11, 'ㅈ': 12, 'ㅉ': 13, 'ㅊ': 14, 'ㅋ': 15, 'ㅌ': 16, 'ㅍ': 17, 'ㅎ': 18
};
const JUNGSEONG_TABLE = {
    'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅖ': 7, 'ㅗ': 8,
    'ㅘ': 9, 'ㅙ': 10, 'ㅚ': 11, 'ㅛ': 12, 'ㅜ': 13, 'ㅝ': 14, 'ㅞ': 15, 'ㅟ': 16,
    'ㅠ': 17, 'ㅡ': 18, 'ㅢ': 19, 'ㅣ': 20
};
const JONGSEONG_TABLE = {
    '': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3, 'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7, 'ㄹ': 8,
    'ㄺ': 9, 'ㄻ': 10, 'ㄼ': 11, 'ㄽ': 12, 'ㄾ': 13, 'ㄿ': 14, 'ㅀ': 15, 'ㅁ': 16,
    'ㅂ': 17, 'ㅄ': 18, 'ㅅ': 19, 'ㅆ': 20, 'ㅇ': 21, 'ㅈ': 22, 'ㅊ': 23, 'ㅋ': 24, 'ㅌ': 25, 'ㅍ': 26, 'ㅎ': 27
};
// Double consonants mapping
const DOUBLE_CONSONANTS = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};
// Global state
let mainWindow = null;
let keyboardInitialized = false;
let keyboardHandlersRegistered = false;
let isListening = false;
const permissionStatus = {
    screenRecording: null,
    accessibility: null
};
const composerState = {
    choBuffer: '',
    jungBuffer: '',
    jongBuffer: '',
    compositionState: 0,
    result: ''
};
const imeComposition = {
    isComposing: false,
    lastComposedText: '',
    compositionStart: 0,
    compositionBuffer: '',
    lastCompletedText: '',
    lastWindowInfo: null,
    totalTypingCount: 0
};
// Key event queue for processing
const keyEventQueue = [];
let keyEventProcessor = null;
/**
 * Compose Hangul syllable from jamo characters
 */
function composeHangul(cho, jung, jong = '') {
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
function decomposeHangul(syllable) {
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
function processJamo(char) {
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
            }
            else {
                const result = composerState.choBuffer;
                composerState.choBuffer = char;
                composerState.compositionState = char in CHOSEONG_TABLE ? 1 : 0;
                return { result, reset: false };
            }
        case 2: // Waiting for final consonant
            if (char in JONGSEONG_TABLE) {
                composerState.jongBuffer = char;
                return {
                    result: composeHangul(composerState.choBuffer, composerState.jungBuffer, composerState.jongBuffer),
                    reset: false
                };
            }
            else if (char in CHOSEONG_TABLE) {
                const result = composeHangul(composerState.choBuffer, composerState.jungBuffer, composerState.jongBuffer);
                composerState.choBuffer = char;
                composerState.jungBuffer = '';
                composerState.jongBuffer = '';
                composerState.compositionState = 1;
                return { result, reset: false };
            }
            else if (char in JUNGSEONG_TABLE) {
                const result = composeHangul(composerState.choBuffer, composerState.jungBuffer, composerState.jongBuffer);
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
function finishComposition() {
    const result = composeHangul(composerState.choBuffer, composerState.jungBuffer, composerState.jongBuffer);
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
function isSpecialKey(keyCode) {
    const specialKeys = [
        uiohook_napi_1.UiohookKey.Escape, uiohook_napi_1.UiohookKey.F1, uiohook_napi_1.UiohookKey.F2, uiohook_napi_1.UiohookKey.F3, uiohook_napi_1.UiohookKey.F4,
        uiohook_napi_1.UiohookKey.F5, uiohook_napi_1.UiohookKey.F6, uiohook_napi_1.UiohookKey.F7, uiohook_napi_1.UiohookKey.F8, uiohook_napi_1.UiohookKey.F9,
        uiohook_napi_1.UiohookKey.F10, uiohook_napi_1.UiohookKey.F11, uiohook_napi_1.UiohookKey.F12, uiohook_napi_1.UiohookKey.PrintScreen,
        uiohook_napi_1.UiohookKey.ScrollLock, uiohook_napi_1.UiohookKey.Insert, uiohook_napi_1.UiohookKey.Home,
        uiohook_napi_1.UiohookKey.PageUp, uiohook_napi_1.UiohookKey.Delete, uiohook_napi_1.UiohookKey.End, uiohook_napi_1.UiohookKey.PageDown,
        uiohook_napi_1.UiohookKey.ArrowRight, uiohook_napi_1.UiohookKey.ArrowLeft, uiohook_napi_1.UiohookKey.ArrowDown, uiohook_napi_1.UiohookKey.ArrowUp,
        uiohook_napi_1.UiohookKey.NumLock, uiohook_napi_1.UiohookKey.Ctrl, uiohook_napi_1.UiohookKey.Shift, uiohook_napi_1.UiohookKey.Alt,
        uiohook_napi_1.UiohookKey.Meta, uiohook_napi_1.UiohookKey.CtrlRight, uiohook_napi_1.UiohookKey.ShiftRight, uiohook_napi_1.UiohookKey.AltRight,
        uiohook_napi_1.UiohookKey.MetaRight, uiohook_napi_1.UiohookKey.CapsLock
    ];
    return specialKeys.includes(keyCode);
}
/**
 * Convert key code to string representation
 */
function getKeyString(keyCode) {
    const keyMap = {
        [uiohook_napi_1.UiohookKey.Space]: ' ',
        [uiohook_napi_1.UiohookKey.Enter]: 'Enter',
        [uiohook_napi_1.UiohookKey.Tab]: 'Tab',
        [uiohook_napi_1.UiohookKey.Backspace]: 'Backspace',
        // Number keys
        11: '0', 2: '1', 3: '2', 4: '3', 5: '4',
        6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
        // Alphabet keys
        [uiohook_napi_1.UiohookKey.A]: 'a', [uiohook_napi_1.UiohookKey.B]: 'b', [uiohook_napi_1.UiohookKey.C]: 'c', [uiohook_napi_1.UiohookKey.D]: 'd',
        [uiohook_napi_1.UiohookKey.E]: 'e', [uiohook_napi_1.UiohookKey.F]: 'f', [uiohook_napi_1.UiohookKey.G]: 'g', [uiohook_napi_1.UiohookKey.H]: 'h',
        [uiohook_napi_1.UiohookKey.I]: 'i', [uiohook_napi_1.UiohookKey.J]: 'j', [uiohook_napi_1.UiohookKey.K]: 'k', [uiohook_napi_1.UiohookKey.L]: 'l',
        [uiohook_napi_1.UiohookKey.M]: 'm', [uiohook_napi_1.UiohookKey.N]: 'n', [uiohook_napi_1.UiohookKey.O]: 'o', [uiohook_napi_1.UiohookKey.P]: 'p',
        [uiohook_napi_1.UiohookKey.Q]: 'q', [uiohook_napi_1.UiohookKey.R]: 'r', [uiohook_napi_1.UiohookKey.S]: 's', [uiohook_napi_1.UiohookKey.T]: 't',
        [uiohook_napi_1.UiohookKey.U]: 'u', [uiohook_napi_1.UiohookKey.V]: 'v', [uiohook_napi_1.UiohookKey.W]: 'w', [uiohook_napi_1.UiohookKey.X]: 'x',
        [uiohook_napi_1.UiohookKey.Y]: 'y', [uiohook_napi_1.UiohookKey.Z]: 'z'
    };
    return keyMap[keyCode] || `Key${keyCode}`;
}
/**
 * Process key event queue
 */
function processKeyEventQueue() {
    if (keyEventQueue.length === 0)
        return;
    try {
        while (keyEventQueue.length > 0) {
            const event = keyEventQueue.shift();
            if (event) {
                processKeyEvent(event);
            }
        }
    }
    catch (error) {
        console.error('Key event queue processing error:', error);
    }
}
/**
 * Process individual key event
 */
async function processKeyEvent(event) {
    try {
        // Skip special keys for typing analysis
        if (isSpecialKey(event.keycode))
            return;
        // Get active window information
        let windowInfo = null;
        if (activeWin) {
            try {
                windowInfo = await activeWin();
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Key event processing error:', error);
    }
}
/**
 * Update typing statistics
 */
function updateTypingStats(windowInfo, event) {
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
    }
    catch (error) {
        console.error('Typing stats update error:', error);
    }
}
/**
 * Setup keyboard event listeners
 */
function setupKeyboardEventListeners() {
    try {
        // Key down events
        uiohook_napi_1.uIOhook.on('keydown', (event) => {
            keyEventQueue.push(event);
        });
        // Key up events (for completion detection)
        uiohook_napi_1.uIOhook.on('keyup', (event) => {
            // Handle composition completion
            if (event.keycode === uiohook_napi_1.UiohookKey.Space || event.keycode === uiohook_napi_1.UiohookKey.Enter) {
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
    }
    catch (error) {
        console.error('Keyboard event listeners setup error:', error);
    }
}
/**
 * Register global shortcuts
 */
function registerGlobalShortcuts() {
    try {
        // Toggle window visibility
        const registered = electron_1.globalShortcut.register('CommandOrControl+Shift+L', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                }
                else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
        if (registered) {
            debugLog('Global shortcut registered: CommandOrControl+Shift+L');
        }
        else {
            console.warn('Failed to register global shortcut');
        }
        // Statistics reset shortcut
        electron_1.globalShortcut.register('CommandOrControl+Shift+R', () => {
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
    }
    catch (error) {
        console.error('Global shortcut registration error:', error);
    }
}
/**
 * Setup keyboard IPC handlers
 */
function setupKeyboardIpcHandlers() {
    // Get typing statistics
    electron_1.ipcMain.handle('get-typing-stats', async () => {
        return {
            totalTypingCount: imeComposition.totalTypingCount,
            compositionState: { ...composerState },
            imeState: { ...imeComposition },
            isListening
        };
    });
    // Reset typing statistics
    electron_1.ipcMain.handle('reset-typing-stats', async () => {
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
    electron_1.ipcMain.handle('get-keyboard-permissions', async () => {
        return { ...permissionStatus };
    });
    // Toggle keyboard monitoring
    electron_1.ipcMain.handle('toggle-keyboard-monitoring', async () => {
        if (isListening) {
            await stopKeyboardMonitoring();
        }
        else {
            await startKeyboardMonitoring();
        }
        return isListening;
    });
    // Get Hangul composition state
    electron_1.ipcMain.handle('get-hangul-composition-state', async () => {
        return { ...composerState };
    });
    debugLog('Keyboard IPC handlers registered');
}
/**
 * Start keyboard monitoring
 */
async function startKeyboardMonitoring() {
    try {
        if (isListening) {
            debugLog('Keyboard monitoring already active');
            return;
        }
        // Setup event listeners
        setupKeyboardEventListeners();
        // Start uIOhook
        uiohook_napi_1.uIOhook.start();
        isListening = true;
        debugLog('Keyboard monitoring started');
    }
    catch (error) {
        console.error('Failed to start keyboard monitoring:', error);
        throw error;
    }
}
/**
 * Stop keyboard monitoring
 */
async function stopKeyboardMonitoring() {
    try {
        if (!isListening)
            return;
        uiohook_napi_1.uIOhook.stop();
        isListening = false;
        debugLog('Keyboard monitoring stopped');
    }
    catch (error) {
        console.error('Failed to stop keyboard monitoring:', error);
    }
}
/**
 * Initialize advanced keyboard system
 */
async function initAdvancedKeyboard(window) {
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
    }
    catch (error) {
        console.error('Advanced keyboard initialization error:', error);
        throw error;
    }
}
/**
 * Cleanup keyboard resources
 */
async function cleanupAdvancedKeyboard() {
    try {
        debugLog('Cleaning up advanced keyboard system...');
        // Stop keyboard monitoring
        await stopKeyboardMonitoring();
        // Unregister global shortcuts
        electron_1.globalShortcut.unregisterAll();
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
    }
    catch (error) {
        console.error('Advanced keyboard cleanup error:', error);
    }
}
/**
 * Get keyboard system status
 */
function getKeyboardStatus() {
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
class KeyboardManager {
    constructor() {
        this.mainWindow = null;
    }
    static getInstance() {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    async initialize(window) {
        if (window) {
            this.mainWindow = window;
        }
        if (this.mainWindow) {
            await initAdvancedKeyboard(this.mainWindow);
        }
    }
    async start() {
        await startKeyboardMonitoring();
    }
    async stop() {
        await stopKeyboardMonitoring();
    }
    async cleanup() {
        await cleanupAdvancedKeyboard();
    }
    getStatus() {
        return getKeyboardStatus();
    }
    isInitialized() {
        return keyboardInitialized;
    }
    isListening() {
        return isListening;
    }
    async startListening(callback) {
        try {
            await startKeyboardMonitoring();
            return true;
        }
        catch (error) {
            console.error('Failed to start listening:', error);
            return false;
        }
    }
    async stopListening() {
        await stopKeyboardMonitoring();
    }
    // dispose 메서드 추가 (cleanup과 동일한 기능)
    async dispose() {
        await this.cleanup();
    }
}
exports.KeyboardManager = KeyboardManager;
//# sourceMappingURL=keyboard.js.map