/**
 * 타이핑 통계 계산을 위한 워커 스레드 (TypeScript 버전)
 * Node.js worker_threads API 사용
 * 네이티브 모듈을 최대한 활용하도록 최적화됨
 */
import { parentPort, workerData } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs';

// 한국어 디버깅 로그 함수
function debugLog(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logMessage = data 
    ? `[${timestamp}] [통계워커] ${message}: ${JSON.stringify(data)}`
    : `[${timestamp}] [통계워커] ${message}`;
  console.log(logMessage);
}

// 워커 메시지 타입 정의
interface WorkerMessage {
  type: string;
  id?: string;
  payload?: unknown;
  config?: {
    processingMode?: string;
  };
}

// 통계 데이터 타입 정의
interface StatsData {
  keystrokes?: number;
  timeMs?: number;
  correct?: number;
  total?: number;
}

// 통계 결과 타입 정의
interface StatsResult {
  wpm: number;
  accuracy: number;
  processingTime: number;
  timestamp: string;
  memoryUsage: number;
}

// 워커 메시지 타입 정의
interface WorkerMessage {
  type: string;
  id?: string;
  payload?: StatsData | { mode?: string } | unknown;
  config?: {
    processingMode?: string;
  };
}

// 초기 Setup값
const memoryLimit = workerData?.memoryLimit || 100 * 1024 * 1024; // 100MB
let processingMode = workerData?.initialMode || 'normal'; // 'normal', 'cpu-intensive', 'gpu-intensive'
let shouldOptimizeMemory = false;
let dataCache: Record<string, unknown> | null = null;
let lastHeapSize = 0;
let gcCounter = 0;

// 네이티브 모듈 인터페이스 정의
interface NativeModule {
  calculateAdvancedStats?: (data: unknown) => unknown;
  getPerformanceMetrics?: () => unknown;
  get_memory_info?: () => unknown;
  calculate_wpm?: (keystrokes: number, timeMs: number) => number;
  calculate_accuracy?: (correct: number, total: number) => number;
  [key: string]: unknown; // 동적 속성 허용
}

// 네이티브 모듈 로드
let nativeModule: NativeModule | null = null;

