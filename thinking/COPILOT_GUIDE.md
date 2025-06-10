Here’s the final, fully translated and tailored **`cursor_GUIDE.md`** for your project, incorporating all your requests:

---

````markdown
# Cursor 작업 가이드라인 (Cursor Prompt Rules)

아래의 25가지 원칙을 반드시 준수합니다. 이 파일은 `copilot.json` 및 프로젝트 루트에 고정하며, “계속(Continue)” 버튼을 눌러도 Cursor가 맥락을 잃지 않고 일관성 있게 작업할 수 있도록 합니다.

---

## 1. 사용자 요구사항 준수  
1. **사용자 요구사항 최우선**: 사용자가 요청한 사항을 최우선으로 처리합니다.  
2. **모호한 부분 즉시 질문**: 이해되지 않거나 불확실한 부분은 즉시 질문하여 확인을 받습니다.

## 2. “계속” 버튼 처리  
3. **직전 대화 요약**: “계속” 버튼 클릭 시 직전 대화를 2~3문장으로 요약하여 출력합니다.  
4. **정확도 유지**: 요약 시 핵심 키워드(날짜, 시간, 파일명, 함수명 등)를 반드시 포함합니다.

## 3. copilot.json 작성  
5. **메타 정보 관리**:
   - `timestamp`: `YYYY.MM.DD.HH.mm.ss` 형식  
   - `currentTask`: 현재 수행 중인 작업  
   - `nextSteps`: 예정된 작업 목록 배열  
6. **sequentialThinking mcp 연동**: `mcpPlan` 필드에 다음 단계 계획을 순서대로 기록합니다.

```jsonc
{
  "timestamp": "2025.06.07.15.42.30",
  "currentTask": "Novel 앱 IME 개선",
  "nextSteps": ["Rust 모듈 점검", "DB 구조 재설계", "권한 설정 UI 추가"],
  "mcpPlan": [
    "STEP1: GPU 가속 Rust 모듈 디버깅",
    "STEP2: SQLite 및 supadb 연동 구조 점검",
    "STEP3: 보안 정책 및 권한 관리 구현"
  ]
}
````

## 4. 버그 검증 및 안전성

7. **즉시 실행 금지**: 코드 실행 전에 “버그 유무 검사” 단계 수행.
8. **버그 루프**: 버그 발생 시 즉시 보고 및 수정, 이후 재검증 후 작업 재개.

## 5. 참조 파일/디렉토리

9. **전체 스캔**: `loop_3`, `loop_6`의 디렉토리와 주요 파일 구조를 완전 분석 후 요약.
10. **분석 결과 출력**: “확인 완료: 총 N개 파일, 주요 관심 파일 리스트” 형태로 보고.

## 6. 디버깅 코드 추가

11. **디버깅 로그**: 주요 함수 진입 및 예외 처리 구간에 `console.debug()` 또는 `logger.debug()` 추가.
12. **조건부 중단점**: VSCode에서 “// # debug: 조건” 형태로 주석 처리해 디버깅 용이성 확보.

## 7. 중복 방지 및 모듈화

13. **500줄 이상 모듈화**: 단일 파일이 500줄 이상이면 도메인/기능 단위로 분리.
14. **유틸리티화**: 공통 로직은 `src/utils/` 폴더에 함수 단위로 관리하고 README에 API 명세 작성.

## 8. 타입 및 환경 안정성

15. **타입 선언 엄격화**: TypeScript `strictNullChecks: true` 설정 유지, `unknown` 사용 시 타입 가드 필수.
16. **환경 변수 검증**: `process.env.*` 접근 전 반드시 `assertEnv()` 함수로 유효성 검증.

## 9. CI/CD 및 린트

17. **자동 린트**: `yarn lint:fix` → `yarn test` → `yarn build` 순서의 자동화 스크립트 작성.
18. **PR 템플릿**: Pull Request마다 “변경사항 요약” 및 “테스트 결과” 첨부 필수.

## 10. 학습 및 개선

19. **주간 회고**: `loop_6/thinking/retrospective-YYYYMMDD.md`에 매 채팅마다 회고 작성.
20. **최신화**: GitHub 공식 문서 업데이트를 분기별로 검토 후 반영.

## 11. 마이그레이션 원칙

21. **loop\_3 → loop\_5 마이그레이션**: 기존 프로젝트(loop\_3)와 비교 분석 후 loop\_5로 안전하게 이관.
22. **구조 분석**: `loop_3`과 `loop_6`의 코드와 폴더 구조를 상세 비교하여 누락 방지.
23. **이관 체크리스트**: 마이그레이션 후 기능/권한/데이터가 동일하게 작동하는지 체크.

## 12. 에이전트형 자동화

24. **자동 계획 수립**: 모든 작업 단계는 `cursor.json`의 `nextSteps`와 `mcpPlan`에 자동으로 기록.
25. **지속 업그레이드**: 위 규칙을 지속적으로 개선하여 Novel 앱의 완전한 AI 에이전트화 목표 달성.

**추가 자료**
1. loop_6 디렉토리 구성 및 분석 project-final-status-report-2025-01-26.md

2. NATIVE_MODULE_FIXING_SESSION.md
3. loop_6 추가 자료 SESSION_DATA_ARCHIVE.md
