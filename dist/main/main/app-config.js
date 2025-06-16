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
exports.isTest = exports.isProd = exports.isDev = void 0;
exports.configureHardwareAcceleration = configureHardwareAcceleration;
exports.configureMemoryOptimization = configureMemoryOptimization;
exports.configureDevelopmentMode = configureDevelopmentMode;
exports.configureGpuSettings = configureGpuSettings;
exports.initializeAppConfig = initializeAppConfig;
/**
 * 애플리케이션 설정 및 명령줄 스위치 관리
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const dotenv_1 = require("dotenv");
// 환경 변수 및 모드 설정
exports.isDev = process.env.NODE_ENV === 'development';
exports.isProd = process.env.NODE_ENV === 'production';
exports.isTest = process.env.NODE_ENV === 'test';
// 명시적 경로로 환경변수를 일찍 로드
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
(0, dotenv_1.config)({ path: envPath });
// CSP 설정
if (exports.isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    process.env.ELECTRON_OVERRIDE_CSP = '*';
}
/**
 * 하드웨어 가속 설정
 */
function configureHardwareAcceleration() {
    const disableHardwareAcceleration = process.env.GPU_MODE === 'software' ||
        process.env.DISABLE_GPU === 'true' ||
        process.env.HARDWARE_ACCELERATION === 'false' ||
        (exports.isDev && process.env.HARDWARE_ACCELERATION !== 'true');
    if (disableHardwareAcceleration) {
        console.log('🔧 GPU 모드: 소프트웨어 렌더링 - 하드웨어 가속 비활성화됨');
        electron_1.app.disableHardwareAcceleration();
        // 추가 GPU 관련 스위치 비활성화
        electron_1.app.commandLine.appendSwitch('disable-gpu');
        electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
        electron_1.app.commandLine.appendSwitch('disable-gpu-rasterization');
        electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
    }
    else if (process.env.HARDWARE_ACCELERATION === 'true') {
        console.log('⚡ GPU 모드: 하드웨어 가속 활성화');
        electron_1.app.commandLine.appendSwitch('enable-gpu-rasterization');
        electron_1.app.commandLine.appendSwitch('enable-zero-copy');
        if (process.env.GPU_VSYNC === 'true') {
            electron_1.app.commandLine.appendSwitch('enable-gpu-vsync');
        }
        if (process.env.GPU_ANTIALIASING === 'true') {
            electron_1.app.commandLine.appendSwitch('enable-gpu-antialiasing');
        }
    }
}
/**
 * 메모리 최적화 명령줄 스위치 설정
 */
function configureMemoryOptimization() {
    // 메모리 최적화: GPU 프로세스 완전 비활성화
    electron_1.app.disableHardwareAcceleration();
    // 메모리 최적화: 추가 프로세스 플래그 Setup
    electron_1.app.commandLine.appendSwitch('--disable-gpu');
    electron_1.app.commandLine.appendSwitch('--disable-gpu-process');
    electron_1.app.commandLine.appendSwitch('--disable-gpu-sandbox');
    electron_1.app.commandLine.appendSwitch('--disable-accelerated-video-decode');
    electron_1.app.commandLine.appendSwitch('--disable-accelerated-video-encode');
    electron_1.app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
    electron_1.app.commandLine.appendSwitch('--disable-accelerated-compositing');
    electron_1.app.commandLine.appendSwitch('--disable-software-rasterizer');
    electron_1.app.commandLine.appendSwitch('--disable-background-timer-throttling');
    electron_1.app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
    electron_1.app.commandLine.appendSwitch('--disable-renderer-backgrounding');
    electron_1.app.commandLine.appendSwitch('--disable-features', 'TranslateUI,BlinkGenPropertyTrees');
    electron_1.app.commandLine.appendSwitch('--enable-features', 'VizDisplayCompositor');
    electron_1.app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=256 --max-semi-space-size=8');
    electron_1.app.commandLine.appendSwitch('--memory-pressure-off');
    electron_1.app.commandLine.appendSwitch('--max_old_space_size', '256');
}
/**
 * 개발 모드 설정
 */
function configureDevelopmentMode() {
    if (exports.isDev) {
        console.log('개발 모드: 보안 우회 및 CSP 제거 활성화...');
        // 보안 관련 명령줄 스위치
        electron_1.app.commandLine.appendSwitch('disable-web-security');
        electron_1.app.commandLine.appendSwitch('allow-insecure-localhost');
        electron_1.app.commandLine.appendSwitch('ignore-certificate-errors');
        electron_1.app.commandLine.appendSwitch('disable-site-isolation-trials');
        electron_1.app.commandLine.appendSwitch('allow-running-insecure-content');
        console.log('모든 CSP 제한이 완전히 비활성화됨');
    }
}
/**
 * GPU 관련 명령줄 스위치 설정
 */
function configureGpuSettings() {
    const enableWebGL = process.env.WEBGL_ENABLED !== 'false';
    const gpuPowerPreference = process.env.GPU_POWER_PREFERENCE || 'default';
    if (!enableWebGL) {
        electron_1.app.commandLine.appendSwitch('disable-webgl');
    }
    if (gpuPowerPreference !== 'default') {
        electron_1.app.commandLine.appendSwitch('force-gpu-mem-available-mb', '512');
    }
}
/**
 * 모든 앱 설정 초기화
 */
function initializeAppConfig() {
    console.log('앱 설정 초기화 중...');
    configureMemoryOptimization();
    configureHardwareAcceleration();
    configureDevelopmentMode();
    configureGpuSettings();
    console.log('앱 설정 초기화 완료');
}
//# sourceMappingURL=app-config.js.map