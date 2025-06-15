"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const config_1 = require("./config");
class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.dbPath = path.join(electron_1.app.getPath('userData'), 'loop.db');
    }
    /**
   * 데이터베이스 초기화
   */
    async initialize() {
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
            this.db = new better_sqlite3_1.default(this.dbPath, {
                verbose: config_1.AppConfig.isDev ? console.log : undefined,
            });
            // WAL 모드 활성화 (성능 향상)
            this.db.pragma('journal_mode = WAL');
            // 캐시 크기 Setup
            this.db.pragma('cache_size = -16000'); // 16MB
            // 테이블 생성
            this.createTables();
            this.isInitialized = true;
            console.log('[DB] 데이터베이스 초기화 Completed:', this.dbPath);
        }
        catch (error) {
            console.error('[DB] 데이터베이스 초기화 Failed:', error);
            throw error;
        }
    }
    /**
   * 테이블 생성
   */
    createTables() {
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
    async saveTypingSession(data) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const stmt = this.db.prepare(`
        INSERT INTO sessions (startTime, endTime, duration)
        VALUES (?, ?, ?)
      `);
            stmt.run(data.startTime?.toISOString() || new Date().toISOString(), data.endTime?.toISOString(), data.duration);
        }
        catch (error) {
            console.error('[DB] 타이핑 세션 저장 Failed:', error);
            throw error;
        }
    }
    /**
   * 키스트로크 데이터 저장
   */
    async saveKeystroke(data) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const stmt = this.db.prepare(`
        INSERT INTO keystrokes (timestamp, key, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(data.timestamp.toISOString(), data.key, data.windowTitle, data.appName);
        }
        catch (error) {
            console.error('[DB] 키스트로크 저장 Failed:', error);
            throw error;
        }
    }
    /**
   * 시스템 메트릭 저장
   */
    async saveSystemMetric(data) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const stmt = this.db.prepare(`
        INSERT INTO system_metrics (timestamp, cpuUsage, memoryUsage, gpuUsage)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(data.timestamp.toISOString(), data.cpuUsage, data.memoryUsage, data.gpuUsage);
        }
        catch (error) {
            console.error('[DB] 시스템 메트릭 저장 Failed:', error);
            throw error;
        }
    }
    /**
   * 최근 타이핑 세션 조회
   */
    async getRecentTypingSessions(limit = 100) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const stmt = this.db.prepare(`
        SELECT * FROM sessions 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
            return stmt.all(limit);
        }
        catch (error) {
            console.error('[DB] 타이핑 세션 조회 Failed:', error);
            return [];
        }
    }
    /**
   * 통계 데이터 조회
   */
    async getStatistics(days = 7) {
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
            const totalSessionsResult = totalSessionsStmt.get(startDate.toISOString());
            const totalSessions = totalSessionsResult?.count || 0;
            const totalKeystrokesStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM keystrokes 
        WHERE timestamp >= ?
      `);
            const totalKeystrokesResult = totalKeystrokesStmt.get(startDate.toISOString());
            const totalKeystrokes = totalKeystrokesResult?.count || 0;
            return {
                totalSessions,
                averageWpm: 0, // TODO: Calculate from typing data
                averageAccuracy: 0, // TODO: Calculate from typing data
                totalKeystrokes,
            };
        }
        catch (error) {
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
    async cleanup() {
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
        }
        catch (error) {
            console.error('[DB] 데이터베이스 Cleanup Failed:', error);
        }
    }
    /**
   * 연결 종료
   */
    async disconnect() {
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
    async saveKeystrokes(keystrokes) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다.');
        }
        try {
            const stmt = this.db.prepare(`
        INSERT INTO keystrokes (key, timestamp, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);
            const transaction = this.db.transaction((keystrokes) => {
                for (const keystroke of keystrokes) {
                    stmt.run(keystroke.key, new Date(keystroke.timestamp).toISOString(), keystroke.windowTitle || 'Unknown', keystroke.appName || 'Unknown');
                }
            });
            transaction(keystrokes);
            console.log('[DB] 키스트로크 데이터 ${keystrokes.length}개 저장 Completed');
        }
        catch (error) {
            console.error('[DB] 키스트로크 데이터 저장 Failed:', error);
            throw error;
        }
    }
    /**
   * 헬스 체크
   */
    async healthCheck() {
        try {
            if (!this.db) {
                return false;
            }
            // 간단한 쿼리로 데이터베이스 상태 확인
            const result = this.db.prepare('SELECT 1').get();
            return result !== undefined;
        }
        catch {
            return false;
        }
    }
    /**
   * 데이터 내보내기
   */
    async exportData(options = {}) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const { format = 'json', tables = ['sessions', 'keystrokes', 'system_metrics'] } = options;
            const exportData = {};
            for (const table of tables) {
                const stmt = this.db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1000`);
                exportData[table] = stmt.all();
            }
            if (format === 'json') {
                return JSON.stringify(exportData, null, 2);
            }
            else if (format === 'csv') {
                // CSV 형식으로 변환 (간단한 구현)
                const csv = {};
                for (const [tableName, data] of Object.entries(exportData)) {
                    if (data.length > 0) {
                        const headers = Object.keys(data[0]).join(',');
                        const rows = data.map(row => Object.values(row).join(',')).join('\n');
                        csv[tableName] = `${headers}\n${rows}`;
                    }
                }
                return csv;
            }
            return exportData;
        }
        catch (error) {
            console.error('[DB] 데이터 내보내기 Failed:', error);
            throw error;
        }
    }
    /**
   * 데이터 가져오기
   */
    async importData(filePath) {
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
                    const stmt = this.db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`);
                    const transaction = this.db.transaction((records) => {
                        for (const record of records) {
                            stmt.run(...columns.map(col => record[col]));
                        }
                    });
                    transaction(records);
                }
            }
            console.log('[DB] 데이터 가져오기 Completed');
        }
        catch (error) {
            console.error('[DB] 데이터 가져오기 Failed:', error);
            throw error;
        }
    }
    /**
     * 연결 종료 (close 메서드 별칭)
     */
    async close() {
        await this.disconnect();
    }
    /**
     * 타이핑 로그 저장 (IPC용)
     */
    async saveTypingLog(logData) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            // 로그 데이터를 keystrokes 테이블에 저장
            const stmt = this.db.prepare(`
        INSERT INTO keystrokes (timestamp, key, windowTitle, appName)
        VALUES (?, ?, ?, ?)
      `);
            const result = stmt.run(logData.timestamp ? new Date(logData.timestamp).toISOString() : new Date().toISOString(), logData.key || logData.char || '', logData.windowTitle || logData.window || '', logData.appName || logData.app || '');
            return {
                success: true,
                id: result.lastInsertRowid
            };
        }
        catch (error) {
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
    async getStats(params = {}) {
        if (!this.db) {
            throw new Error('데이터베이스가 초기화되지 않았습니다');
        }
        try {
            const { days = 7, type = 'all', startDate, endDate } = params;
            const stats = {};
            // 날짜 범위 Setup
            let dateFilter = '';
            let dateParams = [];
            if (startDate && endDate) {
                dateFilter = 'WHERE timestamp BETWEEN ? AND ?';
                dateParams = [startDate, endDate];
            }
            else if (days) {
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
                const totalResult = totalKeystrokesStmt.get(...dateParams);
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
                const sessionResult = sessionsStmt.get(...dateParams.map(p => dateFilter.includes('startTime') ? p : p));
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
                const systemResult = systemStmt.get(...dateParams);
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
            return {
                success: true,
                data: stats,
                generatedAt: new Date().toISOString(),
                params: { days, type, startDate, endDate }
            };
        }
        catch (error) {
            console.error('[DB] 통계 조회 Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.DatabaseManager = DatabaseManager;
//# sourceMappingURL=database.js.map