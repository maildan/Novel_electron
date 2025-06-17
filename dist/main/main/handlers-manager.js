"use strict";
/**
 * Loop 6 IPC 핸들러 통합 관리자
 *
 * 모든 IPC 핸들러를 관리하고 초기화하는 중앙 관리자입니다.
 * Loop 3의 handlers/index.js를 완전히 마이그레이션하고 확장했습니다.
 */
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
const settings_manager_1 = __importStar(require("./settings-manager"));
const ipc_handlers_1 = require("./ipc-handlers");
const memory_ipc_1 = require("./memory-ipc");
const native_client_1 = require("./native-client");
const systemInfoIpc_1 = require("./systemInfoIpc");
const settingsIpcHandlers_1 = __importDefault(require("./settingsIpcHandlers"));
const electron_1 = require("electron");
const system_monitor_ipc_1 = require("./system-monitor-ipc");
// 간단한 디버그 로깅
function debugLog(message, ...args) {
    console.log(`[HandlersManager] ${message}`, ...args);
}
function errorLog(message, ...args) {
    console.error(`[HandlersManager] ${message}`, ...args);
}
// 전역 핸들러 상태 - 더 안전한 초기화
const handlersState = {
    isAllHandlersSetup: false,
    registeredHandlers: new Set(),
    initializationOrder: []
};
// 핸들러 상태 초기화 함수
function initializeHandlersState() {
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
function registerSettingsHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('settings')) {
            debugLog('Setup 관련 핸들러 이미 등록됨');
            return;
        }
        // 설정 IPC 핸들러 등록 (setProcessingMode 등)
        settingsIpcHandlers_1.default.register();
        // 설정 관리자 초기화 및 IPC 핸들러 등록
        (0, settings_manager_1.initializeSettingsManager)();
        // SettingsManager 인스턴스 확인
        const settingsManager = settings_manager_1.default;
        debugLog('SettingsManager 로드됨:', typeof settingsManager);
        debugLog('Setup 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('settings');
    }
    catch (error) {
        errorLog('Setup 핸들러 등록 Error:', error);
    }
}
/**
 * 시스템 정보 관련 핸들러 등록
 */
function registerSystemInfoHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('system-info')) {
            debugLog('시스템 정보 관련 핸들러 이미 등록됨');
            return;
        }
        // SystemInfo IPC 핸들러 등록
        (0, systemInfoIpc_1.registerSystemInfoIpcHandlers)();
        debugLog('시스템 정보 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('system-info');
    }
    catch (error) {
        errorLog('시스템 정보 핸들러 등록 Error:', error);
        // 오류가 발생해도 다른 핸들러 등록은 계속 진행
    }
}
/**
 * 메모리 관련 핸들러 등록
 */
function registerMemoryHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('memory')) {
            debugLog('메모리 관련 핸들러 이미 등록됨');
            return;
        }
        // memory-ipc.ts에서 메모리 IPC 핸들러 등록
        (0, memory_ipc_1.registerMemoryIpcHandlers)();
        debugLog('메모리 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('memory');
    }
    catch (error) {
        errorLog('메모리 핸들러 등록 Error:', error);
        // 오류가 발생해도 다른 핸들러 등록은 계속 진행
    }
}
/**
 * 네이티브 모듈 관련 핸들러 등록
 */
function registerNativeHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('native')) {
            debugLog('네이티브 모듈 관련 핸들러 이미 등록됨');
            return;
        }
        (0, native_client_1.registerNativeIpcHandlers)();
        debugLog('네이티브 모듈 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('native');
    }
    catch (error) {
        errorLog('네이티브 핸들러 등록 Error:', error);
    }
}
/**
 * 통합 IPC 핸들러 등록
 */
function registerIntegratedHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('integrated')) {
            debugLog('통합 IPC 핸들러 이미 등록됨');
            return;
        }
        const ipcHandlers = ipc_handlers_1.IpcHandlers.getInstance();
        ipcHandlers.register();
        debugLog('통합 IPC 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('integrated');
    }
    catch (error) {
        errorLog('통합 IPC 핸들러 등록 Error:', error);
    }
}
/**
 * 재시작 관련 핸들러 등록
 */
function registerRestartHandlers() {
    try {
        // 재시작 핸들러는 app-lifecycle.ts에서 처리
        debugLog('재시작 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('restart');
    }
    catch (error) {
        errorLog('재시작 핸들러 등록 Error:', error);
    }
}
/**
 * 시스템 모니터링 관련 핸들러 등록
 */
function registerSystemMonitorHandlers() {
    try {
        // 중복 등록 방지
        if (handlersState.registeredHandlers.has('system-monitor')) {
            debugLog('시스템 모니터링 관련 핸들러 이미 등록됨');
            return;
        }
        // SystemMonitor IPC 핸들러 등록
        (0, system_monitor_ipc_1.registerSystemMonitorIpcHandlers)();
        debugLog('시스템 모니터링 관련 핸들러 등록 Completed');
        handlersState.registeredHandlers.add('system-monitor');
    }
    catch (error) {
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
async function setupAllHandlers() {
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
            'settings', // Setup 먼저
            'integrated', // 통합 IPC 핸들러 (네이티브 모듈 포함)
            'system-info', // 시스템 정보
            'system-monitor', // 시스템 모니터링 (start-monitoring 핸들러 포함)
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
        registerSystemMonitorHandlers(); // 시스템 모니터링 핸들러 등록 (start-monitoring 포함)
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
                'start-monitoring', 'get-current-metrics', 'get-metrics-history',
                'tracking:start-monitoring', 'tracking:stop-monitoring', 'tracking:get-status',
                'start-keyboard-listener', 'stop-keyboard-listener', 'get-keyboard-status',
                'memory:getInfo', 'systemGetInfo'
            ];
            debugLog('주요 핸들러 등록 상태 확인:');
            criticalHandlers.forEach(handler => {
                const listenerCount = electron_1.ipcMain.listenerCount(handler);
                debugLog(`  - ${handler}: ${listenerCount > 0 ? '등록됨' : '등록되지 않음'} (리스너 수: ${listenerCount})`);
            });
        }
        catch (checkError) {
            debugLog('핸들러 등록 상태 확인 중 오류:', checkError);
        }
        return true;
    }
    catch (error) {
        errorLog('핸들러 Setup 중 Error 발생:', error);
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
    }
    catch (error) {
        errorLog(`핸들러 재등록 Error (${handlerName}):`, error);
        return false;
    }
}
/**
 * 모든 핸들러 Cleanup
 */
function cleanupAllHandlers() {
    try {
        debugLog('모든 핸들러 Cleanup 시작...');
        // 역순으로 Cleanup
        (0, tracking_handlers_1.cleanupTrackingHandlers)();
        (0, keyboardHandlers_1.cleanupKeyboardHandlers)();
        (0, windowHandlers_1.cleanupWindowHandlers)();
        // 상태 초기화
        handlersState.isAllHandlersSetup = false;
        handlersState.registeredHandlers.clear();
        handlersState.initializationOrder = [];
        debugLog('모든 핸들러 Cleanup Completed');
    }
    catch (error) {
        errorLog('핸들러 Cleanup 중 Error:', error);
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
    handlersState.isAllHandlersSetup = false;
    handlersState.registeredHandlers.clear();
    handlersState.initializationOrder = [];
    debugLog('핸들러 상태 리셋 Completed');
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