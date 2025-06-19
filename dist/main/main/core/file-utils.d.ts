/**
 * Core File Utilities
 *
 * 파일 처리와 관련된 모든 기능을 통합하여 중복을 제거한 유틸리티
 *
 * @features
 * - 안전한 파일 경로 처리
 * - 파일 유효성 검증
 * - 보안 검사
 * - 에러 처리
 * - 로깅 통합
 */
export interface FileValidationResult {
    isValid: boolean;
    error?: string;
    securityViolation?: boolean;
}
export interface SecurityConfig {
    maxFileSize: number;
    allowedExtensions: string[];
    allowedDirectories: string[];
    strictMode: boolean;
}
export interface FileOperationResult<T = string | Buffer> {
    success: boolean;
    data?: T;
    error?: string;
}
declare let securityConfig: SecurityConfig;
/**
 * 앱 데이터 디렉토리에서의 상대 경로 해결
 */
export declare function resolveAppDataPath(relativePath: string): string;
/**
 * 파일 경로를 프로토콜 URL로 변환
 */
export declare function filePathToProtocolUrl(filePath: string, protocol?: string): string;
/**
 * 프로토콜 URL을 파일 경로로 변환
 */
export declare function protocolUrlToFilePath(protocolUrl: string, protocol?: string): string;
/**
 * 종합적인 파일 경로 검증
 */
export declare function validateFilePath(filePath: string): FileValidationResult;
/**
 * 안전한 파일 읽기
 */
export declare function safeReadFile(filePath: string): Promise<FileOperationResult<Buffer>>;
/**
 * 안전한 파일 쓰기
 */
export declare function safeWriteFile(filePath: string, data: string | Buffer): Promise<FileOperationResult>;
/**
 * 파일 선택 대화상자 표시
 */
export declare function showOpenDialog(options?: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
/**
 * 파일 저장 대화상자 표시
 */
export declare function showSaveDialog(options?: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
/**
 * 보안 설정 업데이트
 */
export declare function updateSecurityConfig(config: Partial<SecurityConfig>): void;
/**
 * 허용된 확장자 추가
 */
export declare function addAllowedExtension(extension: string): void;
/**
 * 허용된 디렉토리 추가
 */
export declare function addAllowedDirectory(directory: string): void;
/**
 * 파일 확장자로부터 MIME 타입 조회
 */
export declare function getMimeType(filePath: string): string;
export { securityConfig as getSecurityConfig };
//# sourceMappingURL=file-utils.d.ts.map