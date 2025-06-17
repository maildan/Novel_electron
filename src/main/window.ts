import { BrowserWindow, screen } from 'electron'
import * as path from 'path'
import { AppConfig } from './config'
import { logger } from '../shared/logger'

export class WindowManager {
  private static instance: WindowManager
  private mainWindow: BrowserWindow | null = null

  private constructor() {}

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager()
    }
    return WindowManager.instance
  }

  async createMainWindow(): Promise<BrowserWindow> {
    try {
      logger.info('🖼️  메인 윈도우 생성 시작')

      // 디스플레이 정보 가져오기
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.workAreaSize

      // 윈도우 크기 계산 (화면의 80%)
      const windowWidth = Math.min(AppConfig.WINDOW_CONFIG.width, Math.floor(width * 0.8))
      const windowHeight = Math.min(AppConfig.WINDOW_CONFIG.height, Math.floor(height * 0.8))

      this.mainWindow = new BrowserWindow({
        ...AppConfig.WINDOW_CONFIG,
        width: windowWidth,
        height: windowHeight,
        x: Math.floor((width - windowWidth) / 2),
        y: Math.floor((height - windowHeight) / 2),
        title: AppConfig.APP_NAME,
        icon: path.join(__dirname, '../../public/app_icon.webp'),  // 앱 아이콘 Setup
        titleBarStyle: 'default',  // 기본 OS 창 스타일 사용
        frame: true,               // 기본 창 프레임 사용
        autoHideMenuBar: false,    // 메뉴바 숨기지 않음
        vibrancy: undefined,       // vibrancy 비활성화
        backgroundMaterial: undefined  // 배경 머티리얼 비활성화
      })

      // 윈도우 이벤트 리스너 Setup
      this.setupWindowEventListeners()

      // 개발 모드에서 CSP 헤더 후킹 (Turbopack 호환성)
      if (AppConfig.isDevelopment) {
        this.mainWindow.webContents.session.webRequest.onHeadersReceived(
          { urls: ['http://localhost:*/*', 'https://localhost:*/*'] },
          (details, callback) => {
            const headers = { ...details.responseHeaders }
            
            // CSP 헤더를 개발 모드용으로 완화
            headers['Content-Security-Policy'] = [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:*; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* blob:; " +
              "style-src 'self' 'unsafe-inline' http://localhost:*; " +
              "img-src 'self' data: blob: http://localhost:*; " +
              "font-src 'self' data: http://localhost:*; " +
              "connect-src 'self' ws: wss: http://localhost:* https://localhost:*; " +
              "frame-src 'self' http://localhost:*; " +
              "worker-src 'self' blob:;"
            ]
            
            logger.info('🔧 CSP 헤더 후킹 적용됨 (개발 모드)')
            callback({ responseHeaders: headers })
          }
        )
      }

      // URL 로드 전 강제 표시 (디버깅용)
      if (AppConfig.isDevelopment) {
        this.mainWindow.show()
        this.mainWindow.focus()
        logger.info('🔧 개발 모드: 윈도우 즉시 표시')
      }

      // URL 로드
      logger.info(`🌐 URL 로드 시도: ${AppConfig.nextUrl}`)
      await this.mainWindow.loadURL(AppConfig.nextUrl)
      
      // 로드 상태 모니터링 추가
      this.mainWindow.webContents.on('did-start-loading', () => {
        logger.info('🔄 페이지 로드 시작')
      })
      
      this.mainWindow.webContents.on('did-stop-loading', () => {
        logger.info('⏹️ 페이지 로드 중단')
      })
      
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        logger.error(`❌ 페이지 로드 Failed: ${errorCode} - ${errorDescription} (${validatedURL})`)
        
        // 로드 Failed 시 강제 표시
        if (this.mainWindow && !this.mainWindow.isVisible()) {
          this.mainWindow.show()
          this.mainWindow.focus()
          logger.info('🚨 로드 Failed 시 윈도우 강제 표시')
        }
      })

      // 준비 Completed 후 윈도우 표시
      this.mainWindow.once('ready-to-show', () => {
        if (this.mainWindow) {
          this.mainWindow.show()
          this.mainWindow.focus()
          
          logger.info('✅ 메인 윈도우 표시 Completed')
        }
      })

      // 윈도우 로드 Completed 후 강제 표시 및 개발자 도구 열기
      this.mainWindow.webContents.once('did-finish-load', () => {
        if (this.mainWindow && !this.mainWindow.isVisible()) {
          this.mainWindow.show()
          this.mainWindow.focus()
          logger.info('🔄 윈도우 강제 표시 (폴백)')
        }
        
        // 개발 모드에서는 DevTools를 별도 창으로 열기
        if (AppConfig.isDevelopment && this.mainWindow) {
          // 여러 번 시도하여 DevTools 확실히 열기
          setTimeout(() => {
            if (this.mainWindow) {
              this.mainWindow.webContents.openDevTools({ 
                mode: 'detach',
                activate: false  // 개발자 도구에 포커스하지 않음
              })
              logger.info('🔧 개발자 도구가 별도 창으로 열렸습니다')
            }
          }, 1000)
          
          // 즉시도 시도
          this.mainWindow.webContents.openDevTools({ 
            mode: 'detach',
            activate: false
          })
        }
      })

      // DOM 로드 Completed 이벤트 추가
      this.mainWindow.webContents.once('dom-ready', () => {
        logger.info('🌐 DOM 로드 Completed')
        if (this.mainWindow && !this.mainWindow.isVisible()) {
          this.mainWindow.show()
          this.mainWindow.focus()
          logger.info('🔄 DOM 로드 후 윈도우 표시')
        }
      })

      logger.info('🖼️  메인 윈도우 생성 Completed')
      return this.mainWindow

    } catch (error) {
      logger.error('❌ 메인 윈도우 생성 Failed:', error)
      throw error
    }
  }

  private setupWindowEventListeners(): void {
    if (!this.mainWindow) return

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
      logger.info('🔄 메인 윈도우 닫힘')
    })

    this.mainWindow.on('minimize', () => {
      logger.debug('📉 윈도우 최소화')
    })

    this.mainWindow.on('restore', () => {
      logger.debug('📈 윈도우 복원')
    })

    this.mainWindow.on('focus', () => {
      logger.debug('🎯 윈도우 포커스')
    })

    this.mainWindow.on('blur', () => {
      logger.debug('😴 윈도우 포커스 해제')
    })

    // 윈도우 크기 변경 시 저장
    this.mainWindow.on('resize', () => {
      if (this.mainWindow) {
        const [width, height] = this.mainWindow.getSize()
        logger.debug(`📏 윈도우 크기 변경: ${width}x${height}`)
        // TODO: 크기를 Setup에 저장
      }
    })

    // 외부 링크는 기본 브라우저에서 열기
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url)
      return { action: 'deny' }
    })

    // 네비게이션 제한 (보안)
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      
      if (parsedUrl.origin !== new URL(AppConfig.nextUrl).origin) {
        event.preventDefault()
        logger.warn(`🚫 외부 네비게이션 차단: ${navigationUrl}`)
      }
    })
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  isMainWindowVisible(): boolean {
    return this.mainWindow?.isVisible() ?? false
  }

  focusMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      this.mainWindow.focus()
    }
  }

  hideMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide()
    }
  }

  closeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close()
    }
  }

  /**
 * 윈도우 정보 조회
 */
  getWindowInfo(): any {
    try {
      const allWindows = BrowserWindow.getAllWindows();
      const primaryDisplay = screen.getPrimaryDisplay();
      const allDisplays = screen.getAllDisplays();
      
      return {
        mainWindow: this.mainWindow ? {
          id: this.mainWindow.id,
          title: this.mainWindow.getTitle(),
          bounds: this.mainWindow.getBounds(),
          isVisible: this.mainWindow.isVisible(),
          isMinimized: this.mainWindow.isMinimized(),
          isMaximized: this.mainWindow.isMaximized(),
          isFullScreen: this.mainWindow.isFullScreen(),
          isFocused: this.mainWindow.isFocused(),
          isAlwaysOnTop: this.mainWindow.isAlwaysOnTop(),
          isResizable: this.mainWindow.isResizable(),
          isMovable: this.mainWindow.isMovable(),
          webContentsId: this.mainWindow.webContents.id
        } : null,
        allWindows: allWindows.map(win => ({
          id: win.id,
          title: win.getTitle(),
          bounds: win.getBounds(),
          isVisible: win.isVisible(),
          isMinimized: win.isMinimized(),
          isMaximized: win.isMaximized(),
          isFocused: win.isFocused()
        })),
        displays: {
          primary: {
            id: primaryDisplay.id,
            bounds: primaryDisplay.bounds,
            workArea: primaryDisplay.workArea,
            size: primaryDisplay.size,
            workAreaSize: primaryDisplay.workAreaSize,
            scaleFactor: primaryDisplay.scaleFactor
          },
          all: allDisplays.map(display => ({
            id: display.id,
            bounds: display.bounds,
            workArea: display.workArea,
            size: display.size,
            workAreaSize: display.workAreaSize,
            scaleFactor: display.scaleFactor
          }))
        },
        windowCount: allWindows.length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[WindowManager] 윈도우 정보 조회 Failed:', error);
      throw error;
    }
  }

  // IPC 핸들러를 위한 추가 메서드들
  createWindow(_options: any): Promise<BrowserWindow> {
    // createMainWindow를 createWindow 별칭으로 사용
    return this.createMainWindow()
  }

  getWindowFromEvent(event: any): BrowserWindow | null {
    // 이벤트에서 윈도우를 가져오는 유틸리티 메서드
    const contents = event.sender
    const windows = BrowserWindow.getAllWindows()
    return windows.find(win => win.webContents === contents) || null
  }
}

// Export standalone functions for compatibility with existing imports
export async function createWindow(): Promise<BrowserWindow> {
  const windowManager = WindowManager.getInstance()
  return windowManager.createMainWindow()
}

export function getMainWindow(): BrowserWindow | null {
  const windowManager = WindowManager.getInstance()
  return windowManager.getMainWindow()
}
