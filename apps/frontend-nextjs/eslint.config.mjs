// ESLint Configuration for Medical Educational Platform
// Modern ESLint flat config format (ESLint 9+)
// Replaces deprecated `next lint` command with explicit configuration

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Next.js core web vitals configuration (includes React, TypeScript, etc.)
  ...compat.extends('next/core-web-vitals'),
  
  
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
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
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
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-param-reassign': 'error',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      '.vercel/**',
      '*.config.js',
      '*.config.mjs',
      'scripts/**',
    ],
  },
];