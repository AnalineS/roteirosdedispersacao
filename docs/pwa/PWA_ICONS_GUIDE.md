# 📱 Guia de Ícones PWA - Roteiros de Dispensação

Este documento detalha como criar e configurar os ícones para Progressive Web App (PWA).

## [TARGET] **Ícones Necessários**

### Tamanhos Obrigatórios
```json
{
  "72x72": "icon-72.png",
  "96x96": "icon-96.png", 
  "128x128": "icon-128.png",
  "144x144": "icon-144.png",
  "152x152": "icon-152.png",
  "192x192": "icon-192.png",
  "384x384": "icon-384.png",
  "512x512": "icon-512.png"
}
```

### Ícones Especiais
- **favicon.png**: 32x32 ou 16x16
- **apple-touch-icon**: 180x180 (iOS)
- **maskable icons**: 192x192 e 512x512 com área segura

## 🎨 **Design Guidelines**

### Conceito Visual
- **Tema**: Saúde + Educação + Tecnologia
- **Cores Primárias**: 
  - Azul: `#2563eb` (Dr. Gasnelio)
  - Verde: `#16a34a` (Gá)
- **Símbolo**: Combinação de:
  - Cruz médica ou caduceu
  - Livro ou símbolo educacional
  - Elementos que remetam à hanseníase/dermatologia

### Elementos Visuais
```
Ícone Base (512x512):
┌─────────────────────┐
│  🏥 +  📚 + 💊     │  
│                     │
│    PQT-U           │
│  Educacional       │
│                     │
│   Dr.G    +   Gá   │
└─────────────────────┘
```

### Área Segura (Maskable)
- **Área total**: 512x512
- **Área segura**: 410x410 (80% do total)
- **Margem**: 51px em todos os lados

## 🛠️ **Ferramentas Recomendadas**

### Online (Gratuitas)
1. **PWA Builder** (Microsoft): https://www.pwabuilder.com/imageGenerator
2. **Favicon.io**: https://favicon.io/favicon-generator/
3. **Real Favicon Generator**: https://realfavicongenerator.net/

### Programas Desktop
1. **GIMP** (Gratuito)
2. **Canva** (Templates PWA)
3. **Figma** (Design colaborativo)

### Scripts Automatizados
```bash
# Instalar imagemagick
npm install -g sharp-cli

# Gerar todos os tamanhos a partir de um 512x512
sharp -i icon-512.png -o icon-384.png resize 384 384
sharp -i icon-512.png -o icon-192.png resize 192 192
sharp -i icon-512.png -o icon-152.png resize 152 152
sharp -i icon-512.png -o icon-144.png resize 144 144
sharp -i icon-512.png -o icon-128.png resize 128 128
sharp -i icon-512.png -o icon-96.png resize 96 96
sharp -i icon-512.png -o icon-72.png resize 72 72
```

## [LIST] **Checklist de Implementação**

### Criação dos Ícones
- [ ] Design base 512x512 criado
- [ ] Versão maskable 512x512 (com área segura)
- [ ] Todos os tamanhos gerados
- [ ] Favicon 32x32 criado
- [ ] Apple touch icon 180x180 criado

### Validação Técnica
- [ ] Formato PNG com transparência
- [ ] Compression otimizada
- [ ] Nomes seguem convenção
- [ ] Todos os arquivos em `/public/`

### Testes
- [ ] Manifest válido no DevTools
- [ ] Ícones aparecem no lighthouse
- [ ] Instalação funciona no mobile
- [ ] Ícones corretos no launcher

## 🔄 **Processo de Criação Detalhado**

### 1. Design Base (512x512)
```
Estrutura Visual:
- Background: Gradiente azul-verde sutil
- Centro: Logo/símbolo principal
- Texto: "PQT-U" ou símbolo médico
- Bordas: Arredondadas (raio 10%)
```

### 2. Versão Maskable
```
Modificações:
- Expandir background para bordas
- Centralizar elementos importantes
- Verificar área segura 410x410
- Testar com máscaras circulares/quadradas
```

### 3. Geração dos Tamanhos
```bash
# Exemplo com ImageMagick
convert icon-512.png -resize 384x384 icon-384.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 152x152 icon-152.png
convert icon-512.png -resize 144x144 icon-144.png
convert icon-512.png -resize 128x128 icon-128.png
convert icon-512.png -resize 96x96 icon-96.png
convert icon-512.png -resize 72x72 icon-72.png

# Favicon especial
convert icon-512.png -resize 32x32 favicon.png
```

## [TEST] **Testes e Validação**

### Chrome DevTools
1. Abrir F12 -> Application -> Manifest
2. Verificar se todos os ícones carregam
3. Testar "Install app" no mobile

### Lighthouse PWA Audit
```bash
# Executar audit
npm run build
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Verificar score PWA > 90
```

### Ferramentas Online
- **Manifest Validator**: https://manifest-validator.appspot.com/
- **PWA Testing**: https://www.webpagetest.org/
- **Mobile Simulator**: Chrome DevTools Device Mode

## 📱 **Comportamento por Plataforma**

### Android Chrome
- Usa ícones 192x192 e 512x512
- Suporte completo a maskable
- Install banner automático

### iOS Safari
- Usa apple-touch-icon preferencial
- Fallback para 192x192
- Install via "Add to Home Screen"

### Windows Edge
- Suporte completo a manifest
- Integração com Start Menu
- Notificações nativas

### Desktop Chrome
- Ícones menores (72x72, 96x96)
- Install via omnibox
- Window management

## 🛠️ **Implementação no Código**

### Manifest.json (Já Configurado)
```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192", 
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### HTML Meta Tags (Já Configurado)
```html
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="theme-color" content="#2563eb">
```

### Service Worker Cache
```javascript
// Em sw.js - já implementado
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];
```

## [TARGET] **Próximos Passos**

1. **Criar design base 512x512**
2. **Gerar todos os tamanhos automaticamente**
3. **Testar instalação em diferentes dispositivos**
4. **Validar com Lighthouse PWA audit**
5. **Documentar processo final**

## 📞 **Recursos e Suporte**

- **Documentação PWA**: https://web.dev/progressive-web-apps/
- **Manifest Spec**: https://w3c.github.io/manifest/
- **Icon Guidelines**: https://web.dev/maskable-icon/
- **Testing Tools**: https://web.dev/pwa-checklist/

---

**Última atualização**: 16/08/2025  
**Responsável**: Sistema PWA - Roteiros de Dispensação  
**Status**: Preparado para implementação