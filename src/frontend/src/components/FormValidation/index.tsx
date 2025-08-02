import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'


// Field validation state
interface FieldValidation {
  isValid: boolean
  isDirty: boolean
  isTouched: boolean
  errors: string[]
  warnings: string[]
  infos: string[]
}

// Hook moved to: src/hooks/useFormValidation.tsx
/* const useFormValidation = (validationRules: Record<string, ValidationRule[]>) => {
  const [fields, setFields] = useState<Record<string, FieldValidation>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Initialize field states
  useEffect(() => {
    const initialFields: Record<string, FieldValidation> = {}
    Object.keys(validationRules).forEach(fieldName => {
      initialFields[fieldName] = {
        isValid: false,
        isDirty: false,
        isTouched: false,
        errors: [],
        warnings: [],
        infos: []
      }
    })
    setFields(initialFields)
  }, [validationRules])

  // Validate single field
  const validateField = (fieldName: string, value: string, touched = false) => {
    const rules = validationRules[fieldName] || []
    const errors: string[] = []
    const warnings: string[] = []
    const infos: string[] = []

    rules.forEach(rule => {
      if (!rule.test(value)) {
        switch (rule.level) {
          case 'error':
            errors.push(rule.message)
            break
          case 'warning':
            warnings.push(rule.message)
            break
          case 'info':
            infos.push(rule.message)
            break
        }
      }
    })

    const fieldValidation: FieldValidation = {
      isValid: errors.length === 0,
      isDirty: value.length > 0,
      isTouched: touched || fields[fieldName]?.isTouched || false,
      errors,
      warnings,
      infos
    }

    setFields(prev => ({
      ...prev,
      [fieldName]: fieldValidation
    }))

    return fieldValidation
  }

  // Mark field as touched
  const touchField = (fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isTouched: true
      }
    }))
  }

  // Check if entire form is valid
  useEffect(() => {
    const allFieldsValid = Object.values(fields).every(field => field.isValid)
    const hasRequiredFields = Object.keys(validationRules).length > 0
    setIsFormValid(allFieldsValid && hasRequiredFields)
  }, [fields, validationRules])

  // Get field status
  const getFieldStatus = (fieldName: string) => {
    return fields[fieldName] || {
      isValid: false,
      isDirty: false,
      isTouched: false,
      errors: [],
      warnings: [],
      infos: []
    }
  }

  return {
    fields,
    isFormValid,
    validateField,
    touchField,
    getFieldStatus
  }
} */

// Rules moved to: src/utils/validationRules.ts
/* const ValidationRules = {
  required: (message = 'Este campo é obrigatório'): ValidationRule => ({
    test: (value: string) => value.trim().length > 0,
    message,
    level: 'error'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: message || `Mínimo de ${min} caracteres`,
    level: 'error'
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: message || `Máximo de ${max} caracteres`,
    level: 'error'
  }),

  email: (message = 'Digite um e-mail válido'): ValidationRule => ({
    test: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message,
    level: 'error'
  }),

  cpf: (message = 'Digite um CPF válido'): ValidationRule => ({
    test: (value: string) => {
      const cpf = value.replace(/\D/g, '')
      if (cpf.length !== 11) return false
      
      // Check for known invalid patterns
      if (/^(\d)\1{10}$/.test(cpf)) return false
      
      // Validate check digits
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i)
      }
      let digit1 = (sum * 10) % 11
      if (digit1 === 10) digit1 = 0
      
      if (parseInt(cpf[9]) !== digit1) return false
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i)
      }
      let digit2 = (sum * 10) % 11
      if (digit2 === 10) digit2 = 0
      
      return parseInt(cpf[10]) === digit2
    },
    message,
    level: 'error'
  }),

  phone: (message = 'Digite um telefone válido'): ValidationRule => ({
    test: (value: string) => {
      const phone = value.replace(/\D/g, '')
      return phone.length >= 10 && phone.length <= 11
    },
    message,
    level: 'error'
  }),

  strongPassword: (message = 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número'): ValidationRule => ({
    test: (value: string) => {
      const hasMinLength = value.length >= 8
      const hasUppercase = /[A-Z]/.test(value)
      const hasLowercase = /[a-z]/.test(value)
      const hasNumber = /\d/.test(value)
      return hasMinLength && hasUppercase && hasLowercase && hasNumber
    },
    message,
    level: 'error'
  }),

  medicalText: (message = 'Use apenas termos médicos apropriados'): ValidationRule => ({
    test: (value: string) => {
      // Basic profanity and inappropriate content filter
      const inappropriateWords = ['palavrão1', 'palavrão2'] // Add actual words as needed
      const lowerValue = value.toLowerCase()
      return !inappropriateWords.some(word => lowerValue.includes(word))
    },
    message,
    level: 'warning'
  }),

  hanseniasiRelated: (message = 'Certifique-se de que sua pergunta está relacionada à hanseníase ou PQT-U'): ValidationRule => ({
    test: (value: string) => {
      const hanseniasiKeywords = ['hansen', 'pqt', 'rifampicina', 'clofazimina', 'dapsona', 'dispensação']
      const lowerValue = value.toLowerCase()
      return hanseniasiKeywords.some(keyword => lowerValue.includes(keyword))
    },
    message,
    level: 'info'
  })
} */

