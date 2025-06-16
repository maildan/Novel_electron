/**
 * Advanced Keyboard Module for Loop 6
 * Enhanced global keyboard monitoring with native performance
 * Features: App detection, typing analytics, Hangul composition, global shortcuts
 * 
 * Based on Loop 3 keyboard.js but enhanced with TypeScript and modern architecture
 */

import { ipcMain, globalShortcut, BrowserWindow, app, shell } from 'electron';
import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi';
import { debugLog } from './utils';

// Dynamic imports for optional dependencies
let activeWin: any = null;
async function loadActiveWin() {
  if (!activeWin) {
    try {
      const module = await import('active-win');
      activeWin = module;
    } catch (error) {
      console.warn('[KeyboardAdvanced] active-win not available:', error);
    }
  }
  return activeWin;
}

// Interfaces and Types
interface PlatformKeyConfig {
  commandKey: string;
  ctrlKey: string;
  altKey: string;
  shiftKey: string;
}

interface HangulComposerState {
  choBuffer: string;
  jungBuffer: string;
  jongBuffer: string;
  compositionState: 0 | 1 | 2; // 0: 초성, 1: 중성, 2: 종성
  result: string;
}

interface KeyEvent {
  key: string;
  isComposing: boolean;
  windowTitle: string;
  appName: string;
  url: string;
  timestamp: number;
}

interface TypingStats {
  appName: string;
  windowTitle: string;
  url: string;
  typingCount: number;
  typingTime: number;
  isMonitored: boolean;
}

interface PermissionStatus {
  screenRecording: boolean | null;
  accessibility: boolean | null;
}

// Platform Configurations
const PLATFORM_KEY_CONFIGS: Record<string, PlatformKeyConfig> = {
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
const CHOSEONG_TABLE: Record<string, number> = {
  'ㄱ': 0, 'ㄲ': 1, 'ㄴ': 2, 'ㄷ': 3, 'ㄸ': 4, 'ㄹ': 5, 'ㅁ': 6, 'ㅂ': 7,
  'ㅃ': 8, 'ㅅ': 9, 'ㅆ': 10, 'ㅇ': 11, 'ㅈ': 12, 'ㅉ': 13, 'ㅊ': 14, 'ㅋ': 15,
  'ㅌ': 16, 'ㅍ': 17, 'ㅎ': 18
};

const JUNGSEONG_TABLE: Record<string, number> = {
  'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅖ': 7,
  'ㅗ': 8, 'ㅘ': 9, 'ㅙ': 10, 'ㅚ': 11, 'ㅛ': 12, 'ㅜ': 13, 'ㅝ': 14, 'ㅞ': 15,
  'ㅟ': 16, 'ㅠ': 17, 'ㅡ': 18, 'ㅢ': 19, 'ㅣ': 20
};

const JONGSEONG_TABLE: Record<string, number> = {
  '': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3, 'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7,
  'ㄹ': 8, 'ㄺ': 9, 'ㄻ': 10, 'ㄼ': 11, 'ㄽ': 12, 'ㄾ': 13, 'ㄿ': 14, 'ㅀ': 15,
  'ㅁ': 16, 'ㅂ': 17, 'ㅄ': 18, 'ㅅ': 19, 'ㅆ': 20, 'ㅇ': 21, 'ㅈ': 22, 'ㅊ': 23,
  'ㅋ': 24, 'ㅌ': 25, 'ㅍ': 26, 'ㅎ': 27
};

// Complex Jamo Combinations
const COMPLEX_JUNGSEONG: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};

const COMPLEX_JONGSEONG: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

/**
 * Advanced Keyboard Manager Class
 * Handles global keyboard monitoring, app detection, and typing analytics
 */
export class AdvancedKeyboardManager {
  private static instance: AdvancedKeyboardManager;
  
  // State management
  private isInitialized = false;
  private isMonitoring = false;
  private keyPressCount = 0;
  private lastKeyPressed = '';
  private lastKeyEventTime = Date.now();
  private keyEventQueue: KeyEvent[] = [];
  private keyEventProcessTimer: NodeJS.Timeout | null = null;
  private lastActiveApp = '';
  private lastWindowTitle = '';
  private isAppSwitching = false;
  private activeCheckTimer: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly DEBOUNCE_TIME = 30; // ms
  private readonly MAX_QUEUE_SIZE = 20;
  private readonly currentOSConfig: PlatformKeyConfig;
  
