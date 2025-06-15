#!/usr/bin/env python3
"""
영어 주석과 디버그 로그를 한국어로 변경하는 스크립트
Loop 6 프로젝트의 모든 TypeScript 파일을 대상으로 합니다.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# 번역 매핑 사전
TRANSLATION_MAP = {
    # 주석 번역
    "Advanced system tray management module": "고급 시스템 트레이 관리 모듈",
    "Handles tray icon, context menu, notifications, and statistics display": "트레이 아이콘, 컨텍스트 메뉴, 알림, 통계 표시를 담당합니다",
    "Custom protocol handlers and security management module": "커스텀 프로토콜 핸들러 및 보안 관리 모듈",
    "Handles app-specific protocols, URL routing, and secure file access": "앱 전용 프로토콜, URL 라우팅, 보안 파일 접근을 처리합니다",
    "Advanced system information and monitoring module": "고급 시스템 정보 및 모니터링 모듈",
    "Handles system stats, browser detection, debug info, and permissions": "시스템 통계, 브라우저 감지, 디버그 정보, 권한을 처리합니다",
    "Create tray icon with proper sizing for platform": "플랫폼에 맞는 적절한 크기의 트레이 아이콘 생성",
    "Format duration in human readable format": "지속 시간을 사람이 읽기 쉬운 형식으로 포맷",
    "Format numbers with commas": "숫자를 쉼표로 포맷",
    "Create context menu for tray": "트레이용 컨텍스트 메뉴 생성",
    "Update tray menu with current data": "현재 데이터로 트레이 메뉴 업데이트",
    "Show main window": "메인 창 표시",
    "Toggle mini view": "미니 뷰 토글",
    "Show settings window": "설정 창 표시",
    "Reset statistics": "통계 리셋",
    "Show about dialog": "정보 대화상자 표시",
    "Send statistics tab change to renderer": "렌더러로 통계 탭 변경 전송",
    "Update tray statistics": "트레이 통계 업데이트",
    "Show tray notification": "트레이 알림 표시",
    "Set tray icon status (active/inactive)": "트레이 아이콘 상태 설정 (활성/비활성)",
    "Flash tray icon for attention": "주의를 위해 트레이 아이콘 깜빡임",
    "Initialize system tray": "시스템 트레이 초기화",
    "Cleanup tray resources": "트레이 리소스 정리",
    "Get tray status": "트레이 상태 가져오기",
    
    # 공통 주석들
    "Default options": "기본 옵션",
    "Get screen sources": "화면 소스 가져오기",
    "Capture the screen": "화면 캡처",
    "Convert to desired format": "원하는 형식으로 변환",
    "Generate filename and metadata": "파일명과 메타데이터 생성",
    "Auto-save if enabled": "활성화된 경우 자동 저장",
    "Add to history": "히스토리에 추가",
    "Notify renderer process": "렌더러 프로세스에 알림",
    "Remove from history": "히스토리에서 제거",
    "Get available sources": "사용 가능한 소스 가져오기",
    "Capture screenshot from specific source": "특정 소스에서 스크린샷 캡처",
    "Capture primary screen": "주 화면 캡처",
    "Setup keyboard event listeners": "키보드 이벤트 리스너 설정",
    "Register global shortcuts": "전역 단축키 등록",
    "Setup keyboard IPC handlers": "키보드 IPC 핸들러 설정",
    "Start keyboard monitoring": "키보드 모니터링 시작",
    "Stop keyboard monitoring": "키보드 모니터링 중지",
    "Initialize advanced keyboard system": "고급 키보드 시스템 초기화",
    "Cleanup keyboard resources": "키보드 리소스 정리",
    "Get keyboard system status": "키보드 시스템 상태 가져오기",
    "KeyboardManager class for compatibility with handlers": "핸들러와의 호환성을 위한 KeyboardManager 클래스",
    
    # 디버그 로그 번역
    "Tray already initialized": "트레이가 이미 초기화되어 있습니다",
    "Tray icon clicked": "트레이 아이콘이 클릭되었습니다",
    "Tray right-clicked": "트레이를 우클릭했습니다",
    "Tray double-clicked": "트레이를 더블클릭했습니다",
    "System tray initialization completed": "시스템 트레이 초기화 완료",
    "Tray cleanup completed": "트레이 정리 완료",
    "Main window shown from tray": "트레이에서 메인 창 표시됨",
    "Mini view toggled from tray": "트레이에서 미니 뷰 토글됨",
    "Settings shown from tray": "트레이에서 설정 표시됨",
    "Statistics reset from tray": "트레이에서 통계 리셋됨",
    "About dialog shown from tray": "트레이에서 정보 대화상자 표시됨",
    
    # 에러 메시지 번역
    "Tray menu update error:": "트레이 메뉴 업데이트 오류:",
    "Tray click handler error:": "트레이 클릭 핸들러 오류:",
    "Tray initialization error:": "트레이 초기화 오류:",
    "Tray cleanup error:": "트레이 정리 오류:",
    "Tray status update error:": "트레이 상태 업데이트 오류:",
    "Failed to get screenshot sources:": "스크린샷 소스 가져오기 실패:",
    "Screenshot capture error:": "스크린샷 캡처 오류:",
    "Primary screen capture error:": "주 화면 캡처 오류:",
    "Active window capture error:": "활성 창 캡처 오류:",
    "Failed to load screenshot": "스크린샷 로드 실패",
    "Failed to delete screenshot": "스크린샷 삭제 실패",
    "Failed to clear screenshots:": "스크린샷 정리 실패:",
    
    # 프로토콜 관련
    "Protocol scheme registered:": "프로토콜 스킴 등록됨:",
    "Protocol handler registered:": "프로토콜 핸들러 등록됨:",
    "Failed to register protocol handler:": "프로토콜 핸들러 등록 실패:",
    "Protocol scheme registration error:": "프로토콜 스킴 등록 오류:",
    "Protocol handler registration error:": "프로토콜 핸들러 등록 오류:",
    "Second instance detected with command line:": "명령줄과 함께 두 번째 인스턴스 감지됨:",
    "Open URL event:": "URL 열기 이벤트:",
    "Handling deep link:": "딥 링크 처리 중:",
    "Deep link handling error:": "딥 링크 처리 오류:",
    "File protocol interceptor setup completed": "파일 프로토콜 인터셉터 설정 완료",
    "File protocol interceptor setup error:": "파일 프로토콜 인터셉터 설정 오류:",
    "Security configuration updated:": "보안 구성 업데이트됨:",
    "Added allowed origin:": "허용된 원본 추가됨:",
    "Removed allowed origin:": "허용된 원본 제거됨:",
    "Protocol handlers setup completed": "프로토콜 핸들러 설정 완료",
    "Protocol handlers setup error:": "프로토콜 핸들러 설정 오류:",
    "Protocol handlers cleanup completed": "프로토콜 핸들러 정리 완료",
    "Protocol handlers cleanup error:": "프로토콜 핸들러 정리 오류:",
    
    # 시스템 정보 관련
    "System info module already initialized": "시스템 정보 모듈이 이미 초기화되어 있습니다",
    "System info module initialization completed": "시스템 정보 모듈 초기화 완료",
    "System info module initialization error:": "시스템 정보 모듈 초기화 오류:",
    "System info module cleanup completed": "시스템 정보 모듈 정리 완료",
    "System info module cleanup error:": "시스템 정보 모듈 정리 오류:",
    "System info IPC handlers registered": "시스템 정보 IPC 핸들러 등록됨",
    
    # 스크린샷 관련
    "Screenshot saved:": "스크린샷 저장됨:",
    "Screenshot deleted:": "스크린샷 삭제됨:",
    
    # 키보드 관련
    "Advanced keyboard already initialized": "고급 키보드가 이미 초기화되어 있습니다",
    "Initializing advanced keyboard system...": "고급 키보드 시스템 초기화 중...",
    "Advanced keyboard system initialization completed": "고급 키보드 시스템 초기화 완료",
    "Cleaning up advanced keyboard system...": "고급 키보드 시스템 정리 중...",
    "Advanced keyboard system cleanup completed": "고급 키보드 시스템 정리 완료",
    "Keyboard monitoring already active": "키보드 모니터링이 이미 활성화되어 있습니다",
    "Keyboard monitoring started": "키보드 모니터링 시작됨",
    "Keyboard monitoring stopped": "키보드 모니터링 중지됨",
    "Global shortcut registered:": "전역 단축키 등록됨:",
    "Failed to register global shortcut": "전역 단축키 등록 실패",
    "Typing statistics reset": "타이핑 통계 리셋",
    "Keyboard IPC handlers registered": "키보드 IPC 핸들러 등록됨",
    "Keyboard event listeners setup completed": "키보드 이벤트 리스너 설정 완료",
    "Advanced keyboard initialization error:": "고급 키보드 초기화 오류:",
    "Advanced keyboard cleanup error:": "고급 키보드 정리 오류:",
    "Failed to start keyboard monitoring:": "키보드 모니터링 시작 실패:",
    "Failed to stop keyboard monitoring:": "키보드 모니터링 중지 실패:",
    "Failed to start listening:": "듣기 시작 실패:",
    "Keyboard event listeners setup error:": "키보드 이벤트 리스너 설정 오류:",
    "Global shortcut registration error:": "전역 단축키 등록 오류:",
    "Key event queue processing error:": "키 이벤트 큐 처리 오류:",
    "Key event processing error:": "키 이벤트 처리 오류:",
    "Typing stats update error:": "타이핑 통계 업데이트 오류:",
    "Hangul composition:": "한글 조합:",
}

# 패턴 매핑 - 정규표현식으로 처리할 번역들
PATTERN_MAP = {
    # debugLog 패턴들
    r'debugLog\([\'"`]([^\'"`]*)[\'"`]\)': lambda m: f'debugLog(\'{translate_text(m.group(1))}\')',
    r'debugLog\([\'"`]([^\'"`]*)[\'"`],': lambda m: f'debugLog(\'{translate_text(m.group(1))}\',',
    r'debugLog\(`([^`]*)`\)': lambda m: f'debugLog(`{translate_backtick_template(m.group(1))}`)',
    r'debugLog\(`([^`]*)`,' : lambda m: f'debugLog(`{translate_backtick_template(m.group(1))}`,',
    
    # console.log 패턴들
    r'console\.log\([\'"`]([^\'"`]*)[\'"`]\)': lambda m: f'console.log(\'{translate_text(m.group(1))}\')',
    r'console\.log\([\'"`]([^\'"`]*)[\'"`],': lambda m: f'console.log(\'{translate_text(m.group(1))}\',',
    r'console\.log\(`([^`]*)`\)': lambda m: f'console.log(`{translate_backtick_template(m.group(1))}`)',
    r'console\.log\(`([^`]*)`,' : lambda m: f'console.log(`{translate_backtick_template(m.group(1))}`,',
    
    # console.error 패턴들
    r'console\.error\([\'"`]([^\'"`]*)[\'"`]': lambda m: f'console.error(\'{translate_text(m.group(1))}\'',
    r'console\.error\(`([^`]*)`': lambda m: f'console.error(`{translate_backtick_template(m.group(1))}`',
    
    # console.warn 패턴들
    r'console\.warn\([\'"`]([^\'"`]*)[\'"`]': lambda m: f'console.warn(\'{translate_text(m.group(1))}\'',
    r'console\.warn\(`([^`]*)`': lambda m: f'console.warn(`{translate_backtick_template(m.group(1))}`',
    
    # 주석 패턴들
    r'//\s*([A-Z][^가-힣]*[a-z])$': lambda m: f'// {translate_text(m.group(1).strip())}',
    r'/\*\*\s*\n\s*\*\s*([A-Z][^가-힣]*[a-z])\s*\n\s*\*/': lambda m: f'/**\n * {translate_text(m.group(1).strip())}\n */',
}

def translate_text(text: str) -> str:
    """텍스트를 번역합니다."""
    text = text.strip()
    
    # 직접 매핑된 번역이 있는 경우
    if text in TRANSLATION_MAP:
        return TRANSLATION_MAP[text]
    
    # 부분 매칭으로 번역 시도
    for english, korean in TRANSLATION_MAP.items():
        if english.lower() in text.lower():
            return text.replace(english, korean)
    
    # 일반적인 영어 단어들을 한국어로 변경
    common_translations = {
        "Error": "오류",
        "Warning": "경고", 
        "Success": "성공",
        "Failed": "실패",
        "Completed": "완료",
        "Started": "시작됨",
        "Stopped": "중지됨",
        "Initialized": "초기화됨",
        "Cleanup": "정리",
        "Setup": "설정",
        "Loading": "로딩 중",
        "Saving": "저장 중",
        "Processing": "처리 중",
        "Connecting": "연결 중",
        "Connected": "연결됨",
        "Disconnected": "연결 해제됨",
        "Invalid": "유효하지 않음",
        "Valid": "유효함",
        "Not found": "찾을 수 없음",
        "Already exists": "이미 존재함",
        "Permission denied": "권한 거부됨",
        "Access denied": "접근 거부됨",
        "Timeout": "시간 초과",
        "Cancelled": "취소됨",
        "Aborted": "중단됨",
    }
    
    for eng, kor in common_translations.items():
        if eng in text:
            text = text.replace(eng, kor)
    
    return text

def translate_backtick_template(template: str) -> str:
    """백틱 템플릿 문자열을 번역합니다. ${} 부분은 유지합니다."""
    # ${...} 패턴을 임시로 대체
    import uuid
    placeholders = {}
    pattern = r'\$\{[^}]+\}'
    
    def replace_placeholder(match):
        placeholder = f"__PLACEHOLDER_{uuid.uuid4().hex}__"
        placeholders[placeholder] = match.group(0)
        return placeholder
    
    # ${} 부분을 임시 플레이스홀더로 대체
    modified_template = re.sub(pattern, replace_placeholder, template)
    
    # 텍스트 부분 번역
    translated = translate_text(modified_template)
    
    # 플레이스홀더를 원래 ${} 로 복원
    for placeholder, original in placeholders.items():
        translated = translated.replace(placeholder, original)
    
    return translated

def process_file(file_path: Path) -> bool:
    """파일을 처리하여 영어 주석과 로그를 한국어로 변경합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 패턴 기반 변경
        for pattern, replacement_func in PATTERN_MAP.items():
            new_content = re.sub(pattern, replacement_func, content, flags=re.MULTILINE)
            if new_content != content:
                content = new_content
                modified = True
        
        # 직접 문자열 대체
        for english, korean in TRANSLATION_MAP.items():
            if english in content:
                # 전체 단어 매칭을 위해 경계 확인
                new_content = content.replace(english, korean)
                if new_content != content:
                    content = new_content
                    modified = True
        
        # 변경사항이 있으면 파일에 쓰기
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ 파일 처리 중 오류 발생 {file_path}: {e}")
        return False

