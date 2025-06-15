"use strict";
/**
 * Loop 6 설정 관리 시스템
 *
 * 앱 설정의 로드, 저장, 유효성 검사 및 적용을 담당하는 종합적인 설정 관리자입니다.
 * electron-store를 기반으로 하며, Loop 3의 설정 시스템을 완전히 마이그레이션했습니다.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSettingsManager = initializeSettingsManager;
exports.validateSettings = validateSettings;
exports.exportSettings = exportSettings;
exports.importSettings = importSettings;
exports.createSettingsBackup = createSettingsBackup;
exports.resetSettings = resetSettings;
exports.addSettingsListener = addSettingsListener;
exports.removeSettingsListener = removeSettingsListener;
exports.getSettings = getSettings;
exports.getSetting = getSetting;
exports.hasUnsavedSettingsChanges = hasUnsavedSettingsChanges;
exports.cleanupSettingsManager = cleanupSettingsManager;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**
 * 디렉토리 존재 확인 및 생성
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    }
    catch {
        await fs.mkdir(dirPath, { recursive: true });
        (0, utils_1.debugLog)('디렉토리 생성됨:', dirPath);
    }
}
// electron-store 인스턴스
let store;
let currentSettings = { ...constants_1.DEFAULT_SETTINGS };
let isInitialized = false;
let handlersRegistered = false; // IPC 핸들러 등록 상태 추적
const settingsListeners = [];
const settingsHistory = [];
let hasUnsavedChanges = false;
/**
 * 설정 관리자 초기화
 */
async function initializeSettingsManager() {
    if (isInitialized) {
        console.log('⚠️ 설정 관리자가 이미 초기화되어 있습니다');
        return;
    }
    try {
        console.log('🚀 설정 관리자 초기화 시작...');
        console.log('📁 사용할 userData 경로:', constants_1.PATHS.userData);
        // userData 폴더 생성 확보
        await ensureDirectoryExists(constants_1.PATHS.userData);
        await ensureDirectoryExists(constants_1.PATHS.config);
        await ensureDirectoryExists(constants_1.PATHS.logs);
        await ensureDirectoryExists(constants_1.PATHS.database);
        await ensureDirectoryExists(constants_1.PATHS.backup);
        console.log('✅ userData 디렉토리 구조 생성 완료:', constants_1.PATHS.userData);
        // electron-store 초기화
        store = new electron_store_1.default({
            name: 'loop-settings',
            cwd: constants_1.PATHS.userData,
            defaults: constants_1.DEFAULT_SETTINGS,
            migrations: {
                '>=6.0.0': (store) => {
                    // Loop 6 마이그레이션 로직
                    console.log('🔄 Loop 6 설정 마이그레이션 실행');
                }
            }
        });
        console.log('📦 electron-store 초기화 완료');
        // 설정 로드
        await loadSettings();
        // IPC 핸들러 등록
        registerIPCHandlers();
        console.log('🔥 IPC 핸들러 등록 완료');
        isInitialized = true;
        console.log('✅ 설정 관리자 초기화 완료');
        console.log('🔥 현재 설정:', Object.keys(currentSettings));
    }
    catch (error) {
        console.error('❌ 설정 관리자 초기화 실패:', error);
        // 기본 설정으로 폴백
        currentSettings = { ...constants_1.DEFAULT_SETTINGS };
        isInitialized = true;
    }
}
/**
 * 설정 로드
 */
async function loadSettings() {
    try {
        (0, utils_1.debugLog)('설정 로드 중...');
        // electron-store에서 설정 가져오기
        const storedSettings = store.store || {};
        // Loop 3 호환성을 위한 레거시 설정 확인
        const legacySettingsPath = path.join(constants_1.PATHS.userData, 'settings.json');
        let legacySettings = {};
        try {
            const legacyData = await fs.readFile(legacySettingsPath, 'utf-8');
            legacySettings = JSON.parse(legacyData);
            (0, utils_1.debugLog)('레거시 설정 발견, 마이그레이션 중...');
        }
        catch {
            // 레거시 설정 파일이 없음 (정상)
        }
        // 설정 병합 (우선순위: stored > legacy > default)
        currentSettings = {
            ...constants_1.DEFAULT_SETTINGS,
            ...legacySettings,
            ...storedSettings
        };
        // 설정 유효성 검사 및 수정
        const validation = validateSettings(currentSettings);
        if (validation.correctedSettings) {
            currentSettings = { ...currentSettings, ...validation.correctedSettings };
            await saveSettings(currentSettings);
        }
        // 카테고리 설정 보정
        ensureCategorySettings();
        (0, utils_1.debugLog)('설정 로드 완료:', currentSettings);
        return currentSettings;
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 로드 실패:', error);
        currentSettings = { ...constants_1.DEFAULT_SETTINGS };
        return currentSettings;
    }
}
/**
 * 설정 저장
 */
