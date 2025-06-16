/**
 * file-handler.ts
 *
 * 파일 핸들링 기능 제공
 * TODO: 구체적인 파일 처리 로직 구현 필요
 */
/**
 * 파일 선택 대화상자 표시
 */
export declare function showOpenDialog(options?: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
/**
 * 파일 저장 대화상자 표시
 */
export declare function showSaveDialog(options?: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
/**
 * 파일 읽기
 */
export declare function readFile(filePath: string): Promise<Buffer>;
/**
 * 파일 쓰기
 */
export declare function writeFile(filePath: string, data: string | Buffer): Promise<void>;
/**
 * 앱 데이터 디렉토리에서의 상대 경로 해결
 */
export declare function resolveAppDataPath(relativePath: string): string;
/**
 * 안전한 파일 경로 검증
 */
export declare function validateFilePath(filePath: string): boolean;
//# sourceMappingURL=file-handler.d.ts.map