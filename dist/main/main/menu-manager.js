"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuManager = exports.MenuManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
/**
 * Electron 애플리케이션 메뉴 관리 클래스
 */
class MenuManager {
    constructor() {
        this.isInitialized = false;
    }
    /**
     * 싱글톤 인스턴스 반환
     */
    static getInstance() {
        if (!MenuManager.instance) {
            MenuManager.instance = new MenuManager();
        }
        return MenuManager.instance;
    }
    /**
     * 메뉴 매니저 초기화
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        console.log('[Menu] 메뉴 매니저 초기화 시작');
        try {
            // 전역 컨텍스트 메뉴 이벤트 설정
            this.setupContextMenuEvents();
            this.isInitialized = true;
            console.log('[Menu] 메뉴 매니저 초기화 완료');
        }
        catch (error) {
            console.error('[Menu] 메뉴 매니저 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 플랫폼 체크 헬퍼
     */
    get platformInfo() {
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
    createApplicationMenu(options = {}) {
        const { isMac, isWindows, isDev } = this.platformInfo;
        // 기본 옵션
        const defaultOptions = {
            showPreferences: true,
            showAbout: true,
            showQuit: true,
            showDevTools: isDev,
            enableAutoUpdates: true,
            appName: electron_1.app.getName(),
            recentFiles: [],
            items: []
        };
        // 옵션 병합
        const menuOptions = { ...defaultOptions, ...options };
        const recentFiles = menuOptions.recentFiles || [];
        // 애플리케이션 메뉴 템플릿
        const template = [];
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
        return electron_1.Menu.buildFromTemplate(template);
    }
    /**
     * 앱 메뉴 생성 (macOS 전용)
     */
    createAppMenu(options) {
        const submenu = [];
        if (options.showAbout) {
            submenu.push({ role: 'about' });
        }
        submenu.push({ type: 'separator' });
        if (options.showPreferences) {
            submenu.push({
                label: '환경설정...',
                accelerator: 'Command+,',
                click: () => this.sendMenuAction({ action: 'open-settings' })
            });
        }
        submenu.push({ type: 'separator' }, { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' });
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
    createFileMenu(options, recentFiles, isWindows, isMac) {
        const submenu = [
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
                    label: path_1.default.basename(file),
                    click: () => this.sendMenuAction({
                        action: 'file-opened',
                        filePath: file
                    })
                }))
            });
        }
        submenu.push({ type: 'separator' }, {
            label: '저장',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.sendMenuAction({ action: 'save' })
        }, {
            label: '다른 이름으로 저장...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.sendMenuAction({ action: 'save-as' })
        }, { type: 'separator' });
        // Windows 환경설정 메뉴
        if (isWindows && options.showPreferences) {
            submenu.push({
                label: '환경설정',
                accelerator: 'Ctrl+,',
                click: () => this.sendMenuAction({ action: 'open-settings' })
            }, { type: 'separator' });
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
    createEditMenu(isMac) {
        const submenu = [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' }
        ];
        if (isMac) {
            submenu.push({ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }, { type: 'separator' }, {
                label: '음성',
                submenu: [
                    { role: 'startSpeaking' },
                    { role: 'stopSpeaking' }
                ]
            });
        }
        else {
            submenu.push({ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' });
        }
        return {
            label: '편집',
            submenu
        };
    }
    /**
     * 보기 메뉴 생성
     */
    createViewMenu(showDevTools) {
        const submenu = [
            { role: 'reload' },
            { role: 'forceReload' }
        ];
        if (showDevTools) {
            submenu.push({ role: 'toggleDevTools' });
        }
        submenu.push({ type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }, { type: 'separator' }, {
            label: '미니뷰',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.sendMenuAction({ action: 'toggle-mini-view' })
        });
        return {
            label: '보기',
            submenu
        };
    }
    /**
     * 창 메뉴 생성
     */
    createWindowMenu(isMac) {
        const submenu = [
            { role: 'minimize' },
            { role: 'zoom' }
        ];
        if (isMac) {
            submenu.push({ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' });
        }
        else {
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
    createHelpMenu(options, isMac) {
        const submenu = [
            {
                label: '온라인 도움말',
                click: async () => {
                    await electron_1.shell.openExternal('https://help.loop.com');
                }
            },
            {
                label: '피드백 보내기',
                click: async () => {
                    await electron_1.shell.openExternal('https://loop.com/feedback');
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
        submenu.push({
            label: '시스템 정보',
            click: () => this.showSystemInfo()
        }, { type: 'separator' });
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
    createContextMenu(options = {}) {
        const template = [
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
            template.push({ type: 'separator' }, {
                label: '요소 검사',
                click: (menuItem, browserWindow) => {
                    if (browserWindow && 'webContents' in browserWindow) {
                        browserWindow.webContents.inspectElement(options.x || 0, options.y || 0);
                    }
                }
            });
        }
        return electron_1.Menu.buildFromTemplate(template);
    }
    /**
     * 트레이 메뉴 생성
     */
    createTrayMenu(options = {}) {
        const appName = options.appName || electron_1.app.getName();
        const template = [
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
                label: '설정',
                click: () => {
                    this.showAllWindows();
                    this.sendMenuAction({ action: 'open-settings' });
                }
            },
            { type: 'separator' },
            {
                label: '종료',
                click: () => electron_1.app.quit()
            }
        ];
        // 사용자 정의 메뉴 항목 추가
        if (options.items && Array.isArray(options.items)) {
            template.splice(template.length - 1, 0, ...options.items);
        }
        return electron_1.Menu.buildFromTemplate(template);
    }
    /**
     * 애플리케이션 메뉴 설정
     */
    setupApplicationMenu(options = {}) {
        const menu = this.createApplicationMenu(options);
        electron_1.Menu.setApplicationMenu(menu);
    }
    /**
     * 전역 컨텍스트 메뉴 이벤트 설정
     */
    setupContextMenuEvents() {
        electron_1.app.on('web-contents-created', (event, contents) => {
            contents.on('context-menu', (event, params) => {
                this.handleContextMenu(contents, params);
            });
        });
    }
    /**
     * 컨텍스트 메뉴 처리
     */
    handleContextMenu(contents, params) {
        const { x, y, isEditable, selectionText, editFlags, linkURL } = params;
        const menuItems = [];
        // 링크 항목
        if (linkURL) {
            menuItems.push({
                label: '링크 열기',
                click: () => electron_1.shell.openExternal(linkURL)
            }, {
                label: '링크 복사',
                click: () => require('electron').clipboard.writeText(linkURL)
            }, { type: 'separator' });
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
                        electron_1.shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(selectionText)}`);
                    }
                });
            }
            menuItems.push({ type: 'separator' });
        }
        // 편집 가능한 항목
        if (isEditable) {
            menuItems.push({
                label: '잘라내기',
                enabled: editFlags.canCut,
                click: () => contents.cut()
            }, {
                label: '복사',
                enabled: editFlags.canCopy,
                click: () => contents.copy()
            }, {
                label: '붙여넣기',
                enabled: editFlags.canPaste,
                click: () => contents.paste()
            }, { type: 'separator' });
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
            const contextMenu = electron_1.Menu.buildFromTemplate(menuItems);
            const window = electron_1.BrowserWindow.fromWebContents(contents);
            if (window) {
                contextMenu.popup({ window });
            }
        }
    }
    /**
     * 새 창 생성
     */
    createNewWindow() {
        const win = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path_1.default.join(electron_1.app.getAppPath(), 'preload.js')
            }
        });
        const port = process.env.PORT || 3000;
        win.loadURL(`http://localhost:${port}`);
    }
    /**
     * 파일 열기 대화상자
     */
    async openFile() {
        const mainWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (!mainWindow)
            return;
        try {
            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                filters: [{ name: '모든 파일', extensions: ['*'] }]
            });
            if (!canceled && filePaths.length > 0) {
                this.sendMenuAction({
                    action: 'file-opened',
                    filePath: filePaths[0]
                });
            }
        }
        catch (error) {
            console.error('[Menu] 파일 열기 오류:', error);
        }
    }
    /**
     * 모든 윈도우 표시
     */
    showAllWindows() {
        for (const win of electron_1.BrowserWindow.getAllWindows()) {
            if (!win.isDestroyed()) {
                win.show();
            }
        }
    }
    /**
     * 메뉴 액션 전송
     */
    sendMenuAction(payload) {
        for (const win of electron_1.BrowserWindow.getAllWindows()) {
            if (!win.isDestroyed()) {
                win.webContents.send('menu-action', payload);
            }
        }
    }
    /**
     * 시스템 정보 표시
     */
    showSystemInfo() {
        const systemInfo = {
            platform: os_1.default.platform(),
            release: os_1.default.release(),
            arch: os_1.default.arch(),
            totalMemory: Math.round(os_1.default.totalmem() / (1024 * 1024)) + ' MB',
            freeMemory: Math.round(os_1.default.freemem() / (1024 * 1024)) + ' MB',
            cpus: os_1.default.cpus().length,
            uptime: Math.round(os_1.default.uptime() / 60) + ' 분',
            appVersion: electron_1.app.getVersion(),
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            nodeVersion: process.versions.node,
            v8Version: process.versions.v8
        };
        electron_1.dialog.showMessageBox({
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
    showAboutDialog(appName) {
        electron_1.dialog.showMessageBox({
            title: `${appName} 정보`,
            message: appName,
            detail: `버전: ${electron_1.app.getVersion()}\n${electron_1.app.getName()} - 현대적인 타이핑 분석 도구`,
            buttons: ['확인']
        });
    }
    /**
     * 정리 작업
     */
    async cleanup() {
        console.log('[Menu] 메뉴 매니저 정리 시작');
        this.isInitialized = false;
        console.log('[Menu] 메뉴 매니저 정리 완료');
    }
}
exports.MenuManager = MenuManager;
// 싱글톤 인스턴스 내보내기
exports.menuManager = MenuManager.getInstance();
exports.default = exports.menuManager;
//# sourceMappingURL=menu-manager.js.map