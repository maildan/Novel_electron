import { NextRequest, NextResponse } from 'next/server';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

export const runtime = 'nodejs';

/**
 * GPU 설정 조회
 */
export async function GET() {
  try {
    const gpuSettings = {
      acceleration: {
        enabled: process.env.HARDWARE_ACCELERATION === 'true',
        hardwareAcceleration: process.env.HARDWARE_ACCELERATION === 'true',
        webglEnabled: process.env.WEBGL_ENABLED !== 'false'
      },
      performance: {
        powerPreference: process.env.GPU_POWER_PREFERENCE || 'default',
        vsync: process.env.GPU_VSYNC === 'true',
        antialiasing: process.env.GPU_ANTIALIASING === 'true'
      },
      memory: {
        dedicated: parseInt(process.env.GPU_DEDICATED_MEMORY || '2048'),
        shared: parseInt(process.env.GPU_SHARED_MEMORY || '1024'),
        usage: 512
      },
      driver: {
        version: '1.0.0',
        vendor: 'Generic GPU',
        renderer: 'Generic Renderer'
      },
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: gpuSettings
    });
  } catch (error) {
    console.error('GPU 설정 조회 오류:', error);
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
 * GPU 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // 설정 유효성 검증
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid settings object' 
        },
        { status: 400 }
      );
    }

    console.log('GPU 설정 업데이트:', settings);
    
    // 설정 저장 로직
    const updatedSettings = {
      ...settings,
      lastUpdated: Date.now(),
      applied: true
    };
    
    return NextResponse.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('GPU 설정 업데이트 오류:', error);
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
 * GPU 설정 초기화
 */
export async function DELETE() {
  try {
    // 기본 설정으로 초기화
    const defaultSettings = {
      acceleration: {
        enabled: true,
        hardwareAcceleration: true,
        webglEnabled: true
      },
      performance: {
        powerPreference: 'default',
        vsync: true,
        antialiasing: false
      },
      resetTimestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings,
      message: 'GPU settings reset to default'
    });
  } catch (error) {
    console.error('GPU 설정 초기화 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
