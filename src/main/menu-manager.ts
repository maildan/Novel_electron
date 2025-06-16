
import { app, Menu, BrowserWindow, shell, dialog, MenuItemConstructorOptions, WebContents } from 'electron';
import path from 'path';
import os from 'os';

/**
 * 메뉴 구성 옵션 인터페이스
 */
export interface MenuOptions {
  showPreferences?: boolean;
  showAbout?: boolean;
  showQuit?: boolean;
  showDevTools?: boolean;
  enableAutoUpdates?: boolean;
  appName?: string;
  recentFiles?: string[];
  items?: MenuItemConstructorOptions[];
}

/**
 * 컨텍스트 메뉴 구성 옵션 인터페이스
 */
export interface ContextMenuOptions {
  x?: number;
  y?: number;
  showInspect?: boolean;
  items?: MenuItemConstructorOptions[];
}

/**
 * 시스템 정보 인터페이스
 */
interface SystemInfo {
  platform: string;
  release: string;
  arch: string;
  totalMemory: string;
  freeMemory: string;
  cpus: number;
  uptime: string;
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  v8Version: string;
}

/**
 * 메뉴 액션 타입
 */
export type MenuAction = 
  | 'open-settings'
  | 'file-opened'
  | 'save'
  | 'save-as'
  | 'toggle-mini-view'
  | 'check-updates';

/**
 * 메뉴 액션 페이로드 인터페이스
 */
export interface MenuActionPayload {
  action: MenuAction;
  filePath?: string;
  data?: any;
}

/**
 * Electron 애플리케이션 메뉴 관리 클래스
 */
export class MenuManager {
  private static instance: MenuManager;
  private isInitialized = false;

  private constructor() {}

  /**
 * 싱글톤 인스턴스 반환
 */
  static getInstance(): MenuManager {
    if (!MenuManager.instance) {
      MenuManager.instance = new MenuManager();
    }
    return MenuManager.instance;
  }

  /**
 * 메뉴 매니저 초기화
 */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[Menu] 메뉴 매니저 초기화 시작');

