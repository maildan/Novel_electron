# Loop 6 현재 이슈 분석 및 해결 계획 - 2025-06-10 08:33

## 🚨 현재 발생 중인 주요 오류

### 1. TypeError: Cannot read properties of undefined (reading 'available')
**위치**: `NativeModuleStatus` 컴포넌트
**파일**: `src/app/components/ui/native-module-status.tsx`
**원인**: `uiohook` 프로퍼티가 undefined 상태에서 `available` 접근 시도

### 2. Error invoking remote method 'system:get-info'
**오류**: `No handler registered for 'system:get-info'`
**원인**: IPC 핸들러가 등록되지 않음 또는 핸들러 이름 불일치

### 3. 다크 모드 토글 미작동
**증상**: 토글 버튼 클릭해도 테마가 변경되지 않음
**원인**: ThemeProvider와 설정 시스템 간 연동 문제

### 4. 환경변수 설정 누락
```
[electron] 환경변수 ELECTRON_STATIC: undefined
[electron] 환경변수 STATIC_MODE: undefined
```

## 📋 해결 계획

### Phase 1: 환경변수 설정 (최우선)
1. `.env` 파일 환경변수 설정
2. `main.ts`에서 환경변수 로드 확인

### Phase 2: IPC 핸들러 수정
1. `system:get-info` 핸들러 등록 확인
2. `registerSystemInfoIpcHandlers()` 함수 호출 확인
3. 핸들러 이름 통일

### Phase 3: NativeModuleStatus 컴포넌트 수정
1. undefined 체크 로직 추가
2. 안전한 프로퍼티 접근 구현

### Phase 4: 다크 모드 수정
1. ThemeProvider 로직 점검
2. 설정 저장/로드 연동 확인
3. CSS 클래스 적용 확인

## 🎯 COPILOT 규칙 준수
- 한국어 응답 및 상세 로깅
- 단계별 작업 진행
- 파일 경로 정확성 확보
- 에러 즉시 해결 원칙
