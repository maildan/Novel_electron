/**
 * Loop 6 고급 메모리 관리자
 * Loop 3의 정교한 메모리 관리 시스템을 TypeScript로 완전 마이그레이션
 */

import { app, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { debugLog, errorLog } from '../shared/utils';
import { nativeClient } from './native-client';

// 메모리 관리 Setup 인터페이스
interface MemorySettings {
  checkInterval: number;
  threshold: number;
  optimizeOnIdle: boolean;
  aggressiveMode: boolean;
  autoGarbageCollection: boolean;
  maxMemoryUsage: number; // MB
  lastUpdated: string;
}

interface MemoryInfo {
  totalMemoryMB: number;
  freeMemoryMB: number;
  usedMemoryMB: number;
  availableMemoryMB: number;
  processMemoryMB: number;
  heapUsed: number;
  heapTotal: number;
  percentUsed: number;
  timestamp: number;
}

interface MemoryOptimizationResult {
  freedBytes: number;
  durationMs: number;
  method: string;
  success: boolean;
  details?: any;
}

interface MemoryPool {
  id: string;
  size: number;
  used: number;
  available: number;
  type: 'heap' | 'native' | 'buffer';
}

// 메모리 관리 클래스
class AdvancedMemoryManager {
  private settings: MemorySettings;
  private configPath: string;
  private isInitialized = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastOptimizationTime = 0;
  private memoryPools: Map<string, MemoryPool> = new Map();
  private memoryHistory: MemoryInfo[] = [];

  constructor() {
    // 사용자 데이터 경로 Setup
    const userDataPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../userData')
      : app.getPath('userData');
    
    this.configPath = path.join(userDataPath, 'memory-settings.json');
    
    // 기본 Setup
    this.settings = {
      checkInterval: 30000, // 30초
      threshold: 80, // 80%
      optimizeOnIdle: true,
      aggressiveMode: false,
      autoGarbageCollection: true,
      maxMemoryUsage: 2048, // 2GB
      lastUpdated: new Date().toISOString()
    };
  }

  /**
 * 메모리 관리자 초기화
 */
  async initialize(): Promise<void> {
    try {
      debugLog('고급 메모리 관리자 초기화 시작');
      
      // Setup 로드
      await this.loadSettings();
      
      // 네이티브 모듈 초기화
      await this.initializeNativeMemory();
      
      // 메모리 풀 초기화
      this.initializeMemoryPools();
      
      // 주기적 메모리 체크 시작
      this.startMemoryMonitoring();
      
      // 앱 이벤트 리스너 Setup
      this.setupEventListeners();
      
      this.isInitialized = true;
      debugLog('고급 메모리 관리자 초기화 Completed');
      
    } catch (error) {
      errorLog('메모리 관리자 초기화 중 Error:', error);
      this.isInitialized = false;
    }
  }

  /**
 * Setup 파일 로드
 */
  private async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        this.settings = { ...this.settings, ...loadedSettings };
        debugLog('메모리 관리 Setup 로드 Completed');
      } else {
        await this.saveSettings();
        debugLog('기본 메모리 관리 Setup 생성 Completed');
      }
    } catch (error) {
      errorLog('메모리 관리 Setup 로드 중 Error:', error);
    }
  }

  /**
 * Setup 파일 저장
 */
  private async saveSettings(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.settings.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
      debugLog('메모리 관리 Setup 저장 Completed');
      
    } catch (error) {
      errorLog('메모리 관리 Setup Saving Error:', error);
    }
  }

  /**
 * 네이티브 메모리 모듈 초기화
 */
  private async initializeNativeMemory(): Promise<void> {
    try {
      const isAvailable = await nativeClient.isAvailable();
      
      if (isAvailable) {
        debugLog('NAPI 네이티브 메모리 모듈 사용 가능');
        
        // 메모리 모니터링 시작
        const started = await nativeClient.startMemoryMonitoring();
        if (started) {
          debugLog('네이티브 메모리 모니터링 Started');
          
          // 초기 메모리 정보 수집
          const memoryUsage = await nativeClient.getMemoryUsage();
          if (memoryUsage) {
            debugLog('초기 메모리 정보:', memoryUsage);
          }
        }
      } else {
        debugLog('NAPI 네이티브 메모리 모듈 사용 불가, JavaScript 폴백 사용');
      }
    } catch (error) {
      errorLog('네이티브 메모리 모듈 초기화 중 Error:', error);
    }
  }

  /**
 * 메모리 풀 초기화
 */
  private initializeMemoryPools(): void {
    try {
      // 힙 메모리 풀
      this.memoryPools.set('heap', {
        id: 'heap',
        size: 0,
        used: 0,
        available: 0,
        type: 'heap'
      });
      
      // 네이티브 메모리 풀
      this.memoryPools.set('native', {
        id: 'native',
        size: 0,
        used: 0,
        available: 0,
        type: 'native'
      });
      
      // 버퍼 메모리 풀
      this.memoryPools.set('buffer', {
        id: 'buffer',
        size: 0,
        used: 0,
        available: 0,
        type: 'buffer'
      });
      
      debugLog('메모리 풀 초기화 Completed');
    } catch (error) {
      errorLog('메모리 풀 초기화 중 Error:', error);
    }
  }

  /**
 * 주기적 메모리 모니터링 시작
 */
  private startMemoryMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      await this.performMemoryCheck();
    }, this.settings.checkInterval);
    
    debugLog('메모리 모니터링 시작 (간격: ${this.settings.checkInterval}ms)');
  }

  /**
 * 메모리 체크 수행
 */
  private async performMemoryCheck(): Promise<void> {
    try {
      const memoryInfo = await this.getMemoryInfo();
      
      // 메모리 Add to history
      this.memoryHistory.push(memoryInfo);
      
      // 최근 100개 기록만 유지
      if (this.memoryHistory.length > 100) {
        this.memoryHistory = this.memoryHistory.slice(-100);
      }
      
      // 임계값 초과 시 최적화 실행
      if (memoryInfo.percentUsed > this.settings.threshold) {
        debugLog('메모리 사용률 임계값 초과: ${memoryInfo.percentUsed}%');
        await this.optimizeMemory();
      }
      
      // 메모리 풀 업데이트
      this.updateMemoryPools(memoryInfo);
      
    } catch (error) {
      errorLog('메모리 체크 중 Error:', error);
    }
  }

  /**
 * 메모리 풀 업데이트
 */
  private updateMemoryPools(memoryInfo: MemoryInfo): void {
    try {
      // 힙 메모리 풀 업데이트
      const heapPool = this.memoryPools.get('heap');
      if (heapPool) {
        heapPool.size = memoryInfo.heapTotal;
        heapPool.used = memoryInfo.heapUsed;
        heapPool.available = memoryInfo.heapTotal - memoryInfo.heapUsed;
      }
      
      // 네이티브 메모리 풀 업데이트
      const nativePool = this.memoryPools.get('native');
      if (nativePool) {
        nativePool.size = memoryInfo.totalMemoryMB * 1024 * 1024;
        nativePool.used = memoryInfo.usedMemoryMB * 1024 * 1024;
        nativePool.available = memoryInfo.availableMemoryMB * 1024 * 1024;
      }
      
    } catch (error) {
      errorLog('메모리 풀 업데이트 중 Error:', error);
    }
  }

  /**
 * 앱 이벤트 리스너 Setup
 */
  private setupEventListeners(): void {
    // 앱 종료 시 Cleanup
    app.on('before-quit', () => {
      this.cleanup();
    });
    
    // 창이 모두 닫힐 때 메모리 Cleanup
    app.on('window-all-closed', async () => {
      if (this.settings.optimizeOnIdle) {
        await this.optimizeMemory();
      }
    });
  }

  /**
   * 메모리 정보 가져오기 (RSS 기반)
   */
  async getMemoryInfo(): Promise<MemoryInfo> {
    try {
      const os = require('os');
      const systemTotalMemory = os.totalmem();
      
      // NAPI 네이티브 모듈 먼저 시도
      const isAvailable = await nativeClient.isAvailable();
      
      if (isAvailable) {
        const memoryUsage = await nativeClient.getMemoryUsage();
        if (memoryUsage) {
          // NAPI 모듈의 문자열 타입을 숫자로 변환
          const rss = parseInt(memoryUsage.rss);
          const heapTotal = parseInt(memoryUsage.heapTotal);
          const heapUsed = parseInt(memoryUsage.heapUsed);
          const external = parseInt(memoryUsage.external);
          
          // RSS 기반 메모리 계산 (OS 모니터와 일치)
          const rssMB = Math.round(rss / (1024 * 1024));
          const totalMemoryMB = Math.round(systemTotalMemory / (1024 * 1024));
          const memoryUsagePercent = Math.round((rss / systemTotalMemory) * 100);
          
          return {
            totalMemoryMB: totalMemoryMB,
            freeMemoryMB: totalMemoryMB - rssMB,
            usedMemoryMB: rssMB, // RSS를 실제 사용 메모리로 사용
            availableMemoryMB: totalMemoryMB - rssMB,
            processMemoryMB: rssMB,
            heapUsed: heapUsed,
            heapTotal: heapTotal,
            percentUsed: memoryUsagePercent, // RSS 기반 퍼센트
            timestamp: parseInt(memoryUsage.timestamp)
          };
        }
      }
      
      // JavaScript 폴백 (RSS 기반)
      return this.getMemoryInfoJS();
      
    } catch (error) {
      errorLog('메모리 정보 가져오기 중 Error:', error);
      return this.getMemoryInfoJS();
    }
  }

  /**
   * JavaScript 폴백 메모리 정보 (RSS 기반)
   */
  private getMemoryInfoJS(): MemoryInfo {
    const os = require('os');
    const memUsage = process.memoryUsage();
    
    // 시스템 메모리 정보
    const systemTotalMemory = os.totalmem();
    const systemFreeMemory = os.freemem();
    
    // RSS 기반 계산 (OS 모니터와 일치)
    const rssMB = Math.round(memUsage.rss / (1024 * 1024));
    const totalMemoryMB = Math.round(systemTotalMemory / (1024 * 1024));
    const freeMemoryMB = Math.round(systemFreeMemory / (1024 * 1024));
    const memoryUsagePercent = Math.round((memUsage.rss / systemTotalMemory) * 100);
    
    return {
      totalMemoryMB: totalMemoryMB,
      freeMemoryMB: freeMemoryMB,
      usedMemoryMB: rssMB, // RSS를 실제 사용 메모리로 사용
      availableMemoryMB: freeMemoryMB,
      processMemoryMB: rssMB,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      percentUsed: memoryUsagePercent, // RSS 기반 퍼센트
      timestamp: Date.now()
    };
  }

  /**
 * 메모리 최적화 실행
 */
  async optimizeMemory(): Promise<MemoryOptimizationResult> {
    const startTime = Date.now();
    
    try {
      debugLog('메모리 최적화 시작');
      
      // 최적화 간격 체크 (너무 자주 실행 방지)
      const minOptimizeInterval = 10000; // 10초
      if (Date.now() - this.lastOptimizationTime < minOptimizeInterval) {
        debugLog('최적화 간격 미충족, 건너뛰기');
        return {
          freedBytes: 0,
          durationMs: 0,
          method: 'skipped',
          success: false
        };
      }
      
      let freedBytes = 0;
      let method = 'javascript';
      
      // NAPI 네이티브 모듈 최적화 시도
      const isAvailable = await nativeClient.isAvailable();
      
      if (isAvailable) {
        try {
          // 네이티브 모듈에는 직접적인 메모리 최적화 함수가 없으므로
          // 메모리 모니터링 리셋을 통해 간접적으로 최적화 효과 달성
          const beforeUsage = await nativeClient.getMemoryUsage();
          
          if (global.gc) {
            global.gc();
          }
          
          const resetResult = await nativeClient.resetMemoryMonitoring();
          const afterUsage = await nativeClient.getMemoryUsage();
          
          if (resetResult && beforeUsage && afterUsage) {
            const beforeBytes = parseInt(beforeUsage.heapUsed);
            const afterBytes = parseInt(afterUsage.heapUsed);
            freedBytes = Math.max(0, beforeBytes - afterBytes);
            method = 'native';
            debugLog('네이티브 메모리 최적화 Completed, 해제된 메모리:', freedBytes);
          }
        } catch (nativeError) {
          debugLog('네이티브 메모리 최적화 Failed, JavaScript 폴백 사용:', nativeError);
        }
      }
      
      // JavaScript 폴백 최적화
      if (freedBytes === 0) {
        freedBytes = await this.optimizeMemoryJS();
        method = 'javascript';
      }
      
      const durationMs = Date.now() - startTime;
      this.lastOptimizationTime = Date.now();
      
      debugLog('메모리 최적화 Completed: ${freedBytes} bytes 해제, ${durationMs}ms 소요');
      
      return {
        freedBytes,
        durationMs,
        method,
        success: true
      };
      
    } catch (error) {
      errorLog('메모리 최적화 중 Error:', error);
      return {
        freedBytes: 0,
        durationMs: Date.now() - startTime,
        method: 'error',
        success: false,
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * JavaScript 메모리 최적화
   */
  private async optimizeMemoryJS(): Promise<number> {
    try {
      const beforeMemory = process.memoryUsage();
      
      // 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
      }
      
      // 버퍼 Cleanup
      if (global.Buffer) {
        // 버퍼 풀 Cleanup (Node.js 내부)
      }
      
      const afterMemory = process.memoryUsage();
      const freedBytes = beforeMemory.heapUsed - afterMemory.heapUsed;
      
      debugLog('JavaScript 메모리 최적화: ${freedBytes} bytes 해제');
      return Math.max(0, freedBytes);
      
    } catch (error) {
      errorLog('JavaScript 메모리 최적화 중 Error:', error);
      return 0;
    }
  }

  /**
 * 메모리 Setup 업데이트
 */
  async updateSettings(newSettings: Partial<MemorySettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      // 체크 간격이 변경된 경우 모니터링 재시작
      if (newSettings.checkInterval) {
        this.startMemoryMonitoring();
      }
      
      debugLog('메모리 Setup 업데이트 Completed');
    } catch (error) {
      errorLog('메모리 Setup 업데이트 중 Error:', error);
    }
  }

  /**
 * 메모리 풀 정보 가져오기
 */
  getMemoryPools(): MemoryPool[] {
    return Array.from(this.memoryPools.values());
  }

  /**
 * 메모리 히스토리 가져오기
 */
  getMemoryHistory(): MemoryInfo[] {
    return [...this.memoryHistory];
  }

  /**
 * Setup 가져오기
 */
  getSettings(): MemorySettings {
    return { ...this.settings };
  }

  /**
 * 초기화 상태 확인
 */
  isMemoryManagerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
 * Cleanup 작업
 */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    debugLog('메모리 관리자 Cleanup Completed');
  }
}

