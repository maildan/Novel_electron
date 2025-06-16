/**
 * Loop 6 공유 유틸리티
 * 
 * 메인 프로세스와 렌더러 프로세스에서 공통으로 사용되는 유틸리티 함수들
 */

import * as fs from 'fs';
import * as path from 'path';

// 로깅 레벨 정의
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 개발 모드 확인
export const isDev = process.env.NODE_ENV === 'development';

// 로그 파일 경로 (메인 프로세스에서만 사용)
let logDir: string | null = null;

try {
  // Electron이 로드된 경우에만 로그 디렉토리 Setup
  if (typeof require !== 'undefined') {
    try {
      const { app } = require('electron');
      if (app && app.getPath) {
        logDir = path.join(app.getPath('userData'), 'logs');
      }
    } catch {
      // Electron이 없는 환경에서는 로그 디렉토리를 Setup하지 않음
    }
  }
} catch {
  // Error 무시
}

/**
 * 디버그 로그 출력
 */
export function debugLog(...args: any[]): void {
  if (isDev) {
    const timestamp = new Date().toISOString();
    console.log('[DEBUG ${timestamp}]', ...args);
    
    // 파일 로깅 (메인 프로세스에서만)
    if (logDir) {
      writeLogToFile('debug', args);
    }
  }
}

/**
 * 정보 로그 출력
 */
export function infoLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.info(`[INFO ${timestamp}]`, ...args);
  
  // 파일 로깅 (메인 프로세스에서만)
  if (logDir) {
    writeLogToFile('info', args);
  }
}

/**
 * Warning 로그 출력
 */
export function warnLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.warn('[WARN ${timestamp}]', ...args);
  
  // 파일 로깅 (메인 프로세스에서만)
  if (logDir) {
    writeLogToFile('warn', args);
  }
}

/**
 * 에러 로그 출력
 */
export function errorLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.error('[ERROR ${timestamp}]', ...args);
  
  // 파일 로깅 (메인 프로세스에서만)
  if (logDir) {
    writeLogToFile('error', args);
  }
}

/**
 * 파일에 로그 작성 (메인 프로세스에서만)
 */
function writeLogToFile(level: LogLevel, args: any[]): void {
  if (!logDir) return;
  
  try {
    // 로그 디렉토리 생성
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${level.toUpperCase()} ${timestamp}] ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}\n`;
    
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry, 'utf-8');
  } catch (error) {
    // 로그 파일 작성 Failed 시 콘솔에만 출력
    console.error('Failed to write log to file:', error);
  }
}

/**
 * 안전한 JSON 파싱
 */
export function safeJSONParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * 안전한 JSON 문자열화
 */
export function safeJSONStringify(obj: any, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch {
    return '{}';
  }
}

/**
 * 딜레이 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 객체 깊은 복사
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const cloned = {} as T;
  Object.keys(obj).forEach(key => {
    (cloned as any)[key] = deepClone((obj as any)[key]);
  });
  
  return cloned;
}

/**
 * 안전한 파일 존재 확인
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * 안전한 디렉토리 생성
 */
export function ensureDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 메모리 사용량 포맷팅
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 현재 타임스탬프 반환
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * 타임스탬프를 읽기 쉬운 형태로 변환
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * 플랫폼 확인
 */
export const platform = {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  current: process.platform
};

/**
 * 버전 비교
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}
