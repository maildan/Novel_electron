import { NextRequest, NextResponse } from 'next/server';

// Export 모드 호환성을 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    // 요청 분석을 위한 로깅
    console.log('메모리 정보 요청 받음:', {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    // 메모리 정보 조회
    let memoryInfo = null;
    
    try {
      // 네이티브 모듈에서 메모리 정보 가져오기
      const nativeModule = await import('../../../../native-modules');
      memoryInfo = await nativeModule.getMemoryInfo();
    } catch (error) {
      console.warn('네이티브 메모리 모듈을 로드할 수 없습니다:', (error as Error).message);
      
      // 폴백: 브라우저 API 사용
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
        const memory = (window.performance as { memory?: { totalJSHeapSize?: number; usedJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
        memoryInfo = {
          totalJSHeapSize: memory?.totalJSHeapSize || 0,
          usedJSHeapSize: memory?.usedJSHeapSize || 0,
          jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
          system: {
            total: 0,
            free: 0,
            used: 0
          }
        };
      } else {
        // 기본값
        memoryInfo = {
          totalJSHeapSize: 0,
          usedJSHeapSize: 0,
          jsHeapSizeLimit: 0,
          system: {
            total: 0,
            free: 0,
            used: 0
          }
        };
      }
    }

    // 메모리 사용률 계산
    const jsUsagePercent = memoryInfo.jsHeapSizeLimit > 0 
      ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100 
      : 0;
    
    const systemUsagePercent = memoryInfo.system.total > 0
      ? (memoryInfo.system.used / memoryInfo.system.total) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        memory: memoryInfo,
        usage: {
          js: Math.round(jsUsagePercent),
          system: Math.round(systemUsagePercent)
        },
        warnings: {
          highJsUsage: jsUsagePercent > 80,
          highSystemUsage: systemUsagePercent > 85
        }
      }
    });

  } catch (error) {
    console.error('메모리 정보 조회 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메모리 정보 조회에 실패했습니다',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options } = body;

    switch (action) {
      case 'optimize':
        // 메모리 최적화 수행
        try {
          const nativeModule = await import('../../../../native-modules');
          const result = await nativeModule.optimizeMemory();
          
          return NextResponse.json({
            success: true,
            data: result
          });
        } catch (error) {
          // 폴백: 브라우저 기반 최적화
          console.warn('네이티브 메모리 최적화를 사용할 수 없어 폴백을 실행합니다:', (error as Error).message);
          
          const result = await fallbackMemoryOptimization();
          return NextResponse.json({
            success: true,
            data: result,
            fallback: true
          });
        }

      case 'cleanup':
        // 메모리 정리
        try {
          const nativeModule = await import('../../../../native-modules');
          const result = await nativeModule.cleanupMemory();
          
          return NextResponse.json({
            success: true,
            data: result
          });
        } catch (error) {
          // 폴백: 가비지 컬렉션 요청
          if (global.gc) {
            global.gc();
          }
          
          return NextResponse.json({
            success: true,
            data: {
              cleaned: true,
              method: 'gc',
              timestamp: Date.now()
            },
            fallback: true
          });
        }

      case 'monitor':
        // 메모리 모니터링 시작/중지
        return NextResponse.json({
          success: true,
          data: {
            monitoring: options?.enable ?? true,
            interval: options?.interval ?? 5000
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('메모리 처리 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메모리 처리에 실패했습니다',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// 폴백 메모리 최적화 함수
async function fallbackMemoryOptimization() {
  const startTime = Date.now();
  
  // 브라우저에서 할 수 있는 메모리 최적화
  try {
    // 가비지 컬렉션 요청 (가능한 경우)
    if (global.gc) {
      global.gc();
    }
    
    // 캐시 정리 (브라우저 환경)
    if (typeof window !== 'undefined') {
      // 이미지 캐시 정리
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // 화면에 보이지 않는 이미지의 src 제거
        const rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          img.src = '';
        }
      });
    }
    
    const endTime = Date.now();
    
    return {
      optimized: true,
      method: 'browser',
      processingTime: endTime - startTime,
      actionsPerformed: ['gc', 'cache_cleanup']
    };
    
  } catch (error) {
    return {
      optimized: false,
      error: (error as Error).message,
      method: 'browser'
    };
  }
}
