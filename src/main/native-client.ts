/**
 * Loop 6 NAPI 네이티브 모듈 클라이언트
 * 
 * 새로 빌드된 NAPI 네이티브 모듈과의 연동을 위한 클라이언트
 */

import path from 'path';
import { ipcMain } from 'electron';
import { debugLog, errorLog } from '../shared/utils';

// 네이티브 모듈 인터페이스 (NAPI 타입 정의와 일치)
export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  timestamp: string;
}

export interface MemoryStats {
  usage: MemoryUsage;
  peakUsage: MemoryUsage;
  averageUsage: MemoryUsage;
  totalSamples: number;
  monitoringDurationMs: string;
}

export interface GpuInfo {
  name: string;
  vendor: string;
  driverVersion: string;
  memoryTotal: string;
  memoryUsed: string;
  memoryFree: string;
  utilization: number;
  temperature: number;
  timestamp: string;
}

export interface GpuStats {
  current: GpuInfo;
  peakUtilization: number;
  averageUtilization: number;
  peakMemoryUsed: string;
  averageMemoryUsed: string;
  totalSamples: number;
  monitoringDurationMs: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  cpuCount: number;
  totalMemory: string;
  hostname: string;
  uptime: string;
  loadAverage: number[];
}

// 네이티브 모듈 인터페이스 정의
interface NativeModule {
  // 메모리 관련
  getMemoryUsage(): MemoryUsage | null;
  startMemoryMonitoring(): boolean;
  getMemoryStats(): MemoryStats | null;
  resetMemoryMonitoring(): boolean;
  
  // GPU 관련
  getGpuInfo(): GpuInfo | null;
  startGpuMonitoring(): boolean;
  getGpuStats(): GpuStats | null;
  resetGpuMonitoring(): boolean;
  
  // 시스템 정보
  getSystemInfo(): SystemInfo | null;
  
  // 유틸리티
  generateUuid(): string;
  getTimestamp(): number;
  getTimestampString(): string;
  getNativeModuleVersion(): string;
  initializeNativeModules(): boolean;
  cleanupNativeModules(): boolean;
  getNativeModuleInfo(): string;
  isNativeModuleAvailable(): boolean;
}

// 네이티브 모듈 상태
interface ModuleStatus {
  isLoaded: boolean;
  isAvailable: boolean;
  error: Error | null;
  version: string | null;
  loadTime: number;
}

class NativeModuleClient {
  private module: NativeModule | null = null;
  private status: ModuleStatus = {
    isLoaded: false,
    isAvailable: false,
    error: null,
    version: null,
    loadTime: 0
  };

  constructor() {
    this.loadModule();
  }

  /**
   * 네이티브 모듈 로드 (index.js를 통한 로드)
   */
  private loadModule(): void {
    const startTime = Date.now();
    
    try {
      const fs = require('fs');
      const isDev = process.env.NODE_ENV === 'development';
      
      // 가능한 네이티브 모듈 디렉토리 경로들을 우선순위 순으로 정의
      const possibleBasePaths: string[] = [];
      
      if (isDev) {
        // 개발 모드 경로들 (우선순위 순)
        possibleBasePaths.push(
          path.join(process.cwd(), 'dist', 'native-modules'),
          path.join(process.cwd(), 'native-modules'),
          path.join(__dirname, '..', '..', 'dist', 'native-modules'),
          path.join(__dirname, '..', '..', 'native-modules')
        );
      } else {
        // 프로덕션 모드 경로들
        const resourcesPath = process.resourcesPath || path.dirname(require.main?.filename || '');
        possibleBasePaths.push(
          path.join(resourcesPath, 'native-modules'),
          path.join(resourcesPath, '..', 'native-modules'),
          path.join(process.cwd(), 'native-modules')
        );
      }
      
      // 각 경로에서 index.js를 찾아서 첫 번째로 존재하는 모듈 사용
      let modulePath: string | null = null;
      for (const basePath of possibleBasePaths) {
        const indexPath = path.join(basePath, 'index.js');
        debugLog('🔍 네이티브 모듈 index.js 경로 확인: ${indexPath}');
        if (fs.existsSync(indexPath)) {
          modulePath = basePath;
          debugLog('✅ 네이티브 모듈 디렉토리 발견: ${basePath}');
          break;
        }
      }
      
      if (!modulePath) {
        const errorMsg = `❌ 네이티브 모듈을 찾을 수 없습니다. 시도한 경로들:\n${possibleBasePaths.map(p => `  - ${path.join(p, 'index.js')}`).join('\n')}`;
        throw new Error(errorMsg);
      }
      
      debugLog('🚀 NAPI 네이티브 모듈 로드 시도:', modulePath);
      
      // 네이티브 모듈 로드 (index.js를 통해)
      const indexPath = path.join(modulePath, 'index.js');
      debugLog('🚀 네이티브 모듈 index.js 로드 시도:', indexPath);
      
      // index.js 파일 존재 확인
      if (!fs.existsSync(indexPath)) {
        throw new Error(`index.js 파일이 존재하지 않습니다: ${indexPath}`);
      }
      
      this.module = require(indexPath) as NativeModule;
      debugLog('📦 네이티브 모듈 require() Completed');
      
      if (this.module) {
        if (typeof this.module.isNativeModuleAvailable === 'function') {
          // 먼저 초기화 시도
          const initResult = this.module.initializeNativeModules?.();
          debugLog('🔧 네이티브 모듈 초기화 결과:', initResult);
          
          let isAvailable = false;
          try {
            isAvailable = this.module.isNativeModuleAvailable();
            debugLog('🔍 네이티브 모듈 사용 가능 여부:', isAvailable);
          } catch (checkError) {
            throw new Error(`isNativeModuleAvailable 호출 Failed: ${checkError}`);
          }
          
          if (isAvailable) {
            // 버전 정보 가져오기
            const version = this.module.getNativeModuleVersion?.() || 'unknown';
            
            this.status = {
              isLoaded: true,
              isAvailable: true,
              error: null,
              version,
              loadTime: Date.now() - startTime
            };
            
            debugLog('✅ NAPI 네이티브 모듈 로드 Success (v${version})');
            
          } else {
            debugLog('❌ 네이티브 모듈이 사용 가능하지 않음');
            throw new Error('Native module is not available');
          }
        } else {
          throw new Error('isNativeModuleAvailable 함수가 존재하지 않습니다');
        }
      } else {
        throw new Error('Failed to load native module');
      }
      
    } catch (error) {
      this.status = {
        isLoaded: false,
        isAvailable: false,
        error: error instanceof Error ? error : new Error(String(error)),
        version: null,
        loadTime: Date.now() - startTime
      };
      
      errorLog('NAPI 네이티브 모듈 로드 Failed:', error);
    }
  }

