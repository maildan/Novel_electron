"use strict";
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
exports.updateTrayStats = updateTrayStats;
exports.showTrayNotification = showTrayNotification;
exports.setTrayStatus = setTrayStatus;
exports.flashTrayIcon = flashTrayIcon;
exports.initTray = initTray;
exports.cleanupTray = cleanupTray;
exports.getTrayStatus = getTrayStatus;
/**
 * Advanced system tray management module
 * Handles tray icon, context menu, notifications, and statistics display
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const debug_1 = require("../utils/debug");
// 전역 상태
let tray = null;
let mainWindow = null;
let trayInitialized = false;
let currentStatsTab = 'typing'; // 'typing', 'document', 'accuracy'
let trayStats = {
    typingCount: 0,
    sessionsCount: 0,
    accuracy: 0,
    wpm: 0,
    activeApp: 'None',
    uptime: 0
};
// 기본 Setup
const DEFAULT_TRAY_CONFIG = {
    iconPath: path.join(__dirname, '../../public/tray-icon.png'),
    tooltip: 'Loop Typing Monitor - Active',
    showStats: true,
    enableMiniView: false,
    autoHide: false
};
/**
 * Create tray icon with proper sizing for platform
 */
function createTrayIcon(iconPath) {
    try {
        let iconImage = electron_1.nativeImage.createFromPath(iconPath);
        // 주 아이콘 Failed 시 대체 아이콘
        if (iconImage.isEmpty()) {
            const fallbackPaths = [
                path.join(__dirname, '../../public/tray-icon@2x.png'),
                path.join(__dirname, '../../public/app-icon.png'),
                path.join(__dirname, '../../public/icon.png')
            ];
            for (const fallbackPath of fallbackPaths) {
                try {
                    iconImage = electron_1.nativeImage.createFromPath(fallbackPath);
                    if (!iconImage.isEmpty())
                        break;
                }
                catch (error) {
                    continue;
                }
            }
        }
        // 여전히 비어있으면 간단한 색상 아이콘 생성
        if (iconImage.isEmpty()) {
            iconImage = electron_1.nativeImage.createEmpty();
            console.warn('트레이 아이콘을 찾을 수 없어 빈 아이콘을 사용합니다');
        }
        // 플랫폼별 크기 조정
        const iconSize = process.platform === 'darwin' ? 22 : 16;
        if (!iconImage.isEmpty()) {
            iconImage = iconImage.resize({ width: iconSize, height: iconSize });
        }
        return iconImage;
    }
    catch (error) {
        console.error('트레이 아이콘 생성 Error:', error);
        return electron_1.nativeImage.createEmpty();
    }
}
/**
 * Format duration in human readable format
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    else {
        return `${secs}s`;
    }
}
/**
 * Format numbers with commas
 */
function formatNumber(num) {
    return num.toLocaleString();
}
/**
 * Create context menu for tray
 */
