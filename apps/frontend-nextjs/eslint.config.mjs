// ESLint Configuration for Medical Educational Platform
// Native ESLint 9 flat config with eslint-config-next@16

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  // Next.js core web vitals (includes React, TypeScript, a11y, import plugins)
  ...nextCoreWebVitals,

  // React Compiler rules - downgrade to warnings since compilationMode is "annotation" (opt-in)
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },

  // Jest environment for test files
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'jest.setup.js',
      'tests/**/*.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Service Worker files
  {
    files: ['public/sw.js', '**/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        CACHE_NAME: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },

  // Security rules for JavaScript files
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      // === PREVENÇÃO DE INJECTION ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // === VALIDAÇÃO DE ENTRADA ===
      'eqeqeq': ['error', 'always'],
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // === REGRAS CUSTOMIZADAS PARA DADOS MÉDICOS ===
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.object.name="console"][arguments.0.type="TemplateLiteral"]',
          message: 'Avoid logging template literals that might contain sensitive medical data',
        },
      ],

      // === ERROR HANDLING FOR MEDICAL CONTEXT ===
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unreachable': 'error',
      'no-fallthrough': 'error',

      // Reasonable defaults
      'no-unused-vars': 'warn',
      'react/no-unescaped-entities': 'off',
      'no-undef': 'warn',
    },
  },

  // Security rules for TypeScript files
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // === PREVENÇÃO DE INJECTION ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // === VALIDAÇÃO DE ENTRADA ===
      'eqeqeq': ['error', 'always'],
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // === REGRAS CUSTOMIZADAS PARA DADOS MÉDICOS ===
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.object.name="console"][arguments.0.type="TemplateLiteral"]',
          message: 'Avoid logging template literals that might contain sensitive medical data',
        },
      ],

      // === ERROR HANDLING FOR MEDICAL CONTEXT ===
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unreachable': 'error',
      'no-fallthrough': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/no-unescaped-entities': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // Stricter rules for medical calculation components
  {
    files: [
      '**/DoseCalculator/**/*.{ts,tsx}',
      '**/DispensingChecklist/**/*.{ts,tsx}',
      '**/services/api.ts',
      '**/utils/doseCalculations.ts',
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-param-reassign': 'error',
    },
  },

  // Ignore patterns (migrated from .eslintignore)
  {
    ignores: [
      // Build outputs
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'dist/**',
      '.vercel/**',

      // Configuration files
      '*.config.js',
      '*.config.mjs',
      'next.config.js',
      'eslint.config.mjs',
      'scripts/**',

      // Environment and system files
      '.env*',
      '.DS_Store',
      '*.log',
      '*.tgz',
    ],
  },
];
