'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Settings,
  Trash2,
  Check
} from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import { NotificationItem } from './types';

/**
 * 알림 드롭다운 컴포넌트
 * 웹 표준 패턴을 따라 구현된 접근성 높은 알림 센터
 */
export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen]);

  // 알림 아이콘 렌더링
  const getNotificationIcon = (type: NotificationItem['type']) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-4 h-4 text-red-500" />;
      default:
        return <Info {...iconProps} className="w-4 h-4 text-blue-500" />;
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  // 필터링된 알림 목록
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative z-50">
      {/* 알림 버튼 - 실무적인 hover 효과, 잘림 방지를 위한 여백 확보 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative p-3 mr-2
          bg-gray-100 dark:bg-gray-700 
          text-gray-600 dark:text-gray-400
          hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
          focus:outline-none focus:ring-0 hover:outline-none
          transition-all duration-200 hover:shadow-sm
          border border-transparent hover:border-red-200 dark:hover:border-red-700
          rounded-lg
        "
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개의 읽지 않은 알림)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        
        {/* 읽지 않은 알림 배지 - 완전히 보이고 접근성 높도록 조정 */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-0.5 -right-0.5 
            min-w-[20px] h-[20px] 
            bg-red-500 text-white 
            text-xs font-bold 
            rounded-full 
            flex items-center justify-center
            z-50
            border-2 border-white dark:border-gray-800
            shadow-md
            px-1
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 - 잘림 방지를 위한 z-index 증가 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute right-0 mt-2 
            w-80 max-h-96 
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700 
            rounded-lg shadow-xl
            z-[60] overflow-hidden
          "
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            right: '1rem',
            top: '4rem'
          }}
          role="menu"
          aria-labelledby="notification-menu"
        >
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                알림
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="
                  p-1 rounded-md 
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-0 hover:outline-none
                "
                aria-label="알림 패널 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 필터 및 액션 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`
                    px-3 py-1 text-sm rounded-md transition-colors
                    ${filter === 'all' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  전체 ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`
                    px-3 py-1 text-sm rounded-md transition-colors
                    ${filter === 'unread' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  읽지 않음 ({unreadCount})
                </button>
              </div>

              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="
                      p-1 rounded-md 
                      text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:outline-none focus:ring-0 hover:outline-none
                    "
                    title="모두 읽음 처리"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="
                      p-1 rounded-md 
                      text-gray-400 hover:text-red-600 dark:hover:text-red-400
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:outline-none focus:ring-0 hover:outline-none
                    "
                    title="모든 알림 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0
                    hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer
                    transition-colors duration-150
                    ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                  role="menuitem"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="
                            p-1 rounded-md 
                            text-gray-400 hover:text-red-600 dark:hover:text-red-400
                            hover:bg-gray-100 dark:hover:bg-gray-700
                            focus:outline-none focus:ring-0 hover:outline-none
                          "
                          title="알림 삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // 여기에 설정 페이지로 이동하는 로직 추가
                }}
                className="
                  w-full px-3 py-2 text-sm
                  text-blue-600 dark:text-blue-400
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  rounded-md transition-colors
                  flex items-center justify-center
                "
              >
                <Settings className="w-4 h-4 mr-2" />
                알림 설정
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
