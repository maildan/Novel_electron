"use strict";
/**
 * toast.ts
 *
 * 토스트 알림 기능 제공
 * TODO: 구체적인 토스트 알림 로직 구현 필요
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.showToast = showToast;
exports.showSuccessToast = showSuccessToast;
exports.showErrorToast = showErrorToast;
exports.showInfoToast = showInfoToast;
exports.showWarningToast = showWarningToast;
const electron_1 = require("electron");
// BrowserWindow 타입 사용을 위한 초기화 함수
function initializeToastWindow() {
    console.debug('[토스트] BrowserWindow 타입 초기화:', {
        BrowserWindow타입사용가능: !!electron_1.BrowserWindow,
        윈도우생성가능: typeof electron_1.BrowserWindow === 'function'
    });
}
/**
 * 토스트 알림 표시
 */
function showToast(options) {
    if (!electron_1.Notification.isSupported()) {
        console.warn('[toast] 시스템에서 알림을 지원하지 않습니다');
        return;
    }
    const notification = new electron_1.Notification({
        title: options.title,
        body: options.body,
        icon: options.icon,
        silent: options.silent || false,
        urgency: options.urgency || 'normal',
        timeoutType: options.timeoutType || 'default'
    });
    notification.show();
}
/**
 * 성공 토스트
 */
function showSuccessToast(message, title = '성공') {
    showToast({
        title,
        body: message,
        urgency: 'low'
    });
}
/**
 * 에러 토스트
 */
function showErrorToast(message, title = '오류') {
    showToast({
        title,
        body: message,
        urgency: 'critical'
    });
}
/**
 * 정보 토스트
 */
function showInfoToast(message, title = '알림') {
    showToast({
        title,
        body: message,
        urgency: 'normal'
    });
}
/**
 * 경고 토스트
 */
function showWarningToast(message, title = '경고') {
    showToast({
        title,
        body: message,
        urgency: 'normal'
    });
}
// 토스트 모듈 초기화
console.log('[toast] 토스트 알림 모듈 로드됨');
// 토스트 모듈 초기화 시 타입 정보 로깅
initializeToastWindow();
//# sourceMappingURL=toast.js.map