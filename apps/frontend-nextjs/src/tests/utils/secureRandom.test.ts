/**
 * Tests for Secure Random Utilities
 * Validates cryptographically secure random number generation
 */

import {
  secureRandom,
  secureRandomInt,
  generateSecureId,
  generateSecureUUID,
  secureShuffleArray,
  secureRandomElement,
} from '../../utils/secureRandom';

describe('SecureRandom Utilities', () => {
  describe('secureRandom', () => {
    it('should return a number between 0 and 1', () => {
      const random = secureRandom();
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(1);
    });

    it('should generate different values on multiple calls', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(secureRandom());
      }
      // Should have at least 95 unique values out of 100
      expect(values.size).toBeGreaterThan(95);
    });
  });

  describe('secureRandomInt', () => {
    it('should return integer within specified range', () => {
      const min = 10;
      const max = 20;

      for (let i = 0; i < 100; i++) {
        const random = secureRandomInt(min, max);
        expect(random).toBeGreaterThanOrEqual(min);
        expect(random).toBeLessThan(max);
        expect(Number.isInteger(random)).toBe(true);
      }
    });

    it('should throw error if min >= max', () => {
      expect(() => secureRandomInt(10, 10)).toThrow();
      expect(() => secureRandomInt(20, 10)).toThrow();
    });

    it('should generate values across the full range', () => {
      const min = 0;
      const max = 5;
      const values = new Set();

      // Generate many values to cover the range
      for (let i = 0; i < 1000; i++) {
        values.add(secureRandomInt(min, max));
      }

      // Should have most values in the range
      expect(values.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateSecureId', () => {
    it('should generate ID of specified length', () => {
      const id = generateSecureId(16);
      expect(id).toHaveLength(16);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureId());
      }
      expect(ids.size).toBe(100);
    });

    it('should only contain alphanumeric characters', () => {
      const id = generateSecureId(32);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateSecureUUID', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateSecureUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateSecureUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('secureShuffleArray', () => {
    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = secureShuffleArray([...original]);

      expect(shuffled.sort()).toEqual(original);
    });

    it('should modify array in place', () => {
      const array = [1, 2, 3, 4, 5];
      const result = secureShuffleArray(array);
      expect(result).toBe(array);
    });

    it('should produce different shuffles', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffles = new Set();

      for (let i = 0; i < 50; i++) {
        const shuffled = secureShuffleArray([...original]);
        shuffles.add(JSON.stringify(shuffled));
      }

      // Should have multiple different shuffles
      expect(shuffles.size).toBeGreaterThan(10);
    });
  });

  describe('secureRandomElement', () => {
    it('should return element from array', () => {
      const array = [1, 2, 3, 4, 5];
      const element = secureRandomElement(array);
      expect(array).toContain(element);
    });

    it('should return undefined for empty array', () => {
      const element = secureRandomElement([]);
      expect(element).toBeUndefined();
    });

    it('should distribute selection across elements', () => {
      const array = ['a', 'b', 'c'];
      const counts: Record<string, number> = { a: 0, b: 0, c: 0 };

      for (let i = 0; i < 300; i++) {
        const element = secureRandomElement(array);
        if (element) {
          counts[element]++;
        }
      }

      // Each element should be selected at least a few times
      expect(counts.a).toBeGreaterThan(50);
      expect(counts.b).toBeGreaterThan(50);
      expect(counts.c).toBeGreaterThan(50);
    });
  });
});
