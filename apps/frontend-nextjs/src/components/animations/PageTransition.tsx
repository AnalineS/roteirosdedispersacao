'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={`page-transition ${className}`}>
      <div 
        className={`page-content ${isLoading ? 'page-loading' : 'page-loaded'}`}
      >
        {displayChildren}
      </div>
      
      {isLoading && (
        <div className="page-transition-overlay">
          <div className="page-transition-loader">
            <div className="loader-spinner" />
            <span className="loader-text">Carregando...</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-transition {
          position: relative;
          width: 100%;
          min-height: 100vh;
        }

        .page-content {
          transition: all var(--transition-base);
        }

        .page-loading {
          opacity: 0.7;
          transform: translateY(10px);
          filter: blur(1px);
        }

        .page-loaded {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .page-transition-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          animation: fadeIn 0.2s ease-out;
        }

        .page-transition-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
        }

        .loader-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-gray-200);
          border-top-color: var(--color-primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loader-text {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          font-weight: var(--font-weight-medium);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark Mode */
        [data-theme="dark"] .page-transition-overlay {
          background: rgba(18, 18, 18, 0.8);
        }

        [data-theme="dark"] .page-transition-loader {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .loader-text {
          color: var(--color-gray-700);
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .page-content,
          .page-transition-overlay {
            transition: none;
            animation: none;
          }
          
          .loader-spinner {
            animation: none;
            border-top-color: var(--color-primary-500);
          }
        }
      `}</style>
    </div>
  );
}

// Componente para animações de entrada de seção
interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn';
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimatedSection({ 
  children, 
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
  className = ''
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`animated-section ${animation} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ '--animation-duration': `${duration}ms` } as React.CSSProperties}
    >
      {children}

      <style jsx>{`
        .animated-section {
          transition: all var(--animation-duration, 600ms) ease-out;
        }

        .fadeIn {
          opacity: 0;
          transform: translateY(20px);
        }

        .fadeIn.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fadeInUp {
          opacity: 0;
          transform: translateY(40px);
        }

        .fadeInUp.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .slideInLeft {
          opacity: 0;
          transform: translateX(-40px);
        }

        .slideInLeft.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .slideInRight {
          opacity: 0;
          transform: translateX(40px);
        }

        .slideInRight.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .scaleIn {
          opacity: 0;
          transform: scale(0.9);
        }

        .scaleIn.visible {
          opacity: 1;
          transform: scale(1);
        }

        @media (prefers-reduced-motion: reduce) {
          .animated-section {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Componente para loading skeleton
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px',
  className = ''
}: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, 
            var(--color-gray-200) 25%, 
            var(--color-gray-100) 50%, 
            var(--color-gray-200) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        [data-theme="dark"] .skeleton {
          background: linear-gradient(90deg, 
            var(--color-gray-300) 25%, 
            var(--color-gray-200) 50%, 
            var(--color-gray-300) 75%);
          background-size: 200% 100%;
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none;
            background: var(--color-gray-200);
          }
        }
      `}</style>
    </div>
  );
}

// Componente para contador animado
interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  end, 
  start = 0, 
  duration = 2000,
  suffix = '',
  prefix = '',
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(start + (end - start) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}