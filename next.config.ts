/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'
const nextPort = process.env.NEXT_PORT || '5500'
const silent = process.env.SILENT === 'true' || process.env.DISABLE_DEV_LOGS === 'true'

if (!silent) {
  console.log(`🚀 Next.js 구성: ${isDev ? '개발' : '프로덕션'} 환경, 포트: ${nextPort}`)
}

const nextConfig = {
  // 정적 익스포트 설정 (프로덕션 빌드 시)
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  distDir: process.env.NEXT_EXPORT === 'true' ? 'out' : '.next',
  reactStrictMode: true,
  trailingSlash: true,
  
  // HEAD 요청 비활성화
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },

  // Turbopack 설정 (Next.js 15+)
  turbopack: {
    rules: {
      '*.node': {
        loaders: ['ignore-loader']
      }
    }
  },
  
  // 이미지 최적화 설정 (Electron에서는 비활성화)
  images: {
    unoptimized: true
  },

  // Electron용 설정
  basePath: '',
  assetPrefix: isDev ? '' : '/',

  // CSP 헤더 설정 (개발 모드에서 완화)
  async headers() {
    if (isDev) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:*; " +
                     "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* blob:; " +
                     "style-src 'self' 'unsafe-inline' http://localhost:*; " +
                     "img-src 'self' data: blob: http://localhost:*; " +
                     "font-src 'self' data: http://localhost:*; " +
                     "connect-src 'self' ws: wss: http://localhost:* https://localhost:*; " +
                     "frame-src 'self' http://localhost:*; " +
                     "worker-src 'self' blob:;"
            }
          ]
        }
      ]
    }
    return []
  },

  // 외부 패키지 설정
  serverExternalPackages: [
    'typing_stats_native',
    'active-win',
    'uiohook-napi',
    'better-sqlite3',
    'electron'
  ],

  // 웹팩 설정 (프로덕션 빌드 시에만 사용)
  ...(!isDev && {
    webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
      if (!silent) {
        console.log(`📦 웹팩 설정: ${dev ? '개발' : '프로덕션'} 모드 (서버: ${isServer})`)
      }
      
      // 파일 워치 설정
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/out/**',
          '**/native-modules/target/**'
        ],
        poll: dev && !process.env.DISABLE_POLLING ? 1000 : false
      }

      // 외부 종속성 처리
      if (isServer) {
        config.externals = [
          ...(Array.isArray(config.externals) ? config.externals : []),
          'electron',
          'uiohook-napi',
          'active-win',
          'better-sqlite3',
          function({ request }: { request?: string }, callback: (error?: Error | null, result?: any) => void) {
            if (request?.endsWith('.node') || request?.includes('native-modules')) {
              return callback(null, 'commonjs ' + request)
            }
            callback()
          }
        ]
      }

      // 경고 무시
      config.ignoreWarnings = [
        /Critical dependency/,
        /Module not found/
      ]

      // WASM 지원
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true
      }

      return config
    }
  })
}

export default nextConfig
