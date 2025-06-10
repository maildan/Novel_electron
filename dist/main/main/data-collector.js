"use strict";
/**
 * 데이터 수집 및 로깅 시스템
 * COPILOT_GUIDE.md 규칙에 따른 지속적 데이터 수집
 */
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
exports.dataCollector = exports.DataCollector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataCollector {
    constructor() {
        this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
        this.logPath = path.join(process.cwd(), 'thinking', 'logs');
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }
    log(type, message, data, source = 'main') {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data,
            source
        };
        // 일별 로그 파일에 저장
        const dateStr = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logPath, `data-collection-${dateStr}.jsonl`);
        try {
            fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        }
        catch (error) {
            console.error('로그 저장 실패:', error);
        }
    }
    logSystemInfo(info) {
        this.log('system', '시스템 정보 수집', info, 'system-monitor');
    }
    logKeyboardEvent(event) {
        this.log('keyboard', '키보드 이벤트 감지', event, 'keyboard-manager');
    }
    logMemoryUsage(usage) {
        this.log('memory', '메모리 사용량 수집', usage, 'memory-manager');
    }
    logGpuInfo(info) {
        this.log('gpu', 'GPU 정보 수집', info, 'gpu-utils');
    }
    logError(error, context) {
        this.log('error', '오류 발생', {
            message: error.message,
            stack: error.stack,
            context
        }, 'error-handler');
    }
    logPerformance(metric, value, unit = 'ms') {
        this.log('performance', '성능 지표 수집', {
            metric,
            value,
            unit
        }, 'performance-monitor');
    }
    generateDailyReport() {
        const dateStr = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logPath, `data-collection-${dateStr}.jsonl`);
        if (!fs.existsSync(logFile)) {
            return;
        }
        try {
            const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(line => line.trim());
            const entries = lines.map(line => JSON.parse(line));
            const report = {
                date: dateStr,
                totalEntries: entries.length,
                typeBreakdown: entries.reduce((acc, entry) => {
                    acc[entry.type] = (acc[entry.type] || 0) + 1;
                    return acc;
                }, {}),
                sourceBreakdown: entries.reduce((acc, entry) => {
                    acc[entry.source] = (acc[entry.source] || 0) + 1;
                    return acc;
                }, {}),
                errors: entries.filter(e => e.type === 'error').length,
                generatedAt: new Date().toISOString()
            };
            const reportFile = path.join(this.logPath, `daily-report-${dateStr}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            console.log(`일일 보고서 생성 완료: ${reportFile}`);
        }
        catch (error) {
            console.error('일일 보고서 생성 실패:', error);
        }
    }
}
exports.DataCollector = DataCollector;
// 전역 데이터 수집기 인스턴스
exports.dataCollector = new DataCollector();
//# sourceMappingURL=data-collector.js.map