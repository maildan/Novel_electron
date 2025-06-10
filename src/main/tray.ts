/**
 * Advanced system tray management module
 * Handles tray icon, context menu, notifications, and statistics display
 */
import { Tray, Menu, app, nativeImage, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import { debugLog } from '../utils/debug';

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

// Global state
let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let trayInitialized = false;
let currentStatsTab = 'typing'; // 'typing', 'document', 'accuracy'
let trayStats: TrayStats = {
  typingCount: 0,
  sessionsCount: 0,
  accuracy: 0,
  wpm: 0,
  activeApp: 'None',
  uptime: 0
};

// Default configuration
const DEFAULT_TRAY_CONFIG: Required<TrayConfig> = {
  iconPath: path.join(__dirname, '../../public/tray-icon.png'),
  tooltip: 'Loop Typing Monitor - Active',
  showStats: true,
  enableMiniView: false,
  autoHide: false
};

/**
 * Create tray icon with proper sizing for platform
 */
function createTrayIcon(iconPath: string): Electron.NativeImage {
  try {
    let iconImage = nativeImage.createFromPath(iconPath);
    
    // Fallback icons if primary icon fails
    if (iconImage.isEmpty()) {
      const fallbackPaths = [
        path.join(__dirname, '../../public/tray-icon@2x.png'),
        path.join(__dirname, '../../public/app-icon.png'),
        path.join(__dirname, '../../public/icon.png')
      ];
      
      for (const fallbackPath of fallbackPaths) {
        try {
          iconImage = nativeImage.createFromPath(fallbackPath);
          if (!iconImage.isEmpty()) break;
        } catch (error) {
          continue;
        }
      }
    }
    
    // If still empty, create a simple colored icon
    if (iconImage.isEmpty()) {
      iconImage = nativeImage.createEmpty();
      console.warn('No tray icon found, using empty icon');
    }
    
    // Platform-specific sizing
    const iconSize = process.platform === 'darwin' ? 22 : 16;
    if (!iconImage.isEmpty()) {
      iconImage = iconImage.resize({ width: iconSize, height: iconSize });
    }
    
    return iconImage;
  } catch (error) {
    console.error('Tray icon creation error:', error);
    return nativeImage.createEmpty();
  }
}

/**
 * Format duration in human readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Create context menu for tray
 */
function createTrayMenu(config: Required<TrayConfig>): Menu {
  const menuTemplate: MenuItemConstructorOptions[] = [];
  
  // Statistics section (if enabled)
  if (config.showStats) {
    menuTemplate.push(
      {
        label: '📊 Statistics',
        enabled: false
      },
      { type: 'separator' },
      {
        label: `⌨️  Typing Count: ${formatNumber(trayStats.typingCount)}`,
        enabled: false
      },
      {
        label: `⚡ WPM: ${trayStats.wpm}`,
        enabled: false
      },
      {
        label: `🎯 Accuracy: ${trayStats.accuracy.toFixed(1)}%`,
        enabled: false
      },
      {
        label: `📱 Active App: ${trayStats.activeApp}`,
        enabled: false
      },
      {
        label: `⏱️  Uptime: ${formatDuration(trayStats.uptime)}`,
        enabled: false
      },
      { type: 'separator' }
    );
  }
  
  // Main actions
  menuTemplate.push(
    {
      label: '🖥️  Show Main Window',
      click: () => {
        showMainWindow();
      }
    },
    {
      label: config.enableMiniView ? '📋 Show Mini View' : '📋 Enable Mini View',
      click: () => {
        toggleMiniView();
      }
    },
    { type: 'separator' }
  );
  
  // Statistics tabs
  menuTemplate.push(
    {
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
    },
    { type: 'separator' }
  );
  
  // Settings and controls
  menuTemplate.push(
    {
      label: '⚙️  Settings',
      click: () => {
        showSettingsWindow();
      }
    },
    {
      label: '🔄 Reset Statistics',
      click: () => {
        resetStatistics();
      }
    },
    { type: 'separator' },
    {
      label: '❓ About',
      click: () => {
        showAboutDialog();
      }
    },
    {
      label: '🚪 Quit Loop',
      click: () => {
        app.quit();
      }
    }
  );
  
  return Menu.buildFromTemplate(menuTemplate);
}

/**
 * Update tray menu with current data
 */
function updateTrayMenu(): void {
  if (!tray) return;
  
  try {
    const config = { ...DEFAULT_TRAY_CONFIG }; // In real app, load from settings
    const menu = createTrayMenu(config);
    tray.setContextMenu(menu);
    
    debugLog('Tray menu updated');
  } catch (error) {
    console.error('Tray menu update error:', error);
  }
}

/**
 * Show main window
 */
function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    
    debugLog('Main window shown from tray');
  }
}

