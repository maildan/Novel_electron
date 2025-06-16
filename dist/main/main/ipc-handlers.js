"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipcHandlers = exports.IpcHandlers = void 0;
const electron_1 = require("electron");
const data_sync_1 = __importDefault(require("./data-sync"));
const stats_manager_1 = __importDefault(require("./stats-manager"));
const browser_detector_1 = __importDefault(require("./browser-detector"));
const auto_launch_manager_1 = require("./auto-launch-manager");
const security_manager_1 = require("./security-manager");
const menu_manager_1 = __importDefault(require("./menu-manager"));
const settings_manager_1 = __importDefault(require("./settings-manager"));
class IpcHandlers {
    constructor() {
        this.isInitialized = false;
    }
    static getInstance() {
        if (!IpcHandlers.instance) {
            IpcHandlers.instance = new IpcHandlers();
        }
        return IpcHandlers.instance;
    }
    /**
     * IPC 핸들러 등록
     */
    async register() {
        if (this.isInitialized) {
            return;
        }
        console.log('[IPC] IPC 핸들러 등록 시작');
        try {
            // 설정 관리자 초기화
            await settings_manager_1.default.initialize();
            // 메뉴 관리자 초기화
            await menu_manager_1.default.initialize();
            // 보안 관리자 초기화 (키보드 이벤트 핸들러 포함)
            await security_manager_1.security.initialize();
            // 데이터 동기화 초기화
            await data_sync_1.default.initialize();
            // 통계 매니저 초기화
            await stats_manager_1.default.initialize();
            // 브라우저 감지기 초기화
            await browser_detector_1.default.initialize();
            // 자동 시작 관리자 초기화
            await auto_launch_manager_1.autoLaunch.initialize();
            // 핸들러 등록
            this.registerDataSyncHandlers();
            this.registerStatsHandlers();
            this.registerBrowserHandlers();
            this.registerAutoLaunchHandlers();
            this.registerSecurityHandlers();
            this.registerUtilityHandlers();
            this.isInitialized = true;
            console.log('[IPC] IPC 핸들러 등록 Completed');
        }
        catch (error) {
            console.error('[IPC] IPC 핸들러 등록 Failed:', error);
            throw error;
        }
    }
    /**
   * 데이터 동기화 핸들러 등록
   */
    registerDataSyncHandlers() {
        // 데이터 동기화 상태 확인
        electron_1.ipcMain.handle('data-sync-status', async () => {
            try {
                return await data_sync_1.default.getStatus();
            }
            catch (error) {
                console.error('[IPC] Data sync status error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 수동 동기화 실행
        electron_1.ipcMain.handle('data-sync-manual', async () => {
            try {
                return await data_sync_1.default.syncNow();
            }
            catch (error) {
                console.error('[IPC] Manual sync error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 동기화 Setup 업데이트
        electron_1.ipcMain.handle('data-sync-update-config', async (event, config) => {
            try {
                return await data_sync_1.default.updateConfig(config);
            }
            catch (error) {
                console.error('[IPC] Sync config update error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 실패한 항목 재시도
        electron_1.ipcMain.handle('data-sync-retry-failed', async () => {
            try {
                return await data_sync_1.default.retryFailedItems();
            }
            catch (error) {
                console.error('[IPC] Retry failed items error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 통계 핸들러 등록
   */
    registerStatsHandlers() {
        // 통계 데이터 가져오기
        electron_1.ipcMain.handle('stats-get-data', async (event, options) => {
            try {
                return await stats_manager_1.default.getStats(options);
            }
            catch (error) {
                console.error('[IPC] Get stats error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 타이핑 패턴 분석
        electron_1.ipcMain.handle('stats-analyze-pattern', async (event, data) => {
            try {
                return await stats_manager_1.default.analyzeTypingPattern(data);
            }
            catch (error) {
                console.error('[IPC] Analyze pattern error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 통계 Setup 업데이트
        electron_1.ipcMain.handle('stats-update-settings', async (event, settings) => {
            try {
                return await stats_manager_1.default.updateSettings(settings);
            }
            catch (error) {
                console.error('[IPC] Update stats settings error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 메모리 사용량 최적화
        electron_1.ipcMain.handle('stats-optimize-memory', async () => {
            try {
                return await stats_manager_1.default.optimizeMemory();
            }
            catch (error) {
                console.error('[IPC] Optimize memory error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 브라우저 감지 핸들러 등록
   */
    registerBrowserHandlers() {
        // 활성 브라우저 정보 가져오기
        electron_1.ipcMain.handle('browser-get-active', async () => {
            try {
                return await browser_detector_1.default.getActiveBrowser();
            }
            catch (error) {
                console.error('[IPC] Get active browser error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 브라우저 목록 가져오기
        electron_1.ipcMain.handle('browser-get-list', async () => {
            try {
                return await browser_detector_1.default.getInstalledBrowsers();
            }
            catch (error) {
                console.error('[IPC] Get browser list error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // Google Docs 감지
        electron_1.ipcMain.handle('browser-detect-google-docs', async () => {
            try {
                return await browser_detector_1.default.detectGoogleDocs();
            }
            catch (error) {
                console.error('[IPC] Detect Google Docs error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 브라우저 감지 Setup 업데이트
        electron_1.ipcMain.handle('browser-update-settings', async (event, settings) => {
            try {
                return await browser_detector_1.default.updateSettings(settings);
            }
            catch (error) {
                console.error('[IPC] Update browser settings error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 자동 시작 핸들러 등록
   */
    registerAutoLaunchHandlers() {
        // 자동 시작 상태 확인
        electron_1.ipcMain.handle('auto-launch-status', async () => {
            try {
                return await auto_launch_manager_1.autoLaunch.getStatus();
            }
            catch (error) {
                console.error('[IPC] Auto launch status error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 자동 시작 활성화
        electron_1.ipcMain.handle('auto-launch-enable', async (event, settings) => {
            try {
                return await auto_launch_manager_1.autoLaunch.enable(settings);
            }
            catch (error) {
                console.error('[IPC] Auto launch enable error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 자동 시작 비활성화
        electron_1.ipcMain.handle('auto-launch-disable', async () => {
            try {
                return await auto_launch_manager_1.autoLaunch.disable();
            }
            catch (error) {
                console.error('[IPC] Auto launch disable error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 자동 시작 토글
        electron_1.ipcMain.handle('auto-launch-toggle', async (event, settings) => {
            try {
                return await auto_launch_manager_1.autoLaunch.toggle(settings);
            }
            catch (error) {
                console.error('[IPC] Auto launch toggle error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 보안 핸들러 등록
   */
    registerSecurityHandlers() {
        // CSP 업데이트
        electron_1.ipcMain.handle('security-update-csp', async (event, config) => {
            try {
                return security_manager_1.security.updateCSP(config);
            }
            catch (error) {
                console.error('[IPC] Update CSP error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // IME 상태 가져오기
        electron_1.ipcMain.handle('security-ime-state', async () => {
            try {
                return security_manager_1.security.getIMEState();
            }
            catch (error) {
                console.error('[IPC] Get IME state error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // IME 상태 초기화
        electron_1.ipcMain.handle('security-ime-reset', async () => {
            try {
                security_manager_1.security.resetIMEState();
                return { success: true };
            }
            catch (error) {
                console.error('[IPC] Reset IME state error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 창에 보안 Setup 적용
        electron_1.ipcMain.handle('security-setup-window', async (event) => {
            try {
                const window = electron_1.BrowserWindow.fromWebContents(event.sender);
                if (window) {
                    return security_manager_1.security.setupRequestSecurity(window);
                }
                return false;
            }
            catch (error) {
                console.error('[IPC] Setup window security error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 유틸리티 핸들러 등록
   */
    registerUtilityHandlers() {
        // 앱 재시작
        electron_1.ipcMain.handle('app:restart', async () => {
            try {
                console.log('[IPC] 앱 재시작 요청 받음');
                // 짧은 지연 후 앱 재시작 (UI가 응답을 받을 시간 제공)
                setTimeout(() => {
                    const { app } = require('electron');
                    app.relaunch();
                    app.exit(0);
                }, 500);
                return { success: true, message: 'App restart initiated' };
            }
            catch (error) {
                console.error('[IPC] App restart error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 시스템 상태 확인
        electron_1.ipcMain.handle('system-health-check', async () => {
            try {
                const dataSyncStatus = await data_sync_1.default.getStatus();
                const autoLaunchStatus = await auto_launch_manager_1.autoLaunch.getStatus();
                const imeState = security_manager_1.security.getIMEState();
                return {
                    success: true,
                    dataSync: dataSyncStatus,
                    autoLaunch: autoLaunchStatus,
                    ime: imeState,
                    timestamp: Date.now()
                };
            }
            catch (error) {
                console.error('[IPC] System health check error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 모든 모듈 재시작
        electron_1.ipcMain.handle('system-restart-modules', async () => {
            try {
                await data_sync_1.default.restart();
                await stats_manager_1.default.restart();
                await browser_detector_1.default.restart();
                return { success: true, message: 'All modules restarted successfully' };
            }
            catch (error) {
                console.error('[IPC] Restart modules error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
        // 모듈별 상태 가져오기
        electron_1.ipcMain.handle('system-module-status', async () => {
            try {
                return {
                    success: true,
                    modules: {
                        dataSync: data_sync_1.default.isInitialized(),
                        stats: stats_manager_1.default.isInitialized(),
                        browser: browser_detector_1.default.isInitialized(),
                        security: true, // 보안 관리자는 항상 Initialized
                        autoLaunch: true // 자동 시작 관리자는 항상 Initialized
                    },
                    timestamp: Date.now()
                };
            }
            catch (error) {
                console.error('[IPC] Module status error:', error);
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        });
    }
    /**
   * 핸들러 제거
   */
    cleanup() {
        if (!this.isInitialized) {
            return;
        }
        console.log('[IPC] IPC 핸들러 Cleanup 시작');
        // 모든 핸들러 목록
        const handlers = [
            // 앱 제어
            'app:restart',
            // 데이터 동기화
            'data-sync-status', 'data-sync-manual', 'data-sync-update-config', 'data-sync-retry-failed',
            // 통계
            'stats-get-data', 'stats-analyze-pattern', 'stats-update-settings', 'stats-optimize-memory',
            // 브라우저
            'browser-get-active', 'browser-get-list', 'browser-detect-google-docs', 'browser-update-settings',
            // 자동 시작
            'auto-launch-status', 'auto-launch-enable', 'auto-launch-disable', 'auto-launch-toggle',
            // 보안
            'security-update-csp', 'security-ime-state', 'security-ime-reset', 'security-setup-window',
            // 유틸리티
            'system-health-check', 'system-restart-modules', 'system-module-status'
        ];
        // 핸들러 제거
        handlers.forEach(handler => {
            try {
                electron_1.ipcMain.removeHandler(handler);
            }
            catch (error) {
                // 핸들러가 존재하지 않는 경우 무시
            }
        });
        this.isInitialized = false;
        console.log('[IPC] IPC 핸들러 Cleanup Completed');
    }
    /**
   * 리소스 Cleanup
   */
    dispose() {
        // IPC 핸들러 Cleanup 로직
        console.log('[IPC] IPC 핸들러 Cleanup Completed');
    }
}
exports.IpcHandlers = IpcHandlers;
// 싱글톤 인스턴스 생성 및 내보내기
exports.ipcHandlers = IpcHandlers.getInstance();
exports.default = exports.ipcHandlers;
//# sourceMappingURL=ipc-handlers.js.map