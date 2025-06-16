/**
 * 커스텀 프로토콜 핸들러 및 보안 관리 모듈
 * 앱 전용 프로토콜, URL 라우팅, 보안 파일 접근을 처리합니다
 */
import { app, protocol, net, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import { debugLog } from '../utils/debug';

// 커스텀 프로토콜 구성
const APP_PROTOCOL = 'loop';
const ALLOWED_FILE_EXTENSIONS = [
  '.html', '.css', '.js', '.ts', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.ico', '.pdf', '.txt', '.md'
];

// MIME 타입 매핑
const MIME_TYPES: Record<string, string> = {
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

// 보안 구성
interface SecurityConfig {
  allowedOrigins: string[];
  allowedProtocols: string[];
  maxFileSize: number; // bytes
  enableCORS: boolean;
  strictMode: boolean;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedOrigins: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  allowedProtocols: ['http:', 'https:', 'file:', `${APP_PROTOCOL}:`],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  enableCORS: true,
  strictMode: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
};

// 전역 상태
let protocolsInitialized = false;
let securityConfig: SecurityConfig = { ...DEFAULT_SECURITY_CONFIG };

/**
 * 파일 경로를 프로토콜 URL로 변환
 */
export function filePathToProtocolUrl(filePath: string): string {
  const relativePath = path.relative(app.getAppPath(), filePath);
  return `${APP_PROTOCOL}://${relativePath.replace(/\\/g, '/')}`;
}

/**
 * Convert protocol URL to file path
 */
export function protocolUrlToFilePath(protocolUrl: string): string {
  const url = new URL(protocolUrl);
  if (url.protocol !== `${APP_PROTOCOL}:`) {
    throw new Error(`Invalid protocol: ${url.protocol}`);
  }

  const relativePath = url.hostname + url.pathname;
  return path.join(app.getAppPath(), relativePath);
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if file extension is allowed
 */
function isAllowedFileExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}

/**
 * Validate file access permissions
 */
function validateFileAccess(filePath: string): boolean {
  try {
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // 파일 확장자 확인
    if (!isAllowedFileExtension(filePath)) {
      debugLog('허용되지 않은 파일 확장자: ${path.extname(filePath)}');
      return false;
    }

    // 파일 크기 확인
    const stats = fs.statSync(filePath);
    if (stats.size > securityConfig.maxFileSize) {
      debugLog('파일이 너무 큼: ${stats.size} bytes');
      return false;
    }

    // 엄격 모드에서의 추가 보안 검사
    if (securityConfig.strictMode) {
      // 파일이 앱 디렉토리 또는 사용자 데이터 디렉토리 내에 있는지 확인
      const appPath = app.getAppPath();
      const userDataPath = app.getPath('userData');
      const resolvedPath = path.resolve(filePath);
      
      if (!resolvedPath.startsWith(appPath) && !resolvedPath.startsWith(userDataPath)) {
        debugLog('파일 Access denied - 허용된 디렉토리 밖: ${resolvedPath}');
        return false;
      }
    }

    return true;
  } catch (error) {
    debugLog('파일 접근 유효성 검사 Error: ${error}');
    return false;
  }
}

/**
 * Create response headers with security settings
 */
function createSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

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
  if (!app.isPackaged) {
    headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' ws: wss:;";
  }

  return headers;
}

/**
 * Handle custom protocol requests
 */
function handleProtocolRequest(request: Electron.ProtocolRequest): Electron.ProtocolResponse {
  try {
    const url = new URL(request.url);
    debugLog('프로토콜 요청: ${request.url}');

    // 파일 경로로 변환
    const filePath = protocolUrlToFilePath(request.url);
    debugLog('해결된 파일 경로: ${filePath}');

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
  } catch (error) {
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
function registerProtocolScheme(): void {
  try {
    // Register protocol as standard and secure
    protocol.registerSchemesAsPrivileged([
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

    debugLog('Protocol scheme registered: ${APP_PROTOCOL}');
  } catch (error) {
    console.error('Protocol scheme registration error:', error);
  }
}

/**
 * Register protocol handler
 */
function registerProtocolHandler(): void {
  try {
    const success = protocol.registerBufferProtocol(APP_PROTOCOL, (request, callback) => {
      const response = handleProtocolRequest(request);
      callback(response);
    });

    if (success) {
      debugLog('Protocol handler registered: ${APP_PROTOCOL}');
    } else {
      console.error('Failed to register protocol handler: ${APP_PROTOCOL}');
    }
  } catch (error) {
    console.error('Protocol handler registration error:', error);
  }
}

/**
 * Handle deep links and URL schemes
 */
function setupDeepLinkHandler(): void {
  // Set as default protocol client
  if (!app.isDefaultProtocolClient(APP_PROTOCOL)) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL);
  }

  // Handle second instance for deep links
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    debugLog('Second instance detected with command line:', commandLine);
    
    // Find protocol URL in command line
    const protocolUrl = commandLine.find(arg => arg.startsWith(`${APP_PROTOCOL}://`));
    if (protocolUrl) {
      handleDeepLink(protocolUrl);
    }
  });

  // Handle open-url event (macOS)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    debugLog('Open URL event: ${url}');
    handleDeepLink(url);
  });
}

