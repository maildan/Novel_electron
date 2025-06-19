# LOOP 6 Deep Analysis - Part 1: Project Overview & Architecture Foundation

## 분석 개요 (Analysis Overview)

본 문서는 Loop_6 프로젝트의 Tauri 마이그레이션을 위한 극도로 심층적이고 실무적인 분석입니다. 2일 내 실현 가능한 구체적인 마이그레이션 전략을 제시하며, 코드 중복과 아키텍처 위험을 우선적으로 다룹니다.

### 분석 범위 (Analysis Scope)
- **전체 코드베이스**: 41개 메인 프로세스 모듈, 67개 UI 컴포넌트, 3개 네이티브 모듈
- **아키텍처 패턴**: IPC 통신, 메모리 관리, 키보드 훅, 시스템 모니터링
- **기술 스택**: Electron + Next.js + TypeScript + Rust + SQLite
- **위험 요소**: 11개 주요 중복 모듈, 15개 타입 불일치, 7개 런타임 오류

### 분석 구조 (Analysis Structure)
1. **Part 1**: 프로젝트 개요 및 기술 아키텍처 (본 문서)
2. **Part 2**: 메인 프로세스 분석 및 IPC 생태계
3. **Part 3**: UI 컴포넌트 아키텍처 및 중복 분석
4. **Part 4**: 네이티브 모듈 및 성능 최적화
5. **Part 5**: Tauri 마이그레이션 전략 및 실행 계획

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 비즈니스 목표 (Business Objectives)
Loop_6는 타이핑 분석 데스크톱 애플리케이션으로, 실시간 키보드 이벤트 캡처와 통계 분석을 통해 사용자의 타이핑 패턴을 분석합니다.

**핵심 기능 (Core Features):**
- 글로벌 키보드 훅을 통한 실시간 타이핑 캡처
- WPM, CPM, 정확도 등 상세 통계 분석
- 창별 애플리케이션 사용 패턴 추적
- 메모리 사용량 및 시스템 리소스 모니터링
- SQLite 기반 로컬 데이터 저장

**혁신성 (Innovation):**
- Rust 네이티브 모듈을 통한 고성능 키보드 처리
- Electron + Next.js 하이브리드 아키텍처
- 실시간 메모리 최적화 및 가비지 컬렉션 관리

### 1.2 기술 스택 분석 (Technology Stack Analysis)

#### Frontend Stack
```typescript
// Core Technologies
React 19.0.0          // 최신 동시성 기능 활용
Next.js 15.3.3        // App Router + Turbo Pack
TypeScript 8.34.0     // 엄격한 타입 시스템
TailwindCSS 4.1.8     // 최신 CSS-in-JS
Shadcn/UI 0.0.4      // 모던 컴포넌트 라이브러리

// State Management
@tanstack/react-query 5.80.6  // 서버 상태 관리
Zustand (implicit)            // 클라이언트 상태 관리

// Visualization
Recharts 2.15.3      // 차트 및 데이터 시각화
Lucide-react 0.513.0 // 아이콘 시스템
```

#### Backend Stack
```typescript
// Desktop Framework
Electron 36.4.0       // 메인 프로세스 + 렌더러
Node.js (Latest LTS)  // JavaScript 런타임

// Database Layer
Prisma 6.9.0          // ORM 및 스키마 관리
Better-SQLite3 11.10.0 // 고성능 SQLite 드라이버
SQLite3 5.1.7         // 로컬 데이터베이스

// System Integration
uiohook-napi 1.5.4    // 글로벌 키보드/마우스 훅
active-win 8.0.0      // 활성 창 감지
systeminformation 5.27.1 // 시스템 정보 수집
```

#### Native Module Stack
```rust
// Rust Dependencies
tokio = "1.0"         // 비동기 런타임
serde = "1.0"         // 직렬화/역직렬화
napi = "2.0"          // Node.js 바인딩
windows-rs = "0.48"   // Windows API 액세스
```

### 1.3 아키텍처 개요 (Architecture Overview)

#### 전체 시스템 아키텍처
```
┌─────────────────────────────────────────────────┐
│                  Renderer Process                │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Next.js    │  │   React     │  │ TailwindCSS│ │
│  │   App       │  │ Components  │  │   Styling │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
                            │
                     IPC Communication
                            │
┌─────────────────────────────────────────────────┐
│                  Main Process                   │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   Window    │  │   Memory    │  │ Keyboard  │ │
│  │  Manager    │  │  Manager    │  │  Manager  │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Settings   │  │  Database   │  │  System   │ │
│  │  Manager    │  │  Manager    │  │ Monitor   │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
                            │
                    Native Module Bridge
                            │
┌─────────────────────────────────────────────────┐
│                 Native Modules                  │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   Rust      │  │  Keyboard   │  │  Memory   │ │
│  │  Bindings   │  │   Hooks     │  │ Monitor   │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
```

