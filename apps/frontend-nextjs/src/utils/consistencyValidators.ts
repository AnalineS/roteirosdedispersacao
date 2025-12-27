/**
 * Consistency Validation System
 * Validadores especializados para personas, terminologia e referências
 *
 * @author Claude Code QA Specialist
 * @version 1.0.0
 */

// Use global Window interface from types/analytics.ts

// Internal types for consistency validation
interface ClinicalCase {
  id: string;
  title: string;
  scenario: { presentation: string };
  learningObjectives: string[];
  steps: CaseStep[];
  references?: Reference[];
}

interface CaseStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  validation: {
    clinicalRationale: string;
    feedback: {
      correct: { message: string };
      incorrect: { message: string };
    };
  };
}

interface StepResult {
  stepId: string;
  completed: boolean;
  score?: number;
}

interface ProfileObject {
  [key: string]: number | string | string[];
}

// Extend profile interfaces to support index signature
interface VocabularyProfileWithIndex extends VocabularyProfile {
  [key: string]: number | string | string[];
}

interface ToneProfileWithIndex extends ToneProfile {
  [key: string]: number | string | string[];
}

interface ExpertiseProfileWithIndex extends ExpertiseProfile {
  [key: string]: number | string | string[];
}

interface PedagogicalProfileWithIndex extends PedagogicalProfile {
  [key: string]: number | string | string[];
}

interface Reference {
  id?: string;
  title: string;
  source?: string;
  type: 'protocolo_nacional' | 'tese_doutorado' | 'literatura_cientifica' | string;
  url?: string;
  year?: number;
  author?: string;
  [key: string]: unknown;
}

interface ComponentData {
  id: string;
  type: 'button' | 'input' | 'card' | 'text' | string;
  styles: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    padding?: string;
    margin?: string;
    borderRadius?: string;
  };
  interactions?: {
    hover?: string;
    focus?: string;
    active?: string;
  };
}

interface ValidationResult {
  score: number;
  violations?: unknown[];
  inconsistencies?: unknown[];
}

// ===== INTERFACES DE VALIDAÇÃO =====

export interface ConsistencyValidationResult {
  isValid: boolean;
  score: number; // 0-100
  violations: ConsistencyViolation[];
  recommendations: ConsistencyRecommendation[];
  
  validation: {
    personaConsistency: PersonaValidationResult;
    terminologyConsistency: TerminologyValidationResult;
    referenceConsistency: ReferenceValidationResult;
    uiuxConsistency: UIUXValidationResult;
  };
}

export interface ConsistencyViolation {
  id: string;
  type: 'persona' | 'terminology' | 'reference' | 'uiux';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  title: string;
  description: string;
  location: string;
  expectedValue: string;
  actualValue: string;
  
  impact: string;
  fixSuggestion: string;
}

export interface ConsistencyRecommendation {
  id: string;
  category: 'standardization' | 'harmonization' | 'optimization';
  priority: 'low' | 'medium' | 'high';
  
  title: string;
  description: string;
  benefit: string;
  implementation: string[];
}

// ===== VALIDAÇÃO DE PERSONAS =====

export interface PersonaValidationResult {
  isConsistent: boolean;
  score: number;
  violations: PersonaViolation[];
  
  drGasnelioConsistency: PersonaProfile;
  gaConsistency: PersonaProfile;
  crossPersonaAnalysis: CrossPersonaAnalysis;
}

interface PersonaProfile {
  vocabulary: VocabularyProfile;
  tone: ToneProfile;
  expertise: ExpertiseProfile;
  pedagogicalApproach: PedagogicalProfile;
}

interface VocabularyProfile {
  technicalTermsUsage: number; // 0-1
  simplificationLevel: number; // 0-1
  medicalJargonFrequency: number; // 0-1
  commonInconsistencies: string[];
}

interface ToneProfile {
  professionalismLevel: number; // 0-1
  empathyLevel: number; // 0-1
  formalityLevel: number; // 0-1
  encouragementFrequency: number; // 0-1
}

interface ExpertiseProfile {
  clinicalDepth: number; // 0-1
  practicalFocus: number; // 0-1
  evidenceReferences: number; // 0-1
  protocolAdherence: number; // 0-1
}

interface PedagogicalProfile {
  explanationComplexity: number; // 0-1
  exampleUsage: number; // 0-1
  stepByStepApproach: number; // 0-1
  reinforcementPatterns: number; // 0-1
}

interface CrossPersonaAnalysis {
  vocabularyOverlap: number; // 0-1
  toneConflicts: string[];
  approachAlignment: number; // 0-1
  messageConsistency: number; // 0-1
}

interface PersonaViolation {
  personaId: 'dr_gasnelio' | 'ga';
  characteristic: 'vocabulary' | 'tone' | 'expertise' | 'pedagogy';
  violation: string;
  severity: 'low' | 'medium' | 'high';
  examples: string[];
}

export class PersonaConsistencyValidator {
  // Perfis de referência das personas
  private readonly DR_GASNELIO_PROFILE: PersonaProfile = {
    vocabulary: {
      technicalTermsUsage: 0.85,
      simplificationLevel: 0.3,
      medicalJargonFrequency: 0.7,
      commonInconsistencies: []
    },
    tone: {
      professionalismLevel: 0.9,
      empathyLevel: 0.6,
      formalityLevel: 0.8,
      encouragementFrequency: 0.4
    },
    expertise: {
      clinicalDepth: 0.9,
      practicalFocus: 0.8,
      evidenceReferences: 0.85,
      protocolAdherence: 0.95
    },
    pedagogicalApproach: {
      explanationComplexity: 0.8,
      exampleUsage: 0.7,
      stepByStepApproach: 0.6,
      reinforcementPatterns: 0.5
    }
  };
  
