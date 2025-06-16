# Electron 프로젝트 실무적 구조 개선 가이드

## 📊 현재 상황 분석

### 🚨 발견된 문제점들

1. **복잡한 초기화 프로세스**
   - main.ts 파일이 500줄 가까이 됨
   - 너무 많은 매니저들이 동시에 초기화됨
   - 윈도우 생성이 다른 시스템 초기화에 차단됨

2. **비효율적인 구조**
   - 모든 파일이 `/src/main`에 평면적으로 위치
   - 역할별/기능별 분리가 명확하지 않음
   - 의존성 관계가 복잡하게 얽혀있음

3. **디버깅 어려움**
   - 초기화 순서가 복잡함
   - 에러 발생 시 전체 앱이 멈춤
   - 어느 단계에서 문제가 발생했는지 파악하기 어려움

### 📈 현재 로그 분석
```
[electron] 윈도우 핸들러 초기화 완료
[electron] [키보드] Keyboard event listeners setup completed
// 이후 윈도우 생성 로그가 나타나지 않음 - initializeUIComponents에 도달하지 못함
```

---

## 🎯 실무적인 개선 방안

### 1. 스캐폴딩 도구 활용 (권장)

#### 1.1 Electron Forge 방식
```bash
# 새 프로젝트 생성 시 권장
npx create-electron-app@latest my-app
cd my-app
npm install

# 기존 프로젝트에 적용
npm install --save-dev @electron-forge/cli
npx electron-forge import
```

**장점:**
- 검증된 Main/Renderer/Preload 구조
- Webpack 빌드 설정 포함
- 패키징 스크립트 자동 생성
- 코드 서명 지원

#### 1.2 Electron-Vite 방식
```bash
# 새 프로젝트 생성
npm create electron-vite@latest my-app

# TypeScript + React 템플릿
npm create electron-vite@latest my-app -- --template react-ts
```

**장점:**
- 초고속 HMR (Hot Module Replacement)
- Vite 기반 경량 번들
- 중앙 집중식 설정 관리
- 모던 개발 도구 체인

### 2. 권장 프로젝트 구조

```
loop_6/
├── src/
│   ├── main/                 ← Electron Main 프로세스
│   │   ├── core/            ← 핵심 시스템 (윈도우, 앱 라이프사이클)
│   │   │   ├── app.ts       ← 메인 애플리케이션 클래스
│   │   │   ├── window.ts    ← 윈도우 관리
│   │   │   └── lifecycle.ts ← 앱 생명주기
│   │   ├── managers/        ← 기능별 매니저들
│   │   │   ├── settings/    ← 설정 관리
│   │   │   ├── keyboard/    ← 키보드 처리
│   │   │   ├── memory/      ← 메모리 관리
│   │   │   └── native/      ← 네이티브 모듈
│   │   ├── handlers/        ← IPC 핸들러들
│   │   │   ├── window.ts    ← 윈도우 관련 IPC
│   │   │   ├── system.ts    ← 시스템 정보 IPC
│   │   │   └── native.ts    ← 네이티브 모듈 IPC
│   │   └── main.ts          ← 단순한 엔트리 포인트
│   ├── preload/             ← Preload 스크립트들
│   │   ├── api/            ← API 정의들
│   │   └── preload.ts      ← 메인 preload
│   └── renderer/           ← React/Next.js UI (현재 /app)
│       └── components/
├── electron.vite.config.ts  ← Vite 설정 (electron-vite 사용 시)
└── forge.config.js         ← Forge 설정 (Electron Forge 사용 시)
```

### 3. 실무적인 Main 프로세스 구조

#### 3.1 단순한 main.ts (권장 패턴)
```typescript
// src/main/main.ts
import { app } from 'electron';
import { ElectronApp } from './core/app';

// 환경 설정
const isDev = process.env.NODE_ENV === 'development';

// 메인 애플리케이션 클래스
const electronApp = new ElectronApp({
  isDev,
  port: process.env.NEXT_PORT || '5500'
});

// 앱 이벤트 처리
app.whenReady().then(() => electronApp.initialize());
app.on('window-all-closed', () => electronApp.cleanup());
app.on('activate', () => electronApp.handleActivate());
```

