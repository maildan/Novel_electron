import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Export 모드 호환성을 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

const prisma = new PrismaClient();

// 에러 응답 생성 헬퍼 함수
function createErrorResponse(message: string, error?: unknown) {
  console.error('API 에러:', { message, error });
  return {
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? 
      (error instanceof Error ? error.message : String(error)) : undefined,
    timestamp: new Date().toISOString()
  };
}

// 성공 응답 생성 헬퍼 함수
function createSuccessResponse(data: unknown) {
  console.log('API 성공 응답:', { dataSize: JSON.stringify(data).length });
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 타입 안전한 WHERE 절 구성
    const whereClause: {
      content?: { contains: string; mode: 'insensitive' };
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    // 검색 쿼리가 있는 경우
    if (query) {
      whereClause.content = {
        contains: query,
        mode: 'insensitive'
      };
    }

    // 날짜 범위가 있는 경우
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate);
      }
    }

    const logs = await prisma.typingLog.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        content: true,
        keyCount: true,
        typingTime: true,
        timestamp: true
      }
    });

    // 총 개수도 함께 반환
    const total = await prisma.typingLog.count({
      where: whereClause
    });

    return NextResponse.json(createSuccessResponse({
      logs,
      total,
      hasMore: total > offset + limit
    }));

  } catch (error) {
    return NextResponse.json(
      createErrorResponse('로그 검색에 실패했습니다', error),
      { status: 500 }
    );
  }
}
