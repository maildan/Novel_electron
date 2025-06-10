/**
 * Advanced screenshot capture and management module
 * Handles screen capture, storage, and processing with enhanced features
 */
import { BrowserWindow } from 'electron';
/**
 * Initialize screenshot module
 */
export declare function initScreenshot(window: BrowserWindow): void;
/**
 * Cleanup screenshot resources
 */
export declare function cleanupScreenshot(): void;
/**
 * Get screenshot module status
 */
export declare function getScreenshotStatus(): {
    initialized: boolean;
    historySize: number;
    directory: string;
};
//# sourceMappingURL=screenshot.d.ts.map