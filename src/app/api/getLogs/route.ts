import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, createSuccessResponse } from '../../../lib/error-utils';

// Export 모드 호환성을 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await prisma.typingLog.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.typingLog.count();

    return NextResponse.json(createSuccessResponse({
      logs,
      total,
      hasMore: total > offset + limit
    }));

  } catch (error) {
    console.error('로그 조회 중 오류:', error);
    return NextResponse.json(
      createErrorResponse('로그 조회에 실패했습니다', error),
      { status: 500 }
    );
  }
}
