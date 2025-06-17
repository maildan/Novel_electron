import { NextRequest, NextResponse } from 'next/server';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    // 요청 분석을 위한 로깅
    console.log('헬스체크 요청 받음:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      timestamp: new Date().toISOString()
    });

    // 기본 헬스체크 응답
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.NEXT_PORT || 5500,
      pid: process.pid,
      memory: process.memoryUsage(),
      version: process.version,
      requestInfo: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    };

    return NextResponse.json(healthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // 요청 분석을 위한 로깅
  console.log('헬스체크 HEAD 요청 받음:', {
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // HEAD 요청을 위한 간단한 응답
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
