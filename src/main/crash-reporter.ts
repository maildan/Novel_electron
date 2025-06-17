/**
 * 앱 충돌 보고 및 로깅 모듈
 * 
 * 앱의 예상치 못한 종료, Error, 충돌을 감지하고 보고하는 시스템입니다.
 * Error 로깅, 충돌 보고서 수집, 복구 메커니즘을 제공합니다.
 */

import { app, crashReporter, dialog, BrowserWindow, ipcMain, WebContents } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 타입 정의
interface CrashReporterOptions {
  companyName?: string;
  submitURL?: string;
  uploadToServer?: boolean;
  extra?: Record<string, string>;
  enableDetailedReports?: boolean;
  maxLogFileSize?: number;
}

interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
  recoverable?: boolean;
}

interface CrashInfo {
  type: 'uncaught-exception' | 'unhandled-rejection' | 'renderer-crash' | 'gpu-crash' | 'child-process-crash';
  processId?: number;
  windowTitle?: string;
  killed?: boolean;
  exitCode?: number;
  reason?: string;
  timestamp: string;
  systemInfo: SystemInfo;
}

interface SystemInfo {
  platform: string;
  arch: string;
  osVersion: string;
  nodeVersion: string;
  electronVersion: string;
  appVersion: string;
  totalMemory: number;
  freeMemory: number;
}

interface CrashStats {
  totalCrashes: number;
  uncaughtExceptions: number;
  rendererCrashes: number;
  gpuCrashes: number;
  lastCrashTime: number | null;
  uptimeAtLastCrash: number | null;
  averageUptime: number;
  recoveryAttempts: number;
}

// 상수
const CRASH_REPORTS_DIR = path.join(app.getPath('userData'), 'crash-reports');
const ERROR_LOG_FILE = path.join(app.getPath('userData'), 'logs', 'error.log');
const CRASH_LOG_FILE = path.join(app.getPath('userData'), 'logs', 'crash.log');
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_UNCAUGHT_EXCEPTIONS = 5;
const MAX_ERROR_HISTORY = 100;

// 내부 상태
let isInitialized = false;
let errorLogStream: fs.WriteStream | null = null;
let crashLogStream: fs.WriteStream | null = null;
const uncaughtExceptions: ErrorInfo[] = [];
const crashHistory: CrashInfo[] = [];
const crashStats: CrashStats = {
  totalCrashes: 0,
  uncaughtExceptions: 0,
  rendererCrashes: 0,
  gpuCrashes: 0,
  lastCrashTime: null,
  uptimeAtLastCrash: null,
  averageUptime: 0,
  recoveryAttempts: 0
};

const startTime = Date.now();
let options: CrashReporterOptions = {};

/**
 * 충돌 보고 시스템 초기화
 */
export function initializeCrashReporter(crashOptions: CrashReporterOptions = {}): boolean {
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

    // 충돌 보고자 Setup
    setupCrashReporter();

    // 예외 처리기 Setup
    setupExceptionHandlers();

    // IPC 핸들러 Setup
    setupCrashReporterIpcHandlers();

    // 시작 로그
    logSystemStart();

    isInitialized = true;
    console.log('충돌 보고 시스템이 초기화되었습니다.');
    return true;

  } catch (error) {
    console.error('충돌 보고 시스템 초기화 Error:', error);
    return false;
  }
}

/**
 * 로그 디렉토리 생성
 */
