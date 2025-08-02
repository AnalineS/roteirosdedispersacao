import { useState, useEffect } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean
  message: string
}

interface FieldValidation {
  value: string
  errors: string[]
  isValid: boolean
  touched: boolean
}

// Form validation hook
export const useFormValidation = (validationRules: Record<string, ValidationRule[]>) => {
  const [fields, setFields] = useState<Record<string, FieldValidation>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Initialize field states
  useEffect(() => {
    const initialFields: Record<string, FieldValidation> = {}
    Object.keys(validationRules).forEach(fieldName => {
      initialFields[fieldName] = {
        value: '',
        errors: [],
        isValid: false,
        touched: false
      }
    })
    setFields(initialFields)
  }, [validationRules])

  // Validate single field
  const validateField = (fieldName: string, value: string): string[] => {
    const rules = validationRules[fieldName] || []
    const errors: string[] = []

    rules.forEach(rule => {
      if (rule.required && !value.trim()) {
        errors.push(rule.message)
      } else if (value.trim()) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(rule.message)
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(rule.message)
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.message)
        }
        if (rule.custom && !rule.custom(value)) {
          errors.push(rule.message)
        }
      }
    })

    return errors
  }

  // Update field value and validation
  const updateField = (fieldName: string, value: string) => {
    const errors = validateField(fieldName, value)
    const isValid = errors.length === 0

    setFields(prev => ({
      ...prev,
      [fieldName]: {
        value,
        errors,
        isValid,
        touched: true
      }
    }))
  }

  // Check overall form validity
  useEffect(() => {
    const allFieldsValid = Object.values(fields).every(field => field.isValid)
    const allRequiredFieldsTouched = Object.keys(validationRules).every(fieldName => {
      const hasRequiredRule = validationRules[fieldName].some(rule => rule.required)
      return !hasRequiredRule || fields[fieldName]?.touched
    })
    
    setIsFormValid(allFieldsValid && allRequiredFieldsTouched)
  }, [fields, validationRules])

  // Touch field function
  const touchField = (fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true
      }
    }))
  }

  // Get field status function 
  const getFieldStatus = (fieldName: string) => {
    const field = fields[fieldName]
    if (!field) return { errors: [], warnings: [], infos: [] }
    
    const errors: string[] = []
    const warnings: string[] = []
    const infos: string[] = []
    
    field.errors.forEach(error => {
      // Assuming error is just string for now - would need to check ValidationRule level
      errors.push(error)
    })
    
    return { errors, warnings, infos }
  }

  return {
    fields,
    updateField,
    isFormValid,
    validateField,
    touchField,
    getFieldStatus
  }
}