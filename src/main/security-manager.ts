/**
 * 보안 Setup 관리 모듈
 * 
 * Electron 앱의 보안 헤더, CSP(Content Security Policy), 요청 필터링 등을 관리합니다.
 * 개발 환경과 프로덕션 환경에서 다른 보안 정책을 적용합니다.
 */

import { session, app, BrowserWindow, ipcMain, Session, WebContents } from 'electron';

// 보안 Setup 인터페이스
export interface SecurityConfig {
  csp: {
    enabled: boolean;
    strictMode: boolean;
    allowUnsafeInline: boolean;
    allowUnsafeEval: boolean;
    allowedDomains: string[];
  };
  headers: {
    enabled: boolean;
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXSSProtection: string;
  };
  navigation: {
    restrictExternalNavigation: boolean;
    allowedProtocols: string[];
    allowedDomains: string[];
  };
  windows: {
    restrictWindowOpen: boolean;
    allowedProtocols: string[];
  };
}

// IME 상태 인터페이스
export interface IMEState {
  isComposing: boolean;
  lastCompletedText: string;
  compositionStart?: number;
  lastTimestamp?: number;
}

// 보안 헤더 응답 인터페이스
interface SecurityHeadersResponse {
  responseHeaders?: Record<string, string[]>;
}

// 개발 모드 확인
const isDev = process.env.NODE_ENV === 'development';
const disableSecurity = process.env.DISABLE_SECURITY === 'true';
const disableCSP = process.env.DISABLE_CSP === 'true';

/**
 * 보안 관리자 클래스
 */
