# Native & Database 파일 분석 결과

**분석 시간**: 2025년 6월 18일  
**진행률**: 17/58 main 폴더 파일 분석 완료 (29.3% 진행)

## 📊 Native 관련 파일 구조 & 기능 매핑

### **16. native-client.ts (463줄)**
- **핵심 기능**: NAPI 네이티브 모듈 클라이언트 (`NativeModuleClient` 싱글톤)
- **IPC/API 연관**: 5개 IPC 핸들러 (`native:isNativeModuleAvailable`, `native:getNativeModuleVersion`, `native:getNativeModuleInfo`, `native:getStatus`, `native:getInfo`)
- **React 연동**: IPC 응답을 통한 네이티브 모듈 상태 조회, `success/error` 응답 구조
- **타입 안전성**: 엄격한 타입 정의 (`MemoryUsage`, `GpuInfo`, `SystemInfo`, `ModuleStatus` 인터페이스)
- **main 폴더 연관**: `native-ipc.ts`와 기능 중복, `memory-manager.ts`에서 의존

**주요 기능**:
- 네이티브 모듈 로딩 (index.js 방식)
- 메모리/GPU/시스템 정보 조회
- 모듈 상태 관리 및 오류 처리

### **17. native-ipc.ts (542줄)**
- **핵심 기능**: 종합 네이티브 모듈 IPC 핸들러 (27개 핸들러)
- **IPC/API 연관**: CHANNELS 기반 체계적 IPC 관리 (메모리, GPU, 워커, 유틸리티)
- **React 연동**: `createSuccessResponse/createErrorResponse` 통합 타입 시스템
- **타입 안전성**: `IpcResponse<T>` 제네릭, `safeNativeCall` 래퍼, 안전한 JSON 파싱
- **main 폴더 연관**: **중복 감지**: `native-client.ts`와 일부 기능 중복

**주요 기능**:
- 네이티브 모듈 로딩 (.node/.dylib/.so 직접 방식)
- 27개 IPC 핸들러 (메모리 7개, GPU 4개, 시스템 6개, 워커 7개, 유틸 10개)
- 타입 안전한 에러 처리

## 📊 Database 관련 파일 구조 & 기능 매핑

### **18. database.ts (712줄)**
- **핵심 기능**: SQLite 데이터베이스 관리자 (`DatabaseManager`)
- **IPC/API 연관**: 타이핑 로그 저장, 통계 조회 (IPC용 메서드 제공)
- **React 연동**: `saveTypingLog`, `getStats` 메서드를 통한 데이터 저장/조회
- **타입 안전성**: 복합 타입 (`KeystrokeData`, `TypingSession`, `SystemMetric`, `DatabaseStats`)
- **main 폴더 연관**: `system-monitor.ts`에서 의존, AppConfig 연동

**주요 기능**:
- SQLite 데이터베이스 초기화 (WAL 모드, 캐시 최적화)
- 3개 테이블 관리 (keystrokes, sessions, system_metrics)
- 데이터 CRUD 및 통계 조회
- 백업/복원 기능
- 자동 정리 (키스트로크 7일, 세션 90일, 메트릭 30일)

## ⚠️ 중복 구조 & 아키텍처 리스크

### **중복 감지 (13건 → 15건)**

#### **8. Native 모듈 로딩 중복**
```typescript
// native-client.ts (라인 88-156)
private loadModule(): void {
  // index.js를 통한 네이티브 모듈 로드
  const indexPath = path.join(modulePath, 'index.js');
  this.module = require(indexPath) as NativeModule;
}

// native-ipc.ts (라인 120-180)
async function loadNativeModule(): Promise<void> {
  // .node/.dylib/.so 파일 직접 로드
  const moduleFileName = process.platform === 'win32' ? 
    'native_modules.node' : 'libnative_modules.dylib';
}
```

#### **9. IPC 핸들러 중복 위험**
```typescript
// native-client.ts에서 등록하는 핸들러들
'native:isNativeModuleAvailable'
'native:getNativeModuleVersion'
'native:getNativeModuleInfo'

// native-ipc.ts에서 등록하는 핸들러들  
CHANNELS.NATIVE_IS_AVAILABLE          // 동일 기능
CHANNELS.NATIVE_GET_MODULE_VERSION    // 동일 기능
CHANNELS.NATIVE_GET_MODULE_INFO       // 동일 기능
```

### **실무적 리스크**

#### **Native 모듈 로딩 충돌**
- **두 가지 로딩 방식**: index.js vs 직접 바이너리 로딩
- **초기화 순서 문제**: 두 로더가 동시에 실행될 가능성
- **메모리 누수 위험**: 같은 모듈이 두 번 로드될 수 있음

#### **IPC 채널 충돌**
- **동일 기능 중복 등록**: 같은 기능의 핸들러가 다른 채널명으로 등록
- **응답 형식 불일치**: `success/error` vs `IpcResponse<T>` 형식 차이
- **에러 처리 불일치**: 각각 다른 에러 핸들링 방식

#### **데이터베이스 단일화**
- **긍정적**: 데이터베이스는 단일 관리자로 중복 없음
- **주의사항**: SQLite WAL 모드 사용으로 동시성 고려 필요

## 🔧 다음 단계 권장사항

### **즉시 해결 필요 (1순위)**
1. **Native 로딩 통합**: 단일 로딩 방식으로 통합
2. **IPC 핸들러 정리**: 중복 채널 제거 및 표준화

### **아키텍처 개선 (2순위)**
1. **Native 모듈 패턴 표준화**: 단일 클라이언트 + IPC 핸들러 분리
2. **에러 응답 형식 통일**: `IpcResponse<T>` 형식으로 표준화

### **성능 최적화 (3순위)**
1. **데이터베이스 인덱스 최적화**: 쿼리 성능 향상
2. **메모리 사용량 모니터링**: Native 모듈 메모리 관리

## 📈 진행 현황

**완료된 분석**: 18/58 파일 (31.0%)
**발견된 중복**: 15건
**다음 목표**: Window 관리 파일들 분석

---

**업데이트 시간**: 2025.06.18.현재시각
