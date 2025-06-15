/**
 * 모니터링 활성화/비활성화 버튼 컴포넌트
 * Loop 6 메인페이지에서 사용되는 핵심 모니터링 제어 버튼
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MonitoringState {
  isActive: boolean;
  hasPermissions: boolean;
  isChecking: boolean;
  error?: string;
}

interface KeyboardStatus {
  initialized: boolean;
  listening: boolean;
  queueSize: number;
  totalTypingCount: number;
}

export function MonitoringButton() {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    isActive: false,
    hasPermissions: false,
    isChecking: true,
  });

  const [keyboardStatus, setKeyboardStatus] = useState<KeyboardStatus | null>(null);

  /**
   * 권한 상태 확인
   */
  const checkPermissions = useCallback(async () => {
    try {
      setMonitoringState(prev => ({ ...prev, isChecking: true, error: undefined }));

      // 키보드 권한 상태 확인
      if ((window.electronAPI as any)?.getKeyboardPermissions) {
        const permissions = await (window.electronAPI as any).getKeyboardPermissions();
        
        const hasPermissions = permissions?.screenRecording === true && 
                              permissions?.accessibility === true;

        setMonitoringState(prev => ({
          ...prev,
          hasPermissions,
          isChecking: false,
          error: hasPermissions ? undefined : '키보드 모니터링 권한이 필요합니다.'
        }));
      } else {
        // 대체 권한 확인
        setMonitoringState(prev => ({
          ...prev,
          hasPermissions: true, // 기본적으로 권한이 있다고 가정
          isChecking: false
        }));
      }
    } catch (error) {
      console.error('[MonitoringButton] 권한 확인 오류:', error);
      setMonitoringState(prev => ({
        ...prev,
        hasPermissions: false,
        isChecking: false,
        error: '권한 확인 중 오류가 발생했습니다.'
      }));
    }
  }, []);

  /**
   * 키보드 상태 조회
   */
  const checkKeyboardStatus = useCallback(async () => {
    try {
      if (window.electronAPI?.invoke) {
        const result = await window.electronAPI.invoke('get-keyboard-status');
        if (result?.success && result?.status) {
          setKeyboardStatus(result.status);
          setMonitoringState(prev => ({
            ...prev,
            isActive: result.status.listening || false
          }));
        }
      }
    } catch (error) {
      console.error('[MonitoringButton] 키보드 상태 조회 오류:', error);
    }
  }, []);

  /**
   * 모니터링 시작
   */
  const startMonitoring = useCallback(async () => {
    try {
      setMonitoringState(prev => ({ ...prev, isChecking: true, error: undefined }));

      // 키보드 리스너 시작
      if (window.electronAPI?.invoke) {
        const result = await window.electronAPI.invoke('start-keyboard-listener');
        
        if (result?.success) {
          setMonitoringState(prev => ({
            ...prev,
            isActive: true,
            isChecking: false
          }));
          
          // 상태 업데이트
          await checkKeyboardStatus();
          
          console.log('[MonitoringButton] 모니터링 시작됨:', result.message);
        } else {
          throw new Error(result?.message || '모니터링 시작 실패');
        }
      } else {
        throw new Error('ElectronAPI를 사용할 수 없습니다.');
      }
    } catch (error: any) {
      console.error('[MonitoringButton] 모니터링 시작 오류:', error);
      setMonitoringState(prev => ({
        ...prev,
        isActive: false,
        isChecking: false,
        error: error.message || '모니터링 시작 중 오류가 발생했습니다.'
      }));
    }
  }, [checkKeyboardStatus]);

  /**
   * 모니터링 중지
   */
  const stopMonitoring = useCallback(async () => {
    try {
      setMonitoringState(prev => ({ ...prev, isChecking: true, error: undefined }));

      // 키보드 리스너 중지
      if (window.electronAPI?.invoke) {
        const result = await window.electronAPI.invoke('stop-keyboard-listener');
        
        if (result?.success) {
          setMonitoringState(prev => ({
            ...prev,
            isActive: false,
            isChecking: false
          }));
          
          // 상태 업데이트
          await checkKeyboardStatus();
          
          console.log('[MonitoringButton] 모니터링 중지됨:', result.message);
        } else {
          throw new Error(result?.message || '모니터링 중지 실패');
        }
      } else {
        throw new Error('ElectronAPI를 사용할 수 없습니다.');
      }
    } catch (error: any) {
      console.error('[MonitoringButton] 모니터링 중지 오류:', error);
      setMonitoringState(prev => ({
        ...prev,
        isChecking: false,
        error: error.message || '모니터링 중지 중 오류가 발생했습니다.'
      }));
    }
  }, [checkKeyboardStatus]);

  /**
   * 모니터링 토글
   */
  const toggleMonitoring = useCallback(async () => {
    if (monitoringState.isActive) {
      await stopMonitoring();
    } else {
      if (!monitoringState.hasPermissions) {
        await checkPermissions();
        return;
      }
      await startMonitoring();
    }
  }, [monitoringState.isActive, monitoringState.hasPermissions, startMonitoring, stopMonitoring, checkPermissions]);

  /**
   * 권한 설정 열기
   */
  const openPermissionsSettings = useCallback(() => {
    if ((window.electronAPI as any)?.openPermissionsSettings) {
      (window.electronAPI as any).openPermissionsSettings();
    } else {
      console.warn('[MonitoringButton] 권한 설정 API를 사용할 수 없습니다.');
    }
  }, []);

  // 컴포넌트 마운트 시 초기 상태 확인
  useEffect(() => {
    checkPermissions();
    checkKeyboardStatus();
  }, [checkPermissions, checkKeyboardStatus]);

  // 상태 업데이트 주기적 확인 (5초마다)
  useEffect(() => {
    if (monitoringState.isActive) {
      const interval = setInterval(checkKeyboardStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [monitoringState.isActive, checkKeyboardStatus]);

  const getButtonConfig = () => {
    if (monitoringState.isChecking) {
      return {
        text: '확인 중...',
        icon: Settings,
        className: 'bg-gray-500 hover:bg-gray-600 cursor-wait',
        disabled: true
      };
    }

    if (!monitoringState.hasPermissions) {
      return {
        text: '권한 설정',
        icon: AlertCircle,
        className: 'bg-orange-500 hover:bg-orange-600',
        disabled: false,
        onClick: openPermissionsSettings
      };
    }

    if (monitoringState.isActive) {
      return {
        text: '모니터링 중지',
        icon: Square,
        className: 'bg-red-500 hover:bg-red-600',
        disabled: false,
        onClick: toggleMonitoring
      };
    }

    return {
      text: '모니터링 활성화',
      icon: Play,
      className: 'bg-blue-500 hover:bg-blue-600',
      disabled: false,
      onClick: toggleMonitoring
    };
  };

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon;

  return (
    <div className="space-y-4">
      {/* 메인 모니터링 버튼 */}
      <div className="text-center">
        <button
          onClick={buttonConfig.onClick || toggleMonitoring}
          disabled={buttonConfig.disabled}
          className={`
            inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white
            transition-all duration-200 transform hover:scale-105 shadow-lg
            disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70
            ${buttonConfig.className}
          `}
        >
          <IconComponent className="h-5 w-5" />
          <span className="text-lg">{buttonConfig.text}</span>
        </button>
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center justify-center gap-4 text-sm">
        {/* 권한 상태 */}
        <div className="flex items-center gap-2">
          {monitoringState.hasPermissions ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          )}
          <span className={monitoringState.hasPermissions ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
            {monitoringState.hasPermissions ? '권한 승인됨' : '권한 필요'}
          </span>
        </div>

        {/* 키보드 상태 */}
        {keyboardStatus && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${keyboardStatus.listening ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              {keyboardStatus.listening ? '리스닝 중' : '대기 중'}
            </span>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {monitoringState.error && (
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{monitoringState.error}</p>
        </div>
      )}

      {/* 통계 정보 (모니터링 중일 때만) */}
      {monitoringState.isActive && keyboardStatus && (
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">실시간 통계</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-blue-600 dark:text-blue-400">총 타이핑:</span>
              <span className="ml-2 font-bold">{keyboardStatus.totalTypingCount || 0}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">큐 크기:</span>
              <span className="ml-2 font-bold">{keyboardStatus.queueSize || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
