"use strict";
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
exports.getSecurityConfig = void 0;
exports.resolveAppDataPath = resolveAppDataPath;
exports.filePathToProtocolUrl = filePathToProtocolUrl;
exports.protocolUrlToFilePath = protocolUrlToFilePath;
exports.validateFilePath = validateFilePath;
exports.safeReadFile = safeReadFile;
exports.safeWriteFile = safeWriteFile;
exports.showOpenDialog = showOpenDialog;
exports.showSaveDialog = showSaveDialog;
exports.updateSecurityConfig = updateSecurityConfig;
exports.addAllowedExtension = addAllowedExtension;
exports.addAllowedDirectory = addAllowedDirectory;
exports.getMimeType = getMimeType;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// ===== CONSTANTS =====
const DEFAULT_SECURITY_CONFIG = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: [
        '.js', '.ts', '.json', '.txt', '.md', '.html', '.css',
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
        '.pdf', '.zip', '.log'
    ],
    allowedDirectories: [],
    strictMode: true
};
// ===== CONFIGURATION =====
let securityConfig = {
    ...DEFAULT_SECURITY_CONFIG,
    allowedDirectories: [
        electron_1.app.getAppPath(),
        electron_1.app.getPath('userData'),
        electron_1.app.getPath('temp')
    ]
};
exports.getSecurityConfig = securityConfig;
// ===== LOGGING INTEGRATION =====
function logFileOperation(level, message, context) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] FILE-UTILS ${level.toUpperCase()}: ${message}`;
    // 타입 가드를 사용해서 context를 안전하게 처리
    const safeContext = context instanceof Error ? context :
        typeof context === 'string' ? context :
            typeof context === 'object' && context ? context : undefined;
    switch (level) {
        case 'info':
            console.log(logMessage, safeContext || '');
            break;
        case 'warn':
            console.warn(logMessage, safeContext || '');
            break;
        case 'error':
            console.error(logMessage, safeContext || '');
            break;
    }
}
// ===== PATH UTILITIES =====
/**
 * 앱 데이터 디렉토리에서의 상대 경로 해결
 */
function resolveAppDataPath(relativePath) {
    try {
        const userDataPath = electron_1.app.getPath('userData');
        const resolved = path.join(userDataPath, relativePath);
        logFileOperation('info', `Path resolved: ${relativePath} -> ${resolved}`);
        return resolved;
    }
    catch (error) {
        logFileOperation('error', `Failed to resolve app data path: ${relativePath}`, error);
        throw new Error(`경로 해결 실패: ${relativePath}`);
    }
}
/**
 * 파일 경로를 프로토콜 URL로 변환
 */
function filePathToProtocolUrl(filePath, protocol = 'loop-app') {
    try {
        const relativePath = path.relative(electron_1.app.getAppPath(), filePath);
        const url = `${protocol}://${relativePath.replace(/\\/g, '/')}`;
        logFileOperation('info', `File path to protocol URL: ${filePath} -> ${url}`);
        return url;
    }
    catch (error) {
        logFileOperation('error', `Failed to convert path to protocol URL: ${filePath}`, error);
        throw new Error(`프로토콜 URL 변환 실패: ${filePath}`);
    }
}
/**
 * 프로토콜 URL을 파일 경로로 변환
 */
function protocolUrlToFilePath(protocolUrl, protocol = 'loop-app') {
    try {
        const url = new URL(protocolUrl);
        if (url.protocol !== `${protocol}:`) {
            throw new Error(`Invalid protocol: ${url.protocol}`);
        }
        const relativePath = url.hostname + url.pathname;
        const filePath = path.join(electron_1.app.getAppPath(), relativePath);
        logFileOperation('info', `Protocol URL to file path: ${protocolUrl} -> ${filePath}`);
        return filePath;
    }
    catch (error) {
        logFileOperation('error', `Failed to convert protocol URL to path: ${protocolUrl}`, error);
        throw new Error(`파일 경로 변환 실패: ${protocolUrl}`);
    }
}
// ===== VALIDATION UTILITIES =====
/**
 * 파일 확장자 검증
 */
function validateFileExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return securityConfig.allowedExtensions.includes(ext);
}
/**
 * 파일 크기 검증
 */
function validateFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size <= securityConfig.maxFileSize;
    }
    catch (error) {
        logFileOperation('error', `Failed to check file size: ${filePath}`, error);
        return false;
    }
}
/**
 * 파일 디렉토리 보안 검증
 */
function validateFileDirectory(filePath) {
    try {
        const resolvedPath = path.resolve(filePath);
        return securityConfig.allowedDirectories.some(allowedDir => resolvedPath.startsWith(path.resolve(allowedDir)));
    }
    catch (error) {
        logFileOperation('error', `Failed to validate file directory: ${filePath}`, error);
        return false;
    }
}
/**
 * 종합적인 파일 경로 검증
 */
