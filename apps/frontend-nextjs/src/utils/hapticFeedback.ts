/**
 * Sistema de Haptic Feedback para Dispositivos Móveis - PR #174
 *
 * Implementa feedback tátil contextual para melhorar a experiência móvel
 * no contexto médico e educacional do sistema PQT-U
 */

import { safeLocalStorage } from '@/hooks/useClientStorage';

// Interface para extensões vendor-specific do Navigator
interface ExtendedNavigator extends Navigator {
  webkitVibrate?: (pattern: number | number[]) => boolean;
  mozVibrate?: (pattern: number | number[]) => boolean;
  msVibrate?: (pattern: number | number[]) => boolean;
}

export interface HapticPattern {
  duration: number;
  intensity?: number;
}

export type HapticType = 'success' | 'error' | 'warning' | 'info' | 'medical' | 'calculation';

export interface HapticConfig {
  enabled: boolean;
  respectAccessibility: boolean;
  patterns: Record<HapticType, HapticPattern[]>;
}

// Configuração padrão de padrões de vibração
const DEFAULT_HAPTIC_PATTERNS: Record<HapticType, HapticPattern[]> = {
  success: [{ duration: 100, intensity: 0.6 }], // 1 pulse curto
  error: [
    { duration: 100, intensity: 0.8 }, 
    { duration: 50, intensity: 0 },   // pausa
    { duration: 100, intensity: 0.8 }
  ], // 2 pulses
  warning: [{ duration: 200, intensity: 0.7 }], // 1 pulse médio
  info: [{ duration: 80, intensity: 0.4 }], // pulse suave
  medical: [
    { duration: 150, intensity: 0.6 },
    { duration: 50, intensity: 0 },
    { duration: 100, intensity: 0.4 }
  ], // padrão médico distintivo
  calculation: [{ duration: 120, intensity: 0.5 }] // feedback de cálculos
};

/**
 * Classe principal do sistema de Haptic Feedback
 */
export class HapticFeedbackSystem {
  private static instance: HapticFeedbackSystem;
  private config: HapticConfig;
  private isSupported: boolean = false;
  private userPreferences: { enabled: boolean } = { enabled: true };

  private constructor() {
    this.config = {
      enabled: true,
      respectAccessibility: true,
      patterns: DEFAULT_HAPTIC_PATTERNS
    };
    
    this.checkSupport();
    this.loadUserPreferences();
  }

  /**
   * Singleton pattern para instância global
   */
  static getInstance(): HapticFeedbackSystem {
    if (!HapticFeedbackSystem.instance) {
      HapticFeedbackSystem.instance = new HapticFeedbackSystem();
    }
    return HapticFeedbackSystem.instance;
  }

  /**
   * Verifica se o dispositivo suporta haptic feedback
   */
  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    // Verificar APIs de vibração disponíveis
    const extendedNavigator = navigator as ExtendedNavigator;
    this.isSupported = !!(
      navigator.vibrate ||
      extendedNavigator.webkitVibrate ||
      extendedNavigator.mozVibrate ||
      extendedNavigator.msVibrate
    );

    // Verificar se é dispositivo móvel/touch
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (window.screen.width <= 768);
    