function createTrayMenu(config) {
    const menuTemplate = [];
    // Statistics section (if enabled)
    if (config.showStats) {
        menuTemplate.push({
            label: '📊 Statistics',
            enabled: false
        }, { type: 'separator' }, {
            label: `⌨️  Typing Count: ${formatNumber(trayStats.typingCount)}`,
            enabled: false
        }, {
            label: `⚡ WPM: ${trayStats.wpm}`,
            enabled: false
        }, {
            label: `🎯 Accuracy: ${trayStats.accuracy.toFixed(1)}%`,
            enabled: false
        }, {
            label: `📱 Active App: ${trayStats.activeApp}`,
            enabled: false
        }, {
            label: `⏱️  Uptime: ${formatDuration(trayStats.uptime)}`,
            enabled: false
        }, { type: 'separator' });
    }
    // Main actions
    menuTemplate.push({
        label: '🖥️  Show Main Window',
        click: () => {
            showMainWindow();
        }
    }, {
        label: config.enableMiniView ? '📋 Show Mini View' : '📋 Enable Mini View',
        click: () => {
            toggleMiniView();
        }
    }, { type: 'separator' });
    // Statistics tabs
    menuTemplate.push({
        label: '📈 Statistics View',
        submenu: [
            {
                label: '⌨️  Typing Stats',
                type: 'radio',
                checked: currentStatsTab === 'typing',
                click: () => {
                    currentStatsTab = 'typing';
                    updateTrayMenu();
                    sendStatsTabChange('typing');
                }
            },
            {
                label: '📄 Document Stats',
                type: 'radio',
                checked: currentStatsTab === 'document',
                click: () => {
                    currentStatsTab = 'document';
                    updateTrayMenu();
                    sendStatsTabChange('document');
                }
            },
            {
                label: '🎯 Accuracy Stats',
                type: 'radio',
                checked: currentStatsTab === 'accuracy',
                click: () => {
                    currentStatsTab = 'accuracy';
                    updateTrayMenu();
                    sendStatsTabChange('accuracy');
                }
            }
        ]
    }, { type: 'separator' });
    // Settings and controls
    menuTemplate.push({
        label: '⚙️  Settings',
        click: () => {
            showSettingsWindow();
        }
    }, {
        label: '🔄 Reset Statistics',
        click: () => {
            resetStatistics();
        }
    }, { type: 'separator' }, {
        label: '❓ About',
        click: () => {
            showAboutDialog();
        }
    }, {
        label: '🚪 Quit Loop',
        click: () => {
            electron_1.app.quit();
        }
    });
    return electron_1.Menu.buildFromTemplate(menuTemplate);
}
/**
 * Update tray menu with current data
 */
function updateTrayMenu() {
    if (!tray)
        return;
    try {
        const config = { ...DEFAULT_TRAY_CONFIG }; // In real app, load from settings
        const menu = createTrayMenu(config);
        tray.setContextMenu(menu);
        (0, debug_1.debugLog)('트레이 메뉴 업데이트됨');
    }
    catch (error) {
        console.error('Tray menu update error:', error);
    }
}
/**
 * Show main window
 */
function showMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        (0, debug_1.debugLog)('Main window shown from tray');
    }
}
/**
 * Toggle mini view
 */
function toggleMiniView() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-mini-view');
        (0, debug_1.debugLog)('Mini view toggled from tray');
    }
}
/**
 * Show settings window
 */
function showSettingsWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-settings');
        (0, debug_1.debugLog)('Settings shown from tray');
    }
}
/**
 * Reset statistics
 */
function resetStatistics() {
    trayStats = {
        typingCount: 0,
        sessionsCount: 0,
        accuracy: 0,
        wpm: 0,
        activeApp: 'None',
        uptime: 0
    };
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('reset-statistics');
    }
    updateTrayMenu();
    (0, debug_1.debugLog)('Statistics reset from tray');
}
/**
 * Show about dialog
 */
function showAboutDialog() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-about');
        (0, debug_1.debugLog)('About dialog shown from tray');
    }
}
/**
 * Send statistics tab change to renderer
 */
function sendStatsTabChange(tab) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stats-tab-changed', tab);
        (0, debug_1.debugLog)('통계 탭 변경됨: ${tab}');
    }
}
/**
 * Update tray statistics
 */
function updateTrayStats(stats) {
    trayStats = { ...trayStats, ...stats };
    if (tray) {
        // Update tooltip with current stats
        const tooltip = `Loop Typing Monitor
Typing: ${formatNumber(trayStats.typingCount)}
WPM: ${trayStats.wpm}
Accuracy: ${trayStats.accuracy.toFixed(1)}%
App: ${trayStats.activeApp}`;
        tray.setToolTip(tooltip);
        updateTrayMenu();
    }
}
/**
 * Show tray notification
 */