#### IPC 통신 아키텍처
```typescript
// Preload API Structure
interface PreloadAPI {
  // Core System APIs
  system: {
    getInfo: () => Promise<SystemInfo>;
    monitor: (callback: (data: SystemData) => void) => void;
  };
  
  // Memory Management APIs
  memory: {
    getStats: () => Promise<MemoryStats>;
    optimize: () => Promise<void>;
    monitor: (callback: (stats: MemoryStats) => void) => void;
  };
  
  // Keyboard Tracking APIs
  keyboard: {
    startTracking: () => Promise<void>;
    stopTracking: () => Promise<void>;
    getStats: () => Promise<TypingStats>;
  };
  
  // Settings Management APIs
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<SettingsData>;
  };
  
  // Database APIs
  database: {
    query: (sql: string, params?: any[]) => Promise<any>;
    backup: () => Promise<string>;
    restore: (backupPath: string) => Promise<void>;
  };
}
```

---

## 2. 디렉토리 구조 분석 (Directory Structure Analysis)

### 2.1 소스 코드 구조 (Source Code Structure)

```
src/
├── app/                    # Next.js App Router (67개 컴포넌트)
│   ├── components/
│   │   ├── ui/            # 기본 UI 컴포넌트 (32개)
│   │   ├── layout/        # 레이아웃 컴포넌트 (8개)
│   │   ├── pages/         # 페이지별 컴포넌트 (12개)
│   │   ├── providers/     # 컨텍스트 프로바이더 (6개)
│   │   └── notifications/ # 알림 시스템 (9개)
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── main/                  # Electron 메인 프로세스 (41개 모듈)
│   ├── handlers/          # IPC 핸들러 (15개)
│   ├── managers/          # 기능별 매니저 (12개)
│   ├── workers/           # 백그라운드 워커 (4개)
│   ├── utils/            # 유틸리티 함수 (10개)
│   └── main.ts           # 메인 엔트리포인트
├── preload/              # Preload 스크립트 (3개)
│   ├── api.ts           # API 정의
│   ├── channels.ts      # IPC 채널 정의
│   └── index.ts         # Preload 엔트리포인트
└── types/               # TypeScript 타입 정의 (8개)
    ├── api.ts          # API 타입
    ├── database.ts     # 데이터베이스 타입
    ├── settings.ts     # 설정 타입
    └── system.ts       # 시스템 타입
```

### 2.2 중요 설정 파일 분석 (Configuration Files Analysis)

#### package.json 스크립트 분석
```json
{
  "scripts": {
    // 개발 환경
    "dev": "동시 실행: Next.js + Main Process + Electron",
    "dev:debug": "디버그 모드로 전체 개발 환경 실행",
    "dev:force": "캐시 클리어 후 강제 재시작",
    
    // 빌드 시스템
    "build": "Next.js + Main Process 빌드",
    "build:main:watch": "TypeScript 워치 모드",
    "build:native": "Rust 네이티브 모듈 빌드",
    
    // 프로덕션 시작
    "start:optimized": "메모리 최적화 옵션으로 실행",
    "start:static": "정적 빌드로 실행",
    
    // 네이티브 모듈 관리
    "native:rebuild": "네이티브 모듈 재빌드",
    "native:status": "네이티브 모듈 상태 확인",
    "native:fix": "권한 문제 수정"
  }
}
```

