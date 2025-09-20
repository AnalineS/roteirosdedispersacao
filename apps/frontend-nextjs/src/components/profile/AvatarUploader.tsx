'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import Image from 'next/image';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userId: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
  className?: string;
}

export default function AvatarUploader({
  currentAvatarUrl,
  userId,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { success, error, info } = useHapticFeedback();
  
  const {
    uploadFile,
    progress,
    isUploading,
    error: uploadError,
    reset: resetUpload
  } = useImageUpload();

  const handleUploadSuccess = useCallback((url: string) => {
    success();
    onUploadComplete?.(url);
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [success, onUploadComplete, setSelectedFile, setPreviewUrl]);

  const handleUploadError = useCallback((err: Error) => {
    error();
    onUploadError?.(err.message);
  }, [error, onUploadError]);

  const validateFile = useCallback((file: File): string | null => {
    // Verificar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Permitidos: ${allowedTypes.join(', ')}`;
    }

    // Verificar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [allowedTypes, maxSizeMB]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      error();
      onUploadError?.(validationError);
      return;
    }

    info();
    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [validateFile, error, info, onUploadError]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    uploadFile(
      selectedFile,
      (progress: number) => {
        // Progress is handled by the hook internally
      },
      handleUploadSuccess,
      handleUploadError
    );
  }, [selectedFile, uploadFile, handleUploadSuccess, handleUploadError]);

  const handleCancel = useCallback(() => {
    info();
    setSelectedFile(null);
    setPreviewUrl(null);
    resetUpload();
  }, [info, resetUpload]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`avatar-uploader ${className}`}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-label="Selecionar arquivo de avatar"
      />

      {/* Área principal */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!selectedFile ? openFileDialog : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!selectedFile) openFileDialog();
          }
        }}
        aria-label={selectedFile ? 'Arquivo selecionado' : 'Clique ou arraste para selecionar avatar'}
      >
        {/* Avatar atual ou preview */}
        <div className="avatar-preview">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Preview do avatar"
              className="preview-image"
              width={120}
              height={120}
              style={{ objectFit: 'cover' }}
            />
          ) : currentAvatarUrl ? (
            <Image
              src={currentAvatarUrl}
              alt="Avatar atual"
              className="current-avatar"
              width={120}
              height={120}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar-placeholder">
              <Camera className="placeholder-icon" size={32} />
              <span className="placeholder-text">Avatar</span>
            </div>
          )}

          {/* Overlay para upload */}
          {!selectedFile && (
            <div className="upload-overlay">
              <div className="upload-icon">
                <Upload size={24} />
              </div>
              <span className="upload-text">
                {currentAvatarUrl ? 'Alterar' : 'Upload'}
              </span>
            </div>
          )}
        </div>

        {/* Área de drop */}
        {!selectedFile && (
          <div className="drop-zone">
            <p className="drop-text">
              <strong>Clique para selecionar</strong> ou arraste uma imagem aqui
            </p>
            <p className="drop-hint">
              Formatos: JPEG, PNG, WebP • Máximo: {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* Controles quando arquivo selecionado */}
      {selectedFile && (
        <div className="upload-controls">
          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
            </span>
          </div>

          <div className="control-buttons">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="cancel-button"
              aria-label="Cancelar upload"
            >
              <X size={16} />
              Cancelar
            </button>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="upload-button"
              aria-label="Fazer upload do avatar"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner" />
                  {progress > 0 ? `${Math.round(progress)}%` : 'Enviando...'}
                </>
              ) : (
                <>
                  <Check size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isUploading && progress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {uploadError && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      <style jsx>{`
        .avatar-uploader {
          width: 100%;
          max-width: 400px;
        }

        .upload-area {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
          border: 3px dashed var(--color-gray-300);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          background: var(--color-gray-50);
          overflow: hidden;
        }

        .upload-area:hover:not(.has-file) {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          transform: scale(1.02);
        }

        .upload-area.drag-active {
          border-color: var(--color-primary-600);
          background: var(--color-primary-100);
          transform: scale(1.05);
        }

        .upload-area.has-file {
          border-color: var(--color-success-500);
          cursor: default;
        }

        .avatar-preview {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
        }

        .preview-image,
        .current-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-gray-500);
          z-index: 1;
        }

        .placeholder-icon {
          opacity: 0.7;
        }

        .placeholder-text {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          opacity: 0;
          transition: opacity var(--transition-fast);
          color: white;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .upload-area:hover .upload-overlay {
          opacity: 1;
        }

        .drop-zone {
          position: absolute;
          inset: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
        }

        .drop-text {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .drop-hint {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
          margin: 0;
        }

        .upload-controls {
          margin-top: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .file-info {
          text-align: center;
          padding: var(--spacing-sm);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
        }

        .file-name {
          display: block;
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-800);
          margin-bottom: var(--spacing-xs);
        }

        .file-size {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .control-buttons {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: center;
        }

        .cancel-button,
        .upload-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 100px;
          justify-content: center;
        }

        .cancel-button {
          background: white;
          border-color: var(--color-gray-300);
          color: var(--color-gray-700);
        }

        .cancel-button:hover:not(:disabled) {
          border-color: var(--color-gray-400);
          background: var(--color-gray-50);
        }

        .upload-button {
          background: var(--color-primary-600);
          border-color: var(--color-primary-600);
          color: white;
        }

        .upload-button:hover:not(:disabled) {
          background: var(--color-primary-700);
          border-color: var(--color-primary-700);
        }

        .cancel-button:disabled,
        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .progress-container {
          margin-top: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary-600);
          transition: width var(--transition-fast);
        }

        .progress-text {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          min-width: 40px;
        }

        .error-message {
          margin-top: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background: var(--color-error-50);
          border: 1px solid var(--color-error-200);
          border-radius: var(--radius-md);
          color: var(--color-error-700);
          font-size: var(--font-size-sm);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark mode */
        [data-theme="dark"] .upload-area {
          background: var(--color-gray-800);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .upload-area:hover:not(.has-file) {
          background: var(--color-primary-900);
        }

        [data-theme="dark"] .file-info {
          background: var(--color-gray-800);
        }

        [data-theme="dark"] .file-name {
          color: var(--color-gray-200);
        }

        [data-theme="dark"] .cancel-button {
          background: var(--color-gray-800);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        /* Responsive */
        @media (max-width: 480px) {
          .upload-area {
            width: 160px;
            height: 160px;
          }

          .control-buttons {
            flex-direction: column;
          }

          .cancel-button,
          .upload-button {
            width: 100%;
          }
        }

        /* Focus states */
        .upload-area:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .upload-area {
            border-width: 4px;
          }

          .upload-overlay {
            background: rgba(0, 0, 0, 0.8);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .upload-area {
            transition: none;
          }

          .upload-area:hover:not(.has-file) {
            transform: none;
          }

          .loading-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}