// 전역 메모리 관리자 인스턴스
let memoryManager: AdvancedMemoryManager | null = null;

/**
 * 메모리 관리자 인스턴스 가져오기
 */
export function getMemoryManager(): AdvancedMemoryManager {
  if (!memoryManager) {
    memoryManager = new AdvancedMemoryManager();
  }
  return memoryManager;
}

/**
 * 메모리 관리자 Setup
 */
export async function setupMemoryManager(): Promise<void> {
  const manager = getMemoryManager();
  await manager.initialize();
}

/**
 * 메모리 정보 가져오기
 */
export async function getMemoryInfo(): Promise<MemoryInfo> {
  const manager = getMemoryManager();
  return await manager.getMemoryInfo();
}

/**
 * 메모리 최적화 실행
 */
export async function optimizeMemory(): Promise<MemoryOptimizationResult> {
  const manager = getMemoryManager();
  return await manager.optimizeMemory();
}

/**
 * 메모리 Setup 업데이트
 */
export async function updateMemorySettings(settings: Partial<MemorySettings>): Promise<void> {
  const manager = getMemoryManager();
  await manager.updateSettings(settings);
}

/**
 * 메모리 풀 정보 가져오기
 */
export function getMemoryPools(): MemoryPool[] {
  const manager = getMemoryManager();
  return manager.getMemoryPools();
}

/**
 * 메모리 필요 시 최적화 확인
 */
export async function checkAndOptimizeMemoryIfNeeded(): Promise<void> {
  const manager = getMemoryManager();
  const memoryInfo = await manager.getMemoryInfo();
  
  if (memoryInfo.percentUsed > 80) {
    debugLog('메모리 사용률 높음, 최적화 실행');
    await manager.optimizeMemory();
  }
}

/**
 * IPC 핸들러 등록 (memory-ipc.ts로 이동됨)
 * 중복 방지를 위해 주석 처리
 */
export function registerMemoryIpcHandlers(): void {
  debugLog('메모리 관련 IPC 핸들러는 memory-ipc.ts에서 관리됩니다');
  // 실제 핸들러 등록은 memory-ipc.ts에서 수행됨
}

/**
 * IPC 핸들러 Cleanup (memory-ipc.ts로 이동됨)
 * 중복 방지를 위해 주석 처리
 */
export function cleanupMemoryIpcHandlers(): void {
  debugLog('메모리 관련 IPC 핸들러 Cleanup는 memory-ipc.ts에서 관리됩니다');
  // 실제 핸들러 Cleanup는 memory-ipc.ts에서 수행됨
}

export default memoryManager;