    this.isSupported = this.isSupported && isMobile;
  }

  /**
   * Carrega preferências do usuário do localStorage
   */
  private loadUserPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = safeLocalStorage()?.getItem('haptic-preferences');
      if (saved) {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      // Haptic preferences loading error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha ao carregar preferências de haptic feedback:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'haptic_preferences_load_error', {
          event_category: 'haptic_warning',
          event_label: 'haptic_preferences_load_failed',
          custom_parameters: {
            haptic_context: 'preferences_loading',
            error_type: 'preferences_load_failure',
            error_message: errorMessage
          }
        });
      }
    }
  }

  /**
   * Salva preferências do usuário
   */
  private saveUserPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      safeLocalStorage()?.setItem('haptic-preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      // Haptic preferences saving error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha ao salvar preferências de haptic feedback:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'haptic_preferences_save_error', {
          event_category: 'haptic_warning',
          event_label: 'haptic_preferences_save_failed',
          custom_parameters: {
            haptic_context: 'preferences_saving',
            error_type: 'preferences_save_failure',
            error_message: errorMessage
          }
        });
      }
    }
  }

  /**
   * Verifica se deve respeitar configurações de acessibilidade
   */
  private shouldRespectAccessibility(): boolean {
    if (!this.config.respectAccessibility) return false;
    
    // Verificar se usuário prefere movimento reduzido
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    return false;
  }

  /**
   * Converte padrão de haptic para array de vibração
   */
  private convertPatternToVibration(patterns: HapticPattern[]): number[] {
    const vibrationPattern: number[] = [];

    patterns.forEach((pattern, index) => {
      if (pattern.duration > 0) {
        vibrationPattern.push(pattern.duration);
      }
      
      // Adicionar pausa entre padrões (exceto no último)
      if (index < patterns.length - 1 && pattern.duration > 0) {
        vibrationPattern.push(50); // pausa padrão de 50ms
      }
    });

    return vibrationPattern;
  }

  /**
   * Executa vibração usando API nativa
   */
  private executeVibration(pattern: number[]): boolean {
    if (!navigator.vibrate) return false;

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      // Haptic vibration execution error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha ao executar vibração haptic:\n` +
          `  Pattern: ${JSON.stringify(pattern)}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'haptic_vibration_execution_error', {
          event_category: 'haptic_warning',
          event_label: 'haptic_vibration_failed',
          custom_parameters: {
            haptic_context: 'vibration_execution',
            pattern_length: pattern.length,
            error_type: 'vibration_execution_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  /**
   * Método principal para trigger de feedback háptico
   */
  trigger(type: HapticType, options?: { 
    force?: boolean; 
    customPattern?: HapticPattern[] 
  }): boolean {
    // Verificações de pré-condições
    if (!this.isSupported && !options?.force) {
      return false;
    }

    if (!this.config.enabled || !this.userPreferences.enabled) {
      return false;
    }

    if (this.shouldRespectAccessibility() && !options?.force) {
      return false;
    }

    // Obter padrão de vibração
    const patterns = options?.customPattern || this.config.patterns[type];
    if (!patterns || patterns.length === 0) {
      return false;
    }

    // Converter para formato de vibração
    const vibrationPattern = this.convertPatternToVibration(patterns);
    
    // Executar vibração
    const success = this.executeVibration(vibrationPattern);
    
    if (success) {
      // Haptic feedback success tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'haptic_feedback_triggered', {
          event_category: 'haptic_interaction',
          event_label: `haptic_${type}_success`,
          custom_parameters: {
            haptic_context: 'feedback_trigger',
            haptic_type: type,
            pattern_length: vibrationPattern.length,
            user_agent_short: navigator.userAgent.substring(0, 50),
            is_mobile: this.getSupport().isMobile
          }
        });
      }
    }

    return success;
  }

  /**
   * Métodos de conveniência para tipos específicos
   */
  success(): boolean {
    return this.trigger('success');
  }

  error(): boolean {
    return this.trigger('error');
  }

  warning(): boolean {
    return this.trigger('warning');
  }

  info(): boolean {
    return this.trigger('info');
  }

  medical(): boolean {
    return this.trigger('medical');
  }

  calculation(): boolean {
    return this.trigger('calculation');
  }

  /**
   * Configurações e controles
   */
  isEnabled(): boolean {
    return this.config.enabled && this.userPreferences.enabled && this.isSupported;
  }

  setEnabled(enabled: boolean): void {
    this.userPreferences.enabled = enabled;
    this.saveUserPreferences();
  }

  getSupport(): { 
    isSupported: boolean; 
    api: string | null;
    isMobile: boolean;
  } {
    let api = null;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) api = 'vibrate';
    else if ('webkitVibrate' in navigator) api = 'webkitVibrate';
    else if ('mozVibrate' in navigator) api = 'mozVibrate';  
    else if ('msVibrate' in navigator) api = 'msVibrate';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window);

    return {
      isSupported: this.isSupported,
      api,
      isMobile
    };
  }

  /**
   * Personalizar padrões de vibração
   */
  setPattern(type: HapticType, pattern: HapticPattern[]): void {
    this.config.patterns[type] = pattern;
  }

  /**
   * Testar padrão de vibração
   */
  test(type: HapticType = 'info'): boolean {
    return this.trigger(type, { force: true });
  }

  /**
   * Parar todas as vibrações
   */
  stop(): void {
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }
}

// Instância global singleton
export const hapticFeedback = HapticFeedbackSystem.getInstance();

// Hook React para usar haptic feedback
export function useHapticFeedback() {
  const feedback = HapticFeedbackSystem.getInstance();
  
  return {
    trigger: feedback.trigger.bind(feedback),
    success: feedback.success.bind(feedback),
    error: feedback.error.bind(feedback),
    warning: feedback.warning.bind(feedback),
    info: feedback.info.bind(feedback),
    medical: feedback.medical.bind(feedback),
    calculation: feedback.calculation.bind(feedback),
    isEnabled: feedback.isEnabled.bind(feedback),
    setEnabled: feedback.setEnabled.bind(feedback),
    getSupport: feedback.getSupport.bind(feedback),
    test: feedback.test.bind(feedback),
    stop: feedback.stop.bind(feedback)
  };
}

// Utility functions para integração fácil
export const triggerHaptic = (type: HapticType) => hapticFeedback.trigger(type);
export const hapticSuccess = () => hapticFeedback.success();
export const hapticError = () => hapticFeedback.error();
export const hapticWarning = () => hapticFeedback.warning();
export const hapticInfo = () => hapticFeedback.info();
export const hapticMedical = () => hapticFeedback.medical();
export const hapticCalculation = () => hapticFeedback.calculation();