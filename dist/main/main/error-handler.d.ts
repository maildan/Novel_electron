/**
 * error-handler.ts
 *
 * 전역 오류 처리 기능 제공
 * 애플리케이션에서 발생하는 예외를 잡아 사용자에게 알리고 로깅합니다.
 */
/**
 * 오류를 로그 파일에 기록
 */
declare function logErrorToFile(error: Error, context?: string): void;
/**
 * 사용자에게 오류 대화상자 표시
 */
declare function showErrorDialog(errorOrMessage: Error | string, title?: string, context?: string, fatal?: boolean): void;
/**
 * 네이티브 모듈 로딩 오류 처리
 */
declare function handleNativeModuleError(moduleName: string, error: Error, isCritical?: boolean): void;
/**
 * 글로벌 예외 핸들러 설정
 */
declare function setupGlobalErrorHandlers(): void;
export { logErrorToFile, showErrorDialog, handleNativeModuleError, setupGlobalErrorHandlers };
//# sourceMappingURL=error-handler.d.ts.map