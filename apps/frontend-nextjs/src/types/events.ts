// ============================================
// EVENT TYPES - Substituição de any em events
// ============================================

export type SyntheticEvent<T = Element> = React.SyntheticEvent<T>;
export type MouseEvent<T = Element> = React.MouseEvent<T>;
export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
export type FormEvent<T = Element> = React.FormEvent<T>;
export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
export type FocusEvent<T = Element> = React.FocusEvent<T>;
export type TouchEvent<T = Element> = React.TouchEvent<T>;
export type WheelEvent<T = Element> = React.WheelEvent<T>;
export type ClipboardEvent<T = Element> = React.ClipboardEvent<T>;
export type DragEvent<T = Element> = React.DragEvent<T>;

// Tipos específicos para elementos HTML comuns
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
export type FormSubmitEvent = FormEvent<HTMLFormElement>;
export type ButtonClickEvent = MouseEvent<HTMLButtonElement>;
export type DivClickEvent = MouseEvent<HTMLDivElement>;
export type LinkClickEvent = MouseEvent<HTMLAnchorElement>;

// Tipos para event handlers
export type EventHandler<E = SyntheticEvent> = (event: E) => void;
export type AsyncEventHandler<E = SyntheticEvent> = (event: E) => Promise<void>;

export type ClickHandler<T = Element> = EventHandler<MouseEvent<T>>;
export type ChangeHandler<T = Element> = EventHandler<ChangeEvent<T>>;
export type SubmitHandler<T = Element> = EventHandler<FormEvent<T>>;
export type KeyHandler<T = Element> = EventHandler<KeyboardEvent<T>>;
export type FocusHandler<T = Element> = EventHandler<FocusEvent<T>>;

// Specific handler types for ActiveHandlersSystem
export type ClickEventHandler = EventHandler<MouseEvent>;
export type SubmitEventHandler = EventHandler<FormEvent>;
export type ChangeEventHandler = EventHandler<ChangeEvent>;
export type KeyEventHandler = EventHandler<KeyboardEvent>;

// Tipos para event handlers com dados
export interface EventWithData<E = SyntheticEvent, D = unknown> {
  event: E;
  data: D;
}

export type DataEventHandler<E = SyntheticEvent, D = unknown> = (
  eventWithData: EventWithData<E, D>
) => void;

// Custom event types
export interface CustomEvent<T = unknown> {
  type: string;
  detail: T;
  timestamp: number;
  source?: string;
}

export interface ErrorEvent {
  type: 'error';
  error: Error;
  timestamp: number;
  component?: string;
  stack?: string;
}

export interface EventAnalytics {
  type: 'analytics';
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface NavigationEvent {
  type: 'navigation';
  from: string;
  to: string;
  method: 'push' | 'replace' | 'back' | 'forward';
  timestamp: number;
}

export interface UserInteractionEvent {
  type: 'interaction';
  action: 'click' | 'hover' | 'focus' | 'scroll' | 'keypress';
  element: string;
  elementType: string;
  position?: { x: number; y: number };
  metadata?: Record<string, unknown>;
}

// Event emitter types
export interface EventEmitter<T extends Record<string, unknown[]> = Record<string, unknown[]>> {
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  emit<K extends keyof T>(event: K, ...args: T[K]): void;
}

// Utility types para events
export type ExtractEventType<T> = T extends EventHandler<infer E> ? E : never;
export type EventTarget<E> = E extends SyntheticEvent<infer T> ? T : never;