import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 네이티브 모듈 타입 정의
interface NativeModule {
  // 메모리 관련
  getMemoryUsage: () => any;
  startMemoryMonitoring: () => boolean;
  getMemoryStats: () => any;
  optimizeMemory: () => boolean;
  cleanupMemory: () => any;
  optimizeMemoryAdvanced: () => any;
  resetMemoryMonitoring: () => boolean;
  
  // GPU 관련
  getGpuInfo: () => any;
  getGpuMemoryStats: () => any;
  runGpuAcceleration: (data: string) => any;
  runGpuBenchmark: () => any;
  
  // 시스템 관련
  getSystemInfo: () => string;
  isNativeModuleAvailable: () => boolean;
  getNativeModuleInfo: () => string;
  getNativeModuleVersion: () => string;
  initializeNativeModules: () => boolean;
  cleanupNativeModules: () => boolean;
  getTimestamp: () => string;
  
  // 워커 관련
  addWorkerTask: (taskData: string) => string;
  getWorkerTaskStatus: (taskId: string) => any;
  getWorkerStats: () => any;
  getPendingTaskCount: () => number;
  resetWorkerPool: () => boolean;
  executeCpuTask: (taskData: string) => string;
  processDataParallel: (data: string) => string;
  
  // 유틸리티 관련
  calculateFileHash: (filePath: string) => string;
  calculateDirectorySize: (dirPath: string) => string;
  calculateStringSimilarity: (str1: string, str2: string) => number;
  validateJson: (jsonStr: string) => boolean;
  encodeBase64: (data: string) => string;
  decodeBase64: (encodedData: string) => string;
  generateUuid: () => string;
  getTimestampString: () => string;
  getEnvVar: (name: string) => string;
  getProcessId: () => number;
  startPerformanceMeasurement: (label: string) => string;
  endPerformanceMeasurement: (measurementId: string) => string;
}

// 네이티브 모듈 로드
let nativeModule: NativeModule | null = null;
let nativeModuleError: string | null = null;

function loadNativeModule(): void {
  try {
    // 플랫폼별 네이티브 모듈 경로 결정
    const platform = process.platform;
    const arch = process.arch;
    const moduleFileName = `typing-stats-native.${platform}-${arch}.node`;
    
    // 여러 가능한 경로들 시도
    const possiblePaths = [
      path.join(__dirname, '../../native-modules', moduleFileName),
      path.join(__dirname, '../..', 'native-modules', moduleFileName),
      path.join(process.cwd(), 'native-modules', moduleFileName),
      path.join(process.cwd(), 'dist', 'native-modules', moduleFileName),
    ];
    
    console.log('[Native IPC] 네이티브 모듈 로드 시도:', {
      platform,
      arch,
      fileName: moduleFileName,
      possiblePaths
    });
    
    for (const modulePath of possiblePaths) {
      try {
        if (fs.existsSync(modulePath)) {
          console.log('[Native IPC] 네이티브 모듈 파일 발견:', modulePath);
          nativeModule = require(modulePath);
          
          // 초기화 시도
          if (nativeModule && typeof nativeModule.initializeNativeModules === 'function') {
            const initialized = nativeModule.initializeNativeModules();
            console.log('[Native IPC] 네이티브 모듈 초기화:', initialized);
          }
          
          console.log('[Native IPC] 네이티브 모듈 로드 Success:', {
            version: nativeModule?.getNativeModuleVersion?.() || 'unknown',
            functions: Object.keys(nativeModule || {}).length
          });
          
          nativeModuleError = null;
          return;
        }
      } catch (error) {
        console.error('[Native IPC] 경로에서 로드 Failed ${modulePath}:', error);
      }
    }
    
    throw new Error(`네이티브 모듈을 찾을 수 없습니다: ${moduleFileName}`);
    
  } catch (error) {
    nativeModuleError = error instanceof Error ? error.message : String(error);
    console.error('[Native IPC] 네이티브 모듈 로드 Failed:', nativeModuleError);
    nativeModule = null;
  }
}

