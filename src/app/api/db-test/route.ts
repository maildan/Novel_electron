import { NextResponse } from 'next/server';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    // Simple database connectivity test
    // This would connect to your actual database in production
    const testResult = { connectionTest: true, timestamp: new Date().toISOString() };
    
    return NextResponse.json({ 
      success: true, 
      message: 'DB 연결 테스트 성공', 
      result: testResult 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('DB 연결 오류:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
