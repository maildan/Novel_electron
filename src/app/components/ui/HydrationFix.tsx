'use client';

import { useEffect } from 'react';

/**
 * 하이드레이션 불일치 문제 해결을 위한 컴포넌트
 * 
 * 1. ColorZilla와 같은 브라우저 확장 프로그램이 주입하는 cz-shortcut-listen 속성으로 인해
 *    발생하는 하이드레이션 불일치 해결
 * 2. Next.js 하이드레이션 문제 해결을 위한 추가 처리
 * 3. SVG 컴포넌트의 빈 style 속성으로 인한 하이드레이션 불일치 해결
 * 4. 빈 HTML 문제 해결을 위한 문서 구조 확인 및 수정
 */
export default function HydrationFix() {
  useEffect(() => {
    console.log('🔧 HydrationFix: 하이드레이션 문제 해결 시작');

    // 1. ColorZilla 확장 프로그램이 주입하는 속성 제거
    if (document.body.hasAttribute('cz-shortcut-listen')) {
      document.body.removeAttribute('cz-shortcut-listen');
      console.log('✅ HydrationFix: cz-shortcut-listen 속성 제거');
    }

    // 2. SVG 요소의 빈 style 속성 제거 (하이드레이션 불일치 방지)
    const svgElements = document.querySelectorAll('svg[style=""], path[style=""], rect[style=""], circle[style=""], line[style=""], ellipse[style=""]');
    svgElements.forEach((element) => {
      element.removeAttribute('style');
    });
    
    if (svgElements.length > 0) {
      console.log(`✅ HydrationFix: ${svgElements.length}개 SVG 요소의 빈 style 속성 제거`);
    }

    // 속성이 다시 추가되는 것을 감지하여 제거하는 MutationObserver 설정
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'cz-shortcut-listen'
        ) {
          document.body.removeAttribute('cz-shortcut-listen');
          console.log('🔄 HydrationFix: cz-shortcut-listen 속성 재제거');
        }
        
        // SVG 요소에 빈 style 속성이 추가되는 경우 제거
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style' &&
          mutation.target instanceof Element &&
          (mutation.target.tagName === 'svg' || 
           mutation.target.tagName === 'path' || 
           mutation.target.tagName === 'rect' ||
           mutation.target.tagName === 'circle' ||
           mutation.target.tagName === 'line' ||
           mutation.target.tagName === 'ellipse') &&
          mutation.target.getAttribute('style') === ''
        ) {
          mutation.target.removeAttribute('style');
          console.log('🔄 HydrationFix: SVG 빈 style 속성 재제거');
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['cz-shortcut-listen', 'style'],
      subtree: true  // SVG 요소들을 감지하기 위해 하위 트리도 감시
    });

    // 2. Next.js 하이드레이션 문제 해결
    // 빈 HTML이나 불완전한 렌더링을 방지하기 위한 추가 처리
    const checkAndFixEmptyContent = () => {
      const appContainer = document.getElementById('__next') || document.body;
      
      if (!appContainer.children.length) {
        console.warn('⚠️ HydrationFix: 빈 앱 컨테이너 감지');
        // 필요시 여기에 복구 로직 추가
      }
    };

    // DOM이 완전히 로드된 후 체크
    if (document.readyState === 'complete') {
      checkAndFixEmptyContent();
    } else {
      window.addEventListener('load', checkAndFixEmptyContent);
    }

    // 3. 테마 관련 속성 보정
    const fixThemeAttributes = () => {
      const root = document.documentElement;
      
      // data-theme이 없으면 기본값 설정
      if (!root.hasAttribute('data-theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        console.log('🎨 HydrationFix: 기본 테마 속성 설정');
      }
    };

    fixThemeAttributes();

    // 정리 함수
    return () => {
      observer.disconnect();
      window.removeEventListener('load', checkAndFixEmptyContent);
      console.log('🧹 HydrationFix: 정리 완료');
    };
  }, []);

  return null;
}
