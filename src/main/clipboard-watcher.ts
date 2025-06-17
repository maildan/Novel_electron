/**
 * 클립보드 감시 모듈
 * 
 * 시스템 클립보드 내용의 변경을 실시간으로 감시하고 관리합니다.
 * 텍스트, 이미지, HTML 등 다양한 형태의 클립보드 데이터를 지원합니다.
 */

import { clipboard, ipcMain, BrowserWindow, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Path 모듈 사용 확인
console.log('[ClipboardWatcher] Path 모듈 로드됨:', typeof path);

// 타입 정의
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

// 상수
const DEFAULT_WATCH_INTERVAL = 500;
const MIN_WATCH_INTERVAL = 100;
const MAX_WATCH_INTERVAL = 5000;
const MAX_HISTORY_SIZE = 100;
const SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'];

// 지원 이미지 포맷 확인
console.log('[ClipboardWatcher] 지원 이미지 포맷:', SUPPORTED_IMAGE_FORMATS.join(', '));

// 내부 상태
let lastClipboardContent: ClipboardContent | null = null;
let internalCopyPending = false;
let isWatchingEnabled = false;
let watchInterval = DEFAULT_WATCH_INTERVAL;
let clipboardTimer: NodeJS.Timeout | null = null;
let changeCallback: ((content: ClipboardContent) => void) | undefined = undefined;
const clipboardHistory: ClipboardContent[] = [];
let watcherOptions: ClipboardWatcherOptions = {
  interval: DEFAULT_WATCH_INTERVAL,
  enableHistory: true,
  maxHistorySize: MAX_HISTORY_SIZE,
  watchTypes: ['text', 'image', 'html']
};

// 통계
const clipboardStats: ClipboardStats = {
  totalChanges: 0,
  internalCopies: 0,
  externalChanges: 0,
  lastChangeTime: null,
  watchingEnabled: false,
  currentInterval: DEFAULT_WATCH_INTERVAL
};

/**
 * 클립보드 감시 초기화
 */
export function initializeClipboardWatcher(options: ClipboardWatcherOptions = {}): void {
  try {
    watcherOptions = {
      ...watcherOptions,
      ...options
    };

    if (watcherOptions.interval) {
      setWatchInterval(watcherOptions.interval);
    }

    // 초기 클립보드 내용 읽기
    lastClipboardContent = readCurrentClipboardContent();

    // IPC 핸들러 Setup
    setupClipboardIpcHandlers();

    console.log('클립보드 감시 시스템이 초기화되었습니다.');

  } catch (error) {
    console.error('클립보드 감시 초기화 Error:', error);
  }
}

/**
 * 현재 클립보드 내용 읽기
 */
function readCurrentClipboardContent(): ClipboardContent {
  const content: ClipboardContent = {
    timestamp: Date.now(),
    source: 'external'
  };

  try {
    // 텍스트 읽기
    if (watcherOptions.watchTypes?.includes('text')) {
      const text = clipboard.readText();
      if (text) {
        content.text = text;
      }
    }

    // HTML 읽기
    if (watcherOptions.watchTypes?.includes('html')) {
      const html = clipboard.readHTML();
      if (html) {
        content.html = html;
      }
    }

    // 이미지 읽기
    if (watcherOptions.watchTypes?.includes('image')) {
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        content.image = image;
      }
    }

  } catch (error) {
    console.error('클립보드 내용 읽기 Error:', error);
  }

  return content;
}

/**
 * 클립보드 내용 비교
 */
function isContentChanged(current: ClipboardContent, previous: ClipboardContent | null): boolean {
  if (!previous) return true;

  // 텍스트 비교
  if (current.text !== previous.text) return true;

  // HTML 비교
  if (current.html !== previous.html) return true;

  // 이미지 비교 (크기로 간단 비교)
  if (current.image && previous.image) {
    const currentSize = current.image.getSize();
    const previousSize = previous.image.getSize();
    if (currentSize.width !== previousSize.width || currentSize.height !== previousSize.height) {
      return true;
    }
  } else if (!!current.image !== !!previous.image) {
    return true;
  }

  return false;
}

