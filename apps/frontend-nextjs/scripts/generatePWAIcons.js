/**
 * Script para gerar ícones PWA
 * Cria todos os tamanhos necessários a partir de um design base
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configurações
const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'images', 'logos', 'unb-simbolo.png');

// Tamanhos necessários para PWA
const iconSizes = [
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 32, name: 'favicon.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// Cores do projeto
const colors = {
  primary: '#2563eb',    // Dr. Gasnelio
  secondary: '#16a34a',  // Gá
  background: '#ffffff',
  accent: '#f8fafc',
};

async function createPWAIcon(size, outputPath) {
  try {
    // Criar um canvas com background
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: colors.background
      }
    });

    // Calcular tamanho do logo (80% da área segura para maskable)
    const logoSize = Math.floor(size * 0.6);
    const logoPosition = Math.floor((size - logoSize) / 2);

    // Redimensionar e posicionar o logo
    const logoBuffer = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Combinar background com logo
    const result = await canvas
      .composite([{
        input: logoBuffer,
        top: logoPosition,
        left: logoPosition
      }])
      .png()
      .toBuffer();

    // Salvar o arquivo
    fs.writeFileSync(outputPath, result);
    console.log(`✅ Criado: ${path.basename(outputPath)} (${size}x${size})`);

  } catch (error) {
    console.error(`❌ Erro ao criar ${outputPath}:`, error.message);
  }
}

async function createMaskableIcon(size, outputPath) {
  try {
    // Para ícones maskable, usar gradiente de fundo
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: colors.primary
      }
    });

    // Logo menor para área segura (center 80%)
    const safeAreaSize = Math.floor(size * 0.8);
    const logoSize = Math.floor(safeAreaSize * 0.7);
    const logoPosition = Math.floor((size - logoSize) / 2);

    // Criar gradiente de fundo (simulado com sobreposição)
    const gradientOverlay = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 37, g: 99, b: 235, alpha: 0.9 } // primary com transparência
      }
    }).png().toBuffer();

    // Logo em branco para contraste
    const logoBuffer = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .tint({ r: 255, g: 255, b: 255 }) // Converter para branco
      .png()
      .toBuffer();

    // Combinar tudo
    const result = await canvas
      .composite([
        { input: gradientOverlay, blend: 'overlay' },
        {
          input: logoBuffer,
          top: logoPosition,
          left: logoPosition
        }
      ])
      .png()
      .toBuffer();

    fs.writeFileSync(outputPath, result);
    console.log(`✅ Criado: ${path.basename(outputPath)} (${size}x${size}) - Maskable`);

  } catch (error) {
    console.error(`❌ Erro ao criar maskable ${outputPath}:`, error.message);
  }
}

async function createFavicon() {
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    
    // Criar favicon.ico com múltiplos tamanhos
    const favicon16 = await sharp(logoPath)
      .resize(16, 16, { fit: 'contain', background: colors.background })
      .png()
      .toBuffer();

    const favicon32 = await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: colors.background })
      .png()
      .toBuffer();

    // Para simplicidade, usar apenas o 32x32
    fs.writeFileSync(faviconPath, favicon32);
    console.log(`✅ Criado: favicon.ico`);

  } catch (error) {
    console.error(`❌ Erro ao criar favicon:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('🎨 Gerando ícones PWA...\n');

  // Verificar se o logo existe
  if (!fs.existsSync(logoPath)) {
    console.error(`❌ Logo não encontrado: ${logoPath}`);
    return;
  }

  // Criar ícones normais
  for (const { size, name } of iconSizes) {
    const outputPath = path.join(publicDir, name);
    await createPWAIcon(size, outputPath);
  }

  // Criar versões maskable dos ícones principais
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const outputPath = path.join(publicDir, `icon-${size}-maskable.png`);
    await createMaskableIcon(size, outputPath);
  }

  // Criar favicon
  await createFavicon();

  console.log('\n🎉 Todos os ícones PWA foram gerados com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Verifique os ícones em /public/');
  console.log('2. Teste a instalação do PWA em diferentes dispositivos');
  console.log('3. Use o Lighthouse para validar os ícones');
  console.log('4. Personalize os ícones conforme necessário');
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  generateAllIcons().catch(console.error);
}

module.exports = { generateAllIcons };