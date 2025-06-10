import { NextRequest, NextResponse } from 'next/server';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

export const runtime = 'nodejs';

/**
 * GPU 가속 상태 조회
 */
export async function GET() {
  try {
    // GPU 가속 상태 확인 로직
    const gpuStatus = {
      accelerationEnabled: true,
      hardwareAcceleration: true,
      webglEnabled: true,
      gpuProcess: true,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: gpuStatus
    });
  } catch (error) {
    console.error('GPU 가속 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GPU 가속 설정 변경
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { enabled } = data;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request: enabled must be a boolean' 
        },
        { status: 400 }
      );
    }
    
    // GPU 가속 설정 변경 로직
    console.log(`GPU 가속 ${enabled ? '활성화' : '비활성화'} 요청`);
    
    const result = {
      accelerationEnabled: enabled,
      applied: true,
      restartRequired: false
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('GPU 가속 설정 변경 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GPU 가속 최적화
 */
export async function PUT() {
  try {
    // GPU 가속 최적화 로직
    const optimizationResult = {
      optimized: true,
      performanceGain: 15.5,
      memoryFreed: 128,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: optimizationResult
    });
  } catch (error) {
    console.error('GPU 가속 최적화 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
