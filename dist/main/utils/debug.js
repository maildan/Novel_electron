"use strict";
/**
 * Loop 6 디버그 유틸리티
 *
 * 디버깅과 로깅을 위한 유틸리티 함수들
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDev = void 0;
exports.debugLog = debugLog;
exports.infoLog = infoLog;
exports.warnLog = warnLog;
exports.errorLog = errorLog;
exports.startPerformanceTimer = startPerformanceTimer;
exports.logMemoryUsage = logMemoryUsage;
exports.debugLogIf = debugLogIf;
exports.dumpObject = dumpObject;
exports.logStackTrace = logStackTrace;
// 개발 환경 확인
exports.isDev = process.env.NODE_ENV === 'development';
/**
 * 디버그 로그 출력
 */
function debugLog(...args) {
    if (exports.isDev) {
        console.log('[DEBUG]', ...args);
    }
}
/**
 * 정보 로그 출력
 */
function infoLog(...args) {
    console.info('[INFO]', ...args);
}
/**
 * 경고 로그 출력
 */
function warnLog(...args) {
    console.warn('[WARN]', ...args);
}
/**
 * 에러 로그 출력
 */
function errorLog(...args) {
    console.error('[ERROR]', ...args);
}
/**
 * 성능 측정 시작
 */
function startPerformanceTimer(label) {
    const start = performance.now();
    return () => {
        const elapsed = performance.now() - start;
        debugLog(`Performance [${label}]: ${elapsed.toFixed(2)}ms`);
        return elapsed;
    };
}
/**
 * 메모리 사용량 로깅
 */
function logMemoryUsage(label) {
    try {
        const usage = process.memoryUsage();
        const message = label ? `Memory usage [${label}]:` : 'Memory usage:';
        debugLog(message, {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
        });
    }
    catch (error) {
        debugLog('Failed to get memory usage:', error);
    }
}
/**
 * 조건부 디버그 로그
 */
function debugLogIf(condition, ...args) {
    if (condition && exports.isDev) {
        debugLog(...args);
    }
}
/**
 * 객체 덤프 (디버그용)
 */
function dumpObject(obj, label) {
    if (exports.isDev) {
        const prefix = label ? `[${label}]` : '[Object dump]';
        debugLog(prefix, JSON.stringify(obj, null, 2));
    }
}
/**
 * 스택 트레이스 출력
 */
function logStackTrace(label) {
    if (exports.isDev) {
        const error = new Error();
        const stack = error.stack?.split('\n').slice(2).join('\n');
        debugLog(label ? `Stack trace [${label}]:` : 'Stack trace:', stack);
    }
}
//# sourceMappingURL=debug.js.map