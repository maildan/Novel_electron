/**
 * CSS 스타일 주입 모듈
 * 
 * WCAG 가이드라인을 준수하는 CSS 변수와 스타일을 주입합니다.
 */

export const injectStyles = () => {
  // WCAG 기반 CSS 변수를 문서에 적용 (모듈화된 variables.css와 동기화)
  const style = document.createElement('style');
  style.textContent = `
    :root {
      /* WCAG 가이드라인 기반 라이트 모드 색상 팔레트 */
      --background: #ffffff;
      --foreground: #121212;
      --background-secondary: #f5f5f5;
      
      /* 텍스트 색상 - 4.5:1 대비 비율 확보 */
      --text-primary: #121212;
      --text-secondary: #424242;
      --text-tertiary: #616161;
      --text-disabled: #9e9e9e;
      
      /* 액센트 및 상호작용 색상 */
      --accent-primary: #3b82f6;
      --accent-secondary: #1d4ed8;
      --accent-tertiary: #60a5fa;
      
      /* 경계선 및 구분선 */
      --border-primary: #e0e0e0;
      --border-secondary: #f0f0f0;
      --border-focus: #3b82f6;
      
      /* 배경 및 표면 */
      --surface-primary: #ffffff;
      --surface-secondary: #fafafa;
      --surface-tertiary: #f5f5f5;
      --surface-hover: #f0f0f0;
      
      /* 상태 색상 */
      --success: #4caf50;
      --warning: #ff9800;
      --error: #f44336;
      --info: #2196f3;
      
      /* 그림자 */
      --shadow-light: rgba(0, 0, 0, 0.05);
      --shadow-medium: rgba(0, 0, 0, 0.1);
      --shadow-heavy: rgba(0, 0, 0, 0.15);
      
      /* 호버 및 포커스 효과 */
      --hover-opacity: 0.9;
      --focus-ring-width: 2px;
      --focus-ring-offset: 2px;
      
      /* 레거시 호환성 */
      --background-color: var(--background);
      --text-color: var(--text-primary);
      --primary-color: var(--accent-primary);
      --border-color: var(--border-primary);
      --card-bg: var(--surface-primary);
      --header-bg: var(--surface-primary);
      --footer-bg: var(--surface-tertiary);
      --hover-color: var(--surface-hover);
      --shadow-color: var(--shadow-medium);
      --focus-outline: var(--border-focus);
    }
    
    /* WCAG 가이드라인 기반 다크 모드 */
    .dark, [data-theme="dark"] {
      --background: #121212;
      --foreground: #e0e0e0;
      --background-secondary: #1e1e1e;
      
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --text-tertiary: #757575;
      --text-disabled: #616161;
      
      --accent-primary: #60a5fa;
      --accent-secondary: #3b82f6;
      --accent-tertiary: #93c5fd;
      
      --border-primary: #333333;
      --border-secondary: #2a2a2a;
      --border-focus: #60a5fa;
      
      --surface-primary: #1e1e1e;
      --surface-secondary: #242424;
      --surface-tertiary: #2a2a2a;
      --surface-hover: #333333;
      
      --success: #66bb6a;
      --warning: #ffb74d;
      --error: #ef5350;
      --info: #42a5f5;
      
      --shadow-light: rgba(0, 0, 0, 0.2);
      --shadow-medium: rgba(0, 0, 0, 0.3);
      --shadow-heavy: rgba(0, 0, 0, 0.4);
      
      /* 레거시 호환성 */
      --background-color: var(--background);
      --text-color: var(--text-primary);
      --border-color: var(--border-primary);
      --card-bg: var(--surface-primary);
      --header-bg: var(--surface-primary);
      --footer-bg: var(--surface-tertiary);
      --hover-color: var(--surface-hover);
      --shadow-color: var(--shadow-medium);
      --focus-outline: var(--border-focus);
    }
    
    /* 기본 스타일 */
    body {
      background-color: var(--background-color);
      color: var(--text-color);
      font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif);
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* 고대비 모드 지원 */
    @media (prefers-contrast: high) {
      :root {
        --text-primary: #000000;
        --text-secondary: #333333;
        --border-primary: #000000;
        --accent-primary: #0000ff;
      }
      
      .dark {
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-primary: #ffffff;
        --accent-primary: #66bb6a;
      }
    }
    
    /* 모션 감소 Setup 지원 */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // 외부 스타일시트 로드
  const loadStylesheet = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onerror = () => console.warn('⚠️ 스타일시트 로드 Failed: ${href}');
    document.head.appendChild(link);
  };
  
  // 로드할 스타일 목록
  try {
    loadStylesheet('/assets/fonts/font.css');
    loadStylesheet('/assets/styles/electron-styles.css');
    console.log('✅ 스타일 시트 주입 Success');
  } catch (error) {
    console.warn('⚠️ 외부 스타일시트 로드 중 Error:', error);
  }
  
  return true;
};
