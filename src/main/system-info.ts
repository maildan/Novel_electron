/**
 * Advanced system information and monitoring module
 * Handles system stats, browser detection, debug info, and permissions
 */
import { ipcMain, app, dialog, BrowserWindow, systemPreferences } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, exec } from 'child_process';
// Dynamic import for active-win compatibility
let activeWinModule: any = null;
async function loadActiveWin() {
  if (!activeWinModule) {
    try {
      activeWinModule = await import('active-win');
    } catch (error) {
      console.warn('active-win module not available:', error);
    }
  }
  return activeWinModule;
}
import { debugLog } from '../utils/debug';

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  hostname: string;
  uptime: number;
  loadavg: number[];
  totalmem: number;
  freemem: number;
  cpus: os.CpuInfo[];
}

interface ProcessInfo {
  pid: number;
  name: string;
  ppid?: number;
  cpu?: number;
  memory?: number;
}

interface PermissionStatus {
  accessibility: boolean;
  screenRecording: boolean;
  microphone: boolean;
  camera: boolean;
  mediaLibrary: boolean;
}

interface BrowserInfo {
  name: string;
  version?: string;
  isGoogleDocs?: boolean;
  url?: string;
  windowTitle?: string;
}

// Global state
let mainWindow: BrowserWindow | null = null;
let systemInfoInitialized = false;
let permissionErrorShown = false;
let isInFallbackMode = false;
let lastPermissionCheckTime = 0;
const PERMISSION_CHECK_COOLDOWN = 5000; // 5 seconds

// Permission tracking for development apps
const permissionApps = {
  terminal: {
    name: 'Terminal',
    path: '/Applications/Utilities/Terminal.app',
    required: process.env.TERM_PROGRAM === 'Apple_Terminal',
    granted: false
  },
  iterm: {
    name: 'iTerm',
    path: '/Applications/iTerm.app',
    required: process.env.TERM_PROGRAM === 'iTerm.app',
    granted: false
  },
  vscode: {
    name: 'Visual Studio Code',
    path: '/Applications/Visual Studio Code.app',
    required: process.env.TERM_PROGRAM === 'vscode',
    granted: false
  },
  cursor: {
    name: 'Cursor',
    path: '/Applications/Cursor.app',
    required: process.env.TERM_PROGRAM?.includes('Cursor'),
    granted: false
  }
};

/**
 * Get comprehensive system information
 */
function getSystemInfo(): SystemInfo {
  return {
    platform: os.platform(),
    arch: os.arch(),
    version: os.version(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus()
  };
}

/**
 * Get memory usage information
 */
function getMemoryInfo(): {
  total: number;
  free: number;
  used: number;
  percentage: number;
  process: NodeJS.MemoryUsage;
} {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const percentage = (used / total) * 100;
  
  return {
    total,
    free,
    used,
    percentage,
    process: process.memoryUsage()
  };
}

/**
 * Get CPU information and current usage
 */
async function getCPUInfo(): Promise<{
  model: string;
  cores: number;
  usage: number;
  temperature?: number;
}> {
  const cpus = os.cpus();
  const model = cpus[0]?.model || 'Unknown';
  const cores = cpus.length;
  
  // Calculate CPU usage
  let usage = 0;
  try {
    if (process.platform === 'darwin') {
      const output = execSync('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf8' });
      const match = output.match(/(\d+\.\d+)%\s+user/);
      if (match) {
        usage = parseFloat(match[1]);
      }
    } else if (process.platform === 'linux') {
      const output = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
      const match = output.match(/(\d+\.\d+)%us/);
      if (match) {
        usage = parseFloat(match[1]);
      }
    }
  } catch (error) {
    debugLog('Failed to get CPU usage:', error);
  }
  
  return { model, cores, usage };
}

/**
 * Get running processes information
 */
function getProcessList(): ProcessInfo[] {
  try {
    let command = '';
    if (process.platform === 'darwin' || process.platform === 'linux') {
      command = 'ps aux';
    } else if (process.platform === 'win32') {
      command = 'tasklist /fo csv';
    } else {
      return [];
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    const lines = output.split('\n').slice(1); // Skip header
    
    return lines.slice(0, 20).map((line, index) => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[1]) || index,
        name: parts[10] || parts[0] || 'Unknown'
      };
    }).filter(proc => proc.name !== 'Unknown');
  } catch (error) {
    debugLog('Failed to get process list:', error);
    return [];
  }
}

/**
 * Check system permissions
 */
