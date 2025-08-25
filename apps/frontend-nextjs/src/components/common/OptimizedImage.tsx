'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean; // Carregar imediatamente
  quality?: number; // 1-100
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagem otimizada com lazy loading
 * Implementa as melhores práticas de performance e acessibilidade
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // Começar carregamento 50px antes de aparecer
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Gerar srcSet para diferentes tamanhos
  const generateSrcSet = (baseSrc: string, baseWidth?: number): string => {
    if (!baseWidth) return '';
    
    const variants = [0.5, 1, 1.5, 2].map(scale => {
      const scaledWidth = Math.round(baseWidth * scale);
      return `${baseSrc}?w=${scaledWidth}&q=${quality} ${scaledWidth}w`;
    });
    
    return variants.join(', ');
  };

  // Gerar sizes padrão baseado na largura
  const getDefaultSizes = (): string => {
    if (sizes) return sizes;
    if (!width) return '100vw';
    
    return `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Estilos do container
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...style
  };

  // Estilos da imagem
  const imageStyle: React.CSSProperties = {
    display: 'block',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 1 : 0
  };

  // Placeholder blur
  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease',
    backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(10px)'
  };

  // Skeleton loader
  const skeletonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite'
  };

  return (
    <div className={className} style={containerStyle}>
      {/* CSS para animação do skeleton */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Placeholder/Skeleton */}
      {!isLoaded && placeholder === 'blur' && (
        <div style={placeholderStyle}>
          {!blurDataURL && <div style={skeletonStyle} />}
        </div>
      )}

      {/* Loading spinner */}
      {!isLoaded && !hasError && isInView && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '200px',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
            <div>Erro ao carregar imagem</div>
          </div>
        </div>
      )}

      {/* Imagem principal */}
      {(isInView || priority) && !hasError && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          width={width || 800}
          height={height || 600}
          sizes={getDefaultSizes()}
          priority={priority}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Dimensões reservadas para evitar layout shift */}
      {!priority && !isInView && (
        <div
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '200px',
            backgroundColor: 'transparent'
          }}
        />
      )}
    </div>
  );
};

/**
 * Hook para precarregamento de imagens críticas
 */
export const useImagePreload = (sources: string[]) => {
  useEffect(() => {
    sources.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [sources]);
};

/**
 * Utilitário para gerar placeholders blur
 */
export const generateBlurPlaceholder = (width: number, height: number, color = '#e5e7eb'): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export default OptimizedImage;