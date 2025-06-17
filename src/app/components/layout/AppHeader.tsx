'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BarChart3, TrendingUp, Settings } from 'lucide-react';
import { NotificationDropdown } from '../notifications';

/**
 * 네비게이션 헤더 컴포넌트
 * 요구사항: 간격 넓게, 아웃라인 제거, 다크모드 토글 스타일
 */

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  // 새로고침 상태 로깅
  console.log('헤더 렌더링:', {
    activeTab,
    timestamp: new Date().toISOString()
  });
  const navigationItems: NavigationItem[] = [
    { id: 'home', label: '홈', icon: <Home className="w-4 h-4" /> },
    { id: 'stats', label: '통계', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'analysis', label: '분석', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: '설정', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full overflow-visible">
          {/* 로고 - appIcon.webp로 교체하고 홈 링크 추가 */}
          <div className="flex items-center">
            <Link 
              href="/" 
              onClick={() => onTabChange('home')}
              className="flex items-center hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
              aria-label="Loop 6 홈으로 이동"
            >
              <img 
                src="/appIcon.webp" 
                alt="Loop 6" 
                className="h-8 w-8 object-contain"
              />
            </Link>
          </div>

          {/* 우측 전체 컨테이너 - 네비게이션과 컨트롤을 완전히 오른쪽으로 */}
          <div className="flex items-center space-x-6">
            {/* 네비게이션 버튼들 - 완전히 오른쪽으로 이동 */}
            <nav className="flex items-center space-x-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 transition-all duration-200
                    focus:outline-none focus:ring-0 hover:outline-none hover:shadow-sm
                    ${activeTab === item.id
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* 컨트롤 버튼들 - 알림 버튼 배지 잘림 방지를 위한 충분한 여백과 overflow visible */}
            <div className="flex items-center pr-4 overflow-visible relative" style={{ minHeight: '64px' }}>
              {/* 알림 드롭다운 - 배지 잘림 방지를 위한 여백 추가 */}
              <div className="relative overflow-visible" style={{ padding: '16px 8px' }}>
                <NotificationDropdown />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
