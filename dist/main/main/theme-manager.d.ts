/**
 * theme-manager.ts
 *
 * 테마 관리 기능 제공
 * TODO: 구체적인 테마 처리 로직 구현 필요
 */
export interface ThemeConfig {
    mode: 'light' | 'dark' | 'system';
    accentColor?: string;
    customColors?: Record<string, string>;
}
/**
 * 현재 테마 가져오기
 */
export declare function getCurrentTheme(): 'light' | 'dark';
/**
 * 테마 변경
 */
export declare function setTheme(theme: 'light' | 'dark' | 'system'): void;
/**
 * 시스템 테마 변경 감지
 */
export declare function setupThemeListener(): void;
//# sourceMappingURL=theme-manager.d.ts.map