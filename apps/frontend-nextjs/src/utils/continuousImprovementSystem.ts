/**
 * Continuous Improvement System
 * Framework de feedback e melhoria contínua para recursos educativos
 *
 * @author Claude Code QA Specialist
 * @version 1.0.0
 */

// Use global Window interface from types/analytics.ts

// Internal type definitions for continuous improvement
interface ClinicalCase {
  id: string;
  title: string;
  description: string;
}

interface CaseSession {
  id: string;
  userId: string;
  caseId: string;
  startTime: Date;
  endTime?: Date;
}

interface StepResult {
  stepId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
}

interface LearningAnalytics {
  userId: string;
  sessionId: string;
  interactions: InteractionEvent[];
  outcomes: Record<string, unknown>;
}

interface InteractionEvent {
  id: string;
  type: 'click' | 'navigation' | 'error' | 'help_request' | 'completion';
  timestamp: Date;
  data: Record<string, unknown>;
}

// ===== INTERFACES DO SISTEMA =====

interface BehavioralData {
  timeSpent: number;
  interactionCount: number;
  completionRate: number;
  retryCount: number;
  helpRequestCount: number;
  errorCount: number;
}

interface AnalyticsData {
  sessionDuration: number;
  clickCount: number;
  scrollDepth: number;
  errorRate: number;
  conversionRate: number;
  [key: string]: string | number;
}

interface VariantImplementation {
  componentProps?: Record<string, unknown>;
  styleChanges?: Record<string, string>;
  contentChanges?: Record<string, string>;
  behaviorChanges?: Record<string, unknown>;
}

interface RatingObject {
  [key: string]: number;
}

type AnyRating = UsabilityRating | ContentQualityRating | LearningEffectivenessRating;

interface QuantitativeAnalysisResult {
  totalFeedbacks: number;
  averageRatings: AverageRatings;
  trendAnalysis: TrendAnalysis[];
  segmentAnalysis: SegmentAnalysis[];
}

interface QualitativeAnalysisResult {
  commonThemes: ThemeAnalysis[];
  sentimentAnalysis: SentimentAnalysis;
  priorityIssues: PriorityIssue[];
  userJourneyInsights: UserJourneyInsight[];
}

interface ImpactMetrics {
  userSatisfactionTrend: number[];
  performanceImprovements: PerformanceMetric[];
  learningOutcomeImprovements: LearningOutcomeMetric[];
  adoptionRates: AdoptionMetric[];
}

interface ImpactMeasurement {
  recommendation: string;
  metrics: Array<{
    metric: string;
    baseline: number;
    current: number;
    improvement: number;
    target: number;
  }>;
}

interface TimeframeFilter {
  start?: Date;
  end?: Date;
  duration?: number;
}

interface FeedbackSummary {
  totalFeedbacks: number;
  averageRating: number;
  lastUpdated: Date;
  criticalIssues: number;
}

interface ABTestFeedback {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  outcome: boolean;
}

interface StatisticalAnalysis {
  totalSessions: number;
  conversionRates: Map<string, number>;
  confidenceLevel: number;
  pValue: number;
  statisticalSignificance: boolean;
}

interface VariantPerformance {
  variantId: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  metrics: Record<string, { value: number; improvement: number; significance: boolean }>;
  userFeedback: {
    averageRating: number;
    sentimentScore: number;
    commonComments: string[];
  };
}

interface TestWinner {
  variantId: string;
  confidenceLevel: number;
  improvementPercentage: number;
  significantMetrics: string[];
}

interface TestInsights {
  keyFindings: string[];
  unexpectedResults: string[];
  segmentDifferences: string[];
  recommendations: string[];
}

interface ImplementationPlan {
  phases: string[];
  timeline: string;
  resources: string[];
  risks: string[];
  successCriteria: string[];
}

interface BaselineMetrics {
  [metricName: string]: number;
}

interface IssueList {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  frequency: number;
}

interface OpportunityList {
  id: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  effort: 'small' | 'medium' | 'large';
}

export interface ImprovementFeedbackData {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  
  // Contexto
  context: {
    componentType: 'clinical_case' | 'dose_calculator' | 'timeline' | 'checklist' | 'certification';
    componentId: string;
    userType: 'student' | 'professional' | 'instructor';
    device: 'mobile' | 'tablet' | 'desktop';
    persona: 'dr_gasnelio' | 'ga' | 'none';
  };
  
  // Tipos de feedback
  feedback: {
    usabilityRating: UsabilityRating;
    contentQuality: ContentQualityRating;
    learningEffectiveness: LearningEffectivenessRating;
    technicalIssues: TechnicalIssue[];
    suggestions: UserSuggestion[];
    openFeedback: string;
  };
  
  // Métricas comportamentais
  behavioralData: {
    timeSpent: number; // segundos
    interactionCount: number;
    completionRate: number; // 0-1
    retryCount: number;
    helpRequestCount: number;
    errorCount: number;
  };
}

interface UsabilityRating {
  easeOfUse: number; // 1-5
  navigationClarity: number; // 1-5
  visualDesign: number; // 1-5
  responsiveness: number; // 1-5
  accessibility: number; // 1-5
  overallSatisfaction: number; // 1-5
}

interface ContentQualityRating {
  accuracy: number; // 1-5
  relevance: number; // 1-5
  clarity: number; // 1-5
  completeness: number; // 1-5
  upToDateness: number; // 1-5
  practicalValue: number; // 1-5
}

interface LearningEffectivenessRating {
  objectiveAlignment: number; // 1-5
  engagementLevel: number; // 1-5
  difficultyAppropriate: number; // 1-5
  feedbackQuality: number; // 1-5
  knowledgeRetention: number; // 1-5
  skillApplication: number; // 1-5
}

interface TechnicalIssue {
  type: 'performance' | 'bug' | 'compatibility' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reproductionSteps: string[];
  deviceInfo: string;
  browserInfo: string;
  screenshot?: string; // base64
}

interface UserSuggestion {
  category: 'content' | 'design' | 'functionality' | 'new_feature';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
}

// ===== ANÁLISE E INSIGHTS =====

export interface ImprovementInsights {
  generatedAt: Date;
  timeframe: {
    start: Date;
    end: Date;
  };
  
  // Análises quantitativas
  quantitative: {
    totalFeedbacks: number;
    averageRatings: AverageRatings;
    trendAnalysis: TrendAnalysis[];
    segmentAnalysis: SegmentAnalysis[];
  };
  
  // Análises qualitativas
  qualitative: {
    commonThemes: ThemeAnalysis[];
    sentimentAnalysis: SentimentAnalysis;
    priorityIssues: PriorityIssue[];
    userJourneyInsights: UserJourneyInsight[];
  };
  
  // Recomendações
  recommendations: ImprovementRecommendation[];
  
  // Métricas de impacto
  impactMetrics: {
    userSatisfactionTrend: number[];
    performanceImprovements: PerformanceMetric[];
    learningOutcomeImprovements: LearningOutcomeMetric[];
    adoptionRates: AdoptionMetric[];
  };
}

interface AverageRatings {
  usability: UsabilityRating;
  contentQuality: ContentQualityRating;
  learningEffectiveness: LearningEffectivenessRating;
}

interface TrendAnalysis {
  component: string;
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number; // % change
  significance: number; // statistical significance
}

interface SegmentAnalysis {
  segment: string; // e.g., 'mobile_users', 'professionals'
  sampleSize: number;
  averageRating: number;
  keyInsights: string[];
}

interface ThemeAnalysis {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  examples: string[];
  relatedComponents: string[];
}

interface SentimentAnalysis {
  overall: number; // -1 to 1
  byComponent: Map<string, number>;
  byUserType: Map<string, number>;
  keyPositives: string[];
  keyNegatives: string[];
}

interface PriorityIssue {
  id: string;
  title: string;
  category: 'critical_bug' | 'usability_issue' | 'content_gap' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  impact: {
    usersSffected: number;
    functionalityImpact: 'low' | 'medium' | 'high';
    learningImpact: 'low' | 'medium' | 'high';
    businessImpact: 'low' | 'medium' | 'high';
  };
  
