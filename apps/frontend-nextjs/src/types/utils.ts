// ============================================
// UTILITY TYPES - Substituição de any em utilities
// ============================================

// Generic utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type NonNullable<T> = T extends null | undefined ? never : T;
export type NonEmptyArray<T> = [T, ...T[]];

// Object utility types
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

// Function utility types
export type Func<TArgs extends unknown[] = unknown[], TReturn = unknown> = (...args: TArgs) => TReturn;
export type AsyncFunc<TArgs extends unknown[] = unknown[], TReturn = unknown> = (...args: TArgs) => Promise<TReturn>;
export type VoidFunc<TArgs extends unknown[] = unknown[]> = Func<TArgs, void>;

export type FirstParameter<T> = T extends (first: infer P, ...rest: unknown[]) => unknown ? P : never;
export type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
export type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : unknown;

// Handler types
export type Handler<T = unknown> = (value: T) => void;
export type AsyncHandler<T = unknown> = (value: T) => Promise<void>;
export type ErrorHandler = (error: Error) => void;
// EventHandler já exportado em events.ts

// Transform types
export type Transform<TInput, TOutput> = (input: TInput) => TOutput;
export type AsyncTransform<TInput, TOutput> = (input: TInput) => Promise<TOutput>;
export type Validator<T> = (value: T) => boolean | string;
export type AsyncValidator<T> = (value: T) => Promise<boolean | string>;

// Predicate types
export type Predicate<T> = (value: T) => boolean;
export type TypeGuard<T, U extends T> = (value: T) => value is U;

// Collection types
export type Dictionary<T = unknown> = Record<string, T>;
export type StringDictionary = Dictionary<string>;
export type NumberDictionary = Dictionary<number>;
export type BooleanDictionary = Dictionary<boolean>;

export type Collection<T> = T[] | Set<T> | Map<string, T>;
export type KeyValuePair<K = string, V = unknown> = [K, V];
export type Entry<T> = T extends Record<infer K, infer V> ? [K, V] : never;

// Promise types
export type PromiseType<T> = T extends Promise<infer U> ? U : T;
export type PromisifiedKeys<T> = {
  [K in keyof T]: T[K] extends Func ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> : T[K];
};

// Array types
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest] ? Rest : [];
export type Length<T extends readonly unknown[]> = T['length'];

// String types
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;
export type Split<S extends string, D extends string> = S extends `${infer T}${D}${infer U}` 
  ? [T, ...Split<U, D>] 
  : [S];

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Not<T extends boolean> = T extends true ? false : true;
export type And<A extends boolean, B extends boolean> = A extends true ? B : false;
export type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

// Branded types
export type Brand<T, B> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type Email = Brand<string, 'Email'>;
export type URL = Brand<string, 'URL'>;
export type Timestamp = Brand<number, 'Timestamp'>;

// Error types
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export type Success<T> = { success: true; data: T; error?: never };
export type Failure<E = Error> = { success: false; data?: never; error: E };
export type ResultType<T, E = Error> = Success<T> | Failure<E>;

// State machine types
export interface StateMachine<TState extends string, TEvent extends string> {
  current: TState;
  states: Record<TState, StateDefinition<TState, TEvent>>;
  transition: (event: TEvent) => TState;
  canTransition: (event: TEvent) => boolean;
}

export interface StateDefinition<TState extends string, TEvent extends string> {
  on?: Partial<Record<TEvent, TState>>;
  entry?: VoidFunc;
  exit?: VoidFunc;
}

// Cache types
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  onEvict?: <T>(key: string, value: T) => void;
}

export type CacheKey = string | number;
export type CacheValue<T = unknown> = T;

// Debounce/Throttle types
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export type DebouncedFunc<TFunc extends Func> = TFunc & {
  cancel: () => void;
  flush: () => ReturnType<TFunc> | undefined;
  pending: () => boolean;
};

export type ThrottledFunc<TFunc extends Func> = TFunc & {
  cancel: () => void;
  flush: () => ReturnType<TFunc> | undefined;
};

// Logger types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface Logger {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, metadata?: Record<string, unknown>) => void;
}

// Serialization types
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

export type JSONValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONObject 
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

// Configuration types
export type Config<T = Record<string, unknown>> = {
  readonly [K in keyof T]: T[K];
}

export type ConfigLoader<T> = () => T | Promise<T>;
export type ConfigValidator<T> = (config: unknown) => config is T;

// Plugin/Extension types
export interface Plugin<TOptions = unknown> {
  name: string;
  version: string;
  install: (options?: TOptions) => void | Promise<void>;
  uninstall?: () => void | Promise<void>;
}

export interface Extension<THost, TOptions = unknown> {
  extend: (host: THost, options?: TOptions) => THost;
}

// Middleware types
export type Middleware<TContext = unknown, TNext = unknown> = (
  context: TContext,
  next: () => Promise<TNext>
) => Promise<TNext>;

export type MiddlewareStack<TContext = unknown> = Middleware<TContext, unknown>[];

// Observer pattern types
export interface Observer<T = unknown> {
  update: (data: T) => void;
}

export interface Observable<T = unknown> {
  subscribe: (observer: Observer<T>) => () => void;
  unsubscribe: (observer: Observer<T>) => void;
  notify: (data: T) => void;
}

// Builder pattern types
export interface Builder<T> {
  build: () => T;
  reset: () => this;
  clone: () => Builder<T>;
}

// Factory types
export type Factory<T, TArgs extends unknown[] = unknown[]> = (...args: TArgs) => T;
export type AsyncFactory<T, TArgs extends unknown[] = unknown[]> = (...args: TArgs) => Promise<T>;

// Dependency injection types
export type ServiceIdentifier<T = unknown> = string | symbol | Constructor<T>;
export type Constructor<T = {}> = new (...args: unknown[]) => T;

export interface ServiceDefinition<T = unknown> {
  identifier: ServiceIdentifier<T>;
  factory: Factory<T>;
  singleton?: boolean;
  dependencies?: ServiceIdentifier[];
}

// Utility functions types
export type Comparator<T> = (a: T, b: T) => number;
export type Equalizer<T> = (a: T, b: T) => boolean;
export type Hasher<T> = (value: T) => string | number;

// Time types
export type Duration = number; // milliseconds
export type Timeout = number; // setTimeout return type
export type Interval = number; // setInterval return type

export interface TimeSpan {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

// Math utility types
export type Numeric = number | bigint;
export type Range = { min: number; max: number };
export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rectangle = Point & Size;

// Type checking utilities
export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
export type IsFunction<T> = T extends Func ? true : false;
export type IsObject<T> = T extends object ? (IsFunction<T> extends true ? false : true) : false;
export type IsArray<T> = T extends readonly unknown[] ? true : false;

// Advanced utility types
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];
export type KeyOf<T> = keyof T;
export type TypeOf<T> = T extends infer U ? U : never;