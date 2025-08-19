/**
 * Utilidades criptográficas seguras
 * Funções para geração de números aleatórios criptograficamente seguros
 */

/**
 * Gera um ID único usando randomness criptograficamente segura
 * Usa crypto.getRandomValues() para garantir segurança
 */
export function generateSecureId(prefix: string = '', length: number = 16): string {
  // Verificar se crypto está disponível (navegador)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Usar crypto.getRandomValues para segurança criptográfica
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    // Converter para string base36 (0-9, a-z)
    const randomString = Array.from(array, (byte) => {
      // Usar apenas caracteres alfanuméricos para compatibilidade
      return (byte % 36).toString(36);
    }).join('');
    
    const timestamp = Date.now().toString(36);
    return `${prefix}${timestamp}_${randomString}`;
  }
  
  // Fallback para Node.js ou ambiente sem crypto
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(length);
      const randomString = randomBytes.toString('hex').substring(0, length);
      const timestamp = Date.now().toString(36);
      return `${prefix}${timestamp}_${randomString}`;
    } catch (error) {
      console.warn('Crypto module not available, using fallback');
    }
  }
  
  // Fallback seguro: usar timestamp + contador para determinismo
  // Não é criptograficamente seguro, mas é melhor que Math.random()
  const timestamp = Date.now().toString(36);
  const counter = (generateSecureId.counter = (generateSecureId.counter || 0) + 1);
  return `${prefix}${timestamp}_${counter.toString(36).padStart(4, '0')}`;
}

// Counter para fallback
(generateSecureId as any).counter = 0;

/**
 * Gera token de sessão seguro
 * Para uso em contextos de segurança como session IDs
 */
export function generateSecureSessionToken(): string {
  return generateSecureId('session_', 32);
}

/**
 * Gera ID temporário para usuários anônimos
 * Usa randomness segura quando disponível
 */
export function generateTempUserId(): string {
  return generateSecureId('temp_', 16);
}

/**
 * Gera hash simples mas não-previsível para cache keys
 * Não é criptograficamente seguro, mas adequado para cache
 */
export function generateCacheKey(input: string): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Para cache, podemos usar um hash simples baseado no input + random
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const random = array[0].toString(36);
    
    // Hash simples do input para consistência
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `cache_${Math.abs(hash).toString(36)}_${random}`;
  }
  
  // Fallback: hash simples deterministico
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `cache_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

/**
 * Valida se uma string parece ser um ID seguro
 * Verifica formato e comprimento mínimo
 */
export function isValidSecureId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Verificar formato básico: prefix_timestamp_random
  const parts = id.split('_');
  if (parts.length < 3) {
    return false;
  }
  
  // Verificar comprimento mínimo para segurança
  if (id.length < 16) {
    return false;
  }
  
  // Verificar se contém apenas caracteres alfanuméricos e underscore
  const validPattern = /^[a-z0-9_]+$/i;
  return validPattern.test(id);
}

/**
 * Gera nonce criptograficamente seguro para CSP
 */
export function generateNonce(length: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }
  
  // Fallback para Node.js
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(length).toString('base64');
    } catch (error) {
      console.warn('Crypto module not available for nonce generation');
    }
  }
  
  // Fallback menos seguro
  const timestamp = Date.now().toString();
  return btoa(timestamp).substring(0, length);
}

export default {
  generateSecureId,
  generateSecureSessionToken,
  generateTempUserId,
  generateCacheKey,
  isValidSecureId,
  generateNonce
};