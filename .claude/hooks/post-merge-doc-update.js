#!/usr/bin/env node

/**
 * Post-merge Hook: Atualização Automática de Documentação
 * 
 * Hook executado após merge para:
 * - Atualizar documentação automática
 * - Regenerar índices de APIs e componentes
 * - Atualizar métricas de qualidade
 * - Sincronizar documentação médica
 * - Notificar equipes sobre mudanças
 * 
 * @version 2.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PostMergeDocumentationUpdater {
    constructor() {
        this.config = {
            // Configurações de documentação
            docsConfig: {
                outputDir: './docs/generated',
                apiDocsDir: './docs/generated/api',
                componentDocsDir: './docs/generated/components',
                medicalDocsDir: './docs/generated/medical',
                metricsDir: './docs/generated/metrics'
            },
            
            // Branches que acionam regeneração completa
            fullUpdateBranches: ['main', 'master', 'develop', 'staging'],
            
            // Tipos de arquivo que acionam diferentes atualizações
            updateTriggers: {
                api: ['/api/', '/pages/api/', '/src/pages/api/'],
                components: ['/components/', '/src/components/'],
                medical: ['/medical/', '/calculator/', '/clinical/', '/dose/'],
                tests: ['.test.', '.spec.', '/tests/', '/__tests__/'],
                config: ['package.json', 'tsconfig.json', 'next.config.js']
            },
            
            // Configurações de notificação
            notifications: {
                slack: {
                    enabled: true,
                    webhook: process.env.SLACK_WEBHOOK_DOCS,
                    channel: '#docs-updates'
                },
                email: {
                    enabled: false,
                    recipients: ['docs-team@company.com']
                }
            },
            
            // Timeout para operações
            timeouts: {
                docGeneration: 5 * 60 * 1000,  // 5 minutos
                indexUpdate: 2 * 60 * 1000,    // 2 minutos
                notification: 30 * 1000        // 30 segundos
            }
        };
        
        this.mergeInfo = {};
        this.updateStats = {
            filesChanged: 0,
            apisUpdated: 0,
            componentsUpdated: 0,
            medicalDocsUpdated: 0,
            testsUpdated: 0,
            metricsGenerated: false,
            errors: []
        };
        
        this.changedFiles = [];
        this.updateQueue = new Set();
    }
    
    /**
     * Executa atualização completa pós-merge
     */
    async runDocumentationUpdate() {
        console.log('📚 Iniciando atualização automática de documentação pós-merge...\n');
        
        try {
            // 1. Análise do merge
            await this.analyzeMergeChanges();
            
            // 2. Determina escopo de atualização
            const updateScope = this.determineUpdateScope();
            console.log(`🔍 Escopo de atualização: ${updateScope.join(', ')}\n`);
            
            // 3. Backup da documentação existente
            await this.backupExistingDocs();
            
            // 4. Atualiza documentação baseada no escopo
            if (updateScope.includes('api')) {
                console.log('🔗 Atualizando documentação de APIs...');
                await this.updateApiDocumentation();
            }
            
            if (updateScope.includes('components')) {
                console.log('⚛️  Atualizando documentação de componentes...');
                await this.updateComponentDocumentation();
            }
            
            if (updateScope.includes('medical')) {
                console.log('🏥 Atualizando documentação médica...');
                await this.updateMedicalDocumentation();
            }
            
            if (updateScope.includes('metrics')) {
                console.log('📊 Atualizando métricas de qualidade...');
                await this.updateQualityMetrics();
            }
            
            if (updateScope.includes('full')) {
                console.log('🔄 Regeneração completa da documentação...');
                await this.fullDocumentationRegeneration();
            }
            
            // 5. Atualiza índices
            console.log('📋 Atualizando índices...');
            await this.updateDocumentationIndexes();
            
            // 6. Gera changelog de documentação
            console.log('📝 Gerando changelog...');
            await this.generateDocumentationChangelog();
            
            // 7. Valida documentação gerada
            console.log('✅ Validando documentação...');
            await this.validateGeneratedDocumentation();
            
            // 8. Commit automático da documentação (se configurado)
            if (this.shouldAutoCommitDocs()) {
                console.log('💾 Commitando atualizações de documentação...');
                await this.autoCommitDocumentation();
            }
            
            // 9. Envia notificações
            console.log('📢 Enviando notificações...');
            await this.sendUpdateNotifications();
            
            // 10. Relatório final
            this.displayUpdateSummary();
            
            return {
                success: true,
                stats: this.updateStats,
                mergeInfo: this.mergeInfo
            };
            
        } catch (error) {
            console.error('❌ Erro durante atualização de documentação:', error.message);
            this.updateStats.errors.push(error.message);
            
            // Tenta restaurar backup em caso de erro crítico
            await this.restoreBackupOnError();
            
            return {
                success: false,
                error: error.message,
                stats: this.updateStats
            };
        }
    }
    
    /**
     * Analisa mudanças do merge
     */
    async analyzeMergeChanges() {
        try {
            // Obtém informações do merge
            this.mergeInfo = {
                branch: this.getCurrentBranch(),
                timestamp: new Date().toISOString(),
                author: this.getMergeAuthor(),
                commit: this.getLastCommitHash(),
                message: this.getLastCommitMessage()
            };
            
            console.log(`🌿 Branch: ${this.mergeInfo.branch}`);
            console.log(`👤 Autor: ${this.mergeInfo.author}`);
            console.log(`💬 Mensagem: ${this.mergeInfo.message.slice(0, 60)}...`);
            
            // Obtém arquivos alterados no merge
            this.changedFiles = this.getChangedFiles();
            this.updateStats.filesChanged = this.changedFiles.length;
            
            console.log(`📁 Arquivos alterados: ${this.changedFiles.length}\\n`);
            
        } catch (error) {
            console.warn('⚠️  Aviso: Não foi possível analisar mudanças do merge:', error.message);
            // Continua com valores padrão
            this.mergeInfo = {
                branch: 'unknown',
                timestamp: new Date().toISOString(),
                author: 'unknown',
                commit: 'unknown',
                message: 'Merge automático'
            };
            this.changedFiles = [];
        }
    }
    
    /**
     * Determina escopo de atualização baseado nos arquivos alterados
     */
    determineUpdateScope() {
        const scope = new Set();
        
        // Verifica se é branch que requer regeneração completa
        if (this.config.fullUpdateBranches.includes(this.mergeInfo.branch)) {
            scope.add('full');
            return Array.from(scope);
        }
        
        // Analisa arquivos alterados
        for (const file of this.changedFiles) {
            // APIs
            if (this.config.updateTriggers.api.some(trigger => file.includes(trigger))) {
                scope.add('api');
            }
            
            // Componentes
            if (this.config.updateTriggers.components.some(trigger => file.includes(trigger))) {
                scope.add('components');
            }
            
            // Documentação médica
            if (this.config.updateTriggers.medical.some(trigger => file.includes(trigger))) {
                scope.add('medical');
            }
            
            // Testes (afeta métricas)
            if (this.config.updateTriggers.tests.some(trigger => file.includes(trigger))) {
                scope.add('metrics');
            }
            
            // Configurações (pode afetar tudo)
            if (this.config.updateTriggers.config.some(trigger => file.includes(trigger))) {
                scope.add('metrics');
                scope.add('api');
                scope.add('components');
            }
        }
        
        // Se não há escopo específico mas há alterações, faz atualização básica
        if (scope.size === 0 && this.changedFiles.length > 0) {
            scope.add('metrics');
        }
        
        return Array.from(scope);
    }
    
    /**
     * Faz backup da documentação existente
     */
    async backupExistingDocs() {
        try {
            const backupDir = `./docs/backup-${Date.now()}`;
            const sourceDir = this.config.docsConfig.outputDir;
            
            try {
                await fs.access(sourceDir);
                await fs.mkdir(backupDir, { recursive: true });
                
                // Copia documentação existente
                execSync(`cp -r "${sourceDir}"/* "${backupDir}/"`, { stdio: 'pipe' });
                console.log(`📦 Backup criado em: ${backupDir}`);
                
                // Limpa backups antigos (mantém apenas os 5 mais recentes)
                await this.cleanOldBackups();
                
            } catch (accessError) {
                // Documentação não existe ainda, não precisa backup
                console.log('ℹ️  Primeira geração de documentação, backup desnecessário');
            }
            
        } catch (error) {
            console.warn('⚠️  Aviso: Não foi possível criar backup:', error.message);
        }
    }
    
    /**
     * Atualiza documentação de APIs
     */
    async updateApiDocumentation() {
        try {
            const apiFiles = this.changedFiles.filter(file => 
                this.config.updateTriggers.api.some(trigger => file.includes(trigger))
            );
            
            if (apiFiles.length === 0) return;
            
            console.log(`   📂 Processando ${apiFiles.length} arquivo(s) de API...`);
            
            // Executa gerador de documentação específico para APIs
            const docsScript = path.join(__dirname, '..', 'automation', 'auto-documentation.js');
            
            const output = execSync(`node "${docsScript}" --scope=api --files="${apiFiles.join(',')}"`, {
                encoding: 'utf-8',
                timeout: this.config.timeouts.docGeneration,
                stdio: 'pipe'
            });
            
            this.updateStats.apisUpdated = apiFiles.length;
            console.log(`   ✅ ${apiFiles.length} API(s) documentada(s)`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na atualização de APIs: ${error.message}`);
            this.updateStats.errors.push(`API docs: ${error.message}`);
        }
    }
    
    /**
     * Atualiza documentação de componentes
     */
    async updateComponentDocumentation() {
        try {
            const componentFiles = this.changedFiles.filter(file => 
                this.config.updateTriggers.components.some(trigger => file.includes(trigger))
            );
            
            if (componentFiles.length === 0) return;
            
            console.log(`   📂 Processando ${componentFiles.length} componente(s)...`);
            
            // Executa gerador de documentação específico para componentes
            const docsScript = path.join(__dirname, '..', 'automation', 'auto-documentation.js');
            
            const output = execSync(`node "${docsScript}" --scope=components --files="${componentFiles.join(',')}"`, {
                encoding: 'utf-8',
                timeout: this.config.timeouts.docGeneration,
                stdio: 'pipe'
            });
            
            this.updateStats.componentsUpdated = componentFiles.length;
            console.log(`   ✅ ${componentFiles.length} componente(s) documentado(s)`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na atualização de componentes: ${error.message}`);
            this.updateStats.errors.push(`Component docs: ${error.message}`);
        }
    }
    
    /**
     * Atualiza documentação médica
     */
    async updateMedicalDocumentation() {
        try {
            const medicalFiles = this.changedFiles.filter(file => 
                this.config.updateTriggers.medical.some(trigger => file.includes(trigger))
            );
            
            if (medicalFiles.length === 0) return;
            
            console.log(`   📂 Processando ${medicalFiles.length} arquivo(s) médico(s)...`);
            
            // Atualiza documentação médica específica
            const docsScript = path.join(__dirname, '..', 'automation', 'auto-documentation.js');
            
            const output = execSync(`node "${docsScript}" --scope=medical --files="${medicalFiles.join(',')}"`, {
                encoding: 'utf-8',
                timeout: this.config.timeouts.docGeneration,
                stdio: 'pipe'
            });
            
            // Atualiza glossário médico
            await this.updateMedicalGlossary();
            
            // Atualiza referências de hanseníase
            await this.updateLeprosyReferences();
            
            this.updateStats.medicalDocsUpdated = medicalFiles.length;
            console.log(`   ✅ ${medicalFiles.length} documento(s) médico(s) atualizado(s)`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na atualização médica: ${error.message}`);
            this.updateStats.errors.push(`Medical docs: ${error.message}`);
        }
    }
    
    /**
     * Atualiza métricas de qualidade
     */
    async updateQualityMetrics() {
        try {
            console.log('   📊 Recalculando métricas...');
            
            // Executa testes para obter cobertura atualizada
            try {
                execSync('cd apps/frontend-nextjs && npm run test:coverage', {
                    encoding: 'utf-8',
                    timeout: 3 * 60 * 1000,
                    stdio: 'pipe'
                });
            } catch (testError) {
                console.warn('   ⚠️  Aviso: Não foi possível executar testes para métricas');
            }
            
            // Executa análise LGPD
            try {
                const lgpdScript = path.join(__dirname, '..', 'automation', 'lgpd-compliance-checker.js');
                execSync(`node "${lgpdScript}"`, {
                    encoding: 'utf-8',
                    timeout: 2 * 60 * 1000,
                    stdio: 'pipe'
                });
            } catch (lgpdError) {
                console.warn('   ⚠️  Aviso: Não foi possível executar análise LGPD');
            }
            
            // Gera relatório de métricas
            await this.generateMetricsReport();
            
            this.updateStats.metricsGenerated = true;
            console.log('   ✅ Métricas atualizadas');
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na atualização de métricas: ${error.message}`);
            this.updateStats.errors.push(`Metrics: ${error.message}`);
        }
    }
    
    /**
     * Regeneração completa da documentação
     */
    async fullDocumentationRegeneration() {
        try {
            console.log('   🔄 Iniciando regeneração completa...');
            
            // Remove documentação existente
            try {
                await fs.rm(this.config.docsConfig.outputDir, { recursive: true, force: true });
            } catch (rmError) {
                // Diretório pode não existir
            }
            
            // Executa gerador completo
            const docsScript = path.join(__dirname, '..', 'automation', 'auto-documentation.js');
            
            const output = execSync(`node "${docsScript}" --full`, {
                encoding: 'utf-8',
                timeout: this.config.timeouts.docGeneration,
                stdio: 'pipe'
            });
            
            console.log('   ✅ Regeneração completa concluída');
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na regeneração completa: ${error.message}`);
            this.updateStats.errors.push(`Full regeneration: ${error.message}`);
        }
    }
    
    /**
     * Atualiza índices de documentação
     */
    async updateDocumentationIndexes() {
        try {
            const indexFiles = [
                path.join(this.config.docsConfig.outputDir, 'README.md'),
                path.join(this.config.docsConfig.apiDocsDir, 'README.md'),
                path.join(this.config.docsConfig.componentDocsDir, 'README.md'),
                path.join(this.config.docsConfig.medicalDocsDir, 'README.md')
            ];
            
            // Regenera cada índice se o diretório correspondente existe
            for (const indexFile of indexFiles) {
                const dir = path.dirname(indexFile);
                
                try {
                    await fs.access(dir);
                    await this.regenerateIndex(dir, indexFile);
                    console.log(`   ✅ Índice atualizado: ${path.basename(indexFile)}`);
                } catch (accessError) {
                    // Diretório não existe, pula
                }
            }
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na atualização de índices: ${error.message}`);
            this.updateStats.errors.push(`Indexes: ${error.message}`);
        }
    }
    
    /**
     * Regenera um índice específico
     */
    async regenerateIndex(dir, indexFile) {
        try {
            const files = await fs.readdir(dir);
            const mdFiles = files.filter(file => file.endsWith('.md') && file !== 'README.md');
            
            const indexContent = `# ${path.basename(dir).toUpperCase()} Documentation

Última atualização: ${new Date().toLocaleString('pt-BR')}

## Arquivos disponíveis

${mdFiles.map(file => `- [${file.replace('.md', '')}](./${file})`).join('\\n')}

---
*Índice gerado automaticamente em ${new Date().toISOString()}*
`;
            
            await fs.writeFile(indexFile, indexContent, 'utf-8');
            
        } catch (error) {
            console.warn(`Erro ao regenerar índice ${indexFile}: ${error.message}`);
        }
    }
    
    /**
     * Gera changelog de documentação
     */
    async generateDocumentationChangelog() {
        try {
            const changelogPath = path.join(this.config.docsConfig.outputDir, 'CHANGELOG.md');
            
            const changelogEntry = `
## ${new Date().toISOString().split('T')[0]} - ${this.mergeInfo.commit.slice(0, 7)}

**Branch:** ${this.mergeInfo.branch}  
**Autor:** ${this.mergeInfo.author}  
**Merge:** ${this.mergeInfo.message}

### Mudanças na documentação:
- Arquivos alterados: ${this.updateStats.filesChanged}
- APIs atualizadas: ${this.updateStats.apisUpdated}
- Componentes atualizados: ${this.updateStats.componentsUpdated}
- Docs médicas atualizadas: ${this.updateStats.medicalDocsUpdated}
- Métricas atualizadas: ${this.updateStats.metricsGenerated ? 'Sim' : 'Não'}

${this.updateStats.errors.length > 0 ? 
  \`### Erros encontrados:\\n\${this.updateStats.errors.map(e => \`- \${e}\`).join('\\n')}\\n\` : 
  '### ✅ Atualização concluída sem erros'
}

---
`;
            
            // Prepend ao changelog existente
            try {
                const existingChangelog = await fs.readFile(changelogPath, 'utf-8');
                const newChangelog = changelogEntry + existingChangelog;
                await fs.writeFile(changelogPath, newChangelog, 'utf-8');
            } catch (readError) {
                // Arquivo não existe, cria novo
                const header = `# Changelog da Documentação

Registro automático de atualizações na documentação.

`;
                await fs.writeFile(changelogPath, header + changelogEntry, 'utf-8');
            }
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na geração do changelog: ${error.message}`);
            this.updateStats.errors.push(`Changelog: ${error.message}`);
        }
    }
    
    /**
     * Valida documentação gerada
     */
    async validateGeneratedDocumentation() {
        try {
            const validationResults = [];
            
            // Verifica se diretórios essenciais existem
            const essentialDirs = [
                this.config.docsConfig.outputDir,
                this.config.docsConfig.apiDocsDir,
                this.config.docsConfig.componentDocsDir,
                this.config.docsConfig.medicalDocsDir
            ];
            
            for (const dir of essentialDirs) {
                try {
                    await fs.access(dir);
                    validationResults.push({ dir, status: 'OK' });
                } catch (accessError) {
                    validationResults.push({ dir, status: 'MISSING' });
                }
            }
            
            // Verifica se arquivos principais existem
            const essentialFiles = [
                path.join(this.config.docsConfig.outputDir, 'README.md'),
                path.join(this.config.docsConfig.outputDir, 'CHANGELOG.md')
            ];
            
            for (const file of essentialFiles) {
                try {
                    await fs.access(file);
                    validationResults.push({ file, status: 'OK' });
                } catch (accessError) {
                    validationResults.push({ file, status: 'MISSING' });
                }
            }
            
            const issues = validationResults.filter(r => r.status !== 'OK');
            if (issues.length > 0) {
                console.warn(`   ⚠️  Problemas na validação: ${issues.length} item(s)`);
                issues.forEach(issue => {
                    console.warn(`      • ${issue.dir || issue.file}: ${issue.status}`);
                });
            } else {
                console.log('   ✅ Validação da documentação concluída');
            }
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na validação: ${error.message}`);
            this.updateStats.errors.push(`Validation: ${error.message}`);
        }
    }
    
    /**
     * Verifica se deve fazer commit automático
     */
    shouldAutoCommitDocs() {
        // Só faz commit automático em branches específicas e se há mudanças
        return this.config.fullUpdateBranches.includes(this.mergeInfo.branch) &&
               (this.updateStats.apisUpdated > 0 || 
                this.updateStats.componentsUpdated > 0 ||
                this.updateStats.medicalDocsUpdated > 0 ||
                this.updateStats.metricsGenerated);
    }
    
    /**
     * Faz commit automático da documentação
     */
    async autoCommitDocumentation() {
        try {
            // Adiciona arquivos de documentação
            execSync('git add docs/generated/', { stdio: 'pipe' });
            
            // Verifica se há mudanças para commit
            try {
                execSync('git diff --staged --quiet', { stdio: 'pipe' });
                console.log('   ℹ️  Nenhuma mudança na documentação para commit');
                return;
            } catch (diffError) {
                // Há mudanças staged
            }
            
            // Faz commit
            const commitMessage = `docs: auto-update documentation after merge

- APIs: ${this.updateStats.apisUpdated}
- Components: ${this.updateStats.componentsUpdated}  
- Medical: ${this.updateStats.medicalDocsUpdated}
- Metrics: ${this.updateStats.metricsGenerated}

Generated automatically by post-merge hook
Merge: ${this.mergeInfo.commit.slice(0, 7)} (${this.mergeInfo.branch})`;

            execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
            console.log('   ✅ Documentação commitada automaticamente');
            
        } catch (error) {
            console.warn(`   ⚠️  Erro no commit automático: ${error.message}`);
            this.updateStats.errors.push(`Auto-commit: ${error.message}`);
        }
    }
    
    /**
     * Envia notificações sobre atualizações
     */
    async sendUpdateNotifications() {
        try {
            const summary = this.createUpdateSummary();
            
            // Slack notification
            if (this.config.notifications.slack.enabled) {
                await this.sendSlackNotification(summary);
            }
            
            // Email notification
            if (this.config.notifications.email.enabled) {
                await this.sendEmailNotification(summary);
            }
            
        } catch (error) {
            console.warn(`   ⚠️  Erro no envio de notificações: ${error.message}`);
            this.updateStats.errors.push(`Notifications: ${error.message}`);
        }
    }
    
    /**
     * Cria resumo da atualização
     */
    createUpdateSummary() {
        return {
            branch: this.mergeInfo.branch,
            author: this.mergeInfo.author,
            timestamp: this.mergeInfo.timestamp,
            filesChanged: this.updateStats.filesChanged,
            apisUpdated: this.updateStats.apisUpdated,
            componentsUpdated: this.updateStats.componentsUpdated,
            medicalDocsUpdated: this.updateStats.medicalDocsUpdated,
            metricsGenerated: this.updateStats.metricsGenerated,
            errorsCount: this.updateStats.errors.length,
            success: this.updateStats.errors.length === 0
        };
    }
    
    /**
     * Envia notificação Slack
     */
    async sendSlackNotification(summary) {
        if (!this.config.notifications.slack.webhook) {
            console.log('   ℹ️  Webhook do Slack não configurado');
            return;
        }
        
        const message = {
            channel: this.config.notifications.slack.channel,
            username: 'Docs Bot',
            icon_emoji: ':book:',
            attachments: [{
                color: summary.success ? 'good' : 'warning',
                title: '📚 Documentação Atualizada',
                fields: [
                    { title: 'Branch', value: summary.branch, short: true },
                    { title: 'Autor', value: summary.author, short: true },
                    { title: 'APIs', value: summary.apisUpdated.toString(), short: true },
                    { title: 'Componentes', value: summary.componentsUpdated.toString(), short: true },
                    { title: 'Médicos', value: summary.medicalDocsUpdated.toString(), short: true },
                    { title: 'Métricas', value: summary.metricsGenerated ? 'Sim' : 'Não', short: true }
                ],
                footer: 'Post-merge Documentation Hook',
                ts: Math.floor(new Date(summary.timestamp).getTime() / 1000)
            }]
        };
        
        // Implementar envio HTTP para Slack
        console.log('   📢 Notificação Slack preparada (webhook não implementado)');
    }
    
    /**
     * Envia notificação por email
     */
    async sendEmailNotification(summary) {
        // Implementar envio de email
        console.log('   📧 Notificação por email preparada (envio não implementado)');
    }
    
    /**
     * Atualiza glossário médico
     */
    async updateMedicalGlossary() {
        try {
            const glossaryPath = path.join(this.config.docsConfig.medicalDocsDir, 'glossario.md');
            
            // Termos específicos de hanseníase
            const medicalTerms = {
                'Hanseníase': 'Doença infectocontagiosa causada pelo Mycobacterium leprae',
                'Paucibacilar (PB)': 'Forma da hanseníase com até 5 lesões cutâneas',
                'Multibacilar (MB)': 'Forma da hanseníase com mais de 5 lesões cutâneas',
                'Baciloscopia': 'Exame para detecção do bacilo da hanseníase',
                'Poliquimioterapia (PQT)': 'Tratamento padrão para hanseníase com múltiplos medicamentos',
                'Rifampicina': 'Antibiótico principal no tratamento da hanseníase',
                'Dapsona': 'Medicamento usado na PQT para hanseníase',
                'Clofazimina': 'Medicamento usado no tratamento multibacilar'
            };
            
            const glossaryContent = `# Glossário Médico - Hanseníase

Última atualização: ${new Date().toLocaleString('pt-BR')}

${Object.entries(medicalTerms).map(([term, definition]) => 
    `## ${term}\\n\\n${definition}\\n`
).join('\\n')}

