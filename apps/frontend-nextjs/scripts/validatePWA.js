/**
 * Script de validação PWA
 * Verifica se todos os requisitos PWA estão atendidos
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const manifestPath = path.join(publicDir, 'manifest.json');

// Lista de ícones obrigatórios
const requiredIcons = [
  'icon-72.png',
  'icon-96.png', 
  'icon-128.png',
  'icon-144.png',
  'icon-152.png',
  'icon-192.png',
  'icon-384.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png',
  'favicon.png',
  'favicon.ico',
  'apple-touch-icon.png'
];

// Requisitos PWA
const pwaRequirements = [
  'manifest.json',
  'sw.js'
];

function validateIcons() {
  console.log('🔍 Validando ícones PWA...\n');
  
  let allIconsPresent = true;
  
  for (const icon of requiredIcons) {
    const iconPath = path.join(publicDir, icon);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      console.log(`✅ ${icon} - ${Math.round(stats.size / 1024)}KB`);
    } else {
      console.log(`❌ ${icon} - AUSENTE`);
      allIconsPresent = false;
    }
  }
  
  return allIconsPresent;
}

function validateManifest() {
  console.log('\n🔍 Validando manifest.json...\n');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ manifest.json não encontrado');
    return false;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Campos obrigatórios
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    let validManifest = true;
    
    for (const field of requiredFields) {
      if (manifest[field]) {
        console.log(`✅ ${field}: ${typeof manifest[field] === 'object' ? 'configurado' : manifest[field]}`);
      } else {
        console.log(`❌ ${field}: ausente`);
        validManifest = false;
      }
    }
    
    // Validar ícones no manifest
    console.log(`\n📱 Ícones no manifest: ${manifest.icons?.length || 0}`);
    
    if (manifest.icons) {
      for (const icon of manifest.icons) {
        const iconExists = fs.existsSync(path.join(publicDir, icon.src.replace('/', '')));
        const status = iconExists ? '✅' : '❌';
        console.log(`${status} ${icon.src} (${icon.sizes}) - ${icon.purpose || 'any'}`);
      }
    }
    
    // Validar shortcuts
    if (manifest.shortcuts) {
      console.log(`\n🔗 Shortcuts: ${manifest.shortcuts.length}`);
      for (const shortcut of manifest.shortcuts) {
        console.log(`✅ ${shortcut.name} → ${shortcut.url}`);
      }
    }
    
    return validManifest;
    
  } catch (error) {
    console.log(`❌ Erro ao ler manifest.json: ${error.message}`);
    return false;
  }
}

function validateServiceWorker() {
  console.log('\n🔍 Validando Service Worker...\n');
  
  const swPath = path.join(publicDir, 'sw.js');
  
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const swSize = Math.round(fs.statSync(swPath).size / 1024);
    
    console.log(`✅ sw.js presente - ${swSize}KB`);
    
    // Verificar funcionalidades básicas
    const features = [
      { name: 'install event', pattern: /addEventListener\(['"`]install['"`]/ },
      { name: 'activate event', pattern: /addEventListener\(['"`]activate['"`]/ },
      { name: 'fetch event', pattern: /addEventListener\(['"`]fetch['"`]/ },
      { name: 'cache management', pattern: /caches\.(open|match|keys)/ },
    ];
    
    for (const feature of features) {
      if (feature.pattern.test(swContent)) {
        console.log(`✅ ${feature.name}`);
      } else {
        console.log(`⚠️ ${feature.name} - não detectado`);
      }
    }
    
    return true;
  } else {
    console.log('❌ sw.js não encontrado');
    return false;
  }
}

function generateReport() {
  console.log('\n📊 Gerando relatório PWA...\n');
  
  const iconsValid = validateIcons();
  const manifestValid = validateManifest();
  const swValid = validateServiceWorker();
  
  const score = [iconsValid, manifestValid, swValid].filter(Boolean).length;
  const totalChecks = 3;
  const percentage = Math.round((score / totalChecks) * 100);
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 RELATÓRIO FINAL PWA');
  console.log('='.repeat(50));
  console.log(`Ícones: ${iconsValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`Manifest: ${manifestValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`Service Worker: ${swValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log('='.repeat(50));
  console.log(`SCORE PWA: ${score}/${totalChecks} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('🎉 PWA PRONTO PARA PRODUÇÃO!');
    console.log('\n🚀 Próximos passos:');
    console.log('1. Teste em dispositivos móveis');
    console.log('2. Execute Lighthouse PWA audit');
    console.log('3. Valide instalação em Chrome/Edge/Safari');
    console.log('4. Configure variáveis de ambiente');
  } else {
    console.log('⚠️ PWA precisa de ajustes antes da produção');
  }
  
  console.log('='.repeat(50));
}

// Executar validação
if (require.main === module) {
  console.log('🔍 VALIDAÇÃO PWA - ROTEIROS DE DISPENSAÇÃO\n');
  generateReport();
}

module.exports = { validateIcons, validateManifest, validateServiceWorker };