/**
 * 클립보드 감시 간격 Setup
 */
export function setWatchInterval(intervalMs: number): boolean {
  if (intervalMs < MIN_WATCH_INTERVAL || intervalMs > MAX_WATCH_INTERVAL) {
    console.warn('감시 간격은 ${MIN_WATCH_INTERVAL}-${MAX_WATCH_INTERVAL}ms 범위여야 합니다.');
    return false;
  }

  watchInterval = intervalMs;
  clipboardStats.currentInterval = intervalMs;
  watcherOptions.interval = intervalMs;

  // 이미 실행 중이면 재시작
  if (isWatchingEnabled) {
    stopWatching();
    startWatching(changeCallback);
  }

  console.log('클립보드 감시 간격 Setup: ${intervalMs}ms');
  return true;
}

/**
 * 클립보드 감시 시작
 */
export function startWatching(callback?: (content: ClipboardContent) => void): void {
  try {
    if (callback) {
      changeCallback = callback;
    }

    if (clipboardTimer) {
      clearInterval(clipboardTimer);
    }

    isWatchingEnabled = true;
    clipboardStats.watchingEnabled = true;
    lastClipboardContent = readCurrentClipboardContent();

    clipboardTimer = setInterval(() => {
      if (!isWatchingEnabled) return;

      try {
        const currentContent = readCurrentClipboardContent();

        // 내용이 변경되었고, 내부 복사 작업이 아닌 경우만 처리
        if (isContentChanged(currentContent, lastClipboardContent) && !internalCopyPending) {
          currentContent.source = 'external';
          handleClipboardChange(currentContent);
        }

        // 내부 복사 플래그 초기화
        if (internalCopyPending) {
          internalCopyPending = false;
        }

      } catch (error) {
        console.error('클립보드 감시 Error:', error);
      }
    }, watchInterval);

    console.log('클립보드 감시 시작 (간격: ${watchInterval}ms)');

  } catch (error) {
    console.error('클립보드 감시 시작 Error:', error);
  }
}

/**
 * 클립보드 변경 처리
 */
function handleClipboardChange(content: ClipboardContent): void {
  try {
    lastClipboardContent = content;
    
    // 통계 업데이트
    clipboardStats.totalChanges++;
    clipboardStats.lastChangeTime = Date.now();
    
    if (content.source === 'external') {
      clipboardStats.externalChanges++;
    } else {
      clipboardStats.internalCopies++;
    }

    // Add to history
    if (watcherOptions.enableHistory) {
      addToHistory(content);
    }

    // 콜백 실행
    if (changeCallback) {
      changeCallback(content);
    }

    // 모든 윈도우에 이벤트 전송
    broadcastClipboardChange(content);

    console.log('클립보드 변경 감지:', {
      hasText: !!content.text,
      hasHtml: !!content.html,
      hasImage: !!content.image,
      source: content.source
    });

  } catch (error) {
    console.error('클립보드 변경 처리 Error:', error);
  }
}

/**
 * 클립보드 변경을 모든 윈도우에 브로드캐스트
 */
function broadcastClipboardChange(content: ClipboardContent): void {
  try {
    const eventData = {
      text: content.text,
      html: content.html,
      hasImage: !!content.image,
      timestamp: content.timestamp,
      source: content.source
    };

    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('clipboard-changed', eventData);
      }
    }

  } catch (error) {
    console.error('클립보드 이벤트 브로드캐스트 Error:', error);
  }
}

/**
 * Add to history
 */
function addToHistory(content: ClipboardContent): void {
  try {
    clipboardHistory.unshift(content);

    // 최대 크기 제한
    const maxSize = watcherOptions.maxHistorySize || MAX_HISTORY_SIZE;
    if (clipboardHistory.length > maxSize) {
      clipboardHistory.splice(maxSize);
    }

  } catch (error) {
    console.error('클립보드 히스토리 추가 Error:', error);
  }
}

/**
 * 클립보드 감시 중지
 */
