"use strict";
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
exports.nativeModuleLoader = void 0;
exports.loadNativeModule = loadNativeModule;
exports.getNativeModuleStatus = getNativeModuleStatus;
exports.getGpuInfo = getGpuInfo;
exports.getGpuMemoryStats = getGpuMemoryStats;
exports.runGpuAcceleration = runGpuAcceleration;
exports.runGpuBenchmark = runGpuBenchmark;
exports.optimizeMemoryAdvanced = optimizeMemoryAdvanced;
exports.getMemoryInfo = getMemoryInfo;
exports.optimizeMemory = optimizeMemory;
exports.cleanupMemory = cleanupMemory;
// 네이티브 모듈 로더 - TypeScript 버전
const path = __importStar(require("path"));
const electron_1 = require("electron");
// 한국어 디버깅 로그 함수
function debugLog(message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = data
        ? `[${timestamp}] [네이티브모듈] ${message}: ${JSON.stringify(data)}`
        : `[${timestamp}] [네이티브모듈] ${message}`;
    console.log(logMessage);
}
// 로거 함수들 (COPILOT_GUIDE.md 규칙에 따른 한국어 로깅)
const logger = {
    info: (message, data) => debugLog('ℹ️ ${message}', data),
    debug: (message, data) => debugLog('🔍 ${message}', data),
    warn: (message, data) => debugLog('⚠️ ${message}', data),
    error: (message, data) => debugLog('❌ ${message}', data),
};
// 플랫폼별 파일 확장자
const extensions = {
    'win32': '.dll',
    'darwin': '.dylib',
    'linux': '.so'
};
const _extension = extensions[process.platform] || '.so';
// 플랫폼별 접두사
const _prefix = process.platform === 'win32' ? '' : 'lib';
class NativeModuleLoader {
    constructor() {
        this.nativeModule = null;
        this.isLoaded = false;
        this.loadError = null;
    }
    static getInstance() {
        if (!NativeModuleLoader.instance) {
            NativeModuleLoader.instance = new NativeModuleLoader();
        }
        return NativeModuleLoader.instance;
    }
    static resolveNativeModulePath() {
        const isDev = process.env.NODE_ENV === 'development';
        const isTsNode = !!process.env.TS_NODE_DEV || !!process.env.TS_NODE_PROJECT;
        let modulePath;
        if (isDev && isTsNode) {
            // ts-node 개발 환경: src/native-modules/index.js (ts-node가 on-the-fly 트랜스파일)
            modulePath = path.join(process.cwd(), 'src', 'native-modules');
        }
        else if (isDev) {
            // 빌드된 개발 환경: native-modules/index.js
            modulePath = path.join(process.cwd(), 'native-modules');
        }
        else {
            // 프로덕션: resources/native-modules
            const resourcesPath = process.resourcesPath || path.dirname(electron_1.app.getAppPath());
            modulePath = path.join(resourcesPath, 'native-modules');
        }
        return modulePath;
    }
    async loadModule() {
        if (this.isLoaded) {
            return this.createModuleWrapper();
        }
        try {
            logger.info('네이티브 모듈 로드 시작');
            const modulePath = NativeModuleLoader.resolveNativeModulePath();
            logger.debug(`네이티브 모듈 require 경로: ${modulePath}`);
            // 파일 존재 확인
            const fs = require('fs');
            const indexPath = path.join(modulePath, 'index.js');
            if (!fs.existsSync(indexPath)) {
                throw new Error(`네이티브 모듈 index.js를 찾을 수 없습니다: ${indexPath}`);
            }
            // 네이티브 모듈 로드
            this.nativeModule = require(modulePath);
            this.isLoaded = true;
            this.loadError = null;
            logger.info('네이티브 모듈 로드 Success', {
                available: this.nativeModule.isNativeModuleAvailable?.() || 'unknown',
                version: this.nativeModule.getNativeModuleVersion?.() || 'unknown'
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.loadError = errorMessage;
            this.isLoaded = false;
            logger.error('네이티브 모듈 로드 Failed', { error: errorMessage });
            logger.warn('자바스크립트 폴백 모드로 실행됩니다');
        }
        return this.createModuleWrapper();
    }
    createModuleWrapper() {
        if (this.nativeModule && this.isLoaded) {
            logger.debug('네이티브 모듈 래퍼 생성 - 네이티브 기능 사용');
            return {
                calculateTypingStats: this.nativeModule.calculateTypingStats?.bind(this.nativeModule),
                optimizeMemory: this.nativeModule.optimizeMemory?.bind(this.nativeModule),
                gpuAccelerate: this.nativeModule.gpuAccelerate?.bind(this.nativeModule),
                getGpuInfo: this.nativeModule.getGpuInfo?.bind(this.nativeModule),
                runGpuAcceleration: this.nativeModule.runGpuAcceleration?.bind(this.nativeModule),
                runGpuBenchmark: this.nativeModule.runGpuBenchmark?.bind(this.nativeModule),
                getMemoryInfo: this.nativeModule.getMemoryUsage?.bind(this.nativeModule), // getMemoryUsage 사용
                cleanupMemory: this.nativeModule.cleanupMemory?.bind(this.nativeModule),
                // 새로운 고급 GPU 기능들 추가
                getGpuMemoryStats: this.nativeModule.getGpuMemoryStats?.bind(this.nativeModule),
                optimizeMemoryAdvanced: this.nativeModule.optimizeMemory?.bind(this.nativeModule),
                isAvailable: true
            };
        }
        // 폴백 구현
        logger.debug('네이티브 모듈 래퍼 생성 - 폴백 모드');
        return this.loadFallbackModule();
    }
    loadFallbackModule() {
        logger.warn('폴백 모듈 로드됨 - 성능이 제한될 수 있습니다');
        return {
            calculateTypingStats: (data) => {
                logger.debug('네이티브 모듈 미사용 - JS 폴백으로 타이핑 통계 계산');
                return this.calculateTypingStatsJS(data);
            },
            optimizeMemory: () => {
                logger.debug('네이티브 모듈 미사용 - JS 폴백으로 메모리 최적화');
                return this.optimizeMemoryJS();
            },
            gpuAccelerate: (_task, _data) => {
                logger.debug('네이티브 모듈 미사용 - GPU 가속 사용 불가');
                return null;
            },
            getGpuInfo: () => ({
                name: 'Fallback GPU',
                vendor: 'JavaScript',
                memoryTotal: '0',
                memoryUsed: '0',
                memoryAvailable: '0',
                utilization: 0,
                computeCapability: '0.0',
                driverVersion: 'N/A',
                isIntegrated: true,
                supportsCompute: false,
                timestamp: Date.now().toString()
            }),
            runGpuAcceleration: (_data) => ({
                success: false,
                executionTimeMs: 0,
                memorySavedMb: 0,
                performanceGain: 0,
                usedGpu: false,
                errorMessage: 'GPU 가속 사용 불가 - 네이티브 모듈 없음'
            }),
            runGpuBenchmark: () => ({
                success: false,
                executionTimeMs: 0,
                memorySavedMb: 0,
                performanceGain: 0,
                usedGpu: false,
                errorMessage: 'GPU 벤치마크 사용 불가 - 네이티브 모듈 없음'
            }),
            getMemoryInfo: () => ({
                total: process.memoryUsage().heapTotal,
                used: process.memoryUsage().heapUsed,
                available: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
            }),
            cleanupMemory: () => {
                if (global.gc) {
                    global.gc();
                    return {
                        success: true,
                        executionTimeMs: 1,
                        memorySavedMb: 0,
                        performanceGain: 0,
                        usedGpu: false
                    };
                }
                return {
                    success: false,
                    executionTimeMs: 0,
                    memorySavedMb: 0,
                    performanceGain: 0,
                    usedGpu: false,
                    errorMessage: 'GC 사용 불가'
                };
            },
            // 새로운 고급 GPU 기능들 폴백
            getGpuMemoryStats: () => ({
                appMemoryMb: process.memoryUsage().heapUsed / (1024 * 1024),
                gpuMemoryMb: 0,
                cpuMemoryMb: process.memoryUsage().heapUsed / (1024 * 1024),
                totalOffloadedMb: 0,
                optimizationScore: 0,
                lastOptimization: Date.now().toString(),
                activeOffloads: 0
            }),
            optimizeMemoryAdvanced: () => ({
                success: false,
                executionTimeMs: 0,
                memorySavedMb: 0,
                performanceGain: 0,
                usedGpu: false,
                errorMessage: '고급 메모리 최적화 사용 불가 - 네이티브 모듈 없음'
            }),
            isAvailable: false
        };
    }
    // 자바스크립트 폴백 구현들
    calculateTypingStatsJS(data) {
        try {
            const { keystrokes, timeSpent } = data;
            if (!keystrokes || !timeSpent) {
                return { error: 'Invalid data provided' };
            }
            const wpm = (keystrokes / 5) / (timeSpent / 60000); // 분당 단어수
            const accuracy = data.accuracy || 95; // 기본 정확도
            return {
                wpm: Math.round(wpm),
                accuracy: Math.round(accuracy),
                performance_index: Math.round(wpm * (accuracy / 100)),
                calculated_with: 'javascript'
            };
        }
        catch (error) {
            debugLog('JS 폴백 타이핑 통계 계산 Failed', error);
            return { error: 'Calculation failed' };
        }
    }
    optimizeMemoryJS() {
        try {
            // 기본 메모리 Cleanup 작업
            if (global.gc) {
                global.gc();
            }
            return {
                success: true,
                memory_freed: 0, // 실제 해제된 메모리는 측정 불가
                method: 'javascript_gc'
            };
        }
        catch (error) {
            debugLog('JS 폴백 메모리 최적화 Failed', error);
            return { error: 'Memory optimization failed' };
        }
    }
    getLoadError() {
        return this.loadError;
    }
    isModuleLoaded() {
        return this.isLoaded;
    }
}
// 전역 인스턴스 생성
exports.nativeModuleLoader = NativeModuleLoader.getInstance();
// 편의 함수들
async function loadNativeModule() {
    return await exports.nativeModuleLoader.loadModule();
}
function getNativeModuleStatus() {
    return {
        isLoaded: exports.nativeModuleLoader.isModuleLoaded(),
        error: exports.nativeModuleLoader.getLoadError()
    };
}
// API 라우트에서 사용할 수 있는 추가 함수들
async function getGpuInfo() {
    const module = await loadNativeModule();
    return module.getGpuInfo?.() || {
        name: 'Unknown GPU',
        vendor: 'Unknown',
        memoryTotal: '0',
        memoryUsed: '0',
        memoryAvailable: '0',
        utilization: 0,
        computeCapability: '0.0',
        driverVersion: 'N/A',
        isIntegrated: true,
        supportsCompute: false,
        timestamp: Date.now().toString()
    };
}
async function getGpuMemoryStats() {
    const module = await loadNativeModule();
    return module.getGpuMemoryStats?.() || {
        appMemoryMb: 0,
        gpuMemoryMb: 0,
        cpuMemoryMb: 0,
        totalOffloadedMb: 0,
        optimizationScore: 0,
        lastOptimization: Date.now().toString(),
        activeOffloads: 0
    };
}
async function runGpuAcceleration(data) {
    const module = await loadNativeModule();
    return module.runGpuAcceleration?.(JSON.stringify(data)) || {
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: 'GPU 가속 사용 불가'
    };
}
async function runGpuBenchmark() {
    const module = await loadNativeModule();
    return module.runGpuBenchmark?.() || {
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: 'GPU 벤치마크 사용 불가'
    };
}
async function optimizeMemoryAdvanced() {
    const module = await loadNativeModule();
    return module.optimizeMemoryAdvanced?.() || {
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: '고급 메모리 최적화 사용 불가'
    };
}
async function getMemoryInfo() {
    const module = await loadNativeModule();
    return module.getMemoryInfo?.() || { total: 0, used: 0, available: 0 };
}
async function optimizeMemory() {
    const module = await loadNativeModule();
    return module.optimizeMemory?.() || { success: true, freed: 0 };
}
async function cleanupMemory() {
    const module = await loadNativeModule();
    return module.cleanupMemory?.() || {
        success: false,
        executionTimeMs: 0,
        memorySavedMb: 0,
        performanceGain: 0,
        usedGpu: false,
        errorMessage: '메모리 Cleanup 사용 불가'
    };
}
exports.default = exports.nativeModuleLoader;
//# sourceMappingURL=index.js.map