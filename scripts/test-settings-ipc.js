/**
 * 설정 IPC 핸들러 테스트 스크립트
 * 브라우저 개발자 도구 콘솔에서만 실행 가능 (Node.js에서 실행하지 말 것)
 * 
 * 사용법:
 * 1. Electron 앱 실행
 * 2. DevTools 열기 (F12)
 * 3. Console 탭에서 이 코드 복사 후 실행
 */

// Node.js 환경 체크 - 브라우저에서만 실행되도록
if (typeof window === 'undefined') {
  console.error('❌ 이 스크립트는 브라우저 환경(DevTools Console)에서만 실행하세요!');
  console.log('📋 사용법:');
  console.log('1. Electron 앱 실행');
  console.log('2. DevTools 열기 (F12 또는 Cmd+Option+I)');
  console.log('3. Console 탭에서 이 코드의 내용을 복사해서 실행');
  process.exit(1);
}

async function testSettingsIPC() {
  console.log('🧪 설정 IPC 핸들러 테스트 시작...');
  
  try {
    // ElectronAPI 확인
    if (!window.electronAPI) {
      console.error('❌ window.electronAPI가 정의되지 않음');
      return;
    }
    
    console.log('✅ window.electronAPI 확인됨');
    console.log('📋 사용 가능한 API:', Object.keys(window.electronAPI));
    
    // settings API 확인
    if (!window.electronAPI.settings) {
      console.error('❌ window.electronAPI.settings가 정의되지 않음');
      return;
    }
    
    console.log('✅ window.electronAPI.settings 확인됨');
    console.log('📋 settings API:', Object.keys(window.electronAPI.settings));
    
    // 설정 가져오기 테스트
    console.log('🔍 설정 가져오기 테스트...');
    const settings = await window.electronAPI.settings.get();
    console.log('✅ 설정 가져오기 성공:', settings);
    
    // 개별 설정 가져오기 테스트
    console.log('🔍 개별 설정 가져오기 테스트...');
    const theme = await window.electronAPI.settings.getSetting('theme');
    console.log('✅ 테마 설정:', theme);
    
    // 설정 업데이트 테스트 (안전한 설정으로)
    console.log('🔄 설정 업데이트 테스트...');
    const updateResult = await window.electronAPI.settings.update('theme', settings.theme);
    console.log('✅ 설정 업데이트 결과:', updateResult);
    
    console.log('🎉 모든 설정 IPC 테스트 성공!');
    
  } catch (error) {
    console.error('❌ 설정 IPC 테스트 실패:', error);
  }
}

// 테스트 실행
testSettingsIPC();