async function checkSystemPermissions(): Promise<PermissionStatus> {
  const permissions: PermissionStatus = {
    accessibility: false,
    screenRecording: false,
    microphone: false,
    camera: false,
    mediaLibrary: false
  };
  
  if (process.platform === 'darwin') {
    try {
      // Check accessibility permission
      permissions.accessibility = systemPreferences.isTrustedAccessibilityClient(false);
      
      // Check screen recording permission
      permissions.screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
      
      // Check microphone permission
      permissions.microphone = systemPreferences.getMediaAccessStatus('microphone') === 'granted';
      
      // Check camera permission
      permissions.camera = systemPreferences.getMediaAccessStatus('camera') === 'granted';
      
    } catch (error) {
      debugLog('Permission check error:', error);
    }
  }
  
  return permissions;
}

/**
 * Request system permissions
 */
async function requestSystemPermissions(): Promise<PermissionStatus> {
  const permissions: PermissionStatus = {
    accessibility: false,
    screenRecording: false,
    microphone: false,
    camera: false,
    mediaLibrary: false
  };
  
  if (process.platform === 'darwin') {
    try {
      // Request accessibility permission
      permissions.accessibility = systemPreferences.isTrustedAccessibilityClient(true);
      
      // Request microphone permission
      const microphoneAccess = await systemPreferences.askForMediaAccess('microphone');
      permissions.microphone = microphoneAccess;
      
      // Request camera permission
      const cameraAccess = await systemPreferences.askForMediaAccess('camera');
      permissions.camera = cameraAccess;
      
      // Screen recording permission requires system dialog
      permissions.screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
      
    } catch (error) {
      debugLog('Permission request error:', error);
    }
  }
  
  return permissions;
}

/**
 * Detect browser information from active window
 */
async function detectBrowserInfo(): Promise<BrowserInfo | null> {
  try {
    if (!activeWinModule) return null;
    
    const activeWindow = await activeWinModule();
    if (!activeWindow) return null;
    
    const appName = activeWindow.owner?.name?.toLowerCase() || '';
    const windowTitle = activeWindow.title || '';
    
    // Browser detection
    let browserName = 'Unknown';
    if (appName.includes('chrome')) {
      browserName = 'Google Chrome';
    } else if (appName.includes('firefox')) {
      browserName = 'Firefox';
    } else if (appName.includes('safari')) {
      browserName = 'Safari';
    } else if (appName.includes('edge')) {
      browserName = 'Microsoft Edge';
    } else if (appName.includes('brave')) {
      browserName = 'Brave';
    } else if (appName.includes('opera')) {
      browserName = 'Opera';
    }
    
    // Google Docs detection
    const isGoogleDocs = windowTitle.includes('Google Docs') || 
                        windowTitle.includes('Google Sheets') ||
                        windowTitle.includes('Google Slides');
    
    return {
      name: browserName,
      windowTitle,
      isGoogleDocs,
      url: windowTitle // Simplified - actual URL detection would require more complex logic
    };
  } catch (error) {
    debugLog('Browser detection error:', error);
    return null;
  }
}

/**
 * Get disk usage information
 */
async function getDiskUsage(): Promise<{
  total: number;
  used: number;
  free: number;
  percentage: number;
}> {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const output = execSync('df -h /', { encoding: 'utf8' });
      const lines = output.split('\n');
      const diskLine = lines[1].split(/\s+/);
      
      const total = parseFloat(diskLine[1].replace('G', '')) * 1024 * 1024 * 1024;
      const used = parseFloat(diskLine[2].replace('G', '')) * 1024 * 1024 * 1024;
      const free = parseFloat(diskLine[3].replace('G', '')) * 1024 * 1024 * 1024;
      const percentage = parseFloat(diskLine[4].replace('%', ''));
      
      return { total, used, free, percentage };
    }
  } catch (error) {
    debugLog('Disk usage detection error:', error);
  }
  
  return { total: 0, used: 0, free: 0, percentage: 0 };
}

/**
 * Get network information
 */
function getNetworkInfo(): { [key: string]: os.NetworkInterfaceInfo[] } {
  const interfaces = os.networkInterfaces();
  const result: { [key: string]: os.NetworkInterfaceInfo[] } = {};
  
  for (const [name, interfaceList] of Object.entries(interfaces)) {
    if (interfaceList) {
      result[name] = interfaceList;
    }
  }
  
  return result;
}

/**
 * Get application debug information
 */
