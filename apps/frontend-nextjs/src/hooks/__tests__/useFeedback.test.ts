/**
 * Testes básicos para useFeedback hook
 * Cobertura: Estados, submissão, loading
 */

import { renderHook, act } from '@testing-library/react';
import { useFeedback, FeedbackData } from '../useFeedback';
import { apiClient } from '@/services/api';

// Mock apiClient
jest.mock('@/services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.onLine to be online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    mockApiClient.post.mockResolvedValue({
      message: 'Feedback enviado com sucesso',
      request_id: 'req-123',
      timestamp: new Date().toISOString(),
      feedback_summary: {
        rating: 5,
        has_comments: true
      }
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFeedback());
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSubmittedFeedback).toBeNull();
    expect(result.current.hasOfflineQueue).toBe(false);
  });

  it('should handle valid feedback submission', async () => {
    const { result } = renderHook(() => useFeedback());
    
    const validFeedback: FeedbackData = {
      messageId: 'msg-123',
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 5,
      comments: 'Great response',
      timestamp: Date.now()
    };
    
    await act(async () => {
      await result.current.submitFeedback(validFeedback);
    });
    
    expect(result.current.lastSubmittedFeedback).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/feedback', {
      question: validFeedback.question,
      response: validFeedback.response,
      rating: validFeedback.rating,
      comments: validFeedback.comments
    });
  });

  it('should validate required fields', async () => {
    const { result } = renderHook(() => useFeedback());
    
    const invalidFeedback = {
      messageId: '', // Invalid
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 5,
      timestamp: Date.now()
    } as FeedbackData;
    
    await act(async () => {
      try {
        await result.current.submitFeedback(invalidFeedback);
      } catch {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toContain('obrigatórios');
  });

  it('should validate rating range', async () => {
    const { result } = renderHook(() => useFeedback());
    
    const invalidRatingFeedback: FeedbackData = {
      messageId: 'msg-123',
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 10, // Invalid - should be 1-5
      timestamp: Date.now()
    };
    
    await act(async () => {
      try {
        await result.current.submitFeedback(invalidRatingFeedback);
      } catch {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toContain('entre 1 e 5');
  });

  it('should handle submission error', async () => {
    mockApiClient.post.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useFeedback({ retryAttempts: 1 }));
    
    const validFeedback: FeedbackData = {
      messageId: 'msg-123',
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 5,
      timestamp: Date.now()
    };
    
    let thrownError: Error | null = null;
    
    await act(async () => {
      try {
        await result.current.submitFeedback(validFeedback);
      } catch (error) {
        thrownError = error as Error;
      }
    });
    
    // The error should be thrown and also set in the hook state
    expect(thrownError).toBeTruthy();
    expect((thrownError as Error)?.message).toBe('Network error');
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Network error');
    expect(result.current.lastSubmittedFeedback).toBeNull();
  });

  it('should set loading state during submission', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockApiClient.post.mockReturnValueOnce(promise);
    
    const { result } = renderHook(() => useFeedback());
    
    const validFeedback: FeedbackData = {
      messageId: 'msg-123',
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 5,
      timestamp: Date.now()
    };
    
    act(() => {
      result.current.submitFeedback(validFeedback);
    });
    
    expect(result.current.isSubmitting).toBe(true);
    
    await act(async () => {
      resolvePromise!({
        message: 'Success',
        request_id: 'req-123',
        timestamp: new Date().toISOString(),
        feedback_summary: { rating: 5, has_comments: false }
      });
      await promise;
    });
    
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should clear error state', () => {
    const { result } = renderHook(() => useFeedback());
    
    // Simulate error state
    act(() => {
      result.current.submitFeedback({
        messageId: '', // Invalid to trigger error
        personaId: 'test',
        question: 'test',
        response: 'test',
        rating: 1,
        timestamp: Date.now()
      } as FeedbackData).catch(() => {});
    });
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.lastSubmittedFeedback).toBeNull();
  });

  it('should have online status', () => {
    const { result } = renderHook(() => useFeedback());
    
    expect(typeof result.current.isOnline).toBe('boolean');
  });

  it('should handle optional comments', async () => {
    const { result } = renderHook(() => useFeedback());
    
    const feedbackWithoutComments: FeedbackData = {
      messageId: 'msg-123',
      personaId: 'dr_gasnelio',
      question: 'Test question',
      response: 'Test response',
      rating: 4,
      timestamp: Date.now()
      // No comments field
    };
    
    await act(async () => {
      await result.current.submitFeedback(feedbackWithoutComments);
    });
    
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/feedback', {
      question: feedbackWithoutComments.question,
      response: feedbackWithoutComments.response,
      rating: feedbackWithoutComments.rating,
      comments: '' // Should default to empty string
    });
  });

  it('should provide offline queue information', () => {
    const { result } = renderHook(() => useFeedback());
    
    expect(result.current.offlineQueue).toBe(0);
    expect(result.current.hasOfflineQueue).toBe(false);
    expect(typeof result.current.processOfflineQueue).toBe('function');
    expect(typeof result.current.loadOfflineQueue).toBe('function');
  });
});