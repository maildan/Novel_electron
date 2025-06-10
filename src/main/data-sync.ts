/**
 * 데이터 동기화 모듈 (TypeScript)
 * 
 * 기능:
 * - MongoDB와 Supabase 간의 데이터 동기화
 * - 타이핑 통계 실시간 전송 (3초마다)
 * - 주기적 데이터 백업 (1주일마다)
 * - 장애 복구 메커니즘
 */

import { debugLog } from './utils';

// 타입 정의
interface TypingLogData {
  _id?: string;
  idempotencyKey?: string;
  userId: string;
  sessionId: string;
  keyChar: string;
  timestamp: Date;
  browserName?: string;
  activeWindow?: string;
  queuedAt?: Date;
}

interface SyncStatus {
  lastMongoSync: Date | null;
  lastSupabaseSync: Date | null;
  pendingItemsCount: number;
  failedItems: FailedItem[];
  syncErrors: SyncError[];
  isFullSyncRunning: boolean;
  isConnected?: boolean;
  lastSync?: Date;
  pendingItems?: number;
  syncInProgress?: boolean;
  errors?: string[];
}

interface FailedItem {
  data: TypingLogData;
  error: string;
  timestamp: Date;
}

interface SyncError {
  timestamp: Date;
  service: 'mongodb' | 'supabase';
  error: string;
  itemsCount: number;
}

interface DatabaseClient {
  connectToMongoDB(): Promise<void>;
  setupHealthCheck(interval: number): void;
  startChangeStream(callback: (change: any) => Promise<void>): Promise<void>;
  saveBatchTypingLogs(batch: TypingLogData[]): Promise<{ insertedCount: number }>;
}

interface SupabaseClient {
  testConnection(): Promise<boolean>;
  saveBatchTypingLogs(batch: TypingLogData[]): Promise<{ success: boolean; insertedCount?: number; error?: string }>;
  scheduleETL(fetchFunction: () => Promise<any[]>, intervalHours: number): any;
}

// 상태 변수
class DataSyncManager {
  private dataQueue: TypingLogData[] = [];
  private isProcessingQueue = false;
  private lastSyncTime: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private fullSyncTimeout: NodeJS.Timeout | null = null;
  private pendingQueue: TypingLogData[] = [];
  private failedQueue: TypingLogData[] = [];
  private syncErrors: string[] = [];
  private syncInProgress = false;
  private config: any = {};
  
  private syncStatus: SyncStatus = {
    lastMongoSync: null,
    lastSupabaseSync: null,
    pendingItemsCount: 0,
    failedItems: [],
    syncErrors: [],
    isFullSyncRunning: false
  };

  // 클라이언트는 나중에 의존성 주입으로 설정
  private mongoClient: DatabaseClient | null = null;
  private supabaseClient: SupabaseClient | null = null;

