/**
 * Data collection and logging system
 * Continuous data collection according to COPILOT_GUIDE.md rules
 */

import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  type: 'system' | 'keyboard' | 'memory' | 'gpu' | 'error' | 'performance';
  message: string;
  data?: Record<string, unknown>;
  source: string;
}

export class DataCollector {
  private logPath: string;
  private sessionId: string;

  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    console.log('[DataCollector] Session ID generated:', this.sessionId);
    this.logPath = path.join(process.cwd(), 'thinking', 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  public log(type: LogEntry['type'], message: string, data?: Record<string, unknown>, source: string = 'main'): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      source
    };

    // Save to daily log file
    const dateStr = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logPath, `data-collection-${dateStr}.jsonl`);
    
    try {
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Log save failed:', error);
    }
  }

  public logSystemInfo(info: Record<string, unknown>): void {
    this.log('system', 'System information collected', info, 'system-monitor');
  }

  public logKeyboardEvent(event: Record<string, unknown>): void {
    this.log('keyboard', 'Keyboard event detected', event, 'keyboard-manager');
  }

  public logMemoryUsage(usage: Record<string, unknown>): void {
    this.log('memory', 'Memory usage collected', usage, 'memory-manager');
  }

  public logGpuInfo(info: Record<string, unknown>): void {
    this.log('gpu', 'GPU information collected', info, 'gpu-utils');
  }

  public logError(error: Error, context?: string): void {
    this.log('error', 'Error occurred', {
      message: error.message,
      stack: error.stack,
      context
    }, 'error-handler');
  }

  public logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.log('performance', 'Performance metric collected', {
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
      
      console.log(`Daily report generated successfully: ${reportFile}`);
    } catch (error) {
      console.error('Daily report generation failed:', error);
    }
  }
}

// Global data collector instance
export const dataCollector = new DataCollector();
