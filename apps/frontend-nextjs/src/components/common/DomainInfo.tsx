'use client';

import { useEffect, useState } from 'react';
import SITE_CONFIG from '@/lib/config';

interface DomainInfoProps {
  showDebug?: boolean;
}

export default function DomainInfo({ showDebug = false }: DomainInfoProps) {
  const [domainInfo, setDomainInfo] = useState<{
    domain: string;
    baseUrl: string;
    isValid: boolean;
  } | null>(null);

  useEffect(() => {
    const domain = SITE_CONFIG.getCurrentDomain();
    const baseUrl = SITE_CONFIG.getBaseUrl();
    const isValid = SITE_CONFIG.isValidDomain(domain);

    setDomainInfo({
      domain,
      baseUrl,
      isValid
    });
  }, []);

  if (!showDebug || !domainInfo) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: domainInfo.isValid ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      opacity: 0.8
    }}>
      <div><strong>Domínio:</strong> {domainInfo.domain}</div>
      <div><strong>URL Base:</strong> {domainInfo.baseUrl}</div>
      <div><strong>Status:</strong> {domainInfo.isValid ? '✅ Válido' : '❌ Inválido'}</div>
    </div>
  );
}