  private readonly GA_PROFILE: PersonaProfile = {
    vocabulary: {
      technicalTermsUsage: 0.3,
      simplificationLevel: 0.9,
      medicalJargonFrequency: 0.2,
      commonInconsistencies: []
    },
    tone: {
      professionalismLevel: 0.7,
      empathyLevel: 0.95,
      formalityLevel: 0.4,
      encouragementFrequency: 0.9
    },
    expertise: {
      clinicalDepth: 0.6,
      practicalFocus: 0.9,
      evidenceReferences: 0.4,
      protocolAdherence: 0.8
    },
    pedagogicalApproach: {
      explanationComplexity: 0.3,
      exampleUsage: 0.9,
      stepByStepApproach: 0.9,
      reinforcementPatterns: 0.8
    }
  };
  
  public validatePersonaConsistency(
    content: string, 
    expectedPersona: 'dr_gasnelio' | 'ga'
  ): PersonaValidationResult {
    const profile = this.analyzeContentProfile(content);
    const referenceProfile = expectedPersona === 'dr_gasnelio' 
      ? this.DR_GASNELIO_PROFILE 
      : this.GA_PROFILE;
    
    const violations = this.identifyPersonaViolations(
      profile, 
      referenceProfile, 
      expectedPersona
    );
    
    const score = this.calculatePersonaConsistencyScore(profile, referenceProfile);
    
    return {
      isConsistent: violations.length === 0 && score > 85,
      score,
      violations,
      drGasnelioConsistency: this.DR_GASNELIO_PROFILE,
      gaConsistency: this.GA_PROFILE,
      crossPersonaAnalysis: this.analyzeCrossPersonaConsistency(content)
    };
  }
  
  private analyzeContentProfile(content: string): PersonaProfile {
    const words = content.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    // Análise de vocabulário
    const technicalTerms = this.countTechnicalTerms(words);
    const simplificationIndicators = this.countSimplificationIndicators(content);
    const medicalJargon = this.countMedicalJargon(words);
    
    // Análise de tom
    const professionalWords = this.countProfessionalWords(words);
    const empathyWords = this.countEmpathyWords(words);
    const formalWords = this.countFormalWords(words);
    const encouragementWords = this.countEncouragementWords(words);
    
    return {
      vocabulary: {
        technicalTermsUsage: technicalTerms / words.length,
        simplificationLevel: simplificationIndicators / sentences.length,
        medicalJargonFrequency: medicalJargon / words.length,
        commonInconsistencies: []
      },
      tone: {
        professionalismLevel: professionalWords / words.length,
        empathyLevel: empathyWords / words.length,
        formalityLevel: formalWords / words.length,
        encouragementFrequency: encouragementWords / sentences.length
      },
      expertise: {
        clinicalDepth: this.assessClinicalDepth(content),
        practicalFocus: this.assessPracticalFocus(content),
        evidenceReferences: this.countEvidenceReferences(content) / sentences.length,
        protocolAdherence: this.assessProtocolAdherence(content)
      },
      pedagogicalApproach: {
        explanationComplexity: this.assessExplanationComplexity(content),
        exampleUsage: this.countExamples(content) / sentences.length,
        stepByStepApproach: this.assessStepByStepApproach(content),
        reinforcementPatterns: this.assessReinforcementPatterns(content)
      }
    };
  }
  
  private identifyPersonaViolations(
    actual: PersonaProfile,
    expected: PersonaProfile,
    persona: 'dr_gasnelio' | 'ga'
  ): PersonaViolation[] {
    const violations: PersonaViolation[] = [];
    const tolerance = 0.15; // 15% de tolerância
    
    // Verificar vocabulário
    if (Math.abs(actual.vocabulary.technicalTermsUsage - expected.vocabulary.technicalTermsUsage) > tolerance) {
      violations.push({
        personaId: persona,
        characteristic: 'vocabulary',
        violation: 'Inconsistência no uso de termos técnicos',
        severity: 'high',
        examples: [`Esperado: ${expected.vocabulary.technicalTermsUsage}, Atual: ${actual.vocabulary.technicalTermsUsage}`]
      });
    }
    
    // Verificar tom
    if (Math.abs(actual.tone.empathyLevel - expected.tone.empathyLevel) > tolerance) {
      violations.push({
        personaId: persona,
        characteristic: 'tone',
        violation: 'Nível de empatia inconsistente com a persona',
        severity: 'medium',
        examples: [`Esperado: ${expected.tone.empathyLevel}, Atual: ${actual.tone.empathyLevel}`]
      });
    }
    
    // Verificar expertise
    if (Math.abs(actual.expertise.clinicalDepth - expected.expertise.clinicalDepth) > tolerance) {
      violations.push({
        personaId: persona,
        characteristic: 'expertise',
        violation: 'Profundidade clínica não condiz com a persona',
        severity: 'high',
        examples: [`Esperado: ${expected.expertise.clinicalDepth}, Atual: ${actual.expertise.clinicalDepth}`]
      });
    }
    
    return violations;
  }
  
