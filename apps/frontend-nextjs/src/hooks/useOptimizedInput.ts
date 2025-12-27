/**
 * Hook Otimizado para Input - PR #174
 * 
 * Combina debouncing, validação e haptic feedback 
 * para inputs médicos/farmacológicos
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from '@/lib/optimizations';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

interface UseOptimizedInputOptions<T> {
  initialValue: T;
  debounceMs?: number;
  validator?: (value: T) => ValidationResult;
  onDebouncedChange?: (value: T, validation: ValidationResult) => void;
  enableHapticFeedback?: boolean;
  hapticOnError?: boolean;
  hapticOnSuccess?: boolean;
  hapticOnWarning?: boolean;
  formatValue?: (value: T) => T;
  parseValue?: (rawValue: string) => T;
}

export function useOptimizedInput<T = string>({
  initialValue,
  debounceMs = 300,
  validator,
  onDebouncedChange,
  enableHapticFeedback = true,
  hapticOnError = true,
  hapticOnSuccess = false,
  hapticOnWarning = true,
  formatValue,
  parseValue
}: UseOptimizedInputOptions<T>) {

  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);
  
  const { error, success, warning, info } = useHapticFeedback();
  const lastValidationResult = useRef<ValidationResult>({ isValid: true });

  // Função de validação com feedback háptico
  const validateValue = useCallback((val: T) => {
    if (!validator) return { isValid: true };
    
    setIsValidating(true);
    
    try {
      const result = validator(val);
      
      // Haptic feedback baseado no resultado da validação
      if (enableHapticFeedback && JSON.stringify(result) !== JSON.stringify(lastValidationResult.current)) {
        if (!result.isValid && result.error && hapticOnError) {
          error();
        } else if (result.isValid && result.warning && hapticOnWarning) {
          warning();
        } else if (result.isValid && !result.warning && hapticOnSuccess) {
          success();
        }
      }
      
      lastValidationResult.current = result;
      setValidation(result);
      return result;
    } catch {
      const errorResult = { isValid: false, error: 'Erro de validação' };
      setValidation(errorResult);
      
      if (enableHapticFeedback && hapticOnError) {
        error();
      }
      
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [validator, enableHapticFeedback, hapticOnError, hapticOnSuccess, hapticOnWarning, error, success, warning]);

  // Handler debouncado para mudanças
  const debouncedChangeHandler = useCallback(
    debounce((...args: unknown[]) => {
      const val = args[0] as T;
      const validationResult = validateValue(val);
      setDebouncedValue(val);

      if (onDebouncedChange) {
        onDebouncedChange(val, validationResult);
      }
    }, debounceMs),
    [validateValue, onDebouncedChange, debounceMs]
  );

  // Handler para mudanças de valor
  const handleChange = useCallback((rawValue: string | T) => {
    let newValue: T;
    
    if (parseValue && typeof rawValue === 'string') {
      newValue = parseValue(rawValue);
    } else {
      newValue = rawValue as T;
    }
    
    // Aplicar formatação se fornecida
    if (formatValue) {
      newValue = formatValue(newValue);
    }
    
    // Feedback háptico sutil para mudanças de input
    if (enableHapticFeedback) {
      info();
    }
    
    setValue(newValue);
    debouncedChangeHandler(newValue);
  }, [parseValue, formatValue, enableHapticFeedback, info, debouncedChangeHandler]);

  // Reset function
  const reset = useCallback(() => {
    setValue(initialValue);
    setDebouncedValue(initialValue);
    setValidation({ isValid: true });
    
    // Cancelar debounce pendente
    if ('cancel' in debouncedChangeHandler) {
      debouncedChangeHandler.cancel();
    }
  }, [initialValue, debouncedChangeHandler]);

  // Force validation
  const forceValidation = useCallback(() => {
    return validateValue(value);
  }, [validateValue, value]);

  // Clear validation
  const clearValidation = useCallback(() => {
    setValidation({ isValid: true });
    lastValidationResult.current = { isValid: true };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('cancel' in debouncedChangeHandler) {
        debouncedChangeHandler.cancel();
      }
    };
  }, [debouncedChangeHandler]);

  return {
    // Values
    value,
    debouncedValue,
    
    // Validation
    validation,
    isValidating,
    
    // Handlers
    handleChange,
    setValue,
    
    // Utils
    reset,
    forceValidation,
    clearValidation,
    
    // Computed properties
    hasError: !validation.isValid,
    hasWarning: validation.isValid && !!validation.warning,
    isValid: validation.isValid && !validation.warning,
    
    // For form integration
    inputProps: {
      value: String(value),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
      'aria-invalid': !validation.isValid,
      'aria-describedby': validation.error || validation.warning ? 'input-error' : undefined
    }
  };
}

// Specialized hooks for medical/pharmaceutical inputs
export function useDosageInput(initialDose: number = 0) {
  return useOptimizedInput<number>({
    initialValue: initialDose,
    debounceMs: 500,
    parseValue: (raw) => parseFloat(raw) || 0,
    validator: (dose) => {
      if (dose < 0) return { isValid: false, error: 'Dose não pode ser negativa' };
      if (dose === 0) return { isValid: true, warning: 'Dose zerada - verifique se está correto' };
      if (dose > 1000) return { isValid: false, error: 'Dose muito alta - verifique os cálculos' };
      return { isValid: true };
    },
    hapticOnError: true,
    hapticOnWarning: true
  });
}

export function useWeightInput(initialWeight: number = 0) {
  return useOptimizedInput<number>({
    initialValue: initialWeight,
    debounceMs: 400,
    parseValue: (raw) => parseFloat(raw) || 0,
    validator: (weight) => {
      if (weight <= 0) return { isValid: false, error: 'Peso deve ser maior que zero' };
      if (weight < 2) return { isValid: true, warning: 'Peso muito baixo - confirme o valor' };
      if (weight > 200) return { isValid: true, warning: 'Peso alto - confirme o valor' };
      return { isValid: true };
    },
    hapticOnError: true,
    hapticOnWarning: true
  });
}

export function useAgeInput(initialAge: number = 0) {
  return useOptimizedInput<number>({
    initialValue: initialAge,
    debounceMs: 300,
    parseValue: (raw) => parseInt(raw) || 0,
    validator: (age) => {
      if (age <= 0) return { isValid: false, error: 'Idade deve ser maior que zero' };
      if (age > 120) return { isValid: false, error: 'Idade inválida' };
      if (age < 18) return { isValid: true, warning: 'Paciente menor de idade - cuidado especial necessário' };
      return { isValid: true };
    },
    hapticOnError: true,
    hapticOnWarning: true
  });
}