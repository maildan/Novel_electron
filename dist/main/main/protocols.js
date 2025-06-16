"use strict";
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
exports.filePathToProtocolUrl = filePathToProtocolUrl;
exports.protocolUrlToFilePath = protocolUrlToFilePath;
exports.updateSecurityConfig = updateSecurityConfig;
exports.addAllowedOrigin = addAllowedOrigin;
exports.removeAllowedOrigin = removeAllowedOrigin;
exports.initProtocolSchemes = initProtocolSchemes;
exports.setupProtocolHandlers = setupProtocolHandlers;
exports.cleanupProtocolHandlers = cleanupProtocolHandlers;
exports.getProtocolStatus = getProtocolStatus;
/**
 * 커스텀 프로토콜 핸들러 및 보안 관리 모듈
 * 앱 전용 프로토콜, URL 라우팅, 보안 파일 접근을 처리합니다
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
const debug_1 = require("../utils/debug");
// 커스텀 프로토콜 구성
const APP_PROTOCOL = 'loop';
const ALLOWED_FILE_EXTENSIONS = [
    '.html', '.css', '.js', '.ts', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.pdf', '.txt', '.md'
];
// MIME 타입 매핑
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
};
const DEFAULT_SECURITY_CONFIG = {
    allowedOrigins: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    allowedProtocols: ['http:', 'https:', 'file:', `${APP_PROTOCOL}:`],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    enableCORS: true,
    strictMode: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
};
// 전역 상태
let protocolsInitialized = false;
let securityConfig = { ...DEFAULT_SECURITY_CONFIG };
/**
 * 파일 경로를 프로토콜 URL로 변환
 */
function filePathToProtocolUrl(filePath) {
    const relativePath = path.relative(electron_1.app.getAppPath(), filePath);
    return `${APP_PROTOCOL}://${relativePath.replace(/\\/g, '/')}`;
}
/**
 * Convert protocol URL to file path
 */
function protocolUrlToFilePath(protocolUrl) {
    const url = new url_1.URL(protocolUrl);
    if (url.protocol !== `${APP_PROTOCOL}:`) {
        throw new Error(`Invalid protocol: ${url.protocol}`);
    }
    const relativePath = url.hostname + url.pathname;
    return path.join(electron_1.app.getAppPath(), relativePath);
}
/**
 * Get MIME type from file extension
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}
/**
 * Check if file extension is allowed
 */
function isAllowedFileExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ALLOWED_FILE_EXTENSIONS.includes(ext);
}
/**
 * Validate file access permissions
 */
function validateFileAccess(filePath) {
    try {
        // 파일 존재 여부 확인
        if (!fs.existsSync(filePath)) {
            return false;
        }
        // 파일 확장자 확인
        if (!isAllowedFileExtension(filePath)) {
            (0, debug_1.debugLog)('허용되지 않은 파일 확장자: ${path.extname(filePath)}');
            return false;
        }
        // 파일 크기 확인
        const stats = fs.statSync(filePath);
        if (stats.size > securityConfig.maxFileSize) {
            (0, debug_1.debugLog)('파일이 너무 큼: ${stats.size} bytes');
            return false;
        }
        // 엄격 모드에서의 추가 보안 검사
        if (securityConfig.strictMode) {
            // 파일이 앱 디렉토리 또는 사용자 데이터 디렉토리 내에 있는지 확인
            const appPath = electron_1.app.getAppPath();
            const userDataPath = electron_1.app.getPath('userData');
            const resolvedPath = path.resolve(filePath);
            if (!resolvedPath.startsWith(appPath) && !resolvedPath.startsWith(userDataPath)) {
                (0, debug_1.debugLog)('파일 Access denied - 허용된 디렉토리 밖: ${resolvedPath}');
                return false;
            }
        }
        return true;
    }
    catch (error) {
        (0, debug_1.debugLog)('파일 접근 유효성 검사 Error: ${error}');
        return false;
    }
}
/**
 * Create response headers with security settings
 */
