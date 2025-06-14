'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  NotificationItem, 
  NotificationContextType, 
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS 
} from './types';

/**
 * 알림 컨텍스트 생성
 * Pub-Sub 패턴을 활용한 글로벌 알림 관리
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }

    // 기존 알림 데이터 마이그레이션 (MCP 메모리에서 확장된 샘플 데이터)
    const sampleNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'success',
        title: 'MCP 서버 연결',
        message: 'TaskManager, Supabase, MongoDB MCP 서버와 성공적으로 연결되었습니다',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        category: 'system',
        priority: 'medium'
      },
      {
        id: '2',
        type: 'info',
        title: '메모리 모니터링 활성화',
        message: '실시간 메모리 모니터링이 시작되었습니다. 현재 사용률: 62%',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        category: 'memory',
        priority: 'low'
      },
      {
        id: '3',
        type: 'warning',
        title: 'CPU 사용률 높음',
        message: 'CPU 사용률이 85%를 초과했습니다. 일부 작업을 중단하는 것을 권장합니다',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: true,
        category: 'system',
        priority: 'high'
      },
      {
        id: '4',
        type: 'success',
        title: '데이터베이스 동기화',
        message: 'Supabase 데이터베이스와 동기화가 완료되었습니다. 47개의 레코드가 업데이트되었습니다',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        category: 'system',
        priority: 'medium'
      },
      {
        id: '5',
        type: 'info',
        title: '새로운 작업 추가',
        message: 'TaskManager를 통해 5개의 새로운 작업이 추가되었습니다',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: true,
        category: 'task',
        priority: 'low'
      },
      {
        id: '6',
        type: 'error',
        title: 'MongoDB 연결 오류',
        message: 'MongoDB 서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: false,
        category: 'system',
        priority: 'urgent'
      }
    ];
    
    setNotifications(sampleNotifications);
  }, []);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // 알림 추가
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    if (!settings.enabled) return;

    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // 사운드 재생 (설정이 활성화된 경우)
    if (settings.soundEnabled) {
      // 브라우저 알림음 재생 (실제 구현에서는 커스텀 사운드 파일 사용 가능)
      try {
        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmwhBjiS1fPAeSsFJXfM7+KOTAYQW7LO').play();
      } catch (error) {
        console.log('Sound notification failed:', error);
      }
    }

    // 자동 숨김 설정
    if (settings.autoHide && notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, settings.autoHideDelay);
    }
  }, [settings]);

  // 알림 제거
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 읽음 처리
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // 모든 알림 삭제
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    settings,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    updateSettings,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// 커스텀 훅
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
