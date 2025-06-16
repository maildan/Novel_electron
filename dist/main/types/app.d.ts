/**
 * 애플리케이션 상태 관련 타입 정의
 *
 * 애플리케이션의 전체적인 상태 관리와 관련된 타입들을 정의합니다.
 */
/**
 * 애플리케이션 전체 상태
 */
export interface AppState {
    isInitialized: boolean;
    isReady: boolean;
    environment: AppEnvironment;
    version: string;
    platform: string;
    isDevelopment: boolean;
    isPackaged: boolean;
    startupTime: number;
}
/**
 * 애플리케이션 환경 정보
 */
export interface AppEnvironment {
    nodeEnv: 'development' | 'production' | 'test';
    electronVersion: string;
    nodeVersion: string;
    v8Version: string;
    userDataPath: string;
    appPath: string;
    tempPath: string;
    logsPath: string;
}
/**
 * 윈도우 관리자 상태
 */
export interface WindowManagerState {
    mainWindow: WindowInfo | null;
    setupWindow: WindowInfo | null;
    additionalWindows: Map<number, WindowInfo>;
    windowCount: number;
    lastActiveWindow: number | null;
}
/**
 * 개별 윈도우 정보
 */
export interface WindowInfo {
    id: number;
    type: 'main' | 'setup' | 'modal' | 'utility';
    title: string;
    url: string;
    isVisible: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    isFocused: boolean;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    createdAt: number;
    lastActiveAt: number;
}
/**
 * 시스템 모니터링 상태
 */
export interface MonitoringState {
    isActive: boolean;
    startTime: number | null;
    metrics: SystemMetrics;
    history: SystemMetricsHistory[];
    alerts: SystemAlert[];
    configuration: MonitoringConfiguration;
}
/**
 * 시스템 메트릭
 */
export interface SystemMetrics {
    cpu: {
        usage: number;
        temperature?: number;
        processes: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percentage: number;
        swapTotal?: number;
        swapUsed?: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        percentage: number;
        readSpeed?: number;
        writeSpeed?: number;
    };
    network: {
        upload: number;
        download: number;
        latency?: number;
    };
    gpu?: {
        usage: number;
        memory: number;
        temperature?: number;
    };
    timestamp: number;
}
/**
 * 시스템 메트릭 이력
 */
export interface SystemMetricsHistory {
    timestamp: number;
    metrics: SystemMetrics;
    events: string[];
}
/**
 * 시스템 알림
 */
export interface SystemAlert {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    category: 'memory' | 'cpu' | 'disk' | 'network' | 'gpu' | 'application';
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    isPersistent: boolean;
    data?: Record<string, any>;
}
/**
 * 모니터링 설정
 */
export interface MonitoringConfiguration {
    interval: number;
    enabledMetrics: {
        cpu: boolean;
        memory: boolean;
        disk: boolean;
        network: boolean;
        gpu: boolean;
    };
    thresholds: {
        cpu: {
            warning: number;
            critical: number;
        };
        memory: {
            warning: number;
            critical: number;
        };
        disk: {
            warning: number;
            critical: number;
        };
        temperature?: {
            warning: number;
            critical: number;
        };
    };
    alertSettings: {
        notifications: boolean;
        sound: boolean;
        email: boolean;
        webhooks: string[];
    };
    retentionDays: number;
}
/**
 * 에러 관리 상태
 */
export interface ErrorState {
    errors: AppError[];
    unhandledErrors: number;
    lastError: AppError | null;
    errorCounts: Record<string, number>;
    isErrorReportingEnabled: boolean;
}
/**
 * 애플리케이션 에러
 */
export interface AppError {
    id: string;
    type: 'fatal' | 'error' | 'warning' | 'info';
    category: 'ipc' | 'native' | 'renderer' | 'main' | 'system' | 'network' | 'database';
    code: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
    isResolved: boolean;
    userId?: string;
    sessionId?: string;
}
/**
 * 로그 관리 상태
 */
export interface LogState {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxFileSize: number;
    maxFiles: number;
    currentLogFile: string;
    logDirectory: string;
    isConsoleLoggingEnabled: boolean;
    isFileLoggingEnabled: boolean;
}
/**
 * 성능 관리 상태
 */
export interface PerformanceState {
    metrics: PerformanceMetrics;
    benchmarks: BenchmarkResult[];
    optimizations: OptimizationResult[];
    resourceUsage: ResourceUsageInfo;
    settings: PerformanceSettings;
}
/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
    appStartupTime: number;
    ipcLatency: number;
    renderingFps: number;
    memoryLeaks: number;
    cpuThrottling: boolean;
    gcPauses: number[];
    eventLoopLag: number;
    timestamp: number;
}
/**
 * 벤치마크 결과
 */
