/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 단순하게 'class'만 사용하여 .dark 클래스로 다크모드 활성화
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background-color)',
        foreground: 'var(--text-color)',
        primary: 'var(--primary-color)',
        'primary-color': 'var(--primary-color)',
        secondary: 'var(--text-secondary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border-color)',
        'border-color': 'var(--border-color)',
        card: 'var(--card-bg)',
        'card-bg': 'var(--card-bg)',
        header: 'var(--header-bg)',
        'header-bg': 'var(--header-bg)',
        footer: 'var(--footer-bg)',
        'footer-bg': 'var(--footer-bg)',
        focus: 'var(--focus-outline)',
        'focus-outline': 'var(--focus-outline)',
        // WCAG 가이드라인 색상 팔레트
        'wcag-light-primary': '#6200EE',
        'wcag-light-bg': '#FFFFFF',
        'wcag-light-border': '#E0E0E0',
        'wcag-dark-primary': '#BB86FC',
        'wcag-dark-bg': '#121212',
        'wcag-dark-surface': '#1E1E1E',
        'wcag-dark-border': '#2A2A2A',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        header: '60px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--primary-color), rgba(0, 112, 243, 0.8))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addBase }) {
      addBase({
        // 기본 CSS 변수 확실히 적용
        ':root': {
          '--background-color': '#f9f9f9',
          '--text-color': '#333',
          '--primary-color': '#0070f3',
        }
      })
    }
  ],
};
