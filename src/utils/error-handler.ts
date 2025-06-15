/**
 * 에러 처리 유틸리티 함수들
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 Error가 발생했습니다';
}

export function createErrorResponse(error: unknown, statusCode: number = 500) {
  return Response.json(
    {
      success: false,
      error: getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined,
    },
    { status: statusCode }
  );
}

export function createSuccessResponse<T = any>(data: T, message?: string) {
  return Response.json({
    success: true,
    data,
    message,
  });
}
