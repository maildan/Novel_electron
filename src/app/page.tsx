'use client';

import { useState, useEffect } from 'react';
import { TypingBox } from './components/ui/typing-box';
import { StatsChart } from './components/ui/stats-chart';
import MemoryMonitor from './components/ui/memory-monitor';
import { TypingAnalyzer } from './components/ui/typing-analyzer';
import NativeModuleStatus from './components/ui/native-module-status';
import { Settings } from './components/ui/settings';
import ActivityMonitor from './components/ui/activity-monitor';
import initStyles from './utils/init-styles';
import { AppHeader } from './components/layout';
import ClientIcon from './components/ui/client-icon';
import { MonitoringButton } from './components/ui/monitoring-button';
import { Zap, Target, TrendingUp, Clock, Award, BarChart3 } from 'lucide-react';

interface Log {
  id?: string;
  content: string;
  keyCount: number;
  typingTime: number;
  timestamp: string;
  totalChars?: number;
}

type ActiveTab = 'home' | 'stats' | 'analysis' | 'settings';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 로그 데이터 로드 및 CSS 설정
  useEffect(() => {
    loadLogs();
    
    // CSS 스타일 강제 적용
    initStyles();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/getLogs');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('로그 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypingComplete = async (record: Omit<Log, 'id'>) => {
    try {
      const response = await fetch('/api/logs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          totalChars: record.content.length
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 로그 목록에 새 기록 추가
        setLogs(prev => [result.data, ...prev]);
      }
    } catch (error) {
      console.error('로그 저장 오류:', error);
    }
  };

  const navItems = [
    { id: 'home' as ActiveTab, label: '홈' },
    { id: 'stats' as ActiveTab, label: '통계' },
    { id: 'analysis' as ActiveTab, label: '분석' },
    { id: 'settings' as ActiveTab, label: '설정' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 md:p-12">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5"></div>
              <div className="relative z-10 flex justify-between items-center">
                {/* 왼쪽 - 빈 공간 또는 다른 컨텐츠 */}
                <div className="flex-1">
                  {/* 필요시 다른 컨텐츠 추가 */}
                </div>
                
                {/* 오른쪽 - 모니터링 버튼 */}
                <div className="flex-shrink-0">
                  <MonitoringButton />
                </div>
              </div>
            </div>
            
            {/* Typing Practice Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <TypingBox onComplete={handleTypingComplete} />
            </div>
            
            {/* Recent Records */}
            {logs.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">최근 기록</h2>
                  <button 
                    onClick={() => setActiveTab('stats')}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="space-y-3">
                  {logs.slice(0, 5).map((log, index) => (
                    <div key={log.id || index} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                          {log.content.substring(0, 50)}...
                        </p>
                        <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>타자: {log.keyCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>시간: {log.typingTime}초</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>타수: {log.typingTime > 0 ? Math.round((log.keyCount / log.typingTime) * 60) : 0}타/분</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for New Users */}
            {logs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  타이핑을 시작해보세요!
                </h3>
              </div>
            )}
          </div>
        );

      case 'stats':
        return <StatsChart logs={logs} />;

      case 'analysis':
        return <TypingAnalyzer />;

      case 'settings':
        console.log('Setting tab activated'); // 디버깅용
        return <Settings />;

      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* 새로운 AppHeader 사용 */}
      <AppHeader 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
        isRefreshing={loading}
        onRefresh={loadLogs}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}
