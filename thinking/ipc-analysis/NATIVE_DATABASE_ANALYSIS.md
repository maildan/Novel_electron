# 🗄️ **Native & Database 파일들 IPC 생태계 분석**

**생성일**: 2025.06.18  
**분석 진행률**: 18/58 main 폴더 파일 분석 완료 (31.0% 진행)

## 📊 **Native & Database 파일 구조 매핑**

### **1. database.ts (854줄)**
- **핵심 기능**: SQLite 기반 종합 데이터베이스 관리 (`DatabaseManager`)
- **IPC/API 연관**: 직접적인 IPC 핸들러 없음, 다른 서비스에서 import하여 사용
- **React 연동**: 간접 연동 (타이핑 세션, 키스트로크, 시스템 메트릭 저장/조회)
- **타입 안전성**: 복합 인터페이스 (`KeystrokeData`, `TypingSession`, `SystemMetric`, `DatabaseStats`)
- **main 폴더 연관**: `system-monitor.ts`, `memory-manager.ts`에서 의존성으로 사용

#### **주요 기능 그룹**
```typescript
// 1. 데이터베이스 초기화 & 테이블 관리
createTables() // keystrokes, sessions, system_metrics 테이블
initialize() // WAL 모드, 캐시 최적화

// 2. 데이터 저장 (배치 처리 지원)
saveKeystroke(), saveKeystrokes() // 키스트로크 데이터
saveTypingSession() // 타이핑 세션
saveSystemMetric() // 시스템 메트릭

// 3. 데이터 조회 & 통계
getRecentTypingSessions(), getStatistics()
getStats() // IPC용 통계 조회
exportData(), importData() // 데이터 백업/복원

// 4. 데이터베이스 관리
cleanup() // 30일/90일/7일 기준 자동 정리
healthCheck() // 상태 확인
```

### **2. native-client.ts (452줄)**
- **핵심 기능**: NAPI 네이티브 모듈 클라이언트 (`NativeModuleClient` 싱글톤)
- **IPC/API 연관**: 자체 IPC 핸들러 등록 (`registerNativeIpcHandlers`)
- **React 연동**: IPC를 통한 네이티브 기능 노출 (메모리, GPU, 시스템 정보)
- **타입 안전성**: 네이티브 모듈 인터페이스 완전 타입 정의 (`MemoryUsage`, `GpuInfo`, `SystemInfo`)
- **main 폴더 연관**: `memory.ts`, `memory-manager.ts`에서 네이티브 기능 활용

#### **네이티브 모듈 로딩 전략**
```typescript
// 경로 우선순위 (개발/프로덕션 모드별)
possibleBasePaths = [
  'dist/native-modules',    // 빌드된 모듈
  'native-modules',         // 소스 모듈  
  '../../native-modules'    // 상위 디렉토리
]

// 안전한 네이티브 함수 호출
getMemoryUsage(), startMemoryMonitoring()
getGpuInfo(), getSystemInfo()
generateUuid(), getTimestamp()
```

### **3. native-ipc.ts (873줄)**
- **핵심 기능**: 네이티브 모듈 전용 IPC 핸들러 관리
- **IPC/API 연관**: **37개 IPC 채널** 등록 (메모리, GPU, 시스템, 워커, 유틸리티)
- **React 연동**: 통합 IPC 타입 시스템 (`IpcResponse`, `createSuccessResponse`)
- **타입 안전성**: 엄격한 타입 가드, 안전한 네이티브 호출 래퍼 (`safeNativeCall`)
- **main 폴더 연관**: `memory-ipc.ts`와 기능 중복, `handlers-manager.ts`에서 관리

#### **IPC 채널 그룹별 분류**
```typescript
// 메모리 관련 (7개)
CHANNELS.NATIVE_GET_MEMORY_USAGE
CHANNELS.NATIVE_START_MEMORY_MONITORING  
CHANNELS.NATIVE_OPTIMIZE_MEMORY
CHANNELS.NATIVE_CLEANUP_MEMORY

// GPU 관련 (4개)
CHANNELS.NATIVE_GET_GPU_INFO
CHANNELS.NATIVE_RUN_GPU_ACCELERATION
CHANNELS.NATIVE_RUN_GPU_BENCHMARK

// 워커 관련 (7개)
CHANNELS.NATIVE_ADD_WORKER_TASK
CHANNELS.NATIVE_GET_WORKER_STATS
CHANNELS.NATIVE_EXECUTE_CPU_TASK

// 유틸리티 관련 (19개)
CHANNELS.NATIVE_CALCULATE_FILE_HASH
CHANNELS.NATIVE_GENERATE_UUID
CHANNELS.NATIVE_VALIDATE_JSON
```

## ⚠️ **새로 발견된 중복 구조 & 리스크**

### **🚨 Native 모듈 관리 중복 (심각)**
```typescript
// 중복 1: native-client.ts
export const nativeClient = new NativeModuleClient();
nativeClient.getMemoryUsage() // 네이티브 메모리 조회

// 중복 2: native-ipc.ts  
let nativeModule: NativeModule | null = null;
safeNativeCall('getMemoryUsage') // 동일한 네이티브 함수 호출

// 충돌 위험: 두 곳에서 독립적으로 네이티브 모듈 로딩
```

### **🚨 메모리 IPC 채널 중복 (심각)**
```typescript
// memory-ipc.ts에서 등록
CHANNELS.MEMORY_GET_INFO
CHANNELS.MEMORY_OPTIMIZE  
CHANNELS.MEMORY_CLEANUP

// native-ipc.ts에서 등록 
CHANNELS.NATIVE_GET_MEMORY_USAGE
CHANNELS.NATIVE_OPTIMIZE_MEMORY
CHANNELS.NATIVE_CLEANUP_MEMORY

// 위험: 유사한 기능의 IPC 채널이 2벌로 존재
```

### **🚨 데이터베이스 의존성 분산 (중간)**
```typescript
// database.ts는 IPC 없이 직접 import
import { DatabaseManager } from './database';

// 여러 파일에서 DatabaseManager 직접 생성
// 싱글톤 패턴 부재로 인한 다중 인스턴스 위험
```

## 🔧 **실무적 개선 방안**

### **1순위: Native 모듈 통합**
- `native-client.ts`와 `native-ipc.ts` 중복 제거
- 단일 네이티브 모듈 매니저로 통합

### **2순위: IPC 채널 정리**
- 메모리 관련 IPC 채널 중복 해결
- 기능별 명확한 채널 분리

### **3순위: Database 싱글톤 패턴**
- `DatabaseManager` 싱글톤 보장
- IPC 기반 데이터베이스 서비스 분리

## 📈 **아키텍처 리스크 업데이트**

**이전 중복**: 12건
**새로 발견된 중복**: 3건  
**총 중복**: **15건**

**진행률**: 31.0% (18/58 파일 완료)
**다음 분석 대상**: Window 관리 파일들 (`window-manager.ts`, `window-state.ts`, `window-ipc.ts`)

---

**코파일럿 규칙 준수**: ✅ 사용자 요청 우선, ✅ 존댓말 유지, ✅ 실무적 분석, ✅ 중복 구조 추적
