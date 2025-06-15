"use strict";
/**
 * Advanced Keyboard Module for Loop 6
 * Enhanced global keyboard monitoring with native performance
 * Features: App detection, typing analytics, Hangul composition, global shortcuts
 *
 * Based on Loop 3 keyboard.js but enhanced with TypeScript and modern architecture
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
exports.advancedKeyboardManager = exports.AdvancedKeyboardManager = void 0;
exports.initializeAdvancedKeyboard = initializeAdvancedKeyboard;
exports.setupAdvancedKeyboardHandlers = setupAdvancedKeyboardHandlers;
const electron_1 = require("electron");
const uiohook_napi_1 = require("uiohook-napi");
const utils_1 = require("./utils");
// Dynamic imports for optional dependencies
let activeWin = null;
async function loadActiveWin() {
    if (!activeWin) {
        try {
            const module = await Promise.resolve().then(() => __importStar(require('active-win')));
            activeWin = module;
        }
        catch (error) {
            console.warn('[KeyboardAdvanced] active-win not available:', error);
        }
    }
    return activeWin;
}
// Platform Configurations
const PLATFORM_KEY_CONFIGS = {
    darwin: {
        commandKey: 'Meta',
        ctrlKey: 'Control',
        altKey: 'Alt',
        shiftKey: 'Shift'
    },
    win32: {
        commandKey: 'Super',
        ctrlKey: 'Control',
        altKey: 'Alt',
        shiftKey: 'Shift'
    },
    linux: {
        commandKey: 'Super',
        ctrlKey: 'Control',
        altKey: 'Alt',
        shiftKey: 'Shift'
    }
};
// Hangul Composition Tables
const CHOSEONG_TABLE = {
    'ㄱ': 0, 'ㄲ': 1, 'ㄴ': 2, 'ㄷ': 3, 'ㄸ': 4, 'ㄹ': 5, 'ㅁ': 6, 'ㅂ': 7,
    'ㅃ': 8, 'ㅅ': 9, 'ㅆ': 10, 'ㅇ': 11, 'ㅈ': 12, 'ㅉ': 13, 'ㅊ': 14, 'ㅋ': 15,
    'ㅌ': 16, 'ㅍ': 17, 'ㅎ': 18
};
const JUNGSEONG_TABLE = {
    'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅖ': 7,
    'ㅗ': 8, 'ㅘ': 9, 'ㅙ': 10, 'ㅚ': 11, 'ㅛ': 12, 'ㅜ': 13, 'ㅝ': 14, 'ㅞ': 15,
    'ㅟ': 16, 'ㅠ': 17, 'ㅡ': 18, 'ㅢ': 19, 'ㅣ': 20
};
const JONGSEONG_TABLE = {
    '': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3, 'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7,
    'ㄹ': 8, 'ㄺ': 9, 'ㄻ': 10, 'ㄼ': 11, 'ㄽ': 12, 'ㄾ': 13, 'ㄿ': 14, 'ㅀ': 15,
    'ㅁ': 16, 'ㅂ': 17, 'ㅄ': 18, 'ㅅ': 19, 'ㅆ': 20, 'ㅇ': 21, 'ㅈ': 22, 'ㅊ': 23,
    'ㅋ': 24, 'ㅌ': 25, 'ㅍ': 26, 'ㅎ': 27
};
// Complex Jamo Combinations
const COMPLEX_JUNGSEONG = {
    'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
    'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
    'ㅡㅣ': 'ㅢ'
};
const COMPLEX_JONGSEONG = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
    'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
    'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};
/**
 * Advanced Keyboard Manager Class
 * Handles global keyboard monitoring, app detection, and typing analytics
 */
