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
import { 
  Home, 
  BarChart3, 
  Settings as SettingsIcon, 
  Activity, 
  Database,
  Cpu,
  Monitor,
  Menu
} from 'lucide-react';
import ClientIcon from './components/ui/client-icon';

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
    { id: 'home' as ActiveTab, label: '홈', icon: Home },
    { id: 'stats' as ActiveTab, label: '통계', icon: BarChart3 },
    { id: 'analysis' as ActiveTab, label: '분석', icon: Activity },
    { id: 'settings' as ActiveTab, label: '설정', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Loop
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                실시간 타이핑 분석, GPU 가속, 메모리 최적화를 지원하는 고성능 데스크톱 애플리케이션입니다.
              </p>
            </div>
            
            <TypingBox onComplete={handleTypingComplete} />
            
            {logs.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 기록</h2>
                <div className="space-y-2">
                  {logs.slice(0, 5).map((log, index) => (
                    <div key={log.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {log.content.substring(0, 50)}...
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>타자: {log.keyCount}</span>
                          <span>시간: {log.typingTime}초</span>
                          <span>타수: {log.typingTime > 0 ? Math.round((log.keyCount / log.typingTime) * 60) : 0}타/분</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'stats':
        return <StatsChart logs={logs} />;

      case 'analysis':
        return <TypingAnalyzer />;

      case 'settings':
        return <Settings />;

      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loop 6</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">타이핑 분석 시스템</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                  activeTab === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                <ClientIcon icon={item.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation (hidden by default, can be shown when sidebarOpen is true on mobile) */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <nav className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false); // Close mobile menu after selection
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors border ${
                      activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700'
                        : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <ClientIcon icon={item.icon} className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>
    </div>
  );
}
