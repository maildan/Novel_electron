import { join } from 'path'
import isDev from 'electron-is-dev'

export class AppConfig {
  static readonly APP_NAME = 'Loop'
  static readonly APP_VERSION = '6.0.0'
  static readonly NEXT_PORT = process.env.NEXT_PORT || '5500'
  
  // version 별칭 추가
  static get version(): string {
    return this.APP_VERSION;
  }
  
  // isDev 별칭 추가
  static get isDev(): boolean {
    return isDev;
  }
  
  // port 별칭 추가
  static get port(): string {
    return this.NEXT_PORT;
  }
  
  static readonly DATABASE_PATH = isDev 
    ? join(process.cwd(), 'prisma', 'dev.db')
    : join(process.resourcesPath, 'data', 'app.db')
  
  static readonly NATIVE_MODULE_PATH = isDev
    ? join(process.cwd(), 'native-modules', 'target', 'debug')
    : join(process.resourcesPath, 'native-modules')
  
  static readonly LOG_PATH = isDev
    ? join(process.cwd(), 'logs')
    : join(process.resourcesPath, 'logs')

  static readonly WINDOW_CONFIG = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // 로딩 Completed 후 표시
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: join(__dirname, 'preload.js'), // Loop 6 preload 스크립트
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      // 메모리 최적화 Setup
      backgroundThrottling: true,           // 백그라운드 스로틀링 활성화
      v8CacheOptions: 'none' as const,        // V8 캐시 비활성화
      enableWebSQL: false,                 // WebSQL 비활성화
      disableBlinkFeatures: 'Auxclick',    // 불필요한 Blink 기능 비활성화
      experimentalFeatures: false,         // 실험적 기능 비활성화
      enablePreferredSizeMode: false,      // 선호 크기 모드 비활성화
      spellcheck: false,                   // 맞춤법 검사 비활성화
      offscreen: false,                    // 오프스크린 렌더링 비활성화
      additionalArguments: [
        '--max-old-space-size=256',        // V8 힙 크기 제한
        '--max-semi-space-size=8',         // 세미 스페이스 크기 제한
        '--memory-pressure-off',           // 메모리 압력 감지 끄기
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=VizDisplayCompositor',
      ]
    }
  }

  static readonly KEYBOARD_CONFIG = {
    enableHook: true,
    captureModifiers: true,
    captureSpecialKeys: true,
    bufferSize: 1000,
    flushInterval: 100 // ms
  }

  static readonly MEMORY_CONFIG = {
    optimizationInterval: 30000, // 30초
    thresholdMB: 200,
    aggressiveThresholdMB: 500,
    enableAutoOptimization: true
  }

  static readonly SYSTEM_MONITOR_CONFIG = {
    updateInterval: 1000, // 1초
    historyLength: 300, // 5분 (300초)
    enableCpuMonitoring: true,
    enableMemoryMonitoring: true,
    enableGpuMonitoring: true
  }

  // 추가 구성 객체들
  static readonly memory = {
    threshold: 200, // MB
    forceGcThreshold: 500, // MB
    cleanupInterval: 300000 // 5분
  }

  static readonly monitoring = {
    thresholds: {
      cpu: {
        warning: 70, // %
        critical: 85 // %
      },
      memory: {
        warning: 75, // %
        critical: 90 // %
      },
      gpu: {
        warning: 80, // %
        critical: 95 // %
      }
    }
  }

  static readonly gpu = {
    mode: process.env.GPU_MODE || 'hardware'
  }

  static readonly server = {
    url: `http://localhost:${this.NEXT_PORT}`
  }

  static readonly development = {
    openDevTools: true
  }

  // 호환성을 위한 속성들
  static get isDevelopment(): boolean {
    return isDev
  }

  static get isProduction(): boolean {
    return !isDev
  }

  static get nextUrl(): string {
    // 정적 모드인지 확인
    const isStatic = process.env.ELECTRON_STATIC === 'true' || !isDev;
    
    if (isStatic) {
      // 환경변수로 정적 서버 URL이 Setup되어 있으면 사용
      return process.env.STATIC_SERVER_URL || `http://localhost:${this.NEXT_PORT}`;
    } else {
      // 개발 모드에서는 Next.js 서버 사용
      return `http://localhost:${this.NEXT_PORT}`;
    }
  }

  // Setup 관리 메서드들
  private static configStore: Map<string, unknown> = new Map()

  static get(key: string): unknown {
    return this.configStore.get(key)
  }

  static set(key: string, value: unknown): void {
    this.configStore.set(key, value)
  }

  static getAll(): Record<string, unknown> {
    return Object.fromEntries(this.configStore)
  }

  static reset(): void {
    this.configStore.clear()
  }
}
