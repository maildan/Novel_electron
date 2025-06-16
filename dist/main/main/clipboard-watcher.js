"use strict";
/**
 * 클립보드 감시 모듈
 *
 * 시스템 클립보드 내용의 변경을 실시간으로 감시하고 관리합니다.
 * 텍스트, 이미지, HTML 등 다양한 형태의 클립보드 데이터를 지원합니다.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeClipboardWatcher = initializeClipboardWatcher;
exports.setWatchInterval = setWatchInterval;
exports.startWatching = startWatching;
exports.stopWatching = stopWatching;
exports.copyTextToClipboard = copyTextToClipboard;
exports.copyHtmlToClipboard = copyHtmlToClipboard;
exports.copyImageToClipboard = copyImageToClipboard;
exports.readTextFromClipboard = readTextFromClipboard;
exports.readHtmlFromClipboard = readHtmlFromClipboard;
exports.readImageFromClipboard = readImageFromClipboard;
exports.getClipboardHistory = getClipboardHistory;
exports.clearClipboardHistory = clearClipboardHistory;
exports.getClipboardStats = getClipboardStats;
exports.saveClipboardToFile = saveClipboardToFile;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Path 모듈 사용 확인
console.log('[ClipboardWatcher] Path 모듈 로드됨:', typeof path);
// 상수
const DEFAULT_WATCH_INTERVAL = 500;
const MIN_WATCH_INTERVAL = 100;
const MAX_WATCH_INTERVAL = 5000;
const MAX_HISTORY_SIZE = 100;
const SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'];
// 지원 이미지 포맷 확인
console.log('[ClipboardWatcher] 지원 이미지 포맷:', SUPPORTED_IMAGE_FORMATS.join(', '));
// 내부 상태
let lastClipboardContent = null;
let internalCopyPending = false;
let isWatchingEnabled = false;
let watchInterval = DEFAULT_WATCH_INTERVAL;
let clipboardTimer = null;
let changeCallback = undefined;
let clipboardHistory = [];
let watcherOptions = {
    interval: DEFAULT_WATCH_INTERVAL,
    enableHistory: true,
    maxHistorySize: MAX_HISTORY_SIZE,
    watchTypes: ['text', 'image', 'html']
};
// 통계
let clipboardStats = {
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
function initializeClipboardWatcher(options = {}) {
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
    }
    catch (error) {
        console.error('클립보드 감시 초기화 Error:', error);
    }
}
/**
 * 현재 클립보드 내용 읽기
 */
function readCurrentClipboardContent() {
    const content = {
        timestamp: Date.now(),
        source: 'external'
    };
    try {
        // 텍스트 읽기
        if (watcherOptions.watchTypes?.includes('text')) {
            const text = electron_1.clipboard.readText();
            if (text) {
                content.text = text;
            }
        }
        // HTML 읽기
        if (watcherOptions.watchTypes?.includes('html')) {
            const html = electron_1.clipboard.readHTML();
            if (html) {
                content.html = html;
            }
        }
        // 이미지 읽기
        if (watcherOptions.watchTypes?.includes('image')) {
            const image = electron_1.clipboard.readImage();
            if (!image.isEmpty()) {
                content.image = image;
            }
        }
    }
    catch (error) {
        console.error('클립보드 내용 읽기 Error:', error);
    }
    return content;
}
/**
 * 클립보드 내용 비교
 */
function isContentChanged(current, previous) {
    if (!previous)
        return true;
    // 텍스트 비교
    if (current.text !== previous.text)
        return true;
    // HTML 비교
    if (current.html !== previous.html)
        return true;
    // 이미지 비교 (크기로 간단 비교)
    if (current.image && previous.image) {
        const currentSize = current.image.getSize();
        const previousSize = previous.image.getSize();
        if (currentSize.width !== previousSize.width || currentSize.height !== previousSize.height) {
            return true;
        }
    }
    else if (!!current.image !== !!previous.image) {
        return true;
    }
    return false;
}
/**
 * 클립보드 감시 간격 Setup
 */
function setWatchInterval(intervalMs) {
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
function startWatching(callback) {
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
            if (!isWatchingEnabled)
                return;
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
            }
            catch (error) {
                console.error('클립보드 감시 Error:', error);
            }
        }, watchInterval);
        console.log('클립보드 감시 시작 (간격: ${watchInterval}ms)');
    }
    catch (error) {
        console.error('클립보드 감시 시작 Error:', error);
    }
}
/**
 * 클립보드 변경 처리
 */
