/**
 * Debug logging with console output and file saving
 */
export declare function debugLog(...args: any[]): void;
/**
 * Error logging with console output and file saving
 */
export declare function errorLog(...args: any[]): void;
/**
 * Warning logging with console output and file saving
 */
export declare function warnLog(...args: any[]): void;
/**
 * Time formatting function (for debugging)
 */
export declare function formatTime(seconds: number): string;
/**
 * Safely create file path
 */
export declare function safePath(basePath: string, ...segments: string[]): string;
/**
 * Safely require module with fallback
 */
export declare function safeRequire<T = any>(modulePath: string, fallback?: T): T | null;
/**
 * Check if local server is running
 */
export declare function isServerRunning(host?: string, port?: number): Promise<boolean>;
/**
 * Wait for server to be ready
 */
export declare function waitForServer(host?: string, port?: number, timeout?: number, interval?: number): Promise<boolean>;
/**
 * Safely parse JSON with fallback
 */
export declare function safeJsonParse<T = any>(jsonString: string, fallback?: T): T | null;
/**
 * Safely stringify JSON with fallback
 */
export declare function safeJsonStringify(obj: any, fallback?: string): string;
/**
 * Delay execution for specified milliseconds
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelay?: number): Promise<T>;
/**
 * Validate email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Generate random string
 */
export declare function generateRandomString(length?: number): string;
/**
 * Check if file exists safely
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Read file safely with fallback
 */
export declare function safeReadFile(filePath: string, fallback?: string): string;
/**
 * Write file safely
 */
export declare function safeWriteFile(filePath: string, content: string): boolean;
/**
 * Get system information
 */
export declare function getSystemInfo(): {
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
    isDev: boolean;
};
/**
 * Format bytes to human readable format
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare const CONSTANTS: {
    readonly LOG_DIR: string;
    readonly LOG_FILE: string;
    readonly isDev: boolean;
};
export interface LogLevel {
    DEBUG: 'debug';
    INFO: 'info';
    WARN: 'warn';
    ERROR: 'error';
}
export interface SystemInfo {
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
    isDev: boolean;
}
export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    exponentialBackoff?: boolean;
}
//# sourceMappingURL=utils.d.ts.map