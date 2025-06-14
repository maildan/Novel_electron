/**
 * 알림 시스템 타입 정의
 * GitHub Copilot 규칙 준수: TypeScript 엄격 타입 정의
 */

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: 'system' | 'memory' | 'task' | 'report';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationSettings {
  enabled: boolean;
  systemNotifications: boolean;
  memoryWarnings: boolean;
  taskCompletions: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide: boolean;
  autoHideDelay: number; // in milliseconds
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  settings: NotificationSettings;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  unreadCount: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  systemNotifications: true,
  memoryWarnings: true,
  taskCompletions: true,
  weeklyReports: false,
  soundEnabled: false,
  position: 'top-right',
  autoHide: true,
  autoHideDelay: 5000
};
