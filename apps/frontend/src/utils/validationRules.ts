interface ValidationRule {
  test: (value: string) => boolean
  message: string
  level: 'error' | 'warning' | 'info'
}

// Common validation rules
export const ValidationRules = {
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

  email: (message = 'Email inválido'): ValidationRule => ({
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    level: 'error'
  }),

  phone: (message = 'Telefone inválido'): ValidationRule => ({
    test: (value: string) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
    message,
    level: 'error'
  }),

  cpf: (message = 'CPF inválido'): ValidationRule => ({
    test: (value: string) => {
      const cpf = value.replace(/\D/g, '')
      if (cpf.length !== 11) return false
      
      // Check for known invalid patterns
      if (/^(\d)\1{10}$/.test(cpf)) return false
      
      // Validate CPF algorithm
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i)
      }
      let digit = 11 - (sum % 11)
      if (digit > 9) digit = 0
      if (parseInt(cpf.charAt(9)) !== digit) return false
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i)
      }
      digit = 11 - (sum % 11)
      if (digit > 9) digit = 0
      return parseInt(cpf.charAt(10)) === digit
    },
    message,
    level: 'error'
  }),

  cns: (message = 'CNS inválido'): ValidationRule => ({
    test: (value: string) => {
      const cns = value.replace(/\D/g, '')
      return cns.length === 15 && /^[1-2]\d{14}$/.test(cns)
    },
    message,
    level: 'error'
  }),

  strongPassword: (message = 'Senha deve ter ao menos 8 caracteres, incluindo maiúscula, minúscula e número'): ValidationRule => ({
    test: (value: string) => {
      return value.length >= 8 &&
             /[A-Z]/.test(value) &&
             /[a-z]/.test(value) &&
             /\d/.test(value)
    },
    message,
    level: 'error'
  }),

  medicalText: (message = 'Texto deve estar relacionado ao contexto médico'): ValidationRule => ({
    test: (value: string) => {
      const medicalKeywords = ['dosagem', 'medicamento', 'tratamento', 'sintoma', 'diagnóstico', 'paciente', 'farmácia', 'dispensação']
      const lowerValue = value.toLowerCase()
      return medicalKeywords.some(keyword => lowerValue.includes(keyword)) || value.length < 10
    },
    message,
    level: 'warning'
  }),

  hanseniasiRelated: (message = 'Para consultas sobre hanseníase, use termos específicos como "PQT", "rifampicina", "dispensação"'): ValidationRule => ({
    test: (value: string) => {
      const hanseniasiKeywords = ['hansen', 'pqt', 'rifampicina', 'clofazimina', 'dapsona', 'dispensação']
      const lowerValue = value.toLowerCase()
      return hanseniasiKeywords.some(keyword => lowerValue.includes(keyword))
    },
    message,
    level: 'info'
  }),

  custom: (testFn: (value: string) => boolean, message: string, level: 'error' | 'warning' | 'info' = 'error'): ValidationRule => ({
    test: testFn,
    message,
    level
  })
}

export type { ValidationRule }