/**
 * Loop 6 전력 모니터링 모듈
 * 배터리 상태 및 전력 관리 기능
 */

import { powerMonitor, powerSaveBlocker } from 'electron';
import { debugLog, errorLog } from '../shared/utils';

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

class PowerManager {
  private powerBlockerId: number | null = null;
  private settings: PowerSettings;
  private powerInfo: PowerInfo;
  private listeners: Array<(info: PowerInfo) => void> = [];

  constructor() {
    this.settings = {
      enableBatteryOptimization: true,
      lowPowerThreshold: 20,
      preventSleep: false,
      thermalThrottling: true
    };

    this.powerInfo = {
      isOnBatteryPower: false,
      systemIdleTime: 0
    };
  }

  /**
   * 전력 모니터링 초기화
   */
  initialize(): void {
    try {
      debugLog('전력 모니터링 초기화 시작');

      // 전력 상태 이벤트 리스너 설정
      this.setupPowerEventListeners();

      // 초기 전력 정보 수집
      this.updatePowerInfo();

      debugLog('전력 모니터링 초기화 완료');
    } catch (error) {
      errorLog('전력 모니터링 초기화 중 오류:', error);
    }
  }

  /**
   * 전력 이벤트 리스너 설정
   */
  private setupPowerEventListeners(): void {
    // 배터리 전원으로 전환
    powerMonitor.on('on-battery', () => {
      debugLog('배터리 전원으로 전환됨');
      this.powerInfo.isOnBatteryPower = true;
      this.handlePowerStateChange();
    });

    // AC 전원으로 전환
    powerMonitor.on('on-ac', () => {
      debugLog('AC 전원으로 전환됨');
      this.powerInfo.isOnBatteryPower = false;
      this.handlePowerStateChange();
    });

    // 시스템 절전 모드 진입
    powerMonitor.on('suspend', () => {
      debugLog('시스템이 절전 모드로 진입');
      this.handleSystemSuspend();
    });

    // 시스템 절전 모드 해제
    powerMonitor.on('resume', () => {
      debugLog('시스템이 절전 모드에서 복귀');
      this.handleSystemResume();
    });

    // 시스템 종료
    powerMonitor.on('shutdown', () => {
      debugLog('시스템 종료 신호 수신');
      this.handleSystemShutdown();
    });

    // 시스템 잠금
    powerMonitor.on('lock-screen', () => {
      debugLog('화면이 잠김');
    });

    // 시스템 잠금 해제
    powerMonitor.on('unlock-screen', () => {
      debugLog('화면 잠금이 해제됨');
    });

    // 사용자 활동 상태 변경
    powerMonitor.on('user-did-become-active', () => {
      debugLog('사용자가 활성 상태가 됨');
    });

    // 사용자 비활성 상태 변경
    powerMonitor.on('user-did-resign-active', () => {
      debugLog('사용자가 비활성 상태가 됨');
    });
  }

  /**
   * 전력 상태 변경 처리
   */
  private handlePowerStateChange(): void {
    this.updatePowerInfo();
    
    if (this.settings.enableBatteryOptimization && this.powerInfo.isOnBatteryPower) {
      this.enableBatteryOptimization();
    } else {
      this.disableBatteryOptimization();
    }

    // 리스너들에게 알림
    this.notifyListeners();
  }

  /**
   * 시스템 절전 모드 진입 처리
   */
  private handleSystemSuspend(): void {
    // 필요한 경우 작업 중단 또는 저장
    debugLog('절전 모드 진입에 따른 작업 정리');
  }

  /**
   * 시스템 절전 모드 해제 처리
   */
  private handleSystemResume(): void {
    // 절전 모드에서 복귀 시 작업 재개
    debugLog('절전 모드 복귀에 따른 작업 재개');
    this.updatePowerInfo();
  }

  /**
   * 시스템 종료 처리
   */
  private handleSystemShutdown(): void {
    // 종료 전 정리 작업
    debugLog('시스템 종료에 따른 정리 작업');
    this.cleanup();
  }

