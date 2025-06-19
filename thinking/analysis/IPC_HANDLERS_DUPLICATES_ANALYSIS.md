# 🔍 **IPC 핸들러 중복 구조 분석**

## 📊 **발견된 IPC 핸들러 중복 (8건)**

### **1. Settings IPC 핸들러 3중 중복**
```typescript
// settings-ipc-handlers.ts (345줄)
export class SettingsIpcHandlers {
  register(): void // setProcessingMode 등록
}

// settingsIpcHandlers.ts (405줄) 
export class SettingsIpcHandlers {
  register(): void // 동일한 setProcessingMode 등록
}

// settings-manager.ts (823줄)
setupIpcHandlers() // 또 다른 settings 핸들러 등록
```

### **2. Native IPC 핸들러 중복**
```typescript
// native-ipc.ts (현재 버전, 456줄)
export function registerNativeIpcHandlers() // 27개 핸들러

// backup/native-ipc.ts (백업 버전, 500줄)
export function registerNativeIpcHandlers() // 27개 동일 핸들러
```

### **3. Memory IPC 핸들러 중복**
```typescript
// memory-ipc.ts
export function registerMemoryIpcHandlers() // 4개 채널

// system-monitor-ipc.ts
ipcMain.handle(CHANNELS.GET_MEMORY_USAGE) // 동일 기능
ipcMain.handle(CHANNELS.OPTIMIZE_MEMORY)  // 동일 기능
```

### **4. 핸들러 등록 관리자 중복**
```typescript
// handlers-manager.ts
export async function setupAllHandlers()

// backup 파일들
async function setupIPCHandlers()  
async function setupAllIpcHandlers()

// Loop 3
function setupAllHandlers() // handlers/index.js
```

### **5. IPC 핸들러 클래스 중복**
```typescript
// ipc-handlers.ts
export class IpcHandlers {
  register(): void // 통합 핸들러
}

// Loop 3: ipc-handlers.js  
function setupIpcHandlers() // 동일 기능
```

### **6. 시스템 정보 핸들러 중복**
```typescript
// systemInfoIpc.ts
export function registerSystemInfoIpcHandlers()

// system-info.ts
function setupSystemInfoIpcHandlers() // 동일 기능
```

### **7. 핸들러 중복 등록 방지 로직 혼재**
```typescript
// handlers-manager.ts
if (handlersState.registeredHandlers.has('settings')) return;

// Loop 3
if (!ipcMain.listenerCount('load-settings')) {
  ipcMain.handle('load-settings', ...)
}

// settings-ipc-handlers.ts
if (this.isRegistered) return;
```

### **8. 초기화 함수 중복**
```typescript
// backup 파일들
registerNativeIpcHandlers(); // 직접 호출

// handlers-manager.ts  
registerNativeHandlers(); // 래퍼 함수 통해 호출
```

## ⚠️ **실무적 리스크**

### **IPC 채널 충돌 (Critical)**
- **동일 채널 중복 등록**: `CHANNELS.MEMORY_GET_INFO` 등
- **Error**: "Attempting to call a function in a renderer" 
- **런타임 크래시**: 예상치 못한 핸들러 동작

### **메모리 누수**
- 중복 등록된 핸들러들이 GC에서 정리되지 않음
- **EventEmitter memory leak** 경고 발생

### **코드베이스 분산**
- **8개 파일**에 동일한 IPC 등록 로직 분산
- 수정 시 모든 파일 동기화 필요

### **성능 저하**  
- 불필요한 핸들러 등록으로 초기화 시간 증가
- 중복 이벤트 처리로 CPU 사용량 증가

---

## 🔧 **해결 방안**

### **1순위: 중복 핸들러 제거**
- **settings 3중 중복**: settings-manager.ts로 단일화
- **backup 파일들**: native-ipc 백업 버전 삭제

### **2순위: 중앙 등록 관리**
- **handlers-manager.ts**에서만 등록
- 개별 파일에서 직접 등록 금지

### **3순위: 채널 네임스페이스 정리**
- 중복 채널명 정리 및 표준화
- CHANNELS 상수 파일 단일화

### **4순위: 등록 상태 추적 시스템**
- 전역 등록 상태 관리
- 중복 등록 시 자동 감지 및 경고
