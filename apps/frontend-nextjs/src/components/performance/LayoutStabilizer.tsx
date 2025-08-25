'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LayoutStabilizerProps {
  children: React.ReactNode;
  minHeight?: string | number;
  preserveHeight?: boolean;
  className?: string;
}

/**
 * Component to prevent layout shift by maintaining container dimensions
 * during content loading and transitions
 */
export default function LayoutStabilizer({
  children,
  minHeight,
  preserveHeight = true,
  className = ''
}: LayoutStabilizerProps) {
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preserveHeight || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (height > 0 && (!measuredHeight || height > measuredHeight)) {
          setMeasuredHeight(height);
        }
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [measuredHeight, preserveHeight]);

  const containerStyle: React.CSSProperties = {
    minHeight: minHeight || (measuredHeight ? `${measuredHeight}px` : undefined),
    transition: 'min-height 0.2s ease-out'
  };

  return (
    <div 
      ref={containerRef}
      className={`layout-stabilizer ${className}`}
      style={containerStyle}
    >
      {children}
      
      <style jsx>{`
        .layout-stabilizer {
          position: relative;
          width: 100%;
        }
        
        /* Prevent content jumping */
        .layout-stabilizer > * {
          will-change: auto;
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .layout-stabilizer {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}