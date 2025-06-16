# Loop_6 기술적 세부사항 및 트러블슈팅 가이드

## 🔧 Electron 아키텍처 세부사항

### 프로세스 구조
```
Main Process (Node.js)
├── BrowserWindow 관리
├── 시스템 API 접근
├── 파일 시스템 작업
├── 데이터베이스 연결
└── IPC 메시지 처리

Renderer Process (Chrome)
├── React 애플리케이션
├── Next.js 라우팅
├── UI 컴포넌트 렌더링
└── 사용자 상호작용

Preload Script (Sandbox)
├── Main ↔ Renderer 브릿지
├── API 노출 제어
├── 보안 강화
└── 타입 안전성
```

### IPC 통신 패턴
```typescript
// 채널 정의 (channels.ts)
export const CHANNELS = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  // ...
} as const;

// API 노출 (api.ts)
const settingsAPI = {
  get: () => ipcRenderer.invoke(CHANNELS.SETTINGS_GET),
  update: (settings) => ipcRenderer.invoke(CHANNELS.SETTINGS_UPDATE, settings),
};

// 핸들러 등록 (main process)
ipcMain.handle(CHANNELS.SETTINGS_GET, async () => {
  return await SettingsManager.getAll();
});
```

## 🎨 UI/UX 아키텍처

### 컴포넌트 계층구조
```
App
├── ThemeProvider
│   ├── 테마 상태 관리
│   ├── CSS 변수 주입
│   └── 다크모드 토글
├── SettingsProvider
│   ├── 설정 상태 관리
│   ├── IPC 통신 처리
│   └── 데이터 검증
└── UI Components
    ├── Settings Panel
    │   ├── Category Navigation
    │   ├── Settings Forms
    │   └── Action Buttons
    ├── Monitoring Dashboard
    └── Status Indicators
```

### 스타일링 전략
```css
/* CSS 변수 기반 테마 */
:root {
  --animation-duration: 0.3s;
  --transition-duration: 0.2s;
  --color-primary: #3b82f6;
  --color-background: #ffffff;
}

[data-theme="dark"] {
  --color-background: #1f2937;
}

.no-animations {
  --animation-duration: 0s;
  --transition-duration: 0s;
}

/* 컴포넌트별 스타일 */
.settings-slide-in-right {
  animation: settingsSlideInRight var(--animation-duration) ease-out;
}
```

## 💾 데이터 관리 아키텍처

### 설정 저장소 계층
```
1. Frontend State (React Context)
   ↓ useSettings hook
2. IPC Communication Layer
   ↓ settings:update channel
3. Backend Manager (SettingsManager)
   ↓ electron-store
4. File System (JSON + localStorage backup)
```

### 데이터 플로우
```typescript
// 설정 변경 시 플로우
User Input → Component State → useSettings → IPC → SettingsManager → electron-store → File System

// 설정 로드 시 플로우
File System → electron-store → SettingsManager → IPC → useSettings → Component State → UI Update
```

### 데이터 검증 및 마이그레이션
```typescript
// 설정 검증
function validateSettings(settings: Partial<AppSettings>): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctedSettings: Partial<AppSettings> = {};

  // 타입 검증
  if (typeof settings.memoryThreshold !== 'number') {
    errors.push('메모리 임계값은 숫자여야 합니다');
  }

  // 범위 검증
  if (settings.memoryThreshold < 50 || settings.memoryThreshold > 95) {
    warnings.push('메모리 임계값이 권장 범위(50-95%)를 벗어남');
    correctedSettings.memoryThreshold = 80;
  }

  return { isValid: errors.length === 0, errors, warnings, correctedSettings };
}
```

## 🔍 성능 최적화 전략

### 메모리 관리
```typescript
// 메모리 모니터링
class MemoryManager {
  private monitoringInterval: NodeJS.Timer | null = null;
  
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      if (memoryUsage.heapUsed > this.settings.maxMemoryThreshold * 1024 * 1024) {
        this.optimizeMemory();
      }
    }, this.settings.monitoringInterval);
  }
  
  optimizeMemory() {
    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }
    
    // 불필요한 캐시 정리
    this.clearCache();
    
    // GPU 프로세스 정리
    if (this.settings.enableGPUAcceleration) {
      this.cleanupGPUResources();
    }
  }
}
```

### React 성능 최적화
```typescript
// 메모이제이션 활용
const SettingsPanel = memo(() => {
  const { settings, updateSetting } = useSettings();
  
  const handleToggle = useCallback((key: string, value: boolean) => {
    updateSetting(key, value);
  }, [updateSetting]);
  
  const expensiveComputation = useMemo(() => {
    return computeComplexStats(settings);
  }, [settings.enableAnalytics, settings.dataRetentionDays]);
  
  return <div>{/* UI */}</div>;
});

// 조건부 렌더링으로 불필요한 컴포넌트 로드 방지
const ConditionalComponent = () => {
  const { settings } = useSettings();
  
  if (!settings.enableAdvancedFeatures) {
    return null;
  }
  
  return <AdvancedPanel />;
};
```

