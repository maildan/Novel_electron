'use client'

import React from 'react'
import { Activity, Cpu, MemoryStick, HardDrive } from 'lucide-react'

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  uptime: string
}

interface SystemMonitorProps {
  metrics?: SystemMetrics
  className?: string
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ 
  metrics,
  className = ''
}) => {
  const defaultMetrics: SystemMetrics = {
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: '0s'
  }

  const currentMetrics = metrics || defaultMetrics

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">시스템 모니터</h3>
      </div>

      <div className="space-y-4">
        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">CPU</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(currentMetrics.cpu)}`}>
              {currentMetrics.cpu.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentMetrics.cpu)}`}
              style={{ width: `${Math.min(currentMetrics.cpu, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">메모리</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(currentMetrics.memory)}`}>
              {currentMetrics.memory.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentMetrics.memory)}`}
              style={{ width: `${Math.min(currentMetrics.memory, 100)}%` }}
            />
          </div>
        </div>

        {/* Disk Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">디스크</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(currentMetrics.disk)}`}>
              {currentMetrics.disk.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentMetrics.disk)}`}
              style={{ width: `${Math.min(currentMetrics.disk, 100)}%` }}
            />
          </div>
        </div>

        {/* Uptime */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">업타임</span>
            <span className="text-sm text-gray-600">{currentMetrics.uptime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemMonitor
