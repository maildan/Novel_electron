import { WindowManager } from './window';
import { KeyboardManager } from './keyboard';
import { StaticServer } from './static-server';
export interface AppState {
    isInitialized: boolean;
    windowManager: WindowManager | null;
    settingsManagerInitialized: boolean;
    keyboardManager: KeyboardManager | null;
    staticServer: StaticServer | null;
    protocolsRegistered: boolean;
    securityInitialized: boolean;
    ipcHandlersRegistered: boolean;
    keyboardInitialized: boolean;
}
export declare const appState: AppState;
/**
 * 핵심 매니저들 초기화
 */
export declare function initializeManagers(): void;
/**
 * IPC 핸들러들 등록
 */
export declare function registerAllIpcHandlers(): Promise<void>;
/**
 * 핵심 시스템 초기화
 */
export declare function initializeCoreSystem(): Promise<void>;
/**
 * 앱 준비 완료 핸들러
 */
export declare function onAppReady(): Promise<void>;
//# sourceMappingURL=app-initialization.d.ts.map