'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { 
  type Crop, 
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop
} from 'react-image-crop';
import { RotateCcw, Move, ZoomIn, ZoomOut, Crop as CropIcon, X, Check } from 'lucide-react';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circularCrop?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  className?: string;
}

export default function ImageCropper({
  src,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // Quadrado por padrão
  circularCrop = true, // Para avatars
  minWidth = 50,
  minHeight = 50,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.9,
  className = ''
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { success, error, info } = useHapticFeedback();

  // Inicializar crop quando imagem carrega
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    const cropConfig = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80, // 80% da largura inicial
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(cropConfig);
    info(); // Haptic feedback quando imagem carrega
  }, [aspectRatio, info]);

  // Processar crop quando completado
  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && canvasRef.current) {
      generateCroppedImage(
        imgRef.current,
        canvasRef.current,
        completedCrop,
        scale,
        rotate,
        quality
      );
    }
  }, [completedCrop, scale, rotate, quality]);

  // Função para gerar imagem cortada
  const generateCroppedImage = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop, scale: number, rotate: number, quality: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const rotateRads = (rotate * Math.PI) / 180;

      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // Move to center of canvas
      ctx.translate(canvas.width / 2 / pixelRatio, canvas.height / 2 / pixelRatio);
      // Rotate
      ctx.rotate(rotateRads);
      // Scale
      ctx.scale(scale, scale);
      // Move to center of image
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      ctx.restore();
    },
    []
  );

  // Aplicar crop final
  const handleCropApply = useCallback(async () => {
    if (!canvasRef.current || !completedCrop) {
      error();
      return;
    }

    setIsProcessing(true);
    
    try {
      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao gerar imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      });

      success();
      onCropComplete(blob);
    } catch (err) {
      console.error('Erro ao processar crop:', err);
      error();
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, quality, onCropComplete, success, error]);

  // Resetar crop
  const handleResetCrop = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const resetCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );
      setCrop(resetCrop);
      setScale(1);
      setRotate(0);
      info();
    }
  }, [aspectRatio, info]);

  // Controles de transformação
  const handleScaleChange = useCallback((newScale: number) => {
    setScale(Math.max(0.1, Math.min(3, newScale)));
    info();
  }, [info]);

  const handleRotateChange = useCallback((degrees: number) => {
    setRotate((prev) => (prev + degrees) % 360);
    info();
  }, [info]);

  const handleCancel = useCallback(() => {
    info();
    onCancel();
  }, [onCancel, info]);

  return (
    <div className={`image-cropper ${className}`}>
      {/* Header */}
      <div className="cropper-header">
        <h3 className="cropper-title">
          <CropIcon size={20} />
          Ajustar Imagem
        </h3>
        <p className="cropper-subtitle">
          {circularCrop ? 'Posicione e ajuste seu avatar' : 'Recorte a imagem como desejado'}
        </p>
      </div>

      {/* Área de crop */}
      <div className="crop-container">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current?.width || 0, imgRef.current?.height || 0))}
          aspect={aspectRatio}
          minWidth={minWidth}
          minHeight={minHeight}
          circularCrop={circularCrop}
          keepSelection
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            alt="Imagem para crop"
            src={src}
            style={{
              transform: `scale(${scale}) rotate(${rotate}deg)`,
              maxWidth: '100%',
              maxHeight: '400px'
            }}
            onLoad={onImageLoad}
            className="crop-image"
          />
        </ReactCrop>
      </div>

      {/* Controles de transformação */}
      <div className="transform-controls">
        <div className="control-group">
          <label className="control-label">
            <ZoomOut size={16} />
            Zoom
            <ZoomIn size={16} />
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="control-slider"
            aria-label="Controle de zoom"
          />
          <span className="control-value">{Math.round(scale * 100)}%</span>
        </div>

        <div className="control-group">
          <label className="control-label">
            <RotateCcw size={16} />
            Rotação
          </label>
          <div className="rotation-buttons">
            <button
              onClick={() => handleRotateChange(-90)}
              className="rotation-button"
              aria-label="Rotacionar 90° anti-horário"
            >
              -90°
            </button>
            <button
              onClick={() => handleRotateChange(-15)}
              className="rotation-button"
              aria-label="Rotacionar 15° anti-horário"
            >
              -15°
            </button>
            <span className="rotation-value">{rotate}°</span>
            <button
              onClick={() => handleRotateChange(15)}
              className="rotation-button"
              aria-label="Rotacionar 15° horário"
            >
              +15°
            </button>
            <button
              onClick={() => handleRotateChange(90)}
              className="rotation-button"
              aria-label="Rotacionar 90° horário"
            >
              +90°
            </button>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="action-buttons">
        <button
          onClick={handleResetCrop}
          className="reset-button"
          aria-label="Resetar ajustes"
        >
          <RotateCcw size={16} />
          Resetar
        </button>

        <div className="main-buttons">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="cancel-button"
            aria-label="Cancelar edição"
          >
            <X size={16} />
            Cancelar
          </button>

          <button
            onClick={handleCropApply}
            disabled={isProcessing || !completedCrop}
            className="apply-button"
            aria-label="Aplicar recorte"
          >
            {isProcessing ? (
              <>
                <div className="loading-spinner" />
                Processando...
              </>
            ) : (
              <>
                <Check size={16} />
                Aplicar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas oculto para processamento */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <style jsx>{`
        .image-cropper {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .cropper-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-gray-200);
          text-align: center;
        }

        .cropper-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .cropper-subtitle {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .crop-container {
          padding: var(--spacing-lg);
          display: flex;
          justify-content: center;
          background: var(--color-gray-50);
          min-height: 300px;
          align-items: center;
        }

        .crop-image {
          max-width: 100%;
          max-height: 400px;
          transition: transform var(--transition-fast);
        }

        .transform-controls {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .control-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          min-width: 100px;
        }

        .control-slider {
          flex: 1;
          height: 6px;
          border-radius: var(--radius-full);
          background: var(--color-gray-200);
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .control-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary-600);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .control-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary-600);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .control-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-600);
          min-width: 50px;
          text-align: center;
        }

        .rotation-buttons {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex: 1;
        }

        .rotation-button {
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .rotation-button:hover {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
        }

        .rotation-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-600);
          min-width: 40px;
          text-align: center;
          margin: 0 var(--spacing-sm);
        }

        .action-buttons {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-gray-50);
        }

        .reset-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .reset-button:hover {
          border-color: var(--color-gray-400);
          background: var(--color-gray-50);
        }

        .main-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        .cancel-button,
        .apply-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-lg);
          border: 2px solid;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 120px;
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

        .apply-button {
          background: var(--color-primary-600);
          border-color: var(--color-primary-600);
          color: white;
        }

        .apply-button:hover:not(:disabled) {
          background: var(--color-primary-700);
          border-color: var(--color-primary-700);
        }

        .cancel-button:disabled,
        .apply-button:disabled {
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark mode */
        [data-theme="dark"] .image-cropper {
          background: var(--color-gray-800);
        }

        [data-theme="dark"] .cropper-header {
          border-color: var(--color-gray-700);
        }

        [data-theme="dark"] .cropper-title {
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .cropper-subtitle {
          color: var(--color-gray-300);
        }

        [data-theme="dark"] .crop-container {
          background: var(--color-gray-900);
        }

        [data-theme="dark"] .transform-controls,
        [data-theme="dark"] .action-buttons {
          background: var(--color-gray-800);
          border-color: var(--color-gray-700);
        }

        [data-theme="dark"] .control-label {
          color: var(--color-gray-200);
        }

        [data-theme="dark"] .rotation-button,
        [data-theme="dark"] .reset-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        [data-theme="dark"] .cancel-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .transform-controls {
            gap: var(--spacing-md);
          }

          .control-group {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .control-label {
            justify-content: center;
            min-width: auto;
          }

          .rotation-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .action-buttons {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .main-buttons {
            width: 100%;
            justify-content: stretch;
          }

          .cancel-button,
          .apply-button {
            flex: 1;
          }
        }

        /* Focus states */
        .control-slider:focus,
        .rotation-button:focus,
        .reset-button:focus,
        .cancel-button:focus,
        .apply-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .cropper-header,
          .transform-controls,
          .action-buttons {
            border-width: 2px;
          }

          .rotation-button,
          .reset-button,
          .cancel-button,
          .apply-button {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .crop-image {
            transition: none;
          }

          .loading-spinner {
            animation: none;
          }

          .rotation-button,
          .reset-button,
          .cancel-button,
          .apply-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}