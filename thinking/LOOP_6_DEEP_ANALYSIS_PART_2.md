# LOOP 6 Deep Analysis - Part 2: Main Process & IPC Ecosystem

## 메인 프로세스 아키텍처 심층 분석 (Main Process Architecture Deep Analysis)

본 문서는 Loop_6의 41개 메인 프로세스 모듈과 IPC 생태계에 대한 극도로 세밀한 분석을 제공합니다. 코드 중복 제거와 Tauri 마이그레이션을 위한 실무적 관점에서 작성되었습니다.

---

## 1. 메인 프로세스 모듈 현황 (Main Process Module Status)

### 1.1 전체 모듈 분류 (Module Classification)

```typescript
// 메인 프로세스 모듈 구조 (41개 모듈)
src/main/
├── core/                   # 핵심 시스템 (8개)
│   ├── main.ts            # 애플리케이션 엔트리포인트
│   ├── app-lifecycle.ts   # 앱 생명주기 관리
│   ├── app-initialization.ts  # 초기화 프로세스
│   ├── app-cleanup.ts     # 정리 프로세스
│   ├── window.ts          # 창 관리
│   ├── menu.ts           # 메뉴 시스템
│   ├── constants.ts       # 상수 정의
│   └── config.ts         # 설정 관리
├── managers/              # 기능별 매니저 (12개)
│   ├── memory-manager.ts  # 메모리 관리
│   ├── settings-manager.ts # 설정 관리
│   ├── keyboard-manager.ts # 키보드 관리
│   ├── system-manager.ts  # 시스템 관리
│   ├── database-manager.ts # 데이터베이스 관리
│   ├── handlers-manager.ts # 핸들러 관리
│   ├── native-manager.ts  # 네이티브 모듈 관리
│   ├── data-sync.ts       # 데이터 동기화
│   ├── data-collector.ts  # 데이터 수집
│   ├── backup-manager.ts  # 백업 관리
│   ├── cache-manager.ts   # 캐시 관리
│   └── error-manager.ts   # 오류 관리
├── handlers/              # IPC 핸들러 (15개)
│   ├── memory-ipc.ts      # 메모리 IPC
│   ├── settings-ipc-handlers.ts # 설정 IPC
│   ├── keyboard-handlers.ts # 키보드 IPC
│   ├── system-handlers.ts # 시스템 IPC
│   ├── database-handlers.ts # 데이터베이스 IPC
│   ├── file-handlers.ts   # 파일 IPC
│   ├── window-handlers.ts # 창 IPC
│   └── ...               # 기타 핸들러들
├── workers/               # 백그라운드 워커 (4개)
│   ├── stats-worker.ts    # 통계 워커
│   ├── cleanup-worker.ts  # 정리 워커
│   ├── backup-worker.ts   # 백업 워커
│   └── sync-worker.ts     # 동기화 워커
└── utils/                # 유틸리티 (10개)
    ├── logger.ts          # 로깅 시스템
    ├── security.ts        # 보안 유틸
    ├── validation.ts      # 검증 함수
    ├── performance.ts     # 성능 측정
    └── ...               # 기타 유틸리티들
```

### 1.2 핵심 모듈별 상세 분석 (Detailed Core Module Analysis)

#### main.ts - 애플리케이션 엔트리포인트
```typescript
// src/main/main.ts - 현재 구조 분석
import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window';
import { MenuManager } from './menu';
import { SettingsManager } from './settings-manager';
import { MemoryManager } from './memory-manager';
import { KeyboardManager } from './keyboard';

class Application {
  private windowManager: WindowManager;
  private settingsManager: SettingsManager;
  private memoryManager: MemoryManager;
  private keyboardManager: KeyboardManager;
  
  constructor() {
    this.initializeManagers();
    this.setupEventHandlers();
  }
  
  // 중복 위험: 여러 매니저에서 유사한 초기화 로직
  private async initializeManagers() {
    this.settingsManager = new SettingsManager();  // ❌ 중복 1
    this.memoryManager = new MemoryManager();      // ❌ 중복 2  
    this.keyboardManager = new KeyboardManager();  // ❌ 중복 3
    
    // 각 매니저별로 별도의 초기화 로직
    await this.settingsManager.initialize();
    await this.memoryManager.initialize();
    await this.keyboardManager.initialize();
  }
}

// Tauri 마이그레이션 맵핑
// main.ts → src-tauri/src/main.rs
```

