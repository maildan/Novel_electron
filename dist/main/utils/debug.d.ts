/**
 * Loop 6 디버그 유틸리티
 *
 * 디버깅과 로깅을 위한 유틸리티 함수들
 */
export declare const isDev: boolean;
/**
 * 디버그 로그 출력
 */
export declare function debugLog(...args: any[]): void;
/**
 * 정보 로그 출력
 */
export declare function infoLog(...args: any[]): void;
/**
 * Warning 로그 출력
 */
export declare function warnLog(...args: any[]): void;
/**
 * 에러 로그 출력
 */
export declare function errorLog(...args: any[]): void;
/**
 * 성능 측정 시작
 */
export declare function startPerformanceTimer(_label: string): () => number;
/**
 * 메모리 사용량 로깅
 */
export declare function logMemoryUsage(label?: string): void;
/**
 * 조건부 디버그 로그
 */
export declare function debugLogIf(condition: boolean, ...args: any[]): void;
/**
 * 객체 덤프 (디버그용)
 */
export declare function dumpObject(obj: any, label?: string): void;
/**
 * 스택 트레이스 출력
 */
export declare function logStackTrace(label?: string): void;
//# sourceMappingURL=debug.d.ts.map