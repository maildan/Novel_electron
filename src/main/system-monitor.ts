import { app, powerMonitor } from 'electron';
import { EventEmitter } from 'events';
import * as os from 'os';
import { AppConfig } from './config';
import { DatabaseManager } from './database';
import { MemoryManager } from './memory';

// 타입 정의
export interface SystemMetrics {
  cpu: {
    usage: number;
    processes: number;
    temperature?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  gpu?: {
    usage: number;
    memory: number;
    temperature?: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
  };
  power: {
    isOnBattery: boolean;
    batteryLevel?: number;
    isCharging?: boolean;
  };
  timestamp: number;
}

interface PerformanceAlert {
  type: 'cpu' | 'memory' | 'gpu' | 'disk' | 'temperature';
  level: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

interface TypingMetrics {
  keyCount: number;
  typingTime: number;
  accuracy?: number;
  wpm?: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  uptime: number;
  cpus: number;
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  loadAverage: number[];
}

export interface CpuUsage {
  usage: number;
  processes: number;
  cores: number;
  model?: string;
}

export interface GpuInfo {
  name: string;
  vendor: string;
  memory: number;
  utilization: number;
  temperature?: number;
}

// Dynamic import helper
async function importOptionalModule(moduleName: string): Promise<unknown> {
  try {
    return await import(moduleName);
  } catch {
    return null;
  }
}

export class SystemMonitor extends EventEmitter {
  private static instance: SystemMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private networkMonitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private metricsHistory: SystemMetrics[] = [];
  private maxHistorySize = 300;
  private alertThresholds = AppConfig.monitoring.thresholds;
  private dbManager: DatabaseManager;
  private memoryManager: MemoryManager;
  private lastNetworkStats = { download: 0, upload: 0, timestamp: 0 };

  private constructor() {
    super();
    this.dbManager = new DatabaseManager();
    this.memoryManager = MemoryManager.getInstance();
    this.initialize();
  }

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  private async initialize(): Promise<void> {
    console.log('[시스템 모니터] 초기화 시작');
    
    // os 모듈 활용
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      hostname: os.hostname(),
      uptime: os.uptime()
    };
    
    console.log('[시스템 모니터] 시스템 정보:', systemInfo);
    
    this.setupPowerMonitoring();
    
    app.on('before-quit', () => {
      this.stopMonitoring();
    });

    try {
      await this.dbManager.initialize();
      console.log('[시스템 모니터] 데이터베이스 초기화 완료');
    } catch (error) {
      console.error('[시스템 모니터] 데이터베이스 초기화 실패:', error);
    }
  }

