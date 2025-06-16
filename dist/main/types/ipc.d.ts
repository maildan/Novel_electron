/**
 * IPC 관련 타입 정의
 *
 * 모든 IPC 채널의 요청/응답 타입을 중앙 집중식으로 관리합니다.
 * 기존 코드와의 호환성을 유지하면서 점진적으로 타입 안전성을 향상시킵니다.
 */
import { CHANNELS } from '../preload/channels';
/**
 * 표준 IPC 응답 래퍼
 */
export interface IpcResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}
/**
 * IPC 에러 타입
 */
export interface IpcError {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string;
}
/**
 * IPC 채널 타입 (채널 상수와 연동)
 */
export type IpcChannel = typeof CHANNELS[keyof typeof CHANNELS];
export declare namespace MemoryIpcTypes {
    /**
     * React 컴포넌트에서 기대하는 메모리 정보 구조
     */
    interface ReactMemoryInfo {
        total: number;
        used: number;
        free: number;
        percentage: number;
    }
    /**
     * React 컴포넌트용 메모리 데이터
     */
    interface ReactMemoryData {
        main: ReactMemoryInfo;
        renderer: ReactMemoryInfo;
        gpu?: ReactMemoryInfo;
        system: ReactMemoryInfo;
        application?: ReactMemoryInfo;
        timestamp: number;
    }
    /**
     * 메모리 최적화 결과
     */
    interface MemoryOptimizationResult {
        beforeUsage: number;
        afterUsage: number;
        freedMemory: number;
        optimizationTime: number;
        success: boolean;
    }
    /**
     * 메모리 모니터링 설정
     */
    interface MemoryMonitoringConfig {
        interval: number;
        thresholds: {
            warning: number;
            critical: number;
        };
        autoOptimize: boolean;
    }
}
export declare namespace DatabaseIpcTypes {
    /**
     * 타이핑 세션 데이터
     */
    interface TypingSessionData {
        id?: string;
        startTime: number;
        endTime?: number;
        keystrokes: number;
        characters: number;
        words: number;
        accuracy: number;
        wpm: number;
        applicationName?: string;
        windowTitle?: string;
        content?: string;
    }
    /**
     * 세션 통계 조회 매개변수
     */
    interface SessionStatsParams {
        startDate?: string;
        endDate?: string;
        limit?: number;
        applicationFilter?: string;
    }
    /**
     * 세션 통계 결과
     */
    interface SessionStatsResult {
        totalSessions: number;
        totalKeystrokes: number;
        totalCharacters: number;
        totalWords: number;
        averageWpm: number;
        averageAccuracy: number;
        dailyStats: Array<{
            date: string;
            sessions: number;
            keystrokes: number;
            wpm: number;
        }>;
    }
    /**
     * 데이터 내보내기 매개변수
     */
    interface DataExportParams {
        format: 'json' | 'csv' | 'xlsx';
        startDate?: string;
        endDate?: string;
        includeRawData: boolean;
    }
    /**
     * 데이터 가져오기 매개변수
     */
    interface DataImportParams {
        filePath: string;
        format: 'json' | 'csv';
        overwrite: boolean;
    }
}
export declare namespace SystemIpcTypes {
    /**
     * 시스템 정보
     */
    interface SystemInfo {
        platform: string;
        arch: string;
        version: string;
        hostname: string;
        uptime: number;
        memory: {
            total: number;
            free: number;
            used: number;
        };
        cpu: {
            model: string;
            cores: number;
            speed: number;
            usage: number;
        };
        network: NetworkInfo[];
    }
    /**
     * 네트워크 정보
     */
    interface NetworkInfo {
        interface: string;
        address: string;
        netmask: string;
        family: 'IPv4' | 'IPv6';
        mac: string;
        internal: boolean;
    }
    /**
     * 프로세스 정보
     */
    interface ProcessInfo {
        pid: number;
        name: string;
        cpu: number;
        memory: number;
        command: string;
    }
    /**
     * GPU 정보
     */
    interface GpuInfo {
        vendor: string;
        model: string;
        memory: number;
        driver: string;
        supported: boolean;
    }
}
export declare namespace SettingsIpcTypes {
    /**
     * Settings 전용 IPC 응답 (기본 IpcResponse 확장)
     */
    interface SettingsIpcResponse<T = any> extends IpcResponse<T> {
        message?: string;
        requiresRestart?: boolean;
        enabled?: boolean;
        mode?: string;
        threshold?: number;
        days?: number;
    }
    /**
     * 애플리케이션 설정
     */
    interface AppSettings {
        general: {
            autoStart: boolean;
            minimizeToTray: boolean;
            closeToTray: boolean;
            notifications: boolean;
        };
        monitoring: {
            enabled: boolean;
            interval: number;
            keylogger: boolean;
            mouseTracking: boolean;
        };
        performance: {
            gpuAcceleration: boolean;
            memoryOptimization: boolean;
            processingMode: 'standard' | 'performance' | 'power-save';
        };
        privacy: {
            dataRetention: number;
            anonymizeData: boolean;
            shareAnalytics: boolean;
        };
        display: {
            theme: 'light' | 'dark' | 'system';
            language: string;
            windowMode: 'windowed' | 'fullscreen' | 'fullscreen-auto-hide';
        };
    }
    /**
     * 설정 업데이트 요청
     */
    interface SettingsUpdateRequest {
        category: keyof AppSettings;
        key: string;
        value: any;
    }
    /**
     * 설정 다중 업데이트 요청
     */
    interface SettingsMultipleUpdateRequest {
        updates: Array<{
            category: keyof AppSettings;
            key: string;
            value: any;
        }>;
    }
}
export declare namespace WindowIpcTypes {
    /**
     * 윈도우 생성 옵션
     */
    interface WindowCreateOptions {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
        modal?: boolean;
        resizable?: boolean;
        title?: string;
        url?: string;
    }
    /**
     * 윈도우 상태
     */
    interface WindowState {
        id: number;
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        isMaximized: boolean;
        isMinimized: boolean;
        isVisible: boolean;
        isFocused: boolean;
    }
}
export declare namespace NativeIpcTypes {
    /**
     * 네이티브 모듈 상태
     */
    interface NativeModuleStatus {
        available: boolean;
        fallbackMode: boolean;
        version: string;
        features: {
            memory: boolean;
            gpu: boolean;
            worker: boolean;
            filesystem: boolean;
            network: boolean;
        };
        timestamp: number;
        loadError?: string;
    }
    /**
     * 워커 태스크 데이터
     */
    interface WorkerTaskData {
        id: string;
        type: string;
        payload: any;
        priority: 'low' | 'normal' | 'high';
        timeout?: number;
    }
    /**
     * 워커 태스크 상태
     */
    interface WorkerTaskStatus {
        id: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        progress: number;
        startTime: number;
        endTime?: number;
        result?: any;
        error?: string;
    }
    /**
     * 워커 통계
     */
    interface WorkerStats {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        pendingTasks: number;
        averageExecutionTime: number;
        activeWorkers: number;
    }
}
export declare namespace DialogIpcTypes {
    /**
     * 메시지 다이얼로그 옵션
     */
    interface MessageDialogOptions {
        type: 'info' | 'warning' | 'error' | 'question';
        title: string;
        message: string;
        detail?: string;
        buttons?: string[];
        defaultId?: number;
        cancelId?: number;
    }
    /**
     * 파일 다이얼로그 옵션
     */
    interface FileDialogOptions {
        title?: string;
        defaultPath?: string;
        buttonLabel?: string;
        filters?: Array<{
            name: string;
            extensions: string[];
        }>;
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
    }
    /**
     * 알림 옵션
     */
    interface NotificationOptions {
        title: string;
        body: string;
        icon?: string;
        silent?: boolean;
        urgency?: 'normal' | 'critical' | 'low';
    }
}
/**
 * 각 IPC 채널의 요청/응답 타입 매핑
 * TypeScript에서 채널명을 기반으로 타입 추론을 가능하게 합니다.
 */
