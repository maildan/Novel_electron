import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 새로운 통합 타입 시스템 사용
import type { 
  NativeIpcTypes,
  SystemIpcTypes,
  IpcResponse
} from '../types/ipc';
import { 
  createSuccessResponse,
  createErrorResponse,
  createIpcError
} from '../types/ipc';
import { CHANNELS } from '../preload/channels';

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
  ipcMain.handle(CHANNELS.NATIVE_GET_MEMORY_USAGE, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('getMemoryUsage');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_USAGE_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getMemoryUsage' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_START_MEMORY_MONITORING, async (): Promise<IpcResponse<{ success: boolean; monitoringId: string }>> => {
    try {
      const result = safeNativeCall('startMemoryMonitoring');
      return createSuccessResponse({ 
        success: !!result, 
        monitoringId: `monitor_${Date.now()}` 
      });
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_MONITORING_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'startMemoryMonitoring' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_MEMORY_STATS, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('getMemoryStats');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_STATS_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getMemoryStats' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_OPTIMIZE_MEMORY, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('optimizeMemory');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_OPTIMIZE_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'optimizeMemory' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_CLEANUP_MEMORY, async (): Promise<IpcResponse<{ freedMemory: number }>> => {
    try {
      const result = safeNativeCall('cleanupMemory') as { freedMemory?: number } | null;
      return createSuccessResponse({ freedMemory: result?.freedMemory || 0 });
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_CLEANUP_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'cleanupMemory' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('optimizeMemoryAdvanced');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_OPTIMIZE_ADVANCED_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'optimizeMemoryAdvanced' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_RESET_MEMORY_MONITORING, async (): Promise<IpcResponse<{ success: boolean }>> => {
    try {
      const result = safeNativeCall('resetMemoryMonitoring');
      return createSuccessResponse({ success: !!result });
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_MONITORING_RESET_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'resetMemoryMonitoring' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  // GPU 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_GET_GPU_INFO, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('getGpuInfo');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_GPU_INFO_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getGpuInfo' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS, async (): Promise<IpcResponse<any>> => {
    try {
      const result = safeNativeCall('getGpuMemoryStats');
      return createSuccessResponse(result);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_GPU_MEMORY_STATS_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getGpuMemoryStats' }
      );
      return createErrorResponse(ipcError);
    }
  });
  
  ipcMain.handle(CHANNELS.NATIVE_RUN_GPU_ACCELERATION, (_, data: string) => {
    return safeNativeCall('runGpuAcceleration', data);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_RUN_GPU_BENCHMARK, () => {
    return safeNativeCall('runGpuBenchmark');
  });
  
  // 시스템 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_GET_SYSTEM_INFO, () => {
    const result = safeNativeCall('getSystemInfo');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle(CHANNELS.NATIVE_IS_AVAILABLE, () => {
    return safeNativeCall('isNativeModuleAvailable');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_MODULE_INFO, () => {
    const result = safeNativeCall('getNativeModuleInfo');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_MODULE_VERSION, () => {
    return safeNativeCall('getNativeModuleVersion');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_INITIALIZE, () => {
    return safeNativeCall('initializeNativeModules');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_CLEANUP, () => {
    return safeNativeCall('cleanupNativeModules');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_TIMESTAMP, () => {
    return safeNativeCall('getTimestamp');
  });
  
  // 워커 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_ADD_WORKER_TASK, (_, taskData: string) => {
    return safeNativeCall('addWorkerTask', taskData);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_WORKER_TASK_STATUS, (_, taskId: string) => {
    const result = safeNativeCall('getWorkerTaskStatus', taskId);
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_WORKER_STATS, () => {
    const result = safeNativeCall('getWorkerStats');
    if (result.success && typeof result.data === 'string') {
      result.data = safeJsonParse(result.data);
    }
    return result;
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_PENDING_TASK_COUNT, () => {
    return safeNativeCall('getPendingTaskCount');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_RESET_WORKER_POOL, () => {
    return safeNativeCall('resetWorkerPool');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_EXECUTE_CPU_TASK, (_, taskData: string) => {
    return safeNativeCall('executeCpuTask', taskData);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, (_, data: string) => {
  ipcMain.handle(CHANNELS.NATIVE_PROCESS_DATA_PARALLEL, (_, data: string) => {
    return safeNativeCall('processDataParallel', data);
  });
  
  // 유틸리티 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_CALCULATE_FILE_HASH, (_, filePath: string) => {
    return safeNativeCall('calculateFileHash', filePath);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE, (_, dirPath: string) => {
    return safeNativeCall('calculateDirectorySize', dirPath);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY, (_, str1: string, str2: string) => {
    return safeNativeCall('calculateStringSimilarity', str1, str2);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_VALIDATE_JSON, (_, jsonStr: string) => {
    return safeNativeCall('validateJson', jsonStr);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_ENCODE_BASE64, (_, data: string) => {
    return safeNativeCall('encodeBase64', data);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_DECODE_BASE64, (_, encodedData: string) => {
    return safeNativeCall('decodeBase64', encodedData);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GENERATE_UUID, () => {
    return safeNativeCall('generateUuid');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_TIMESTAMP_STRING, () => {
    return safeNativeCall('getTimestampString');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_ENV_VAR, (_, name: string) => {
    return safeNativeCall('getEnvVar', name);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_GET_PROCESS_ID, () => {
    return safeNativeCall('getProcessId');
  });
  
  ipcMain.handle(CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT, (_, label: string) => {
    return safeNativeCall('startPerformanceMeasurement', label);
  });
  
  ipcMain.handle(CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT, (_, measurementId: string) => {
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
    CHANNELS.NATIVE_GET_MEMORY_USAGE,
    CHANNELS.NATIVE_START_MEMORY_MONITORING,
    CHANNELS.NATIVE_GET_MEMORY_STATS,
    CHANNELS.NATIVE_OPTIMIZE_MEMORY,
    CHANNELS.NATIVE_CLEANUP_MEMORY,
    CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED,
    CHANNELS.NATIVE_RESET_MEMORY_MONITORING,
    CHANNELS.NATIVE_GET_GPU_INFO,
    CHANNELS.NATIVE_GET_GPU_MEMORY_STATS,
    CHANNELS.NATIVE_RUN_GPU_ACCELERATION,
    CHANNELS.NATIVE_RUN_GPU_BENCHMARK,
    CHANNELS.NATIVE_GET_SYSTEM_INFO,
    CHANNELS.NATIVE_IS_AVAILABLE,
    CHANNELS.NATIVE_GET_MODULE_INFO,
    CHANNELS.NATIVE_GET_MODULE_VERSION,
    CHANNELS.NATIVE_INITIALIZE,
    CHANNELS.NATIVE_CLEANUP,
    CHANNELS.NATIVE_GET_TIMESTAMP,
    CHANNELS.NATIVE_ADD_WORKER_TASK,
    CHANNELS.NATIVE_GET_WORKER_TASK_STATUS,
    CHANNELS.NATIVE_GET_WORKER_STATS,
    CHANNELS.NATIVE_GET_PENDING_TASK_COUNT,
    CHANNELS.NATIVE_RESET_WORKER_POOL,
    CHANNELS.NATIVE_EXECUTE_CPU_TASK,
    CHANNELS.NATIVE_PROCESS_DATA_PARALLEL,
    CHANNELS.NATIVE_CALCULATE_FILE_HASH,
    CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE,
    CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY,
    CHANNELS.NATIVE_VALIDATE_JSON,
    CHANNELS.NATIVE_ENCODE_BASE64,
    CHANNELS.NATIVE_DECODE_BASE64,
    CHANNELS.NATIVE_GENERATE_UUID,
    CHANNELS.NATIVE_GET_TIMESTAMP_STRING,
    CHANNELS.NATIVE_GET_ENV_VAR,
    CHANNELS.NATIVE_GET_PROCESS_ID,
    CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT,
    CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT
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
