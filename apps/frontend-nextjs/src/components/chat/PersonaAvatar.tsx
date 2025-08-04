'use client';

import { useState, useCallback, useMemo } from 'react';
import { Persona } from '@/services/api';
import { getPersonaAvatar } from '@/constants/avatars';

// Validação de URL segura
const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['https:', 'http:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

interface PersonaAvatarProps {
  persona: Persona;
  personaId: string;
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  isTyping?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function PersonaAvatar({ 
  persona, 
  personaId,
  size = 'medium', 
  showStatus = false, 
  isTyping = false,
  onClick,
  ariaLabel,
  className = ''
}: PersonaAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const avatarUrl = useMemo(() => {
    const url = getPersonaAvatar(personaId);
    return url && isValidImageUrl(url) ? url : null;
  }, [personaId]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'small':
        return { width: '32px', height: '32px', fontSize: '1rem' };
      case 'large':
        return { width: '64px', height: '64px', fontSize: '2rem' };
      default: // medium
        return { width: '48px', height: '48px', fontSize: '1.5rem' };
    }
  }, [size]);
  
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setIsLoading(false);
  }, []);
  
  const handleImageError = useCallback(() => {
    console.warn(`Erro ao carregar avatar para persona ${personaId}:`, avatarUrl);
    setImageError(true);
    setIsLoading(false);
  }, [personaId, avatarUrl]);
  
  const handleImageLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const handleClick = useCallback(() => {
    if (onClick && !isLoading) {
      onClick();
    }
  }, [onClick, isLoading]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !isLoading) {
      e.preventDefault();
      onClick();
    }
  }, [onClick, isLoading]);

  const defaultAriaLabel = `Avatar de ${persona.name}${isTyping ? ', digitando' : ''}${showStatus ? ', online' : ''}`;
  
  return (
    <div
      className={className}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={ariaLabel || defaultAriaLabel}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none'
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Avatar Circle */}
      <div
        style={{
          ...sizeStyles,
          borderRadius: '50%',
          background: imageError || !avatarUrl 
            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' 
            : 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          transition: 'all 0.3s ease',
          border: isTyping ? '3px solid #4caf50' : '3px solid #f0f0f0',
          animation: isTyping ? 'pulse 2s infinite' : 'none',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (onClick && !isLoading) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
          }
        }}
        onFocus={(e) => {
          if (onClick) {
            e.currentTarget.style.outline = '2px solid #1976d2';
            e.currentTarget.style.outlineOffset = '2px';
          }
        }}
        onBlur={(e) => {
          if (onClick) {
            e.currentTarget.style.outline = 'none';
          }
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.8rem',
            color: 'white'
          }}>
            ⏳
          </div>
        )}
        
        {/* Avatar Image or Fallback */}
        {!imageError && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar de ${persona.name}`}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              opacity: isLoading ? 0.5 : 1,
              transition: 'opacity 0.3s ease'
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
            onLoadStart={handleImageLoadStart}
          />
        ) : (
          <span 
            style={{ 
              fontSize: sizeStyles.fontSize, 
              color: 'white',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
            aria-hidden="true"
          >
            {persona.avatar || persona.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div
          aria-label={isTyping ? 'Digitando' : 'Online'}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
            height: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
            borderRadius: '50%',
            background: isTyping ? '#4caf50' : '#2196f3',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: isTyping ? 'pulse 2s infinite' : 'none'
          }}
        />
      )}

      {/* Typing Animation */}
      {isTyping && (
        <div
          aria-live="polite"
          aria-label="Digitando"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#4caf50',
            color: 'white',
            borderRadius: '12px',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            animation: 'bounce 1s infinite',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          <span aria-hidden="true">...</span>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { border-color: #4caf50; }
          50% { border-color: #81c784; }
          100% { border-color: #4caf50; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}