  /**
 * 모듈 상태 확인
 */
  public getStatus(): ModuleStatus {
    return { ...this.status };
  }

  /**
 * 모듈 사용 가능 여부 확인
 */
  public isAvailable(): boolean {
    // 모듈이 로드되지 않았거나 상태가 없으면 false 반환
    if (!this.module || !this.status.isLoaded) {
      return false;
    }
    
    try {
      // 네이티브 모듈의 기본 함수들이 존재하는지 확인
      const hasBasicFunctions = !!(
        this.module.getMemoryUsage ||
        this.module.startMemoryMonitoring ||
        this.module.getSystemInfo
      );
      
      // isNativeModuleAvailable 함수가 있는지 확인 후 호출
      let nativeAvailable = false;
      if (typeof this.module.isNativeModuleAvailable === 'function') {
        nativeAvailable = this.module.isNativeModuleAvailable();
      } else {
        // 함수가 없는 경우 기본 함수 존재 여부로 판단
        nativeAvailable = hasBasicFunctions;
      }
      
      // 상태 업데이트
      this.status.isAvailable = nativeAvailable;
      
      return nativeAvailable;
    } catch (error) {
      errorLog('isAvailable 체크 중 Error:', error);
      // Error가 발생해도 모듈이 로드되었다면 기본적으로 사용 가능한 것으로 간주
      this.status.isAvailable = this.status.isLoaded;
      return this.status.isLoaded;
    }
  }

