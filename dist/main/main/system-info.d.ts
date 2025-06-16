/**
 * 고급 시스템 정보 및 모니터링 모듈
 * 시스템 통계, 브라우저 감지, 디버그 정보, 권한을 처리합니다
 */
import { BrowserWindow } from 'electron';
/**
 * Initialize system information module
 */
export declare function initSystemInfo(window: BrowserWindow): void;
/**
 * Cleanup system info resources
 */
export declare function cleanupSystemInfo(): void;
/**
 * Get system info module status
 */
export declare function getSystemInfoStatus(): {
    initialized: boolean;
    fallbackMode: boolean;
    lastPermissionCheck: number;
};
//# sourceMappingURL=system-info.d.ts.map