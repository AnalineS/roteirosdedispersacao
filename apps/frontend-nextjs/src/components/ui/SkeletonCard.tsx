'use client';

import React from 'react';
import Skeleton from './Skeleton';

interface SkeletonCardProps {
  showImage?: boolean;
  imageHeight?: string;
  titleLines?: number;
  descriptionLines?: number;
  showActions?: boolean;
  className?: string;
}

export default function SkeletonCard({
  showImage = true,
  imageHeight = '200px',
  titleLines = 1,
  descriptionLines = 3,
  showActions = true,
  className = ''
}: SkeletonCardProps) {
  return (
    <div className={`skeleton-card ${className}`}>
      {/* Image skeleton */}
      {showImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          variant="rectangular"
          animation="wave"
        />
      )}
      
      {/* Content skeleton */}
      <div className="skeleton-card-content">
        {/* Title skeleton */}
        <Skeleton
          width="80%"
          height="24px"
          variant="text"
          lines={titleLines}
          animation="pulse"
        />
        
        {/* Description skeleton */}
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <Skeleton
            width="100%"
            height="16px"
            variant="text"
            lines={descriptionLines}
            animation="pulse"
          />
        </div>
        
        {/* Actions skeleton */}
        {showActions && (
          <div className="skeleton-card-actions">
            <Skeleton width="80px" height="36px" variant="rounded" animation="pulse" />
            <Skeleton width="100px" height="36px" variant="rounded" animation="pulse" />
          </div>
        )}
      </div>
      
      <style jsx>{`
        .skeleton-card {
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .skeleton-card-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .skeleton-card-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
        }
        
        @media (max-width: 768px) {
          .skeleton-card {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
}