function createLogDirectories(): void {
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
function initializeLogStreams(): void {
  try {
    // 기존 로그 파일 크기 확인 및 회전
    rotateLogFileIfNeeded(ERROR_LOG_FILE);
    rotateLogFileIfNeeded(CRASH_LOG_FILE);

    // 스트림 생성
    errorLogStream = fs.createWriteStream(ERROR_LOG_FILE, { flags: 'a' });
    crashLogStream = fs.createWriteStream(CRASH_LOG_FILE, { flags: 'a' });

    // 스트림 Error 처리
    errorLogStream.on('error', (error) => {
      console.error('Error 로그 스트림 Error:', error);
    });

    crashLogStream.on('error', (error) => {
      console.error('충돌 로그 스트림 Error:', error);
    });

  } catch (error) {
    console.error('로그 스트림 초기화 Error:', error);
  }
}

/**
 * 로그 파일 회전
 */
function rotateLogFileIfNeeded(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > (options.maxLogFileSize || MAX_LOG_FILE_SIZE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.${timestamp}.bak`;
        fs.renameSync(filePath, backupPath);
        console.log('로그 파일 회전: ${filePath} -> ${backupPath}');
      }
    }
  } catch (error) {
    console.error('로그 파일 회전 Error (${filePath}):', error);
  }
}

/**
 * 충돌 보고자 Setup
 */
function setupCrashReporter(): void {
  try {
    const systemInfo = getSystemInfo();
    
    crashReporter.start({
      productName: app.getName(),
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

    console.log('Electron 충돌 보고자가 Setup되었습니다.');

  } catch (error) {
    console.error('충돌 보고자 Setup Error:', error);
  }
}

/**
 * 시스템 정보 수집
 */
function getSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    osVersion: `${os.type()} ${os.release()}`,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    appVersion: app.getVersion(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem()
  };
}

/**
 * 예외 처리기 Setup
 */
function setupExceptionHandlers(): void {
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

  // 렌더러 프로세스 충돌 (타입 단언 사용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).on('renderer-process-crashed', (event: unknown, webContents: WebContents, killed: boolean) => {
    console.log(`[CrashReporter] 렌더러 프로세스 충돌 감지, 이벤트 타입: ${typeof event}`);
    handleRendererCrash(webContents, killed);
  });

  // GPU 프로세스 충돌 (타입 단언 사용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).on('gpu-process-crashed', (event: unknown, killed: boolean) => {
    console.log(`[CrashReporter] GPU 프로세스 충돌 감지, 이벤트 타입: ${typeof event}`);
    handleGpuCrash(killed);
  });

  // 자식 프로세스 Error (Node.js 16+에서 지원)
  if ('child-process-gone' in app) {
    const eventName = 'child-process-gone' as const;
    app.on(eventName, (event, details) => {
      console.log(`[CrashReporter] 자식 프로세스 종료 감지, 이벤트: ${event.defaultPrevented ? '방지됨' : '허용'}`);
      handleChildProcessCrash(details);
    });
  }

  // 앱 종료 시 Cleanup
  app.on('will-quit', () => {
    handleAppShutdown();
  });

  console.log('예외 처리기가 Setup되었습니다.');
}

/**
 * 처리되지 않은 예외 처리
 */
function handleUncaughtException(error: Error, type: 'uncaught-exception' | 'unhandled-rejection'): void {
  try {
    const errorInfo: ErrorInfo = {
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
    console.error('${type}:', error);
    logError(errorInfo);
    logCrash({
      type,
      reason: error.message,
      timestamp: errorInfo.timestamp,
      systemInfo: getSystemInfo()
    });

    // Add to history
    uncaughtExceptions.push(errorInfo);
    if (uncaughtExceptions.length > MAX_ERROR_HISTORY) {
      uncaughtExceptions.splice(0, uncaughtExceptions.length - MAX_ERROR_HISTORY);
    }

    // 복구 시도
    attemptRecovery(errorInfo);

  } catch (handlingError) {
    console.error('예외 Processing Error 발생:', handlingError);
  }
}

/**
 * 렌더러 프로세스 충돌 처리
 */
function handleRendererCrash(webContents: Electron.WebContents, killed: boolean): void {
  try {
    const window = BrowserWindow.fromWebContents(webContents);
    const windowTitle = window?.getTitle() || 'Unknown Window';

    const crashInfo: CrashInfo = {
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

    console.log('렌더러 프로세스 충돌: ${windowTitle} (killed: ${killed})');

  } catch (error) {
    console.error('렌더러 충돌 처리 Error:', error);
  }
}

/**
 * GPU 프로세스 충돌 처리
 */
function handleGpuCrash(killed: boolean): void {
  try {
    const crashInfo: CrashInfo = {
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
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      showGpuCrashRecoveryDialog(focusedWindow);
    }

    console.log('GPU 프로세스 충돌 (killed: ${killed})');

  } catch (error) {
    console.error('GPU 충돌 처리 Error:', error);
  }
}

/**
 * 자식 프로세스 충돌 처리
 */
function handleChildProcessCrash(details: { pid?: number; exitCode?: number; reason?: string }): void {
  try {
    const crashInfo: CrashInfo = {
      type: 'child-process-crash',
      processId: details.pid,
      exitCode: details.exitCode,
      reason: details.reason,
      timestamp: new Date().toISOString(),
      systemInfo: getSystemInfo()
    };

    logCrash(crashInfo);
    crashHistory.push(crashInfo);

    console.log('자식 프로세스 충돌: PID ${details.pid}, 종료 코드: ${details.exitCode}');

  } catch (error) {
    console.error('자식 프로세스 충돌 처리 Error:', error);
  }
}

/**
 * 복구 시도
 */
function attemptRecovery(errorInfo: ErrorInfo): void {
  try {
    crashStats.recoveryAttempts++;

    // 중요도에 따른 복구 전략
    switch (errorInfo.severity) {
      case 'critical':
        if (uncaughtExceptions.length >= MAX_UNCAUGHT_EXCEPTIONS) {
          // 심각한 Error가 연속으로 발생하면 강제 종료
          showCriticalErrorDialog();
        }
        break;

      case 'high':
        // 메모리 Cleanup 시도
        if (global.gc) {
          global.gc();
        }
        break;

      case 'medium':
        // Warning 로그만 기록
        console.warn('중간 수준 Error 복구 시도');
        break;
    }

  } catch (error) {
    console.error('복구 시도 중 Error 발생:', error);
  }
}

/**
 * 충돌 복구 다이얼로그 표시
 */
async function showCrashRecoveryDialog(window: BrowserWindow, crashType: string, crashInfo: CrashInfo): Promise<void> {
  try {
    console.log(`[CrashReporter] 충돌 복구 다이얼로그 표시, 타입: ${crashType}, 정보:`, crashInfo);
    const { response } = await dialog.showMessageBox(window, {
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
        app.relaunch();
        app.exit(0);
        break;

      case 3: // 종료
        app.quit();
        break;
    }

  } catch (error) {
    console.error('충돌 복구 다이얼로그 Error:', error);
  }
}

/**
 * GPU 충돌 복구 다이얼로그
 */
async function showGpuCrashRecoveryDialog(window: BrowserWindow): Promise<void> {
  try {
    const { response } = await dialog.showMessageBox(window, {
      type: 'warning',
      title: 'GPU 충돌',
      message: 'GPU 프로세스가 충돌했습니다.',
      detail: '하드웨어 가속을 비활성화하고 계속하시겠습니까?',
      buttons: ['하드웨어 가속 끄기', '그대로 진행'],
      defaultId: 0
    });

    if (response === 0) {
      app.disableHardwareAcceleration();
      
      const { response: restartResponse } = await dialog.showMessageBox(window, {
        type: 'info',
        message: 'Setup이 저장되었습니다. 변경사항을 적용하려면 앱을 다시 시작해야 합니다.',
        buttons: ['다시 시작', '나중에'],
        defaultId: 0
      });

      if (restartResponse === 0) {
        app.relaunch();
        app.exit(0);
      }
    }

  } catch (error) {
    console.error('GPU 충돌 복구 다이얼로그 Error:', error);
  }
}

/**
 * 심각한 Error 다이얼로그
 */
async function showCriticalErrorDialog(): Promise<void> {
  try {
    const { response } = await dialog.showMessageBox({
      type: 'error',
      title: '심각한 Error',
      message: '앱에 심각한 Error가 연속으로 발생했습니다.',
      detail: '앱을 안전하게 종료하고 다시 시작하는 것을 권장합니다.',
      buttons: ['안전 모드로 다시 시작', '강제 종료'],
      defaultId: 0
    });

    if (response === 0) {
      // 안전 모드 플래그 Setup
      app.relaunch({ args: ['--safe-mode'] });
    }
    
    app.exit(1);

  } catch (error) {
    console.error('심각한 Error 다이얼로그 Error:', error);
    app.exit(1);
  }
}

/**
 * 복구용 새 창 생성
 */
function createRecoveryWindow(): void {
  try {
    const recoveryWindow = new BrowserWindow({
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

  } catch (error) {
    console.error('복구 창 생성 Error:', error);
  }
}

/**
 * Error 로깅
 */
function logError(errorInfo: ErrorInfo): void {
  try {
    if (errorLogStream && !errorLogStream.destroyed) {
      const logEntry = JSON.stringify(errorInfo) + '\n';
      errorLogStream.write(logEntry);
    }
  } catch (error) {
    console.error('Error 로깅 Failed:', error);
  }
}

/**
 * 충돌 로깅
 */
function logCrash(crashInfo: CrashInfo): void {
  try {
    if (crashLogStream && !crashLogStream.destroyed) {
      const logEntry = JSON.stringify(crashInfo) + '\n';
      crashLogStream.write(logEntry);
    }
  } catch (error) {
    console.error('충돌 로깅 Failed:', error);
  }
}

/**
 * 시스템 시작 로깅
 */
function logSystemStart(): void {
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

  } catch (error) {
    console.error('시스템 시작 로깅 Error:', error);
  }
}

/**
 * 앱 종료 처리
 */
function handleAppShutdown(): void {
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

    console.log('충돌 보고 시스템 Cleanup Completed');

  } catch (error) {
    console.error('앱 종료 처리 Error:', error);
  }
}

/**
 * IPC 핸들러 Setup
 */
function setupCrashReporterIpcHandlers(): void {
  // 충돌 보고서 정보 조회
  ipcMain.handle('crashReporter:getInfo', () => {
    return {
      directory: CRASH_REPORTS_DIR,
      enabled: crashReporter.getUploadToServer(),
      lastCrashes: uncaughtExceptions.slice(-10),
      uploadEnabled: crashReporter.getUploadToServer(),
      lastReport: crashReporter.getLastCrashReport(),
      stats: crashStats
    };
  });

  // 업로드 Setup 변경
  ipcMain.handle('crashReporter:setUpload', (event, shouldUpload: boolean) => {
    console.log(`[CrashReporter] 업로드 설정 변경: ${shouldUpload}, 발신자: ${event.sender.id}`);
    crashReporter.setUploadToServer(shouldUpload);
    return true;
  });

  // 충돌 히스토리 조회
  ipcMain.handle('crash-reporter:get-history', () => {
    return crashHistory.slice(-20);
  });

  // 로그 파일 경로 조회
  ipcMain.handle('crash-reporter:get-log-paths', () => {
    return {
      errorLog: ERROR_LOG_FILE,
      crashLog: CRASH_LOG_FILE
    };
  });

  // 수동 Error 보고
  ipcMain.handle('crash-reporter:report-error', (event, errorData) => {
    console.log(`[CrashReporter] 수동 에러 보고, 발신자: ${event.sender.id}, 메시지: ${errorData.message}`);
    const errorInfo: ErrorInfo = {
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
export function getCrashReportInfo(): Record<string, unknown> {
  return {
    directory: CRASH_REPORTS_DIR,
    enabled: crashReporter.getUploadToServer(),
    lastCrashes: uncaughtExceptions.slice(-10),
    uploadEnabled: crashReporter.getUploadToServer(),
    lastReport: crashReporter.getLastCrashReport(),
    stats: crashStats,
    isInitialized
  };
}

/**
 * 업로드 Setup 변경
 */
export function setUploadCrashReports(shouldUpload: boolean): void {
  crashReporter.setUploadToServer(shouldUpload);
  console.log(`충돌 보고서 업로드 ${shouldUpload ? '활성화' : '비활성화'}`);
}

/**
 * 로그 파일 경로 조회
 */
export function getLogPaths(): { errorLog: string; crashLog: string } {
  return {
    errorLog: ERROR_LOG_FILE,
    crashLog: CRASH_LOG_FILE
  };
}

/**
 * 수동 Error 보고
 */
export function reportError(message: string, stack?: string, severity: ErrorInfo['severity'] = 'medium', context?: Record<string, unknown>): void {
  const errorInfo: ErrorInfo = {
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