#### 3.2 ElectronApp 클래스 (core/app.ts)
```typescript
// src/main/core/app.ts
export class ElectronApp {
  private windowManager: WindowManager;
  private ipcHandlers: IpcHandlers;
  
  constructor(private config: AppConfig) {
    this.windowManager = new WindowManager(config);
    this.ipcHandlers = new IpcHandlers();
  }
  
  async initialize(): Promise<void> {
    try {
      // 1단계: 윈도우 생성 (최우선)
      await this.windowManager.createMainWindow();
      
      // 2단계: 필수 IPC 등록
      this.ipcHandlers.registerCritical();
      
      // 3단계: 백그라운드 초기화
      this.initializeBackground();
      
    } catch (error) {
      await this.handleInitializationError(error);
    }
  }
  
  private initializeBackground(): void {
    // 비차단 방식으로 나머지 시스템 초기화
    setImmediate(async () => {
      await this.ipcHandlers.registerAll();
      await this.initializeManagers();
    });
  }
}
```

---

## 🚀 단계별 마이그레이션 계획

### Phase 1: 즉시 수정 (현재 적용됨)
- [x] main.ts의 onAppReady 함수 단순화
- [x] 윈도우 생성 최우선 처리
- [x] 백그라운드 초기화로 UI 차단 방지
- [x] 에러 복구 메커니즘 추가

### Phase 2: 구조 개선 (1-2일)
- [ ] `/src/main` 폴더 재구성
  ```bash
  mkdir -p src/main/{core,managers,handlers}
  mkdir -p src/preload/api
  ```
- [ ] 기능별 파일 분리
- [ ] WindowManager 클래스 단순화
- [ ] IPC 핸들러 모듈화

### Phase 3: 스캐폴딩 도구 도입 검토 (1주)
- [ ] electron-vite 설정 테스트
- [ ] 기존 Next.js와의 호환성 확인
- [ ] 빌드 설정 최적화
- [ ] 패키징 워크플로우 구축

### Phase 4: 완전 마이그레이션 (2주)
- [ ] 새로운 구조로 전체 이전
- [ ] 테스트 자동화 추가
- [ ] CI/CD 파이프라인 구축
- [ ] 문서화 완료

---

## 🛠 개발 워크플로우 개선

### 1. 개발 스크립트 최적화

```json
// package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:renderer\" \"npm run dev:main\"",
    "dev:renderer": "next dev -p 5500",
    "dev:main": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "pack": "electron-forge package",
    "make": "electron-forge make"
  }
}
```

### 2. Hot Reload 설정

```typescript
// electron-vite 사용 시 자동 Hot Reload
// 또는 수동 설정:
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules/.bin/electron'),
    hardResetMethod: 'exit'
  });
}
```

### 3. 디버깅 환경

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/main/main.js",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron"
    }
  ]
}
```

---

## 📦 패키징 및 배포

### 1. Electron Forge 설정
```javascript
// forge.config.js
module.exports = {
  packagerConfig: {
    asar: true,
    icon: './public/app_icon'
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    }
  ]
};
```

### 2. 코드 서명 (macOS)
```javascript
// forge.config.js에 추가
packagerConfig: {
  osxSign: {
    identity: 'Developer ID Application: Your Name'
  },
  osxNotarize: {
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  }
}
```

### 3. GitHub Actions CI/CD
```yaml
# .github/workflows/build.yml
name: Build and Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run make
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: out/make/**/*
```

---

## ✅ 체크리스트

### 즉시 적용 (Phase 1)
- [x] main.ts 초기화 순서 개선
- [x] 윈도우 생성 최우선 처리
- [x] 에러 복구 메커니즘
- [x] 타임아웃 기반 차단 방지

### 구조 개선 (Phase 2)
- [ ] 폴더 구조 재구성
- [ ] 코드 모듈화
- [ ] 의존성 정리
- [ ] 테스트 코드 추가

### 도구 도입 (Phase 3)
- [ ] electron-vite 또는 Electron Forge 평가
- [ ] 빌드 설정 최적화
- [ ] 개발 경험 개선
- [ ] 패키징 자동화

### 완성 (Phase 4)
- [ ] 전체 마이그레이션
- [ ] 문서화
- [ ] CI/CD 구축
- [ ] 배포 자동화

---

## 🔗 참고 자료

- [Electron Forge 공식 문서](https://www.electronforge.io/)
- [electron-vite 가이드](https://electron-vite.org/guide/)
- [Electron 보안 가이드](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron 패키징 가이드](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)

---

**작성일**: 2025년 6월 10일  
**상태**: Phase 1 완료, Phase 2 진행 예정  
**다음 단계**: 폴더 구조 재구성 및 코드 모듈화
