/**
 * 앱 충돌 보고 및 로깅 모듈
 *
 * 앱의 예상치 못한 종료, 오류, 충돌을 감지하고 보고하는 시스템입니다.
 * 오류 로깅, 충돌 보고서 수집, 복구 메커니즘을 제공합니다.
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
    context?: any;
    recoverable?: boolean;
}
/**
 * 충돌 보고 시스템 초기화
 */
export declare function initializeCrashReporter(crashOptions?: CrashReporterOptions): boolean;
/**
 * 충돌 보고서 정보 조회
 */
export declare function getCrashReportInfo(): any;
/**
 * 업로드 설정 변경
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
 * 수동 오류 보고
 */
export declare function reportError(message: string, stack?: string, severity?: ErrorInfo['severity'], context?: any): void;
export {};
//# sourceMappingURL=crash-reporter.d.ts.map