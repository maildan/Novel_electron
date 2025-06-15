"use strict";
/**
 * 설정 관련 공통 타입 정의
 * 이 파일은 프론트엔드와 백엔드에서 공통으로 사용되는 설정 타입을 정의합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.validateSettings = validateSettings;
exports.mergeSettings = mergeSettings;
// 기본 설정값
exports.DEFAULT_SETTINGS = {
    // 카테고리
    enabledCategories: {
        docs: true,
        office: true,
        coding: true,
        sns: true,
        browser: true,
        game: false,
        media: true,
        other: true
    },
    // 기본 설정
    autoStartMonitoring: true,
    resumeAfterIdle: true,
    idleTimeout: 300,
    // UI 설정
    theme: 'system',
    windowMode: 'windowed',
    darkMode: false,
    minimizeToTray: true,
    showTrayNotifications: true,
    enableMiniView: true,
    enableAnimations: true,
    fontSize: 14,
    fontFamily: 'system-ui',
    // 성능 설정
    useHardwareAcceleration: false,
    enableGPUAcceleration: true,
    gpuAccelerationLevel: 1,
    processingMode: 'auto',
    // 메모리 설정
    reduceMemoryInBackground: true,
    enableMemoryOptimization: true,
    enableBackgroundCleanup: true,
    garbageCollectionInterval: 60000,
    maxMemoryThreshold: 100,
    memoryCleanupInterval: 300000,
    memoryThreshold: 80,
    // 데이터 설정
    autoCleanupLogs: true,
    maxHistoryItems: 500,
    logRetentionDays: 30,
    enableDataCollection: true,
    enableAnalytics: false,
    dataRetentionDays: 30,
    enableAutoSave: true,
    autoSaveInterval: 10000,
    // 타이핑 설정
    enableWPMDisplay: true,
    enableAccuracyDisplay: true,
    enableRealTimeStats: true,
    enableTypingSound: false,
    enableKeyboardShortcuts: true,
    statsFilePath: '',
    // 분석 설정
    enableTypingAnalysis: true,
    enableRealTimeAnalysis: false,
    statsCollectionInterval: 5000,
    enableKeyboardDetection: true,
    enablePatternLearning: false,
    // 키보드 설정
    keyboard: {
        autoStart: true,
        enableHangulSupport: true,
        enableJamoTracking: false,
        hangulMode: 'auto',
        jamoSeparation: false,
        trackingInterval: 100
    },
    // 윈도우 설정
    windowSettings: {
        miniSize: { width: 300, height: 200 },
        opacity: 0.9,
        alwaysOnTop: false,
        autoHide: false,
        position: { x: 0, y: 0 }
    },
    // 추가 윈도우 관련 설정
    windowOpacity: 1.0,
    alwaysOnTop: false,
    // 시스템 모니터링
    enableSystemMonitoring: false,
    enablePerformanceLogging: false,
    monitoringInterval: 5000,
    enableCPUMonitoring: false,
    enableMemoryMonitoring: false,
    enableDiskMonitoring: false,
    // 알림 설정
    enableNotifications: true,
    enableTrayNotifications: true,
    // 개발자 설정
    enableDebugMode: false,
    enableConsoleLogging: false,
    enableErrorReporting: true,
    logLevel: 'info'
};
// 설정 유효성 검사 함수
function validateSettings(settings) {
    // 기본적인 유효성 검사
    if (settings.fontSize && (settings.fontSize < 8 || settings.fontSize > 32)) {
        return false;
    }
    if (settings.gpuAccelerationLevel && (settings.gpuAccelerationLevel < 0 || settings.gpuAccelerationLevel > 3)) {
        return false;
    }
    if (settings.memoryThreshold && (settings.memoryThreshold < 10 || settings.memoryThreshold > 95)) {
        return false;
    }
    return true;
}
// 설정 머지 함수
function mergeSettings(current, updates) {
    return {
        ...current,
        ...updates,
        // 중첩 객체는 별도로 머지
        enabledCategories: updates.enabledCategories ?
            { ...current.enabledCategories, ...updates.enabledCategories } :
            current.enabledCategories,
        keyboard: updates.keyboard ?
            { ...current.keyboard, ...updates.keyboard } :
            current.keyboard,
        windowSettings: updates.windowSettings ?
            { ...current.windowSettings, ...updates.windowSettings } :
            current.windowSettings
    };
}
//# sourceMappingURL=settings.js.map