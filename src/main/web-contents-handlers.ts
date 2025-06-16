/**
 * 웹 콘텐츠 이벤트 핸들러 모듈
 *
 * Electron 웹 콘텐츠 관련 이벤트 처리 및 보안 Setup을 관리합니다.
 * - 새 윈도우 열기 제한 및 보안 검사
 * - 컨텍스트 메뉴 Setup 및 커스터마이징
 * - 권한 요청 처리 (알림, 카메라, 마이크 등)
 * - Error 처리 및 충돌 복구
 * - iframe/webview 보안 Setup
 */

import { app, dialog, WebContents, BrowserWindow, Menu, shell, clipboard } from 'electron';
// import { initializeSecuritySettings } from './security-manager'; // 함수가 export되지 않음

/**
 * 웹 콘텐츠 컨텍스트 메뉴 파라미터
 */
interface ContextMenuParams {
  x: number;
  y: number;
  linkURL: string;
  linkText: string;
  pageURL: string;
  frameURL: string;
  srcURL: string;
  mediaType: 'none' | 'image' | 'audio' | 'video' | 'canvas' | 'file' | 'plugin';
  hasImageContents: boolean;
  isEditable: boolean;
  selectionText: string;
  titleText: string;
  misspelledWord: string;
  dictionarySuggestions: string[];
  frameCharset: string;
  inputFieldType: string;
  menuSourceType: 'none' | 'mouse' | 'keyboard' | 'touch' | 'touchMenu' | 'longPress' | 'longTap' | 'touchHandle' | 'stylus' | 'adjustSelection' | 'adjustSelectionReset';
  mediaFlags: {
    inError: boolean;
    isPaused: boolean;
    isMuted: boolean;
    hasAudio: boolean;
    isLooping: boolean;
    isControlsVisible: boolean;
    canToggleControls: boolean;
    canRotate: boolean;
  };
  editFlags: {
    canUndo: boolean;
    canRedo: boolean;
    canCut: boolean;
    canCopy: boolean;
    canPaste: boolean;
    canDelete: boolean;
    canSelectAll: boolean;
  };
}

/**
 * 렌더러 프로세스 종료 상세 정보
 */
interface ProcessGoneDetails {
  reason: 'clean-exit' | 'abnormal-exit' | 'killed' | 'crashed' | 'oom' | 'launch-failed' | 'integrity-failure';
  exitCode: number;
}

/**
 * 윈도우 열기 핸들러 옵션
 */
interface WindowOpenHandlerResponse {
  action: 'deny' | 'allow';
  outlivesOpener?: boolean;
  overrideBrowserWindowOptions?: Electron.BrowserWindowConstructorOptions;
}

/**
 * webview 파라미터
 */
interface WebviewParams {
  src: string;
  [key: string]: any;
}

/**
 * 허용된 URL 패턴 관리 클래스
 */
class URLManager {
  private static allowedPatterns: string[] = [
    'https://api.loop.com',
    'https://docs.loop.com',
    'https://support.loop.com',
    'https://update.loop.com',
    'https://cdn.loop.com',
    'https://auth.loop.com'
  ];

  private static blockedPatterns: string[] = [
    'javascript:',
    'data:',
    'vbscript:',
    'about:blank'
  ];

  /**
   * URL이 허용되는지 확인
   */
  static isAllowed(url: string): boolean {
    // 개발 환경에서 로컬호스트 허용
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = url.startsWith('http://localhost:') || 
                       url.startsWith('http://127.0.0.1:') ||
                       url.startsWith('https://localhost:');

    if (isDev && isLocalhost) {
      return true;
    }

    // 차단된 패턴 확인
    if (this.blockedPatterns.some(pattern => url.startsWith(pattern))) {
      return false;
    }

    // 허용된 패턴 확인
    return this.allowedPatterns.some(pattern => url.startsWith(pattern));
  }

  /**
   * 안전한 URL인지 확인 (webview용)
   */
  static isSafeForWebview(url: string): boolean {
    return url.startsWith('https://') || 
           url.startsWith('http://localhost:') ||
           url.startsWith('file://');
  }

  /**
 * 허용된 패턴 추가
 */
  static addAllowedPattern(pattern: string): void {
    if (!this.allowedPatterns.includes(pattern)) {
      this.allowedPatterns.push(pattern);
    }
  }

  /**
 * 차단된 패턴 추가
 */
  static addBlockedPattern(pattern: string): void {
    if (!this.blockedPatterns.includes(pattern)) {
      this.blockedPatterns.push(pattern);
    }
  }
}

