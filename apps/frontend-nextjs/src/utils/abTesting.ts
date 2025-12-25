/**
 * A/B Testing Framework - ETAPA 5.1
 * Sistema completo de testes A/B para otimização educacional
 * 
 * FUNCIONALIDADES:
 * - Gestão de experimentos A/B
 * - Segmentação de usuários
 * - Coleta de métricas de conversão
 * - Análise estatística dos resultados
 * - Integração com analytics educacionais
 */

import { EducationalSecurity } from './educationalSecurity';
import { safeLocalStorage } from '@/hooks/useClientStorage';

// ================== TIPOS E INTERFACES ==================

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  
  // Configuração do experimento
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  trafficAllocation: number; // % de usuários no experimento (0-100)
  
  // Critérios de segmentação
  targeting: {
    userType?: ('anonymous' | 'authenticated')[];
    device?: ('mobile' | 'tablet' | 'desktop')[];
    persona?: ('dr_gasnelio' | 'ga' | 'none')[];
    location?: string[];
    newUser?: boolean; // true = apenas novos usuários
  };
  
  // Métricas de sucesso
  primaryMetric: string;
  secondaryMetrics: string[];
  
  // Configurações temporais
  startDate: Date;
  endDate?: Date;
  duration: number; // dias
  
  // Configurações estatísticas
  confidence: number; // % (normalmente 95)
  minimumSampleSize: number;
  
  // Metadados
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // % do tráfego (soma de todos = 100)
  isControl: boolean; // true para versão de controle
  
  // Configuração do variant
  config: {
    componentName?: string;
    props?: Record<string, any>;
    styles?: Record<string, any>;
    content?: Record<string, any>;
  };
  
  // Resultados
  metrics: ABMetrics;
}

export interface ABMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  
  // Métricas educacionais específicas
  educationalMetrics: {
    completionRate: number;
    averageScore: number;
    timeToCompletion: number; // minutos
    satisfactionScore: number; // 1-5
    errorRate: number;
  };
  
  // Métricas de engajamento
  engagement: {
    clicks: number;
    timeOnPage: number;
    bounceRate: number;
    interactions: number;
  };
  
  // Significância estatística
  statistical: {
    pValue?: number;
    confidenceInterval?: [number, number];
    isSignificant: boolean;
    uplift?: number; // % melhora sobre controle
  };
}

export interface ABUserAssignment {
  userId: string;
  sessionId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  
  // Contexto do usuário
  userProfile: {
    userType: 'anonymous' | 'authenticated';
    device: 'mobile' | 'tablet' | 'desktop';
    persona: 'dr_gasnelio' | 'ga' | 'none';
    location?: string;
    isNewUser: boolean;
  };
}

export interface ABEvent {
  eventId: string;
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  
  eventType: 'impression' | 'conversion' | 'interaction' | 'completion';
  eventData: any;
  timestamp: Date;
  
  // Contexto do evento
  pageUrl?: string;
  componentId?: string;
  metadata?: Record<string, any>;
}

// ================== SISTEMA PRINCIPAL A/B TESTING ==================