class AdvancedKeyboardManager {
    constructor() {
        // State management
        this.isInitialized = false;
        this.isMonitoring = false;
        this.keyPressCount = 0;
        this.lastKeyPressed = '';
        this.lastKeyEventTime = Date.now();
        this.keyEventQueue = [];
        this.keyEventProcessTimer = null;
        this.lastActiveApp = '';
        this.lastWindowTitle = '';
        this.isAppSwitching = false;
        this.activeCheckTimer = null;
        // Configuration
        this.DEBOUNCE_TIME = 30; // ms
        this.MAX_QUEUE_SIZE = 20;
        // Hangul composition state
        this.composerState = {
            choBuffer: '',
            jungBuffer: '',
            jongBuffer: '',
            compositionState: 0,
            result: ''
        };
        // Permission status
        this.permissionStatus = {
            screenRecording: null,
            accessibility: null
        };
        this.currentOSConfig = PLATFORM_KEY_CONFIGS[process.platform] || PLATFORM_KEY_CONFIGS.win32;
    }
    static getInstance() {
        if (!AdvancedKeyboardManager.instance) {
            AdvancedKeyboardManager.instance = new AdvancedKeyboardManager();
        }
        return AdvancedKeyboardManager.instance;
    }
    /**
   * Initialize the advanced keyboard monitoring system
   */
    async initialize() {
        if (this.isInitialized) {
            (0, utils_1.debugLog)('[KeyboardAdvanced] Already initialized');
            return true;
        }
        try {
            (0, utils_1.debugLog)('[KeyboardAdvanced] Initialize advanced keyboard system 중...');
            // Check permissions first
            await this.checkPermissions();
            // Initialize uIOhook for global keyboard monitoring
            this.initializeGlobalListeners();
            // Setup IPC handlers
            this.setupIpcHandlers();
            // Start active app monitoring
            this.startActiveAppMonitoring();
            this.isInitialized = true;
            (0, utils_1.debugLog)('[KeyboardAdvanced] Advanced keyboard system initialized successfully');
            return true;
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Initialization failed:', error);
            return false;
        }
    }
    /**
   * Check system permissions for keyboard and screen recording
     */
    async checkPermissions() {
        try {
            if (process.platform === 'darwin') {
                // macOS specific permission checks
                // This would require native modules for proper permission checking
                (0, utils_1.debugLog)('[KeyboardAdvanced] Checking macOS permissions...');
            }
            // Update permission status
            this.permissionStatus.accessibility = true; // Assume granted for now
            this.permissionStatus.screenRecording = true; // Assume granted for now
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Permission check failed:', error);
            this.permissionStatus.accessibility = false;
            this.permissionStatus.screenRecording = false;
        }
    }
    /**
     * Initialize global keyboard listeners using uIOhook
   */
    initializeGlobalListeners() {
        try {
            // Register keyboard event handlers
            uiohook_napi_1.uIOhook.on('keydown', (e) => {
                this.handleKeyEvent(e, 'keydown');
            });
            uiohook_napi_1.uIOhook.on('keyup', (e) => {
                this.handleKeyEvent(e, 'keyup');
            });
            // Start the global hook
            uiohook_napi_1.uIOhook.start();
            (0, utils_1.debugLog)('[KeyboardAdvanced] Global keyboard listeners initialized');
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Failed to initialize global listeners:', error);
        }
    }
    /**
   * Handle individual key events
     */
    async handleKeyEvent(event, type) {
        if (!this.isMonitoring || type !== 'keydown') {
            return;
        }
        try {
            // Get current active window info
            const windowInfo = await this.getCurrentWindowInfo();
            // Create key event object
            const keyEvent = {
                key: this.mapKeyCode(event.keycode),
                isComposing: false, // TODO: Detect IME composition
                windowTitle: windowInfo.title || '',
                appName: windowInfo.appName || '',
                url: windowInfo.url || '',
                timestamp: Date.now()
            };
            // Add to queue for processing
            this.addKeyEventToQueue(keyEvent);
            // Update statistics
            this.updateTypingStats(keyEvent);
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Key event handling failed:', error);
        }
    }
    /**
     * Get current active window information
   */
    async getCurrentWindowInfo() {
        if (!activeWin) {
            return { title: '', appName: '', url: '' };
        }
        try {
            const windowInfo = await activeWin();
            return {
                title: windowInfo?.title || '',
                appName: windowInfo?.owner?.name || '',
                url: this.extractUrlFromWindow(windowInfo)
            };
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Failed to get window info:', error);
            return { title: '', appName: '', url: '' };
        }
    }
    /**
   * Extract URL from browser window title or other sources
     */
    extractUrlFromWindow(windowInfo) {
        if (!windowInfo)
            return '';
        // Try to extract URL from browser titles
        const title = windowInfo.title || '';
        const appName = windowInfo.owner?.name || '';
        // Common browser patterns
        if (appName.toLowerCase().includes('chrome') ||
            appName.toLowerCase().includes('firefox') ||
            appName.toLowerCase().includes('safari') ||
            appName.toLowerCase().includes('edge')) {
            // Look for URL patterns in title
            const urlMatch = title.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                return urlMatch[0];
            }
            // Extract domain from title patterns like "Title - domain.com"
            const domainMatch = title.match(/ - ([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (domainMatch) {
                return `https://${domainMatch[1]}`;
            }
        }
        return '';
    }
    /**
     * Map uIOhook key codes to readable key names
     */
    mapKeyCode(keycode) {
        // Basic character mappings for uIOhook
        const keyMappings = {
            // Letters (A-Z)
            30: 'a', 48: 'b', 46: 'c', 32: 'd', 18: 'e', 33: 'f', 34: 'g', 35: 'h',
            23: 'i', 36: 'j', 37: 'k', 38: 'l', 50: 'm', 49: 'n', 24: 'o', 25: 'p',
            16: 'q', 19: 'r', 31: 's', 20: 't', 22: 'u', 47: 'v', 17: 'w', 45: 'x',
            21: 'y', 44: 'z',
            // Numbers (0-9)
            11: '0', 2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
            // Special keys
            57: ' ', // Space
            28: 'Enter',
            14: 'Backspace',
            15: 'Tab',
            1: 'Escape',
            // Modifier keys
            42: 'Shift', 54: 'RightShift',
            29: 'Control', 97: 'RightControl',
            56: 'Alt', 100: 'RightAlt',
            125: 'Meta', 126: 'RightMeta'
        };
        return keyMappings[keycode] || `Key${keycode}`;
    }
    /**
     * Add key event to processing queue
   */
    addKeyEventToQueue(keyEvent) {
        // Prevent queue overflow
        if (this.keyEventQueue.length >= this.MAX_QUEUE_SIZE) {
            this.keyEventQueue.shift(); // Remove oldest event
        }
        this.keyEventQueue.push(keyEvent);
        // Schedule processing if not already scheduled
        if (!this.keyEventProcessTimer) {
            this.keyEventProcessTimer = setTimeout(() => {
                this.processKeyEventQueue();
                this.keyEventProcessTimer = null;
            }, this.DEBOUNCE_TIME);
        }
    }
    /**
   * Process queued key events
     */
    processKeyEventQueue() {
        if (this.keyEventQueue.length === 0) {
            return;
        }
        try {
            while (this.keyEventQueue.length > 0) {
                const event = this.keyEventQueue.shift();
                if (event) {
                    this.processIndividualKeyEvent(event);
                }
            }
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Key event queue processing failed:', error);
        }
    }
    /**
     * Process individual key event for analytics
   */
    processIndividualKeyEvent(event) {
        // Update internal statistics
        this.keyPressCount++;
        this.lastKeyPressed = event.key;
        this.lastKeyEventTime = event.timestamp;
        // Handle Hangul composition if needed
        if (this.isHangulInput(event.key)) {
            const compositionResult = this.processJamo(event.key);
            if (compositionResult.result) {
                event.key = compositionResult.result;
            }
        }
        // Send to stats manager if available
        try {
            // This would integrate with the stats-manager.ts
            (0, utils_1.debugLog)('[KeyboardAdvanced] Processed key: ${event.key} in ${event.appName}');
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Stats processing failed:', error);
        }
    }
    /**
     * Check if input is Hangul (Korean)
     */
    isHangulInput(key) {
        return /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(key);
    }
    /**
   * Process Hangul jamo composition
     */
    processJamo(char) {
        // Non-Hangul characters
        if (!/^[ㄱ-ㅎㅏ-ㅣ]$/.test(char)) {
            const result = this.finishComposition();
            return { result: result + char, reset: true };
        }
        switch (this.composerState.compositionState) {
            case 0: // Waiting for initial consonant
                if (char in CHOSEONG_TABLE) {
                    this.composerState.choBuffer = char;
                    this.composerState.compositionState = 1;
                    return { result: '', reset: false };
                }
                if (char in JUNGSEONG_TABLE) {
                    return { result: char, reset: true };
                }
                return { result: char, reset: true };
            case 1: // Waiting for vowel
                if (char in JUNGSEONG_TABLE) {
                    this.composerState.jungBuffer = char;
                    this.composerState.compositionState = 2;
                    return {
                        result: this.composeHangul(this.composerState.choBuffer, this.composerState.jungBuffer),
                        reset: false
                    };
                }
                else {
                    const result = this.composerState.choBuffer;
                    this.composerState.choBuffer = char;
                    this.composerState.compositionState = char in CHOSEONG_TABLE ? 1 : 0;
                    return { result, reset: false };
                }
            case 2: // Waiting for final consonant
                if (char in JONGSEONG_TABLE) {
                    this.composerState.jongBuffer = char;
                    return {
                        result: this.composeHangul(this.composerState.choBuffer, this.composerState.jungBuffer, this.composerState.jongBuffer),
                        reset: false
                    };
                }
                else if (char in CHOSEONG_TABLE) {
                    const result = this.composeHangul(this.composerState.choBuffer, this.composerState.jungBuffer, this.composerState.jongBuffer);
                    this.composerState.choBuffer = char;
                    this.composerState.jungBuffer = '';
                    this.composerState.jongBuffer = '';
                    this.composerState.compositionState = 1;
                    return { result, reset: false };
                }
                break;
        }
        return { result: char, reset: true };
    }
    /**
     * Compose Hangul syllable from jamo
     */
    composeHangul(cho, jung, jong = '') {
        if (!CHOSEONG_TABLE.hasOwnProperty(cho) ||
            !JUNGSEONG_TABLE.hasOwnProperty(jung) ||
            (jong && !JONGSEONG_TABLE.hasOwnProperty(jong))) {
            return '';
        }
        const LIndex = CHOSEONG_TABLE[cho];
        const VIndex = JUNGSEONG_TABLE[jung];
        const TIndex = JONGSEONG_TABLE[jong || ''];
        const SBase = 0xAC00;
        const LCount = 19;
        const VCount = 21;
        const TCount = 28;
        const NCount = VCount * TCount;
        const syllableCode = SBase + (LIndex * NCount) + (VIndex * TCount) + TIndex;
        return String.fromCharCode(syllableCode);
    }
    /**
     * Finish current Hangul composition
     */
    finishComposition() {
        const result = this.composerState.result;
        this.composerState = {
            choBuffer: '',
            jungBuffer: '',
            jongBuffer: '',
            compositionState: 0,
            result: ''
        };
        return result;
    }
    /**
     * Update typing statistics
     */
    updateTypingStats(keyEvent) {
        // This would integrate with settings and monitoring configuration
        // For now, just log the event
        (0, utils_1.debugLog)('[KeyboardAdvanced] Typing in ${keyEvent.appName}: ${keyEvent.key}');
    }
    /**
     * Start monitoring active applications
     */
    startActiveAppMonitoring() {
        if (this.activeCheckTimer) {
            clearInterval(this.activeCheckTimer);
        }
        this.activeCheckTimer = setInterval(async () => {
            try {
                const windowInfo = await this.getCurrentWindowInfo();
                if (windowInfo.appName !== this.lastActiveApp ||
                    windowInfo.title !== this.lastWindowTitle) {
                    this.lastActiveApp = windowInfo.appName;
                    this.lastWindowTitle = windowInfo.title;
                    // Notify about app switch
                    this.notifyAppSwitch(windowInfo);
                }
            }
            catch (error) {
                console.error('[KeyboardAdvanced] Active app monitoring failed:', error);
            }
        }, 1000); // Check every second
    }
    /**
     * Notify about application switch
     */
    notifyAppSwitch(windowInfo) {
        (0, utils_1.debugLog)('[KeyboardAdvanced] App switched to: ${windowInfo.appName} - ${windowInfo.title}');
        // Send to main window if available
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
        if (mainWindow) {
            mainWindow.webContents.send('active-app-changed', {
                appName: windowInfo.appName,
                windowTitle: windowInfo.title,
                url: windowInfo.url,
                timestamp: Date.now()
            });
        }
    }
    /**
     * Setup IPC handlers for renderer communication
   */
    setupIpcHandlers() {
        electron_1.ipcMain.handle('keyboard-advanced:start-monitoring', () => {
            return this.startMonitoring();
        });
        electron_1.ipcMain.handle('keyboard-advanced:stop-monitoring', () => {
            return this.stopMonitoring();
        });
        electron_1.ipcMain.handle('keyboard-advanced:get-stats', () => {
            return {
                keyPressCount: this.keyPressCount,
                lastKeyPressed: this.lastKeyPressed,
                lastKeyEventTime: this.lastKeyEventTime,
                isMonitoring: this.isMonitoring,
                currentApp: this.lastActiveApp,
                currentWindow: this.lastWindowTitle
            };
        });
        electron_1.ipcMain.handle('keyboard-advanced:get-permissions', () => {
            return this.permissionStatus;
        });
    }
    /**
   * Start keyboard monitoring
   */
    startMonitoring() {
        if (!this.isInitialized) {
            console.error('[KeyboardAdvanced] Cannot start monitoring: not initialized');
            return false;
        }
        this.isMonitoring = true;
        (0, utils_1.debugLog)('[KeyboardAdvanced] Monitoring started');
        return true;
    }
    /**
   * Stop keyboard monitoring
   */
    stopMonitoring() {
        this.isMonitoring = false;
        (0, utils_1.debugLog)('[KeyboardAdvanced] Monitoring stopped');
        return true;
    }
    /**
     * Cleanup resources
   */
    destroy() {
        try {
            this.stopMonitoring();
            if (this.activeCheckTimer) {
                clearInterval(this.activeCheckTimer);
                this.activeCheckTimer = null;
            }
            if (this.keyEventProcessTimer) {
                clearTimeout(this.keyEventProcessTimer);
                this.keyEventProcessTimer = null;
            }
            // Stop uIOhook
            uiohook_napi_1.uIOhook.stop();
            this.isInitialized = false;
            (0, utils_1.debugLog)('[KeyboardAdvanced] Destroyed successfully');
        }
        catch (error) {
            console.error('[KeyboardAdvanced] Cleanup failed:', error);
        }
    }
}
exports.AdvancedKeyboardManager = AdvancedKeyboardManager;
// Export singleton instance
exports.advancedKeyboardManager = AdvancedKeyboardManager.getInstance();
// Export initialization function
async function initializeAdvancedKeyboard() {
    return await exports.advancedKeyboardManager.initialize();
}
// Export for use in main process
function setupAdvancedKeyboardHandlers() {
    // The IPC handlers are set up in the constructor
    (0, utils_1.debugLog)('[KeyboardAdvanced] Handlers setup completed');
}
//# sourceMappingURL=keyboard-advanced.js.map