"use strict";
/**
 * 앱 충돌 보고 및 로깅 모듈
 *
 * 앱의 예상치 못한 종료, 오류, 충돌을 감지하고 보고하는 시스템입니다.
 * 오류 로깅, 충돌 보고서 수집, 복구 메커니즘을 제공합니다.
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
exports.initializeCrashReporter = initializeCrashReporter;
exports.getCrashReportInfo = getCrashReportInfo;
exports.setUploadCrashReports = setUploadCrashReports;
exports.getLogPaths = getLogPaths;
exports.reportError = reportError;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// 상수
const CRASH_REPORTS_DIR = path.join(electron_1.app.getPath('userData'), 'crash-reports');
const ERROR_LOG_FILE = path.join(electron_1.app.getPath('userData'), 'logs', 'error.log');
const CRASH_LOG_FILE = path.join(electron_1.app.getPath('userData'), 'logs', 'crash.log');
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_UNCAUGHT_EXCEPTIONS = 5;
const MAX_ERROR_HISTORY = 100;
// 내부 상태
let isInitialized = false;
let errorLogStream = null;
let crashLogStream = null;
let uncaughtExceptions = [];
let crashHistory = [];
let crashStats = {
    totalCrashes: 0,
    uncaughtExceptions: 0,
    rendererCrashes: 0,
    gpuCrashes: 0,
    lastCrashTime: null,
    uptimeAtLastCrash: null,
    averageUptime: 0,
    recoveryAttempts: 0
};
let startTime = Date.now();
let options = {};
/**
 * 충돌 보고 시스템 초기화
 */
function initializeCrashReporter(crashOptions = {}) {
    try {
        if (isInitialized) {
            console.warn('충돌 보고 시스템이 이미 초기화되었습니다.');
            return true;
        }
        options = {
            companyName: 'Loop',
            submitURL: '',
            uploadToServer: process.env.NODE_ENV === 'production',
            enableDetailedReports: true,
            maxLogFileSize: MAX_LOG_FILE_SIZE,
            ...crashOptions
        };
        // 디렉토리 생성
        createLogDirectories();
        // 로그 스트림 초기화
        initializeLogStreams();
        // 충돌 보고자 설정
        setupCrashReporter();
        // 예외 처리기 설정
        setupExceptionHandlers();
        // IPC 핸들러 설정
        setupCrashReporterIpcHandlers();
        // 시작 로그
        logSystemStart();
        isInitialized = true;
        console.log('충돌 보고 시스템이 초기화되었습니다.');
        return true;
    }
    catch (error) {
        console.error('충돌 보고 시스템 초기화 오류:', error);
        return false;
    }
}
/**
 * 로그 디렉토리 생성
 */
function createLogDirectories() {
    const directories = [
        CRASH_REPORTS_DIR,
        path.dirname(ERROR_LOG_FILE),
        path.dirname(CRASH_LOG_FILE)
    ];
    for (const dir of directories) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
/**
 * 로그 스트림 초기화
 */
function initializeLogStreams() {
    try {
        // 기존 로그 파일 크기 확인 및 회전
        rotateLogFileIfNeeded(ERROR_LOG_FILE);
        rotateLogFileIfNeeded(CRASH_LOG_FILE);
        // 스트림 생성
        errorLogStream = fs.createWriteStream(ERROR_LOG_FILE, { flags: 'a' });
        crashLogStream = fs.createWriteStream(CRASH_LOG_FILE, { flags: 'a' });
        // 스트림 오류 처리
        errorLogStream.on('error', (error) => {
            console.error('오류 로그 스트림 오류:', error);
        });
        crashLogStream.on('error', (error) => {
            console.error('충돌 로그 스트림 오류:', error);
        });
    }
    catch (error) {
        console.error('로그 스트림 초기화 오류:', error);
    }
}
/**
 * 로그 파일 회전
 */
function rotateLogFileIfNeeded(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > (options.maxLogFileSize || MAX_LOG_FILE_SIZE)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = `${filePath}.${timestamp}.bak`;
                fs.renameSync(filePath, backupPath);
                console.log(`로그 파일 회전: ${filePath} -> ${backupPath}`);
            }
        }
    }
    catch (error) {
        console.error(`로그 파일 회전 오류 (${filePath}):`, error);
    }
}
/**
 * 충돌 보고자 설정
 */
