'use client';

import React from 'react';
import Skeleton from './Skeleton';

interface SkeletonBadgeProps {
  count?: number;
  className?: string;
}

export default function SkeletonBadge({ count = 6, className = '' }: SkeletonBadgeProps) {
  return (
    <div className={`skeleton-badge-grid ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="skeleton-badge-item"
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          {/* Icon skeleton */}
          <Skeleton
            width="64px"
            height="64px"
            variant="circular"
            animation="pulse"
          />
          
          {/* Title skeleton */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Skeleton
              width="90%"
              height="20px"
              variant="text"
              animation="wave"
            />
          </div>
          
          {/* Description skeleton */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <Skeleton
              width="100%"
              height="14px"
              variant="text"
              lines={2}
              animation="wave"
            />
          </div>
          
          {/* Verified badge skeleton */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Skeleton
              width="80px"
              height="24px"
              variant="rounded"
              animation="pulse"
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .skeleton-badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
          margin: var(--spacing-3xl) 0;
        }
        
        .skeleton-badge-item {
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          text-align: center;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
            opacity: 0;
            transform: translateY(20px);
          }
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) {
          .skeleton-badge-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1200px) {
          .skeleton-badge-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .skeleton-badge-item {
            padding: var(--spacing-lg);
          }
        }
        
        /* Respect user preferences for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .skeleton-badge-item {
            animation: none !important;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}