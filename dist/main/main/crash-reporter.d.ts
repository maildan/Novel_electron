/**
 * 앱 충돌 보고 및 로깅 모듈
 *
 * 앱의 예상치 못한 종료, Error, 충돌을 감지하고 보고하는 시스템입니다.
 * Error 로깅, 충돌 보고서 수집, 복구 메커니즘을 제공합니다.
 */
interface CrashReporterOptions {
    companyName?: string;
    submitURL?: string;
    uploadToServer?: boolean;
    extra?: Record<string, string>;
    enableDetailedReports?: boolean;
    maxLogFileSize?: number;
}
interface ErrorInfo {
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, unknown>;
    recoverable?: boolean;
}
/**
 * 충돌 보고 시스템 초기화
 */
export declare function initializeCrashReporter(crashOptions?: CrashReporterOptions): boolean;
/**
 * 충돌 보고서 정보 조회
 */
export declare function getCrashReportInfo(): Record<string, unknown>;
/**
 * 업로드 Setup 변경
 */
export declare function setUploadCrashReports(shouldUpload: boolean): void;
/**
 * 로그 파일 경로 조회
 */
export declare function getLogPaths(): {
    errorLog: string;
    crashLog: string;
};
/**
 * 수동 Error 보고
 */
export declare function reportError(message: string, stack?: string, severity?: ErrorInfo['severity'], context?: Record<string, unknown>): void;
export {};
//# sourceMappingURL=crash-reporter.d.ts.map