"use strict";
/**
 * Update Manager for Loop 6
 * Auto-update system with TypeScript and modern architecture
 * Features: Update checking, downloading, installation, notifications
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
exports.updateManager = exports.UpdateManager = exports.UpdateStatus = void 0;
exports.initializeUpdates = initializeUpdates;
exports.checkForUpdates = checkForUpdates;
exports.startPeriodicUpdateChecks = startPeriodicUpdateChecks;
exports.stopPeriodicUpdateChecks = stopPeriodicUpdateChecks;
exports.getUpdateState = getUpdateState;
exports.isUpdateSupported = isUpdateSupported;
const electron_1 = require("electron");
// import { autoUpdater } from 'electron-updater';
// import { is } from 'electron-util'; // 모듈이 없어서 주석 처리
const log = __importStar(require("electron-log"));
const events_1 = require("events");
const utils_1 = require("./utils");
// 플랫폼 확인을 위한 헬퍼
const is = {
    development: process.env.NODE_ENV === 'development',
    macos: process.platform === 'darwin',
    windows: process.platform === 'win32'
};
// Update Types and Interfaces
var UpdateStatus;
(function (UpdateStatus) {
    UpdateStatus["IDLE"] = "idle";
    UpdateStatus["CHECKING"] = "checking";
    UpdateStatus["AVAILABLE"] = "available";
    UpdateStatus["NOT_AVAILABLE"] = "not-available";
    UpdateStatus["DOWNLOADING"] = "downloading";
    UpdateStatus["DOWNLOADED"] = "downloaded";
    UpdateStatus["ERROR"] = "error";
})(UpdateStatus || (exports.UpdateStatus = UpdateStatus = {}));
/**
 * Update Manager Class
 * Handles application auto-updates with comprehensive error handling
 */
class UpdateManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.updateServerUrl = '';
        this.checkInterval = 60 * 60 * 1000; // 1 hour
        this.updateCheckTimer = null;
        this.state = {
            status: UpdateStatus.IDLE,
            available: false,
            downloaded: false,
            error: null,
            info: null,
            lastCheck: null
        };
        this.isInitialized = false;
        this.isSupported = false;
        this.options = {
            server: 'https://update.loop.com',
            interval: 60 * 60 * 1000,
            autoDownload: true,
            autoInstall: false,
            checkOnStartup: true,
            allowPrerelease: false,
            enableLogging: true
        };
        this.checkPlatformSupport();
    }
    static getInstance() {
        if (!UpdateManager.instance) {
            UpdateManager.instance = new UpdateManager();
        }
        return UpdateManager.instance;
    }
    /**
   * Check if auto-updates are supported on current platform
     */
    checkPlatformSupport() {
        // Auto-update is disabled in development
        if (is.development || !electron_1.app.isPackaged) {
            (0, utils_1.debugLog)('[UpdateManager] Auto-update disabled in development mode');
            this.isSupported = false;
            return;
        }
        // Check platform support
        if (!(is.macos || is.windows)) {
            (0, utils_1.debugLog)('[UpdateManager] Auto-update not supported on platform: ${process.platform}');
            this.isSupported = false;
            return;
        }
        this.isSupported = true;
    }
    /**
     * Initialize the auto-updater
   */
    async initialize(options = {}) {
        if (this.isInitialized) {
            (0, utils_1.debugLog)('[UpdateManager] Already initialized');
            return true;
        }
        if (!this.isSupported) {
            (0, utils_1.debugLog)('[UpdateManager] Auto-update not supported, skipping initialization');
            return false;
        }
        try {
            // Merge options
            this.options = { ...this.options, ...options };
            this.updateServerUrl = this.options.server || '';
            this.checkInterval = this.options.interval || 60 * 60 * 1000;
            // Setup logging if enabled
            if (this.options.enableLogging) {
                this.setupLogging();
            }
            // Setup auto-updater events
            this.setupAutoUpdaterEvents();
            // Setup IPC handlers
            this.setupIpcHandlers();
            // Configure auto-updater
            this.configureAutoUpdater();
            this.isInitialized = true;
            (0, utils_1.debugLog)('[UpdateManager] Initialized successfully');
            // Check for updates on startup if enabled
            if (this.options.checkOnStartup) {
                setTimeout(() => {
                    this.checkForUpdates();
                }, 5000); // Wait 5 seconds after startup
            }
            return true;
        }
        catch (error) {
            console.error('[UpdateManager] Initialization failed:', error);
            this.state.status = UpdateStatus.ERROR;
            this.state.error = error;
            return false;
        }
    }
    /**
   * Setup logging configuration
     */
    setupLogging() {
        try {
            log.transports.file.level = 'info';
            log.transports.console.level = 'info';
            // Configure auto-updater logging
            electron_1.autoUpdater.logger = log;
        }
        catch (error) {
            console.error('[UpdateManager] Logging setup failed:', error);
        }
    }
    /**
     * Setup auto-updater event handlers
     */
    setupAutoUpdaterEvents() {
        electron_1.autoUpdater.on('checking-for-update', () => {
            (0, utils_1.debugLog)('[UpdateManager] Checking for updates...');
            this.state.status = UpdateStatus.CHECKING;
            this.state.error = null;
            this.emit('checking-for-update');
            this.notifyRenderer('update-checking');
        });
        electron_1.autoUpdater.on('update-available', (info) => {
            (0, utils_1.debugLog)('[UpdateManager] Update available:', info);
            this.state.status = UpdateStatus.AVAILABLE;
            this.state.available = true;
            this.state.info = this.parseUpdateInfo(info);
            this.emit('update-available', this.state.info);
            this.notifyRenderer('update-available', this.state.info);
            // Show notification to user
            this.showUpdateAvailableNotification();
        });
        electron_1.autoUpdater.on('update-not-available', (info) => {
            (0, utils_1.debugLog)('[UpdateManager] Update not available');
            this.state.status = UpdateStatus.NOT_AVAILABLE;
            this.state.available = false;
            this.state.lastCheck = new Date();
            this.emit('update-not-available');
            this.notifyRenderer('update-not-available');
        });
        electron_1.autoUpdater.on('download-progress', (progressObj) => {
            this.state.status = UpdateStatus.DOWNLOADING;
            this.state.progress = {
                percent: progressObj.percent,
                bytesPerSecond: progressObj.bytesPerSecond,
                total: progressObj.total,
                transferred: progressObj.transferred
            };
            this.emit('download-progress', this.state.progress);
            this.notifyRenderer('update-download-progress', this.state.progress);
        });
        electron_1.autoUpdater.on('update-downloaded', (info) => {
            (0, utils_1.debugLog)('[UpdateManager] Update downloaded');
            this.state.status = UpdateStatus.DOWNLOADED;
            this.state.downloaded = true;
            this.emit('update-downloaded', this.state.info);
            this.notifyRenderer('update-downloaded', this.state.info);
            // Show installation prompt
            this.showUpdateDownloadedNotification();
        });
        electron_1.autoUpdater.on('error', (error) => {
            console.error('[UpdateManager] Auto-updater error:', error);
            this.state.status = UpdateStatus.ERROR;
            this.state.error = error;
            this.emit('error', error);
            this.notifyRenderer('update-error', { message: error.message });
        });
    }
    /**
     * Configure auto-updater settings
     */
    configureAutoUpdater() {
        try {
            if (this.updateServerUrl) {
                electron_1.autoUpdater.setFeedURL({
                    url: this.updateServerUrl,
                    serverType: 'json'
                });
            }
            // Configure auto-download
            electron_1.autoUpdater.autoDownload = this.options.autoDownload || false;
            electron_1.autoUpdater.autoInstallOnAppQuit = this.options.autoInstall || false;
            // Configure prerelease
            if (this.options.allowPrerelease) {
                electron_1.autoUpdater.allowPrerelease = true;
            }
        }
        catch (error) {
            console.error('[UpdateManager] Auto-updater configuration failed:', error);
        }
    }
    /**
     * Setup IPC handlers for renderer communication
     */
    setupIpcHandlers() {
        electron_1.ipcMain.handle('update:check', async () => {
            return await this.checkForUpdates();
        });
        electron_1.ipcMain.handle('update:download', async () => {
            return await this.downloadUpdate();
        });
        electron_1.ipcMain.handle('update:install', async () => {
            return this.installUpdate();
        });
        electron_1.ipcMain.handle('update:get-state', () => {
            return this.getState();
        });
        electron_1.ipcMain.handle('update:set-auto-download', (event, enabled) => {
            this.setAutoDownload(enabled);
        });
        electron_1.ipcMain.handle('update:set-check-interval', (event, interval) => {
            this.setCheckInterval(interval);
        });
    }
    /**
     * Parse update info from auto-updater
   */
    parseUpdateInfo(info) {
        return {
            version: info.version || 'unknown',
            releaseDate: info.releaseDate || new Date().toISOString(),
            releaseNotes: info.releaseNotes || '',
            size: info.files?.[0]?.size || 0,
            url: info.files?.[0]?.url || ''
        };
    }
    /**
     * Notify renderer process about update events
     */
    notifyRenderer(event, data) {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (mainWindow) {
            mainWindow.webContents.send(`update:${event}`, data);
        }
    }
    /**
   * Show update available notification
     */
    async showUpdateAvailableNotification() {
        try {
            const response = await electron_1.dialog.showMessageBox({
                type: 'info',
                title: 'Update Available',
                message: `A new version (${this.state.info?.version}) is available.`,
                detail: 'Would you like to download it now?',
                buttons: ['Download Now', 'Later'],
                defaultId: 0,
                cancelId: 1
            });
            if (response.response === 0) {
                await this.downloadUpdate();
            }
        }
        catch (error) {
            console.error('[UpdateManager] Update notification failed:', error);
        }
    }
    /**
     * Show update downloaded notification
     */
    async showUpdateDownloadedNotification() {
        try {
            const response = await electron_1.dialog.showMessageBox({
                type: 'info',
                title: 'Update Ready',
                message: 'Update has been downloaded.',
                detail: 'Would you like to restart and install it now?',
                buttons: ['Restart Now', 'Later'],
                defaultId: 0,
                cancelId: 1
            });
            if (response.response === 0) {
                this.installUpdate();
            }
        }
        catch (error) {
            console.error('[UpdateManager] Install notification failed:', error);
        }
    }
    /**
     * Check for updates manually
     */
    async checkForUpdates() {
        if (!this.isSupported || !this.isInitialized) {
            return false;
        }
        try {
            (0, utils_1.debugLog)('[UpdateManager] Manually checking for updates');
            electron_1.autoUpdater.checkForUpdates();
            return true;
        }
        catch (error) {
            console.error('[UpdateManager] Manual update check failed:', error);
            this.state.status = UpdateStatus.ERROR;
            this.state.error = error;
            return false;
        }
    }
    /**
     * Download available update
     */
    async downloadUpdate() {
        if (!this.state.available || !this.isSupported) {
            return false;
        }
        try {
            (0, utils_1.debugLog)('[UpdateManager] Starting update download');
            electron_1.autoUpdater.downloadUpdate();
            return true;
        }
        catch (error) {
            console.error('[UpdateManager] Update download failed:', error);
            this.state.status = UpdateStatus.ERROR;
            this.state.error = error;
            return false;
        }
    }
    /**
     * Install downloaded update
     */
    installUpdate() {
        if (!this.state.downloaded || !this.isSupported) {
            return false;
        }
        try {
            (0, utils_1.debugLog)('[UpdateManager] Installing update and restarting');
            electron_1.autoUpdater.quitAndInstall();
            return true;
        }
        catch (error) {
            console.error('[UpdateManager] Update installation failed:', error);
            this.state.status = UpdateStatus.ERROR;
            this.state.error = error;
            return false;
        }
    }
    /**
     * Start automatic update checking
   */
    startPeriodicChecks() {
        if (!this.isSupported || this.updateCheckTimer) {
            return;
        }
        this.updateCheckTimer = setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
        (0, utils_1.debugLog)('[UpdateManager] Started periodic checks every ${this.checkInterval / 1000 / 60} minutes');
    }
    /**
   * Stop automatic update checking
   */
    stopPeriodicChecks() {
        if (this.updateCheckTimer) {
            clearInterval(this.updateCheckTimer);
            this.updateCheckTimer = null;
            (0, utils_1.debugLog)('[UpdateManager] Stopped periodic checks');
        }
    }
    /**
   * Set auto-download preference
     */
    setAutoDownload(enabled) {
        this.options.autoDownload = enabled;
        electron_1.autoUpdater.autoDownload = enabled;
        (0, utils_1.debugLog)(`[UpdateManager] Auto-download ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Set update check interval
     */
    setCheckInterval(interval) {
        this.checkInterval = Math.max(interval, 60000); // Minimum 1 minute
        // Restart periodic checks with new interval
        if (this.updateCheckTimer) {
            this.stopPeriodicChecks();
            this.startPeriodicChecks();
        }
        (0, utils_1.debugLog)('[UpdateManager] Check interval set to ${this.checkInterval / 1000 / 60} minutes');
    }
    /**
     * Get current update state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Check if updates are supported
   */
    isUpdateSupported() {
        return this.isSupported;
    }
    /**
     * Get update server URL
     */
    getServerUrl() {
        return this.updateServerUrl;
    }
    /**
     * Set update server URL
     */
    setServerUrl(url) {
        this.updateServerUrl = url;
        if (this.isInitialized) {
            this.configureAutoUpdater();
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopPeriodicChecks();
        this.removeAllListeners();
        if (this.isSupported) {
            electron_1.autoUpdater.removeAllListeners();
        }
        this.isInitialized = false;
        (0, utils_1.debugLog)('[UpdateManager] Destroyed successfully');
    }
}
exports.UpdateManager = UpdateManager;
// Export singleton instance
exports.updateManager = UpdateManager.getInstance();
// Export convenience functions
async function initializeUpdates(options) {
    return await exports.updateManager.initialize(options);
}
async function checkForUpdates() {
    return await exports.updateManager.checkForUpdates();
}
function startPeriodicUpdateChecks() {
    exports.updateManager.startPeriodicChecks();
}
function stopPeriodicUpdateChecks() {
    exports.updateManager.stopPeriodicChecks();
}
function getUpdateState() {
    return exports.updateManager.getState();
}
function isUpdateSupported() {
    return exports.updateManager.isUpdateSupported();
}
//# sourceMappingURL=update-manager.js.map