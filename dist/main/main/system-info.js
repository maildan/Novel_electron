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
exports.initSystemInfo = initSystemInfo;
exports.cleanupSystemInfo = cleanupSystemInfo;
exports.getSystemInfoStatus = getSystemInfoStatus;
/**
 * Advanced system information and monitoring module
 * Handles system stats, browser detection, debug info, and permissions
 */
const electron_1 = require("electron");
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
// Dynamic import for active-win compatibility
let activeWinModule = null;
async function loadActiveWin() {
    if (!activeWinModule) {
        try {
            activeWinModule = await Promise.resolve().then(() => __importStar(require('active-win')));
        }
        catch (error) {
            console.warn('active-win module not available:', error);
        }
    }
    return activeWinModule;
}
const debug_1 = require("../utils/debug");
// Global state
let mainWindow = null;
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
function getSystemInfo() {
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
function getMemoryInfo() {
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
async function getCPUInfo() {
    const cpus = os.cpus();
    const model = cpus[0]?.model || 'Unknown';
    const cores = cpus.length;
    // Calculate CPU usage
    let usage = 0;
    try {
        if (process.platform === 'darwin') {
            const output = (0, child_process_1.execSync)('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf8' });
            const match = output.match(/(\d+\.\d+)%\s+user/);
            if (match) {
                usage = parseFloat(match[1]);
            }
        }
        else if (process.platform === 'linux') {
            const output = (0, child_process_1.execSync)('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
            const match = output.match(/(\d+\.\d+)%us/);
            if (match) {
                usage = parseFloat(match[1]);
            }
        }
    }
    catch (error) {
        (0, debug_1.debugLog)('Failed to get CPU usage:', error);
    }
    return { model, cores, usage };
}
/**
 * Get running processes information
 */
function getProcessList() {
    try {
        let command = '';
        if (process.platform === 'darwin' || process.platform === 'linux') {
            command = 'ps aux';
        }
        else if (process.platform === 'win32') {
            command = 'tasklist /fo csv';
        }
        else {
            return [];
        }
        const output = (0, child_process_1.execSync)(command, { encoding: 'utf8' });
        const lines = output.split('\n').slice(1); // Skip header
        return lines.slice(0, 20).map((line, index) => {
            const parts = line.trim().split(/\s+/);
            return {
                pid: parseInt(parts[1]) || index,
                name: parts[10] || parts[0] || 'Unknown'
            };
        }).filter(proc => proc.name !== 'Unknown');
    }
    catch (error) {
        (0, debug_1.debugLog)('Failed to get process list:', error);
        return [];
    }
}
/**
 * Check system permissions
 */
async function checkSystemPermissions() {
    const permissions = {
        accessibility: false,
        screenRecording: false,
        microphone: false,
        camera: false,
        mediaLibrary: false
    };
    if (process.platform === 'darwin') {
        try {
            // Check accessibility permission
            permissions.accessibility = electron_1.systemPreferences.isTrustedAccessibilityClient(false);
            // Check screen recording permission
            permissions.screenRecording = electron_1.systemPreferences.getMediaAccessStatus('screen') === 'granted';
            // Check microphone permission
            permissions.microphone = electron_1.systemPreferences.getMediaAccessStatus('microphone') === 'granted';
            // Check camera permission
            permissions.camera = electron_1.systemPreferences.getMediaAccessStatus('camera') === 'granted';
        }
        catch (error) {
            (0, debug_1.debugLog)('Permission check error:', error);
        }
    }
    return permissions;
}
/**
 * Request system permissions
 */
async function requestSystemPermissions() {
    const permissions = {
        accessibility: false,
        screenRecording: false,
        microphone: false,
        camera: false,
        mediaLibrary: false
    };
    if (process.platform === 'darwin') {
        try {
            // Request accessibility permission
            permissions.accessibility = electron_1.systemPreferences.isTrustedAccessibilityClient(true);
            // Request microphone permission
            const microphoneAccess = await electron_1.systemPreferences.askForMediaAccess('microphone');
            permissions.microphone = microphoneAccess;
            // Request camera permission
            const cameraAccess = await electron_1.systemPreferences.askForMediaAccess('camera');
            permissions.camera = cameraAccess;
            // Screen recording permission requires system dialog
            permissions.screenRecording = electron_1.systemPreferences.getMediaAccessStatus('screen') === 'granted';
        }
        catch (error) {
            (0, debug_1.debugLog)('Permission request error:', error);
        }
    }
    return permissions;
}
/**
 * Detect browser information from active window
 */
async function detectBrowserInfo() {
    try {
        if (!activeWinModule)
            return null;
        const activeWindow = await activeWinModule();
        if (!activeWindow)
            return null;
        const appName = activeWindow.owner?.name?.toLowerCase() || '';
        const windowTitle = activeWindow.title || '';
        // Browser detection
        let browserName = 'Unknown';
        if (appName.includes('chrome')) {
            browserName = 'Google Chrome';
        }
        else if (appName.includes('firefox')) {
            browserName = 'Firefox';
        }
        else if (appName.includes('safari')) {
            browserName = 'Safari';
        }
        else if (appName.includes('edge')) {
            browserName = 'Microsoft Edge';
        }
        else if (appName.includes('brave')) {
            browserName = 'Brave';
        }
        else if (appName.includes('opera')) {
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
    }
    catch (error) {
        (0, debug_1.debugLog)('Browser detection error:', error);
        return null;
    }
}
/**
 * Get disk usage information
 */
async function getDiskUsage() {
    try {
        if (process.platform === 'darwin' || process.platform === 'linux') {
            const output = (0, child_process_1.execSync)('df -h /', { encoding: 'utf8' });
            const lines = output.split('\n');
            const diskLine = lines[1].split(/\s+/);
            const total = parseFloat(diskLine[1].replace('G', '')) * 1024 * 1024 * 1024;
            const used = parseFloat(diskLine[2].replace('G', '')) * 1024 * 1024 * 1024;
            const free = parseFloat(diskLine[3].replace('G', '')) * 1024 * 1024 * 1024;
            const percentage = parseFloat(diskLine[4].replace('%', ''));
            return { total, used, free, percentage };
        }
    }
    catch (error) {
        (0, debug_1.debugLog)('Disk usage detection error:', error);
    }
    return { total: 0, used: 0, free: 0, percentage: 0 };
}
/**
 * Get network information
 */
function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = {};
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
function getDebugInfo() {
    return {
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        v8Version: process.versions.v8,
        appVersion: electron_1.app.getVersion(),
        appPath: electron_1.app.getAppPath(),
        userDataPath: electron_1.app.getPath('userData'),
        tempPath: electron_1.app.getPath('temp'),
        isPackaged: electron_1.app.isPackaged,
        isDev: !electron_1.app.isPackaged
    };
}
/**
 * Setup system info IPC handlers
 */
function setupSystemInfoIpcHandlers() {
    // Get basic system information
    electron_1.ipcMain.handle('getSystemInfo', async () => {
        return getSystemInfo();
    });
    // Get memory information
    electron_1.ipcMain.handle('getMemoryInfo', async () => {
        return getMemoryInfo();
    });
    // Get CPU information
    electron_1.ipcMain.handle('getCpuInfo', async () => {
        return await getCPUInfo();
    });
    // Get process list
    electron_1.ipcMain.handle('getProcessList', async () => {
        return getProcessList();
    });
    // Check system permissions
    electron_1.ipcMain.handle('checkSystemPermissions', async () => {
        return await checkSystemPermissions();
    });
    // Request system permissions
    electron_1.ipcMain.handle('requestSystemPermissions', async () => {
        return await requestSystemPermissions();
    });
    // Detect browser information
    electron_1.ipcMain.handle('detectBrowserInfo', async () => {
        return await detectBrowserInfo();
    });
    // Get disk usage
    electron_1.ipcMain.handle('getDiskUsage', async () => {
        return await getDiskUsage();
    });
    // Get network information
    electron_1.ipcMain.handle('getNetworkInfo', async () => {
        return getNetworkInfo();
    });
    // Get debug information
    electron_1.ipcMain.handle('getDebugInfo', async () => {
        return getDebugInfo();
    });
    // Open system preferences for permissions
    electron_1.ipcMain.handle('openSystemPreferences', async (event, panel) => {
        if (process.platform === 'darwin') {
            const command = panel ?
                `open "x-apple.systempreferences:com.apple.preference.security?${panel}"` :
                'open "x-apple.systempreferences:com.apple.preference.security"';
            try {
                (0, child_process_1.execSync)(command);
                return true;
            }
            catch (error) {
                (0, debug_1.debugLog)('Failed to open system preferences:', error);
                return false;
            }
        }
        return false;
    });
    // Show permission dialog
    electron_1.ipcMain.handle('show-permission-dialog', async (event, message) => {
        if (permissionErrorShown)
            return;
        const result = await electron_1.dialog.showMessageBox(mainWindow, {
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
                electron_1.app.quit();
                break;
        }
        return result.response;
    });
    (0, debug_1.debugLog)('System info IPC handlers registered');
}
/**
 * Initialize system information module
 */
function initSystemInfo(window) {
    mainWindow = window;
    if (systemInfoInitialized) {
        (0, debug_1.debugLog)('System info module already initialized');
        return;
    }
    try {
        // Setup IPC handlers
        setupSystemInfoIpcHandlers();
        // Initial permission check
        checkSystemPermissions().then(permissions => {
            (0, debug_1.debugLog)('Initial permission status:', permissions);
        });
        systemInfoInitialized = true;
        (0, debug_1.debugLog)('System info module initialization completed');
    }
    catch (error) {
        console.error('System info module initialization error:', error);
    }
}
/**
 * Cleanup system info resources
 */
function cleanupSystemInfo() {
    try {
        // Reset state variables
        systemInfoInitialized = false;
        permissionErrorShown = false;
        isInFallbackMode = false;
        lastPermissionCheckTime = 0;
        mainWindow = null;
        (0, debug_1.debugLog)('System info module cleanup completed');
    }
    catch (error) {
        console.error('System info module cleanup error:', error);
    }
}
/**
 * Get system info module status
 */
function getSystemInfoStatus() {
    return {
        initialized: systemInfoInitialized,
        fallbackMode: isInFallbackMode,
        lastPermissionCheck: lastPermissionCheckTime
    };
}
//# sourceMappingURL=system-info.js.map