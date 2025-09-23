/**
 * Mapeamento de avatares e logos hospedados localmente
 * Imagens baixadas e hospedadas no projeto
 */

export const PERSONA_AVATARS = {
  'dr-gasnelio': '/images/avatars/dr-gasnelio.png',
  'dr_gasnelio': '/images/avatars/dr-gasnelio.png',
  'gasnelio': '/images/avatars/dr-gasnelio.png',
  'ga': '/images/avatars/ga.png'
} as const;

export const UNIVERSITY_LOGOS = {
  unb_symbol: '/images/logos/unb-simbolo.png',     // Logo símbolo
  unb_logo: '/images/logos/unb-logo.webp',        // Logo completa
  unb_logo2: '/images/logos/unb-logo2.png',       // Logo circular para header
  ppgcf_logo: '/images/logos/ppgcf-logo.png'      // Logo do programa
} as const;

export const getPersonaAvatar = (personaId: string): string => {
  // Normalizar IDs para cobrir variações comuns
  const normalizedId = personaId?.toLowerCase().replace(/[-_\s]/g, '');
  
  // Buscar primeira correspondência exata
  const directMatch = PERSONA_AVATARS[personaId as keyof typeof PERSONA_AVATARS];
  if (directMatch) {
    return directMatch;
  }
  
  // Se não encontrou, buscar por ID normalizado
  const entries = Object.entries(PERSONA_AVATARS);
  const match = entries.find(([key]) => 
    key.toLowerCase().replace(/[-_\s]/g, '') === normalizedId
  );
  
  const result = match?.[1] || '';
  return result;
};

export const getUniversityLogo = (logoType: keyof typeof UNIVERSITY_LOGOS): string => {
  return UNIVERSITY_LOGOS[logoType];
};

/**
 * Verifica se uma persona tem avatar configurado
 */
export const hasPersonaAvatar = (personaId: string): boolean => {
  // Normalizar IDs para cobrir variações comuns
  const normalizedId = personaId?.toLowerCase().replace(/[-_\s]/g, '');
  
  // Verificar se existe diretamente
  if (personaId in PERSONA_AVATARS) {
    return true;
  }
  
  // Verificar IDs normalizados
  const entries = Object.entries(PERSONA_AVATARS);
  const match = entries.find(([key]) => 
    key.toLowerCase().replace(/[-_\s]/g, '') === normalizedId
  );
  
  return !!match;
};

/**
 * Filtra personas que têm avatares configurados
 */
export const filterValidPersonas = <T>(personas: Record<string, T>): Record<string, T> => {
  const validPersonas: Record<string, T> = {};
  Object.entries(personas).forEach(([id, persona]) => {
    if (hasPersonaAvatar(id)) {
      validPersonas[id] = persona;
    }
  });
  return validPersonas;
};