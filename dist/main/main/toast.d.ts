/**
 * toast.ts
 *
 * 토스트 알림 기능 제공
 * TODO: 구체적인 토스트 알림 로직 구현 필요
 */
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
export declare function showToast(options: ToastOptions): void;
/**
 * 성공 토스트
 */
export declare function showSuccessToast(message: string, title?: string): void;
/**
 * 에러 토스트
 */
export declare function showErrorToast(message: string, title?: string): void;
/**
 * 정보 토스트
 */
export declare function showInfoToast(message: string, title?: string): void;
/**
 * 경고 토스트
 */
export declare function showWarningToast(message: string, title?: string): void;
//# sourceMappingURL=toast.d.ts.map