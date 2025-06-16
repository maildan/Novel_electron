"use strict";
/**
 * Loop 6 키보드 이벤트 처리 IPC 핸들러
 *
 * Loop 3의 keyboard-handlers.js를 TypeScript로 완전 마이그레이션
 * Setup keyboard event listeners/관리, 한글 입력 처리, IME 지원 등을 담당합니다.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJamoCount = getJamoCount;
exports.decomposeHangul = decomposeHangul;
exports.setupKeyboardListenerIfNeeded = setupKeyboardListenerIfNeeded;
exports.cleanupKeyboardListener = cleanupKeyboardListener;
exports.getKeyboardStatus = getKeyboardStatus;
exports.registerKeyboardHandlers = registerKeyboardHandlers;
exports.initializeKeyboardHandlers = initializeKeyboardHandlers;
exports.cleanupKeyboardHandlers = cleanupKeyboardHandlers;
const electron_1 = require("electron");
const utils_1 = require("./utils");
const keyboard_1 = require("./keyboard");
const settings_manager_1 = __importDefault(require("./settings-manager"));
const tracking_handlers_1 = require("./tracking-handlers");
// 한글 자모 맵핑
const HANGUL_JAMO = {
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
let keyboardState = {
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
function getJamoCount(char) {
    if (!char || char.length === 0)
        return 0;
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
        if (charCode < baseCode)
            return 1;
        // 종성 존재 여부 확인
        const hasJongseong = (charCode - baseCode) % 28 !== 0;
        // 초성 + 중성 + (종성 있으면 추가)
        return hasJongseong ? 3 : 2;
    }
    catch (error) {
        (0, utils_1.errorLog)('자모 개수 계산 Error:', error);
        return 1; // Error 시 기본값
    }
}
/**
 * 한글 문자를 자모로 분해
 */
function decomposeHangul(char) {
    if (!char || char.length === 0)
        return [];
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
    }
    catch (error) {
        (0, utils_1.errorLog)('한글 분해 Error:', error);
        return [char];
    }
}
/**
 * 키보드 이벤트 처리
 */
function handleKeyboardEvent(eventData) {
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
        (0, tracking_handlers_1.processKeyPress)(extendedKeyData);
        // 렌더러에 키 이벤트 전송
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (mainWindow) {
            mainWindow.webContents.send('keyboard-event', extendedKeyData);
        }
    }
    catch (error) {
        (0, utils_1.errorLog)('키보드 이벤트 처리 Error:', error);
    }
}
/**
 * 키보드 리스너 Setup
 */
async function setupKeyboardListenerIfNeeded() {
    try {
        if (keyboardState.isListening && keyboardState.keyboardManager) {
            (0, utils_1.debugLog)('키보드 리스너가 이미 활성화되어 있습니다');
            return true;
        }
        if (!keyboardState.keyboardManager) {
            keyboardState.keyboardManager = new keyboard_1.KeyboardManager();
        }
        // Setup keyboard event listeners
        const success = await keyboardState.keyboardManager.startListening(handleKeyboardEvent);
        if (success) {
            keyboardState.isListening = true;
            (0, utils_1.debugLog)('키보드 리스너 Setup Success');
            return true;
        }
        else {
            (0, utils_1.debugLog)('키보드 리스너 Setup Failed');
            return false;
        }
    }
    catch (error) {
        (0, utils_1.errorLog)('키보드 리스너 Setup Error:', error);
        return false;
    }
}
/**
 * 키보드 리스너 Cleanup
 */
function cleanupKeyboardListener() {
    try {
        if (keyboardState.keyboardManager && keyboardState.isListening) {
            keyboardState.keyboardManager.stopListening();
            keyboardState.isListening = false;
            (0, utils_1.debugLog)('키보드 리스너 Cleanup Completed');
            return true;
        }
        return false;
    }
    catch (error) {
        (0, utils_1.errorLog)('키보드 리스너 Cleanup 중 Error:', error);
        return false;
    }
}
/**
 * 한글 입력 테스트
 */
async function testHangulInput() {
    try {
        const testChars = ['가', '나', '다', '라', '마', '한', '글', '테', '스', '트'];
        const results = testChars.map(char => ({
            char,
            jamoCount: getJamoCount(char),
            decomposed: decomposeHangul(char)
        }));
        (0, utils_1.debugLog)('한글 입력 테스트 결과:', results);
        return {
            success: true,
            result: {
                testChars: results,
                listenerActive: keyboardState.isListening,
                managerAvailable: !!keyboardState.keyboardManager
            }
        };
    }
    catch (error) {
        (0, utils_1.errorLog)('한글 입력 테스트 Error:', error);
        return {
            success: false,
            result: { error: error.message }
        };
    }
}
/**
 * 키보드 상태 정보 가져오기
 */