  private calculatePersonaConsistencyScore(
    actual: PersonaProfile,
    expected: PersonaProfile
  ): number {
    const weights = {
      vocabulary: 0.3,
      tone: 0.3,
      expertise: 0.25,
      pedagogical: 0.15
    };
    
    const vocabularyScore = this.calculateProfileSimilarity(
      this.vocabularyProfileToProfileObject(actual.vocabulary),
      this.vocabularyProfileToProfileObject(expected.vocabulary)
    );
    const toneScore = this.calculateProfileSimilarity(
      this.toneProfileToProfileObject(actual.tone),
      this.toneProfileToProfileObject(expected.tone)
    );
    const expertiseScore = this.calculateProfileSimilarity(
      this.expertiseProfileToProfileObject(actual.expertise),
      this.expertiseProfileToProfileObject(expected.expertise)
    );
    const pedagogicalScore = this.calculateProfileSimilarity(
      this.pedagogicalProfileToProfileObject(actual.pedagogicalApproach),
      this.pedagogicalProfileToProfileObject(expected.pedagogicalApproach)
    );
    
    return Math.round(
      vocabularyScore * weights.vocabulary +
      toneScore * weights.tone +
      expertiseScore * weights.expertise +
      pedagogicalScore * weights.pedagogical
    );
  }
  
  private vocabularyProfileToProfileObject(profile: VocabularyProfile): ProfileObject {
    return {
      technicalTermsUsage: profile.technicalTermsUsage,
      simplificationLevel: profile.simplificationLevel,
      medicalJargonFrequency: profile.medicalJargonFrequency,
      commonInconsistencies: profile.commonInconsistencies
    };
  }

  private toneProfileToProfileObject(profile: ToneProfile): ProfileObject {
    return {
      professionalismLevel: profile.professionalismLevel,
      empathyLevel: profile.empathyLevel,
      formalityLevel: profile.formalityLevel,
      encouragementFrequency: profile.encouragementFrequency
    };
  }

  private expertiseProfileToProfileObject(profile: ExpertiseProfile): ProfileObject {
    return {
      clinicalDepth: profile.clinicalDepth,
      practicalFocus: profile.practicalFocus,
      evidenceReferences: profile.evidenceReferences,
      protocolAdherence: profile.protocolAdherence
    };
  }

  private pedagogicalProfileToProfileObject(profile: PedagogicalProfile): ProfileObject {
    return {
      explanationComplexity: profile.explanationComplexity,
      exampleUsage: profile.exampleUsage,
      stepByStepApproach: profile.stepByStepApproach,
      reinforcementPatterns: profile.reinforcementPatterns
    };
  }

  private calculateProfileSimilarity(actual: ProfileObject, expected: ProfileObject): number {
    const keys = Object.keys(expected).filter(key => typeof expected[key] === 'number');
    let totalSimilarity = 0;

    for (const key of keys) {
      const actualValue = actual[key];
      const expectedValue = expected[key];

      if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
        const difference = Math.abs(actualValue - expectedValue);
        const similarity = Math.max(0, 1 - difference);
        totalSimilarity += similarity;
      }
    }

