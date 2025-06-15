/**
 * Loop 6 GPU 유틸리티 모듈
 * Loop 3의 고급 GPU 관리 기능을 TypeScript로 완전 마이그레이션
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { debugLog, errorLog } from '../shared/utils';
import { nativeModuleLoader } from '../native-modules';

// GPU Setup 인터페이스
interface GPUSettings {
  acceleration: boolean;
  batteryOptimization: boolean;
  processingMode: 'auto' | 'software' | 'gpu-intensive';
  vsync: boolean;
  webGLEnabled: boolean;
  lastUpdated: string;
}

interface GPUInfo {
  name: string;
  vendor: string;
  driverVersion?: string;
  memorySize?: number;
  memoryMB?: number;
  isAccelerated?: boolean;
  isAvailable?: boolean;
  isIntegrated?: boolean;
  isWebGpu?: boolean;
  performanceScore?: number;
}

interface GPUPerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  timestamp: number;
}

// GPU 상태 관리
class GPUManager {
  private settings: GPUSettings;
  private configPath: string;
  private isInitialized = false;
  private performanceMetrics: GPUPerformanceMetrics[] = [];
  private gpuInfo: GPUInfo | null = null;

  constructor() {
    // 사용자 데이터 경로 Setup
    const userDataPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../userData')
      : app.getPath('userData');
    
    this.configPath = path.join(userDataPath, 'gpu-settings.json');
    
    // 기본 Setup
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
  async initialize(): Promise<void> {
    try {
      debugLog('GPU 관리자 초기화 시작');
      
      // Setup 파일 로드
      await this.loadSettings();
      
      // GPU 정보 수집
      await this.collectGPUInfo();
      
      // 환경 변수 기반 Setup 적용
      this.applyEnvironmentSettings();
      
      // 네이티브 모듈을 통한 GPU 초기화
      await this.initializeNativeGPU();
      
      this.isInitialized = true;
      debugLog('GPU 관리자 초기화 Completed');
      
    } catch (error) {
      errorLog('GPU 관리자 초기화 중 Error:', error);
      this.isInitialized = false;
    }
  }

  /**
 * Setup 파일 로드
 */
  private async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        this.settings = { ...this.settings, ...loadedSettings };
        debugLog('GPU Setup 로드 Completed');
      } else {
        await this.saveSettings();
        debugLog('기본 GPU Setup 생성 Completed');
      }
    } catch (error) {
      errorLog('GPU Setup 로드 중 Error:', error);
    }
  }

  /**
 * Setup 파일 저장
 */
  private async saveSettings(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.settings.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
      debugLog('GPU Setup 저장 Completed');
      
    } catch (error) {
      errorLog('GPU Setup Saving Error:', error);
    }
  }

  /**
   * GPU 정보 수집
   */
  private async collectGPUInfo(): Promise<void> {
    try {
      // 네이티브 모듈을 통한 GPU 정보 수집
      const nativeModule = await nativeModuleLoader.loadModule();
      
      if (nativeModule.isAvailable && nativeModule.getGpuInfo) {
        this.gpuInfo = nativeModule.getGpuInfo();
        debugLog('네이티브 모듈을 통한 GPU 정보 수집 Completed:', this.gpuInfo);
      } else {
        // JavaScript 폴백으로 기본 GPU 정보 생성
        this.gpuInfo = {
          name: 'Unknown GPU',
          vendor: 'unknown',
          isAvailable: false,
          isAccelerated: false,
          performanceScore: 0
        };
        debugLog('JavaScript 폴백으로 GPU 정보 생성');
      }
    } catch (error) {
      errorLog('GPU 정보 수집 중 Error:', error);
      this.gpuInfo = null;
    }
  }

  /**
 * 환경 변수 기반 Setup 적용
 */
  private applyEnvironmentSettings(): void {
    const envGpuMode = process.env.GPU_MODE;
    
    if (envGpuMode) {
      debugLog('환경 변수 GPU_MODE: ${envGpuMode}');
      
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
      
      debugLog('환경 변수 기반 GPU Setup 적용 Completed');
    }
  }

  /**
   * 네이티브 모듈을 통한 GPU 초기화
   */
  private async initializeNativeGPU(): Promise<void> {
    try {
      const nativeModule = await nativeModuleLoader.loadModule();
      
      if (nativeModule.isAvailable) {
        // GPU 가속화 Setup
        if (this.settings.acceleration && nativeModule.gpuAccelerate) {
          const result = nativeModule.gpuAccelerate('initialize', {
            highPerformance: this.settings.processingMode === 'gpu-intensive',
            vsync: this.settings.vsync
          });
          debugLog('네이티브 GPU 가속화 초기화 결과:', result);
        }
        
        // GPU 벤치마크 실행 (성능 측정)
        if (nativeModule.runGpuBenchmark) {
          const benchmark = nativeModule.runGpuBenchmark();
          debugLog('GPU 벤치마크 결과:', benchmark);
          
          if (this.gpuInfo && benchmark.score) {
            this.gpuInfo.performanceScore = benchmark.score;
          }
        }
      }
    } catch (error) {
      errorLog('네이티브 GPU 초기화 중 Error:', error);
    }
  }

  /**
 * 하드웨어 가속 토글
 */
  async toggleHardwareAcceleration(enable: boolean): Promise<boolean> {
    try {
      this.settings.acceleration = enable;
      
      if (app.isReady()) {
        // 앱이 이미 준비된 상태에서는 재시작 필요
        debugLog(`하드웨어 가속 ${enable ? '활성화' : '비활성화'} - 재시작 필요`);
        return false; // 재시작 필요함을 알림
      } else {
        // 앱 준비 전에는 즉시 적용 가능
        if (!enable) {
          app.disableHardwareAcceleration();
        }
        debugLog(`하드웨어 가속 ${enable ? '활성화' : '비활성화'} Completed`);
      }
      
      await this.saveSettings();
      return true;
      
    } catch (error) {
      errorLog('하드웨어 가속 토글 중 Error:', error);
      return false;
    }
  }

  /**
   * GPU 가속화 실행
   */
  async runGpuAcceleration(task: string, data: any): Promise<any> {
    try {
      if (!this.settings.acceleration) {
        debugLog('GPU 가속이 비활성화되어 있음');
        return null;
      }
      
      const nativeModule = await nativeModuleLoader.loadModule();
      
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
      } else {
        debugLog('네이티브 GPU 모듈 사용 불가, JavaScript 폴백 사용');
        return this.runJavaScriptFallback(task, data);
      }
    } catch (error) {
      errorLog('GPU 가속화 실행 중 Error:', error);
      return this.runJavaScriptFallback(task, data);
    }
  }

  /**
   * JavaScript 폴백 구현
   */
  private runJavaScriptFallback(task: string, data: any): any {
    debugLog('JavaScript 폴백으로 ${task} 작업 실행');
    
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
  private analyzeTypingJS(data: any): any {
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
    } catch (error) {
      errorLog('JavaScript 타이핑 분석 중 Error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * JavaScript 이미지 처리 폴백
   */
  private processImageJS(data: any): any {
    debugLog('JavaScript 이미지 처리 폴백');
    return { success: true, processed: false, method: 'javascript_fallback' };
  }

  /**
 * 성능 메트릭 기록
 */
  private recordPerformanceMetrics(metrics: GPUPerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // 최근 100개 메트릭만 유지
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
 * 배터리 최적화 모드 Setup
 */
  async setBatteryOptimization(enable: boolean): Promise<void> {
    this.settings.batteryOptimization = enable;
    
    if (enable) {
      // 배터리 최적화 시 성능 낮춤
      this.settings.processingMode = 'software';
      this.settings.vsync = true;
    }
    
    await this.saveSettings();
    debugLog(`배터리 최적화 모드 ${enable ? '활성화' : '비활성화'}`);
  }

  /**
   * GPU Setup 가져오기
   */
  getSettings(): GPUSettings {
    return { ...this.settings };
  }

  /**
   * GPU 정보 가져오기
   */
  getGPUInfo(): GPUInfo | null {
    return this.gpuInfo ? { ...this.gpuInfo } : null;
  }

  /**
 * 성능 메트릭 가져오기
 */
  getPerformanceMetrics(): GPUPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
 * 하드웨어 가속 활성화 상태 확인
 */
  isHardwareAccelerationEnabled(): boolean {
    return this.settings.acceleration;
  }

  /**
   * GPU 벤치마크 실행
   */
  async runBenchmark(): Promise<any> {
    try {
      const nativeModule = await nativeModuleLoader.loadModule();
      
      if (nativeModule.isAvailable && nativeModule.runGpuBenchmark) {
        const result = nativeModule.runGpuBenchmark();
        debugLog('GPU 벤치마크 결과:', result);
        return result;
      } else {
        // JavaScript 폴백 벤치마크
        return {
          score: 0,
          gpu: false,
          method: 'javascript_fallback',
          message: 'Native GPU module not available'
        };
      }
    } catch (error) {
      errorLog('GPU 벤치마크 실행 중 Error:', error);
      return {
        score: 0,
        gpu: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// 전역 GPU 관리자 인스턴스
let gpuManager: GPUManager | null = null;

/**
 * GPU 관리자 인스턴스 가져오기
 */
export function getGPUManager(): GPUManager {
  if (!gpuManager) {
    gpuManager = new GPUManager();
  }
  return gpuManager;
}

/**
 * GPU 가속 Setup
 */
export async function setupGpuAcceleration(enable: boolean): Promise<void> {
  const manager = getGPUManager();
  await manager.initialize();
  await manager.toggleHardwareAcceleration(enable);
}

/**
 * GPU 정보 가져오기
 */
export async function getGPUInfo(): Promise<GPUInfo | null> {
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
export async function toggleHardwareAcceleration(enable: boolean): Promise<boolean> {
  const manager = getGPUManager();
  return await manager.toggleHardwareAcceleration(enable);
}

/**
 * 하드웨어 가속 활성화 상태 확인
 */
export function isHardwareAccelerationEnabled(): boolean {
  const manager = getGPUManager();
  return manager.isHardwareAccelerationEnabled();
}

/**
 * GPU 가속화 실행
 */
export async function runGpuAcceleration(task: string, data: any): Promise<any> {
  const manager = getGPUManager();
  return await manager.runGpuAcceleration(task, data);
}

/**
 * GPU 벤치마크 실행
 */
export async function runGpuBenchmark(): Promise<any> {
  const manager = getGPUManager();
  return await manager.runBenchmark();
}

export default gpuManager;
