# 🔍 **APP LIFECYCLE 중복 구조 분석**

## 📊 **발견된 App Lifecycle 중복 (5건)**

### **1. 초기화 함수 중복**
```typescript
// app-initialization.ts
export function initializeManagers(): void
export async function initializeCoreSystem(): Promise<void>

// main-backup.ts
function initializeManagers(): void
async function initializeCoreSystem(): Promise<void>

// main-original.ts  
function initializeManagers(): void
async function initializeCoreSystem(): Promise<void>
```

### **2. App Ready 핸들러 중복**
```typescript
// main-backup.ts / main-original.ts
async function onAppReady(): Promise<void>
app.whenReady().then(onAppReady);

// app-lifecycle.ts
export async function initializeApp(): Promise<void>

// index-simple.ts
app.whenReady().then(() => {...});
```

### **3. AppState 정의 중복**
```typescript
// app-initialization.ts
export interface AppState {
  isInitialized: boolean;
  windowManager: WindowManager | null;
  // ...8개 속성
}

// backup files
const appState = {
  isReady: false;
  mainWindow: null;
  // ...동일한 속성들
}
```

### **4. 이벤트 핸들러 중복**
```typescript
// 모든 백업 파일에서 동일
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault();
  await cleanup();
});
```

### **5. Cleanup 로직 중복**
```typescript
// 여러 파일에서 동일한 cleanup 함수
async function cleanup(): Promise<void> {
  // 매니저 정리 로직
}
```

## ⚠️ **실무적 리스크**

### **초기화 순서 불일치**
- **backup 파일들**: managers → core → security → IPC → UI
- **app-lifecycle.ts**: windowManager → handlers → keyboard
- **충돌 위험**: 서로 다른 초기화 순서로 인한 의존성 문제

### **이벤트 핸들러 중복 등록**
- 같은 이벤트에 대한 여러 핸들러 등록
- Memory leak 및 예상치 못한 동작

### **코드 분산**
- 4개 파일에 동일한 로직 분산
- 수정 시 모든 파일 동기화 필요

---

## 🔧 **해결 방안**

### **1순위: 백업 파일 정리**
- main-backup.ts, main-original.ts 제거
- app-lifecycle.ts로 단일화

### **2순위: 초기화 순서 표준화**
- 의존성 그래프 기반 순서 정의
- 실패 시 롤백 메커니즘

### **3순위: AppState 타입 통합**
- types/app.ts에서 단일 정의
- 모든 파일에서 import 사용
