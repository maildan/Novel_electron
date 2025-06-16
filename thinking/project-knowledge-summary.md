# Loop_6 프로젝트 전체 기억 및 지식 정리

## 📋 프로젝트 개요
**Loop_6**는 타이핑 분석 및 모니터링을 위한 Electron 기반 데스크톱 애플리케이션입니다.

### 기본 정보
- **프레임워크**: Next.js + Electron
- **UI 라이브러리**: Tailwind CSS + Lucide React Icons
- **언어**: TypeScript
- **데이터베이스**: Prisma + SQLite
- **상태 관리**: React Context + Custom Hooks
- **빌드 도구**: Webpack + TypeScript Compiler

## 🏗️ 프로젝트 구조

### 주요 디렉토리
```
loop_6/
├── src/
│   ├── app/                    # Next.js 앱 라우터 및 UI 컴포넌트
│   ├── main/                   # Electron 메인 프로세스
│   ├── preload/                # Electron 프리로드 스크립트
│   ├── types/                  # TypeScript 타입 정의
│   ├── hooks/                  # React 커스텀 훅
│   └── utils/                  # 유틸리티 함수
├── prisma/                     # 데이터베이스 스키마 및 마이그레이션
├── public/                     # 정적 파일
├── build/                      # 빌드 산출물
├── thinking/                   # 개발 기록 및 문서
└── assets/                     # 앱 아이콘 등 리소스
```

## 🔧 기술 스택 세부사항

### Frontend (Renderer Process)
- **Next.js 14**: App Router 사용
- **React 18**: 함수형 컴포넌트 + Hooks
- **TypeScript**: 엄격한 타입 체킹
- **Tailwind CSS**: 유틸리티 우선 스타일링
- **Lucide React**: 아이콘 라이브러리

### Backend (Main Process)
- **Electron**: 데스크톱 앱 프레임워크
- **Node.js**: 시스템 API 접근
- **Prisma**: ORM 및 데이터베이스 관리
- **SQLite**: 로컬 데이터베이스
- **electron-store**: 설정 저장소

### IPC 통신
- **contextBridge**: 보안이 강화된 API 노출
- **ipcMain/ipcRenderer**: 프로세스 간 통신
- **채널 기반 통신**: 구조화된 메시지 전달

## 🏛️ 아키텍처 패턴

### 1. 모듈화된 설계
- **설정 관리**: `settings-manager.ts` 중앙집중식 관리
- **메모리 관리**: `memory-manager.ts` + `memory-ipc.ts`
- **IPC 핸들러**: 기능별 분리 (`ipc-handlers.ts`, `settings-ipc-handlers.ts`)
- **프리로드 모듈화**: `api.ts`, `channels.ts`, `styles.ts`로 분리

### 2. 타입 안전성
- **공유 타입**: `types/settings.ts`에서 FE/BE 타입 통일
- **IPC 채널**: `channels.ts`에서 중앙 관리
- **설정 검증**: `validateSettings()` 함수로 데이터 무결성 보장

### 3. 상태 관리
- **설정 상태**: `useSettings` 훅으로 전역 관리
- **테마 관리**: `ThemeProvider` + `useTheme` 훅
- **로컬 상태**: 각 컴포넌트별 `useState` 사용

## 🔑 핵심 기능

### 1. 타이핑 분석
- 실시간 WPM, 정확도 측정
- 키스트로크 패턴 분석
- 카테고리별 분류 (문서, 오피스, 코딩, SNS)
- 통계 데이터 수집 및 시각화

### 2. 시스템 모니터링
- CPU, 메모리, 디스크 사용량 모니터링
- 성능 메트릭 수집
- 메모리 최적화 기능
- 백그라운드 프로세스 관리

### 3. 설정 관리
- 통합 설정 시스템 (electron-store + JSON 백업)
- 실시간 설정 동기화 (FE ↔ BE)
- 설정 유효성 검증
- GPU 가속화 토글
- 테마 및 다크모드 지원
- 애니메이션 on/off 제어

### 4. 데이터 관리
- SQLite 데이터베이스 (Prisma ORM)
- 데이터 내보내기/가져오기
- 자동 백업 및 정리
- 데이터 보관 기간 설정

## 🚀 최근 주요 개발 작업

### 1. 설정 시스템 리팩토링 (완료)
- **문제**: 설정이 FE/BE 간 동기화되지 않음, 다크모드 저장 안됨
- **해결**: 통합된 `useSettings` 훅으로 설정 관리 일원화
- **결과**: 모든 설정이 실시간으로 저장/로드되며 앱 재시작 후에도 유지

### 2. 프리로드 스크립트 모듈화 (완료)
- **기존**: 단일 `preload.js` 파일에 모든 API 집중
- **개선**: `api.ts`, `channels.ts`, `styles.ts`로 기능별 분리
- **장점**: 유지보수성 향상, 타입 안전성 강화

