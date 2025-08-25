'use client';

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'rectangular' | 'rounded' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number; // For text variant
}

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius,
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1
}: SkeletonProps) {
  
  const getVariantStyles = () => {
    const baseRadius = borderRadius || 'var(--radius-sm)';
    
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: width || height,
          height: height || width
        };
      case 'rounded':
        return {
          borderRadius: 'var(--radius-lg)'
        };
      case 'text':
        return {
          borderRadius: 'var(--radius-sm)',
          height: '1em'
        };
      default:
        return {
          borderRadius: baseRadius
        };
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'wave':
        return {
          background: 'linear-gradient(90deg, var(--color-gray-200) 25%, var(--color-gray-100) 50%, var(--color-gray-200) 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-wave 1.5s ease-in-out infinite'
        };
      case 'pulse':
        return {
          background: 'var(--color-gray-200)',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite'
        };
      default:
        return {
          background: 'var(--color-gray-200)'
        };
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-container ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton-item"
            style={{
              width: index === lines - 1 ? '75%' : width,
              height,
              marginBottom: index === lines - 1 ? 0 : 'var(--spacing-xs)',
              ...getVariantStyles(),
              ...getAnimationStyles()
            }}
            aria-hidden="true"
          />
        ))}
        
        <style jsx>{`
          .skeleton-container {
            display: flex;
            flex-direction: column;
          }
          
          .skeleton-item {
            display: block;
          }
          
          @keyframes skeleton-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.6;
            }
          }
          
          @keyframes skeleton-wave {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          
          /* Respect user preferences for reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .skeleton-item {
              animation: none !important;
              background: var(--color-gray-200) !important;
            }
          }
          
          /* High contrast mode */
          @media (prefers-contrast: high) {
            .skeleton-item {
              background: var(--color-gray-400) !important;
              border: 1px solid var(--color-gray-600);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div
        className={`skeleton ${className}`}
        style={{
          width,
          height,
          display: 'inline-block',
          ...getVariantStyles(),
          ...getAnimationStyles()
        }}
        aria-hidden="true"
        role="presentation"
      />
      
      <style jsx>{`
        .skeleton {
          display: inline-block;
          position: relative;
          overflow: hidden;
        }
        
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes skeleton-wave {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        /* Respect user preferences for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none !important;
            background: var(--color-gray-200) !important;
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .skeleton {
            background: var(--color-gray-400) !important;
            border: 1px solid var(--color-gray-600);
          }
        }
      `}</style>
    </>
  );
}