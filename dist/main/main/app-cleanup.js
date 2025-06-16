"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupApplication = cleanupApplication;
/**
 * 애플리케이션 정리 로직
 */
const electron_1 = require("electron");
const native_ipc_1 = require("./native-ipc");
/**
 * 애플리케이션 정리 작업
 */
async function cleanupApplication(appState) {
    console.log('애플리케이션 정리 시작...');
    try {
        // Cleanup static server
        if (appState.staticServer) {
            try {
                await appState.staticServer.stop();
                console.log('Static server cleanup completed');
            }
            catch (error) {
                console.error('Error during static server cleanup:', error);
            }
        }
        // Cleanup keyboard system
        if (appState.keyboardManager && appState.keyboardInitialized) {
            try {
                await appState.keyboardManager.cleanup();
                console.log('Keyboard system cleanup completed');
            }
            catch (error) {
                console.error('Error during keyboard cleanup:', error);
            }
        }
        // Cleanup native module IPC handlers
        try {
            (0, native_ipc_1.cleanupNativeIpcHandlers)();
            console.log('Native module IPC handlers cleanup completed');
        }
        catch (error) {
            console.error('Error during native module cleanup:', error);
        }
        // Cleanup window manager
        if (appState.windowManager) {
            // WindowManager doesn't have cleanup method, just destroy windows
            electron_1.BrowserWindow.getAllWindows().forEach(window => {
                if (!window.isDestroyed()) {
                    window.destroy();
                }
            });
        }
        // Clear manager references
        appState.settingsManagerInitialized = false;
        appState.keyboardManager = null;
        appState.staticServer = null;
        appState.keyboardInitialized = false;
        appState.isInitialized = false;
        console.log('Application cleanup complete');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
//# sourceMappingURL=app-cleanup.js.map