'use client';

import React from 'react';
import type { ChatAttachment } from '@/types/chat';

// Componente auxiliar para exibir anexos no chat
export function ChatMessageAttachment({ attachment }: { attachment: ChatAttachment }) {
  if (attachment.type === 'image_analysis') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="text-blue-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-800">
            Análise de Imagem
          </span>
          <span className="text-xs text-blue-600">
            {attachment.confidence ? `${Math.round(attachment.confidence * 100)}% confiança` : 'Analisado'}
          </span>
        </div>
        
        {attachment.extracted_text && (
          <div className="text-sm text-blue-700 mb-2">
            <strong>Texto extraído:</strong> {attachment.extracted_text}
          </div>
        )}
        
        {attachment.result?.medical_indicators && attachment.result.medical_indicators.length > 0 && (
          <div className="text-sm text-blue-700">
            <strong>Indicadores médicos:</strong> {attachment.result.medical_indicators.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ChatMessageAttachment;