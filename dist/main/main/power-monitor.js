"use strict";
/**
 * Loop 6 전력 모니터링 모듈
 * 배터리 상태 및 전력 관리 기능
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPowerManager = getPowerManager;
exports.setupPowerMonitoring = setupPowerMonitoring;
exports.getCurrentPowerInfo = getCurrentPowerInfo;
exports.setPreventSleep = setPreventSleep;
exports.addPowerListener = addPowerListener;
exports.removePowerListener = removePowerListener;
const electron_1 = require("electron");
const utils_1 = require("../shared/utils");
class PowerManager {
    constructor() {
        this.powerBlockerId = null;
        this.listeners = [];
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
    initialize() {
        try {
            (0, utils_1.debugLog)('전력 모니터링 초기화 시작');
            // 전력 상태 이벤트 리스너 Setup
            this.setupPowerEventListeners();
            // 초기 전력 정보 수집
            this.updatePowerInfo();
            (0, utils_1.debugLog)('전력 모니터링 초기화 Completed');
        }
        catch (error) {
            (0, utils_1.errorLog)('전력 모니터링 초기화 중 Error:', error);
        }
    }
    /**
   * 전력 이벤트 리스너 Setup
   */
    setupPowerEventListeners() {
        // 배터리 전원으로 전환
        electron_1.powerMonitor.on('on-battery', () => {
            (0, utils_1.debugLog)('배터리 전원으로 전환됨');
            this.powerInfo.isOnBatteryPower = true;
            this.handlePowerStateChange();
        });
        // AC 전원으로 전환
        electron_1.powerMonitor.on('on-ac', () => {
            (0, utils_1.debugLog)('AC 전원으로 전환됨');
            this.powerInfo.isOnBatteryPower = false;
            this.handlePowerStateChange();
        });
        // 시스템 절전 모드 진입
        electron_1.powerMonitor.on('suspend', () => {
            (0, utils_1.debugLog)('시스템이 절전 모드로 진입');
            this.handleSystemSuspend();
        });
        // 시스템 절전 모드 해제
        electron_1.powerMonitor.on('resume', () => {
            (0, utils_1.debugLog)('시스템이 절전 모드에서 복귀');
            this.handleSystemResume();
        });
        // 시스템 종료
        electron_1.powerMonitor.on('shutdown', () => {
            (0, utils_1.debugLog)('시스템 종료 신호 수신');
            this.handleSystemShutdown();
        });
        // 시스템 잠금
        electron_1.powerMonitor.on('lock-screen', () => {
            (0, utils_1.debugLog)('화면이 잠김');
        });
        // 시스템 잠금 해제
        electron_1.powerMonitor.on('unlock-screen', () => {
            (0, utils_1.debugLog)('화면 잠금이 해제됨');
        });
        // 사용자 활동 상태 변경
        electron_1.powerMonitor.on('user-did-become-active', () => {
            (0, utils_1.debugLog)('사용자가 활성 상태가 됨');
        });
        // 사용자 비활성 상태 변경
        electron_1.powerMonitor.on('user-did-resign-active', () => {
            (0, utils_1.debugLog)('사용자가 비활성 상태가 됨');
        });
    }
    /**
   * 전력 상태 변경 처리
   */
    handlePowerStateChange() {
        this.updatePowerInfo();
        if (this.settings.enableBatteryOptimization && this.powerInfo.isOnBatteryPower) {
            this.enableBatteryOptimization();
        }
        else {
            this.disableBatteryOptimization();
        }
        // 리스너들에게 알림
        this.notifyListeners();
    }
    /**
   * 시스템 절전 모드 진입 처리
   */
    handleSystemSuspend() {
        // 필요한 경우 작업 중단 또는 저장
        (0, utils_1.debugLog)('절전 모드 진입에 따른 작업 Cleanup');
    }
    /**
   * 시스템 절전 모드 해제 처리
   */
    handleSystemResume() {
        // 절전 모드에서 복귀 시 작업 재개
        (0, utils_1.debugLog)('절전 모드 복귀에 따른 작업 재개');
        this.updatePowerInfo();
    }
    /**
   * 시스템 종료 처리
   */
    handleSystemShutdown() {
        // 종료 전 Cleanup 작업
        (0, utils_1.debugLog)('시스템 종료에 따른 Cleanup 작업');
        this.cleanup();
    }
    /**
   * 전력 정보 업데이트
   */
    updatePowerInfo() {
        try {
            this.powerInfo = {
                isOnBatteryPower: electron_1.powerMonitor.isOnBatteryPower(),
                systemIdleTime: electron_1.powerMonitor.getSystemIdleTime(),
                thermalState: electron_1.powerMonitor.getCurrentThermalState?.() || 'normal'
            };
            (0, utils_1.debugLog)('전력 정보 업데이트:', this.powerInfo);
        }
        catch (error) {
            (0, utils_1.errorLog)('전력 정보 업데이트 중 Error:', error);
        }
    }
    /**
   * 배터리 최적화 모드 활성화
   */
    enableBatteryOptimization() {
        (0, utils_1.debugLog)('배터리 최적화 모드 활성화');
        // 여기서 앱의 성능을 낮추거나 불필요한 작업을 중단
        // 예: GPU 가속 비활성화, 애니메이션 감소, 백그라운드 작업 중단
    }
    /**
   * 배터리 최적화 모드 비활성화
   */
    disableBatteryOptimization() {
        (0, utils_1.debugLog)('배터리 최적화 모드 비활성화');
        // 일반 성능 모드로 복귀
    }
    /**
     * 절전 모드 방지 Setup
     */
    setPreventSleep(prevent) {
        try {
            if (prevent && !this.powerBlockerId) {
                this.powerBlockerId = electron_1.powerSaveBlocker.start('prevent-app-suspension');
                (0, utils_1.debugLog)('절전 모드 방지 활성화');
            }
            else if (!prevent && this.powerBlockerId) {
                electron_1.powerSaveBlocker.stop(this.powerBlockerId);
                this.powerBlockerId = null;
                (0, utils_1.debugLog)('절전 모드 방지 비활성화');
            }
            this.settings.preventSleep = prevent;
        }
        catch (error) {
            (0, utils_1.errorLog)('절전 모드 Setup 중 Error:', error);
        }
    }
    /**
   * 전력 상태 리스너 추가
   */
    addPowerListener(listener) {
        this.listeners.push(listener);
    }
    /**
   * 전력 상태 리스너 제거
   */
    removePowerListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
   * 리스너들에게 알림
   */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.powerInfo);
            }
            catch (error) {
                (0, utils_1.errorLog)('전력 상태 리스너 실행 중 Error:', error);
            }
        });
    }
    /**
   * 현재 전력 정보 가져오기
   */
    getPowerInfo() {
        this.updatePowerInfo();
        return { ...this.powerInfo };
    }
    /**
   * 전력 Setup 가져오기
   */
    getSettings() {
        return { ...this.settings };
    }
    /**
   * 전력 Setup 업데이트
   */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        // 절전 모드 방지 Setup 적용
        if (newSettings.preventSleep !== undefined) {
            this.setPreventSleep(newSettings.preventSleep);
        }
        (0, utils_1.debugLog)('전력 Setup 업데이트 Completed');
    }
    /**
   * Cleanup 작업
   */
    cleanup() {
        if (this.powerBlockerId) {
            electron_1.powerSaveBlocker.stop(this.powerBlockerId);
            this.powerBlockerId = null;
        }
        this.listeners = [];
        (0, utils_1.debugLog)('전력 관리자 Cleanup Completed');
    }
}
// 전역 전력 관리자 인스턴스
let powerManager = null;
/**
 * 전력 관리자 인스턴스 가져오기
 */
function getPowerManager() {
    if (!powerManager) {
        powerManager = new PowerManager();
    }
    return powerManager;
}
/**
 * 전력 모니터링 Setup
 */
function setupPowerMonitoring() {
    const manager = getPowerManager();
    manager.initialize();
}
/**
 * 현재 전력 정보 가져오기
 */
function getCurrentPowerInfo() {
    const manager = getPowerManager();
    return manager.getPowerInfo();
}
/**
 * 절전 모드 방지 Setup
 */
function setPreventSleep(prevent) {
    const manager = getPowerManager();
    manager.setPreventSleep(prevent);
}
/**
 * 전력 상태 리스너 추가
 */
function addPowerListener(listener) {
    const manager = getPowerManager();
    manager.addPowerListener(listener);
}
/**
 * 전력 상태 리스너 제거
 */
function removePowerListener(listener) {
    const manager = getPowerManager();
    manager.removePowerListener(listener);
}
exports.default = powerManager;
//# sourceMappingURL=power-monitor.js.map