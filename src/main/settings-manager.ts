/**
 * Loop 6 Setup 관리 시스템
 * 
 * 앱 Setup의 로드, 저장, 유효성 검사 및 적용을 담당하는 종합적인 Setup 관리자입니다.
 * electron-store를 기반으로 하며, Loop 3의 Setup 시스템을 완전히 마이그레이션했습니다.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppSettings, DEFAULT_SETTINGS, PATHS, SETTINGS_FILE_PATH } from './constants';
import { debugLog, errorLog } from './utils';
import { CHANNELS } from '../preload/channels';

/**
 * 디렉토리 존재 확인 및 생성
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    debugLog('디렉토리 생성됨:', dirPath);
  }
}

// electron-store 인스턴스
let store: Store<AppSettings>;
let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;
let handlersRegistered = false; // IPC 핸들러 등록 상태 추적

// 타입 정의
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

// Setup 변경 이벤트 리스너
type SettingsListener = (event: SettingsChangeEvent) => void;
const settingsListeners: SettingsListener[] = [];
const settingsHistory: SettingsChangeEvent[] = [];
let hasUnsavedChanges = false;

/**
 * Setup 관리자 초기화
 */
export async function initializeSettingsManager(): Promise<void> {
  if (isInitialized) {
    console.log('⚠️ Setup 관리자가 이미 초기화되어 있습니다');
    return;
  }

  try {
    console.log('🚀 Setup 관리자 초기화 시작...');
    console.log('📁 사용할 userData 경로:', PATHS.userData);

    // userData 폴더 생성 확보
    await ensureDirectoryExists(PATHS.userData);
    await ensureDirectoryExists(PATHS.config);
    await ensureDirectoryExists(PATHS.logs);
    await ensureDirectoryExists(PATHS.database);
    await ensureDirectoryExists(PATHS.backup);
    
    console.log('✅ userData 디렉토리 구조 생성 Completed:', PATHS.userData);

    // electron-store 초기화
    store = new Store<AppSettings>({
      name: 'loop-settings',
      cwd: PATHS.userData,
      defaults: DEFAULT_SETTINGS,
      migrations: {
        '>=6.0.0': (store: any) => {
          // Loop 6 마이그레이션 로직
          console.log('🔄 Loop 6 Setup 마이그레이션 실행');
          console.log('🔄 Store 정보:', store?.size || 0, '개 설정 항목');
          
          // 마이그레이션 로직 실행
          const oldVersion = store.get('app.version') || '5.0.0';
          if (oldVersion !== app.getVersion()) {
            console.log(`🔄 버전 업데이트: ${oldVersion} → ${app.getVersion()}`);
            store.set('app.version', app.getVersion());
          }
        }
      }
    });

    console.log('📦 electron-store 초기화 Completed');
    console.log('📁 설정 파일 경로:', SETTINGS_FILE_PATH);

    // Setup 로드
    await loadSettings();

    // IPC 핸들러 등록
    registerIPCHandlers();
    console.log('🔥 IPC 핸들러 등록 Completed');

    isInitialized = true;
    console.log('✅ Setup 관리자 초기화 Completed');
    console.log('🔥 현재 Setup:', Object.keys(currentSettings));

  } catch (error) {
    console.error('❌ Setup 관리자 초기화 Failed:', error);
    // 기본 Setup으로 폴백
    currentSettings = { ...DEFAULT_SETTINGS };
    isInitialized = true;
  }
}

/**
 * Setup 로드
 */