/**
 * 컨텍스트 메뉴 빌더 클래스
 */
class ContextMenuBuilder {
  private items: Electron.MenuItemConstructorOptions[] = [];

  /**
 * 링크 관련 메뉴 항목 추가
 */
  addLinkItems(linkURL: string): this {
    if (linkURL) {
      this.items.push(
        {
          label: '링크 복사',
          click: () => clipboard.writeText(linkURL)
        },
        {
          label: '새 창에서 링크 열기',
          click: () => shell.openExternal(linkURL)
        },
        { type: 'separator' }
      );
    }
    return this;
  }

  /**
 * 텍스트 선택 관련 메뉴 항목 추가
 */
  addSelectionItems(selectionText: string): this {
    if (selectionText) {
      this.items.push(
        {
          label: '복사',
          click: () => clipboard.writeText(selectionText)
        },
        {
          label: '검색',
          click: () => shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(selectionText)}`)
        },
        { type: 'separator' }
      );
    }
    return this;
  }

  /**
 * 편집 관련 메뉴 항목 추가
 */
  addEditItems(isEditable: boolean, editFlags: ContextMenuParams['editFlags']): this {
    if (isEditable) {
      const editItems: Electron.MenuItemConstructorOptions[] = [];

      if (editFlags.canUndo) editItems.push({ role: 'undo' });
      if (editFlags.canRedo) editItems.push({ role: 'redo' });
      if (editItems.length > 0) editItems.push({ type: 'separator' });

      if (editFlags.canCut) editItems.push({ role: 'cut' });
      if (editFlags.canCopy) editItems.push({ role: 'copy' });
      if (editFlags.canPaste) editItems.push({ role: 'paste' });
      if (editFlags.canDelete) editItems.push({ role: 'delete' });
      if (editItems.length > 4) editItems.push({ type: 'separator' });

      if (editFlags.canSelectAll) editItems.push({ role: 'selectAll' });

      this.items.push(...editItems);
    }
    return this;
  }

  /**
 * 이미지 관련 메뉴 항목 추가
 */
  addImageItems(srcURL: string, hasImageContents: boolean): this {
    if (hasImageContents && srcURL) {
      this.items.push(
        { type: 'separator' },
        {
          label: '이미지 복사',
          click: async () => {
            try {
              const nativeImage = await clipboard.readImage();
              clipboard.writeImage(nativeImage);
            } catch (error) {
              console.error('이미지 복사 Failed:', error);
            }
          }
        },
        {
          label: '이미지 주소 복사',
          click: () => clipboard.writeText(srcURL)
        },
        {
          label: '새 탭에서 이미지 보기',
          click: () => shell.openExternal(srcURL)
        }
      );
    }
    return this;
  }

  /**
 * 개발자 도구 메뉴 항목 추가
 */
  addDeveloperItems(contents: WebContents): this {
    if (process.env.NODE_ENV === 'development') {
      this.items.push(
        { type: 'separator' },
        {
          label: '개발자 도구',
          click: () => contents.openDevTools()
        },
        {
          label: '페이지 새로고침',
          click: () => contents.reload()
        }
      );
    }
    return this;
  }

  /**
 * 메뉴 빌드 및 표시
 */
  build(contents: WebContents, x: number, y: number): void {
    if (this.items.length === 0) return;

    // 마지막 구분선 제거
    if (this.items[this.items.length - 1].type === 'separator') {
      this.items.pop();
    }

    const menu = Menu.buildFromTemplate(this.items);
    const window = BrowserWindow.fromWebContents(contents);
    
    menu.popup({ 
      window: window || undefined, 
      x, 
      y,
      callback: () => {
        // 메뉴가 닫힐 때 Cleanup 작업
        this.items = [];
      }
    });
  }
}

/**
 * 권한 관리 클래스
 */
class PermissionManager {
  private static allowedPermissions: Set<string> = new Set([
    'notifications',
    'clipboard-read',
    'clipboard-write'
  ]);

  private static restrictedPermissions: Set<string> = new Set([
    'camera',
    'microphone',
    'geolocation',
    'midi',
    'background-sync'
  ]);

  /**
 * 권한 요청 처리
 */
  static handlePermissionRequest(
    webContents: WebContents,
    permission: string,
    callback: (granted: boolean) => void,
    details?: any
  ): void {
    console.log('[웹콘텐츠 권한 관리] 요청된 권한:', permission, '웹콘텐츠 ID:', webContents.id, '세부사항:', details);
    // 개발 환경에서는 대부분의 권한 허용
    if (process.env.NODE_ENV === 'development') {
      console.log('[개발 모드] 권한 허용: ${permission}');
      return callback(true);
    }

    // 허용된 권한
    if (this.allowedPermissions.has(permission)) {
      console.log('권한 허용: ${permission}');
      return callback(true);
    }

    // 제한된 권한은 사용자에게 확인
    if (this.restrictedPermissions.has(permission)) {
      this.showPermissionDialog(permission, callback);
      return;
    }

    // 기본적으로 거부
    console.warn('권한 거부: ${permission}');
    callback(false);
  }

  /**
 * 권한 요청 다이얼로그 표시
 */
  private static async showPermissionDialog(
    permission: string,
    callback: (granted: boolean) => void
  ): Promise<void> {
    const permissionNames: Record<string, string> = {
      'camera': '카메라',
      'microphone': '마이크',
      'geolocation': '위치 정보',
      'midi': 'MIDI 장치',
      'background-sync': '백그라운드 동기화'
    };

    const permissionName = permissionNames[permission] || permission;

    try {
      const result = await dialog.showMessageBox({
        type: 'question',
        title: '권한 요청',
        message: `이 사이트에서 ${permissionName} 사용을 허용하시겠습니까?`,
        detail: '이 권한은 사이트의 기능을 사용하는 데 필요할 수 있습니다.',
        buttons: ['허용', '거부'],
        defaultId: 1,
        cancelId: 1
      });

      callback(result.response === 0);
    } catch (error) {
      console.error('권한 다이얼로그 Error:', error);
      callback(false);
    }
  }
}

/**
 * 웹 콘텐츠 생성 시 보안 및 기능 Setup
 */
export function setupWebContentsHandlers(contents: WebContents): void {
  // 새 윈도우 열기 제한
  contents.setWindowOpenHandler(({ url }): WindowOpenHandlerResponse => {
    console.log('새 윈도우 요청: ${url}');

    if (URLManager.isAllowed(url)) {
      // 허용된 URL은 외부 브라우저에서 열기
      shell.openExternal(url);
    } else {
      console.warn('차단된 URL: ${url}');
    }

    return { action: 'deny' };
  });

  // 컨텍스트 메뉴 Setup
  (contents as any).on('context-menu', (event: any, params: ContextMenuParams) => {
    console.log('[컨텍스트 메뉴] 이벤트 발생:', event.type, '파라미터:', params.x, params.y);
    const menuBuilder = new ContextMenuBuilder();

    menuBuilder
      .addLinkItems(params.linkURL)
      .addSelectionItems(params.selectionText)
      .addEditItems(params.isEditable, params.editFlags)
      .addImageItems(params.srcURL, params.hasImageContents)
      .addDeveloperItems(contents)
      .build(contents, params.x, params.y);
  });

  // 권한 요청 처리
  contents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    PermissionManager.handlePermissionRequest(webContents, permission, callback, details);
  });

  // 콘솔 메시지 로깅
  contents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('[콘솔 메시지 수신] 레벨:', level, '메시지:', message, '라인:', line, '소스ID:', sourceId, '이벤트 객체:', typeof event);
    const levels = ['verbose', 'info', 'warning', 'error'];
    const levelName = levels[level] || 'info';
    
    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebContents ${levelName.toUpperCase()}] ${message} (${sourceId}:${line})`);
    } else if (level >= 2) { // warning, error만 프로덕션에서 출력
      console.log(`[WebContents ${levelName.toUpperCase()}] ${message}`);
    }
  });

  // 페이지 로드 Failed 처리
  contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.log('[페이지 로드 실패] 이벤트:', typeof event, '에러코드:', errorCode, '에러설명:', errorDescription, 'URL:', validatedURL, '메인프레임:', isMainFrame);
    if (!isMainFrame) return; // 메인 프레임만 처리

    console.error(`페이지 로드 Failed: ${errorDescription} (${errorCode}) - ${validatedURL}`);

    // 네트워크 Error일 경우
    if (errorCode === -3 || errorCode === -106 || errorCode === -21) {
      const offlinePage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>연결 Error</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; }
            .error-icon { font-size: 48px; margin-bottom: 20px; }
            .error-title { font-size: 24px; margin-bottom: 10px; }
            .error-message { color: #666; margin-bottom: 20px; }
            .retry-button { 
              background: #007ACC; color: white; border: none; 
              padding: 10px 20px; border-radius: 4px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="error-icon">🌐</div>
          <div class="error-title">연결할 수 없습니다</div>
          <div class="error-message">인터넷 연결을 확인하고 다시 시도해주세요.</div>
          <button class="retry-button" onclick="window.location.reload()">다시 시도</button>
        </body>
        </html>
      `;
      
      contents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlinePage)}`);
    }
  });

  // 렌더러 프로세스 충돌 처리
  contents.on('render-process-gone', async (event, details: ProcessGoneDetails) => {
    console.log('[렌더러 프로세스 종료] 이벤트:', typeof event, '세부사항:', details);
    const { reason, exitCode } = details;
    console.error(`렌더러 프로세스 종료: ${reason} (exit code: ${exitCode})`);

    // 충돌 통계 수집 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.log('Process gone details:', details);
    }

    try {
      const result = await dialog.showMessageBox({
        type: 'error',
        title: '애플리케이션 Error',
        message: '예상치 못한 Error가 발생했습니다.',
        detail: reason === 'crashed' 
          ? '애플리케이션이 비정상적으로 종료되었습니다. 다시 시작하시겠습니까?'
          : '애플리케이션을 다시 시작해주세요.',
        buttons: ['다시 시작', '닫기'],
        defaultId: 0,
        cancelId: 1
      });

      if (result.response === 0) {
        app.relaunch();
      }
      app.exit(exitCode || 1);
    } catch (error) {
      console.error('Error 다이얼로그 표시 Failed:', error);
      app.exit(1);
    }
  });

  // 응답하지 않는 프로세스 처리
  contents.on('unresponsive', async () => {
    console.warn('웹 콘텐츠가 응답하지 않습니다');

    try {
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: '응답 없음',
        message: '페이지가 응답하지 않습니다.',
        detail: '페이지를 다시 로드하시겠습니까?',
        buttons: ['다시 로드', '기다리기'],
        defaultId: 0
      });

      if (result.response === 0) {
        contents.reload();
      }
    } catch (error) {
      console.error('응답없음 다이얼로그 Error:', error);
    }
  });

  // 응답 복구
  contents.on('responsive', () => {
    console.log('웹 콘텐츠 응답 복구');
  });
}

