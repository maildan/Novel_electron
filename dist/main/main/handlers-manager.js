"use strict";
/**
 * Loop 6 IPC 핸들러 통합 관리자
 *
 * 모든 IPC 핸들러를 관리하고 초기화하는 중앙 관리자입니다.
 * Loop 3의 handlers/index.js를 완전히 마이그레이션하고 확장했습니다.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWindowHandlers = exports.registerKeyboardHandlers = exports.registerTrackingHandlers = void 0;
exports.setupAllHandlers = setupAllHandlers;
exports.isHandlerRegistered = isHandlerRegistered;
exports.getRegisteredHandlers = getRegisteredHandlers;
exports.getInitializationOrder = getInitializationOrder;
exports.reregisterHandler = reregisterHandler;
exports.cleanupAllHandlers = cleanupAllHandlers;
exports.diagnoseHandlers = diagnoseHandlers;
exports.resetHandlersState = resetHandlersState;
const tracking_handlers_1 = require("./tracking-handlers");
Object.defineProperty(exports, "registerTrackingHandlers", { enumerable: true, get: function () { return tracking_handlers_1.registerTrackingHandlers; } });
const keyboardHandlers_1 = require("./keyboardHandlers");
Object.defineProperty(exports, "registerKeyboardHandlers", { enumerable: true, get: function () { return keyboardHandlers_1.registerKeyboardHandlers; } });
const windowHandlers_1 = require("./windowHandlers");
Object.defineProperty(exports, "registerWindowHandlers", { enumerable: true, get: function () { return windowHandlers_1.registerWindowHandlers; } });
const ipc_handlers_1 = require("./ipc-handlers");
const memory_ipc_1 = require("./memory-ipc");
const native_client_1 = require("./native-client");
const systemInfoIpc_1 = require("./systemInfoIpc");
const settingsIpcHandlers_1 = __importDefault(require("./settingsIpcHandlers"));
// Simple debug logging
function debugLog(message, ...args) {
    console.log(`[HandlersManager] ${message}`, ...args);
}
function errorLog(message, ...args) {
    console.error(`[HandlersManager] ${message}`, ...args);
}
// 전역 핸들러 상태
let handlersState = {
    isAllHandlersSetup: false,
    registeredHandlers: new Set(),
    initializationOrder: []
};
/**
 * 설정 관련 핸들러 등록
 */
function registerSettingsHandlers() {
    try {
        // 새로운 설정 IPC 핸들러 등록
        settingsIpcHandlers_1.default.register();
        debugLog('설정 관련 핸들러 등록 완료');
        handlersState.registeredHandlers.add('settings');
    }
    catch (error) {
        errorLog('설정 핸들러 등록 오류:', error);
    }
}
/**
 * 시스템 정보 관련 핸들러 등록
 */
function registerSystemInfoHandlers() {
    try {
        // 시스템 정보 핸들러를 실제로 등록
        (0, systemInfoIpc_1.registerSystemInfoIpcHandlers)();
        debugLog('시스템 정보 관련 핸들러 등록 완료');
        handlersState.registeredHandlers.add('system-info');
    }
    catch (error) {
        errorLog('시스템 정보 핸들러 등록 오류:', error);
    }
}
/**
 * 메모리 관련 핸들러 등록
 */
function registerMemoryHandlers() {
    try {
        // 메모리 핸들러를 실제로 등록
        (0, memory_ipc_1.registerMemoryIpcHandlers)();
        debugLog('메모리 관련 핸들러 등록 완료');
        handlersState.registeredHandlers.add('memory');
    }
    catch (error) {
        errorLog('메모리 핸들러 등록 오류:', error);
    }
}
/**
 * 네이티브 모듈 관련 핸들러 등록
 */
function registerNativeHandlers() {
    try {
        // 네이티브 핸들러를 실제로 등록
        (0, native_client_1.registerNativeIpcHandlers)();
        debugLog('네이티브 모듈 관련 핸들러 등록 완료');
        handlersState.registeredHandlers.add('native');
    }
    catch (error) {
        errorLog('네이티브 핸들러 등록 오류:', error);
    }
}
/**
 * 통합 IPC 핸들러 등록
 */
function registerIntegratedHandlers() {
    try {
        const ipcHandlers = ipc_handlers_1.IpcHandlers.getInstance();
        ipcHandlers.register();
        debugLog('통합 IPC 핸들러 등록 완료');
        handlersState.registeredHandlers.add('integrated');
    }
    catch (error) {
        errorLog('통합 IPC 핸들러 등록 오류:', error);
    }
}
/**
 * 재시작 관련 핸들러 등록
 */
function registerRestartHandlers() {
    try {
        // 재시작 핸들러는 app-lifecycle.ts에서 처리
        debugLog('재시작 관련 핸들러 등록 완료');
        handlersState.registeredHandlers.add('restart');
    }
    catch (error) {
        errorLog('재시작 핸들러 등록 오류:', error);
    }
}
/**
 * 모든 IPC 핸들러를 순서대로 등록
 */
