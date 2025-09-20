/**
 * Tipos centralizados para sistema de feedback
 * Unifica todas as definições de FeedbackData
 */

export interface FeedbackData {
  // Identificadores
  messageId: string;
  personaId: string;
  userId?: string;
  sessionId?: string;
  
  // Conteúdo
  question: string;
  response: string;
  rating: number;
  comments?: string;
  comment?: string; // Alias para compatibilidade
  
  // Temporal
  timestamp: number;
  
  // Metadados de segurança
  metadata?: {
    hasSensitiveData: boolean;
    sanitizationApplied: boolean;
    clientTimestamp: number;
    [key: string]: unknown;
  };
}

export interface FeedbackResponse {
  message: string;
  success: boolean;
  feedbackId?: string;
}

export interface FeedbackValidation {
  isValid: boolean;
  errors: string[];
  sanitizedData: FeedbackData;
}

export type FeedbackType = 'quick' | 'detailed' | 'rating' | 'comment';
export type FeedbackStatus = 'pending' | 'submitted' | 'processed' | 'error';