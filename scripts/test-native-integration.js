#!/usr/bin/env node

/**
 * Loop 6 네이티브 모듈 통합 테스트
 * 
 * 새로 구현된 NAPI 네이티브 모듈과 IPC 핸들러의 통합을 테스트합니다.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 개발 모드 설정
process.env.NODE_ENV = 'development';

console.log('🚀 Loop 6 네이티브 모듈 통합 테스트 시작');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'src/preload/index.ts')
    }
  });

  // 테스트용 HTML 로드
  mainWindow.loadFile('test-page.html');

  mainWindow.webContents.openDevTools();
}

// 네이티브 모듈 테스트
async function testNativeModule() {
  try {
    console.log('📊 네이티브 모듈 테스트 시작...');
    
    // Native Client import
    const { nativeClient } = require('./src/main/native-client');
    
    // 1. 상태 확인
    const isAvailable = await nativeClient.isAvailable();
    console.log('✅ 네이티브 모듈 사용 가능:', isAvailable);
    
    if (isAvailable) {
      // 2. 시스템 정보 테스트
      const systemInfo = await nativeClient.getSystemInfo();
      console.log('✅ 시스템 정보:', systemInfo);
      
      // 3. 메모리 사용량 테스트
      const memoryUsage = await nativeClient.getMemoryUsage();
      console.log('✅ 메모리 사용량:', memoryUsage);
      
      // 4. GPU 정보 테스트
      const gpuInfo = await nativeClient.getGpuInfo();
      console.log('✅ GPU 정보:', gpuInfo);
      
      // 5. 유틸리티 함수 테스트
      const uuid = await nativeClient.generateUuid();
      console.log('✅ UUID 생성:', uuid);
      
      const timestamp = await nativeClient.getTimestamp();
      console.log('✅ 타임스탬프:', timestamp);
      
      console.log('🎉 모든 네이티브 모듈 테스트 통과!');
    } else {
      console.log('⚠️ 네이티브 모듈 사용 불가, JavaScript 폴백 모드');
    }
    
  } catch (error) {
    console.error('❌ 네이티브 모듈 테스트 실패:', error);
  }
}

// IPC 핸들러 테스트
async function testIPCHandlers() {
  try {
    console.log('🔗 IPC 핸들러 테스트 시작...');
    
    // IPC Handlers import
    const { IpcHandlers } = require('./src/main/ipc-handlers');
    
    // 핸들러 등록
    const ipcHandlers = IpcHandlers.getInstance();
    await ipcHandlers.register();
    
    console.log('✅ IPC 핸들러 등록 완료');
    
    // 테스트용 IPC 이벤트 시뮬레이션
    const testEvent = { reply: (channel, data) => console.log('IPC Reply:', channel, data) };
    
    // 네이티브 상태 조회 테스트
    setTimeout(async () => {
      try {
        const result = await new Promise((resolve) => {
          ipcMain.handleOnce('native:get-status', async () => {
            const { nativeClient } = require('./src/main/native-client');
            const status = await nativeClient.getStatus();
            return { success: true, data: status };
          });
          
          ipcMain.emit('native:get-status', testEvent);
        });
        
        console.log('✅ IPC 네이티브 상태 조회 테스트 통과');
      } catch (error) {
        console.error('❌ IPC 테스트 실패:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ IPC 핸들러 테스트 실패:', error);
  }
}

// 메인 테스트 실행
app.whenReady().then(async () => {
  createWindow();
  
  // 네이티브 모듈 테스트
  await testNativeModule();
  
  // IPC 핸들러 테스트
  await testIPCHandlers();
  
  console.log('🏁 통합 테스트 완료');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
