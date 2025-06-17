import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/error-utils';

// Export 모드 호환성을 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, keyCount, typingTime, timestamp, accuracy, wpm } = body;

    // 필수 필드 검증
    if (!content || keyCount === undefined || typingTime === undefined) {
      return NextResponse.json(
        createErrorResponse('필수 필드가 누락되었습니다. content, keyCount, typingTime이 필요합니다.', 'MISSING_FIELDS'),
        { status: 400 }
      );
    }

    const logTimestamp = timestamp ? new Date(timestamp) : new Date();
    const logDate = logTimestamp.toISOString().split('T')[0]; // YYYY-MM-DD 형식

    // 타이핑 로그 저장
    const log = await prisma.typingLog.create({
      data: {
        content: String(content),
        keyCount: Number(keyCount),
        typingTime: Number(typingTime),
        timestamp: logTimestamp,
        date: logDate,
        accuracy: accuracy ? Number(accuracy) : 0,
        wpm: wpm ? Number(wpm) : null,
        totalChars: content.length
      }
    });

    // 통계 업데이트 (간단한 집계)
    const stats = {
      totalChars: content.length,
      words: content.trim().split(/\s+/).filter((word: string) => word.length > 0).length,
      wpm: typingTime > 0 ? Math.round((keyCount / typingTime) * 60) : 0,
      accuracy: 100 // 기본값, 실제 구현에서는 더 정교한 계산 필요
    };

    return NextResponse.json(createSuccessResponse({
      ...log,
      stats
    }));

  } catch (error) {
    console.error('로그 저장 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '로그 저장에 실패했습니다',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await prisma.typingLog.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,        select: {
          id: true,
          content: true,
          keyCount: true,
          typingTime: true,
          timestamp: true
        }
    });

    // 각 로그에 대한 통계 계산
    const logsWithStats = logs.map(log => ({
      ...log,
      stats: {
        totalChars: log.content?.length || 0,
        words: log.content?.trim().split(/\s+/).filter((word: string) => word.length > 0).length || 0,
        wpm: log.typingTime > 0 ? Math.round((log.keyCount / log.typingTime) * 60) : 0,
        accuracy: 100
      }
    }));

    const total = await prisma.typingLog.count();

    return NextResponse.json(createSuccessResponse({
      logs: logsWithStats,
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
