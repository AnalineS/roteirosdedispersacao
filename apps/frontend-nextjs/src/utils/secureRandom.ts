/**
 * Secure Random Utilities
 * Provides cryptographically secure random number generation
 *
 * SECURITY: Uses Web Crypto API instead of Math.random()
 * Prevents predictability in security-sensitive contexts
 * Reference: OWASP Cryptographic Storage Cheat Sheet
 */

/**
 * Generate a cryptographically secure random number between 0 and 1
 * Replacement for Math.random() in security-sensitive contexts
 *
 * @returns {number} Random number between 0 (inclusive) and 1 (exclusive)
 */
export function secureRandom(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    // Node.js environment with crypto
    const array = new Uint32Array(1);
    global.crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  } else {
    // Fallback to Math.random() with warning
    console.warn('Crypto API not available, falling back to Math.random()');
    return Math.random();
  }
}

/**
 * Generate a cryptographically secure random integer within a range
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random integer between min and max
 */
export function secureRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error('min must be less than max');
  }

  const range = max - min;
  return Math.floor(secureRandom() * range) + min;
}

/**
 * Generate a cryptographically secure random ID
 * Suitable for temporary IDs, request IDs, etc.
 *
 * @param length - Length of the ID (default: 16)
 * @returns Random alphanumeric string
 */
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(array);
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }

  return result;
}

/**
 * Generate a cryptographically secure UUID v4
 * Follows RFC 4122 standard
 *
 * @returns UUID v4 string
 */
export function generateSecureUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    // Use native crypto.randomUUID() if available
    return window.crypto.randomUUID();
  }

  // Fallback implementation
  const array = new Uint8Array(16);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(array);
  } else {
    // Last resort fallback
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40; // Version 4
  array[8] = (array[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

/**
 * Generate a cryptographically secure random bytes array
 *
 * @param length - Number of bytes to generate
 * @returns Uint8Array with random bytes
 */
export function generateSecureBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(array);
  } else {
    // Fallback with warning
    console.warn('Crypto API not available, using Math.random() fallback');
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return array;
}

/**
 * Shuffle array using Fisher-Yates algorithm with secure random
 *
 * @param array - Array to shuffle
 * @returns Shuffled array (modifies in place)
 */
export function secureShuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Select random element from array using secure random
 *
 * @param array - Array to select from
 * @returns Random element from array
 */
export function secureRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return undefined;
  }
  return array[secureRandomInt(0, array.length)];
}

// Export all utilities as default
const SecureRandomUtils = {
  secureRandom,
  secureRandomInt,
  generateSecureId,
  generateSecureUUID,
  generateSecureBytes,
  secureShuffleArray,
  secureRandomElement,
};

export default SecureRandomUtils;
