"use strict";
/**
 * Loop 6 GPU 유틸리티 모듈
 * Loop 3의 고급 GPU 관리 기능을 TypeScript로 완전 마이그레이션
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGPUManager = getGPUManager;
exports.setupGpuAcceleration = setupGpuAcceleration;
exports.getGPUInfo = getGPUInfo;
exports.toggleHardwareAcceleration = toggleHardwareAcceleration;
exports.isHardwareAccelerationEnabled = isHardwareAccelerationEnabled;
exports.runGpuAcceleration = runGpuAcceleration;
exports.runGpuBenchmark = runGpuBenchmark;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const utils_1 = require("../shared/utils");
const native_modules_1 = require("../native-modules");
// GPU 상태 관리
class GPUManager {
    constructor() {
        this.isInitialized = false;
        this.performanceMetrics = [];
        this.gpuInfo = null;
        // 사용자 데이터 경로 설정
        const userDataPath = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '../../userData')
            : electron_1.app.getPath('userData');
        this.configPath = path.join(userDataPath, 'gpu-settings.json');
        // 기본 설정
        this.settings = {
            acceleration: true,
            batteryOptimization: true,
            processingMode: 'auto',
            vsync: true,
            webGLEnabled: true,
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * GPU 관리자 초기화
     */
    async initialize() {
        try {
            (0, utils_1.debugLog)('GPU 관리자 초기화 시작');
            // 설정 파일 로드
            await this.loadSettings();
            // GPU 정보 수집
            await this.collectGPUInfo();
            // 환경 변수 기반 설정 적용
            this.applyEnvironmentSettings();
            // 네이티브 모듈을 통한 GPU 초기화
            await this.initializeNativeGPU();
            this.isInitialized = true;
            (0, utils_1.debugLog)('GPU 관리자 초기화 완료');
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 관리자 초기화 중 오류:', error);
            this.isInitialized = false;
        }
    }
    /**
     * 설정 파일 로드
     */
    async loadSettings() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const loadedSettings = JSON.parse(data);
                this.settings = { ...this.settings, ...loadedSettings };
                (0, utils_1.debugLog)('GPU 설정 로드 완료');
            }
            else {
                await this.saveSettings();
                (0, utils_1.debugLog)('기본 GPU 설정 생성 완료');
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 설정 로드 중 오류:', error);
        }
    }
    /**
     * 설정 파일 저장
     */
    async saveSettings() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.settings.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
            (0, utils_1.debugLog)('GPU 설정 저장 완료');
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 설정 저장 중 오류:', error);
        }
    }
    /**
     * GPU 정보 수집
     */
    async collectGPUInfo() {
        try {
            // 네이티브 모듈을 통한 GPU 정보 수집
            const nativeModule = await native_modules_1.nativeModuleLoader.loadModule();
            if (nativeModule.isAvailable && nativeModule.getGpuInfo) {
                this.gpuInfo = nativeModule.getGpuInfo();
                (0, utils_1.debugLog)('네이티브 모듈을 통한 GPU 정보 수집 완료:', this.gpuInfo);
            }
            else {
                // JavaScript 폴백으로 기본 GPU 정보 생성
                this.gpuInfo = {
                    name: 'Unknown GPU',
                    vendor: 'unknown',
                    isAvailable: false,
                    isAccelerated: false,
                    performanceScore: 0
                };
                (0, utils_1.debugLog)('JavaScript 폴백으로 GPU 정보 생성');
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 정보 수집 중 오류:', error);
            this.gpuInfo = null;
        }
    }
    /**
     * 환경 변수 기반 설정 적용
     */
    applyEnvironmentSettings() {
        const envGpuMode = process.env.GPU_MODE;
        if (envGpuMode) {
            (0, utils_1.debugLog)(`환경 변수 GPU_MODE: ${envGpuMode}`);
            switch (envGpuMode.toLowerCase()) {
                case 'software':
                    this.settings.acceleration = false;
                    this.settings.processingMode = 'software';
                    this.settings.webGLEnabled = false;
                    break;
                case 'hardware':
                case 'gpu':
                    this.settings.acceleration = true;
                    this.settings.processingMode = 'gpu-intensive';
                    this.settings.webGLEnabled = true;
                    break;
                case 'auto':
                default:
                    this.settings.processingMode = 'auto';
                    break;
            }
            (0, utils_1.debugLog)('환경 변수 기반 GPU 설정 적용 완료');
        }
    }
    /**
     * 네이티브 모듈을 통한 GPU 초기화
     */
    async initializeNativeGPU() {
        try {
            const nativeModule = await native_modules_1.nativeModuleLoader.loadModule();
            if (nativeModule.isAvailable) {
                // GPU 가속화 설정
                if (this.settings.acceleration && nativeModule.gpuAccelerate) {
                    const result = nativeModule.gpuAccelerate('initialize', {
                        highPerformance: this.settings.processingMode === 'gpu-intensive',
                        vsync: this.settings.vsync
                    });
                    (0, utils_1.debugLog)('네이티브 GPU 가속화 초기화 결과:', result);
                }
                // GPU 벤치마크 실행 (성능 측정)
                if (nativeModule.runGpuBenchmark) {
                    const benchmark = nativeModule.runGpuBenchmark();
                    (0, utils_1.debugLog)('GPU 벤치마크 결과:', benchmark);
                    if (this.gpuInfo && benchmark.score) {
                        this.gpuInfo.performanceScore = benchmark.score;
                    }
                }
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('네이티브 GPU 초기화 중 오류:', error);
        }
    }
    /**
     * 하드웨어 가속 토글
     */
    async toggleHardwareAcceleration(enable) {
        try {
            this.settings.acceleration = enable;
            if (electron_1.app.isReady()) {
                // 앱이 이미 준비된 상태에서는 재시작 필요
                (0, utils_1.debugLog)(`하드웨어 가속 ${enable ? '활성화' : '비활성화'} - 재시작 필요`);
                return false; // 재시작 필요함을 알림
            }
            else {
                // 앱 준비 전에는 즉시 적용 가능
                if (!enable) {
                    electron_1.app.disableHardwareAcceleration();
                }
                (0, utils_1.debugLog)(`하드웨어 가속 ${enable ? '활성화' : '비활성화'} 완료`);
            }
            await this.saveSettings();
            return true;
        }
        catch (error) {
            (0, utils_1.errorLog)('하드웨어 가속 토글 중 오류:', error);
            return false;
        }
    }
    /**
     * GPU 가속화 실행
     */
    async runGpuAcceleration(task, data) {
        try {
            if (!this.settings.acceleration) {
                (0, utils_1.debugLog)('GPU 가속이 비활성화되어 있음');
                return null;
            }
            const nativeModule = await native_modules_1.nativeModuleLoader.loadModule();
            if (nativeModule.isAvailable && nativeModule.gpuAccelerate) {
                const startTime = Date.now();
                const result = nativeModule.gpuAccelerate(task, data);
                const endTime = Date.now();
                // 성능 메트릭 수집
                this.recordPerformanceMetrics({
                    renderTime: endTime - startTime,
                    frameRate: 1000 / (endTime - startTime),
                    memoryUsage: 0, // 네이티브 모듈에서 제공될 수 있음
                    timestamp: Date.now()
                });
                return result;
            }
            else {
                (0, utils_1.debugLog)('네이티브 GPU 모듈 사용 불가, JavaScript 폴백 사용');
                return this.runJavaScriptFallback(task, data);
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 가속화 실행 중 오류:', error);
            return this.runJavaScriptFallback(task, data);
        }
    }
    /**
     * JavaScript 폴백 구현
     */
    runJavaScriptFallback(task, data) {
        (0, utils_1.debugLog)(`JavaScript 폴백으로 ${task} 작업 실행`);
        switch (task) {
            case 'typing-analysis':
                return this.analyzeTypingJS(data);
            case 'image-processing':
                return this.processImageJS(data);
            default:
                return { success: false, error: 'Unsupported task', fallback: true };
        }
    }
    /**
     * JavaScript 타이핑 분석 폴백
     */
    analyzeTypingJS(data) {
        try {
            const { keystrokes, timeSpent, errors } = data;
            const wpm = (keystrokes / 5) / (timeSpent / 60000);
            const accuracy = ((keystrokes - errors) / keystrokes) * 100;
            return {
                wpm: Math.round(wpm),
                accuracy: Math.round(accuracy),
                performance_index: Math.round(wpm * (accuracy / 100)),
                calculated_with: 'javascript_fallback'
            };
        }
        catch (error) {
            (0, utils_1.errorLog)('JavaScript 타이핑 분석 중 오류:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * JavaScript 이미지 처리 폴백
     */
    processImageJS(data) {
        (0, utils_1.debugLog)('JavaScript 이미지 처리 폴백');
        return { success: true, processed: false, method: 'javascript_fallback' };
    }
    /**
     * 성능 메트릭 기록
     */
    recordPerformanceMetrics(metrics) {
        this.performanceMetrics.push(metrics);
        // 최근 100개 메트릭만 유지
        if (this.performanceMetrics.length > 100) {
            this.performanceMetrics = this.performanceMetrics.slice(-100);
        }
    }
    /**
     * 배터리 최적화 모드 설정
     */
    async setBatteryOptimization(enable) {
        this.settings.batteryOptimization = enable;
        if (enable) {
            // 배터리 최적화 시 성능 낮춤
            this.settings.processingMode = 'software';
            this.settings.vsync = true;
        }
        await this.saveSettings();
        (0, utils_1.debugLog)(`배터리 최적화 모드 ${enable ? '활성화' : '비활성화'}`);
    }
    /**
     * GPU 설정 가져오기
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * GPU 정보 가져오기
     */
    getGPUInfo() {
        return this.gpuInfo ? { ...this.gpuInfo } : null;
    }
    /**
     * 성능 메트릭 가져오기
     */
    getPerformanceMetrics() {
        return [...this.performanceMetrics];
    }
    /**
     * 하드웨어 가속 활성화 상태 확인
     */
    isHardwareAccelerationEnabled() {
        return this.settings.acceleration;
    }
    /**
     * GPU 벤치마크 실행
     */
    async runBenchmark() {
        try {
            const nativeModule = await native_modules_1.nativeModuleLoader.loadModule();
            if (nativeModule.isAvailable && nativeModule.runGpuBenchmark) {
                const result = nativeModule.runGpuBenchmark();
                (0, utils_1.debugLog)('GPU 벤치마크 결과:', result);
                return result;
            }
            else {
                // JavaScript 폴백 벤치마크
                return {
                    score: 0,
                    gpu: false,
                    method: 'javascript_fallback',
                    message: 'Native GPU module not available'
                };
            }
        }
        catch (error) {
            (0, utils_1.errorLog)('GPU 벤치마크 실행 중 오류:', error);
            return {
                score: 0,
                gpu: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
// 전역 GPU 관리자 인스턴스
let gpuManager = null;
/**
 * GPU 관리자 인스턴스 가져오기
 */
function getGPUManager() {
    if (!gpuManager) {
        gpuManager = new GPUManager();
    }
    return gpuManager;
}
/**
 * GPU 가속 설정
 */
async function setupGpuAcceleration(enable) {
    const manager = getGPUManager();
    await manager.initialize();
    await manager.toggleHardwareAcceleration(enable);
}
/**
 * GPU 정보 가져오기
 */
async function getGPUInfo() {
    const manager = getGPUManager();
    if (manager) {
        await manager.initialize();
    }
    return manager?.getGPUInfo() || {
        name: 'Unknown GPU',
        vendor: 'Unknown',
        isAvailable: false,
        isAccelerated: false
    };
}
/**
 * 하드웨어 가속 토글
 */
async function toggleHardwareAcceleration(enable) {
    const manager = getGPUManager();
    return await manager.toggleHardwareAcceleration(enable);
}
/**
 * 하드웨어 가속 활성화 상태 확인
 */
function isHardwareAccelerationEnabled() {
    const manager = getGPUManager();
    return manager.isHardwareAccelerationEnabled();
}
/**
 * GPU 가속화 실행
 */
async function runGpuAcceleration(task, data) {
    const manager = getGPUManager();
    return await manager.runGpuAcceleration(task, data);
}
/**
 * GPU 벤치마크 실행
 */
async function runGpuBenchmark() {
    const manager = getGPUManager();
    return await manager.runBenchmark();
}
exports.default = gpuManager;
//# sourceMappingURL=gpu-utils.js.map