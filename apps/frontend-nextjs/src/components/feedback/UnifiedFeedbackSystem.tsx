'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X, Clock, TrendingUp, Heart, Star } from 'lucide-react';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'progress' | 'celebration';
export type FeedbackPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
  actions?: FeedbackAction[];
  data?: Record<string, any>;
  timestamp: number;
}

export interface FeedbackAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface FeedbackMetrics {
  totalShown: number;
  byType: Record<FeedbackType, number>;
  averageViewTime: number;
  interactionRate: number;
  recentFeedbacks: FeedbackMessage[];
}

// ============================================
// CONTEXTO E PROVIDER
// ============================================

interface FeedbackContextType {
  showFeedback: (feedback: Omit<FeedbackMessage, 'id' | 'timestamp'>) => string;
  hideFeedback: (id: string) => void;
  clearAll: () => void;
  getMetrics: () => FeedbackMetrics;
  activeFeedbacks: FeedbackMessage[];
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  }
  return context;
};

// ============================================
// SERVIÇO DE FEEDBACK
// ============================================

class FeedbackService {
  private static instance: FeedbackService;
  private feedbacks = new Map<string, FeedbackMessage>();
  private listeners = new Set<(feedbacks: FeedbackMessage[]) => void>();
  private metrics: FeedbackMetrics = {
    totalShown: 0,
    byType: {
      success: 0,
      error: 0,
      warning: 0,
      info: 0,
      progress: 0,
      celebration: 0
    },
    averageViewTime: 0,
    interactionRate: 0,
    recentFeedbacks: []
  };

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  showFeedback(feedback: Omit<FeedbackMessage, 'id' | 'timestamp'>): string {
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullFeedback: FeedbackMessage = {
      ...feedback,
      id,
      timestamp: Date.now(),
      duration: feedback.duration ?? this.getDefaultDuration(feedback.type),
      autoClose: feedback.autoClose ?? true
    };

    this.feedbacks.set(id, fullFeedback);
    this.updateMetrics(fullFeedback);
    this.notifyListeners();

    // Auto-close se configurado
    if (fullFeedback.autoClose) {
      setTimeout(() => {
        this.hideFeedback(id);
      }, fullFeedback.duration);
    }

    return id;
  }

  hideFeedback(id: string): void {
    this.feedbacks.delete(id);
    this.notifyListeners();
  }

  clearAll(): void {
    this.feedbacks.clear();
    this.notifyListeners();
  }

  subscribe(listener: (feedbacks: FeedbackMessage[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMetrics(): FeedbackMetrics {
    return { ...this.metrics };
  }

  private getDefaultDuration(type: FeedbackType): number {
    switch (type) {
      case 'success': return 3000;
      case 'error': return 7000;
      case 'warning': return 5000;
      case 'progress': return 0; // Não fecha automaticamente
      case 'celebration': return 5000;
      default: return 4000;
    }
  }

  private updateMetrics(feedback: FeedbackMessage): void {
    this.metrics.totalShown++;
    this.metrics.byType[feedback.type]++;
    this.metrics.recentFeedbacks.unshift(feedback);
    
    // Manter apenas os últimos 50
    if (this.metrics.recentFeedbacks.length > 50) {
      this.metrics.recentFeedbacks = this.metrics.recentFeedbacks.slice(0, 50);
    }
  }

  private notifyListeners(): void {
    const feedbackArray = Array.from(this.feedbacks.values());
    this.listeners.forEach(listener => listener(feedbackArray));
  }
}

// ============================================
// COMPONENTES DE FEEDBACK
// ============================================

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFeedbacks, setActiveFeedbacks] = useState<FeedbackMessage[]>([]);
  const feedbackService = FeedbackService.getInstance();

  useEffect(() => {
    const unsubscribe = feedbackService.subscribe(setActiveFeedbacks);
    return unsubscribe;
  }, [feedbackService]);

  const contextValue: FeedbackContextType = {
    showFeedback: (feedback) => feedbackService.showFeedback(feedback),
    hideFeedback: (id) => feedbackService.hideFeedback(id),
    clearAll: () => feedbackService.clearAll(),
    getMetrics: () => feedbackService.getMetrics(),
    activeFeedbacks
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackContainer />
    </FeedbackContext.Provider>
  );
};

const FeedbackContainer: React.FC = () => {
  const { activeFeedbacks, hideFeedback } = useFeedback();

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px'
      }}>
        {activeFeedbacks.map(feedback => (
          <FeedbackCard
            key={feedback.id}
            feedback={feedback}
            onClose={() => hideFeedback(feedback.id)}
          />
        ))}
      </div>
    </>
  );
};