export function stopWatching(): void {
  try {
    isWatchingEnabled = false;
    clipboardStats.watchingEnabled = false;

    if (clipboardTimer) {
      clearInterval(clipboardTimer);
      clipboardTimer = null;
    }

    console.log('클립보드 감시 중지');

  } catch (error) {
    console.error('클립보드 감시 중지 Error:', error);
  }
}

/**
 * 텍스트를 클립보드로 복사
 */
export function copyTextToClipboard(text: string): boolean {
  try {
    internalCopyPending = true;
    clipboard.writeText(text);

    // 내부 복사 내용 업데이트
    const content: ClipboardContent = {
      text,
      timestamp: Date.now(),
      source: 'internal'
    };

    lastClipboardContent = content;
    handleClipboardChange(content);

    console.log('텍스트 클립보드 복사 Completed');
    return true;

  } catch (error) {
    console.error('텍스트 클립보드 복사 Error:', error);
    internalCopyPending = false;
    return false;
  }
}

/**
 * HTML을 클립보드로 복사
 */
export function copyHtmlToClipboard(html: string, text?: string): boolean {
  try {
    internalCopyPending = true;
    clipboard.writeHTML(html, text as "clipboard");

    const content: ClipboardContent = {
      html,
      text: text || extractTextFromHtml(html),
      timestamp: Date.now(),
      source: 'internal'
    };

    lastClipboardContent = content;
    handleClipboardChange(content);

    console.log('HTML 클립보드 복사 Completed');
    return true;

  } catch (error) {
    console.error('HTML 클립보드 복사 Error:', error);
    internalCopyPending = false;
    return false;
  }
}

/**
 * 이미지를 클립보드로 복사
 */
export function copyImageToClipboard(imageData: string | Buffer | Electron.NativeImage): boolean {
  try {
    internalCopyPending = true;
    let image: Electron.NativeImage;

    if (typeof imageData === 'string') {
      // 파일 경로인 경우
      if (fs.existsSync(imageData)) {
        image = nativeImage.createFromPath(imageData);
      } else {
        // Base64 데이터인 경우
        image = nativeImage.createFromDataURL(imageData);
      }
    } else if (Buffer.isBuffer(imageData)) {
      // 버퍼인 경우
      image = nativeImage.createFromBuffer(imageData);
    } else {
      // 이미 NativeImage인 경우
      image = imageData;
    }

    clipboard.writeImage(image);

    const content: ClipboardContent = {
      image,
      timestamp: Date.now(),
      source: 'internal'
    };

    lastClipboardContent = content;
    handleClipboardChange(content);

    console.log('이미지 클립보드 복사 Completed');
    return true;

  } catch (error) {
    console.error('이미지 클립보드 복사 Error:', error);
    internalCopyPending = false;
    return false;
  }
}

/**
 * 클립보드에서 텍스트 읽기
 */
export function readTextFromClipboard(): string {
  try {
    return clipboard.readText();
  } catch (error) {
    console.error('클립보드 텍스트 읽기 Error:', error);
    return '';
  }
}

/**
 * 클립보드에서 HTML 읽기
 */
export function readHtmlFromClipboard(): string {
  try {
    return clipboard.readHTML();
  } catch (error) {
    console.error('클립보드 HTML 읽기 Error:', error);
    return '';
  }
}

/**
 * 클립보드에서 이미지 읽기
 */
export function readImageFromClipboard(): Electron.NativeImage | null {
  try {
    const image = clipboard.readImage();
    return image.isEmpty() ? null : image;
  } catch (error) {
    console.error('클립보드 이미지 읽기 Error:', error);
    return null;
  }
}

/**
 * HTML에서 텍스트 추출 (간단한 구현)
 */
function extractTextFromHtml(html: string): string {
  try {
    return html.replace(/<[^>]*>/g, '').trim();
  } catch (error) {
    return html;
  }
}

/**
 * 클립보드 히스토리 조회
 */
export function getClipboardHistory(limit = 20): ClipboardContent[] {
  return clipboardHistory.slice(0, limit);
}

/**
 * 클립보드 히스토리 삭제
 */
export function clearClipboardHistory(): void {
  clipboardHistory.length = 0;
  console.log('클립보드 히스토리가 삭제되었습니다.');
}