// 안전한 네이티브 함수 호출 래퍼
function safeNativeCall<T>(
  functionName: keyof NativeModule, 
  ...args: any[]
): { success: boolean; data?: T; error?: string } {
  try {
    if (!nativeModule) {
      return {
        success: false,
        error: nativeModuleError || '네이티브 모듈이 로드되지 않았습니다'
      };
    }
    
    const func = nativeModule[functionName];
    if (typeof func !== 'function') {
      return {
        success: false,
        error: `함수 '${functionName}'을 찾을 수 없습니다`
      };
    }
    
    const result = (func as any)(...args);
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Native IPC] ${functionName} 호출 Error:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

// JSON 파싱 헬퍼
function safeJsonParse(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return jsonStr; // JSON이 아니면 원본 문자열 반환
  }
}

/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
export function registerNativeIpcHandlers(): void {
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 시작');
  
  // 네이티브 모듈 로드
  loadNativeModule();
  
  // 메모리 관련 핸들러
  ipcMain.handle('nativeGetMemoryUsage', () => {
    const result = safeNativeCall('getMemoryUsage');
    return result;
  });
  
  ipcMain.handle('nativeStartMemoryMonitoring', () => {
    return safeNativeCall('startMemoryMonitoring');
  });
  
  ipcMain.handle('nativeGetMemoryStats', () => {
    const result = safeNativeCall('getMemoryStats');
    return result;
  });
  
  ipcMain.handle('nativeOptimizeMemory', () => {
    return safeNativeCall('optimizeMemory');
  });
  
  ipcMain.handle('nativeCleanupMemory', () => {
    return safeNativeCall('cleanupMemory');
  });
  
  ipcMain.handle('nativeOptimizeMemoryAdvanced', () => {
    return safeNativeCall('optimizeMemoryAdvanced');
  });
  
  ipcMain.handle('nativeResetMemoryMonitoring', () => {
    return safeNativeCall('resetMemoryMonitoring');
  });
  
  // GPU 관련 핸들러
  ipcMain.handle('nativeGetGpuInfo', () => {
    const result = safeNativeCall('getGpuInfo');
    return result;
  });
  
  ipcMain.handle('nativeGetGpuMemoryStats', () => {
    return safeNativeCall('getGpuMemoryStats');
  });
  
  ipcMain.handle('nativeRunGpuAcceleration', (_, data: string) => {
    return safeNativeCall('runGpuAcceleration', data);
  });
  
  ipcMain.handle('nativeRunGpuBenchmark', () => {
    return safeNativeCall('runGpuBenchmark');
  });
  
  // 시스템 관련 핸들러
  ipcMain.handle('nativeGetSystemInfo', () => {
    const result = safeNativeCall('getSystemInfo');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle('nativeIsNativeModuleAvailable', () => {
    return safeNativeCall('isNativeModuleAvailable');
  });
  
  ipcMain.handle('nativeGetNativeModuleInfo', () => {
    const result = safeNativeCall('getNativeModuleInfo');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle('nativeGetNativeModuleVersion', () => {
    return safeNativeCall('getNativeModuleVersion');
  });
  
  ipcMain.handle('nativeInitializeNativeModules', () => {
    return safeNativeCall('initializeNativeModules');
  });
  
  ipcMain.handle('nativeCleanupNativeModules', () => {
    return safeNativeCall('cleanupNativeModules');
  });
  
  ipcMain.handle('nativeGetTimestamp', () => {
    return safeNativeCall('getTimestamp');
  });

  // 워커 관련 핸들러
  ipcMain.handle('native:addWorkerTask', (_, taskData: string) => {
    return safeNativeCall('addWorkerTask', taskData);
  });
  
  ipcMain.handle('native:getWorkerTaskStatus', (_, taskId: string) => {
    const result = safeNativeCall('getWorkerTaskStatus', taskId);
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle('native:getWorkerStats', () => {
    const result = safeNativeCall('getWorkerStats');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle('native:getPendingTaskCount', () => {
    return safeNativeCall('getPendingTaskCount');
  });
  
  ipcMain.handle('native:resetWorkerPool', () => {
    return safeNativeCall('resetWorkerPool');
  });
  
  ipcMain.handle('native:executeCpuTask', (_, taskData: string) => {
    return safeNativeCall('executeCpuTask', taskData);
  });
  
  ipcMain.handle('native:processDataParallel', (_, data: string) => {
    return safeNativeCall('processDataParallel', data);
  });
  
  // 유틸리티 관련 핸들러
  ipcMain.handle('native:calculateFileHash', (_, filePath: string) => {
    return safeNativeCall('calculateFileHash', filePath);
  });
  
  ipcMain.handle('native:calculateDirectorySize', (_, dirPath: string) => {
    return safeNativeCall('calculateDirectorySize', dirPath);
  });
  
  ipcMain.handle('native:calculateStringSimilarity', (_, str1: string, str2: string) => {
    return safeNativeCall('calculateStringSimilarity', str1, str2);
  });
  
  ipcMain.handle('native:validateJson', (_, jsonStr: string) => {
    return safeNativeCall('validateJson', jsonStr);
  });
  
  ipcMain.handle('native:encodeBase64', (_, data: string) => {
    return safeNativeCall('encodeBase64', data);
  });
  
  ipcMain.handle('native:decodeBase64', (_, encodedData: string) => {
    return safeNativeCall('decodeBase64', encodedData);
  });
  
  ipcMain.handle('native:generateUuid', () => {
    return safeNativeCall('generateUuid');
  });
  
  ipcMain.handle('native:getTimestampString', () => {
    return safeNativeCall('getTimestampString');
  });
  
  ipcMain.handle('native:getEnvVar', (_, name: string) => {
    return safeNativeCall('getEnvVar', name);
  });
  
  ipcMain.handle('native:getProcessId', () => {
    return safeNativeCall('getProcessId');
  });
  
  ipcMain.handle('native:startPerformanceMeasurement', (_, label: string) => {
    return safeNativeCall('startPerformanceMeasurement', label);
  });
  
  ipcMain.handle('native:endPerformanceMeasurement', (_, measurementId: string) => {
    return safeNativeCall('endPerformanceMeasurement', measurementId);
  });
  
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 Completed:', {
    moduleLoaded: !!nativeModule,
    error: nativeModuleError,
    handlersCount: 27 // 등록된 핸들러 수
  });
}

/**
 * 네이티브 모듈 IPC 핸들러 Cleanup
 */
export function cleanupNativeIpcHandlers(): void {
  // 네이티브 모듈 Cleanup
  if (nativeModule && typeof nativeModule.cleanupNativeModules === 'function') {
    try {
      nativeModule.cleanupNativeModules();
      console.log('[Native IPC] 네이티브 모듈 Cleanup Completed');
    } catch (error) {
      console.error('[Native IPC] 네이티브 모듈 Cleanup Error:', error);
    }
  }
  
  // IPC 핸들러 제거
  const handlers = [
    'native:getMemoryUsage',
    'native:startMemoryMonitoring',
    'native:getMemoryStats',
    'native:optimizeMemory',
    'native:cleanupMemory',
    'native:optimizeMemoryAdvanced',
    'native:resetMemoryMonitoring',
    'native:getGpuInfo',
    'native:getGpuMemoryStats',
    'native:runGpuAcceleration',
    'native:runGpuBenchmark',
    'native:getSystemInfo',
    'native:initializeNativeModules',
    'native:cleanupNativeModules',
    'native:getTimestamp',
    'native:addWorkerTask',
    'native:getWorkerTaskStatus',
    'native:getWorkerStats',
    'native:getPendingTaskCount',
    'native:resetWorkerPool',
    'native:executeCpuTask',
    'native:processDataParallel',
    'native:calculateFileHash',
    'native:calculateDirectorySize',
    'native:calculateStringSimilarity',
    'native:validateJson',
    'native:encodeBase64',
    'native:decodeBase64',
    'native:generateUuid',
    'native:getTimestampString',
    'native:getEnvVar',
    'native:getProcessId',
    'native:startPerformanceMeasurement',
    'native:endPerformanceMeasurement'
  ];
  
  handlers.forEach(handler => {
    ipcMain.removeHandler(handler);
  });
  
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 Cleanup Completed');
}

// 네이티브 모듈 상태 정보 조회 (기존 memory-ipc.ts와 연동)
export function getNativeModuleStatus() {
  return {
    loaded: !!nativeModule,
    error: nativeModuleError,
    functions: nativeModule ? Object.keys(nativeModule).length : 0,
    version: nativeModule?.getNativeModuleVersion?.() || null,
    available: nativeModule?.isNativeModuleAvailable?.() || false
  };
}