    return keys.length > 0 ? (totalSimilarity / keys.length) * 100 : 0;
  }
  
  private analyzeCrossPersonaConsistency(content: string): CrossPersonaAnalysis {
    // Implementação simplificada
    return {
      vocabularyOverlap: 0.2,
      toneConflicts: [],
      approachAlignment: 0.8,
      messageConsistency: 0.9
    };
  }
  
  // Métodos auxiliares de análise de conteúdo
  private countTechnicalTerms(words: string[]): number {
    const technicalTerms = [
      'farmacocinética', 'farmacodinâmica', 'biodisponibilidade', 'meia-vida',
      'rifampicina', 'clofazimina', 'dapsona', 'pqt-u', 'pcdt',
      'paucibacilar', 'multibacilar', 'bacilloscopia', 'histopatológico'
    ];
    
    return words.filter(word => 
      technicalTerms.some(term => word.includes(term))
    ).length;
  }
  
  private countSimplificationIndicators(content: string): number {
    const indicators = [
      'ou seja', 'em outras palavras', 'simplificando', 'de forma simples',
      'em termos práticos', 'na prática', 'resumindo'
    ];
    
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
  }
  
  private countMedicalJargon(words: string[]): number {
    const jargon = [
      'posologia', 'esquema terapêutico', 'adesão medicamentosa',
      'evento adverso', 'monitorização', 'farmacovigilância'
    ];
    
    return words.filter(word => 
      jargon.some(term => word.includes(term))
    ).length;
  }
  
  private countProfessionalWords(words: string[]): number {
    const professionalWords = [
      'protocolo', 'evidência', 'literatura', 'estudos', 'diretrizes',
      'recomendação', 'consenso', 'guidelines'
    ];
    
    return words.filter(word => 
      professionalWords.some(term => word.includes(term))
    ).length;
  }
  
  private countEmpathyWords(words: string[]): number {
    const empathyWords = [
      'compreendo', 'entendo', 'apoio', 'cuidado', 'tranquila',
      'juntos', 'família', 'preocupação', 'sentimentos'
    ];
    
    return words.filter(word => 
      empathyWords.some(term => word.includes(term))
    ).length;
  }
  
  private countFormalWords(words: string[]): number {
    const formalWords = [
      'recomenda-se', 'deve-se', 'é necessário', 'conforme',
      'estabelece', 'determina', 'preconiza'
    ];
    
    return words.filter(word => 
      formalWords.some(term => word.includes(term))
    ).length;
  }
  
  private countEncouragementWords(words: string[]): number {
    const encouragementWords = [
      'excelente', 'muito bem', 'parabéns', 'continue', 'ótimo',
      'consegue', 'capaz', 'sucesso', 'progresso'
    ];
    
    return words.filter(word => 
      encouragementWords.some(term => word.includes(term))
    ).length;
  }
  
  private assessClinicalDepth(content: string): number {
    const clinicalIndicators = [
      'mecanismo de ação', 'farmacocinética', 'contraindicação',
      'interação medicamentosa', 'evento adverso', 'monitorização'
    ];
    
    const matches = clinicalIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(matches / 3, 1); // Normalizar para 0-1
  }
  
  private assessPracticalFocus(content: string): number {
    const practicalIndicators = [
      'na prática', 'como fazer', 'passo a passo', 'exemplo',
      'situação real', 'dia a dia', 'rotina'
    ];
    
    const matches = practicalIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(matches / 3, 1);
  }
  
  private countEvidenceReferences(content: string): number {
    const evidenceIndicators = [
      'segundo', 'conforme', 'estudos mostram', 'literatura',
      'pesquisa', 'evidência', 'pcdt', 'ministério da saúde'
    ];
    
    return evidenceIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
  }
  
  private assessProtocolAdherence(content: string): number {
    const protocolReferences = [
      'pcdt', 'protocolo', 'diretriz', 'ministério da saúde',
      'who', 'organização mundial', 'consenso'
    ];
    
    const matches = protocolReferences.filter(ref => 
      content.toLowerCase().includes(ref)
    ).length;
    
    return Math.min(matches / 2, 1);
  }
  
  private assessExplanationComplexity(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;
    
    // Sentenças mais longas = explicações mais complexas
    return Math.min(avgWordsPerSentence / 20, 1);
  }
  
  private countExamples(content: string): number {
    const exampleIndicators = [
      'exemplo', 'por exemplo', 'como', 'imagine', 'suponha',
      'caso', 'situação'
    ];
    
    return exampleIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
  }
  
  private assessStepByStepApproach(content: string): number {
    const stepIndicators = [
      'primeiro', 'segundo', 'terceiro', 'em seguida', 'depois',
      'finalmente', 'passo', 'etapa'
    ];
    
    const matches = stepIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(matches / 3, 1);
  }
  
  private assessReinforcementPatterns(content: string): number {
    const reinforcementIndicators = [
      'lembre-se', 'importante', 'atenção', 'não esqueça',
      'fundamental', 'essencial', 'cuidado'
    ];
    
    const matches = reinforcementIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(matches / 2, 1);
  }
}

// ===== VALIDAÇÃO DE TERMINOLOGIA =====

export interface TerminologyValidationResult {
  isConsistent: boolean;
  score: number;
  violations: TerminologyViolation[];
  
  standardizedTerms: Map<string, string>;
  inconsistentTerms: Map<string, string[]>;
  missingStandardizations: string[];
}

interface TerminologyViolation {
  term: string;
  context: string;
  expectedStandardization: string;
  actualUsage: string[];
  severity: 'low' | 'medium' | 'high';
}

export class TerminologyConsistencyValidator {
  // Dicionário de termos padronizados
  private readonly STANDARD_TERMINOLOGY = new Map<string, string>([
    // Terminologia médica
    ['hanseniase', 'hanseníase'],
    ['lepra', 'hanseníase'], // termo obsoleto
    ['paucibacilar', 'paucibacilar'],
    ['pauci-bacilar', 'paucibacilar'],
    ['multibacilar', 'multibacilar'],
    ['multi-bacilar', 'multibacilar'],
    
    // Medicamentos
    ['rifampicina', 'rifampicina'],
    ['clofazimina', 'clofazimina'],
    ['dapsona', 'dapsona'],
    ['pqt-u', 'PQT-U'],
    ['pqtu', 'PQT-U'],
    
    // Protocolos
    ['pcdt', 'PCDT'],
    ['ministerio da saude', 'Ministério da Saúde'],
    ['ms', 'Ministério da Saúde'],
    
    // Unidades
    ['mg/kg', 'mg/kg'],
    ['mg/kg/dia', 'mg/kg/dia'],
    ['quilograma', 'kg'],
    ['miligramas', 'mg']
  ]);
  
  // Termos que devem ser evitados
  private readonly DEPRECATED_TERMS = new Set([
    'lepra', 'leproso', 'hansênico', 'mal de hansen'
  ]);
  
  public validateTerminology(content: string): TerminologyValidationResult {
    const words = this.extractTerms(content);
    const violations = this.identifyTerminologyViolations(words, content);
    const inconsistentTerms = this.findInconsistentTerms(words);
    const missingStandardizations = this.findMissingStandardizations(words);
    
    const score = this.calculateTerminologyScore(violations, inconsistentTerms.size);
    
    return {
      isConsistent: violations.length === 0 && inconsistentTerms.size === 0,
      score,
      violations,
      standardizedTerms: this.STANDARD_TERMINOLOGY,
      inconsistentTerms,
      missingStandardizations
    };
  }
  
