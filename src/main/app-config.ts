/**
 * 애플리케이션 설정 및 명령줄 스위치 관리
 */
import { app } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';

// 환경 변수 및 모드 설정
export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// 명시적 경로로 환경변수를 일찍 로드
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
config({ path: envPath });

// CSP 설정
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  process.env.ELECTRON_OVERRIDE_CSP = '*';
}

/**
 * 하드웨어 가속 설정
 */
export function configureHardwareAcceleration(): void {
  const disableHardwareAcceleration = process.env.GPU_MODE === 'software' || 
                                       process.env.DISABLE_GPU === 'true' ||
                                       process.env.HARDWARE_ACCELERATION === 'false' ||
                                       (isDev && process.env.HARDWARE_ACCELERATION !== 'true');

  if (disableHardwareAcceleration) {
    console.log('🔧 GPU 모드: 소프트웨어 렌더링 - 하드웨어 가속 비활성화됨');
    app.disableHardwareAcceleration();
    
    // 추가 GPU 관련 스위치 비활성화
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-gpu-compositing');
    app.commandLine.appendSwitch('disable-gpu-rasterization');
    app.commandLine.appendSwitch('disable-gpu-sandbox');
  } else if (process.env.HARDWARE_ACCELERATION === 'true') {
    console.log('⚡ GPU 모드: 하드웨어 가속 활성화');
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
    
    if (process.env.GPU_VSYNC === 'true') {
      app.commandLine.appendSwitch('enable-gpu-vsync');
    }
    
    if (process.env.GPU_ANTIALIASING === 'true') {
      app.commandLine.appendSwitch('enable-gpu-antialiasing');
    }
  }
}

/**
 * 메모리 최적화 명령줄 스위치 설정
 */
export function configureMemoryOptimization(): void {
  // 메모리 최적화: GPU 프로세스 완전 비활성화
  app.disableHardwareAcceleration();

  // 메모리 최적화: 추가 프로세스 플래그 Setup
  app.commandLine.appendSwitch('--disable-gpu');
  app.commandLine.appendSwitch('--disable-gpu-process');
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  app.commandLine.appendSwitch('--disable-accelerated-video-decode');
  app.commandLine.appendSwitch('--disable-accelerated-video-encode');
  app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
  app.commandLine.appendSwitch('--disable-accelerated-compositing');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-background-timer-throttling');
  app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('--disable-renderer-backgrounding');
  app.commandLine.appendSwitch('--disable-features', 'TranslateUI,BlinkGenPropertyTrees');
  app.commandLine.appendSwitch('--enable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=256 --max-semi-space-size=8');
  app.commandLine.appendSwitch('--memory-pressure-off');
  app.commandLine.appendSwitch('--max_old_space_size', '256');
}

/**
 * 개발 모드 설정
 */
export function configureDevelopmentMode(): void {
  if (isDev) {
    console.log('개발 모드: 보안 우회 및 CSP 제거 활성화...');
    
    // 보안 관련 명령줄 스위치
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('allow-insecure-localhost');
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    app.commandLine.appendSwitch('allow-running-insecure-content');
    
    console.log('모든 CSP 제한이 완전히 비활성화됨');
  }
}

/**
 * GPU 관련 명령줄 스위치 설정
 */
export function configureGpuSettings(): void {
  const enableWebGL = process.env.WEBGL_ENABLED !== 'false';
  const gpuPowerPreference = process.env.GPU_POWER_PREFERENCE || 'default';
  
  if (!enableWebGL) {
    app.commandLine.appendSwitch('disable-webgl');
  }
  
  if (gpuPowerPreference !== 'default') {
    app.commandLine.appendSwitch('force-gpu-mem-available-mb', '512');
  }
}

/**
 * 모든 앱 설정 초기화
 */
export function initializeAppConfig(): void {
  console.log('앱 설정 초기화 중...');
  
  configureMemoryOptimization();
  configureHardwareAcceleration();
  configureDevelopmentMode();
  configureGpuSettings();
  
  console.log('앱 설정 초기화 완료');
}
