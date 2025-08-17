/**
 * Input de Chat Multimodal
 * Integração do chat com upload de imagens
 * FASE 4.2 - Chatbot Multimodal
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultimodal, useMultimodalHealth } from '@/hooks/useMultimodal';
import ImageUploader from '@/components/multimodal/ImageUploader';

interface MultimodalChatInputProps {
  onSendMessage: (message: string, attachments?: any[]) => void;
  onImageAnalysis?: (result: any) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function MultimodalChatInput({
  onSendMessage,
  onImageAnalysis,
  disabled = false,
  placeholder = "Digite sua mensagem ou envie uma imagem...",
  className = ''
}: MultimodalChatInputProps) {
  const [message, setMessage] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [attachedImages, setAttachedImages] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { analysisResult, clearResults } = useMultimodal();
  const { isHealthy, isAvailable } = useMultimodalHealth();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  // Handler para mudança no texto
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Handler para envio de mensagem
  const handleSendMessage = useCallback(() => {
    if (!message.trim() && attachedImages.length === 0) return;

    const attachments = attachedImages.length > 0 ? attachedImages : undefined;
    onSendMessage(message.trim(), attachments);
    
    // Reset
    setMessage('');
    setAttachedImages([]);
    setShowImageUploader(false);
    clearResults();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, attachedImages, onSendMessage, clearResults]);

  // Handler para teclas
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handler para resultado da análise
  const handleAnalysisComplete = useCallback((result: any) => {
    onImageAnalysis?.(result);
    
    // Adicionar resultado como anexo
    setAttachedImages(prev => [...prev, {
      type: 'image_analysis',
      result: result,
      file_id: result.file_id,
      confidence: result.confidence_score,
      extracted_text: result.extracted_text
    }]);

    // Sugerir mensagem baseada no resultado
    if (result.extracted_text && result.medical_indicators.length > 0) {
      const suggestedMessage = `Analisei a imagem e encontrei: ${result.medical_indicators.join(', ')}. Pode me explicar mais sobre isso?`;
      setMessage(suggestedMessage);
      adjustTextareaHeight();
    }

    setShowImageUploader(false);
  }, [onImageAnalysis, adjustTextareaHeight]);

  // Handler para upload bem-sucedido
  const handleUploadSuccess = useCallback((fileId: string) => {
    console.log('Upload successful:', fileId);
  }, []);

  // Remover anexo
  const removeAttachment = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Área de Anexos */}
      {attachedImages.length > 0 && (
        <div className="border-b border-gray-200 p-3">
          <div className="flex flex-wrap gap-2">
            {attachedImages.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center space-x-2"
              >
                <div className="text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-blue-800">
                    Imagem analisada
                  </div>
                  <div className="text-xs text-blue-600">
                    Confiança: {Math.round(attachment.confidence * 100)}%
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upload de Imagem */}
      <AnimatePresence>
        {showImageUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Enviar Imagem para Análise
                </h3>
                <button
                  onClick={() => setShowImageUploader(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <ImageUploader
                onAnalysisComplete={handleAnalysisComplete}
                onUploadSuccess={handleUploadSuccess}
                disabled={disabled}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área Principal de Input */}
      <div className="p-4">
        <div className="flex items-end space-x-3">
          {/* Botão de Imagem */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowImageUploader(!showImageUploader)}
              disabled={disabled || !isAvailable}
              className={`p-2 rounded-lg transition-colors ${
                isAvailable
                  ? showImageUploader
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={isAvailable ? "Enviar imagem" : "Funcionalidade não disponível"}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Indicador de status */}
            {isAvailable && (
              <div className="text-center">
                <div 
                  className={`w-1 h-1 rounded-full ${
                    isHealthy ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                ></div>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 bg-transparent"
              style={{ minHeight: '20px', maxHeight: '120px' }}
              rows={1}
            />
          </div>

          {/* Botão de Envio */}
          <button
            onClick={handleSendMessage}
            disabled={disabled || (!message.trim() && attachedImages.length === 0)}
            className={`p-2 rounded-lg transition-colors ${
              (!message.trim() && attachedImages.length === 0) || disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>

        {/* Dicas de Uso */}
        {!isAvailable && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Upload de imagens temporariamente indisponível
          </div>
        )}
        
        {isAvailable && !isHealthy && (
          <div className="mt-2 text-xs text-amber-600 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Funcionalidades de imagem em modo limitado
          </div>
        )}

        {showImageUploader && isAvailable && (
          <div className="mt-2 text-xs text-blue-600">
            <span className="font-medium">💡 Dica:</span> Envie receitas, documentos ou fotos para análise automática
          </div>
        )}
      </div>

      {/* Preview do Resultado da Análise */}
      {analysisResult && !attachedImages.some(a => a.file_id === analysisResult.file_id) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-gray-200 p-3"
        >
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-800">
                ✅ Análise Concluída
              </h4>
              <div className="text-xs text-green-600">
                {Math.round(analysisResult.confidence_score * 100)}% confiança
              </div>
            </div>
            
            {analysisResult.extracted_text && (
              <div className="text-sm text-green-700 mb-2">
                <strong>Texto detectado:</strong> {analysisResult.extracted_text.substring(0, 100)}...
              </div>
            )}
            
            {analysisResult.medical_indicators.length > 0 && (
              <div className="text-sm text-green-700 mb-2">
                <strong>Conteúdo médico:</strong> {analysisResult.medical_indicators.join(', ')}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleAnalysisComplete(analysisResult)}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
              >
                Anexar ao Chat
              </button>
              <button
                onClick={clearResults}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Descartar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente auxiliar para exibir anexos no chat
export function ChatMessageAttachment({ attachment }: { attachment: any }) {
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
            {Math.round(attachment.confidence * 100)}% confiança
          </span>
        </div>
        
        {attachment.extracted_text && (
          <div className="text-sm text-blue-700 mb-2">
            <strong>Texto extraído:</strong> {attachment.extracted_text}
          </div>
        )}
        
        {attachment.result?.medical_indicators?.length > 0 && (
          <div className="text-sm text-blue-700">
            <strong>Indicadores médicos:</strong> {attachment.result.medical_indicators.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return null;
}