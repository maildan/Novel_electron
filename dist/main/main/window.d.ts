import { BrowserWindow } from 'electron';
export declare class WindowManager {
    private static instance;
    private mainWindow;
    private constructor();
    static getInstance(): WindowManager;
    createMainWindow(): Promise<BrowserWindow>;
    private setupWindowEventListeners;
    getMainWindow(): BrowserWindow | null;
    isMainWindowVisible(): boolean;
    focusMainWindow(): void;
    hideMainWindow(): void;
    closeMainWindow(): void;
    /**
     * 윈도우 정보 조회
     */
    getWindowInfo(): any;
    createWindow(options: any): Promise<BrowserWindow>;
    getWindowFromEvent(event: any): BrowserWindow | null;
}
export declare function createWindow(): Promise<BrowserWindow>;
export declare function getMainWindow(): BrowserWindow | null;
//# sourceMappingURL=window.d.ts.map