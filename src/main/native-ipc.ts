import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 새로운 통합 타입 시스템 사용
import type { 
  IpcResponse
} from '../types/ipc';
import { 
  createSuccessResponse,
  createErrorResponse,
  createIpcError
} from '../types/ipc';
import { CHANNELS } from '../preload/channels';

// 타입 정보 로깅 함수
function logTypeInformation(): void {
  console.debug('[네이티브 IPC] 타입 정보 초기화:', {
    NativeIpcTypes: 'namespace imported',
    SystemIpcTypes: 'namespace imported',
    typesRegistered: true
  });
}

// 네이티브 모듈 타입 정의
interface NativeModule {
  // 메모리 관련
  getMemoryUsage: () => { rss: number; heapTotal: number; heapUsed: number; external: number };
  startMemoryMonitoring: () => boolean;
  getMemoryStats: () => { total: number; used: number; free: number; percentage: number };
  optimizeMemory: () => boolean;
  cleanupMemory: () => { success: boolean; freedBytes?: number };
  optimizeMemoryAdvanced: () => { success: boolean; details?: Record<string, unknown> };
  resetMemoryMonitoring: () => boolean;
  
  // GPU 관련
  getGpuInfo: () => { name: string; vendor: string; memory: number; utilization: number };
  getGpuMemoryStats: () => { total: number; used: number; free: number };
  runGpuAcceleration: (data: string) => { success: boolean; result?: unknown };
  runGpuBenchmark: () => { score: number; details: Record<string, unknown> };
  
  // 시스템 관련
  getSystemInfo: () => string;
  isNativeModuleAvailable: () => boolean;
  getNativeModuleInfo: () => string;
  getNativeModuleVersion: () => string;
  initializeNativeModules: () => boolean;
  cleanupNativeModules: () => void;
  getTimestamp: () => number;
  
  // 워커 관련
  addWorkerTask: (taskData: string) => { taskId: string; success: boolean };
  getWorkerTaskStatus: (taskId: string) => { status: 'pending' | 'running' | 'completed' | 'failed'; result?: unknown };
  getWorkerStats: () => { activeWorkers: number; queuedTasks: number; completedTasks: number };
  getPendingTaskCount: () => number;
  resetWorkerPool: () => boolean;
  executeCpuTask: (taskData: string) => { result: unknown; executionTime: number };
  processDataParallel: (data: string) => { results: unknown[]; totalTime: number };
  
  // 유틸리티 관련
  calculateFileHash: (filePath: string) => string;
  calculateDirectorySize: (dirPath: string) => number;
  calculateStringSimilarity: (str1: string, str2: string) => number;
  validateJson: (jsonStr: string) => boolean;
  encodeBase64: (data: string) => string;
  decodeBase64: (encodedData: string) => string;
  generateUuid: () => string;
  getTimestampString: () => string;
  getEnvVar: (name: string) => string | null;
  getProcessId: () => number;
  startPerformanceMeasurement: (label: string) => string;
  endPerformanceMeasurement: (measurementId: string) => { duration: number; label: string };
}

// 네이티브 모듈 로드
let nativeModule: NativeModule | null = null;
let nativeModuleError: string | null = null;

async function loadNativeModule(): Promise<void> {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const currentDir = __dirname;
    
    console.log('[Native IPC] 네이티브 모듈 로딩 시도...');
    console.log('[Native IPC] 현재 디렉토리:', currentDir);
    console.log('[Native IPC] 개발 모드:', isDev);
    
    const possiblePaths = [
      path.join(currentDir, '../native-modules'),
      path.join(currentDir, '../../../native-modules'), 
      path.join(currentDir, '../../native-modules'),
      path.join(process.cwd(), 'native-modules'),
      path.join(process.cwd(), 'src/native-modules')
    ];
    
    const moduleFileName = process.platform === 'win32' ? 
      'native_modules.node' : 
      process.platform === 'darwin' ? 
        'libnative_modules.dylib' : 
        'libnative_modules.so';
    
    for (const basePath of possiblePaths) {
      const modulePath = path.join(basePath, moduleFileName);
      
      try {
        console.log(`[Native IPC] 경로에서 로드 시도: ${modulePath}`);
        
        if (fs.existsSync(modulePath)) {
          console.log('[Native IPC] 네이티브 모듈 파일 발견:', modulePath);
          nativeModule = await import(modulePath);
          
          // 초기화 시도
          if (nativeModule && typeof nativeModule.initializeNativeModules === 'function') {
            const initialized = nativeModule.initializeNativeModules();
            console.log('[Native IPC] 네이티브 모듈 초기화:', initialized);
          }
          
          console.log('[Native IPC] 네이티브 모듈 로드 성공:', {
            version: nativeModule?.getNativeModuleVersion?.() || 'unknown',
            functions: Object.keys(nativeModule || {}).length
          });
          
          nativeModuleError = null;
          return;
        }
      } catch (error) {
        console.error(`[Native IPC] 경로에서 로드 실패 ${modulePath}:`, error);
      }
    }
    
    throw new Error(`네이티브 모듈을 찾을 수 없습니다: ${moduleFileName}`);
    
  } catch (error) {
    nativeModuleError = error instanceof Error ? error.message : String(error);
    console.error('[Native IPC] 네이티브 모듈 로드 실패:', nativeModuleError);
    nativeModule = null;
  }
}