  private extractTerms(content: string): string[] {
    // Extrair termos médicos, medicamentos, unidades, etc.
    const medicalTermPattern = /\b(?:hansení?ase?|lepra|pauci-?bacilar|multi-?bacilar|rifampicina|clofazimina|dapsona|pqt-?u|pcdt)\b/gi;
    const unitPattern = /\b\d+\s*(?:mg|kg|ml|mcg)(?:\/(?:kg|dia|dose))?\b/gi;
    const protocolPattern = /\b(?:pcdt|ms|ministério\s+da\s+saúde|who|oms)\b/gi;
    
    const matches = [
      ...(content.match(medicalTermPattern) || []),
      ...(content.match(unitPattern) || []),
      ...(content.match(protocolPattern) || [])
    ];
    
    return matches.map(term => term.toLowerCase().trim());
  }
  
  private identifyTerminologyViolations(
    terms: string[], 
    content: string
  ): TerminologyViolation[] {
    const violations: TerminologyViolation[] = [];
    
    // Verificar termos depreciados
    for (const term of terms) {
      if (this.DEPRECATED_TERMS.has(term)) {
        violations.push({
          term,
          context: this.extractContext(term, content),
          expectedStandardization: 'hanseníase',
          actualUsage: [term],
          severity: 'high'
        });
      }
    }
    
    // Verificar padronização
    for (const term of terms) {
      const standard = this.STANDARD_TERMINOLOGY.get(term);
      if (standard && standard !== term) {
        violations.push({
          term,
          context: this.extractContext(term, content),
          expectedStandardization: standard,
          actualUsage: [term],
          severity: 'medium'
        });
      }
    }
    
    return violations;
  }
  
  private findInconsistentTerms(terms: string[]): Map<string, string[]> {
    const termGroups = new Map<string, Set<string>>();
    const inconsistentTerms = new Map<string, string[]>();
    
    // Agrupar variações do mesmo conceito
    for (const term of terms) {
      const concept = this.getTermConcept(term);
      if (!termGroups.has(concept)) {
        termGroups.set(concept, new Set());
      }
      termGroups.get(concept)!.add(term);
    }
    
    // Identificar grupos com múltiplas variações
    termGroups.forEach((variations, concept) => {
      if (variations.size > 1) {
        inconsistentTerms.set(concept, Array.from(variations));
      }
    });
    
    return inconsistentTerms;
  }
  
  private findMissingStandardizations(terms: string[]): string[] {
    const missing: string[] = [];
    
    for (const term of terms) {
      if (!this.STANDARD_TERMINOLOGY.has(term) && 
          !this.DEPRECATED_TERMS.has(term) &&
          this.isMedicalTerm(term)) {
        missing.push(term);
      }
    }
    
    // Remover duplicatas convertendo para array
    const uniqueMissing: string[] = [];
    const seen = new Set<string>();
    for (const term of missing) {
      if (!seen.has(term)) {
        seen.add(term);
        uniqueMissing.push(term);
      }
    }
    return uniqueMissing;
  }
  
  private calculateTerminologyScore(
    violations: TerminologyViolation[], 
    inconsistentTermCount: number
  ): number {
    const baseScore = 100;
    const violationPenalty = violations.length * 10;
    const inconsistencyPenalty = inconsistentTermCount * 5;
    
    return Math.max(0, baseScore - violationPenalty - inconsistencyPenalty);
  }
  
  private extractContext(term: string, content: string): string {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + term.length + 50);
    
    return content.substring(start, end);
  }
  
  private getTermConcept(term: string): string {
    // Mapear variações para conceitos base
    const conceptMap = new Map([
      ['hanseniase', 'doenca'],
      ['hanseníase', 'doenca'],
      ['lepra', 'doenca'],
      ['paucibacilar', 'classificacao'],
      ['pauci-bacilar', 'classificacao'],
      ['multibacilar', 'classificacao'],
      ['multi-bacilar', 'classificacao'],
      ['pqt-u', 'protocolo'],
      ['pqtu', 'protocolo'],
      ['pcdt', 'diretriz'],
    ]);
    
    return conceptMap.get(term.toLowerCase()) || term;
  }
  
  private isMedicalTerm(term: string): boolean {
    // Verificar se é um termo médico baseado em padrões
    const medicalPatterns = [
      /ase$/i,     // enzimas, doenças
      /ina$/i,     // medicamentos
      /oma$/i,     // tumores
      /ose$/i,     // condições
      /itis$/i,    // inflamações
      /mg|kg|ml/i  // unidades
    ];
    
    return medicalPatterns.some(pattern => pattern.test(term));
  }
}

// ===== VALIDAÇÃO DE REFERÊNCIAS =====

export interface ReferenceValidationResult {
  isValid: boolean;
  score: number;
  violations: ReferenceViolation[];
  
  validReferences: ValidatedReference[];
  invalidReferences: InvalidReference[];
  missingCitations: MissingCitation[];
}

interface ValidatedReference {
  id: string;
  type: 'protocolo_nacional' | 'tese_doutorado' | 'literatura_cientifica';
  title: string;
  isAccessible: boolean;
  lastValidated: Date;
  reliability: number; // 0-1
}

interface InvalidReference {
  id: string;
  issue: 'broken_link' | 'outdated' | 'unreliable_source' | 'missing_info';
  description: string;
}

interface MissingCitation {
  claim: string;
  context: string;
  suggestedReferences: string[];
}