  /**
   * 모듈 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      debugLog('데이터 동기화 모듈 초기화 중...');
      
      // 데이터베이스 클라이언트 로드 (동적 import)
      try {
        // const { default: mongoClient } = await import('../lib/mongodb');
        // const { default: supabaseClient } = await import('../lib/supabase');
        
        // 임시로 null 설정 (추후 실제 클라이언트로 교체)
        this.mongoClient = null;
        this.supabaseClient = null;
      } catch (error) {
        debugLog('데이터베이스 클라이언트 로드 실패, 폴백 모드로 전환:', error);
        return false;
      }

      if (!this.mongoClient || !this.supabaseClient) {
        debugLog('데이터베이스 클라이언트가 없어 폴백 모드로 실행');
        return true; // 폴백 모드로 실행
      }
      
      // MongoDB 연결 초기화
      await (this.mongoClient as DatabaseClient).connectToMongoDB();
      
      // MongoDB 상태 모니터링 설정
      (this.mongoClient as DatabaseClient).setupHealthCheck(30000); // 30초마다 연결 확인
      
      // Supabase 연결 테스트
      const supabaseConnected = await (this.supabaseClient as SupabaseClient).testConnection();
      if (!supabaseConnected) {
        debugLog('Supabase 연결 실패, 재시도 예정');
      }
      
      // 실시간 데이터 전송 시작 (3초마다)
      this.startRealTimeSync();
      
      // 주기적 전체 동기화 (1주일마다)
      this.scheduleFullSync();
      
      debugLog('데이터 동기화 모듈 초기화 완료');
      return true;
    } catch (error) {
      console.error('데이터 동기화 모듈 초기화 오류:', error);
      return false;
    }
  }

  /**
   * 실시간 데이터 전송 시작
   */
  private startRealTimeSync(): void {
    debugLog('실시간 데이터 전송 시작 (3초 간격)');
    
    // 3초마다 대기열 처리
    this.syncInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('대기열 처리 오류:', error);
      });
    }, 3000);
    
    // MongoDB Change Stream 모니터링 시작
    if (this.mongoClient) {
      (this.mongoClient as DatabaseClient).startChangeStream(async (change) => {
        if (change.operationType === 'insert' || change.operationType === 'update') {
          // 새 문서를 대기열에 추가
          const document = change.fullDocument as TypingLogData;
          this.addToQueue(document);
        }
      }).catch(error => {
        console.error('MongoDB Change Stream 모니터링 오류:', error);
      });
    }
  }

  /**
   * 타이핑 로그 데이터를 대기열에 추가
   */
  addToQueue(data: TypingLogData): void {
    // 대기열에 이미 동일한 idempotencyKey를 가진 항목이 있는지 확인
    const existingIndex = this.dataQueue.findIndex(item => 
      item.idempotencyKey && item.idempotencyKey === data.idempotencyKey
    );
    
    if (existingIndex >= 0) {
      // 기존 항목 업데이트
      this.dataQueue[existingIndex] = { ...data, queuedAt: new Date() };
      debugLog(`기존 대기열 항목 업데이트: ${data.idempotencyKey || data._id}`);
    } else {
      // 새 항목 추가
      this.dataQueue.push({ ...data, queuedAt: new Date() });
      this.syncStatus.pendingItemsCount = this.dataQueue.length;
      debugLog(`대기열에 항목 추가됨, 현재 크기: ${this.dataQueue.length}`);
    }
  }

  /**
   * 대기열 처리
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.dataQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    debugLog(`대기열 처리 시작, ${this.dataQueue.length}개 항목`);
    
    try {
      // 현재 대기열의 일부만 처리 (배치 크기 제한)
      const BATCH_SIZE = 50;
      const batch = this.dataQueue.slice(0, BATCH_SIZE);
      
      // MongoDB에 저장 (로컬 로그도 MongoDB에 저장)
      if (batch.length > 0 && this.mongoClient && this.supabaseClient) {
        try {
          // 배치 저장
          const mongoResult = await (this.mongoClient as DatabaseClient).saveBatchTypingLogs(batch);
          debugLog(`MongoDB 배치 저장 완료: ${mongoResult.insertedCount}개 항목`);
          
          this.syncStatus.lastMongoSync = new Date();
          
          // Supabase에도 저장 (장기 보존용)
          try {
            const supabaseResult = await (this.supabaseClient as SupabaseClient).saveBatchTypingLogs(batch);
            
            if (supabaseResult.success) {
              debugLog(`Supabase 배치 저장 완료: ${supabaseResult.insertedCount}개 항목`);
              this.syncStatus.lastSupabaseSync = new Date();
              
              // 성공적으로 처리된 항목 대기열에서 제거
              this.dataQueue = this.dataQueue.slice(BATCH_SIZE);
              this.syncStatus.pendingItemsCount = this.dataQueue.length;
            } else {
              throw new Error(supabaseResult.error);
            }
          } catch (supabaseError) {
            console.error('Supabase 저장 오류:', supabaseError);
            // MongoDB에는 저장되었으므로 다음 주기적 동기화에서 처리됨
            
            // 오류 정보 기록
            this.syncStatus.syncErrors.push({
              timestamp: new Date(),
              service: 'supabase',
              error: String(supabaseError),
              itemsCount: batch.length
            });
          }
        } catch (mongoError) {
          console.error('MongoDB 저장 오류:', mongoError);
          
          // 오류 정보 기록
          this.syncStatus.syncErrors.push({
            timestamp: new Date(),
            service: 'mongodb',
            error: String(mongoError),
            itemsCount: batch.length
          });
          
          // 실패한 항목 추적 (나중에 재시도)
          this.syncStatus.failedItems.push(...batch.map(item => ({
            data: item,
            error: String(mongoError),
            timestamp: new Date()
          })));
        }
      }
    } catch (error) {
      console.error('대기열 처리 중 오류:', error);
    } finally {
      this.isProcessingQueue = false;
      this.lastSyncTime = new Date();
    }
  }

  /**
   * 주기적 전체 동기화 (1주일마다)
   */
  private scheduleFullSync(): void {
    debugLog('주기적 전체 동기화 예약 (1주일 간격)');
    
    if (!this.supabaseClient) return;
    
    // Supabase 모듈의 ETL 스케줄러 사용
    const etlScheduler = (this.supabaseClient as SupabaseClient).scheduleETL(this.fetchAllMongoData.bind(this), 168); // 168시간 = 1주일
    
    // 초기 동기화 수행 (5분 후)
    this.fullSyncTimeout = setTimeout(() => {
      debugLog('초기 전체 동기화 시작');
      etlScheduler.runNow().catch((error: Error) => {
        console.error('초기 전체 동기화 오류:', error);
      });
    }, 5 * 60 * 1000); // 5분
  }

  /**
   * MongoDB의 모든 데이터 가져오기
   */
  private async fetchAllMongoData(): Promise<TypingLogData[]> {
    if (!this.mongoClient) {
      throw new Error('MongoDB 클라이언트가 초기화되지 않음');
    }
    
    // 실제 구현은 MongoDB 클라이언트에 위임
    debugLog('MongoDB 전체 데이터 가져오기 시작');
    // return await this.mongoClient.getAllTypingLogs();
    return []; // 임시 반환
  }

  /**
   * 현재 동기화 상태 반환
   */
  async getStatus(): Promise<SyncStatus> {
    return {
      lastMongoSync: this.syncStatus.lastMongoSync,
      lastSupabaseSync: this.syncStatus.lastSupabaseSync,
      pendingItemsCount: this.pendingQueue.length,
      failedItems: this.syncStatus.failedItems,
      syncErrors: this.syncStatus.syncErrors,
      isFullSyncRunning: this.syncInProgress,
      isConnected: this.isConnected(),
      lastSync: this.lastSyncTime || new Date(),
      pendingItems: this.pendingQueue.length,
      syncInProgress: this.syncInProgress,
      errors: this.syncErrors
    };
  }

  /**
   * 수동 동기화 실행
   */
  async syncNow(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.performFullSync();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.syncErrors.push(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 동기화 설정 업데이트
   */
  async updateConfig(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      // 설정 업데이트 로직
      this.config = { ...this.config, ...config };
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 실패한 항목 재시도
   */
  async retryFailedItems(): Promise<{ success: boolean; error?: string }> {
    try {
      // 실패한 항목들을 다시 큐에 추가
      const failedItems = this.failedQueue.splice(0);
      this.pendingQueue.push(...failedItems);
      
      if (failedItems.length > 0) {
        await this.processPendingQueue();
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 모듈 재시작
   */
  async restart(): Promise<void> {
    this.stop();
    await this.initialize();
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.mongoClient !== null && this.supabaseClient !== null;
  }

  /**
   * 동기화 상태 조회
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * 수동 동기화 실행
   */
  async manualSync(): Promise<boolean> {
    try {
      await this.processQueue();
      return true;
    } catch (error) {
      console.error('수동 동기화 오류:', error);
      return false;
    }
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.fullSyncTimeout) {
      clearTimeout(this.fullSyncTimeout);
      this.fullSyncTimeout = null;
    }
    
    debugLog('데이터 동기화 모듈 정리 완료');
  }

  /**
   * 연결 상태 확인
   */
  private isConnected(): boolean {
    return this.mongoClient !== null && this.supabaseClient !== null;
  }

  /**
   * 전체 동기화 실행
   */
  private async performFullSync(): Promise<void> {
    this.syncInProgress = true;
    try {
      await this.processQueue();
      this.lastSyncTime = new Date();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 대기열 처리 (별칭)
   */
  private async processPendingQueue(): Promise<void> {
    return this.processQueue();
  }

  /**
   * 동기화 중지
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.fullSyncTimeout) {
      clearTimeout(this.fullSyncTimeout);
      this.fullSyncTimeout = null;
    }
  }
}

// 싱글톤 인스턴스
const dataSyncManager = new DataSyncManager();

export default dataSyncManager;
export type { TypingLogData, SyncStatus };
export { DataSyncManager };