function showTrayNotification(title, body, urgent = false) {
    if (tray) {
        try {
            tray.displayBalloon({
                title,
                content: body,
                icon: createTrayIcon(DEFAULT_TRAY_CONFIG.iconPath),
                respectQuietTime: !urgent
            });
        }
        catch (error) {
            (0, debug_1.debugLog)('트레이 알림 Error:', error);
        }
    }
}
/**
 * Set tray icon status (active/inactive)
 */
function setTrayStatus(active) {
    if (tray) {
        try {
            const iconPath = active ?
                DEFAULT_TRAY_CONFIG.iconPath :
                path.join(__dirname, '../../public/tray-icon-inactive.png');
            const icon = createTrayIcon(iconPath);
            tray.setImage(icon);
            const tooltip = active ?
                'Loop Typing Monitor - Active' :
                'Loop Typing Monitor - Inactive';
            tray.setToolTip(tooltip);
            (0, debug_1.debugLog)(`트레이 상태 Setup됨: ${active ? '활성' : '비활성'}`);
        }
        catch (error) {
            console.error('Tray status update error:', error);
        }
    }
}
/**
 * Flash tray icon for attention
 */
function flashTrayIcon(times = 3) {
    if (!tray)
        return;
    const originalIcon = createTrayIcon(DEFAULT_TRAY_CONFIG.iconPath);
    const alertIcon = electron_1.nativeImage.createEmpty(); // Empty for flash effect
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        if (flashCount >= times * 2) {
            clearInterval(flashInterval);
            tray.setImage(originalIcon);
            return;
        }
        const useAlert = flashCount % 2 === 0;
        tray.setImage(useAlert ? alertIcon : originalIcon);
        flashCount++;
    }, 500);
}
/**
 * Initialize system tray
 */
function initTray(window, config = {}) {
    mainWindow = window;
    if (trayInitialized) {
        (0, debug_1.debugLog)('Tray already initialized');
        return;
    }
    try {
        const trayConfig = { ...DEFAULT_TRAY_CONFIG, ...config };
        // Create tray icon
        const iconImage = createTrayIcon(trayConfig.iconPath);
        tray = new electron_1.Tray(iconImage);
        // Set initial tooltip
        tray.setToolTip(trayConfig.tooltip);
        // Create and set context menu
        updateTrayMenu();
        // Handle tray click events
        tray.on('click', () => {
            try {
                (0, debug_1.debugLog)('Tray icon clicked');
                if (trayConfig.enableMiniView) {
                    toggleMiniView();
                }
                else {
                    showMainWindow();
                }
            }
            catch (error) {
                console.error('Tray click handler error:', error);
            }
        });
        // Handle right-click (context menu is automatic)
        tray.on('right-click', () => {
            (0, debug_1.debugLog)('Tray right-clicked');
        });
        // Handle double-click
        tray.on('double-click', () => {
            (0, debug_1.debugLog)('Tray double-clicked');
            showMainWindow();
        });
        trayInitialized = true;
        (0, debug_1.debugLog)('System tray initialization completed');
    }
    catch (error) {
        console.error('Tray initialization error:', error);
    }
}
/**
 * Cleanup tray resources
 */
function cleanupTray() {
    try {
        if (tray && !tray.isDestroyed()) {
            tray.destroy();
            tray = null;
        }
        // Reset state
        trayInitialized = false;
        currentStatsTab = 'typing';
        trayStats = {
            typingCount: 0,
            sessionsCount: 0,
            accuracy: 0,
            wpm: 0,
            activeApp: 'None',
            uptime: 0
        };
        (0, debug_1.debugLog)('Tray cleanup completed');
    }
    catch (error) {
        console.error('Tray cleanup error:', error);
    }
}
/**
 * Get tray status
 */
function getTrayStatus() {
    return {
        initialized: trayInitialized,
        visible: tray !== null && !tray.isDestroyed(),
        currentTab: currentStatsTab,
        stats: { ...trayStats }
    };
}
//# sourceMappingURL=tray.js.map