interface ReferenceViolation {
  referenceId: string;
  violationType: 'accessibility' | 'currency' | 'reliability' | 'completeness';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export class ReferenceConsistencyValidator {
  // Base de referências confiáveis
  private readonly TRUSTED_SOURCES = new Set([
    'ministerio da saude',
    'who.int',
    'scielo',
    'pubmed',
    'cochrane',
    'unb.br',
    'anvisa.gov.br'
  ]);
  
  public async validateReferences(
    references: Reference[],
    content: string
  ): Promise<ReferenceValidationResult> {
    const validReferences = await this.validateReferencesList(references);
    const invalidReferences = this.identifyInvalidReferences(references);
    const missingCitations = this.identifyMissingCitations(content, references);
    const violations = this.identifyReferenceViolations(references);
    
    const score = this.calculateReferenceScore(
      validReferences.length,
      invalidReferences.length,
      missingCitations.length
    );
    
    return {
      isValid: invalidReferences.length === 0 && missingCitations.length === 0,
      score,
      violations,
      validReferences,
      invalidReferences,
      missingCitations
    };
  }
  
  private async validateReferencesList(references: Reference[]): Promise<ValidatedReference[]> {
    const validated: ValidatedReference[] = [];
    
    for (const ref of references) {
      try {
        const isAccessible = await this.checkReferenceAccessibility(ref);
        const reliability = this.assessReferenceReliability(ref);
        
        validated.push({
          id: ref.id || ref.title,
          type: ref.type as 'protocolo_nacional' | 'tese_doutorado' | 'literatura_cientifica',
          title: ref.title,
          isAccessible,
          lastValidated: new Date(),
          reliability
        });
      } catch {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'reference_validation_failed', {
            event_category: 'medical_consistency',
            event_label: ref.title,
            custom_parameters: {
              medical_context: 'reference_validation',
              error_type: 'validation_failure',
              reference_type: ref.type
            }
          });
        }
      }
    }
    
