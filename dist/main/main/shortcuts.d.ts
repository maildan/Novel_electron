/**
 * 전역 단축키 관리 모듈
 *
 * Electron 앱에서 전역 및 로컬 키보드 단축키를 관리합니다.
 * 고급 단축키 매칭, 충돌 감지, 그리고 동적 등록/해제를 지원합니다.
 */
import { BrowserWindow } from 'electron';
/**
 * Register global shortcuts
 */
export declare function registerGlobalShortcut(accelerator: string, callback: () => void, description?: string, category?: string): boolean;
/**
 * 전역 단축키 해제
 */
export declare function unregisterGlobalShortcut(accelerator: string): boolean;
/**
 * 모든 전역 단축키 해제
 */
export declare function unregisterAllGlobalShortcuts(): void;
/**
 * 단축키 활성화/비활성화
 */
export declare function toggleGlobalShortcut(accelerator: string, enabled: boolean): boolean;
/**
 * 로컬 윈도우 단축키 등록
 */
export declare function registerLocalShortcut(window: BrowserWindow, accelerator: string, callback: () => void): boolean;
/**
 * 단축키 관리 초기화
 */
export declare function initializeShortcuts(): void;
/**
 * 기본 앱 단축키 Setup
 */
export declare function setupDefaultShortcuts(): void;
/**
 * 단축키 통계 조회
 */
export declare function getShortcutStats(): {
    totalRegistered: number;
    totalConflicts: number;
    totalHistory: number;
    categoryCounts: Record<string, number>;
};
//# sourceMappingURL=shortcuts.d.ts.map