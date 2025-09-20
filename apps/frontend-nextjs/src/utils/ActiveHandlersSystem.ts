'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContextHub';
import { useSimpleTrack } from '@/components/tracking/IntegratedTrackingProvider';
import type { 
  MouseEvent, 
  ChangeEvent, 
  FormEvent, 
  KeyboardEvent, 
  TouchEvent, 
  FocusEvent,
  EventHandler,
  AsyncEventHandler,
  ClickEventHandler,
  SubmitEventHandler,
  ChangeEventHandler,
  KeyEventHandler 
} from '@/types/events';

// ============================================
// TYPES PARA HANDLERS
// ============================================

export interface EventContext {
  componentName?: string;
  elementId?: string;
  elementType?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface HandlerConfig {
  debounce?: number;
  throttle?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  track?: boolean;
  announce?: boolean;
  validate?: boolean;
  transform?: (data: unknown) => unknown;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

export interface SubmitHandlerConfig extends Omit<HandlerConfig, 'validate'> {
  validate?: (data: Record<string, FormDataEntryValue>) => boolean | string;
}

// ============================================
// SISTEMA DE HANDLERS ATIVOS
// ============================================

export class ActiveHandlersSystem {
  private static instance: ActiveHandlersSystem;
  private handlers = new Map<string, EventHandler<any>>();
  private config: HandlerConfig = {};
  private context: EventContext = { timestamp: Date.now() };

  static getInstance(): ActiveHandlersSystem {
    if (!ActiveHandlersSystem.instance) {
      ActiveHandlersSystem.instance = new ActiveHandlersSystem();
    }
    return ActiveHandlersSystem.instance;
  }

  // ============================================
  // CONFIGURAÇÃO E CONTEXTO
  // ============================================

  setConfig(config: HandlerConfig): void {
    this.config = { ...this.config, ...config };
  }

  setContext(context: Partial<EventContext>): void {
    this.context = { ...this.context, ...context, timestamp: Date.now() };
  }

  // ============================================
  // CLICK HANDLERS
  // ============================================

  createClickHandler(
    action: (event: MouseEvent, context: EventContext) => void | Promise<void>,
    config: HandlerConfig = {}
  ): { handler: ClickEventHandler, handlerId: string } {
    const finalConfig = { ...this.config, ...config };
    const handlerId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: MouseEvent) => {
      try {
        if (finalConfig.preventDefault) event.preventDefault();
        if (finalConfig.stopPropagation) event.stopPropagation();

        const eventContext: EventContext = {
          ...this.context,
          elementId: (event.target as HTMLElement).id,
          elementType: (event.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now()
        };

        if (finalConfig.track) {
          // Track será implementado no hook
        }

        await action(event, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(eventContext);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  // ============================================
  // FORM HANDLERS
  // ============================================

  createSubmitHandler(
    action: (data: Record<string, FormDataEntryValue>, context: EventContext) => void | Promise<void>,
    config: SubmitHandlerConfig = {}
  ): { handler: SubmitEventHandler, handlerId: string } {
    const finalConfig = { ...this.config, ...config };
    const handlerId = `submit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: FormEvent) => {
      try {
        if (finalConfig.preventDefault) event.preventDefault();
        if (finalConfig.stopPropagation) event.stopPropagation();

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Transform data if configured
        const transformedData = finalConfig.transform ? finalConfig.transform(data) : data;
        const typedData = transformedData as Record<string, FormDataEntryValue>;

        // Validate if configured
        if (config.validate && typeof config.validate === 'function') {
          const validation = config.validate(typedData);
          if (validation !== true) {
            throw new Error(typeof validation === 'string' ? validation : 'Validation failed');
          }
        }

        const eventContext: EventContext = {
          ...this.context,
          elementId: form.id,
          elementType: 'form',
          timestamp: Date.now(),
          metadata: { formData: typedData }
        };

        await action(typedData, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(typedData);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  createChangeHandler(
    action: (value: string | number | boolean | FileList | null, context: EventContext) => void | Promise<void>,
    config: HandlerConfig = {}
  ): { handler: ChangeEventHandler, handlerId: string } {
    const finalConfig = { ...this.config, ...config };
    const handlerId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: ChangeEvent) => {
      try {
        const target = event.target as HTMLInputElement;
        let value = target.value;

        // Handle different input types
        let processedValue: string | number | boolean | FileList | null = target.value;
        if (target.type === 'checkbox') {
          processedValue = target.checked;
        } else if (target.type === 'number') {
          processedValue = parseFloat(target.value) || 0;
        } else if (target.type === 'file') {
          processedValue = target.files;
        }

        // Transform value if configured
        const transformedValue = finalConfig.transform ? finalConfig.transform(processedValue) as typeof processedValue : processedValue;

        const eventContext: EventContext = {
          ...this.context,
          elementId: target.id,
          elementType: target.type || 'input',
          timestamp: Date.now(),
          metadata: { value: transformedValue }
        };

        await action(transformedValue, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(transformedValue);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  // ============================================
  // KEYBOARD HANDLERS
  // ============================================

  createKeyHandler(
    keys: string | string[],
    action: (event: KeyboardEvent, context: EventContext) => void | Promise<void>,
    config: HandlerConfig = {}
  ): { handler: KeyEventHandler, handlerId: string } {
    const finalConfig = { ...this.config, ...config };
    const targetKeys = Array.isArray(keys) ? keys : [keys];
    const handlerId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: KeyboardEvent) => {
      try {
        if (!targetKeys.includes(event.key)) return;

        if (finalConfig.preventDefault) event.preventDefault();
        if (finalConfig.stopPropagation) event.stopPropagation();

        const eventContext: EventContext = {
          ...this.context,
          elementId: (event.target as HTMLElement).id,
          elementType: (event.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now(),
          metadata: { 
            key: event.key, 
            code: event.code,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey
          }
        };

        await action(event, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(eventContext);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  // ============================================
  // GESTURE HANDLERS
  // ============================================

  createTouchHandler(
    action: (event: TouchEvent, context: EventContext) => void | Promise<void>,
    config: HandlerConfig = {}
  ) {
    const finalConfig = { ...this.config, ...config };
    const handlerId = `touch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: TouchEvent) => {
      try {
        if (finalConfig.preventDefault) event.preventDefault();
        if (finalConfig.stopPropagation) event.stopPropagation();

        const eventContext: EventContext = {
          ...this.context,
          elementId: (event.target as HTMLElement).id,
          elementType: (event.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now(),
          metadata: { 
            touches: event.touches.length,
            changedTouches: event.changedTouches.length
          }
        };

        await action(event, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(eventContext);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  // ============================================
  // UTILITY HANDLERS
  // ============================================

  createFocusHandler(
    action: (event: FocusEvent, context: EventContext) => void | Promise<void>,
    config: HandlerConfig = {}
  ) {
    const finalConfig = { ...this.config, ...config };
    const handlerId = `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = async (event: FocusEvent) => {
      try {
        const eventContext: EventContext = {
          ...this.context,
          elementId: (event.target as HTMLElement).id,
          elementType: (event.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now()
        };

        await action(event, eventContext);
        
        if (finalConfig.onSuccess) {
          finalConfig.onSuccess(eventContext);
        }
      } catch (error) {
        if (finalConfig.onError) {
          finalConfig.onError(error as Error);
        }
        throw error;
      }
    };

    this.handlers.set(handlerId, handler);
    return { handler, handlerId };
  }

  // ============================================
  // MANAGEMENT
  // ============================================

  removeHandler(handlerId: string): boolean {
    return this.handlers.delete(handlerId);
  }

  getHandler(handlerId: string): EventHandler | undefined {
    return this.handlers.get(handlerId);
  }

  clearAllHandlers(): void {
    this.handlers.clear();
  }

  getHandlerCount(): number {
    return this.handlers.size;
  }
}

// ============================================
// HOOK PARA HANDLERS ATIVOS
// ============================================

export const useActiveHandlers = (config: HandlerConfig = {}) => {
  const [handlersSystem] = useState(() => ActiveHandlersSystem.getInstance());
  const globalContext = useGlobalContext();
  const tracking = useSimpleTrack();
  
  // Refs para debounce/throttle
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallRef = useRef<number>(0);

  // Configurar sistema com contexto global
  useEffect(() => {
    handlersSystem.setContext({
      userId: globalContext.state.userId,
      sessionId: globalContext.state.sessionId
    });
  }, [handlersSystem, globalContext.state.userId, globalContext.state.sessionId]);

  // ============================================
  // WRAPPER PARA DEBOUNCE/THROTTLE
  // ============================================

  const wrapHandler = useCallback((handler: EventHandler<any>, handlerConfig: HandlerConfig | SubmitHandlerConfig) => {
    return (...args: unknown[]) => {
      const finalConfig = { ...config, ...handlerConfig };
      
      // Track if enabled
      if (finalConfig.track) {
        tracking.track('click', 'handler_triggered', {
          component: 'handler_component'
        });
      }

      // Debounce
      if (finalConfig.debounce) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          (handler as any)(...args);
        }, finalConfig.debounce);
        return;
      }

      // Throttle
      if (finalConfig.throttle) {
        const now = Date.now();
        if (now - lastCallRef.current < finalConfig.throttle) {
          return;
        }
        lastCallRef.current = now;
      }

      return (handler as any)(...args);
    };
  }, [config, tracking]);

  // ============================================
  // HANDLER CREATORS
  // ============================================

  const createClickHandler = useCallback((
    action: (event: MouseEvent, context: EventContext) => void | Promise<void>,
    handlerConfig: HandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createClickHandler(action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  const createSubmitHandler = useCallback((
    action: (data: Record<string, FormDataEntryValue>, context: EventContext) => void | Promise<void>,
    handlerConfig: SubmitHandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createSubmitHandler(action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  const createChangeHandler = useCallback((
    action: (value: string | number | boolean | FileList | null, context: EventContext) => void | Promise<void>,
    handlerConfig: HandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createChangeHandler(action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  const createKeyHandler = useCallback((
    keys: string | string[],
    action: (event: KeyboardEvent, context: EventContext) => void | Promise<void>,
    handlerConfig: HandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createKeyHandler(keys, action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  const createTouchHandler = useCallback((
    action: (event: TouchEvent, context: EventContext) => void | Promise<void>,
    handlerConfig: HandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createTouchHandler(action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  const createFocusHandler = useCallback((
    action: (event: FocusEvent, context: EventContext) => void | Promise<void>,
    handlerConfig: HandlerConfig = {}
  ) => {
    const { handler, handlerId } = handlersSystem.createFocusHandler(action, handlerConfig);
    return { handler: wrapHandler(handler, handlerConfig), handlerId };
  }, [handlersSystem, wrapHandler]);

  // ============================================
  // HANDLERS PRÉ-CONFIGURADOS COMUM
  // ============================================

  const handleNavigation = useCallback((path: string) => {
    const { handler } = createClickHandler(
      async (event, context) => {
        globalContext.navigate(path);
        
        if (config.announce) {
          globalContext.updateContext('last_navigation', {
            path,
            timestamp: context.timestamp
          });
        }
      },
      { track: true, announce: true }
    );
    return handler;
  }, [createClickHandler, globalContext, config.announce]);

  const handleFormValidation = useCallback((validationRules: Record<string, (value: FormDataEntryValue) => boolean | string>) => {
    const validateForm = (data: Record<string, FormDataEntryValue>): boolean | string => {
      for (const [field, rule] of Object.entries(validationRules)) {
        const result = rule(data[field]);
        if (result !== true) {
          return typeof result === 'string' ? result : `Invalid ${field}`;
        }
      }
      return true;
    };

    const submitConfig: SubmitHandlerConfig = {
      validate: validateForm,
      track: true
    };

    const { handler } = createSubmitHandler(
      async (data, context) => {
        // Form submission logic here
        globalContext.updateContext('last_form_submission', {
          data,
          timestamp: context.timestamp
        });
      },
      submitConfig
    );
    return handler;
  }, [createSubmitHandler, globalContext]);

  const handleSearch = useCallback((onSearch: (term: string) => void) => {
    const { handler } = createChangeHandler(
      async (value, context) => {
        if (typeof value === 'string' && value.length > 2) {
          onSearch(value);
          tracking.trackSearch(value, 0, 'component');
        }
      },
      { debounce: 500, track: true }
    );
    return handler;
  }, [createChangeHandler, tracking]);

  const handleKeyboardShortcuts = useCallback((shortcuts: Record<string, () => void>) => {
    const { handler } = createKeyHandler(
      Object.keys(shortcuts),
      async (event, context) => {
        const shortcut = shortcuts[event.key];
        if (shortcut) {
          shortcut();
        }
      },
      { preventDefault: true, track: true }
    );
    return handler;
  }, [createKeyHandler]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // Handler creators
    createClickHandler,
    createSubmitHandler,
    createChangeHandler,
    createKeyHandler,
    createTouchHandler,
    createFocusHandler,
    
    // Pre-configured handlers
    handleNavigation,
    handleFormValidation,
    handleSearch,
    handleKeyboardShortcuts,
    
    // System management
    removeHandler: handlersSystem.removeHandler.bind(handlersSystem),
    getHandler: handlersSystem.getHandler.bind(handlersSystem),
    clearAllHandlers: handlersSystem.clearAllHandlers.bind(handlersSystem),
    getHandlerCount: () => handlersSystem.getHandlerCount(),
    
    // Configuration
    setConfig: handlersSystem.setConfig.bind(handlersSystem),
    setContext: handlersSystem.setContext.bind(handlersSystem)
  };
};