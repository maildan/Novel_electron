"use strict";
/**
 * Loop 6 NAPI 네이티브 모듈 클라이언트
 *
 * 새로 빌드된 NAPI 네이티브 모듈과의 연동을 위한 클라이언트
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeClient = void 0;
exports.registerNativeIpcHandlers = registerNativeIpcHandlers;
exports.cleanupNativeIpcHandlers = cleanupNativeIpcHandlers;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const utils_1 = require("../shared/utils");
class NativeModuleClient {
    constructor() {
        this.module = null;
        this.status = {
            isLoaded: false,
            isAvailable: false,
            error: null,
            version: null,
            loadTime: 0
        };
        this.loadModule();
    }
    /**
     * 네이티브 모듈 로드 (index.js를 통한 로드)
     */
    loadModule() {
        const startTime = Date.now();
        try {
            const fs = require('fs');
            const isDev = process.env.NODE_ENV === 'development';
            // 가능한 네이티브 모듈 디렉토리 경로들을 우선순위 순으로 정의
            const possibleBasePaths = [];
            if (isDev) {
                // 개발 모드 경로들 (우선순위 순)
                possibleBasePaths.push(path_1.default.join(process.cwd(), 'dist', 'native-modules'), path_1.default.join(process.cwd(), 'native-modules'), path_1.default.join(__dirname, '..', '..', 'dist', 'native-modules'), path_1.default.join(__dirname, '..', '..', 'native-modules'));
            }
            else {
                // 프로덕션 모드 경로들
                const resourcesPath = process.resourcesPath || path_1.default.dirname(require.main?.filename || '');
                possibleBasePaths.push(path_1.default.join(resourcesPath, 'native-modules'), path_1.default.join(resourcesPath, '..', 'native-modules'), path_1.default.join(process.cwd(), 'native-modules'));
            }
            // 각 경로에서 index.js를 찾아서 첫 번째로 존재하는 모듈 사용
            let modulePath = null;
            for (const basePath of possibleBasePaths) {
                const indexPath = path_1.default.join(basePath, 'index.js');
                (0, utils_1.debugLog)(`🔍 네이티브 모듈 index.js 경로 확인: ${indexPath}`);
                if (fs.existsSync(indexPath)) {
                    modulePath = basePath;
                    (0, utils_1.debugLog)(`✅ 네이티브 모듈 디렉토리 발견: ${basePath}`);
                    break;
                }
            }
            if (!modulePath) {
                const errorMsg = `❌ 네이티브 모듈을 찾을 수 없습니다. 시도한 경로들:\n${possibleBasePaths.map(p => `  - ${path_1.default.join(p, 'index.js')}`).join('\n')}`;
                throw new Error(errorMsg);
            }
            (0, utils_1.debugLog)('🚀 NAPI 네이티브 모듈 로드 시도:', modulePath);
            // 네이티브 모듈 로드 (index.js를 통해)
            const indexPath = path_1.default.join(modulePath, 'index.js');
            (0, utils_1.debugLog)('🚀 네이티브 모듈 index.js 로드 시도:', indexPath);
            // index.js 파일 존재 확인
            if (!fs.existsSync(indexPath)) {
                throw new Error(`index.js 파일이 존재하지 않습니다: ${indexPath}`);
            }
            this.module = require(indexPath);
            (0, utils_1.debugLog)('📦 네이티브 모듈 require() 완료');
            if (this.module) {
                if (typeof this.module.isNativeModuleAvailable === 'function') {
                    // 먼저 초기화 시도
                    const initResult = this.module.initializeNativeModules?.();
                    (0, utils_1.debugLog)('🔧 네이티브 모듈 초기화 결과:', initResult);
                    let isAvailable = false;
                    try {
                        isAvailable = this.module.isNativeModuleAvailable();
                        (0, utils_1.debugLog)('🔍 네이티브 모듈 사용 가능 여부:', isAvailable);
                    }
                    catch (checkError) {
                        throw new Error(`isNativeModuleAvailable 호출 실패: ${checkError}`);
                    }
                    if (isAvailable) {
                        // 버전 정보 가져오기
                        const version = this.module.getNativeModuleVersion?.() || 'unknown';
                        this.status = {
                            isLoaded: true,
                            isAvailable: true,
                            error: null,
                            version,
                            loadTime: Date.now() - startTime
                        };
                        (0, utils_1.debugLog)(`✅ NAPI 네이티브 모듈 로드 성공 (v${version})`);
                    }
                    else {
                        (0, utils_1.debugLog)('❌ 네이티브 모듈이 사용 가능하지 않음');
                        throw new Error('Native module is not available');
                    }
                }
                else {
                    throw new Error('isNativeModuleAvailable 함수가 존재하지 않습니다');
                }
            }
            else {
                throw new Error('Failed to load native module');
            }
        }
        catch (error) {
            this.status = {
                isLoaded: false,
                isAvailable: false,
                error: error instanceof Error ? error : new Error(String(error)),
                version: null,
                loadTime: Date.now() - startTime
            };
            (0, utils_1.errorLog)('NAPI 네이티브 모듈 로드 실패:', error);
        }
    }
    /**
     * 모듈 상태 확인
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * 모듈 사용 가능 여부 확인
     */
    isAvailable() {
        // 모듈이 로드되지 않았거나 상태가 없으면 false 반환
        if (!this.module || !this.status.isLoaded) {
            return false;
        }
        try {
            // 네이티브 모듈의 기본 함수들이 존재하는지 확인
            const hasBasicFunctions = !!(this.module.getMemoryUsage ||
                this.module.startMemoryMonitoring ||
                this.module.getSystemInfo);
            // isNativeModuleAvailable 함수가 있는지 확인 후 호출
            let nativeAvailable = false;
            if (typeof this.module.isNativeModuleAvailable === 'function') {
                nativeAvailable = this.module.isNativeModuleAvailable();
            }
            else {
                // 함수가 없는 경우 기본 함수 존재 여부로 판단
                nativeAvailable = hasBasicFunctions;
            }
            // 상태 업데이트
            this.status.isAvailable = nativeAvailable;
            return nativeAvailable;
        }
        catch (error) {
            (0, utils_1.errorLog)('isAvailable 체크 중 오류:', error);
            // 오류가 발생해도 모듈이 로드되었다면 기본적으로 사용 가능한 것으로 간주
            this.status.isAvailable = this.status.isLoaded;
            return this.status.isLoaded;
        }
    }
    // 메모리 관련 메서드들
    getMemoryUsage() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getMemoryUsage();
        }
        catch (error) {
            (0, utils_1.errorLog)('getMemoryUsage 호출 오류:', error);
            return null;
        }
    }
    startMemoryMonitoring() {
        if (!this.module || !this.status.isAvailable)
            return false;
        try {
            return this.module.startMemoryMonitoring();
        }
        catch (error) {
            (0, utils_1.errorLog)('startMemoryMonitoring 호출 오류:', error);
            return false;
        }
    }
    getMemoryStats() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getMemoryStats();
        }
        catch (error) {
            (0, utils_1.errorLog)('getMemoryStats 호출 오류:', error);
            return null;
        }
    }
    resetMemoryMonitoring() {
        if (!this.module || !this.status.isAvailable)
            return false;
        try {
            return this.module.resetMemoryMonitoring();
        }
        catch (error) {
            (0, utils_1.errorLog)('resetMemoryMonitoring 호출 오류:', error);
            return false;
        }
    }
    // GPU 관련 메서드들
    getGpuInfo() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getGpuInfo();
        }
        catch (error) {
            (0, utils_1.errorLog)('getGpuInfo 호출 오류:', error);
            return null;
        }
    }
    startGpuMonitoring() {
        if (!this.module || !this.status.isAvailable)
            return false;
        try {
            return this.module.startGpuMonitoring();
        }
        catch (error) {
            (0, utils_1.errorLog)('startGpuMonitoring 호출 오류:', error);
            return false;
        }
    }
    getGpuStats() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getGpuStats();
        }
        catch (error) {
            (0, utils_1.errorLog)('getGpuStats 호출 오류:', error);
            return null;
        }
    }
    resetGpuMonitoring() {
        if (!this.module || !this.status.isAvailable)
            return false;
        try {
            return this.module.resetGpuMonitoring();
        }
        catch (error) {
            (0, utils_1.errorLog)('resetGpuMonitoring 호출 오류:', error);
            return false;
        }
    }
    // 시스템 정보 메서드들
    getSystemInfo() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getSystemInfo();
        }
        catch (error) {
            (0, utils_1.errorLog)('getSystemInfo 호출 오류:', error);
            return null;
        }
    }
    // 유틸리티 메서드들
    generateUuid() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.generateUuid();
        }
        catch (error) {
            (0, utils_1.errorLog)('generateUuid 호출 오류:', error);
            return null;
        }
    }
    getTimestamp() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getTimestamp();
        }
        catch (error) {
            (0, utils_1.errorLog)('getTimestamp 호출 오류:', error);
            return null;
        }
    }
    getTimestampString() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getTimestampString();
        }
        catch (error) {
            (0, utils_1.errorLog)('getTimestampString 호출 오류:', error);
            return null;
        }
    }
    getNativeModuleInfo() {
        if (!this.module || !this.status.isAvailable)
            return null;
        try {
            return this.module.getNativeModuleInfo();
        }
        catch (error) {
            (0, utils_1.errorLog)('getNativeModuleInfo 호출 오류:', error);
            return null;
        }
    }
    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.module && this.status.isAvailable) {
            try {
                this.module.cleanupNativeModules?.();
                (0, utils_1.debugLog)('네이티브 모듈 정리 완료');
            }
            catch (error) {
                (0, utils_1.errorLog)('네이티브 모듈 정리 중 오류:', error);
            }
        }
    }
}
// 싱글톤 인스턴스 생성
exports.nativeClient = new NativeModuleClient();
/**
 * 네이티브 모듈 관련 IPC 핸들러 등록
 */
