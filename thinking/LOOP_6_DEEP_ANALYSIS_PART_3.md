# LOOP 6 Deep Analysis - Part 3: Frontend Architecture & UI Component Analysis

## UI 컴포넌트 생태계 심층 분석 (UI Component Ecosystem Deep Analysis)

본 문서는 Loop_6의 67개 UI 컴포넌트와 React 19 + Next.js 15 기반 프론트엔드 아키텍처에 대한 극도로 세밀한 분석을 제공합니다. Tauri 마이그레이션 관점에서 컴포넌트 재사용성과 최적화 방안을 중점적으로 다룹니다.

---

## 1. UI 컴포넌트 전체 현황 (UI Component Overview)

### 1.1 컴포넌트 분류 체계 (Component Classification System)

```typescript
// 전체 67개 컴포넌트 분류
src/app/components/
├── ui/                    # 기본 UI 컴포넌트 (32개)
│   ├── primitives/        # 원시 컴포넌트 (12개)
│   │   ├── button.tsx           # 버튼 컴포넌트
│   │   ├── input.tsx            # 입력 컴포넌트  
│   │   ├── card.tsx             # 카드 컴포넌트
│   │   ├── dialog.tsx           # 다이얼로그
│   │   ├── toast.tsx            # 토스트 알림
│   │   ├── tabs.tsx             # 탭 컴포넌트
│   │   ├── select.tsx           # 선택 컴포넌트
│   │   ├── checkbox.tsx         # 체크박스
│   │   ├── radio-group.tsx      # 라디오 그룹
│   │   ├── switch.tsx           # 스위치
│   │   ├── slider.tsx           # 슬라이더
│   │   └── progress.tsx         # 진행바
│   ├── composite/         # 복합 컴포넌트 (20개)
│   │   ├── typing-analyzer.tsx  # 타이핑 분석기 (핵심)
│   │   ├── statistics-panel.tsx # 통계 패널
│   │   ├── memory-monitor.tsx   # 메모리 모니터
│   │   ├── keyboard-visualizer.tsx # 키보드 시각화
│   │   ├── chart-container.tsx  # 차트 컨테이너
│   │   ├── data-table.tsx       # 데이터 테이블
│   │   ├── file-browser.tsx     # 파일 브라우저
│   │   ├── settings-form.tsx    # 설정 폼
│   │   ├── export-wizard.tsx    # 내보내기 마법사
│   │   ├── backup-manager.tsx   # 백업 관리자
│   │   └── ...                  # 기타 복합 컴포넌트
├── layout/               # 레이아웃 컴포넌트 (8개)
│   ├── main-layout.tsx         # 메인 레이아웃
│   ├── sidebar.tsx             # 사이드바
│   ├── header.tsx              # 헤더
│   ├── footer.tsx              # 푸터
│   ├── navigation.tsx          # 네비게이션
│   ├── breadcrumb.tsx          # 브레드크럼
│   ├── toolbar.tsx             # 툴바
│   └── status-bar.tsx          # 상태바
├── pages/                # 페이지별 컴포넌트 (12개)
│   ├── dashboard/              # 대시보드 (4개)
│   ├── settings/               # 설정 (3개)
│   ├── statistics/             # 통계 (3개)
│   └── about/                  # 정보 (2개)
├── providers/            # 컨텍스트 프로바이더 (6개)
│   ├── theme-provider.tsx      # 테마 프로바이더
│   ├── settings-provider.tsx   # 설정 프로바이더
│   ├── keyboard-provider.tsx   # 키보드 프로바이더
│   ├── memory-provider.tsx     # 메모리 프로바이더
│   ├── data-provider.tsx       # 데이터 프로바이더
│   └── error-boundary.tsx      # 에러 바운더리
└── notifications/        # 알림 시스템 (9개)
    ├── toast-provider.tsx      # 토스트 프로바이더
    ├── notification-center.tsx # 알림 센터
    ├── alert-dialog.tsx        # 경고 다이얼로그
    ├── confirm-dialog.tsx      # 확인 다이얼로그
    ├── loading-overlay.tsx     # 로딩 오버레이
    ├── error-alert.tsx         # 에러 경고
    ├── success-toast.tsx       # 성공 토스트
    ├── warning-banner.tsx      # 경고 배너
    └── info-tooltip.tsx        # 정보 툴팁
```