function setupCrashReporter() {
    try {
        const systemInfo = getSystemInfo();
        electron_1.crashReporter.start({
            productName: electron_1.app.getName(),
            companyName: options.companyName || 'Loop',
            submitURL: options.submitURL || '',
            uploadToServer: options.uploadToServer || false,
            ignoreSystemCrashHandler: false,
            extra: {
                appVersion: systemInfo.appVersion,
                osVersion: systemInfo.osVersion,
                electronVersion: systemInfo.electronVersion,
                nodeVersion: systemInfo.nodeVersion,
                platform: systemInfo.platform,
                arch: systemInfo.arch,
                ...options.extra
            }
        });
        console.log('Electron 충돌 보고자가 설정되었습니다.');
    }
    catch (error) {
        console.error('충돌 보고자 설정 오류:', error);
    }
}
/**
 * 시스템 정보 수집
 */
function getSystemInfo() {
    return {
        platform: process.platform,
        arch: process.arch,
        osVersion: `${os.type()} ${os.release()}`,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        appVersion: electron_1.app.getVersion(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
    };
}
/**
 * 예외 처리기 설정
 */
function setupExceptionHandlers() {
    // 메인 프로세스 처리되지 않은 예외
    process.on('uncaughtException', (error) => {
        handleUncaughtException(error, 'uncaught-exception');
    });
    // 메인 프로세스 처리되지 않은 프로미스 거부
    process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        error.stack = `${error.stack}\nPromise: ${promise}`;
        handleUncaughtException(error, 'unhandled-rejection');
    });
    // 렌더러 프로세스 충돌
    electron_1.app.on('renderer-process-crashed', (event, webContents, killed) => {
        handleRendererCrash(webContents, killed);
    });
    // GPU 프로세스 충돌
    electron_1.app.on('gpu-process-crashed', (event, killed) => {
        handleGpuCrash(killed);
    });
    // 자식 프로세스 오류 (Node.js 16+에서 지원)
    if ('child-process-gone' in electron_1.app) {
        electron_1.app.on('child-process-gone', (event, details) => {
            handleChildProcessCrash(details);
        });
    }
    // 앱 종료 시 정리
    electron_1.app.on('will-quit', () => {
        handleAppShutdown();
    });
    console.log('예외 처리기가 설정되었습니다.');
}
/**
 * 처리되지 않은 예외 처리
 */
function handleUncaughtException(error, type) {
    try {
        const errorInfo = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            severity: 'critical',
            recoverable: false
        };
        // 통계 업데이트
        crashStats.uncaughtExceptions++;
        crashStats.totalCrashes++;
        crashStats.lastCrashTime = Date.now();
        crashStats.uptimeAtLastCrash = Date.now() - startTime;
        // 로깅
        console.error(`${type}:`, error);
        logError(errorInfo);
        logCrash({
            type,
            reason: error.message,
            timestamp: errorInfo.timestamp,
            systemInfo: getSystemInfo()
        });
        // 히스토리에 추가
        uncaughtExceptions.push(errorInfo);
        if (uncaughtExceptions.length > MAX_ERROR_HISTORY) {
            uncaughtExceptions.splice(0, uncaughtExceptions.length - MAX_ERROR_HISTORY);
        }
        // 복구 시도
        attemptRecovery(errorInfo);
    }
    catch (handlingError) {
        console.error('예외 처리 중 오류 발생:', handlingError);
    }
}
/**
 * 렌더러 프로세스 충돌 처리
 */
