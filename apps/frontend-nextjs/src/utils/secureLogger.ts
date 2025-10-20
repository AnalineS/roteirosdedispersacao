/**
 * Sistema de Logging Seguro para Plataforma Médica
 * 
 * Features:
 * - Mascaramento automático de dados sensíveis (LGPD)
 * - Logging diferenciado por ambiente
 * - Sanitização de stack traces
 * - Prevenção de vazamento de dados médicos
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  module?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

interface SecureLogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
  environment: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Mascara dados sensíveis de usuários
   */
  private maskUserId(userId: string): string {
    if (!userId) return '[no-user]';
    if (userId.length <= 8) return userId.slice(0, 4) + '****';
    return userId.slice(0, 6) + '****' + userId.slice(-2);
  }

  /**
   * Mascara dados pessoais (CPF, emails, telefones)
   */
  private maskPersonalInfo(value: string): string {
    // CPF: 123.456.789-10 -> 123.***.**-**
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) {
      return value.slice(0, 4) + '***.**-**';
    }

    // Email: user@domain.com -> u***@d*****.com
    if (value.includes('@')) {
      const [user, domain] = value.split('@');
      const maskedUser = user.length > 1 ? user[0] + '*'.repeat(user.length - 1) : user;
      const maskedDomain = domain.length > 5 ? domain.slice(0, 1) + '*'.repeat(domain.length - 5) + domain.slice(-4) : domain;
      return `${maskedUser}@${maskedDomain}`;
    }

    // Telefone: (11) 99999-9999 -> (11) 9****-****
    if (/\(\d{2}\)\s*\d{4,5}-\d{4}/.test(value)) {
      return value.replace(/(\(\d{2}\)\s*)\d+(-\d+)/, '$1****$2');
    }

    // Strings longas genéricas
    if (value.length > 10) {
      return value.slice(0, 3) + '*'.repeat(Math.min(6, value.length - 6)) + value.slice(-3);
    }

    return value;
  }

  /**
   * Sanitiza dados médicos sensíveis
   */
  private maskMedicalData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      'userId', 'user_id', 'patientId', 'patient_id',
      'cpf', 'email', 'phone', 'telefone',
      'nome', 'name', 'address', 'endereco',
      'medication', 'medicacao', 'dose', 'dosagem'
    ];

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        if (typeof value === 'string') {
          if (keyLower.includes('user') || keyLower.includes('patient')) {
            masked[key] = this.maskUserId(value);
          } else {
            masked[key] = this.maskPersonalInfo(value);
          }
        } else {
          masked[key] = '[MASKED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskMedicalData(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Sanitiza stack traces removendo informações sensíveis
   */
  private sanitizeErrorStack(error: Error): string {
    if (!error.stack) return error.message;

    return error.stack
      .replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]')
      .replace(/email=\S+@\S+/gi, 'email=[MASKED]')
      .replace(/userId=\w+/gi, 'userId=[MASKED]')
      .replace(/token=\w+/gi, 'token=[MASKED]');
  }

  /**
   * Cria entrada de log padronizada
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext): SecureLogEntry {
    const sanitizedContext = context ? this.maskMedicalData(context) : undefined;

    return {
      level,
      message,
      context: sanitizedContext,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Executa o log baseado no ambiente
   */
  private executeLog(entry: SecureLogEntry): void {
    const { level, message, context, timestamp } = entry;
    const timeStr = new Date(timestamp).toISOString();

    // Em testes, não logar nada
    if (this.isTest) return;

    // Formatar saída
    const contextStr = context ? JSON.stringify(context, null, 2) : '';
    const logMessage = `[${timeStr}] [${level.toUpperCase()}] ${message}`;

    // Usar método apropriado do console
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage, contextStr ? '\nContext:' : '', contextStr);
        }
        break;
      case 'info':
        console.info(logMessage, contextStr ? '\nContext:' : '', contextStr);
        break;
      case 'warn':
        console.warn(logMessage, contextStr ? '\nContext:' : '', contextStr);
        break;
      case 'error':
        console.error(logMessage, contextStr ? '\nContext:' : '', contextStr);
        break;
    }
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    const entry = this.createLogEntry('debug', message, context);
    this.executeLog(entry);
  }

  /**
   * Log de informações gerais
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    this.executeLog(entry);
  }

  /**
   * Log de avisos
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    this.executeLog(entry);
  }

  /**
   * Log de erros com sanitização de stack trace
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      errorMessage: error?.message,
      stack: error ? this.sanitizeErrorStack(error) : undefined
    };

    const entry = this.createLogEntry('error', message, errorContext);
    this.executeLog(entry);
  }

  /**
   * Log especializado para conformidade LGPD
   */
  lgpd(action: string, subjectId: string, details?: Record<string, unknown>): void {
    const context: LogContext = {
      component: 'LGPD',
      action,
      subjectId: this.maskUserId(subjectId),
      ...details
    };

    this.info(`LGPD: ${action}`, context);
  }

  /**
   * Log especializado para dados médicos
   */
  medical(action: string, context?: LogContext): void {
    const medicalContext: LogContext = {
      component: 'Medical',
      action,
      ...context
    };

    this.info(`Medical: ${action}`, medicalContext);
  }

  /**
   * Log especializado para análise de performance
   */
  performance(metric: string, value: number, context?: LogContext): void {
    const perfContext: LogContext = {
      component: 'Performance',
      metric,
      value,
      ...context
    };

    this.debug(`Performance: ${metric} = ${value}ms`, perfContext);
  }
}

// Instância singleton
export const secureLogger = new SecureLogger();

// Export default para compatibilidade
export default secureLogger;

// Utilities para casos específicos
export const logUtils = {
  maskUserId: (id: string) => secureLogger['maskUserId'](id),
  maskPersonalInfo: (info: string) => secureLogger['maskPersonalInfo'](info),
  sanitizeError: (error: Error) => secureLogger['sanitizeErrorStack'](error)
};