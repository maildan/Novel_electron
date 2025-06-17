import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { AppConfig } from './config';
import { 
  DatabaseRecord, 
  SessionRecord, 
  KeystrokeRecord, 
  SystemMetricRecord,
  ExportData,
  ExportOptions,
  DatabaseExportResult,
  DatabaseImportOptions,
  DatabaseImportResult,
  BackupMetadata
} from '../types/database';

interface KeystrokeData {
  id?: number;
  timestamp: Date | number;
  key: string;
  keyCode?: number;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  windowTitle?: string;
  appName?: string;
}

interface TypingSession {
  id?: number;
  timestamp: Date;
  keyCount: number;
  typingTime: number;
  windowTitle?: string;
  browserName?: string;
  accuracy?: number;
  wpm?: number;
}

interface SystemMetric {
  id?: number;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
}

interface TypingLogData {
  keyCount: number;
  typingTime: number;
  windowTitle?: string;
  window?: string;
  browserName?: string;
  appName?: string;
  app?: string;
  accuracy?: number;
  timestamp?: string | Date;
  key?: string;
  char?: string;
}

interface StatsParams {
  days?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  appName?: string;
}

interface DatabaseStats {
  success: boolean;
  totalSessions: number;
  totalKeystrokes: number;
  averageWpm?: number;
  averageAccuracy?: number;
  topApps?: Array<{ appName: string; count: number }>;
  dailyStats?: Array<{ date: string; keystrokes: number; sessions: number }>;
  error?: string;
}

