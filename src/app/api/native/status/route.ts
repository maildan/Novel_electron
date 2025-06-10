import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ModuleStatus {
  available: boolean
  fallbackMode: boolean
  version: string
  features: {
    memory: boolean
    gpu: boolean
    worker: boolean
  }
  timestamp: number
  loadError?: string
}

// 네이티브 모듈 상태 조회
export async function GET() {
  try {
    // 기본 상태 정의
    const status: ModuleStatus = {
      available: false,
      fallbackMode: true,
      version: 'Unknown',
      features: {
        memory: false,
        gpu: false,
        worker: false
      },
      timestamp: Date.now()
    }
    
    // Electron 환경에서는 네이티브 모듈을 직접 확인할 수 없으므로
    // 클라이언트에서 IPC를 통해 확인하도록 안내
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: 'Use IPC channel for native module status in Electron environment'
      }
    })
    
  } catch (error) {
    console.error('네이티브 모듈 상태 확인 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      data: {
        available: false,
        fallbackMode: true,
        version: 'Error',
        features: {
          memory: false,
          gpu: false,
          worker: false
        },
        timestamp: Date.now(),
        loadError: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }, { status: 500 })
  }
}
