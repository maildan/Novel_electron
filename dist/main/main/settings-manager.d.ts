/**
 * Loop 6 Setup 관리 시스템
 *
 * 앱 Setup의 로드, 저장, 유효성 검사 및 적용을 담당하는 종합적인 Setup 관리자입니다.
 * electron-store를 기반으로 하며, Loop 3의 Setup 시스템을 완전히 마이그레이션했습니다.
 */
import { AppSettings } from './constants';
export interface SettingsChangeEvent {
    key: keyof AppSettings;
    oldValue: any;
    newValue: any;
    timestamp: number;
}
export interface SettingsValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    correctedSettings?: Partial<AppSettings>;
}
export interface SettingsManager {
    initialize(): Promise<void>;
    getSettings(): AppSettings;
    getSetting<K extends keyof AppSettings>(key: K): AppSettings[K];
    updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean>;
    updateMultipleSettings(settings: Partial<AppSettings>): Promise<boolean>;
    resetSettings(): Promise<boolean>;
    exportSettings(filePath: string): Promise<boolean>;
    importSettings(filePath: string): Promise<boolean>;
    validateSettings(settings: Partial<AppSettings>): SettingsValidationResult;
    createBackup(): Promise<string>;
    restoreBackup(backupPath: string): Promise<boolean>;
    getSettingsHistory(): SettingsChangeEvent[];
    clearSettingsHistory(): void;
    isSettingsChanged(): boolean;
}
type SettingsListener = (event: SettingsChangeEvent) => void;
/**
 * Setup 관리자 초기화
 */
export declare function initializeSettingsManager(): Promise<void>;
/**
 * Setup 저장
 */
declare function saveSettings(settings: Partial<AppSettings>): Promise<boolean>;
/**
 * Setup 유효성 검사
 */
export declare function validateSettings(settings: Partial<AppSettings>): SettingsValidationResult;
/**
 * Setup 내보내기
 */
export declare function exportSettings(filePath: string): Promise<boolean>;
/**
 * Setup 가져오기
 */
export declare function importSettings(filePath: string): Promise<boolean>;
/**
 * Setup 백업 생성
 */
export declare function createSettingsBackup(): Promise<string>;
/**
 * Setup 초기화
 */
export declare function resetSettings(): Promise<boolean>;
/**
 * Setup 변경 리스너 추가
 */
export declare function addSettingsListener(listener: SettingsListener): void;
/**
 * Setup 변경 리스너 제거
 */
export declare function removeSettingsListener(listener: SettingsListener): void;
/**
 * 현재 Setup 가져오기
 */
export declare function getSettings(): AppSettings;
/**
 * 개별 Setup 가져오기
 */
export declare function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K];
/**
 * Setup 변경 여부 확인
 */
export declare function hasUnsavedSettingsChanges(): boolean;
/**
 * Setup 관리자 Cleanup
 */
export declare function cleanupSettingsManager(): void;
/**
 * Setup 관리자 객체
 */
declare const SettingsManager: {
    initialize: typeof initializeSettingsManager;
    getSettings: typeof getSettings;
    getSetting: typeof getSetting;
    updateSetting: (key: keyof AppSettings, value: any) => Promise<boolean>;
    updateMultipleSettings: typeof saveSettings;
    resetSettings: typeof resetSettings;
    exportSettings: typeof exportSettings;
    importSettings: typeof importSettings;
    validateSettings: typeof validateSettings;
    createBackup: typeof createSettingsBackup;
    addListener: typeof addSettingsListener;
    removeListener: typeof removeSettingsListener;
    hasUnsavedChanges: typeof hasUnsavedSettingsChanges;
    cleanup: typeof cleanupSettingsManager;
};
export default SettingsManager;
//# sourceMappingURL=settings-manager.d.ts.map