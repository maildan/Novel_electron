import { Menu, MenuItemConstructorOptions } from 'electron';
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
 * 메뉴 액션 타입
 */
export type MenuAction = 'open-settings' | 'file-opened' | 'save' | 'save-as' | 'toggle-mini-view' | 'check-updates';
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
export declare class MenuManager {
    private static instance;
    private isInitialized;
    private constructor();
    /**
     * 싱글톤 인스턴스 반환
     */
    static getInstance(): MenuManager;
    /**
     * 메뉴 매니저 초기화
     */
    initialize(): Promise<void>;
    /**
     * 플랫폼 체크 헬퍼
     */
    private get platformInfo();
    /**
     * 메인 애플리케이션 메뉴 생성
     */
    createApplicationMenu(options?: MenuOptions): Menu;
    /**
     * 앱 메뉴 생성 (macOS 전용)
     */
    private createAppMenu;
    /**
     * 파일 메뉴 생성
     */
    private createFileMenu;
    /**
     * 편집 메뉴 생성
     */
    private createEditMenu;
    /**
     * 보기 메뉴 생성
     */
    private createViewMenu;
    /**
     * 창 메뉴 생성
     */
    private createWindowMenu;
    /**
     * 도움말 메뉴 생성
     */
    private createHelpMenu;
    /**
     * 컨텍스트 메뉴 생성 (우클릭 메뉴)
     */
    createContextMenu(options?: ContextMenuOptions): Menu;
    /**
     * 트레이 메뉴 생성
     */
    createTrayMenu(options?: MenuOptions): Menu;
    /**
     * 애플리케이션 메뉴 설정
     */
    setupApplicationMenu(options?: MenuOptions): void;
    /**
     * 전역 컨텍스트 메뉴 이벤트 설정
     */
    private setupContextMenuEvents;
    /**
     * 컨텍스트 메뉴 처리
     */
    private handleContextMenu;
    /**
     * 새 창 생성
     */
    private createNewWindow;
    /**
     * 파일 열기 대화상자
     */
    private openFile;
    /**
     * 모든 윈도우 표시
     */
    private showAllWindows;
    /**
     * 메뉴 액션 전송
     */
    private sendMenuAction;
    /**
     * 시스템 정보 표시
     */
    private showSystemInfo;
    /**
     * About 대화상자 표시
     */
    private showAboutDialog;
    /**
     * 정리 작업
     */
    cleanup(): Promise<void>;
}
export declare const menuManager: MenuManager;
export default menuManager;
//# sourceMappingURL=menu-manager.d.ts.map