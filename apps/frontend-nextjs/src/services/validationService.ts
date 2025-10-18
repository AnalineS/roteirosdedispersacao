/**
 * Validation Service
 * Cliente para API de validação educacional
 *
 * @author Claude Code QA Specialist
 * @version 1.0.0
 */

interface DetailedValidationResult {
  validation_id: string;
  test_name: string;
  passed: boolean;
  score: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  details: Record<string, unknown>;
  recommendations: string[];
  timestamp: string;
}

interface MistakePattern {
  pattern: string;
  frequency: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
  category: string;
}

interface ValidationRequest {
  response: string;
  persona: "dr_gasnelio" | "ga";
  user_question: string;
  context?: Record<string, unknown>;
  store_result?: boolean;
}

interface ValidationResult {
  validation_id: string;
  validation_result: {
    test_name: string;
    passed: boolean;
    score: number;
    severity: "critical" | "high" | "medium" | "low" | "info";
    details: Record<string, unknown>;
    recommendations: string[];
    timestamp: string;
  };
  metadata: {
    persona: string;
    validation_time_ms: number;
    framework_version: string;
  };
}

interface ValidationMetrics {
  total_validations: number;
  avg_quality_score: number;
  min_quality_score: number;
  max_quality_score: number;
  avg_validation_time: number;
  pass_rate: number;
  completion_rate: number;
  knowledge_retention: number;
  user_satisfaction: number;
  persona_consistency: number;
  persona_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  period: string;
  timestamp: string;
}

interface BatchValidationRequest {
  responses: ValidationRequest[];
}

interface BatchValidationResult {
  batch_id: string;
  batch_report: {
    summary: {
      total_responses_validated: number;
      validation_timestamp: string;
      overall_quality_score: number;
      critical_issues_found: number;
    };
    detailed_results: DetailedValidationResult[];
    recommendations: string[];
  };
  metadata: {
    total_responses: number;
    batch_time_ms: number;
    framework_version: string;
    timestamp: string;
  };
}

interface DashboardData {
  metrics: {
    engagement: {
      completionRate: number;
      sessionDuration: number;
      componentInteractions: number;
      returnRate: number;
    };
    learning: {
      knowledgeRetention: number;
      mistakePatterns: MistakePattern[];
      conceptMastery: Record<string, number>;
    };
    quality: {
      userSatisfaction: number;
      avgQualityScore: number;
      consistencyScore: number;
    };
    performance: {
      responseTime: number;
      loadTimes: number[];
      errorRates: Map<string, number>;
      resourceUsage: {
        memoryPeak: number;
        networkRequests: number;
        storageUsed: number;
      };
    };
  };
  alerts: ValidationAlert[];
  summary: {
    totalValidations: number;
    criticalIssues: number;
    overallHealthScore: number;
    lastUpdate: string;
  };
}

interface ValidationAlert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  timestamp: Date;
  status: "active" | "acknowledged" | "resolved";
  actions: {
    immediate: string[];
  };
}

class ValidationService {
  private baseUrl: string;

  constructor() {
    // Detectar ambiente
    if (typeof window !== "undefined") {
      // Cliente browser
      this.baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://your-backend-url.com");
    } else {
      // Servidor Next.js
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    }
  }

  /**
   * Valida uma resposta individual
   */
  async validateResponse(
    request: ValidationRequest,
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/validation/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao validar resposta:", error);
      throw error;
    }
  }

  /**
   * Obtém métricas de validação
   */
  async getValidationMetrics(
    period: "1h" | "6h" | "24h" | "7d" = "24h",
    persona?: "dr_gasnelio" | "ga",
  ): Promise<ValidationMetrics> {
    try {
      const params = new URLSearchParams({ period });
      if (persona) params.append("persona", persona);

      const response = await fetch(
        `${this.baseUrl}/api/v1/validation/metrics?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao obter métricas:", error);
      throw error;
    }
  }

  /**
   * Validação em lote
   */
  async validateBatch(
    request: BatchValidationRequest,
  ): Promise<BatchValidationResult> {
    try {
      if (request.responses.length > 20) {
        throw new Error("Máximo 20 respostas por lote");
      }

      const response = await fetch(`${this.baseUrl}/api/v1/validation/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro na validação em lote:", error);
      throw error;
    }
  }

  /**
   * Obtém dados para o Quality Dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/validation/dashboard-data`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Converter errorRates para Map se necessário
      if (
        data.metrics?.performance?.errorRates &&
        typeof data.metrics.performance.errorRates === "object"
      ) {
        data.metrics.performance.errorRates = new Map(
          Object.entries(data.metrics.performance.errorRates),
        );
      }

      return data;
    } catch (error) {
      console.error("Erro ao obter dados do dashboard:", error);
      throw error;
    }
  }

  /**
   * Obtém alertas de validação
   */
  async getValidationAlerts(
    severity?: "critical" | "high" | "medium" | "low",
  ): Promise<{
    alerts: ValidationAlert[];
    count: number;
    timestamp: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (severity) params.append("severity", severity);

      const response = await fetch(
        `${this.baseUrl}/api/v1/validation/alerts?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Converter timestamp strings para Date objects
      if (data.alerts) {
        data.alerts = data.alerts.map((alert: ValidationAlert) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
      }

      return data;
    } catch (error) {
      console.error("Erro ao obter alertas:", error);
      throw error;
    }
  }

  /**
   * Verifica se o serviço de validação está disponível
   */
  async checkHealthStatus(): Promise<{
    available: boolean;
    version?: string;
    latency?: number;
  }> {
    try {
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return { available: false, latency };
      }

      const healthData = await response.json();

      return {
        available: true,
        version: healthData.version,
        latency,
      };
    } catch (error) {
      console.error("Erro ao verificar status de saúde:", error);
      return { available: false };
    }
  }

  /**
   * Utilitário para criar requisição de validação
   */
  createValidationRequest(
    response: string,
    persona: "dr_gasnelio" | "ga",
    userQuestion: string,
    context?: Record<string, unknown>,
  ): ValidationRequest {
    return {
      response,
      persona,
      user_question: userQuestion,
      context: context || {},
      store_result: true,
    };
  }

  /**
   * Utilitário para interpretação de scores de qualidade
   */
  interpretQualityScore(score: number): {
    level: "excellent" | "good" | "fair" | "poor" | "critical";
    description: string;
    color: string;
  } {
    if (score >= 0.9) {
      return {
        level: "excellent",
        description: "Excelente qualidade educacional",
        color: "#10b981", // green
      };
    } else if (score >= 0.8) {
      return {
        level: "good",
        description: "Boa qualidade educacional",
        color: "#3b82f6", // blue
      };
    } else if (score >= 0.7) {
      return {
        level: "fair",
        description: "Qualidade educacional adequada",
        color: "#f59e0b", // amber
      };
    } else if (score >= 0.5) {
      return {
        level: "poor",
        description: "Qualidade educacional baixa",
        color: "#ef4444", // red
      };
    } else {
      return {
        level: "critical",
        description: "Qualidade educacional crítica",
        color: "#dc2626", // dark red
      };
    }
  }

  /**
   * Utilitário para formatar tempo de validação
   */
  formatValidationTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}min`;
    }
  }
}

// Instância singleton
const validationService = new ValidationService();

export default validationService;

// Exportar tipos para uso em outros componentes
export type {
  ValidationRequest,
  ValidationResult,
  ValidationMetrics,
  BatchValidationRequest,
  BatchValidationResult,
  DashboardData,
  ValidationAlert,
};