**발견된 문제점:**
1. **매니저 초기화 중복**: 각 매니저마다 유사한 초기화 패턴
2. **의존성 주입 부재**: 하드코딩된 매니저 인스턴스
3. **에러 처리 분산**: 각 매니저별 개별 에러 처리

**Tauri 마이그레이션 방향:**
```rust
// src-tauri/src/main.rs - 목표 구조
use tauri::{Builder, Context, generate_context};

#[tauri::command]
async fn initialize_app() -> Result<(), String> {
    // 통합된 초기화 로직
    managers::initialize_all().await?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            initialize_app,
            memory_commands::get_stats,
            keyboard_commands::start_tracking,
            settings_commands::get_all
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### window.ts - 창 관리 시스템
```typescript
// src/main/window.ts - 현재 구조
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  
  async createMainWindow(): Promise<BrowserWindow> {
    // 중복 위험: 창 설정 로직의 반복
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,     // ❌ 설정 중복
        contextIsolation: true,     // ❌ 설정 중복
        enableRemoteModule: false,  // ❌ 설정 중복
        preload: path.join(__dirname, '../preload/index.js')
      }
    });
    
    // Next.js 개발 서버 또는 정적 파일 로드
    const isDev = process.env.NODE_ENV === 'development';
    const url = isDev 
      ? 'http://localhost:5500'
      : `file://${path.join(__dirname, '../renderer/index.html')}`;
    
    await this.mainWindow.loadURL(url);
    return this.mainWindow;
  }
  
  // 중복 코드: 비슷한 창 생성 로직
  async createSettingsWindow(): Promise<BrowserWindow> {
    this.settingsWindow = new BrowserWindow({
      width: 800,                   // ❌ 하드코딩된 크기
      height: 600,                  // ❌ 하드코딩된 크기
      webPreferences: {
        nodeIntegration: false,     // ❌ 중복된 설정
        contextIsolation: true,     // ❌ 중복된 설정
        preload: path.join(__dirname, '../preload/index.js')
      }
    });
    // ... 유사한 로직 반복
  }
}

// 개선 방향: 팩토리 패턴 적용
interface WindowConfig {
  width: number;
  height: number;
  route: string;
}

export class WindowFactory {
  private static baseWebPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, '../preload/index.js')
  };
  
  static create(config: WindowConfig): BrowserWindow {
    return new BrowserWindow({
      width: config.width,
      height: config.height,
      webPreferences: this.baseWebPreferences
    });
  }
}
```

**Tauri 마이그레이션 전략:**
```rust
// src-tauri/src/window.rs
use tauri::{Window, WindowBuilder, Size, LogicalSize};

pub struct WindowManager;

impl WindowManager {
    pub fn create_main_window(app: &tauri::AppHandle) -> tauri::Result<Window> {
        WindowBuilder::new(app, "main", tauri::WindowUrl::App("index.html".into()))
            .title("Loop 6")
            .inner_size(LogicalSize::new(1200.0, 800.0))
            .min_inner_size(LogicalSize::new(800.0, 600.0))
            .build()
    }
    
