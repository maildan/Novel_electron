/**
 * 설정 관련 공통 타입 정의
 * 이 파일은 프론트엔드와 백엔드에서 공통으로 사용되는 설정 타입을 정의합니다.
 */
export type ThemeType = 'light' | 'dark' | 'system';
export type WindowModeType = 'windowed' | 'fullscreen' | 'maximized' | 'fullscreen-auto-hide';
export type ProcessingModeType = 'auto' | 'normal' | 'cpu-intensive' | 'gpu-intensive';
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';
export interface AppCategories {
    docs: boolean;
    office: boolean;
    coding: boolean;
    sns: boolean;
    browser: boolean;
    game: boolean;
    media: boolean;
    other: boolean;
}
export interface KeyboardSettings {
    autoStart: boolean;
    enableHangulSupport: boolean;
    enableJamoTracking: boolean;
    hangulMode: 'auto' | 'force' | 'disable';
    jamoSeparation: boolean;
    trackingInterval: number;
}
export interface WindowSettings {
    miniSize: {
        width: number;
        height: number;
    };
    opacity: number;
    alwaysOnTop: boolean;
    autoHide: boolean;
    position: {
        x: number;
        y: number;
    };
}
export interface AppSettings {
    enabledCategories: AppCategories;
    autoStartMonitoring: boolean;
    resumeAfterIdle: boolean;
    idleTimeout: number;
    theme: ThemeType;
    windowMode: WindowModeType;
    darkMode: boolean;
    minimizeToTray: boolean;
    showTrayNotifications: boolean;
    enableMiniView: boolean;
    enableAnimations: boolean;
    fontSize: number;
    fontFamily: string;
    useHardwareAcceleration: boolean;
    enableGPUAcceleration: boolean;
    gpuAccelerationLevel: number;
    processingMode: ProcessingModeType;
    reduceMemoryInBackground: boolean;
    enableMemoryOptimization: boolean;
    enableBackgroundCleanup: boolean;
    garbageCollectionInterval: number;
    maxMemoryThreshold: number;
    memoryCleanupInterval: number;
    memoryThreshold: number;
    autoCleanupLogs: boolean;
    maxHistoryItems: number;
    logRetentionDays: number;
    enableDataCollection: boolean;
    enableAnalytics: boolean;
    dataRetentionDays: number;
    enableAutoSave: boolean;
    autoSaveInterval: number;
    enableWPMDisplay: boolean;
    enableAccuracyDisplay: boolean;
    enableRealTimeStats: boolean;
    enableTypingSound: boolean;
    enableKeyboardShortcuts: boolean;
    statsFilePath: string;
    enableTypingAnalysis: boolean;
    enableRealTimeAnalysis: boolean;
    statsCollectionInterval: number;
    enableKeyboardDetection: boolean;
    enablePatternLearning: boolean;
    keyboard: KeyboardSettings;
    windowSettings: WindowSettings;
    windowOpacity: number;
    alwaysOnTop: boolean;
    enableSystemMonitoring: boolean;
    enablePerformanceLogging: boolean;
    monitoringInterval: number;
    enableCPUMonitoring: boolean;
    enableMemoryMonitoring: boolean;
    enableDiskMonitoring: boolean;
    enableNotifications: boolean;
    enableTrayNotifications: boolean;
    enableDebugMode: boolean;
    enableConsoleLogging: boolean;
    enableErrorReporting: boolean;
    logLevel: LogLevelType;
}
export type SettingsState = AppSettings;
export declare const DEFAULT_SETTINGS: AppSettings;
export declare function validateSettings(settings: Partial<AppSettings>): boolean;
export declare function mergeSettings(current: AppSettings, updates: Partial<AppSettings>): AppSettings;
export type SettingsKey = keyof AppSettings;
export type SettingsValue<K extends SettingsKey> = AppSettings[K];
//# sourceMappingURL=settings.d.ts.map