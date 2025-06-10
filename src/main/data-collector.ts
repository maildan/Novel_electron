/**
 * 데이터 수집 및 로깅 시스템
 * COPILOT_GUIDE.md 규칙에 따른 지속적 데이터 수집
 */

import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  type: 'system' | 'keyboard' | 'memory' | 'gpu' | 'error' | 'performance';
  message: string;
  data?: any;
  source: string;
}

export class DataCollector {
  private logPath: string;
  private sessionId: string;

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    this.logPath = path.join(process.cwd(), 'thinking', 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  public log(type: LogEntry['type'], message: string, data?: any, source: string = 'main'): void {
    const entry: LogEntry = {
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
    } catch (error) {
      console.error('로그 저장 실패:', error);
    }
  }

  public logSystemInfo(info: any): void {
    this.log('system', '시스템 정보 수집', info, 'system-monitor');
  }

  public logKeyboardEvent(event: any): void {
    this.log('keyboard', '키보드 이벤트 감지', event, 'keyboard-manager');
  }

  public logMemoryUsage(usage: any): void {
    this.log('memory', '메모리 사용량 수집', usage, 'memory-manager');
  }

  public logGpuInfo(info: any): void {
    this.log('gpu', 'GPU 정보 수집', info, 'gpu-utils');
  }

  public logError(error: Error, context?: string): void {
    this.log('error', '오류 발생', {
      message: error.message,
      stack: error.stack,
      context
    }, 'error-handler');
  }

  public logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.log('performance', '성능 지표 수집', {
      metric,
      value,
      unit
    }, 'performance-monitor');
  }

  public generateDailyReport(): void {
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
        }, {} as Record<string, number>),
        sourceBreakdown: entries.reduce((acc, entry) => {
          acc[entry.source] = (acc[entry.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        errors: entries.filter(e => e.type === 'error').length,
        generatedAt: new Date().toISOString()
      };

      const reportFile = path.join(this.logPath, `daily-report-${dateStr}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`일일 보고서 생성 완료: ${reportFile}`);
    } catch (error) {
      console.error('일일 보고서 생성 실패:', error);
    }
  }
}

// 전역 데이터 수집기 인스턴스
export const dataCollector = new DataCollector();