### 1.2 핵심 컴포넌트 상세 분석 (Core Component Deep Analysis)

#### typing-analyzer.tsx - 메인 타이핑 분석 컴포넌트
```typescript
// src/app/components/ui/typing-analyzer.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Badge } from './badge';

interface TypingStats {
  wpm: number;
  cpm: number;
  accuracy: number;
  totalKeys: number;
  correctKeys: number;
  incorrectKeys: number;
  sessionTime: number;
  activeApplication: string;
}

interface TypingAnalyzerProps {
  realTime?: boolean;
  showAdvanced?: boolean;
  onStatsChange?: (stats: TypingStats) => void;
}

export function TypingAnalyzer({ 
  realTime = true, 
  showAdvanced = false,
  onStatsChange 
}: TypingAnalyzerProps) {
  // 상태 관리 - 중복 위험 발견
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    cpm: 0,
    accuracy: 0,
    totalKeys: 0,
    correctKeys: 0,
    incorrectKeys: 0,
    sessionTime: 0,
    activeApplication: ''
  });
  
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // IPC 통신 - 성능 위험 발견
  const fetchStats = useCallback(async () => {
    try {
      // ❌ 과도한 IPC 호출 (1초마다)
      const newStats = await window.electronAPI.keyboard.getStats();
      setStats(newStats);
      onStatsChange?.(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [onStatsChange]);
  
  // 실시간 업데이트 - 메모리 누수 위험
  useEffect(() => {
    if (!realTime || !isTracking) return;
    
    const interval = setInterval(fetchStats, 1000); // ❌ 메모리 누수 가능성
    
    return () => {
      clearInterval(interval); // ✅ 정리는 제대로 됨
    };
  }, [realTime, isTracking, fetchStats]);
  
  // 추적 시작/중지
  const toggleTracking = useCallback(async () => {
    try {
      if (isTracking) {
        await window.electronAPI.keyboard.stopTracking();
      } else {
        await window.electronAPI.keyboard.startTracking();
      }
      setIsTracking(!isTracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle tracking');
    }
  }, [isTracking]);
  
  // 메모화된 계산값
  const computedMetrics = useMemo(() => ({
    wordsPerMinute: Math.round(stats.wpm),
    charactersPerMinute: Math.round(stats.cpm),
    accuracyPercentage: Math.round(stats.accuracy * 100),
    sessionDuration: Math.floor(stats.sessionTime / 1000),
    errorRate: stats.totalKeys > 0 ? 
      Math.round((stats.incorrectKeys / stats.totalKeys) * 100) : 0
  }), [stats]);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Typing Analysis</CardTitle>
        <Badge variant={isTracking ? "default" : "secondary"}>
          {isTracking ? "Tracking" : "Stopped"}
        </Badge>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {/* WPM 표시 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">WPM</span>
              <span className="text-2xl font-bold">{computedMetrics.wordsPerMinute}</span>
            </div>
            <Progress value={Math.min(computedMetrics.wordsPerMinute, 100)} />
          </div>
          
          {/* CPM 표시 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPM</span>
              <span className="text-2xl font-bold">{computedMetrics.charactersPerMinute}</span>
            </div>
            <Progress value={Math.min(computedMetrics.charactersPerMinute / 5, 100)} />
          </div>
          
          {/* 정확도 표시 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <span className="text-2xl font-bold">{computedMetrics.accuracyPercentage}%</span>
            </div>
            <Progress value={computedMetrics.accuracyPercentage} />
          </div>
          
          {/* 세션 시간 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session</span>
              <span className="text-2xl font-bold">
                {Math.floor(computedMetrics.sessionDuration / 60)}:
                {(computedMetrics.sessionDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        {/* 고급 통계 (선택적) */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Keys:</span>
                <span className="ml-2 font-medium">{stats.totalKeys}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Correct:</span>
                <span className="ml-2 font-medium text-green-600">{stats.correctKeys}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Errors:</span>
                <span className="ml-2 font-medium text-red-600">{stats.incorrectKeys}</span>
              </div>
            </div>
            
            {stats.activeApplication && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Active App:</span>
                <span className="ml-2 font-medium">{stats.activeApplication}</span>
              </div>
            )}
          </div>
        )}
        
        {/* 제어 버튼 */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={toggleTracking}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// 사용 예시
export default function TypingAnalyzerPage() {
  const [globalStats, setGlobalStats] = useState<TypingStats | null>(null);
  
  return (
    <div className="space-y-6">
      <TypingAnalyzer 
        realTime={true}
        showAdvanced={true}
        onStatsChange={setGlobalStats}
      />
      
      {/* 다른 컴포넌트들도 globalStats 사용 가능 */}
    </div>
  );
}
```

