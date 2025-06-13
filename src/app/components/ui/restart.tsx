'use client';

import React, { useState } from 'react';
import { RefreshCw, Power, AlertTriangle } from 'lucide-react';

interface RestartProps {
  onRestart?: () => void;
  onClose?: () => void;
  reason?: string;
  isVisible?: boolean;
  title?: string;
  message?: string;
}

function Restart({ 
  onRestart, 
  onClose, 
  reason = "설정을 적용하려면", 
  isVisible = false,
  title = "애플리케이션 재시작 필요",
  message
}: RestartProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async () => {
    setIsRestarting(true);
    
    try {
      // Electron API를 통한 재시작
      if (window.electronAPI) {
        // IPC를 통한 재시작 요청
        const result = await window.electronAPI.invoke('restartApp', reason);
        
        if (result.success) {
          console.log('🔄 애플리케이션 재시작 중...');
          onRestart?.();
        } else {
          console.error('❌ 재시작 실패:', result.message);
          setIsRestarting(false);
        }
      } else {
        // 웹 환경에서는 페이지 새로고침
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ 재시작 처리 중 오류:', error);
      setIsRestarting(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {message || `${reason} 애플리케이션을 다시 시작해야 합니다.`}
            </p>
            
            {reason && (
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>변경 사항:</strong> {reason}
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  isRestarting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRestarting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>재시작 중...</span>
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    <span>지금 재시작</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                disabled={isRestarting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Restart;
