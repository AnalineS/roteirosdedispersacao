// Teste Automatizado do Deploy
const SITE_URL = 'https://roteiros-de-dispensacao.web.app';

async function testDeployment() {
    console.log('🧪 Iniciando testes de deploy...\n');
    
    const tests = [];
    
    try {
        // 1. Teste de conectividade básica
        console.log('1. Testando conectividade básica...');
        const response = await fetch(SITE_URL);
        
        if (response.ok) {
            tests.push({ name: 'Conectividade', status: 'PASS', details: `Status: ${response.status}` });
        } else {
            tests.push({ name: 'Conectividade', status: 'FAIL', details: `Status: ${response.status}` });
        }
        
        // 2. Teste do Manifest
        console.log('2. Testando PWA Manifest...');
        try {
            const manifestResponse = await fetch(`${SITE_URL}/manifest.json`);
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                if (manifest.name && manifest.icons && manifest.start_url) {
                    tests.push({ name: 'PWA Manifest', status: 'PASS', details: `Nome: ${manifest.name}` });
                } else {
                    tests.push({ name: 'PWA Manifest', status: 'FAIL', details: 'Campos obrigatórios ausentes' });
                }
            } else {
                tests.push({ name: 'PWA Manifest', status: 'FAIL', details: `Status: ${manifestResponse.status}` });
            }
        } catch (error) {
            tests.push({ name: 'PWA Manifest', status: 'ERROR', details: error.message });
        }
        
        // 3. Teste do Service Worker
        console.log('3. Testando Service Worker...');
        try {
            const swResponse = await fetch(`${SITE_URL}/sw.js`);
            if (swResponse.ok) {
                tests.push({ name: 'Service Worker', status: 'PASS', details: 'Arquivo acessível' });
            } else {
                tests.push({ name: 'Service Worker', status: 'FAIL', details: `Status: ${swResponse.status}` });
            }
        } catch (error) {
            tests.push({ name: 'Service Worker', status: 'ERROR', details: error.message });
        }
        
        // 4. Teste de ícones PWA
        console.log('4. Testando ícones PWA...');
        const iconSizes = ['192x192', '512x512'];
        let iconTests = 0;
        let iconPass = 0;
        
        for (const size of iconSizes) {
            iconTests++;
            try {
                const iconResponse = await fetch(`${SITE_URL}/icons/icon-${size}.png`);
                if (iconResponse.ok) {
                    iconPass++;
                }
            } catch (error) {
                // Ignora erros de ícones individuais
            }
        }
        
        if (iconPass === iconTests) {
            tests.push({ name: 'Ícones PWA', status: 'PASS', details: `${iconPass}/${iconTests} ícones encontrados` });
        } else {
            tests.push({ name: 'Ícones PWA', status: 'WARN', details: `${iconPass}/${iconTests} ícones encontrados` });
        }
        
        // 5. Teste de headers de segurança
        console.log('5. Testando headers de segurança...');
        const securityHeaders = ['x-frame-options', 'x-content-type-options', 'content-security-policy'];
        const foundHeaders = [];
        
        for (const header of securityHeaders) {
            if (response.headers.get(header)) {
                foundHeaders.push(header);
            }
        }
        
        if (foundHeaders.length >= 2) {
            tests.push({ name: 'Headers Segurança', status: 'PASS', details: `${foundHeaders.length}/3 headers configurados` });
        } else {
            tests.push({ name: 'Headers Segurança', status: 'WARN', details: `${foundHeaders.length}/3 headers configurados` });
        }
        
        // 6. Teste de performance básica
        console.log('6. Testando performance básica...');
        const startTime = Date.now();
        await fetch(SITE_URL);
        const loadTime = Date.now() - startTime;
        
        if (loadTime < 2000) {
            tests.push({ name: 'Performance', status: 'PASS', details: `Tempo de resposta: ${loadTime}ms` });
        } else if (loadTime < 5000) {
            tests.push({ name: 'Performance', status: 'WARN', details: `Tempo de resposta: ${loadTime}ms` });
        } else {
            tests.push({ name: 'Performance', status: 'FAIL', details: `Tempo de resposta: ${loadTime}ms` });
        }
        
    } catch (error) {
        tests.push({ name: 'Teste Geral', status: 'ERROR', details: error.message });
    }
    
    // Gerar relatório
    console.log('\n📊 RELATÓRIO DE TESTE DE DEPLOY');
    console.log('='.repeat(50));
    
    let passed = 0;
    let warnings = 0;
    let failed = 0;
    let errors = 0;
    
    tests.forEach(test => {
        let icon;
        switch (test.status) {
            case 'PASS': icon = '✅'; passed++; break;
            case 'WARN': icon = '⚠️'; warnings++; break;
            case 'FAIL': icon = '❌'; failed++; break;
            case 'ERROR': icon = '💥'; errors++; break;
        }
        
        console.log(`${icon} ${test.name}: ${test.details}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`📈 RESUMO: ${passed} passou | ${warnings} avisos | ${failed} falhou | ${errors} erros`);
    
    const totalTests = tests.length;
    const score = Math.round((passed / totalTests) * 100);
    console.log(`🎯 SCORE: ${score}%`);
    
    if (score >= 90) {
        console.log('🎉 EXCELENTE! Deploy foi bem-sucedido!');
    } else if (score >= 70) {
        console.log('👍 BOM! Deploy funcional com algumas melhorias recomendadas.');
    } else {
        console.log('⚠️ ATENÇÃO! Deploy com problemas que precisam ser corrigidos.');
    }
    
    console.log(`\n🌐 URL: ${SITE_URL}`);
    console.log('📱 Teste manualmente a instalação PWA em dispositivos móveis');
    console.log('🧪 Abra o DevTools e execute: DebugTool.runFullDiagnostics()');
    
    return { score, tests, url: SITE_URL };
}

// Executar teste se chamado diretamente
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    testDeployment().catch(console.error);
} else {
    // Browser environment
    console.log('Execute: testDeployment() para testar o deploy');
}

// Exportar para uso
if (typeof module !== 'undefined') {
    module.exports = { testDeployment };
}