// Validation message component
interface ValidationMessageProps {
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  className?: string
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <ExclamationCircleIcon className="w-4 h-4 text-error-500" />
      case 'warning':
        return <ExclamationCircleIcon className="w-4 h-4 text-warning-500" />
      case 'info':
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-success-500" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'text-error-600 dark:text-error-400'
      case 'warning':
        return 'text-warning-600 dark:text-warning-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      case 'success':
        return 'text-success-600 dark:text-success-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center space-x-2 text-sm ${getStyles()} ${className}`}
    >
      {getIcon()}
      <span>{message}</span>
    </motion.div>
  )
}

// Enhanced input component with validation
interface ValidatedInputProps {
  name: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (name: string, value: string) => void
  onBlur?: (name: string) => void
  validation: FieldValidation
  className?: string
  required?: boolean
  disabled?: boolean
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  validation,
  className = '',
  required = false,
  disabled = false
}) => {
  const hasError = validation.errors.length > 0 && validation.isTouched
  const hasWarning = validation.warnings.length > 0 && validation.isTouched
  const hasSuccess = validation.isValid && validation.isDirty && validation.isTouched

  const getInputClasses = () => {
    let classes = 'input w-full transition-all duration-200 '
    
    if (hasError) {
      classes += 'input-error '
    } else if (hasSuccess) {
      classes += 'input-success '
    } else if (hasWarning) {
      classes += 'border-warning-300 focus:border-warning-500 focus:ring-warning-500/20 '
    }
    
    if (disabled) {
      classes += 'opacity-60 cursor-not-allowed '
    }
    
    return classes
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-error-500 ml-1" aria-label="obrigatório">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur?.(name)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={getInputClasses()}
          aria-invalid={hasError}
          aria-describedby={`${name}-validation`}
        />
        
        {/* Status icon */}
        {validation.isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && <ExclamationCircleIcon className="w-5 h-5 text-error-500" />}
            {hasSuccess && <CheckCircleIcon className="w-5 h-5 text-success-500" />}
            {hasWarning && <ExclamationCircleIcon className="w-5 h-5 text-warning-500" />}
          </div>
        )}
      </div>

      {/* Validation messages */}
      <div id={`${name}-validation`} className="space-y-1" aria-live="polite">
        <AnimatePresence>
          {validation.isTouched && validation.errors.map((error, index) => (
            <ValidationMessage
              key={`error-${index}`}
              type="error"
              message={error}
            />
          ))}
          
          {validation.isTouched && validation.warnings.map((warning, index) => (
            <ValidationMessage
              key={`warning-${index}`}
              type="warning"
              message={warning}
            />
          ))}
          
          {validation.isTouched && validation.infos.map((info, index) => (
            <ValidationMessage
              key={`info-${index}`}
              type="info"
              message={info}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Form validation summary component
interface ValidationSummaryProps {
  fields: Record<string, FieldValidation>
  className?: string
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  fields,
  className = ''
}) => {
  const errors: string[] = []
  const warnings: string[] = []
  
  Object.entries(fields).forEach(([, validation]) => {
    if (validation.isTouched) {
      errors.push(...validation.errors)
      warnings.push(...validation.warnings)
    }
  })

  if (errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 space-y-3 ${className}`}
    >
      {errors.length > 0 && (
        <div className="bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-error-800 dark:text-error-200 mb-2">
            Corrija os seguintes erros:
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-error-600 dark:text-error-300 flex items-center space-x-2">
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-2">
            Avisos:
          </h4>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-warning-600 dark:text-warning-300 flex items-center space-x-2">
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

// Export only the components (no duplicated exports)

// Utilities moved to separate files:
// - useFormValidation: src/hooks/useFormValidation.tsx
// - ValidationRules: src/utils/validationRules.ts