def find_typescript_files(directory: Path) -> List[Path]:
    """디렉토리에서 TypeScript 파일들을 찾습니다."""
    ts_files = []
    
    # src/main 디렉토리 우선 처리
    main_dir = directory / "src" / "main"
    if main_dir.exists():
        ts_files.extend(main_dir.glob("**/*.ts"))
    
    # 기타 디렉토리들
    other_dirs = ["src/preload", "src/shared", "src/utils", "src/native-modules"]
    for dir_path in other_dirs:
        full_path = directory / dir_path
        if full_path.exists():
            ts_files.extend(full_path.glob("**/*.ts"))
    
    return ts_files

def main():
    """메인 실행 함수"""
    print("🔄 영어 주석과 디버그 로그를 한국어로 변경하는 스크립트 시작")
    print("=" * 60)
    
    # 프로젝트 루트 디렉토리 확인
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    if not project_root.exists():
        print("❌ 프로젝트 루트 디렉토리를 찾을 수 없습니다.")
        sys.exit(1)
    
    print(f"📂 프로젝트 디렉토리: {project_root}")
    
    # TypeScript 파일들 찾기
    ts_files = find_typescript_files(project_root)
    
    if not ts_files:
        print("❌ TypeScript 파일을 찾을 수 없습니다.")
        sys.exit(1)
    
    print(f"📄 총 {len(ts_files)}개의 TypeScript 파일을 발견했습니다.")
    
    # 파일별 처리
    modified_files = 0
    total_files = len(ts_files)
    
    for i, file_path in enumerate(ts_files, 1):
        relative_path = file_path.relative_to(project_root)
        print(f"[{i:3d}/{total_files:3d}] 처리 중: {relative_path}")
        
        if process_file(file_path):
            print(f"  ✅ 변경됨: {relative_path}")
            modified_files += 1
        else:
            print(f"  ⏭️  변경 없음: {relative_path}")
    
    print("=" * 60)
    print(f"🎉 작업 완료!")
    print(f"📊 전체 파일: {total_files}개")
    print(f"✏️  변경된 파일: {modified_files}개")
    print(f"📋 변경되지 않은 파일: {total_files - modified_files}개")
    
    if modified_files > 0:
        print("\n✨ 다음 파일들이 한국어로 변경되었습니다:")
        print("   - 영어 주석 → 한국어 주석")
        print("   - 영어 디버그 로그 → 한국어 디버그 로그")
        print("   - 영어 콘솔 메시지 → 한국어 콘솔 메시지")
        print("\n⚠️  함수명, 변수명, 로직은 영어로 유지되었습니다.")

if __name__ == "__main__":
    main()