export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private experiments: Map<string, ABExperiment>;
  private userAssignments: Map<string, ABUserAssignment[]>;
  private events: ABEvent[];
  private isEnabled: boolean;

  private constructor() {
    this.experiments = new Map();
    this.userAssignments = new Map();
    this.events = [];
    this.isEnabled = true;
    
    this.initializeFramework();
  }

  public static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  // ===== INICIALIZAÇÃO =====

  private initializeFramework(): void {
    // Carregar experimentos salvos
    this.loadExperiments();
    
    // Carregar assignments do usuário atual
    this.loadUserAssignments();
    
    // Configurar experimentos padrão para demonstração
    this.setupDefaultExperiments();
    
    console.log('🧪 A/B Testing Framework initialized');
  }

  private setupDefaultExperiments(): void {
    // Experimento 1: Otimização da Calculadora de Doses
    const calculatorExperiment: ABExperiment = {
      id: 'calculator_optimization_v1',
      name: 'Otimização da Interface da Calculadora',
      description: 'Testar diferentes layouts da calculadora para melhorar usabilidade',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Versão Atual',
          description: 'Layout atual da calculadora',
          allocation: 50,
          isControl: true,
          config: {
            componentName: 'BasicCalculator',
            props: { layout: 'standard' }
          },
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'enhanced',
          name: 'Layout Aprimorado',
          description: 'Interface mais visual com botões maiores',
          allocation: 50,
          isControl: false,
          config: {
            componentName: 'BasicCalculator',
            props: { layout: 'enhanced', visualMode: true }
          },
          metrics: this.createEmptyMetrics()
        }
      ],
      trafficAllocation: 80, // 80% dos usuários no experimento
      targeting: {
        userType: ['anonymous', 'authenticated'],
        device: ['desktop', 'tablet']
      },
      primaryMetric: 'completion_rate',
      secondaryMetrics: ['error_rate', 'time_to_completion', 'satisfaction'],
      startDate: new Date(),
      duration: 14, // 14 dias
      confidence: 95,
      minimumSampleSize: 100,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Experimento 2: Personas na Interface de Chat
    const personaExperiment: ABExperiment = {
      id: 'persona_selection_v1',
      name: 'Seleção de Personas no Chat',
      description: 'Testar posicionamento do seletor de personas',
      status: 'running',
      variants: [
        {
          id: 'header',
          name: 'Personas no Header',
          description: 'Seletor de personas no cabeçalho',
          allocation: 50,
          isControl: true,
          config: {
            componentName: 'PersonaSwitch',
            props: { position: 'header' }
          },
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'sidebar',
          name: 'Personas na Lateral',
          description: 'Seletor de personas na barra lateral',
          allocation: 50,
          isControl: false,
          config: {
            componentName: 'PersonaSwitch',
            props: { position: 'sidebar', expanded: true }
          },
          metrics: this.createEmptyMetrics()
        }
      ],
      trafficAllocation: 60,
      targeting: {
        userType: ['authenticated'],
        persona: ['dr_gasnelio', 'ga']
      },
      primaryMetric: 'persona_usage_rate',
      secondaryMetrics: ['chat_engagement', 'session_duration'],
      startDate: new Date(),
      duration: 21,
      confidence: 95,
      minimumSampleSize: 150,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.experiments.set(calculatorExperiment.id, calculatorExperiment);
    this.experiments.set(personaExperiment.id, personaExperiment);
  }

  // ===== ASSIGNMENT DE USUÁRIOS =====

  public getVariantForUser(experimentId: string, userId: string, sessionId: string): string | null {
    if (!this.isEnabled) return null;

    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Verificar se usuário já tem assignment
    const existingAssignment = this.getUserAssignment(userId, experimentId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Verificar se usuário se qualifica para o experimento
    const userProfile = this.getUserProfile(userId, sessionId);
    if (!this.isUserEligible(experiment, userProfile)) {
      return null;
    }

    // Verificar traffic allocation
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null; // Usuário não selecionado para o experimento
    }

    // Atribuir variant baseado no algoritmo de hash consistente
    const variantId = this.assignVariant(experiment, userId);
    
    // Salvar assignment
    const assignment: ABUserAssignment = {
      userId,
      sessionId,
      experimentId,
      variantId,
      assignedAt: new Date(),
      userProfile
    };
    
    this.saveUserAssignment(assignment);
    
    // Registrar impression
    this.trackEvent('impression', experimentId, variantId, userId, sessionId);
    
    return variantId;
  }

  private assignVariant(experiment: ABExperiment, userId: string): string {
    // Usar hash consistente para garantir que o mesmo usuário sempre recebe o mesmo variant
    const hash = this.hashString(userId + experiment.id);
    const bucket = hash % 100;
    
    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (bucket < cumulativeAllocation) {
        return variant.id;
      }
    }
    
    // Fallback para controle
    return experiment.variants.find(v => v.isControl)?.id || experiment.variants[0].id;
  }

  private isUserEligible(experiment: ABExperiment, userProfile: ABUserAssignment['userProfile']): boolean {
    const { targeting } = experiment;
    
    // Verificar tipo de usuário
    if (targeting.userType && !targeting.userType.includes(userProfile.userType)) {
      return false;
    }
    
    // Verificar dispositivo
    if (targeting.device && !targeting.device.includes(userProfile.device)) {
      return false;
    }
    
    // Verificar persona
    if (targeting.persona && !targeting.persona.includes(userProfile.persona)) {
      return false;
    }
    
    // Verificar se é novo usuário
    if (targeting.newUser !== undefined && targeting.newUser !== userProfile.isNewUser) {
      return false;
    }
    
    return true;
  }

  // ===== TRACKING DE EVENTOS =====

  public trackEvent(
    eventType: ABEvent['eventType'],
    experimentId: string,
    variantId: string,
    userId: string,
    sessionId: string,
    eventData: any = {}
  ): void {
    const event: ABEvent = {
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      experimentId,
      variantId,
      userId,
      sessionId,
      eventType,
      eventData,
      timestamp: new Date(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      componentId: eventData.componentId,
      metadata: eventData.metadata
    };
    
    this.events.push(event);
    
    // Atualizar métricas do variant
    this.updateVariantMetrics(experimentId, variantId, eventType, eventData);
    
    // Log para auditoria
    EducationalSecurity.securityLogger.log({
      userId,
      sessionId,
      action: 'ab_test_event',
      component: 'ab_testing',
      riskLevel: 'low',
      data: {
        input: { experimentId, variantId, eventType },
        output: this.sanitizeEventData(eventData),
        validation: undefined,
        errors: []
      },
      metadata: {}
    });
  }

  private updateVariantMetrics(experimentId: string, variantId: string, eventType: ABEvent['eventType'], eventData: any): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;
    
    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;
    
    switch (eventType) {
      case 'impression':
        variant.metrics.impressions++;
        break;
        
      case 'conversion':
        variant.metrics.conversions++;
        variant.metrics.conversionRate = variant.metrics.conversions / variant.metrics.impressions;
        break;
        
      case 'completion':
        variant.metrics.educationalMetrics.completionRate++;
        if (eventData.score) {
          const currentAvg = variant.metrics.educationalMetrics.averageScore;
          const count = variant.metrics.educationalMetrics.completionRate;
          variant.metrics.educationalMetrics.averageScore = 
            (currentAvg * (count - 1) + eventData.score) / count;
        }
        break;
        
      case 'interaction':
        variant.metrics.engagement.interactions++;
        if (eventData.timeOnPage) {
          variant.metrics.engagement.timeOnPage = eventData.timeOnPage;
        }
        break;
    }
    
    // Recalcular significância estatística
    this.calculateStatisticalSignificance(experiment);
  }

  // ===== ANÁLISE ESTATÍSTICA =====

  private calculateStatisticalSignificance(experiment: ABExperiment): void {
    const controlVariant = experiment.variants.find(v => v.isControl);
    if (!controlVariant) return;
    
    for (const variant of experiment.variants) {
      if (variant.isControl) continue;
      
      const result = this.performTTest(controlVariant, variant);
      variant.metrics.statistical = result;
    }
  }

  private performTTest(control: ABVariant, variant: ABVariant): ABMetrics['statistical'] {
    const controlRate = control.metrics.conversionRate;
    const variantRate = variant.metrics.conversionRate;
    const controlN = control.metrics.impressions;
    const variantN = variant.metrics.impressions;
    
    if (controlN < 30 || variantN < 30) {
      return {
        pValue: undefined,
        confidenceInterval: undefined,
        isSignificant: false,
        uplift: ((variantRate - controlRate) / controlRate) * 100
      };
    }
    
    // Cálculo simplificado de t-test para proporções
    const pooledRate = (control.metrics.conversions + variant.metrics.conversions) / 
                      (controlN + variantN);
    
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlN + 1/variantN));
    const tStatistic = (variantRate - controlRate) / standardError;
    
    // Aproximação do p-value (simplificada)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));
    
    const uplift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;
    
    return {
      pValue,
      confidenceInterval: [
        variantRate - 1.96 * Math.sqrt(variantRate * (1 - variantRate) / variantN),
        variantRate + 1.96 * Math.sqrt(variantRate * (1 - variantRate) / variantN)
      ],
      isSignificant: pValue < 0.05,
      uplift
    };
  }

  // ===== RELATÓRIOS E ANALYTICS =====

  public getExperimentResults(experimentId: string): ABExperiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    // Atualizar estatísticas antes de retornar
    this.calculateStatisticalSignificance(experiment);
    
    return { ...experiment };
  }

  public getAllActiveExperiments(): ABExperiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }

  public generateExperimentReport(experimentId: string): ExperimentReport | null {
    const experiment = this.getExperimentResults(experimentId);
    if (!experiment) return null;
    
    const totalImpressions = experiment.variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    const totalConversions = experiment.variants.reduce((sum, v) => sum + v.metrics.conversions, 0);
    
    const winner = this.determineWinner(experiment);
    const recommendations = this.generateRecommendations(experiment);
    
    return {
      experiment,
      summary: {
        totalImpressions,
        totalConversions,
        overallConversionRate: totalConversions / totalImpressions || 0,
        duration: Math.floor((Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        status: experiment.status
      },
      winner,
      recommendations,
      generatedAt: new Date()
    };
  }

  private determineWinner(experiment: ABExperiment): { variantId: string; confidence: number } | null {
    const significantVariants = experiment.variants
      .filter(v => v.metrics.statistical.isSignificant && v.metrics.statistical.uplift! > 0)
      .sort((a, b) => (b.metrics.statistical.uplift! - a.metrics.statistical.uplift!));
    
    if (significantVariants.length === 0) {
      return null;
    }
    
    return {
      variantId: significantVariants[0].id,
      confidence: (1 - significantVariants[0].metrics.statistical.pValue!) * 100
    };
  }

  private generateRecommendations(experiment: ABExperiment): string[] {
    const recommendations: string[] = [];
    const winner = this.determineWinner(experiment);
    
    if (winner) {
      recommendations.push(`Implementar variant "${experiment.variants.find(v => v.id === winner.variantId)?.name}" como padrão`);
      recommendations.push(`Confiança estatística: ${winner.confidence.toFixed(1)}%`);
    } else {
      recommendations.push('Continuar experimento para obter significância estatística');
      
      const totalImpressions = experiment.variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
      if (totalImpressions < experiment.minimumSampleSize) {
        recommendations.push(`Necessário mais ${experiment.minimumSampleSize - totalImpressions} impressões`);
      }
    }
    
    return recommendations;
  }

  // ===== MÉTODOS DE CONVENIÊNCIA PARA REACT =====

  public useExperiment(experimentId: string, userId?: string, sessionId?: string): {
    variant: string | null;
    trackConversion: (data?: any) => void;
    trackInteraction: (data?: any) => void;
  } {
    const defaultUserId = userId || this.generateUserId();
    const defaultSessionId = sessionId || this.generateSessionId();
    
    const variant = this.getVariantForUser(experimentId, defaultUserId, defaultSessionId);
    
    return {
      variant,
      trackConversion: (data = {}) => {
        if (variant) {
          this.trackEvent('conversion', experimentId, variant, defaultUserId, defaultSessionId, data);
        }
      },
      trackInteraction: (data = {}) => {
        if (variant) {
          this.trackEvent('interaction', experimentId, variant, defaultUserId, defaultSessionId, data);
        }
      }
    };
  }

  // ===== UTILITY METHODS =====

  private createEmptyMetrics(): ABMetrics {
    return {
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      educationalMetrics: {
        completionRate: 0,
        averageScore: 0,
        timeToCompletion: 0,
        satisfactionScore: 0,
        errorRate: 0
      },
      engagement: {
        clicks: 0,
        timeOnPage: 0,
        bounceRate: 0,
        interactions: 0
      },
      statistical: {
        isSignificant: false
      }
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private normalCDF(x: number): number {
    // Aproximação da função de distribuição cumulativa normal
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Aproximação da função erro
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0/(1.0 + p*x);
    const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);

    return sign*y;
  }

  private generateUserId(): string {
    // Use crypto.getRandomValues for cryptographically secure IDs (CWE-338 fix)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(12);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, b => b.toString(36)).join('').substring(0, 12);
      return `user_${Date.now()}_${randomPart}`;
    }
    return `user_${Date.now()}_${Date.now().toString(36)}`;
  }

  private generateSessionId(): string {
    // Use crypto.getRandomValues for cryptographically secure IDs (CWE-338 fix)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(12);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, b => b.toString(36)).join('').substring(0, 12);
      return `session_${Date.now()}_${randomPart}`;
    }
    return `session_${Date.now()}_${Date.now().toString(36)}`;
  }

  private getUserProfile(userId: string, sessionId: string): ABUserAssignment['userProfile'] {
    // Em produção, obter dados reais do usuário
    return {
      userType: 'anonymous',
      device: 'desktop',
      persona: 'none',
      isNewUser: true
    };
  }

  private getUserAssignment(userId: string, experimentId: string): ABUserAssignment | null {
    const userAssignments = this.userAssignments.get(userId) || [];
    return userAssignments.find(a => a.experimentId === experimentId) || null;
  }

  private saveUserAssignment(assignment: ABUserAssignment): void {
    const userAssignments = this.userAssignments.get(assignment.userId) || [];
    userAssignments.push(assignment);
    this.userAssignments.set(assignment.userId, userAssignments);
    
    // Persistir no localStorage para desenvolvimento
    if (typeof localStorage !== 'undefined') {
      safeLocalStorage()?.setItem(`ab_assignment_${assignment.userId}`, JSON.stringify(userAssignments));
    }
  }

  private sanitizeEventData(eventData: any): any {
    // Remover dados sensíveis para logging
    const sanitized = { ...eventData };
    delete sanitized.personalInfo;
    delete sanitized.email;
    return sanitized;
  }

  private loadExperiments(): void {
    // Em produção, carregar do backend
    // Para desenvolvimento, usar localStorage ou dados mock
  }

  private loadUserAssignments(): void {
    // Em produção, carregar do backend baseado no usuário atual
    // Para desenvolvimento, usar localStorage
  }

  // Método público para integração
  public initialize(): void {
    this.initializeFramework();
    console.log('A/B Testing Framework re-initialized');
  }
}

// ===== INTERFACES AUXILIARES =====

interface ExperimentReport {
  experiment: ABExperiment;
  summary: {
    totalImpressions: number;
    totalConversions: number;
    overallConversionRate: number;
    duration: number;
    status: string;
  };
  winner: { variantId: string; confidence: number } | null;
  recommendations: string[];
  generatedAt: Date;
}

// ===== HOOK REACT PARA A/B TESTING =====

export function useABTest(experimentId: string, userId?: string, sessionId?: string) {
  const framework = ABTestingFramework.getInstance();
  return framework.useExperiment(experimentId, userId, sessionId);
}

// ===== EXPORTS =====

export default ABTestingFramework;

// Types already exported as interface declarations above
// ABTestingFramework already exported as class declaration above