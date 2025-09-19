/**
 * NotificationSystem - Sistema de notificações push para achievements
 * Notificações discretas e celebrações visuais baseadas no tipo de conquista
 * Integração com Web Push API para notificações nativas
 */

'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import type {
  GamificationNotification,
  Achievement
} from '@/types/gamification';
import BadgeCard from './BadgeCard';

// Interface para dados de notificação nativa
interface NotificationData {
  notificationId?: string;
  navigateToGamification?: boolean;
  [key: string]: unknown;
}

// Interface WindowWithGtag para gtag tracking
interface WindowWithGtag extends Window {
  gtag?: (
    command: 'event' | 'config',
    eventNameOrId: string,
    parameters?: {
      event_category?: string;
      event_label?: string;
      value?: number;
      custom_parameters?: Record<string, unknown>;
      [key: string]: unknown;
    }
  ) => void;
}

// Helper para acessar gtag de forma type-safe
function getWindowWithGtag(): WindowWithGtag | null {
  return typeof window !== 'undefined' ? (window as WindowWithGtag) : null;
}

interface NotificationContextType {
  showNotification: (notification: GamificationNotification) => void;
  showAchievementCelebration: (achievement: Achievement) => void;
  requestNotificationPermission: () => Promise<boolean>;
  isNotificationEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// ============================================================================
// TOAST NOTIFICATION COMPONENT
// ============================================================================

interface ToastNotificationProps {
  notification: GamificationNotification;
  onClose: () => void;
}

function ToastNotification({ notification, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, notification.celebrationType === 'visual' ? 5000 : 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.celebrationType]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
        return '🏆';
      case 'level_up':
        return '🎉';
      case 'streak_milestone':
        return '🔥';
      case 'quiz_completed':
        return '🧠';
      case 'module_completed':
        return '📚';
      default:
        return '📝';
    }
  };

  const getNotificationStyle = () => {
    const baseStyle = `
      fixed top-4 right-4 z-50 max-w-sm w-full
      bg-white rounded-lg shadow-lg border-l-4 p-4
      transform transition-all duration-300 ease-out
    `;

    if (isExiting) {
      return baseStyle + ' translate-x-full opacity-0';
    }

    switch (notification.type) {
      case 'achievement_unlocked':
        return baseStyle + ' border-yellow-500 animate-fadeInScale';
      case 'level_up':
        return baseStyle + ' border-purple-500 animate-bounce';
      case 'streak_milestone':
        return baseStyle + ' border-orange-500 animate-pulse';
      default:
        return baseStyle + ' border-blue-500 animate-fadeIn';
    }
  };

  return (
    <div className={getNotificationStyle()}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          
          {notification.data.xpGained && (
            <div className="mt-2 text-xs text-blue-600 font-medium">
              +{notification.data.xpGained} XP
            </div>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
      
      {notification.celebrationType === 'visual' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACHIEVEMENT CELEBRATION MODAL
// ============================================================================

interface AchievementCelebrationProps {
  achievement: Achievement;
  onClose: () => void;
}

function AchievementCelebration({ achievement, onClose }: AchievementCelebrationProps) {
  const [showFireworks, setShowFireworks] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Fireworks background */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="fireworks-container">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`firework firework-${i + 1}`}
                style={{
                  '--delay': `${i * 0.3}s`,
                  left: `${20 + (i * 12)}%`,
                  top: `${10 + (i % 2) * 20}%`
                } as React.CSSProperties}
              >
                ✨
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Achievement card */}
      <div className="relative z-10">
        <BadgeCard
          achievement={achievement}
          variant="celebration"
          size="xl"
          onClick={onClose}
        />
      </div>
      
      <style jsx>{`
        .fireworks-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .firework {
          position: absolute;
          font-size: 2rem;
          animation: fireworks 2s ease-out var(--delay, 0s);
        }
        
        @keyframes fireworks {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) rotate(540deg);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// NOTIFICATION PROVIDER
// ============================================================================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);

  // ============================================================================
  // WEB PUSH NOTIFICATIONS
  // ============================================================================

  useEffect(() => {
    // Verificar se notificações já foram concedidas
    if ('Notification' in window) {
      setIsNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      const windowWithGtag = getWindowWithGtag();
      if (windowWithGtag?.gtag) {
        windowWithGtag.gtag('event', 'notification_unsupported', {
          event_category: 'gamification',
          event_label: 'browser_compatibility_issue',
          custom_parameters: {
            browser: navigator.userAgent
          }
        });
      }
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isEnabled = permission === 'granted';
      setIsNotificationEnabled(isEnabled);
      
      if (isEnabled) {
        // Notificação de teste
        showNativeNotification(
          '🎮 Gamificação Ativada!',
          'Você receberá notificações sobre suas conquistas',
          '/favicon.png'
        );
      }
      
      return isEnabled;
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'notification_permission_error', {
          event_category: 'gamification_error',
          event_label: 'permission_request_failed',
          custom_parameters: {
            medical_context: 'notification_system',
            error_type: 'permission_api'
          }
        });
      }
      return false;
    }
  };

  const showNativeNotification = (
    title: string,
    body: string,
    icon?: string,
    data?: NotificationData
  ) => {
    if (!isNotificationEnabled) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.png',
        badge: '/icon-192.png',
        data,
        requireInteraction: false,
        silent: false
      });

      // Auto-close após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navegar para gamification se necessário
        if (data?.navigateToGamification) {
          window.location.href = '/gamification-demo';
        }
      };
    } catch (error) {
      const windowWithGtag = getWindowWithGtag();
      if (windowWithGtag?.gtag) {
        windowWithGtag.gtag('event', 'notification_display_error', {
          event_category: 'gamification_error',
          event_label: 'native_notification_failed',
          custom_parameters: {
            medical_context: 'notification_system',
            error_type: 'display_api'
          }
        });
      }
    }
  };

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  const showNotification = (notification: GamificationNotification) => {
    // Adicionar à lista de notificações toast
    setNotifications(prev => [...prev, notification]);

    // Mostrar notificação nativa se habilitada
    if (isNotificationEnabled) {
      const nativeTitle = notification.title;
      const nativeBody = notification.message;
      const nativeIcon = notification.type === 'achievement_unlocked' ? '/icon-512.png' : '/favicon.png';
      
      showNativeNotification(
        nativeTitle,
        nativeBody,
        nativeIcon,
        { 
          notificationId: notification.id,
          navigateToGamification: true
        }
      );
    }
  };

  const showAchievementCelebration = (achievement: Achievement) => {
    if (achievement.celebrationType === 'visual') {
      setCelebrationAchievement(achievement);
    }

    // Criar notificação para o achievement
    const notification: GamificationNotification = {
      id: `celebration_${achievement.id}_${Date.now()}`,
      type: 'achievement_unlocked',
      title: '🏆 Nova Conquista!',
      message: `Você desbloqueou: ${achievement.title}`,
      celebrationType: achievement.celebrationType,
      data: {
        achievementId: achievement.id,
        xpGained: achievement.xpReward
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    showNotification(notification);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const closeCelebration = () => {
    setCelebrationAchievement(null);
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: NotificationContextType = {
    showNotification,
    showAchievementCelebration,
    requestNotificationPermission,
    isNotificationEnabled
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
      
      {/* Achievement celebration modal */}
      {celebrationAchievement && (
        <AchievementCelebration
          achievement={celebrationAchievement}
          onClose={closeCelebration}
        />
      )}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// NOTIFICATION PERMISSION BUTTON
// ============================================================================

export function NotificationPermissionButton() {
  const { requestNotificationPermission, isNotificationEnabled } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    await requestNotificationPermission();
    setIsRequesting(false);
  };

  if (isNotificationEnabled) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <span>✅</span>
        <span className="text-sm">Notificações ativadas</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isRequesting}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
    >
      <span>🔔</span>
      <span className="text-sm">
        {isRequesting ? 'Solicitando...' : 'Ativar Notificações'}
      </span>
    </button>
  );
}

export default NotificationProvider;