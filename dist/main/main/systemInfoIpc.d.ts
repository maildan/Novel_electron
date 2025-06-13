/**
 * 시스템 정보 IPC 핸들러
 * CPU, 프로세스, 시스템 상태 등을 제공합니다.
 */
export interface CPUInfo {
    usage: number;
    temperature?: number;
    model: string;
    cores: number;
    threads: number;
    speed: number;
}
export interface ProcessInfo {
    pid: number;
    name: string;
    cpuUsage: number;
    memoryUsage: number;
    memoryPercent: number;
    status: string;
    ppid?: number;
    user?: string;
}
export interface SystemInfo {
    cpu: CPUInfo;
    processes: ProcessInfo[];
    uptime: number;
    loadAverage: number[];
    platform: string;
    arch: string;
    hostname: string;
    timestamp: number;
}
/**
 * 시스템 정보 IPC 핸들러 등록
 */
export declare function registerSystemInfoIpcHandlers(): void;
//# sourceMappingURL=systemInfoIpc.d.ts.map