// Complete Diagnostic Tool for Healthcare System
const DebugTool = {
  async runFullDiagnostics() {
    console.log('🔍 Iniciando diagnóstico completo do sistema...\n');
    
    const results = {
      errors: [],
      warnings: [],
      suggestions: [],
      passed: []
    };
    
    try {
      // 1. Verificar Manifest
      console.log('📋 Verificando Manifest...');
      await this.checkManifest(results);
      
      // 2. Verificar Service Worker
      console.log('⚙️ Verificando Service Worker...');
      await this.checkServiceWorker(results);
      
      // 3. Verificar Recursos
      console.log('📦 Verificando Recursos...');
      await this.checkResources(results);
      
      // 4. Verificar Ícones PWA
      console.log('🎨 Verificando Ícones PWA...');
      await this.checkIcons(results);
      
      // 5. Verificar Performance
      console.log('🚀 Verificando Performance...');
      await this.checkPerformance(results);
      
      // 6. Verificar Acessibilidade
      console.log('♿ Verificando Acessibilidade...');
      this.checkAccessibility(results);
      
      // 7. Verificar Responsividade
      console.log('📱 Verificando Responsividade...');
      this.checkResponsiveness(results);
      
      // 8. Verificar Console Errors
      console.log('🐛 Verificando Erros de Console...');
      this.checkConsoleErrors(results);
      
    } catch (error) {
      results.errors.push(`Erro crítico no diagnóstico: ${error.message}`);
    }
    
    // Relatório Final
    this.generateReport(results);
    return results;
  },
  
  async checkManifest(results) {
    try {
      const response = await fetch('/manifest.json');
      if (!response.ok) {
        results.errors.push('❌ Manifest.json não encontrado ou inacessível');
        return;
      }
      
      const manifest = await response.json();
      
      // Verificar campos obrigatórios
      const requiredFields = ['name', 'short_name', 'icons', 'start_url', 'display'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        results.errors.push(`❌ Campos obrigatórios ausentes no manifest: ${missingFields.join(', ')}`);
      } else {
        results.passed.push('✅ Manifest tem todos os campos obrigatórios');
      }
      
      // Verificar ícones do manifest
      if (manifest.icons && manifest.icons.length > 0) {
        const iconSizes = manifest.icons.map(icon => icon.sizes);
        const requiredSizes = ['192x192', '512x512'];
        const missingSizes = requiredSizes.filter(size => !iconSizes.includes(size));
        
        if (missingSizes.length > 0) {
          results.warnings.push(`⚠️ Tamanhos de ícone recomendados ausentes: ${missingSizes.join(', ')}`);
        } else {
          results.passed.push('✅ Ícones PWA com tamanhos adequados');
        }
        
        // Verificar purpose incorreto
        const badPurpose = manifest.icons.filter(icon => 
          icon.purpose && icon.purpose.includes('maskable any')
        );
        if (badPurpose.length > 0) {
          results.warnings.push('⚠️ Ícones com purpose "maskable any" podem causar problemas');
        }
      }
      
    } catch (error) {
      results.errors.push(`❌ Erro ao verificar manifest: ${error.message}`);
    }
  },
  
  async checkServiceWorker(results) {
    try {
      if (!('serviceWorker' in navigator)) {
        results.errors.push('❌ Service Worker não suportado neste navegador');
        return;
      }
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        results.warnings.push('⚠️ Nenhum Service Worker registrado');
      } else {
        const activeWorkers = registrations.filter(reg => reg.active);
        if (activeWorkers.length > 0) {
          results.passed.push(`✅ ${activeWorkers.length} Service Worker(s) ativo(s)`);
          
          // Verificar se está interceptando requests
          const swScope = activeWorkers[0].scope;
          results.suggestions.push(`ℹ️ Service Worker ativo no escopo: ${swScope}`);
        } else {
          results.warnings.push('⚠️ Service Worker registrado mas não ativo');
        }
      }
      
    } catch (error) {
      results.errors.push(`❌ Erro ao verificar Service Worker: ${error.message}`);
    }
  },
  
  async checkResources(results) {
    // Lista de recursos críticos para verificar
    const criticalResources = [
      { url: '/manifest.json', description: 'Manifest PWA' },
      { url: '/sw.js', description: 'Service Worker' },
      { url: '/icon-192.png', description: 'Ícone 192x192' },
      { url: '/icon-512.png', description: 'Ícone 512x512' },
      { url: '/icons/icon-192x192.png', description: 'Ícone PWA 192x192' },
      { url: '/icons/icon-512x512.png', description: 'Ícone PWA 512x512' }
    ];
    
    const checkPromises = criticalResources.map(async (resource) => {
      try {
        const response = await fetch(resource.url, { method: 'HEAD' });
        if (response.ok) {
          results.passed.push(`✅ ${resource.description} encontrado`);
        } else {
          results.errors.push(`❌ ${resource.description} retornou status ${response.status}`);
        }
      } catch (error) {
        results.errors.push(`❌ ${resource.description} não acessível: ${error.message}`);
      }
    });
    
    await Promise.all(checkPromises);
  },
  
  async checkIcons(results) {
    const iconSizes = [
      '72x72', '96x96', '128x128', '144x144', '152x152', 
      '192x192', '384x384', '512x512'
    ];
    
    const checkPromises = iconSizes.map(async (size) => {
      try {
        const response = await fetch(`/icons/icon-${size}.png`, { method: 'HEAD' });
        if (response.ok) {
          results.passed.push(`✅ Ícone ${size} encontrado`);
        } else {
          results.warnings.push(`⚠️ Ícone ${size} não encontrado`);
        }
      } catch (error) {
        results.warnings.push(`⚠️ Erro ao verificar ícone ${size}`);
      }
    });
    
    await Promise.all(checkPromises);
    
    // Verificar ícones maskable
    const maskableSizes = ['192x192', '512x512'];
    const maskablePromises = maskableSizes.map(async (size) => {
      try {
        const response = await fetch(`/icons/icon-maskable-${size}.png`, { method: 'HEAD' });
        if (response.ok) {
          results.passed.push(`✅ Ícone maskable ${size} encontrado`);
        } else {
          results.suggestions.push(`💡 Considere adicionar ícone maskable ${size}`);
        }
      } catch (error) {
        results.suggestions.push(`💡 Ícone maskable ${size} recomendado para melhor integração`);
      }
    });
    
    await Promise.all(maskablePromises);
  },
  
  async checkPerformance(results) {
    try {
      // Verificar First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcp) {
        if (fcp.startTime < 1500) {
          results.passed.push(`✅ First Contentful Paint excelente: ${fcp.startTime.toFixed(0)}ms`);
        } else if (fcp.startTime < 2500) {
          results.warnings.push(`⚠️ First Contentful Paint moderado: ${fcp.startTime.toFixed(0)}ms`);
        } else {
          results.errors.push(`❌ First Contentful Paint lento: ${fcp.startTime.toFixed(0)}ms`);
        }
      }
      
      // Verificar tamanho total dos recursos
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      if (totalSize < 1 * 1024 * 1024) { // 1MB
        results.passed.push(`✅ Tamanho total excelente: ${totalSizeMB}MB`);
      } else if (totalSize < 3 * 1024 * 1024) { // 3MB
        results.warnings.push(`⚠️ Tamanho total moderado: ${totalSizeMB}MB`);
      } else {
        results.errors.push(`❌ Tamanho total grande: ${totalSizeMB}MB`);
      }
      
      // Verificar recursos grandes
      const largeResources = resources.filter(r => r.transferSize > 500000);
      if (largeResources.length > 0) {
        largeResources.forEach(resource => {
          const sizeMB = (resource.transferSize / 1024 / 1024).toFixed(2);
          results.warnings.push(`⚠️ Recurso grande: ${resource.name.split('/').pop()} (${sizeMB}MB)`);
        });
      }
      
      // Verificar tempo de carregamento da página
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 0) {
        if (loadTime < 2000) {
          results.passed.push(`✅ Tempo de carregamento excelente: ${loadTime}ms`);
        } else if (loadTime < 4000) {
          results.warnings.push(`⚠️ Tempo de carregamento moderado: ${loadTime}ms`);
        } else {
          results.errors.push(`❌ Tempo de carregamento lento: ${loadTime}ms`);
        }
      }
      
    } catch (error) {
      results.warnings.push(`⚠️ Erro ao verificar performance: ${error.message}`);
    }
  },
  
  checkAccessibility(results) {
    try {
      // Verificar imagens sem alt
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length === 0) {
        results.passed.push('✅ Todas as imagens têm atributo alt');
      } else {
        results.errors.push(`❌ ${imagesWithoutAlt.length} imagens sem atributo alt`);
      }
      
      // Verificar headings estruturados
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const h1Count = document.querySelectorAll('h1').length;
      
      if (h1Count === 1) {
        results.passed.push('✅ Estrutura de heading adequada (1 h1)');
      } else if (h1Count === 0) {
        results.errors.push('❌ Nenhum h1 encontrado na página');
      } else {
        results.warnings.push(`⚠️ Múltiplos h1 encontrados: ${h1Count}`);
      }
      
      // Verificar links sem texto
      const emptyLinks = document.querySelectorAll('a:not([aria-label]):empty');
      if (emptyLinks.length > 0) {
        results.errors.push(`❌ ${emptyLinks.length} links sem texto ou aria-label`);
      } else {
        results.passed.push('✅ Todos os links têm texto descritivo');
      }
      
      // Verificar botões sem texto
      const emptyButtons = document.querySelectorAll('button:not([aria-label]):empty');
      if (emptyButtons.length > 0) {
        results.errors.push(`❌ ${emptyButtons.length} botões sem texto ou aria-label`);
      } else {
        results.passed.push('✅ Todos os botões têm texto descritivo');
      }
      
      // Verificar elementos interativos com tamanho adequado
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
      let smallElements = 0;
      
      interactiveElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          smallElements++;
        }
      });
      
      if (smallElements === 0) {
        results.passed.push('✅ Elementos interativos têm tamanho adequado (44px+)');
      } else {
        results.warnings.push(`⚠️ ${smallElements} elementos interativos pequenos (< 44px)`);
      }
      
      // Verificar skip links
      const skipLinks = document.querySelectorAll('.skip-link, [href="#main-content"]');
      if (skipLinks.length > 0) {
        results.passed.push('✅ Skip links encontrados');
      } else {
        results.suggestions.push('💡 Considere adicionar skip links para navegação por teclado');
      }
      
    } catch (error) {
      results.warnings.push(`⚠️ Erro ao verificar acessibilidade: ${error.message}`);
    }
  },
  
  checkResponsiveness(results) {
    try {
      // Verificar viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport && viewport.content.includes('width=device-width')) {
        results.passed.push('✅ Viewport meta tag configurada corretamente');
      } else {
        results.errors.push('❌ Viewport meta tag ausente ou incorreta');
      }
      
      // Verificar se há media queries no CSS
      let hasMediaQueries = false;
      try {
        const stylesheets = Array.from(document.styleSheets);
        stylesheets.forEach(sheet => {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach(rule => {
              if (rule.type === CSSRule.MEDIA_RULE) {
                hasMediaQueries = true;
              }
            });
          }
        });
      } catch (e) {
        // CORS pode bloquear acesso a algumas stylesheets
        results.suggestions.push('💡 Verificação de media queries bloqueada por CORS');
      }
      
      if (hasMediaQueries) {
        results.passed.push('✅ Media queries encontradas no CSS');
      } else {
        results.warnings.push('⚠️ Poucas ou nenhuma media query encontrada');
      }
      
      // Verificar overflow horizontal
      const bodyWidth = document.body.scrollWidth;
      const windowWidth = window.innerWidth;
      
      if (bodyWidth <= windowWidth + 5) { // 5px de tolerância
        results.passed.push('✅ Sem overflow horizontal');
      } else {
        results.warnings.push(`⚠️ Possível overflow horizontal: ${bodyWidth - windowWidth}px`);
      }
      
      // Verificar elementos com largura fixa que podem causar problemas
      const fixedWidthElements = document.querySelectorAll('[style*="width:"], [style*="min-width:"]');
      const problematicElements = Array.from(fixedWidthElements).filter(el => {
        const style = el.getAttribute('style');
        return style && /width:\s*\d+px/.test(style);
      });
      
      if (problematicElements.length > 0) {
        results.warnings.push(`⚠️ ${problematicElements.length} elementos com largura fixa em pixels`);
      }
      
    } catch (error) {
      results.warnings.push(`⚠️ Erro ao verificar responsividade: ${error.message}`);
    }
  },
  
  checkConsoleErrors(results) {
    // Interceptar console.error para capturar erros
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Restaurar após um tempo
    setTimeout(() => {
      console.error = originalError;
    }, 1000);
    
    // Verificar erros de recursos (404s, etc.)
    const resourceErrors = performance.getEntriesByType('resource')
      .filter(resource => resource.responseStatus && resource.responseStatus >= 400);
    
    if (resourceErrors.length > 0) {
      resourceErrors.forEach(resource => {
        results.errors.push(`❌ Recurso com erro ${resource.responseStatus}: ${resource.name}`);
      });
    } else {
      results.passed.push('✅ Nenhum erro de recurso HTTP encontrado');
    }
    
    // Verificar erros JavaScript globais
    let jsErrors = 0;
    const originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      jsErrors++;
      results.errors.push(`❌ Erro JavaScript: ${message} em ${source}:${lineno}`);
      if (originalOnError) originalOnError.apply(window, arguments);
    };
    
    setTimeout(() => {
      window.onerror = originalOnError;
      if (jsErrors === 0) {
        results.passed.push('✅ Nenhum erro JavaScript global detectado');
      }
    }, 1000);
  },
  
  generateReport(results) {
    console.log('\n📊 RELATÓRIO COMPLETO DE DIAGNÓSTICO\n');
    console.log('='.repeat(60));
    
    // Estatísticas gerais
    const totalIssues = results.errors.length + results.warnings.length;
    const totalPassed = results.passed.length;
    const score = totalPassed > 0 ? Math.round((totalPassed / (totalPassed + totalIssues)) * 100) : 0;
    
    console.log(`\n📈 RESUMO EXECUTIVO:`);
    console.log(`   • Score de Qualidade: ${score}%`);
    console.log(`   • Testes Aprovados: ${totalPassed}`);
    console.log(`   • Erros Críticos: ${results.errors.length}`);
    console.log(`   • Avisos: ${results.warnings.length}`);
    console.log(`   • Sugestões: ${results.suggestions.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERROS CRÍTICOS (PRECISAM SER CORRIGIDOS):');
      results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️ AVISOS (RECOMENDADO CORRIGIR):');
      results.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }
    
    if (results.suggestions.length > 0) {
      console.log('\n💡 SUGESTÕES DE MELHORIA:');
      results.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }
    
    if (results.passed.length > 0) {
      console.log('\n✅ TESTES APROVADOS:');
      results.passed.forEach((pass, i) => {
        console.log(`   ${i + 1}. ${pass}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Recomendações baseadas no score
    if (score >= 90) {
      console.log('🎉 EXCELENTE! Sistema está funcionando muito bem.');
    } else if (score >= 70) {
      console.log('👍 BOM! Alguns ajustes podem melhorar a qualidade.');
    } else if (score >= 50) {
      console.log('⚠️ REGULAR! Várias melhorias são necessárias.');
    } else {
      console.log('🚨 CRÍTICO! Sistema precisa de correções imediatas.');
    }
    
    console.log('\n🔧 Próximos passos recomendados:');
    if (results.errors.length > 0) {
      console.log('   1. Corrigir todos os erros críticos');
    }
    if (results.warnings.length > 0) {
      console.log('   2. Implementar correções para os avisos');
    }
    if (results.suggestions.length > 0) {
      console.log('   3. Considerar implementar as sugestões de melhoria');
    }
    console.log('   4. Re-executar diagnóstico após correções');
    
    console.log('\n📞 Para executar novamente: DebugTool.runFullDiagnostics()');
  }
};

// Auto-executar se chamado diretamente
if (typeof window !== 'undefined') {
  window.DebugTool = DebugTool;
  
  // Executar automaticamente se a página já carregou
  if (document.readyState === 'complete') {
    console.log('🚀 Executando diagnóstico automático...');
    DebugTool.runFullDiagnostics();
  } else {
    window.addEventListener('load', () => {
      console.log('🚀 Executando diagnóstico automático...');
      DebugTool.runFullDiagnostics();
    });
  }
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebugTool;
}