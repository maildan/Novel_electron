'use client';

import React, { ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 클라이언트 컴포넌트 내부에서 발생하는 오류를 잡아 처리합니다.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태 업데이트
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 오류 정보 로깅
    console.error('컴포넌트 오류 발생:', error, errorInfo);
    
    // errorInfo를 상태에 저장
    this.setState({
      errorInfo
    });
    
    // 에러 정보 전달
    if (typeof window !== 'undefined' && (window as { electronAPI?: unknown }).electronAPI) {
      try {
        console.log('Electron API로 에러 정보 전송:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      } catch (e) {
        console.warn('Electron API 에러 전송 실패:', e);
      }
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // 사용자 정의 폴백 UI가 있다면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    오류가 발생했습니다
                  </h3>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  애플리케이션에서 예상치 못한 오류가 발생했습니다. 
                  문제가 지속되면 애플리케이션을 다시 시작해주세요.
                </p>
              </div>

              {this.state.error && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  새로고침
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                    개발자 정보 (클릭하여 펼치기)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">
                    {this.state.error?.stack}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