function registerNativeIpcHandlers() {
    // 네이티브 모듈 사용 가능 여부 확인
    electron_1.ipcMain.handle('native:isNativeModuleAvailable', async () => {
        try {
            const status = exports.nativeClient.getStatus();
            return {
                success: true,
                data: status.isAvailable
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 모듈 사용 가능 여부 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    });
    // 네이티브 모듈 버전 정보
    electron_1.ipcMain.handle('native:getNativeModuleVersion', async () => {
        try {
            const status = exports.nativeClient.getStatus();
            return {
                success: true,
                data: status.version || '알 수 없음'
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 모듈 버전 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    });
    // 네이티브 모듈 상세 정보
    electron_1.ipcMain.handle('native:getNativeModuleInfo', async () => {
        try {
            const info = exports.nativeClient.getNativeModuleInfo();
            return {
                success: true,
                data: info
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 모듈 상세 정보 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    });
    // 기존 호환성 핸들러들 (camelCase 형태)
    electron_1.ipcMain.handle('native:getStatus', async () => {
        try {
            const status = exports.nativeClient.getStatus();
            return {
                success: true,
                data: {
                    isLoaded: status.isLoaded,
                    isAvailable: status.isAvailable,
                    version: status.version,
                    loadTime: status.loadTime,
                    error: status.error ? status.error.message : null
                }
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 상태 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    });
    electron_1.ipcMain.handle('native:getInfo', async () => {
        try {
            const info = exports.nativeClient.getNativeModuleInfo();
            return {
                success: true,
                data: info
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 정보 조회 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    });
    (0, utils_1.debugLog)('네이티브 모듈 관련 IPC 핸들러 등록 완료 (kebab-case 형태 포함)');
}
/**
 * 네이티브 모듈 관련 IPC 핸들러 정리
 */
function cleanupNativeIpcHandlers() {
    // kebab-case 형태 핸들러들
    electron_1.ipcMain.removeHandler('native:isNativeModuleAvailable');
    electron_1.ipcMain.removeHandler('native:getNativeModuleVersion');
    electron_1.ipcMain.removeHandler('native:getNativeModuleInfo');
    // 기존 호환성 핸들러들
    electron_1.ipcMain.removeHandler('native:get-status');
    electron_1.ipcMain.removeHandler('native:getInfo');
    (0, utils_1.debugLog)('네이티브 모듈 관련 IPC 핸들러 정리 완료');
}
//# sourceMappingURL=native-client.js.map