async function saveSettings(settings) {
    try {
        console.log('💾 설정 저장 시작:', settings);
        if (!isInitialized) {
            throw new Error('설정 관리자가 초기화되지 않음');
        }
        // 현재 설정과 병합
        const newSettings = { ...currentSettings, ...settings };
        console.log('🔄 병합된 설정:', newSettings);
        // 유효성 검사
        const validation = validateSettings(newSettings);
        if (!validation.isValid) {
            console.error('❌ 설정 유효성 검사 실패:', validation.errors);
            return false;
        }
        // 변경 사항 추적
        const changes = [];
        for (const [key, value] of Object.entries(settings)) {
            const oldValue = currentSettings[key];
            if (oldValue !== value) {
                changes.push({
                    key: key,
                    oldValue,
                    newValue: value,
                    timestamp: Date.now()
                });
            }
        }
        console.log('📝 설정 변경사항:', changes);
        // electron-store에 저장
        for (const [key, value] of Object.entries(newSettings)) {
            store.set(key, value);
        }
        console.log('💿 electron-store 저장 완료');
        // JSON 파일로도 저장 (Loop 3 호환성)
        const settingsPath = path.join(constants_1.PATHS.userData, 'settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8');
        console.log('📁 JSON 파일 저장 완료:', settingsPath);
        currentSettings = newSettings;
        // 변경 이벤트 발생
        changes.forEach(change => {
            settingsHistory.push(change);
            settingsListeners.forEach(listener => listener(change));
        });
        // 설정 변경 시 필요한 액션 수행
        await applySettingsChanges(changes);
        hasUnsavedChanges = false;
        console.log('✅ 설정 저장 완료');
        return true;
    }
    catch (error) {
        console.error('❌ 설정 저장 실패:', error);
        return false;
    }
}
/**
 * 카테고리 설정 보정
 */
function ensureCategorySettings() {
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
        (0, utils_1.debugLog)('카테고리 설정 초기화됨');
    }
    else {
        // 필요한 모든 카테고리 키가 있는지 확인
        const requiredCategories = ['docs', 'office', 'coding', 'sns', 'browser', 'game', 'media', 'other'];
        let updated = false;
        requiredCategories.forEach(category => {
            if (currentSettings.enabledCategories[category] === undefined) {
                currentSettings.enabledCategories[category] = true;
                updated = true;
            }
        });
        if (updated) {
            (0, utils_1.debugLog)('카테고리 설정 업데이트됨');
        }
    }
}
/**
 * 설정 유효성 검사
 */
function validateSettings(settings) {
    const errors = [];
    const warnings = [];
    const correctedSettings = {};
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
        // 카테고리 설정 검증
        if (settings.enabledCategories !== undefined) {
            if (typeof settings.enabledCategories !== 'object' ||
                settings.enabledCategories === null) {
                errors.push('카테고리 설정이 올바르지 않음');
                correctedSettings.enabledCategories = constants_1.DEFAULT_SETTINGS.enabledCategories;
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            correctedSettings: Object.keys(correctedSettings).length > 0 ? correctedSettings : undefined
        };
    }
    catch (error) {
        return {
            isValid: false,
            errors: [`설정 유효성 검사 중 오류: ${error}`],
            warnings: []
        };
    }
}
/**
 * 설정 변경사항 적용
 */
async function applySettingsChanges(changes) {
    try {
        for (const change of changes) {
            await applySettingChange(change);
        }
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 변경사항 적용 실패:', error);
    }
}
/**
 * 개별 설정 변경사항 적용
 */
async function applySettingChange(change) {
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
            (0, utils_1.debugLog)(`설정 변경 적용: ${key} = ${newValue}`);
    }
}
/**
 * 테마 변경 적용
 */
async function applyThemeChange(theme) {
    try {
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('theme-changed', { theme });
            }
        });
        (0, utils_1.debugLog)('테마 변경 적용:', theme);
    }
    catch (error) {
        (0, utils_1.errorLog)('테마 변경 적용 실패:', error);
    }
}
/**
 * 창 모드 변경 적용
 */
async function applyWindowModeChange(windowMode) {
    try {
        const mainWindow = electron_1.BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
        if (!mainWindow)
            return;
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
        (0, utils_1.debugLog)('창 모드 변경 적용:', windowMode);
    }
    catch (error) {
        (0, utils_1.errorLog)('창 모드 변경 적용 실패:', error);
    }
}
/**
 * GPU 설정 변경 적용
 */
