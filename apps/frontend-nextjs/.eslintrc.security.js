// ESLint Security Configuration for Medical Educational Platform
// Configuração específica de segurança para análise JavaScript/TypeScript
// 
// Focado em:
// - Prevenção de XSS em dados médicos
// - Validação segura de entrada de dados clínicos
// - Proteção contra injection attacks
// - Gerenciamento seguro de dados sensíveis
// - Conformidade com LGPD para dados pessoais

module.exports = {
  // Configuração base de segurança
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'next/core-web-vitals'
  ],
  
  // Plugins de segurança específicos
  plugins: [
    'security',
    '@typescript-eslint'
  ],
  
  // Parser para TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  
  // Ambiente de execução
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  
  // Regras de segurança específicas para plataforma médica
  rules: {
    // === PREVENÇÃO DE INJECTION ===
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // === VALIDAÇÃO DE ENTRADA ===
    'eqeqeq': ['error', 'always'],
    'use-isnan': 'error',
    'valid-typeof': 'error',
    
    // === TYPESCRIPT SECURITY ===
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    
    // === REGRAS CUSTOMIZADAS PARA DADOS MÉDICOS ===
    'no-restricted-syntax': [
      'error',
      {
        'selector': 'CallExpression[callee.object.name="console"][arguments.0.type="TemplateLiteral"]',
        'message': 'Avoid logging template literals that might contain sensitive medical data'
      }
    ],
    
    // === ERROR HANDLING FOR MEDICAL CONTEXT ===
    'no-empty': ['error', { 'allowEmptyCatch': false }],
    'no-unreachable': 'error',
    'no-fallthrough': 'error'
  },
  
  // Configurações específicas por arquivo/diretório
  overrides: [
    {
      // Regras mais rigorosas para componentes de cálculo médico
      files: [
        '**/DoseCalculator/**/*.{ts,tsx}',
        '**/DispensingChecklist/**/*.{ts,tsx}',
        '**/services/api.ts',
        '**/utils/doseCalculations.ts'
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        'no-param-reassign': 'error'
      }
    },
    
    {
      // Regras menos rigorosas para testes
      files: [
        '**/__tests__/**/*.{ts,tsx,js,jsx}',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    }
  ]
};