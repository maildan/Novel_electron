'use client'

import React from 'react'
import { TrendingUp, Clock, Target, BarChart3 } from 'lucide-react'

interface TypingStats {
  wpm: number
  accuracy: number
  totalWords: number
  totalTime: number
  errorsCount: number
  streak: number
}

interface TypingStatsProps {
  stats?: TypingStats
  className?: string
}

export const TypingStatsCard: React.FC<TypingStatsProps> = ({ 
  stats,
  className = ''
}) => {
  const defaultStats: TypingStats = {
    wpm: 0,
    accuracy: 0,
    totalWords: 0,
    totalTime: 0,
    errorsCount: 0,
    streak: 0
  }

  const currentStats = stats || defaultStats

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}분 ${remainingSeconds}초`
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-500'
    if (accuracy >= 85) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getWpmColor = (wpm: number) => {
    if (wpm >= 60) return 'text-green-500'
    if (wpm >= 40) return 'text-blue-500'
    return 'text-gray-500'
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">타이핑 통계</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* WPM */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">속도</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${getWpmColor(currentStats.wpm)}`}>
              {currentStats.wpm}
            </span>
            <span className="text-sm text-gray-500">WPM</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">정확도</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${getAccuracyColor(currentStats.accuracy)}`}>
              {currentStats.accuracy.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Total Words */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">총 단어</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-purple-500">
              {currentStats.totalWords.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">개</span>
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">총 시간</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-orange-500">
              {formatTime(currentStats.totalTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">오타:</span> {currentStats.errorsCount}개
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">연속:</span> {currentStats.streak}일
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingStatsCard
