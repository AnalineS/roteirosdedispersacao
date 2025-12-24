/**
 * Tests for useRegenerateTracking - Issue #331
 * Coverage: Regenerate attempt limiting, tracking state
 */

import { renderHook, act } from '@testing-library/react';
import { useRegenerateTracking } from '../useRegenerateTracking';

describe('useRegenerateTracking - Issue #331', () => {
  describe('Initial State', () => {
    it('should initialize with default max attempts (3)', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      expect(result.current.maxAttempts).toBe(3);
    });

    it('should allow regenerate for new message IDs', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      expect(result.current.canRegenerate('new-message-id')).toBe(true);
    });

    it('should return 0 attempts for new message IDs', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      expect(result.current.getRegenerateCount('new-message-id')).toBe(0);
    });
  });

  describe('Tracking Regenerate Attempts', () => {
    it('should track regenerate attempt and increment count', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        const allowed = result.current.trackRegenerate('msg-1');
        expect(allowed).toBe(true);
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(1);
    });

    it('should allow up to 3 regenerate attempts', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      // First attempt
      act(() => {
        expect(result.current.trackRegenerate('msg-1')).toBe(true);
      });
      expect(result.current.getRegenerateCount('msg-1')).toBe(1);

      // Second attempt
      act(() => {
        expect(result.current.trackRegenerate('msg-1')).toBe(true);
      });
      expect(result.current.getRegenerateCount('msg-1')).toBe(2);

      // Third attempt
      act(() => {
        expect(result.current.trackRegenerate('msg-1')).toBe(true);
      });
      expect(result.current.getRegenerateCount('msg-1')).toBe(3);
    });

    it('should not allow more than 3 attempts', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      // Use up all 3 attempts
      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
      });

      // Fourth attempt should be blocked
      act(() => {
        const allowed = result.current.trackRegenerate('msg-1');
        expect(allowed).toBe(false);
      });

      // Count should remain at 3
      expect(result.current.getRegenerateCount('msg-1')).toBe(3);
    });

    it('should track attempts independently for different messages', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-2');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(2);
      expect(result.current.getRegenerateCount('msg-2')).toBe(1);
    });
  });

  describe('Can Regenerate Check', () => {
    it('should return true when under limit', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
      });

      expect(result.current.canRegenerate('msg-1')).toBe(true);
    });

    it('should return false when limit reached', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
      });

      expect(result.current.canRegenerate('msg-1')).toBe(false);
    });

    it('should return true for different message even if one is at limit', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
      });

      expect(result.current.canRegenerate('msg-1')).toBe(false);
      expect(result.current.canRegenerate('msg-2')).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset regenerate count for specific message', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(2);

      act(() => {
        result.current.resetRegenerateCount('msg-1');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(0);
      expect(result.current.canRegenerate('msg-1')).toBe(true);
    });

    it('should reset all regenerate counts', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-2');
        result.current.trackRegenerate('msg-3');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(1);
      expect(result.current.getRegenerateCount('msg-2')).toBe(1);

      act(() => {
        result.current.clearAllCounts();
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(0);
      expect(result.current.getRegenerateCount('msg-2')).toBe(0);
      expect(result.current.getRegenerateCount('msg-3')).toBe(0);
    });

    it('should not affect other messages when resetting one', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-2');
      });

      act(() => {
        result.current.resetRegenerateCount('msg-1');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(0);
      expect(result.current.getRegenerateCount('msg-2')).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message IDs gracefully', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      expect(result.current.canRegenerate('')).toBe(true);
      expect(result.current.getRegenerateCount('')).toBe(0);

      act(() => {
        result.current.trackRegenerate('');
      });

      expect(result.current.getRegenerateCount('')).toBe(1);
    });

    it('should handle very long message IDs', () => {
      const { result } = renderHook(() => useRegenerateTracking());
      const longId = 'msg-' + 'a'.repeat(1000);

      expect(result.current.canRegenerate(longId)).toBe(true);

      act(() => {
        result.current.trackRegenerate(longId);
      });

      expect(result.current.getRegenerateCount(longId)).toBe(1);
    });

    it('should maintain state across multiple operations', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-2');
        result.current.trackRegenerate('msg-1');
        result.current.resetRegenerateCount('msg-2');
        result.current.trackRegenerate('msg-3');
        result.current.trackRegenerate('msg-1');
      });

      expect(result.current.getRegenerateCount('msg-1')).toBe(3);
      expect(result.current.getRegenerateCount('msg-2')).toBe(0);
      expect(result.current.getRegenerateCount('msg-3')).toBe(1);
    });
  });

  describe('Limit Enforcement', () => {
    it('should enforce max attempts consistently', () => {
      const { result } = renderHook(() => useRegenerateTracking());
      const messageId = 'test-msg';

      // Try to track 10 attempts, but only 3 should succeed
      let successCount = 0;
      act(() => {
        for (let i = 0; i < 10; i++) {
          if (result.current.trackRegenerate(messageId)) {
            successCount++;
          }
        }
      });

      expect(successCount).toBe(3);
      expect(result.current.getRegenerateCount(messageId)).toBe(3);
      expect(result.current.canRegenerate(messageId)).toBe(false);
    });

    it('should prevent regeneration after limit even with reset of other messages', () => {
      const { result } = renderHook(() => useRegenerateTracking());

      act(() => {
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-1');
        result.current.trackRegenerate('msg-2');
      });

      act(() => {
        result.current.resetRegenerateCount('msg-2');
      });

      expect(result.current.canRegenerate('msg-1')).toBe(false);
      expect(result.current.canRegenerate('msg-2')).toBe(true);
    });
  });
});
