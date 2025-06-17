/**
 * toast.ts
 * 
 * 토스트 알림 기능 제공
 * TODO: 구체적인 토스트 알림 로직 구현 필요
 */

import { Notification, BrowserWindow } from 'electron';

// BrowserWindow 타입 사용을 위한 초기화 함수
function initializeToastWindow() {
  console.debug('[토스트] BrowserWindow 타입 초기화:', {
    BrowserWindow타입사용가능: !!BrowserWindow,
    윈도우생성가능: typeof BrowserWindow === 'function'
  });
}

export interface ToastOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
}

/**
 * 토스트 알림 표시
 */
export function showToast(options: ToastOptions): void {
  if (!Notification.isSupported()) {
    console.warn('[toast] 시스템에서 알림을 지원하지 않습니다');
    return;
  }

  const notification = new Notification({
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
export function showSuccessToast(message: string, title: string = '성공'): void {
  showToast({
    title,
    body: message,
    urgency: 'low'
  });
}

/**
 * 에러 토스트
 */
export function showErrorToast(message: string, title: string = '오류'): void {
  showToast({
    title,
    body: message,
    urgency: 'critical'
  });
}

/**
 * 정보 토스트
 */
export function showInfoToast(message: string, title: string = '알림'): void {
  showToast({
    title,
    body: message,
    urgency: 'normal'
  });
}

/**
 * 경고 토스트
 */
export function showWarningToast(message: string, title: string = '경고'): void {
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