function handleRendererCrash(webContents, killed) {
    try {
        const window = electron_1.BrowserWindow.fromWebContents(webContents);
        const windowTitle = window?.getTitle() || 'Unknown Window';
        const crashInfo = {
            type: 'renderer-crash',
            windowTitle,
            killed,
            timestamp: new Date().toISOString(),
            systemInfo: getSystemInfo()
        };
        // 통계 업데이트
        crashStats.rendererCrashes++;
        crashStats.totalCrashes++;
        crashStats.lastCrashTime = Date.now();
        // 로깅
        logCrash(crashInfo);
        crashHistory.push(crashInfo);
        // 사용자에게 알림 및 복구 옵션 제공
        if (window && !window.isDestroyed()) {
            showCrashRecoveryDialog(window, 'renderer', crashInfo);
        }
        console.log(`렌더러 프로세스 충돌: ${windowTitle} (killed: ${killed})`);
    }
    catch (error) {
        console.error('렌더러 충돌 처리 오류:', error);
    }
}
/**
 * GPU 프로세스 충돌 처리
 */
function handleGpuCrash(killed) {
    try {
        const crashInfo = {
            type: 'gpu-crash',
            killed,
            timestamp: new Date().toISOString(),
            systemInfo: getSystemInfo()
        };
        // 통계 업데이트
        crashStats.gpuCrashes++;
        crashStats.totalCrashes++;
        crashStats.lastCrashTime = Date.now();
        // 로깅
        logCrash(crashInfo);
        crashHistory.push(crashInfo);
        // GPU 복구 다이얼로그
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            showGpuCrashRecoveryDialog(focusedWindow);
        }
        console.log(`GPU 프로세스 충돌 (killed: ${killed})`);
    }
    catch (error) {
        console.error('GPU 충돌 처리 오류:', error);
    }
}
/**
 * 자식 프로세스 충돌 처리
 */
function handleChildProcessCrash(details) {
    try {
        const crashInfo = {
            type: 'child-process-crash',
            processId: details.pid,
            exitCode: details.exitCode,
            reason: details.reason,
            timestamp: new Date().toISOString(),
            systemInfo: getSystemInfo()
        };
        logCrash(crashInfo);
        crashHistory.push(crashInfo);
        console.log(`자식 프로세스 충돌: PID ${details.pid}, 종료 코드: ${details.exitCode}`);
    }
    catch (error) {
        console.error('자식 프로세스 충돌 처리 오류:', error);
    }
}
/**
 * 복구 시도
 */
function attemptRecovery(errorInfo) {
    try {
        crashStats.recoveryAttempts++;
        // 중요도에 따른 복구 전략
        switch (errorInfo.severity) {
            case 'critical':
                if (uncaughtExceptions.length >= MAX_UNCAUGHT_EXCEPTIONS) {
                    // 심각한 오류가 연속으로 발생하면 강제 종료
                    showCriticalErrorDialog();
                }
                break;
            case 'high':
                // 메모리 정리 시도
                if (global.gc) {
                    global.gc();
                }
                break;
            case 'medium':
                // 경고 로그만 기록
                console.warn('중간 수준 오류 복구 시도');
                break;
        }
    }
    catch (error) {
        console.error('복구 시도 중 오류 발생:', error);
    }
}
/**
 * 충돌 복구 다이얼로그 표시
 */
async function showCrashRecoveryDialog(window, crashType, crashInfo) {
    try {
        const { response } = await electron_1.dialog.showMessageBox(window, {
            type: 'error',
            title: '앱 충돌',
            message: `${crashType} 프로세스가 충돌했습니다.`,
            detail: '복구 방법을 선택해주세요.',
            buttons: ['페이지 다시 로드', '새 창 열기', '앱 다시 시작', '종료'],
            defaultId: 0,
            cancelId: 3
        });
        switch (response) {
            case 0: // 페이지 다시 로드
                if (!window.isDestroyed()) {
                    window.webContents.reload();
                }
                break;
            case 1: // 새 창 열기
                createRecoveryWindow();
                break;
            case 2: // 앱 다시 시작
                electron_1.app.relaunch();
                electron_1.app.exit(0);
                break;
            case 3: // 종료
                electron_1.app.quit();
                break;
        }
    }
    catch (error) {
        console.error('충돌 복구 다이얼로그 오류:', error);
    }
}
/**
 * GPU 충돌 복구 다이얼로그
 */
