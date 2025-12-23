/**
 * Jest Setup Configuration
 * Configuração global para testes do sistema QA educacional
 */

require('@testing-library/jest-dom');

// Configurar jest-fetch-mock para mocks robustos de fetch
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}));

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.sessionStorage = sessionStorageMock;

// Mock das APIs de performance
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  now: jest.fn(() => Date.now()),
};

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Configurações de timeout para testes longos
jest.setTimeout(10000);

// Suppress console warnings durante testes
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes('Warning: React.createFactory() is deprecated')
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// Setup para testes de acessibilidade
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};