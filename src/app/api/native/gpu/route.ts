import { NextRequest, NextResponse } from 'next/server';

// Export 모드 호환성을 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    // GPU 정보 조회 (네이티브 모듈을 통해)
    let gpuInfo = null;
    let accelerationAvailable = false;
    
    try {
      // 네이티브 모듈에서 GPU 정보 가져오기
      const nativeModule = await import('../../../../native-modules');
      gpuInfo = await nativeModule.getGpuInfo();
      accelerationAvailable = gpuInfo && gpuInfo.supportsCompute;
    } catch (error) {
      console.warn('네이티브 GPU 모듈을 로드할 수 없습니다:', (error as Error).message);
      // 폴백: 기본 GPU 정보 (네이티브 모듈 타입에 맞춤)
      gpuInfo = {
        name: 'Unknown',
        vendor: 'Unknown',
        memoryTotal: '0 MB',
        memoryUsed: '0 MB',
        memoryAvailable: '0 MB',
        utilization: 0,
        computeCapability: 'Unknown',
        driverVersion: 'Unknown',
        isIntegrated: true,
        supportsCompute: false,
        timestamp: new Date().toISOString()
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        gpuInfo,
        accelerationAvailable,
        supportedFeatures: {
          webgl: true,
          webgl2: true,
          compute: accelerationAvailable,
          parallel: accelerationAvailable
        }
      }
    });

  } catch (error) {
    console.error('GPU 정보 조회 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'GPU 정보 조회에 실패했습니다',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'accelerate':
        // GPU 가속 실행
        try {
          const nativeModule = await import('../../../../native-modules');
          const result = await nativeModule.runGpuAcceleration(data);
          
          return NextResponse.json({
            success: true,
            data: result
          });
        } catch (error) {
          // 폴백: CPU 기반 처리
          console.warn('GPU 가속을 사용할 수 없어 CPU로 처리합니다:', (error as Error).message);
          
          const result = await fallbackCpuProcessing(data);
          return NextResponse.json({
            success: true,
            data: result,
            fallback: true
          });
        }

      case 'benchmark':
        // GPU 벤치마크 실행
        try {
          const nativeModule = await import('../../../../native-modules');
          const benchmark = await nativeModule.runGpuBenchmark();
          
          return NextResponse.json({
            success: true,
            data: benchmark
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'GPU 벤치마크를 실행할 수 없습니다',
            details: (error as Error).message
          }, { status: 500 });
        }

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('GPU 처리 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'GPU 처리에 실패했습니다',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// CPU 폴백 처리 함수
async function fallbackCpuProcessing(data: any) {
  // 간단한 CPU 기반 처리 구현
  const startTime = Date.now();
  
  // 데이터 처리 시뮬레이션
  if (data && Array.isArray(data)) {
    const result = data.map((item: any) => {
      // 간단한 계산 수행
      return {
        ...item,
        processed: true,
        timestamp: Date.now()
      };
    });
    
    const endTime = Date.now();
    
    return {
      result,
      processingTime: endTime - startTime,
      method: 'cpu',
      itemsProcessed: data.length
    };
  }
  
  return {
    result: data,
    processingTime: Date.now() - startTime,
    method: 'cpu',
    itemsProcessed: 0
  };
}