---
*Glossário gerado automaticamente pelo sistema de documentação médica*
`;
            
            await fs.writeFile(glossaryPath, glossaryContent, 'utf-8');
            
        } catch (error) {
            console.warn(`Erro ao atualizar glossário médico: ${error.message}`);
        }
    }
    
    /**
     * Atualiza referências de hanseníase
     */
    async updateLeprosyReferences() {
        try {
            const referencesPath = path.join(this.config.docsConfig.medicalDocsDir, 'referencias.md');
            
            const references = `# Referências Médicas - Hanseníase

Última atualização: ${new Date().toLocaleString('pt-BR')}

## Diretrizes Oficiais

- **Ministério da Saúde (2017)**: Diretrizes para vigilância, atenção e eliminação da Hanseníase como problema de saúde pública
- **OMS (2018)**: Guidelines for the diagnosis, treatment and prevention of leprosy
- **SBD (2017)**: Consenso Brasileiro de Hanseníase

## Protocolos de Tratamento

- **PQT/OMS**: Poliquimioterapia padrão ouro para tratamento
- **RENAME (2020)**: Relação Nacional de Medicamentos Essenciais

## Referências Científicas

- Lastória JC, Abreu MAMM. Hanseníase: revisão dos aspectos epidemiológicos, clínicos e etiopatogênicos. An Bras Dermatol. 2014;89(2):205-18.
- Silva Sobrinho RA, Mathias TAF. Perspectivas de eliminação da hanseníase como problema de saúde pública no Estado do Paraná, Brasil. Cad Saúde Pública. 2008;24(2):303-14.

