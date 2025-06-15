/**
 * Platform Manager for Loop 6
 * Cross-platform utilities and system integration
 * Enhanced TypeScript implementation with modern architecture
 *
 * Features:
 * - OS detection and information
 * - Platform-specific paths and configurations
 * - System theme detection and monitoring
 * - Resource path management
 * - Performance optimizations per platform
 */
import * as os from 'os';
import { EventEmitter } from 'events';
export declare enum Platform {
    WINDOWS = "win32",
    MACOS = "darwin",
    LINUX = "linux"
}
export declare enum Architecture {
    X64 = "x64",
    ARM64 = "arm64",
    IA32 = "ia32"
}
export declare enum Theme {
    DARK = "dark",
    LIGHT = "light",
    SYSTEM = "system"
}
export interface OSInfo {
    platform: Platform;
    release: string;
    arch: Architecture;
    memory: {
        total: number;
        free: number;
        used: number;
        percentage: number;
    };
    cpus: os.CpuInfo[];
    hostname: string;
    userInfo: {
        username: string;
        uid: number;
        gid: number;
        homedir: string;
    };
    uptime: number;
    appVersion: string;
    nodeVersion: string;
    electronVersion: string;
    chromeVersion: string;
}
export interface PlatformPaths {
    appData: string;
    userData: string;
    logs: string;
    temp: string;
    downloads: string;
    desktop: string;
    documents: string;
    autoLaunch: string;
    cache: string;
}
export interface PlatformCapabilities {
    hasNotifications: boolean;
    hasGlobalShortcuts: boolean;
    hasSystemTray: boolean;
    hasAutoLaunch: boolean;
    hasScreenCapture: boolean;
    hasClipboardAccess: boolean;
    hasDarkMode: boolean;
    hasBlur: boolean;
    hasVibrancy: boolean;
}
export interface SystemPreferences {
    language: string;
    region: string;
    theme: Theme;
    colorScheme: 'dark' | 'light';
    accentColor?: string;
    animations: boolean;
    transparency: boolean;
}
/**
 * Platform Manager Class
 * Provides comprehensive platform-specific functionality
 */
export declare class PlatformManager extends EventEmitter {
    private static instance;
    private readonly platform;
    private readonly architecture;
    private readonly paths;
    private readonly capabilities;
    private systemPrefs;
    private themeChangeListener;
    private constructor();
    static getInstance(): PlatformManager;
    /**
     * Initialize platform-specific paths
     */
    private initializePaths;
    /**
     * Get platform-specific paths
     */
    private getPlatformSpecificPaths;
    /**
     * Initialize platform capabilities
     */
    private initializeCapabilities;
    /**
     * Load system preferences
   */
    private loadSystemPreferences;
    /**
   * Setup theme change monitoring
     */
    private setupThemeMonitoring;
    /**
     * Get comprehensive OS information
   */
    getOSInfo(): OSInfo;
    /**
   * Get platform-specific paths
     */
    getPaths(): PlatformPaths;
    /**
     * Get platform capabilities
     */
    getCapabilities(): PlatformCapabilities;
    /**
     * Get system preferences
     */
    getSystemPreferences(): SystemPreferences;
    /**
     * Platform detection utilities
     */
    isWindows(): boolean;
    isMacOS(): boolean;
    isLinux(): boolean;
    getPlatform(): Platform;
    getArchitecture(): Architecture;
    /**
     * Resource path management
   */
    getResourcePath(resourcePath?: string): string;
    /**
   * Create platform-specific directories
   */
    ensureDirectoriesExist(): Promise<void>;
    /**
   * Get platform-specific performance settings
     */
    getPerformanceSettings(): {
        hardwareAcceleration: boolean;
        backgroundThrottling: boolean;
        v8CacheOptions: boolean;
        diskCacheSize: number;
    };
    /**
     * Get system language
     */
    getSystemLanguage(): string;
    /**
     * Get current theme
     */
    getCurrentTheme(): Theme;
    /**
     * Check if dark mode is active
   */
    isDarkMode(): boolean;
    /**
     * Set theme preference (if supported)
     */
    setTheme(theme: Theme): void;
    /**
   * Get system uptime in a human-readable format
     */
    getFormattedUptime(): string;
    /**
     * Get memory usage in a human-readable format
     */
    getFormattedMemoryUsage(): string;
    /**
     * Cleanup resources
   */
    destroy(): void;
}
export declare const platformManager: PlatformManager;
export declare function getCurrentPlatform(): Platform;
export declare function isWindows(): boolean;
export declare function isMacOS(): boolean;
export declare function isLinux(): boolean;
export declare function getOSInfo(): OSInfo;
export declare function getSystemLanguage(): string;
export declare function getCurrentTheme(): Theme;
export declare function getResourcePath(resourcePath?: string): string;
//# sourceMappingURL=platform-manager.d.ts.map