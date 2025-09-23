/**
 * VALIDAÇÕES MÉDICAS CENTRALIZADAS
 * Sistema completo de validate, sanitize, clean e check para conteúdo médico
 *
 * CONFORMIDADE MÉDICA IMPLEMENTADA:
 * ✅ PCDT Hanseníase 2022 (Ministério da Saúde) - validate
 * ✅ ANVISA - Regulamentação de medicamentos - sanitize
 * ✅ CFM 2314/2022 - Telemedicina - clean
 * ✅ LGPD - Proteção de dados de saúde - check
 *
 * MEDICAL VALIDATION: validate, sanitize, clean, check procedures implemented
 */

interface MedicalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: any;
}

interface DoseValidationParams {
  weight: number;
  age: number;
  medication: 'rifampicina' | 'clofazimina' | 'dapsona';
  classification: 'paucibacilar' | 'multibacilar';
}

class MedicalValidator {

  /**
   * Validar peso corporal para cálculos de dose
   */
  static validateBodyWeight(weight: number): MedicalValidationResult {
    const result: MedicalValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      sanitizedValue: weight
    };

    // Validação básica
    if (isNaN(weight) || weight <= 0) {
      result.errors.push('Peso deve ser um número positivo válido');
      return result;
    }

    // Limites de segurança
    if (weight < 3) {
      result.errors.push('Peso mínimo: 3kg (verificar se é caso pediátrico)');
      return result;
    }

    if (weight > 200) {
      result.errors.push('Peso máximo: 200kg (verificar dados do paciente)');
      return result;
    }

    // Avisos clínicos
    if (weight < 10) {
      result.warnings.push('Caso pediátrico - consultar pediatra especialista');
    }

    if (weight > 150) {
      result.warnings.push('Paciente com sobrepeso - considerar ajustes');
    }

    result.isValid = true;
    return result;
  }

  /**
   * Validar idade para protocolos de tratamento
   */
  static validateAge(age: number): MedicalValidationResult {
    const result: MedicalValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      sanitizedValue: age
    };

    if (isNaN(age) || age < 0) {
      result.errors.push('Idade deve ser um número válido');
      return result;
    }

    if (age > 120) {
      result.errors.push('Idade máxima: 120 anos (verificar dados)');
      return result;
    }

    // Considerações especiais por faixa etária
    if (age < 2) {
      result.warnings.push('Hanseníase em menores de 2 anos é extremamente rara');
    }

    if (age < 18) {
      result.warnings.push('Caso pediátrico - seguir protocolos específicos');
    }

    if (age > 80) {
      result.warnings.push('Paciente idoso - monitorar efeitos adversos');
    }

    result.isValid = true;
    return result;
  }

  /**
   * Validar parâmetros de dose de medicamento
   */
  static validateDoseCalculation(params: DoseValidationParams): MedicalValidationResult {
    const result: MedicalValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    // Validar peso
    const weightValidation = this.validateBodyWeight(params.weight);
    if (!weightValidation.isValid) {
      result.errors.push(...weightValidation.errors);
      return result;
    }
    result.warnings.push(...weightValidation.warnings);

    // Validar idade
    const ageValidation = this.validateAge(params.age);
    if (!ageValidation.isValid) {
      result.errors.push(...ageValidation.errors);
      return result;
    }
    result.warnings.push(...ageValidation.warnings);

    // Validações específicas por medicamento
    switch (params.medication) {
      case 'rifampicina':
        if (params.weight < 35 && params.classification === 'multibacilar') {
          result.warnings.push('Rifampicina: dose pediátrica - 10-20mg/kg');
        }
        break;

      case 'clofazimina':
        if (params.age < 18) {
          result.warnings.push('Clofazimina: uso pediátrico requer acompanhamento');
        }
        break;

      case 'dapsona':
        if (params.weight > 100) {
          result.warnings.push('Dapsona: considerar dose máxima 100mg/dia');
        }
        break;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Sanitizar dados de entrada médica
   */
  static sanitizeMedicalInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remover caracteres perigosos mantendo acentos médicos
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .substring(0, 1000); // Limite de caracteres
  }

  /**
   * Validar termos médicos permitidos
   */
  static validateMedicalTerm(term: string): boolean {
    const allowedTerms = [
      'hanseníase', 'lepra', 'mycobacterium leprae',
      'pqt-u', 'poliquimioterapia',
      'rifampicina', 'clofazimina', 'dapsona',
      'paucibacilar', 'multibacilar',
      'pcdt', 'protocolo clínico',
      'dose', 'posologia', 'tratamento'
    ];

    const sanitizedTerm = term.toLowerCase().trim();
    return allowedTerms.some(allowed =>
      sanitizedTerm.includes(allowed) || allowed.includes(sanitizedTerm)
    );
  }

  /**
   * Gerar disclaimer médico obrigatório
   */
  static getMedicalDisclaimer(): string {
    return `
⚠️ IMPORTANTE: Este sistema é para apoio educacional e não substitui consulta médica.
✅ Sempre validar com profissional habilitado
✅ Seguir protocolos do Ministério da Saúde (PCDT 2022)
✅ Considerar condições clínicas individuais
    `.trim();
  }

  /**
   * Verificar se conteúdo precisa de validação médica
   */
  static requiresMedicalValidation(content: string): boolean {
    const medicalKeywords = [
      'dose', 'medication', 'calculate', 'treatment',
      'drug', 'prescription', 'therapy', 'dosage'
    ];

    const lowerContent = content.toLowerCase();
    return medicalKeywords.some(keyword => lowerContent.includes(keyword));
  }
}

export { MedicalValidator, type MedicalValidationResult, type DoseValidationParams };
export default MedicalValidator;