    pub fn create_settings_window(app: &tauri::AppHandle) -> tauri::Result<Window> {
        WindowBuilder::new(app, "settings", tauri::WindowUrl::App("settings.html".into()))
            .title("Settings")
            .inner_size(LogicalSize::new(800.0, 600.0))
            .build()
    }
}
```

---

## 2. IPC 생태계 심층 분석 (IPC Ecosystem Deep Analysis)

### 2.1 IPC 채널 아키텍처 (IPC Channel Architecture)

```typescript
// preload/channels.ts - 현재 IPC 채널 구조
export const IPC_CHANNELS = {
  // 시스템 관련 (6개 채널)
  SYSTEM_INFO: 'system:info',
  SYSTEM_MONITOR_START: 'system:monitor:start',
  SYSTEM_MONITOR_STOP: 'system:monitor:stop',
  SYSTEM_STATS: 'system:stats',
  SYSTEM_OPTIMIZE: 'system:optimize',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  
  // 메모리 관련 (8개 채널)
  MEMORY_STATS: 'memory:stats',
  MEMORY_OPTIMIZE: 'memory:optimize',
  MEMORY_MONITOR: 'memory:monitor',
  MEMORY_CLEAR_CACHE: 'memory:clear-cache',
  MEMORY_GC: 'memory:gc',
  MEMORY_HEAP_SNAPSHOT: 'memory:heap-snapshot',
  MEMORY_USAGE_REPORT: 'memory:usage-report',
  MEMORY_THRESHOLD_SET: 'memory:threshold-set',
  
  // 키보드 관련 (12개 채널)
  KEYBOARD_START: 'keyboard:start',
  KEYBOARD_STOP: 'keyboard:stop',
  KEYBOARD_STATS: 'keyboard:stats',
  KEYBOARD_RESET: 'keyboard:reset',
  KEYBOARD_CONFIG: 'keyboard:config',
  KEYBOARD_HOTKEY_REGISTER: 'keyboard:hotkey:register',
  KEYBOARD_HOTKEY_UNREGISTER: 'keyboard:hotkey:unregister',
  KEYBOARD_SHORTCUT_SET: 'keyboard:shortcut:set',
  KEYBOARD_TRACKING_PAUSE: 'keyboard:tracking:pause',
  KEYBOARD_TRACKING_RESUME: 'keyboard:tracking:resume',
  KEYBOARD_LANGUAGE_DETECT: 'keyboard:language:detect',
  KEYBOARD_LAYOUT_CHANGE: 'keyboard:layout:change',
  
  // 설정 관련 (10개 채널)
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_BACKUP: 'settings:backup',
  SETTINGS_RESTORE: 'settings:restore',
  SETTINGS_IMPORT: 'settings:import',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_VALIDATE: 'settings:validate',
  SETTINGS_WATCH: 'settings:watch',
  
  // 데이터베이스 관련 (15개 채널)
  DB_QUERY: 'db:query',
  DB_INSERT: 'db:insert',
  DB_UPDATE: 'db:update',
  DB_DELETE: 'db:delete',
  DB_BACKUP: 'db:backup',
  DB_RESTORE: 'db:restore',
  DB_MIGRATE: 'db:migrate',
  DB_VACUUM: 'db:vacuum',
  DB_ANALYZE: 'db:analyze',
  DB_TRANSACTION_BEGIN: 'db:transaction:begin',
  DB_TRANSACTION_COMMIT: 'db:transaction:commit',
  DB_TRANSACTION_ROLLBACK: 'db:transaction:rollback',
  DB_SCHEMA_UPDATE: 'db:schema:update',
  DB_INDEX_CREATE: 'db:index:create',
  DB_STATS: 'db:stats'
} as const;

// 타입 안전성 보장
type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
```

### 2.2 IPC 핸들러 중복 분석 (IPC Handler Duplication Analysis)

#### 설정 관리 IPC 중복 (Settings IPC Duplication)
```typescript
// 문제: 3개의 설정 IPC 핸들러 발견

// 1. src/main/settings-ipc-handlers.ts (신규)
export class SettingsIpcHandlers {
  async handleGetSetting(key: string): Promise<any> {
    return await this.settingsManager.get(key);
  }
  
  async handleSetSetting(key: string, value: any): Promise<void> {
    await this.settingsManager.set(key, value);
  }
}

// 2. src/main/settingsIpcHandlers.ts (레거시)
export function setupSettingsHandlers() {
  ipcMain.handle('settings:get', async (event, key) => {
    return settings.get(key);  // ❌ 다른 인스턴스 사용
  });
  
  ipcMain.handle('settings:set', async (event, key, value) => {
    settings.set(key, value);  // ❌ 다른 구현
  });
}

// 3. src/main/handlers-manager.ts에서도 별도 구현
export class HandlersManager {
  private setupSettingsHandlers() {
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, this.handleSettingsGet);
    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, this.handleSettingsSet);
  }
  
  private async handleSettingsGet(event: IpcMainInvokeEvent, key: string) {
    // ❌ 또 다른 구현
    return this.configManager.getSetting(key);
  }
}

// 위험도: 매우 높음 (Critical Risk)
// 이유: 3개 핸들러가 서로 다른 백엔드 사용, 상태 불일치 발생
```

**해결 방안:**
```typescript
// 통합된 설정 IPC 핸들러
export class UnifiedSettingsHandler {
  constructor(private settingsManager: SettingsManager) {}
  