  evidence: {
    feedbackCount: number;
    reproductionRate: number;
    userReports: string[];
    analyticsData: AnalyticsData;
  };
  
  suggestedSolution: string;
  estimatedEffort: 'small' | 'medium' | 'large';
  expectedBenefit: string;
}

interface UserJourneyInsight {
  journeyStage: 'onboarding' | 'exploration' | 'engagement' | 'mastery' | 'certification';
  insight: string;
  dataPoints: string[];
  impactOnLearning: 'positive' | 'negative' | 'neutral';
  recommendedActions: string[];
}

interface ImprovementRecommendation {
  id: string;
  category: 'usability' | 'content' | 'performance' | 'accessibility' | 'engagement';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  
  title: string;
  description: string;
  rationale: string;
  
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedEffort: string; // e.g., "2-4 semanas"
    requiredSkills: string[];
    dependencies: string[];
    risks: string[];
  };
  
  expectedOutcomes: {
    userSatisfactionImprovement: number; // expected % improvement
    performanceImpact: string;
    learningEffectivenessImpact: string;
    maintenanceImpact: string;
  };
  
  successMetrics: string[];
  timeline: string;
}

interface PerformanceMetric {
  metric: string;
  baseline: number;
  current: number;
  improvement: number;
  target: number;
}

interface LearningOutcomeMetric {
  outcome: string;
  baseline: number;
  current: number;
  improvement: number;
  target: number;
}

interface AdoptionMetric {
  feature: string;
  adoptionRate: number; // 0-1
  retentionRate: number; // 0-1
  satisfactionScore: number; // 1-5
}

// ===== A/B TESTING FRAMEWORK =====

export interface ABTestConfiguration {
  id: string;
  name: string;
  description: string;
  
  hypothesis: string;
  successMetrics: string[];
  
  variants: ABTestVariant[];
  trafficAllocation: Map<string, number>; // variant -> percentage
  
  duration: {
    start: Date;
    end: Date;
    minSampleSize: number;
  };
  
  targetSegments: string[];
  exclusionCriteria: string[];
  
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  changes: VariantChange[];
}

interface VariantChange {
  componentId: string;
  changeType: 'content' | 'design' | 'interaction' | 'flow';
  description: string;
  implementation: VariantImplementation;
}

export interface ABTestResult {
  testId: string;
  analyzedAt: Date;
  
  // Statistical analysis
  statistical: {
    totalSessions: number;
    conversionRates: Map<string, number>;
    confidenceLevel: number;
    pValue: number;
    statisticalSignificance: boolean;
  };
  
  // Variant performance
  variantResults: VariantResult[];
  
  // Winner determination
  winner: {
    variantId: string;
    confidenceLevel: number;
    improvementPercentage: number;
    significantMetrics: string[];
  };
  
  // Insights
  insights: {
    keyFindings: string[];
    unexpectedResults: string[];
    segmentDifferences: string[];
    recommendations: string[];
  };
}

interface VariantResult {
  variantId: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  
  metrics: {
    [metricName: string]: {
      value: number;
      improvement: number; // vs control
      significance: boolean;
    };
  };
  
  userFeedback: {
    averageRating: number;
    sentimentScore: number;
    commonComments: string[];
  };
}

// ===== SISTEMA PRINCIPAL =====

export class ContinuousImprovementSystem {
  private feedbackData: ImprovementFeedbackData[] = [];
  private abTests: Map<string, ABTestConfiguration> = new Map();
  private improvements: Map<string, ImprovementRecommendation> = new Map();
  
  // ===== COLETA DE FEEDBACK =====
  
  public collectFeedback(feedback: ImprovementFeedbackData): void {
    // Validar e sanitizar feedback
    const validatedFeedback = this.validateFeedback(feedback);
    
    // Armazenar feedback
    this.feedbackData.push(validatedFeedback);
    
    // Análise imediata para issues críticos
    this.performImmediateAnalysis(validatedFeedback);
    
    // Trigger análise incremental
    this.triggerIncrementalAnalysis();
  }
  
  public collectBehavioralData(
    sessionId: string,
    componentId: string,
    interactions: InteractionEvent[]
  ): void {
    const behavioralData = this.analyzeBehavioralPatterns(interactions);
    
    // Associar com feedback existente ou criar novo
    let existingFeedback = this.feedbackData.find(f => f.sessionId === sessionId);
    
    if (existingFeedback) {
      existingFeedback.behavioralData = behavioralData;
    } else {
      // Criar feedback baseado apenas em dados comportamentais
      const implicitFeedback: ImprovementFeedbackData = {
        id: `behavioral_${Date.now()}`,
        timestamp: new Date(),
        sessionId,
        context: {
          componentType: 'clinical_case', // Inferir do componentId
          componentId,
          userType: 'professional', // Default
          device: this.detectDevice(),
          persona: 'dr_gasnelio' // Default
        },
        feedback: {
          usabilityRating: this.inferUsabilityFromBehavior(behavioralData),
          contentQuality: this.getDefaultContentRating(),
          learningEffectiveness: this.inferLearningFromBehavior(behavioralData),
          technicalIssues: [],
          suggestions: [],
          openFeedback: ''
        },
        behavioralData: behavioralData as BehavioralData
      };
      
      this.feedbackData.push(implicitFeedback);
    }
  }
  
  private validateFeedback(feedback: ImprovementFeedbackData): ImprovementFeedbackData {
    // Sanitizar strings
    if (feedback.feedback.openFeedback) {
      feedback.feedback.openFeedback = this.sanitizeString(feedback.feedback.openFeedback);
    }
    
    // Validar ranges numéricos
    feedback.feedback.usabilityRating = this.validateUsabilityRating(feedback.feedback.usabilityRating);
    feedback.feedback.contentQuality = this.validateContentQualityRating(feedback.feedback.contentQuality);
    feedback.feedback.learningEffectiveness = this.validateLearningEffectivenessRating(feedback.feedback.learningEffectiveness);
    
    return feedback;
  }
  
  private performImmediateAnalysis(feedback: ImprovementFeedbackData): void {
    // Detectar issues críticos
    const criticalIssues = feedback.feedback.technicalIssues.filter(
      issue => issue.severity === 'critical'
    );
    
    if (criticalIssues.length > 0) {
      this.triggerCriticalIssueAlert(criticalIssues, feedback);
    }
    
    // Detectar feedback extremamente negativo
    const avgRating = this.calculateAverageRating(feedback.feedback);
    if (avgRating < 2.0) {
      this.flagNegativeFeedback(feedback);
    }
  }
  
  // ===== ANÁLISE DE INSIGHTS =====
  
  public generateInsights(timeframe?: { start: Date; end: Date }): ImprovementInsights {
    const relevantFeedback = this.getRelevantFeedback(timeframe);
    
    const insights: ImprovementInsights = {
      generatedAt: new Date(),
      timeframe: timeframe || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        end: new Date()
      },
      
      quantitative: this.performQuantitativeAnalysis(relevantFeedback),
      qualitative: this.performQualitativeAnalysis(relevantFeedback),
      recommendations: this.generateRecommendations(relevantFeedback),
      impactMetrics: this.calculateImpactMetrics(relevantFeedback)
    };
    
