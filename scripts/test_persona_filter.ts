/**
 * Test script to debug filterValidPersonas issue
 */

const PERSONA_AVATARS = {
  'dr-gasnelio': '/images/avatars/dr-gasnelio.png',
  'dr_gasnelio': '/images/avatars/dr-gasnelio.png',
  'gasnelio': '/images/avatars/dr-gasnelio.png',
  'ga': '/images/avatars/ga.png'
} as const;

const STATIC_PERSONAS = {
  dr_gasnelio: {
    name: "Dr. Gasnelio",
    description: "Especialista técnico em hanseníase e farmacologia"
  },
  ga: {
    name: "Gá",
    description: "Assistente empático focado no cuidado humanizado"
  }
};

const hasPersonaAvatar = (personaId: string): boolean => {
  // Normalizar IDs para cobrir variações comuns
  const normalizedId = personaId?.toLowerCase().replace(/[-_\s]/g, '');

  // Verificar se existe diretamente
  if (personaId in PERSONA_AVATARS) {
    console.log(`  ✅ Direct match for "${personaId}"`);
    return true;
  }

  // Verificar IDs normalizados
  const entries = Object.entries(PERSONA_AVATARS);
  const match = entries.find(([key]) => {
    const normalized = key.toLowerCase().replace(/[-_\s]/g, '');
    console.log(`  Comparing "${personaId}" (normalized: "${normalizedId}") with "${key}" (normalized: "${normalized}")`);
    return normalized === normalizedId;
  });

  const result = !!match;
  console.log(`  Result: ${result ? '✅ Match found' : '❌ No match'}`);
  return result;
};

const filterValidPersonas = <T>(personas: Record<string, T>): Record<string, T> => {
  const validPersonas: Record<string, T> = {};
  Object.entries(personas).forEach(([id, persona]) => {
    console.log(`\nChecking persona: "${id}"`);
    if (hasPersonaAvatar(id)) {
      validPersonas[id] = persona;
    }
  });
  return validPersonas;
};

console.log('=== TESTING PERSONA FILTER ===\n');
const filtered = filterValidPersonas(STATIC_PERSONAS);

console.log('\n=== RESULTS ===');
console.log('Input personas:', Object.keys(STATIC_PERSONAS));
console.log('Filtered personas:', Object.keys(filtered));
console.log('Count:', Object.keys(filtered).length);