/**
 * Toggle mini view
 */
function toggleMiniView(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('toggle-mini-view');
    debugLog('Mini view toggled from tray');
  }
}

/**
 * Show settings window
 */
function showSettingsWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-settings');
    debugLog('Settings shown from tray');
  }
}

/**
 * Reset statistics
 */
function resetStatistics(): void {
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
  debugLog('Statistics reset from tray');
}

/**
 * Show about dialog
 */
function showAboutDialog(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-about');
    debugLog('About dialog shown from tray');
  }
}

/**
 * Send statistics tab change to renderer
 */
function sendStatsTabChange(tab: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stats-tab-changed', tab);
    debugLog(`Statistics tab changed to: ${tab}`);
  }
}

/**
 * Update tray statistics
 */
export function updateTrayStats(stats: Partial<TrayStats>): void {
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
export function showTrayNotification(title: string, body: string, urgent: boolean = false): void {
  if (tray) {
    try {
      tray.displayBalloon({
        title,
        content: body,
        icon: createTrayIcon(DEFAULT_TRAY_CONFIG.iconPath),
        respectQuietTime: !urgent
      });
    } catch (error) {
      debugLog('Tray notification error:', error);
    }
  }
}

/**
 * Set tray icon status (active/inactive)
 */
export function setTrayStatus(active: boolean): void {
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
      
      debugLog(`Tray status set to: ${active ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error('Tray status update error:', error);
    }
  }
}

/**
 * Flash tray icon for attention
 */
export function flashTrayIcon(times: number = 3): void {
  if (!tray) return;
  
  const originalIcon = createTrayIcon(DEFAULT_TRAY_CONFIG.iconPath);
  const alertIcon = nativeImage.createEmpty(); // Empty for flash effect
  
  let flashCount = 0;
  const flashInterval = setInterval(() => {
    if (flashCount >= times * 2) {
      clearInterval(flashInterval);
      tray!.setImage(originalIcon);
      return;
    }
    
    const useAlert = flashCount % 2 === 0;
    tray!.setImage(useAlert ? alertIcon : originalIcon);
    flashCount++;
  }, 500);
}

/**
 * Initialize system tray
 */
export function initTray(window: BrowserWindow, config: TrayConfig = {}): void {
  mainWindow = window;
  
  if (trayInitialized) {
    debugLog('Tray already initialized');
    return;
  }
  
  try {
    const trayConfig = { ...DEFAULT_TRAY_CONFIG, ...config };
    
    // Create tray icon
    const iconImage = createTrayIcon(trayConfig.iconPath);
    tray = new Tray(iconImage);
    
    // Set initial tooltip
    tray.setToolTip(trayConfig.tooltip);
    
    // Create and set context menu
    updateTrayMenu();
    
    // Handle tray click events
    tray.on('click', () => {
      try {
        debugLog('Tray icon clicked');
        if (trayConfig.enableMiniView) {
          toggleMiniView();
        } else {
          showMainWindow();
        }
      } catch (error) {
        console.error('Tray click handler error:', error);
      }
    });
    
    // Handle right-click (context menu is automatic)
    tray.on('right-click', () => {
      debugLog('Tray right-clicked');
    });
    
    // Handle double-click
    tray.on('double-click', () => {
      debugLog('Tray double-clicked');
      showMainWindow();
    });
    
    trayInitialized = true;
    debugLog('System tray initialization completed');
  } catch (error) {
    console.error('Tray initialization error:', error);
  }
}

/**
 * Cleanup tray resources
 */
export function cleanupTray(): void {
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
    
    debugLog('Tray cleanup completed');
  } catch (error) {
    console.error('Tray cleanup error:', error);
  }
}

/**
 * Get tray status
 */
export function getTrayStatus(): {
  initialized: boolean;
  visible: boolean;
  currentTab: string;
  stats: TrayStats;
} {
  return {
    initialized: trayInitialized,
    visible: tray !== null && !tray.isDestroyed(),
    currentTab: currentStatsTab,
    stats: { ...trayStats }
  };
}