try {
  // 여러 경로에서 모듈 탐색
  const possiblePaths = [
    path.resolve(__dirname, '../../../native-modules'),
    path.resolve(__dirname, '../../../native-modules/index.js'),
    path.resolve(__dirname, '../../../../native-modules'),
    path.resolve(__dirname, '../../../../native-modules/index.js')
  ];

  let moduleLoaded = false;
  for (const modulePath of possiblePaths) {
    if (fs.existsSync(modulePath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        nativeModule = require(modulePath) as NativeModule;
        debugLog('네이티브 모듈 로드 Success', { path: modulePath });
        moduleLoaded = true;
        break;
      } catch (err: unknown) {
        debugLog('네이티브 모듈 로드 Failed', { 
          path: modulePath, 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }
  }
  
  // 모듈 로드 Failed 시 폴백 구현
  if (!moduleLoaded) {
    debugLog('폴백 구현 사용 중');
    nativeModule = {
      get_memory_info: function() {
        const memoryUsage = process.memoryUsage();
        return JSON.stringify({
          heap_used: memoryUsage.heapUsed,
          heap_total: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        });
      },
      calculate_wpm: function(keystrokes: number, timeMs: number) {
        if (timeMs <= 0) return 0;
        const minutes = timeMs / (1000 * 60);
        const wordsPerMinute = (keystrokes / 5) / minutes;
        return Math.round(wordsPerMinute);
      },
      calculate_accuracy: function(correct: number, total: number) {
        if (total <= 0) return 100;
        return Math.round((correct / total) * 100);
      }
    };
  }
} catch (error: unknown) {
  debugLog('네이티브 모듈 초기화 Error', { 
    error: error instanceof Error ? error.message : String(error) 
  });
  nativeModule = null;
}

// 캐시 관리 함수
function getCachedData(key: string): unknown {
  return dataCache?.[key] || null;
}

function setCachedData(key: string, value: unknown): void {
  if (!dataCache) {
    dataCache = {};
  }
  dataCache[key] = value;
  
  // 캐시 크기 제한 (10개 항목으로 제한)
  const keys = Object.keys(dataCache);
  if (keys.length > 10) {
    const oldestKey = keys[0];
    delete dataCache[oldestKey];
  }
}

// 메모리 모니터링 함수
function checkMemoryUsage(): void {
  const memInfo = process.memoryUsage();
  const currentHeapSize = memInfo.heapUsed;
  
  if (currentHeapSize > memoryLimit) {
    shouldOptimizeMemory = true;
    debugLog('메모리 한계 초과, 최적화 모드 활성화', { 
      current: currentHeapSize, 
      limit: memoryLimit 
    });
  }
  
  // 메모리 증가율 체크
  if (lastHeapSize > 0) {
    const growthRate = (currentHeapSize - lastHeapSize) / lastHeapSize;
    if (growthRate > 0.1) { // 10% 이상 증가
      debugLog('메모리 급격한 증가 감지', { 
        growthRate: Math.round(growthRate * 100) + '%' 
      });
    }
  }
  
  lastHeapSize = currentHeapSize;
}

// 가비지 컬렉션 수행
function performGC(): void {
  if (global.gc) {
    global.gc();
    gcCounter++;
    debugLog('가비지 컬렉션 실행됨', { count: gcCounter });
  }
}

// 통계 계산 함수
function calculateStats(data: StatsData): StatsResult {
  try {
    checkMemoryUsage();
    
    const startTime = process.hrtime.bigint();
    
    // 입력 데이터 유효성 검사 및 기본값 설정
    const safeKeystrokes = typeof data.keystrokes === 'number' ? data.keystrokes : 0;
    const safeTimeMs = typeof data.timeMs === 'number' && data.timeMs > 0 ? data.timeMs : 1;
    const safeCorrect = typeof data.correct === 'number' ? data.correct : 0;
    const safeTotal = typeof data.total === 'number' && data.total > 0 ? data.total : 1;
    
    // 캐시 확인
    const cacheKey = `stats_${safeKeystrokes}_${safeTimeMs}_${safeCorrect}_${safeTotal}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      debugLog('캐시된 결과 반환');
      return cached as StatsResult;
    }
    
    // 네이티브 모듈 사용 시도
    if (nativeModule?.calculate_wpm && nativeModule?.calculate_accuracy) {
      try {
        const wpm = nativeModule.calculate_wpm(safeKeystrokes, safeTimeMs);
        const accuracy = nativeModule.calculate_accuracy(safeCorrect, safeTotal);
        
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000; // ms로 변환
        
        debugLog('네이티브 모듈로 통계 계산 Completed', { 
          wpm, 
          accuracy, 
          processingTime: `${processingTime.toFixed(2)}ms` 
        });
        
        const result: StatsResult = {
          wpm: Number(wpm),
          accuracy: Number(accuracy),
          processingTime,
          timestamp: new Date().toISOString(),
          memoryUsage: process.memoryUsage().heapUsed
        };
        
        // 결과 캐시에 저장
        setCachedData(cacheKey, result);
        return result;
      } catch (error: unknown) {
        debugLog('네이티브 모듈 계산 Error, 폴백 사용', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    // 폴백 계산 - 타입 안전하게 처리
    const fallbackTimeMs = Number(data.timeMs) || 1;
    const fallbackKeystrokes = Number(data.keystrokes) || 0;
    const fallbackCorrect = Number(data.correct) || 0;
    const fallbackTotal = Number(data.total) || 0;
    
    const timeMinutes = fallbackTimeMs / (1000 * 60);
    const wpm = Math.round((fallbackKeystrokes / 5) / timeMinutes);
    const accuracy = fallbackTotal > 0 ? Math.round((fallbackCorrect / fallbackTotal) * 100) : 100;
    
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime) / 1000000;
    
    debugLog('폴백 계산으로 통계 Completed', { 
      wpm, 
      accuracy, 
      processingTime: `${processingTime.toFixed(2)}ms` 
    });
    
    const result: StatsResult = {
      wpm,
      accuracy,
      processingTime,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage().heapUsed
    };
    
    // 결과 캐시에 저장
    setCachedData(cacheKey, result);
    return result;
    
  } catch (error: unknown) {
    debugLog('통계 계산 중 Error 발생', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

// 워커 메시지 처리
if (parentPort) {
  debugLog('통계 워커 Started', { workerData });
  
  parentPort.on('message', (data: WorkerMessage) => {
    try {
      // 메시지 타입 검증 강화
      if (!data || typeof data !== 'object') {
        debugLog('❌ 잘못된 메시지 형식', { data });
        parentPort?.postMessage({
          type: 'error',
          id: (data as { id?: string })?.id || 'unknown',
          error: '잘못된 메시지 형식입니다',
          success: false
        });
        return;
      }
      
      const message = data as WorkerMessage;
      
      if (!message.type || typeof message.type !== 'string') {
        debugLog('❌ 메시지 타입이 없거나 올바르지 않음', { data });
        parentPort?.postMessage({
          type: 'error',
          id: message.id || 'unknown',
          error: '메시지 타입이 필요합니다',
          success: false
        });
        return;
      }
      
      debugLog('✅ 메시지 수신됨', { 
        type: message.type, 
        id: message.id, 
        hasPayload: !!message.payload 
      });
      
      switch (message.type) {
        case 'initialize': {
          debugLog('🚀 워커 초기화 요청 받음', { config: message.config });
          if (message.config) {
            processingMode = message.config.processingMode || 'normal';
            // memoryLimit 업데이트 (필요시)
          }
          parentPort?.postMessage({
            type: 'initialized',
            id: message.id,
            status: {
              mode: processingMode,
              nativeModuleAvailable: !!nativeModule,
              memoryLimit: memoryLimit
            },
            success: true,
            timestamp: new Date().toISOString()
          });
          break;
        }
          
        case 'calculate-stats': {
          const result = calculateStats(data.payload || {});
          parentPort?.postMessage({
            type: 'stats-result',
            id: data.id,
            result,
            success: true
          });
          break;
        }
          
        case 'set-mode': {
          const modePayload = data.payload as { mode?: string } | undefined;
          processingMode = modePayload?.mode || 'normal';
          debugLog('🔧 처리 모드 변경됨', { mode: processingMode });
          parentPort?.postMessage({
            type: 'mode-changed',
            id: data.id,
            mode: processingMode,
            success: true
          });
          break;
        }
          
        case 'memory-cleanup': {
          if (shouldOptimizeMemory) {
            dataCache = null;
            performGC();
            shouldOptimizeMemory = false;
            debugLog('🧹 메모리 Cleanup Completed');
          }
          parentPort?.postMessage({
            type: 'cleanup-complete',
            id: data.id,
            success: true
          });
          break;
        }
          
        case 'status': {
          parentPort?.postMessage({
            type: 'status-response',
            id: data.id,
            status: {
              mode: processingMode,
              memoryUsage: process.memoryUsage(),
              nativeModuleAvailable: !!nativeModule,
              gcCount: gcCounter
            },
            success: true
          });
          break;
        }
          
        case 'shutdown':
        case 'terminate': {
          debugLog('🛑 워커 종료 요청 받음');
          parentPort?.postMessage({
            type: 'shutdown-acknowledged',
            id: data.id,
            success: true
          });
          process.exit(0);
          break; // 도달하지 않지만 ESLint 경고 방지
        }
          
        default: {
          debugLog('❓ 알 수 없는 메시지 타입', { 
            type: data.type,
            availableTypes: ['calculate-stats', 'set-mode', 'memory-cleanup', 'status', 'shutdown', 'terminate']
          });
          parentPort?.postMessage({
            type: 'error',
            id: data.id,
            error: `알 수 없는 메시지 타입: ${data.type}`,
            details: `사용 가능한 타입: calculate-stats, set-mode, memory-cleanup, status, shutdown, terminate`,
            success: false
          });
          break;
        }
      }
    } catch (error: unknown) {
      debugLog('💥 메시지 Processing Error', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messageType: data?.type 
      });
      parentPort?.postMessage({
        type: 'error',
        id: data?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
  });
  
  // 주기적 메모리 체크
  setInterval(() => {
    checkMemoryUsage();
    if (shouldOptimizeMemory) {
      performGC();
    }
  }, 30000); // 30초마다
  
  debugLog('통계 워커 초기화 Completed');
} else {
  debugLog('부모 포트가 없어 워커 종료');
  process.exit(1);
}
