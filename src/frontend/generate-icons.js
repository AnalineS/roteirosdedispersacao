const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Function to generate maskable icon with safe area
function generateMaskableIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - full size with padding for maskable safe area
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, size, size);
    
    // Safe area is 80% of icon size (10% padding on each side)
    const safeArea = size * 0.8;
    const padding = size * 0.1;
    
    // White circle in safe area
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size/2, size/2, safeArea/2.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Text in safe area
    ctx.fillStyle = '#2563eb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Main text
    ctx.font = `bold ${safeArea * 0.3}px Arial`;
    ctx.fillText('RD', size/2, size/2 - safeArea*0.05);
    
    // Subtitle
    ctx.font = `${safeArea * 0.08}px Arial`;
    ctx.fillText('PQT-U', size/2, size/2 + safeArea*0.15);
    
    return canvas;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563eb'); // primary-600
    gradient.addColorStop(1, '#1e40af'); // primary-700
    
    // Background with rounded corners
    const radius = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // White text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Main text
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.fillText('RD', size/2, size/2 - size*0.05);
    
    // Subtitle
    ctx.font = `${size * 0.08}px Arial`;
    ctx.fillText('PQT-U', size/2, size/2 + size*0.15);
    
    // Save icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
    
    // Also save in public root for common sizes
    if (size === 192 || size === 512) {
        fs.writeFileSync(path.join(__dirname, 'public', `icon-${size}.png`), buffer);
    }
    
    console.log(`Generated icon-${size}x${size}.png`);
});

// Create favicon.ico (using 32x32)
const faviconSize = 32;
const faviconCanvas = createCanvas(faviconSize, faviconSize);
const faviconCtx = faviconCanvas.getContext('2d');

// Simple favicon
faviconCtx.fillStyle = '#2563eb';
faviconCtx.fillRect(0, 0, faviconSize, faviconSize);
faviconCtx.fillStyle = 'white';
faviconCtx.font = `bold ${faviconSize * 0.7}px Arial`;
faviconCtx.textAlign = 'center';
faviconCtx.textBaseline = 'middle';
faviconCtx.fillText('R', faviconSize/2, faviconSize/2);

const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.png'), faviconBuffer);

// Generate maskable icons for key sizes
console.log('\nGenerating maskable icons...');
[192, 512].forEach(size => {
    const maskableCanvas = generateMaskableIcon(size);
    const maskableBuffer = maskableCanvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}-maskable.png`), maskableBuffer);
    console.log(`Generated icon-${size}x${size}-maskable.png`);
});

console.log('\nAll icons generated successfully!');