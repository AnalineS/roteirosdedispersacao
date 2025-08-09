// Simular o PERSONA_AVATARS
const PERSONA_AVATARS = {
    'dr-gasnelio': '/images/avatars/dr-gasnelio.png',
    'dr_gasnelio': '/images/avatars/dr-gasnelio.png',
    'gasnelio': '/images/avatars/dr-gasnelio.png',
    'ga': '/images/avatars/ga.png'
};

// IDs que vêm do backend
const backendIds = ['dr_gasnelio', 'ga'];

// Função hasPersonaAvatar
const hasPersonaAvatar = (personaId) => {
    const normalizedId = personaId?.toLowerCase().replace(/[-_\s]/g, '');
    
    // Verificar se existe diretamente
    if (personaId in PERSONA_AVATARS) {
        console.log(`Direct match found for "${personaId}"`);
        return true;
    }
    
    // Verificar IDs normalizados
    const entries = Object.entries(PERSONA_AVATARS);
    const match = entries.find(([key]) => 
        key.toLowerCase().replace(/[-_\s]/g, '') === normalizedId
    );
    
    console.log(`Checking normalized "${normalizedId}" against keys:`, 
        entries.map(([k]) => k.toLowerCase().replace(/[-_\s]/g, '')));
    
    return !!match;
};

console.log('Testing persona avatar matching:\n');

backendIds.forEach(id => {
    const hasAvatar = hasPersonaAvatar(id);
    const normalizedId = id?.toLowerCase().replace(/[-_\s]/g, '');
    
    console.log(`\nID: "${id}"`);
    console.log(`Normalized: "${normalizedId}"`);
    console.log(`Direct match: ${id in PERSONA_AVATARS}`);
    console.log(`Has avatar: ${hasAvatar}`);
    console.log('---');
});

console.log('\nPERSONA_AVATARS keys:');
Object.keys(PERSONA_AVATARS).forEach(key => {
    const normalized = key.toLowerCase().replace(/[-_\s]/g, '');
    console.log(`"${key}" → "${normalized}"`);
});