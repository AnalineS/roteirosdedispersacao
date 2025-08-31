/**
 * Hook para Sistema Multimodal
 * Upload, processamento e consulta de imagens com OCR
 * FASE 4.2 - Chatbot Multimodal
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useChat } from './useChat';

export interface ImageUploadResult {
  success: boolean;
  file_id?: string;
  expires_at?: string;
  error?: string;
  disclaimers: string[];
  next_steps?: string[];
  processing_info?: {
    expected_time: string;
    check_endpoint: string;
    result_endpoint: string;
  };
}

export interface ProcessingStatus {
  found: boolean;
  file_id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  upload_time?: string;
  expires_at?: string;
  error?: string;
  file_info?: {
    filename: string;
    size_mb: number;
    type: string;
  };
  actions?: {
    can_process: boolean;
    can_view_result: boolean;
    process_endpoint: string;
    result_endpoint: string;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  detected_language: string;
  processing_time: number;
}

export interface AnalysisResult {
  success: boolean;
  file_id: string;
  processing_completed: boolean;
  confidence_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  extracted_text: string;
  medical_indicators: string[];
  safety_warnings: string[];
  extracted_info: {
    medications?: string[];
    dosages_mg?: number[];
    dates_found?: string[];
  };
  disclaimers: string[];
  ocr_info: OCRResult;
  metadata: {
    original_filename: string;
    file_size_mb: number;
    image_type: string;
    expires_at: string;
  };
  context_help?: {
    medical_indicators_info: Record<string, string>;
    confidence_levels: Record<string, string>;
  };
}

export interface SystemCapabilities {
  system_status: 'healthy' | 'limited' | 'error';
  capabilities: {
    ocr_available: boolean;
    image_analysis: boolean;
    auto_cleanup: boolean;
    ocr_engines: string[];
    supported_languages: string[];
    max_file_size_mb: number;
    retention_days: number;
    processing_features: string[];
  };
  limitations: string[];
}

export interface ImageType {
  value: string;
  name: string;
  description: string;
  examples: string[];
}

interface MultimodalState {
  uploadResult: ImageUploadResult | null;
  processingStatus: ProcessingStatus | null;
  analysisResult: AnalysisResult | null;
  capabilities: SystemCapabilities | null;
  imageTypes: Record<string, ImageType>;
  isUploading: boolean;
  isProcessing: boolean;
  isCheckingStatus: boolean;
  error: string | null;
  currentFileId: string | null;
}

interface MultimodalHook extends MultimodalState {
  uploadImage: (file: File, imageType?: string) => Promise<ImageUploadResult>;
  processImage: (fileId: string) => Promise<AnalysisResult>;
  checkStatus: (fileId: string) => Promise<ProcessingStatus>;
  getResult: (fileId: string) => Promise<AnalysisResult | null>;
  loadCapabilities: () => Promise<void>;
  loadImageTypes: () => Promise<void>;
  clearResults: () => void;
  retryUpload: (file: File, imageType?: string) => Promise<ImageUploadResult>;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function useMultimodal(): MultimodalHook {
  const { sessionId } = useChat();
  
  const [state, setState] = useState<MultimodalState>({
    uploadResult: null,
    processingStatus: null,
    analysisResult: null,
    capabilities: null,
    imageTypes: {},
    isUploading: false,
    isProcessing: false,
    isCheckingStatus: false,
    error: null,
    currentFileId: null
  });

  // Refs para controle de polling
  const statusPollingRef = useRef<NodeJS.Timeout>(undefined);
  const abortControllerRef = useRef<AbortController>(undefined);

  // Validar arquivo antes do upload
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Verificar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`
      };
    }

    // Verificar formato
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff',
      'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato não suportado. Use: JPEG, PNG, BMP, TIFF ou PDF'
      };
    }

    return { valid: true };
  }, []);

  // Upload de imagem
  const uploadImage = useCallback(async (
    file: File, 
    imageType: string = 'general'
  ): Promise<ImageUploadResult> => {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorResult: ImageUploadResult = {
        success: false,
        error: validation.error,
        disclaimers: ['❌ Arquivo inválido']
      };
      setState(prev => ({ ...prev, uploadResult: errorResult, error: validation.error || null }));
      return errorResult;
    }

    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      error: null,
      uploadResult: null
    }));

    try {
      // Cancelar requisições anteriores
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', imageType);

      const response = await fetch(`${API_BASE}/api/multimodal/upload`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      const result: ImageUploadResult = await response.json();

      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadResult: result,
        currentFileId: result.file_id || null,
        error: result.success ? null : result.error || 'Erro no upload'
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorResult: ImageUploadResult = {
        success: false,
        error: errorMessage,
        disclaimers: ['❌ Erro de conexão']
      };

      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadResult: errorResult,
        error: errorMessage
      }));

      return errorResult;
    }
  }, [validateFile]);

  // Retry upload with exponential backoff
  const retryUpload = useCallback(async (
    file: File, 
    imageType: string = 'general'
  ): Promise<ImageUploadResult> => {
    const maxRetries = 3;
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await uploadImage(file, imageType);
        if (result.success) {
          return result;
        }
        lastError = result.error || 'Erro desconhecido';
        
        // Aguardar antes do próximo retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erro de conexão';
      }
    }

    return {
      success: false,
      error: `Falha após ${maxRetries} tentativas: ${lastError}`,
      disclaimers: ['❌ Múltiplas tentativas falharam']
    };
  }, [uploadImage]);

  // Processar imagem
  const processImage = useCallback(async (fileId: string): Promise<AnalysisResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/api/multimodal/process/${fileId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AnalysisResult = await response.json();

      setState(prev => ({
        ...prev,
        isProcessing: false,
        analysisResult: result,
        error: result.success ? null : 'Erro no processamento'
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Verificar status do processamento
  const checkStatus = useCallback(async (fileId: string): Promise<ProcessingStatus> => {
    setState(prev => ({ ...prev, isCheckingStatus: true }));

    try {
      const response = await fetch(`${API_BASE}/api/multimodal/status/${fileId}`);
      const status: ProcessingStatus = await response.json();

      setState(prev => ({
        ...prev,
        isCheckingStatus: false,
        processingStatus: status
      }));

      return status;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isCheckingStatus: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Obter resultado da análise
  const getResult = useCallback(async (fileId: string): Promise<AnalysisResult | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/multimodal/result/${fileId}`);
      const data = await response.json();

      if (data.found && data.result) {
        const result: AnalysisResult = data.result;
        setState(prev => ({ ...prev, analysisResult: result }));
        return result;
      }

      return null;

    } catch (error) {
      console.error('Erro ao obter resultado:', error);
      return null;
    }
  }, []);

  // Carregar capacidades do sistema
  const loadCapabilities = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/multimodal/capabilities`);
      const capabilities: SystemCapabilities = await response.json();

      setState(prev => ({ ...prev, capabilities }));

    } catch (error) {
      console.error('Erro ao carregar capacidades:', error);
    }
  }, []);

  // Carregar tipos de imagem
  const loadImageTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/multimodal/types`);
      const data = await response.json();

      setState(prev => ({ 
        ...prev, 
        imageTypes: data.supported_types || {} 
      }));

    } catch (error) {
      console.error('Erro ao carregar tipos de imagem:', error);
    }
  }, []);

  // Limpar resultados
  const clearResults = useCallback(() => {
    // Cancelar polling
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    // Cancelar requisições
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      uploadResult: null,
      processingStatus: null,
      analysisResult: null,
      error: null,
      currentFileId: null,
      isUploading: false,
      isProcessing: false,
      isCheckingStatus: false
    }));
  }, []);

  // Polling automático de status
  const startStatusPolling = useCallback((fileId: string, maxAttempts: number = 60) => {
    let attempts = 0;

    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    statusPollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const status = await checkStatus(fileId);

        // Parar polling se completou, falhou ou expirou
        if (status.status && ['completed', 'failed', 'expired'].includes(status.status)) {
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
          }

          // Se completou, carregar resultado automaticamente
          if (status.status === 'completed') {
            await getResult(fileId);
          }
        }

        // Parar se excedeu tentativas
        if (attempts >= maxAttempts) {
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
          }
        }

      } catch (error) {
        console.error('Erro no polling:', error);
        if (statusPollingRef.current) {
          clearInterval(statusPollingRef.current);
        }
      }
    }, 2000); // Check a cada 2 segundos
  }, [checkStatus, getResult]);

  // Auto-iniciar polling quando há upload bem-sucedido
  useEffect(() => {
    if (state.uploadResult?.success && state.uploadResult.file_id) {
      startStatusPolling(state.uploadResult.file_id);
    }
  }, [state.uploadResult, startStatusPolling]);

  // Carregar dados iniciais
  useEffect(() => {
    loadCapabilities();
    loadImageTypes();
  }, [loadCapabilities, loadImageTypes]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    uploadImage,
    processImage,
    checkStatus,
    getResult,
    loadCapabilities,
    loadImageTypes,
    clearResults,
    retryUpload,
    validateFile
  };
}

// Hook para verificar saúde do sistema multimodal
export function useMultimodalHealth() {
  const [health, setHealth] = useState<{
    status: string;
    capabilities: any;
    lastCheck: Date | null;
  }>({
    status: 'unknown',
    capabilities: null,
    lastCheck: null
  });

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/multimodal/health`);
      const data = await response.json();

      setHealth({
        status: data.status,
        capabilities: data.capabilities,
        lastCheck: new Date()
      });

      return data.status === 'healthy';

    } catch (error) {
      setHealth(prev => ({
        ...prev,
        status: 'error',
        lastCheck: new Date()
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkHealth, 300000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    ...health,
    checkHealth,
    isHealthy: health.status === 'healthy',
    isAvailable: health.status !== 'error'
  };
}