import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    // 저장된 테마 또는 시스템 선호도에 따른 다크모드 설정
                    const theme = localStorage.getItem('theme') ||
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    
                    // 즉시 class 추가하여 플래시 방지
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                    
                    // 색상 스킴 설정
                    document.documentElement.style.colorScheme = theme;
                  } catch (e) {
                    // 오류 발생 시 기본 라이트 모드
                    console.warn('Theme initialization failed:', e);
                  }
                })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
