'use client';

import React from 'react';

/**
 * 실시간 시스템 모니터 컴포넌트
 * MCP 메모리를 활용한 확장된 실시간 통계
 */

export interface RealTimeStats {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  dataTransfer: string;
  networkLatency: number;
  diskUsage: number;
  taskCount: number;
  errorRate: number;
}

interface RealTimeMonitorProps {
  stats: RealTimeStats;
  className?: string;
}

export function RealTimeMonitor({ stats, className = '' }: RealTimeMonitorProps) {
  // 진행바 색상 결정
  const getProgressColor = (value: number, type: 'cpu' | 'memory' | 'disk' | 'latency') => {
    if (type === 'latency') {
      if (value < 50) return 'bg-green-500';
      if (value < 100) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    
    if (value < 50) return 'bg-green-500';
    if (value < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 수치 색상 결정
  const getValueColor = (value: number, type: 'cpu' | 'memory' | 'disk' | 'latency') => {
    if (type === 'latency') {
      if (value < 50) return 'text-green-600 dark:text-green-400';
      if (value < 100) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    }
    
    if (value < 50) return 'text-green-600 dark:text-green-400';
    if (value < 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // 모니터링 항목 정의
  const monitoringItems = [
    {
      label: 'CPU 사용률',
      value: stats.cpuUsage,
      unit: '%',
      type: 'cpu' as const,
      showProgress: true
    },
    {
      label: '메모리 사용률',
      value: stats.memoryUsage,
      unit: '%',
      type: 'memory' as const,
      showProgress: true
    },
    {
      label: '디스크 사용률',
      value: stats.diskUsage,
      unit: '%',
      type: 'disk' as const,
      showProgress: true
    },
    {
      label: '네트워크 지연시간',
      value: stats.networkLatency,
      unit: 'ms',
      type: 'latency' as const,
      showProgress: true
    }
  ];

  const infoItems = [
    {
      label: '활성 연결',
      value: stats.activeConnections.toString(),
      description: '개의 활성 연결'
    },
    {
      label: '데이터 전송',
      value: stats.dataTransfer,
      description: '실시간 전송률'
    },
    {
      label: '실행 중인 작업',
      value: stats.taskCount.toString(),
      description: '개의 활성 작업'
    },
    {
      label: '오류율',
      value: `${(stats.errorRate * 100).toFixed(2)}%`,
      description: '시스템 오류율'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        실시간 시스템 모니터
      </h2>
      
      {/* 진행바가 있는 메트릭들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {monitoringItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
              <span className={`text-sm font-bold ${getValueColor(item.value, item.type)}`}>
                {item.value.toFixed(1)}{item.unit}
              </span>
            </div>
            {item.showProgress && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(item.value, item.type)}`}
                  style={{ width: `${Math.min(item.value, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 정보성 메트릭들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {infoItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {item.description}
            </div>
          </div>
        ))}
      </div>

      {/* 시스템 상태 요약 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            시스템 상태
          </span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              stats.cpuUsage < 75 && stats.memoryUsage < 80 && stats.errorRate < 0.05
                ? 'bg-green-500' 
                : stats.cpuUsage < 90 && stats.memoryUsage < 90 && stats.errorRate < 0.1
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.cpuUsage < 75 && stats.memoryUsage < 80 && stats.errorRate < 0.05
                ? '정상' 
                : stats.cpuUsage < 90 && stats.memoryUsage < 90 && stats.errorRate < 0.1
                ? '주의'
                : '경고'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
