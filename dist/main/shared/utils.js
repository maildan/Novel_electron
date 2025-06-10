"use strict";
/**
 * Loop 6 공유 유틸리티
 *
 * 메인 프로세스와 렌더러 프로세스에서 공통으로 사용되는 유틸리티 함수들
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
exports.platform = exports.isDev = void 0;
exports.debugLog = debugLog;
exports.infoLog = infoLog;
exports.warnLog = warnLog;
exports.errorLog = errorLog;
exports.safeJSONParse = safeJSONParse;
exports.safeJSONStringify = safeJSONStringify;
exports.delay = delay;
exports.deepClone = deepClone;
exports.fileExists = fileExists;
exports.ensureDirectory = ensureDirectory;
exports.formatBytes = formatBytes;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.formatTimestamp = formatTimestamp;
exports.compareVersions = compareVersions;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 개발 모드 확인
exports.isDev = process.env.NODE_ENV === 'development';
// 로그 파일 경로 (메인 프로세스에서만 사용)
let logDir = null;
try {
    // Electron이 로드된 경우에만 로그 디렉토리 설정
    if (typeof require !== 'undefined') {
        try {
            const { app } = require('electron');
            if (app && app.getPath) {
                logDir = path.join(app.getPath('userData'), 'logs');
            }
        }
        catch {
            // Electron이 없는 환경에서는 로그 디렉토리를 설정하지 않음
        }
    }
}
catch {
    // 오류 무시
}
/**
 * 디버그 로그 출력
 */
function debugLog(...args) {
    if (exports.isDev) {
        const timestamp = new Date().toISOString();
        console.log(`[DEBUG ${timestamp}]`, ...args);
        // 파일 로깅 (메인 프로세스에서만)
        if (logDir) {
            writeLogToFile('debug', args);
        }
    }
}
/**
 * 정보 로그 출력
 */
function infoLog(...args) {
    const timestamp = new Date().toISOString();
    console.info(`[INFO ${timestamp}]`, ...args);
    // 파일 로깅 (메인 프로세스에서만)
    if (logDir) {
        writeLogToFile('info', args);
    }
}
/**
 * 경고 로그 출력
 */
function warnLog(...args) {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN ${timestamp}]`, ...args);
    // 파일 로깅 (메인 프로세스에서만)
    if (logDir) {
        writeLogToFile('warn', args);
    }
}
/**
 * 에러 로그 출력
 */
function errorLog(...args) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR ${timestamp}]`, ...args);
    // 파일 로깅 (메인 프로세스에서만)
    if (logDir) {
        writeLogToFile('error', args);
    }
}
/**
 * 파일에 로그 작성 (메인 프로세스에서만)
 */
function writeLogToFile(level, args) {
    if (!logDir)
        return;
    try {
        // 로그 디렉토리 생성
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const timestamp = new Date().toISOString();
        const logEntry = `[${level.toUpperCase()} ${timestamp}] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}\n`;
        const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logEntry, 'utf-8');
    }
    catch (error) {
        // 로그 파일 작성 실패 시 콘솔에만 출력
        console.error('Failed to write log to file:', error);
    }
}
/**
 * 안전한 JSON 파싱
 */
function safeJSONParse(jsonString, fallback) {
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return fallback;
    }
}
/**
 * 안전한 JSON 문자열화
 */
function safeJSONStringify(obj, space) {
    try {
        return JSON.stringify(obj, null, space);
    }
    catch {
        return '{}';
    }
}
/**
 * 딜레이 함수
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 객체 깊은 복사
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });
    return cloned;
}
/**
 * 안전한 파일 존재 확인
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    }
    catch {
        return false;
    }
}
/**
 * 안전한 디렉토리 생성
 */
function ensureDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 메모리 사용량 포맷팅
 */
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * 현재 타임스탬프 반환
 */
function getCurrentTimestamp() {
    return Date.now();
}
/**
 * 타임스탬프를 읽기 쉬운 형태로 변환
 */
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}
/**
 * 플랫폼 확인
 */
exports.platform = {
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
    current: process.platform
};
/**
 * 버전 비교
 */
function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        if (v1Part > v2Part)
            return 1;
        if (v1Part < v2Part)
            return -1;
    }
    return 0;
}
//# sourceMappingURL=utils.js.map