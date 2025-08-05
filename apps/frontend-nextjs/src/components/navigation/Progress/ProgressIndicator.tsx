'use client';

import { ProgressData } from './index';

interface ProgressIndicatorProps {
  progress: ProgressData;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  interactive?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'circular';
}

export default function ProgressIndicator({ 
  progress, 
  size = 'medium', 
  showDetails = true,
  interactive = false,
  orientation = 'horizontal'
}: ProgressIndicatorProps) {
  
  const getSize = () => {
    switch (size) {
      case 'small': return { width: '80px', height: '8px', fontSize: '0.7rem' };
      case 'medium': return { width: '120px', height: '12px', fontSize: '0.85rem' };
      case 'large': return { width: '200px', height: '16px', fontSize: '1rem' };
      default: return { width: '120px', height: '12px', fontSize: '0.85rem' };
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#1976d2';
      case 'not-started': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getCategoryIcon = () => {
    switch (progress.category) {
      case 'learning': return '📚';
      case 'interaction': return '💬';
      case 'progress': return '📊';
      case 'tools': return '🛠️';
      default: return '📋';
    }
  };

  const sizing = getSize();
  const statusColor = getStatusColor();

  if (orientation === 'circular') {
    const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
    const strokeWidth = size === 'small' ? 3 : size === 'large' ? 6 : 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress.completionRate / 100) * circumference;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Circular Progress */}
        <div style={{ position: 'relative' }}>
          <svg
            width={(radius + strokeWidth) * 2}
            height={(radius + strokeWidth) * 2}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background circle */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="#e0e0e0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke={statusColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          
          {/* Center content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.2rem' }}>
              {getCategoryIcon()}
            </div>
            <div style={{
              fontSize: size === 'small' ? '0.7rem' : size === 'large' ? '1rem' : '0.85rem',
              fontWeight: 'bold',
              color: statusColor
            }}>
              {progress.completionRate}%
            </div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: sizing.fontSize,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '2px'
            }}>
              {progress.moduleName}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: '#666'
            }}>
              {progress.completedSteps}/{progress.totalSteps} completo
            </div>
          </div>
        )}
      </div>
    );
  }

  if (orientation === 'vertical') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '10px'
      }}>
        {/* Module info */}
        {showDetails && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
              {getCategoryIcon()}
            </div>
            <div style={{
              fontSize: sizing.fontSize,
              fontWeight: 'bold',
              color: '#333'
            }}>
              {progress.moduleName}
            </div>
          </div>
        )}

        {/* Vertical progress bar */}
        <div style={{
          width: '12px',
          height: '100px',
          background: '#e0e0e0',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${progress.completionRate}%`,
            background: statusColor,
            borderRadius: '6px',
            transition: 'height 0.5s ease'
          }} />
        </div>

        {/* Progress text */}
        <div style={{
          fontSize: sizing.fontSize,
          fontWeight: 'bold',
          color: statusColor
        }}>
          {progress.completionRate}%
        </div>

        {/* Additional details */}
        {showDetails && (
          <div style={{
            fontSize: '0.7rem',
            color: '#666',
            textAlign: 'center'
          }}>
            {progress.completedSteps}/{progress.totalSteps}
            {progress.estimatedTime && (
              <div>⏱️ {progress.estimatedTime}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Horizontal progress (default)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: interactive ? '8px' : '4px',
      borderRadius: '8px',
      background: interactive ? '#f8fafc' : 'transparent',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    }}>
      {/* Category icon */}
      <div style={{ fontSize: size === 'small' ? '1rem' : '1.2rem' }}>
        {getCategoryIcon()}
      </div>

      {/* Progress bar container */}
      <div style={{ flex: 1 }}>
        {/* Module name */}
        {showDetails && (
          <div style={{
            fontSize: sizing.fontSize,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '4px'
          }}>
            {progress.moduleName}
          </div>
        )}

        {/* Progress bar */}
        <div style={{
          width: sizing.width,
          height: sizing.height,
          background: '#e0e0e0',
          borderRadius: sizing.height,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress.completionRate}%`,
            background: statusColor,
            borderRadius: sizing.height,
            transition: 'width 0.5s ease'
          }} />
          
          {/* Current step indicator */}
          {progress.currentStep && progress.status === 'in-progress' && (
            <div style={{
              position: 'absolute',
              left: `${(progress.currentStep / progress.totalSteps) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '50%',
              border: `2px solid ${statusColor}`,
              animation: 'pulse 2s infinite'
            }} />
          )}
        </div>

        {/* Progress details */}
        {showDetails && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px'
          }}>
            <span style={{
              fontSize: '0.7rem',
              color: '#666'
            }}>
              {progress.completedSteps}/{progress.totalSteps} passos
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: statusColor
            }}>
              {progress.completionRate}%
            </span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: statusColor,
        flexShrink: 0
      }} />

      {/* Global styles for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}