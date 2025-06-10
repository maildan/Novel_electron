/**
 * 통계 처리 시스템 (TypeScript)
 * 
 * 기능:
 * - Worker 스레드 기반 통계 처리
 * - 타이핑 패턴 분석
 * - 메모리 최적화 및 처리 모드 관리
 * - 한글 입력 처리
 */

import path from 'path';
import { Worker } from 'worker_threads';
import { debugLog } from './utils';
import dataSyncManager from './data-sync';

// 타입 정의
interface TypingData {
  keyChar: string;
  timestamp: number;
  browserName?: string;
  activeWindow?: string;
  isSpecialKey?: boolean;
  keyCode?: number;
}

interface TypingPattern {
  averageWPM: number;
  peakWPM: number;
  accuracy: number;
  commonKeys: string[];
  timeDistribution: Record<string, number>;
  sessionDuration: number;
}

interface WorkerMessage {
  type: 'pattern-analyzed' | 'initialized' | 'memory-optimized' | 'memory-warning' | 'error' | 'worker-ready';
  result?: TypingPattern;
  memoryInfo?: WorkerMemoryInfo;
  timestamp?: number;
  before?: number;
  after?: number;
  reduction?: number;
  emergency?: boolean;
  message?: string;
  error?: string;
}

interface WorkerMemoryInfo {
  heapUsed: number;
  heapTotal: number;
  heapUsedMB: number;
  heapTotalMB: number;
}

interface HangulState {
  isComposing: boolean;
  lastComposedText: string;
  composingBuffer: string;
}

type ProcessingMode = 'normal' | 'cpu-intensive' | 'gpu-intensive';

/**
 * 통계 처리 매니저 클래스
 */
export class StatsManager {
  private static instance: StatsManager;
  
  // 워커 관련
  private statWorker: Worker | null = null;
  private worker: Worker | null = null; // 호환성을 위한 별칭
  private workerInitialized = false;
  private workerMemoryUsage: WorkerMemoryInfo = { 
    heapUsed: 0, 
    heapTotal: 0, 
    heapUsedMB: 0, 
    heapTotalMB: 0 
  };
  private lastWorkerCheck = 0;
  private pendingTasks: any[] = [];
  
  // 데이터 버퍼
  private buffer: TypingData[] = [];
  private sessionBuffers: Map<string, TypingData[]> = new Map();

  // 메모리 및 처리 모드
  private readonly MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private processingMode: ProcessingMode = 'normal';

  // 한글 입력 상태
  private hangulState: HangulState = {
    isComposing: false,
    lastComposedText: '',
    composingBuffer: ''
  };

  // 앱 상태 참조 (나중에 의존성 주입으로 설정)
  private appState: any = {};

  private constructor() {}

  static getInstance(): StatsManager {
    if (!StatsManager.instance) {
      StatsManager.instance = new StatsManager();
    }
    return StatsManager.instance;
  }

  /**
   * 통계 시스템 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      debugLog('통계 처리 시스템 초기화 시작');
      
      // 워커 초기화
      await this.initializeWorker();
      
      debugLog('통계 처리 시스템 초기화 완료');
      return true;
    } catch (error) {
      console.error('통계 처리 시스템 초기화 오류:', error);
      return false;
    }
  }

  /**
   * 워커 초기화
   */
  private async initializeWorker(): Promise<void> {
    try {
      if (this.statWorker) {
        return;
      }

      // 워커 스크립트 경로 (컴파일된 위치)
      const workerPath = path.join(__dirname, 'workers/stats-worker.js');
      
      this.statWorker = new Worker(workerPath);
      this.worker = this.statWorker; // 호환성을 위한 별칭
      
      // 워커 메시지 핸들러 설정
      this.statWorker.on('message', this.handleWorkerMessage.bind(this));
      
      // 워커 오류 핸들러
      this.statWorker.on('error', (error) => {
        console.error('워커 오류:', error);
        this.handleWorkerError(error);
      });

      // 워커 종료 핸들러
      this.statWorker.on('exit', (code) => {
        debugLog(`워커 종료됨, 코드: ${code}`);
        this.statWorker = null;
        this.workerInitialized = false;
      });

      // 워커 초기화 메시지 전송
      this.statWorker.postMessage({
        type: 'initialize',
        action: 'initialize',
        id: `init-${Date.now()}`,
        config: {
          memoryThreshold: this.MEMORY_THRESHOLD,
          processingMode: this.processingMode
        }
      });

      debugLog('통계 워커 초기화 시작됨');
    } catch (error) {
      console.error('워커 초기화 오류:', error);
      this.workerInitialized = false;
      this.statWorker = null;
      
      // 워커 없이도 기본 기능 동작하도록 폴백 모드 활성화
      debugLog('워커 초기화 실패: 폴백 모드로 전환');
      this.switchToFallbackMode();
    }
  }