    return insights;
  }
  
  private performQuantitativeAnalysis(feedback: ImprovementFeedbackData[]): QuantitativeAnalysisResult {
    const totalFeedbacks = feedback.length;
    const averageRatings = this.calculateAverageRatings(feedback);
    const trendAnalysis = this.analyzeTrends(feedback);
    const segmentAnalysis = this.analyzeSegments(feedback);
    
    return {
      totalFeedbacks,
      averageRatings,
      trendAnalysis,
      segmentAnalysis
    };
  }
  
  private performQualitativeAnalysis(feedback: ImprovementFeedbackData[]): QualitativeAnalysisResult {
    const textFeedback = feedback
      .filter(f => f.feedback.openFeedback)
      .map(f => f.feedback.openFeedback);
    
    const commonThemes = this.extractCommonThemes(textFeedback);
    const sentimentAnalysis = this.analyzeSentiment(textFeedback);
    const priorityIssues = this.identifyPriorityIssues(feedback);
    const userJourneyInsights = this.analyzeUserJourneys(feedback);
    
    return {
      commonThemes,
      sentimentAnalysis,
      priorityIssues,
      userJourneyInsights
    };
  }
  
  private generateRecommendations(feedback: ImprovementFeedbackData[]): ImprovementRecommendation[] {
    const recommendations: ImprovementRecommendation[] = [];
    
    // Análise de padrões para gerar recomendações
    const issues = this.identifyCommonIssues(feedback);
    const opportunities = this.identifyImprovementOpportunities(feedback);
    
    // Priorizar recomendações por impacto e esforço
    const prioritizedRecommendations = this.prioritizeRecommendations([
      ...this.createIssueRecommendations(issues),
      ...this.createOpportunityRecommendations(opportunities)
    ]);
    
    return prioritizedRecommendations.slice(0, 10); // Top 10 recomendações
  }
  
  // ===== A/B TESTING =====
  
  public createABTest(config: ABTestConfiguration): void {
    // Validar configuração
    this.validateABTestConfig(config);
    
    // Configurar test
    config.status = 'draft';
    this.abTests.set(config.id, config);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_created', {
        event_category: 'medical_improvement',
        event_label: config.name,
        custom_parameters: {
          medical_context: 'continuous_improvement',
          test_id: config.id,
          variant_count: config.variants.length
        }
      });
    }
  }
  
  public startABTest(testId: string): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B Test not found: ${testId}`);
    }
    
    if (test.status !== 'draft') {
      throw new Error(`A/B Test must be in draft status to start: ${test.status}`);
    }
    
    test.status = 'running';
    test.duration.start = new Date();
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_started', {
        event_category: 'medical_improvement',
        event_label: test.name,
        custom_parameters: {
          medical_context: 'continuous_improvement',
          test_id: testId,
          duration: test.duration.end.getTime() - test.duration.start.getTime()
        }
      });
    }
  }
  
  public analyzeABTest(testId: string): ABTestResult | null {
    const test = this.abTests.get(testId);
    if (!test) return null;
    
    // Coletar dados dos variants
    const testFeedback = this.getABTestFeedback(testId);
    
    // Análise estatística
    const statistical = this.performStatisticalAnalysis(testFeedback, test.variants);
    
    // Resultados por variant
    const variantResults = this.analyzeVariantPerformance(testFeedback, test.variants);
    
    // Determinar winner
    const winner = this.determineWinner(variantResults);
    
    // Gerar insights
    const insights = this.generateABTestInsights(testFeedback, variantResults);
    
    return {
      testId,
      analyzedAt: new Date(),
      statistical,
      variantResults,
      winner,
      insights
    };
  }
  
  // ===== IMPLEMENTAÇÃO DE MELHORIAS =====
  
  public implementImprovement(recommendationId: string): void {
    const recommendation = this.improvements.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }
    
    // Criar plano de implementação
    const implementationPlan = this.createImplementationPlan(recommendation);
    
    // Setup monitoring para medir impacto
    this.setupImpactMonitoring(recommendation);
    
    // Log implementação
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'improvement_implemented', {
        event_category: 'medical_improvement',
        event_label: recommendation.title,
        custom_parameters: {
          medical_context: 'continuous_improvement',
          recommendation_id: recommendationId,
          priority: recommendation.priority,
          category: recommendation.category
        }
      });
    }
  }
  
  public measureImpact(recommendationId: string, timeframe: { start: Date; end: Date }): ImpactMeasurement | null {
    const recommendation = this.improvements.get(recommendationId);
    if (!recommendation) return null;
    
    const beforeData = this.getBaselineMetrics(recommendation, timeframe);
    const afterData = this.getCurrentMetrics(recommendation, timeframe);
    
    return {
      recommendation: recommendation.title,
      metrics: recommendation.successMetrics.map(metric => ({
        metric,
        baseline: beforeData[metric] || 0,
        current: afterData[metric] || 0,
        improvement: this.calculateImprovement(beforeData[metric], afterData[metric]),
        target: this.getTargetValue(metric, recommendation)
      }))
    };
  }
  
  // ===== FUNÇÕES AUXILIARES =====
  
  private analyzeBehavioralPatterns(interactions: InteractionEvent[]): BehavioralData {
    const totalTime = interactions.length > 0 
      ? interactions[interactions.length - 1].timestamp.getTime() - interactions[0].timestamp.getTime()
      : 0;
    
    return {
      timeSpent: totalTime / 1000, // segundos
      interactionCount: interactions.length,
      completionRate: this.calculateCompletionRate(interactions),
      retryCount: interactions.filter(i => i.type === 'error').length,
      helpRequestCount: interactions.filter(i => i.type === 'help_request').length,
      errorCount: interactions.filter(i => i.type === 'error').length
    };
  }
  
  private detectDevice(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
    }
    return 'desktop';
  }
  
  private inferUsabilityFromBehavior(behavioralData: BehavioralData): UsabilityRating {
    // Inferir ratings baseado em comportamento
    const baseRating = 3.5; // Neutro
    const timeAdjustment = behavioralData.timeSpent > 600 ? -0.5 : 0.2; // Muito tempo = confuso
    const errorAdjustment = behavioralData.errorCount * -0.3;
    const helpAdjustment = behavioralData.helpRequestCount * -0.2;
    
    const adjustedRating = Math.max(1, Math.min(5, 
      baseRating + timeAdjustment + errorAdjustment + helpAdjustment
    ));
    
    return {
      easeOfUse: adjustedRating,
      navigationClarity: adjustedRating,
      visualDesign: baseRating,
      responsiveness: baseRating,
      accessibility: baseRating,
      overallSatisfaction: adjustedRating
    };
  }
  
  private getDefaultContentRating(): ContentQualityRating {
    return {
      accuracy: 4.0,
      relevance: 4.0,
      clarity: 4.0,
      completeness: 4.0,
      upToDateness: 4.0,
      practicalValue: 4.0
    };
  }
  
  private inferLearningFromBehavior(behavioralData: BehavioralData): LearningEffectivenessRating {
    const completionBonus = behavioralData.completionRate > 0.8 ? 0.5 : 0;
    const engagementScore = Math.min(5, 3 + (behavioralData.interactionCount / 10));
    
    return {
      objectiveAlignment: 4.0,
      engagementLevel: engagementScore,
      difficultyAppropriate: behavioralData.retryCount > 3 ? 2.5 : 4.0,
      feedbackQuality: 4.0,
      knowledgeRetention: 3.5 + completionBonus,
      skillApplication: 4.0
    };
  }
  
  private sanitizeString(input: string): string {
    // Iterative sanitization to prevent bypass attacks (CWE-20/80/116 fix)
    let sanitized = input;
    let previous = '';
    let iterations = 0;
    const maxIterations = 10;

    do {
      previous = sanitized;
      // Remove script tags
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      // Remove isolated < and > characters
      sanitized = sanitized.replace(/<+|>+/g, '');
      // Remove dangerous protocols
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/vbscript:/gi, '');
      // Remove event handlers
      sanitized = sanitized.replace(/\bon[\w\-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>]*)/gi, '');
      iterations++;
    } while (sanitized !== previous && iterations < maxIterations);

    return sanitized.slice(0, 2000).trim();
  }
  
  private validateUsabilityRating(rating: UsabilityRating): UsabilityRating {
    return {
      easeOfUse: Math.max(1, Math.min(5, rating.easeOfUse)),
      navigationClarity: Math.max(1, Math.min(5, rating.navigationClarity)),
      visualDesign: Math.max(1, Math.min(5, rating.visualDesign)),
      responsiveness: Math.max(1, Math.min(5, rating.responsiveness)),
      accessibility: Math.max(1, Math.min(5, rating.accessibility)),
      overallSatisfaction: Math.max(1, Math.min(5, rating.overallSatisfaction))
    };
  }

  private validateContentQualityRating(rating: ContentQualityRating): ContentQualityRating {
    return {
      accuracy: Math.max(1, Math.min(5, rating.accuracy)),
      relevance: Math.max(1, Math.min(5, rating.relevance)),
      clarity: Math.max(1, Math.min(5, rating.clarity)),
      completeness: Math.max(1, Math.min(5, rating.completeness)),
      upToDateness: Math.max(1, Math.min(5, rating.upToDateness)),
      practicalValue: Math.max(1, Math.min(5, rating.practicalValue))
    };
  }

  private validateLearningEffectivenessRating(rating: LearningEffectivenessRating): LearningEffectivenessRating {
    return {
      objectiveAlignment: Math.max(1, Math.min(5, rating.objectiveAlignment)),
      engagementLevel: Math.max(1, Math.min(5, rating.engagementLevel)),
      difficultyAppropriate: Math.max(1, Math.min(5, rating.difficultyAppropriate)),
      feedbackQuality: Math.max(1, Math.min(5, rating.feedbackQuality)),
      knowledgeRetention: Math.max(1, Math.min(5, rating.knowledgeRetention)),
      skillApplication: Math.max(1, Math.min(5, rating.skillApplication))
    };
  }
  
  private calculateAverageRating(feedback: { usabilityRating: UsabilityRating; contentQuality: ContentQualityRating; learningEffectiveness: LearningEffectivenessRating; }): number {
    const allRatings = [
      ...Object.values(feedback.usabilityRating),
      ...Object.values(feedback.contentQuality),
      ...Object.values(feedback.learningEffectiveness)
    ].filter(val => typeof val === 'number');
    
    return allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length;
  }
  
  // ===== MÉTODOS DE ANÁLISE CORE (PR 2) =====

  /**
   * Filtra feedback por timeframe (start/end dates ou duration em ms)
   */
  private getRelevantFeedback(timeframe?: TimeframeFilter): ImprovementFeedbackData[] {
    if (!timeframe) {
      return this.feedbackData;
    }

    const now = Date.now();
    let startTime: number;
    let endTime: number;

    if (timeframe.start && timeframe.end) {
      startTime = timeframe.start.getTime();
      endTime = timeframe.end.getTime();
    } else if (timeframe.duration) {
      startTime = now - timeframe.duration;
      endTime = now;
    } else {
      return this.feedbackData;
    }

    return this.feedbackData.filter(feedback => {
      const feedbackTime = feedback.timestamp.getTime();
      return feedbackTime >= startTime && feedbackTime <= endTime;
    });
  }

  /**
   * Calcula médias reais para cada categoria de rating
   */
  private calculateAverageRatings(feedback: ImprovementFeedbackData[]): AverageRatings {
    if (feedback.length === 0) {
      return {
        usability: this.getDefaultUsabilityRating(),
        contentQuality: this.getDefaultContentRating(),
        learningEffectiveness: this.getDefaultLearningRating()
      };
    }

    // Acumular todos os ratings
    const usabilityAccum = { easeOfUse: 0, navigationClarity: 0, visualDesign: 0, responsiveness: 0, accessibility: 0, overallSatisfaction: 0 };
    const contentAccum = { accuracy: 0, relevance: 0, clarity: 0, completeness: 0, upToDateness: 0, practicalValue: 0 };
    const learningAccum = { objectiveAlignment: 0, engagementLevel: 0, difficultyAppropriate: 0, feedbackQuality: 0, knowledgeRetention: 0, skillApplication: 0 };

    feedback.forEach(f => {
      // Usability
      usabilityAccum.easeOfUse += f.feedback.usabilityRating.easeOfUse;
      usabilityAccum.navigationClarity += f.feedback.usabilityRating.navigationClarity;
      usabilityAccum.visualDesign += f.feedback.usabilityRating.visualDesign;
      usabilityAccum.responsiveness += f.feedback.usabilityRating.responsiveness;
      usabilityAccum.accessibility += f.feedback.usabilityRating.accessibility;
      usabilityAccum.overallSatisfaction += f.feedback.usabilityRating.overallSatisfaction;

      // Content Quality
      contentAccum.accuracy += f.feedback.contentQuality.accuracy;
      contentAccum.relevance += f.feedback.contentQuality.relevance;
      contentAccum.clarity += f.feedback.contentQuality.clarity;
      contentAccum.completeness += f.feedback.contentQuality.completeness;
      contentAccum.upToDateness += f.feedback.contentQuality.upToDateness;
      contentAccum.practicalValue += f.feedback.contentQuality.practicalValue;

      // Learning Effectiveness
      learningAccum.objectiveAlignment += f.feedback.learningEffectiveness.objectiveAlignment;
      learningAccum.engagementLevel += f.feedback.learningEffectiveness.engagementLevel;
      learningAccum.difficultyAppropriate += f.feedback.learningEffectiveness.difficultyAppropriate;
      learningAccum.feedbackQuality += f.feedback.learningEffectiveness.feedbackQuality;
      learningAccum.knowledgeRetention += f.feedback.learningEffectiveness.knowledgeRetention;
      learningAccum.skillApplication += f.feedback.learningEffectiveness.skillApplication;
    });

    const count = feedback.length;

    return {
      usability: {
        easeOfUse: usabilityAccum.easeOfUse / count,
        navigationClarity: usabilityAccum.navigationClarity / count,
        visualDesign: usabilityAccum.visualDesign / count,
        responsiveness: usabilityAccum.responsiveness / count,
        accessibility: usabilityAccum.accessibility / count,
        overallSatisfaction: usabilityAccum.overallSatisfaction / count
      },
      contentQuality: {
        accuracy: contentAccum.accuracy / count,
        relevance: contentAccum.relevance / count,
        clarity: contentAccum.clarity / count,
        completeness: contentAccum.completeness / count,
        upToDateness: contentAccum.upToDateness / count,
        practicalValue: contentAccum.practicalValue / count
      },
      learningEffectiveness: {
        objectiveAlignment: learningAccum.objectiveAlignment / count,
        engagementLevel: learningAccum.engagementLevel / count,
        difficultyAppropriate: learningAccum.difficultyAppropriate / count,
        feedbackQuality: learningAccum.feedbackQuality / count,
        knowledgeRetention: learningAccum.knowledgeRetention / count,
        skillApplication: learningAccum.skillApplication / count
      }
    };
  }

  private getDefaultUsabilityRating(): UsabilityRating {
    return { easeOfUse: 0, navigationClarity: 0, visualDesign: 0, responsiveness: 0, accessibility: 0, overallSatisfaction: 0 };
  }

  private getDefaultLearningRating(): LearningEffectivenessRating {
    return { objectiveAlignment: 0, engagementLevel: 0, difficultyAppropriate: 0, feedbackQuality: 0, knowledgeRetention: 0, skillApplication: 0 };
  }

  /**
   * Analisa tendências temporais comparando períodos
   */
  private analyzeTrends(feedback: ImprovementFeedbackData[]): TrendAnalysis[] {
    if (feedback.length < 2) {
      return [];
    }

    const trends: TrendAnalysis[] = [];

    // Ordenar por timestamp
    const sorted = [...feedback].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Dividir em duas metades para comparação
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return [];
    }

    // Calcular médias para cada período
    const firstRatings = this.calculateAverageRatings(firstHalf);
    const secondRatings = this.calculateAverageRatings(secondHalf);

    // Analisar tendências por componente/métrica
    const components = new Set(feedback.map(f => f.context.componentType));

    components.forEach(component => {
      const componentFeedback = feedback.filter(f => f.context.componentType === component);
      const compMid = Math.floor(componentFeedback.length / 2);
      const compFirst = componentFeedback.slice(0, compMid);
      const compSecond = componentFeedback.slice(compMid);

      if (compFirst.length > 0 && compSecond.length > 0) {
        const firstAvg = this.calculateOverallAverage(compFirst);
        const secondAvg = this.calculateOverallAverage(compSecond);
        const changeRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

        trends.push({
          component,
          metric: 'overall_satisfaction',
          trend: changeRate > 5 ? 'improving' : changeRate < -5 ? 'declining' : 'stable',
          changeRate: Math.round(changeRate * 100) / 100,
          significance: Math.abs(changeRate) > 10 ? 0.95 : Math.abs(changeRate) > 5 ? 0.8 : 0.5
        });
      }
    });

    // Tendência geral de usabilidade
    const usabilityChange = this.calculateMetricChange(
      firstRatings.usability.overallSatisfaction,
      secondRatings.usability.overallSatisfaction
    );

    trends.push({
      component: 'global',
      metric: 'usability',
      trend: usabilityChange > 5 ? 'improving' : usabilityChange < -5 ? 'declining' : 'stable',
      changeRate: usabilityChange,
      significance: Math.abs(usabilityChange) > 10 ? 0.95 : 0.7
    });

    // Tendência de qualidade de conteúdo
    const contentChange = this.calculateMetricChange(
      (firstRatings.contentQuality.accuracy + firstRatings.contentQuality.clarity) / 2,
      (secondRatings.contentQuality.accuracy + secondRatings.contentQuality.clarity) / 2
    );

    trends.push({
      component: 'global',
      metric: 'content_quality',
      trend: contentChange > 5 ? 'improving' : contentChange < -5 ? 'declining' : 'stable',
      changeRate: contentChange,
      significance: Math.abs(contentChange) > 10 ? 0.95 : 0.7
    });

    return trends;
  }

  private calculateOverallAverage(feedback: ImprovementFeedbackData[]): number {
    if (feedback.length === 0) return 0;
    return feedback.reduce((sum, f) => sum + this.calculateAverageRating(f.feedback), 0) / feedback.length;
  }

  private calculateMetricChange(before: number, after: number): number {
    if (before === 0) return 0;
    return Math.round(((after - before) / before) * 100 * 100) / 100;
  }

  /**
   * Segmenta feedback por device, userType e persona
   */
  private analyzeSegments(feedback: ImprovementFeedbackData[]): SegmentAnalysis[] {
    if (feedback.length === 0) {
      return [];
    }

    const segments: SegmentAnalysis[] = [];

    // Segmentar por device
    const deviceGroups = this.groupBy(feedback, f => f.context.device);
    Object.entries(deviceGroups).forEach(([device, items]) => {
      const avgRating = this.calculateOverallAverage(items);
      segments.push({
        segment: `device_${device}`,
        sampleSize: items.length,
        averageRating: Math.round(avgRating * 100) / 100,
        keyInsights: this.generateSegmentInsights(items, device, 'device')
      });
    });

    // Segmentar por userType
    const userTypeGroups = this.groupBy(feedback, f => f.context.userType);
    Object.entries(userTypeGroups).forEach(([userType, items]) => {
      const avgRating = this.calculateOverallAverage(items);
      segments.push({
        segment: `userType_${userType}`,
        sampleSize: items.length,
        averageRating: Math.round(avgRating * 100) / 100,
        keyInsights: this.generateSegmentInsights(items, userType, 'userType')
      });
    });

    // Segmentar por persona
    const personaGroups = this.groupBy(feedback, f => f.context.persona);
    Object.entries(personaGroups).forEach(([persona, items]) => {
      const avgRating = this.calculateOverallAverage(items);
      segments.push({
        segment: `persona_${persona}`,
        sampleSize: items.length,
        averageRating: Math.round(avgRating * 100) / 100,
        keyInsights: this.generateSegmentInsights(items, persona, 'persona')
      });
    });

    // Segmentar por componentType
    const componentGroups = this.groupBy(feedback, f => f.context.componentType);
    Object.entries(componentGroups).forEach(([component, items]) => {
      const avgRating = this.calculateOverallAverage(items);
      segments.push({
        segment: `component_${component}`,
        sampleSize: items.length,
        averageRating: Math.round(avgRating * 100) / 100,
        keyInsights: this.generateSegmentInsights(items, component, 'component')
      });
    });

    return segments.sort((a, b) => b.sampleSize - a.sampleSize);
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private generateSegmentInsights(items: ImprovementFeedbackData[], segmentValue: string, segmentType: string): string[] {
    const insights: string[] = [];
    const avgRating = this.calculateOverallAverage(items);

    if (avgRating >= 4.0) {
      insights.push(`${segmentType} ${segmentValue}: alta satisfação (${avgRating.toFixed(1)})`);
    } else if (avgRating < 3.0) {
      insights.push(`${segmentType} ${segmentValue}: necessita atenção (${avgRating.toFixed(1)})`);
    }

    // Verificar issues técnicos
    const issueCount = items.reduce((count, f) => count + f.feedback.technicalIssues.length, 0);
    if (issueCount > 0) {
      insights.push(`${issueCount} issues técnicos reportados`);
    }

    // Verificar taxa de completion
    const avgCompletion = items.reduce((sum, f) => sum + f.behavioralData.completionRate, 0) / items.length;
    if (avgCompletion < 0.5) {
      insights.push(`Baixa taxa de conclusão: ${(avgCompletion * 100).toFixed(0)}%`);
    } else if (avgCompletion > 0.9) {
      insights.push(`Alta taxa de conclusão: ${(avgCompletion * 100).toFixed(0)}%`);
    }

    return insights;
  }

  // ===== MÉTODOS DE ANÁLISE QUALITATIVA (PR 3) =====

  /**
   * Extrai temas comuns do feedback textual usando análise de palavras-chave
   */
  private extractCommonThemes(textFeedback: string[]): ThemeAnalysis[] {
    if (textFeedback.length === 0) {
      return [];
    }

    // Palavras-chave por tema (contexto médico/educacional)
    const themeKeywords: Record<string, { keywords: string[]; sentiment: 'positive' | 'negative' | 'neutral' }> = {
      'usabilidade': { keywords: ['fácil', 'difícil', 'confuso', 'intuitivo', 'navegação', 'menu', 'botão'], sentiment: 'neutral' },
      'conteudo_medico': { keywords: ['dosagem', 'medicamento', 'pqt-u', 'hanseníase', 'tratamento', 'clofazimina', 'rifampicina', 'dapsona'], sentiment: 'neutral' },
      'aprendizado': { keywords: ['aprendi', 'entendi', 'compreendi', 'claro', 'explicação', 'dúvida', 'confuso'], sentiment: 'neutral' },
      'performance': { keywords: ['lento', 'rápido', 'travou', 'carregando', 'demora', 'velocidade'], sentiment: 'neutral' },
      'acessibilidade': { keywords: ['fonte', 'tamanho', 'contraste', 'cor', 'legível', 'acessível'], sentiment: 'neutral' },
      'satisfacao_positiva': { keywords: ['excelente', 'ótimo', 'muito bom', 'adorei', 'parabéns', 'útil', 'ajudou'], sentiment: 'positive' },
      'satisfacao_negativa': { keywords: ['ruim', 'péssimo', 'horrível', 'não funciona', 'erro', 'problema', 'bug'], sentiment: 'negative' },
      'sugestao': { keywords: ['sugiro', 'poderia', 'seria bom', 'falta', 'gostaria', 'melhorar'], sentiment: 'neutral' }
    };

    const themes: ThemeAnalysis[] = [];
    const allText = textFeedback.join(' ').toLowerCase();

    Object.entries(themeKeywords).forEach(([theme, config]) => {
      const matchingKeywords = config.keywords.filter(kw => allText.includes(kw.toLowerCase()));
      const frequency = matchingKeywords.length;

      if (frequency > 0) {
        // Encontrar exemplos de texto que contêm as palavras-chave
        const examples = textFeedback
          .filter(text => matchingKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase())))
          .slice(0, 3);

        themes.push({
          theme,
          frequency,
          sentiment: config.sentiment,
          examples,
          relatedComponents: this.inferComponentsFromTheme(theme)
        });
      }
    });

    return themes.sort((a, b) => b.frequency - a.frequency);
  }

  private inferComponentsFromTheme(theme: string): string[] {
    const themeComponentMap: Record<string, string[]> = {
      'usabilidade': ['navigation', 'clinical_case', 'dose_calculator'],
      'conteudo_medico': ['clinical_case', 'dose_calculator', 'timeline'],
      'aprendizado': ['clinical_case', 'certification', 'timeline'],
      'performance': ['clinical_case', 'dose_calculator'],
      'acessibilidade': ['navigation', 'clinical_case', 'checklist'],
      'satisfacao_positiva': [],
      'satisfacao_negativa': [],
      'sugestao': []
    };
    return themeComponentMap[theme] || [];
  }

  /**
   * Analisa sentimento do feedback textual usando palavras-chave
   */
  private analyzeSentiment(textFeedback: string[]): SentimentAnalysis {
    if (textFeedback.length === 0) {
      return {
        overall: 0,
        byComponent: new Map(),
        byUserType: new Map(),
        keyPositives: [],
        keyNegatives: []
      };
    }

    const positiveWords = ['excelente', 'ótimo', 'bom', 'útil', 'ajudou', 'claro', 'fácil', 'adorei', 'parabéns', 'funciona', 'entendi', 'aprendi'];
    const negativeWords = ['ruim', 'péssimo', 'difícil', 'confuso', 'erro', 'bug', 'lento', 'travou', 'problema', 'não funciona', 'horrível'];

    let positiveCount = 0;
    let negativeCount = 0;
    const keyPositives: string[] = [];
    const keyNegatives: string[] = [];

    textFeedback.forEach(text => {
      const lowerText = text.toLowerCase();
      const hasPositive = positiveWords.some(w => lowerText.includes(w));
      const hasNegative = negativeWords.some(w => lowerText.includes(w));

      if (hasPositive && !hasNegative) {
        positiveCount++;
        if (keyPositives.length < 5) keyPositives.push(text.slice(0, 100));
      } else if (hasNegative && !hasPositive) {
        negativeCount++;
        if (keyNegatives.length < 5) keyNegatives.push(text.slice(0, 100));
      }
    });

    const total = textFeedback.length;
    const overall = total > 0 ? (positiveCount - negativeCount) / total : 0;

    return {
      overall: Math.max(-1, Math.min(1, overall)),
      byComponent: new Map(), // Seria populado com dados contextuais
      byUserType: new Map(),
      keyPositives,
      keyNegatives
    };
  }

  /**
   * Identifica issues prioritários baseado em severidade e frequência
   */
  private identifyPriorityIssues(feedback: ImprovementFeedbackData[]): PriorityIssue[] {
    if (feedback.length === 0) {
      return [];
    }

    const issueMap = new Map<string, {
      count: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reports: string[];
      components: Set<string>;
    }>();

    // Coletar todas as issues técnicas
    feedback.forEach(f => {
      f.feedback.technicalIssues.forEach(issue => {
        const key = `${issue.type}_${issue.description.slice(0, 50)}`;
        const existing = issueMap.get(key);

        if (existing) {
          existing.count++;
          existing.reports.push(issue.description);
          existing.components.add(f.context.componentType);
          // Atualizar severidade se encontrar uma mais alta
          if (this.severityRank(issue.severity) > this.severityRank(existing.severity)) {
            existing.severity = issue.severity;
          }
        } else {
          issueMap.set(key, {
            count: 1,
            severity: issue.severity,
            reports: [issue.description],
            components: new Set([f.context.componentType])
          });
        }
      });
    });

    // Converter para PriorityIssue
    const issues: PriorityIssue[] = [];
    let issueId = 1;

    issueMap.forEach((data, key) => {
      const [type] = key.split('_');

      issues.push({
        id: `issue_${issueId++}`,
        title: data.reports[0].slice(0, 80),
        category: this.mapIssueToPriorityCategory(type as TechnicalIssue['type']),
        severity: data.severity,
        impact: {
          usersSffected: data.count,
          functionalityImpact: data.severity === 'critical' ? 'high' : data.severity === 'high' ? 'medium' : 'low',
          learningImpact: data.components.has('clinical_case') || data.components.has('certification') ? 'high' : 'medium',
          businessImpact: data.severity === 'critical' ? 'high' : 'medium'
        },
        evidence: {
          feedbackCount: data.count,
          reproductionRate: data.count / feedback.length,
          userReports: data.reports.slice(0, 5),
          analyticsData: { sessionDuration: 0, clickCount: 0, scrollDepth: 0, errorRate: data.count / feedback.length, conversionRate: 0 }
        },
        suggestedSolution: this.suggestSolution(type as TechnicalIssue['type'], data.severity),
        estimatedEffort: data.severity === 'critical' ? 'large' : data.severity === 'high' ? 'medium' : 'small',
        expectedBenefit: `Redução de ${data.count} reports de ${type}`
      });
    });

    // Ordenar por severidade e frequência
    return issues.sort((a, b) => {
      const severityDiff = this.severityRank(b.severity) - this.severityRank(a.severity);
      return severityDiff !== 0 ? severityDiff : b.impact.usersSffected - a.impact.usersSffected;
    });
  }

  private severityRank(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
  }

  private mapIssueToPriorityCategory(type: TechnicalIssue['type']): PriorityIssue['category'] {
    const map: Record<TechnicalIssue['type'], PriorityIssue['category']> = {
      'performance': 'performance_issue',
      'bug': 'critical_bug',
      'compatibility': 'usability_issue',
      'accessibility': 'usability_issue'
    };
    return map[type] || 'usability_issue';
  }

  private suggestSolution(type: TechnicalIssue['type'], severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const solutions: Record<string, string> = {
      'performance_critical': 'Otimização urgente de performance com profiling e lazy loading',
      'performance_high': 'Implementar cache e otimizar queries',
      'bug_critical': 'Hotfix imediato com rollback se necessário',
      'bug_high': 'Correção prioritária no próximo sprint',
      'compatibility_high': 'Adicionar polyfills e testes cross-browser',
      'accessibility_high': 'Auditoria WCAG e correção de barreiras'
    };
    return solutions[`${type}_${severity}`] || 'Investigar e documentar para correção futura';
  }

  /**
   * Analisa jornadas de usuário por estágio
   */
  private analyzeUserJourneys(feedback: ImprovementFeedbackData[]): UserJourneyInsight[] {
    if (feedback.length === 0) {
      return [];
    }

    const insights: UserJourneyInsight[] = [];
    const stages: UserJourneyInsight['journeyStage'][] = ['onboarding', 'exploration', 'engagement', 'mastery', 'certification'];

    // Inferir estágio baseado em comportamento e componentes
    const stageGroups = this.groupBy(feedback, f => this.inferJourneyStage(f));

    stages.forEach(stage => {
      const stageFeedback = stageGroups[stage] || [];
      if (stageFeedback.length === 0) return;

      const avgRating = this.calculateOverallAverage(stageFeedback);
      const avgCompletion = stageFeedback.reduce((sum, f) => sum + f.behavioralData.completionRate, 0) / stageFeedback.length;
      const helpRequests = stageFeedback.reduce((sum, f) => sum + f.behavioralData.helpRequestCount, 0);

      let insight = '';
      let impactOnLearning: 'positive' | 'negative' | 'neutral' = 'neutral';
      const recommendedActions: string[] = [];

      if (avgRating >= 4.0 && avgCompletion >= 0.8) {
        insight = `Estágio ${stage}: alta satisfação e conclusão`;
        impactOnLearning = 'positive';
        recommendedActions.push('Manter abordagem atual', 'Considerar como referência para outros estágios');
      } else if (avgRating < 3.0 || avgCompletion < 0.5) {
        insight = `Estágio ${stage}: necessita atenção imediata`;
        impactOnLearning = 'negative';
        recommendedActions.push('Revisar conteúdo e UX', 'Adicionar mais orientação', 'Simplificar fluxo');
      } else {
        insight = `Estágio ${stage}: performance moderada`;
        recommendedActions.push('Monitorar métricas', 'Coletar feedback específico');
      }

      if (helpRequests > stageFeedback.length * 2) {
        recommendedActions.push('Melhorar documentação e dicas contextuais');
      }

      insights.push({
        journeyStage: stage,
        insight,
        dataPoints: [
          `Rating médio: ${avgRating.toFixed(1)}`,
          `Taxa de conclusão: ${(avgCompletion * 100).toFixed(0)}%`,
          `Pedidos de ajuda: ${helpRequests}`
        ],
        impactOnLearning,
        recommendedActions
      });
    });

    return insights;
  }

  private inferJourneyStage(feedback: ImprovementFeedbackData): UserJourneyInsight['journeyStage'] {
    const { componentType } = feedback.context;
    const { completionRate, interactionCount } = feedback.behavioralData;

    if (componentType === 'certification') return 'certification';
    if (componentType === 'checklist' && completionRate > 0.8) return 'mastery';
    if (interactionCount > 20 && completionRate > 0.6) return 'engagement';
    if (interactionCount > 5) return 'exploration';
    return 'onboarding';
  }

  /**
   * Calcula métricas de impacto
   */
  private calculateImpactMetrics(feedback: ImprovementFeedbackData[]): ImpactMetrics {
    if (feedback.length === 0) {
      return {
        userSatisfactionTrend: [],
        performanceImprovements: [],
        learningOutcomeImprovements: [],
        adoptionRates: []
      };
    }

    // Calcular tendência de satisfação (últimos 7 períodos)
    const sorted = [...feedback].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const periodSize = Math.ceil(sorted.length / 7);
    const userSatisfactionTrend: number[] = [];

    for (let i = 0; i < 7 && i * periodSize < sorted.length; i++) {
      const periodFeedback = sorted.slice(i * periodSize, (i + 1) * periodSize);
      if (periodFeedback.length > 0) {
        userSatisfactionTrend.push(this.calculateOverallAverage(periodFeedback));
      }
    }

    // Calcular taxas de adoção por feature
    const componentGroups = this.groupBy(feedback, f => f.context.componentType);
    const adoptionRates: AdoptionMetric[] = Object.entries(componentGroups).map(([feature, items]) => ({
      feature,
      adoptionRate: items.length / feedback.length,
      retentionRate: items.filter(f => f.behavioralData.completionRate > 0.5).length / items.length,
      satisfactionScore: this.calculateOverallAverage(items)
    }));

    return {
      userSatisfactionTrend,
      performanceImprovements: [],
      learningOutcomeImprovements: [],
      adoptionRates
    };
  }

  /**
   * Identifica issues comuns agrupados por tipo
   */
  private identifyCommonIssues(feedback: ImprovementFeedbackData[]): IssueList[] {
    const issueGroups = new Map<string, { count: number; severity: 'low' | 'medium' | 'high' | 'critical' }>();

    feedback.forEach(f => {
      f.feedback.technicalIssues.forEach(issue => {
        const key = issue.type;
        const existing = issueGroups.get(key);
        if (existing) {
          existing.count++;
          if (this.severityRank(issue.severity) > this.severityRank(existing.severity)) {
            existing.severity = issue.severity;
          }
        } else {
          issueGroups.set(key, { count: 1, severity: issue.severity });
        }
      });
    });

    return Array.from(issueGroups.entries()).map(([type, data], index) => ({
      id: `issue_${index + 1}`,
      severity: data.severity,
      description: `${data.count} ocorrências de ${type}`,
      frequency: data.count
    }));
  }

  /**
   * Identifica oportunidades de melhoria baseado em ratings baixos
   */
  private identifyImprovementOpportunities(feedback: ImprovementFeedbackData[]): OpportunityList[] {
    const opportunities: OpportunityList[] = [];
    const avgRatings = this.calculateAverageRatings(feedback);

    // Verificar métricas de usabilidade
    if (avgRatings.usability.easeOfUse < 3.5) {
      opportunities.push({
        id: 'opp_ease_of_use',
        impact: avgRatings.usability.easeOfUse < 2.5 ? 'high' : 'medium',
        description: 'Melhorar facilidade de uso da interface',
        effort: 'medium'
      });
    }

    if (avgRatings.usability.accessibility < 3.5) {
      opportunities.push({
        id: 'opp_accessibility',
        impact: 'high',
        description: 'Aprimorar acessibilidade (WCAG compliance)',
        effort: 'medium'
      });
    }

    // Verificar métricas de conteúdo
    if (avgRatings.contentQuality.clarity < 3.5) {
      opportunities.push({
        id: 'opp_content_clarity',
        impact: 'high',
        description: 'Melhorar clareza do conteúdo educacional',
        effort: 'medium'
      });
    }

    // Verificar métricas de aprendizado
    if (avgRatings.learningEffectiveness.engagementLevel < 3.5) {
      opportunities.push({
        id: 'opp_engagement',
        impact: 'medium',
        description: 'Aumentar engajamento com elementos interativos',
        effort: 'large'
      });
    }

    return opportunities;
  }

  /**
   * Prioriza recomendações por impacto/esforço
   */
  private prioritizeRecommendations(recommendations: ImprovementRecommendation[]): ImprovementRecommendation[] {
    const priorityScore = (r: ImprovementRecommendation): number => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }[r.priority];
      const complexityPenalty = { simple: 0, moderate: 1, complex: 2 }[r.implementation.complexity];
      const impactBonus = r.expectedOutcomes.userSatisfactionImprovement / 10;
      return priorityWeight + impactBonus - complexityPenalty;
    };

    return [...recommendations].sort((a, b) => priorityScore(b) - priorityScore(a));
  }

  /**
   * Cria recomendações a partir de issues
   */
  private createIssueRecommendations(issues: IssueList[]): ImprovementRecommendation[] {
    return issues.slice(0, 5).map((issue, index) => ({
      id: `rec_issue_${index + 1}`,
      category: 'usability' as const,
      priority: issue.severity === 'critical' ? 'urgent' as const : issue.severity === 'high' ? 'high' as const : 'medium' as const,
      title: `Resolver ${issue.description}`,
      description: `Correção necessária para ${issue.frequency} ocorrências reportadas`,
      rationale: `Issue com severidade ${issue.severity} afetando usuários`,
      implementation: {
        complexity: issue.severity === 'critical' ? 'complex' as const : 'moderate' as const,
        estimatedEffort: issue.severity === 'critical' ? '2-3 semanas' : '1-2 semanas',
        requiredSkills: ['frontend', 'debugging'],
        dependencies: [],
        risks: ['Pode requerer refatoração significativa']
      },
      expectedOutcomes: {
        userSatisfactionImprovement: issue.severity === 'critical' ? 20 : 10,
        performanceImpact: 'Redução de erros',
        learningEffectivenessImpact: 'Melhoria na experiência',
        maintenanceImpact: 'Redução de tickets de suporte'
      },
      successMetrics: [`Reduzir ocorrências de ${issue.description} em 80%`],
      timeline: issue.severity === 'critical' ? 'Imediato' : 'Próximo sprint'
    }));
  }

  /**
   * Cria recomendações a partir de oportunidades
   */
  private createOpportunityRecommendations(opportunities: OpportunityList[]): ImprovementRecommendation[] {
    return opportunities.slice(0, 5).map((opp, index) => ({
      id: `rec_opp_${index + 1}`,
      category: 'usability' as const,
      priority: opp.impact === 'high' ? 'high' as const : 'medium' as const,
      title: opp.description,
      description: `Oportunidade de melhoria identificada através de análise de feedback`,
      rationale: `Impacto ${opp.impact} com esforço ${opp.effort}`,
      implementation: {
        complexity: opp.effort === 'large' ? 'complex' as const : opp.effort === 'medium' ? 'moderate' as const : 'simple' as const,
        estimatedEffort: opp.effort === 'large' ? '3-4 semanas' : opp.effort === 'medium' ? '1-2 semanas' : '3-5 dias',
        requiredSkills: ['frontend', 'ux'],
        dependencies: [],
        risks: []
      },
      expectedOutcomes: {
        userSatisfactionImprovement: opp.impact === 'high' ? 15 : 8,
        performanceImpact: 'Melhoria na usabilidade',
        learningEffectivenessImpact: 'Aumento no engajamento',
        maintenanceImpact: 'Neutro'
      },
      successMetrics: ['Aumento de 10% na satisfação do usuário'],
      timeline: opp.effort === 'large' ? '2-3 sprints' : 'Próximo sprint'
    }));
  }

  /**
   * Dispara alerta para issues críticos via GA4
   */
  private triggerCriticalIssueAlert(issues: TechnicalIssue[], feedback: ImprovementFeedbackData): void {
    if (issues.length === 0) return;

    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag;
      issues.forEach(issue => {
        gtag('event', 'critical_issue_alert', {
          event_category: 'medical_improvement',
          event_label: issue.type,
          custom_parameters: {
            medical_context: 'critical_feedback',
            severity: issue.severity,
            component: feedback.context.componentType,
            user_type: feedback.context.userType,
            description: issue.description.slice(0, 100)
          }
        });
      });
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CIS] Critical issues detected:', issues.map(i => `${i.severity}: ${i.description}`));
    }
  }

  /**
   * Marca feedback negativo para análise posterior
   */
  private flagNegativeFeedback(feedback: ImprovementFeedbackData): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'negative_feedback_flagged', {
        event_category: 'medical_improvement',
        event_label: feedback.context.componentType,
        custom_parameters: {
          medical_context: 'negative_feedback',
          component: feedback.context.componentType,
          user_type: feedback.context.userType,
          persona: feedback.context.persona,
          device: feedback.context.device
        }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[CIS] Negative feedback flagged:', {
        component: feedback.context.componentType,
        rating: this.calculateAverageRating(feedback.feedback)
      });
    }
  }

  /**
   * Dispara análise incremental (throttled)
   */
  private triggerIncrementalAnalysis(): void {
    // Throttle: só executar a cada 10 feedbacks ou 5 minutos
    const now = Date.now();
    const lastAnalysis = (this as unknown as { _lastIncrementalAnalysis?: number })._lastIncrementalAnalysis || 0;
    const feedbackCount = this.feedbackData.length;

    if (now - lastAnalysis < 300000 && feedbackCount % 10 !== 0) {
      return;
    }

    (this as unknown as { _lastIncrementalAnalysis: number })._lastIncrementalAnalysis = now;

    // Executar análise leve em background
    if (typeof window !== 'undefined' && window.gtag) {
      const summary = this.getFeedbackSummary();
      window.gtag('event', 'incremental_analysis', {
        event_category: 'medical_improvement',
        event_label: 'background_analysis',
        custom_parameters: {
          medical_context: 'incremental_analysis',
          total_feedbacks: summary.totalFeedbacks,
          avg_rating: summary.averageRating.toFixed(2),
          critical_issues: summary.criticalIssues
        }
      });
    }
  }

  /**
   * Calcula taxa real de conclusão baseada em interações
   * Considera: completions, errors, help_requests para determinar sucesso
   */
  private calculateCompletionRate(interactions: InteractionEvent[]): number {
    if (interactions.length === 0) {
      return 0;
    }

    // Contar tipos de interações
    const completions = interactions.filter(i => i.type === 'completion').length;
    const errors = interactions.filter(i => i.type === 'error').length;
    const helpRequests = interactions.filter(i => i.type === 'help_request').length;
    const navigations = interactions.filter(i => i.type === 'navigation').length;
    const clicks = interactions.filter(i => i.type === 'click').length;

    // Se não há completions registradas, estimar baseado em comportamento
    if (completions === 0) {
      // Calcular score baseado em engajamento sem erros críticos
      const totalInteractions = interactions.length;
      const negativeWeight = (errors * 0.3) + (helpRequests * 0.1);
      const positiveWeight = (clicks * 0.1) + (navigations * 0.05);

      // Base estimada de 50%, ajustada por comportamento
      const estimatedRate = Math.max(0, Math.min(1,
        0.5 + (positiveWeight / totalInteractions) - (negativeWeight / totalInteractions)
      ));

      return Math.round(estimatedRate * 100) / 100;
    }

    // Se há completions, calcular taxa real
    // Considerar que múltiplas tentativas (errors) reduzem a taxa efetiva
    const attemptPenalty = Math.min(0.3, errors * 0.05); // Max 30% penalty
    const helpPenalty = Math.min(0.1, helpRequests * 0.02); // Max 10% penalty

    // Taxa base: completions sobre total de sessões únicas estimadas
    // Assumindo que cada completion representa uma sessão bem-sucedida
    const uniqueSessions = Math.max(completions, Math.ceil(interactions.length / 10));
    const baseRate = completions / uniqueSessions;

    // Aplicar penalidades
    const adjustedRate = Math.max(0, baseRate - attemptPenalty - helpPenalty);

    return Math.round(adjustedRate * 100) / 100;
  }
  
  // A/B Testing methods (simplified)
  private validateABTestConfig(config: ABTestConfiguration): void {}
  private getABTestFeedback(testId: string): ABTestFeedback[] { return []; }
  private performStatisticalAnalysis(feedback: ABTestFeedback[], variants: ABTestVariant[]): StatisticalAnalysis { return { totalSessions: 0, conversionRates: new Map(), confidenceLevel: 0, pValue: 0, statisticalSignificance: false }; }
  private analyzeVariantPerformance(feedback: ABTestFeedback[], variants: ABTestVariant[]): VariantResult[] {
    return [];
  }
  private determineWinner(variantResults: VariantResult[]): TestWinner { return { variantId: '', confidenceLevel: 0, improvementPercentage: 0, significantMetrics: [] }; }
  private generateABTestInsights(feedback: ABTestFeedback[], results: VariantResult[]): TestInsights { return { keyFindings: [], unexpectedResults: [], segmentDifferences: [], recommendations: [] }; }
  
  // Implementation methods (simplified)
  private createImplementationPlan(recommendation: ImprovementRecommendation): ImplementationPlan { return { phases: [], timeline: '', resources: [], risks: [], successCriteria: [] }; }
  private setupImpactMonitoring(recommendation: ImprovementRecommendation): void {}
  private getBaselineMetrics(recommendation: ImprovementRecommendation, timeframe: TimeframeFilter): BaselineMetrics { return {}; }
  private getCurrentMetrics(recommendation: ImprovementRecommendation, timeframe: TimeframeFilter): BaselineMetrics { return {}; }
  private calculateImprovement(baseline: number, current: number): number { 
    return baseline ? ((current - baseline) / baseline) * 100 : 0; 
  }
  private getTargetValue(metric: string, recommendation: ImprovementRecommendation): number { return 0; }
  
  // ===== API PÚBLICA =====
  
  public getFeedbackSummary(): FeedbackSummary {
    return {
      totalFeedbacks: this.feedbackData.length,
      averageRating: this.feedbackData.length > 0 
        ? this.feedbackData.reduce((sum, f) => sum + this.calculateAverageRating(f.feedback), 0) / this.feedbackData.length
        : 0,
      lastUpdated: new Date(),
      criticalIssues: this.feedbackData.filter(f => 
        f.feedback.technicalIssues.some(issue => issue.severity === 'critical')
      ).length
    };
  }
  
  public getTopRecommendations(limit: number = 5): ImprovementRecommendation[] {
    return Array.from(this.improvements.values())
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, limit);
  }
  
  public getActiveABTests(): ABTestConfiguration[] {
    return Array.from(this.abTests.values())
      .filter(test => test.status === 'running');
  }
}

export default ContinuousImprovementSystem;