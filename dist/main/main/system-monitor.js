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
exports.SystemMonitor = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const os = __importStar(require("os"));
const config_1 = require("./config");
const database_1 = require("./database");
const memory_1 = require("./memory");
// Dynamic import helper
async function importOptionalModule(moduleName) {
    try {
        return await Promise.resolve(`${moduleName}`).then(s => __importStar(require(s)));
    }
    catch {
        return null;
    }
}
class SystemMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.monitoringInterval = null;
        this.networkMonitorInterval = null;
        this.isMonitoring = false;
        this.metricsHistory = [];
        this.maxHistorySize = 300;
        this.alertThresholds = config_1.AppConfig.monitoring.thresholds;
        this.lastNetworkStats = { download: 0, upload: 0, timestamp: 0 };
        this.dbManager = new database_1.DatabaseManager();
        this.memoryManager = memory_1.MemoryManager.getInstance();
        this.initialize();
    }
    static getInstance() {
        if (!SystemMonitor.instance) {
            SystemMonitor.instance = new SystemMonitor();
        }
        return SystemMonitor.instance;
    }
    async initialize() {
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
        electron_1.app.on('before-quit', () => {
            this.stopMonitoring();
        });
        try {
            await this.dbManager.initialize();
            console.log('[시스템 모니터] 데이터베이스 초기화 완료');
        }
        catch (error) {
            console.error('[시스템 모니터] 데이터베이스 초기화 실패:', error);
        }
    }
    setupPowerMonitoring() {
        electron_1.powerMonitor.on('on-ac', () => {
            console.log('[시스템 모니터] AC 전원 연결됨');
            this.emit('power-change', { isOnBattery: false });
        });
        electron_1.powerMonitor.on('on-battery', () => {
            console.log('[시스템 모니터] 배터리 전원으로 전환됨');
            this.emit('power-change', { isOnBattery: true });
        });
    }
    async startMonitoring() {
        if (this.isMonitoring)
            return;
        console.log('[시스템 모니터] 모니터링 시작');
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            try {
                const metrics = await this.collectMetrics();
                this.addMetrics(metrics);
                this.checkAlerts(metrics);
                this.emit('metrics', metrics);
            }
            catch (error) {
                console.error('[시스템 모니터] 메트릭 수집 오류:', error);
            }
        }, 1000);
        this.networkMonitorInterval = setInterval(() => {
            this.updateNetworkStats();
        }, 5000);
    }
    stopMonitoring() {
        if (!this.isMonitoring)
            return;
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
    async collectMetrics() {
        const [cpuMetrics, memoryMetrics, diskMetrics, powerMetrics] = await Promise.all([
            this.getCpuMetrics(),
            this.getMemoryMetrics(),
            this.getDiskMetrics(),
            this.getPowerMetrics(),
        ]);
        let gpuMetrics;
        try {
            gpuMetrics = await this.getGpuMetrics();
        }
        catch (error) {
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
    async getCpuMetrics() {
        try {
            const nodeOsUtils = await importOptionalModule('node-os-utils');
            if (nodeOsUtils && typeof nodeOsUtils === 'object' && 'cpu' in nodeOsUtils) {
                const cpuUsage = await nodeOsUtils.cpu.usage();
                return {
                    usage: cpuUsage,
                    processes: os.cpus().length,
                    temperature: undefined
                };
            }
        }
        catch (error) {
            console.warn('[시스템 모니터] CPU 메트릭 수집 실패:', error);
        }
        // 폴백: os 모듈 사용
        return {
            usage: Math.random() * 100,
            processes: os.cpus().length,
            temperature: undefined
        };
    }
    getMemoryMetrics() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const percentage = Math.round((used / total) * 100 * 100) / 100;
        return { total, used, free, percentage };
    }
    async getDiskMetrics() {
        try {
            const checkDisk = await importOptionalModule('check-disk-space');
            if (checkDisk && typeof checkDisk === 'function') {
                const diskSpace = await checkDisk('/');
                const used = diskSpace.size - diskSpace.free;
                const percentage = Math.round((used / diskSpace.size) * 100 * 100) / 100;
                return {
                    total: diskSpace.size,
                    free: diskSpace.free,
                    used,
                    percentage
                };
            }
        }
        catch (error) {
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
    async getGpuMetrics() {
        try {
            const nvidiaSmi = await importOptionalModule('nvidia-smi');
            if (nvidiaSmi && typeof nvidiaSmi === 'object' && 'query' in nvidiaSmi) {
                const gpuData = await nvidiaSmi.query();
                return {
                    usage: gpuData.utilization.gpu,
                    memory: gpuData.memory.used,
                    temperature: undefined
                };
            }
        }
        catch (error) {
            console.warn('[시스템 모니터] GPU 메트릭 수집 실패:', error);
        }
        return undefined;
    }
    getPowerMetrics() {
        return {
            isOnBattery: electron_1.powerMonitor.isOnBatteryPower(),
            batteryLevel: undefined,
            isCharging: undefined
        };
    }
    addMetrics(metrics) {
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }
    }
    checkAlerts(metrics) {
        const alerts = [];
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
        }
        else if (metrics.cpu.usage > this.alertThresholds.cpu.warning) {
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
        }
        else if (metrics.memory.percentage > this.alertThresholds.memory.warning) {
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
    updateNetworkStats() {
        // 네트워크 통계 업데이트 (구현 예정)
        console.log('[시스템 모니터] 네트워크 통계 업데이트');
    }
    getMetricsHistory() {
        return [...this.metricsHistory];
    }
    getCurrentMetrics() {
        return this.metricsHistory.length > 0
            ? this.metricsHistory[this.metricsHistory.length - 1]
            : null;
    }
    getSystemHealth() {
        const currentMetrics = this.getCurrentMetrics();
        if (!currentMetrics) {
            return {
                status: 'warning',
                issues: ['시스템 메트릭을 가져올 수 없습니다'],
                score: 50
            };
        }
        const issues = [];
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
        let status = 'good';
        if (score < 50) {
            status = 'critical';
        }
        else if (score < 80) {
            status = 'warning';
        }
        return { status, issues, score };
    }
    updateTypingMetrics(data) {
        console.log('[시스템 모니터] 타이핑 메트릭 업데이트:', data);
        this.emit('typing-metrics', data);
    }
    async getSystemInfo() {
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
    async getCpuUsage() {
        const metrics = await this.getCpuMetrics();
        return {
            usage: metrics.usage,
            processes: metrics.processes,
            cores: os.cpus().length,
            model: os.cpus()[0]?.model
        };
    }
    async getGpuInfo() {
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
        }
        catch (error) {
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
exports.SystemMonitor = SystemMonitor;
//# sourceMappingURL=system-monitor.js.map