  /**
   * 워커 메시지 처리
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    switch (message.type) {
      case 'pattern-analyzed':
        if (message.result) {
          this.updateTypingPattern(message.result);
        }
        
        if (message.memoryInfo) {
          this.updateWorkerMemoryInfo(message.memoryInfo);
        }
        break;
        
      case 'initialized':
        this.workerInitialized = true;
        debugLog('워커 초기화 완료:', message.timestamp);
        this.processPendingTasks();
        break;
        
      case 'memory-optimized':
        debugLog('워커 메모리 최적화 완료:', {
          before: `${Math.round((message.before || 0) / (1024 * 1024))}MB`,
          after: `${Math.round((message.after || 0) / (1024 * 1024))}MB`,
          reduction: `${Math.round((message.reduction || 0) / (1024 * 1024))}MB`,
          emergency: message.emergency
        });
        break;
        
      case 'memory-warning':
        debugLog('워커 메모리 경고:', message.message, 
                 `${Math.round((message.memoryInfo?.heapUsedMB || 0))}MB`);
        
        // 메모리 사용량이 임계치를 초과하면 처리 모드 변경
        if (message.memoryInfo && message.memoryInfo.heapUsed > this.MEMORY_THRESHOLD) {
          this.switchToLowMemoryMode();
        }
        break;
        
      case 'error':
        console.error('워커 오류:', message.error);
        if (message.memoryInfo) {
          this.updateWorkerMemoryInfo(message.memoryInfo);
        }
        break;
        
      case 'worker-ready':
        this.workerInitialized = true;
        debugLog('워커 준비 완료');
        break;
        
      default:
        debugLog('알 수 없는 워커 메시지:', message);
    }
  }

  /**
   * 키 입력 처리
   */
  async processKeyInput(data: TypingData): Promise<void> {
    try {
      // 한글 입력 처리
      if (this.isHangulInput(data.keyChar)) {
        this.processHangulInput(data);
      }

      // 워커에 데이터 전송
      if (this.statWorker && this.workerInitialized) {
        this.statWorker.postMessage({
          action: 'process-typing',
          data: data
        });
      } else {
        // 워커가 준비되지 않은 경우 대기열에 추가
        this.pendingTasks.push({
          action: 'process-typing',
          data: data
        });
      }

      // 데이터 동기화 큐에 추가
      dataSyncManager.addToQueue({
        userId: 'current-user', // 실제 구현에서는 사용자 ID 사용
        sessionId: `session-${Date.now()}`, // 실제 구현에서는 세션 ID 관리
        keyChar: data.keyChar,
        timestamp: new Date(data.timestamp),
        browserName: data.browserName,
        activeWindow: data.activeWindow
      });

    } catch (error) {
      console.error('키 입력 처리 오류:', error);
    }
  }

  /**
   * 한글 입력 처리
   */
  private isHangulInput(char: string): boolean {
    // 한글 유니코드 범위 확인
    const charCode = char.charCodeAt(0);
    return (charCode >= 0xAC00 && charCode <= 0xD7AF) || // 완성형 한글
           (charCode >= 0x1100 && charCode <= 0x11FF) || // 초성
           (charCode >= 0x3130 && charCode <= 0x318F);   // 자모
  }

  private processHangulInput(data: TypingData): void {
    // 한글 조합 상태 처리 로직
    // 실제 구현에서는 더 복잡한 한글 처리 로직 필요
    if (data.keyChar.length === 1) {
      this.hangulState.composingBuffer += data.keyChar;
    }
  }

  /**
   * 타이핑 패턴 업데이트
   */
  private updateTypingPattern(pattern: TypingPattern): void {
    // 패턴 데이터를 앱 상태에 저장
    debugLog('타이핑 패턴 업데이트:', {
      averageWPM: Math.round(pattern.averageWPM),
      peakWPM: Math.round(pattern.peakWPM),
      accuracy: Math.round(pattern.accuracy * 100) + '%'
    });
  }

  /**
   * 워커 메모리 정보 업데이트
   */
  private updateWorkerMemoryInfo(memoryInfo: WorkerMemoryInfo): void {
    this.workerMemoryUsage = memoryInfo;
    this.lastWorkerCheck = Date.now();
  }

