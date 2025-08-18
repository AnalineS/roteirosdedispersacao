/**
 * Utilitários de Sanitização de Segurança
 * Previne XSS e outras vulnerabilidades
 */

/**
 * Sanitiza HTML para prevenir XSS
 * Permite apenas tags seguras para formatação básica
 */
export function sanitizeHTML(html: string): string {
  // Remover todas as tags perigosas
  const dangerousTags = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const iframeTags = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
  const objectTags = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
  const embedTags = /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi;
  
  let safe = html
    .replace(dangerousTags, '')
    .replace(iframeTags, '')
    .replace(objectTags, '')
    .replace(embedTags, '');
  
  // Remover atributos perigosos
  const dangerousAttrs = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
  const javascriptLinks = /javascript:/gi;
  const dataLinks = /data:text\/html/gi;
  
  safe = safe
    .replace(dangerousAttrs, '')
    .replace(javascriptLinks, '')
    .replace(dataLinks, '');
  
  // Escapar caracteres especiais que não estão em tags permitidas
  const allowedTags = ['b', 'i', 'em', 'strong', 'mark', 'span', 'br'];
  const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
  safe = safe.replace(tagPattern, '');
  
  return safe;
}

/**
 * Sanitiza texto para ser usado em SQL queries
 * Previne SQL Injection
 */
export function sanitizeForSQL(input: string): string {
  if (!input) return '';
  
  // Remover caracteres perigosos para SQL
  return input
    .replace(/['";\\]/g, '') // Remove quotes e escape chars
    .replace(/--/g, '') // Remove comentários SQL
    .replace(/\/\*/g, '') // Remove início de comentário multi-linha
    .replace(/\*\//g, '') // Remove fim de comentário multi-linha
    .replace(/\bOR\b/gi, '') // Remove OR operator
    .replace(/\bAND\b/gi, '') // Remove AND operator
    .replace(/\bUNION\b/gi, '') // Remove UNION
    .replace(/\bSELECT\b/gi, '') // Remove SELECT
    .replace(/\bINSERT\b/gi, '') // Remove INSERT
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE
    .replace(/\bDELETE\b/gi, '') // Remove DELETE
    .replace(/\bDROP\b/gi, '') // Remove DROP
    .slice(0, 255); // Limitar tamanho
}

/**
 * Sanitiza input para ser usado em URLs
 * Previne Open Redirect e outras vulnerabilidades
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  // Remover javascript: e data: protocols
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('data:')) {
    return '';
  }
  
  // Validar que é uma URL válida
  try {
    const parsed = new URL(url);
    
    // Permitir apenas protocolos seguros
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    
    // Verificar se não é uma URL maliciosa conhecida
    const blacklistedDomains = [
      'evil.com',
      'malware.com',
      // Adicionar mais domínios conforme necessário
    ];
    
    if (blacklistedDomains.some(domain => parsed.hostname.includes(domain))) {
      return '';
    }
    
    return url;
  } catch {
    // Se não é uma URL válida, retornar vazio
    return '';
  }
}

/**
 * Sanitiza nome de arquivo para upload
 * Previne Path Traversal e outras vulnerabilidades
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remover path traversal
  let safe = filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '');
  
  // Remover caracteres especiais, manter apenas alfanuméricos, -, _ e .
  safe = safe.replace(/[^a-zA-Z0-9\-_.]/g, '');
  
  // Limitar tamanho
  if (safe.length > 255) {
    const ext = safe.split('.').pop() || '';
    const name = safe.substring(0, 250 - ext.length);
    safe = `${name}.${ext}`;
  }
  
  // Verificar extensões perigosas
  const dangerousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    'sh', 'bash', 'ps1', 'psm1'
  ];
  
  const ext = safe.split('.').pop()?.toLowerCase();
  if (ext && dangerousExtensions.includes(ext)) {
    return safe.replace(new RegExp(`\\.${ext}$`, 'i'), '.txt');
  }
  
  return safe;
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Regex básico para email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  // Limitar tamanho
  return trimmed.slice(0, 254);
}

/**
 * Sanitiza número de telefone
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remover tudo exceto números, +, -, (, ), e espaços
  return phone
    .replace(/[^0-9+\-() ]/g, '')
    .slice(0, 20);
}

/**
 * Escapa HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Remove todos os caracteres não-ASCII
 */
export function removeNonASCII(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, '');
}

/**
 * Valida e sanitiza JSON
 */
export function sanitizeJSON(jsonString: string): object | null {
  try {
    const parsed = JSON.parse(jsonString);
    // Re-stringify para remover qualquer código malicioso
    return JSON.parse(JSON.stringify(parsed));
  } catch {
    return null;
  }
}

/**
 * Sanitiza entrada de busca
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remover caracteres especiais que podem causar problemas em buscas
  return query
    .replace(/[<>'"]/g, '') // Remove potencial XSS
    .replace(/[*?]/g, '') // Remove wildcards perigosos
    .replace(/\\/g, '') // Remove escape chars
    .trim()
    .slice(0, 100); // Limitar tamanho
}