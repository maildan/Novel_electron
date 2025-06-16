/**
 * 애플리케이션 정리 로직
 */
import { BrowserWindow } from 'electron';
import { cleanupNativeIpcHandlers } from './native-ipc';
import type { AppState } from './app-initialization';

/**
 * 애플리케이션 정리 작업
 */
export async function cleanupApplication(appState: AppState): Promise<void> {
  console.log('애플리케이션 정리 시작...');
  
  try {
    // Cleanup static server
    if (appState.staticServer) {
      try {
        await appState.staticServer.stop();
        console.log('Static server cleanup completed');
      } catch (error) {
        console.error('Error during static server cleanup:', error);
      }
    }
    
    // Cleanup keyboard system
    if (appState.keyboardManager && appState.keyboardInitialized) {
      try {
        await appState.keyboardManager.cleanup();
        console.log('Keyboard system cleanup completed');
      } catch (error) {
        console.error('Error during keyboard cleanup:', error);
      }
    }
    
    // Cleanup native module IPC handlers
    try {
      cleanupNativeIpcHandlers();
      console.log('Native module IPC handlers cleanup completed');
    } catch (error) {
      console.error('Error during native module cleanup:', error);
    }

    // Cleanup window manager
    if (appState.windowManager) {
      // WindowManager doesn't have cleanup method, just destroy windows
      BrowserWindow.getAllWindows().forEach(window => {
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
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
