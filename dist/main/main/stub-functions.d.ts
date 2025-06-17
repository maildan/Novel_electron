/**
 * Loop 6 누락된 함수들의 스텁 구현
 * Loop 3에서 Loop 6로 마이그레이션하는 동안의 임시 구현
 */
import { App } from 'electron';
export declare function setupProtocols(): Promise<void>;
export declare function setupSafeStorage(): Promise<void>;
export declare function initKeyboardMonitoring(): Promise<void>;
export declare function setupPowerMonitoring(): void;
export declare function initSystemInfoModule(): void;
export declare function initTypingStatsModule(): void;
export declare function setupClipboardWatcher(): void;
export declare function setupCrashReporter(): void;
export declare function initScreenshotModule(app: App): void;
export declare function setupGlobalShortcuts(): void;
export declare function setupTray(): void;
export declare function setupMenu(): void;
export declare function loadSettings(): Record<string, unknown>;
export declare function initDatabase(): Promise<void>;
export declare function createWindow(): unknown;
export declare function setupIpcHandlers(): void;
export declare function initUpdates(): void;
export declare function getMainWindow(): unknown;
export declare function destroyTray(): void;
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=stub-functions.d.ts.map