// 안전한 네이티브 함수 호출 래퍼
function safeNativeCall<T>(
  functionName: keyof NativeModule, 
  ...args: unknown[]
): { success: boolean; data?: T; error?: string } {
  try {
    if (!nativeModule) {
      return { 
        success: false, 
        error: `네이티브 모듈이 로드되지 않음: ${nativeModuleError}` 
      };
    }
    
    const func = nativeModule[functionName];
    if (typeof func !== 'function') {
      return { 
        success: false, 
        error: `함수 '${String(functionName)}'를 찾을 수 없음` 
      };
    }
    
    // this 컨텍스트 문제 해결을 위해 직접 호출
    const result = (func as (...args: unknown[]) => unknown)(...args);
    return { success: true, data: result as T };
  } catch (error) {
    console.error(`[Native IPC] ${String(functionName)} 호출 오류:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// JSON 파싱 헬퍼
function safeJsonParse(jsonStr: string): unknown {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[Native IPC] JSON 파싱 오류:', error);
    return null;
  }
}

/**
 * 네이티브 모듈 IPC 핸들러 등록
 */
export function registerNativeIpcHandlers(): void {
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 시작');
  
  // 타입 정보 로깅
  logTypeInformation();
  
  // 네이티브 모듈 로드
  loadNativeModule().catch(error => {
    console.error('[Native IPC] 네이티브 모듈 로드 실패:', error);
  });
  
  // 메모리 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_GET_MEMORY_USAGE, async (): Promise<IpcResponse<{ used: number; total: number; free: number; percentage: number }>> => {
    try {
      const result = safeNativeCall('getMemoryUsage');
      return createSuccessResponse(result.data as { used: number; total: number; free: number; percentage: number });
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
        success: result.success,
        monitoringId: String(result.data || 'default') 
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

  ipcMain.handle(CHANNELS.NATIVE_GET_MEMORY_STATS, async (): Promise<IpcResponse<unknown>> => {
    try {
      const result = safeNativeCall('getMemoryStats');
      return createSuccessResponse(result.data);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_STATS_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getMemoryStats' }
      );
      return createErrorResponse(ipcError);
    }
  });

  ipcMain.handle(CHANNELS.NATIVE_OPTIMIZE_MEMORY, async (): Promise<IpcResponse<unknown>> => {
    try {
      const result = safeNativeCall('optimizeMemory');
      return createSuccessResponse(result.data);
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

  ipcMain.handle(CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED, async (): Promise<IpcResponse<unknown>> => {
    try {
      const result = safeNativeCall('optimizeMemoryAdvanced');
      return createSuccessResponse(result.data);
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
      return createSuccessResponse({ success: result.success });
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_MEMORY_RESET_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'resetMemoryMonitoring' }
      );
      return createErrorResponse(ipcError);
    }
  });

  // GPU 관련 핸들러
  ipcMain.handle(CHANNELS.NATIVE_GET_GPU_INFO, async (): Promise<IpcResponse<unknown>> => {
    try {
      const result = safeNativeCall('getGpuInfo');
      return createSuccessResponse(result.data);
    } catch (error) {
      const ipcError = createIpcError(
        'NATIVE_GPU_INFO_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getGpuInfo' }
      );
      return createErrorResponse(ipcError);
    }
  });

  ipcMain.handle(CHANNELS.NATIVE_GET_GPU_MEMORY_STATS, async (): Promise<IpcResponse<unknown>> => {
    try {
      const result = safeNativeCall('getGpuMemoryStats');
      return createSuccessResponse(result.data);
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
  
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 등록 완료:', {
    moduleLoaded: !!nativeModule,
    error: nativeModuleError,
    handlersCount: 27 // 등록된 핸들러 수
  });
}

/**
 * 네이티브 모듈 IPC 핸들러 정리
 */
export function cleanupNativeIpcHandlers(): void {
  // 네이티브 모듈 정리
  if (nativeModule && typeof nativeModule.cleanupNativeModules === 'function') {
    try {
      nativeModule.cleanupNativeModules();
      console.log('[Native IPC] 네이티브 모듈 정리 완료');
    } catch (error) {
      console.error('[Native IPC] 네이티브 모듈 정리 오류:', error);
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
  
  console.log('[Native IPC] 네이티브 모듈 IPC 핸들러 정리 완료');
}

/**
 * 네이티브 모듈 상태 정보 조회 (기존 memory-ipc.ts와 연동)
 */
export function getNativeModuleStatus() {
  return {
    loaded: !!nativeModule,
    error: nativeModuleError,
    functions: nativeModule ? Object.keys(nativeModule).length : 0,
    version: nativeModule?.getNativeModuleVersion?.() || null,
    available: nativeModule?.isNativeModuleAvailable?.() || false
  };
}

// 네이티브 IPC 초기화 시 타입 정보 로깅
logTypeInformation();