function createSecurityHeaders() {
    const headers = {};
    if (securityConfig.enableCORS) {
        headers['Access-Control-Allow-Origin'] = securityConfig.allowedOrigins.join(', ');
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
    // 보안 헤더
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    // 개발용 콘텐츠 보안 정책
    if (!electron_1.app.isPackaged) {
        headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' ws: wss:;";
    }
    return headers;
}
/**
 * Handle custom protocol requests
 */
function handleProtocolRequest(request) {
    try {
        const url = new url_1.URL(request.url);
        (0, debug_1.debugLog)('프로토콜 요청: ${request.url}');
        // 파일 경로로 변환
        const filePath = protocolUrlToFilePath(request.url);
        (0, debug_1.debugLog)('해결된 파일 경로: ${filePath}');
        // 파일 접근 유효성 검사
        if (!validateFileAccess(filePath)) {
            return {
                statusCode: 403,
                headers: createSecurityHeaders(),
                data: Buffer.from('Access denied')
            };
        }
        // 파일 읽기
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        const headers = {
            ...createSecurityHeaders(),
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString()
        };
        return {
            statusCode: 200,
            headers,
            data: fileBuffer
        };
    }
    catch (error) {
        console.error('Protocol request error: ${error}');
        return {
            statusCode: 404,
            headers: createSecurityHeaders(),
            data: Buffer.from('File not found')
        };
    }
}
/**
 * Register custom protocol scheme
 */
function registerProtocolScheme() {
    try {
        // Register protocol as standard and secure
        electron_1.protocol.registerSchemesAsPrivileged([
            {
                scheme: APP_PROTOCOL,
                privileges: {
                    standard: true,
                    secure: true,
                    allowServiceWorkers: true,
                    supportFetchAPI: true,
                    corsEnabled: true
                }
            }
        ]);
        (0, debug_1.debugLog)('Protocol scheme registered: ${APP_PROTOCOL}');
    }
    catch (error) {
        console.error('Protocol scheme registration error:', error);
    }
}
/**
 * Register protocol handler
 */
function registerProtocolHandler() {
    try {
        const success = electron_1.protocol.registerBufferProtocol(APP_PROTOCOL, (request, callback) => {
            const response = handleProtocolRequest(request);
            callback(response);
        });
        if (success) {
            (0, debug_1.debugLog)('Protocol handler registered: ${APP_PROTOCOL}');
        }
        else {
            console.error('Failed to register protocol handler: ${APP_PROTOCOL}');
        }
    }
    catch (error) {
        console.error('Protocol handler registration error:', error);
    }
}
/**
 * Handle deep links and URL schemes
 */
function setupDeepLinkHandler() {
    // Set as default protocol client
    if (!electron_1.app.isDefaultProtocolClient(APP_PROTOCOL)) {
        electron_1.app.setAsDefaultProtocolClient(APP_PROTOCOL);
    }
    // Handle second instance for deep links
    electron_1.app.on('second-instance', (event, commandLine, workingDirectory) => {
        (0, debug_1.debugLog)('Second instance detected with command line:', commandLine);
        // Find protocol URL in command line
        const protocolUrl = commandLine.find(arg => arg.startsWith(`${APP_PROTOCOL}://`));
        if (protocolUrl) {
            handleDeepLink(protocolUrl);
        }
    });
    // Handle open-url event (macOS)
    electron_1.app.on('open-url', (event, url) => {
        event.preventDefault();
        (0, debug_1.debugLog)('Open URL event: ${url}');
        handleDeepLink(url);
    });
}
/**
 * Handle deep link navigation
 */
function handleDeepLink(url) {
    try {
        (0, debug_1.debugLog)('Handling deep link: ${url}');
        const parsedUrl = new url_1.URL(url);
        // Get main window
        const mainWindow = electron_1.BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
            // Show and focus window
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
            // Send deep link to renderer
            mainWindow.webContents.send('deep-link-received', {
                url,
                pathname: parsedUrl.pathname,
                searchParams: Object.fromEntries(parsedUrl.searchParams)
            });
        }
    }
    catch (error) {
        console.error('Deep link handling error:', error);
    }
}
/**
 * Intercept and handle file protocol requests
 */
function setupFileProtocolInterceptor() {
    try {
        electron_1.protocol.interceptFileProtocol('file', (request, callback) => {
            const url = request.url.substr(7); // Remove 'file://' prefix
            const filePath = path.normalize(decodeURI(url));
            if (validateFileAccess(filePath)) {
                callback({ path: filePath });
            }
            else {
                callback({ error: -6 }); // FILE_NOT_FOUND
            }
        });
        (0, debug_1.debugLog)('File protocol interceptor setup completed');
    }
    catch (error) {
        console.error('File protocol interceptor setup error:', error);
    }
}
/**
 * Update security configuration
 */
function updateSecurityConfig(config) {
    securityConfig = { ...securityConfig, ...config };
    (0, debug_1.debugLog)('Security configuration updated:', securityConfig);
}
/**
 * Add allowed origin
 */
function addAllowedOrigin(origin) {
    if (!securityConfig.allowedOrigins.includes(origin)) {
        securityConfig.allowedOrigins.push(origin);
        (0, debug_1.debugLog)('Added allowed origin: ${origin}');
    }
}
/**
 * Remove allowed origin
 */
function removeAllowedOrigin(origin) {
    const index = securityConfig.allowedOrigins.indexOf(origin);
    if (index > -1) {
        securityConfig.allowedOrigins.splice(index, 1);
        (0, debug_1.debugLog)('Removed allowed origin: ${origin}');
    }
}
/**
 * Initialize protocol handlers (must be called before app.ready)
 */
function initProtocolSchemes() {
    if (!protocolsInitialized) {
        registerProtocolScheme();
        protocolsInitialized = true;
    }
}
/**
 * Setup protocol handlers (call after app.ready)
 */
function setupProtocolHandlers() {
    try {
        (0, debug_1.debugLog)('Setting up protocol handlers...');
        // Register custom protocol handler
        registerProtocolHandler();
        // Setup deep link handling
        setupDeepLinkHandler();
        // Setup file protocol interceptor
        setupFileProtocolInterceptor();
        (0, debug_1.debugLog)('Protocol handlers setup completed');
    }
    catch (error) {
        console.error('Protocol handlers setup error:', error);
    }
}
/**
 * Cleanup protocol handlers
 */
function cleanupProtocolHandlers() {
    try {
        // Unregister protocols
        if (electron_1.protocol.isProtocolRegistered(APP_PROTOCOL)) {
            electron_1.protocol.unregisterProtocol(APP_PROTOCOL);
        }
        // Remove as default protocol client
        electron_1.app.removeAsDefaultProtocolClient(APP_PROTOCOL);
        (0, debug_1.debugLog)('Protocol handlers cleanup completed');
    }
    catch (error) {
        console.error('Protocol handlers cleanup error:', error);
    }
}
/**
 * Get protocol status
 */
function getProtocolStatus() {
    return {
        initialized: protocolsInitialized,
        registeredProtocols: electron_1.protocol.isProtocolRegistered(APP_PROTOCOL) ? [APP_PROTOCOL] : [],
        securityConfig: { ...securityConfig }
    };
}
//# sourceMappingURL=protocols.js.map