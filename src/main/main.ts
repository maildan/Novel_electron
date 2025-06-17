/**
 * 메인 프로세스 진입점 - 모듈화된 버전
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// 설정 및 초기화 모듈들
import { initializeAppConfig, isDev } from './app-config';
import { onAppReady, appState } from './app-initialization';
import { cleanupApplication } from './app-cleanup';

// 핵심 시스템 모듈들 (윈도우, IPC, 메모리 관리)
import './window';           // WindowManager - 메인 윈도우 관리
import './handlers-manager'; // IPC 핸들러 관리자 (모든 핸들러 초기화 포함)
import './settings-manager'; // Settings 관리자 - 명시적으로 초기화 보장
import './memory-manager';   // 메모리 관리
// IPC 핸들러들은 handlers-manager에서 중앙화해서 등록 (중복 방지)

// 사이드 이펙트 모듈들 (기존 동작 유지)
import './app-lifecycle';
import './auto-launch-manager';
import './browser-detector';
import './clipboard-watcher';
import './crash-reporter';
import './data-collector';
import './error-handler';
import './file-handler';
import './menu';
import './native-client';
import './security-manager';
import './system-info';
import './theme-manager';
import './toast';
import './update-manager';
import './utils';
import './tray';             
import './shortcuts';        
import './protocols';       
import './screenshot';      

// 앱 설정 초기화 (가장 먼저 실행)
initializeAppConfig();

console.log('Electron main process starting...');
console.log(`Node.js version: ${process.version}`);
console.log(`Electron version: ${process.versions.electron}`);
console.log(`Chrome version: ${process.versions.chrome}`);
console.log(`V8 version: ${process.versions.v8}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`App path: ${app.getAppPath()}`);
console.log(`Environment: ${isDev ? 'development' : 'production'}`);

// 앱 이벤트 핸들러
app.whenReady().then(onAppReady);

// 모든 창이 닫혔을 때
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱 활성화 (macOS)
app.on('activate', async () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    await onAppReady();
  }
});

// 앱 종료 전
app.on('before-quit', async (event) => {
  console.log('App before-quit event received');
  event.preventDefault();
  
  try {
    await cleanupApplication(appState);
    app.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    app.exit(1);
  }
});

// 전역 에러 핸들러
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't crash the app, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the app, just log the error
});

// 개발 모드에서 라이브 리로드 활성화
if (isDev) {
  (async () => {
    try {
      const electronReload = await import('electron-reload');
      electronReload.default(__dirname, {
        electron: path.join(__dirname, '../../../node_modules/.bin/electron'),
        hardResetMethod: 'exit'
      });
    } catch (error: unknown) {
      console.log('electron-reload not available:', error instanceof Error ? error.message : String(error));
    }
  })();
}

// 상태 내보내기
export { appState };
export { isDev, isProd, isTest } from './app-config';
