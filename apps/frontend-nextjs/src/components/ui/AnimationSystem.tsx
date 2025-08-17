/**
 * Animation System - ETAPA 6 UX TRANSFORMATION
 * Sistema completo de animações para aplicações médicas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Animações apropriadas e não obstrusivas
 * - Performance: Animações otimizadas com GPU acceleration
 * - Accessibility: Respeita prefers-reduced-motion
 * - User Experience: Smooth transitions que guiam o usuário
 */

'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Interfaces para animações
interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  trigger?: boolean;
  once?: boolean;
}

interface TransitionProps extends AnimationProps {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'medical-reveal';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

interface ScrollAnimationProps extends AnimationProps {
  threshold?: number;
  rootMargin?: string;
}

interface StaggerProps {
  children: ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
}

interface MedicalAnimationProps {
  type: 'heartbeat' | 'pulse' | 'flow' | 'loading' | 'alert' | 'success';
  intensity?: 'subtle' | 'normal' | 'strong';
  children?: ReactNode;
  size?: number;
  color?: string;
}

// Hook para detectar preferência de movimento reduzido
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook para animações baseadas em scroll
const useInView = (threshold = 0.1, rootMargin = '0px') => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin]);

  return [ref, isInView] as const;
};

// Componente base de transição
export const Transition: React.FC<TransitionProps> = ({
  children,
  type,
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 300,
  easing = 'ease-out',
  trigger = true,
  once = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(!once);
  const [hasTriggered, setHasTriggered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (trigger && (!once || !hasTriggered)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (once) setHasTriggered(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, once, hasTriggered]);

  const getTransformStyles = () => {
    if (prefersReducedMotion) {
      return {
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ${easing}`
      };
    }

    const baseTransition = `all ${duration}ms ${easing}`;
    
    switch (type) {
      case 'fade':
        return {
          opacity: isVisible ? 1 : 0,
          transition: baseTransition
        };
      
      case 'slide':
        const slideDirection = {
          up: `translateY(${isVisible ? 0 : distance}px)`,
          down: `translateY(${isVisible ? 0 : -distance}px)`,
          left: `translateX(${isVisible ? 0 : distance}px)`,
          right: `translateX(${isVisible ? 0 : -distance}px)`
        };
        return {
          opacity: isVisible ? 1 : 0,
          transform: slideDirection[direction],
          transition: baseTransition
        };
      
      case 'scale':
        return {
          opacity: isVisible ? 1 : 0,
          transform: `scale(${isVisible ? 1 : 0.9})`,
          transition: baseTransition
        };
      
      case 'rotate':
        return {
          opacity: isVisible ? 1 : 0,
          transform: `rotate(${isVisible ? 0 : -5}deg) scale(${isVisible ? 1 : 0.95})`,
          transition: baseTransition
        };
      
      case 'bounce':
        return {
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? 0 : distance}px)`,
          transition: isVisible 
            ? `all ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`
            : baseTransition
        };
      
      case 'medical-reveal':
        return {
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? 0 : 10}px) scale(${isVisible ? 1 : 0.98})`,
          filter: `blur(${isVisible ? 0 : 2}px)`,
          transition: baseTransition
        };
      
      default:
        return {
          opacity: isVisible ? 1 : 0,
          transition: baseTransition
        };
    }
  };

  return (
    <div
      className={`transition-container ${className}`}
      style={getTransformStyles()}
    >
      {children}
    </div>
  );
};

// Componente para animações baseadas em scroll
export const ScrollAnimation: React.FC<ScrollAnimationProps & TransitionProps> = ({
  children,
  type,
  direction,
  distance,
  threshold = 0.1,
  rootMargin = '0px',
  delay = 0,
  duration = 600,
  easing = 'ease-out',
  once = true,
  className = ''
}) => {
  const [ref, isInView] = useInView(threshold, rootMargin);

  return (
    <div ref={ref}>
      <Transition
        type={type}
        direction={direction}
        distance={distance}
        trigger={isInView}
        delay={delay}
        duration={duration}
        easing={easing}
        once={once}
        className={className}
      >
        {children}
      </Transition>
    </div>
  );
};

// Componente para animações em stagger (cascata)
export const StaggerAnimation: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade'
}) => {
  return (
    <div className="stagger-container">
      {children.map((child, index) => (
        <Transition
          key={index}
          type={animationType}
          delay={index * staggerDelay}
          duration={400}
          easing="ease-out"
        >
          {child}
        </Transition>
      ))}
    </div>
  );
};

// Animações específicas para contexto médico
export const MedicalAnimation: React.FC<MedicalAnimationProps> = ({
  type,
  intensity = 'normal',
  children,
  size = 24,
  color = '#0ea5e9'
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion && (type === 'heartbeat' || type === 'pulse')) {
    return (
      <div style={{ color }}>
        {children || '⚕️'}
      </div>
    );
  }

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'subtle': return 0.5;
      case 'strong': return 1.5;
      default: return 1;
    }
  };

  const intensityMultiplier = getIntensityMultiplier();

  const getAnimationStyles = (): React.CSSProperties => {
    switch (type) {
      case 'heartbeat':
        return {
          animation: `medical-heartbeat ${1.2 / intensityMultiplier}s ease-in-out infinite`,
          color,
          fontSize: `${size}px`,
          display: 'inline-block'
        };
      
      case 'pulse':
        return {
          animation: `medical-pulse ${2 / intensityMultiplier}s ease-in-out infinite`,
          color,
          fontSize: `${size}px`,
          display: 'inline-block'
        };
      
      case 'flow':
        return {
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            animation: `medical-flow ${3 / intensityMultiplier}s ease-in-out infinite`
          }
        } as React.CSSProperties;
      
      case 'loading':
        return {
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid transparent`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: `medical-spin ${1 / intensityMultiplier}s linear infinite`,
          display: 'inline-block'
        };
      
      case 'alert':
        return {
          animation: `medical-alert ${0.5 / intensityMultiplier}s ease-in-out 3`,
          color: '#dc2626',
          fontSize: `${size}px`,
          display: 'inline-block'
        };
      
      case 'success':
        return {
          animation: `medical-success ${0.6 / intensityMultiplier}s ease-out`,
          color: '#22c55e',
          fontSize: `${size}px`,
          display: 'inline-block'
        };
      
      default:
        return {};
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'heartbeat': return '💓';
      case 'pulse': return '⚕️';
      case 'flow': return '🌊';
      case 'loading': return '';
      case 'alert': return '🚨';
      case 'success': return '✅';
      default: return '⚕️';
    }
  };

  return (
    <>
      <div style={getAnimationStyles()}>
        {children || getDefaultIcon()}
      </div>
      
      <style jsx>{`
        @keyframes medical-heartbeat {
          0%, 50%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          75% { transform: scale(1.05); }
        }
        
        @keyframes medical-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 ${color}40;
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 0 10px transparent;
          }
        }
        
        @keyframes medical-flow {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes medical-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes medical-alert {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes medical-success {
          0% { 
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
          100% { 
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

// Page Transition Container
export const PageTransition: React.FC<{
  children: ReactNode;
  transitionKey: string;
}> = ({ children, transitionKey }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [transitionKey]);

  return (
    <Transition
      type="medical-reveal"
      trigger={isVisible}
      duration={400}
      easing="ease-out"
    >
      {children}
    </Transition>
  );
};

// Card Reveal Animation
export const CardReveal: React.FC<{
  children: ReactNode;
  delay?: number;
  medical?: boolean;
}> = ({ children, delay = 0, medical = false }) => {
  return (
    <ScrollAnimation
      type={medical ? "medical-reveal" : "slide"}
      direction="up"
      distance={20}
      delay={delay}
      duration={500}
      easing="ease-out"
      threshold={0.2}
    >
      {children}
    </ScrollAnimation>
  );
};

// Text Reveal Animation
export const TextReveal: React.FC<{
  text: string;
  delay?: number;
  charDelay?: number;
}> = ({ text, delay = 0, charDelay = 50 }) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleChars(text.length);
      return;
    }

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleChars(prev => {
          if (prev >= text.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, charDelay);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay, charDelay, prefersReducedMotion]);

  return (
    <span>
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            opacity: index < visibleChars ? 1 : 0,
            transition: `opacity ${charDelay}ms ease-out`
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

// Floating Action Button com animação
export const FloatingActionButton: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  medical?: boolean;
}> = ({ children, onClick, position = 'bottom-right', medical = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPositionStyles = () => {
    const base = { position: 'fixed' as const, zIndex: 1000 };
    switch (position) {
      case 'bottom-right': return { ...base, bottom: '24px', right: '24px' };
      case 'bottom-left': return { ...base, bottom: '24px', left: '24px' };
      case 'top-right': return { ...base, top: '24px', right: '24px' };
      case 'top-left': return { ...base, top: '24px', left: '24px' };
    }
  };

  return (
    <div style={getPositionStyles()}>
      <Transition
        type="scale"
        trigger={true}
        duration={300}
        easing="ease-out"
      >
        <button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: medical ? '#0ea5e9' : '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: isHovered ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'float 3s ease-in-out infinite'
          }}
        >
          {children}
        </button>
      </Transition>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};