  register() {
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, this.handleGet.bind(this));
    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, this.handleSet.bind(this));
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, this.handleGetAll.bind(this));
  }
  
  private async handleGet(event: IpcMainInvokeEvent, key: string) {
    try {
      return await this.settingsManager.get(key);
    } catch (error) {
      throw new Error(`Failed to get setting ${key}: ${error.message}`);
    }
  }
  
  private async handleSet(event: IpcMainInvokeEvent, key: string, value: any) {
    try {
      await this.settingsManager.set(key, value);
      
      // 변경 사항을 모든 렌더러에 브로드캐스트
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('settings:changed', { key, value });
      });
    } catch (error) {
      throw new Error(`Failed to set setting ${key}: ${error.message}`);
    }
  }
}
```

#### 메모리 관리 IPC 중복 (Memory IPC Duplication)
```typescript
// 문제: 메모리 IPC에서 타입 불일치 및 구현 분산

// src/main/memory-ipc.ts
export async function getMemoryStats(): Promise<any> {  // ❌ any 타입
  const stats = await memoryManager.getDetailedStats();
  return {
    heap: stats.heap,
    external: stats.external,
    // ❌ 일부 필드 누락
  };
}

// src/main/memory-manager.ts
export class MemoryManager {
  async getStats(): Promise<MemoryStats> {  // ❌ 다른 반환 타입
    return {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      arrayBuffers: process.memoryUsage().arrayBuffers,
      timestamp: Date.now()
    };
  }
}

// src/main/workers/stats-worker.ts
// ❌ 또 다른 메모리 통계 구현
export function collectMemoryStats() {
  const usage = process.memoryUsage();
  return {
    memory: usage,  // ❌ 다른 구조
    pid: process.pid,
    uptime: process.uptime()
  };
}
```

**해결 방안 - 타입 통합:**
```typescript
// types/memory.ts - 통합 타입 정의
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  timestamp: number;
  pid: number;
  uptime: number;
}

export interface MemoryOptimizationResult {
  beforeStats: MemoryStats;
  afterStats: MemoryStats;
  freedMemory: number;
  optimizationDuration: number;
}

// src/main/memory/unified-memory-handler.ts
export class UnifiedMemoryHandler {
  constructor(private memoryManager: MemoryManager) {}
  
  register() {
    ipcMain.handle(IPC_CHANNELS.MEMORY_STATS, this.handleGetStats.bind(this));
    ipcMain.handle(IPC_CHANNELS.MEMORY_OPTIMIZE, this.handleOptimize.bind(this));
  }
  
  private async handleGetStats(): Promise<MemoryStats> {
    return this.memoryManager.getStats();
  }
  
  private async handleOptimize(): Promise<MemoryOptimizationResult> {
    const beforeStats = await this.memoryManager.getStats();
    const startTime = Date.now();
    
    await this.memoryManager.optimize();
    
    const afterStats = await this.memoryManager.getStats();
    const optimizationDuration = Date.now() - startTime;
    
    return {
      beforeStats,
      afterStats,
      freedMemory: beforeStats.heapUsed - afterStats.heapUsed,
      optimizationDuration
    };
  }
}
```

### 2.3 IPC 성능 최적화 분석 (IPC Performance Optimization)

#### 현재 성능 병목점 (Current Performance Bottlenecks)
```typescript
// 문제 1: 과도한 IPC 호출
// src/app/components/ui/typing-analyzer.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const stats = await window.electronAPI.keyboard.getStats();  // ❌ 1초마다 IPC 호출
    setTypingStats(stats);
  }, 1000);
  
  return () => clearInterval(interval);
}, []);

// 문제 2: 동기적 IPC 패턴
// src/main/handlers/database-handlers.ts
export async function handleDatabaseQuery(event: IpcMainInvokeEvent, sql: string) {
  const result = await database.query(sql);  // ❌ 메인 스레드 블로킹
  return result;
}

// 문제 3: 대용량 데이터 전송
// src/main/handlers/backup-handlers.ts
export async function handleExportData() {
  const allData = await database.getAllData();  // ❌ 수MB 데이터를 IPC로 전송
  return allData;
}
```

**최적화 전략:**
```typescript
// 1. 이벤트 스트리밍 패턴
// src/main/memory-ipc.ts - 개선된 구현
export class StreamingMemoryHandler {
  private subscribers = new Set<WebContents>();
  private updateInterval: NodeJS.Timer;
  
