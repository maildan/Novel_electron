/**
 * Update Manager for Loop 6
 * Auto-update system with TypeScript and modern architecture
 * Features: Update checking, downloading, installation, notifications
 */
import { EventEmitter } from 'events';
export declare enum UpdateStatus {
    IDLE = "idle",
    CHECKING = "checking",
    AVAILABLE = "available",
    NOT_AVAILABLE = "not-available",
    DOWNLOADING = "downloading",
    DOWNLOADED = "downloaded",
    ERROR = "error"
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
export declare class UpdateManager extends EventEmitter {
    private static instance;
    private updateServerUrl;
    private checkInterval;
    private updateCheckTimer;
    private options;
    private state;
    private isInitialized;
    private isSupported;
    private constructor();
    static getInstance(): UpdateManager;
    /**
     * Check if auto-updates are supported on current platform
     */
    private checkPlatformSupport;
    /**
     * Initialize the auto-updater
     */
    initialize(options?: Partial<UpdateOptions>): Promise<boolean>;
    /**
     * Setup logging configuration
     */
    private setupLogging;
    /**
     * Setup auto-updater event handlers
     */
    private setupAutoUpdaterEvents;
    /**
     * Configure auto-updater settings
     */
    private configureAutoUpdater;
    /**
     * Setup IPC handlers for renderer communication
     */
    private setupIpcHandlers;
    /**
     * Parse update info from auto-updater
     */
    private parseUpdateInfo;
    /**
     * Notify renderer process about update events
     */
    private notifyRenderer;
    /**
     * Show update available notification
     */
    private showUpdateAvailableNotification;
    /**
     * Show update downloaded notification
     */
    private showUpdateDownloadedNotification;
    /**
     * Check for updates manually
     */
    checkForUpdates(): Promise<boolean>;
    /**
     * Download available update
     */
    downloadUpdate(): Promise<boolean>;
    /**
     * Install downloaded update
     */
    installUpdate(): boolean;
    /**
     * Start automatic update checking
     */
    startPeriodicChecks(): void;
    /**
     * Stop automatic update checking
     */
    stopPeriodicChecks(): void;
    /**
     * Set auto-download preference
     */
    setAutoDownload(enabled: boolean): void;
    /**
     * Set update check interval
     */
    setCheckInterval(interval: number): void;
    /**
     * Get current update state
     */
    getState(): UpdateState;
    /**
     * Check if updates are supported
     */
    isUpdateSupported(): boolean;
    /**
     * Get update server URL
     */
    getServerUrl(): string;
    /**
     * Set update server URL
     */
    setServerUrl(url: string): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const updateManager: UpdateManager;
export declare function initializeUpdates(options?: Partial<UpdateOptions>): Promise<boolean>;
export declare function checkForUpdates(): Promise<boolean>;
export declare function startPeriodicUpdateChecks(): void;
export declare function stopPeriodicUpdateChecks(): void;
export declare function getUpdateState(): UpdateState;
export declare function isUpdateSupported(): boolean;
//# sourceMappingURL=update-manager.d.ts.map