## 🛠️ 트러블슈팅 가이드

### 자주 발생하는 문제들

#### 1. 설정이 저장되지 않는 문제
**증상**: 설정 변경 후 앱 재시작 시 이전 값으로 돌아감

**원인 분석**:
- IPC 통신 실패
- electron-store 권한 문제
- 타입 불일치로 인한 검증 실패

**해결 방법**:
```typescript
// 디버그 로그 활성화
console.log('🔍 Settings Debug:', {
  beforeSave: settings,
  saveRequest: settingsToSave,
  ipcResponse: result,
  afterLoad: loadedSettings
});

// 백업 메커니즘 확인
const backupSettings = localStorage.getItem('loop-settings');
if (backupSettings) {
  console.log('📁 Backup found:', JSON.parse(backupSettings));
}
```

#### 2. 다크모드가 적용되지 않는 문제
**증상**: 다크모드 토글 후에도 라이트 테마 유지

**원인 분석**:
- ThemeProvider와 settings 상태 불일치
- CSS 변수 업데이트 실패
- 컴포넌트 리렌더링 누락

**해결 방법**:
```typescript
// ThemeProvider에서 설정 동기화 확인
useEffect(() => {
  console.log('🎨 Theme Update:', { 
    settingsDarkMode: settings.darkMode,
    themeIsDark: isDarkMode,
    appliedTheme: theme 
  });
  
  if (settings.darkMode !== isDarkMode) {
    setTheme(settings.darkMode ? 'dark' : 'light');
  }
}, [settings.darkMode, isDarkMode]);
```

#### 3. 애니메이션이 비활성화되지 않는 문제
**증상**: "애니메이션 효과" 토글 off 후에도 애니메이션 지속

**원인 분석**:
- CSS 변수 업데이트 누락
- 하드코딩된 애니메이션 duration
- 조건부 클래스 적용 실패

**해결 방법**:
```css
/* CSS 변수 사용으로 통일 */
.animated-element {
  animation-duration: var(--animation-duration, 0.3s);
  transition-duration: var(--transition-duration, 0.2s);
}

/* 조건부 클래스 적용 */
.settings-slide-in-right {
  animation: settingsSlideInRight var(--animation-duration) ease-out;
}
```

#### 4. IPC 통신 실패
**증상**: "electronAPI is not defined" 에러

**원인 분석**:
- 프리로드 스크립트 로드 실패
- contextBridge 설정 문제
- 웹 환경에서 Electron API 호출

**해결 방법**:
```typescript
// 안전한 API 호출
const useElectronAPI = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);
  
  useEffect(() => {
    const isElectronEnv = window?.process?.versions?.electron;
    setIsElectron(!!isElectronEnv);
    
    if (isElectronEnv && window.electronAPI) {
      setElectronAPI(window.electronAPI);
    }
  }, []);
  
  return { isElectron, electronAPI };
};
```

### 디버깅 도구

#### 1. 개발자 도구 활용
```typescript
// 전역 디버그 객체 등록
if (process.env.NODE_ENV === 'development') {
  (window as any).debugLoop = {
    settings: () => useSettings(),
    theme: () => useTheme(),
    memory: () => window.electronAPI?.memory.getInfo(),
    logs: () => console.log('Debug info printed')
  };
}
```

#### 2. 로깅 시스템
```typescript
// 구조화된 로그
const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️ [${new Date().toISOString()}] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`❌ [${new Date().toISOString()}] ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${new Date().toISOString()}] ${message}`, data || '');
    }
  }
};
```

## 🚀 배포 및 빌드 최적화

### 빌드 설정
```json
// package.json 스크립트
{
  "scripts": {
    "dev": "concurrently \"npm run dev:next\" \"npm run dev:electron\"",
    "dev:next": "next dev",
    "dev:electron": "tsc -p tsconfig.main.json && electron .",
    "build": "npm run build:next && npm run build:main",
    "build:next": "next build",
    "build:main": "tsc -p tsconfig.main.json",
    "dist": "npm run build && electron-builder"
  }
}
```

### Electron Builder 설정
```json
// electron-builder.json
{
  "appId": "com.loop.typing-analyzer",
  "productName": "Loop Typing Analyzer",
  "directories": {
    "output": "dist"
  },
  "files": [
    "build/**/*",
    "out/**/*",
    "!**/node_modules/**/*",
    "!src/**/*"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "hardenedRuntime": true,
    "entitlements": "build/entitlements.mac.plist"
  },
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  }
}
```

---

**마지막 업데이트**: 2025년 6월 15일  
**버전**: v6.0.0  
**문서 타입**: 기술 세부사항 및 트러블슈팅
