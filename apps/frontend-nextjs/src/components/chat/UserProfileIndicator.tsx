'use client';

import { UserProfile, profileUtils } from '@/hooks/useUserProfile';

interface UserProfileIndicatorProps {
  profile: UserProfile | null;
  onChangeProfile?: () => void;
  compact?: boolean;
}

export default function UserProfileIndicator({ 
  profile, 
  onChangeProfile, 
  compact = false 
}: UserProfileIndicatorProps) {
  if (!profile) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        color: 'white',
        padding: compact ? '8px 12px' : '12px 16px',
        borderRadius: '8px',
        fontSize: compact ? '0.8rem' : '0.9rem',
        textAlign: 'center',
        cursor: onChangeProfile ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onClick={onChangeProfile}
      onMouseEnter={(e) => {
        if (onChangeProfile) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onChangeProfile) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      >
        <div style={{ fontSize: compact ? '1rem' : '1.2rem', marginBottom: '4px' }}>
          👤
        </div>
        <div style={{ fontWeight: 'bold' }}>
          Perfil não configurado
        </div>
        {onChangeProfile && (
          <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '4px' }}>
            Clique para personalizar
          </div>
        )}
      </div>
    );
  }

  const typeIcon = {
    admin: '🛡️',
    professional: '👨‍⚕️',
    student: '📚',
    patient: '🤗',
    caregiver: '💙'
  }[profile.type];

  const focusIcon = {
    technical: '🧬',
    practical: '💊',
    effects: '🌡️',
    general: '❓',
    empathetic: '💚'
  }[profile.focus];

  if (compact) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '16px',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: onChangeProfile ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onClick={onChangeProfile}
      title={`${profileUtils.getProfileTypeLabel(profile.type)} • ${profileUtils.getFocusLabel(profile.focus)}`}
      onMouseEnter={(e) => {
        if (onChangeProfile) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)';
        }
      }}
      onMouseLeave={(e) => {
        if (onChangeProfile) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)';
        }
      }}
      >
        <span>{typeIcon}</span>
        <span style={{ fontWeight: 'bold' }}>
          {profileUtils.getProfileTypeLabel(profile.type).split(' ')[0]}
        </span>
        <span style={{ opacity: 0.7 }}>•</span>
        <span>{focusIcon}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      cursor: onChangeProfile ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    }}
    onClick={onChangeProfile}
    onMouseEnter={(e) => {
      if (onChangeProfile) {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
      }
    }}
    onMouseLeave={(e) => {
      if (onChangeProfile) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '1.5rem' }}>{typeIcon}</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            {profileUtils.getProfileTypeLabel(profile.type)}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            Seu perfil configurado
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '1rem' }}>{focusIcon}</span>
        <span style={{ fontSize: '0.85rem' }}>
          {profileUtils.getFocusLabel(profile.focus)}
        </span>
      </div>

      {profile.selectedPersona && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '8px 10px',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '2px' }}>
            Assistente preferido:
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            {profile.selectedPersona === 'dr_gasnelio' ? '👨‍⚕️ Dr. Gasnelio' : '😊 Gá'}
          </div>
        </div>
      )}

      {profile.history && (
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '0.75rem',
          opacity: 0.7
        }}>
          <span>📊 {profile.history.conversationCount} conversas</span>
          <span>•</span>
          <span>📅 {new Date(profile.history.lastAccess).toLocaleDateString('pt-BR')}</span>
        </div>
      )}

      {onChangeProfile && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          opacity: 0.8,
          textAlign: 'center'
        }}>
          Clique para editar perfil
        </div>
      )}
    </div>
  );
}