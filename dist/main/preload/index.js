"use strict";
/**
 * Main Preload Index
 *
 * 렌더러 프로세스에서 메인 프로세스의 기능에 안전하게 접근할 수 있도록 하는 메인 preload 진입점입니다.
 * contextIsolation이 활성화된 상태에서 보안을 유지하면서 API를 노출합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api_1 = require("./api");
const styles_1 = require("./styles");
console.log('🚀 Preload script 시작...');
// Context Bridge를 통해 안전하게 API 노출
try {
    // ElectronAPI 노출
    electron_1.contextBridge.exposeInMainWorld('electronAPI', api_1.electronAPI);
    // 디버깅을 위해 실제 노출된 키들 확인
    const exposedKeys = Object.keys(api_1.electronAPI);
    console.log('✅ Electron API가 Success적으로 노출되었습니다.');
    console.log('🔌 사용 가능한 API:', exposedKeys);
    // memory API가 포함되었는지 확인
    if (api_1.electronAPI.memory) {
        console.log('✅ Memory API가 사용 가능합니다.');
        console.log('🧠 Memory API 함수들:', Object.keys(api_1.electronAPI.memory));
    }
    else {
        console.warn('⚠️ Memory API가 누락되었습니다.');
    }
    // native API가 포함되었는지 확인
    if (api_1.electronAPI.native) {
        console.log('✅ Native API가 최상위 레벨에서 사용 가능합니다.');
        console.log('🛠️ Native API 함수들:', Object.keys(api_1.electronAPI.native));
    }
    else {
        console.warn('⚠️ Native API가 최상위 레벨에서 누락되었습니다.');
    }
    // system.native도 확인
    if (api_1.electronAPI.system?.native) {
        console.log('✅ System.Native API도 사용 가능합니다.');
    }
    // settings API 확인
    if (api_1.electronAPI.settings) {
        console.log('✅ Settings API가 사용 가능합니다.');
        console.log('⚙️ Settings API 함수들:', Object.keys(api_1.electronAPI.settings));
    }
    else {
        console.warn('⚠️ Settings API가 누락되었습니다.');
    }
    // CSS 스타일 주입 함수 추가
    electron_1.contextBridge.exposeInMainWorld('injectStyles', styles_1.injectStyles);
    console.log('✅ injectStyles 함수가 노출되었습니다.');
}
catch (error) {
    console.error('❌ Preload script: electronAPI 노출 Failed:', error);
}
// API 테스트 함수
const testAPIs = async () => {
    console.log('🧪 API 테스트 시작...');
    try {
        // 메모리 API 테스트
        console.log('📊 메모리 API 테스트 중...');
        const memoryResult = await api_1.electronAPI.memory.getInfo();
        console.log('✅ Memory API 응답:', memoryResult);
        // Setup API 테스트
        console.log('⚙️ Setup API 테스트 중...');
        const settingsResult = await api_1.electronAPI.settings.getAll();
        console.log('✅ Settings API 응답:', settingsResult);
        console.log('✅ 모든 API 테스트 Completed');
    }
    catch (error) {
        console.error('❌ API 테스트 Failed:', error);
    }
};
// 개발 모드에서 디버깅 정보
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 개발 모드: preload script 로드됨');
    // DOM이 로드되면 CSS를 주입하고 API 테스트
    window.addEventListener('DOMContentLoaded', () => {
        // CSS 주입
        const script = document.createElement('script');
        script.textContent = `
      if (window.injectStyles) {
        console.log('🎨 스타일 주입 시작...');
        window.injectStyles();
      } else {
        console.error('❌ injectStyles 함수를 찾을 수 없습니다');
      }
    `;
        document.body.appendChild(script);
        // API 테스트 (약간의 지연 후)
        setTimeout(() => {
            testAPIs();
        }, 1000);
    });
}
console.log('✅ Preload script Completed!');
//# sourceMappingURL=index.js.map