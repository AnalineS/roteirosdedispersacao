"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useServices, useAnalytics } from "@/providers/ServicesProvider";
import ProgressDashboard from "./ProgressDashboard";
import type {
  LearningProgress,
  Achievement,
  GamificationNotification,
} from "@/types/gamification";

// ============================================
// GAMIFICATION WIDGET PARA HOMEPAGE
// ============================================

interface GamificationWidgetProps {
  compact?: boolean;
  showOnlyOverview?: boolean;
  className?: string;
}

export default function GamificationWidget({
  compact = false,
  showOnlyOverview = false,
  className = "",
}: GamificationWidgetProps) {
  const { callAPI } = useServices();
  const analytics = useAnalytics();

  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<
    GamificationNotification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadGamificationData = useCallback(async () => {
    try {
      // Carregar dados reais via API
      const [progressData, achievementsData, notificationsData] =
        await Promise.all([
          callAPI<LearningProgress>("/api/gamification/progress"),
          callAPI<Achievement[]>("/api/gamification/achievements"),
          callAPI<GamificationNotification[]>(
            "/api/gamification/notifications",
          ),
        ]);

      if (progressData?.data) setProgress(progressData.data);
      if (achievementsData?.data) setAchievements(achievementsData.data);
      if (notificationsData?.data) setNotifications(notificationsData.data);
    } catch (error) {
      // Se APIs não estão disponíveis, não mostrar o widget
      console.log("Gamification APIs not available:", error);
      setProgress(null);
      setAchievements([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [callAPI]);

  useEffect(() => {
    // Carregar dados iniciais
    loadGamificationData();

    // Track widget view
    analytics.trackUserAction("gamification_widget_view", "engagement", {
      compact,
      showOnlyOverview,
    });

    // Show widget after small delay for better UX
    setTimeout(() => setIsVisible(true), 500);
  }, [analytics, compact, showOnlyOverview, loadGamificationData]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleAchievementClick = (achievement: Achievement) => {
    analytics.trackUserAction("achievement_clicked", "gamification", {
      achievementId: achievement.id,
      isUnlocked: achievement.isUnlocked,
    });
  };

  const handleStartTutorial = () => {
    analytics.trackUserAction("gamification_tutorial_start", "education");
    // TODO: Implementar tutorial
    alert("Tutorial de gamificação em desenvolvimento!");
  };

  // ============================================
  // RENDER CONDITIONS
  // ============================================

  if (isLoading) {
    return (
      <div className={className}>
        <div className="bg-gray-50 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null; // Não mostrar widget se não há dados reais
  }

  // ============================================
  // COMPACT VERSION FOR HOMEPAGE
  // ============================================

  if (compact) {
    return (
      <div
        className={`${className} ${isVisible ? "animate-fade-in" : "opacity-0"}`}
      >
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Seu Progresso Educacional
              </h3>
              <p className="text-sm text-gray-600">
                Nível {progress.experiencePoints.level} •{" "}
                {progress.experiencePoints.total.toLocaleString()} XP
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <span className="text-2xl">🎓</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.streakData.currentStreak}
              </div>
              <div className="text-xs text-gray-600">Dias seguidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {achievements.filter((a) => a.isUnlocked).length}
              </div>
              <div className="text-xs text-gray-600">Conquistas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(progress.totalTimeSpent / 60)}h
              </div>
              <div className="text-xs text-gray-600">Tempo estudo</div>
            </div>
          </div>

          {notifications.filter((n) => !n.isRead).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🎉</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    {notifications[0].title}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {notifications[0].message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => {
                analytics.trackUserAction("view_full_progress", "gamification");
                window.location.href = "/progress";
              }}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Ver Detalhes
            </button>
            <button
              onClick={handleStartTutorial}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Tutorial
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // FULL DASHBOARD VERSION
  // ============================================

  return (
    <div
      className={`${className} ${isVisible ? "animate-fade-in" : "opacity-0"}`}
    >
      <ProgressDashboard
        progress={progress}
        availableAchievements={achievements}
        notifications={notifications}
        onAchievementClick={handleAchievementClick}
        onStartTutorial={handleStartTutorial}
      />
    </div>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

// Hook para usar gamificação em outros componentes
export function useGamification() {
  const analytics = useAnalytics();

  const trackLearningEvent = (
    eventType: "module_start" | "module_complete" | "quiz_complete",
    data: any,
  ) => {
    analytics.trackEducational(
      data.moduleId,
      eventType === "module_complete" ? "complete" : "start",
      data.score,
    );
  };

  const unlockAchievement = (achievementId: string) => {
    analytics.trackUserAction("achievement_unlocked", "gamification", {
      achievementId,
    });
  };

  return {
    trackLearningEvent,
    unlockAchievement,
  };
}