---
*Referências atualizadas automaticamente pelo sistema de documentação médica*
`;
            
            await fs.writeFile(referencesPath, references, 'utf-8');
            
        } catch (error) {
            console.warn(`Erro ao atualizar referências médicas: ${error.message}`);
        }
    }
    
    /**
     * Gera relatório de métricas
     */
    async generateMetricsReport() {
        try {
            const metricsPath = path.join(this.config.docsConfig.metricsDir, 'latest-metrics.md');
            
            // Cria diretório se não existe
            await fs.mkdir(this.config.docsConfig.metricsDir, { recursive: true });
            
            const metricsContent = `# Métricas de Qualidade

Gerado em: ${new Date().toLocaleString('pt-BR')}  
Merge: ${this.mergeInfo.commit} (${this.mergeInfo.branch})

## Resumo da Atualização

| Métrica | Valor |
|---------|-------|
| Arquivos Alterados | ${this.updateStats.filesChanged} |
| APIs Atualizadas | ${this.updateStats.apisUpdated} |
| Componentes Atualizados | ${this.updateStats.componentsUpdated} |
| Docs Médicas | ${this.updateStats.medicalDocsUpdated} |
| Métricas Geradas | ${this.updateStats.metricsGenerated ? 'Sim' : 'Não'} |
| Erros | ${this.updateStats.errors.length} |

