/**
 * Loop 6 타이핑 추적 및 모니터링 IPC 핸들러
 *
 * Loop 3의 tracking-handlers.js를 TypeScript로 완전 마이그레이션
 * 타이핑 추적 시작/중지, 통계 저장, 자동 모니터링 등을 처리합니다.
 */
interface TrackingState {
    isTracking: boolean;
    startTime: number | null;
    sessionStats: TypingStats;
    autoStartEnabled: boolean;
}
interface TypingStats {
    totalKeystrokes: number;
    totalTime: number;
    averageWPM: number;
    accuracy: number;
    errorCount: number;
    correctCount: number;
    sessionCount: number;
    lastActive: number;
}
/**
 * 추적 시작
 */
export declare function startTracking(): boolean;
/**
 * 추적 중지
 */
export declare function stopTracking(): boolean;
/**
 * 키 입력 처리
 */
export declare function processKeyPress(keyData: any): void;
/**
 * 렌더러에 추적 상태 전송
 */
export declare function sendTrackingStatusToRenderer(): void;
/**
 * 추적 상태 초기화
 */
export declare function resetTrackingState(): void;
/**
 * 현재 추적 상태 가져오기
 */
export declare function getTrackingState(): TrackingState;
/**
 * IPC 핸들러 등록
 */
export declare function registerTrackingHandlers(): void;
/**
 * 자동 모니터링 초기화 (앱 시작 시 호출)
 */
export declare function initializeAutoMonitoring(): void;
/**
 * 핸들러 정리
 */
export declare function cleanupTrackingHandlers(): void;
declare const _default: {
    registerTrackingHandlers: typeof registerTrackingHandlers;
    startTracking: typeof startTracking;
    stopTracking: typeof stopTracking;
    processKeyPress: typeof processKeyPress;
    sendTrackingStatusToRenderer: typeof sendTrackingStatusToRenderer;
    getTrackingState: typeof getTrackingState;
    resetTrackingState: typeof resetTrackingState;
    initializeAutoMonitoring: typeof initializeAutoMonitoring;
    cleanupTrackingHandlers: typeof cleanupTrackingHandlers;
};
export default _default;
//# sourceMappingURL=tracking-handlers.d.ts.map