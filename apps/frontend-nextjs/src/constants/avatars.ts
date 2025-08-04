/**
 * Mapeamento de avatares e logos hospedados externamente
 * Imagens hospedadas temporariamente em postimg.cc
 */

export const PERSONA_AVATARS = {
  dr_gasnelio: 'https://i.postimg.cc/7Zp2Q8Vm/Dr-Gasnelio.png',
  ga: 'https://i.postimg.cc/L6bNWcR8/G.png'
} as const;

export const UNIVERSITY_LOGOS = {
  unb_symbol: 'https://i.postimg.cc/XYwrcCXJ/S-mbolo-da-Un-B-para-fundo-branco.png',
  unb_logo: 'https://i.postimg.cc/L6Kx4n4B/Un-B.webp',
  ppgcf_logo: 'https://i.postimg.cc/t4nNX4mP/logo-PPGCF.png'
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