async function loadSettings(): Promise<AppSettings> {
  try {
    debugLog('Setup 로드 중...');

    // electron-store에서 Setup 가져오기
    const storedSettings = (store as any).store || {};
    
    // Loop 3 호환성을 위한 레거시 Setup 확인
    const legacySettingsPath = path.join(PATHS.userData, 'settings.json');
    let legacySettings: Partial<AppSettings> = {};
    
    try {
      const legacyData = await fs.readFile(legacySettingsPath, 'utf-8');
      legacySettings = JSON.parse(legacyData);
      debugLog('레거시 Setup 발견, 마이그레이션 중...');
    } catch {
      // 레거시 Setup 파일이 없음 (정상)
    }

    // Setup 병합 (우선순위: stored > legacy > default)
    currentSettings = {
      ...DEFAULT_SETTINGS,
      ...legacySettings,
      ...storedSettings
    };

    // Setup 유효성 검사 및 수정
    const validation = validateSettings(currentSettings);
    if (validation.correctedSettings) {
      currentSettings = { ...currentSettings, ...validation.correctedSettings };
      await saveSettings(currentSettings);
    }

    // 카테고리 Setup 보정
    ensureCategorySettings();

    debugLog('Setup 로드 Completed:', currentSettings);
    return currentSettings;

  } catch (error) {
    errorLog('Setup 로드 Failed:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
    return currentSettings;
  }
}

/**
 * Setup 저장
 */
async function saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
  try {
    console.log('💾 Setup 저장 시작:', settings);
    
    if (!isInitialized) {
      throw new Error('Setup 관리자가 초기화되지 않음');
    }

    // 현재 Setup과 병합
    const newSettings = { ...currentSettings, ...settings };
    console.log('🔄 병합된 Setup:', newSettings);

    // 유효성 검사
    const validation = validateSettings(newSettings);
    if (!validation.isValid) {
      console.error('❌ Setup 유효성 검사 Failed:', validation.errors);
      return false;
    }

    // 변경 사항 추적
    const changes: SettingsChangeEvent[] = [];
    for (const [key, value] of Object.entries(settings)) {
      const oldValue = currentSettings[key as keyof AppSettings];
      if (oldValue !== value) {
        changes.push({
          key: key as keyof AppSettings,
          oldValue,
          newValue: value,
          timestamp: Date.now()
        });
      }
    }

    console.log('📝 Setup 변경사항:', changes);

    // electron-store에 저장
    for (const [key, value] of Object.entries(newSettings)) {
      (store as any).set(key as keyof AppSettings, value);
    }
    
    console.log('💿 electron-store 저장 Completed');
    
    // JSON 파일로도 저장 (Loop 3 호환성)
    const settingsPath = path.join(PATHS.userData, 'settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8');
    console.log('📁 JSON 파일 저장 Completed:', settingsPath);
    
    currentSettings = newSettings;

    // 변경 이벤트 발생
    changes.forEach(change => {
      settingsHistory.push(change);
      settingsListeners.forEach(listener => listener(change));
    });

    // Setup 변경 시 필요한 액션 수행
    await applySettingsChanges(changes);

    hasUnsavedChanges = false;
    console.log('✅ Setup 저장 Completed');
    return true;

  } catch (error) {
    console.error('❌ Setup 저장 Failed:', error);
    return false;
  }
}

/**
 * 카테고리 Setup 보정
 */
function ensureCategorySettings(): void {
  if (!currentSettings.enabledCategories || typeof currentSettings.enabledCategories !== 'object') {
    currentSettings.enabledCategories = {
      docs: true,
      office: true,
      coding: true,
      sns: true,
      browser: true,
      game: false,
      media: true,
      other: true
    };
    debugLog('카테고리 Setup Initialized');
  } else {
    // 필요한 모든 카테고리 키가 있는지 확인
    const requiredCategories = ['docs', 'office', 'coding', 'sns', 'browser', 'game', 'media', 'other'];
    let updated = false;

    requiredCategories.forEach(category => {
      if (currentSettings.enabledCategories[category as keyof typeof currentSettings.enabledCategories] === undefined) {
        (currentSettings.enabledCategories as any)[category] = true;
        updated = true;
      }
    });

    if (updated) {
      debugLog('카테고리 Setup 업데이트됨');
    }
  }
}

/**
 * Setup 유효성 검사
 */