    try {
      // 전역 컨텍스트 메뉴 이벤트 Setup
      this.setupContextMenuEvents();

      this.isInitialized = true;
      console.log('[Menu] 메뉴 매니저 초기화 Completed');
    } catch (error) {
      console.error('[Menu] 메뉴 매니저 초기화 Failed:', error);
      throw error;
    }
  }

  /**
 * 플랫폼 체크 헬퍼
 */
  private get platformInfo() {
    return {
      isMac: process.platform === 'darwin',
      isWindows: process.platform === 'win32',
      isLinux: process.platform === 'linux',
      isDev: process.env.NODE_ENV === 'development'
    };
  }

  /**
 * 메인 애플리케이션 메뉴 생성
 */
  createApplicationMenu(options: MenuOptions = {}): Menu {
    const { isMac, isWindows, isDev } = this.platformInfo;

    // Default options
    const defaultOptions: Required<MenuOptions> = {
      showPreferences: true,
      showAbout: true,
      showQuit: true,
      showDevTools: isDev,
      enableAutoUpdates: true,
      appName: app.getName(),
      recentFiles: [],
      items: []
    };

    // 옵션 병합
    const menuOptions = { ...defaultOptions, ...options };
    const recentFiles = menuOptions.recentFiles || [];

    // 애플리케이션 메뉴 템플릿
    const template: MenuItemConstructorOptions[] = [];

    // 앱 메뉴 (macOS에서만 앱 이름 표시)
    if (isMac) {
      template.push(this.createAppMenu(menuOptions));
    }

    // 파일 메뉴
    template.push(this.createFileMenu(menuOptions, recentFiles, isWindows, isMac));

    // 편집 메뉴
    template.push(this.createEditMenu(isMac));

    // 보기 메뉴
    template.push(this.createViewMenu(menuOptions.showDevTools));

    // 창 메뉴
    template.push(this.createWindowMenu(isMac));

    // 도움말 메뉴
    template.push(this.createHelpMenu(menuOptions, isMac));

    return Menu.buildFromTemplate(template);
  }

  /**
   * 앱 메뉴 생성 (macOS 전용)
   */
  private createAppMenu(options: Required<MenuOptions>): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [];

    if (options.showAbout) {
      submenu.push({ role: 'about' });
    }

    submenu.push({ type: 'separator' });

    if (options.showPreferences) {
      submenu.push({
        label: '환경Setup...',
        accelerator: 'Command+,',
        click: () => this.sendMenuAction({ action: 'open-settings' })
      });
    }

    submenu.push(
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' }
    );

    if (options.showQuit) {
      submenu.push({ role: 'quit' });
    }

    return {
      label: options.appName,
      submenu
    };
  }

  /**
 * 파일 메뉴 생성
 */
  private createFileMenu(
    options: Required<MenuOptions>,
    recentFiles: string[],
    isWindows: boolean,
    isMac: boolean
  ): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: '새 창',
        accelerator: 'CmdOrCtrl+N',
        click: () => this.createNewWindow()
      },
      { type: 'separator' },
      {
        label: '열기',
        accelerator: 'CmdOrCtrl+O',
        click: () => this.openFile()
      }
    ];

    // 최근 파일 하위 메뉴
    if (recentFiles.length > 0) {
      submenu.push({
        label: '최근 파일',
        submenu: recentFiles.map(file => ({
          label: path.basename(file),
          click: () => this.sendMenuAction({ 
            action: 'file-opened', 
            filePath: file 
          })
        }))
      });
    }

    submenu.push(
      { type: 'separator' },
      {
        label: '저장',
        accelerator: 'CmdOrCtrl+S',
        click: () => this.sendMenuAction({ action: 'save' })
      },
      {
        label: '다른 이름으로 저장...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => this.sendMenuAction({ action: 'save-as' })
      },
      { type: 'separator' }
    );

    // Windows 환경Setup 메뉴
    if (isWindows && options.showPreferences) {
      submenu.push(
        {
          label: '환경Setup',
          accelerator: 'Ctrl+,',
          click: () => this.sendMenuAction({ action: 'open-settings' })
        },
        { type: 'separator' }
      );
    }

    // 종료 메뉴 (macOS 제외)
    if (!isMac && options.showQuit) {
      submenu.push({
        role: 'quit',
        accelerator: 'Alt+F4'
      });
    }

    return {
      label: '파일',
      submenu: submenu.filter(Boolean)
    };
  }

  /**
 * 편집 메뉴 생성
 */
  private createEditMenu(isMac: boolean): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ];

    if (isMac) {
      submenu.push(
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: '음성',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      );
    } else {
      submenu.push(
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      );
    }

    return {
      label: '편집',
      submenu
    };
  }

  /**
 * 보기 메뉴 생성
 */
  private createViewMenu(showDevTools: boolean): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      { role: 'reload' },
      { role: 'forceReload' }
    ];

    if (showDevTools) {
      submenu.push({ role: 'toggleDevTools' });
    }

    submenu.push(
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      { type: 'separator' },
      {
        label: '미니뷰',
        accelerator: 'CmdOrCtrl+M',
        click: () => this.sendMenuAction({ action: 'toggle-mini-view' })
      }
    );

    return {
      label: '보기',
      submenu
    };
  }

  /**
 * 창 메뉴 생성
 */
  private createWindowMenu(isMac: boolean): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      { role: 'minimize' },
      { role: 'zoom' }
    ];

    if (isMac) {
      submenu.push(
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      );
    } else {
      submenu.push({ role: 'close' });
    }

    return {
      label: '창',
      submenu
    };
  }

  /**
 * 도움말 메뉴 생성
 */
  private createHelpMenu(options: Required<MenuOptions>, isMac: boolean): MenuItemConstructorOptions {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: '온라인 도움말',
        click: async () => {
          await shell.openExternal('https://help.loop.com');
        }
      },
      {
        label: '피드백 보내기',
        click: async () => {
          await shell.openExternal('https://loop.com/feedback');
        }
      },
      { type: 'separator' }
    ];

    if (options.enableAutoUpdates) {
      submenu.push({
        label: '업데이트 확인',
        click: () => this.sendMenuAction({ action: 'check-updates' })
      });
    }

    submenu.push(
      {
        label: '시스템 정보',
        click: () => this.showSystemInfo()
      },
      { type: 'separator' }
    );

    // About 메뉴 (Windows/Linux)
    if (!isMac && options.showAbout) {
      submenu.push({
        label: `${options.appName} 정보`,
        click: () => this.showAboutDialog(options.appName)
      });
    }

    return {
      role: 'help',
      submenu: submenu.filter(Boolean)
    };
  }

  /**
   * 컨텍스트 메뉴 생성 (우클릭 메뉴)
   */
  createContextMenu(options: ContextMenuOptions = {}): Menu {
    const template: MenuItemConstructorOptions[] = [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' },
      { type: 'separator' }
    ];

    // 추가 메뉴 항목
    if (options.items && Array.isArray(options.items)) {
      template.push(...options.items);
    }

    // 개발자 도구 (개발 모드에서만)
    if (options.showInspect !== false && process.env.NODE_ENV === 'development') {
      template.push(
        { type: 'separator' },
        {
          label: '요소 검사',
          click: (menuItem, browserWindow) => {
            if (browserWindow && 'webContents' in browserWindow) {
              (browserWindow as BrowserWindow).webContents.inspectElement(options.x || 0, options.y || 0);
            }
          }
        }
      );
    }

    return Menu.buildFromTemplate(template);
  }

  /**
 * 트레이 메뉴 생성
 */
  createTrayMenu(options: MenuOptions = {}): Menu {
    const appName = options.appName || app.getName();
    const template: MenuItemConstructorOptions[] = [
      {
        label: appName,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '창 열기',
        click: () => this.showAllWindows()
      },
      {
        label: '미니뷰 토글',
        click: () => this.sendMenuAction({ action: 'toggle-mini-view' })
      },
      { type: 'separator' },
      {
        label: 'Setup',
        click: () => {
          this.showAllWindows();
          this.sendMenuAction({ action: 'open-settings' });
        }
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => app.quit()
      }
    ];

    // 사용자 정의 메뉴 항목 추가
    if (options.items && Array.isArray(options.items)) {
      template.splice(template.length - 1, 0, ...options.items);
    }

    return Menu.buildFromTemplate(template);
  }

  /**
 * 애플리케이션 메뉴 Setup
 */
  setupApplicationMenu(options: MenuOptions = {}): void {
    const menu = this.createApplicationMenu(options);
    Menu.setApplicationMenu(menu);
  }

  /**
 * 전역 컨텍스트 메뉴 이벤트 Setup
 */
  private setupContextMenuEvents(): void {
    app.on('web-contents-created', (event, contents) => {
      contents.on('context-menu', (event, params) => {
        this.handleContextMenu(contents, params);
      });
    });
  }

  /**
 * 컨텍스트 메뉴 처리
 */
  private handleContextMenu(contents: WebContents, params: Electron.ContextMenuParams): void {
    const { x, y, isEditable, selectionText, editFlags, linkURL } = params;
    const menuItems: MenuItemConstructorOptions[] = [];

    // 링크 항목
    if (linkURL) {
      menuItems.push(
        {
          label: '링크 열기',
          click: () => shell.openExternal(linkURL)
        },
        {
          label: '링크 복사',
          click: () => require('electron').clipboard.writeText(linkURL)
        },
        { type: 'separator' }
      );
    }

    // 선택된 텍스트 항목
    if (selectionText) {
      menuItems.push({
        label: '복사',
        click: () => contents.copy()
      });

      // 검색 기능
      if (selectionText.length < 50) {
        menuItems.push({
          label: `"${selectionText}" 검색`,
          click: () => {
            shell.openExternal(
              `https://www.google.com/search?q=${encodeURIComponent(selectionText)}`
            );
          }
        });
      }

      menuItems.push({ type: 'separator' });
    }

    // 편집 가능한 항목
    if (isEditable) {
      menuItems.push(
        {
          label: '잘라내기',
          enabled: editFlags.canCut,
          click: () => contents.cut()
        },
        {
          label: '복사',
          enabled: editFlags.canCopy,
          click: () => contents.copy()
        },
        {
          label: '붙여넣기',
          enabled: editFlags.canPaste,
          click: () => contents.paste()
        },
        { type: 'separator' }
      );
    }

    // 개발자 도구
    if (process.env.NODE_ENV === 'development') {
      menuItems.push({
        label: '요소 검사',
        click: () => contents.inspectElement(x, y)
      });
    }

    // 메뉴 표시
    if (menuItems.length > 0) {
      const contextMenu = Menu.buildFromTemplate(menuItems);
      const window = BrowserWindow.fromWebContents(contents);
      if (window) {
        contextMenu.popup({ window });
      }
    }
  }

  /**
 * 새 창 생성
 */
  private createNewWindow(): void {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(app.getAppPath(), 'dist', 'main', 'main', 'preload.js')
      }
    });

    const port = process.env.PORT || 3000;
    win.loadURL(`http://localhost:${port}`);
  }

  /**
 * 파일 열기 대화상자
 */
  private async openFile(): Promise<void> {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return;

    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: '모든 파일', extensions: ['*'] }]
      });

      if (!canceled && filePaths.length > 0) {
        this.sendMenuAction({
          action: 'file-opened',
          filePath: filePaths[0]
        });
      }
    } catch (error) {
      console.error('[Menu] 파일 열기 Error:', error);
    }
  }

  /**
 * 모든 윈도우 표시
 */
  private showAllWindows(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.show();
      }
    }
  }

  /**
 * 메뉴 액션 전송
 */
  private sendMenuAction(payload: MenuActionPayload): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('menu-action', payload);
      }
    }
  }

  /**
 * 시스템 정보 표시
 */
  private showSystemInfo(): void {
    const systemInfo: SystemInfo = {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      totalMemory: Math.round(os.totalmem() / (1024 * 1024)) + ' MB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
      cpus: os.cpus().length,
      uptime: Math.round(os.uptime() / 60) + ' 분',
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      v8Version: process.versions.v8
    };

    dialog.showMessageBox({
      title: '시스템 정보',
      message: '시스템 정보',
      detail: Object.entries(systemInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
      buttons: ['확인']
    });
  }

  /**
   * About 대화상자 표시
   */
  private showAboutDialog(appName: string): void {
    dialog.showMessageBox({
      title: `${appName} 정보`,
      message: appName,
      detail: `버전: ${app.getVersion()}\n${app.getName()} - 현대적인 타이핑 분석 도구`,
      buttons: ['확인']
    });
  }

  /**
 * Cleanup 작업
 */
  async cleanup(): Promise<void> {
    console.log('[Menu] 메뉴 매니저 Cleanup 시작');
    this.isInitialized = false;
    console.log('[Menu] 메뉴 매니저 Cleanup Completed');
  }
}

// 싱글톤 인스턴스 내보내기
export const menuManager = MenuManager.getInstance();
export default menuManager;