const FeedbackCard: React.FC<{
  feedback: FeedbackMessage;
  onClose: () => void;
}> = ({ feedback, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (feedback.autoClose && feedback.duration && feedback.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const decrease = 100 / (feedback.duration! / 100);
          return Math.max(0, prev - decrease);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [feedback]);

  const getIcon = () => {
    switch (feedback.type) {
      case 'success': return <CheckCircle size={24} />;
      case 'error': return <AlertCircle size={24} />;
      case 'warning': return <AlertCircle size={24} />;
      case 'info': return <Info size={24} />;
      case 'progress': return <Clock size={24} />;
      case 'celebration': return <Star size={24} />;
    }
  };

  const getColors = () => {
    switch (feedback.type) {
      case 'success': return { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: '#10b981' };
      case 'error': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' };
      case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' };
      case 'info': return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' };
      case 'progress': return { bg: '#f0f9ff', border: '#0284c7', text: '#0c4a6e', icon: '#0284c7' };
      case 'celebration': return { bg: '#fdf4ff', border: '#a855f7', text: '#581c87', icon: '#a855f7' };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {/* Progress Bar */}
      {feedback.autoClose && feedback.type !== 'progress' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: colors.border,
            width: `${progress}%`,
            transition: 'width 0.1s linear'
          }}
        />
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ color: colors.icon, flexShrink: 0 }}>
          {getIcon()}
        </div>

        <div style={{ flex: 1 }}>
          {feedback.title && (
            <h4 style={{
              margin: '0 0 4px 0',
              color: colors.text,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {feedback.title}
            </h4>
          )}
          
          <p style={{
            margin: 0,
            color: colors.text,
            fontSize: '13px',
            lineHeight: '1.4',
            opacity: 0.9
          }}>
            {feedback.message}
          </p>

          {feedback.actions && feedback.actions.length > 0 && (
            <div style={{ 
              marginTop: '12px',
              display: 'flex',
              gap: '8px'
            }}>
              {feedback.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${colors.border}`,
                    background: action.variant === 'primary' ? colors.border : 'transparent',
                    color: action.variant === 'primary' ? 'white' : colors.text,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.7,
            flexShrink: 0
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// ============================================
// HOOKS DE CONVENIÊNCIA
// ============================================

export const useFeedbackActions = () => {
  const { showFeedback } = useFeedback();

  return {
    showSuccess: (message: string, title?: string, actions?: FeedbackAction[]) =>
      showFeedback({ type: 'success', message, title, actions }),

    showError: (message: string, title?: string, actions?: FeedbackAction[]) =>
      showFeedback({ type: 'error', message, title, actions }),

    showWarning: (message: string, title?: string, actions?: FeedbackAction[]) =>
      showFeedback({ type: 'warning', message, title, actions }),

    showInfo: (message: string, title?: string, actions?: FeedbackAction[]) =>
      showFeedback({ type: 'info', message, title, actions }),

    showProgress: (message: string, title?: string) =>
      showFeedback({ type: 'progress', message, title, autoClose: false }),

    showCelebration: (message: string, title?: string) =>
      showFeedback({ type: 'celebration', message, title, duration: 5000 }),

    // Feedbacks pré-configurados para ações comuns
    showSaveSuccess: () => 
      showFeedback({
        type: 'success',
        title: 'Salvo com sucesso!',
        message: 'Suas alterações foram salvas automaticamente.',
        actions: [{ label: 'Ver detalhes', onClick: () => console.log('Details') }]
      }),

    showLoadingProgress: (message: string = 'Carregando...') =>
      showFeedback({
        type: 'progress',
        message,
        autoClose: false
      }),

    showNetworkError: () =>
      showFeedback({
        type: 'error',
        title: 'Erro de conexão',
        message: 'Verifique sua conexão com a internet e tente novamente.',
        actions: [
          { label: 'Tentar novamente', onClick: () => window.location.reload(), variant: 'primary' }
        ]
      }),

    showValidationError: (fields: string[]) =>
      showFeedback({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: `Por favor, preencha: ${fields.join(', ')}`,
        duration: 6000
      })
  };
};

// ============================================
// COMPONENTE DE MÉTRICAS
// ============================================

export const FeedbackMetricsPanel: React.FC = () => {
  const { getMetrics } = useFeedback();
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);

  useEffect(() => {
    const updateMetrics = () => setMetrics(getMetrics());
    updateMetrics();
    
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [getMetrics]);

  if (!metrics) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      fontSize: '12px',
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
        📊 Métricas de Feedback
      </div>
      
      <div>Total: {metrics.totalShown}</div>
      <div>Taxa de interação: {(metrics.interactionRate * 100).toFixed(1)}%</div>
      
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontWeight: '500' }}>Por tipo:</div>
        {Object.entries(metrics.byType).map(([type, count]) => (
          <div key={type} style={{ marginLeft: '8px' }}>
            {type}: {count}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackProvider;