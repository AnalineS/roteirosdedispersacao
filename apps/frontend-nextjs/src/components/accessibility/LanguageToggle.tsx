'use client';

import { modernChatTheme } from '@/config/modernTheme';
import { useTextSimplification } from '@/hooks/useMedicalGlossary';

interface LanguageToggleProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'relative';
  showLabels?: boolean;
  onChange?: (isSimple: boolean) => void;
}

export default function LanguageToggle({ 
  size = 'medium',
  position = 'relative',
  showLabels = true,
  onChange 
}: LanguageToggleProps) {
  const { isSimpleMode, setIsSimpleMode } = useTextSimplification();

  const handleToggle = () => {
    const newMode = !isSimpleMode;
    setIsSimpleMode(newMode);
    onChange?.(newMode);
  };

  const sizes = {
    small: {
      toggle: { width: '44px', height: '24px' },
      knob: { width: '20px', height: '20px' },
      fontSize: '12px',
      padding: '8px'
    },
    medium: {
      toggle: { width: '52px', height: '28px' },
      knob: { width: '24px', height: '24px' },
      fontSize: '14px',
      padding: '12px'
    },
    large: {
      toggle: { width: '60px', height: '32px' },
      knob: { width: '28px', height: '28px' },
      fontSize: '16px',
      padding: '16px'
    }
  };

  const currentSize = sizes[size];

  return (
    <div
      style={{
        position,
        ...(position === 'fixed' ? {
          top: '80px',
          right: '20px',
          zIndex: 1000
        } : {}),
        background: 'white',
        padding: currentSize.padding,
        borderRadius: modernChatTheme.borderRadius.md,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        boxShadow: position === 'fixed' ? modernChatTheme.shadows.moderate : 'none'
      }}
    >
      <div
        role="group"
        aria-labelledby="language-toggle-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm
        }}
      >
        {showLabels && (
          <div 
            id="language-toggle-label"
            style={{
              fontSize: currentSize.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginRight: modernChatTheme.spacing.xs
            }}
          >
            Linguagem:
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm
        }}>
          {showLabels && (
            <label
              htmlFor="language-toggle"
              style={{
                fontSize: currentSize.fontSize,
                color: !isSimpleMode ? modernChatTheme.colors.unb.primary : modernChatTheme.colors.neutral.textMuted,
                fontWeight: !isSimpleMode ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              Técnica
            </label>
          )}

          <button
            id="language-toggle"
            onClick={handleToggle}
            role="switch"
            aria-checked={isSimpleMode}
            aria-label={`Alternar para linguagem ${isSimpleMode ? 'técnica' : 'simples'}`}
            aria-describedby="toggle-description"
            style={{
              position: 'relative',
              width: currentSize.toggle.width,
              height: currentSize.toggle.height,
              backgroundColor: isSimpleMode ? modernChatTheme.colors.personas.ga.primary : modernChatTheme.colors.neutral.border,
              border: 'none',
              borderRadius: currentSize.toggle.height,
              cursor: 'pointer',
              transition: 'all 300ms ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${isSimpleMode ? modernChatTheme.colors.personas.ga.primary : modernChatTheme.colors.unb.primary}40`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: isSimpleMode ? `calc(100% - ${currentSize.knob.width} - 2px)` : '2px',
                width: currentSize.knob.width,
                height: currentSize.knob.height,
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
              }}
            >
              {isSimpleMode ? '😊' : '🔬'}
            </div>
          </button>

          {showLabels && (
            <label
              htmlFor="language-toggle"
              style={{
                fontSize: currentSize.fontSize,
                color: isSimpleMode ? modernChatTheme.colors.personas.ga.primary : modernChatTheme.colors.neutral.textMuted,
                fontWeight: isSimpleMode ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              Simples
            </label>
          )}
        </div>
      </div>

      {showLabels && (
        <div
          id="toggle-description"
          style={{
            fontSize: '12px',
            color: modernChatTheme.colors.neutral.textMuted,
            marginTop: modernChatTheme.spacing.xs,
            textAlign: 'center'
          }}
        >
          {isSimpleMode 
            ? 'Termos médicos em linguagem acessível' 
            : 'Terminologia médica técnica'
          }
        </div>
      )}

      {/* Status announcement for screen readers */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {isSimpleMode 
          ? 'Linguagem simples ativada. Os termos médicos serão explicados de forma acessível.' 
          : 'Linguagem técnica ativada. Os termos médicos serão apresentados em formato científico.'
        }
      </div>
    </div>
  );
}

// Componente wrapper que aplica simplificação automática ao texto
interface SimplifiedTextProps {
  children: string;
  fallback?: string;
}

export function SimplifiedText({ children, fallback }: SimplifiedTextProps) {
  const { simplifyText } = useTextSimplification();
  
  const simplifiedContent = simplifyText(children);
  
  return (
    <span title={children !== simplifiedContent ? `Termo original: ${children}` : undefined}>
      {simplifiedContent || fallback || children}
    </span>
  );
}