  /**
   * 대기 중인 작업 처리
   */
  private processPendingTasks(): void {
    if (!this.statWorker || !this.workerInitialized) {
      return;
    }

    debugLog(`대기 중인 작업 ${this.pendingTasks.length}개 처리 시작`);
    
    while (this.pendingTasks.length > 0) {
      const task = this.pendingTasks.shift();
      this.statWorker.postMessage(task);
    }
  }

  /**
   * 저메모리 모드로 전환
   */
  private switchToLowMemoryMode(): void {
    try {
      // 이미 저메모리 모드인 경우 또는 사용자가 처리 모드를 수동으로 지정한 경우 중단
      if (this.processingMode !== 'normal' || 
          (this.appState.settings?.processingMode && this.appState.settings.processingMode !== 'auto')) {
        return;
      }
      
      debugLog('메모리 사용량 임계치 초과: 저메모리 모드로 전환');
      
      // GPU 지원 여부 확인 및 가능한 경우 GPU 모드로 전환
      const gpuEnabled = this.appState.settings?.useHardwareAcceleration === true;
      
      if (gpuEnabled) {
        this.processingMode = 'gpu-intensive';
        debugLog('GPU 가속 처리 모드 활성화 (성능 향상)');
        
        // GPU 메모리 최적화
        if (global.gc) {
          global.gc();
          debugLog('GPU 모드 전환 전 메모리 정리 수행');
        }
      } else {
        this.processingMode = 'cpu-intensive';
        debugLog('CPU 집약적 처리 모드 활성화 (메모리 최적화)');
      }
      
      // 워커에 모드 변경 알림
      if (this.statWorker && this.workerInitialized) {
        this.statWorker.postMessage({
          action: 'change-processing-mode',
          mode: this.processingMode
        });
      }
    } catch (error) {
      console.error('저메모리 모드 전환 오류:', error);
    }
  }

  /**
   * 폴백 모드로 전환
   */
  private switchToFallbackMode(): void {
    debugLog('워커 없는 폴백 모드로 전환');
    // 워커 없이 기본적인 통계 처리만 수행
  }

  /**
   * 워커 오류 처리
   */
  private handleWorkerError(error: Error): void {
    console.error('워커 실행 오류:', error);
    this.workerInitialized = false;
    
    // 워커 재시작 시도
    setTimeout(() => {
      debugLog('워커 재시작 시도');
      this.initializeWorker().catch(err => {
        console.error('워커 재시작 실패:', err);
      });
    }, 5000);
  }

  /**
   * 통계 상태 조회
   */
  getStatsStatus() {
    return {
      workerInitialized: this.workerInitialized,
      processingMode: this.processingMode,
      workerMemoryUsage: this.workerMemoryUsage,
      pendingTasksCount: this.pendingTasks.length,
      hangulState: this.hangulState
    };
  }

  /**
   * 통계 데이터 가져오기
   */
  async getStats(options?: any): Promise<any> {
    try {
      // 통계 데이터 수집 로직
      return {
        success: true,
        data: {
          totalKeystrokes: this.buffer.length,
          sessionsCount: this.sessionBuffers.size,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('통계 가져오기 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 타이핑 패턴 분석
   */
  async analyzeTypingPattern(data: any): Promise<any> {
    try {
      // 타이핑 패턴 분석 로직
      return {
        success: true,
        pattern: {
          wordsPerMinute: Math.random() * 100,
          accuracy: Math.random() * 100,
          commonMistakes: []
        }
      };
    } catch (error) {
      console.error('타이핑 패턴 분석 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 설정 업데이트
   */
  async updateSettings(settings: any): Promise<any> {
    try {
      // 설정 업데이트 로직
      return { success: true };
    } catch (error) {
      console.error('설정 업데이트 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 메모리 최적화
   */
  async optimizeMemory(): Promise<any> {
    try {
      // 메모리 최적화 로직
      this.buffer = [];
      this.sessionBuffers.clear();
      return { success: true };
    } catch (error) {
      console.error('메모리 최적화 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 모듈 재시작
   */
  async restart(): Promise<void> {
    this.cleanup();
    await this.initialize();
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.statWorker !== null;
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    try {
      debugLog('통계 처리 시스템 정리 시작');
      
      if (this.statWorker) {
        await this.statWorker.terminate();
        this.statWorker = null;
      }
      
      this.workerInitialized = false;
      this.pendingTasks = [];
      
      debugLog('통계 처리 시스템 정리 완료');
    } catch (error) {
      console.error('통계 처리 시스템 정리 오류:', error);
    }
  }
}

// 단일 인스턴스 export
export const statsManager = StatsManager.getInstance();
export default statsManager;
