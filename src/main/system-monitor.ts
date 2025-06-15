import { app, powerMonitor } from 'electron';
import { EventEmitter } from 'events';
import { AppConfig } from './config';
import { DatabaseManager } from './database';
import { MemoryManager } from './memory';

interface SystemMetrics {
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

export class SystemMonitor extends EventEmitter {
  private static instance: SystemMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private networkMonitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private metricsHistory: SystemMetrics[] = [];
  private maxHistorySize = 300; // 5분간 데이터 (1초 간격)
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

  /**
 * 시스템 모니터 초기화
 */
  private async initialize(): Promise<void> {
    console.log('[Monitor] 시스템 모니터 초기화');

    // 전원 상태 모니터링
    this.setupPowerMonitoring();

    // 앱 종료 시 Cleanup
    app.on('before-quit', () => {
      this.stopMonitoring();
    });

    // 데이터베이스 초기화
    try {
      await this.dbManager.initialize();
    } catch (error) {
      console.error('[Monitor] 데이터베이스 초기화 Failed:', error);
    }
  }

  /**
 * 모니터링 시작
 */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    console.log('[Monitor] 시스템 모니터링 시작');
    this.isMonitoring = true;

    // 주요 메트릭 모니터링 (1초 간격)
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.processMetrics(metrics);
      } catch (error) {
        console.error('[Monitor] 메트릭 수집 Failed:', error);
      }
    }, 1000);

    // 네트워크 모니터링 (5초 간격)
    this.networkMonitorInterval = setInterval(async () => {
      try {
        await this.updateNetworkStats();
      } catch (error) {
        console.error('[Monitor] 네트워크 모니터링 Failed:', error);
      }
    }, 5000);

    this.emit('monitoring-started');
  }

  /**
 * 모니터링 중지
 */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[Monitor] 시스템 모니터링 중지');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }

    this.emit('monitoring-stopped');
  }

  /**
 * 시스템 메트릭 수집
 */
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
      // GPU 메트릭을 가져올 수 없는 경우 무시
    }

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      gpu: gpuMetrics,
      disk: diskMetrics,
      network: {
        downloadSpeed: 0, // 네트워크 모니터링에서 업데이트
        uploadSpeed: 0,
      },
      power: powerMetrics,
      timestamp: Date.now(),
    };
  }

  /**
   * CPU 메트릭 수집
   */
  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
    const os = require('os');
    
    // CPU 사용률 계산
    const cpus = os.cpus();
    const usage = await this.calculateCpuUsage();
    
    return {
      usage: Math.round(usage * 100) / 100,
      processes: cpus.length,
      temperature: await this.getCpuTemperature(),
    };
  }

  /**
   * CPU 사용률 계산
   */
  private calculateCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const os = require('os');
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        const totalTime = (endTime - startTime) * 1000; // microseconds

        const usage = (endUsage.user + endUsage.system) / totalTime;
        resolve(Math.min(usage * 100, 100));
      }, 100);
    });
  }

  /**
   * CPU 온도 조회 (네이티브 모듈 사용)
   */
  private async getCpuTemperature(): Promise<number | undefined> {
    try {
      // 네이티브 모듈을 통한 CPU 온도 조회
      // 실제 구현은 Rust 네이티브 모듈에서 처리
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
 * 메모리 메트릭 수집
 */
  private getMemoryMetrics(): SystemMetrics['memory'] {
    const memoryStats = this.memoryManager.getCurrentMemoryUsage();
    const total = memoryStats.system.total;
    const used = memoryStats.system.used;
    const free = memoryStats.system.free;

    return {
      total,
      used,
      free,
      percentage: Math.round((used / total) * 100 * 100) / 100,
    };
  }

  /**
   * GPU 메트릭 수집
   */
  private async getGpuMetrics(): Promise<SystemMetrics['gpu'] | undefined> {
    try {
      // 네이티브 모듈을 통한 GPU 메트릭 조회
      // 실제 구현은 Rust 네이티브 모듈에서 처리
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
 * 디스크 메트릭 수집
 */
  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    try {
      const fs = require('fs');
      const stats = fs.statSync(app.getPath('userData'));
      
      // 임시로 고정값 반환 (실제로는 네이티브 모듈에서 처리)
      return {
        total: 1000000, // 1TB
        free: 500000,   // 500GB
        used: 500000,   // 500GB
        percentage: 50,
      };
    } catch (error) {
      return {
        total: 0,
        free: 0,
        used: 0,
        percentage: 0,
      };
    }
  }

  /**
 * 전원 메트릭 수집
 */
  private getPowerMetrics(): SystemMetrics['power'] {
    return {
      isOnBattery: powerMonitor.isOnBatteryPower(),
      batteryLevel: this.getBatteryLevel(),
      isCharging: this.isCharging(),
    };
  }

  /**
 * 배터리 레벨 조회
 */
  private getBatteryLevel(): number | undefined {
    try {
      // 플랫폼별 배터리 정보 조회
      // 실제 구현은 네이티브 모듈에서 처리
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
 * 충전 상태 확인
 */
  private isCharging(): boolean | undefined {
    try {
      // 플랫폼별 충전 상태 확인
      // 실제 구현은 네이티브 모듈에서 처리
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
 * 네트워크 통계 업데이트
 */
  private async updateNetworkStats(): Promise<void> {
    try {
      // 네이티브 모듈을 통한 네트워크 통계 조회
      // 실제 구현은 Rust 네이티브 모듈에서 처리
      const currentStats = { download: 0, upload: 0 };
      
      if (this.metricsHistory.length > 0) {
        const lastMetrics = this.metricsHistory[this.metricsHistory.length - 1];
        lastMetrics.network.downloadSpeed = currentStats.download;
        lastMetrics.network.uploadSpeed = currentStats.upload;
      }
    } catch (error) {
      console.error('[Monitor] 네트워크 통계 업데이트 Failed:', error);
    }
  }

  /**
 * 메트릭 처리 및 분석
 */
  private async processMetrics(metrics: SystemMetrics): Promise<void> {
    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // 알림 확인
    const alerts = this.checkAlerts(metrics);
    for (const alert of alerts) {
      this.emit('performance-alert', alert);
    }

    // 데이터베이스에 저장 (1분마다)
    if (metrics.timestamp % 60000 < 1000) {
      try {
        await this.dbManager.saveSystemMetric({
          cpuUsage: metrics.cpu.usage,
          memoryUsage: metrics.memory.percentage,
          gpuUsage: metrics.gpu?.usage,
          timestamp: new Date(metrics.timestamp),
        });
      } catch (error) {
        console.error('[Monitor] 시스템 메트릭 저장 Failed:', error);
      }
    }

    // 실시간 업데이트 이벤트
    this.emit('metrics-updated', metrics);
  }

  /**
 * 성능 알림 확인
 */
  private checkAlerts(metrics: SystemMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const now = Date.now();

    // CPU 사용률 확인
    if (metrics.cpu.usage > this.alertThresholds.cpu.critical) {
      alerts.push({
        type: 'cpu',
        level: 'critical',
        message: `CPU 사용률이 위험 수준입니다: ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: this.alertThresholds.cpu.critical,
        timestamp: now,
      });
    } else if (metrics.cpu.usage > this.alertThresholds.cpu.warning) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `CPU 사용률이 높습니다: ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: this.alertThresholds.cpu.warning,
        timestamp: now,
      });
    }

    // 메모리 사용률 확인
    if (metrics.memory.percentage > this.alertThresholds.memory.critical) {
      alerts.push({
        type: 'memory',
        level: 'critical',
        message: `메모리 사용률이 위험 수준입니다: ${metrics.memory.percentage}%`,
        value: metrics.memory.percentage,
        threshold: this.alertThresholds.memory.critical,
        timestamp: now,
      });
    } else if (metrics.memory.percentage > this.alertThresholds.memory.warning) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `메모리 사용률이 높습니다: ${metrics.memory.percentage}%`,
        value: metrics.memory.percentage,
        threshold: this.alertThresholds.memory.warning,
        timestamp: now,
      });
    }

    // GPU 사용률 확인 (가능한 경우)
    if (metrics.gpu && metrics.gpu.usage > this.alertThresholds.gpu.critical) {
      alerts.push({
        type: 'gpu',
        level: 'critical',
        message: `GPU 사용률이 위험 수준입니다: ${metrics.gpu.usage}%`,
        value: metrics.gpu.usage,
        threshold: this.alertThresholds.gpu.critical,
        timestamp: now,
      });
    }

    return alerts;
  }

  /**
 * 전원 모니터링 Setup
 */
  private setupPowerMonitoring(): void {
    powerMonitor.on('on-ac', () => {
      console.log('[Monitor] AC 전원 Connected');
      this.emit('power-state-changed', { isOnBattery: false });
    });

    powerMonitor.on('on-battery', () => {
      console.log('[Monitor] 배터리 전원으로 전환됨');
      this.emit('power-state-changed', { isOnBattery: true });
    });

    powerMonitor.on('shutdown', () => {
      console.log('[Monitor] 시스템 종료 신호 감지');
      this.emit('system-shutdown');
    });

    powerMonitor.on('suspend', () => {
      console.log('[Monitor] 시스템 일시정지');
      this.emit('system-suspend');
    });

    powerMonitor.on('resume', () => {
      console.log('[Monitor] 시스템 복구');
      this.emit('system-resume');
    });
  }

  /**
 * 현재 메트릭 조회
 */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  /**
 * 메트릭 히스토리 조회
 */
  getMetricsHistory(minutes = 5): SystemMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
 * 평균 메트릭 계산
 */
  getAverageMetrics(minutes = 5): Partial<SystemMetrics> | null {
    const history = this.getMetricsHistory(minutes);
    if (history.length === 0) return null;

    const avg = history.reduce((acc, metrics) => ({
      cpu: (acc.cpu || 0) + metrics.cpu.usage,
      memory: (acc.memory || 0) + metrics.memory.percentage,
      gpu: (acc.gpu || 0) + (metrics.gpu?.usage || 0),
    }), { cpu: 0, memory: 0, gpu: 0 });

    return {
      cpu: { usage: Math.round(avg.cpu / history.length * 100) / 100 },
      memory: { percentage: Math.round(avg.memory / history.length * 100) / 100 },
      gpu: avg.gpu > 0 ? { usage: Math.round(avg.gpu / history.length * 100) / 100 } : undefined,
    } as Partial<SystemMetrics>;
  }

  /**
 * 시스템 상태 확인
 */
  getSystemHealth(): {
    status: 'good' | 'warning' | 'critical';
    issues: string[];
    score: number;
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return { status: 'warning', issues: ['모니터링 데이터 없음'], score: 0 };
    }

    const issues: string[] = [];
    let score = 100;

    // CPU 상태 확인
    if (current.cpu.usage > this.alertThresholds.cpu.critical) {
      issues.push('CPU 사용률 위험 수준');
      score -= 30;
    } else if (current.cpu.usage > this.alertThresholds.cpu.warning) {
      issues.push('CPU 사용률 높음');
      score -= 15;
    }

    // 메모리 상태 확인
    if (current.memory.percentage > this.alertThresholds.memory.critical) {
      issues.push('메모리 사용률 위험 수준');
      score -= 30;
    } else if (current.memory.percentage > this.alertThresholds.memory.warning) {
      issues.push('메모리 사용률 높음');
      score -= 15;
    }

    // GPU 상태 확인
    if (current.gpu && current.gpu.usage > this.alertThresholds.gpu.critical) {
      issues.push('GPU 사용률 위험 수준');
      score -= 20;
    }

    // 상태 결정
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (score < 50) status = 'critical';
    else if (score < 80) status = 'warning';

    return { status, issues, score: Math.max(0, score) };
  }

  /**
 * 타이핑 메트릭 업데이트
 */
  updateTypingMetrics(data: any): void {
    try {
      if (!data || typeof data !== 'object') {
        return;
      }

      // 타이핑 관련 메트릭을 시스템 모니터에 통합
      const typingMetrics = {
        wpm: data.wpm || 0,
        accuracy: data.accuracy || 0,
        keyCount: data.keyCount || 0,
        timestamp: Date.now()
      };

      // 이벤트로 타이핑 메트릭 전송
      this.emit('typing-metrics-updated', typingMetrics);

      console.log('[Monitor] 타이핑 메트릭 업데이트:', typingMetrics);
    } catch (error) {
      console.error('[Monitor] 타이핑 메트릭 업데이트 Failed:', error);
    }
  }

  /**
   * 시스템 정보 조회 (IPC 핸들러용)
   */
  async getSystemInfo(): Promise<any> {
    try {
      const os = require('os');
      const process = require('process');
      
      return {
        platform: process.platform,
        arch: process.arch,
        version: os.release(),
        hostname: os.hostname(),
        cpus: os.cpus().map((cpu: any) => ({
          model: cpu.model,
          speed: cpu.speed,
          cores: cpu.times
        })),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        nodeVersion: process.version,
        electronVersion: process.versions.electron
      };
    } catch (error) {
      console.error('[SystemMonitor] 시스템 정보 조회 Failed:', error);
      throw error;
    }
  }

  /**
   * CPU 사용률 조회 (IPC 핸들러용)
   */
  async getCpuUsage(): Promise<any> {
    try {
      const os = require('os');
      const cpus = os.cpus();
      
      // CPU 사용률 계산 (간단한 구현)
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach((cpu: any) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const usage = 100 - ~~(100 * totalIdle / totalTick);
      
      return {
        usage,
        cores: cpus.length,
        details: cpus.map((cpu: any, index: number) => ({
          core: index,
          model: cpu.model,
          speed: cpu.speed,
          times: cpu.times
        }))
      };
    } catch (error) {
      console.error('[SystemMonitor] CPU 사용률 조회 Failed:', error);
      throw error;
    }
  }

  /**
   * GPU 정보 조회 (IPC 핸들러용)
   */
  async getGpuInfo(): Promise<any> {
    try {
      // GPU 정보는 플랫폼에 따라 다르게 구현
      const os = require('os');
      const platform = os.platform();
      
      let gpuInfo = {
        available: false,
        usage: 0,
        memory: 0,
        temperature: null,
        vendor: 'Unknown',
        model: 'Unknown'
      };

      // macOS에서는 시스템 프로파일러를 통해 GPU 정보 조회
      if (platform === 'darwin') {
        try {
          const { exec } = require('child_process');
          const util = require('util');
          const execAsync = util.promisify(exec);
          
          const { stdout } = await execAsync('system_profiler SPDisplaysDataType -json');
          const data = JSON.parse(stdout);
          
          if (data.SPDisplaysDataType && data.SPDisplaysDataType.length > 0) {
            const gpu = data.SPDisplaysDataType[0];
            gpuInfo = {
              available: true,
              usage: 0, // 실시간 사용률은 별도 도구 필요
              memory: parseInt(gpu.spdisplays_vram || '0'),
              temperature: null,
              vendor: gpu.spdisplays_vendor || 'Unknown',
              model: gpu.spdisplays_device_id || 'Unknown'
            };
          }
        } catch (error) {
          console.warn('[SystemMonitor] GPU 정보 조회 Failed, 기본값 사용:', error);
        }
      }
      
      return gpuInfo;
    } catch (error) {
      console.error('[SystemMonitor] GPU 정보 조회 Failed:', error);
      throw error;
    }
  }
}
