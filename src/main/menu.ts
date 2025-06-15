/**
 * 앱 메뉴 관리 모듈
 * 
 * Electron 앱의 메뉴바, 컨텍스트 메뉴, 그리고 다양한 메뉴 액션을 관리합니다.
 * 플랫폼별 메뉴 구조와 동적 메뉴 업데이트를 지원합니다.
 */

import { app, Menu, BrowserWindow, MenuItem, shell, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';

// 타입 정의
interface MenuOptions {
  showPreferences?: boolean;
  showAbout?: boolean;
  showQuit?: boolean;
  showDevTools?: boolean;
  enableAutoUpdates?: boolean;
  appName?: string;
  recentFiles?: string[];
  customMenuItems?: CustomMenuItem[];
}

interface CustomMenuItem {
  label?: string; // separator인 경우 label이 불필요하므로 옵셔널로 변경
  accelerator?: string;
  role?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  click?: () => void;
  submenu?: CustomMenuItem[];
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
}

interface MenuAction {
  action: string;
  data?: any;
  timestamp?: number;
}

interface RecentFile {
  path: string;
  name: string;
  lastAccessed: number;
}

// 상수
const MAX_RECENT_FILES = 10;
const MENU_CATEGORIES = {
  FILE: 'file',
  EDIT: 'edit',
  VIEW: 'view',
  WINDOW: 'window',
  HELP: 'help',
  CUSTOM: 'custom'
} as const;

// 내부 상태
let currentMenu: Menu | null = null;
const recentFiles: RecentFile[] = [];
const menuActionHistory: MenuAction[] = [];
let menuOptions: MenuOptions = {};

/**
 * 메뉴 관리 시스템 초기화
 */
export function initializeMenu(options: MenuOptions = {}): void {
  try {
    menuOptions = {
      showPreferences: true,
      showAbout: true,
      showQuit: true,
      showDevTools: process.env.NODE_ENV === 'development',
      enableAutoUpdates: true,
      appName: app.getName(),
      recentFiles: [],
      ...options
    };

    // 메뉴 생성 및 Setup
    currentMenu = createApplicationMenu(menuOptions);
    Menu.setApplicationMenu(currentMenu);

    // IPC 핸들러 Setup
    setupMenuIpcHandlers();

    // 최근 파일 목록 로드
    loadRecentFiles();

    console.log('메뉴 시스템이 초기화되었습니다.');

  } catch (error) {
    console.error('메뉴 초기화 Error:', error);
  }
}

/**
 * 메인 애플리케이션 메뉴 생성
 */
function createApplicationMenu(options: MenuOptions): Menu {
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';
  const isDev = process.env.NODE_ENV === 'development';

  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

  // macOS 앱 메뉴
  if (isMac) {
    template.push(createAppMenu(options));
  }

  // 파일 메뉴
  template.push(createFileMenu(options));

  // 편집 메뉴
  template.push(createEditMenu(options));

  // 보기 메뉴
  template.push(createViewMenu(options));

  // 윈도우 메뉴
  template.push(createWindowMenu(options));

  // 도움말 메뉴
  template.push(createHelpMenu(options));

  // 개발 메뉴 (개발 환경에서만)
  if (isDev && options.showDevTools) {
    template.push(createDevelopmentMenu());
  }

  // 커스텀 메뉴 추가
  if (options.customMenuItems) {
    template.push(...options.customMenuItems.map(item => convertToMenuItemOptions(item)));
  }

  return Menu.buildFromTemplate(template);
}

/**
 * macOS 앱 메뉴 생성
 */
function createAppMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  const submenu: Electron.MenuItemConstructorOptions[] = [];

  if (options.showAbout) {
    submenu.push({
      label: `${options.appName} 정보`,
      role: 'about'
    });
    submenu.push({ type: 'separator' });
  }

  if (options.showPreferences) {
    submenu.push({
      label: '환경Setup...',
      accelerator: 'Command+,',
      click: () => handleMenuAction('open-settings')
    });
    submenu.push({ type: 'separator' });
  }

  submenu.push(
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
    { type: 'separator' }
  );

  if (options.showQuit) {
    submenu.push({
      label: `${options.appName} 종료`,
      role: 'quit'
    });
  }

  return {
    label: options.appName || app.getName(),
    submenu
  };
}

/**
 * 파일 메뉴 생성
 */
function createFileMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  const submenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: '새 창',
      accelerator: 'CmdOrCtrl+N',
      click: () => handleMenuAction('new-window')
    },
    {
      label: '새 탭',
      accelerator: 'CmdOrCtrl+T',
      click: () => handleMenuAction('new-tab')
    },
    { type: 'separator' },
    {
      label: '열기...',
      accelerator: 'CmdOrCtrl+O',
      click: () => handleFileOpen()
    }
  ];

  // 최근 파일 메뉴
  if (recentFiles.length > 0) {
    submenu.push({
      label: '최근 파일',
      submenu: recentFiles.map(file => ({
        label: file.name,
        click: () => handleMenuAction('open-recent-file', { path: file.path })
      }))
    });
  }

  submenu.push(
    { type: 'separator' },
    {
      label: '저장',
      accelerator: 'CmdOrCtrl+S',
      click: () => handleMenuAction('save')
    },
    {
      label: '다른 이름으로 저장...',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: () => handleMenuAction('save-as')
    },
    { type: 'separator' },
    {
      label: '내보내기...',
      submenu: [
        {
          label: 'PDF로 내보내기',
          click: () => handleMenuAction('export-pdf')
        },
        {
          label: '이미지로 내보내기',
          click: () => handleMenuAction('export-image')
        }
      ]
    }
  );

  // Windows/Linux에서 종료 메뉴 추가
  if (process.platform !== 'darwin' && options.showQuit) {
    submenu.push(
      { type: 'separator' },
      {
        label: '종료',
        accelerator: process.platform === 'win32' ? 'Alt+F4' : 'CmdOrCtrl+Q',
        click: () => app.quit()
      }
    );
  }

  return {
    label: '파일',
    submenu
  };
}

/**
 * 편집 메뉴 생성
 */
function createEditMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  return {
    label: '편집',
    submenu: [
      { role: 'undo', label: '실행 취소' },
      { role: 'redo', label: '다시 실행' },
      { type: 'separator' },
      { role: 'cut', label: '잘라내기' },
      { role: 'copy', label: '복사' },
      { role: 'paste', label: '붙여넣기' },
      { role: 'selectAll', label: '모두 선택' },
      { type: 'separator' },
      {
        label: '찾기...',
        accelerator: 'CmdOrCtrl+F',
        click: () => handleMenuAction('find')
      },
      {
        label: '바꾸기...',
        accelerator: 'CmdOrCtrl+H',
        click: () => handleMenuAction('replace')
      }
    ]
  };
}

/**
 * 보기 메뉴 생성
 */
function createViewMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  const submenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'reload', label: '새로고침' },
    { role: 'forceReload', label: '강제 새로고침' },
    { type: 'separator' },
    { role: 'resetZoom', label: '실제 크기' },
    { role: 'zoomIn', label: '확대' },
    { role: 'zoomOut', label: '축소' },
    { type: 'separator' },
    { role: 'togglefullscreen', label: '전체 화면' }
  ];

  if (options.showDevTools) {
    submenu.push(
      { type: 'separator' },
      { role: 'toggleDevTools', label: '개발자 도구' }
    );
  }

  return {
    label: '보기',
    submenu
  };
}

/**
 * 윈도우 메뉴 생성
 */
function createWindowMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  const submenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'minimize', label: '최소화' },
    { role: 'close', label: '닫기' }
  ];

  if (process.platform === 'darwin') {
    submenu.push(
      { type: 'separator' },
      { role: 'front', label: '모두 앞으로 가져오기' },
      { type: 'separator' },
      { role: 'window', label: '윈도우' }
    );
  }

  return {
    label: '윈도우',
    submenu
  };
}

/**
 * 도움말 메뉴 생성
 */
function createHelpMenu(options: MenuOptions): Electron.MenuItemConstructorOptions {
  const submenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: '온라인 도움말',
      click: () => shell.openExternal('https://help.example.com')
    },
    {
      label: '키보드 단축키',
      click: () => handleMenuAction('show-shortcuts')
    },
    { type: 'separator' },
    {
      label: '문제 신고...',
      click: () => shell.openExternal('https://github.com/example/issues')
    }
  ];

  // Windows/Linux에서 정보 메뉴 추가
  if (process.platform !== 'darwin' && options.showAbout) {
    submenu.push(
      { type: 'separator' },
      {
        label: `${options.appName} 정보`,
        click: () => handleMenuAction('show-about')
      }
    );
  }

  return {
    label: '도움말',
    submenu
  };
}

/**
 * 개발 메뉴 생성 (개발 환경에서만)
 */
