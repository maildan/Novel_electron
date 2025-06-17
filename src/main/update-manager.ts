/**
 * Update Manager for Loop 6
 * Auto-update system with TypeScript and modern architecture
 * Features: Update checking, downloading, installation, notifications
 */

import { app, autoUpdater, dialog, BrowserWindow, ipcMain } from 'electron';
// import { autoUpdater } from 'electron-updater';
// import { is } from 'electron-util'; // 모듈이 없어서 주석 처리
import * as log from 'electron-log';
import { EventEmitter } from 'events';
import { debugLog } from './utils';

// 플랫폼 확인을 위한 헬퍼
const is = {
  development: process.env.NODE_ENV === 'development',
  macos: process.platform === 'darwin',
  windows: process.platform === 'win32'
};

// Update Types and Interfaces
export enum UpdateStatus {
  IDLE = 'idle',
  CHECKING = 'checking',
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'not-available',
  DOWNLOADING = 'downloading',
  DOWNLOADED = 'downloaded',
  ERROR = 'error'
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  size?: number;
  url?: string;
}

export interface UpdateOptions {
  server?: string;
  interval?: number;
  autoDownload?: boolean;
  autoInstall?: boolean;
  checkOnStartup?: boolean;
  allowPrerelease?: boolean;
  enableLogging?: boolean;
}

export interface UpdateState {
  status: UpdateStatus;
  available: boolean;
  downloaded: boolean;
  error: Error | null;
  info: UpdateInfo | null;
  lastCheck: Date | null;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    total: number;
    transferred: number;
  };
}

/**
 * Update Manager Class
 * Handles application auto-updates with comprehensive error handling
 */
export class UpdateManager extends EventEmitter {
  private static instance: UpdateManager;
  
  private updateServerUrl = '';
  private checkInterval = 60 * 60 * 1000; // 1 hour
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private options: UpdateOptions;
  
  private state: UpdateState = {
    status: UpdateStatus.IDLE,
    available: false,
    downloaded: false,
    error: null,
    info: null,
    lastCheck: null
  };
  
  private isInitialized = false;
  private isSupported = false;
  
  private constructor() {
    super();
    
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
  
  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }
  
  /**
 * Check if auto-updates are supported on current platform
   */
  private checkPlatformSupport(): void {
    // Auto-update is disabled in development
    if (is.development || !app.isPackaged) {
      debugLog('[UpdateManager] Auto-update disabled in development mode');
      this.isSupported = false;
      return;
    }
    
    // Check platform support
    if (!(is.macos || is.windows)) {
      debugLog('[UpdateManager] Auto-update not supported on platform: ${process.platform}');
      this.isSupported = false;
      return;
    }
    
    this.isSupported = true;
  }
  
  /**
   * Initialize the auto-updater
 */
  public async initialize(options: Partial<UpdateOptions> = {}): Promise<boolean> {
    if (this.isInitialized) {
      debugLog('[UpdateManager] Already initialized');
      return true;
    }
    
    if (!this.isSupported) {
      debugLog('[UpdateManager] Auto-update not supported, skipping initialization');
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
      debugLog('[UpdateManager] Initialized successfully');
      
      // Check for updates on startup if enabled
      if (this.options.checkOnStartup) {
        setTimeout(() => {
          this.checkForUpdates();
        }, 5000); // Wait 5 seconds after startup
      }
      
      return true;
      
    } catch (error) {
      console.error('[UpdateManager] Initialization failed:', error);
      this.state.status = UpdateStatus.ERROR;
      this.state.error = error as Error;
      return false;
    }
  }
  
  /**
 * Setup logging configuration
   */
  private setupLogging(): void {
    try {
      log.transports.file.level = 'info';
      log.transports.console.level = 'info';
      
      // Configure auto-updater logging
      (autoUpdater as any).logger = log;
      
    } catch (error) {
      console.error('[UpdateManager] Logging setup failed:', error);
    }
  }
  
