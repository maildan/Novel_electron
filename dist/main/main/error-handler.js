"use strict";
/**
 * error-handler.ts
 *
 * 전역 오류 처리 기능 제공
 * 애플리케이션에서 발생하는 예외를 잡아 사용자에게 알리고 로깅합니다.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logErrorToFile = logErrorToFile;
exports.showErrorDialog = showErrorDialog;
exports.handleNativeModuleError = handleNativeModuleError;
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// 오류 로깅을 위한 디렉터리와 파일 설정
const errorLogDir = path.join(electron_1.app.getPath('userData'), 'logs');
const errorLogFile = path.join(errorLogDir, 'error.log');
// 오류 로그 디렉터리가 없으면 생성
function ensureErrorLogDir() {
    if (!fs.existsSync(errorLogDir)) {
        try {
            fs.mkdirSync(errorLogDir, { recursive: true });
        }
        catch (err) {
            console.error('오류 로그 디렉터리 생성 실패:', err);
        }
    }
}
/**
 * 오류를 로그 파일에 기록
 */
function logErrorToFile(error, context = 'unknown') {
    ensureErrorLogDir();
    const timestamp = new Date().toISOString();
    const errorMessage = error.stack || error.toString();
    const logEntry = `[${timestamp}] [${context}] ${errorMessage}\n\n`;
    try {
        fs.appendFileSync(errorLogFile, logEntry);
    }
    catch (err) {
        console.error('오류 로깅 실패:', err);
    }
}
/**
 * 사용자에게 오류 대화상자 표시
 */
function showErrorDialog(errorOrMessage, title = '오류 발생', context = '', fatal = false) {
    let error;
    let errorMessage;
    if (typeof errorOrMessage === 'string') {
        errorMessage = errorOrMessage;
        error = new Error(errorOrMessage);
    }
    else {
        error = errorOrMessage;
        errorMessage = error.message || error.toString();
    }
    let detailedMessage = `${context ? context + '\n\n' : ''}${errorMessage}`;
    if (error.stack) {
        detailedMessage += `\n\n기술 정보 (개발자용):\n${error.stack}`;
    }
    try {
        if (fatal && electron_1.app.isReady()) {
            electron_1.dialog.showErrorBox(title, detailedMessage);
            electron_1.app.exit(1);
        }
        else if (electron_1.app.isReady()) {
            const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
                electron_1.dialog.showMessageBox(focusedWindow, {
                    type: 'error',
                    title: title,
                    message: title,
                    detail: detailedMessage,
                    buttons: ['확인'],
                    defaultId: 0
                });
            }
            else {
                electron_1.dialog.showMessageBox({
                    type: 'error',
                    title: title,
                    message: title,
                    detail: detailedMessage,
                    buttons: ['확인'],
                    defaultId: 0
                });
            }
        }
    }
    catch (err) {
        console.error('오류 대화상자 표시 중 추가 오류 발생:', err);
        logErrorToFile(err, 'error-dialog-display');
    }
}
/**
 * 네이티브 모듈 로딩 오류 처리
 */
function handleNativeModuleError(moduleName, error, isCritical = false) {
    const errorMessage = `네이티브 모듈 '${moduleName}' 로드 실패: ${error.message || '알 수 없는 오류'}`;
    console.log(`[ERROR] ${errorMessage}`);
    logErrorToFile(error, `native-module:${moduleName}`);
    if (isCritical && electron_1.app.isReady()) {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            electron_1.dialog.showMessageBox(focusedWindow, {
                type: 'warning',
                title: '모듈 로드 실패',
                message: `네이티브 모듈 로드 실패: ${moduleName}`,
                detail: `${errorMessage}\n\n제한된 기능으로 계속 실행됩니다.`,
                buttons: ['확인'],
                defaultId: 0
            });
        }
        else {
            electron_1.dialog.showMessageBox({
                type: 'warning',
                title: '모듈 로드 실패',
                message: `네이티브 모듈 로드 실패: ${moduleName}`,
                detail: `${errorMessage}\n\n제한된 기능으로 계속 실행됩니다.`,
                buttons: ['확인'],
                defaultId: 0
            });
        }
    }
}
/**
 * 글로벌 예외 핸들러 설정
 */
function setupGlobalErrorHandlers() {
    // Node.js의 처리되지 않은 프라미스 거부 처리
    process.on('unhandledRejection', (reason, promise) => {
        console.log('[ERROR] 처리되지 않은 프라미스 거부:', reason);
        console.log('[ERROR] 거부된 프라미스 정보:', promise?.toString().substring(0, 100));
        logErrorToFile(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
    });
    // Node.js의 처리되지 않은 예외 처리
    process.on('uncaughtException', (error) => {
        console.log('[ERROR] 처리되지 않은 예외:', error);
        logErrorToFile(error, 'uncaughtException');
        if (electron_1.app.isReady()) {
            showErrorDialog(error, '예기치 않은 오류 발생', '애플리케이션에 문제가 발생했습니다. 앱을 다시 시작해 주세요.', false);
        }
    });
    // 렌더러 프로세스 충돌 처리 (child-process-gone 이벤트 사용)
    electron_1.app.on('child-process-gone', (event, details) => {
        const error = new Error(`자식 프로세스 종료: ${details.type}`);
        console.log('[ERROR] 자식 프로세스 종료:', details);
        console.log('[ERROR] 이벤트 타입:', typeof event, event.defaultPrevented ? '기본값 방지됨' : '기본값 허용');
        logErrorToFile(error, 'child-process-gone');
        if (electron_1.app.isReady()) {
            // Note: details.type can be 'Utility', 'Zygote', 'Sandbox helper', 'GPU', 'Pepper Plugin', 'Pepper Plugin Broker', 'Unknown'
            showErrorDialog(error, '애플리케이션 오류', `자식 프로세스(${details.type})가 종료되었습니다. 앱을 다시 시작해 주세요.`, false);
        }
    });
}
// 즉시 글로벌 에러 핸들러 설정
setupGlobalErrorHandlers();
//# sourceMappingURL=error-handler.js.map