// Backend API Leaderboard Service - Fully Functional Implementation

import type { LearningProgress } from '@/types/gamification';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Types for API responses
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  level: number;
  xp: number;
  streak_days: number;
  rank: number;
  updated_at: string;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  metadata: {
    total_entries: number;
    showing: number;
    timeframe: string;
    last_updated: string;
    request_id: string;
  };
}

interface UserProgress {
  user_id: string;
  display_name: string;
  total_points: number;
  level: number;
  xp: number;
  streak_days: number;
  last_activity: string;
  modules_completed: number;
  quiz_scores: number[];
  achievements: string[];
  created_at: string;
  updated_at: string;
}

interface ProgressResponse {
  progress: UserProgress;
  achievements_available: any[];
  next_level_xp: number;
  request_id: string;
  timestamp: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Backend leaderboard service implementation
export const backendLeaderboard = {
  getLeaderboard: async (timeFrame: string = 'all_time', limit: number = 20): Promise<APIResponse<LeaderboardEntry[]>> => {
    const result = await apiCall<LeaderboardResponse>(
      `/api/v1/gamification/leaderboard?timeframe=${timeFrame}&limit=${limit}`
    );

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.leaderboard
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to fetch leaderboard'
    };
  },

  syncUserProgress: async (userId: string, progress: LearningProgress, displayName: string): Promise<APIResponse<UserProgress>> => {
    // Convert LearningProgress to backend activity format
    const activityData = {
      type: 'progress_sync',
      points: progress.experiencePoints?.total || 0,
      modules_completed: progress.moduleProgress?.filter(m => m.status === 'completed').length || 0,
      streak_days: progress.streakData?.currentStreak || 0
    };

    const result = await apiCall<ProgressResponse>('/api/v1/gamification/progress', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName,
        activity: activityData
      })
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.progress
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to sync user progress'
    };
  },

  updateUserEntry: async (userId: string, entry: Partial<LearningProgress>): Promise<APIResponse<UserProgress>> => {
    // Update user progress with specific entry data
    const displayName = entry.userId || 'Anonymous User';

    // Determine activity type based on entry content
    let activityData: any = { type: 'general_update' };

    if (entry.experiencePoints?.total) {
      activityData = {
        type: 'points_update',
        points: entry.experiencePoints.total
      };
    }

    if (entry.moduleProgress?.length) {
      const completedModules = entry.moduleProgress.filter(m => m.status === 'completed').length;
      activityData = {
        type: 'module_complete',
        modules_completed: completedModules
      };
    }

    if (entry.quizStats?.averageScore) {
      activityData = {
        type: 'quiz_complete',
        score: entry.quizStats.averageScore
      };
    }

    const result = await apiCall<ProgressResponse>('/api/v1/gamification/progress', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName,
        activity: activityData
      })
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.progress
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to update user entry'
    };
  },

  getUserProgress: async (userId: string): Promise<APIResponse<UserProgress>> => {
    const result = await apiCall<ProgressResponse>(`/api/v1/gamification/progress/${userId}`);

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.progress
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to get user progress'
    };
  },

  subscribeToLeaderboard: (callback: (entries: LeaderboardEntry[]) => void, timeFrame: string = 'all_time', limit: number = 20) => {
    // Implement polling-based subscription since WebSocket might be complex
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const result = await backendLeaderboard.getLeaderboard(timeFrame, limit);
        if (result.success && result.data) {
          callback(result.data);
        }
      } catch (error) {
        console.warn('Failed to poll leaderboard:', error);
      }

      // Poll every 30 seconds
      if (isActive) {
        setTimeout(poll, 30000);
      }
    };

    // Initial fetch
    poll();

    // Return unsubscribe function
    return () => {
      isActive = false;
    };
  },

  // Additional utility functions
  recordActivity: async (userId: string, displayName: string, activityType: string, data: any = {}): Promise<APIResponse<UserProgress>> => {
    const result = await apiCall<ProgressResponse>('/api/v1/gamification/progress', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName,
        activity: {
          type: activityType,
          ...data
        }
      })
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.progress
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to record activity'
    };
  }
};