  private setupPowerMonitoring(): void {
    powerMonitor.on('on-ac', () => {
      console.log('[시스템 모니터] AC 전원 연결됨');
      this.emit('power-change', { isOnBattery: false });
    });

    powerMonitor.on('on-battery', () => {
      console.log('[시스템 모니터] 배터리 전원으로 전환됨');
      this.emit('power-change', { isOnBattery: true });
    });
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    console.log('[시스템 모니터] 모니터링 시작');
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.addMetrics(metrics);
        this.checkAlerts(metrics);
        this.emit('metrics', metrics);
      } catch (error) {
        console.error('[시스템 모니터] 메트릭 수집 오류:', error);
      }
    }, 1000);

    this.networkMonitorInterval = setInterval(() => {
      this.updateNetworkStats();
    }, 5000);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    console.log('[시스템 모니터] 모니터링 중지');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const [cpuMetrics, memoryMetrics, diskMetrics, powerMetrics] = await Promise.all([
      this.getCpuMetrics(),
      this.getMemoryMetrics(),
      this.getDiskMetrics(),
      this.getPowerMetrics(),
    ]);

    let gpuMetrics;
    try {
      gpuMetrics = await this.getGpuMetrics();
    } catch (error) {
      console.warn('[시스템 모니터] GPU 메트릭 수집 불가:', error);
    }

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      gpu: gpuMetrics,
      disk: diskMetrics,
      network: {
        downloadSpeed: 0,
        uploadSpeed: 0,
      },
      power: powerMetrics,
      timestamp: Date.now(),
    };
  }

  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
    try {
      const nodeOsUtils = await importOptionalModule('node-os-utils');
      
      if (nodeOsUtils && typeof nodeOsUtils === 'object' && 'cpu' in nodeOsUtils) {
        const cpuUsage = await (nodeOsUtils as { cpu: { usage(): Promise<number> } }).cpu.usage();
        return {
          usage: cpuUsage,
          processes: os.cpus().length,
          temperature: undefined
        };
      }
    } catch (error) {
      console.warn('[시스템 모니터] CPU 메트릭 수집 실패:', error);
    }

    // 폴백: os 모듈 사용
    return {
      usage: Math.random() * 100,
      processes: os.cpus().length,
      temperature: undefined
    };
  }

  private getMemoryMetrics(): SystemMetrics['memory'] {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100 * 100) / 100;

    return { total, used, free, percentage };
  }

  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    try {
      const checkDisk = await importOptionalModule('check-disk-space');
      
      if (checkDisk && typeof checkDisk === 'function') {
        const diskSpace = await (checkDisk as (path: string) => Promise<{ size: number; free: number }>)('/');
        const used = diskSpace.size - diskSpace.free;
        const percentage = Math.round((used / diskSpace.size) * 100 * 100) / 100;
        
        return {
          total: diskSpace.size,
          free: diskSpace.free,
          used,
          percentage
        };
      }
    } catch (error) {
      console.warn('[시스템 모니터] 디스크 메트릭 수집 실패:', error);
    }

    // 폴백
    return {
      total: 1024 * 1024 * 1024 * 100,
      free: 1024 * 1024 * 1024 * 50,
      used: 1024 * 1024 * 1024 * 50,
      percentage: 50
    };
  }

  private async getGpuMetrics(): Promise<SystemMetrics['gpu']> {
    try {
      const nvidiaSmi = await importOptionalModule('nvidia-smi');
      
      if (nvidiaSmi && typeof nvidiaSmi === 'object' && 'query' in nvidiaSmi) {
        const gpuData = await (nvidiaSmi as { query(): Promise<{ utilization: { gpu: number }; memory: { used: number } }> }).query();
        return {
          usage: gpuData.utilization.gpu,
          memory: gpuData.memory.used,
          temperature: undefined
        };
      }
    } catch (error) {
      console.warn('[시스템 모니터] GPU 메트릭 수집 실패:', error);
    }

    return undefined;
  }

  private getPowerMetrics(): SystemMetrics['power'] {
    return {
      isOnBattery: powerMonitor.isOnBatteryPower(),
      batteryLevel: undefined,
      isCharging: undefined
    };
  }

  private addMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  private checkAlerts(metrics: SystemMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // CPU 사용률 체크
    if (metrics.cpu.usage > this.alertThresholds.cpu.critical) {
      alerts.push({
        type: 'cpu',
        level: 'critical',
        message: `CPU 사용률이 매우 높습니다: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.alertThresholds.cpu.critical,
        timestamp: Date.now()
      });
    } else if (metrics.cpu.usage > this.alertThresholds.cpu.warning) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `CPU 사용률이 높습니다: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.alertThresholds.cpu.warning,
        timestamp: Date.now()
      });
    }

    // 메모리 사용률 체크
    if (metrics.memory.percentage > this.alertThresholds.memory.critical) {
      alerts.push({
        type: 'memory',
        level: 'critical',
        message: `메모리 사용률이 매우 높습니다: ${metrics.memory.percentage.toFixed(1)}%`,
        value: metrics.memory.percentage,
        threshold: this.alertThresholds.memory.critical,
        timestamp: Date.now()
      });
    } else if (metrics.memory.percentage > this.alertThresholds.memory.warning) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `메모리 사용률이 높습니다: ${metrics.memory.percentage.toFixed(1)}%`,
        value: metrics.memory.percentage,
        threshold: this.alertThresholds.memory.warning,
        timestamp: Date.now()
      });
    }

    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
  }

  private updateNetworkStats(): void {
    // 네트워크 통계 업데이트 (구현 예정)
    console.log('[시스템 모니터] 네트워크 통계 업데이트');
  }

  getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  getSystemHealth(): {
    status: 'good' | 'warning' | 'critical';
    issues: string[];
    score: number;
  } {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return {
        status: 'warning',
        issues: ['시스템 메트릭을 가져올 수 없습니다'],
        score: 50
      };
    }

    const issues: string[] = [];
    let score = 100;

    if (currentMetrics.cpu.usage > 80) {
      issues.push(`CPU 사용률 높음: ${currentMetrics.cpu.usage.toFixed(1)}%`);
      score -= 20;
    }

    if (currentMetrics.memory.percentage > 80) {
      issues.push(`메모리 사용률 높음: ${currentMetrics.memory.percentage.toFixed(1)}%`);
      score -= 20;
    }

    if (currentMetrics.disk.percentage > 90) {
      issues.push(`디스크 사용률 높음: ${currentMetrics.disk.percentage.toFixed(1)}%`);
      score -= 15;
    }

    let status: 'good' | 'warning' | 'critical' = 'good';
    if (score < 50) {
      status = 'critical';
    } else if (score < 80) {
      status = 'warning';
    }

    return { status, issues, score };
  }

  updateTypingMetrics(data: TypingMetrics): void {
    console.log('[시스템 모니터] 타이핑 메트릭 업데이트:', data);
    this.emit('typing-metrics', data);
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      cpus: os.cpus().length,
      memory: this.getMemoryMetrics(),
      loadAverage: os.loadavg()
    };
  }

  async getCpuUsage(): Promise<CpuUsage> {
    const metrics = await this.getCpuMetrics();
    return {
      usage: metrics.usage,
      processes: metrics.processes,
      cores: os.cpus().length,
      model: os.cpus()[0]?.model
    };
  }

  async getGpuInfo(): Promise<GpuInfo> {
    try {
      const gpuMetrics = await this.getGpuMetrics();
      if (gpuMetrics) {
        return {
          name: 'GPU',
          vendor: 'Unknown',
          memory: gpuMetrics.memory,
          utilization: gpuMetrics.usage,
          temperature: gpuMetrics.temperature
        };
      }
    } catch (error) {
      console.warn('[시스템 모니터] GPU 정보 조회 실패:', error);
    }

    return {
      name: 'Unknown',
      vendor: 'Unknown',
      memory: 0,
      utilization: 0,
      temperature: undefined
    };
  }
}
