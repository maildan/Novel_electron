"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const config_1 = require("./config");
const window_1 = require("./window");
const keyboard_1 = require("./keyboard");
const ipc_handlers_1 = require("./ipc-handlers");
class ElectronApp {
    constructor() {
        this.windowManager = window_1.WindowManager.getInstance();
        this.keyboardManager = keyboard_1.KeyboardManager.getInstance();
        this.initialize();
    }
    initialize() {
        console.log('[App] Electron 애플리케이션 초기화 시작');
        // 개발 모드에서 보안 및 CSP 비활성화
        if (config_1.AppConfig.isDevelopment) {
            this.setupDevelopmentMode();
        }
        // GPU 설정
        this.setupGpuAcceleration();
        // 앱 준비 대기
        electron_1.app.whenReady().then(() => {
            this.onReady();
        });
        // 모든 창이 닫혔을 때
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        // 앱 활성화 시 (macOS)
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.windowManager.createMainWindow();
            }
        });
        // 앱 종료 전
        electron_1.app.on('before-quit', () => {
            this.cleanup();
        });
        // 보안 이벤트 처리
        this.setupSecurityHandlers();
    }
    setupDevelopmentMode() {
        console.log('[App] 개발 모드 설정 - 보안 제한 비활성화');
        // 보안 경고 비활성화
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
        // CSP 및 보안 관련 명령줄 스위치
        electron_1.app.commandLine.appendSwitch('disable-web-security');
        electron_1.app.commandLine.appendSwitch('allow-insecure-localhost');
        electron_1.app.commandLine.appendSwitch('ignore-certificate-errors');
        electron_1.app.commandLine.appendSwitch('disable-site-isolation-trials');
        electron_1.app.commandLine.appendSwitch('allow-running-insecure-content');
    }
    setupGpuAcceleration() {
        // GPU 모드 설정 (기본값은 하드웨어 가속)
        const gpuMode = process.env.GPU_MODE || 'hardware';
        if (gpuMode === 'software') {
            console.log('[App] GPU 모드: Software - 하드웨어 가속 비활성화');
            electron_1.app.disableHardwareAcceleration();
            electron_1.app.commandLine.appendSwitch('disable-gpu');
            electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
        }
        else {
            console.log('[App] GPU 모드: Hardware - 하드웨어 가속 활성화');
            electron_1.app.commandLine.appendSwitch('enable-hardware-acceleration');
            electron_1.app.commandLine.appendSwitch('ignore-gpu-blacklist');
        }
        // GPU 프로세스 크래시 제한 비활성화 (디버깅용)
        electron_1.app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
        if (config_1.AppConfig.isDevelopment) {
            electron_1.app.commandLine.appendSwitch('debug-gpu');
        }
    }
    setupSecurityHandlers() {
        // 웹 컨텐츠 생성 시 보안 설정
        electron_1.app.on('web-contents-created', (event, contents) => {
            // 새 창 생성 제한
            contents.setWindowOpenHandler(({ url }) => {
                console.log('[Security] 새 창 생성 요청 차단:', url);
                return { action: 'deny' };
            });
            // 네비게이션 제한 (개발 모드 제외)
            if (!config_1.AppConfig.isDevelopment) {
                contents.on('will-navigate', (event, navigationUrl) => {
                    const parsedUrl = new URL(navigationUrl);
                    const allowedUrl = `http://localhost:${config_1.AppConfig.port}`;
                    if (parsedUrl.origin !== allowedUrl) {
                        console.log('[Security] 외부 네비게이션 차단:', navigationUrl);
                        event.preventDefault();
                    }
                });
            }
        });
    }
    async onReady() {
        console.log('[App] Electron 앱 준비 완료');
        try {
            // 1. IPC 핸들러 등록 (설정 관리자 포함)
            console.log('[App] IPC 핸들러 등록 중...');
            await ipc_handlers_1.ipcHandlers.register();
            // 2. 키보드 매니저 초기화
            console.log('[App] 키보드 매니저 초기화 중...');
            await this.keyboardManager.initialize();
            // 3. 메인 윈도우 생성
            console.log('[App] 메인 윈도우 생성 중...');
            await this.windowManager.createMainWindow();
            console.log('[App] 애플리케이션 초기화 완료');
            // 개발 모드에서 개발자 도구 자동 열기
            if (config_1.AppConfig.isDevelopment) {
                const mainWindow = this.windowManager.getMainWindow();
                if (mainWindow) {
                    mainWindow.webContents.openDevTools();
                }
            }
        }
        catch (error) {
            console.error('[App] 애플리케이션 초기화 실패:', error);
            electron_1.app.quit();
        }
    }
    cleanup() {
        console.log('[App] 애플리케이션 정리 시작');
        try {
            // 키보드 매니저 정리
            this.keyboardManager.dispose();
            console.log('[App] 애플리케이션 정리 완료');
        }
        catch (error) {
            console.error('[App] 정리 중 오류:', error);
        }
    }
}
// 단일 인스턴스 보장
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.warn('[App] 이미 실행 중인 인스턴스가 있습니다. 종료합니다.');
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        // 두 번째 인스턴스 실행 시 첫 번째 인스턴스 윈도우에 포커스
        const mainWindow = electron_1.BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
    // 애플리케이션 인스턴스 생성
    new ElectronApp();
}
//# sourceMappingURL=index-simple.js.map