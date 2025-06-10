'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface MemoryInfo {
  used: number;
  total: number;
  free: number;
  usage_percentage: number;
}

interface GpuInfo {
  available: boolean;
  name?: string;
  memory?: {
    used: number;
    total: number;
  };
}

export default function NativeModuleTestPanel({ className }: { className?: string }) {
  // 상태 관리
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [loading, setLoading] = useState({
    memory: false,
    gpu: false,
    optimize: false,
  });
  const [error, setError] = useState<string | null>(null);

  // 로딩 상태 설정 헬퍼 함수
  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  // 메모리 정보 가져오기
  const fetchMemoryInfo = useCallback(async () => {
    try {
      setLoadingState('memory', true);
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.memory) {
        const response = await window.electronAPI.memory.getInfo();
        if (response) {
          setMemoryInfo(response);
        } else {
          setError('메모리 정보를 가져올 수 없습니다');
        }
      }
    } catch (err) {
      console.error('메모리 정보 가져오기 오류:', err);
      setError(
        err instanceof Error ? err.message : '메모리 정보를 가져오는 중 오류가 발생했습니다'
      );
    } finally {
      setLoadingState('memory', false);
    }
  }, [setLoadingState]);

  // GPU 정보 가져오기
  const fetchGpuInfo = useCallback(async () => {
    try {
      setLoadingState('gpu', true);
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.system && window.electronAPI.system.gpu) {
        const response = await window.electronAPI.system.gpu.getInfo();
        if (response) {
          setGpuInfo(response);
        } else {
          setError('GPU 정보를 가져올 수 없습니다');
        }
      }
    } catch (err) {
      console.error('GPU 정보 가져오기 오류:', err);
      setError(
        err instanceof Error ? err.message : 'GPU 정보를 가져오는 중 오류가 발생했습니다'
      );
    } finally {
      setLoadingState('gpu', false);
    }
  }, [setLoadingState]);

  // 메모리 최적화
  const handleOptimizeMemory = useCallback(async () => {
    try {
      setLoadingState('optimize', true);
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.memory) {
        const response = await window.electronAPI.memory.optimize();
        if (response) {
          setOptimizationResult(response);
          // 최적화 후 메모리 정보 다시 가져오기
          await fetchMemoryInfo();
        }
      }
    } catch (err) {
      console.error('메모리 최적화 오류:', err);
      setError(
        err instanceof Error ? err.message : '메모리 최적화 중 오류가 발생했습니다'
      );
    } finally {
      setLoadingState('optimize', false);
    }
  }, [setLoadingState, fetchMemoryInfo]);

  // 컴포넌트 마운트 시 정보 가져오기
  useEffect(() => {
    fetchMemoryInfo();
    fetchGpuInfo();
  }, [fetchMemoryInfo, fetchGpuInfo]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMemoryInfo();
      fetchGpuInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMemoryInfo, fetchGpuInfo]);

  // 메모리 사용량을 포맷하는 함수
  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Memory Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">메모리 정보</CardTitle>
          <button
            onClick={fetchMemoryInfo}
            disabled={loading.memory}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {loading.memory ? '로딩...' : '새로고침'}
          </button>
        </CardHeader>
        <CardContent>
          {loading.memory ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : memoryInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">사용 중</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatMemory(memoryInfo.used)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">전체</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatMemory(memoryInfo.total)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>사용률</span>
                  <span>{memoryInfo.usage_percentage?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      memoryInfo.usage_percentage > 80 ? 'bg-red-500' :
                      memoryInfo.usage_percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${memoryInfo.usage_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">메모리 정보를 사용할 수 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* GPU Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">GPU 정보</CardTitle>
          <button
            onClick={fetchGpuInfo}
            disabled={loading.gpu}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {loading.gpu ? '로딩...' : '새로고침'}
          </button>
        </CardHeader>
        <CardContent>
          {loading.gpu ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : gpuInfo ? (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${gpuInfo.available ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-sm text-gray-600">상태</div>
                <div className={`text-lg font-bold ${gpuInfo.available ? 'text-green-600' : 'text-red-600'}`}>
                  {gpuInfo.available ? '사용 가능' : '사용 불가'}
                </div>
              </div>
              
              {gpuInfo.name && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">GPU 이름</div>
                  <div className="text-lg font-bold text-blue-600">{gpuInfo.name}</div>
                </div>
              )}
              
              {gpuInfo.memory && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">사용 중</div>
                    <div className="text-lg font-bold text-purple-600">
                      {formatMemory(gpuInfo.memory.used)}
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">전체</div>
                    <div className="text-lg font-bold text-indigo-600">
                      {formatMemory(gpuInfo.memory.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">GPU 정보를 사용할 수 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Memory Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">메모리 최적화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button
              onClick={handleOptimizeMemory}
              disabled={loading.optimize}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.optimize ? '최적화 중...' : '메모리 최적화 실행'}
            </button>
            
            {optimizationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">최적화 완료</h4>
                <p className="text-green-700 text-sm">
                  메모리 최적화가 성공적으로 완료되었습니다.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
