/**
 * Loop 6 전력 모니터링 모듈
 * 배터리 상태 및 전력 관리 기능
 */
interface PowerInfo {
    isOnBatteryPower: boolean;
    batteryLevel?: number;
    isCharging?: boolean;
    systemIdleTime: number;
    thermalState?: string;
}
interface PowerSettings {
    enableBatteryOptimization: boolean;
    lowPowerThreshold: number;
    preventSleep: boolean;
    thermalThrottling: boolean;
}
declare class PowerManager {
    private powerBlockerId;
    private settings;
    private powerInfo;
    private listeners;
    constructor();
    /**
   * 전력 모니터링 초기화
   */
    initialize(): void;
    /**
   * 전력 이벤트 리스너 Setup
   */
    private setupPowerEventListeners;
    /**
   * 전력 상태 변경 처리
   */
    private handlePowerStateChange;
    /**
   * 시스템 절전 모드 진입 처리
   */
    private handleSystemSuspend;
    /**
   * 시스템 절전 모드 해제 처리
   */
    private handleSystemResume;
    /**
   * 시스템 종료 처리
   */
    private handleSystemShutdown;
    /**
   * 전력 정보 업데이트
   */
    private updatePowerInfo;
    /**
   * 배터리 최적화 모드 활성화
   */
    private enableBatteryOptimization;
    /**
   * 배터리 최적화 모드 비활성화
   */
    private disableBatteryOptimization;
    /**
     * 절전 모드 방지 Setup
     */
    setPreventSleep(prevent: boolean): void;
    /**
   * 전력 상태 리스너 추가
   */
    addPowerListener(listener: (info: PowerInfo) => void): void;
    /**
   * 전력 상태 리스너 제거
   */
    removePowerListener(listener: (info: PowerInfo) => void): void;
    /**
   * 리스너들에게 알림
   */
    private notifyListeners;
    /**
   * 현재 전력 정보 가져오기
   */
    getPowerInfo(): PowerInfo;
    /**
   * 전력 Setup 가져오기
   */
    getSettings(): PowerSettings;
    /**
   * 전력 Setup 업데이트
   */
    updateSettings(newSettings: Partial<PowerSettings>): void;
    /**
   * Cleanup 작업
   */
    cleanup(): void;
}
declare let powerManager: PowerManager | null;
/**
 * 전력 관리자 인스턴스 가져오기
 */
export declare function getPowerManager(): PowerManager;
/**
 * 전력 모니터링 Setup
 */
export declare function setupPowerMonitoring(): void;
/**
 * 현재 전력 정보 가져오기
 */
export declare function getCurrentPowerInfo(): PowerInfo;
/**
 * 절전 모드 방지 Setup
 */
export declare function setPreventSleep(prevent: boolean): void;
/**
 * 전력 상태 리스너 추가
 */
export declare function addPowerListener(listener: (info: PowerInfo) => void): void;
/**
 * 전력 상태 리스너 제거
 */
export declare function removePowerListener(listener: (info: PowerInfo) => void): void;
export default powerManager;
//# sourceMappingURL=power-monitor.d.ts.map