async function showGpuCrashRecoveryDialog(window) {
    try {
        const { response } = await electron_1.dialog.showMessageBox(window, {
            type: 'warning',
            title: 'GPU 충돌',
            message: 'GPU 프로세스가 충돌했습니다.',
            detail: '하드웨어 가속을 비활성화하고 계속하시겠습니까?',
            buttons: ['하드웨어 가속 끄기', '그대로 진행'],
            defaultId: 0
        });
        if (response === 0) {
            electron_1.app.disableHardwareAcceleration();
            const { response: restartResponse } = await electron_1.dialog.showMessageBox(window, {
                type: 'info',
                message: '설정이 저장되었습니다. 변경사항을 적용하려면 앱을 다시 시작해야 합니다.',
                buttons: ['다시 시작', '나중에'],
                defaultId: 0
            });
            if (restartResponse === 0) {
                electron_1.app.relaunch();
                electron_1.app.exit(0);
            }
        }
    }
    catch (error) {
        console.error('GPU 충돌 복구 다이얼로그 오류:', error);
    }
}
/**
 * 심각한 오류 다이얼로그
 */
async function showCriticalErrorDialog() {
    try {
        const { response } = await electron_1.dialog.showMessageBox({
            type: 'error',
            title: '심각한 오류',
            message: '앱에 심각한 오류가 연속으로 발생했습니다.',
            detail: '앱을 안전하게 종료하고 다시 시작하는 것을 권장합니다.',
            buttons: ['안전 모드로 다시 시작', '강제 종료'],
            defaultId: 0
        });
        if (response === 0) {
            // 안전 모드 플래그 설정
            electron_1.app.relaunch({ args: ['--safe-mode'] });
        }
        electron_1.app.exit(1);
    }
    catch (error) {
        console.error('심각한 오류 다이얼로그 오류:', error);
        electron_1.app.exit(1);
    }
}
/**
 * 복구용 새 창 생성
 */
