'use client';

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Info, 
  Loader2,
  ChevronDown,
  Search,
  X,
  Calendar
} from 'lucide-react';

// Types
type FormValue = string | number | boolean | string[] | Date;

interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: FormValue) => string | null;
  message?: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'search';
  placeholder?: string;
  validation?: ValidationRule;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  autoComplete?: string;
  description?: string;
  icon?: React.ReactNode;
  showCharacterCount?: boolean;
  dependencies?: string[]; // Fields this depends on
  conditional?: (formData: Record<string, FormValue>) => boolean;
}

interface FormProps {
  fields: FormField[];
  initialData?: Record<string, FormValue>;
  onSubmit: (data: Record<string, FormValue>) => Promise<void> | void;
  onFieldChange?: (field: string, value: FormValue, allData: Record<string, FormValue>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  showProgress?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

interface FormContextType {
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  updateField: (name: string, value: FormValue) => void;
  validateField: (name: string) => void;
  setFieldTouched: (name: string) => void;
}

const FormContext = createContext<FormContextType | null>(null);

const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within OptimizedForm');
  }
  return context;
};

// Individual form field components
interface FormFieldProps {
  field: FormField;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (value: FormValue) => void;
  onBlur: () => void;
  onFocus: () => void;
  disabled?: boolean;
}

