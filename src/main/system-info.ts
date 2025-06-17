/**
 * 고급 시스템 정보 및 모니터링 모듈
 * 시스템 통계, 브라우저 감지, 디버그 정보, 권한을 처리합니다
 */
import { ipcMain, app, dialog, BrowserWindow, systemPreferences } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, exec } from 'child_process';
// active-win 호환성을 위한 동적 가져오기
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

// 전역 상태
let mainWindow: BrowserWindow | null = null;
let systemInfoInitialized = false;
let permissionErrorShown = false;
let isInFallbackMode = false;
let lastPermissionCheckTime = 0;
const PERMISSION_CHECK_COOLDOWN = 5000; // 5 seconds

// 개발 앱의 권한 추적
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
  
  // CPU 사용률 계산
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
    debugLog('CPU 사용량 가져오기 Failed:', error);
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
    debugLog('프로세스 목록 가져오기 Failed:', error);
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
      // 접근성 권한 확인
      permissions.accessibility = systemPreferences.isTrustedAccessibilityClient(false);
      
      // 화면 녹화 권한 확인
      permissions.screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
      
      // 마이크 권한 확인
      permissions.microphone = systemPreferences.getMediaAccessStatus('microphone') === 'granted';
      
      // 카메라 권한 확인
      permissions.camera = systemPreferences.getMediaAccessStatus('camera') === 'granted';
      
    } catch (error) {
      debugLog('권한 확인 Error:', error);
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
      // 접근성 권한 요청
      permissions.accessibility = systemPreferences.isTrustedAccessibilityClient(true);
      
      // 마이크 권한 요청
      const microphoneAccess = await systemPreferences.askForMediaAccess('microphone');
      permissions.microphone = microphoneAccess;
      
      // 카메라 권한 요청
      const cameraAccess = await systemPreferences.askForMediaAccess('camera');
      permissions.camera = cameraAccess;
      
      // 화면 녹화 권한은 시스템 대화상자가 필요함
      permissions.screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
      
    } catch (error) {
      debugLog('권한 요청 Error:', error);
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
    
    // 브라우저 감지
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
    
    // Google Docs 감지
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
    debugLog('브라우저 감지 Error:', error);
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
    debugLog('디스크 사용량 감지 Error:', error);
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
 * 시스템 디렉토리 및 파일 체크 (fs 모듈 사용)
 */
function checkSystemFiles(): boolean {
  try {
    const tempDir = path.join(os.tmpdir(), 'loop-system');
    
    // 임시 디렉토리 확인 및 생성
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('시스템 임시 디렉토리 생성:', tempDir);
    }
    
    // 시스템 정보 파일 체크
    const infoFile = path.join(tempDir, 'system-info.json');
    const systemInfo = getSystemInfo();
    
    fs.writeFileSync(infoFile, JSON.stringify(systemInfo, null, 2));
    console.log('시스템 정보 파일 저장:', infoFile);
    
    return true;
  } catch (error) {
    console.error('시스템 파일 체크 실패:', error);
    return false;
  }
}

/**
 * 시스템 명령어 실행 (exec 모듈 사용)
 */
function executeSystemCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`시스템 명령어 실행 실패 [${command}]:`, error instanceof Error ? error.message : String(error));
        if (stderr) {
          console.error('stderr:', stderr);
        }
        reject(error);
      } else {
        console.log(`시스템 명령어 실행 성공 [${command}]`);
        if (stderr) {
          console.warn('stderr (경고):', stderr);
        }
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * 권한 체크 쿨다운 관리 (PERMISSION_CHECK_COOLDOWN 사용)
 */
function canCheckPermissions(): boolean {
  const now = Date.now();
  if (now - lastPermissionCheckTime < PERMISSION_CHECK_COOLDOWN) {
    console.log('권한 체크 쿨다운 중:', PERMISSION_CHECK_COOLDOWN - (now - lastPermissionCheckTime), 'ms 남음');
    return false;
  }
  lastPermissionCheckTime = now;
  return true;
}

/**
 * 개발 앱 권한 상태 로깅 (permissionApps 사용)
 */
function logPermissionAppsStatus(): void {
  console.log('개발 앱 권한 상태:');
  Object.entries(permissionApps).forEach(([key, app]) => {
    console.log(`- [${key}] ${app.name}: 필요=${app.required}, 승인=${app.granted}, 경로=${app.path}`);
  });
}

/**
 * 활성 윈도우 정보 가져오기 (loadActiveWin 사용)
 */
async function getActiveWindowInfo(): Promise<any> {
  try {
    const activeWin = await loadActiveWin();
    if (activeWin && activeWin.default) {
      const windowInfo = await activeWin.default();
      console.log('활성 윈도우 정보:', windowInfo?.title || 'Unknown');
      return windowInfo;
    }
    console.log('active-win 모듈을 사용할 수 없습니다');
    return null;
  } catch (error) {
    console.error('활성 윈도우 정보 가져오기 실패:', error);
    return null;
  }
}

/**
 * Setup system info IPC handlers
 */
function setupSystemInfoIpcHandlers(): void {
  // 기본 시스템 정보 가져오기
  ipcMain.handle('getSystemInfo', async () => {
    return getSystemInfo();
  });
  
  // 메모리 정보 가져오기
  ipcMain.handle('getMemoryInfo', async () => {
    return getMemoryInfo();
  });
  
  // CPU 정보 가져오기
  ipcMain.handle('getCpuInfo', async () => {
    return await getCPUInfo();
  });
  
  // 프로세스 목록 가져오기
  ipcMain.handle('getProcessList', async () => {
    return getProcessList();
  });
  
  // 시스템 권한 확인
  ipcMain.handle('checkSystemPermissions', async () => {
    return await checkSystemPermissions();
  });
  
  // 시스템 권한 요청
  ipcMain.handle('requestSystemPermissions', async () => {
    return await requestSystemPermissions();
  });
  
  // 브라우저 정보 감지
  ipcMain.handle('detectBrowserInfo', async () => {
    return await detectBrowserInfo();
  });
  
  // 디스크 사용량 가져오기
  ipcMain.handle('getDiskUsage', async () => {
    return await getDiskUsage();
  });
  
  // 네트워크 정보 가져오기
  ipcMain.handle('getNetworkInfo', async () => {
    return getNetworkInfo();
  });
  
  // 디버그 정보 가져오기
  ipcMain.handle('getDebugInfo', async () => {
    return getDebugInfo();
  });
  
  // 권한을 위한 시스템 환경설정 열기
  ipcMain.handle('openSystemPreferences', async (event, panel?: string) => {
    if (process.platform === 'darwin') {
      const command = panel ? 
        `open "x-apple.systempreferences:com.apple.preference.security?${panel}"` :
        'open "x-apple.systempreferences:com.apple.preference.security"';
      
      try {
        execSync(command);
        return true;
      } catch (error) {
        debugLog('시스템 환경Setup 열기 Failed:', error);
        return false;
      }
    }
    return false;
  });
  
  // 권한 대화상자 표시
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
    // IPC 핸들러 설정
    setupSystemInfoIpcHandlers();
    
    // 초기 권한 확인
    checkSystemPermissions().then(permissions => {
      debugLog('초기 권한 상태:', permissions);
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
    // 상태 변수 리셋
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

/**
 * 시스템 정보 모듈 초기화 (모든 함수 테스트)
 */
export function initializeSystemInfo(): void {
  console.log('시스템 정보 모듈 초기화 시작');
  
  // 파일 시스템 체크
  checkSystemFiles();
  
  // 권한 상태 로깅
  logPermissionAppsStatus();
  
  // 권한 체크 쿨다운 테스트
  if (canCheckPermissions()) {
    console.log('권한 체크 가능');
  }
  
  // 활성 윈도우 정보 가져오기
  getActiveWindowInfo().then(windowInfo => {
    if (windowInfo) {
      console.log('활성 윈도우 감지됨');
    }
  });
  
  // 시스템 명령어 테스트 (macOS에서만)
  if (process.platform === 'darwin') {
    executeSystemCommand('uname -a').then(result => {
      console.log('시스템 정보:', result);
    }).catch(error => {
      console.log('시스템 명령어 실행 실패:', error instanceof Error ? error.message : String(error));
    });
  }
  
  systemInfoInitialized = true;
  console.log('시스템 정보 모듈 초기화 완료');
}
