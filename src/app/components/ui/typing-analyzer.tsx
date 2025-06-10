'use client';

import { useState, useEffect, useCallback } from 'react';

interface TypingData {
  keyCount: number;
  typingTime: number;
  accuracy?: number;
}

interface TypingAnalysisResult {
  wpm: number;
  accuracy: number;
  performanceIndex: number;
  consistencyScore: number;
  fatigueAnalysis: {
    score: number;
    timeFactor: number;
    intensityFactor: number;
    recommendation: string;
  };
}

interface TypingAnalyzerProps {
  stats?: TypingData;
  isTracking?: boolean;
  className?: string;
}

// JavaScript로 타이핑 통계 분석 (폴백)
function analyzeTypingWithJS(data: TypingData): TypingAnalysisResult {
  const { keyCount, typingTime, accuracy = 100 } = data;
  
  // WPM 계산 (1단어 = 5타)
  const minutes = typingTime / 60000;
  const wpm = minutes > 0 ? (keyCount / 5) / minutes : 0;
  
  // 일관성 점수 (간단한 추정)
  const consistency = Math.min(100, 65 + (Math.min(keyCount, 500) / 20));
  
  // 피로도 계산
  const fatigue = {
    score: Math.min(100, (minutes * 10) + (wpm / 10)),
    timeFactor: minutes,
    intensityFactor: wpm / 100,
    recommendation: minutes > 30 
      ? '휴식이 필요합니다' 
      : minutes > 15 
        ? '짧은 휴식을 고려하세요' 
        : '좋은 상태입니다'
  };
  
  return {
    wpm: Math.max(0, wpm),
    accuracy: Math.min(100, Math.max(0, accuracy)),
    performanceIndex: Math.max(0, wpm * accuracy / 100),
    consistencyScore: consistency,
    fatigueAnalysis: fatigue
  };
}

export function TypingAnalyzer({ stats, isTracking, className }: TypingAnalyzerProps) {
  const defaultStats = {
    keyCount: 0,
    typingTime: 0,
    accuracy: 100
  };

  const safeStats = stats || defaultStats;
  const [result, setResult] = useState<TypingAnalysisResult | null>(null);
  const [useGpuAcceleration, setUseGpuAcceleration] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gpuAvailable, setGpuAvailable] = useState<boolean>(false);

  // GPU 상태 확인
  const checkGpuStatus = useCallback(async () => {
    try {
      setGpuAvailable(false); // GPU는 현재 사용 불가로 설정
    } catch (err) {
      console.warn('GPU 상태 확인 실패:', err);
      setGpuAvailable(false);
    }
  }, []);

  // GPU로 타이핑 분석 수행
  const computeWithGpu = useCallback(async (data: TypingData): Promise<TypingAnalysisResult | null> => {
    try {
      // GPU 기능은 현재 비활성화
      return null;
    } catch (err) {
      console.error('GPU 계산 실패:', err);
    }
    return null;
  }, []);

  // 타이핑 통계 분석 수행
  const analyzeTyping = useCallback(async () => {
    if (!safeStats.keyCount || !safeStats.typingTime) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (useGpuAcceleration && gpuAvailable) {
        // GPU 가속 분석
        const gpuResult = await computeWithGpu(safeStats);
        
        if (gpuResult) {
          setResult(gpuResult);
        } else {
          // GPU 실패 시 JavaScript 폴백
          const jsResult = analyzeTypingWithJS(safeStats);
          setResult(jsResult);
        }
      } else {
        // JavaScript로 분석 (폴백)
        const jsResult = analyzeTypingWithJS(safeStats);
        setResult(jsResult);
      }
    } catch (err) {
      console.error('타이핑 분석 오류:', err);
      setError('분석 중 오류가 발생했습니다.');
      
      // 오류 시 JavaScript 폴백 사용
      const jsResult = analyzeTypingWithJS(safeStats);
      setResult(jsResult);
    } finally {
      setLoading(false);
    }
  }, [safeStats, useGpuAcceleration, gpuAvailable, computeWithGpu]);

  // GPU 가속 활성화/비활성화 처리
  const handleToggleGpu = useCallback(async () => {
    const newState = !useGpuAcceleration;
    setUseGpuAcceleration(newState);
    
    if (newState && gpuAvailable) {
      try {
        // GPU 기능은 현재 비활성화
        setUseGpuAcceleration(false);
      } catch (err) {
        console.error('GPU 활성화 실패:', err);
        setUseGpuAcceleration(false);
      }
    }
  }, [useGpuAcceleration, gpuAvailable]);

  // 컴포넌트 마운트 시 GPU 상태 확인
  useEffect(() => {
    checkGpuStatus();
  }, [checkGpuStatus]);

  // 데이터 변경 시 재분석
  useEffect(() => {
    if (safeStats.keyCount > 0 && safeStats.typingTime > 0) {
      analyzeTyping();
    }
  }, [safeStats, analyzeTyping]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">타이핑 분석</h2>
        {gpuAvailable && (
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={useGpuAcceleration}
                onChange={handleToggleGpu}
                disabled={loading}
                className="rounded border-gray-300"
              />
              <span>GPU 가속</span>
            </label>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">분석 중...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {result && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">속도</div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(result.wpm)} WPM</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">정확도</div>
              <div className="text-2xl font-bold text-green-600">{result.accuracy.toFixed(1)}%</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">성능 지수</div>
              <div className="text-2xl font-bold text-purple-600">{result.performanceIndex.toFixed(1)}</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">일관성</div>
              <div className="text-2xl font-bold text-orange-600">{result.consistencyScore.toFixed(1)}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">피로도 분석</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  result.fatigueAnalysis.score < 30 ? 'bg-green-500' :
                  result.fatigueAnalysis.score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, result.fatigueAnalysis.score)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {result.fatigueAnalysis.recommendation}
            </p>
          </div>
        </div>
      )}
      
      {!result && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>타이핑을 시작하면 분석 결과가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