**발견된 문제점:**
1. **과도한 IPC 호출**: 1초마다 `electronAPI.keyboard.getStats()` 호출
2. **메모리 누수 가능성**: `setInterval` 정리는 되지만 여러 인스턴스시 위험
3. **상태 중복**: 여러 컴포넌트에서 유사한 typing stats 상태 관리
4. **타입 불일치**: IPC API와 컴포넌트 인터페이스 간 타입 차이

**Tauri 마이그레이션 최적화:**
```typescript
// Tauri에서 이벤트 기반으로 최적화
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';

export function TypingAnalyzerTauri({ onStatsChange }: TypingAnalyzerProps) {
  const [stats, setStats] = useState<TypingStats>();
  
  useEffect(() => {
    // ✅ 이벤트 구독으로 과도한 폴링 제거
    const unlisten = listen('keyboard:stats', (event) => {
      const newStats = event.payload as TypingStats;
      setStats(newStats);
      onStatsChange?.(newStats);
    });
    
    return () => {
      unlisten.then(fn => fn()); // ✅ 이벤트 리스너 정리
    };
  }, [onStatsChange]);
  
  const toggleTracking = useCallback(async () => {
    try {
      if (isTracking) {
        await invoke('stop_keyboard_tracking');
      } else {
        await invoke('start_keyboard_tracking');
      }
      setIsTracking(!isTracking);
    } catch (err) {
      setError(err as string);
    }
  }, [isTracking]);
  
  // 나머지 로직은 동일...
}
```

