// Notification Dropdown Component
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className = ''
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative p-2 rounded-lg 
          bg-gray-100 dark:bg-gray-700 
          text-gray-600 dark:text-gray-300
          hover:bg-gray-200 dark:hover:bg-gray-600 
          hover:text-gray-900 dark:hover:text-gray-100
          focus:outline-none focus:ring-0 hover:outline-none
          transition-all duration-200
        "
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 
            w-5 h-5 bg-red-500 text-white 
            rounded-full text-xs font-medium
            flex items-center justify-center
            min-w-[20px]
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute right-0 top-full mt-2 
            w-80 max-w-sm
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-600
            rounded-lg shadow-lg 
            z-50 max-h-96 overflow-hidden
          "
        >
          {/* Header */}
          <div className="
            flex items-center justify-between 
            p-4 border-b border-gray-200 dark:border-gray-600
          ">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              알림 ({unreadCount})
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="
                    text-xs text-blue-600 dark:text-blue-400 
                    hover:text-blue-800 dark:hover:text-blue-300
                    focus:outline-none focus:ring-0 hover:outline-none
                  "
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="
                  p-1 text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300
                  focus:outline-none focus:ring-0 hover:outline-none
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="
                p-6 text-center text-gray-500 dark:text-gray-400
              ">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-3 border-b border-gray-100 dark:border-gray-700 
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    cursor-pointer transition-colors
                    ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`
                          text-sm font-medium truncate
                          ${notification.read 
                            ? 'text-gray-600 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-gray-100'
                          }
                        `}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className={`
                        text-xs mt-1 line-clamp-2
                        ${notification.read 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-700 dark:text-gray-200'
                        }
                      `}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="
              p-3 border-t border-gray-200 dark:border-gray-600
              bg-gray-50 dark:bg-gray-700/50
            ">
              <button
                onClick={onClearAll}
                className="
                  w-full text-center text-xs 
                  text-red-600 dark:text-red-400 
                  hover:text-red-800 dark:hover:text-red-300
                  focus:outline-none focus:ring-0 hover:outline-none
                  py-1
                "
              >
                모든 알림 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