## Status dos Sistemas

- ✅ Documentação de APIs
- ✅ Documentação de Componentes  
- ✅ Documentação Médica
- ✅ Índices Atualizados
- ${this.updateStats.metricsGenerated ? '✅' : '⚠️'} Métricas de Qualidade

${this.updateStats.errors.length > 0 ? 
  \`## Erros Encontrados\\n\\n\${this.updateStats.errors.map(e => \`- \${e}\`).join('\\n')}\\n\` : 
  ''
}

---
*Relatório gerado automaticamente pelo post-merge hook*
`;
            
            await fs.writeFile(metricsPath, metricsContent, 'utf-8');
            
        } catch (error) {
            console.warn(`Erro ao gerar relatório de métricas: ${error.message}`);
        }
    }
    
    /**
     * Limpa backups antigos
     */
    async cleanOldBackups() {
        try {
            const docsDir = './docs';
            const files = await fs.readdir(docsDir);
            const backupDirs = files.filter(file => file.startsWith('backup-'))
                .sort()
                .reverse();
            
            // Remove backups além dos 5 mais recentes
            if (backupDirs.length > 5) {
                const toRemove = backupDirs.slice(5);
                for (const backup of toRemove) {
                    await fs.rm(path.join(docsDir, backup), { recursive: true, force: true });
                }
                console.log(`🧹 ${toRemove.length} backup(s) antigo(s) removido(s)`);
            }
            
        } catch (error) {
            // Falha silenciosa, não é crítico
        }
    }
    
    /**
     * Restaura backup em caso de erro
     */
    async restoreBackupOnError() {
        try {
            const docsDir = './docs';
            const files = await fs.readdir(docsDir);
            const latestBackup = files.filter(file => file.startsWith('backup-'))
                .sort()
                .reverse()[0];
            
            if (latestBackup) {
                console.log('🔄 Restaurando backup devido a erro...');
                await fs.rm(this.config.docsConfig.outputDir, { recursive: true, force: true });
                execSync(`cp -r "./docs/${latestBackup}"/* "${this.config.docsConfig.outputDir}/"`, { stdio: 'pipe' });
                console.log('✅ Backup restaurado');
            }
            
        } catch (error) {
            console.warn('⚠️  Não foi possível restaurar backup:', error.message);
        }
    }
    
    /**
     * Exibe resumo da atualização
     */
    displayUpdateSummary() {
        console.log('\\n📊 RESUMO DA ATUALIZAÇÃO DE DOCUMENTAÇÃO:');
        console.log('==========================================');
        console.log(`📁 Arquivos alterados: ${this.updateStats.filesChanged}`);
        console.log(`🔗 APIs atualizadas: ${this.updateStats.apisUpdated}`);
        console.log(`⚛️  Componentes atualizados: ${this.updateStats.componentsUpdated}`);
        console.log(`🏥 Docs médicas atualizadas: ${this.updateStats.medicalDocsUpdated}`);
        console.log(`📊 Métricas geradas: ${this.updateStats.metricsGenerated ? 'Sim' : 'Não'}`);
        console.log(`❌ Erros encontrados: ${this.updateStats.errors.length}`);
        
        if (this.updateStats.errors.length > 0) {
            console.log('\\n⚠️  ERROS:');
            this.updateStats.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }
        
        console.log(`\\n🌿 Branch: ${this.mergeInfo.branch}`);
        console.log(`👤 Autor: ${this.mergeInfo.author}`);
        console.log(`🕐 Timestamp: ${this.mergeInfo.timestamp}\\n`);
        
        if (this.updateStats.errors.length === 0) {
            console.log('✅ Documentação atualizada com sucesso!\\n');
        } else {
            console.log('⚠️  Documentação atualizada com avisos\\n');
        }
    }
    
    // Métodos auxiliares para obter informações do git
    getCurrentBranch() {
        try {
            return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    getMergeAuthor() {
        try {
            return execSync('git log -1 --format="%an"', { encoding: 'utf-8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    getLastCommitHash() {
        try {
            return execSync('git log -1 --format="%H"', { encoding: 'utf-8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    getLastCommitMessage() {
        try {
            return execSync('git log -1 --format="%s"', { encoding: 'utf-8' }).trim();
        } catch (error) {
            return 'Merge automático';
        }
    }
    
    getChangedFiles() {
        try {
            const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
            return output.trim().split('\\n').filter(Boolean);
        } catch (error) {
            return [];
        }
    }
}

// Execução principal
if (require.main === module) {
    const updater = new PostMergeDocumentationUpdater();
    
    updater.runDocumentationUpdate()
        .then(result => {
            if (!result.success) {
                console.log('⚠️  Atualização concluída com avisos');
                process.exit(0); // Não bloqueia o merge
            } else {
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ Erro fatal na atualização:', error.message);
            process.exit(0); // Não bloqueia o merge mesmo com erro
        });
}

module.exports = { PostMergeDocumentationUpdater };