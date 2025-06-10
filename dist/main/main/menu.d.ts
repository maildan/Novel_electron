/**
 * 앱 메뉴 관리 모듈
 *
 * Electron 앱의 메뉴바, 컨텍스트 메뉴, 그리고 다양한 메뉴 액션을 관리합니다.
 * 플랫폼별 메뉴 구조와 동적 메뉴 업데이트를 지원합니다.
 */
import { BrowserWindow } from 'electron';
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
    label?: string;
    accelerator?: string;
    role?: string;
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    click?: () => void;
    submenu?: CustomMenuItem[];
    enabled?: boolean;
    visible?: boolean;
    checked?: boolean;
}
/**
 * 메뉴 관리 시스템 초기화
 */
export declare function initializeMenu(options?: MenuOptions): void;
/**
 * 메뉴 업데이트
 */
export declare function updateMenu(newOptions?: Partial<MenuOptions>): void;
/**
 * 컨텍스트 메뉴 생성
 */
export declare function createContextMenu(options: {
    x: number;
    y: number;
    window?: BrowserWindow;
    items?: CustomMenuItem[];
}): void;
/**
 * 메뉴 통계 조회
 */
export declare function getMenuStats(): {
    totalRecentFiles: number;
    totalActions: number;
    lastActionTime: number | null;
};
export {};
//# sourceMappingURL=menu.d.ts.map