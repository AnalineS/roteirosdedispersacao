/**
 * Frontend Integration para Google Cloud Logging
 * Sistema híbrido: dados sensíveis -> Cloud, UI events -> LocalStorage
 */

import { secureLogger } from './secureLogger';

interface CloudLogEvent {
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context?: Record<string, string | number | boolean | null | Record<string, unknown>>;
  category?: 'personal_data' | 'analytics' | 'system' | 'audit';
  userId?: string;
  sessionId?: string;
}

interface LogResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

class CloudLoggerClient {
  private apiUrl: string;
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  private generateSessionId(): string {
    // Use crypto.getRandomValues for cryptographically secure session IDs (CWE-338 fix)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(12);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, b => b.toString(36)).join('').substring(0, 12);
      return `session_${Date.now()}_${randomPart}`;
    }
    return `session_${Date.now()}_${Date.now().toString(36)}`;
  }

  private async sendToBackend(event: CloudLogEvent): Promise<LogResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/logging/cloud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          source: 'frontend',
          userAgent: navigator.userAgent.substring(0, 100), // Limitado para privacidade
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Cloud logger backend error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha ao enviar log para backend cloud:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'cloud_logger_backend_error', {
          event_category: 'logging_warning',
          event_label: 'cloud_log_send_failed',
          custom_parameters: {
            logging_context: 'cloud_logger_backend',
            error_type: 'backend_send_failure',
            error_message: errorMessage
          }
        });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private shouldUseCloudLogging(event: CloudLogEvent): boolean {
    // Usar Cloud Logging para:
    // 1. Dados sensíveis (personal_data)
    // 2. Auditoria (audit)
    // 3. Erros críticos
    // 4. Eventos LGPD
    return (
      event.category === 'personal_data' ||
      event.category === 'audit' ||
      event.level === 'critical' ||
      event.message.toLowerCase().includes('lgpd') ||
      event.message.toLowerCase().includes('consent') ||
      event.message.toLowerCase().includes('medical')
    );
  }

  // Métodos públicos de logging
  async debug(message: string, context?: Record<string, any>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'debug',
      message,
      context,
      category: 'system',
      userId,
    };

    // Debug sempre local em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      secureLogger.debug(message, { ...context, userId });
      return;
    }

    // Em produção, apenas eventos críticos vão para Cloud
    if (this.shouldUseCloudLogging(event)) {
      await this.sendToBackend(event);
    } else {
      secureLogger.debug(message, { ...context, userId });
    }
  }

  async info(message: string, context?: Record<string, any>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'info',
      message,
      context,
      category: 'system',
      userId,
    };

    if (this.shouldUseCloudLogging(event)) {
      await this.sendToBackend(event);
    } else {
      secureLogger.info(message, { ...context, userId });
    }
  }

  async warning(message: string, context?: Record<string, any>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'warning',
      message,
      context,
      category: 'system',
      userId,
    };

    // Warnings sempre vão para Cloud (podem indicar problemas)
    if (this.isEnabled) {
      await this.sendToBackend(event);
    }

    // Também local para debug
    secureLogger.warn(message, { ...context, userId });
  }

  async error(message: string, error?: Error, context?: Record<string, any>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'error',
      message,
      context: {
        ...context,
        errorMessage: error?.message || null,
        errorStack: error?.stack || null,
      },
      category: 'system',
      userId,
    };

    // Erros sempre vão para Cloud
    if (this.isEnabled) {
      await this.sendToBackend(event);
    }

    // Também local
    secureLogger.error(message, error, { ...context, userId });
  }

  async critical(message: string, context?: Record<string, any>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'critical',
      message,
      context,
      category: 'audit',
      userId,
    };

    // Críticos SEMPRE vão para Cloud
    await this.sendToBackend(event);

    // Também local
    secureLogger.error(message, undefined, { ...context, userId, level: 'CRITICAL' });
  }

  // Métodos especializados LGPD
  async lgpdEvent(action: string, userId: string, details?: Record<string, string | number | boolean>): Promise<void> {
    const event: CloudLogEvent = {
      level: 'info',
      message: `LGPD: ${action}`,
      context: {
        action,
        details: details || {},
        compliance: 'LGPD',
      },
      category: 'audit',
      userId,
    };

    await this.sendToBackend(event);
    secureLogger.lgpd(action, userId, details);
  }

  async medicalInteraction(
    persona: string,
    queryLength: number,
    responseTime: number,
    userId: string
  ): Promise<void> {
    const event: CloudLogEvent = {
      level: 'info',
      message: 'Medical interaction',
      context: {
        persona,
        queryLength,
        responseTime,
        medicalContext: true,
      },
      category: 'personal_data', // Dados médicos são dados pessoais
      userId,
    };

    await this.sendToBackend(event);
    secureLogger.medical('chat_interaction', { persona, queryLength, responseTime });
  }

  async analyticsEvent(eventType: string, properties: Record<string, string | number | boolean>): Promise<void> {
    // Analytics são anônimos, mas podem ir para Cloud para análise
    const event: CloudLogEvent = {
      level: 'info',
      message: `Analytics: ${eventType}`,
      context: {
        eventType,
        properties,
        anonymous: true,
      },
      category: 'analytics',
    };

    if (this.isEnabled) {
      await this.sendToBackend(event);
    }

    // Também local para desenvolvimento
    secureLogger.info(`Analytics: ${eventType}`, { properties });
  }

  async securityAlert(alertType: string, details: Record<string, string | number | boolean>, userId?: string): Promise<void> {
    const event: CloudLogEvent = {
      level: 'critical',
      message: `Security Alert: ${alertType}`,
      context: {
        alertType,
        details,
        securityLevel: 'HIGH',
      },
      category: 'audit',
      userId,
    };

    // Alertas de segurança SEMPRE vão para Cloud
    await this.sendToBackend(event);
    secureLogger.error(`Security Alert: ${alertType}`, undefined, { details, userId });
  }

  // Utilitários
  getSessionId(): string {
    return this.sessionId;
  }

  isCloudLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  // Método para exercer direito LGPD (esquecimento)
  async requestDataDeletion(userId: string, reason?: string): Promise<LogResponse> {
    const event: CloudLogEvent = {
      level: 'info',
      message: 'LGPD: Data deletion requested',
      context: {
        action: 'data_deletion_request',
        reason: reason || 'User request',
        timestamp: new Date().toISOString(),
      },
      category: 'audit',
      userId,
    };

    // Registrar solicitação
    const result = await this.sendToBackend(event);

    // Também enviar para endpoint específico de deleção
    try {
      const deleteResponse = await fetch(`${this.apiUrl}/lgpd/delete-user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          reason,
          requestId: result.logId,
        }),
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to process deletion: ${deleteResponse.statusText}`);
      }

      return await deleteResponse.json();
    } catch (error) {
      await this.error('Failed to process LGPD deletion request', error as Error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const cloudLogger = new CloudLoggerClient();

// Hooks React para logging
export function useCloudLogger() {
  return {
    debug: cloudLogger.debug.bind(cloudLogger),
    info: cloudLogger.info.bind(cloudLogger),
    warning: cloudLogger.warning.bind(cloudLogger),
    error: cloudLogger.error.bind(cloudLogger),
    critical: cloudLogger.critical.bind(cloudLogger),
    lgpdEvent: cloudLogger.lgpdEvent.bind(cloudLogger),
    medicalInteraction: cloudLogger.medicalInteraction.bind(cloudLogger),
    analyticsEvent: cloudLogger.analyticsEvent.bind(cloudLogger),
    securityAlert: cloudLogger.securityAlert.bind(cloudLogger),
    requestDataDeletion: cloudLogger.requestDataDeletion.bind(cloudLogger),
    sessionId: cloudLogger.getSessionId(),
    isEnabled: cloudLogger.isCloudLoggingEnabled(),
  };
}

// Utilities para casos específicos
export const logUtils = {
  // Log de consentimento LGPD
  logConsent: async (userId: string, consentType: string, given: boolean) => {
    await cloudLogger.lgpdEvent(
      given ? 'consent_given' : 'consent_revoked',
      userId,
      { consentType, given }
    );
  },

  // Log de acesso a dados sensíveis
  logSensitiveDataAccess: async (userId: string, dataType: string, action: string) => {
    await cloudLogger.lgpdEvent('sensitive_data_access', userId, {
      dataType,
      action,
      timestamp: new Date().toISOString()
    });
  },

  // Log de interação com chat médico
  logMedicalChat: async (
    userId: string,
    persona: string,
    queryHash: string,
    responseTime: number
  ) => {
    await cloudLogger.medicalInteraction(persona, queryHash.length, responseTime, userId);
  },

  // Log de erro de compliance
  logComplianceError: async (violation: string, details: Record<string, any>) => {
    await cloudLogger.critical(`LGPD Compliance Violation: ${violation}`, {
      violation,
      details,
      requiresImmediateAction: true
    });
  },

  // Log de performance (analytics)
  logPerformance: async (metric: string, value: number, context?: Record<string, string | number | boolean>) => {
    await cloudLogger.analyticsEvent('performance_metric', {
      metric,
      value,
      ...(context || {})
    });
  },
};

export default cloudLogger;