  startStreaming() {
    this.updateInterval = setInterval(() => {
      const stats = this.memoryManager.getStats();
      
      // 변화가 있을 때만 전송
      if (this.hasSignificantChange(stats)) {
        this.broadcast('memory:stats', stats);
      }
    }, 1000);
  }
  
  private broadcast(channel: string, data: any) {
    this.subscribers.forEach(webContents => {
      if (!webContents.isDestroyed()) {
        webContents.send(channel, data);
      }
    });
  }
  
  subscribe(webContents: WebContents) {
    this.subscribers.add(webContents);
    webContents.once('destroyed', () => {
      this.subscribers.delete(webContents);
    });
  }
}

// 2. 워커 스레드 활용
// src/main/workers/database-worker.ts
import { Worker, isMainThread, parentPort } from 'worker_threads';

if (!isMainThread) {
  // 워커 스레드에서 데이터베이스 작업 실행
  parentPort?.on('message', async (message) => {
    const { id, operation, params } = message;
    
    try {
      const result = await performDatabaseOperation(operation, params);
      parentPort?.postMessage({ id, result });
    } catch (error) {
      parentPort?.postMessage({ id, error: error.message });
    }
  });
}

// 3. 청크 단위 데이터 전송
// src/main/handlers/backup-handlers.ts - 개선된 구현
export class ChunkedBackupHandler {
  async handleExportData(event: IpcMainInvokeEvent) {
    const CHUNK_SIZE = 1000;
    const totalRecords = await database.getRecordCount();
    const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
    
    // 진행 상황 스트리밍
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const data = await database.getDataChunk(chunk * CHUNK_SIZE, CHUNK_SIZE);
      
      event.sender.send('export:chunk', {
        chunk,
        totalChunks,
        data,
        progress: Math.round((chunk / totalChunks) * 100)
      });
      
      // 백프레셀 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    event.sender.send('export:complete');
  }
}
```

---

## 3. 아키텍처 패턴 분석 (Architecture Pattern Analysis)

### 3.1 의존성 주입 패턴 부재 (Missing Dependency Injection)

#### 현재 문제점 (Current Issues)
```typescript
// src/main/main.ts - 하드코딩된 의존성
export class Application {
  constructor() {
    // ❌ 직접 인스턴스화, 테스트하기 어려움
    this.settingsManager = new SettingsManager();
    this.memoryManager = new MemoryManager();
    this.keyboardManager = new KeyboardManager();
    
    // ❌ 의존성 간 순환 참조 가능
    this.memoryManager.setKeyboardManager(this.keyboardManager);
    this.keyboardManager.setMemoryManager(this.memoryManager);
  }
}
```

#### 개선 방안 - DI 컨테이너 도입 (DI Container Implementation)
```typescript
// src/main/di/container.ts
interface DIContainer {
  register<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
}

export class ServiceContainer implements DIContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  register<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    if (this.services.has(token)) {
      return this.services.get(token);
    }
    
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`Service ${token} not registered`);
    }
    
    const instance = factory();
    this.services.set(token, instance);
    return instance;
  }
}

// 서비스 등록
export function configureServices(container: ServiceContainer) {
  container.register('SettingsManager', () => new SettingsManager());
  container.register('MemoryManager', () => new MemoryManager(
    container.resolve('Logger')
  ));
  container.register('KeyboardManager', () => new KeyboardManager(
    container.resolve('SettingsManager'),
    container.resolve('MemoryManager')
  ));
}
```

### 3.2 이벤트 기반 아키텍처 도입 (Event-Driven Architecture)

```typescript
// src/main/events/event-bus.ts
export interface DomainEvent {
  type: string;
  timestamp: number;
  payload: any;
}

export class EventBus {
  private handlers = new Map<string, ((event: DomainEvent) => void)[]>();
  
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    // 병렬 실행으로 성능 최적화
    await Promise.all(
      handlers.map(handler => 
        Promise.resolve(handler(event)).catch(error => 
          console.error(`Error in event handler for ${event.type}:`, error)
        )
      )
    );
  }
}

// 사용 예시 - 메모리 이벤트
export class MemoryEvents {
  static readonly MEMORY_THRESHOLD_EXCEEDED = 'memory:threshold-exceeded';
  static readonly MEMORY_OPTIMIZED = 'memory:optimized';
  static readonly MEMORY_LEAK_DETECTED = 'memory:leak-detected';
}

