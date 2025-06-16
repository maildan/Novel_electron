/**
 * Loop 6 공유 유틸리티
 *
 * 메인 프로세스와 렌더러 프로세스에서 공통으로 사용되는 유틸리티 함수들
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
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
 * 안전한 JSON 파싱
 */
export declare function safeJSONParse<T = any>(jsonString: string, fallback: T): T;
/**
 * 안전한 JSON 문자열화
 */
export declare function safeJSONStringify(obj: any, space?: number): string;
/**
 * 딜레이 함수
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 객체 깊은 복사
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 안전한 파일 존재 확인
 */
export declare function fileExists(filePath: string): boolean;
/**
 * 안전한 디렉토리 생성
 */
export declare function ensureDirectory(dirPath: string): boolean;
/**
 * 메모리 사용량 포맷팅
 */
export declare function formatBytes(bytes: number): string;
/**
 * 현재 타임스탬프 반환
 */
export declare function getCurrentTimestamp(): number;
/**
 * 타임스탬프를 읽기 쉬운 형태로 변환
 */
export declare function formatTimestamp(timestamp: number): string;
/**
 * 플랫폼 확인
 */
export declare const platform: {
    isWindows: boolean;
    isMac: boolean;
    isLinux: boolean;
    current: NodeJS.Platform;
};
/**
 * 버전 비교
 */
export declare function compareVersions(version1: string, version2: string): number;
//# sourceMappingURL=utils.d.ts.map