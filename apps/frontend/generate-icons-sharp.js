const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configurações
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const primaryColor = '#1976d2';
const backgroundColor = '#ffffff';

// Criar pasta icons se não existir
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Função para criar ícone base SVG
function createBaseSVG(size, isMaskable = false) {
    const padding = isMaskable ? size * 0.1 : 0;
    const actualSize = size - (padding * 2);
    const centerX = size / 2;
    const centerY = size / 2;
    
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${size}" height="${size}" fill="${isMaskable ? primaryColor : backgroundColor}" rx="${size * 0.15}"/>
        
        <!-- Circle background for icon -->
        <circle cx="${centerX}" cy="${centerY}" r="${actualSize * 0.35}" fill="${isMaskable ? backgroundColor : primaryColor}" opacity="0.9"/>
        
        <!-- Medical cross -->
        <g transform="translate(${centerX}, ${centerY})">
            <!-- Vertical bar -->
            <rect x="${-actualSize * 0.08}" y="${-actualSize * 0.2}" width="${actualSize * 0.16}" height="${actualSize * 0.4}" fill="${isMaskable ? primaryColor : backgroundColor}" rx="${actualSize * 0.02}"/>
            <!-- Horizontal bar -->
            <rect x="${-actualSize * 0.2}" y="${-actualSize * 0.08}" width="${actualSize * 0.4}" height="${actualSize * 0.16}" fill="${isMaskable ? primaryColor : backgroundColor}" rx="${actualSize * 0.02}"/>
        </g>
        
        <!-- Text RD -->
        <text x="${centerX}" y="${centerY + actualSize * 0.15}" font-family="Arial, sans-serif" font-size="${actualSize * 0.12}" font-weight="bold" text-anchor="middle" fill="${isMaskable ? backgroundColor : primaryColor}">RD</text>
    </svg>
    `;
}

// Função para gerar ícones
async function generateIcons() {
    console.log('🎨 Gerando ícones PWA profissionais...\n');
    
    try {
        // Gerar ícones regulares
        for (const size of sizes) {
            const svgBuffer = Buffer.from(createBaseSVG(size, false));
            
            await sharp(svgBuffer)
                .resize(size, size)
                .png({
                    quality: 100,
                    compressionLevel: 9,
                    adaptiveFiltering: true
                })
                .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
            
            console.log(`✅ Gerado: icon-${size}x${size}.png`);
            
            // Também salvar tamanhos principais na raiz public
            if (size === 192 || size === 512) {
                await sharp(svgBuffer)
                    .resize(size, size)
                    .png({ quality: 100 })
                    .toFile(path.join(__dirname, 'public', `icon-${size}.png`));
                
                console.log(`✅ Copiado para raiz: icon-${size}.png`);
            }
        }
        
        // Gerar ícones maskable (apenas para tamanhos principais)
        console.log('\n🎭 Gerando ícones maskable...\n');
        for (const size of [192, 512]) {
            const svgBuffer = Buffer.from(createBaseSVG(size, true));
            
            await sharp(svgBuffer)
                .resize(size, size)
                .png({ quality: 100 })
                .toFile(path.join(iconsDir, `icon-maskable-${size}x${size}.png`));
            
            console.log(`✅ Gerado: icon-maskable-${size}x${size}.png`);
        }
        
        // Gerar favicon
        console.log('\n🌟 Gerando favicon...\n');
        const faviconSVG = createBaseSVG(32, false);
        await sharp(Buffer.from(faviconSVG))
            .resize(32, 32)
            .png({ quality: 100 })
            .toFile(path.join(__dirname, 'public', 'favicon.png'));
        
        // Gerar também favicon.ico usando sharp
        await sharp(Buffer.from(faviconSVG))
            .resize(32, 32)
            .png()
            .toFile(path.join(__dirname, 'public', 'favicon.ico'));
        
        console.log('✅ Gerado: favicon.png e favicon.ico');
        
        // Gerar apple-touch-icon
        const appleTouchSVG = createBaseSVG(180, false);
        await sharp(Buffer.from(appleTouchSVG))
            .resize(180, 180)
            .png({ quality: 100 })
            .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
        
        console.log('✅ Gerado: apple-touch-icon.png');
        
        console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
        console.log('📁 Localização: public/icons/');
        console.log('🔍 Verifique a qualidade no navegador');
        
    } catch (error) {
        console.error('❌ Erro ao gerar ícones:', error);
    }
}

// Executar
generateIcons();