// src/main/memory-manager.ts - 이벤트 발행
export class MemoryManager {
  constructor(private eventBus: EventBus) {}
  
  async checkMemoryUsage(): Promise<void> {
    const stats = await this.getStats();
    
    if (stats.heapUsed > this.threshold) {
      await this.eventBus.emit({
        type: MemoryEvents.MEMORY_THRESHOLD_EXCEEDED,
        timestamp: Date.now(),
        payload: { stats, threshold: this.threshold }
      });
    }
  }
}

// 이벤트 구독자
export class MemoryOptimizer {
  constructor(eventBus: EventBus) {
    eventBus.subscribe(MemoryEvents.MEMORY_THRESHOLD_EXCEEDED, this.handleThresholdExceeded.bind(this));
  }
  
  private async handleThresholdExceeded(event: DomainEvent) {
    const { stats } = event.payload;
    await this.performOptimization(stats);
  }
}
```

---

## 4. Tauri 마이그레이션 맵핑 (Tauri Migration Mapping)

### 4.1 IPC 시스템 마이그레이션 (IPC System Migration)

#### Electron IPC → Tauri Commands
```typescript
// Electron (현재)
// src/main/memory-ipc.ts
ipcMain.handle('memory:stats', async () => {
  return await memoryManager.getStats();
});

// Tauri (목표)
// src-tauri/src/commands/memory.rs
#[tauri::command]
pub async fn get_memory_stats() -> Result<MemoryStats, String> {
    let stats = memory_manager::get_stats().await
        .map_err(|e| e.to_string())?;
    Ok(stats)
}

// Frontend 호출 (동일)
const stats = await invoke('get_memory_stats');
```

#### 이벤트 스트리밍 마이그레이션
```typescript
// Electron (현재)
// 메인 프로세스에서 렌더러로 이벤트 발송
webContents.send('memory:stats', stats);

// Tauri (목표)  
// src-tauri/src/events.rs
use tauri::{AppHandle, Manager};

pub fn emit_memory_stats(app: &AppHandle, stats: MemoryStats) -> tauri::Result<()> {
    app.emit_all("memory:stats", stats)?;
    Ok(())
}

// Frontend 구독 (유사)
import { listen } from '@tauri-apps/api/event';

await listen('memory:stats', (event) => {
    setMemoryStats(event.payload);
});
```

### 4.2 네이티브 모듈 통합 전략 (Native Module Integration Strategy)

#### Rust 네이티브 모듈 재활용
```rust
// 현재: native-modules/src/keyboard.rs
#[napi]
pub struct KeyboardTracker {
    // 기존 구현
}

// Tauri 마이그레이션: src-tauri/src/keyboard.rs
pub struct KeyboardTracker {
    // 동일한 구현 재사용
}

#[tauri::command]
pub async fn start_keyboard_tracking() -> Result<(), String> {
    KEYBOARD_TRACKER.lock().await.start().map_err(|e| e.to_string())
}
```

---

## Part 2 결론 (Part 2 Conclusion)

### 핵심 발견사항 (Key Findings)
1. **IPC 중복 심각성**: 설정 관리에서 3개 핸들러 충돌, 메모리 관리에서 타입 불일치
2. **아키텍처 패턴 부재**: DI 컨테이너, 이벤트 버스 등 필수 패턴 미적용
3. **성능 병목점**: 과도한 IPC 호출, 동기적 데이터베이스 접근, 대용량 데이터 전송

### Tauri 마이그레이션 이점 (Tauri Migration Benefits)
1. **타입 안전성**: Rust의 강타입 시스템으로 IPC 타입 불일치 해결
2. **성능 향상**: 네이티브 성능과 더 효율적인 IPC 시스템
3. **코드 통합**: 기존 Rust 네이티브 모듈을 직접 통합 가능

### 다음 단계 (Next Steps)
Part 3에서는 67개 UI 컴포넌트의 아키텍처와 중복 패턴을 분석하여 마이그레이션 전략을 수립합니다.

---

**분석 상태**: Part 2 완료 (500+ 줄)  
**다음 단계**: Part 3 - UI 컴포넌트 아키텍처 및 중복 분석  
**중점 사항**: React 19 + Next.js 15 컴포넌트의 Tauri 호환성
