/**
 * Loop 6 디버그 유틸리티
 * 
 * 디버깅과 로깅을 위한 유틸리티 함수들
 */

// 개발 환경 확인
export const isDev = process.env.NODE_ENV === 'development';

/**
 * 디버그 로그 출력
 */
export function debugLog(...args: any[]): void {
  if (isDev) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * 정보 로그 출력
 */
export function infoLog(...args: any[]): void {
  console.info('[INFO]', ...args);
}

/**
 * 경고 로그 출력
 */
export function warnLog(...args: any[]): void {
  console.warn('[WARN]', ...args);
}

/**
 * 에러 로그 출력
 */
export function errorLog(...args: any[]): void {
  console.error('[ERROR]', ...args);
}

/**
 * 성능 측정 시작
 */
export function startPerformanceTimer(label: string): () => number {
  const start = performance.now();
  
  return (): number => {
    const elapsed = performance.now() - start;
    debugLog(`Performance [${label}]: ${elapsed.toFixed(2)}ms`);
    return elapsed;
  };
}

/**
 * 메모리 사용량 로깅
 */
export function logMemoryUsage(label?: string): void {
  try {
    const usage = process.memoryUsage();
    const message = label ? `Memory usage [${label}]:` : 'Memory usage:';
    
    debugLog(message, {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  } catch (error) {
    debugLog('Failed to get memory usage:', error);
  }
}

/**
 * 조건부 디버그 로그
 */
export function debugLogIf(condition: boolean, ...args: any[]): void {
  if (condition && isDev) {
    debugLog(...args);
  }
}

/**
 * 객체 덤프 (디버그용)
 */
export function dumpObject(obj: any, label?: string): void {
  if (isDev) {
    const prefix = label ? `[${label}]` : '[Object dump]';
    debugLog(prefix, JSON.stringify(obj, null, 2));
  }
}

/**
 * 스택 트레이스 출력
 */
export function logStackTrace(label?: string): void {
  if (isDev) {
    const error = new Error();
    const stack = error.stack?.split('\n').slice(2).join('\n');
    debugLog(label ? `Stack trace [${label}]:` : 'Stack trace:', stack);
  }
}