function createRecoveryWindow() {
    try {
        const recoveryWindow = new electron_1.BrowserWindow({
            width: 800,
            height: 600,
            title: '복구 모드',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        const port = process.env.PORT || 5500;
        recoveryWindow.loadURL(`http://localhost:${port}?recovery=true`);
        console.log('복구 창이 생성되었습니다.');
    }
    catch (error) {
        console.error('복구 창 생성 오류:', error);
    }
}
/**
 * 오류 로깅
 */
function logError(errorInfo) {
    try {
        if (errorLogStream && !errorLogStream.destroyed) {
            const logEntry = JSON.stringify(errorInfo) + '\n';
            errorLogStream.write(logEntry);
        }
    }
    catch (error) {
        console.error('오류 로깅 실패:', error);
    }
}
/**
 * 충돌 로깅
 */
function logCrash(crashInfo) {
    try {
        if (crashLogStream && !crashLogStream.destroyed) {
            const logEntry = JSON.stringify(crashInfo) + '\n';
            crashLogStream.write(logEntry);
        }
    }
    catch (error) {
        console.error('충돌 로깅 실패:', error);
    }
}
/**
 * 시스템 시작 로깅
 */
function logSystemStart() {
    try {
        const startInfo = {
            type: 'system-start',
            timestamp: new Date().toISOString(),
            systemInfo: getSystemInfo(),
            processId: process.pid,
            argv: process.argv
        };
        if (errorLogStream) {
            errorLogStream.write(`=== 앱 시작 ===\n${JSON.stringify(startInfo)}\n`);
        }
    }
    catch (error) {
        console.error('시스템 시작 로깅 오류:', error);
    }
}
/**
 * 앱 종료 처리
 */
function handleAppShutdown() {
    try {
        const uptime = Date.now() - startTime;
        crashStats.averageUptime = (crashStats.averageUptime + uptime) / 2;
        const shutdownInfo = {
            type: 'system-shutdown',
            timestamp: new Date().toISOString(),
            uptime,
            stats: crashStats
        };
        if (errorLogStream && !errorLogStream.destroyed) {
            errorLogStream.write(`=== 앱 종료 ===\n${JSON.stringify(shutdownInfo)}\n`);
            errorLogStream.end();
        }
        if (crashLogStream && !crashLogStream.destroyed) {
            crashLogStream.end();
        }
        console.log('충돌 보고 시스템 정리 완료');
    }
    catch (error) {
        console.error('앱 종료 처리 오류:', error);
    }
}
/**
 * IPC 핸들러 설정
 */
function setupCrashReporterIpcHandlers() {
    // 충돌 보고서 정보 조회
    electron_1.ipcMain.handle('crashReporter:getInfo', () => {
        return {
            directory: CRASH_REPORTS_DIR,
            enabled: electron_1.crashReporter.getUploadToServer(),
            lastCrashes: uncaughtExceptions.slice(-10),
            uploadEnabled: electron_1.crashReporter.getUploadToServer(),
            lastReport: electron_1.crashReporter.getLastCrashReport(),
            stats: crashStats
        };
    });
    // 업로드 설정 변경
    electron_1.ipcMain.handle('crashReporter:setUpload', (event, shouldUpload) => {
        electron_1.crashReporter.setUploadToServer(shouldUpload);
        return true;
    });
    // 충돌 히스토리 조회
    electron_1.ipcMain.handle('crash-reporter:get-history', () => {
        return crashHistory.slice(-20);
    });
    // 로그 파일 경로 조회
    electron_1.ipcMain.handle('crash-reporter:get-log-paths', () => {
        return {
            errorLog: ERROR_LOG_FILE,
            crashLog: CRASH_LOG_FILE
        };
    });
    // 수동 오류 보고
    electron_1.ipcMain.handle('crash-reporter:report-error', (event, errorData) => {
        const errorInfo = {
            type: 'manual-report',
            message: errorData.message,
            stack: errorData.stack,
            timestamp: new Date().toISOString(),
            severity: errorData.severity || 'medium',
            context: errorData.context,
            recoverable: true
        };
        logError(errorInfo);
        return true;
    });
}
/**
 * 충돌 보고서 정보 조회
 */
function getCrashReportInfo() {
    return {
        directory: CRASH_REPORTS_DIR,
        enabled: electron_1.crashReporter.getUploadToServer(),
        lastCrashes: uncaughtExceptions.slice(-10),
        uploadEnabled: electron_1.crashReporter.getUploadToServer(),
        lastReport: electron_1.crashReporter.getLastCrashReport(),
        stats: crashStats,
        isInitialized
    };
}
/**
 * 업로드 설정 변경
 */
function setUploadCrashReports(shouldUpload) {
    electron_1.crashReporter.setUploadToServer(shouldUpload);
    console.log(`충돌 보고서 업로드 ${shouldUpload ? '활성화' : '비활성화'}`);
}
/**
 * 로그 파일 경로 조회
 */
function getLogPaths() {
    return {
        errorLog: ERROR_LOG_FILE,
        crashLog: CRASH_LOG_FILE
    };
}
/**
 * 수동 오류 보고
 */
function reportError(message, stack, severity = 'medium', context) {
    const errorInfo = {
        type: 'manual-report',
        message,
        stack,
        timestamp: new Date().toISOString(),
        severity,
        context,
        recoverable: true
    };
    logError(errorInfo);
    uncaughtExceptions.push(errorInfo);
}
//# sourceMappingURL=crash-reporter.js.map