async function applyGPUSettingsChange() {
    try {
        // GPU 설정 변경은 재시작이 필요함을 사용자에게 알림
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('gpu-settings-changed', {
                    requiresRestart: true
                });
            }
        });
        (0, utils_1.debugLog)('GPU 설정 변경 알림 전송');
    }
    catch (error) {
        (0, utils_1.errorLog)('GPU 설정 변경 적용 실패:', error);
    }
}
/**
 * 트레이 설정 변경 적용
 */
async function applyTraySettingsChange() {
    try {
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('tray-settings-changed', {
                    minimizeToTray: currentSettings.minimizeToTray,
                    showTrayNotifications: currentSettings.showTrayNotifications
                });
            }
        });
        (0, utils_1.debugLog)('트레이 설정 변경 적용');
    }
    catch (error) {
        (0, utils_1.errorLog)('트레이 설정 변경 적용 실패:', error);
    }
}
/**
 * 모니터링 설정 변경 적용
 */
async function applyMonitoringSettingsChange(enabled) {
    try {
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('monitoring-settings-changed', { enabled });
            }
        });
        (0, utils_1.debugLog)('모니터링 설정 변경 적용:', enabled);
    }
    catch (error) {
        (0, utils_1.errorLog)('모니터링 설정 변경 적용 실패:', error);
    }
}
/**
 * 단축키 설정 변경 적용
 */
async function applyShortcutSettingsChange(enabled) {
    try {
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('shortcut-settings-changed', { enabled });
            }
        });
        (0, utils_1.debugLog)('단축키 설정 변경 적용:', enabled);
    }
    catch (error) {
        (0, utils_1.errorLog)('단축키 설정 변경 적용 실패:', error);
    }
}
/**
 * 설정 내보내기
 */
async function exportSettings(filePath) {
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
        (0, utils_1.debugLog)('설정 내보내기 완료:', filePath);
        return true;
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 내보내기 실패:', error);
        return false;
    }
}
/**
 * 설정 가져오기
 */
async function importSettings(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const importData = JSON.parse(data);
        // 가져온 설정 유효성 검사
        const validation = validateSettings(importData.settings || importData);
        if (!validation.isValid) {
            (0, utils_1.errorLog)('가져온 설정이 유효하지 않음:', validation.errors);
            return false;
        }
        // 설정 적용
        const success = await saveSettings(importData.settings || importData);
        if (success) {
            (0, utils_1.debugLog)('설정 가져오기 완료:', filePath);
        }
        return success;
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 가져오기 실패:', error);
        return false;
    }
}
/**
 * 설정 백업 생성
 */
async function createSettingsBackup() {
    try {
        const backupDir = path.join(constants_1.PATHS.backup, 'settings');
        await fs.mkdir(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `settings-backup-${timestamp}.json`);
        await exportSettings(backupPath);
        (0, utils_1.debugLog)('설정 백업 생성:', backupPath);
        return backupPath;
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 백업 생성 실패:', error);
        throw error;
    }
}
/**
 * 설정 초기화
 */
async function resetSettings() {
    try {
        // 백업 생성
        await createSettingsBackup();
        // 기본 설정으로 복원
        currentSettings = { ...constants_1.DEFAULT_SETTINGS };
        store.clear();
        for (const [key, value] of Object.entries(currentSettings)) {
            store.set(key, value);
        }
        // 모든 창에 설정 초기화 알림
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('settings-reset');
            }
        });
        hasUnsavedChanges = false;
        (0, utils_1.debugLog)('설정 초기화 완료');
        return true;
    }
    catch (error) {
        (0, utils_1.errorLog)('설정 초기화 실패:', error);
        return false;
    }
}
/**
 * IPC 핸들러 등록
 */
