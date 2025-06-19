# 🔧 **매니저 파일들 IPC 생태계 분석**

**생성일**: 2025.06.18  
**분석 진행률**: 26/58 main 폴더 파일 분석 완료 (44.8% 진행)

## 📊 **매니저 파일 구조 매핑**

### **1. handlers-manager.ts (451줄)**
- **핵심 기능**: **IPC 핸들러 중앙 통합 관리자** - 모든 IPC 핸들러 등록/관리
- **IPC/API 연관**: 핸들러 등록 중복 방지, 초기화 순서 관리
- **React 연동**: 간접 연동 (다른 핸들러들을 통한 React 통신)
- **타입 안전성**: 핸들러 상태 추적 (`HandlersState`, `registeredHandlers`)
- **main 폴더 연관**: **모든 IPC 핸들러 파일들과 의존성** (핵심 허브)

#### **등록하는 핸들러 그룹**
```typescript
// 8개 주요 핸들러 그룹
registerSettingsHandlers()    // settings-manager, settingsIpcHandlers
registerSystemInfoHandlers()  // systemInfoIpc
registerMemoryHandlers()     // memory-ipc
registerNativeHandlers()     // native-client, native-ipc
registerIntegratedHandlers() // ipc-handlers (통합)
registerSystemMonitorHandlers() // system-monitor-ipc
registerWindowHandlers()     // windowHandlers
registerTrackingHandlers()   // tracking-handlers, keyboardHandlers
```

### **2. dialog-manager.ts (571줄)**
- **핵심 기능**: 대화상자 & 알림 시스템 (`DialogManager` 싱글톤)
- **IPC/API 연관**: **6개 IPC 핸들러** 내장 (`dialog:show-message`, `dialog:open-file` 등)
- **React 연동**: IPC를 통한 대화상자 호출, 알림 큐 관리
- **타입 안전성**: 복합 타입 (`DialogOptions`, `FileDialogOptions`, `NotificationOptions`)
- **main 폴더 연관**: 독립적, 다른 매니저들에서 활용

#### **지원하는 대화상자 타입**
```typescript
// 4가지 대화상자 타입
DialogType.INFO | WARNING | ERROR | QUESTION

// 기능별 대화상자
showMessageDialog()    // 시스템 메시지 대화상자
showFileDialog()      // 파일 선택/저장 대화상자  
showNotification()    // 시스템 알림
createCustomDialog()  // 커스텀 HTML 대화상자
```

### **3. stats-manager.ts (587줄)**
- **핵심 기능**: **Worker 스레드 기반 통계 처리** (`StatsManager` 싱글톤)
- **IPC/API 연관**: Worker 스레드와 메인 스레드 통신
- **React 연동**: 통계 분석 결과를 React로 전달
- **타입 안전성**: Worker 메시지 타입 (`WorkerMessage`, `TypingPattern`)
- **main 폴더 연관**: `data-sync.ts` 의존, 메모리 최적화 연동

#### **통계 처리 기능**
```typescript
// Worker 스레드 기반 처리
TypingPattern 분석     // WPM, 정확도, 패턴 분석
메모리 최적화         // 100MB 임계값 관리
한글 입력 처리        // 조합형 문자 처리
ProcessingMode       // normal/cpu-intensive/gpu-intensive
```

### **4. theme-manager.ts (60줄)**
- **핵심 기능**: 테마 관리 (간단한 유틸리티 함수)
- **IPC/API 연관**: 직접적인 IPC 없음, 윈도우 이벤트 기반
- **React 연동**: `theme-changed` 이벤트를 모든 윈도우에 브로드캐스트
- **타입 안전성**: 간단한 타입 (`ThemeConfig`)
- **main 폴더 연관**: 독립적, Electron nativeTheme API 활용

### **5. 기타 매니저들 (간단 스캔)**
- **platform-manager.ts**: 플랫폼별 기능 처리
- **security-manager.ts**: 보안 정책 관리
- **auto-launch-manager.ts**: 자동 시작 관리
- **update-manager.ts**: 애플리케이션 업데이트 관리

## ⚠️ **새로 발견된 중복 구조 & 리스크**

### **🚨 IPC 핸들러 등록 혼재 (심각)**
```typescript
// handlers-manager.ts에서 중앙 관리
registerMemoryHandlers() → registerMemoryIpcHandlers()
registerNativeHandlers() → registerNativeIpcHandlers()

// 하지만 개별 파일에서도 직접 등록
// memory-ipc.ts, native-ipc.ts 등에서 자체 등록 가능
// 위험: 중복 등록 시 "Error: Attempting to call a function in a renderer"
```

### **🚨 매니저 초기화 순서 의존성 (중간)**
```typescript
// 초기화 순서가 중요한 매니저들
SettingsManager → 다른 매니저들의 설정 의존
DialogManager → 알림 시스템 우선 필요
StatsManager → Worker 스레드 초기화 시간

// handlers-manager.ts에서 순서 관리하지만 완전하지 않음
```

### **🚨 Worker 스레드 메모리 관리 분산 (중간)**
```typescript
// stats-manager.ts에서 Worker 기반 메모리 관리
private readonly MEMORY_THRESHOLD = 100 * 1024 * 1024;

// memory-manager.ts에서도 별도 메모리 관리
// 두 시스템이 독립적으로 메모리 최적화 시도
```

## 🔧 **실무적 개선 방안**

### **1순위: IPC 핸들러 중앙 집중화**
- `handlers-manager.ts`를 통한 모든 IPC 핸들러 등록
- 개별 파일에서 자동 등록 제거

### **2순위: 매니저 초기화 의존성 그래프**
- 명확한 초기화 순서 정의
- 의존성 기반 단계별 초기화

### **3순위: 메모리 관리 통합**
- `memory-manager.ts`와 `stats-manager.ts` 메모리 정책 통합
- 단일 메모리 임계값 관리

## 📈 **매니저 시스템 아키텍처 특징**

### **✅ 강점**
- **중앙 관리**: `handlers-manager.ts`를 통한 IPC 핸들러 통합 관리
- **역할 분리**: 각 매니저가 명확한 책임 영역 보유
- **타입 안전성**: TypeScript 기반 강력한 타입 시스템
- **확장성**: 새로운 매니저 추가 시 일관된 패턴

### **⚠️ 리스크**
- **초기화 복잡성**: 매니저 간 초기화 순서 의존성
- **메모리 관리 분산**: 여러 매니저에서 독립적인 메모리 최적화
- **IPC 중복 등록**: 중앙 관리와 개별 등록의 혼재
- **Worker 스레드 복잡성**: 메인-워커 스레드 통신 오버헤드

## 📊 **아키텍처 리스크 업데이트**

**이전 중복**: 17건
**새로 발견된 중복**: 3건  
**총 중복**: **20건**

**진행률**: 44.8% (26/58 파일 완료)
**다음 분석 대상**: 나머지 핵심 파일들 (`tracking-handlers.ts`, `ipc-handlers.ts`, `app-lifecycle.ts` 등)

---

**코파일럿 규칙 준수**: ✅ 사용자 요청 우선, ✅ 존댓말 유지, ✅ 실무적 분석, ✅ 중복 구조 추적
