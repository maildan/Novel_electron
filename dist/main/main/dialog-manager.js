"use strict";
/**
 * Loop 6 대화상자 관리자
 * TypeScript 기반의 현대적인 대화상자 및 알림 시스템
 * 기능: 커스텀 대화상자, 시스템 대화상자, 알림, 프롬프트
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
exports.dialogManager = exports.DialogManager = exports.DialogType = void 0;
exports.showMessage = showMessage;
exports.showError = showError;
exports.showWarning = showWarning;
exports.showConfirmation = showConfirmation;
exports.showNotification = showNotification;
exports.showRestartPrompt = showRestartPrompt;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
// 대화상자 타입 및 인터페이스
var DialogType;
(function (DialogType) {
    DialogType["INFO"] = "info";
    DialogType["WARNING"] = "warning";
    DialogType["ERROR"] = "error";
    DialogType["QUESTION"] = "question";
})(DialogType || (exports.DialogType = DialogType = {}));
/**
 * 대화상자 관리자 클래스
 * 모든 유형의 대화상자 및 알림을 처리합니다
 */
class DialogManager {
    constructor() {
        this.customDialogs = new Map();
        this.notificationQueue = [];
        this.isProcessingNotifications = false;
        this.setupIpcHandlers();
    }
    static getInstance() {
        if (!DialogManager.instance) {
            DialogManager.instance = new DialogManager();
        }
        return DialogManager.instance;
    }
    /**
     * 렌더러 통신을 위한 IPC 핸들러 설정
     */
    setupIpcHandlers() {
        electron_1.ipcMain.handle('dialog:show-message', async (event, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-message, 발신자: ${event.sender.id}`);
            return await this.showMessageDialog(options);
        });
        electron_1.ipcMain.handle('dialog:show-open-file', async (event, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-open-file, 발신자: ${event.sender.id}`);
            return await this.showOpenFileDialog(options);
        });
        electron_1.ipcMain.handle('dialog:show-save-file', async (event, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-save-file, 발신자: ${event.sender.id}`);
            return await this.showSaveFileDialog(options);
        });
        electron_1.ipcMain.handle('dialog:show-folder', async (event, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-folder, 발신자: ${event.sender.id}`);
            return await this.showFolderDialog(options);
        });
        electron_1.ipcMain.handle('dialog:show-notification', async (event, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-notification, 발신자: ${event.sender.id}`);
            return await this.showNotification(options);
        });
        electron_1.ipcMain.handle('dialog:show-restart-prompt', async () => {
            return await this.showRestartPrompt();
        });
        electron_1.ipcMain.handle('dialog:show-custom', async (event, id, options) => {
            console.log(`[DialogManager] IPC 요청 받음: show-custom, ID: ${id}, 발신자: ${event.sender.id}`);
            return await this.showCustomDialog(id, options);
        });
        electron_1.ipcMain.handle('dialog:close-custom', async (event, id) => {
            console.log(`[DialogManager] IPC 요청 받음: close-custom, ID: ${id}, 발신자: ${event.sender.id}`);
            return this.closeCustomDialog(id);
        });
    }
    /**
     * 시스템 메시지 대화상자 표시
     */
    async showMessageDialog(options) {
        try {
            const parentWindow = electron_1.BrowserWindow.getFocusedWindow() ||
                electron_1.BrowserWindow.getAllWindows()[0];
            const result = await electron_1.dialog.showMessageBox(parentWindow, {
                type: options.type,
                title: options.title,
                message: options.message,
                detail: options.detail,
                buttons: options.buttons || ['OK'],
                defaultId: options.defaultId || 0,
                cancelId: options.cancelId || 0,
                icon: options.icon,
                noLink: options.noLink,
                normalizeAccessKeys: options.normalizeAccessKeys
            });
            return result;
        }
        catch (error) {
            console.error('[DialogManager] Message dialog failed:', error);
            return { response: 0 };
        }
    }
    /**
     * Show open file dialog
     */
    async showOpenFileDialog(options = {}) {
        try {
            const parentWindow = electron_1.BrowserWindow.getFocusedWindow() ||
                electron_1.BrowserWindow.getAllWindows()[0];
            const result = await electron_1.dialog.showOpenDialog(parentWindow, {
                title: options.title || 'Select File',
                defaultPath: options.defaultPath,
                buttonLabel: options.buttonLabel,
                filters: options.filters || [
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: options.properties || ['openFile']
            });
            return result;
        }
        catch (error) {
            console.error('[DialogManager] Open file dialog failed:', error);
            return { canceled: true, filePaths: [] };
        }
    }
    /**
     * Show save file dialog
     */
    async showSaveFileDialog(options = {}) {
        try {
            const parentWindow = electron_1.BrowserWindow.getFocusedWindow() ||
                electron_1.BrowserWindow.getAllWindows()[0];
            const result = await electron_1.dialog.showSaveDialog(parentWindow, {
                title: options.title || 'Save File',
                defaultPath: options.defaultPath,
                buttonLabel: options.buttonLabel,
                filters: options.filters || [
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            return result;
        }
        catch (error) {
            console.error('[DialogManager] Save file dialog failed:', error);
            return { canceled: true };
        }
    }
    /**
     * Show folder selection dialog
     */
    async showFolderDialog(options = {}) {
        try {
            const parentWindow = electron_1.BrowserWindow.getFocusedWindow() ||
                electron_1.BrowserWindow.getAllWindows()[0];
            const result = await electron_1.dialog.showOpenDialog(parentWindow, {
                title: options.title || 'Select Folder',
                defaultPath: options.defaultPath,
                buttonLabel: options.buttonLabel,
                properties: ['openDirectory', ...(options.properties || [])]
            });
            return result;
        }
        catch (error) {
            console.error('[DialogManager] Folder dialog failed:', error);
            return { canceled: true, filePaths: [] };
        }
    }
    /**
     * Show system notification
     */
    async showNotification(options) {
        try {
            // 알림 지원 여부 확인
            if (!electron_1.Notification.isSupported()) {
                (0, utils_1.debugLog)('[DialogManager] Notifications not supported on this platform');
                return false;
            }
            // 속도 제한을 위해 큐에 추가
            this.notificationQueue.push(options);
            if (!this.isProcessingNotifications) {
                this.processNotificationQueue();
            }
            return true;
        }
        catch (error) {
            console.error('[DialogManager] Notification failed:', error);
            return false;
        }
    }
    /**
     * Process notification queue to avoid spam
     */
    async processNotificationQueue() {
        this.isProcessingNotifications = true;
        while (this.notificationQueue.length > 0) {
            const options = this.notificationQueue.shift();
            if (!options)
                continue;
            try {
                // 알림 생성 시 지원되는 옵션만 사용
                const notificationOptions = {
                    title: options.title,
                    body: options.body
                };
                if (options.icon)
                    notificationOptions.icon = options.icon;
                if (options.silent !== undefined)
                    notificationOptions.silent = options.silent;
                const notification = new electron_1.Notification(notificationOptions);
                notification.show();
                // 속도 제한: 알림 간 대기 시간
                if (this.notificationQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                console.error('[DialogManager] Individual notification failed:', error);
            }
        }
        this.isProcessingNotifications = false;
    }
    /**
     * Show restart prompt dialog
     */
    async showRestartPrompt(message = 'Application needs to restart to apply changes.', title = 'Restart Required') {
        try {
            const options = {
                type: DialogType.QUESTION,
                title,
                message,
                detail: 'Do you want to restart now or later?',
                buttons: ['Restart Now', 'Later'],
                defaultId: 0,
                cancelId: 1
            };
            const result = await this.showMessageDialog(options);
            if (result.response === 0) {
                (0, utils_1.debugLog)('[DialogManager] User chose to restart now');
                // 잠시 후 재시작 예약
                setTimeout(() => {
                    electron_1.app.relaunch();
                    electron_1.app.exit(0);
                }, 1000);
            }
            else {
                (0, utils_1.debugLog)('[DialogManager] User chose to restart later');
            }
            return result.response;
        }
        catch (error) {
            console.error('[DialogManager] Restart prompt failed:', error);
            return 1; // Default to "Later"
        }
    }
    /**
     * Show error dialog with details
     */
    async showErrorDialog(title, message, detail) {
        await this.showMessageDialog({
            type: DialogType.ERROR,
            title,
            message,
            detail,
            buttons: ['OK']
        });
    }
    /**
     * Show warning dialog
     */
    async showWarningDialog(title, message, detail) {
        const result = await this.showMessageDialog({
            type: DialogType.WARNING,
            title,
            message,
            detail,
            buttons: ['OK', 'Cancel'],
            defaultId: 0,
            cancelId: 1
        });
        return result.response === 0;
    }
    /**
     * Show confirmation dialog
     */
    async showConfirmationDialog(title, message, detail) {
        const result = await this.showMessageDialog({
            type: DialogType.QUESTION,
            title,
            message,
            detail,
            buttons: ['Yes', 'No'],
            defaultId: 0,
            cancelId: 1
        });
        return result.response === 0;
    }
    /**
     * Show custom HTML dialog window
     */
    async showCustomDialog(id, options) {
        try {
            // 같은 ID로 기존 대화상자 닫기
            this.closeCustomDialog(id);
            const parentWindow = electron_1.BrowserWindow.getFocusedWindow() ||
                electron_1.BrowserWindow.getAllWindows()[0];
            const dialogWindow = new electron_1.BrowserWindow({
                width: options.width || 400,
                height: options.height || 300,
                resizable: options.resizable !== false,
                modal: options.modal !== false,
                parent: parentWindow,
                alwaysOnTop: options.alwaysOnTop || false,
                skipTaskbar: options.skipTaskbar !== false,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'preload.js')
                }
            });
            // 콘텐츠 로드
            if (options.htmlContent) {
                await dialogWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(options.htmlContent)}`);
            }
            else {
                await dialogWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dialog.html'));
            }
            // 제공된 경우 대화상자에 데이터 전달
            if (options.data) {
                dialogWindow.webContents.send('dialog-data', options.data);
            }
            // 대화상자 표시
            dialogWindow.show();
            // 참조 저장
            this.customDialogs.set(id, dialogWindow);
            // 닫힐 때 정리
            dialogWindow.on('closed', () => {
                this.customDialogs.delete(id);
            });
            return dialogWindow;
        }
        catch (error) {
            console.error('[DialogManager] Custom dialog creation failed:', error);
            return null;
        }
    }
    /**
     * Close custom dialog
     */
    closeCustomDialog(id) {
        const dialog = this.customDialogs.get(id);
        if (dialog && !dialog.isDestroyed()) {
            dialog.close();
            this.customDialogs.delete(id);
            return true;
        }
        return false;
    }
    /**
     * Close all custom dialogs
     */
    closeAllCustomDialogs() {
        for (const [id, dialog] of this.customDialogs) {
            console.log(`[DialogManager] 커스텀 다이얼로그 닫는 중: ${id}`);
            if (!dialog.isDestroyed()) {
                dialog.close();
            }
        }
        this.customDialogs.clear();
    }
    /**
     * Show about dialog
     */
    async showAboutDialog() {
        const options = {
            applicationName: electron_1.app.getName(),
            applicationVersion: electron_1.app.getVersion(),
            copyright: `© ${new Date().getFullYear()} Loop`,
            authors: ['Loop Team'],
            website: 'https://loop.app',
            iconPath: path.join(__dirname, '..', 'assets', 'icon.png')
        };
        try {
            // macOS에서는 app.showAboutPanel 사용
            if (process.platform === 'darwin') {
                electron_1.app.showAboutPanel();
            }
            else {
                // 다른 플랫폼에서는 메시지 다이얼로그 사용
                await this.showMessageDialog({
                    type: DialogType.INFO,
                    title: 'About',
                    message: `${options.applicationName} v${options.applicationVersion}`,
                    detail: `${options.copyright}\nWebsite: ${options.website}`,
                    buttons: ['OK']
                });
            }
        }
        catch (error) {
            console.error('[DialogManager] About dialog failed:', error);
        }
    }
    /**
     * Get list of active custom dialogs
     */
    getActiveDialogs() {
        return Array.from(this.customDialogs.keys());
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.closeAllCustomDialogs();
        this.notificationQueue.length = 0;
        this.isProcessingNotifications = false;
    }
}
exports.DialogManager = DialogManager;
// 싱글톤 인스턴스 내보내기
exports.dialogManager = DialogManager.getInstance();
// 편의 함수 내보내기
async function showMessage(options) {
    return await exports.dialogManager.showMessageDialog(options);
}
async function showError(title, message, detail) {
    return await exports.dialogManager.showErrorDialog(title, message, detail);
}
async function showWarning(title, message, detail) {
    return await exports.dialogManager.showWarningDialog(title, message, detail);
}
async function showConfirmation(title, message, detail) {
    return await exports.dialogManager.showConfirmationDialog(title, message, detail);
}
async function showNotification(options) {
    return await exports.dialogManager.showNotification(options);
}
async function showRestartPrompt(message, title) {
    return await exports.dialogManager.showRestartPrompt(message, title);
}
//# sourceMappingURL=dialog-manager.js.map