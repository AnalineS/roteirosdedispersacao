'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 500,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const hideTooltip = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    setIsVisible(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideTooltip();
    }
  };

  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
    };
  }, [showTimeout]);

  const getTooltipStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      whiteSpace: 'nowrap' as const,
      zIndex: 1000,
      pointerEvents: 'none' as const,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' as const : 'hidden' as const,
      transition: 'opacity 0.2s ease, visibility 0.2s ease',
      transform: 'translate3d(0, 0, 0)', // GPU optimization
    };

    const positionStyles = {
      top: { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px) translate3d(0, 0, 0)' },
      bottom: { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px) translate3d(0, 0, 0)' },
      left: { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px) translate3d(0, 0, 0)' },
      right: { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px) translate3d(0, 0, 0)' }
    };

    return { ...baseStyles, ...positionStyles[position] };
  };

  const getArrowStyles = () => {
    const arrowBase = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    const arrowStyles = {
      top: {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid rgba(0, 0, 0, 0.9)',
      },
      bottom: {
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '6px solid rgba(0, 0, 0, 0.9)',
      },
      left: {
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderLeft: '6px solid rgba(0, 0, 0, 0.9)',
      },
      right: {
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderRight: '6px solid rgba(0, 0, 0, 0.9)',
      }
    };

    return { ...arrowBase, ...arrowStyles[position] };
  };

  return (
    <div
      ref={triggerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
    >
      {children}
      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!isVisible}
        style={getTooltipStyles()}
      >
        {content}
        <div style={getArrowStyles()} />
      </div>
    </div>
  );
}