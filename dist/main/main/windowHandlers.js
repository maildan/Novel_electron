"use strict";
/**
 * Loop 6 윈도우 관리 IPC 핸들러
 *
 * Loop 3의 window-handlers.js를 TypeScript로 완전 마이그레이션
 * 윈도우 모드 변경, 미니뷰, 창 제어 등 UI 관련 기능을 처리합니다.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWindowHandlers = registerWindowHandlers;
exports.initializeWindowHandlers = initializeWindowHandlers;
exports.cleanupWindowHandlers = cleanupWindowHandlers;
const electron_1 = require("electron");
const window_1 = require("./window");
const settings_manager_1 = __importDefault(require("./settings-manager"));
// 전역 윈도우 핸들러 상태
const windowState = {
    isRegistered: false,
    windowManager: null
};
/**
 * 윈도우 모드 적용
 */
function applyWindowMode(mode) {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (!mainWindow) {
            console.error('메인 윈도우를 찾을 수 없습니다');
            return false;
        }
        console.log('윈도우 모드 적용: ${mode}');
        switch (mode) {
            case 'windowed':
                mainWindow.setFullScreen(false);
                mainWindow.setAlwaysOnTop(false);
                mainWindow.show();
                mainWindow.focus();
                break;
            case 'fullscreen':
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setFullScreen(true);
                break;
            case 'maximized':
                mainWindow.setFullScreen(false);
                mainWindow.setAlwaysOnTop(false);
                mainWindow.maximize();
                break;
            case 'fullscreen-auto-hide':
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setFullScreen(true);
                mainWindow.setAutoHideMenuBar(true);
                break;
            default:
                console.error('지원되지 않는 윈도우 모드: ${mode}');
                return false;
        }
        // Setup 저장
        settings_manager_1.default.updateSetting('windowMode', mode);
        console.log('윈도우 모드 적용 Completed: ${mode}');
        return true;
    }
    catch (error) {
        console.error('윈도우 모드 적용 Error:', error);
        return false;
    }
}
/**
 * 윈도우 위치 및 크기 Setup
 */
function setWindowBounds(bounds) {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (!mainWindow) {
            console.error('메인 윈도우를 찾을 수 없습니다');
            return false;
        }
        if (bounds.width !== undefined && bounds.height !== undefined) {
            mainWindow.setSize(bounds.width, bounds.height);
        }
        if (bounds.x !== undefined && bounds.y !== undefined) {
            mainWindow.setPosition(bounds.x, bounds.y);
        }
        console.log('윈도우 크기/위치 Setup Completed:', bounds);
        return true;
    }
    catch (error) {
        console.error('윈도우 크기/위치 Setup Error:', error);
        return false;
    }
}
/**
 * 윈도우 상태 정보 가져오기
 */
function getWindowStatus() {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (!mainWindow) {
            return { error: '메인 윈도우를 찾을 수 없습니다' };
        }
        const bounds = mainWindow.getBounds();
        const settings = settings_manager_1.default.getSettings();
        return {
            mode: settings.windowMode || 'windowed',
            bounds,
            isFullScreen: mainWindow.isFullScreen(),
            isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
            isVisible: mainWindow.isVisible(),
            isMinimized: mainWindow.isMinimized(),
            isMaximized: mainWindow.isMaximized(),
            isFocused: mainWindow.isFocused(),
            title: mainWindow.getTitle()
        };
    }
    catch (error) {
        console.error('윈도우 상태 조회 Error:', error);
        return { error: error.message };
    }
}
/**
 * 윈도우 투명도 Setup
 */
function setWindowOpacity(opacity) {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (!mainWindow) {
            console.error('메인 윈도우를 찾을 수 없습니다');
            return false;
        }
        // 0.0 ~ 1.0 범위로 제한
        const clampedOpacity = Math.max(0.0, Math.min(1.0, opacity));
        mainWindow.setOpacity(clampedOpacity);
        // Setup 저장
        settings_manager_1.default.updateSetting('windowOpacity', clampedOpacity);
        console.log('윈도우 투명도 Setup: ${clampedOpacity}');
        return true;
    }
    catch (error) {
        console.error('윈도우 투명도 Setup Error:', error);
        return false;
    }
}
/**
 * 윈도우 항상 위에 Setup
 */
function setAlwaysOnTop(alwaysOnTop) {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (!mainWindow) {
            console.error('메인 윈도우를 찾을 수 없습니다');
            return false;
        }
        mainWindow.setAlwaysOnTop(alwaysOnTop);
        // Setup 저장
        settings_manager_1.default.updateSetting('alwaysOnTop', alwaysOnTop);
        console.log('윈도우 항상 위에 Setup: ${alwaysOnTop}');
        return true;
    }
    catch (error) {
        console.error('윈도우 항상 위에 Setup Error:', error);
        return false;
    }
}
/**
 * 모든 윈도우에 상태 브로드캐스트
 */
function broadcastWindowStatus() {
    try {
        const status = getWindowStatus();
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('window-status-update', status);
            }
        });
    }
    catch (error) {
        console.error('윈도우 상태 브로드캐스트 Error:', error);
    }
}
/**
 * IPC 핸들러 등록
 */
