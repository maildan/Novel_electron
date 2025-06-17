/**
 * 데이터베이스 관련 타입 정의
 */

export interface DatabaseRecord {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionRecord extends DatabaseRecord {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalKeystrokes: number;
  totalTime: number;
  accuracy?: number;
  wpm?: number;
  metadata?: string;
}

export interface KeystrokeRecord extends DatabaseRecord {
  sessionId: string;
  timestamp: string;
  key: string;
  keyCode: number;
  isCorrect: boolean;
  timing: number;
  metadata?: string;
}

export interface SystemMetricRecord extends DatabaseRecord {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage?: number;
  networkActivity?: number;
  activeWindow?: string;
  metadata?: string;
}

export interface ExportData {
  [tableName: string]: unknown[];
}

export interface ExportOptions {
  format?: 'json' | 'csv';
  tables?: string[];
}

export interface DatabaseExportResult {
  data: string;
  format: 'json' | 'csv';
  timestamp: string;
  tables: string[];
}

export interface DatabaseImportOptions {
  format?: 'json' | 'csv';
  overwrite?: boolean;
  validate?: boolean;
}

export interface DatabaseImportResult {
  success: boolean;
  recordsImported: number;
  errors: string[];
  tables: string[];
}

export interface DatabaseStats {
  totalSessions: number;
  totalKeystrokes: number;
  totalMetrics: number;
  databaseSize: number;
  lastBackup?: string;
}

export interface BackupMetadata {
  version: string;
  timestamp: string;
  size: number;
  tables: string[];
  checksum?: string;
}
