/**
 * 고급 키보드 모니터링 및 입력 처리 모듈
 * 전역 단축키, IME 조합, 한글 처리, 타이핑 분석을 담당합니다
 */
import { BrowserWindow } from 'electron';
interface HangulComposerState {
    choBuffer: string;
    jungBuffer: string;
    jongBuffer: string;
    compositionState: number;
    result: string;
}
/**
 * Initialize advanced keyboard system
 */
export declare function initAdvancedKeyboard(window: BrowserWindow): Promise<void>;
/**
 * Cleanup keyboard resources
 */
export declare function cleanupAdvancedKeyboard(): Promise<void>;
/**
 * Get keyboard system status
 */
export declare function getKeyboardStatus(): {
    initialized: boolean;
    listening: boolean;
    queueSize: number;
    totalTypingCount: number;
    compositionState: HangulComposerState;
};
/**
 * KeyboardManager class for compatibility with handlers
 */
export declare class KeyboardManager {
    private static instance;
    private mainWindow;
    static getInstance(): KeyboardManager;
    setMainWindow(window: BrowserWindow): void;
    initialize(window?: BrowserWindow): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    cleanup(): Promise<void>;
    getStatus(): {
        initialized: boolean;
        listening: boolean;
        queueSize: number;
        totalTypingCount: number;
        compositionState: HangulComposerState;
    };
    isInitialized(): boolean;
    isListening(): boolean;
    startListening(callback?: (event: any) => void): Promise<boolean>;
    stopListening(): Promise<void>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=keyboard.d.ts.map