export interface IpcChannelMap {
    [CHANNELS.SAVE_TYPING_SESSION]: {
        request: DatabaseIpcTypes.TypingSessionData;
        response: {
            id: string;
        };
    };
    [CHANNELS.GET_RECENT_SESSIONS]: {
        request: {
            limit?: number;
        };
        response: DatabaseIpcTypes.TypingSessionData[];
    };
    [CHANNELS.GET_SESSIONS]: {
        request: DatabaseIpcTypes.SessionStatsParams;
        response: DatabaseIpcTypes.TypingSessionData[];
    };
    [CHANNELS.GET_STATISTICS]: {
        request: DatabaseIpcTypes.SessionStatsParams;
        response: DatabaseIpcTypes.SessionStatsResult;
    };
    [CHANNELS.GET_KEYSTROKE_DATA]: {
        request: {
            startDate?: string;
            endDate?: string;
            limit?: number;
        };
        response: any[];
    };
    [CHANNELS.EXPORT_DATA]: {
        request: DatabaseIpcTypes.DataExportParams;
        response: {
            filePath: string;
            recordCount: number;
        };
    };
    [CHANNELS.IMPORT_DATA]: {
        request: DatabaseIpcTypes.DataImportParams;
        response: {
            success: boolean;
            importedRecords: number;
        };
    };
    [CHANNELS.CLEAR_DATA]: {
        request: {
            confirm: boolean;
        };
        response: {
            success: boolean;
            deletedRecords: number;
        };
    };
    [CHANNELS.DB_CLEANUP]: {
        request: {
            olderThanDays?: number;
        };
        response: {
            success: boolean;
            deletedRecords: number;
        };
    };
    [CHANNELS.DB_HEALTH_CHECK]: {
        request: void;
        response: {
            status: 'healthy' | 'degraded' | 'critical';
            issues?: string[];
        };
    };
    [CHANNELS.MEMORY_GET_USAGE]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.MEMORY_GET_STATS]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.MEMORY_GET_INFO]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.MEMORY_OPTIMIZE]: {
        request: void;
        response: MemoryIpcTypes.MemoryOptimizationResult;
    };
    [CHANNELS.MEMORY_CLEANUP]: {
        request: void;
        response: {
            freedMemory: number;
        };
    };
    [CHANNELS.NATIVE_GET_MEMORY_USAGE]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.NATIVE_GET_MEMORY_STATS]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.NATIVE_OPTIMIZE_MEMORY]: {
        request: void;
        response: MemoryIpcTypes.MemoryOptimizationResult;
    };
    [CHANNELS.NATIVE_CLEANUP_MEMORY]: {
        request: void;
        response: {
            freedMemory: number;
        };
    };
    [CHANNELS.NATIVE_OPTIMIZE_MEMORY_ADVANCED]: {
        request: {
            aggressive?: boolean;
        };
        response: MemoryIpcTypes.MemoryOptimizationResult;
    };
    [CHANNELS.NATIVE_START_MEMORY_MONITORING]: {
        request: MemoryIpcTypes.MemoryMonitoringConfig;
        response: {
            success: boolean;
            monitoringId: string;
        };
    };
    [CHANNELS.NATIVE_RESET_MEMORY_MONITORING]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.NATIVE_GET_GPU_INFO]: {
        request: void;
        response: SystemIpcTypes.GpuInfo;
    };
    [CHANNELS.NATIVE_GET_GPU_MEMORY_STATS]: {
        request: void;
        response: {
            total: number;
            used: number;
            free: number;
        };
    };
    [CHANNELS.NATIVE_RUN_GPU_ACCELERATION]: {
        request: {
            taskType: string;
            data: any;
        };
        response: {
            result: any;
            executionTime: number;
        };
    };
    [CHANNELS.NATIVE_RUN_GPU_BENCHMARK]: {
        request: {
            duration?: number;
        };
        response: {
            score: number;
            details: any;
        };
    };
    [CHANNELS.NATIVE_GET_SYSTEM_INFO]: {
        request: void;
        response: SystemIpcTypes.SystemInfo;
    };
    [CHANNELS.NATIVE_GET_STATUS]: {
        request: void;
        response: NativeIpcTypes.NativeModuleStatus;
    };
    [CHANNELS.NATIVE_IS_AVAILABLE]: {
        request: void;
        response: {
            available: boolean;
        };
    };
    [CHANNELS.NATIVE_GET_MODULE_INFO]: {
        request: void;
        response: {
            version: string;
            features: string[];
        };
    };
    [CHANNELS.NATIVE_GET_MODULE_VERSION]: {
        request: void;
        response: {
            version: string;
        };
    };
    [CHANNELS.NATIVE_INITIALIZE]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.NATIVE_CLEANUP]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.NATIVE_GET_TIMESTAMP]: {
        request: void;
        response: {
            timestamp: number;
        };
    };
    [CHANNELS.NATIVE_ADD_WORKER_TASK]: {
        request: NativeIpcTypes.WorkerTaskData;
        response: {
            taskId: string;
        };
    };
    [CHANNELS.NATIVE_GET_WORKER_TASK_STATUS]: {
        request: {
            taskId: string;
        };
        response: NativeIpcTypes.WorkerTaskStatus;
    };
    [CHANNELS.NATIVE_GET_WORKER_STATS]: {
        request: void;
        response: NativeIpcTypes.WorkerStats;
    };
    [CHANNELS.NATIVE_GET_PENDING_TASK_COUNT]: {
        request: void;
        response: {
            count: number;
        };
    };
    [CHANNELS.NATIVE_RESET_WORKER_POOL]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.NATIVE_EXECUTE_CPU_TASK]: {
        request: {
            taskType: string;
            data: any;
        };
        response: {
            result: any;
            executionTime: number;
        };
    };
    [CHANNELS.NATIVE_PROCESS_DATA_PARALLEL]: {
        request: {
            data: any[];
            chunkSize?: number;
        };
        response: {
            results: any[];
            totalTime: number;
        };
    };
    [CHANNELS.NATIVE_CALCULATE_FILE_HASH]: {
        request: {
            filePath: string;
            algorithm?: 'md5' | 'sha1' | 'sha256';
        };
        response: {
            hash: string;
        };
    };
    [CHANNELS.NATIVE_CALCULATE_DIRECTORY_SIZE]: {
        request: {
            directoryPath: string;
        };
        response: {
            size: number;
            fileCount: number;
        };
    };
    [CHANNELS.NATIVE_CALCULATE_STRING_SIMILARITY]: {
        request: {
            str1: string;
            str2: string;
        };
        response: {
            similarity: number;
        };
    };
    [CHANNELS.NATIVE_VALIDATE_JSON]: {
        request: {
            jsonString: string;
        };
        response: {
            valid: boolean;
            error?: string;
        };
    };
    [CHANNELS.NATIVE_ENCODE_BASE64]: {
        request: {
            data: string;
        };
        response: {
            encoded: string;
        };
    };
    [CHANNELS.NATIVE_DECODE_BASE64]: {
        request: {
            data: string;
        };
        response: {
            decoded: string;
        };
    };
    [CHANNELS.NATIVE_GENERATE_UUID]: {
        request: void;
        response: {
            uuid: string;
        };
    };
    [CHANNELS.NATIVE_GET_TIMESTAMP_STRING]: {
        request: {
            format?: string;
        };
        response: {
            timestamp: string;
        };
    };
    [CHANNELS.NATIVE_GET_ENV_VAR]: {
        request: {
            name: string;
        };
        response: {
            value?: string;
        };
    };
    [CHANNELS.NATIVE_GET_PROCESS_ID]: {
        request: void;
        response: {
            pid: number;
        };
    };
    [CHANNELS.NATIVE_START_PERFORMANCE_MEASUREMENT]: {
        request: {
            label: string;
        };
        response: {
            measurementId: string;
        };
    };
    [CHANNELS.NATIVE_END_PERFORMANCE_MEASUREMENT]: {
        request: {
            measurementId: string;
        };
        response: {
            duration: number;
        };
    };
    [CHANNELS.SETTINGS_GET]: {
        request: {
            category?: keyof SettingsIpcTypes.AppSettings;
            key?: string;
        };
        response: any;
    };
    [CHANNELS.SETTINGS_SET]: {
        request: SettingsIpcTypes.SettingsUpdateRequest;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.SETTINGS_GET_ALL]: {
        request: void;
        response: SettingsIpcTypes.AppSettings;
    };
    [CHANNELS.SETTINGS_UPDATE]: {
        request: SettingsIpcTypes.SettingsUpdateRequest;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.SETTINGS_UPDATE_MULTIPLE]: {
        request: SettingsIpcTypes.SettingsMultipleUpdateRequest;
        response: {
            success: boolean;
            failedUpdates?: string[];
        };
    };
    [CHANNELS.SETTINGS_RESET]: {
        request: {
            category?: keyof SettingsIpcTypes.AppSettings;
        };
        response: {
            success: boolean;
        };
    };
    [CHANNELS.SETTINGS_SAVE]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.SETTINGS_LOAD]: {
        request: void;
        response: {
            success: boolean;
            settings: SettingsIpcTypes.AppSettings;
        };
    };
    [CHANNELS.WINDOW_CREATE]: {
        request: WindowIpcTypes.WindowCreateOptions;
        response: {
            windowId: number;
        };
    };
    [CHANNELS.MINIMIZE_WINDOW]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.MAXIMIZE_WINDOW]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.TOGGLE_MAXIMIZE]: {
        request: void;
        response: {
            success: boolean;
            isMaximized: boolean;
        };
    };
    [CHANNELS.CLOSE_WINDOW]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.TOGGLE_DEVTOOLS]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.START_MONITORING]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.STOP_MONITORING]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.GET_CURRENT_METRICS]: {
        request: void;
        response: any;
    };
    [CHANNELS.GET_METRICS_HISTORY]: {
        request: {
            startTime?: number;
            endTime?: number;
        };
        response: any[];
    };
    [CHANNELS.GET_AVERAGE_METRICS]: {
        request: {
            duration?: number;
        };
        response: any;
    };
    [CHANNELS.GET_SYSTEM_HEALTH]: {
        request: void;
        response: {
            status: 'healthy' | 'warning' | 'critical';
            metrics: any;
        };
    };
    [CHANNELS.GET_SYSTEM_INFO]: {
        request: void;
        response: SystemIpcTypes.SystemInfo;
    };
    [CHANNELS.GET_MEMORY_USAGE]: {
        request: void;
        response: MemoryIpcTypes.ReactMemoryData;
    };
    [CHANNELS.OPTIMIZE_MEMORY]: {
        request: void;
        response: MemoryIpcTypes.MemoryOptimizationResult;
    };
    [CHANNELS.GET_APP_INFO]: {
        request: void;
        response: {
            name: string;
            version: string;
            description: string;
        };
    };
    [CHANNELS.GET_VERSION]: {
        request: void;
        response: {
            version: string;
        };
    };
    [CHANNELS.APP_RESTART]: {
        request: void;
        response: {
            success: boolean;
        };
    };
    [CHANNELS.APP_QUIT]: {
        request: void;
        response: {
            success: boolean;
        };
    };
}
/**
 * IpcResponse 타입 가드
 */
