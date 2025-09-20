/**
 * Componente de Upload de Imagens
 * Interface para upload e processamento multimodal
 * FASE 4.2 - Chatbot Multimodal
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultimodal, useMultimodalHealth, AnalysisResult } from '@/hooks/useMultimodal';

interface ImageUploaderProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onUploadSuccess?: (fileId: string) => void;
  onClose?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  onAnalysisComplete,
  onUploadSuccess,
  onClose,
  className = '',
  disabled = false
}: ImageUploaderProps) {
  const {
    uploadImage,
    processImage,
    uploadResult,
    processingStatus,
    analysisResult,
    capabilities,
    imageTypes,
    isUploading,
    isProcessing,
    error,
    clearResults,
    validateFile,
    retryUpload
  } = useMultimodal();

  const { isHealthy, isAvailable, status } = useMultimodalHealth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageType, setSelectedImageType] = useState('general');
  const [dragActive, setDragActive] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler para seleção de arquivo
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    clearResults();
  }, [validateFile, clearResults]);

  // Handler para drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handler para input de arquivo
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Upload do arquivo
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadImage(selectedFile, selectedImageType);
      if (result.success && result.file_id) {
        onUploadSuccess?.(result.file_id);
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'image_upload_error', {
          event_category: 'medical_file_upload',
          event_label: 'upload_failed',
          custom_parameters: {
            medical_context: 'multimodal_image_upload',
            file_type: selectedImageType,
            error_type: 'upload_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  }, [selectedFile, selectedImageType, uploadImage, onUploadSuccess]);

  // Retry upload
  const handleRetry = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await retryUpload(selectedFile, selectedImageType);
      if (result.success && result.file_id) {
        onUploadSuccess?.(result.file_id);
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'image_upload_retry_error', {
          event_category: 'medical_file_upload',
          event_label: 'retry_upload_failed',
          custom_parameters: {
            medical_context: 'multimodal_retry_upload',
            file_type: selectedImageType,
            error_type: 'retry_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  }, [selectedFile, selectedImageType, retryUpload, onUploadSuccess]);

  // Processar imagem manualmente
  const handleProcess = useCallback(async () => {
    if (!uploadResult?.file_id) return;

    try {
      const result = await processImage(uploadResult.file_id);
      onAnalysisComplete?.(result);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'image_processing_error', {
          event_category: 'medical_file_processing',
          event_label: 'image_analysis_failed',
          custom_parameters: {
            medical_context: 'multimodal_image_processing',
            file_id: uploadResult?.file_id || 'unknown',
            error_type: 'processing_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  }, [uploadResult, processImage, onAnalysisComplete]);

  // Reset do componente
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearResults]);

  // Se sistema não está disponível
  if (!isAvailable) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sistema Multimodal Indisponível
          </h3>
          <p className="text-gray-600 mb-4">
            As funcionalidades de upload e análise de imagens estão temporariamente indisponíveis.
          </p>
          <div className="text-sm text-gray-500">
            Status: <span className="font-mono">{status}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status do Sistema */}
      {!isHealthy && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <div>
              <p className="text-sm text-yellow-800">
                Sistema em modo limitado - algumas funcionalidades podem não estar disponíveis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.tiff,.bmp"
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="text-center">
          {selectedFile ? (
            <div className="space-y-3">
              <div className="text-green-600">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-gray-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Selecione ou arraste uma imagem
                </p>
                <p className="text-sm text-gray-600">
                  Formatos: JPEG, PNG, PDF, TIFF, BMP (máx. 10MB)
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={disabled}
              >
                Escolher Arquivo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Opções de Tipo de Imagem */}
      {selectedFile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Tipo de imagem:
            </label>
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showAdvancedOptions ? 'Opções básicas' : 'Opções avançadas'}
            </button>
          </div>

          <select
            value={selectedImageType}
            onChange={(e) => setSelectedImageType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(imageTypes).map(([value, type]) => (
              <option key={value} value={value}>
                {type.name} - {type.description}
              </option>
            ))}
          </select>

          {showAdvancedOptions && selectedImageType && imageTypes[selectedImageType] && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Exemplos:</strong> {imageTypes[selectedImageType].examples.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ações de Upload */}
      {selectedFile && !uploadResult && (
        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              'Enviar Imagem'
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Resultado do Upload */}
      {uploadResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-md p-4 ${
              uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {uploadResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="text-green-600 mr-2">✅</div>
                  <h3 className="text-sm font-medium text-green-800">
                    Upload realizado com sucesso!
                  </h3>
                </div>
                
                {uploadResult.file_id && (
                  <div className="text-xs text-green-700">
                    <strong>ID:</strong> <span className="font-mono">{uploadResult.file_id}</span>
                  </div>
                )}

                {uploadResult.expires_at && (
                  <div className="text-xs text-green-700">
                    <strong>Expira em:</strong> {new Date(uploadResult.expires_at).toLocaleString()}
                  </div>
                )}

                {processingStatus?.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-sm text-green-700">Processando imagem...</span>
                  </div>
                )}

                {processingStatus?.status === 'completed' && !isProcessing && (
                  <button
                    onClick={handleProcess}
                    className="text-sm text-green-700 hover:text-green-900 underline"
                  >
                    Ver resultado da análise
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="text-red-600 mr-2">❌</div>
                  <h3 className="text-sm font-medium text-red-800">
                    Erro no upload
                  </h3>
                </div>
                
                <p className="text-sm text-red-700">
                  {uploadResult.error}
                </p>

                <button
                  onClick={handleRetry}
                  className="text-sm text-red-700 hover:text-red-900 underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Disclaimers */}
            {uploadResult.disclaimers && uploadResult.disclaimers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="space-y-1">
                  {uploadResult.disclaimers.map((disclaimer, index) => (
                    <p key={index} className="text-xs text-gray-600">
                      {disclaimer}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Resultado da Análise */}
      {analysisResult && (
        <AnalysisResultDisplay result={analysisResult} />
      )}

      {/* Reset Button */}
      {(uploadResult || error) && (
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Enviar nova imagem
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para exibir resultado da análise
function AnalysisResultDisplay({ result }: { result: AnalysisResult }) {
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-md p-4"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-blue-800">
            📊 Resultado da Análise
          </h3>
          <div className={`text-xs ${getConfidenceColor(result.confidence_level)}`}>
            {getConfidenceIcon(result.confidence_level)} {Math.round(result.confidence_score * 100)}% confiança
          </div>
        </div>

        {/* Texto Extraído */}
        {result.extracted_text && (
          <div>
            <h4 className="text-xs font-medium text-blue-700 mb-1">Texto Detectado:</h4>
            <div className="bg-white rounded border p-2 text-xs text-gray-800 max-h-32 overflow-y-auto">
              {result.extracted_text}
            </div>
          </div>
        )}

        {/* Indicadores Médicos */}
        {result.medical_indicators && result.medical_indicators.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-blue-700 mb-1">Conteúdo Médico Detectado:</h4>
            <div className="flex flex-wrap gap-1">
              {result.medical_indicators.map((indicator: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Avisos de Segurança */}
        {result.safety_warnings && result.safety_warnings.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-2">
            <h4 className="text-xs font-medium text-orange-700 mb-1">Avisos Importantes:</h4>
            <div className="space-y-1">
              {result.safety_warnings.map((warning: string, index: number) => (
                <p key={index} className="text-xs text-orange-700">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Informações Extraídas */}
        {result.extracted_info && Object.keys(result.extracted_info).length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-700 hover:text-blue-900 underline"
            >
              {showDetails ? 'Ocultar' : 'Ver'} informações detalhadas
            </button>
            
            {showDetails && (
              <div className="mt-2 bg-white rounded border p-2">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result.extracted_info, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Disclaimers */}
        {result.disclaimers && result.disclaimers.length > 0 && (
          <div className="pt-3 border-t border-blue-200">
            <div className="space-y-1">
              {result.disclaimers.map((disclaimer: string, index: number) => (
                <p key={index} className="text-xs text-blue-600">
                  {disclaimer}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}