async function setupAllHandlers() {
    // 이미 설정되었으면 중복 설정 방지
    if (handlersState.isAllHandlersSetup) {
        debugLog('모든 핸들러가 이미 설정되어 있습니다.');
        return true;
    }
    try {
        debugLog('모든 IPC 핸들러 등록 시작...');
        // 초기화 순서 정의 (의존성 순서)
        const initOrder = [
            'settings', // 설정 먼저
            'integrated', // 통합 IPC 핸들러 (네이티브 모듈 포함)
            'system-info', // 시스템 정보
            'native', // 네이티브 모듈
            'window', // 윈도우 관리
            'memory', // 메모리 관리
            'keyboard', // 키보드 이벤트
            'tracking', // 추적/모니터링
            'restart' // 재시작 관련
        ];
        handlersState.initializationOrder = initOrder;
        // 각 핸들러 등록
        registerSettingsHandlers();
        registerIntegratedHandlers();
        registerSystemInfoHandlers();
        registerNativeHandlers();
        (0, windowHandlers_1.registerWindowHandlers)();
        registerMemoryHandlers();
        (0, keyboardHandlers_1.registerKeyboardHandlers)();
        (0, tracking_handlers_1.registerTrackingHandlers)();
        registerRestartHandlers();
        // 핸들러 초기화
        (0, windowHandlers_1.initializeWindowHandlers)();
        await (0, keyboardHandlers_1.initializeKeyboardHandlers)();
        (0, tracking_handlers_1.initializeAutoMonitoring)();
        // 핸들러 설정 완료
        handlersState.isAllHandlersSetup = true;
        debugLog(`모든 IPC 핸들러 등록 완료. 등록된 핸들러: ${Array.from(handlersState.registeredHandlers).join(', ')}`);
        return true;
    }
    catch (error) {
        errorLog('핸들러 설정 중 오류 발생:', error);
        return false;
    }
}
/**
 * 핸들러 등록 상태 확인
 */
function isHandlerRegistered(handlerName) {
    return handlersState.registeredHandlers.has(handlerName);
}
/**
 * 등록된 모든 핸들러 목록 가져오기
 */
function getRegisteredHandlers() {
    return Array.from(handlersState.registeredHandlers);
}
/**
 * 핸들러 초기화 순서 가져오기
 */
function getInitializationOrder() {
    return [...handlersState.initializationOrder];
}
/**
 * 특정 핸들러 재등록
 */
function reregisterHandler(handlerName) {
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
                (0, windowHandlers_1.registerWindowHandlers)();
                break;
            case 'memory':
                registerMemoryHandlers();
                break;
            case 'keyboard':
                (0, keyboardHandlers_1.registerKeyboardHandlers)();
                break;
            case 'tracking':
                (0, tracking_handlers_1.registerTrackingHandlers)();
                break;
            case 'restart':
                registerRestartHandlers();
                break;
            default:
                errorLog(`알 수 없는 핸들러: ${handlerName}`);
                return false;
        }
        return true;
    }
    catch (error) {
        errorLog(`핸들러 재등록 오류 (${handlerName}):`, error);
        return false;
    }
}
/**
 * 모든 핸들러 정리
 */
function cleanupAllHandlers() {
    try {
        debugLog('모든 핸들러 정리 시작...');
        // 역순으로 정리
        (0, tracking_handlers_1.cleanupTrackingHandlers)();
        (0, keyboardHandlers_1.cleanupKeyboardHandlers)();
        (0, windowHandlers_1.cleanupWindowHandlers)();
        // 상태 초기화
        handlersState.isAllHandlersSetup = false;
        handlersState.registeredHandlers.clear();
        handlersState.initializationOrder = [];
        debugLog('모든 핸들러 정리 완료');
    }
    catch (error) {
        errorLog('핸들러 정리 중 오류:', error);
    }
}
/**
 * 핸들러 상태 진단
 */
function diagnoseHandlers() {
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
function resetHandlersState() {
    handlersState = {
        isAllHandlersSetup: false,
        registeredHandlers: new Set(),
        initializationOrder: []
    };
    debugLog('핸들러 상태 리셋 완료');
}
// 기본 내보내기
exports.default = {
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
        register: tracking_handlers_1.registerTrackingHandlers,
        cleanup: tracking_handlers_1.cleanupTrackingHandlers
    },
    keyboard: {
        register: keyboardHandlers_1.registerKeyboardHandlers,
        cleanup: keyboardHandlers_1.cleanupKeyboardHandlers
    },
    window: {
        register: windowHandlers_1.registerWindowHandlers,
        cleanup: windowHandlers_1.cleanupWindowHandlers
    }
};
//# sourceMappingURL=handlers-manager.js.map