export declare function isIpcResponse<T = any>(obj: any): obj is IpcResponse<T>;
/**
 * IpcError 타입 가드
 */
export declare function isIpcError(obj: any): obj is IpcError;
/**
 * 유효한 IPC 채널인지 확인
 */
export declare function isValidIpcChannel(channel: string): channel is IpcChannel;
/**
 * 성공 응답 생성 헬퍼
 */
export declare function createSuccessResponse<T>(data: T): IpcResponse<T>;
/**
 * 실패 응답 생성 헬퍼
 */
export declare function createErrorResponse(error: string | IpcError): IpcResponse<never>;
/**
 * IpcError 생성 헬퍼
 */
export declare function createIpcError(code: string, message: string, details?: Record<string, any>, stack?: string): IpcError;
/**
 * IPC 채널의 요청 타입을 추출합니다.
 */
export type IpcRequestType<T extends keyof IpcChannelMap> = IpcChannelMap[T]['request'];
/**
 * IPC 채널의 응답 타입을 추출합니다.
 */
export type IpcResponseType<T extends keyof IpcChannelMap> = IpcChannelMap[T]['response'];
/**
 * 타입 안전한 IPC 핸들러 함수 타입
 */
export type TypedIpcHandler<T extends keyof IpcChannelMap> = (event: Electron.IpcMainInvokeEvent, ...args: IpcRequestType<T> extends void ? [] : [IpcRequestType<T>]) => Promise<IpcResponse<IpcResponseType<T>>>;
/**
 * 타입 안전한 IPC 호출 함수 타입
 */
export type TypedIpcInvoke = <T extends keyof IpcChannelMap>(channel: T, ...args: IpcRequestType<T> extends void ? [] : [IpcRequestType<T>]) => Promise<IpcResponseType<T>>;
//# sourceMappingURL=ipc.d.ts.map