/**
 * 앱 전체 웹 콘텐츠 이벤트 핸들러 Setup
 */
export function initializeWebContentsHandlers(): void {
  console.log('웹 콘텐츠 핸들러 초기화 중...');

  // 보안 Setup 초기화
  try {
    // initializeSecuritySettings(); // 현재 사용할 수 없음
    console.log('보안 Setup 초기화 스킵됨');
  } catch (error) {
    console.error('보안 Setup 초기화 Failed:', error);
  }

  // 새로운 웹 콘텐츠 생성 감지
  app.on('web-contents-created', (event, contents) => {
    console.log('[웹콘텐츠 생성] 이벤트:', typeof event, '타입:', contents.getType(), 'ID:', contents.id);
    console.log(`새 웹 콘텐츠 생성: ${contents.getType()}`);
    
    setupWebContentsHandlers(contents);

    // iframe, webview 보안 설정
    (contents as any).on('will-attach-webview', (event: any, webPreferences: any, params: WebviewParams) => {
      console.log('webview 연결 시도: ${params.src}');

      // 보안 Setup 강화
      delete webPreferences.nodeIntegration;
      delete webPreferences.nodeIntegrationInWorker;
      delete webPreferences.experimentalFeatures;

      // 필수 보안 옵션 Setup
      webPreferences.contextIsolation = true;
      webPreferences.sandbox = true;
      webPreferences.webSecurity = true;
      webPreferences.allowRunningInsecureContent = false;
      webPreferences.nodeIntegration = false;
      webPreferences.nodeIntegrationInWorker = false;
      // webPreferences.enableRemoteModule = false; // 더 이상 사용되지 않음

      // URL 유효성 검사
      if (!URLManager.isSafeForWebview(params.src)) {
        console.warn('안전하지 않은 webview URL 차단: ${params.src}');
        event.preventDefault();
        return;
      }

      console.log('webview 연결 허용: ${params.src}');
    });

    // 자식 프로세스 스폰 방지
    contents.on('will-prevent-unload', (event) => {
      // beforeunload 이벤트 처리
      console.log('[페이지 언로드 방지] 이벤트:', typeof event, '페이지 URL:', contents.getURL());
      console.log('페이지 unload 방지 시도');
    });
  });

  console.log('웹 콘텐츠 핸들러 초기화 Completed');
}

/**
 * URL 관리 유틸리티 내보내기
 */
export { URLManager };

/**
 * 기본 내보내기
 */
export default {
  setupWebContentsHandlers,
  initializeWebContentsHandlers,
  URLManager,
  PermissionManager
};
