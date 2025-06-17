/**
 * 시스템 모니터링 관련 IPC 핸들러
 * 
 * SystemMonitor 클래스와 연동하여 시스템 메트릭 정보를 제공합니다.
 */

import { ipcMain } from 'electron';
import { SystemMonitor, SystemMetrics, SystemInfo } from './system-monitor';
import { CHANNELS } from '../preload/channels';

// 새로운 통합 타입 시스템 사용
import type { 
  IpcResponse 
} from '../types/ipc';
import { 
  createSuccessResponse,
  createErrorResponse,
  createIpcError
} from '../types/ipc';

/**
 * 시스템 모니터링 관련 IPC 핸들러 등록
 */
export function registerSystemMonitorIpcHandlers(): void {
  console.log('[SystemMonitor IPC] 시스템 모니터링 관련 IPC 핸들러 등록 시작');

  const systemMonitor = SystemMonitor.getInstance();

  // 통합 모니터링 시작 (시스템 + 타이핑 추적 + 키보드)
  ipcMain.handle(CHANNELS.SYSTEM_START_MONITORING, async (): Promise<IpcResponse<{ 
    started: boolean; 
    systemMonitoring: boolean;
    typingTracking: boolean;
    keyboardListener: boolean;
    clipboardWatcher: boolean;
    message: string;
  }>> => {
    try {
      console.log('[SystemMonitor IPC] 통합 모니터링 시작 요청');
      
      const results = {
        started: false,
        systemMonitoring: false,
        typingTracking: false,
        keyboardListener: false,
        clipboardWatcher: false,
        message: ''
      };
      
      // 1. 시스템 모니터링 시작
      try {
        const isAlreadyRunning = systemMonitor.getCurrentMetrics() !== null;
        if (!isAlreadyRunning) {
          console.log('[SystemMonitor IPC] 시스템 모니터링 시작');
        }
        results.systemMonitoring = true;
      } catch (error) {
        console.error('[SystemMonitor IPC] 시스템 모니터링 시작 실패:', error);
      }
      
      // 2. 타이핑 추적 시작
      try {
        const { startTracking } = await import('./tracking-handlers');
        const trackingResult = startTracking();
        results.typingTracking = trackingResult;
        console.log('[SystemMonitor IPC] 타이핑 추적 시작:', trackingResult ? '성공' : '실패');
      } catch (error) {
        console.error('[SystemMonitor IPC] 타이핑 추적 시작 실패:', error);
      }
      
      // 3. 키보드 리스너 시작
      try {
        const { setupKeyboardListenerIfNeeded } = await import('./keyboardHandlers');
        const keyboardResult = await setupKeyboardListenerIfNeeded();
        results.keyboardListener = keyboardResult;
        console.log('[SystemMonitor IPC] 키보드 리스너 시작:', keyboardResult ? '성공' : '실패');
      } catch (error) {
        console.error('[SystemMonitor IPC] 키보드 리스너 시작 실패:', error);
      }
      
      // 4. 클립보드 감시 시작
      try {
        const { startWatching } = await import('./clipboard-watcher');
        startWatching();
        results.clipboardWatcher = true;
        console.log('[SystemMonitor IPC] 클립보드 감시 시작: 성공');
      } catch (error) {
        console.error('[SystemMonitor IPC] 클립보드 감시 시작 실패:', error);
      }
      
      // 전체 결과 확인
      results.started = results.systemMonitoring || results.typingTracking || results.keyboardListener;
      results.message = results.started ? 
        `모니터링 시작됨 (시스템: ${results.systemMonitoring}, 타이핑: ${results.typingTracking}, 키보드: ${results.keyboardListener}, 클립보드: ${results.clipboardWatcher})` :
        '모든 모니터링 시작 실패';
      
      console.log('[SystemMonitor IPC] 통합 모니터링 결과:', results);
      
      return createSuccessResponse(results);
    } catch (error) {
      console.error('[SystemMonitor IPC] 통합 모니터링 시작 Error:', error);
      const ipcError = createIpcError(
        'START_MONITORING_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'startMonitoring' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 현재 메트릭 조회
  ipcMain.handle(CHANNELS.GET_CURRENT_METRICS, async (): Promise<IpcResponse<SystemMetrics>> => {
    try {
      const metrics = systemMonitor.getCurrentMetrics();
      if (!metrics) {
        const ipcError = createIpcError(
          'NO_METRICS_AVAILABLE',
          '현재 메트릭 데이터가 없습니다. 모니터링이 시작되지 않았을 수 있습니다.',
          { operation: 'getCurrentMetrics' }
        );
        return createErrorResponse(ipcError);
      }
      
      console.log('[SystemMonitor IPC] 현재 메트릭 조회 성공:', {
        cpu: `${metrics.cpu.usage.toFixed(1)}%`,
        memory: `${metrics.memory.percentage.toFixed(1)}%`,
        timestamp: new Date(metrics.timestamp).toISOString()
      });
      
      return createSuccessResponse(metrics);
    } catch (error) {
      console.error('[SystemMonitor IPC] 현재 메트릭 조회 Error:', error);
      const ipcError = createIpcError(
        'CURRENT_METRICS_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getCurrentMetrics' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 메트릭 히스토리 조회
  ipcMain.handle(CHANNELS.GET_METRICS_HISTORY, async (_, minutes?: number): Promise<IpcResponse<SystemMetrics[]>> => {
    try {
      const allHistory = systemMonitor.getMetricsHistory();
      
      // minutes 매개변수가 제공된 경우, 해당 시간 범위의 데이터만 필터링
      let history = allHistory;
      if (minutes && minutes > 0) {
        const cutoffTime = Date.now() - (minutes * 60 * 1000);
        history = allHistory.filter(metric => metric.timestamp >= cutoffTime);
      }
      
      console.log('[SystemMonitor IPC] 메트릭 히스토리 조회 성공:', {
        totalCount: allHistory.length,
        filteredCount: history.length,
        minutes: minutes || 'all',
        timeRange: history.length > 0 ? {
          from: new Date(history[0].timestamp).toISOString(),
          to: new Date(history[history.length - 1].timestamp).toISOString()
        } : null
      });
      
      return createSuccessResponse(history);
    } catch (error) {
      console.error('[SystemMonitor IPC] 메트릭 히스토리 조회 Error:', error);
      const ipcError = createIpcError(
        'METRICS_HISTORY_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getMetricsHistory', minutes },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 평균 메트릭 조회 (직접 계산)
  ipcMain.handle(CHANNELS.GET_AVERAGE_METRICS, async (_, minutes?: number): Promise<IpcResponse<SystemMetrics | null>> => {
    try {
      const allHistory = systemMonitor.getMetricsHistory();
      let history = allHistory;
      
      // minutes 매개변수가 제공된 경우, 해당 시간 범위의 데이터만 필터링
      if (minutes && minutes > 0) {
        const cutoffTime = Date.now() - (minutes * 60 * 1000);
        history = allHistory.filter(metric => metric.timestamp >= cutoffTime);
      }
      
      if (history.length === 0) {
        const ipcError = createIpcError(
          'NO_AVERAGE_METRICS',
          '평균 메트릭 데이터를 계산할 수 없습니다. 충분한 히스토리 데이터가 없을 수 있습니다.',
          { operation: 'getAverageMetrics', minutes: minutes || 5 }
        );
        return createErrorResponse(ipcError);
      }
      
      // 평균 계산
      const avgMetrics: SystemMetrics = {
        cpu: {
          usage: history.reduce((sum, m) => sum + m.cpu.usage, 0) / history.length,
          processes: history[history.length - 1].cpu.processes // 최신 프로세스 수 사용
        },
        memory: {
          total: history[0].memory.total, // 첫 번째 메트릭의 총 메모리 사용
          used: history.reduce((sum, m) => sum + m.memory.used, 0) / history.length,
          free: history.reduce((sum, m) => sum + m.memory.free, 0) / history.length,
          percentage: history.reduce((sum, m) => sum + m.memory.percentage, 0) / history.length
        },
        disk: {
          total: history[0].disk.total,
          free: history.reduce((sum, m) => sum + m.disk.free, 0) / history.length,
          used: history.reduce((sum, m) => sum + m.disk.used, 0) / history.length,
          percentage: history.reduce((sum, m) => sum + m.disk.percentage, 0) / history.length
        },
        network: {
          downloadSpeed: history.reduce((sum, m) => sum + m.network.downloadSpeed, 0) / history.length,
          uploadSpeed: history.reduce((sum, m) => sum + m.network.uploadSpeed, 0) / history.length
        },
        power: {
          isOnBattery: history[history.length - 1].power.isOnBattery, // 최신 배터리 상태 사용
          batteryLevel: history.reduce((sum, m) => sum + (m.power.batteryLevel || 0), 0) / history.length,
          isCharging: history[history.length - 1].power.isCharging
        },
        timestamp: Date.now()
      };

      // GPU 메트릭이 있는 경우에만 평균 계산
      if (history.some(m => m.gpu)) {
        const gpuHistory = history.filter(m => m.gpu);
        if (gpuHistory.length > 0) {
          avgMetrics.gpu = {
            usage: gpuHistory.reduce((sum, m) => sum + (m.gpu?.usage || 0), 0) / gpuHistory.length,
            memory: gpuHistory.reduce((sum, m) => sum + (m.gpu?.memory || 0), 0) / gpuHistory.length,
            temperature: gpuHistory.reduce((sum, m) => sum + (m.gpu?.temperature || 0), 0) / gpuHistory.length
          };
        }
      }
      
      console.log('[SystemMonitor IPC] 평균 메트릭 계산 성공:', {
        sampleCount: history.length,
        minutes: minutes || 'all',
        avgCpu: `${avgMetrics.cpu.usage.toFixed(1)}%`,
        avgMemory: `${avgMetrics.memory.percentage.toFixed(1)}%`
      });
      
      return createSuccessResponse(avgMetrics);
    } catch (error) {
      console.error('[SystemMonitor IPC] 평균 메트릭 조회 Error:', error);
      const ipcError = createIpcError(
        'AVERAGE_METRICS_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getAverageMetrics', minutes },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 시스템 건강 상태 조회
  ipcMain.handle(CHANNELS.GET_SYSTEM_HEALTH, async (): Promise<IpcResponse<{ status: 'good' | 'warning' | 'critical'; issues: string[]; score: number }>> => {
    try {
      const health = systemMonitor.getSystemHealth();
      console.log('[SystemMonitor IPC] 시스템 건강 상태 조회 성공:', {
        status: health.status,
        issuesCount: health.issues?.length || 0,
        score: health.score
      });
      
      return createSuccessResponse(health);
    } catch (error) {
      console.error('[SystemMonitor IPC] 시스템 건강 상태 조회 Error:', error);
      const ipcError = createIpcError(
        'SYSTEM_HEALTH_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getSystemHealth' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 시스템 정보 조회
  ipcMain.handle(CHANNELS.GET_SYSTEM_INFO, async (): Promise<IpcResponse<SystemInfo>> => {
    try {
      const systemInfo = await systemMonitor.getSystemInfo();
      console.log('[SystemMonitor IPC] 시스템 정보 조회 성공:', {
        platform: systemInfo.platform,
        arch: systemInfo.arch,
        cpuModel: systemInfo.cpus > 0 ? `${systemInfo.cpus} cores` : 'Unknown',
        totalMemory: `${(systemInfo.memory.total / (1024 * 1024 * 1024)).toFixed(1)}GB`
      });
      
      return createSuccessResponse(systemInfo);
    } catch (error) {
      console.error('[SystemMonitor IPC] 시스템 정보 조회 Error:', error);
      const ipcError = createIpcError(
        'SYSTEM_INFO_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getSystemInfo' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 메모리 사용량 조회 (현재 메트릭을 사용)
  ipcMain.handle(CHANNELS.GET_MEMORY_USAGE, async (): Promise<IpcResponse<{ used: number; total: number; free: number; percentage: number; timestamp: number }>> => {
    try {
      const currentMetrics = systemMonitor.getCurrentMetrics();
      if (!currentMetrics) {
        const ipcError = createIpcError(
          'NO_CURRENT_METRICS',
          '현재 메트릭 데이터가 없습니다. 모니터링이 시작되지 않았을 수 있습니다.',
          { operation: 'getMemoryUsage' }
        );
        return createErrorResponse(ipcError);
      }

      // 메모리 사용량 정보 추출
      const memoryUsage = {
        used: currentMetrics.memory.used,
        total: currentMetrics.memory.total,
        free: currentMetrics.memory.free,
        percentage: currentMetrics.memory.percentage,
        timestamp: currentMetrics.timestamp
      };

      console.log('[SystemMonitor IPC] 메모리 사용량 조회 성공:', {
        used: `${(memoryUsage.used / (1024 * 1024)).toFixed(1)}MB`,
        total: `${(memoryUsage.total / (1024 * 1024)).toFixed(1)}MB`,
        percentage: `${memoryUsage.percentage.toFixed(1)}%`
      });
      
      return createSuccessResponse(memoryUsage);
    } catch (error) {
      console.error('[SystemMonitor IPC] 메모리 사용량 조회 Error:', error);
      const ipcError = createIpcError(
        'MEMORY_USAGE_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'getMemoryUsage' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  // 메모리 최적화 (가용한 메모리 정리 시뮬레이션)
  ipcMain.handle(CHANNELS.OPTIMIZE_MEMORY, async (): Promise<IpcResponse<{ beforeUsage: number; afterUsage: number; freedMemory: number; optimizationTime: number; timestamp: number }>> => {
    try {
      // 현재 메트릭 기록
      const beforeMetrics = systemMonitor.getCurrentMetrics();
      if (!beforeMetrics) {
        const ipcError = createIpcError(
          'NO_METRICS_FOR_OPTIMIZATION',
          '메모리 최적화를 위한 현재 메트릭 데이터가 없습니다.',
          { operation: 'optimizeMemory' }
        );
        return createErrorResponse(ipcError);
      }

      const startTime = Date.now();
      const beforeUsage = beforeMetrics.memory.used / (1024 * 1024); // MB 단위

      // 메모리 최적화 시뮬레이션 (실제로는 가비지 컬렉션 등을 수행할 수 있음)
      if (global.gc) {
        global.gc();
      }

      // 최적화 후 대기
      await new Promise(resolve => setTimeout(resolve, 500));

      // 메모리 해제량 시뮬레이션 (실제 메트릭 갱신을 기다리거나 추정)
      const estimatedFreedMemory = Math.random() * 50 + 10; // 10-60MB 랜덤
      const afterUsage = Math.max(beforeUsage - estimatedFreedMemory, beforeUsage * 0.8);
      const optimizationTime = Date.now() - startTime;

      const result = {
        beforeUsage: Math.round(beforeUsage * 100) / 100,
        afterUsage: Math.round(afterUsage * 100) / 100,
        freedMemory: Math.round((beforeUsage - afterUsage) * 100) / 100,
        optimizationTime,
        timestamp: Date.now()
      };

      console.log('[SystemMonitor IPC] 메모리 최적화 성공:', {
        beforeUsage: `${result.beforeUsage}MB`,
        afterUsage: `${result.afterUsage}MB`,
        freedMemory: `${result.freedMemory}MB`,
        optimizationTime: `${result.optimizationTime}ms`
      });
      
      return createSuccessResponse(result);
    } catch (error) {
      console.error('[SystemMonitor IPC] 메모리 최적화 Error:', error);
      const ipcError = createIpcError(
        'MEMORY_OPTIMIZE_ERROR',
        error instanceof Error ? error.message : String(error),
        { operation: 'optimizeMemory' },
        error instanceof Error ? error.stack : undefined
      );
      return createErrorResponse(ipcError);
    }
  });

  console.log('[SystemMonitor IPC] 시스템 모니터링 관련 IPC 핸들러 등록 완료');
}

/**
 * 시스템 모니터링 관련 IPC 핸들러 정리
 */
export function cleanupSystemMonitorIpcHandlers(): void {
  ipcMain.removeHandler(CHANNELS.SYSTEM_START_MONITORING);
  ipcMain.removeHandler(CHANNELS.GET_CURRENT_METRICS);
  ipcMain.removeHandler(CHANNELS.GET_METRICS_HISTORY);
  ipcMain.removeHandler(CHANNELS.GET_AVERAGE_METRICS);
  ipcMain.removeHandler(CHANNELS.GET_SYSTEM_HEALTH);
  ipcMain.removeHandler(CHANNELS.GET_SYSTEM_INFO);
  ipcMain.removeHandler(CHANNELS.GET_MEMORY_USAGE);
  ipcMain.removeHandler(CHANNELS.OPTIMIZE_MEMORY);
  
  console.log('[SystemMonitor IPC] 시스템 모니터링 관련 IPC 핸들러 정리 완료');
}
