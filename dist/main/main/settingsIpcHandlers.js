"use strict";
/**
 * Loop 6 설정 관련 IPC 핸들러
 *
 * 설정 페이지에서 요청하는 다양한 설정 기능들의 실제 구현
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsIpcHandlers = void 0;
const electron_1 = require("electron");
const settings_manager_1 = __importDefault(require("./settings-manager"));
const window_1 = require("./window");
class SettingsIpcHandlers {
    constructor() {
        this.isRegistered = false;
    }
    static getInstance() {
        if (!SettingsIpcHandlers.instance) {
            SettingsIpcHandlers.instance = new SettingsIpcHandlers();
        }
        return SettingsIpcHandlers.instance;
    }
    /**
     * 설정 관련 IPC 핸들러 등록
     */
    register() {
        if (this.isRegistered) {
            console.log('설정 IPC 핸들러가 이미 등록되어 있습니다');
            return;
        }
        console.log('설정 IPC 핸들러 등록 중...');
        // 처리 모드 설정
        electron_1.ipcMain.handle('setProcessingMode', async (event, mode) => {
            try {
                await settings_manager_1.default.updateSetting('processingMode', mode);
                // 처리 모드에 따른 추가 설정
                switch (mode) {
                    case 'gpu-intensive':
                        await settings_manager_1.default.updateSetting('enableGPUAcceleration', true);
                        break;
                    case 'cpu-intensive':
                        await settings_manager_1.default.updateSetting('enableGPUAcceleration', false);
                        break;
                    case 'auto':
                        // GPU 사용 가능 여부에 따라 자동 설정
                        const gpuAvailable = await this.checkGPUAvailability();
                        await settings_manager_1.default.updateSetting('enableGPUAcceleration', gpuAvailable);
                        break;
                }
                return {
                    success: true,
                    message: `처리 모드가 ${mode}로 설정되었습니다`,
                    mode
                };
            }
            catch (error) {
                console.error('처리 모드 설정 실패:', error);
                return {
                    success: false,
                    message: `처리 모드 설정 실패: ${error}`
                };
            }
        });
        // GPU 가속 설정
        electron_1.ipcMain.handle('setGPUAcceleration', async (event, enabled) => {
            try {
                await settings_manager_1.default.updateSetting('enableGPUAcceleration', enabled);
                // GPU 관련 설정 적용 (재시작 필요)
                console.log(`GPU 가속 ${enabled ? '활성화' : '비활성화'}`);
                return {
                    success: true,
                    message: `GPU 가속이 ${enabled ? '활성화' : '비활성화'}되었습니다. 재시작 후 적용됩니다.`,
                    requiresRestart: true
                };
            }
            catch (error) {
                console.error('GPU 가속 설정 실패:', error);
                return {
                    success: false,
                    message: `GPU 가속 설정 실패: ${error}`
                };
            }
        });
        // 메모리 최적화 실행
        electron_1.ipcMain.handle('optimizeMemory', async () => {
            try {
                // 가비지 컬렉션 강제 실행
                if (global.gc) {
                    global.gc();
                }
                // 프로세스 메모리 정리
                const memoryBefore = process.memoryUsage();
                // Node.js 메모리 최적화
                if (process.platform !== 'win32') {
                    process.nextTick(() => {
                        if (global.gc)
                            global.gc();
                    });
                }
                const memoryAfter = process.memoryUsage();
                const savedMemory = Math.round((memoryBefore.heapUsed - memoryAfter.heapUsed) / 1024 / 1024);
                return {
                    success: true,
                    message: `메모리 최적화 완료${savedMemory > 0 ? ` (${savedMemory}MB 절약)` : ''}`,
                    memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
                    memoryAfter: Math.round(memoryAfter.heapUsed / 1024 / 1024),
                    saved: savedMemory
                };
            }
            catch (error) {
                console.error('메모리 최적화 실패:', error);
                return {
                    success: false,
                    message: `메모리 최적화 실패: ${error}`
                };
            }
        });
        // 전체화면 모드 설정
        electron_1.ipcMain.handle('setFullscreenMode', async (event, mode) => {
            try {
                const windowManager = window_1.WindowManager.getInstance();
                const mainWindow = windowManager.getMainWindow();
                if (!mainWindow) {
                    return {
                        success: false,
                        message: '메인 윈도우를 찾을 수 없습니다'
                    };
                }
                switch (mode) {
                    case 'windowed':
                        mainWindow.setFullScreen(false);
                        mainWindow.setAutoHideMenuBar(false);
                        break;
                    case 'fullscreen':
                        mainWindow.setFullScreen(true);
                        mainWindow.setAutoHideMenuBar(false);
                        break;
                    case 'fullscreen-auto-hide':
                        mainWindow.setFullScreen(true);
                        mainWindow.setAutoHideMenuBar(true);
                        break;
                }
                await settings_manager_1.default.updateSetting('windowMode', mode);
                return {
                    success: true,
                    message: `화면 모드가 ${mode}로 변경되었습니다`,
                    mode
                };
            }
            catch (error) {
                console.error('화면 모드 설정 실패:', error);
                return {
                    success: false,
                    message: `화면 모드 설정 실패: ${error}`
                };
            }
        });
        // 알림 설정
        electron_1.ipcMain.handle('setNotifications', async (event, enabled) => {
            try {
                await settings_manager_1.default.updateSetting('enableNotifications', enabled);
                return {
                    success: true,
                    message: `알림이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
                    enabled
                };
            }
            catch (error) {
                console.error('알림 설정 실패:', error);
                return {
                    success: false,
                    message: `알림 설정 실패: ${error}`
                };
            }
        });
        // 애니메이션 설정
        electron_1.ipcMain.handle('setAnimations', async (event, enabled) => {
            try {
                await settings_manager_1.default.updateSetting('enableAnimations', enabled);
                return {
                    success: true,
                    message: `애니메이션이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
                    enabled
                };
            }
            catch (error) {
                console.error('애니메이션 설정 실패:', error);
                return {
                    success: false,
                    message: `애니메이션 설정 실패: ${error}`
                };
            }
        });
        // 데이터 수집 설정
        electron_1.ipcMain.handle('setDataCollection', async (event, enabled) => {
            try {
                await settings_manager_1.default.updateSetting('enableDataCollection', enabled);
                return {
                    success: true,
                    message: `데이터 수집이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
                    enabled
                };
            }
            catch (error) {
                console.error('데이터 수집 설정 실패:', error);
                return {
                    success: false,
                    message: `데이터 수집 설정 실패: ${error}`
                };
            }
        });
        // 자동 저장 설정
        electron_1.ipcMain.handle('setAutoSave', async (event, enabled) => {
            try {
                await settings_manager_1.default.updateSetting('enableAutoSave', enabled);
                return {
                    success: true,
                    message: `자동 저장이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
                    enabled
                };
            }
            catch (error) {
                console.error('자동 저장 설정 실패:', error);
                return {
                    success: false,
                    message: `자동 저장 설정 실패: ${error}`
                };
            }
        });
        // 데이터 보관 기간 설정
        electron_1.ipcMain.handle('setDataRetention', async (event, days) => {
            try {
                await settings_manager_1.default.updateSetting('dataRetentionDays', days);
                return {
                    success: true,
                    message: `데이터 보관 기간이 ${days}일로 설정되었습니다`,
                    days
                };
            }
            catch (error) {
                console.error('데이터 보관 기간 설정 실패:', error);
                return {
                    success: false,
                    message: `데이터 보관 기간 설정 실패: ${error}`
                };
            }
        });
        // 메모리 임계값 설정
        electron_1.ipcMain.handle('setMemoryThreshold', async (event, threshold) => {
            try {
                await settings_manager_1.default.updateSetting('maxMemoryThreshold', threshold);
                return {
                    success: true,
                    message: `메모리 임계값이 ${threshold}MB로 설정되었습니다`,
                    threshold
                };
            }
            catch (error) {
                console.error('메모리 임계값 설정 실패:', error);
                return {
                    success: false,
                    message: `메모리 임계값 설정 실패: ${error}`
                };
            }
        });
        // 앱 재시작
        electron_1.ipcMain.handle('restartApp', async (event, reason) => {
            try {
                console.log(`🔄 애플리케이션 재시작 요청: ${reason || '설정 변경'}`);
                // 잠시 대기 후 재시작 (UI에 피드백 시간 제공)
                setTimeout(() => {
                    electron_1.app.relaunch();
                    electron_1.app.exit(0);
                }, 1000);
                return {
                    success: true,
                    message: '애플리케이션이 재시작됩니다...'
                };
            }
            catch (error) {
                console.error('❌ 앱 재시작 실패:', error);
                return {
                    success: false,
                    message: `재시작 실패: ${error}`
                };
            }
        });
        this.isRegistered = true;
        console.log('설정 IPC 핸들러 등록 완료');
    }
    /**
     * GPU 사용 가능 여부 확인
     */
    async checkGPUAvailability() {
        try {
            // GPU 정보 확인 로직 (간단한 구현)
            return electron_1.app.commandLine.hasSwitch('disable-gpu') ? false : true;
        }
        catch (error) {
            console.error('GPU 사용 가능 여부 확인 실패:', error);
            return false;
        }
    }
    /**
     * 핸들러 정리
     */
    cleanup() {
        if (this.isRegistered) {
            // IPC 핸들러 제거는 Electron에서 자동으로 처리됨
            this.isRegistered = false;
            console.log('설정 IPC 핸들러 정리 완료');
        }
    }
}
exports.SettingsIpcHandlers = SettingsIpcHandlers;
exports.default = SettingsIpcHandlers.getInstance();
//# sourceMappingURL=settingsIpcHandlers.js.map