  // 메모리 관련 메서드들
  public getMemoryUsage(): MemoryUsage | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getMemoryUsage();
    } catch (error) {
      errorLog('getMemoryUsage 호출 Error:', error);
      return null;
    }
  }

  public startMemoryMonitoring(): boolean {
    if (!this.module || !this.status.isAvailable) return false;
    
    try {
      return this.module.startMemoryMonitoring();
    } catch (error) {
      errorLog('startMemoryMonitoring 호출 Error:', error);
      return false;
    }
  }

  public getMemoryStats(): MemoryStats | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getMemoryStats();
    } catch (error) {
      errorLog('getMemoryStats 호출 Error:', error);
      return null;
    }
  }

  public resetMemoryMonitoring(): boolean {
    if (!this.module || !this.status.isAvailable) return false;
    
    try {
      return this.module.resetMemoryMonitoring();
    } catch (error) {
      errorLog('resetMemoryMonitoring 호출 Error:', error);
      return false;
    }
  }

  // GPU 관련 메서드들
  public getGpuInfo(): GpuInfo | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getGpuInfo();
    } catch (error) {
      errorLog('getGpuInfo 호출 Error:', error);
      return null;
    }
  }

  public startGpuMonitoring(): boolean {
    if (!this.module || !this.status.isAvailable) return false;
    
    try {
      return this.module.startGpuMonitoring();
    } catch (error) {
      errorLog('startGpuMonitoring 호출 Error:', error);
      return false;
    }
  }

  public getGpuStats(): GpuStats | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getGpuStats();
    } catch (error) {
      errorLog('getGpuStats 호출 Error:', error);
      return null;
    }
  }

  public resetGpuMonitoring(): boolean {
    if (!this.module || !this.status.isAvailable) return false;
    
    try {
      return this.module.resetGpuMonitoring();
    } catch (error) {
      errorLog('resetGpuMonitoring 호출 Error:', error);
      return false;
    }
  }

  // 시스템 정보 메서드들
  public getSystemInfo(): SystemInfo | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getSystemInfo();
    } catch (error) {
      errorLog('getSystemInfo 호출 Error:', error);
      return null;
    }
  }

  // 유틸리티 메서드들
  public generateUuid(): string | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.generateUuid();
    } catch (error) {
      errorLog('generateUuid 호출 Error:', error);
      return null;
    }
  }

  public getTimestamp(): number | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getTimestamp();
    } catch (error) {
      errorLog('getTimestamp 호출 Error:', error);
      return null;
    }
  }

  public getTimestampString(): string | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getTimestampString();
    } catch (error) {
      errorLog('getTimestampString 호출 Error:', error);
      return null;
    }
  }

  public getNativeModuleInfo(): string | null {
    if (!this.module || !this.status.isAvailable) return null;
    
    try {
      return this.module.getNativeModuleInfo();
    } catch (error) {
      errorLog('getNativeModuleInfo 호출 Error:', error);
      return null;
    }
  }

  /**
 * 리소스 Cleanup
 */
  public cleanup(): void {
    if (this.module && this.status.isAvailable) {
      try {
        this.module.cleanupNativeModules?.();
        debugLog('네이티브 모듈 Cleanup Completed');
      } catch (error) {
        errorLog('네이티브 모듈 Cleanup 중 Error:', error);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
export const nativeClient = new NativeModuleClient();

/**
 * 네이티브 모듈 관련 IPC 핸들러 등록
 */
export function registerNativeIpcHandlers(): void {
  // 네이티브 모듈 사용 가능 여부 확인
  ipcMain.handle('native:isNativeModuleAvailable', async () => {
    try {
      const status = nativeClient.getStatus();
      return {
        success: true,
        data: status.isAvailable
      };
    } catch (error) {
      errorLog('네이티브 모듈 사용 가능 여부 조회 Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 Error'
      };
    }
  });

  // 네이티브 모듈 버전 정보
  ipcMain.handle('native:getNativeModuleVersion', async () => {
    try {
      const status = nativeClient.getStatus();
      return {
        success: true,
        data: status.version || '알 수 없음'
      };
    } catch (error) {
      errorLog('네이티브 모듈 버전 조회 Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 Error'
      };
    }
  });

  // 네이티브 모듈 상세 정보
  ipcMain.handle('native:getNativeModuleInfo', async () => {
    try {
      const info = nativeClient.getNativeModuleInfo();
      return {
        success: true,
        data: info
      };
    } catch (error) {
      errorLog('네이티브 모듈 상세 정보 조회 Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 Error'
      };
    }
  });

  // 기존 호환성 핸들러들 (camelCase 형태)
  ipcMain.handle('native:getStatus', async () => {
    try {
      const status = nativeClient.getStatus();
      return {
        success: true,
        data: {
          isLoaded: status.isLoaded,
          isAvailable: status.isAvailable,
          version: status.version,
          loadTime: status.loadTime,
          error: status.error ? status.error.message : null
        }
      };
    } catch (error) {
      errorLog('네이티브 상태 조회 Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 Error'
      };
    }
  });

  ipcMain.handle('native:getInfo', async () => {
    try {
      const info = nativeClient.getNativeModuleInfo();
      return {
        success: true,
        data: info
      };
    } catch (error) {
      errorLog('네이티브 정보 조회 Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 Error'
      };
    }
  });

  debugLog('네이티브 모듈 관련 IPC 핸들러 등록 Completed (kebab-case 형태 포함)');
}

/**
 * 네이티브 모듈 관련 IPC 핸들러 Cleanup
 */
export function cleanupNativeIpcHandlers(): void {
  // kebab-case 형태 핸들러들
  ipcMain.removeHandler('native:isNativeModuleAvailable');
  ipcMain.removeHandler('native:getNativeModuleVersion');
  ipcMain.removeHandler('native:getNativeModuleInfo');
  
  // 기존 호환성 핸들러들
  ipcMain.removeHandler('native:get-status');
  ipcMain.removeHandler('native:getInfo');
  
  debugLog('네이티브 모듈 관련 IPC 핸들러 Cleanup Completed');
}
