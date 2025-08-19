/**
 * Utility functions for sanitizing input
 * Funções utilitárias para sanitização de entrada
 * 
 * SEGURANÇA: Usa DOMPurify para sanitização robusta e segura de HTML
 * em vez de regex que podem ser contornadas
 */

import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 * Usa DOMPurify - biblioteca robusta e bem testada para evitar XSS
 */
export function sanitizeHTML(html: string): string {
  // Verificar se estamos no navegador
  if (typeof window === 'undefined') {
    // No servidor, remover todas as tags HTML como fallback seguro
    return html.replace(/<[^>]*>/g, '');
  }

  // Configurar DOMPurify com configurações seguras
  const config = {
    // Tags permitidas - apenas formatação básica
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'mark', 'span', 'br', 'p', 'div'],
    
    // Atributos permitidos - apenas classes para estilização
    ALLOWED_ATTR: ['class'],
    
    // Remover tags perigosas completamente
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta'],
    
    // Remover atributos perigosos
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    
    // Não permitir URLs data: ou javascript:
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    
    // Remover conteúdo de tags perigosas, não apenas as tags
    KEEP_CONTENT: false,
    
    // Sanitizar também SVG e MathML
    USE_PROFILES: { html: true, svg: false, mathMl: false }
  };

  // Sanitizar com DOMPurify
  const clean = DOMPurify.sanitize(html, config);
  
  // Verificação adicional para URLs perigosas
  const finalClean = clean
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
  
  return finalClean;
}

/**
 * Sanitiza input de texto removendo caracteres especiais
 * Previne injeções e problemas de parsing
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remover caracteres de controle e não-imprimíveis
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limitar comprimento para prevenir ataques de DoS
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  // Trim espaços em branco
  return sanitized.trim();
}

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 * Previne path traversal e outros ataques
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remover path traversal e caracteres perigosos
  const sanitized = filename
    .replace(/\.\./g, '') // Remover ..
    .replace(/[\/\\]/g, '') // Remover / e \
    .replace(/^\.+/, '') // Remover . no início
    .replace(/[\x00-\x1F\x7F<>:"|?*]/g, '') // Remover caracteres inválidos
    .replace(/\s+/g, '_') // Substituir espaços por _
    .substring(0, 255); // Limitar tamanho

  // Se ficou vazio, usar nome padrão
  return sanitized || 'file';
}

/**
 * Escapa HTML para exibição segura
 * Converte caracteres especiais em entidades HTML
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Valida e sanitiza URL
 * Previne URLs maliciosas e ataques de redirecionamento
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remover espaços em branco
  const trimmed = url.trim();
  
  // Bloquear protocolos perigosos
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    return '';
  }
  
  // Permitir apenas URLs relativas ou com protocolos seguros
  const safeProtocols = /^(https?:\/\/|\/|#)/i;
  if (!safeProtocols.test(trimmed)) {
    // Se não tem protocolo, assumir que é relativa
    return '/' + trimmed;
  }
  
  return trimmed;
}

/**
 * Sanitiza objeto JSON removendo propriedades perigosas
 * Previne prototype pollution e outros ataques
 */
export function sanitizeJSON(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Propriedades perigosas que devem ser removidas
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  // Função recursiva para limpar objeto
  function clean(item: any): any {
    if (Array.isArray(item)) {
      return item.map(clean);
    }
    
    if (item && typeof item === 'object') {
      const cleaned: any = {};
      
      for (const key in item) {
        // Pular propriedades perigosas
        if (dangerousKeys.includes(key)) {
          continue;
        }
        
        // Verificar se é propriedade própria (não herdada)
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          cleaned[key] = clean(item[key]);
        }
      }
      
      return cleaned;
    }
    
    return item;
  }
  
  return clean(obj);
}

// Exportar todas as funções como default também
export default {
  sanitizeHTML,
  sanitizeInput,
  sanitizeFilename,
  escapeHTML,
  sanitizeURL,
  sanitizeJSON
};