function getDebugInfo(): {
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
  v8Version: string;
  appVersion: string;
  appPath: string;
  userDataPath: string;
  tempPath: string;
  isPackaged: boolean;
  isDev: boolean;
} {
  return {
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    v8Version: process.versions.v8,
    appVersion: app.getVersion(),
    appPath: app.getAppPath(),
    userDataPath: app.getPath('userData'),
    tempPath: app.getPath('temp'),
    isPackaged: app.isPackaged,
    isDev: !app.isPackaged
  };
}

/**
 * Setup system info IPC handlers
 */
function setupSystemInfoIpcHandlers(): void {
  // Get basic system information
  ipcMain.handle('getSystemInfo', async () => {
    return getSystemInfo();
  });
  
  // Get memory information
  ipcMain.handle('getMemoryInfo', async () => {
    return getMemoryInfo();
  });
  
  // Get CPU information
  ipcMain.handle('getCpuInfo', async () => {
    return await getCPUInfo();
  });
  
  // Get process list
  ipcMain.handle('getProcessList', async () => {
    return getProcessList();
  });
  
  // Check system permissions
  ipcMain.handle('checkSystemPermissions', async () => {
    return await checkSystemPermissions();
  });
  
  // Request system permissions
  ipcMain.handle('requestSystemPermissions', async () => {
    return await requestSystemPermissions();
  });
  
  // Detect browser information
  ipcMain.handle('detectBrowserInfo', async () => {
    return await detectBrowserInfo();
  });
  
  // Get disk usage
  ipcMain.handle('getDiskUsage', async () => {
    return await getDiskUsage();
  });
  
  // Get network information
  ipcMain.handle('getNetworkInfo', async () => {
    return getNetworkInfo();
  });
  
  // Get debug information
  ipcMain.handle('getDebugInfo', async () => {
    return getDebugInfo();
  });
  
  // Open system preferences for permissions
  ipcMain.handle('openSystemPreferences', async (event, panel?: string) => {
    if (process.platform === 'darwin') {
      const command = panel ? 
        `open "x-apple.systempreferences:com.apple.preference.security?${panel}"` :
        'open "x-apple.systempreferences:com.apple.preference.security"';
      
      try {
        execSync(command);
        return true;
      } catch (error) {
        debugLog('Failed to open system preferences:', error);
        return false;
      }
    }
    return false;
  });
  
  // Show permission dialog
  ipcMain.handle('show-permission-dialog', async (event, message: string) => {
    if (permissionErrorShown) return;
    
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: 'Permission Required',
      message: 'Accessibility Permission Required',
      detail: message,
      buttons: ['Open System Preferences', 'Continue Without Permission', 'Quit'],
      defaultId: 0,
      cancelId: 1
    });
    
    permissionErrorShown = true;
    
    switch (result.response) {
      case 0: // Open System Preferences
        await requestSystemPermissions();
        break;
      case 1: // Continue without permission
        isInFallbackMode = true;
        break;
      case 2: // Quit
        app.quit();
        break;
    }
    
    return result.response;
  });
  
  debugLog('System info IPC handlers registered');
}

/**
 * Initialize system information module
 */
export function initSystemInfo(window: BrowserWindow): void {
  mainWindow = window;
  
  if (systemInfoInitialized) {
    debugLog('System info module already initialized');
    return;
  }
  
  try {
    // Setup IPC handlers
    setupSystemInfoIpcHandlers();
    
    // Initial permission check
    checkSystemPermissions().then(permissions => {
      debugLog('Initial permission status:', permissions);
    });
    
    systemInfoInitialized = true;
    debugLog('System info module initialization completed');
  } catch (error) {
    console.error('System info module initialization error:', error);
  }
}

/**
 * Cleanup system info resources
 */
export function cleanupSystemInfo(): void {
  try {
    // Reset state variables
    systemInfoInitialized = false;
    permissionErrorShown = false;
    isInFallbackMode = false;
    lastPermissionCheckTime = 0;
    mainWindow = null;
    
    debugLog('System info module cleanup completed');
  } catch (error) {
    console.error('System info module cleanup error:', error);
  }
}

/**
 * Get system info module status
 */
export function getSystemInfoStatus(): {
  initialized: boolean;
  fallbackMode: boolean;
  lastPermissionCheck: number;
} {
  return {
    initialized: systemInfoInitialized,
    fallbackMode: isInFallbackMode,
    lastPermissionCheck: lastPermissionCheckTime
  };
}