#### memory-monitor.tsx - 메모리 모니터링 컴포넌트
```typescript
// src/app/components/ui/memory-monitor.tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface MemoryData {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface MemoryMonitorProps {
  maxDataPoints?: number;
  updateInterval?: number;
  showOptimizeButton?: boolean;
}

export function MemoryMonitor({ 
  maxDataPoints = 50,
  updateInterval = 2000,
  showOptimizeButton = true 
}: MemoryMonitorProps) {
  const [memoryData, setMemoryData] = useState<MemoryData[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // 메모리 데이터 수집 - 중복 위험
  useEffect(() => {
    const collectMemoryData = async () => {
      try {
        // ❌ 또 다른 IPC 호출 패턴
        const stats = await window.electronAPI.memory.getStats();
        
        setMemoryData(prev => {
          const newData = [...prev, {
            timestamp: Date.now(),
            heapUsed: stats.heapUsed,
            heapTotal: stats.heapTotal,
            external: stats.external,
            rss: stats.rss
          }];
          
          // 데이터 포인트 제한
          return newData.slice(-maxDataPoints);
        });
      } catch (error) {
        console.error('Failed to collect memory data:', error);
      }
    };
    
    const interval = setInterval(collectMemoryData, updateInterval);
    
    // 초기 데이터 로드
    collectMemoryData();
    
    return () => clearInterval(interval);
  }, [maxDataPoints, updateInterval]);
  
  // 메모리 최적화 실행
  const optimizeMemory = async () => {
    setIsOptimizing(true);
    try {
      await window.electronAPI.memory.optimize();
      
      // 최적화 후 즉시 데이터 갱신
      setTimeout(async () => {
        const stats = await window.electronAPI.memory.getStats();
        setMemoryData(prev => [...prev, {
          timestamp: Date.now(),
          heapUsed: stats.heapUsed,
          heapTotal: stats.heapTotal,
          external: stats.external,
          rss: stats.rss
        }]);
      }, 1000);
    } catch (error) {
      console.error('Memory optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };
  
  // 메모리 사용량을 MB로 변환
  const formatMemory = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  
  const currentMemory = memoryData[memoryData.length - 1];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Memory Monitor
          {showOptimizeButton && (
            <button
              onClick={optimizeMemory}
              disabled={isOptimizing}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {currentMemory && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Heap Used</span>
              <div className="text-lg font-medium">
                {formatMemory(currentMemory.heapUsed)} MB
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">RSS</span>
              <div className="text-lg font-medium">
                {formatMemory(currentMemory.rss)} MB
              </div>
            </div>
          </div>
        )}
        
        {/* 차트 영역 - Recharts 사용 */}
        <div className="h-64">
          {memoryData.length > 0 && (
            <Line
              data={memoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {/* 차트 설정... */}
            </Line>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 1.3 UI 컴포넌트 중복 패턴 분석 (UI Component Duplication Patterns)

#### 카드 기반 레이아웃 중복 (Card Layout Duplication)
```typescript
// 중복 발견: 15개 이상 컴포넌트에서 유사한 카드 레이아웃 패턴

// Pattern 1: typing-analyzer.tsx
<Card className="w-full">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Typing Analysis</CardTitle>
    <Badge variant={isTracking ? "default" : "secondary"}>
      {isTracking ? "Tracking" : "Stopped"}
    </Badge>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
</Card>

// Pattern 2: memory-monitor.tsx (❌ 거의 동일한 구조)
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      Memory Monitor
      <button>Optimize</button>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
</Card>

// Pattern 3: statistics-panel.tsx (❌ 또 다른 유사 구조)
<Card className="h-full">
  <CardHeader className="pb-3">
    <CardTitle className="text-base font-semibold">Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
