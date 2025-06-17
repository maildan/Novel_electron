/**
 * 에러 처리 유틸리티
 */

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * unknown 타입의 에러를 안전하게 처리
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '알 수 없는 오류가 발생했습니다';
}

/**
 * API 에러 응답 생성
 */
export function createErrorResponse(
  message: string,
  error: unknown,
  code?: string
): ApiError {
  return {
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined,
    code
  };
}

/**
 * API 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data
  };
}

/**
 * Promise를 안전하게 실행하고 결과 반환
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(getErrorMessage(error))];
  }
}

/**
 * 동기 함수를 안전하게 실행
 */
export function safeSync<T>(fn: () => T): [T | null, Error | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(getErrorMessage(error))];
  }
}