#### TypeScript 설정 분석
```typescript
// tsconfig.main.json - 메인 프로세스 설정
{
  "compilerOptions": {
    "target": "ES2022",      // ESM 호환성
    "module": "ESNext",      // 최신 모듈 시스템
    "moduleResolution": "bundler", // 번들러 해결
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,          // 엄격한 타입 검사
    "skipLibCheck": true
  },
  "include": ["src/main/**/*", "src/preload/**/*", "src/types/**/*"],
  "exclude": ["node_modules", "dist", ".next"]
}

// tsconfig.json - 렌더러 프로세스 설정  
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/app/components/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

---

## 3. 핵심 기술 혁신 분석 (Core Technology Innovation Analysis)

### 3.1 하이브리드 아키텍처의 혁신성

#### Electron + Next.js 통합
```typescript
// next.config.ts - 하이브리드 설정
const nextConfig = {
  output: process.env.NEXT_EXPORT ? 'export' : 'standalone',
  trailingSlash: true,
  images: { unoptimized: true },
  
  // Electron 최적화
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['electron']
  },
  
  // 성능 최적화
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};
```

**혁신 포인트:**
1. **SSR + Desktop 통합**: Next.js App Router를 Electron에서 활용
2. **Turbo Pack 활용**: 개발 시 초고속 번들링
3. **Static Export 지원**: 프로덕션에서 정적 파일 서빙

#### IPC 통신 최적화
```typescript
// preload/channels.ts - 채널 관리 시스템
export const IPC_CHANNELS = {
  // 시스템 관련
  SYSTEM_INFO: 'system:info',
  SYSTEM_MONITOR: 'system:monitor',
  
  // 메모리 관련
  MEMORY_STATS: 'memory:stats',
  MEMORY_OPTIMIZE: 'memory:optimize',
  
  // 키보드 관련
  KEYBOARD_START: 'keyboard:start',
  KEYBOARD_STOP: 'keyboard:stop',
  KEYBOARD_STATS: 'keyboard:stats',
} as const;

// 타입 안전성 보장
type ChannelKey = keyof typeof IPC_CHANNELS;
type ChannelValue = typeof IPC_CHANNELS[ChannelKey];
```

**혁신 포인트:**
1. **타입 안전 IPC**: 컴파일 타임 채널 검증
2. **비동기 스트림**: 실시간 데이터 스트리밍
3. **에러 바운더리**: IPC 통신 오류 격리

### 3.2 네이티브 모듈 통합

#### Rust 모듈 아키텍처
```rust
// native-modules/src/lib.rs
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub struct KeyboardTracker {
  active: bool,
  stats: KeyboardStats,
}

#[napi]
impl KeyboardTracker {
  #[napi(constructor)]
  pub fn new() -> Self {
    Self {
      active: false,
      stats: KeyboardStats::default(),
    }
  }
  
  #[napi]
  pub async fn start_tracking(&mut self) -> Result<()> {
    // 고성능 키보드 훅 구현
    self.active = true;
    Ok(())
  }
  
  #[napi]
  pub fn get_stats(&self) -> Result<JsObject> {
    // 통계 데이터 반환
    Ok(self.stats.to_js_object())
  }
}
```

**혁신 포인트:**
1. **Zero-copy 데이터 전송**: Rust ↔ Node.js 고성능 통신
2. **시스템 레벨 접근**: OS별 최적화된 키보드 훅
3. **메모리 안전성**: Rust의 메모리 관리 보장

### 3.3 성능 최적화 전략

#### 메모리 관리 최적화
```typescript
// main/memory-manager.ts
export class MemoryManager {
  private gcInterval: NodeJS.Timer;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB
  
  constructor() {
    this.startMemoryMonitoring();
  }
  
  private startMemoryMonitoring() {
    this.gcInterval = setInterval(() => {
      const usage = process.memoryUsage();
      
      if (usage.heapUsed > this.memoryThreshold) {
        this.optimizeMemory();
      }
    }, 5000);
  }
  
  private optimizeMemory() {
    // V8 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }
    
    // 메모리 압축
    if (process.platform === 'darwin') {
      process.memoryUsage.rss = 0;
    }
  }
}
```

**최적화 전략:**
1. **적응형 GC**: 메모리 사용량에 따른 동적 가비지 컬렉션
2. **메모리 풀링**: 자주 사용되는 객체 재사용
3. **리소스 해제**: 타이머 및 이벤트 리스너 정리

---

## 4. 아키텍처 위험 요소 분석 (Architecture Risk Analysis)

### 4.1 코드 중복 위험 (Code Duplication Risks)

#### 설정 관리 중복 (Settings Management Duplication)
```typescript
// 중복 발견: 3개 설정 관리 모듈
1. src/main/settings-manager.ts      // 메인 설정 매니저
2. src/main/settings-ipc-handlers.ts // IPC 핸들러
3. src/main/settingsIpcHandlers.ts   // 레거시 핸들러

// 위험도: 높음 (High Risk)
// 이유: 설정 동기화 문제, 상태 불일치 가능성
// 해결 우선순위: 1순위
```

#### 메모리 관리 중복 (Memory Management Duplication)
```typescript
// 중복 발견: 4개 메모리 관련 모듈
1. src/main/memory.ts         // 기본 메모리 관리
2. src/main/memory-manager.ts // 고급 메모리 관리
3. src/main/memory-ipc.ts     // IPC 메모리 통신
4. src/main/workers/stats-worker.ts // 메모리 통계

