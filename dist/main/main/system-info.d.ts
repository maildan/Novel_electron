/**
 * Advanced system information and monitoring module
 * Handles system stats, browser detection, debug info, and permissions
 */
import { BrowserWindow } from 'electron';
/**
 * Initialize system information module
 */
export declare function initSystemInfo(window: BrowserWindow): void;
/**
 * Cleanup system info resources
 */
export declare function cleanupSystemInfo(): void;
/**
 * Get system info module status
 */
export declare function getSystemInfoStatus(): {
    initialized: boolean;
    fallbackMode: boolean;
    lastPermissionCheck: number;
};
//# sourceMappingURL=system-info.d.ts.map