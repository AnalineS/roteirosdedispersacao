/**
 * Utility functions for sanitizing input
 * Funções utilitárias para sanitização de entrada
 * 
 * SEGURANÇA: Usa DOMPurify para sanitização robusta e segura de HTML
 * em vez de regex que podem ser contornadas
 */

import DOMPurify from 'dompurify';

/**
 * Sanitização robusta server-side para HTML
 * Implementa estratégia multi-passo para evitar bypass de regex simples
 * Referência: OWASP Cheat Sheet - Input Validation
 */
function sanitizeHTMLServerSide(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;
  
  // Passo 1: Remover caracteres de controle e não-imprimíveis
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Passo 2: Aplicar múltiplas passadas de remoção de tags para evitar bypass
  // Como recomendado pelo CodeQL, aplicar até não haver mais mudanças
  let previous = '';
  let iterations = 0;
  const maxIterations = 10; // Prevenir loop infinito
  
  do {
    previous = sanitized;
    
    // Remover tags HTML básicas (incluindo tags malformadas)
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remover tentativas de bypass como <<script>alert()>/script>
    sanitized = sanitized.replace(/<+|>+/g, '');
    
    // Remover protocolos perigosos (CWE-20/CWE-184)
    // Proteção contra javascript:, data:, vbscript: e file: schemes
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');       // Bloqueia todos os data: URIs
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/file:/gi, '');       // Proteção adicional contra file: URIs
    
    // Remover event handlers (CWE-20/CWE-80/CWE-116)
    // Regex melhorada para capturar variações de event handlers
    // Exemplos: onclick=, on click=, onclick =, on-click=, onerror=
    sanitized = sanitized.replace(/\bon[\w\-]*\s*=/gi, '');

    // Proteção adicional: remover atributos 'on' isolados que possam ter sido criados
    sanitized = sanitized.replace(/\bon\s*=/gi, '');
    
    iterations++;
  } while (sanitized !== previous && iterations < maxIterations);
  
  // Passo 3: Escape final de caracteres perigosos remanescentes
  const escapeMap: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
    '/': '&#x2F;'
  };
  
  sanitized = sanitized.replace(/[<>"'&\/]/g, (char) => escapeMap[char] || char);
  
  // Passo 4: Limitar tamanho para prevenir DoS
  const maxLength = 50000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 * Usa DOMPurify - biblioteca robusta e bem testada para evitar XSS
 */
export function sanitizeHTML(html: string): string {
  // Verificar se estamos no navegador
  if (typeof window === 'undefined') {
    // No servidor, usar sanitização robusta multi-passo para evitar bypass
    return sanitizeHTMLServerSide(html);
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
  
  // Verificação adicional para URLs perigosas (CWE-20/CWE-184)
  const finalClean = clean
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')      // Remove todos os data: URIs
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '');

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
 * Previne path traversal e outros ataques usando estratégia multi-passo
 * Referência: OWASP Path Traversal Prevention
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  let sanitized = filename;
  let previous = '';
  let iterations = 0;
  const maxIterations = 10;

  // Aplicar sanitização repetidamente para evitar bypass
  do {
    previous = sanitized;
    
    // Remover path traversal patterns (aplicar múltiplas vezes)
    sanitized = sanitized.replace(/\.\./g, ''); // Remover ..
    sanitized = sanitized.replace(/\.\/|\\\.\\|\.\\|\\\./g, ''); // Variações de path traversal
    
    // Remover barras e caracteres de path
    sanitized = sanitized.replace(/[\/\\]/g, ''); // Remover / e \
    
    // Remover pontos no início
    sanitized = sanitized.replace(/^\.+/, '');
    
    iterations++;
  } while (sanitized !== previous && iterations < maxIterations);

  // Limpar caracteres perigosos restantes
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F<>:"|?*]/g, '') // Remover caracteres inválidos
    .replace(/\s+/g, '_') // Substituir espaços por _
    .replace(/[^\w\-_.]/g, '') // Manter apenas alfanuméricos, hífen, underscore e ponto
    .substring(0, 255); // Limitar tamanho

  // Se ficou vazio ou apenas pontos/underscores, usar nome padrão
  const cleanName = sanitized.replace(/^[._]+|[._]+$/g, '');
  return cleanName || 'file';
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
export function sanitizeJSON<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Propriedades perigosas que devem ser removidas
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  // Função recursiva para limpar objeto
  function clean(item: unknown): unknown {
    if (Array.isArray(item)) {
      return item.map(clean);
    }
    
    if (item && typeof item === 'object') {
      const cleaned: Record<string, unknown> = {};
      
      for (const key in item) {
        // Pular propriedades perigosas
        if (dangerousKeys.includes(key)) {
          continue;
        }
        
        // Verificar se é propriedade própria (não herdada)
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const itemObj = item as Record<string, unknown>;
          cleaned[key] = clean(itemObj[key]);
        }
      }
      
      return cleaned;
    }
    
    return item;
  }
  
  return clean(obj) as T;
}

// Exportar todas as funções como default também
const SanitizationUtils = {
  sanitizeHTML,
  sanitizeInput,
  sanitizeFilename,
  escapeHTML,
  sanitizeURL,
  sanitizeJSON
};

export default SanitizationUtils;