module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  env: {
    node: true,
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: ['./tsconfig.json', './tsconfig.main.json']
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // TypeScript 관련 규칙
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    
    // 일반 JavaScript 규칙
    'no-console': 'off', // 개발 단계에서는 console.log 허용
    'no-debugger': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // React 관련 규칙
    'react/react-in-jsx-scope': 'off', // React 17+ 에서는 불필요
    'react/prop-types': 'off', // TypeScript 사용시 불필요
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'native-modules',
    '*.d.ts'
  ],
  overrides: [
    {
      // Main process 파일들 (Node.js 환경)
      files: ['src/main/**/*.ts'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off'
      }
    },
    {
      // Renderer process 파일들 (Browser 환경)
      files: ['src/app/**/*.tsx', 'src/components/**/*.tsx', 'src/pages/**/*.tsx'],
      env: {
        browser: true,
        node: false
      }
    },
    {
      // Preload 스크립트
      files: ['src/preload/**/*.ts'],
      env: {
        browser: true,
        node: true
      }
    }
  ]
};