function handleClipboardChange(content) {
    try {
        lastClipboardContent = content;
        // 통계 업데이트
        clipboardStats.totalChanges++;
        clipboardStats.lastChangeTime = Date.now();
        if (content.source === 'external') {
            clipboardStats.externalChanges++;
        }
        else {
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
    }
    catch (error) {
        console.error('클립보드 변경 처리 Error:', error);
    }
}
/**
 * 클립보드 변경을 모든 윈도우에 브로드캐스트
 */
function broadcastClipboardChange(content) {
    try {
        const eventData = {
            text: content.text,
            html: content.html,
            hasImage: !!content.image,
            timestamp: content.timestamp,
            source: content.source
        };
        const windows = electron_1.BrowserWindow.getAllWindows();
        for (const win of windows) {
            if (!win.isDestroyed()) {
                win.webContents.send('clipboard-changed', eventData);
            }
        }
    }
    catch (error) {
        console.error('클립보드 이벤트 브로드캐스트 Error:', error);
    }
}
/**
 * Add to history
 */
function addToHistory(content) {
    try {
        clipboardHistory.unshift(content);
        // 최대 크기 제한
        const maxSize = watcherOptions.maxHistorySize || MAX_HISTORY_SIZE;
        if (clipboardHistory.length > maxSize) {
            clipboardHistory.splice(maxSize);
        }
    }
    catch (error) {
        console.error('클립보드 히스토리 추가 Error:', error);
    }
}
/**
 * 클립보드 감시 중지
 */
function stopWatching() {
    try {
        isWatchingEnabled = false;
        clipboardStats.watchingEnabled = false;
        if (clipboardTimer) {
            clearInterval(clipboardTimer);
            clipboardTimer = null;
        }
        console.log('클립보드 감시 중지');
    }
    catch (error) {
        console.error('클립보드 감시 중지 Error:', error);
    }
}
/**
 * 텍스트를 클립보드로 복사
 */
function copyTextToClipboard(text) {
    try {
        internalCopyPending = true;
        electron_1.clipboard.writeText(text);
        // 내부 복사 내용 업데이트
        const content = {
            text,
            timestamp: Date.now(),
            source: 'internal'
        };
        lastClipboardContent = content;
        handleClipboardChange(content);
        console.log('텍스트 클립보드 복사 Completed');
        return true;
    }
    catch (error) {
        console.error('텍스트 클립보드 복사 Error:', error);
        internalCopyPending = false;
        return false;
    }
}
/**
 * HTML을 클립보드로 복사
 */
function copyHtmlToClipboard(html, text) {
    try {
        internalCopyPending = true;
        electron_1.clipboard.writeHTML(html, text);
        const content = {
            html,
            text: text || extractTextFromHtml(html),
            timestamp: Date.now(),
            source: 'internal'
        };
        lastClipboardContent = content;
        handleClipboardChange(content);
        console.log('HTML 클립보드 복사 Completed');
        return true;
    }
    catch (error) {
        console.error('HTML 클립보드 복사 Error:', error);
        internalCopyPending = false;
        return false;
    }
}
/**
 * 이미지를 클립보드로 복사
 */
function copyImageToClipboard(imageData) {
    try {
        internalCopyPending = true;
        let image;
        if (typeof imageData === 'string') {
            // 파일 경로인 경우
            if (fs.existsSync(imageData)) {
                image = electron_1.nativeImage.createFromPath(imageData);
            }
            else {
                // Base64 데이터인 경우
                image = electron_1.nativeImage.createFromDataURL(imageData);
            }
        }
        else if (Buffer.isBuffer(imageData)) {
            // 버퍼인 경우
            image = electron_1.nativeImage.createFromBuffer(imageData);
        }
        else {
            // 이미 NativeImage인 경우
            image = imageData;
        }
        electron_1.clipboard.writeImage(image);
        const content = {
            image,
            timestamp: Date.now(),
            source: 'internal'
        };
        lastClipboardContent = content;
        handleClipboardChange(content);
        console.log('이미지 클립보드 복사 Completed');
        return true;
    }
    catch (error) {
        console.error('이미지 클립보드 복사 Error:', error);
        internalCopyPending = false;
        return false;
    }
}
/**
 * 클립보드에서 텍스트 읽기
 */
function readTextFromClipboard() {
    try {
        return electron_1.clipboard.readText();
    }
    catch (error) {
        console.error('클립보드 텍스트 읽기 Error:', error);
        return '';
    }
}
/**
 * 클립보드에서 HTML 읽기
 */
function readHtmlFromClipboard() {
    try {
        return electron_1.clipboard.readHTML();
    }
    catch (error) {
        console.error('클립보드 HTML 읽기 Error:', error);
        return '';
    }
}
/**
 * 클립보드에서 이미지 읽기
 */
function readImageFromClipboard() {
    try {
        const image = electron_1.clipboard.readImage();
        return image.isEmpty() ? null : image;
    }
    catch (error) {
        console.error('클립보드 이미지 읽기 Error:', error);
        return null;
    }
}
/**
 * HTML에서 텍스트 추출 (간단한 구현)
 */
function extractTextFromHtml(html) {
    try {
        return html.replace(/<[^>]*>/g, '').trim();
    }
    catch (error) {
        return html;
    }
}
/**
 * 클립보드 히스토리 조회
 */
function getClipboardHistory(limit = 20) {
    return clipboardHistory.slice(0, limit);
}
/**
 * 클립보드 히스토리 삭제
 */
function clearClipboardHistory() {
    clipboardHistory.length = 0;
    console.log('클립보드 히스토리가 삭제되었습니다.');
}
/**
 * 클립보드 통계 조회
 */
function getClipboardStats() {
    return { ...clipboardStats };
}
/**
 * 클립보드를 파일로 저장
 */
async function saveClipboardToFile(filePath, type = 'text') {
    try {
        switch (type) {
            case 'text':
                const text = readTextFromClipboard();
                if (text) {
                    fs.writeFileSync(filePath, text, 'utf8');
                    return true;
                }
                break;
            case 'html':
                const html = readHtmlFromClipboard();
                if (html) {
                    fs.writeFileSync(filePath, html, 'utf8');
                    return true;
                }
                break;
            case 'image':
                const image = readImageFromClipboard();
                if (image) {
                    const buffer = image.toPNG();
                    fs.writeFileSync(filePath, buffer);
                    return true;
                }
                break;
        }
        return false;
    }
    catch (error) {
        console.error('클립보드 파일 저장 Error:', error);
        return false;
    }
}
/**
 * IPC 핸들러 Setup
 */
function setupClipboardIpcHandlers() {
    // 텍스트 복사
    electron_1.ipcMain.handle('clipboard:copyText', (event, text) => {
        console.log(`[ClipboardWatcher] 텍스트 복사 요청, 발신자: ${event.sender.id}`);
        return copyTextToClipboard(text);
    });
    // HTML 복사
    electron_1.ipcMain.handle('clipboard:copyHtml', (event, html, text) => {
        console.log(`[ClipboardWatcher] HTML 복사 요청, 발신자: ${event.sender.id}`);
        return copyHtmlToClipboard(html, text);
    });
    // 이미지 복사
    electron_1.ipcMain.handle('clipboard:copyImage', (event, imageData) => {
        console.log(`[ClipboardWatcher] 이미지 복사 요청, 발신자: ${event.sender.id}`);
        return copyImageToClipboard(imageData);
    });
    // 텍스트 읽기
    electron_1.ipcMain.handle('clipboard:readText', () => {
        return readTextFromClipboard();
    });
    // HTML 읽기
    electron_1.ipcMain.handle('clipboard:readHtml', () => {
        return readHtmlFromClipboard();
    });
    // 이미지 읽기
    electron_1.ipcMain.handle('clipboard:readImage', () => {
        const image = readImageFromClipboard();
        return image ? image.toDataURL() : null;
    });
    // 감시 시작
    electron_1.ipcMain.handle('clipboard:startWatching', (event, options = {}) => {
        console.log(`[ClipboardWatcher] 감시 시작 요청, 발신자: ${event.sender.id}`);
        if (options.interval) {
            setWatchInterval(options.interval);
        }
        startWatching();
        return isWatchingEnabled;
    });
    // 감시 중지
    electron_1.ipcMain.handle('clipboard:stopWatching', () => {
        stopWatching();
        return !isWatchingEnabled;
    });
    // 히스토리 조회
    electron_1.ipcMain.handle('clipboard:getHistory', (event, limit = 20) => {
        console.log(`[ClipboardWatcher] 히스토리 조회 요청: ${limit}개, 발신자: ${event.sender.id}`);
        return getClipboardHistory(limit);
    });
    // 히스토리 삭제
    electron_1.ipcMain.handle('clipboard:clearHistory', () => {
        clearClipboardHistory();
        return true;
    });
    // 통계 조회
    electron_1.ipcMain.handle('clipboard:getStats', () => {
        return getClipboardStats();
    });
    // 파일로 저장
    electron_1.ipcMain.handle('clipboard:saveToFile', (event, filePath, type) => {
        console.log(`[ClipboardWatcher] 파일 저장 요청: ${type}, 경로: ${path.basename(filePath)}, 발신자: ${event.sender.id}`);
        return saveClipboardToFile(filePath, type);
    });
    // 감시 간격 Setup
    electron_1.ipcMain.handle('clipboard:setInterval', (event, intervalMs) => {
        console.log(`[ClipboardWatcher] 감시 간격 설정: ${intervalMs}ms, 발신자: ${event.sender.id}`);
        return setWatchInterval(intervalMs);
    });
}
//# sourceMappingURL=clipboard-watcher.js.map