function getKeyboardStatus() {
    return {
        isListening: keyboardState.isListening,
        managerAvailable: !!keyboardState.keyboardManager,
        lastKeyTime: keyboardState.lastKeyTime,
        recentKeys: keyboardState.keySequence.slice(-5),
        settings: settings_manager_1.default.getSettings().keyboard || {}
    };
}
/**
 * IPC 핸들러 등록
 */
function registerKeyboardHandlers() {
    if (keyboardState.isRegistered) {
        (0, utils_1.debugLog)('키보드 관련 IPC 핸들러가 이미 등록되어 있습니다');
        return;
    }
    (0, utils_1.debugLog)('키보드 관련 IPC 핸들러 등록 중...');
    // 키보드 리스너 시작 핸들러
    electron_1.ipcMain.handle('start-keyboard-listener', async () => {
        try {
            const success = await setupKeyboardListenerIfNeeded();
            return {
                success,
                message: success ? '키보드 리스너 Started' : '키보드 리스너 시작 Failed',
                status: getKeyboardStatus()
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('키보드 리스너 시작 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 키보드 리스너 중지 핸들러
    electron_1.ipcMain.handle('stop-keyboard-listener', async () => {
        try {
            const success = cleanupKeyboardListener();
            return {
                success,
                message: success ? '키보드 리스너 Stopped' : '키보드 리스너 중지 Failed',
                status: getKeyboardStatus()
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('키보드 리스너 중지 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 키보드 상태 조회 핸들러
    electron_1.ipcMain.handle('get-keyboard-status', async () => {
        try {
            return {
                success: true,
                status: getKeyboardStatus()
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('키보드 상태 조회 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 한글 입력 테스트 핸들러
    electron_1.ipcMain.handle('test-hangul-input', async () => {
        try {
            return await testHangulInput();
        }
        catch (error) {
            (0, utils_1.errorLog)('한글 입력 테스트 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 자모 개수 계산 핸들러
    electron_1.ipcMain.handle('get-jamo-count', async (event, char) => {
        console.log('[자모 개수 계산] IPC 이벤트:', typeof event, '문자:', char);
        try {
            const count = getJamoCount(char);
            return {
                success: true,
                char,
                jamoCount: count,
                decomposed: decomposeHangul(char)
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('자모 개수 계산 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 키 시퀀스 조회 핸들러
    electron_1.ipcMain.handle('get-key-sequence', async () => {
        try {
            return {
                success: true,
                sequence: [...keyboardState.keySequence],
                lastKeyTime: keyboardState.lastKeyTime
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('키 시퀀스 조회 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 키보드 Setup 업데이트 핸들러
    electron_1.ipcMain.handle('update-keyboard-settings', async (event, settings) => {
        console.log('[키보드 설정 업데이트] IPC 이벤트:', typeof event, '설정:', settings);
        try {
            const currentSettings = settings_manager_1.default.getSettings();
            await settings_manager_1.default.updateMultipleSettings({
                ...currentSettings,
                keyboard: { ...currentSettings.keyboard, ...settings }
            });
            return {
                success: true,
                message: '키보드 Setup 업데이트 Completed',
                settings: settings_manager_1.default.getSettings().keyboard
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('키보드 Setup 업데이트 Error:', error);
            return { success: false, message: error.message };
        }
    });
    keyboardState.isRegistered = true;
    (0, utils_1.debugLog)('키보드 관련 IPC 핸들러 등록 Completed');
}
/**
 * 키보드 핸들러 초기화
 */
async function initializeKeyboardHandlers() {
    try {
        // Setup에서 자동 시작 여부 확인
        const settings = settings_manager_1.default.getSettings();
        if (settings.keyboard?.autoStart !== false) {
            await setupKeyboardListenerIfNeeded();
        }
        (0, utils_1.debugLog)('키보드 핸들러 초기화 Completed');
    }
    catch (error) {
        (0, utils_1.errorLog)('키보드 핸들러 초기화 Error:', error);
    }
}
/**
 * 키보드 핸들러 Cleanup
 */
function cleanupKeyboardHandlers() {
    cleanupKeyboardListener();
    if (keyboardState.keyboardManager) {
        keyboardState.keyboardManager = null;
    }
    keyboardState.isRegistered = false;
    keyboardState.keySequence = [];
    (0, utils_1.debugLog)('키보드 핸들러 Cleanup Completed');
}
// 기본 내보내기
exports.default = {
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
//# sourceMappingURL=keyboardHandlers.js.map