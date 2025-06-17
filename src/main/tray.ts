/**
 * 고급 시스템 트레이 관리 모듈
 * 트레이 아이콘, 컨텍스트 메뉴, 알림, 통계 표시를 담당합니다
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

// 전역 상태
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

// 기본 Setup
const DEFAULT_TRAY_CONFIG: Required<TrayConfig> = {
  iconPath: path.join(__dirname, '../../public/appIcon.webp'),
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
    
    // 주 아이콘 Failed 시 대체 아이콘
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
    
    // 여전히 비어있으면 간단한 색상 아이콘 생성
    if (iconImage.isEmpty()) {
      iconImage = nativeImage.createEmpty();
      console.warn('트레이 아이콘을 찾을 수 없어 빈 아이콘을 사용합니다');
    }
    
    // 플랫폼별 크기 조정
    const iconSize = process.platform === 'darwin' ? 22 : 16;
    if (!iconImage.isEmpty()) {
      iconImage = iconImage.resize({ width: iconSize, height: iconSize });
    }
    
    return iconImage;
  } catch (error) {
    console.error('트레이 아이콘 생성 Error:', error);
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
  
  // 통계 섹션 (활성화된 경우)
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
  
  // 주요 액션
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
  
  // 통계 탭
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
  
  // 설정 및 제어
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
    
    debugLog('트레이 메뉴 업데이트됨');
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
    debugLog('통계 탭 변경됨: ${tab}');
  }
}

/**
 * Update tray statistics
 */
export function updateTrayStats(stats: Partial<TrayStats>): void {
  trayStats = { ...trayStats, ...stats };
  
  if (tray) {
    // 현재 통계로 툴팁 업데이트
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
      debugLog('트레이 알림 Error:', error);
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
      
      debugLog(`트레이 상태 Setup됨: ${active ? '활성' : '비활성'}`);
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
    
    // 트레이 아이콘 생성
    const iconImage = createTrayIcon(trayConfig.iconPath);
    tray = new Tray(iconImage);
    
    // 초기 툴팁 설정
    tray.setToolTip(trayConfig.tooltip);
    
    // 컨텍스트 메뉴 생성 및 설정
    updateTrayMenu();
    
    // 트레이 클릭 이벤트 처리
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
    
    // 우클릭 처리 (컨텍스트 메뉴는 자동)
    tray.on('right-click', () => {
      debugLog('Tray right-clicked');
    });
    
    // 더블클릭 처리
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
    
    // 상태 리셋
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
