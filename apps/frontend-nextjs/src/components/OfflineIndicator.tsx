'use client';

import { useOfflineDetection } from '@/hooks/useOfflineDetection';

export default function OfflineIndicator() {
  const { isOffline, lastOnline } = useOfflineDetection();

  if (!isOffline) return null;

  const formatLastOnline = (date: Date | null) => {
    if (!date) return 'há algum tempo';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
      color: 'white',
      padding: '8px 16px',
      fontSize: '0.9rem',
      textAlign: 'center',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>📡</span>
        <span>
          <strong>Modo Offline</strong> - Última conexão {formatLastOnline(lastOnline)}
        </span>
      </div>
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}