function registerWindowHandlers() {
    if (windowState.isRegistered) {
        console.log('윈도우 관련 IPC 핸들러가 이미 등록되어 있습니다');
        return;
    }
    console.log('윈도우 관련 IPC 핸들러 등록 중...');
    // 윈도우 모드 변경 핸들러
    electron_1.ipcMain.handle('setWindowMode', async (event, mode) => {
        try {
            console.log('윈도우 모드 변경 요청: ${mode}');
            const success = applyWindowMode(mode);
            const status = getWindowStatus();
            // 상태 브로드캐스트
            broadcastWindowStatus();
            return {
                success,
                message: success ? `윈도우 모드가 ${mode}로 변경되었습니다` : '윈도우 모드 변경 Failed',
                mode,
                status
            };
        }
        catch (error) {
            console.error('윈도우 모드 변경 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 상태 조회 핸들러
    electron_1.ipcMain.handle('getWindowStatus', async () => {
        try {
            const status = getWindowStatus();
            return {
                success: true,
                status
            };
        }
        catch (error) {
            console.error('윈도우 상태 조회 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 크기/위치 Setup 핸들러
    electron_1.ipcMain.handle('setWindowBounds', async (event, bounds) => {
        try {
            const success = setWindowBounds(bounds);
            const status = getWindowStatus();
            broadcastWindowStatus();
            return {
                success,
                message: success ? '윈도우 크기/위치 Setup Completed' : '윈도우 크기/위치 Setup Failed',
                status
            };
        }
        catch (error) {
            console.error('윈도우 크기/위치 Setup Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 투명도 Setup 핸들러
    electron_1.ipcMain.handle('setWindowOpacity', async (event, opacity) => {
        try {
            const success = setWindowOpacity(opacity);
            const status = getWindowStatus();
            return {
                success,
                message: success ? `윈도우 투명도가 ${opacity}로 Setup되었습니다` : '윈도우 투명도 Setup Failed',
                opacity,
                status
            };
        }
        catch (error) {
            console.error('윈도우 투명도 Setup Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 항상 위에 Setup 핸들러
    electron_1.ipcMain.handle('setAlwaysOnTop', async (event, alwaysOnTop) => {
        try {
            const success = setAlwaysOnTop(alwaysOnTop);
            const status = getWindowStatus();
            broadcastWindowStatus();
            return {
                success,
                message: success ? `항상 위에 Setup: ${alwaysOnTop}` : '항상 위에 Setup Failed',
                alwaysOnTop,
                status
            };
        }
        catch (error) {
            console.error('항상 위에 Setup Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 최소화 핸들러
    electron_1.ipcMain.handle('minimizeWindow', async () => {
        try {
            const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
            if (mainWindow) {
                mainWindow.minimize();
                return { success: true, message: '윈도우 최소화됨' };
            }
            return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
        }
        catch (error) {
            console.error('윈도우 최소화 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 최대화 핸들러
    electron_1.ipcMain.handle('maximizeWindow', async () => {
        try {
            const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
            if (mainWindow) {
                if (mainWindow.isMaximized()) {
                    mainWindow.unmaximize();
                }
                else {
                    mainWindow.maximize();
                }
                const status = getWindowStatus();
                broadcastWindowStatus();
                return { success: true, message: '윈도우 최대화 토글됨', status };
            }
            return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
        }
        catch (error) {
            console.error('윈도우 최대화 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 닫기 핸들러
    electron_1.ipcMain.handle('closeWindow', async () => {
        try {
            const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
            if (mainWindow) {
                mainWindow.close();
                return { success: true, message: '윈도우 닫기 요청됨' };
            }
            return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
        }
        catch (error) {
            console.error('윈도우 닫기 Error:', error);
            return { success: false, message: error.message };
        }
    });
    // 윈도우 포커스 핸들러
    electron_1.ipcMain.handle('focusWindow', async () => {
        try {
            const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
                return { success: true, message: '윈도우 포커스됨' };
            }
            return { success: false, message: '메인 윈도우를 찾을 수 없습니다' };
        }
        catch (error) {
            console.error('윈도우 포커스 Error:', error);
            return { success: false, message: error.message };
        }
    });
    windowState.isRegistered = true;
    console.log('윈도우 관련 IPC 핸들러 등록 Completed');
}
/**
 * 윈도우 핸들러 초기화
 */
function initializeWindowHandlers() {
    try {
        windowState.windowManager = window_1.WindowManager.getInstance();
        // Setup에서 초기 윈도우 모드 적용
        const settings = settings_manager_1.default.getSettings();
        if (settings.windowMode) {
            applyWindowMode(settings.windowMode);
        }
        console.log('윈도우 핸들러 초기화 Completed');
    }
    catch (error) {
        console.error('윈도우 핸들러 초기화 Error:', error);
    }
}
/**
 * 윈도우 핸들러 Cleanup
 */
function cleanupWindowHandlers() {
    windowState.isRegistered = false;
    windowState.windowManager = null;
    console.log('윈도우 핸들러 Cleanup Completed');
}
// 기본 내보내기
exports.default = {
    registerWindowHandlers,
    applyWindowMode,
    setWindowBounds,
    getWindowStatus,
    setWindowOpacity,
    setAlwaysOnTop,
    initializeWindowHandlers,
    cleanupWindowHandlers,
    broadcastWindowStatus
};
//# sourceMappingURL=windowHandlers.js.map