function registerIPCHandlers() {
    // 중복 등록 방지
    if (handlersRegistered) {
        (0, utils_1.debugLog)('설정 IPC 핸들러가 이미 등록되어 있습니다');
        return;
    }
    // 설정 가져오기
    electron_1.ipcMain.handle('settingsGet', () => {
        return currentSettings;
    });
    // 개별 설정 가져오기
    electron_1.ipcMain.handle('settingsGetSetting', (_, key) => {
        return currentSettings[key];
    });
    // 설정 업데이트
    electron_1.ipcMain.handle('settingsUpdate', async (_, key, value) => {
        return await saveSettings({ [key]: value });
    });
    // 다중 설정 업데이트
    electron_1.ipcMain.handle('settingsUpdateMultiple', async (_, settings) => {
        console.log('🔥 IPC 핸들러 호출됨 - settingsUpdateMultiple:', settings);
        try {
            const result = await saveSettings(settings);
            console.log('🔥 저장 결과:', result);
            return result;
        }
        catch (error) {
            console.error('🔥 저장 중 오류:', error);
            throw error;
        }
    });
    // 설정 초기화
    electron_1.ipcMain.handle('settingsReset', async () => {
        return await resetSettings();
    });
    // 설정 내보내기
    electron_1.ipcMain.handle('settingsExport', async (_, filePath) => {
        return await exportSettings(filePath);
    });
    // 설정 가져오기
    electron_1.ipcMain.handle('settingsImport', async (_, filePath) => {
        return await importSettings(filePath);
    });
    // 설정 유효성 검사
    electron_1.ipcMain.handle('settingsValidate', (_, settings) => {
        return validateSettings(settings);
    });
    // 설정 백업 생성
    electron_1.ipcMain.handle('settingsCreateBackup', async () => {
        return await createSettingsBackup();
    });
    // 설정 변경 이력 가져오기
    electron_1.ipcMain.handle('settingsGetHistory', () => {
        return settingsHistory;
    });
    // 설정 변경 이력 지우기
    electron_1.ipcMain.handle('settingsClearHistory', () => {
        settingsHistory.splice(0);
        return true;
    });
    // 새로운 CHANNELS 상수와 일치하는 핸들러들 추가
    electron_1.ipcMain.handle('settings:get', (_, key) => {
        if (key) {
            return currentSettings[key];
        }
        return currentSettings;
    });
    electron_1.ipcMain.handle('settings:getAll', () => {
        return currentSettings;
    });
    electron_1.ipcMain.handle('settings:set', async (_, key, value) => {
        return await saveSettings({ [key]: value });
    });
    electron_1.ipcMain.handle('settings:update', async (_, key, value) => {
        return await saveSettings({ [key]: value });
    });
    electron_1.ipcMain.handle('settings:update-multiple', async (_, settings) => {
        console.log('🔥 IPC 핸들러 호출됨 - settings:update-multiple:', settings);
        try {
            const result = await saveSettings(settings);
            console.log('🔥 저장 결과:', result);
            return result;
        }
        catch (error) {
            console.error('🔥 저장 중 오류:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('settings:reset', async () => {
        return await resetSettings();
    });
    electron_1.ipcMain.handle('settings:save', async () => {
        // 현재 설정을 파일에 저장
        try {
            const success = await saveSettings(currentSettings);
            console.debug('✅ settings-manager: 설정 저장 완료');
            return success;
        }
        catch (error) {
            console.error('❌ settings-manager: 설정 저장 실패:', error);
            return false;
        }
    });
    electron_1.ipcMain.handle('settings:load', async () => {
        // 파일에서 설정 로드
        try {
            await loadSettings();
            console.debug('✅ settings-manager: 설정 로드 완료');
            return currentSettings;
        }
        catch (error) {
            console.error('❌ settings-manager: 설정 로드 실패:', error);
            return null;
        }
    });
    handlersRegistered = true; // 등록 완료 표시
    (0, utils_1.debugLog)('설정 관리자 IPC 핸들러 등록 완료');
}
/**
 * 설정 변경 리스너 추가
 */
function addSettingsListener(listener) {
    settingsListeners.push(listener);
}
/**
 * 설정 변경 리스너 제거
 */
function removeSettingsListener(listener) {
    const index = settingsListeners.indexOf(listener);
    if (index > -1) {
        settingsListeners.splice(index, 1);
    }
}
/**
 * 현재 설정 가져오기
 */
function getSettings() {
    return { ...currentSettings };
}
/**
 * 개별 설정 가져오기
 */
function getSetting(key) {
    return currentSettings[key];
}
/**
 * 설정 변경 여부 확인
 */
function hasUnsavedSettingsChanges() {
    return hasUnsavedChanges;
}
/**
 * 설정 관리자 정리
 */
function cleanupSettingsManager() {
    settingsListeners.splice(0);
    hasUnsavedChanges = false;
    (0, utils_1.debugLog)('설정 관리자 정리 완료');
}
/**
 * 설정 관리자 객체
 */
const SettingsManager = {
    initialize: initializeSettingsManager,
    getSettings,
    getSetting,
    updateSetting: async (key, value) => {
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
exports.default = SettingsManager;
//# sourceMappingURL=settings-manager.js.map