function createDevelopmentMenu(): Electron.MenuItemConstructorOptions {
  return {
    label: '개발',
    submenu: [
      {
        label: '개발자 도구',
        accelerator: 'F12',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          }
        }
      },
      {
        label: '앱 다시 시작',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: () => {
          app.relaunch();
          app.exit(0);
        }
      },
      { type: 'separator' },
      {
        label: '메모리 정보',
        click: () => handleMenuAction('show-memory-info')
      },
      {
        label: 'GPU 정보',
        click: () => handleMenuAction('show-gpu-info')
      }
    ]
  };
}

/**
 * 커스텀 메뉴 아이템을 Electron 형식으로 변환
 */
function convertToMenuItemOptions(item: CustomMenuItem): Electron.MenuItemConstructorOptions {
  const options: Electron.MenuItemConstructorOptions = {
    label: item.label,
    type: item.type || 'normal'
  };

  if (item.accelerator) options.accelerator = item.accelerator;
  if (item.role) options.role = item.role as any;
  if (item.click) options.click = item.click;
  if (item.enabled !== undefined) options.enabled = item.enabled;
  if (item.visible !== undefined) options.visible = item.visible;
  if (item.checked !== undefined) options.checked = item.checked;

  if (item.submenu) {
    options.submenu = item.submenu.map(subItem => convertToMenuItemOptions(subItem));
  }

  return options;
}

/**
 * 메뉴 액션 처리
 */
function handleMenuAction(action: string, data?: any): void {
  try {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    
    // 액션 Add to history
    menuActionHistory.unshift({
      action,
      data,
      timestamp: Date.now()
    });

    // 히스토리 크기 제한
    if (menuActionHistory.length > 50) {
      menuActionHistory.splice(50);
    }

    // 렌더러 프로세스에 메뉴 액션 전송
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      focusedWindow.webContents.send('menu-action', {
        action,
        data,
        timestamp: Date.now()
      });
    }

    // 특정 액션들의 메인 프로세스 처리
    switch (action) {
      case 'new-window':
        createNewWindow();
        break;
      case 'show-about':
        showAboutDialog();
        break;
      case 'show-memory-info':
        showMemoryInfo();
        break;
      case 'show-gpu-info':
        showGpuInfo();
        break;
    }

    console.log('메뉴 액션 실행: ${action}');

  } catch (error) {
    console.error('메뉴 액션 처리 Error (${action}):', error);
  }
}

/**
 * 파일 열기 다이얼로그 처리
 */
async function handleFileOpen(): Promise<void> {
  try {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '모든 파일', extensions: ['*'] },
        { name: '텍스트 파일', extensions: ['txt', 'md', 'json'] },
        { name: '이미지', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] }
      ]
    });

    if (!canceled && filePaths.length > 0) {
      for (const filePath of filePaths) {
        addToRecentFiles(filePath);
        handleMenuAction('file-opened', { path: filePath });
      }
      
      // 메뉴 업데이트
      updateMenu();
    }

  } catch (error) {
    console.error('파일 열기 Error:', error);
  }
}

/**
 * 새 윈도우 생성
 */
function createNewWindow(): void {
  try {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    const port = process.env.PORT || 5500;
    win.loadURL(`http://localhost:${port}`);

    console.log('새 윈도우 생성됨');

  } catch (error) {
    console.error('새 윈도우 생성 Error:', error);
  }
}

/**
 * About 다이얼로그 표시
 */
function showAboutDialog(): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  
  dialog.showMessageBox(focusedWindow || BrowserWindow.getAllWindows()[0], {
    type: 'info',
    title: `${menuOptions.appName} 정보`,
    message: menuOptions.appName || app.getName(),
    detail: [
      `버전: ${app.getVersion()}`,
      `Electron: ${process.versions.electron}`,
      `Node.js: ${process.versions.node}`,
      `OS: ${os.type()} ${os.release()}`,
      `아키텍처: ${os.arch()}`
    ].join('\n'),
    buttons: ['확인']
  });
}

/**
 * 메모리 정보 표시
 */
function showMemoryInfo(): void {
  const memoryUsage = process.memoryUsage();
  const systemMemory = os.totalmem();
  const freeMemory = os.freemem();

  const info = [
    `앱 메모리 사용량:`,
    `- RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    `- Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    `- Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    `- External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    ``,
    `시스템 메모리:`,
    `- 총 메모리: ${Math.round(systemMemory / 1024 / 1024 / 1024)} GB`,
    `- 사용 가능: ${Math.round(freeMemory / 1024 / 1024 / 1024)} GB`
  ].join('\n');

  dialog.showMessageBox({
    type: 'info',
    title: '메모리 정보',
    message: '메모리 사용량',
    detail: info,
    buttons: ['확인']
  });
}

