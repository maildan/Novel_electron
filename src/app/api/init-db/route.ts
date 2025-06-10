import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, createSuccessResponse } from '../../../lib/error-utils';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

const prisma = new PrismaClient();

export async function POST() {
  try {
    // 기존 데이터 확인
    const existingLogs = await prisma.typingLog.count();
    
    if (existingLogs > 0) {
      return NextResponse.json(createSuccessResponse({
        message: '데이터베이스가 이미 초기화되어 있습니다',
        existingRecords: existingLogs
      }));
    }

    // 샘플 데이터 생성
    const sampleLogs = [
      {
        content: "안녕하세요 Loop 6 테스트입니다",
        keyCount: 20,
        typingTime: 5000,
        accuracy: 95.5,
        date: "2024-01-01",
        timestamp: new Date('2024-01-01'),
        wpm: 240
      },
      {
        content: "TypeScript와 React를 사용한 개발",
        keyCount: 25,
        typingTime: 6200,
        accuracy: 92.3,
        date: "2024-01-02",
        timestamp: new Date('2024-01-02'),
        wpm: 194
      },
      {
        content: "Electron 데스크톱 애플리케이션 구축",
        keyCount: 30,
        typingTime: 7500,
        accuracy: 98.7,
        date: "2024-01-03",
        timestamp: new Date('2024-01-03'),
        wpm: 240
      }
    ];

    const createdLogs = await Promise.all(
      sampleLogs.map(log => 
        prisma.typingLog.create({
          data: log
        })
      )
    );

    return NextResponse.json(createSuccessResponse({
      message: '데이터베이스가 성공적으로 초기화되었습니다',
      createdRecords: createdLogs.length,
      sampleData: createdLogs
    }));

  } catch (error) {
    console.error('데이터베이스 초기화 중 오류:', error);
    return NextResponse.json(
      createErrorResponse('데이터베이스 초기화에 실패했습니다', error),
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await prisma.typingLog.deleteMany({});
    
    return NextResponse.json(createSuccessResponse({
      message: '모든 데이터가 삭제되었습니다',
      deletedRecords: result.count
    }));

  } catch (error) {
    console.error('데이터베이스 초기화 중 오류:', error);
    return NextResponse.json(
      createErrorResponse('데이터베이스 초기화에 실패했습니다', error),
      { status: 500 }
    );
  }
}
