/**
 * Sistema de Logging Condicional
 * Logs apenas em desenvolvimento, silencioso em produção
 */

interface LogLevel {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
}

class ConditionalLogger implements LogLevel {
  private isDevelopment: boolean;

  constructor() {
    // Verificar se está em desenvolvimento
    this.isDevelopment =
      process.env.NODE_ENV === 'development' ||
      typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }

  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Erros sempre são mostrados, independente do ambiente
    console.error(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
  }

  // Método para debug específico (apenas desenvolvimento)
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

// Instância singleton
export const logger = new ConditionalLogger();

// Exportar como default também
export default logger;