/**
 * GPU 정보 표시
 */
function showGpuInfo(): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  
  if (focusedWindow) {
    focusedWindow.webContents.send('menu-action', {
      action: 'show-gpu-info',
      timestamp: Date.now()
    });
  }
}

/**
 * 최근 파일 목록에 추가
 */
function addToRecentFiles(filePath: string): void {
  try {
    const fileName = path.basename(filePath);
    const existingIndex = recentFiles.findIndex(file => file.path === filePath);

    if (existingIndex !== -1) {
      // 이미 존재하면 맨 앞으로 이동
      const existing = recentFiles.splice(existingIndex, 1)[0];
      existing.lastAccessed = Date.now();
      recentFiles.unshift(existing);
    } else {
      // 새로 추가
      recentFiles.unshift({
        path: filePath,
        name: fileName,
        lastAccessed: Date.now()
      });
    }

    // 최대 개수 제한
    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles.splice(MAX_RECENT_FILES);
    }

    // 저장
    saveRecentFiles();

  } catch (error) {
    console.error('최근 파일 추가 Error:', error);
  }
}

/**
 * 최근 파일 목록 로드
 */
function loadRecentFiles(): void {
  try {
    // 실제 구현에서는 Setup 파일이나 데이터베이스에서 로드
    console.log('최근 파일 목록 로드됨');
  } catch (error) {
    console.error('최근 파일 로드 Error:', error);
  }
}

/**
 * 최근 파일 목록 저장
 */
function saveRecentFiles(): void {
  try {
    // 실제 구현에서는 Setup 파일이나 데이터베이스에 저장
    console.log('최근 파일 목록 저장됨');
  } catch (error) {
    console.error('최근 파일 저장 Error:', error);
  }
}

/**
 * 메뉴 업데이트
 */
export function updateMenu(newOptions?: Partial<MenuOptions>): void {
  try {
    if (newOptions) {
      menuOptions = { ...menuOptions, ...newOptions };
    }

    const newMenu = createApplicationMenu(menuOptions);
    Menu.setApplicationMenu(newMenu);
    currentMenu = newMenu;

    console.log('메뉴 업데이트 Completed');

  } catch (error) {
    console.error('메뉴 업데이트 Error:', error);
  }
}

/**
 * 컨텍스트 메뉴 생성
 */
export function createContextMenu(options: {
  x: number;
  y: number;
  window?: BrowserWindow;
  items?: CustomMenuItem[];
}): void {
  try {
    const defaultItems: CustomMenuItem[] = [
      { label: '잘라내기', role: 'cut' },
      { label: '복사', role: 'copy' },
      { label: '붙여넣기', role: 'paste' },
      { type: 'separator' },
      { label: '모두 선택', role: 'selectAll' }
    ];

    const menuItems = options.items || defaultItems;
    const template = menuItems.map(item => convertToMenuItemOptions(item));
    const contextMenu = Menu.buildFromTemplate(template);

    if (options.window) {
      contextMenu.popup({
        window: options.window,
        x: options.x,
        y: options.y
      });
    }

  } catch (error) {
    console.error('컨텍스트 메뉴 생성 Error:', error);
  }
}

/**
 * IPC 핸들러 Setup
 */
function setupMenuIpcHandlers(): void {
  // 메뉴 업데이트 요청
  ipcMain.handle('menu:update', (event, options: Partial<MenuOptions>) => {
    updateMenu(options);
    return true;
  });

  // 컨텍스트 메뉴 생성 요청
  ipcMain.handle('menu:show-context', (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      createContextMenu({ ...options, window });
    }
    return true;
  });

  // 최근 파일 목록 조회
  ipcMain.handle('menu:get-recent-files', () => {
    return recentFiles;
  });

  // 메뉴 액션 히스토리 조회
  ipcMain.handle('menu:get-action-history', () => {
    return menuActionHistory.slice(0, 20);
  });

  // 최근 파일에 추가
  ipcMain.handle('menu:add-recent-file', (event, filePath: string) => {
    addToRecentFiles(filePath);
    updateMenu();
    return true;
  });
}

/**
 * 메뉴 통계 조회
 */
export function getMenuStats(): {
  totalRecentFiles: number;
  totalActions: number;
  lastActionTime: number | null;
} {
  return {
    totalRecentFiles: recentFiles.length,
    totalActions: menuActionHistory.length,
    lastActionTime: menuActionHistory.length > 0 ? (menuActionHistory[0]?.timestamp ?? null) : null
  };
}