export interface BenchmarkResult {
    name: string;
    category: 'startup' | 'ipc' | 'rendering' | 'computation' | 'io';
    score: number;
    unit: 'ms' | 'fps' | 'ops/sec' | 'mb/s';
    baseline?: number;
    improvement?: number;
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * 최적화 결과
 */
export interface OptimizationResult {
    type: 'memory' | 'cpu' | 'disk' | 'network' | 'gpu';
    action: string;
    beforeValue: number;
    afterValue: number;
    improvement: number;
    timestamp: number;
    success: boolean;
    error?: string;
}
/**
 * 리소스 사용량 정보
 */
export interface ResourceUsageInfo {
    processes: {
        main: ProcessResourceUsage;
        renderers: ProcessResourceUsage[];
        workers: ProcessResourceUsage[];
    };
    files: {
        openHandles: number;
        tempFiles: number;
        logFiles: number;
        databaseSize: number;
    };
    network: {
        activeConnections: number;
        pendingRequests: number;
        bandwidth: number;
    };
    timestamp: number;
}
/**
 * 프로세스 리소스 사용량
 */
export interface ProcessResourceUsage {
    pid: number;
    type: 'main' | 'renderer' | 'worker' | 'utility';
    cpu: number;
    memory: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    handles: number;
    uptime: number;
}
/**
 * 성능 설정
 */
export interface PerformanceSettings {
    enableGpuAcceleration: boolean;
    enableMemoryOptimization: boolean;
    enablePerformanceMonitoring: boolean;
    processingMode: 'standard' | 'performance' | 'power-save';
    maxMemoryUsage: number;
    gcStrategy: 'aggressive' | 'balanced' | 'conservative';
    renderingMode: 'software' | 'hardware' | 'auto';
}
/**
 * 네트워크 상태
 */
export interface NetworkState {
    isOnline: boolean;
    connectionType: 'wifi' | 'ethernet' | 'cellular' | 'unknown';
    bandwidth: {
        download: number;
        upload: number;
    };
    latency: number;
    proxy: ProxyConfiguration | null;
    requests: NetworkRequest[];
    statistics: NetworkStatistics;
}
/**
 * 프록시 설정
 */
export interface ProxyConfiguration {
    enabled: boolean;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    auth?: {
        username: string;
        password: string;
    };
}
/**
 * 네트워크 요청
 */
export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    status: number;
    startTime: number;
    endTime?: number;
    size: number;
    error?: string;
}
/**
 * 네트워크 통계
 */
export interface NetworkStatistics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalBytesTransferred: number;
    averageLatency: number;
    requestsPerMinute: number;
}
/**
 * 사용자 데이터 상태
 */
export interface UserDataState {
    profile: UserProfile;
    preferences: UserPreferences;
    session: UserSession;
    statistics: UserStatistics;
    privacy: PrivacySettings;
}
/**
 * 사용자 프로필
 */
export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    locale: string;
    timezone: string;
    createdAt: number;
    lastLoginAt: number;
}
/**
 * 사용자 기본 설정
 */
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    autoStart: boolean;
    minimizeToTray: boolean;
    closeToTray: boolean;
    shortcuts: Record<string, string>;
    layout: LayoutPreferences;
}
/**
 * 레이아웃 기본 설정
 */
export interface LayoutPreferences {
    windowSize: {
        width: number;
        height: number;
    };
    windowPosition: {
        x: number;
        y: number;
    };
    panelSizes: Record<string, number>;
    visiblePanels: string[];
    toolbarLayout: string[];
}
/**
 * 사용자 세션
 */
export interface UserSession {
    id: string;
    startTime: number;
    lastActivityTime: number;
    isActive: boolean;
    activityCount: number;
    duration: number;
    events: SessionEvent[];
}
/**
 * 세션 이벤트
 */
export interface SessionEvent {
    type: 'login' | 'logout' | 'activity' | 'idle' | 'error';
    timestamp: number;
    data?: Record<string, any>;
}
/**
 * 사용자 통계
 */
export interface UserStatistics {
    totalSessions: number;
    totalActiveTime: number;
    averageSessionDuration: number;
    featuresUsed: Record<string, number>;
    performanceMetrics: Record<string, number>;
    lastUpdated: number;
}
/**
 * 개인정보 설정
 */
export interface PrivacySettings {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
    usageStatistics: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
    shareWithDevelopers: boolean;
}
/**
 * 전체 애플리케이션 상태를 포함하는 루트 상태 타입
 */
export interface RootAppState {
    app: AppState;
    windows: WindowManagerState;
    monitoring: MonitoringState;
    errors: ErrorState;
    logs: LogState;
    performance: PerformanceState;
    network: NetworkState;
    userData: UserDataState;
    lastUpdated: number;
}
/**
 * 상태 업데이트 액션
 */
export interface StateUpdateAction<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    source: 'main' | 'renderer' | 'system';
}
/**
 * 상태 변경 이벤트
 */
export interface StateChangeEvent<T = any> {
    path: string;
    oldValue: T;
    newValue: T;
    timestamp: number;
    source: string;
}
//# sourceMappingURL=app.d.ts.map