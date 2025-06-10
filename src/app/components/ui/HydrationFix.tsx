'use client';

import { useEffect } from 'react';

/**
 * 하이드레이션 불일치 문제 해결을 위한 컴포넌트 (최적화된 버전)
 * 
 * 주요 기능:
 * 1. ColorZilla 확장 프로그램 속성 제거
 * 2. SVG 빈 style 속성 제거 (한 번만)
 * 3. 테마 속성 설정
 */
export default function HydrationFix() {
  useEffect(() => {
    console.log('🔧 HydrationFix: 하이드레이션 문제 해결 시작');

    let isCleanupComplete = false;

    const performCleanup = () => {
      if (isCleanupComplete) return;

      try {
        // 1. ColorZilla 확장 프로그램 속성 제거
        const elementsWithCz = document.querySelectorAll('[cz-shortcut-listen]');
        elementsWithCz.forEach((el) => {
          el.removeAttribute('cz-shortcut-listen');
        });

        // 2. SVG 요소의 빈 style 속성 제거 (한 번만)
        const svgElements = document.querySelectorAll('svg[style=""], path[style=""], rect[style=""], circle[style=""], line[style=""], ellipse[style=""]');
        if (svgElements.length > 0) {
          console.log(`🔄 HydrationFix: ${svgElements.length}개 SVG 빈 style 속성 제거`);
          svgElements.forEach((svg) => {
            svg.removeAttribute('style');
          });
        }

        // 3. 테마 속성이 누락된 경우 기본값 설정
        if (!document.documentElement.hasAttribute('data-theme')) {
          console.log('🎨 HydrationFix: 기본 테마 속성 설정');
          document.documentElement.setAttribute('data-theme', 'dark');
        }

        isCleanupComplete = true;
        console.log('✅ HydrationFix: 정리 작업 완료');

      } catch (error) {
        console.error('❌ HydrationFix 정리 중 오류:', error);
      }
    };

    // 즉시 실행
    performCleanup();

    // DOM이 완전히 로드된 후 한 번 더 실행
    if (document.readyState !== 'complete') {
      const handleLoad = () => {
        setTimeout(performCleanup, 100);
        window.removeEventListener('load', handleLoad);
      };
      window.addEventListener('load', handleLoad);
      
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }

    return () => {
      console.log('🧹 HydrationFix: 정리 완료');
    };
  }, []); // 빈 배열로 한 번만 실행

  return null;
}
