/**
 * 메인 프로세스 진입점 - 모듈화된 버전
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// 설정 및 초기화 모듈들
import { initializeAppConfig, isDev } from './app-config';
import { onAppReady, appState } from './app-initialization';
import { cleanupApplication } from './app-cleanup';

// ✅ CRITICAL 중복 수정: 불필요한 중복 import 제거
// app-initialization.ts에서 모든 매니저 초기화를 중앙 관리하므로 
// 개별 import는 제거하고 생명주기 이벤트만 import

// 생명주기 이벤트 전용 (실제 초기화는 app-initialization.ts에서 수행)
import './app-lifecycle';      

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