export function validateSettings(settings: Partial<AppSettings>): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctedSettings: Partial<AppSettings> = {};

  try {
    // 메모리 임계값 검증
    if (settings.memoryThreshold !== undefined) {
      if (typeof settings.memoryThreshold !== 'number' || 
          settings.memoryThreshold < 50 || 
          settings.memoryThreshold > 95) {
        warnings.push('메모리 임계값이 유효 범위(50-95%)를 벗어남');
        correctedSettings.memoryThreshold = 80;
      }
    }

    // GPU 가속 레벨 검증
    if (settings.gpuAccelerationLevel !== undefined) {
      if (typeof settings.gpuAccelerationLevel !== 'number' || 
          settings.gpuAccelerationLevel < 0 || 
          settings.gpuAccelerationLevel > 3) {
        warnings.push('GPU 가속 레벨이 유효 범위(0-3)를 벗어남');
        correctedSettings.gpuAccelerationLevel = 1;
      }
    }

    // 폰트 크기 검증
    if (settings.fontSize !== undefined) {
      if (typeof settings.fontSize !== 'number' || 
          settings.fontSize < 10 || 
          settings.fontSize > 24) {
        warnings.push('폰트 크기가 유효 범위(10-24px)를 벗어남');
        correctedSettings.fontSize = 14;
      }
    }

    // 자동 저장 간격 검증
    if (settings.autoSaveInterval !== undefined) {
      if (typeof settings.autoSaveInterval !== 'number' || 
          settings.autoSaveInterval < 5000 || 
          settings.autoSaveInterval > 300000) {
        warnings.push('자동 저장 간격이 유효 범위(5초-5분)를 벗어남');
        correctedSettings.autoSaveInterval = 10000;
      }
    }

    // 데이터 보관 일수 검증
    if (settings.dataRetentionDays !== undefined) {
      if (typeof settings.dataRetentionDays !== 'number' || 
          settings.dataRetentionDays < 1 || 
          settings.dataRetentionDays > 365) {
        warnings.push('데이터 보관 일수가 유효 범위(1-365일)를 벗어남');
        correctedSettings.dataRetentionDays = 30;
      }
    }

    // 카테고리 Setup 검증
    if (settings.enabledCategories !== undefined) {
      if (typeof settings.enabledCategories !== 'object' || 
          settings.enabledCategories === null) {
        errors.push('카테고리 Setup이 올바르지 않음');
        correctedSettings.enabledCategories = DEFAULT_SETTINGS.enabledCategories;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedSettings: Object.keys(correctedSettings).length > 0 ? correctedSettings : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Setup 유효성 검사 중 Error: ${error}`],
      warnings: []
    };
  }
}

/**
 * Setup 변경사항 적용
 */
async function applySettingsChanges(changes: SettingsChangeEvent[]): Promise<void> {
  try {
    for (const change of changes) {
      await applySettingChange(change);
    }
  } catch (error) {
    errorLog('Setup 변경사항 적용 Failed:', error);
  }
}

/**
 * 개별 Setup 변경사항 적용
 */
async function applySettingChange(change: SettingsChangeEvent): Promise<void> {
  const { key, newValue } = change;

  switch (key) {
    case 'theme':
    case 'darkMode':
      await applyThemeChange(newValue);
      break;

    case 'windowMode':
      await applyWindowModeChange(newValue);
      break;

    case 'useHardwareAcceleration':
    case 'enableGPUAcceleration':
    case 'gpuAccelerationLevel':
      await applyGPUSettingsChange();
      break;

    case 'minimizeToTray':
    case 'showTrayNotifications':
      await applyTraySettingsChange();
      break;

    case 'autoStartMonitoring':
      await applyMonitoringSettingsChange(newValue);
      break;

    case 'enableKeyboardShortcuts':
      await applyShortcutSettingsChange(newValue);
      break;

    default:
      debugLog('Setup 변경 적용: ${key} = ${newValue}');
  }
}

/**
 * 테마 변경 적용
 */
async function applyThemeChange(theme: string): Promise<void> {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('theme-changed', { theme });
      }
    });
    debugLog('테마 변경 적용:', theme);
  } catch (error) {
    errorLog('테마 변경 적용 Failed:', error);
  }
}

/**
 * 창 모드 변경 적용
 */
async function applyWindowModeChange(windowMode: string): Promise<void> {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (!mainWindow) return;

    switch (windowMode) {
      case 'fullscreen':
        mainWindow.setFullScreen(true);
        mainWindow.setAutoHideMenuBar(true);
        break;
      case 'maximized':
        if (mainWindow.isFullScreen()) {
          mainWindow.setFullScreen(false);
        }
        mainWindow.maximize();
        mainWindow.setAutoHideMenuBar(false);
        break;
      case 'windowed':
      default:
        if (mainWindow.isFullScreen()) {
          mainWindow.setFullScreen(false);
        }
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        }
        mainWindow.setAutoHideMenuBar(false);
        break;
    }

    // 렌더러에 창 모드 변경 통지
    mainWindow.webContents.send('window-mode-changed', { 
      mode: windowMode,
      success: true 
    });

    debugLog('창 모드 변경 적용:', windowMode);
  } catch (error) {
    errorLog('창 모드 변경 적용 Failed:', error);
  }
}

/**
 * GPU Setup 변경 적용
 */
async function applyGPUSettingsChange(): Promise<void> {
  try {
    // GPU Setup 변경은 재시작이 필요함을 사용자에게 알림
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('gpu-settings-changed', { 
          requiresRestart: true 
        });
      }
    });
    debugLog('GPU Setup 변경 알림 전송');
  } catch (error) {
    errorLog('GPU Setup 변경 적용 Failed:', error);
  }
}

/**
 * 트레이 Setup 변경 적용
 */
async function applyTraySettingsChange(): Promise<void> {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('tray-settings-changed', {
          minimizeToTray: currentSettings.minimizeToTray,
          showTrayNotifications: currentSettings.showTrayNotifications
        });
      }
    });
    debugLog('트레이 Setup 변경 적용');
  } catch (error) {
    errorLog('트레이 Setup 변경 적용 Failed:', error);
  }
}

/**
 * 모니터링 Setup 변경 적용
 */
async function applyMonitoringSettingsChange(enabled: boolean): Promise<void> {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('monitoring-settings-changed', { enabled });
      }
    });
    debugLog('모니터링 Setup 변경 적용:', enabled);
  } catch (error) {
    errorLog('모니터링 Setup 변경 적용 Failed:', error);
  }
}

/**
 * 단축키 Setup 변경 적용
 */
async function applyShortcutSettingsChange(enabled: boolean): Promise<void> {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('shortcut-settings-changed', { enabled });
      }
    });
    debugLog('단축키 Setup 변경 적용:', enabled);
  } catch (error) {
    errorLog('단축키 Setup 변경 적용 Failed:', error);
  }
}

/**
 * Setup 내보내기
 */
export async function exportSettings(filePath: string): Promise<boolean> {
  try {
    const exportData = {
      version: '6.0.0',
      timestamp: new Date().toISOString(),
      settings: currentSettings,
      metadata: {
        exportedFrom: 'Loop 6',
        platform: process.platform,
        arch: process.arch
      }
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    debugLog('Setup 내보내기 Completed:', filePath);
    return true;
  } catch (error) {
    errorLog('Setup 내보내기 Failed:', error);
    return false;
  }
}

/**
 * Setup 가져오기
 */
export async function importSettings(filePath: string): Promise<boolean> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const importData = JSON.parse(data);

    // 가져온 Setup 유효성 검사
    const validation = validateSettings(importData.settings || importData);
    if (!validation.isValid) {
      errorLog('가져온 Setup이 Invalid:', validation.errors);
      return false;
    }

    // Setup 적용
    const success = await saveSettings(importData.settings || importData);
    if (success) {
      debugLog('Setup 가져오기 Completed:', filePath);
    }
    return success;
  } catch (error) {
    errorLog('Setup 가져오기 Failed:', error);
    return false;
  }
}

/**
 * Setup 백업 생성
 */
export async function createSettingsBackup(): Promise<string> {
  try {
    const backupDir = path.join(PATHS.backup, 'settings');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `settings-backup-${timestamp}.json`);

    await exportSettings(backupPath);
    debugLog('Setup 백업 생성:', backupPath);
    return backupPath;
  } catch (error) {
    errorLog('Setup 백업 생성 Failed:', error);
    throw error;
  }
}

/**
 * Setup 초기화
 */
export async function resetSettings(): Promise<boolean> {
  try {
    // 백업 생성
    await createSettingsBackup();

    // 기본 Setup으로 복원
    currentSettings = { ...DEFAULT_SETTINGS };
    (store as any).clear();
    for (const [key, value] of Object.entries(currentSettings)) {
      (store as any).set(key as keyof AppSettings, value);
    }

    // 모든 창에 Setup 초기화 알림
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('settings-reset');
      }
    });

    hasUnsavedChanges = false;
    debugLog('Setup 초기화 Completed');
    return true;
  } catch (error) {
    errorLog('Setup 초기화 Failed:', error);
    return false;
  }
}

/**
 * IPC 핸들러 등록
 */
function registerIPCHandlers(): void {
  // 중복 등록 방지
  if (handlersRegistered) {
    debugLog('Setup IPC 핸들러가 이미 등록되어 있습니다');
    return;
  }
  // 새로운 CHANNELS 상수와 일치하는 핸들러들
  ipcMain.handle(CHANNELS.SETTINGS_GET, (_, key?: keyof AppSettings) => {
    if (key) {
      return currentSettings[key];
    }
    return currentSettings;
  });

  ipcMain.handle(CHANNELS.SETTINGS_GET_ALL, () => {
    return currentSettings;
  });

  ipcMain.handle(CHANNELS.SETTINGS_SET, async (_, key: keyof AppSettings, value: any) => {
    return await saveSettings({ [key]: value });
  });

  ipcMain.handle(CHANNELS.SETTINGS_UPDATE, async (_, key: keyof AppSettings, value: any) => {
    return await saveSettings({ [key]: value });
  });

  ipcMain.handle(CHANNELS.SETTINGS_UPDATE_MULTIPLE, async (_, settings: Partial<AppSettings>) => {
    console.log('🔥 IPC 핸들러 호출됨 - settings:update-multiple:', settings);
    try {
      const result = await saveSettings(settings);
      console.log('🔥 저장 결과:', result);
      return result;
    } catch (error) {
      console.error('🔥 Saving Error:', error);
      throw error;
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_RESET, async () => {
    return await resetSettings();
  });

  ipcMain.handle(CHANNELS.SETTINGS_SAVE, async () => {
    // 현재 Setup을 파일에 저장
    try {
      const success = await saveSettings(currentSettings);
      console.debug('✅ settings-manager: Setup 저장 Completed');
      return success;
    } catch (error) {
      console.error('❌ settings-manager: Setup 저장 Failed:', error);
      return false;
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_LOAD, async () => {
    // 파일에서 Setup 로드
    try {
      await loadSettings();
      console.debug('✅ settings-manager: Setup 로드 Completed');
      return currentSettings;
    } catch (error) {
      console.error('❌ settings-manager: Setup 로드 Failed:', error);
      return null;
    }
  });

  handlersRegistered = true; // 등록 Completed 표시
  debugLog('Setup 관리자 IPC 핸들러 등록 Completed');
}

/**
 * Setup 변경 리스너 추가
 */
export function addSettingsListener(listener: SettingsListener): void {
  settingsListeners.push(listener);
}

/**
 * Setup 변경 리스너 제거
 */
export function removeSettingsListener(listener: SettingsListener): void {
  const index = settingsListeners.indexOf(listener);
  if (index > -1) {
    settingsListeners.splice(index, 1);
  }
}

/**
 * 현재 Setup 가져오기
 */
export function getSettings(): AppSettings {
  return { ...currentSettings };
}

/**
 * 개별 Setup 가져오기
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return currentSettings[key];
}

/**
 * Setup 변경 여부 확인
 */
export function hasUnsavedSettingsChanges(): boolean {
  return hasUnsavedChanges;
}

/**
 * Setup 관리자 Cleanup
 */
export function cleanupSettingsManager(): void {
  settingsListeners.splice(0);
  hasUnsavedChanges = false;
  debugLog('Setup 관리자 Cleanup Completed');
}

/**
 * Setup 관리자 객체
 */
const SettingsManager = {
  initialize: initializeSettingsManager,
  getSettings,
  getSetting,
  updateSetting: async (key: keyof AppSettings, value: any) => {
    return await saveSettings({ [key]: value });
  },
  updateMultipleSettings: saveSettings,
  resetSettings,
  exportSettings,
  importSettings,
  validateSettings,
  createBackup: createSettingsBackup,
  addListener: addSettingsListener,
  removeListener: removeSettingsListener,
  hasUnsavedChanges: hasUnsavedSettingsChanges,
  cleanup: cleanupSettingsManager
};

// 기본 내보내기
export default SettingsManager;

// IPC 핸들러 등록 확인 로그
console.log('🔥 settings-manager.ts: IPC 핸들러 등록 완료');
console.log('🔥 등록된 핸들러 목록:');
console.log(`  - ${CHANNELS.SETTINGS_GET_ALL}`);
console.log(`  - ${CHANNELS.SETTINGS_GET}`);
console.log(`  - ${CHANNELS.SETTINGS_SET}`);
console.log(`  - ${CHANNELS.SETTINGS_UPDATE}`);
console.log(`  - ${CHANNELS.SETTINGS_UPDATE_MULTIPLE}`);
console.log(`  - ${CHANNELS.SETTINGS_RESET}`);
console.log(`  - ${CHANNELS.SETTINGS_SAVE}`);
console.log(`  - ${CHANNELS.SETTINGS_LOAD}`);
