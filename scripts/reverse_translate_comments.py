#!/usr/bin/env python3
"""
한국어 주석과 디버그 로그를 영어로 되돌리는 스크립트
Loop 6 프로젝트의 모든 TypeScript 파일을 대상으로 합니다.
translate_comments.py의 역방향 작업을 수행합니다.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# 역번역 매핑 사전 (한국어 → 영어)
REVERSE_TRANSLATION_MAP = {
    # 주석 역번역
    "고급 시스템 트레이 관리 모듈": "Advanced system tray management module",
    "트레이 아이콘, 컨텍스트 메뉴, 알림, 통계 표시를 담당합니다": "Handles tray icon, context menu, notifications, and statistics display",
    "커스텀 프로토콜 핸들러 및 보안 관리 모듈": "Custom protocol handlers and security management module",
    "앱 전용 프로토콜, URL 라우팅, 보안 파일 접근을 처리합니다": "Handles app-specific protocols, URL routing, and secure file access",
    "고급 시스템 정보 및 모니터링 모듈": "Advanced system information and monitoring module",
    "시스템 통계, 브라우저 감지, 디버그 정보, 권한을 처리합니다": "Handles system stats, browser detection, debug info, and permissions",
    "플랫폼에 맞는 적절한 크기의 트레이 아이콘 생성": "Create tray icon with proper sizing for platform",
    "지속 시간을 사람이 읽기 쉬운 형식으로 포맷": "Format duration in human readable format",
    "숫자를 쉼표로 포맷": "Format numbers with commas",
    "트레이용 컨텍스트 메뉴 생성": "Create context menu for tray",
    "현재 데이터로 트레이 메뉴 업데이트": "Update tray menu with current data",
    "메인 창 표시": "Show main window",
    "미니 뷰 토글": "Toggle mini view",
    "설정 창 표시": "Show settings window",
    "통계 리셋": "Reset statistics",
    "정보 대화상자 표시": "Show about dialog",
    "렌더러로 통계 탭 변경 전송": "Send statistics tab change to renderer",
    "트레이 통계 업데이트": "Update tray statistics",
    "트레이 알림 표시": "Show tray notification",
    "트레이 아이콘 상태 설정 (활성/비활성)": "Set tray icon status (active/inactive)",
    "주의를 위해 트레이 아이콘 깜빡임": "Flash tray icon for attention",
    "시스템 트레이 초기화": "Initialize system tray",
    "트레이 리소스 정리": "Cleanup tray resources",
    "트레이 상태 가져오기": "Get tray status",
    
    # 공통 주석들
    "기본 옵션": "Default options",
    "화면 소스 가져오기": "Get screen sources",
    "화면 캡처": "Capture the screen",
    "원하는 형식으로 변환": "Convert to desired format",
    "파일명과 메타데이터 생성": "Generate filename and metadata",
    "활성화된 경우 자동 저장": "Auto-save if enabled",
    "히스토리에 추가": "Add to history",
    "렌더러 프로세스에 알림": "Notify renderer process",
    "히스토리에서 제거": "Remove from history",
    "사용 가능한 소스 가져오기": "Get available sources",
    "특정 소스에서 스크린샷 캡처": "Capture screenshot from specific source",
    "주 화면 캡처": "Capture primary screen",
    "키보드 이벤트 리스너 설정": "Setup keyboard event listeners",
    "전역 단축키 등록": "Register global shortcuts",
    "키보드 IPC 핸들러 설정": "Setup keyboard IPC handlers",
    "키보드 모니터링 시작": "Start keyboard monitoring",
    "키보드 모니터링 중지": "Stop keyboard monitoring",
    "고급 키보드 시스템 초기화": "Initialize advanced keyboard system",
    "키보드 리소스 정리": "Cleanup keyboard resources",
    "키보드 시스템 상태 가져오기": "Get keyboard system status",
    "핸들러와의 호환성을 위한 KeyboardManager 클래스": "KeyboardManager class for compatibility with handlers",
    
    # 디버그 로그 역번역
    "트레이가 이미 초기화되어 있습니다": "Tray already initialized",
    "트레이 아이콘이 클릭되었습니다": "Tray icon clicked",
    "트레이를 우클릭했습니다": "Tray right-clicked",
    "트레이를 더블클릭했습니다": "Tray double-clicked",
    "시스템 트레이 초기화 완료": "System tray initialization completed",
    "트레이 정리 완료": "Tray cleanup completed",
    "트레이에서 메인 창 표시됨": "Main window shown from tray",
    "트레이에서 미니 뷰 토글됨": "Mini view toggled from tray",
    "트레이에서 설정 표시됨": "Settings shown from tray",
    "트레이에서 통계 리셋됨": "Statistics reset from tray",
    "트레이에서 정보 대화상자 표시됨": "About dialog shown from tray",
    
    # 에러 메시지 역번역
    "트레이 메뉴 업데이트 오류:": "Tray menu update error:",
    "트레이 클릭 핸들러 오류:": "Tray click handler error:",
    "트레이 초기화 오류:": "Tray initialization error:",
    "트레이 정리 오류:": "Tray cleanup error:",
    "트레이 상태 업데이트 오류:": "Tray status update error:",
    "스크린샷 소스 가져오기 실패:": "Failed to get screenshot sources:",
    "스크린샷 캡처 오류:": "Screenshot capture error:",
    "주 화면 캡처 오류:": "Primary screen capture error:",
    "활성 창 캡처 오류:": "Active window capture error:",
    "스크린샷 로드 실패": "Failed to load screenshot",
    "스크린샷 삭제 실패": "Failed to delete screenshot",
    "스크린샷 정리 실패:": "Failed to clear screenshots:",
    
    # 프로토콜 관련
    "프로토콜 스킴 등록됨:": "Protocol scheme registered:",
    "프로토콜 핸들러 등록됨:": "Protocol handler registered:",
    "프로토콜 핸들러 등록 실패:": "Failed to register protocol handler:",
    "프로토콜 스킴 등록 오류:": "Protocol scheme registration error:",
    "프로토콜 핸들러 등록 오류:": "Protocol handler registration error:",
    "명령줄과 함께 두 번째 인스턴스 감지됨:": "Second instance detected with command line:",
    "URL 열기 이벤트:": "Open URL event:",
    "딥 링크 처리 중:": "Handling deep link:",
    "딥 링크 처리 오류:": "Deep link handling error:",
    "파일 프로토콜 인터셉터 설정 완료": "File protocol interceptor setup completed",
    "파일 프로토콜 인터셉터 설정 오류:": "File protocol interceptor setup error:",
    "보안 구성 업데이트됨:": "Security configuration updated:",
    "허용된 원본 추가됨:": "Added allowed origin:",
    "허용된 원본 제거됨:": "Removed allowed origin:",
    "프로토콜 핸들러 설정 완료": "Protocol handlers setup completed",
    "프로토콜 핸들러 설정 오류:": "Protocol handlers setup error:",
    "프로토콜 핸들러 정리 완료": "Protocol handlers cleanup completed",
    "프로토콜 핸들러 정리 오류:": "Protocol handlers cleanup error:",
    
    # 시스템 정보 관련
    "시스템 정보 모듈이 이미 초기화되어 있습니다": "System info module already initialized",
    "시스템 정보 모듈 초기화 완료": "System info module initialization completed",
    "시스템 정보 모듈 초기화 오류:": "System info module initialization error:",
    "시스템 정보 모듈 정리 완료": "System info module cleanup completed",
    "시스템 정보 모듈 정리 오류:": "System info module cleanup error:",
    "시스템 정보 IPC 핸들러 등록됨": "System info IPC handlers registered",
    
    # 스크린샷 관련
    "스크린샷 저장됨:": "Screenshot saved:",
    "스크린샷 삭제됨:": "Screenshot deleted:",
    
    # 키보드 관련
    "고급 키보드가 이미 초기화되어 있습니다": "Advanced keyboard already initialized",
    "고급 키보드 시스템 초기화 중...": "Initializing advanced keyboard system...",
    "고급 키보드 시스템 초기화 완료": "Advanced keyboard system initialization completed",
    "고급 키보드 시스템 정리 중...": "Cleaning up advanced keyboard system...",
    "고급 키보드 시스템 정리 완료": "Advanced keyboard system cleanup completed",
    "키보드 모니터링이 이미 활성화되어 있습니다": "Keyboard monitoring already active",
    "키보드 모니터링 시작됨": "Keyboard monitoring started",
    "키보드 모니터링 중지됨": "Keyboard monitoring stopped",
    "전역 단축키 등록됨:": "Global shortcut registered:",
    "전역 단축키 등록 실패": "Failed to register global shortcut",
    "타이핑 통계 리셋": "Typing statistics reset",
    "키보드 IPC 핸들러 등록됨": "Keyboard IPC handlers registered",
    "키보드 이벤트 리스너 설정 완료": "Keyboard event listeners setup completed",
    "고급 키보드 초기화 오류:": "Advanced keyboard initialization error:",
    "고급 키보드 정리 오류:": "Advanced keyboard cleanup error:",
    "키보드 모니터링 시작 실패:": "Failed to start keyboard monitoring:",
    "키보드 모니터링 중지 실패:": "Failed to stop keyboard monitoring:",
    "듣기 시작 실패:": "Failed to start listening:",
    "키보드 이벤트 리스너 설정 오류:": "Keyboard event listeners setup error:",
    "전역 단축키 등록 오류:": "Global shortcut registration error:",
    "키 이벤트 큐 처리 오류:": "Key event queue processing error:",
    "키 이벤트 처리 오류:": "Key event processing error:",
    "타이핑 통계 업데이트 오류:": "Typing stats update error:",
    "한글 조합:": "Hangul composition:",
    
    # 공통 단어들
    "오류": "Error",
    "경고": "Warning",
    "성공": "Success",
    "실패": "Failed",
    "완료": "Completed",
    "시작됨": "Started",
    "중지됨": "Stopped",
    "초기화됨": "Initialized",
    "정리": "Cleanup",
    "설정": "Setup",
    "로딩 중": "Loading",
    "저장 중": "Saving",
    "처리 중": "Processing",
    "연결 중": "Connecting",
    "연결됨": "Connected",
    "연결 해제됨": "Disconnected",
    "유효하지 않음": "Invalid",
    "유효함": "Valid",
    "찾을 수 없음": "Not found",
    "이미 존재함": "Already exists",
    "권한 거부됨": "Permission denied",
    "접근 거부됨": "Access denied",
    "시간 초과": "Timeout",
    "취소됨": "Cancelled",
    "중단됨": "Aborted",
}

# 역방향 패턴 매핑
REVERSE_PATTERN_MAP = {
    # debugLog 패턴들 (한국어 → 영어)
    r'debugLog\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`]\)': lambda m: f'debugLog(\'{reverse_translate_text(m.group(1))}\')',
    r'debugLog\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`],': lambda m: f'debugLog(\'{reverse_translate_text(m.group(1))}\',',
    r'debugLog\(`([^`]*[가-힣]+[^`]*)`\)': lambda m: f'debugLog(`{reverse_translate_backtick_template(m.group(1))}`)',
    r'debugLog\(`([^`]*[가-힣]+[^`]*)`,' : lambda m: f'debugLog(`{reverse_translate_backtick_template(m.group(1))}`,',
    
    # console.log 패턴들 (한국어 → 영어)
    r'console\.log\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`]\)': lambda m: f'console.log(\'{reverse_translate_text(m.group(1))}\')',
    r'console\.log\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`],': lambda m: f'console.log(\'{reverse_translate_text(m.group(1))}\',',
    r'console\.log\(`([^`]*[가-힣]+[^`]*)`\)': lambda m: f'console.log(`{reverse_translate_backtick_template(m.group(1))}`)',
    r'console\.log\(`([^`]*[가-힣]+[^`]*)`,' : lambda m: f'console.log(`{reverse_translate_backtick_template(m.group(1))}`,',
    
    # console.error 패턴들 (한국어 → 영어)
    r'console\.error\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`]': lambda m: f'console.error(\'{reverse_translate_text(m.group(1))}\'',
    r'console\.error\(`([^`]*[가-힣]+[^`]*)`': lambda m: f'console.error(`{reverse_translate_backtick_template(m.group(1))}`',
    
    # console.warn 패턴들 (한국어 → 영어)
    r'console\.warn\([\'"`]([^\'"`]*[가-힣]+[^\'"`]*)[\'"`]': lambda m: f'console.warn(\'{reverse_translate_text(m.group(1))}\'',
    r'console\.warn\(`([^`]*[가-힣]+[^`]*)`': lambda m: f'console.warn(`{reverse_translate_backtick_template(m.group(1))}`',
    
    # 주석 패턴들 (한국어 주석 → 영어 주석)
    r'//\s*([가-힣][^A-Z]*[가-힣])$': lambda m: f'// {reverse_translate_text(m.group(1).strip())}',
    r'/\*\*\s*\n\s*\*\s*([가-힣][^A-Z]*[가-힣])\s*\n\s*\*/': lambda m: f'/**\n * {reverse_translate_text(m.group(1).strip())}\n */',
}

def reverse_translate_text(text: str) -> str:
    """한국어 텍스트를 영어로 역번역합니다."""
    text = text.strip()
    
    # 직접 매핑된 역번역이 있는 경우
    if text in REVERSE_TRANSLATION_MAP:
        return REVERSE_TRANSLATION_MAP[text]
    
    # 부분 매칭으로 역번역 시도
    for korean, english in REVERSE_TRANSLATION_MAP.items():
        if korean in text:
            text = text.replace(korean, english)
    
    return text

def reverse_translate_backtick_template(template: str) -> str:
    """백틱 템플릿 문자열을 역번역합니다. ${} 부분은 유지합니다."""
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
    
    # 텍스트 부분 역번역
    translated = reverse_translate_text(modified_template)
    
    # 플레이스홀더를 원래 ${} 로 복원
    for placeholder, original in placeholders.items():
        translated = translated.replace(placeholder, original)
    
    return translated

def process_file(file_path: Path) -> bool:
    """파일을 처리하여 한국어 주석과 로그를 영어로 되돌립니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 패턴 기반 역변경
        for pattern, replacement_func in REVERSE_PATTERN_MAP.items():
            new_content = re.sub(pattern, replacement_func, content, flags=re.MULTILINE)
            if new_content != content:
                content = new_content
                modified = True
        
        # 직접 문자열 역대체
        for korean, english in REVERSE_TRANSLATION_MAP.items():
            if korean in content:
                new_content = content.replace(korean, english)
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
    print("🔄 한국어 주석과 디버그 로그를 영어로 되돌리는 스크립트 시작")
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
            print(f"  ✅ 되돌림: {relative_path}")
            modified_files += 1
        else:
            print(f"  ⏭️  변경 없음: {relative_path}")
    
    print("=" * 60)
    print(f"🎉 역번역 작업 완료!")
    print(f"📊 전체 파일: {total_files}개")
    print(f"✏️  되돌린 파일: {modified_files}개")
    print(f"📋 변경되지 않은 파일: {total_files - modified_files}개")
    
    if modified_files > 0:
        print("\n✨ 다음 사항들이 영어로 되돌려졌습니다:")
        print("   - 한국어 주석 → 영어 주석")
        print("   - 한국어 디버그 로그 → 영어 디버그 로그")
        print("   - 한국어 콘솔 메시지 → 영어 콘솔 메시지")
        print("\n⚠️  함수명, 변수명, 로직은 그대로 유지되었습니다.")

if __name__ == "__main__":
    main()
