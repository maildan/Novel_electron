'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { BarChart3, Clock, FileText, Calendar, Activity } from 'lucide-react';

interface Log {
  timestamp: string;
  keyCount: number;
  typingTime: number;
  totalChars?: number;
}

interface StatsChartProps {
  logs: Log[];
}

export function StatsChart({ logs }: StatsChartProps) {
  const [chartType, setChartType] = useState<'daily' | 'hourly'>('daily');
  const [dataType, setDataType] = useState<'keyCount' | 'typingTime' | 'totalChars'>('keyCount');
  const [visualType, setVisualType] = useState<'bar' | 'line'>('bar');

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    if (chartType === 'daily') {
      // 일별 데이터 집계
      const dailyData: Record<string, { 
        date: string; 
        keyCount: number; 
        typingTime: number; 
        totalChars: number; 
        sessions: number;
        averageWPM: number;
      }> = {};
      
      logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            keyCount: 0,
            typingTime: 0,
            totalChars: 0,
            sessions: 0,
            averageWPM: 0
          };
        }
        dailyData[date].keyCount += log.keyCount || 0;
        dailyData[date].typingTime += log.typingTime || 0;
        dailyData[date].totalChars += log.totalChars || 0;
        dailyData[date].sessions += 1;
      });
      
      // Calculate average WPM for each day
      Object.values(dailyData).forEach(day => {
        day.averageWPM = day.typingTime > 0 ? Math.round((day.keyCount / day.typingTime) * 60) : 0;
      });
      
      return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // 시간별 데이터 집계
      const hourlyData: Record<string, { 
        hour: string; 
        keyCount: number; 
        typingTime: number; 
        totalChars: number; 
        sessions: number;
        averageWPM: number;
      }> = {};
      
      logs.forEach(log => {
        const date = new Date(log.timestamp);
        const hour = date.getHours();
        const hourKey = `${hour}시`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = {
            hour: hourKey,
            keyCount: 0,
            typingTime: 0,
            totalChars: 0,
            sessions: 0,
            averageWPM: 0
          };
        }
        hourlyData[hourKey].keyCount += log.keyCount || 0;
        hourlyData[hourKey].typingTime += log.typingTime || 0;
        hourlyData[hourKey].totalChars += log.totalChars || 0;
        hourlyData[hourKey].sessions += 1;
      });
      
      // Calculate average WPM for each hour
      Object.values(hourlyData).forEach(hour => {
        hour.averageWPM = hour.typingTime > 0 ? Math.round((hour.keyCount / hour.typingTime) * 60) : 0;
      });
      
      return Object.values(hourlyData).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }
  }, [logs, chartType]);

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'keyCount': return '타자수';
      case 'typingTime': return '타이핑 시간(초)';
      case 'totalChars': return '총 문자수';
      default: return '타자수';
    }
  };

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case 'keyCount': return '#3b82f6';
      case 'typingTime': return '#10b981';
      case 'totalChars': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">타이핑 통계 차트</h2>
        </div>
        
        {/* Chart Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Period Selection */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기간:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              <button 
                className={`px-3 py-1 text-sm transition-colors ${
                  chartType === 'daily' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setChartType('daily')}
              >
                일별
              </button>
              <button 
                className={`px-3 py-1 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  chartType === 'hourly' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setChartType('hourly')}
              >
                시간별
              </button>
            </div>
          </div>
          
          {/* Chart Type Selection */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">차트:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              <button 
                className={`px-3 py-1 text-sm transition-colors ${
                  visualType === 'bar' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setVisualType('bar')}
              >
                막대
              </button>
              <button 
                className={`px-3 py-1 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  visualType === 'line' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setVisualType('line')}
              >
                선형
              </button>
            </div>
          </div>
          
          {/* Data Type Selection */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">데이터:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              <button 
                className={`px-3 py-1 text-sm transition-colors ${
                  dataType === 'keyCount' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setDataType('keyCount')}
              >
                타자수
              </button>
              <button 
                className={`px-3 py-1 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  dataType === 'typingTime' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setDataType('typingTime')}
              >
                시간
              </button>
              <button 
                className={`px-3 py-1 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  dataType === 'totalChars' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setDataType('totalChars')}
              >
                문자수
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {visualType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey={chartType === 'daily' ? 'date' : 'hour'}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey={dataType}
                  name={getDataTypeLabel(dataType)}
                  fill={getDataTypeColor(dataType)}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey={chartType === 'daily' ? 'date' : 'hour'}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone"
                  dataKey={dataType}
                  name={getDataTypeLabel(dataType)}
                  stroke={getDataTypeColor(dataType)}
                  strokeWidth={2}
                  dot={{ fill: getDataTypeColor(dataType), strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">요약 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">총 타자수</span>
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {logs.reduce((sum, log) => sum + (log.keyCount || 0), 0).toLocaleString()}
            </span>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">총 시간</span>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatTime(logs.reduce((sum, log) => sum + (log.typingTime || 0), 0))}
            </span>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">총 문자수</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {logs.reduce((sum, log) => sum + (log.totalChars || 0), 0).toLocaleString()}
            </span>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">기록 수</span>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {logs.length.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 시간 형식화 함수
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}분 ${remainingSeconds}초`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}시간 ${remainingMinutes}분 ${remainingSeconds}초`;
}
