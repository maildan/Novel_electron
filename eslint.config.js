const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const nextPlugin = require('@next/eslint-plugin-next');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        args: 'after-used',
        destructuredArrayIgnorePattern: '^_',
        caughtErrors: 'none' // catch 블록의 error 변수는 무시
      }],
      'no-unused-vars': 'off', // TypeScript 버전으로 덮어씀
      'no-console': 'off', // 개발 단계에서는 console.log 허용
      'no-debugger': 'error',
      'prefer-const': 'warn', // error에서 warning으로 완화
      'no-var': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn', // error에서 warning으로 완화
      '@typescript-eslint/no-namespace': 'warn', // error에서 warning으로 완화
      'no-case-declarations': 'warn', // error에서 warning으로 완화
      'no-prototype-builtins': 'warn', // error에서 warning으로 완화
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'native-modules/**',
      '**/*.d.ts',
    ],
  }
);
