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
 * 고급 키보드 모니터링 및 입력 처리 모듈
 * 전역 단축키, IME 조합, 한글 처리, 타이핑 분석을 담당합니다
 */
const electron_1 = require("electron");
const uiohook_napi_1 = require("uiohook-napi");
// app, shell 모듈 사용 함수 (한국어 디버깅)
function checkElectronModules() {
    const moduleInfo = {
        앱준비상태: electron_1.app.isReady(),
        앱버전: electron_1.app.getVersion(),
        shell사용가능: typeof electron_1.shell.openExternal === 'function'
    };
    console.log('[키보드 모듈] Electron 앱 상태 확인:', moduleInfo);
    return moduleInfo; // 함수 반환값 추가하여 실제 사용
}
// active-win 동적 가져오기
let activeWin = null;
async function loadActiveWin() {
    if (!activeWin) {
        try {
            activeWin = await Promise.resolve().then(() => __importStar(require('active-win')));
            console.log('[active-win] 모듈 로드 성공:', typeof activeWin);
        }
        catch (error) {
            console.warn('[active-win] 모듈 로드 실패:', error);
        }
    }
    return activeWin;
}
// 간단한 디버그 로깅
function debugLog(message, ...args) {
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
const currentPlatformConfig = PLATFORM_KEY_CONFIGS[process.platform] || PLATFORM_KEY_CONFIGS.win32;
console.log('[키보드 초기화] 현재 플랫폼 키 설정:', currentPlatformConfig);
// 한글 조합 테이블
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
// 쌍자음 매핑
const DOUBLE_CONSONANTS = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};
console.log('[키보드 초기화] 쌍자음 매핑 테이블 로드:', Object.keys(DOUBLE_CONSONANTS).length, '개');
// 전역 상태
let mainWindow = null;
let keyboardInitialized = false;
let keyboardHandlersRegistered = false;
let isListening = false;
// 핸들러 등록 상태 확인 함수
function checkHandlerRegistration() {
    console.log('[키보드 상태] 핸들러 등록:', keyboardHandlersRegistered, '초기화:', keyboardInitialized, '리스닝:', isListening);
    return keyboardHandlersRegistered;
}
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
// 키 이벤트 처리 큐
const keyEventQueue = [];
let keyEventProcessor = null;
/**
 * 자모에서 한글 음절 조합
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
function decomposeHangul(syllable) {
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
function processJamo(char) {
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
            }
            else {
                const result = composerState.choBuffer;
                composerState.choBuffer = char;
                composerState.compositionState = char in CHOSEONG_TABLE ? 1 : 0;
                return { result, reset: false };
            }
        case 2: // 종성 대기
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
function finishComposition() {
    const result = composeHangul(composerState.choBuffer, composerState.jungBuffer, composerState.jongBuffer);
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
 * 키 코드를 문자열 표현으로 변환
 */
function getKeyString(keyCode) {
    const keyMap = {
        [uiohook_napi_1.UiohookKey.Space]: ' ',
        [uiohook_napi_1.UiohookKey.Enter]: 'Enter',
        [uiohook_napi_1.UiohookKey.Tab]: 'Tab',
        [uiohook_napi_1.UiohookKey.Backspace]: 'Backspace',
        // 숫자 키
        11: '0', 2: '1', 3: '2', 4: '3', 5: '4',
        6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
        // 알파벳 키
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
        // 타이핑 분석에서 특수 키 제외
        if (isSpecialKey(event.keycode))
            return;
        // 활성 창 정보 가져오기
        let windowInfo = null;
        if (activeWin) {
            try {
                windowInfo = await activeWin();
            }
            catch (error) {
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
        // 키 다운 이벤트
        uiohook_napi_1.uIOhook.on('keydown', (event) => {
            keyEventQueue.push(event);
        });
        // 키 업 이벤트 (조합 Completed 감지용)
        uiohook_napi_1.uIOhook.on('keyup', (event) => {
            // 조합 Completed 처리
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
        // 창 가시성 토글
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
            debugLog('Register global shortcuts: CommandOrControl+Shift+L');
        }
        else {
            console.warn('Failed to register global shortcut');
        }
        // 통계 리셋 단축키
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
    // 타이핑 통계 가져오기
    electron_1.ipcMain.handle('getTypingStats', async () => {
        return {
            totalTypingCount: imeComposition.totalTypingCount,
            compositionState: { ...composerState },
            imeState: { ...imeComposition },
            isListening
        };
    });
    // 타이핑 통계 리셋
    electron_1.ipcMain.handle('resetTypingStats', async () => {
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
    electron_1.ipcMain.handle('getKeyboardPermissions', async () => {
        return { ...permissionStatus };
    });
    // 시스템 권한 Setup 열기
    electron_1.ipcMain.handle('openPermissionsSettings', async () => {
        try {
            const { shell } = require('electron');
            if (process.platform === 'darwin') {
                // macOS - 보안 및 개인정보 환경설정 열기
                await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
                return { success: true, message: '시스템 환경Setup이 열렸습니다' };
            }
            else if (process.platform === 'win32') {
                // Windows - 개인정보 설정 열기
                await shell.openExternal('ms-settings:privacy-general');
                return { success: true, message: '개인정보 Setup이 열렸습니다' };
            }
            else {
                // Linux - 시스템 설정 열기 (배포판별 상이함)
                await shell.openExternal('gnome-control-center');
                return { success: true, message: '시스템 Setup이 열렸습니다' };
            }
        }
        catch (error) {
            console.error('권한 Setup 열기 Failed:', error);
            return { success: false, message: '시스템 Setup 열기에 Failed했습니다' };
        }
    });
    // 키보드 모니터링 토글
    electron_1.ipcMain.handle('toggleKeyboardMonitoring', async () => {
        if (isListening) {
            await stopKeyboardMonitoring();
        }
        else {
            await startKeyboardMonitoring();
        }
        return isListening;
    });
    // 한글 조합 상태 가져오기
    electron_1.ipcMain.handle('getHangulCompositionState', async () => {
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
        // 이벤트 리스너 Setup
        setupKeyboardEventListeners();
        // uIOhook 시작
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
        // 키보드 모니터링 중지
        await stopKeyboardMonitoring();
        // 전역 단축키 해제
        electron_1.globalShortcut.unregisterAll();
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
        console.log('[키보드 리스닝] 시작 요청, 콜백 함수:', typeof callback);
        try {
            if (callback) {
                console.log('[키보드 리스닝] 콜백 함수가 제공됨, 등록 시도');
                // 콜백이 제공된 경우 이벤트 리스너 등록
            }
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