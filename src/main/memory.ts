import { app, webContents, ipcMain } from 'electron';
import { AppConfig } from './config';

// React 컴포넌트에서 기대하는 메모리 데이터 구조
export interface ReactMemoryInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface ReactMemoryData {
  main: ReactMemoryInfo;
  renderer: ReactMemoryInfo;
  gpu?: ReactMemoryInfo;
  system: ReactMemoryInfo;
  timestamp: number;
}

// 외부로 노출되는 메모리 통계 구조 (React 컴포넌트용)
export interface MemoryStats {
  main: ReactMemoryInfo;
  renderer: ReactMemoryInfo[];
  system: {
    total: number;
    free: number;
    used: number;
  };
  gpu?: {
    used: number;
    total: number;
  };
}

export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 25; // 25MB로 더욱 대폭 감소
  private forceGcThreshold = 40; // 40MB로 더욱 대폭 감소
  private cleanupIntervalMs = 15000; // 15초마다 Cleanup (더욱 빈번)
  private lastCleanup = Date.now();
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 10; // 히스토리 크기 더욱 감소
  private aggressiveMode = true; // 적극적 모드 활성화
  private ultraLowMemoryMode = true; // 초절약 모드 활성화

  private constructor() {
    this.initialize();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
 * 메모리 관리자 초기화
 */
  private initialize(): void {
    console.log('[Memory] 메모리 관리자 초기화');
    
    // 주기적 메모리 Cleanup
    this.startCleanupTimer();
    
    // 메모리 모니터링
    if (AppConfig.isDev) {
      this.startMonitoring();
    }

    // 앱 종료 시 Cleanup
    app.on('before-quit', () => {
      this.dispose();
    });

    // 메모리 압박 상황 감지
    app.on('render-process-gone', (event, webContents, details) => {
      console.warn('[Memory] 렌더러 프로세스 종료:', details);
      if (details.reason === 'oom') {
        this.handleOutOfMemory();
      }
    });
  }

  /**
   * Node.js memoryUsage를 React 컴포넌트가 기대하는 ReactMemoryInfo 형태로 변환 (RSS 기반)
   */
  private convertNodeMemoryToMemoryInfo(nodeMemory: NodeJS.MemoryUsage): ReactMemoryInfo {
    const os = require('os');
    const systemTotalMemory = os.totalmem();
    
    // 바이트를 메가바이트로 정확하게 변환
    const rssMB = Math.round(nodeMemory.rss / (1024 * 1024) * 100) / 100;
    const totalSystemMB = Math.round(systemTotalMemory / (1024 * 1024) * 100) / 100;
    
    // RSS 기반 계산 (OS 모니터와 일치)
    const used = rssMB; // RSS를 실제 사용 메모리로 사용
    const total = totalSystemMB; // 시스템 전체 메모리를 total로 사용
    const free = Math.max(0, total - used);
    const percentage = total > 0 ? Math.round((used / total) * 100 * 100) / 100 : 0;

    console.log('[Memory] RSS 기반 메모리 계산: RSS=${rssMB}MB, SystemTotal=${totalSystemMB}MB, Used=${used}MB, Total=${total}MB, Percentage=${percentage}%');

    return {
      total,
      used,
      free,
      percentage
    };
  }

  /**
 * 현재 메모리 사용량 조회
 */
  getCurrentMemoryUsage(): MemoryStats {
    const mainProcess = process.memoryUsage();
    const rendererProcesses = this.getRendererMemoryUsage();
    const systemMemory = this.getSystemMemoryInfo();

    const stats: MemoryStats = {
      main: this.convertNodeMemoryToMemoryInfo(mainProcess),
      renderer: rendererProcesses,
      system: systemMemory,
    };

    // GPU 메모리 정보 (가능한 경우)
    try {
      const gpuMemory = this.getGpuMemoryInfo();
      if (gpuMemory) {
        stats.gpu = gpuMemory;
      }
    } catch (error) {
      // GPU 메모리 정보를 가져올 수 없는 경우 무시
    }

    return stats;
  }

  /**
 * 렌더러 프로세스 메모리 사용량 조회
 */
  private getRendererMemoryUsage(): ReactMemoryInfo[] {
    const rendererStats: ReactMemoryInfo[] = [];

    webContents.getAllWebContents().forEach((contents) => {
      try {
        // Electron의 WebContents.getProcessId()와 process.memoryUsage() 사용
        const processId = contents.getProcessId();
        if (processId) {
          // 기본 메모리 정보 사용 (실제 프로세스별 메모리는 네이티브 모듈에서 처리)
          const mainMemory = process.memoryUsage();
          // 추정값으로 변환 (절반으로 나누어 렌더러 프로세스 추정)
          const estimatedMemory: NodeJS.MemoryUsage = {
            heapUsed: mainMemory.heapUsed / 2,
            heapTotal: mainMemory.heapTotal / 2,
            external: mainMemory.external / 2,
            rss: mainMemory.rss / 2,
            arrayBuffers: mainMemory.arrayBuffers / 2
          };
          rendererStats.push(this.convertNodeMemoryToMemoryInfo(estimatedMemory));
        }
      } catch (error) {
        // 메모리 정보를 가져올 수 없는 경우 건너뛰기
      }
    });

    return rendererStats;
  }

  /**
 * 시스템 메모리 정보 조회
 */
  private getSystemMemoryInfo(): { total: number; free: number; used: number } {
    const os = require('os');
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: Math.round(totalMemory / 1024 / 1024),
      free: Math.round(freeMemory / 1024 / 1024),
      used: Math.round(usedMemory / 1024 / 1024),
    };
  }

  /**
   * GPU 메모리 정보 조회 (네이티브 모듈 사용)
   */
  private getGpuMemoryInfo(): { used: number; total: number } | null {
    try {
      // 네이티브 모듈에서 GPU 메모리 정보 가져오기
      // 실제 구현은 Rust 네이티브 모듈에서 처리
      return null; // 임시로 null 반환
    } catch (error) {
      return null;
    }
  }

  /**
   * 메모리 Cleanup 수행
   */
  async performCleanup(force = false): Promise<void> {
    const now = Date.now();
    
    // 적극적 모드에서는 더 자주 Cleanup
    const minInterval = this.aggressiveMode ? this.cleanupIntervalMs / 4 : this.cleanupIntervalMs / 2;
    
    if (!force && now - this.lastCleanup < minInterval) {
      return;
    }

    console.log('[Memory] 적극적 메모리 Cleanup 시작');
    const beforeStats = this.getCurrentMemoryUsage();

    try {
      // 1. 강제 가비지 컬렉션 (여러 번 실행)
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 2. 렌더러 프로세스 적극적 Cleanup
      await this.aggressiveRendererCleanup();

      // 3. 모든 캐시 강제 Cleanup
      await this.aggressiveCacheCleanup();

      // 4. 세션 데이터 Cleanup
      await this.clearSessionData();

      // 5. V8 힙 압축
      if (global.gc && this.aggressiveMode) {
        process.nextTick(() => {
          if (global.gc) global.gc();
        });
      }

      const afterStats = this.getCurrentMemoryUsage();
      const freedMemory = beforeStats.main.used - afterStats.main.used;

      console.log('[Memory] 적극적 메모리 Cleanup Completed: ${freedMemory.toFixed(2)}MB 해제');
      this.lastCleanup = now;

      // 메모리 히스토리 업데이트 (압축)
      this.updateMemoryHistory(afterStats);

    } catch (error) {
      console.error('[Memory] 적극적 메모리 Cleanup Failed:', error);
    }
  }

  /**
 * 렌더러 프로세스 메모리 Cleanup
 */
  private async cleanupRendererProcesses(): Promise<void> {
    const allContents = webContents.getAllWebContents();

    for (const contents of allContents) {
      try {
        if (!contents.isDestroyed()) {
          // DOM 스토리지 Cleanup
          await contents.session.clearStorageData({
            storages: ['localstorage', 'websql', 'indexdb'],
          });

          // 메모리 압축 요청
          await contents.executeJavaScript(`
            if (window.gc) {
              window.gc();
            }
            
            // 메모리 최적화
            if (performance && performance.memory) {
              console.log('Memory before cleanup:', performance.memory);
            }
          `);
        }
      } catch (error) {
        // 개별 프로세스 Cleanup Failed는 무시
      }
    }
  }

  /**
   * 캐시 Cleanup
   */
  private async clearCaches(): Promise<void> {
    try {
      const session = require('electron').session.defaultSession;
      
      // HTTP 캐시 Cleanup
      await session.clearCache();
      
      // 이미지 캐시 Cleanup (부분적)
      await session.clearStorageData({
        storages: ['appcache', 'serviceworkers'],
      });

    } catch (error) {
      console.error('[Memory] 캐시 Cleanup Failed:', error);
    }
  }

  /**
 * 메모리 부족 상황 처리
 */
  private async handleOutOfMemory(): Promise<void> {
    console.warn('[Memory] OOM 상황 감지 - 긴급 메모리 Cleanup');
    
    try {
      // 긴급 Cleanup
      await this.performCleanup(true);
      
      // 추가 조치
      await this.emergencyCleanup();
      
    } catch (error) {
      console.error('[Memory] 긴급 메모리 Cleanup Failed:', error);
    }
  }

  /**
 * 긴급 메모리 Cleanup
 */
  private async emergencyCleanup(): Promise<void> {
    try {
      // 불필요한 렌더러 프로세스 종료
      const allContents = webContents.getAllWebContents();
      for (const contents of allContents) {
        if (!contents.isDestroyed() && contents.getURL().includes('devtools')) {
          contents.close();
        }
      }

      // 모든 캐시 강제 Cleanup
      const session = require('electron').session.defaultSession;
      await session.clearStorageData();

    } catch (error) {
      console.error('[Memory] 긴급 Cleanup Failed:', error);
    }
  }

  /**
 * 메모리 히스토리 업데이트
 */
  private updateMemoryHistory(stats: MemoryStats): void {
    this.memoryHistory.push(stats);

    // 히스토리 크기 제한
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
  }

  /**
 * 메모리 모니터링 시작
 */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const stats = this.getCurrentMemoryUsage();
      
      // 임계값 확인 (더 낮은 임계값)
      if (stats.main.used > this.memoryThreshold) {
        console.warn('[Memory] 메모리 사용량 임계값 초과: ${stats.main.used}MB');
        this.performCleanup();
      }

      // 강제 GC 임계값 확인 (더 낮은 임계값)
      if (stats.main.used > this.forceGcThreshold) {
        console.warn('[Memory] 강제 GC 실행: ${stats.main.used}MB');
        if (global.gc) {
          global.gc();
        }
      }

      // 메모리 사용량이 30MB를 넘으면 적극적 Cleanup
      if (stats.main.used > 30) {
        console.log('[Memory] 30MB 임계값 초과 - 적극적 Cleanup 실행');
        this.performCleanup(true);
      }

      this.updateMemoryHistory(stats);
    }, 15000); // 15초마다 모니터링 (더 빈번)
  }

  /**
 * 정기 Cleanup 타이머 시작
 */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);
  }

  /**
 * 메모리 통계 조회
 */
  getMemoryStats(): {
    current: MemoryStats;
    history: MemoryStats[];
    averageUsage: number;
  } {
    const current = this.getCurrentMemoryUsage();
    const history = this.memoryHistory.slice(-20); // 최근 20개

    let averageUsage = 0;
    if (history.length > 0) {
      averageUsage = history.reduce((acc, stats) => acc + stats.main.used, 0) / history.length;
    }

    return { current, history, averageUsage: Math.round(averageUsage) };
  }

  /**
 * 리소스 Cleanup
 */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[Memory] 메모리 관리자 Cleanup Completed');
  }

  /**
   * 메모리 사용량 조회 (IPC용)
   */
  async getMemoryUsage(): Promise<ReactMemoryData> {
    try {
      const stats = this.getCurrentMemoryUsage();
      
      // 렌더러 프로세스 정보를 하나로 합산
      let totalRendererUsed = 0;
      let totalRendererTotal = 0;
      
      stats.renderer.forEach(renderer => {
        totalRendererUsed += renderer.used;
        totalRendererTotal += renderer.total;
      });

      const rendererInfo: ReactMemoryInfo = {
        total: totalRendererTotal,
        used: totalRendererUsed,
        free: totalRendererTotal - totalRendererUsed,
        percentage: totalRendererTotal > 0 ? Math.round((totalRendererUsed / totalRendererTotal) * 100) : 0
      };

      const systemInfo: ReactMemoryInfo = {
        total: stats.system.total,
        used: stats.system.used,
        free: stats.system.free,
        percentage: Math.round((stats.system.used / stats.system.total) * 100)
      };

      const result: ReactMemoryData = {
        main: stats.main,
        renderer: rendererInfo,
        system: systemInfo,
        timestamp: Date.now()
      };

      if (stats.gpu) {
        result.gpu = {
          total: stats.gpu.total,
          used: stats.gpu.used,
          free: stats.gpu.total - stats.gpu.used,
          percentage: Math.round((stats.gpu.used / stats.gpu.total) * 100)
        };
      }

      return result;
    } catch (error) {
      console.error('[MemoryManager] 메모리 사용량 조회 Failed:', error);
      throw error;
    }
  }

  /**
   * 메모리 최적화 실행 (IPC용)
   */
  async optimize(): Promise<any> {
    try {
      console.log('[MemoryManager] 메모리 최적화 시작');
      
      const beforeMemory = await this.getMemoryUsage();
      
      // 강제 메모리 Cleanup 수행
      await this.performCleanup(true);
      
      // 잠시 대기 후 메모리 사용량 재측정
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterMemory = await this.getMemoryUsage();
      
      const result = {
        before: beforeMemory,
        after: afterMemory,
        freed: {
          main: beforeMemory.main.used - afterMemory.main.used,
          renderer: beforeMemory.renderer.used - afterMemory.renderer.used,
          system: beforeMemory.system.used - afterMemory.system.used
        },
        timestamp: Date.now()
      };
      
      console.log('[MemoryManager] 메모리 최적화 Completed:', result);
      return result;
    } catch (error) {
      console.error('[MemoryManager] 메모리 최적화 Failed:', error);
      throw error;
    }
  }

  /**
 * 렌더러 프로세스 적극적 Cleanup
 */
  private async aggressiveRendererCleanup(): Promise<void> {
    const allContents = webContents.getAllWebContents();

    for (const contents of allContents) {
      try {
        if (!contents.isDestroyed()) {
          // 1. 모든 스토리지 데이터 강제 Cleanup
          await contents.session.clearStorageData({
            storages: ['localstorage', 'websql', 'indexdb', 'cookies', 'filesystem'],
          });

          // 2. 적극적 메모리 압축
          await contents.executeJavaScript(`
            // 강제 GC 실행 (여러번)
            for(let i = 0; i < 5; i++) {
              if (window.gc) window.gc();
              if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
                console.warn('High memory usage detected, forcing cleanup');
              }
            }
            
            // DOM Cleanup
            if (document.querySelectorAll) {
              const elements = document.querySelectorAll('*');
              for(let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el && el.style) {
                  el.style.cssText = '';
                }
              }
            }
            
            // 이벤트 리스너 Cleanup
            if (window.removeEventListener) {
              ['scroll', 'resize', 'mousemove', 'click'].forEach(event => {
                window.removeEventListener(event, () => {});
              });
            }
          `);

          // 3. 캐시 강제 Cleanup
          await contents.session.clearCache();
        }
      } catch (error) {
        // 개별 프로세스 Cleanup Failed는 무시하고 계속
        console.warn('[Memory] 개별 렌더러 Cleanup Failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  /**
 * 모든 캐시 적극적 Cleanup
 */
  private async aggressiveCacheCleanup(): Promise<void> {
    try {
      const session = require('electron').session.defaultSession;
      
      // 1. 모든 캐시 타입 강제 Cleanup
      await session.clearCache();
      
      // 2. 모든 스토리지 데이터 Cleanup
      await session.clearStorageData({
        storages: [
          'appcache', 'cookies', 'filesystem', 'indexdb',
          'localstorage', 'shadercache', 'websql', 'serviceworkers'
        ],
      });

      // 3. 코드 캐시 Cleanup
      await session.clearCodeCaches({});

      // 4. 호스트 리졸버 캐시 Cleanup
      await session.clearHostResolverCache();

      console.log('[Memory] 적극적 캐시 Cleanup Completed');

    } catch (error) {
      console.error('[Memory] 적극적 캐시 Cleanup Failed:', error);
    }
  }

  /**
 * 세션 데이터 Cleanup
 */
  private async clearSessionData(): Promise<void> {
    try {
      const session = require('electron').session.defaultSession;
      
      // 1. 모든 세션 관련 데이터 Cleanup
      await session.clearStorageData();
      
      // 2. 인증 캐시 Cleanup
      await session.clearAuthCache();
      
      // 3. 코드 캐시 Cleanup
      if (session.clearCodeCaches) {
        await session.clearCodeCaches({});
      }

      console.log('[Memory] 세션 데이터 Cleanup Completed');
      
    } catch (error) {
      console.error('[Memory] 세션 데이터 Cleanup Failed:', error);
    }
  }
}