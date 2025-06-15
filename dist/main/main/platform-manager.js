"use strict";
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
exports.platformManager = exports.PlatformManager = exports.Theme = exports.Architecture = exports.Platform = void 0;
exports.getCurrentPlatform = getCurrentPlatform;
exports.isWindows = isWindows;
exports.isMacOS = isMacOS;
exports.isLinux = isLinux;
exports.getOSInfo = getOSInfo;
exports.getSystemLanguage = getSystemLanguage;
exports.getCurrentTheme = getCurrentTheme;
exports.getResourcePath = getResourcePath;
const electron_1 = require("electron");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const events_1 = require("events");
const utils_1 = require("./utils");
// Platform Types and Interfaces
var Platform;
(function (Platform) {
    Platform["WINDOWS"] = "win32";
    Platform["MACOS"] = "darwin";
    Platform["LINUX"] = "linux";
})(Platform || (exports.Platform = Platform = {}));
var Architecture;
(function (Architecture) {
    Architecture["X64"] = "x64";
    Architecture["ARM64"] = "arm64";
    Architecture["IA32"] = "ia32";
})(Architecture || (exports.Architecture = Architecture = {}));
var Theme;
(function (Theme) {
    Theme["DARK"] = "dark";
    Theme["LIGHT"] = "light";
    Theme["SYSTEM"] = "system";
})(Theme || (exports.Theme = Theme = {}));
/**
 * Platform Manager Class
 * Provides comprehensive platform-specific functionality
 */
class PlatformManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.themeChangeListener = null;
        this.platform = os.platform();
        this.architecture = os.arch();
        this.paths = this.initializePaths();
        this.capabilities = this.initializeCapabilities();
        this.systemPrefs = this.loadSystemPreferences();
        this.setupThemeMonitoring();
    }
    static getInstance() {
        if (!PlatformManager.instance) {
            PlatformManager.instance = new PlatformManager();
        }
        return PlatformManager.instance;
    }
    /**
     * Initialize platform-specific paths
     */
    initializePaths() {
        const basePaths = {
            appData: electron_1.app.getPath('appData'),
            userData: electron_1.app.getPath('userData'),
            temp: electron_1.app.getPath('temp'),
            downloads: electron_1.app.getPath('downloads'),
            desktop: electron_1.app.getPath('desktop'),
            documents: electron_1.app.getPath('documents'),
            cache: electron_1.app.getPath('userData') // Default cache location
        };
        // Platform-specific paths
        const platformSpecific = this.getPlatformSpecificPaths();
        return {
            ...basePaths,
            logs: path.join(basePaths.userData, 'logs'),
            autoLaunch: platformSpecific.autoLaunch || basePaths.userData,
            cache: platformSpecific.cache || basePaths.userData
        };
    }
    /**
     * Get platform-specific paths
     */
    getPlatformSpecificPaths() {
        switch (this.platform) {
            case Platform.WINDOWS:
                return {
                    autoLaunch: path.join(electron_1.app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
                    cache: path.join(electron_1.app.getPath('appData'), electron_1.app.getName(), 'Cache')
                };
            case Platform.MACOS:
                return {
                    autoLaunch: path.join(electron_1.app.getPath('home'), 'Library', 'LaunchAgents'),
                    cache: path.join(electron_1.app.getPath('home'), 'Library', 'Caches', electron_1.app.getName())
                };
            case Platform.LINUX:
                return {
                    autoLaunch: path.join(electron_1.app.getPath('home'), '.config', 'autostart'),
                    cache: path.join(electron_1.app.getPath('home'), '.cache', electron_1.app.getName())
                };
            default:
                return {
                    autoLaunch: electron_1.app.getPath('userData'),
                    cache: electron_1.app.getPath('userData')
                };
        }
    }
    /**
     * Initialize platform capabilities
     */
    initializeCapabilities() {
        return {
            hasNotifications: true, // All platforms support notifications
            hasGlobalShortcuts: true, // All platforms support global shortcuts
            hasSystemTray: this.platform !== Platform.LINUX, // Linux support varies
            hasAutoLaunch: true, // All platforms support auto-launch
            hasScreenCapture: true, // All platforms support screen capture
            hasClipboardAccess: true, // All platforms support clipboard
            hasDarkMode: this.platform === Platform.MACOS || this.platform === Platform.WINDOWS,
            hasBlur: this.platform === Platform.MACOS || this.platform === Platform.WINDOWS,
            hasVibrancy: this.platform === Platform.MACOS
        };
    }
    /**
     * Load system preferences
   */
    loadSystemPreferences() {
        try {
            const language = electron_1.app.getLocale().split('-')[0] || 'en';
            const region = electron_1.app.getLocale().split('-')[1] || '';
            const theme = electron_1.nativeTheme.shouldUseDarkColors ? Theme.DARK : Theme.LIGHT;
            let accentColor;
            let animations = true;
            let transparency = true;
            // Platform-specific preference loading
            if (this.platform === Platform.MACOS && electron_1.systemPreferences) {
                try {
                    accentColor = electron_1.systemPreferences.getAccentColor?.();
                    animations = !electron_1.systemPreferences.getUserDefault?.('NSGlobalDomain', 'NSDisableAnimations');
                    transparency = !electron_1.systemPreferences.getUserDefault?.('NSGlobalDomain', 'AppleEnableMenuBarTransparency');
                }
                catch (error) {
                    (0, utils_1.debugLog)('[PlatformManager] Failed to load macOS preferences:', error);
                }
            }
            return {
                language,
                region,
                theme,
                colorScheme: theme,
                accentColor,
                animations,
                transparency
            };
        }
        catch (error) {
            (0, utils_1.debugLog)('[PlatformManager] Failed to load system preferences:', error);
            return {
                language: 'en',
                region: '',
                theme: Theme.LIGHT,
                colorScheme: 'light',
                animations: true,
                transparency: true
            };
        }
    }
    /**
   * Setup theme change monitoring
     */
    setupThemeMonitoring() {
        this.themeChangeListener = () => {
            const newTheme = electron_1.nativeTheme.shouldUseDarkColors ? Theme.DARK : Theme.LIGHT;
            const oldTheme = this.systemPrefs.theme;
            if (newTheme !== oldTheme) {
                this.systemPrefs.theme = newTheme;
                this.systemPrefs.colorScheme = newTheme;
                this.emit('theme-changed', {
                    oldTheme,
                    newTheme,
                    timestamp: Date.now()
                });
            }
        };
        electron_1.nativeTheme.on('updated', this.themeChangeListener);
    }
    /**
     * Get comprehensive OS information
   */
    getOSInfo() {
        try {
            const memory = {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
            };
            const userInfo = os.userInfo();
            return {
                platform: this.platform,
                release: os.release(),
                arch: this.architecture,
                memory,
                cpus: os.cpus(),
                hostname: os.hostname(),
                userInfo: {
                    username: userInfo.username,
                    uid: userInfo.uid,
                    gid: userInfo.gid,
                    homedir: userInfo.homedir
                },
                uptime: os.uptime(),
                appVersion: electron_1.app.getVersion(),
                nodeVersion: process.version,
                electronVersion: process.versions.electron,
                chromeVersion: process.versions.chrome
            };
        }
        catch (error) {
            (0, utils_1.debugLog)('[PlatformManager] Failed to get OS info:', error);
            return {
                platform: this.platform,
                release: 'unknown',
                arch: this.architecture,
                memory: { total: 0, free: 0, used: 0, percentage: 0 },
                cpus: [],
                hostname: 'unknown',
                userInfo: { username: 'unknown', uid: 0, gid: 0, homedir: '' },
                uptime: 0,
                appVersion: electron_1.app.getVersion(),
                nodeVersion: process.version,
                electronVersion: process.versions.electron || 'unknown',
                chromeVersion: process.versions.chrome || 'unknown'
            };
        }
    }
    /**
   * Get platform-specific paths
     */
    getPaths() {
        return { ...this.paths };
    }
    /**
     * Get platform capabilities
     */
    getCapabilities() {
        return { ...this.capabilities };
    }
    /**
     * Get system preferences
     */
    getSystemPreferences() {
        return { ...this.systemPrefs };
    }
    /**
     * Platform detection utilities
     */
    isWindows() {
        return this.platform === Platform.WINDOWS;
    }
    isMacOS() {
        return this.platform === Platform.MACOS;
    }
    isLinux() {
        return this.platform === Platform.LINUX;
    }
    getPlatform() {
        return this.platform;
    }
    getArchitecture() {
        return this.architecture;
    }
    /**
     * Resource path management
   */
    getResourcePath(resourcePath = '') {
        try {
            // Development environment
            if (process.env.NODE_ENV === 'development') {
                return path.join(process.cwd(), 'resources', resourcePath);
            }
            // Production environment (packaged app)
            const resourcesPath = process.resourcesPath || electron_1.app.getAppPath();
            return path.join(resourcesPath, resourcePath);
        }
        catch (error) {
            (0, utils_1.debugLog)('[PlatformManager] Failed to get resource path:', error);
            return path.join(electron_1.app.getAppPath(), resourcePath);
        }
    }
    /**
   * Create platform-specific directories
   */
    async ensureDirectoriesExist() {
        const dirsToCreate = [
            this.paths.userData,
            this.paths.logs,
            this.paths.cache
        ];
        for (const dir of dirsToCreate) {
            try {
                await fs.promises.mkdir(dir, { recursive: true });
            }
            catch (error) {
                (0, utils_1.debugLog)('[PlatformManager] Failed to create directory ${dir}:', error);
            }
        }
    }
    /**
   * Get platform-specific performance settings
     */
    getPerformanceSettings() {
        const baseSettings = {
            hardwareAcceleration: true,
            backgroundThrottling: false,
            v8CacheOptions: true,
            diskCacheSize: 100 * 1024 * 1024 // 100MB
        };
        // Platform-specific optimizations
        switch (this.platform) {
            case Platform.MACOS:
                return {
                    ...baseSettings,
                    // macOS typically has good GPU support
                    hardwareAcceleration: true,
                    diskCacheSize: 200 * 1024 * 1024 // 200MB
                };
            case Platform.WINDOWS:
                return {
                    ...baseSettings,
                    // Windows might have varied GPU support
                    hardwareAcceleration: true,
                    backgroundThrottling: true // Help with battery on laptops
                };
            case Platform.LINUX:
                return {
                    ...baseSettings,
                    // Linux might have limited GPU acceleration
                    hardwareAcceleration: false,
                    diskCacheSize: 50 * 1024 * 1024 // 50MB, more conservative
                };
            default:
                return baseSettings;
        }
    }
    /**
     * Get system language
     */
    getSystemLanguage() {
        return this.systemPrefs.language;
    }
    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.systemPrefs.theme;
    }
    /**
     * Check if dark mode is active
   */
    isDarkMode() {
        return this.systemPrefs.theme === Theme.DARK;
    }
    /**
     * Set theme preference (if supported)
     */
    setTheme(theme) {
        try {
            switch (theme) {
                case Theme.DARK:
                    electron_1.nativeTheme.themeSource = 'dark';
                    break;
                case Theme.LIGHT:
                    electron_1.nativeTheme.themeSource = 'light';
                    break;
                case Theme.SYSTEM:
                    electron_1.nativeTheme.themeSource = 'system';
                    break;
            }
        }
        catch (error) {
            (0, utils_1.debugLog)('[PlatformManager] Failed to set theme:', error);
        }
    }
    /**
   * Get system uptime in a human-readable format
     */
    getFormattedUptime() {
        const uptime = os.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        else {
            return `${minutes}m`;
        }
    }
    /**
     * Get memory usage in a human-readable format
     */
    getFormattedMemoryUsage() {
        const info = this.getOSInfo();
        const usedGB = (info.memory.used / (1024 * 1024 * 1024)).toFixed(1);
        const totalGB = (info.memory.total / (1024 * 1024 * 1024)).toFixed(1);
        return `${usedGB}GB / ${totalGB}GB (${info.memory.percentage.toFixed(1)}%)`;
    }
    /**
     * Cleanup resources
   */
    destroy() {
        if (this.themeChangeListener) {
            electron_1.nativeTheme.removeListener('updated', this.themeChangeListener);
            this.themeChangeListener = null;
        }
        this.removeAllListeners();
    }
}
exports.PlatformManager = PlatformManager;
// Export singleton instance
exports.platformManager = PlatformManager.getInstance();
// Export utility functions for backward compatibility
function getCurrentPlatform() {
    return exports.platformManager.getPlatform();
}
function isWindows() {
    return exports.platformManager.isWindows();
}
function isMacOS() {
    return exports.platformManager.isMacOS();
}
function isLinux() {
    return exports.platformManager.isLinux();
}
function getOSInfo() {
    return exports.platformManager.getOSInfo();
}
function getSystemLanguage() {
    return exports.platformManager.getSystemLanguage();
}
function getCurrentTheme() {
    return exports.platformManager.getCurrentTheme();
}
function getResourcePath(resourcePath) {
    return exports.platformManager.getResourcePath(resourcePath);
}
//# sourceMappingURL=platform-manager.js.map