const TextInput: React.FC<FormFieldProps> = ({ 
  field, value, error, touched, onChange, onBlur, onFocus, disabled 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = field.type === 'password' && !showPassword ? 'password' : 'text';
  const characterCount = value?.toString().length || 0;
  const maxLength = field.validation?.max;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  return (
    <div className={`form-field text-input ${isFocused ? 'focused' : ''} ${error && touched ? 'error' : ''}`}>
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.validation?.required && <span className="required-indicator">*</span>}
      </label>
      
      {field.description && (
        <div className="field-description">
          <Info size={14} />
          {field.description}
        </div>
      )}

      <div className="input-wrapper">
        {field.icon && (
          <div className="input-icon left">
            {field.icon}
          </div>
        )}
        
        <input
          id={field.name}
          name={field.name}
          type={inputType}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled}
          autoComplete={field.autoComplete}
          maxLength={maxLength}
          className={`form-input ${field.icon ? 'with-icon' : ''}`}
          aria-describedby={error ? `${field.name}-error` : field.description ? `${field.name}-desc` : undefined}
          aria-invalid={error && touched ? 'true' : 'false'}
        />

        {field.type === 'password' && (
          <button
            type="button"
            className="input-icon right password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {field.showCharacterCount && maxLength && (
          <div className="character-count">
            <span className={characterCount > maxLength ? 'over-limit' : ''}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {error && touched && (
        <div id={`${field.name}-error`} className="field-error" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {field.description && (
        <div id={`${field.name}-desc`} className="field-description" />
      )}
    </div>
  );
};

const TextAreaInput: React.FC<FormFieldProps> = ({ 
  field, value, error, touched, onChange, onBlur, onFocus, disabled 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const characterCount = value?.toString().length || 0;
  const maxLength = field.validation?.max;

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  return (
    <div className={`form-field textarea-input ${isFocused ? 'focused' : ''} ${error && touched ? 'error' : ''}`}>
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.validation?.required && <span className="required-indicator">*</span>}
      </label>
      
      {field.description && (
        <div className="field-description">
          <Info size={14} />
          {field.description}
        </div>
      )}

      <div className="textarea-wrapper">
        <textarea
          ref={textareaRef}
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="form-textarea"
          rows={3}
          aria-describedby={error ? `${field.name}-error` : field.description ? `${field.name}-desc` : undefined}
          aria-invalid={error && touched ? 'true' : 'false'}
        />

        {field.showCharacterCount && maxLength && (
          <div className="character-count">
            <span className={characterCount > maxLength ? 'over-limit' : ''}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {error && touched && (
        <div id={`${field.name}-error`} className="field-error" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

const SelectInput: React.FC<FormFieldProps> = ({ 
  field, value, error, touched, onChange, onBlur, onFocus, disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const options = field.options || [];
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    onBlur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  return (
    <div className={`form-field select-input ${isFocused ? 'focused' : ''} ${error && touched ? 'error' : ''}`}>
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.validation?.required && <span className="required-indicator">*</span>}
      </label>
      
      {field.description && (
        <div className="field-description">
          <Info size={14} />
          {field.description}
        </div>
      )}

      <div className="select-wrapper" ref={selectRef}>
        <button
          type="button"
          id={field.name}
          className={`form-select ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={error ? `${field.name}-error` : field.description ? `${field.name}-desc` : undefined}
        >
          <span className="select-value">
            {selectedOption ? selectedOption.label : field.placeholder || 'Selecione...'}
          </span>
          <ChevronDown size={16} className={`select-chevron ${isOpen ? 'rotated' : ''}`} />
        </button>

        {isOpen && (
          <div className="select-dropdown" role="listbox">
            {options.length > 5 && (
              <div className="select-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="select-options">
              {filteredOptions.length === 0 ? (
                <div className="no-options">Nenhuma opção encontrada</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`select-option ${option.value === value ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(option.value)}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.label}
                    {option.value === value && <Check size={14} />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && touched && (
        <div id={`${field.name}-error`} className="field-error" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

const CheckboxInput: React.FC<FormFieldProps> = ({ 
  field, value, error, touched, onChange, onFocus, disabled 
}) => {
  return (
    <div className={`form-field checkbox-input ${error && touched ? 'error' : ''}`}>
      <label htmlFor={field.name} className="checkbox-label">
        <input
          id={field.name}
          name={field.name}
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          onFocus={onFocus}
          disabled={disabled}
          className="checkbox-input-element"
          aria-describedby={error ? `${field.name}-error` : field.description ? `${field.name}-desc` : undefined}
          aria-invalid={error && touched ? 'true' : 'false'}
        />
        <span className="checkbox-custom">
          {value && <Check size={14} />}
        </span>
        <span className="checkbox-text">
          {field.label}
          {field.validation?.required && <span className="required-indicator">*</span>}
        </span>
      </label>

      {field.description && (
        <div id={`${field.name}-desc`} className="field-description">
          <Info size={14} />
          {field.description}
        </div>
      )}

      {error && touched && (
        <div id={`${field.name}-error`} className="field-error" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

// Main form component
const OptimizedForm: React.FC<FormProps> = ({
  fields,
  initialData = {},
  onSubmit,
  onFieldChange,
  submitLabel = 'Enviar',
  cancelLabel = 'Cancelar',
  onCancel,
  loading = false,
  className = '',
  layout = 'vertical',
  showProgress = false,
  autoSave = false,
  autoSaveDelay = 2000,
  validationMode = 'onBlur'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Validate individual field
  const validateField = useCallback((name: string, value: FormValue = formData[name]): string | null => {
    const field = fields.find(f => f.name === name);
    if (!field?.validation) return null;

    const validation = field.validation;

    // Required validation
    if (validation.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return validation.message || `${field.label} é obrigatório`;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // Min/Max validation
    if (typeof value === 'string') {
      if (validation.min && value.length < validation.min) {
        return validation.message || `${field.label} deve ter pelo menos ${validation.min} caracteres`;
      }
      if (validation.max && value.length > validation.max) {
        return validation.message || `${field.label} deve ter no máximo ${validation.max} caracteres`;
      }
    }

    // Pattern validation
    if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
      return validation.message || `${field.label} tem formato inválido`;
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  }, [fields, formData]);

  // Update field value
  const updateField = useCallback((name: string, value: FormValue) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Real-time validation if enabled
      if (validationMode === 'onChange' && touched[name]) {
        const error = validateField(name, value);
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: error || ''
        }));
      }

      // Call external change handler
      onFieldChange?.(name, value, newData);

      // Auto-save if enabled
      if (autoSave) {
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }
        setAutoSaveTimeout(
          setTimeout(() => {
            // Trigger auto-save logic here
            console.log('Auto-saving...', newData);
          }, autoSaveDelay)
        );
      }

      return newData;
    });
  }, [validationMode, touched, validateField, onFieldChange, autoSave, autoSaveTimeout, autoSaveDelay]);

  // Set field as touched and validate if needed
  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => {
      if (!prev[name]) {
        const newTouched = { ...prev, [name]: true };
        
        // Validate on blur if enabled
        if (validationMode === 'onBlur') {
          const error = validateField(name);
          setErrors(prevErrors => ({
            ...prevErrors,
            [name]: error || ''
          }));
        }
        
        return newTouched;
      }
      return prev;
    });
  }, [validationMode, validateField]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      // Skip conditional fields that shouldn't be visible
      if (field.conditional && !field.conditional(formData)) {
        return;
      }

      const error = validateField(field.name);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      if (!field.conditional || field.conditional(formData)) {
        allTouched[field.name] = true;
      }
    });
    setTouched(allTouched);

    return isValid;
  }, [fields, formData, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationMode !== 'onSubmit') {
      // If we're not validating on submit, check if form is already valid
      const hasErrors = Object.values(errors).some(error => error);
      if (hasErrors) return;
    } else {
      // Validate all fields
      if (!validateForm()) return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form progress
  const getFormProgress = (): number => {
    const visibleFields = fields.filter(field => 
      !field.conditional || field.conditional(formData)
    );
    const filledFields = visibleFields.filter(field => {
      const value = formData[field.name];
      return value !== undefined && value !== null && value !== '';
    });
    
    return visibleFields.length > 0 ? (filledFields.length / visibleFields.length) * 100 : 0;
  };

  const progress = showProgress ? getFormProgress() : 0;

  const contextValue: FormContextType = {
    formData,
    errors,
    touched,
    isSubmitting,
    updateField,
    validateField: (name: string) => {
      const error = validateField(name);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    },
    setFieldTouched
  };

  // Filter visible fields based on conditions
  const visibleFields = fields.filter(field => 
    !field.conditional || field.conditional(formData)
  );

  const renderField = (field: FormField) => {
    const fieldProps: FormFieldProps = {
      field,
      value: formData[field.name],
      error: errors[field.name],
      touched: touched[field.name],
      onChange: (value) => updateField(field.name, value),
      onBlur: () => setFieldTouched(field.name),
      onFocus: () => {}, // Could add focus tracking here
      disabled: field.disabled || isSubmitting
    };

    switch (field.type) {
      case 'textarea':
        return <TextAreaInput key={field.name} {...fieldProps} />;
      case 'select':
        return <SelectInput key={field.name} {...fieldProps} />;
      case 'checkbox':
        return <CheckboxInput key={field.name} {...fieldProps} />;
      case 'text':
      case 'email':
      case 'password':
      case 'date':
      case 'search':
      default:
        return <TextInput key={field.name} {...fieldProps} />;
    }
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form 
        onSubmit={handleSubmit} 
        className={`optimized-form layout-${layout} ${className}`}
        noValidate
      >
        {/* Progress indicator */}
        {showProgress && (
          <div className="form-progress">
            <div className="progress-label">
              Progresso do formulário: {Math.round(progress)}%
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="form-fields">
          {visibleFields.map(renderField)}
        </div>

        {/* Form actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="form-button secondary"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
          )}
          
          <button
            type="submit"
            className="form-button primary"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) && <Loader2 size={16} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>

        {/* Auto-save indicator */}
        {autoSave && autoSaveTimeout && (
          <div className="auto-save-indicator">
            <Info size={14} />
            Salvamento automático ativado...
          </div>
        )}

        <style jsx>{`
          .optimized-form {
            width: 100%;
            max-width: 600px;
          }

          .layout-vertical .form-fields {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }

          .layout-horizontal .form-fields {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-lg);
          }

          .layout-horizontal .form-field {
            flex: 1;
            min-width: 200px;
          }

          .layout-grid .form-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-lg);
          }

          .form-progress {
            margin-bottom: var(--spacing-xl);
          }

          .progress-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            margin-bottom: var(--spacing-sm);
            font-weight: var(--font-weight-medium);
          }

          .progress-bar {
            height: 6px;
            background: var(--color-gray-200);
            border-radius: var(--radius-full);
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
            border-radius: var(--radius-full);
            transition: width var(--transition-slow);
          }

          /* Form Field Styles */
          .form-field {
            position: relative;
          }

          .field-label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-sm);
            line-height: var(--line-height-tight);
          }

          .required-indicator {
            color: var(--color-error-500);
            margin-left: 2px;
          }

          .field-description {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-xs);
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
            margin-bottom: var(--spacing-sm);
            line-height: var(--line-height-normal);
          }

          .input-wrapper,
          .textarea-wrapper,
          .select-wrapper {
            position: relative;
          }

          .form-input,
          .form-textarea,
          .form-select {
            width: 100%;
            padding: var(--spacing-md);
            border: 2px solid var(--color-border-default);
            border-radius: var(--radius-md);
            font-size: var(--font-size-base);
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            transition: all var(--transition-fast);
            font-family: inherit;
          }

          .form-input.with-icon {
            padding-left: calc(var(--spacing-md) + 24px + var(--spacing-sm));
          }

          .form-input:focus,
          .form-textarea:focus,
          .form-select:focus {
            outline: none;
            border-color: var(--color-primary-500);
            box-shadow: 0 0 0 3px var(--unb-alpha-primary);
          }

          .form-field.error .form-input,
          .form-field.error .form-textarea,
          .form-field.error .form-select {
            border-color: var(--color-error-500);
            background: var(--color-error-background);
          }

          .form-field.error .form-input:focus,
          .form-field.error .form-textarea:focus,
          .form-field.error .form-select:focus {
            box-shadow: 0 0 0 3px var(--color-error-alpha, rgba(239, 68, 68, 0.1));
          }

          .form-textarea {
            resize: none;
            min-height: 80px;
            max-height: 200px;
            overflow-y: auto;
          }

          .form-select {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            text-align: left;
            background: var(--color-bg-primary);
          }

          .form-select:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .select-value {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .select-chevron {
            transition: transform var(--transition-fast);
            color: var(--color-text-muted);
          }

          .select-chevron.rotated {
            transform: rotate(180deg);
          }

          .select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-bg-primary);
            border: 1px solid var(--color-border-default);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-xl);
            z-index: var(--z-dropdown);
            margin-top: var(--spacing-xs);
            max-height: 250px;
            overflow-y: auto;
            animation: slideDown 200ms ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .select-search {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-sm);
            border-bottom: 1px solid var(--color-border-light);
            background: var(--color-bg-secondary);
          }

          .search-input {
            flex: 1;
            border: none;
            background: none;
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            outline: none;
          }

          .clear-search {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 2px;
          }

          .select-options {
            max-height: 200px;
            overflow-y: auto;
          }

          .select-option {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm) var(--spacing-md);
            background: none;
            border: none;
            text-align: left;
            font-size: var(--font-size-base);
            color: var(--color-text-primary);
            cursor: pointer;
            transition: background var(--transition-fast);
          }

          .select-option:hover {
            background: var(--color-bg-secondary);
          }

          .select-option.selected {
            background: var(--unb-alpha-primary);
            color: var(--color-primary-500);
            font-weight: var(--font-weight-semibold);
          }

          .no-options {
            padding: var(--spacing-md);
            text-align: center;
            color: var(--color-text-muted);
            font-style: italic;
            font-size: var(--font-size-sm);
          }

          .input-icon {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: var(--color-text-muted);
            pointer-events: none;
          }

          .input-icon.left {
            left: var(--spacing-md);
          }

          .input-icon.right {
            right: var(--spacing-md);
          }

          .input-icon.password-toggle {
            pointer-events: auto;
            cursor: pointer;
            background: none;
            border: none;
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: background var(--transition-fast);
          }

          .input-icon.password-toggle:hover {
            background: var(--color-bg-tertiary);
          }

          .character-count {
            position: absolute;
            bottom: var(--spacing-sm);
            right: var(--spacing-md);
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
            background: var(--color-bg-primary);
            padding: 2px 4px;
            border-radius: var(--radius-sm);
          }

          .character-count .over-limit {
            color: var(--color-error-500);
          }

          .checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm);
            cursor: pointer;
            line-height: var(--line-height-normal);
          }

          .checkbox-input-element {
            opacity: 0;
            position: absolute;
            pointer-events: none;
          }

          .checkbox-custom {
            width: 20px;
            height: 20px;
            border: 2px solid var(--color-border-default);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background: var(--color-bg-primary);
            transition: all var(--transition-fast);
            flex-shrink: 0;
            margin-top: 1px;
          }

          .checkbox-input-element:checked + .checkbox-custom {
            background: var(--color-primary-500);
            border-color: var(--color-primary-500);
          }

          .checkbox-input-element:focus + .checkbox-custom {
            box-shadow: 0 0 0 3px var(--unb-alpha-primary);
          }

          .checkbox-text {
            flex: 1;
            font-size: var(--font-size-base);
            color: var(--color-text-primary);
          }

          .field-error {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            color: var(--color-error-primary);
            font-size: var(--font-size-sm);
            margin-top: var(--spacing-sm);
            line-height: var(--line-height-tight);
          }

          .form-actions {
            display: flex;
            gap: var(--spacing-md);
            justify-content: flex-end;
            margin-top: var(--spacing-xl);
            padding-top: var(--spacing-lg);
            border-top: 1px solid var(--color-border-light);
          }

          .form-button {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-md) var(--spacing-xl);
            border-radius: var(--radius-md);
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            transition: all var(--transition-fast);
            border: 2px solid transparent;
            min-height: 44px;
          }

          .form-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .form-button.primary {
            background: var(--color-primary-500);
            color: white;
            border-color: var(--color-primary-500);
          }

          .form-button.primary:hover:not(:disabled) {
            background: var(--color-primary-600);
            border-color: var(--color-primary-600);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
          }

          .form-button.secondary {
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border-color: var(--color-border-default);
          }

          .form-button.secondary:hover:not(:disabled) {
            background: var(--color-bg-tertiary);
            border-color: var(--color-border-focus);
          }

          .auto-save-indicator {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
            margin-top: var(--spacing-md);
            padding: var(--spacing-sm);
            background: var(--color-bg-secondary);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border-light);
          }

          /* Mobile responsive */
          @media (max-width: 640px) {
            .layout-horizontal .form-fields,
            .layout-grid .form-fields {
              display: flex;
              flex-direction: column;
            }

            .form-actions {
              flex-direction: column-reverse;
            }

            .form-button {
              width: 100%;
              justify-content: center;
            }
          }

          /* Dark theme support */
          [data-theme="dark"] .form-input,
          [data-theme="dark"] .form-textarea,
          [data-theme="dark"] .form-select {
            background: var(--color-gray-100);
            border-color: var(--color-gray-300);
          }

          [data-theme="dark"] .select-dropdown {
            background: var(--color-gray-100);
            border-color: var(--color-gray-300);
          }

          [data-theme="dark"] .select-search {
            background: var(--color-gray-200);
          }

          [data-theme="dark"] .character-count {
            background: var(--color-gray-100);
          }

          /* High contrast mode */
          @media (prefers-contrast: high) {
            .form-input,
            .form-textarea,
            .form-select {
              border-width: 3px;
            }
          }

          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .form-input,
            .form-textarea,
            .form-select,
            .form-button,
            .select-chevron,
            .progress-fill {
              transition: none;
            }

            .select-dropdown {
              animation: none;
            }

            .animate-spin {
              animation: none;
            }
          }
        `}</style>
      </form>
    </FormContext.Provider>
  );
};

export default OptimizedForm;