function validateFilePath(filePath) {
    try {
        // 기본 경로 정규화
        const normalizedPath = path.normalize(filePath);
        // 파일 존재 여부 확인
        if (!fs.existsSync(normalizedPath)) {
            return {
                isValid: false,
                error: '파일이 존재하지 않습니다'
            };
        }
        // 파일 확장자 검증
        if (!validateFileExtension(normalizedPath)) {
            const ext = path.extname(normalizedPath);
            return {
                isValid: false,
                error: `허용되지 않은 파일 확장자: ${ext}`,
                securityViolation: true
            };
        }
        // 파일 크기 검증
        if (!validateFileSize(normalizedPath)) {
            return {
                isValid: false,
                error: '파일 크기가 허용된 한도를 초과합니다',
                securityViolation: true
            };
        }
        // 엄격 모드에서의 디렉토리 검증
        if (securityConfig.strictMode && !validateFileDirectory(normalizedPath)) {
            return {
                isValid: false,
                error: '허용되지 않은 디렉토리에 있는 파일입니다',
                securityViolation: true
            };
        }
        logFileOperation('info', `File validation passed: ${normalizedPath}`);
        return { isValid: true };
    }
    catch (error) {
        logFileOperation('error', `File validation failed: ${filePath}`, error);
        return {
            isValid: false,
            error: `파일 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
// ===== FILE OPERATION UTILITIES =====
/**
 * 안전한 파일 읽기
 */
async function safeReadFile(filePath) {
    try {
        // 파일 검증
        const validation = validateFilePath(filePath);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error
            };
        }
        // 파일 읽기
        const data = await fs.promises.readFile(filePath);
        logFileOperation('info', `File read successfully: ${filePath}`);
        return {
            success: true,
            data
        };
    }
    catch (error) {
        logFileOperation('error', `Failed to read file: ${filePath}`, error);
        return {
            success: false,
            error: `파일 읽기 실패: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
/**
 * 안전한 파일 쓰기
 */
async function safeWriteFile(filePath, data) {
    try {
        // 디렉토리 생성 (필요한 경우)
        const dirPath = path.dirname(filePath);
        await fs.promises.mkdir(dirPath, { recursive: true });
        // 파일 쓰기
        await fs.promises.writeFile(filePath, data);
        logFileOperation('info', `File written successfully: ${filePath}`);
        return { success: true };
    }
    catch (error) {
        logFileOperation('error', `Failed to write file: ${filePath}`, error);
        return {
            success: false,
            error: `파일 쓰기 실패: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
// ===== DIALOG UTILITIES =====
/**
 * 파일 선택 대화상자 표시
 */
async function showOpenDialog(options) {
    try {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = focusedWindow
            ? await electron_1.dialog.showOpenDialog(focusedWindow, options || {})
            : await electron_1.dialog.showOpenDialog(options || {});
        logFileOperation('info', 'Open dialog completed', { canceled: result.canceled, fileCount: result.filePaths?.length });
        return result;
    }
    catch (error) {
        logFileOperation('error', 'Failed to show open dialog', error);
        throw error;
    }
}
/**
 * 파일 저장 대화상자 표시
 */
async function showSaveDialog(options) {
    try {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = focusedWindow
            ? await electron_1.dialog.showSaveDialog(focusedWindow, options || {})
            : await electron_1.dialog.showSaveDialog(options || {});
        logFileOperation('info', 'Save dialog completed', { canceled: result.canceled, filePath: result.filePath });
        return result;
    }
    catch (error) {
        logFileOperation('error', 'Failed to show save dialog', error);
        throw error;
    }
}
// ===== CONFIGURATION =====
/**
 * 보안 설정 업데이트
 */
function updateSecurityConfig(config) {
    exports.getSecurityConfig = securityConfig = { ...securityConfig, ...config };
    logFileOperation('info', 'Security config updated', config);
}
/**
 * 허용된 확장자 추가
 */
function addAllowedExtension(extension) {
    if (!extension.startsWith('.')) {
        extension = '.' + extension;
    }
    if (!securityConfig.allowedExtensions.includes(extension)) {
        securityConfig.allowedExtensions.push(extension);
        logFileOperation('info', `Added allowed extension: ${extension}`);
    }
}
/**
 * 허용된 디렉토리 추가
 */
function addAllowedDirectory(directory) {
    const resolvedDir = path.resolve(directory);
    if (!securityConfig.allowedDirectories.includes(resolvedDir)) {
        securityConfig.allowedDirectories.push(resolvedDir);
        logFileOperation('info', `Added allowed directory: ${resolvedDir}`);
    }
}
// ===== MIME TYPE UTILITIES =====
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
};
/**
 * 파일 확장자로부터 MIME 타입 조회
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}
// ===== INITIALIZATION =====
logFileOperation('info', 'Core file utilities initialized', {
    allowedDirectories: securityConfig.allowedDirectories,
    allowedExtensions: securityConfig.allowedExtensions,
    strictMode: securityConfig.strictMode
});
//# sourceMappingURL=file-utils.js.map