  /**
   * Setup auto-updater event handlers
   */
  private setupAutoUpdaterEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      debugLog('[UpdateManager] Checking for updates...');
      this.state.status = UpdateStatus.CHECKING;
      this.state.error = null;
      this.emit('checking-for-update');
      this.notifyRenderer('update-checking');
    });
    
    (autoUpdater as any).on('update-available', (info: any) => {
      debugLog('[UpdateManager] Update available:', info);
      this.state.status = UpdateStatus.AVAILABLE;
      this.state.available = true;
      this.state.info = this.parseUpdateInfo(info);
      this.emit('update-available', this.state.info);
      this.notifyRenderer('update-available', this.state.info);
      
      // Show notification to user
      this.showUpdateAvailableNotification();
    });
    
    (autoUpdater as any).on('update-not-available', (_info: any) => {
      debugLog('[UpdateManager] Update not available');
      this.state.status = UpdateStatus.NOT_AVAILABLE;
      this.state.available = false;
      this.state.lastCheck = new Date();
      this.emit('update-not-available');
      this.notifyRenderer('update-not-available');
    });
    
    (autoUpdater as any).on('download-progress', (progressObj: any) => {
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
    
    autoUpdater.on('update-downloaded', (_info: any) => {
      debugLog('[UpdateManager] Update downloaded');
      this.state.status = UpdateStatus.DOWNLOADED;
      this.state.downloaded = true;
      this.emit('update-downloaded', this.state.info);
      this.notifyRenderer('update-downloaded', this.state.info);
      
      // Show installation prompt
      this.showUpdateDownloadedNotification();
    });
    
    autoUpdater.on('error', (error: any) => {
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
  private configureAutoUpdater(): void {
    try {
      if (this.updateServerUrl) {
        autoUpdater.setFeedURL({
          url: this.updateServerUrl,
          serverType: 'json'
        });
      }
      
      // Configure auto-download
      (autoUpdater as any).autoDownload = this.options.autoDownload || false;
      (autoUpdater as any).autoInstallOnAppQuit = this.options.autoInstall || false;
      
      // Configure prerelease
      if (this.options.allowPrerelease) {
        (autoUpdater as any).allowPrerelease = true;
      }
      
    } catch (error) {
      console.error('[UpdateManager] Auto-updater configuration failed:', error);
    }
  }
  
  /**
   * Setup IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    ipcMain.handle('update:check', async () => {
      return await this.checkForUpdates();
    });
    
    ipcMain.handle('update:download', async () => {
      return await this.downloadUpdate();
    });
    
    ipcMain.handle('update:install', async () => {
      return this.installUpdate();
    });
    
    ipcMain.handle('update:get-state', () => {
      return this.getState();
    });
    
    ipcMain.handle('update:set-auto-download', (event, enabled: boolean) => {
      this.setAutoDownload(enabled);
    });
    
    ipcMain.handle('update:set-check-interval', (event, interval: number) => {
      this.setCheckInterval(interval);
    });
  }
  
  /**
   * Parse update info from auto-updater
 */
  private parseUpdateInfo(info: any): UpdateInfo {
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
  private notifyRenderer(event: string, data?: any): void {
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
    if (mainWindow) {
      mainWindow.webContents.send(`update:${event}`, data);
    }
  }
  
  /**
 * Show update available notification
   */
  private async showUpdateAvailableNotification(): Promise<void> {
    try {
      const response = await dialog.showMessageBox({
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
      
    } catch (error) {
      console.error('[UpdateManager] Update notification failed:', error);
    }
  }
  
  /**
   * Show update downloaded notification
   */
  private async showUpdateDownloadedNotification(): Promise<void> {
    try {
      const response = await dialog.showMessageBox({
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
      
    } catch (error) {
      console.error('[UpdateManager] Install notification failed:', error);
    }
  }
  
  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!this.isSupported || !this.isInitialized) {
      return false;
    }
    
    try {
      debugLog('[UpdateManager] Manually checking for updates');
      autoUpdater.checkForUpdates();
      return true;
    } catch (error) {
      console.error('[UpdateManager] Manual update check failed:', error);
      this.state.status = UpdateStatus.ERROR;
      this.state.error = error as Error;
      return false;
    }
  }
  
  /**
   * Download available update
   */
  public async downloadUpdate(): Promise<boolean> {
    if (!this.state.available || !this.isSupported) {
      return false;
    }
    
    try {
      debugLog('[UpdateManager] Starting update download');
      (autoUpdater as any).downloadUpdate();
      return true;
    } catch (error) {
      console.error('[UpdateManager] Update download failed:', error);
      this.state.status = UpdateStatus.ERROR;
      this.state.error = error as Error;
      return false;
    }
  }
  
  /**
   * Install downloaded update
   */
  public installUpdate(): boolean {
    if (!this.state.downloaded || !this.isSupported) {
      return false;
    }
    
    try {
      debugLog('[UpdateManager] Installing update and restarting');
      autoUpdater.quitAndInstall();
      return true;
    } catch (error) {
      console.error('[UpdateManager] Update installation failed:', error);
      this.state.status = UpdateStatus.ERROR;
      this.state.error = error as Error;
      return false;
    }
  }
  
  /**
   * Start automatic update checking
 */
  public startPeriodicChecks(): void {
    if (!this.isSupported || this.updateCheckTimer) {
      return;
    }
    
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
    
    debugLog('[UpdateManager] Started periodic checks every ${this.checkInterval / 1000 / 60} minutes');
  }
  
  /**
 * Stop automatic update checking
 */
  public stopPeriodicChecks(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
      debugLog('[UpdateManager] Stopped periodic checks');
    }
  }
  
  /**
 * Set auto-download preference
   */
  public setAutoDownload(enabled: boolean): void {
    this.options.autoDownload = enabled;
    (autoUpdater as any).autoDownload = enabled;
    debugLog(`[UpdateManager] Auto-download ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Set update check interval
   */
  public setCheckInterval(interval: number): void {
    this.checkInterval = Math.max(interval, 60000); // Minimum 1 minute
    
    // Restart periodic checks with new interval
    if (this.updateCheckTimer) {
      this.stopPeriodicChecks();
      this.startPeriodicChecks();
    }
    
    debugLog('[UpdateManager] Check interval set to ${this.checkInterval / 1000 / 60} minutes');
  }
  
  /**
   * Get current update state
   */
  public getState(): UpdateState {
    return { ...this.state };
  }
  
  /**
   * Check if updates are supported
 */
  public isUpdateSupported(): boolean {
    return this.isSupported;
  }
  
  /**
   * Get update server URL
   */
  public getServerUrl(): string {
    return this.updateServerUrl;
  }
  
  /**
   * Set update server URL
   */
  public setServerUrl(url: string): void {
    this.updateServerUrl = url;
    if (this.isInitialized) {
      this.configureAutoUpdater();
    }
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopPeriodicChecks();
    this.removeAllListeners();
    
    if (this.isSupported) {
      autoUpdater.removeAllListeners();
    }
    
    this.isInitialized = false;
    debugLog('[UpdateManager] Destroyed successfully');
  }
}

// Export singleton instance
export const updateManager = UpdateManager.getInstance();

// Export convenience functions
export async function initializeUpdates(options?: Partial<UpdateOptions>): Promise<boolean> {
  return await updateManager.initialize(options);
}

export async function checkForUpdates(): Promise<boolean> {
  return await updateManager.checkForUpdates();
}

export function startPeriodicUpdateChecks(): void {
  updateManager.startPeriodicChecks();
}

export function stopPeriodicUpdateChecks(): void {
  updateManager.stopPeriodicChecks();
}

export function getUpdateState(): UpdateState {
  return updateManager.getState();
}

export function isUpdateSupported(): boolean {
  return updateManager.isUpdateSupported();
}
