/**
 * 클립보드 감시 모듈
 *
 * 시스템 클립보드 내용의 변경을 실시간으로 감시하고 관리합니다.
 * 텍스트, 이미지, HTML 등 다양한 형태의 클립보드 데이터를 지원합니다.
 */
interface ClipboardContent {
    text?: string;
    html?: string;
    image?: Electron.NativeImage;
    timestamp: number;
    source: 'internal' | 'external';
}
interface ClipboardWatcherOptions {
    interval?: number;
    enableHistory?: boolean;
    maxHistorySize?: number;
    watchTypes?: ('text' | 'image' | 'html')[];
}
interface ClipboardStats {
    totalChanges: number;
    internalCopies: number;
    externalChanges: number;
    lastChangeTime: number | null;
    watchingEnabled: boolean;
    currentInterval: number;
}
/**
 * 클립보드 감시 초기화
 */
export declare function initializeClipboardWatcher(options?: ClipboardWatcherOptions): void;
/**
 * 클립보드 감시 간격 Setup
 */
export declare function setWatchInterval(intervalMs: number): boolean;
/**
 * 클립보드 감시 시작
 */
export declare function startWatching(callback?: (content: ClipboardContent) => void): void;
/**
 * 클립보드 감시 중지
 */
export declare function stopWatching(): void;
/**
 * 텍스트를 클립보드로 복사
 */
export declare function copyTextToClipboard(text: string): boolean;
/**
 * HTML을 클립보드로 복사
 */
export declare function copyHtmlToClipboard(html: string, text?: string): boolean;
/**
 * 이미지를 클립보드로 복사
 */
export declare function copyImageToClipboard(imageData: string | Buffer | Electron.NativeImage): boolean;
/**
 * 클립보드에서 텍스트 읽기
 */
export declare function readTextFromClipboard(): string;
/**
 * 클립보드에서 HTML 읽기
 */
export declare function readHtmlFromClipboard(): string;
/**
 * 클립보드에서 이미지 읽기
 */
export declare function readImageFromClipboard(): Electron.NativeImage | null;
/**
 * 클립보드 히스토리 조회
 */
export declare function getClipboardHistory(limit?: number): ClipboardContent[];
/**
 * 클립보드 히스토리 삭제
 */
export declare function clearClipboardHistory(): void;
/**
 * 클립보드 통계 조회
 */
export declare function getClipboardStats(): ClipboardStats;
/**
 * 클립보드를 파일로 저장
 */
export declare function saveClipboardToFile(filePath: string, type?: 'text' | 'html' | 'image'): Promise<boolean>;
export {};
//# sourceMappingURL=clipboard-watcher.d.ts.map