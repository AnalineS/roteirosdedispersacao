// ============================================
// TYPE SYSTEM INDEX - Centralizando todos os types
// ============================================

// Re-export all types from modules
export * from './events';
export * from './forms';
export * from './api';
export * from './components';
export * from './contexts';
export * from './utils';

// Import types needed for utility functions
import type { ApiResponse, ApiError } from './api';
import type { ValidationRule } from './forms';

// Common type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// Type assertion helpers
export function assertIsString(value: unknown, message?: string): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(message || `Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, message?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(message || `Expected number, got ${typeof value}`);
  }
}

export function assertIsObject(value: unknown, message?: string): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(message || `Expected object, got ${typeof value}`);
  }
}

export function assertIsArray(value: unknown, message?: string): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new TypeError(message || `Expected array, got ${typeof value}`);
  }
}

// Safe type converters
export function toNumber(value: unknown, defaultValue = 0): number {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function toString(value: unknown, defaultValue = ''): string {
  if (isString(value)) return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

export function toBoolean(value: unknown): boolean {
  if (isBoolean(value)) return value;
  if (isString(value)) {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (isNumber(value)) return value !== 0;
  return Boolean(value);
}

// Common generic constraints
export interface Identifiable {
  id: string;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface Sortable {
  order: number;
}

export interface Activatable {
  active: boolean;
}

export interface Deletable {
  deleted?: boolean;
  deletedAt?: string;
}

// Common entity types
export type Entity = Identifiable & Timestamped;
export type SortableEntity = Entity & Sortable;
export type ActivatableEntity = Entity & Activatable;
export type DeletableEntity = Entity & Deletable;

// API response utilities
export function createSuccessResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    data,
    status: 200,
    message,
    timestamp: Date.now(),
    success: true
  };
}

export function createErrorResponse(
  message: string,
  status = 500,
  code = 'INTERNAL_ERROR'
): ApiError {
  return {
    code,
    message,
    status,
    timestamp: Date.now()
  };
}

// Form validation utilities
export function createValidationRule<T>(
  validator: (value: T) => boolean,
  message: string
): ValidationRule<T> {
  return {
    validator: (value) => validator(value) || message,
    message
  };
}

export const commonValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    required: true,
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule<string> => ({
    minLength: min,
    message: message || `Minimum ${min} characters required`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    maxLength: max,
    message: message || `Maximum ${max} characters allowed`
  }),
  
  email: (message = 'Please enter a valid email'): ValidationRule<string> => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message
  }),
  
  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    pattern: /^https?:\/\/.+/,
    message
  })
};

// Event utilities
export function createEventHandler<T extends object = Event>(
  handler: (event: T) => void,
  options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  }
): (event: T) => void {
  return (event: T) => {
    if (options?.preventDefault && 'preventDefault' in event) {
      (event as any).preventDefault();
    }
    if (options?.stopPropagation && 'stopPropagation' in event) {
      (event as any).stopPropagation();
    }
    handler(event);
  };
}

// Re-export JSX utilities from separate file
export { createContextProvider, withDefaultProps } from '@/utils/contextUtils';

export function omitProps<T extends object, K extends keyof T>(
  props: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...props };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pickProps<T extends object, K extends keyof T>(
  props: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in props) {
      result[key] = props[key];
    }
  });
  return result;
}

// Export React types for convenience
export type {
  ReactNode,
  ReactElement,
  ComponentType,
  FC,
  PropsWithChildren,
  RefObject,
  MutableRefObject,
  CSSProperties
} from 'react';