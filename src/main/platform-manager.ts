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

import { app, nativeTheme, systemPreferences } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { debugLog } from './utils';

// Platform Types and Interfaces
export enum Platform {
  WINDOWS = 'win32',
  MACOS = 'darwin',
  LINUX = 'linux'
}

export enum Architecture {
  X64 = 'x64',
  ARM64 = 'arm64',
  IA32 = 'ia32'
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system'
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
export class PlatformManager extends EventEmitter {
  private static instance: PlatformManager;
  
  private readonly platform: Platform;
  private readonly architecture: Architecture;
  private readonly paths: PlatformPaths;
  private readonly capabilities: PlatformCapabilities;
  
  private systemPrefs: SystemPreferences;
  private themeChangeListener: (() => void) | null = null;
  
  private constructor() {
    super();
    
    this.platform = os.platform() as Platform;
    this.architecture = os.arch() as Architecture;
    this.paths = this.initializePaths();
    this.capabilities = this.initializeCapabilities();
    this.systemPrefs = this.loadSystemPreferences();
    
    this.setupThemeMonitoring();
  }
  
  public static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager();
    }
    return PlatformManager.instance;
  }
  
  /**
   * Initialize platform-specific paths
   */
  private initializePaths(): PlatformPaths {
    const basePaths = {
      appData: app.getPath('appData'),
      userData: app.getPath('userData'),
      temp: app.getPath('temp'),
      downloads: app.getPath('downloads'),
      desktop: app.getPath('desktop'),
      documents: app.getPath('documents'),
      cache: app.getPath('userData') // Default cache location
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
  private getPlatformSpecificPaths(): Partial<PlatformPaths> {
    switch (this.platform) {
      case Platform.WINDOWS:
        return {
          autoLaunch: path.join(
            app.getPath('appData'),
            'Microsoft',
            'Windows',
            'Start Menu',
            'Programs',
            'Startup'
          ),
          cache: path.join(app.getPath('appData'), app.getName(), 'Cache')
        };
        
      case Platform.MACOS:
        return {
          autoLaunch: path.join(app.getPath('home'), 'Library', 'LaunchAgents'),
          cache: path.join(app.getPath('home'), 'Library', 'Caches', app.getName())
        };
        
      case Platform.LINUX:
        return {
          autoLaunch: path.join(app.getPath('home'), '.config', 'autostart'),
          cache: path.join(app.getPath('home'), '.cache', app.getName())
        };
        
      default:
        return {
          autoLaunch: app.getPath('userData'),
          cache: app.getPath('userData')
        };
    }
  }
  
  /**
   * Initialize platform capabilities
   */
  private initializeCapabilities(): PlatformCapabilities {
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
  private loadSystemPreferences(): SystemPreferences {
    try {
      const language = app.getLocale().split('-')[0] || 'en';
      const region = app.getLocale().split('-')[1] || '';
      const theme = nativeTheme.shouldUseDarkColors ? Theme.DARK : Theme.LIGHT;
      
      let accentColor: string | undefined;
      let animations = true;
      let transparency = true;
      
      // Platform-specific preference loading
      if (this.platform === Platform.MACOS && systemPreferences) {
        try {
          accentColor = systemPreferences.getAccentColor?.();
          animations = !(systemPreferences as any).getUserDefault?.('NSGlobalDomain', 'NSDisableAnimations');
          transparency = !(systemPreferences as any).getUserDefault?.('NSGlobalDomain', 'AppleEnableMenuBarTransparency');
        } catch (error) {
          debugLog('[PlatformManager] Failed to load macOS preferences:', error);
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
      
    } catch (error) {
      debugLog('[PlatformManager] Failed to load system preferences:', error);
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
  private setupThemeMonitoring(): void {
    this.themeChangeListener = () => {
      const newTheme = nativeTheme.shouldUseDarkColors ? Theme.DARK : Theme.LIGHT;
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
    
    nativeTheme.on('updated', this.themeChangeListener);
  }
  
  /**
   * Get comprehensive OS information
 */
  public getOSInfo(): OSInfo {
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
        appVersion: app.getVersion(),
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome
      };
      
    } catch (error) {
      debugLog('[PlatformManager] Failed to get OS info:', error);
      return {
        platform: this.platform,
        release: 'unknown',
        arch: this.architecture,
        memory: { total: 0, free: 0, used: 0, percentage: 0 },
        cpus: [],
        hostname: 'unknown',
        userInfo: { username: 'unknown', uid: 0, gid: 0, homedir: '' },
        uptime: 0,
        appVersion: app.getVersion(),
        nodeVersion: process.version,
        electronVersion: process.versions.electron || 'unknown',
        chromeVersion: process.versions.chrome || 'unknown'
      };
    }
  }
  
  /**
 * Get platform-specific paths
   */
  public getPaths(): PlatformPaths {
    return { ...this.paths };
  }
  
  /**
   * Get platform capabilities
   */
  public getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
  }
  
  /**
   * Get system preferences
   */
  public getSystemPreferences(): SystemPreferences {
    return { ...this.systemPrefs };
  }
  
  /**
   * Platform detection utilities
   */
  public isWindows(): boolean {
    return this.platform === Platform.WINDOWS;
  }
  
  public isMacOS(): boolean {
    return this.platform === Platform.MACOS;
  }
  
  public isLinux(): boolean {
    return this.platform === Platform.LINUX;
  }
  
  public getPlatform(): Platform {
    return this.platform;
  }
  
  public getArchitecture(): Architecture {
    return this.architecture;
  }
  
  /**
   * Resource path management
 */
  public getResourcePath(resourcePath: string = ''): string {
    try {
      // Development environment
      if (process.env.NODE_ENV === 'development') {
        return path.join(process.cwd(), 'resources', resourcePath);
      }
      
      // Production environment (packaged app)
      const resourcesPath = process.resourcesPath || app.getAppPath();
      return path.join(resourcesPath, resourcePath);
      
    } catch (error) {
      debugLog('[PlatformManager] Failed to get resource path:', error);
      return path.join(app.getAppPath(), resourcePath);
    }
  }
  
  /**
 * Create platform-specific directories
 */
  public async ensureDirectoriesExist(): Promise<void> {
    const dirsToCreate = [
      this.paths.userData,
      this.paths.logs,
      this.paths.cache
    ];
    
    for (const dir of dirsToCreate) {
      try {
        await fs.promises.mkdir(dir, { recursive: true });
      } catch (error) {
        debugLog('[PlatformManager] Failed to create directory ${dir}:', error);
      }
    }
  }
  
  /**
 * Get platform-specific performance settings
   */
  public getPerformanceSettings(): {
    hardwareAcceleration: boolean;
    backgroundThrottling: boolean;
    v8CacheOptions: boolean;
    diskCacheSize: number;
  } {
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
  public getSystemLanguage(): string {
    return this.systemPrefs.language;
  }
  
  /**
   * Get current theme
   */
  public getCurrentTheme(): Theme {
    return this.systemPrefs.theme;
  }
  
  /**
   * Check if dark mode is active
 */
  public isDarkMode(): boolean {
    return this.systemPrefs.theme === Theme.DARK;
  }
  
  /**
   * Set theme preference (if supported)
   */
  public setTheme(theme: Theme): void {
    try {
      switch (theme) {
        case Theme.DARK:
          nativeTheme.themeSource = 'dark';
          break;
        case Theme.LIGHT:
          nativeTheme.themeSource = 'light';
          break;
        case Theme.SYSTEM:
          nativeTheme.themeSource = 'system';
          break;
      }
    } catch (error) {
      debugLog('[PlatformManager] Failed to set theme:', error);
    }
  }
  
  /**
 * Get system uptime in a human-readable format
   */
  public getFormattedUptime(): string {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Get memory usage in a human-readable format
   */
  public getFormattedMemoryUsage(): string {
    const info = this.getOSInfo();
    const usedGB = (info.memory.used / (1024 * 1024 * 1024)).toFixed(1);
    const totalGB = (info.memory.total / (1024 * 1024 * 1024)).toFixed(1);
    
    return `${usedGB}GB / ${totalGB}GB (${info.memory.percentage.toFixed(1)}%)`;
  }
  
  /**
   * Cleanup resources
 */
  public destroy(): void {
    if (this.themeChangeListener) {
      nativeTheme.removeListener('updated', this.themeChangeListener);
      this.themeChangeListener = null;
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const platformManager = PlatformManager.getInstance();

// Export utility functions for backward compatibility
export function getCurrentPlatform(): Platform {
  return platformManager.getPlatform();
}

export function isWindows(): boolean {
  return platformManager.isWindows();
}

export function isMacOS(): boolean {
  return platformManager.isMacOS();
}

export function isLinux(): boolean {
  return platformManager.isLinux();
}

export function getOSInfo(): OSInfo {
  return platformManager.getOSInfo();
}

export function getSystemLanguage(): string {
  return platformManager.getSystemLanguage();
}

export function getCurrentTheme(): Theme {
  return platformManager.getCurrentTheme();
}

export function getResourcePath(resourcePath?: string): string {
  return platformManager.getResourcePath(resourcePath);
}
