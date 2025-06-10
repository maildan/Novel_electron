// Loop 앱 CSS 변수 초기화 및 스타일 강제 적용
const initStyles = () => {
  // CSS 변수가 적용되었는지 확인하되, ThemeProvider가 관리하는 테마는 건드리지 않음
  let style = document.getElementById('loop-init-styles');
  
  // 이미 스타일이 있으면 제거하지 않고 업데이트만 함
  if (!style) {
    style = document.createElement('style');
    style.id = 'loop-init-styles';
    document.head.appendChild(style);
  }
  
  style.textContent = `
    /* Loop 앱 기본 CSS 변수 - ThemeProvider보다 낮은 우선순위 */
    :root {
      --background-color: #f9f9f9;
      --text-color: #333;
      --primary-color: #0070f3;
      --text-secondary: #666;
      --border-color: #e0e0e0;
      --card-bg: #ffffff;
      --header-bg: #ffffff;
      --footer-bg: #f0f0f0;
    }
    
    /* 다크모드 변수 정의 - ThemeProvider가 .dark 클래스를 추가하면 적용됨 */
    .dark, .dark-mode, [data-theme="dark"] {
      --background-color: #121212 !important;
      --text-color: #e0e0e0 !important;
      --text-secondary: #a0a0a0 !important;
      --border-color: #333 !important;
      --card-bg: #1e1e1e !important;
      --header-bg: #1e1e1e !important;
      --footer-bg: #121212 !important;
    }
    
    /* body에 CSS 변수 적용 - transition 포함 */
    body {
      background-color: var(--background-color) !important;
      color: var(--text-color) !important;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    /* 카드 및 주요 컴포넌트도 변수 사용 */
    .bg-white, .bg-card {
      background-color: var(--card-bg) !important;
    }
    
    .text-gray-900, .text-black {
      color: var(--text-color) !important;
    }
    
    .text-gray-600, .text-gray-500 {
      color: var(--text-secondary) !important;
    }
  `;
  
  // 기본 폰트 로드
  if (!document.getElementById('loop-fonts')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'loop-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href = '/assets/fonts/font.css';
    document.head.appendChild(fontLink);
  }
  
  // 전자문서 스타일 로드
  if (!document.getElementById('loop-electron-styles')) {
    const electronStyleLink = document.createElement('link');
    electronStyleLink.id = 'loop-electron-styles';
    electronStyleLink.rel = 'stylesheet';
    electronStyleLink.href = '/assets/styles/electron-styles.css';
    document.head.appendChild(electronStyleLink);
  }
  
  console.log('Loop CSS 변수 및 스타일 초기화 완료');
  
  // 일정 시간 후 DOM에 스타일이 제대로 적용되었는지 확인
  setTimeout(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.documentElement.classList.contains('dark-mode');
    console.log(`현재 body 배경색: ${bodyBg}, 다크모드: ${isDark}`);
  }, 1000);
};

export default initStyles;
