/**
 * Mapeamento de avatares e logos hospedados localmente
 * Imagens baixadas e hospedadas no projeto
 */

export const PERSONA_AVATARS = {
  dr_gasnelio: '/images/avatars/dr-gasnelio.png',
  ga: '/images/avatars/ga.png'
} as const;

export const UNIVERSITY_LOGOS = {
  unb_symbol: '/images/logos/unb-simbolo.png',     // Logo principal para header
  unb_logo: '/images/logos/unb-logo.webp',        // Logo completa
  ppgcf_logo: '/images/logos/ppgcf-logo.png'      // Logo do programa
} as const;

export const getPersonaAvatar = (personaId: string): string => {
  return PERSONA_AVATARS[personaId as keyof typeof PERSONA_AVATARS] || '';
};

export const getUniversityLogo = (logoType: keyof typeof UNIVERSITY_LOGOS): string => {
  return UNIVERSITY_LOGOS[logoType];
};

/**
 * Verifica se uma persona tem avatar configurado
 */
export const hasPersonaAvatar = (personaId: string): boolean => {
  return personaId in PERSONA_AVATARS;
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