  // Hangul composition state
  private composerState: HangulComposerState = {
    choBuffer: '',
    jungBuffer: '',
    jongBuffer: '',
    compositionState: 0,
    result: ''
  };
  
  // Permission status
  private permissionStatus: PermissionStatus = {
    screenRecording: null,
    accessibility: null
  };
  
  private constructor() {
    this.currentOSConfig = PLATFORM_KEY_CONFIGS[process.platform] || PLATFORM_KEY_CONFIGS.win32;
  }
  
  public static getInstance(): AdvancedKeyboardManager {
    if (!AdvancedKeyboardManager.instance) {
      AdvancedKeyboardManager.instance = new AdvancedKeyboardManager();
    }
    return AdvancedKeyboardManager.instance;
  }
  
  /**
 * Initialize the advanced keyboard monitoring system
 */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      debugLog('[KeyboardAdvanced] Already initialized');
      return true;
    }
    
    try {
      debugLog('[KeyboardAdvanced] Initialize advanced keyboard system 중...');
      
      // Check permissions first
      await this.checkPermissions();
      
      // Initialize uIOhook for global keyboard monitoring
      this.initializeGlobalListeners();
      
      // Setup IPC handlers
      this.setupIpcHandlers();
      
      // Start active app monitoring
      this.startActiveAppMonitoring();
      
      this.isInitialized = true;
      debugLog('[KeyboardAdvanced] Advanced keyboard system initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[KeyboardAdvanced] Initialization failed:', error);
      return false;
    }
  }
  
  /**
 * Check system permissions for keyboard and screen recording
   */
  private async checkPermissions(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        // macOS specific permission checks
        // This would require native modules for proper permission checking
        debugLog('[KeyboardAdvanced] Checking macOS permissions...');
      }
      
      // Update permission status
      this.permissionStatus.accessibility = true; // Assume granted for now
      this.permissionStatus.screenRecording = true; // Assume granted for now
      
    } catch (error) {
      console.error('[KeyboardAdvanced] Permission check failed:', error);
      this.permissionStatus.accessibility = false;
      this.permissionStatus.screenRecording = false;
    }
  }
  
  /**
   * Initialize global keyboard listeners using uIOhook
 */
  private initializeGlobalListeners(): void {
    try {
      // Register keyboard event handlers
      uIOhook.on('keydown', (e: UiohookKeyboardEvent) => {
        this.handleKeyEvent(e, 'keydown');
      });
      
      uIOhook.on('keyup', (e: UiohookKeyboardEvent) => {
        this.handleKeyEvent(e, 'keyup');
      });
      
      // Start the global hook
      uIOhook.start();
      
      debugLog('[KeyboardAdvanced] Global keyboard listeners initialized');
    } catch (error) {
      console.error('[KeyboardAdvanced] Failed to initialize global listeners:', error);
    }
  }
  
  /**
 * Handle individual key events
   */
  private async handleKeyEvent(event: UiohookKeyboardEvent, type: 'keydown' | 'keyup'): Promise<void> {
    if (!this.isMonitoring || type !== 'keydown') {
      return;
    }
    
    try {
      // Get current active window info
      const windowInfo = await this.getCurrentWindowInfo();
      
      // Create key event object
      const keyEvent: KeyEvent = {
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
      
    } catch (error) {
      console.error('[KeyboardAdvanced] Key event handling failed:', error);
    }
  }
  
  /**
   * Get current active window information
 */
  private async getCurrentWindowInfo(): Promise<{ title: string; appName: string; url: string }> {
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
    } catch (error) {
      console.error('[KeyboardAdvanced] Failed to get window info:', error);
      return { title: '', appName: '', url: '' };
    }
  }
  
  /**
 * Extract URL from browser window title or other sources
   */
  private extractUrlFromWindow(windowInfo: any): string {
    if (!windowInfo) return '';
    
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
  private mapKeyCode(keycode: number): string {
    // Basic character mappings for uIOhook
    const keyMappings: Record<number, string> = {
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
  private addKeyEventToQueue(keyEvent: KeyEvent): void {
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
  private processKeyEventQueue(): void {
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
    } catch (error) {
      console.error('[KeyboardAdvanced] Key event queue processing failed:', error);
    }
  }
  
  /**
   * Process individual key event for analytics
 */
  private processIndividualKeyEvent(event: KeyEvent): void {
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
      debugLog('[KeyboardAdvanced] Processed key: ${event.key} in ${event.appName}');
    } catch (error) {
      console.error('[KeyboardAdvanced] Stats processing failed:', error);
    }
  }
  
  /**
   * Check if input is Hangul (Korean)
   */
  private isHangulInput(key: string): boolean {
    return /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(key);
  }
  
  /**
 * Process Hangul jamo composition
   */
  private processJamo(char: string): { result: string; reset: boolean } {
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
        } else {
          const result = this.composerState.choBuffer;
          this.composerState.choBuffer = char;
          this.composerState.compositionState = char in CHOSEONG_TABLE ? 1 : 0;
          return { result, reset: false };
        }
      
      case 2: // Waiting for final consonant
        if (char in JONGSEONG_TABLE) {
          this.composerState.jongBuffer = char;
          return {
            result: this.composeHangul(
              this.composerState.choBuffer,
              this.composerState.jungBuffer,
              this.composerState.jongBuffer
            ),
            reset: false
          };
        } else if (char in CHOSEONG_TABLE) {
          const result = this.composeHangul(
            this.composerState.choBuffer,
            this.composerState.jungBuffer,
            this.composerState.jongBuffer
          );
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
  private composeHangul(cho: string, jung: string, jong: string = ''): string {
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
  private finishComposition(): string {
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
  private updateTypingStats(keyEvent: KeyEvent): void {
    // This would integrate with settings and monitoring configuration
    // For now, just log the event
    debugLog('[KeyboardAdvanced] Typing in ${keyEvent.appName}: ${keyEvent.key}');
  }
  
  /**
   * Start monitoring active applications
   */
  private startActiveAppMonitoring(): void {
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
      } catch (error) {
        console.error('[KeyboardAdvanced] Active app monitoring failed:', error);
      }
    }, 1000); // Check every second
  }
  
  /**
   * Notify about application switch
   */
  private notifyAppSwitch(windowInfo: { title: string; appName: string; url: string }): void {
    debugLog('[KeyboardAdvanced] App switched to: ${windowInfo.appName} - ${windowInfo.title}');
    
    // Send to main window if available
    const mainWindow = BrowserWindow.getAllWindows().find(win => !win.isDestroyed());
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
  private setupIpcHandlers(): void {
    ipcMain.handle('keyboard-advanced:start-monitoring', () => {
      return this.startMonitoring();
    });
    
    ipcMain.handle('keyboard-advanced:stop-monitoring', () => {
      return this.stopMonitoring();
    });
    
    ipcMain.handle('keyboard-advanced:get-stats', () => {
      return {
        keyPressCount: this.keyPressCount,
        lastKeyPressed: this.lastKeyPressed,
        lastKeyEventTime: this.lastKeyEventTime,
        isMonitoring: this.isMonitoring,
        currentApp: this.lastActiveApp,
        currentWindow: this.lastWindowTitle
      };
    });
    
    ipcMain.handle('keyboard-advanced:get-permissions', () => {
      return this.permissionStatus;
    });
  }
  
  /**
 * Start keyboard monitoring
 */
  public startMonitoring(): boolean {
    if (!this.isInitialized) {
      console.error('[KeyboardAdvanced] Cannot start monitoring: not initialized');
      return false;
    }
    
    this.isMonitoring = true;
    debugLog('[KeyboardAdvanced] Monitoring started');
    return true;
  }
  
  /**
 * Stop keyboard monitoring
 */
  public stopMonitoring(): boolean {
    this.isMonitoring = false;
    debugLog('[KeyboardAdvanced] Monitoring stopped');
    return true;
  }
  
  /**
   * Cleanup resources
 */
  public destroy(): void {
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
      uIOhook.stop();
      
      this.isInitialized = false;
      debugLog('[KeyboardAdvanced] Destroyed successfully');
    } catch (error) {
      console.error('[KeyboardAdvanced] Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const advancedKeyboardManager = AdvancedKeyboardManager.getInstance();

// Export initialization function
export async function initializeAdvancedKeyboard(): Promise<boolean> {
  return await advancedKeyboardManager.initialize();
}

// Export for use in main process
export function setupAdvancedKeyboardHandlers(): void {
  // The IPC handlers are set up in the constructor
  debugLog('[KeyboardAdvanced] Handlers setup completed');
}