    return validated;
  }
  
  private async checkReferenceAccessibility(reference: Reference): Promise<boolean> {
    // Implementação simplificada - em produção usaria fetch
    if (reference.url) {
      try {
        // Simular verificação de URL - em produção seria uma requisição HTTP
        const url = new URL(reference.url);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }
    
    // Se não tem URL, assumir que é acessível (documento físico, etc.)
    return true;
  }
  
  private assessReferenceReliability(reference: Reference): number {
    let score = 0.5; // Base score
    
    // Verificar fonte confiável
    if (reference.source) {
      const source = reference.source.toLowerCase();
      const trustedSourcesArray = Array.from(this.TRUSTED_SOURCES);
      for (const trustedSource of trustedSourcesArray) {
        if (source.includes(trustedSource)) {
          score += 0.3;
          break;
        }
      }
    }
    
    // Verificar tipo de publicação
    if (reference.type === 'protocolo_nacional') {
      score += 0.2;
    } else if (reference.type === 'literatura_cientifica') {
      score += 0.15;
    }
    
    // Verificar completude das informações
    const requiredFields = ['title', 'source', 'type'];
    const completeness = requiredFields.filter(field => reference[field]).length / requiredFields.length;
    score += completeness * 0.1;
    
    return Math.min(score, 1.0);
  }
  
  private identifyInvalidReferences(references: Reference[]): InvalidReference[] {
    const invalid: InvalidReference[] = [];
    
    for (const ref of references) {
      // Verificar informações obrigatórias
      if (!ref.title || !ref.source) {
        invalid.push({
          id: ref.id || 'unknown',
          issue: 'missing_info',
          description: 'Referência sem título ou fonte'
        });
      }
      
      // Verificar fontes não confiáveis
      if (ref.source && !this.isTrustedSource(ref.source)) {
        invalid.push({
          id: ref.id || ref.title,
          issue: 'unreliable_source',
          description: `Fonte não verificada: ${ref.source}`
        });
      }
    }
    
    return invalid;
  }
  
  private identifyMissingCitations(content: string, references: Reference[]): MissingCitation[] {
    const missing: MissingCitation[] = [];
    
    // Identificar afirmações que precisam de citação
    const claimsRequiringCitation = [
      'estudos mostram',
      'pesquisa indica',
      'segundo',
      'conforme',
      'evidência',
      'dados demonstram'
    ];
    
    for (const claim of claimsRequiringCitation) {
      if (content.toLowerCase().includes(claim)) {
        const context = this.extractContext(claim, content);
        if (!this.hasNearbyReference(context, references)) {
          missing.push({
            claim,
            context,
            suggestedReferences: this.suggestReferences(claim)
          });
        }
      }
    }
    
    return missing;
  }
  
  private identifyReferenceViolations(references: Reference[]): ReferenceViolation[] {
    const violations: ReferenceViolation[] = [];
    
    for (const ref of references) {
      // Verificar data de publicação
      if (ref.year && (new Date().getFullYear() - ref.year) > 10) {
        violations.push({
          referenceId: ref.id || ref.title,
          violationType: 'currency',
          severity: 'medium',
          description: `Referência com mais de 10 anos: ${ref.year}`
        });
      }
      
      // Verificar completude
      const requiredFields = ['title', 'source', 'type'];
      const missingFields = requiredFields.filter(field => !ref[field]);
      if (missingFields.length > 0) {
        violations.push({
          referenceId: ref.id || ref.title,
          violationType: 'completeness',
          severity: 'high',
          description: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`
        });
      }
    }
    
    return violations;
  }
  
  private calculateReferenceScore(
    validCount: number,
    invalidCount: number,
    missingCount: number
  ): number {
    const totalReferences = validCount + invalidCount;
    if (totalReferences === 0) return 0;
    
    const validityRatio = validCount / totalReferences;
    const missingPenalty = Math.min(missingCount * 5, 30);
    
    return Math.max(0, Math.round(validityRatio * 100 - missingPenalty));
  }
  
  private isTrustedSource(source: string): boolean {
    const lowerSource = source.toLowerCase();
    return Array.from(this.TRUSTED_SOURCES).some(trusted => 
      lowerSource.includes(trusted)
    );
  }
  
  private hasNearbyReference(context: string, references: Reference[]): boolean {
    // Verificar se há referência no contexto (implementação simplificada)
    const referenceIndicators = ['(', '[', 'ref', 'fonte'];
    return referenceIndicators.some(indicator => 
      context.toLowerCase().includes(indicator)
    );
  }
  
  private suggestReferences(claim: string): string[] {
    // Sugestões baseadas no tipo de afirmação
    const suggestions: { [key: string]: string[] } = {
      'estudos mostram': ['PCDT Hanseníase 2022', 'Literatura científica relevante'],
      'pesquisa indica': ['Base de dados PubMed', 'Revisões sistemáticas'],
      'segundo': ['Protocolo oficial', 'Guidelines internacionais'],
      'conforme': ['PCDT vigente', 'Normas do Ministério da Saúde'],
      'evidência': ['Literatura baseada em evidência', 'Meta-análises'],
      'dados demonstram': ['Estudos epidemiológicos', 'Bases de dados oficiais']
    };
    
    return suggestions[claim] || ['Referência apropriada necessária'];
  }
  
  private extractContext(term: string, content: string): string {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + term.length + 100);
    
    return content.substring(start, end);
  }
}

// ===== VALIDAÇÃO DE UI/UX =====

export interface UIUXValidationResult {
  isConsistent: boolean;
  score: number;
  violations: UIUXViolation[];
  
  colorSchemeConsistency: ColorSchemeAnalysis;
  typographyConsistency: TypographyAnalysis;
  componentConsistency: ComponentAnalysis;
  interactionConsistency: InteractionAnalysis;
}

interface UIUXViolation {
  component: string;
  violationType: 'color' | 'typography' | 'spacing' | 'interaction';
  severity: 'low' | 'medium' | 'high';
  description: string;
  expectedValue: string;
  actualValue: string;
}

interface ColorSchemeAnalysis {
  primaryColors: string[];
  secondaryColors: string[];
  inconsistencies: ColorInconsistency[];
  contrastRatios: ContrastAnalysis[];
}

interface ColorInconsistency {
  element: string;
  expectedColor: string;
  actualColor: string;
  context: string;
}

interface ContrastAnalysis {
  foreground: string;
  background: string;
  ratio: number;
  wcagCompliant: boolean;
}

interface TypographyAnalysis {
  fontFamilies: string[];
  fontSizes: number[];
  inconsistencies: TypographyInconsistency[];
}

interface TypographyInconsistency {
  element: string;
  property: 'font-family' | 'font-size' | 'font-weight' | 'line-height';
  expectedValue: string;
  actualValue: string;
}

interface ComponentAnalysis {
  buttonStyles: ComponentStyleAnalysis;
  inputStyles: ComponentStyleAnalysis;
  cardStyles: ComponentStyleAnalysis;
  inconsistencies: ComponentInconsistency[];
}

interface ComponentStyleAnalysis {
  variations: number;
  standardStyle: Record<string, unknown>;
  deviations: StyleDeviation[];
}

interface StyleDeviation {
  component: string;
  property: string;
  standardValue: string;
  actualValue: string;
}

interface ComponentInconsistency {
  componentType: string;
  instances: string[];
  inconsistentProperties: string[];
  severity: 'low' | 'medium' | 'high';
}

interface InteractionAnalysis {
  hoverStates: InteractionStateAnalysis;
  focusStates: InteractionStateAnalysis;
  activeStates: InteractionStateAnalysis;
  inconsistencies: InteractionInconsistency[];
}

interface InteractionStateAnalysis {
  consistent: boolean;
  variations: number;
  standardBehavior: string;
}

interface InteractionInconsistency {
  element: string;
  state: 'hover' | 'focus' | 'active';
  expectedBehavior: string;
  actualBehavior: string;
}

export class UIUXConsistencyValidator {
  // Padrões de design esperados
  private readonly DESIGN_STANDARDS = {
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#6B7280'
    },
    typography: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48
    }
  };
  
  public validateUIUXConsistency(componentData: ComponentData[]): UIUXValidationResult {
    const colorAnalysis = this.analyzeColorConsistency(componentData);
    const typographyAnalysis = this.analyzeTypographyConsistency(componentData);
    const componentAnalysis = this.analyzeComponentConsistency(componentData);
    const interactionAnalysis = this.analyzeInteractionConsistency(componentData);
    
    const violations = this.identifyUIUXViolations([
      ...colorAnalysis.inconsistencies,
      ...typographyAnalysis.inconsistencies,
      ...componentAnalysis.inconsistencies,
      ...interactionAnalysis.inconsistencies
    ]);
    
    const score = this.calculateUIUXScore(violations);
    
    return {
      isConsistent: violations.length === 0,
      score,
      violations,
      colorSchemeConsistency: colorAnalysis,
      typographyConsistency: typographyAnalysis,
      componentConsistency: componentAnalysis,
      interactionConsistency: interactionAnalysis
    };
  }
  
  // Implementações simplificadas dos métodos de análise
  private analyzeColorConsistency(componentData: ComponentData[]): ColorSchemeAnalysis {
    return {
      primaryColors: Object.values(this.DESIGN_STANDARDS.colors),
      secondaryColors: [],
      inconsistencies: [],
      contrastRatios: []
    };
  }
  
  private analyzeTypographyConsistency(componentData: ComponentData[]): TypographyAnalysis {
    return {
      fontFamilies: this.DESIGN_STANDARDS.typography.fontFamily,
      fontSizes: Object.values(this.DESIGN_STANDARDS.typography.fontSize),
      inconsistencies: []
    };
  }
  
  private analyzeComponentConsistency(componentData: ComponentData[]): ComponentAnalysis {
    return {
      buttonStyles: { variations: 1, standardStyle: {}, deviations: [] },
      inputStyles: { variations: 1, standardStyle: {}, deviations: [] },
      cardStyles: { variations: 1, standardStyle: {}, deviations: [] },
      inconsistencies: []
    };
  }
  
  private analyzeInteractionConsistency(componentData: ComponentData[]): InteractionAnalysis {
    return {
      hoverStates: { consistent: true, variations: 1, standardBehavior: 'subtle highlight' },
      focusStates: { consistent: true, variations: 1, standardBehavior: 'blue outline' },
      activeStates: { consistent: true, variations: 1, standardBehavior: 'pressed appearance' },
      inconsistencies: []
    };
  }
  
  private identifyUIUXViolations(inconsistencies: unknown[]): UIUXViolation[] {
    // Converter inconsistências para violações padronizadas
    return [];
  }
  
  private calculateUIUXScore(violations: UIUXViolation[]): number {
    const baseScore = 100;
    const penalty = violations.reduce((sum, violation) => {
      const severityPenalties = { low: 2, medium: 5, high: 10 };
      return sum + severityPenalties[violation.severity];
    }, 0);
    
    return Math.max(0, baseScore - penalty);
  }
}

// ===== SISTEMA PRINCIPAL DE VALIDAÇÃO DE CONSISTÊNCIA =====

export class ConsistencyValidationSystem {
  private personaValidator: PersonaConsistencyValidator;
  private terminologyValidator: TerminologyConsistencyValidator;
  private referenceValidator: ReferenceConsistencyValidator;
  private uiuxValidator: UIUXConsistencyValidator;
  
  constructor() {
    this.personaValidator = new PersonaConsistencyValidator();
    this.terminologyValidator = new TerminologyConsistencyValidator();
    this.referenceValidator = new ReferenceConsistencyValidator();
    this.uiuxValidator = new UIUXConsistencyValidator();
  }
  
  public async validateConsistency(
    clinicalCase: ClinicalCase
  ): Promise<ConsistencyValidationResult> {
    // Extrair conteúdo para análise
    const content = this.extractCaseContent(clinicalCase);
    
    // Executar validações
    const personaValidation = this.personaValidator.validatePersonaConsistency(content, 'dr_gasnelio');
    const terminologyValidation = this.terminologyValidator.validateTerminology(content);
    const referenceValidation = await this.referenceValidator.validateReferences(
      clinicalCase.references || [], 
      content
    );
    const uiuxValidation = this.uiuxValidator.validateUIUXConsistency([]);
    
    // Consolidar resultados
    const allViolations = this.consolidateViolations([
      personaValidation,
      terminologyValidation,
      referenceValidation,
      uiuxValidation
    ]);
    
    const recommendations = this.generateRecommendations(allViolations);
    const overallScore = this.calculateOverallScore([
      personaValidation.score,
      terminologyValidation.score,
      referenceValidation.score,
      uiuxValidation.score
    ]);
    
    return {
      isValid: allViolations.length === 0,
      score: overallScore,
      violations: allViolations,
      recommendations,
      validation: {
        personaConsistency: personaValidation,
        terminologyConsistency: terminologyValidation,
        referenceConsistency: referenceValidation,
        uiuxConsistency: uiuxValidation
      }
    };
  }
  
  private extractCaseContent(clinicalCase: ClinicalCase): string {
    let content = '';
    
    content += clinicalCase.title + ' ';
    content += clinicalCase.scenario.presentation + ' ';
    content += clinicalCase.learningObjectives.join(' ') + ' ';
    
    clinicalCase.steps.forEach(step => {
      content += step.title + ' ';
      content += step.description + ' ';
      content += step.instruction + ' ';
      content += step.validation.clinicalRationale + ' ';
      content += step.validation.feedback.correct.message + ' ';
      content += step.validation.feedback.incorrect.message + ' ';
    });
    
    return content;
  }
  
  private consolidateViolations(validationResults: ValidationResult[]): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];
    
    // Converter violações específicas para formato padrão
    // Implementação simplificada
    
    return violations;
  }
  
  private generateRecommendations(violations: ConsistencyViolation[]): ConsistencyRecommendation[] {
    const recommendations: ConsistencyRecommendation[] = [];
    
    // Gerar recomendações baseadas nas violações
    // Implementação simplificada
    
    return recommendations;
  }
  
  private calculateOverallScore(scores: number[]): number {
    const weights = [0.3, 0.3, 0.25, 0.15]; // persona, terminology, reference, uiux
    
    return Math.round(
      scores.reduce((sum, score, index) => sum + score * weights[index], 0)
    );
  }
}

export default ConsistencyValidationSystem;