/**
 * Advanced Keyboard Module for Loop 6
 * Enhanced global keyboard monitoring with native performance
 * Features: App detection, typing analytics, Hangul composition, global shortcuts
 *
 * Based on Loop 3 keyboard.js but enhanced with TypeScript and modern architecture
 */
/**
 * Advanced Keyboard Manager Class
 * Handles global keyboard monitoring, app detection, and typing analytics
 */
export declare class AdvancedKeyboardManager {
    private static instance;
    private isInitialized;
    private isMonitoring;
    private keyPressCount;
    private lastKeyPressed;
    private lastKeyEventTime;
    private keyEventQueue;
    private keyEventProcessTimer;
    private lastActiveApp;
    private lastWindowTitle;
    private isAppSwitching;
    private activeCheckTimer;
    private readonly DEBOUNCE_TIME;
    private readonly MAX_QUEUE_SIZE;
    private readonly currentOSConfig;
    private composerState;
    private permissionStatus;
    private constructor();
    static getInstance(): AdvancedKeyboardManager;
    /**
   * Initialize the advanced keyboard monitoring system
   */
    initialize(): Promise<boolean>;
    /**
   * Check system permissions for keyboard and screen recording
     */
    private checkPermissions;
    /**
     * Initialize global keyboard listeners using uIOhook
   */
    private initializeGlobalListeners;
    /**
   * Handle individual key events
     */
    private handleKeyEvent;
    /**
    * Get current active window information
    */
    private getCurrentWindowInfo;
    /**
   * Extract URL from browser window title or other sources
     */
    private extractUrlFromWindow;
    /**
     * Map uIOhook key codes to readable key names
     */
    private mapKeyCode;
    /**
     * Add key event to processing queue
   */
    private addKeyEventToQueue;
    /**
   * Process queued key events
     */
    private processKeyEventQueue;
    /**
     * Process individual key event for analytics
   */
    private processIndividualKeyEvent;
    /**
     * Check if input is Hangul (Korean)
     */
    private isHangulInput;
    /**
   * Process Hangul jamo composition
     */
    private processJamo;
    /**
     * Compose Hangul syllable from jamo
     */
    private composeHangul;
    /**
     * Finish current Hangul composition
     */
    private finishComposition;
    /**
     * Update typing statistics
     */
    private updateTypingStats;
    /**
     * Start monitoring active applications
     */
    private startActiveAppMonitoring;
    /**
     * Notify about application switch
     */
    private notifyAppSwitch;
    /**
     * Setup IPC handlers for renderer communication
   */
    private setupIpcHandlers;
    /**
   * Start keyboard monitoring
   */
    startMonitoring(): boolean;
    /**
   * Stop keyboard monitoring
   */
    stopMonitoring(): boolean;
    /**
     * Cleanup resources
   */
    destroy(): void;
}
export declare const advancedKeyboardManager: AdvancedKeyboardManager;
export declare function initializeAdvancedKeyboard(): Promise<boolean>;
export declare function setupAdvancedKeyboardHandlers(): void;
//# sourceMappingURL=keyboard-advanced.d.ts.map