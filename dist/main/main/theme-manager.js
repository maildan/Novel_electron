"use strict";
/**
 * theme-manager.ts
 *
 * 테마 관리 기능 제공
 * TODO: 구체적인 테마 처리 로직 구현 필요
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentTheme = getCurrentTheme;
exports.setTheme = setTheme;
exports.setupThemeListener = setupThemeListener;
const electron_1 = require("electron");
/**
 * 현재 테마 가져오기
 */
function getCurrentTheme() {
    return electron_1.nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}
/**
 * 테마 변경
 */
function setTheme(theme) {
    electron_1.nativeTheme.themeSource = theme;
    // 모든 윈도우에 테마 변경 알림
    electron_1.BrowserWindow.getAllWindows().forEach(window => {
        if (!window.isDestroyed()) {
            window.webContents.send('theme-changed', {
                theme: getCurrentTheme(),
                source: theme
            });
        }
    });
}
/**
 * 시스템 테마 변경 감지
 */
function setupThemeListener() {
    electron_1.nativeTheme.on('updated', () => {
        const currentTheme = getCurrentTheme();
        electron_1.BrowserWindow.getAllWindows().forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('theme-changed', {
                    theme: currentTheme,
                    source: electron_1.nativeTheme.themeSource
                });
            }
        });
    });
}
// 테마 관리자 초기화
setupThemeListener();
console.log('[theme-manager] 테마 관리자 모듈 로드됨');
//# sourceMappingURL=theme-manager.js.map