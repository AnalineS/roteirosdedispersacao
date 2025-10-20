/**
 * Tipos unificados para o sistema de chat multimodal
 * Este arquivo centraliza as interfaces do chat que foram unificadas
 */

import type { AnalysisResult } from '@/hooks/useMultimodal';

// Interface unificada para anexos (texto, imagem e análise)
export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'image_analysis';
  name: string;
  url?: string;
  // Propriedades específicas para análise de imagem
  confidence?: number;
  extracted_text?: string;
  result?: AnalysisResult;
}

// Re-exportando o componente do local correto
export { ChatMessageAttachment } from '@/components/chat/ChatMessageAttachment';