/**
 * 클립보드 통계 조회
 */
export function getClipboardStats(): ClipboardStats {
  return { ...clipboardStats };
}

/**
 * 클립보드를 파일로 저장
 */
export async function saveClipboardToFile(filePath: string, type: 'text' | 'html' | 'image' = 'text'): Promise<boolean> {
  try {
    switch (type) {
      case 'text': {
        const text = readTextFromClipboard();
        if (text) {
          fs.writeFileSync(filePath, text, 'utf8');
          return true;
        }
        break;
      }

      case 'html': {
        const html = readHtmlFromClipboard();
        if (html) {
          fs.writeFileSync(filePath, html, 'utf8');
          return true;
        }
        break;
      }

      case 'image': {
        const image = readImageFromClipboard();
        if (image) {
          const buffer = image.toPNG();
          fs.writeFileSync(filePath, buffer);
          return true;
        }
        break;
      }
    }

    return false;

  } catch (error) {
    console.error('클립보드 파일 저장 Error:', error);
    return false;
  }
}

/**
 * IPC 핸들러 Setup
 */
function setupClipboardIpcHandlers(): void {
  // 텍스트 복사
  ipcMain.handle('clipboard:copyText', (event, text: string) => {
    console.log(`[ClipboardWatcher] 텍스트 복사 요청, 발신자: ${event.sender.id}`);
    return copyTextToClipboard(text);
  });

  // HTML 복사
  ipcMain.handle('clipboard:copyHtml', (event, html: string, text?: string) => {
    console.log(`[ClipboardWatcher] HTML 복사 요청, 발신자: ${event.sender.id}`);
    return copyHtmlToClipboard(html, text);
  });

  // 이미지 복사
  ipcMain.handle('clipboard:copyImage', (event, imageData) => {
    console.log(`[ClipboardWatcher] 이미지 복사 요청, 발신자: ${event.sender.id}`);
    return copyImageToClipboard(imageData);
  });

  // 텍스트 읽기
  ipcMain.handle('clipboard:readText', () => {
    return readTextFromClipboard();
  });

  // HTML 읽기
  ipcMain.handle('clipboard:readHtml', () => {
    return readHtmlFromClipboard();
  });

  // 이미지 읽기
  ipcMain.handle('clipboard:readImage', () => {
    const image = readImageFromClipboard();
    return image ? image.toDataURL() : null;
  });

  // 감시 시작
  ipcMain.handle('clipboard:startWatching', (event, options: ClipboardWatcherOptions = {}) => {
    console.log(`[ClipboardWatcher] 감시 시작 요청, 발신자: ${event.sender.id}`);
    if (options.interval) {
      setWatchInterval(options.interval);
    }
    startWatching();
    return isWatchingEnabled;
  });

  // 감시 중지
  ipcMain.handle('clipboard:stopWatching', () => {
    stopWatching();
    return !isWatchingEnabled;
  });

  // 히스토리 조회
  ipcMain.handle('clipboard:getHistory', (event, limit: number = 20) => {
    console.log(`[ClipboardWatcher] 히스토리 조회 요청: ${limit}개, 발신자: ${event.sender.id}`);
    return getClipboardHistory(limit);
  });

  // 히스토리 삭제
  ipcMain.handle('clipboard:clearHistory', () => {
    clearClipboardHistory();
    return true;
  });

  // 통계 조회
  ipcMain.handle('clipboard:getStats', () => {
    return getClipboardStats();
  });

  // 파일로 저장
  ipcMain.handle('clipboard:saveToFile', (event, filePath: string, type: 'text' | 'html' | 'image') => {
    console.log(`[ClipboardWatcher] 파일 저장 요청: ${type}, 경로: ${path.basename(filePath)}, 발신자: ${event.sender.id}`);
    return saveClipboardToFile(filePath, type);
  });

  // 감시 간격 Setup
  ipcMain.handle('clipboard:setInterval', (event, intervalMs: number) => {
    console.log(`[ClipboardWatcher] 감시 간격 설정: ${intervalMs}ms, 발신자: ${event.sender.id}`);
    return setWatchInterval(intervalMs);
  });
}