export class DatabaseManager {
  private db: Database.Database | null = null;
  private isInitialized = false;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'loop.db');
  }

  /**
 * 데이터베이스 초기화
 */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 데이터베이스 디렉토리 생성
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // SQLite 데이터베이스 초기화
      this.db = new Database(this.dbPath, {
        verbose: AppConfig.isDev ? console.log : undefined,
      });

      // WAL 모드 활성화 (성능 향상)
      this.db.pragma('journal_mode = WAL');
      
      // 캐시 크기 Setup
      this.db.pragma('cache_size = -16000'); // 16MB

      // 테이블 생성
      this.createTables();

      this.isInitialized = true;
      console.log('[DB] 데이터베이스 초기화 Completed:', this.dbPath);
    } catch (error) {
      console.error('[DB] 데이터베이스 초기화 Failed:', error);
      throw error;
    }
  }

  /**
 * 테이블 생성
 */
  private createTables(): void {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    // 키스트로크 데이터 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS keystrokes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        key TEXT NOT NULL,
        windowTitle TEXT,
        appName TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 타이핑 세션 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startTime DATETIME NOT NULL,
        endTime DATETIME,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 시스템 메트릭 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        cpuUsage REAL NOT NULL,
        memoryUsage REAL NOT NULL,
        gpuUsage REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_keystrokes_timestamp ON keystrokes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_startTime ON sessions(startTime);
      CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
    `);

    console.log('[DB] 테이블 생성 Completed');
  }

  /**
 * 타이핑 세션 저장
 */
  async saveTypingSession(data: {
    duration?: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<void> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (startTime, endTime, duration)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(
        data.startTime?.toISOString() || new Date().toISOString(),
        data.endTime?.toISOString(),
        data.duration
      );
    } catch (error) {
      console.error('[DB] 타이핑 세션 저장 Failed:', error);
      throw error;
    }
  }

  /**
 * 키스트로크 데이터 저장
 */
  async saveKeystroke(data: KeystrokeData): Promise<void> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO keystrokes (timestamp, key, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        (data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp)).toISOString(),
        data.key,
        data.windowTitle,
        data.appName
      );
    } catch (error) {
      console.error('[DB] 키스트로크 저장 Failed:', error);
      throw error;
    }
  }

  /**
 * 시스템 메트릭 저장
 */
  async saveSystemMetric(data: SystemMetric): Promise<void> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO system_metrics (timestamp, cpuUsage, memoryUsage, gpuUsage)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        data.timestamp.toISOString(),
        data.cpuUsage,
        data.memoryUsage,
        data.gpuUsage
      );
    } catch (error) {
      console.error('[DB] 시스템 메트릭 저장 Failed:', error);
      throw error;
    }
  }

  /**
 * 최근 타이핑 세션 조회
 */
  async getRecentTypingSessions(limit = 100): Promise<TypingSession[]> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM sessions 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      
      return stmt.all(limit) as TypingSession[];
    } catch (error) {
      console.error('[DB] 타이핑 세션 조회 Failed:', error);
      return [];
    }
  }

  /**
 * 통계 데이터 조회
 */
  async getStatistics(days = 7): Promise<{
    totalSessions: number;
    averageWpm: number;
    averageAccuracy: number;
    totalKeystrokes: number;
  }> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const totalSessionsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE created_at >= ?
      `);
      const totalSessionsResult = totalSessionsStmt.get(startDate.toISOString()) as { count: number } | undefined;
      const totalSessions = totalSessionsResult?.count || 0;

      const totalKeystrokesStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM keystrokes 
        WHERE timestamp >= ?
      `);
      const totalKeystrokesResult = totalKeystrokesStmt.get(startDate.toISOString()) as { count: number } | undefined;
      const totalKeystrokes = totalKeystrokesResult?.count || 0;

      return {
        totalSessions,
        averageWpm: 0, // TODO: Calculate from typing data
        averageAccuracy: 0, // TODO: Calculate from typing data
        totalKeystrokes,
      };
    } catch (error) {
      console.error('[DB] 통계 조회 Failed:', error);
      return {
        totalSessions: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        totalKeystrokes: 0,
      };
    }
  }

  /**
 * 데이터베이스 Cleanup
 */
  async cleanup(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 30일 이전 시스템 메트릭 삭제
      const cleanupMetricsStmt = this.db.prepare(`
        DELETE FROM system_metrics 
        WHERE timestamp < ?
      `);
      cleanupMetricsStmt.run(thirtyDaysAgo.toISOString());

      // 90일 이전 세션 데이터 삭제
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const cleanupSessionsStmt = this.db.prepare(`
        DELETE FROM sessions 
        WHERE created_at < ?
      `);
      cleanupSessionsStmt.run(ninetyDaysAgo.toISOString());

      // 키스트로크 데이터는 7일만 보관
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const cleanupKeystrokesStmt = this.db.prepare(`
        DELETE FROM keystrokes 
        WHERE timestamp < ?
      `);
      cleanupKeystrokesStmt.run(sevenDaysAgo.toISOString());

      console.log('[DB] 데이터베이스 Cleanup Completed');
    } catch (error) {
      console.error('[DB] 데이터베이스 Cleanup Failed:', error);
    }
  }

  /**
 * 연결 종료
 */
  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[DB] 데이터베이스 연결 종료');
    }
  }

  /**
   * 키스트로크 데이터 저장 (배치)
   */
  async saveKeystrokes(keystrokes: Array<{
    key: string;
    timestamp: number;
    keyCode: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    appName?: string;
    windowTitle?: string;
  }>): Promise<void> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO keystrokes (key, timestamp, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);

      const transaction = this.db.transaction((keystrokes: KeystrokeData[]) => {
        for (const keystroke of keystrokes) {
          stmt.run(
            keystroke.key,
            (keystroke.timestamp instanceof Date ? keystroke.timestamp : new Date(keystroke.timestamp)).toISOString(),
            keystroke.windowTitle || 'Unknown',
            keystroke.appName || 'Unknown'
          );
        }
      });

      transaction(keystrokes);

      console.log('[DB] 키스트로크 데이터 ${keystrokes.length}개 저장 Completed');
    } catch (error) {
      console.error('[DB] 키스트로크 데이터 저장 Failed:', error);
      throw error;
    }
  }

  /**
 * 헬스 체크
 */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }

      // 간단한 쿼리로 데이터베이스 상태 확인
      const result = this.db.prepare('SELECT 1').get();
      return result !== undefined;
    } catch {
      return false;
    }
  }  /**
   * 데이터 내보내기
   */
  async exportData(options: ExportOptions = {}): Promise<DatabaseExportResult> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const { format = 'json', tables = ['sessions', 'keystrokes', 'system_metrics'] } = options;
      const exportData: ExportData = {};

      for (const table of tables) {
        const stmt = this.db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1000`);
        exportData[table] = stmt.all();
      }

      const timestamp = new Date().toISOString();

      if (format === 'json') {
        return {
          data: JSON.stringify(exportData, null, 2),
          format: 'json',
          timestamp,
          tables
        };
      } else if (format === 'csv') {
        // CSV 형식으로 변환 (간단한 구현)
        const csvData: Record<string, string> = {};
        for (const [tableName, data] of Object.entries(exportData)) {
          if (data.length > 0) {
            const firstRow = data[0] as Record<string, unknown>;
            const headers = Object.keys(firstRow).join(',');
            const rows = data.map(row => 
              Object.values(row as Record<string, unknown>).join(',')
            ).join('\n');
            csvData[tableName] = `${headers}\n${rows}`;
          }
        }
        return {
          data: JSON.stringify(csvData, null, 2),
          format: 'csv',
          timestamp,
          tables
        };
      }

      return {
        data: JSON.stringify(exportData, null, 2),
        format: 'json',
        timestamp,
        tables
      };
    } catch (error) {
      console.error('[DB] 데이터 내보내기 Failed:', error);
      throw error;
    }
  }

  /**
 * 데이터 가져오기
 */
  async importData(filePath: string): Promise<void> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // 각 테이블별로 데이터 가져오기
      for (const [tableName, records] of Object.entries(data)) {
        if (Array.isArray(records) && records.length > 0) {
          const columns = Object.keys(records[0]);
          const placeholders = columns.map(() => '?').join(',');
          const stmt = this.db.prepare(
            `INSERT OR REPLACE INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`
          );

          const transaction = this.db.transaction((records: Record<string, unknown>[]) => {
            for (const record of records) {
              stmt.run(...columns.map(col => record[col]));
            }
          });

          transaction(records);
        }
      }

      console.log('[DB] 데이터 가져오기 Completed');
    } catch (error) {
      console.error('[DB] 데이터 가져오기 Failed:', error);
      throw error;
    }
  }

  /**
   * 연결 종료 (close 메서드 별칭)
   */
  async close(): Promise<void> {
    await this.disconnect();
  }

  /**
   * 타이핑 로그 저장 (IPC용)
   */
  async saveTypingLog(logData: TypingLogData): Promise<{ success: boolean; id?: number; error?: string }> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      // 로그 데이터를 keystrokes 테이블에 저장
      const stmt = this.db.prepare(`
        INSERT INTO keystrokes (timestamp, key, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        logData.timestamp ? new Date(logData.timestamp).toISOString() : new Date().toISOString(),
        logData.key || logData.char || '',
        logData.windowTitle || logData.window || '',
        logData.appName || logData.app || ''
      );

      return {
        success: true,
        id: result.lastInsertRowid as number
      };
    } catch (error) {
      console.error('[DB] 타이핑 로그 저장 Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 통계 데이터 조회 (IPC용)
   */
  async getStats(params: StatsParams = {}): Promise<DatabaseStats | { success: false; error: string }> {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    try {
      const { 
        days = 7, 
        type = 'all',
        startDate,
        endDate 
      } = params;

      const stats: Record<string, unknown> & { success: boolean; totalSessions: number; totalKeystrokes: number } = { 
        success: true, 
        totalSessions: 0, 
        totalKeystrokes: 0 
      };

      // 날짜 범위 Setup
      let dateFilter = '';
      let dateParams: (string | number)[] = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE timestamp BETWEEN ? AND ?';
        dateParams = [startDate, endDate];
      } else if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        dateFilter = 'WHERE timestamp >= ?';
        dateParams = [since.toISOString()];
      }

      // 키스트로크 통계
      if (type === 'all' || type === 'keystrokes') {
        const keystrokeStmt = this.db.prepare(`
          SELECT 
            COUNT(*) as totalKeystrokes,
            COUNT(DISTINCT appName) as uniqueApps,
            DATE(timestamp) as date,
            COUNT(*) as dailyCount
          FROM keystrokes 
          ${dateFilter}
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
        `);
        
        stats.keystrokes = keystrokeStmt.all(...dateParams);
        
        // 총 키스트로크 수
        const totalKeystrokesStmt = this.db.prepare(`
          SELECT COUNT(*) as total FROM keystrokes ${dateFilter}
        `);
        const totalResult = totalKeystrokesStmt.get(...dateParams) as { total: number } | undefined;
        stats.totalKeystrokes = totalResult?.total || 0;
      }

      // 세션 통계
      if (type === 'all' || type === 'sessions') {
        const sessionsStmt = this.db.prepare(`
          SELECT 
            COUNT(*) as totalSessions,
            AVG(duration) as avgDuration,
            MAX(duration) as maxDuration,
            MIN(duration) as minDuration
          FROM sessions 
          ${dateFilter.replace('timestamp', 'startTime')}
        `);
        
        const sessionResult = sessionsStmt.get(...dateParams.map(p => 
          dateFilter.includes('startTime') ? p : p
        )) as any;
        stats.sessions = sessionResult || {};
      }

      // 시스템 메트릭 통계
      if (type === 'all' || type === 'system') {
        const systemStmt = this.db.prepare(`
          SELECT 
            AVG(cpuUsage) as avgCpu,
            AVG(memoryUsage) as avgMemory,
            AVG(gpuUsage) as avgGpu,
            MAX(cpuUsage) as maxCpu,
            MAX(memoryUsage) as maxMemory
          FROM system_metrics 
          ${dateFilter}
        `);
        
        const systemResult = systemStmt.get(...dateParams) as any;
        stats.system = systemResult || {};
      }

      // 앱별 통계
      if (type === 'all' || type === 'apps') {
        const appStatsStmt = this.db.prepare(`
          SELECT 
            appName,
            COUNT(*) as keystrokeCount,
            COUNT(DISTINCT DATE(timestamp)) as activeDays
          FROM keystrokes 
          ${dateFilter}
          AND appName IS NOT NULL 
          AND appName != ''
          GROUP BY appName 
          ORDER BY keystrokeCount DESC 
          LIMIT 10
        `);
        
        stats.apps = appStatsStmt.all(...dateParams);
      }

      return stats as DatabaseStats;
    } catch (error) {
      console.error('[DB] 통계 조회 Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
