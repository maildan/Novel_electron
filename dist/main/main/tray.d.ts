/**
 * Advanced system tray management module
 * Handles tray icon, context menu, notifications, and statistics display
 */
import { BrowserWindow } from 'electron';
interface TrayConfig {
    iconPath?: string;
    tooltip?: string;
    showStats?: boolean;
    enableMiniView?: boolean;
    autoHide?: boolean;
}
interface TrayStats {
    typingCount: number;
    sessionsCount: number;
    accuracy: number;
    wpm: number;
    activeApp: string;
    uptime: number;
}
/**
 * Update tray statistics
 */
export declare function updateTrayStats(stats: Partial<TrayStats>): void;
/**
 * Show tray notification
 */
export declare function showTrayNotification(title: string, body: string, urgent?: boolean): void;
/**
 * Set tray icon status (active/inactive)
 */
export declare function setTrayStatus(active: boolean): void;
/**
 * Flash tray icon for attention
 */
export declare function flashTrayIcon(times?: number): void;
/**
 * Initialize system tray
 */
export declare function initTray(window: BrowserWindow, config?: TrayConfig): void;
/**
 * Cleanup tray resources
 */
export declare function cleanupTray(): void;
/**
 * Get tray status
 */
export declare function getTrayStatus(): {
    initialized: boolean;
    visible: boolean;
    currentTab: string;
    stats: TrayStats;
};
export {};
//# sourceMappingURL=tray.d.ts.map