/**
 * Componente de Badges para Conteúdo Médico
 * Sistema integrado de badges de urgência para diferentes contextos médicos
 */

'use client';

import React from 'react';
import { UrgencyBadge, MedicationUrgencyBadge } from '@/components/ui/UrgencyBadge';
import { getUrgencyFromKeywords, UrgencyLevel } from '@/types/urgencyBadges';

interface MedicalContentBadgesProps {
  content: string;
  type?: 'content' | 'question' | 'answer' | 'module' | 'resource';
  medications?: {
    hasInteraction?: boolean;
    hasContraindication?: boolean;
    needsMonitoring?: boolean;
    needsDosageAdjustment?: boolean;
  };
  context?: 'emergency' | 'routine' | 'educational';
  showUrgencyBadge?: boolean;
  className?: string;
}

export function MedicalContentBadges({
  content,
  type = 'content',
  medications,
  context = 'routine',
  showUrgencyBadge = true,
  className = ''
}: MedicalContentBadgesProps) {
  const urgency = getUrgencyFromKeywords(content);
  const shouldShowUrgency = showUrgencyBadge && (urgency === 'critical' || urgency === 'high');

  return (
    <div className={`medical-content-badges ${className}`} style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'center'
    }}>
      {/* Badge de urgência baseado no conteúdo */}
      {shouldShowUrgency && (
        <UrgencyBadge
          urgency={urgency}
          size="sm"
          variant="filled"
          showPulse={urgency === 'critical'}
        />
      )}

      {/* Badges específicos para medicamentos */}
      {medications && (
        <MedicationUrgencyBadge
          interaction={medications.hasInteraction}
          contraindication={medications.hasContraindication}
          monitoring={medications.needsMonitoring}
          dosageAdjustment={medications.needsDosageAdjustment}
        />
      )}

      {/* Badge de contexto para emergência */}
      {context === 'emergency' && urgency !== 'critical' && (
        <UrgencyBadge
          urgency="high"
          label="EMERGÊNCIA"
          size="sm"
          variant="outline"
        />
      )}

      {/* Badge para conteúdo educacional avançado */}
      {type === 'module' && content.toLowerCase().includes('avançado') && (
        <UrgencyBadge
          urgency="info"
          label="AVANÇADO"
          size="sm"
          variant="minimal"
          showIcon={false}
        />
      )}
    </div>
  );
}

// Componente específico para navegação
export function NavigationBadges({
  path,
  label,
  description,
  isProtected = false,
  requiresAuth = false,
  className = ''
}: {
  path: string;
  label: string;
  description?: string;
  isProtected?: boolean;
  requiresAuth?: boolean;
  className?: string;
}) {
  const urgency = getUrgencyFromKeywords(`${label} ${description || ''}`);
  const isEmergencyPath = path.includes('emergency') || path.includes('critical');
  const isAdminPath = path.includes('admin') || path.includes('settings');

  return (
    <div className={`navigation-badges ${className}`} style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    }}>
      {/* Badge para seções de emergência */}
      {isEmergencyPath && (
        <UrgencyBadge
          urgency="critical"
          size="xs"
          variant="filled"
          showIcon={false}
          label="!"
          showPulse
        />
      )}

      {/* Badge para conteúdo protegido */}
      {isProtected && (
        <UrgencyBadge
          urgency="medium"
          size="xs"
          variant="minimal"
          showIcon={false}
          label="PROTEGIDO"
        />
      )}

      {/* Badge para seções administrativas */}
      {isAdminPath && (
        <UrgencyBadge
          urgency="info"
          size="xs"
          variant="minimal"
          showIcon={false}
          label="ADMIN"
        />
      )}

      {/* Badge de urgência baseado no conteúdo */}
      {urgency === 'critical' && !isEmergencyPath && (
        <UrgencyBadge
          urgency="critical"
          size="xs"
          variant="minimal"
          showIcon={false}
          label="!"
        />
      )}
    </div>
  );
}

// Componente para chat/mensagens
export function ChatMessageBadges({
  message,
  persona,
  hasWarning = false,
  hasCriticalInfo = false,
  className = ''
}: {
  message: string;
  persona?: 'gasnelio' | 'ga';
  hasWarning?: boolean;
  hasCriticalInfo?: boolean;
  className?: string;
}) {
  const urgency = getUrgencyFromKeywords(message);

  return (
    <div className={`chat-message-badges ${className}`} style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      marginTop: '4px'
    }}>
      {/* Badge para informações críticas */}
      {hasCriticalInfo && (
        <UrgencyBadge
          urgency="critical"
          size="xs"
          label="IMPORTANTE"
          variant="filled"
        />
      )}

      {/* Badge para avisos */}
      {hasWarning && (
        <UrgencyBadge
          urgency="high"
          size="xs"
          label="ATENÇÃO"
          variant="outline"
        />
      )}

      {/* Badge automático baseado no conteúdo */}
      {(urgency === 'critical' || urgency === 'high') && !hasCriticalInfo && !hasWarning && (
        <UrgencyBadge
          urgency={urgency}
          size="xs"
          variant="minimal"
          showIcon={false}
          label={urgency === 'critical' ? '!' : 'ATENÇÃO'}
        />
      )}

      {/* Badge para persona Dr. Gasnelio em conteúdo técnico */}
      {persona === 'gasnelio' && message.toLowerCase().includes('técnico') && (
        <UrgencyBadge
          urgency="info"
          size="xs"
          label="TÉCNICO"
          variant="minimal"
          showIcon={false}
        />
      )}
    </div>
  );
}

// Hook para gerenciar badges em listas
export function useMedicalBadges() {
  const getBadgesForContent = (content: string) => {
    const urgency = getUrgencyFromKeywords(content);
    const badges = [];

    if (urgency === 'critical') {
      badges.push({
        type: 'urgency',
        urgency: 'critical',
        label: 'CRÍTICO',
        pulse: true
      });
    } else if (urgency === 'high') {
      badges.push({
        type: 'urgency',
        urgency: 'high',
        label: 'ALTO'
      });
    }

    // Badges específicos por palavra-chave
    if (content.toLowerCase().includes('contraindicado')) {
      badges.push({
        type: 'medication',
        urgency: 'critical',
        label: 'CONTRAINDICADO'
      });
    }

    if (content.toLowerCase().includes('interação')) {
      badges.push({
        type: 'medication',
        urgency: 'high',
        label: 'INTERAÇÃO'
      });
    }

    if (content.toLowerCase().includes('monitorar')) {
      badges.push({
        type: 'monitoring',
        urgency: 'medium',
        label: 'MONITORAR'
      });
    }

    return badges;
  };

  const getHighestUrgency = (contents: string[]): UrgencyLevel => {
    const urgencies = contents.map(getUrgencyFromKeywords);
    
    if (urgencies.includes('critical')) return 'critical';
    if (urgencies.includes('high')) return 'high';
    if (urgencies.includes('medium')) return 'medium';
    if (urgencies.includes('low')) return 'low';
    
    return 'info';
  };

  return {
    getBadgesForContent,
    getHighestUrgency
  };
}

export default MedicalContentBadges;