/**
 * Handle deep link navigation
 */
function handleDeepLink(url: string): void {
  try {
    debugLog('Handling deep link: ${url}');
    
    const parsedUrl = new URL(url);
    
    // Get main window
    const mainWindow = BrowserWindow.getAllWindows()[0];
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
  } catch (error) {
    console.error('Deep link handling error:', error);
  }
}

/**
 * Intercept and handle file protocol requests
 */
function setupFileProtocolInterceptor(): void {
  try {
    protocol.interceptFileProtocol('file', (request, callback) => {
      const url = request.url.substr(7); // Remove 'file://' prefix
      const filePath = path.normalize(decodeURI(url));
      
      if (validateFileAccess(filePath)) {
        callback({ path: filePath });
      } else {
        callback({ error: -6 }); // FILE_NOT_FOUND
      }
    });
    
    debugLog('File protocol interceptor setup completed');
  } catch (error) {
    console.error('File protocol interceptor setup error:', error);
  }
}

/**
 * Update security configuration
 */
export function updateSecurityConfig(config: Partial<SecurityConfig>): void {
  securityConfig = { ...securityConfig, ...config };
  debugLog('Security configuration updated:', securityConfig);
}

/**
 * Add allowed origin
 */
export function addAllowedOrigin(origin: string): void {
  if (!securityConfig.allowedOrigins.includes(origin)) {
    securityConfig.allowedOrigins.push(origin);
    debugLog('Added allowed origin: ${origin}');
  }
}

/**
 * Remove allowed origin
 */
export function removeAllowedOrigin(origin: string): void {
  const index = securityConfig.allowedOrigins.indexOf(origin);
  if (index > -1) {
    securityConfig.allowedOrigins.splice(index, 1);
    debugLog('Removed allowed origin: ${origin}');
  }
}

/**
 * Initialize protocol handlers (must be called before app.ready)
 */
export function initProtocolSchemes(): void {
  if (!protocolsInitialized) {
    registerProtocolScheme();
    protocolsInitialized = true;
  }
}

/**
 * Setup protocol handlers (call after app.ready)
 */
export function setupProtocolHandlers(): void {
  try {
    debugLog('Setting up protocol handlers...');
    
    // Register custom protocol handler
    registerProtocolHandler();
    
    // Setup deep link handling
    setupDeepLinkHandler();
    
    // Setup file protocol interceptor
    setupFileProtocolInterceptor();
    
    debugLog('Protocol handlers setup completed');
  } catch (error) {
    console.error('Protocol handlers setup error:', error);
  }
}

/**
 * Cleanup protocol handlers
 */
export function cleanupProtocolHandlers(): void {
  try {
    // Unregister protocols
    if (protocol.isProtocolRegistered(APP_PROTOCOL)) {
      protocol.unregisterProtocol(APP_PROTOCOL);
    }
    
    // Remove as default protocol client
    app.removeAsDefaultProtocolClient(APP_PROTOCOL);
    
    debugLog('Protocol handlers cleanup completed');
  } catch (error) {
    console.error('Protocol handlers cleanup error:', error);
  }
}

/**
 * Get protocol status
 */
export function getProtocolStatus(): {
  initialized: boolean;
  registeredProtocols: string[];
  securityConfig: SecurityConfig;
} {
  return {
    initialized: protocolsInitialized,
    registeredProtocols: protocol.isProtocolRegistered(APP_PROTOCOL) ? [APP_PROTOCOL] : [],
    securityConfig: { ...securityConfig }
  };
}