export class SecurityManager {
  private config: SecurityConfig;
  private imeState: IMEState;
  private isInitialized: boolean = false;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = this.getDefaultConfig(config);
    this.imeState = {
      isComposing: false,
      lastCompletedText: ''
    };
  }

  /**
 * 보안 관리자 초기화
 */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('[Security] Initializing security manager (dev: ${isDev}, disableSecurity: ${disableSecurity})');

      if (disableSecurity) {
        console.log('[Security] Security disabled by environment variable');
        this.isInitialized = true;
        return true;
      }

      // CSP 적용
      if (this.config.csp.enabled && !disableCSP) {
        await this.applyCSPToAllSessions();
      }

      // 키보드 이벤트 핸들러 Setup
      this.setupKeyboardEventHandlers();

      // 웹 콘텐츠 보안 Setup
      this.setupWebContentsSecurity();

      this.isInitialized = true;
      console.log('[Security] Security manager initialized successfully');
      return true;
    } catch (error) {
      console.error('[Security] Failed to initialize security manager:', error);
      return false;
    }
  }

  /**
 * 특정 창에 대한 요청 보안 검사 Setup
 */
  setupRequestSecurity(window: BrowserWindow): boolean {
    try {
      if (!window?.webContents) {
        return false;
      }

      const webContents = window.webContents;

      // 새 창 열기 제어
      webContents.setWindowOpenHandler(({ url }) => {
        if (this.isUrlAllowedForWindow(url)) {
          return { action: 'allow' };
        }
        console.warn('[Security] Blocked window open for URL: ${url}');
        return { action: 'deny' };
      });

      // 네비게이션 제어
      webContents.on('will-navigate', (event, url) => {
        if (!this.isUrlAllowedForNavigation(url)) {
          console.warn('[Security] Blocked navigation to URL: ${url}');
          event.preventDefault();
        }
      });

      return true;
    } catch (error) {
      console.error('[Security] Failed to setup request security:', error);
      return false;
    }
  }

  /**
   * CSP 업데이트
   */
  updateCSP(newConfig: Partial<SecurityConfig['csp']>): boolean {
    try {
      this.config.csp = { ...this.config.csp, ...newConfig };
      
      if (this.config.csp.enabled && !disableCSP) {
        this.applyCSPToAllSessions();
      }
      
      return true;
    } catch (error) {
      console.error('[Security] Failed to update CSP:', error);
      return false;
    }
  }

  /**
   * IME 상태 가져오기
   */
  getIMEState(): IMEState {
    return { ...this.imeState };
  }

  /**
   * IME 상태 초기화
   */
  resetIMEState(): void {
    this.imeState = {
      isComposing: false,
      lastCompletedText: ''
    };
  }

  /**
 * 기본 Setup 가져오기
 */
  private getDefaultConfig(customConfig?: Partial<SecurityConfig>): SecurityConfig {
    const defaultConfig: SecurityConfig = {
      csp: {
        enabled: true,
        strictMode: !isDev,
        allowUnsafeInline: isDev,
        allowUnsafeEval: isDev,
        allowedDomains: ['localhost', '127.0.0.1']
      },
      headers: {
        enabled: true,
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block'
      },
      navigation: {
        restrictExternalNavigation: !isDev,
        allowedProtocols: ['https:', 'http:', 'file:'],
        allowedDomains: ['localhost', '127.0.0.1']
      },
      windows: {
        restrictWindowOpen: !isDev,
        allowedProtocols: ['https:', 'http:']
      }
    };

    return this.mergeConfig(defaultConfig, customConfig);
  }

  /**
 * Setup 병합
 */
  private mergeConfig(defaultConfig: SecurityConfig, customConfig?: Partial<SecurityConfig>): SecurityConfig {
    if (!customConfig) {
      return defaultConfig;
    }

    return {
      csp: { ...defaultConfig.csp, ...customConfig.csp },
      headers: { ...defaultConfig.headers, ...customConfig.headers },
      navigation: { ...defaultConfig.navigation, ...customConfig.navigation },
      windows: { ...defaultConfig.windows, ...customConfig.windows }
    };
  }

  /**
   * CSP 문자열 생성
   */
  private generateCSPString(): string {
    const { csp } = this.config;
    
    if (isDev && !csp.strictMode) {
      // 개발 모드: HMR과 React 개발 도구를 위해 완화된 정책
      return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:"
      ].join('; ');
    }

    // 프로덕션 모드: 보안 강화
    const directives = [
      "default-src 'self'",
      `script-src 'self'${csp.allowUnsafeEval ? " 'unsafe-eval'" : ''}`,
      `style-src 'self'${csp.allowUnsafeInline ? " 'unsafe-inline'" : ''}`,
      "img-src 'self' data: blob:",
      "font-src 'self' data:"
    ];

    if (csp.allowedDomains.length > 0) {
      directives.push(`connect-src 'self' ${csp.allowedDomains.join(' ')}`);
    }

    return directives.join('; ');
  }

  /**
 * 보안 헤더 생성
 */
  private getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.csp.enabled) {
      headers['Content-Security-Policy'] = this.generateCSPString();
    }

    if (this.config.headers.enabled) {
      headers['X-Content-Type-Options'] = this.config.headers.xContentTypeOptions;
      headers['X-Frame-Options'] = this.config.headers.xFrameOptions;
      headers['X-XSS-Protection'] = this.config.headers.xXSSProtection;
    }

    return headers;
  }

  /**
 * 보안 헤더 적용
 */
  private applySecurityHeaders(details: any, callback?: (response: SecurityHeadersResponse) => void): void {
    if (details.responseHeaders) {
      const securityHeaders = this.getSecurityHeaders();
      
      for (const [header, value] of Object.entries(securityHeaders)) {
        if (details.responseHeaders[header]) {
          delete details.responseHeaders[header];
        }
        details.responseHeaders[header] = [value];
      }
    }

    if (callback && typeof callback === 'function') {
      callback({ responseHeaders: details.responseHeaders });
    }
  }

  /**
   * 특정 세션에 CSP 등록
   */
  private registerCSPForSession(sess: Session): boolean {
    if (!sess || typeof sess.webRequest?.onHeadersReceived !== 'function') {
      console.error('[Security] Invalid session object:', sess);
      return false;
    }

    try {
      // 기존 리스너 제거 (중복 방지)
      sess.webRequest.onHeadersReceived(null);

      // 새 CSP Setup 적용
      sess.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
        this.applySecurityHeaders(details, callback);
      });

      console.log('[Security] CSP registered for session (strict: ${this.config.csp.strictMode})');
      return true;
    } catch (error) {
      console.error('[Security] Failed to register CSP for session:', error);
      return false;
    }
  }

  /**
   * 모든 세션에 CSP 적용
   */
  private async applyCSPToAllSessions(): Promise<boolean> {
    try {
      // 기본 세션에 CSP 적용
      this.registerCSPForSession(session.defaultSession);

      // 모든 세션에 CSP 적용 (파티션된 세션 포함)
      const allSessions = (session as any).getAllSessions?.() || [];
      console.log('[Security] Applying CSP to all sessions (count: ${allSessions.length + 1})');

      allSessions.forEach((sess: any, idx: number) => {
        try {
          console.log('[Security] Applying CSP to session #${idx + 1}');
          this.registerCSPForSession(sess);
        } catch (error) {
          console.error('[Security] Failed to apply CSP to session #${idx + 1}:', error);
        }
      });

      console.log('[Security] CSP applied to all sessions');
      return true;
    } catch (error) {
      console.error('[Security] Failed to apply CSP to all sessions:', error);

      // Error가 발생한 경우에도 기본 세션만이라도 시도
      try {
        console.warn('[Security] Fallback: Applying CSP to default session only');
        this.registerCSPForSession(session.defaultSession);
        return true;
      } catch (fallbackError) {
        console.error('[Security] Even fallback CSP application failed:', fallbackError);
        return false;
      }
    }
  }

  /**
 * 웹 콘텐츠 보안 Setup
 */
  private setupWebContentsSecurity(): void {
    app.on('web-contents-created', (event, contents) => {
      // 팝업 차단
      contents.setWindowOpenHandler(({ url }) => {
        if (this.isUrlAllowedForWindow(url)) {
          return { action: 'allow' };
        }
        console.log('[Security] Blocked external URL open: ${url}');
        return { action: 'deny' };
      });

      // 탐색 차단
      contents.on('will-navigate', (evt, navUrl) => {
        if (!this.isUrlAllowedForNavigation(navUrl)) {
          console.log('[Security] Blocked navigation: ${navUrl}');
          evt.preventDefault();
        }
      });
    });
  }

  /**
   * URL이 창 열기에 허용되는지 확인
   */
  private isUrlAllowedForWindow(url: string): boolean {
    if (!this.config.windows.restrictWindowOpen) {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      return this.config.windows.allowedProtocols.includes(parsedUrl.protocol) ||
             this.config.navigation.allowedDomains.includes(parsedUrl.hostname);
    } catch (error) {
      return false;
    }
  }

  /**
   * URL이 네비게이션에 허용되는지 확인
   */
  private isUrlAllowedForNavigation(url: string): boolean {
    if (!this.config.navigation.restrictExternalNavigation) {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      return this.config.navigation.allowedProtocols.includes(parsedUrl.protocol) &&
             (this.config.navigation.allowedDomains.includes(parsedUrl.hostname) ||
              parsedUrl.hostname === 'localhost' ||
              parsedUrl.hostname === '127.0.0.1');
    } catch (error) {
      return false;
    }
  }

  /**
 * 키보드 이벤트 핸들러 Setup
 */
  private setupKeyboardEventHandlers(): void {
    try {
      // 기존 핸들러 제거 (중복 방지)
      this.removeExistingKeyboardHandlers();

      // 키보드 이벤트 핸들러 등록
      ipcMain.handle('sendKeyboardEvent', async (event, data) => {
        console.log('[Security] IPC keyboard event received:', data?.type || 'unknown');
        const mainWindow = BrowserWindow.getFocusedWindow();
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('keyboard-event-from-main', data);
        }
        return { success: true };
      });

      ipcMain.handle('keyboard-event', async (event, data) => {
        console.log('[Security] IPC keyboard event received:', data?.type || 'unknown');
        const mainWindow = BrowserWindow.getFocusedWindow();
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('keyboard-event-from-main', data);
        }
        return { success: true };
      });

      // IME Composition 이벤트 처리
      ipcMain.on('ime-composition-event', (event, data) => {
        if (!data) return;

        console.log('[Security] IME composition event:', data.type);
        const { type, text, timestamp } = data;

        if (type === 'compositionend' && text) {
          this.imeState.isComposing = false;
          this.imeState.lastCompletedText = text;
          this.imeState.lastTimestamp = timestamp;

          // 렌더러에게 완성된 텍스트 알림
          const mainWindow = BrowserWindow.getFocusedWindow();
          if (mainWindow?.webContents) {
            mainWindow.webContents.send('ime-composition-completed', {
              text,
              timestamp,
              source: 'security-manager'
            });
          }
        } else if (type === 'compositionstart') {
          this.imeState.isComposing = true;
          this.imeState.compositionStart = timestamp;
        }

        event.reply('ime-composition-event-reply', { success: true });
      });

      // 마지막 완성된 IME 텍스트 요청 처리
      ipcMain.handle('get-last-completed-text', () => {
        return this.imeState.lastCompletedText || '';
      });

      // 키보드 연결 테스트
      ipcMain.handle('test-keyboard-connection', async () => {
        try {
          return {
            success: true,
            handlersRegistered: true,
            imeState: this.imeState,
            timestamp: Date.now()
          };
        } catch (error) {
          console.error('[Security] Keyboard connection test failed:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });

      // 프리로드 API 초기화 확인
      ipcMain.on('preload-api-ready', (event, data) => {
        console.log('[Security] Preload API initialization confirmed:', data);
        try {
          if (event.sender) {
            event.sender.send('preload-api-acknowledged', {
              success: true,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('[Security] Failed to acknowledge preload API:', error);
        }
      });

      ipcMain.on('preload-api-failed', (event, data) => {
        console.error('[Security] Preload API initialization failed:', data);
        try {
          if (event.sender) {
            console.log('[Security] Attempting automatic recovery');
            setTimeout(() => {
              try {
                event.sender.reload();
              } catch (reloadError) {
                console.error('[Security] Failed to reload window:', reloadError);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('[Security] Failed to handle preload API failure:', error);
        }
      });

      console.log('[Security] Keyboard event handlers registered successfully');
    } catch (error) {
      console.error('[Security] Failed to setup keyboard event handlers:', error);
    }
  }

  /**
 * 기존 키보드 핸들러 제거
 */
  private removeExistingKeyboardHandlers(): void {
    try {
      const handlers = [
        'sendKeyboardEvent',
        'keyboard-event',
        'ime-composition-event',
        'get-last-completed-text',
        'test-keyboard-connection'
      ];

      handlers.forEach(handler => {
        try {
          ipcMain.removeHandler(handler);
          ipcMain.removeAllListeners(handler);
        } catch (error) {
          // 핸들러가 존재하지 않는 경우 무시
        }
      });

      // 이벤트 리스너들도 제거
      const events = [
        'preload-api-ready',
        'preload-api-failed',
        'keyboard-handler-initialized'
      ];

      events.forEach(event => {
        try {
          ipcMain.removeAllListeners(event);
        } catch (error) {
          // 이벤트가 존재하지 않는 경우 무시
        }
      });
    } catch (error) {
      console.error('[Security] Failed to remove existing keyboard handlers:', error);
    }
  }
}

// 싱글톤 인스턴스
let securityManager: SecurityManager | null = null;

/**
 * 보안 관리자 인스턴스 가져오기
 */
export function getSecurityManager(config?: Partial<SecurityConfig>): SecurityManager {
  if (!securityManager) {
    securityManager = new SecurityManager(config);
  }
  return securityManager;
}

/**
 * 편의 함수들
 */
export const security = {
  /**
   * 보안 관리자 초기화
 */
  async initialize(config?: Partial<SecurityConfig>): Promise<boolean> {
    return await getSecurityManager(config).initialize();
  },

  /**
 * 특정 창에 요청 보안 Setup
 */
  setupRequestSecurity(window: BrowserWindow): boolean {
    return getSecurityManager().setupRequestSecurity(window);
  },

  /**
   * CSP 업데이트
   */
  updateCSP(newConfig: Partial<SecurityConfig['csp']>): boolean {
    return getSecurityManager().updateCSP(newConfig);
  },

  /**
   * IME 상태 가져오기
   */
  getIMEState(): IMEState {
    return getSecurityManager().getIMEState();
  },

  /**
   * IME 상태 초기화
   */
  resetIMEState(): void {
    getSecurityManager().resetIMEState();
  }
};

export default security;
