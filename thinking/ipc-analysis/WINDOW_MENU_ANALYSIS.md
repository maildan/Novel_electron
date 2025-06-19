# 🪟 **Window & Menu 관리 파일들 IPC 생태계 분석**

**생성일**: 2025.06.18  
**분석 진행률**: 22/58 main 폴더 파일 분석 완료 (37.9% 진행)

## 📊 **Window & Menu 파일 구조 매핑**

### **1. window.ts (326줄)**
- **핵심 기능**: 메인 윈도우 관리 (`WindowManager` 싱글톤)
- **IPC/API 연관**: 직접적인 IPC 핸들러 없음, WindowHandlers에서 사용
- **React 연동**: 윈도우 생성/제어, CSP 헤더 후킹 (개발 모드)
- **타입 안전성**: TypeScript 엄격, AppConfig 의존성
- **main 폴더 연관**: `windowHandlers.ts`와 밀접한 연동

#### **주요 기능 그룹**
```typescript
// 1. 윈도우 생성 & 초기화
createMainWindow() // 디스플레이 정보 기반 크기 계산
setupWindowEventListeners() // 윈도우 이벤트 처리

// 2. 윈도우 제어
focusMainWindow(), hideMainWindow(), closeMainWindow()
getWindowInfo() // 모든 윈도우 정보 조회

// 3. 보안 & 개발자 기능
CSP 헤더 후킹 (Turbopack 호환성)
외부 링크 차단, 네비게이션 제한
개발자 도구 자동 열기 (detach 모드)
```

### **2. windowHandlers.ts (441줄)**
- **핵심 기능**: 윈도우 IPC 핸들러 전문 관리
- **IPC/API 연관**: **9개 IPC 핸들러** (윈도우 모드, 상태, 크기, 투명도 등)
- **React 연동**: 윈도우 상태 브로드캐스트 (`window-status-update`)
- **타입 안전성**: 복합 타입 정의 (`WindowStatusInfo`, `WindowBounds`)
- **main 폴더 연관**: `window.ts`, `settings-manager.ts`, `constants.ts` 의존

#### **IPC 핸들러 그룹별 분류**
```typescript
// 윈도우 모드 관리 (4개)
setWindowMode // windowed, fullscreen, maximized
setWindowBounds // 크기/위치 설정
setWindowOpacity // 투명도 설정  
setAlwaysOnTop // 항상 위에 설정

// 윈도우 제어 (4개)
minimizeWindow, maximizeWindow, closeWindow, focusWindow

// 윈도우 정보 (1개)
getWindowStatus // 현재 윈도우 상태 조회
```

### **3. menu-manager.ts (736줄)**
- **핵심 기능**: 네이티브 메뉴 시스템 관리 (`MenuManager` 싱글톤)
- **IPC/API 연관**: 메뉴 액션을 IPC로 전송 (`sendMenuAction`)
- **React 연동**: 메뉴 클릭 시 React 컴포넌트에 액션 전달
- **타입 안전성**: 메뉴 옵션 인터페이스 (`MenuOptions`, `MenuActionPayload`)
- **main 폴더 연관**: 독립적이지만 다른 매니저들과 연동

#### **메뉴 구조**
```typescript
// 플랫폼별 메뉴 (macOS/Windows/Linux)
createAppMenu() // macOS 앱 메뉴
createFileMenu() // 파일 열기, 저장, 최근 파일
createEditMenu() // 실행취소, 복사, 붙여넣기  
createViewMenu() // 새로고침, 줌, 전체화면
createWindowMenu() // 최소화, 닫기
createHelpMenu() // 온라인 도움말, 피드백

// 메뉴 액션 타입
'open-settings' | 'file-opened' | 'save' | 'save-as' 
| 'toggle-mini-view' | 'check-updates'
```

### **4. menu.ts (723줄) - 이전 분석**
- **핵심 기능**: 애플리케이션 메뉴 구성 (`createMenu` 함수)
- **IPC/API 연관**: 메뉴 클릭 시 IPC 이벤트 발송
- **React 연동**: 메뉴 액션을 React로 전달
- **타입 안전성**: Electron Menu 타입 활용
- **main 폴더 연관**: `menu-manager.ts`와 **중복 기능**

## ⚠️ **새로 발견된 중복 구조 & 리스크**

### **🚨 메뉴 시스템 중복 (심각)**
```typescript
// 중복 1: menu.ts (723줄)
export function createMenu(): Menu // 전체 메뉴 구성
createFileMenu(), createEditMenu(), createViewMenu() // 개별 메뉴

// 중복 2: menu-manager.ts (736줄)  
class MenuManager {
  createApplicationMenu() // 동일한 메뉴 구성
  createFileMenu(), createEditMenu(), createViewMenu() // 동일한 개별 메뉴
}

// 위험: 거의 동일한 메뉴 생성 로직이 2벌로 존재
```

### **🚨 윈도우 관리 분산 (중간)**
```typescript
// window.ts - 윈도우 생성/관리
class WindowManager {
  createMainWindow()
  getWindowInfo()
}

// windowHandlers.ts - 윈도우 IPC 처리
registerWindowHandlers() // 9개 IPC 핸들러
applyWindowMode(), setWindowBounds()

// 관리 포인트가 분산되어 있으나 역할은 명확히 구분됨
```

### **🚨 Settings Manager 의존성 혼재 (중간)**
```typescript
// windowHandlers.ts에서
import SettingsManager from './settings-manager';

// 다른 파일들에서도 SettingsManager 직접 import
// 설정 관리의 중앙 집중화 부족
```

## 🔧 **실무적 개선 방안**

### **1순위: 메뉴 시스템 통합**
- `menu.ts`와 `menu-manager.ts` 중복 제거
- 단일 메뉴 관리자로 통합

### **2순위: 윈도우 이벤트 표준화**
- 윈도우 상태 변경 시 일관된 브로드캐스트
- 중앙집중식 윈도우 상태 관리

### **3순위: 설정 의존성 정리**
- SettingsManager 의존성 명확화
- 설정 변경 시 연쇄 반응 관리

## 📈 **Window & Menu 아키텍처 특징**

### **✅ 강점**
- **플랫폼 대응**: macOS/Windows/Linux 메뉴 차이 적절히 처리
- **타입 안전성**: TypeScript로 메뉴 옵션 및 윈도우 상태 타입화
- **이벤트 기반**: 윈도우 상태 변경 시 브로드캐스트 패턴

### **⚠️ 리스크**
- **메뉴 중복**: 거의 동일한 메뉴 생성 로직 2벌
- **의존성 분산**: 여러 파일에서 직접적인 SettingsManager 의존
- **상태 동기화**: 윈도우 상태 변경 시 일부 누락 가능성

## 📊 **아키텍처 리스크 업데이트**

**이전 중복**: 15건
**새로 발견된 중복**: 2건  
**총 중복**: **17건**

**진행률**: 37.9% (22/58 파일 완료)
**다음 분석 대상**: 나머지 매니저 파일들 (`dialog-manager.ts`, `stats-manager.ts`, `platform-manager.ts` 등)

---

**코파일럿 규칙 준수**: ✅ 사용자 요청 우선, ✅ 존댓말 유지, ✅ 실무적 분석, ✅ 중복 구조 추적
