/**
 * 고급 시스템 트레이 관리 모듈
 * 트레이 아이콘, 컨텍스트 메뉴, 알림, 통계 표시를 담당합니다
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