  /**
   * 전력 정보 업데이트
   */
  private updatePowerInfo(): void {
    try {
      this.powerInfo = {
        isOnBatteryPower: powerMonitor.isOnBatteryPower(),
        systemIdleTime: powerMonitor.getSystemIdleTime(),
        thermalState: powerMonitor.getCurrentThermalState?.() || 'normal'
      };

      debugLog('전력 정보 업데이트:', this.powerInfo);
    } catch (error) {
      errorLog('전력 정보 업데이트 중 오류:', error);
    }
  }

  /**
   * 배터리 최적화 모드 활성화
   */
  private enableBatteryOptimization(): void {
    debugLog('배터리 최적화 모드 활성화');
    
    // 여기서 앱의 성능을 낮추거나 불필요한 작업을 중단
    // 예: GPU 가속 비활성화, 애니메이션 감소, 백그라운드 작업 중단
  }

  /**
   * 배터리 최적화 모드 비활성화
   */
  private disableBatteryOptimization(): void {
    debugLog('배터리 최적화 모드 비활성화');
    
    // 일반 성능 모드로 복귀
  }

  /**
   * 절전 모드 방지 설정
   */
  setPreventSleep(prevent: boolean): void {
    try {
      if (prevent && !this.powerBlockerId) {
        this.powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
        debugLog('절전 모드 방지 활성화');
      } else if (!prevent && this.powerBlockerId) {
        powerSaveBlocker.stop(this.powerBlockerId);
        this.powerBlockerId = null;
        debugLog('절전 모드 방지 비활성화');
      }

      this.settings.preventSleep = prevent;
    } catch (error) {
      errorLog('절전 모드 설정 중 오류:', error);
    }
  }

  /**
   * 전력 상태 리스너 추가
   */
  addPowerListener(listener: (info: PowerInfo) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 전력 상태 리스너 제거
   */
  removePowerListener(listener: (info: PowerInfo) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 리스너들에게 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.powerInfo);
      } catch (error) {
        errorLog('전력 상태 리스너 실행 중 오류:', error);
      }
    });
  }

  /**
   * 현재 전력 정보 가져오기
   */
  getPowerInfo(): PowerInfo {
    this.updatePowerInfo();
    return { ...this.powerInfo };
  }

  /**
   * 전력 설정 가져오기
   */
  getSettings(): PowerSettings {
    return { ...this.settings };
  }

  /**
   * 전력 설정 업데이트
   */
  updateSettings(newSettings: Partial<PowerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // 절전 모드 방지 설정 적용
    if (newSettings.preventSleep !== undefined) {
      this.setPreventSleep(newSettings.preventSleep);
    }
    
    debugLog('전력 설정 업데이트 완료');
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    if (this.powerBlockerId) {
      powerSaveBlocker.stop(this.powerBlockerId);
      this.powerBlockerId = null;
    }
    
    this.listeners = [];
    debugLog('전력 관리자 정리 완료');
  }
}

// 전역 전력 관리자 인스턴스
let powerManager: PowerManager | null = null;

/**
 * 전력 관리자 인스턴스 가져오기
 */
export function getPowerManager(): PowerManager {
  if (!powerManager) {
    powerManager = new PowerManager();
  }
  return powerManager;
}

/**
 * 전력 모니터링 설정
 */
export function setupPowerMonitoring(): void {
  const manager = getPowerManager();
  manager.initialize();
}

/**
 * 현재 전력 정보 가져오기
 */
export function getCurrentPowerInfo(): PowerInfo {
  const manager = getPowerManager();
  return manager.getPowerInfo();
}

/**
 * 절전 모드 방지 설정
 */
export function setPreventSleep(prevent: boolean): void {
  const manager = getPowerManager();
  manager.setPreventSleep(prevent);
}

/**
 * 전력 상태 리스너 추가
 */
export function addPowerListener(listener: (info: PowerInfo) => void): void {
  const manager = getPowerManager();
  manager.addPowerListener(listener);
}

/**
 * 전력 상태 리스너 제거
 */
export function removePowerListener(listener: (info: PowerInfo) => void): void {
  const manager = getPowerManager();
  manager.removePowerListener(listener);
}

export default powerManager;