### 3. 애니메이션 제어 시스템 (완료)
- **기능**: "애니메이션 효과" 토글로 모든 UI 애니메이션 on/off
- **구현**: CSS 변수 + 조건부 클래스 적용
- **적용**: 설정 카테고리 전환, 버튼 호버 등 모든 애니메이션

### 4. 앱 재시작 기능 (완료)
- **기능**: 설정 저장 시 자동 앱 재시작 (GPU 가속화 제외)
- **구현**: `app:restart` IPC 채널 + `handleSave` 함수
- **예외**: GPU 가속화 변경 시에만 재시작 건너뜀

## 🔍 코드 품질 및 규칙

### 1. TypeScript 규칙
- **엄격 모드**: `strict: true` 설정
- **타입 안전성**: `any` 타입 최소화
- **인터페이스 우선**: `type` 대신 `interface` 선호
- **제네릭 활용**: 재사용 가능한 타입 정의

### 2. React 패턴
- **함수형 컴포넌트**: 클래스 컴포넌트 사용 금지
- **Custom Hooks**: 로직 재사용성 극대화
- **Context 최적화**: 불필요한 리렌더링 방지
- **메모이제이션**: `useCallback`, `useMemo` 적극 활용

### 3. 에러 처리
- **try-catch**: 모든 비동기 작업에 에러 처리
- **로깅**: 상세한 디버그 로그 (개발 환경)
- **사용자 피드백**: 에러 발생 시 명확한 메시지 제공

### 4. 성능 최적화
- **메모리 관리**: 불필요한 리소스 정리
- **번들 최적화**: 코드 스플리팅 및 트리 쉐이킹
- **GPU 가속**: 선택적 활성화
- **백그라운드 최적화**: 유휴 상태에서 리소스 절약

## 🐛 알려진 이슈 및 해결책

### 1. 해결된 이슈들
- ✅ **설정 저장 안됨**: useSettings 훅 리팩토링으로 해결
- ✅ **다크모드 미적용**: ThemeProvider와 설정 동기화로 해결
- ✅ **메모리 IPC 중복**: memory-manager.ts 핸들러 중복 제거
- ✅ **애니메이션 제어 안됨**: CSS 변수 + 조건부 클래스로 해결
- ✅ **데이터 보관 기간 슬라이더 안됨**: onChange 이벤트 수정으로 해결

### 2. 주의사항
- **GPU 가속화**: 시스템 호환성 이슈로 신중하게 적용
- **메모리 모니터링**: 백그라운드에서 과도한 리소스 사용 주의
- **데이터베이스**: 대량 데이터 처리 시 인덱싱 필요
- **Electron 보안**: contextBridge 사용으로 nodeIntegration 비활성화

## 📁 중요 파일 목록

### 설정 관리
- `src/main/settings-manager.ts`: 백엔드 설정 관리 핵심
- `src/hooks/useSettings.ts`: 프론트엔드 설정 훅
- `src/types/settings.ts`: 설정 타입 정의
- `src/main/constants.ts`: 기본값 및 상수

### UI 컴포넌트
- `src/app/components/ui/settings.tsx`: 설정 UI 메인
- `src/app/components/providers/ThemeProvider.tsx`: 테마 관리
- `src/app/styles/animations.css`: 애니메이션 스타일

### IPC 통신
- `src/preload/index.ts`: 프리로드 진입점
- `src/preload/api.ts`: API 정의
- `src/preload/channels.ts`: 채널 정의
- `src/main/ipc-handlers.ts`: IPC 핸들러

### 시스템 관리
- `src/main/memory-manager.ts`: 메모리 관리
- `src/main/memory-ipc.ts`: 메모리 IPC
- `src/main/main.ts`: Electron 메인 프로세스

## 🎯 향후 개발 방향

### 1. 단기 목표
- 성능 모니터링 대시보드 개선
- 타이핑 패턴 분석 알고리즘 고도화
- 데이터 시각화 차트 추가
- 키보드 레이아웃 감지 기능

### 2. 장기 목표
- 클라우드 동기화 기능
- 다중 사용자 지원
- 플러그인 시스템
- 웹 버전 개발

## 🔧 개발 환경 설정

### 필수 도구
- Node.js (16+)
- npm/yarn
- VS Code (권장)
- Git

### 실행 명령어
```bash
# 개발 서버 실행
npm run dev

# 메인 프로세스 빌드
npm run build:main

# 프로덕션 빌드
npm run build

# Electron 패키징
npm run dist
```

## 📝 개발 원칙

### 1. 코드 품질
- 가독성과 유지보수성 우선
- 테스트 가능한 구조
- 문서화된 API
- 일관된 네이밍 컨벤션

### 2. 사용자 경험
- 직관적인 UI/UX
- 빠른 응답 속도
- 안정적인 동작
- 접근성 고려

### 3. 확장성
- 모듈화된 아키텍처
- 플러그인 가능한 구조
- 설정 가능한 옵션
- 다국어 지원 준비

---

**마지막 업데이트**: 2025년 6월 15일
**작성자**: GitHub Copilot (AI Assistant)
**프로젝트 버전**: Loop_6 v6.0.0