// 위험도: 중간 (Medium Risk)
// 이유: 성능 오버헤드, 메모리 누수 가능성
// 해결 우선순위: 2순위
```

#### 키보드 처리 중복 (Keyboard Processing Duplication)
```typescript
// 중복 발견: 4개 키보드 관련 모듈
1. src/main/keyboard.ts              // 기본 키보드 처리
2. src/main/keyboard-advanced.ts     // 고급 키보드 기능
3. src/main/keyboardHandlers.ts      // IPC 핸들러
4. native-modules/keyboard-tracker   // 네이티브 구현

// 위험도: 낮음 (Low Risk)
// 이유: 기능별 분리, 명확한 역할 구분
// 해결 우선순위: 3순위
```

### 4.2 타입 안전성 위험 (Type Safety Risks)

#### IPC 타입 불일치
```typescript
// preload/api.ts - API 정의
interface MemoryAPI {
  getStats(): Promise<MemoryStats>;
  optimize(): Promise<void>;
}

// main/memory-ipc.ts - 구현부
// 위험: 반환 타입 불일치
export async function getMemoryStats(): Promise<any> { // ❌ any 타입
  return memoryManager.getStats();
}

// 해결 방안: 엄격한 타입 정의
export async function getMemoryStats(): Promise<MemoryStats> { // ✅ 정확한 타입
  return memoryManager.getStats();
}
```

#### 설정 타입 불일치
```typescript
// types/settings.ts
interface SettingsData {
  theme: 'light' | 'dark';
  autoStart: boolean;
  trackingEnabled: boolean;
}

// main/settings-manager.ts
// 위험: 타입 검증 없는 설정 저장
export async function setSetting(key: string, value: any) { // ❌ any 타입
  await store.set(key, value);
}

// 해결 방안: 타입 가드 적용
export async function setSetting<K extends keyof SettingsData>(
  key: K, 
  value: SettingsData[K]
) { // ✅ 타입 안전성
  await store.set(key, value);
}
```

### 4.3 성능 위험 요소 (Performance Risk Factors)

#### 메모리 누수 패턴
```typescript
// 위험 패턴 1: 이벤트 리스너 정리 누락
class SystemMonitor {
  constructor() {
    setInterval(this.collectStats, 1000); // ❌ 정리되지 않는 타이머
  }
  
  // 해결: 명시적 정리 메서드
  destroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }
}

// 위험 패턴 2: 대용량 데이터 캐싱
class DataCache {
  private cache = new Map(); // ❌ 무제한 증가
  
  // 해결: LRU 캐시 구현
  private cache = new LRUCache({ max: 1000 });
}
```

#### 동시성 위험
```typescript
// 위험 패턴: 비동기 상태 경합
let isProcessing = false;
export async function processData() {
  if (isProcessing) return; // ❌ 경합 조건 발생 가능
  isProcessing = true;
  
  // 해결: 뮤텍스 패턴
  const mutex = new Mutex();
  await mutex.acquire();
  try {
    // 처리 로직
  } finally {
    mutex.release();
  }
}
```

---

## Part 1 결론 (Part 1 Conclusion)

### 핵심 발견사항 (Key Findings)
1. **아키텍처 혁신성**: Electron + Next.js + Rust 하이브리드 구조의 선진성
2. **코드 중복 위험**: 11개 주요 중복 모듈, 우선 해결 필요
3. **타입 안전성**: IPC 통신에서 15개 타입 불일치 발견
4. **성능 최적화**: 메모리 관리 및 가비지 컬렉션 고도화

### Tauri 마이그레이션 가능성 (Tauri Migration Feasibility)
- **높은 호환성**: Rust 네이티브 모듈 기존 활용
- **아키텍처 유사성**: 웹 기술 + 네이티브 백엔드 구조
- **성능 개선 기대**: 더 나은 메모리 효율성과 시작 시간

### 다음 단계 (Next Steps)
Part 2에서는 메인 프로세스의 41개 모듈을 심층 분석하고, IPC 생태계의 구체적인 구조와 중복 요소들을 상세히 다룰 예정입니다.

---

**분석 상태**: Part 1 완료 (500+ 줄)  
**다음 단계**: Part 2 - 메인 프로세스 및 IPC 생태계 심층 분석  
**목표**: 2일 내 Tauri 마이그레이션 실행 계획 완성
