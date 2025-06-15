/**
 * Loop 6 GPU 유틸리티 모듈
 * Loop 3의 고급 GPU 관리 기능을 TypeScript로 완전 마이그레이션
 */
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
declare class GPUManager {
    private settings;
    private configPath;
    private isInitialized;
    private performanceMetrics;
    private gpuInfo;
    constructor();
    /**
     * GPU 관리자 초기화
     */
    initialize(): Promise<void>;
    /**
   * Setup 파일 로드
   */
    private loadSettings;
    /**
   * Setup 파일 저장
   */
    private saveSettings;
    /**
     * GPU 정보 수집
     */
    private collectGPUInfo;
    /**
   * 환경 변수 기반 Setup 적용
   */
    private applyEnvironmentSettings;
    /**
     * 네이티브 모듈을 통한 GPU 초기화
     */
    private initializeNativeGPU;
    /**
   * 하드웨어 가속 토글
   */
    toggleHardwareAcceleration(enable: boolean): Promise<boolean>;
    /**
     * GPU 가속화 실행
     */
    runGpuAcceleration(task: string, data: any): Promise<any>;
    /**
     * JavaScript 폴백 구현
     */
    private runJavaScriptFallback;
    /**
     * JavaScript 타이핑 분석 폴백
     */
    private analyzeTypingJS;
    /**
     * JavaScript 이미지 처리 폴백
     */
    private processImageJS;
    /**
   * 성능 메트릭 기록
   */
    private recordPerformanceMetrics;
    /**
   * 배터리 최적화 모드 Setup
   */
    setBatteryOptimization(enable: boolean): Promise<void>;
    /**
     * GPU Setup 가져오기
     */
    getSettings(): GPUSettings;
    /**
     * GPU 정보 가져오기
     */
    getGPUInfo(): GPUInfo | null;
    /**
   * 성능 메트릭 가져오기
   */
    getPerformanceMetrics(): GPUPerformanceMetrics[];
    /**
   * 하드웨어 가속 활성화 상태 확인
   */
    isHardwareAccelerationEnabled(): boolean;
    /**
     * GPU 벤치마크 실행
     */
    runBenchmark(): Promise<any>;
}
declare let gpuManager: GPUManager | null;
/**
 * GPU 관리자 인스턴스 가져오기
 */
export declare function getGPUManager(): GPUManager;
/**
 * GPU 가속 Setup
 */
export declare function setupGpuAcceleration(enable: boolean): Promise<void>;
/**
 * GPU 정보 가져오기
 */
export declare function getGPUInfo(): Promise<GPUInfo | null>;
/**
 * 하드웨어 가속 토글
 */
export declare function toggleHardwareAcceleration(enable: boolean): Promise<boolean>;
/**
 * 하드웨어 가속 활성화 상태 확인
 */
export declare function isHardwareAccelerationEnabled(): boolean;
/**
 * GPU 가속화 실행
 */
export declare function runGpuAcceleration(task: string, data: any): Promise<any>;
/**
 * GPU 벤치마크 실행
 */
export declare function runGpuBenchmark(): Promise<any>;
export default gpuManager;
//# sourceMappingURL=gpuUtils.d.ts.map