</Card>
```

**해결 방안 - 복합 컴포넌트 패턴:**
```typescript
// src/app/components/ui/monitor-card.tsx
interface MonitorCardProps {
  title: string;
  status?: 'active' | 'inactive' | 'error';
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MonitorCard({ 
  title, 
  status, 
  actions, 
  children, 
  className 
}: MonitorCardProps) {
  const statusConfig = {
    active: { variant: "default" as const, text: "Active" },
    inactive: { variant: "secondary" as const, text: "Inactive" },
    error: { variant: "destructive" as const, text: "Error" }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        
        <div className="flex items-center gap-2">
          {status && (
            <Badge variant={statusConfig[status].variant}>
              {statusConfig[status].text}
            </Badge>
          )}
          {actions}
        </div>
      </CardHeader>
      
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// 사용 예시 - 중복 제거된 컴포넌트들
export function TypingAnalyzerRefactored({ ... }: TypingAnalyzerProps) {
  return (
    <MonitorCard
      title="Typing Analysis"
      status={isTracking ? 'active' : 'inactive'}
      actions={
        <button onClick={toggleTracking}>
          {isTracking ? 'Stop' : 'Start'}
        </button>
      }
    >
      {/* 기존 내용 */}
    </MonitorCard>
  );
}

export function MemoryMonitorRefactored({ ... }: MemoryMonitorProps) {
  return (
    <MonitorCard
      title="Memory Monitor"
      actions={showOptimizeButton && (
        <button onClick={optimizeMemory} disabled={isOptimizing}>
          {isOptimizing ? 'Optimizing...' : 'Optimize'}
        </button>
      )}
    >
      {/* 기존 내용 */}
    </MonitorCard>
  );
}
```

#### 데이터 페칭 패턴 중복 (Data Fetching Pattern Duplication)
```typescript
// 중복 발견: 8개 컴포넌트에서 유사한 IPC 데이터 페칭 패턴

// Pattern A: 폴링 기반 (typing-analyzer, memory-monitor, system-info)
const [data, setData] = useState();
useEffect(() => {
  const fetchData = async () => {
    const result = await window.electronAPI.someMethod();
    setData(result);
  };
  
  const interval = setInterval(fetchData, updateInterval);
  return () => clearInterval(interval);
}, [updateInterval]);

// Pattern B: 일회성 페칭 (settings-form, backup-manager)
const [data, setData] = useState();
const [loading, setLoading] = useState(true);
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.someMethod();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// Pattern C: 이벤트 기반 (notification-center)
useEffect(() => {
  const handler = (data) => setData(data);
  window.electronAPI.someEvent.on(handler);
  return () => window.electronAPI.someEvent.off(handler);
}, []);
```

**해결 방안 - 커스텀 훅 패턴:**
```typescript
// src/app/hooks/use-electron-data.ts
interface UseElectronDataOptions<T> {
  method: () => Promise<T>;
  interval?: number;
  initialData?: T;
  dependencies?: any[];
}

export function useElectronData<T>({
  method,
  interval,
  initialData,
  dependencies = []
}: UseElectronDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await method();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [method]);
  
  useEffect(() => {
    fetchData();
    
    if (interval) {
      const timer = setInterval(fetchData, interval);
      return () => clearInterval(timer);
    }
  }, [...dependencies, interval]);
  
  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

// 이벤트 기반 데이터 훅
export function useElectronEvent<T>(eventName: string, initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  
  useEffect(() => {
    const handler = (eventData: T) => setData(eventData);
    
    // Electron API에 이벤트 리스너 등록
    window.electronAPI.on?.(eventName, handler);
    
    return () => {
      window.electronAPI.off?.(eventName, handler);
    };
  }, [eventName]);
  
  return data;
}

// 사용 예시 - 중복 제거된 컴포넌트들
export function TypingAnalyzerWithHooks() {
  const { data: stats, loading, error } = useElectronData({
    method: () => window.electronAPI.keyboard.getStats(),
    interval: realTime ? 1000 : undefined,
    dependencies: [realTime, isTracking]
  });
  
  // 컴포넌트 로직 간소화됨
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <MonitorCard title="Typing Analysis" status={isTracking ? 'active' : 'inactive'}>
      {/* stats 데이터 렌더링 */}
    </MonitorCard>
  );
}

export function MemoryMonitorWithHooks() {
  const { data: memoryStats } = useElectronData({
    method: () => window.electronAPI.memory.getStats(),
    interval: 2000
  });
  
  // 메모리 데이터 히스토리 관리
  const [history, setHistory] = useState<MemoryData[]>([]);
  
  useEffect(() => {
    if (memoryStats) {
      setHistory(prev => [...prev, memoryStats].slice(-50));
    }
  }, [memoryStats]);
  
  return (
    <MonitorCard title="Memory Monitor">
      {/* 메모리 차트 렌더링 */}
    </MonitorCard>
  );
}
```

---

## 2. 상태 관리 아키텍처 분석 (State Management Architecture)

### 2.1 Context 기반 상태 관리 (Context-Based State Management)

#### 현재 프로바이더 구조 분석
```typescript
// src/app/components/providers/keyboard-provider.tsx
interface KeyboardContextValue {
  isTracking: boolean;
  stats: TypingStats | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  resetStats: () => Promise<void>;
}

export const KeyboardContext = createContext<KeyboardContextValue | null>(null);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState<TypingStats | null>(null);
  
  // IPC 통신 - 중복 위험
  const startTracking = useCallback(async () => {
    try {
      await window.electronAPI.keyboard.startTracking(); // ❌ 다른 컴포넌트와 중복 호출
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  }, []);
  
  const stopTracking = useCallback(async () => {
    try {
      await window.electronAPI.keyboard.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }, []);
  
  // 실시간 상태 업데이트 - 메모리 누수 위험
  useEffect(() => {
    if (!isTracking) return;
    
    const interval = setInterval(async () => {
      try {
        const newStats = await window.electronAPI.keyboard.getStats(); // ❌ 또 다른 IPC 호출
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTracking]);
  
  const value = {
    isTracking,
    stats,
    startTracking,
    stopTracking,
    resetStats: async () => {
      await window.electronAPI.keyboard.resetStats();
      setStats(null);
    }
  };
  
  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

// 유사한 패턴이 6개 프로바이더에서 반복됨
```

#### 프로바이더 중복 문제 분석
```typescript
// 중복 발견: 6개 프로바이더에서 유사한 패턴

// 1. KeyboardProvider - 키보드 상태 관리
// 2. MemoryProvider - 메모리 상태 관리  
// 3. SettingsProvider - 설정 상태 관리
// 4. DataProvider - 데이터 상태 관리
// 5. ThemeProvider - 테마 상태 관리
// 6. ErrorBoundary - 에러 상태 관리

// 공통 패턴:
// - useState로 로컬 상태 관리
// - useEffect로 IPC 통신
// - useCallback으로 액션 정의
// - Context로 상태 공유

// 위험 요소:
// 1. 각 프로바이더별 별도 IPC 호출 (성능 저하)
// 2. 상태 동기화 문제 (여러 프로바이더 간 데이터 불일치)
// 3. 메모리 누수 (interval, event listener 정리 부족)
// 4. 타입 불일치 (프로바이더별 다른 인터페이스)
```

**해결 방안 - 통합 상태 관리:**
```typescript
// src/app/store/app-store.ts - Zustand 기반 통합 스토어
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AppState {
  // 키보드 상태
  keyboard: {
    isTracking: boolean;
    stats: TypingStats | null;
  };
  
  // 메모리 상태
  memory: {
    stats: MemoryStats | null;
    isOptimizing: boolean;
  };
  
  // 설정 상태
  settings: SettingsData;
  
  // 시스템 상태
  system: {
    info: SystemInfo | null;
    isMonitoring: boolean;
  };
}

interface AppActions {
  // 키보드 액션
  startKeyboardTracking: () => Promise<void>;
  stopKeyboardTracking: () => Promise<void>;
  updateKeyboardStats: (stats: TypingStats) => void;
  
  // 메모리 액션
  optimizeMemory: () => Promise<void>;
  updateMemoryStats: (stats: MemoryStats) => void;
  
  // 설정 액션
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    keyboard: { isTracking: false, stats: null },
    memory: { stats: null, isOptimizing: false },
    settings: {} as SettingsData,
    system: { info: null, isMonitoring: false },
    
    // 키보드 액션
    startKeyboardTracking: async () => {
      try {
        await window.electronAPI.keyboard.startTracking();
        set(state => ({ 
          keyboard: { ...state.keyboard, isTracking: true } 
        }));
      } catch (error) {
        console.error('Failed to start keyboard tracking:', error);
      }
    },
    
    stopKeyboardTracking: async () => {
      try {
        await window.electronAPI.keyboard.stopTracking();
        set(state => ({ 
          keyboard: { ...state.keyboard, isTracking: false } 
        }));
      } catch (error) {
        console.error('Failed to stop keyboard tracking:', error);
      }
    },
    
    updateKeyboardStats: (stats) => {
      set(state => ({ 
        keyboard: { ...state.keyboard, stats } 
      }));
    },
    
    // 메모리 액션
    optimizeMemory: async () => {
      set(state => ({ 
        memory: { ...state.memory, isOptimizing: true } 
      }));
      
      try {
        await window.electronAPI.memory.optimize();
      } catch (error) {
        console.error('Memory optimization failed:', error);
      } finally {
        set(state => ({ 
          memory: { ...state.memory, isOptimizing: false } 
        }));
      }
    },
    
    updateMemoryStats: (stats) => {
      set(state => ({ 
        memory: { ...state.memory, stats } 
      }));
    },
    
    // 설정 액션
    updateSetting: async (key, value) => {
      try {
        await window.electronAPI.settings.set(key, value);
        set(state => ({
          settings: { ...state.settings, [key]: value }
        }));
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
      }
    },
    
    loadSettings: async () => {
      try {
        const settings = await window.electronAPI.settings.getAll();
        set({ settings });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }))
);

// 실시간 데이터 동기화를 위한 이벤트 구독
export function initializeAppStore() {
  const store = useAppStore.getState();
  
  // 키보드 상태 구독
  useAppStore.subscribe(
    state => state.keyboard.isTracking,
    async (isTracking) => {
      if (isTracking) {
        // 추적 시작시 실시간 업데이트 활성화
        const interval = setInterval(async () => {
          try {
            const stats = await window.electronAPI.keyboard.getStats();
            store.updateKeyboardStats(stats);
          } catch (error) {
            console.error('Failed to fetch keyboard stats:', error);
          }
        }, 1000);
        
        // 전역 interval 관리 (메모리 누수 방지)
        (window as any).__keyboardInterval = interval;
      } else {
        // 추적 중지시 interval 정리
        if ((window as any).__keyboardInterval) {
          clearInterval((window as any).__keyboardInterval);
          delete (window as any).__keyboardInterval;
        }
      }
    }
  );
  
  // 메모리 모니터링 구독 (2초 간격)
  setInterval(async () => {
    try {
      const stats = await window.electronAPI.memory.getStats();
      store.updateMemoryStats(stats);
    } catch (error) {
      console.error('Failed to fetch memory stats:', error);
    }
  }, 2000);
}

// 컴포넌트에서의 사용
export function TypingAnalyzerWithStore() {
  const { isTracking, stats } = useAppStore(state => state.keyboard);
  const { startKeyboardTracking, stopKeyboardTracking } = useAppStore();
  
  return (
    <MonitorCard 
      title="Typing Analysis" 
      status={isTracking ? 'active' : 'inactive'}
      actions={
        <button onClick={isTracking ? stopKeyboardTracking : startKeyboardTracking}>
          {isTracking ? 'Stop' : 'Start'}
        </button>
      }
    >
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div>WPM: {Math.round(stats.wpm)}</div>
          <div>CPM: {Math.round(stats.cpm)}</div>
          <div>Accuracy: {Math.round(stats.accuracy * 100)}%</div>
        </div>
      )}
    </MonitorCard>
  );
}
```

---

## 3. 차트 및 데이터 시각화 분석 (Chart & Data Visualization Analysis)

### 3.1 Recharts 통합 패턴 (Recharts Integration Patterns)

#### 현재 차트 컴포넌트 구조
```typescript
// src/app/components/ui/chart-container.tsx
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface ChartContainerProps {
  data: any[];
  xKey: string;
  yKey: string;
  title?: string;
  height?: number;
}

export function ChartContainer({ data, xKey, yKey, title, height = 300 }: ChartContainerProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <XAxis 
            dataKey={xKey}
            tickFormatter={(value) => {
              // 시간 포맷팅 로직
              if (typeof value === 'number' && value > 1000000000) {
                return new Date(value).toLocaleTimeString();
              }
              return value;
            }}
          />
          <YAxis 
            tickFormatter={(value) => {
              // 메모리 단위 포맷팅
              if (yKey.includes('memory') || yKey.includes('Memory')) {
                return `${(value / 1024 / 1024).toFixed(1)}MB`;
              }
              return value;
            }}
          />
          <Tooltip 
            labelFormatter={(value) => {
              if (typeof value === 'number' && value > 1000000000) {
                return new Date(value).toLocaleString();
              }
              return value;
            }}
            formatter={(value: any, name: string) => {
              if (name.includes('memory') || name.includes('Memory')) {
                return [`${(value / 1024 / 1024).toFixed(1)} MB`, name];
              }
              return [value, name];
            }}
          />
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 중복 패턴: 여러 컴포넌트에서 유사한 차트 설정
```

**개선 방안 - 특화된 차트 컴포넌트:**
```typescript
// src/app/components/charts/memory-chart.tsx
interface MemoryChartProps {
  data: MemoryData[];
  height?: number;
  showOptimizationMarkers?: boolean;
}

export function MemoryChart({ data, height = 300, showOptimizationMarkers }: MemoryChartProps) {
  const formatMemory = (value: number) => `${(value / 1024 / 1024).toFixed(1)}MB`;
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis 
          dataKey="timestamp"
          tickFormatter={formatTime}
          domain={['dataMin', 'dataMax']}
        />
        <YAxis 
          tickFormatter={formatMemory}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip 
          labelFormatter={formatTime}
          formatter={(value: number, name: string) => [formatMemory(value), name]}
        />
        
        {/* 다중 라인 - 메모리 유형별 */}
        <Line 
          type="monotone" 
          dataKey="heapUsed" 
          stroke="#8884d8" 
          name="Heap Used"
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="rss" 
          stroke="#82ca9d" 
          name="RSS"
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="external" 
          stroke="#ffc658" 
          name="External"
          strokeWidth={1}
          dot={false}
        />
        
        {/* 최적화 마커 (선택적) */}
        {showOptimizationMarkers && (
          <ReferenceLine 
            x={optimizationTimestamp} 
            stroke="red" 
            strokeDasharray="5 5"
            label="Optimization"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// src/app/components/charts/typing-chart.tsx
interface TypingChartProps {
  data: TypingStatsHistory[];
  metrics: ('wpm' | 'cpm' | 'accuracy')[];
  height?: number;
}

export function TypingChart({ data, metrics, height = 300 }: TypingChartProps) {
  const metricColors = {
    wpm: '#8884d8',
    cpm: '#82ca9d', 
    accuracy: '#ffc658'
  };
  
  const metricFormatters = {
    wpm: (value: number) => `${Math.round(value)} WPM`,
    cpm: (value: number) => `${Math.round(value)} CPM`,
    accuracy: (value: number) => `${Math.round(value * 100)}%`
  };
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis 
          dataKey="timestamp"
          tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
          formatter={(value: number, name: string) => {
            const formatter = metricFormatters[name as keyof typeof metricFormatters];
            return formatter ? [formatter(value), name] : [value, name];
          }}
        />
        
        {metrics.map(metric => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={metricColors[metric]}
            strokeWidth={2}
            dot={false}
            name={metric.toUpperCase()}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Part 3 결론 (Part 3 Conclusion)

### 핵심 발견사항 (Key Findings)
1. **컴포넌트 중복 패턴**: 15개 이상 컴포넌트에서 카드 레이아웃 중복, 8개 컴포넌트에서 데이터 페칭 패턴 중복
2. **상태 관리 분산**: 6개 프로바이더에서 유사한 IPC 통신 로직 반복, 메모리 누수 위험
3. **성능 병목점**: 과도한 IPC 폴링 (1-2초 간격), 실시간 업데이트로 인한 리렌더링

### Tauri 마이그레이션 최적화 방향 (Tauri Migration Optimization)
1. **이벤트 기반 통신**: Polling → Event subscription으로 성능 개선
2. **통합 상태 관리**: Context 분산 → Zustand 중앙집중식 스토어
3. **컴포넌트 재구성**: 중복 제거 → 재사용 가능한 복합 컴포넌트

### 다음 단계 (Next Steps)
Part 4에서는 Rust 네이티브 모듈의 구조와 성능 최적화, Tauri로의 통합 전략을 다룹니다.

---

**분석 상태**: Part 3 완료 (500+ 줄)  
**다음 단계**: Part 4 - 네이티브 모듈 및 성능 최적화  
**중점 사항**: Rust 모듈의 Tauri 통합과 성능 벤치마크
