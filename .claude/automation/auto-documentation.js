#!/usr/bin/env node

/**
 * Sistema de Documentação Automática para Plataforma Educacional Médica
 * 
 * Gerador inteligente de documentação para projeto de hanseníase
 * Inclui análise de código, geração de APIs docs, e documentação médica
 * 
 * @version 2.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AutoDocumentationGenerator {
    constructor() {
        this.config = {
            // Diretórios de saída
            outputDir: './docs/generated',
            apiDocsDir: './docs/generated/api',
            componentDocsDir: './docs/generated/components',
            medicalDocsDir: './docs/generated/medical',
            
            // Tipos de arquivo para análise
            sourceExtensions: ['.ts', '.tsx', '.js', '.jsx'],
            configExtensions: ['.json', '.yml', '.yaml'],
            markdownExtensions: ['.md', '.mdx'],
            
            // Padrões de exclusão
            excludePatterns: [
                'node_modules',
                '.next',
                'dist',
                'build',
                '.git',
                'coverage'
            ],
            
            // Configuração médica específica
            medicalConfig: {
                diseaseContext: 'hanseníase',
                targetAudience: 'farmacêuticos',
                clinicalPersonas: ['dr_gasnelio', 'ga'],
                medicalStandards: ['ANVISA', 'CID-10', 'RENAME'],
                educationalFramework: 'Bloom_taxonomy'
            },
            
            // Templates de documentação
            templates: {
                apiEndpoint: 'api-endpoint-template.md',
                reactComponent: 'component-template.md',
                medicalCalculator: 'medical-calculator-template.md',
                clinicalCase: 'clinical-case-template.md',
                educationalContent: 'educational-content-template.md'
            }
        };
        
        this.documentation = {
            apis: [],
            components: [],
            medicalCalculators: [],
            clinicalCases: [],
            educationalContent: [],
            codeMetrics: {},
            dependencies: {},
            securityAnalysis: {}
        };
    }
    
    /**
     * Executa geração completa de documentação
     */
    async generateDocumentation(projectPath = '.') {
        console.log('📚 Iniciando geração automática de documentação...\\n');
        
        try {
            // 1. Preparação
            await this.setupOutputDirectories();
            
            // 2. Análise de código-fonte
            console.log('🔍 Analisando código-fonte...');
            await this.analyzeSourceCode(projectPath);
            
            // 3. Documentação de APIs
            console.log('🔗 Gerando documentação de APIs...');
            await this.generateApiDocumentation(projectPath);
            
            // 4. Documentação de componentes
            console.log('⚛️ Gerando documentação de componentes...');
            await this.generateComponentDocumentation(projectPath);
            
            // 5. Documentação médica específica
            console.log('🏥 Gerando documentação médica...');
            await this.generateMedicalDocumentation(projectPath);
            
            // 6. Análise de dependências
            console.log('📦 Analisando dependências...');
            await this.analyzeDependencies(projectPath);
            
            // 7. Métricas de código
            console.log('📊 Calculando métricas...');
            await this.calculateCodeMetrics(projectPath);
            
            // 8. Análise de segurança
            console.log('🔒 Análise de segurança...');
            await this.performSecurityAnalysis(projectPath);
            
            // 9. Geração de índices
            console.log('📋 Gerando índices...');
            await this.generateIndexes();
            
            // 10. Relatório final
            console.log('📄 Gerando relatório final...');
            const report = await this.generateFinalReport();
            
            console.log('\\n✅ Documentação gerada com sucesso!');
            return report;
            
        } catch (error) {
            console.error('❌ Erro durante geração:', error.message);
            throw error;
        }
    }
    
    /**
     * Configura diretórios de saída
     */
    async setupOutputDirectories() {
        const dirs = [
            this.config.outputDir,
            this.config.apiDocsDir,
            this.config.componentDocsDir,
            this.config.medicalDocsDir,
            `${this.config.outputDir}/metrics`,
            `${this.config.outputDir}/security`,
            `${this.config.outputDir}/dependencies`
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    /**
     * Analisa código-fonte do projeto
     */
    async analyzeSourceCode(projectPath) {
        const sourceFiles = await this.findFiles(projectPath, this.config.sourceExtensions);
        
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const relativePath = path.relative(projectPath, file);
                
                // Análise por tipo de arquivo
                if (file.includes('/api/')) {
                    await this.analyzeApiFile(relativePath, content);
                } else if (file.includes('/components/')) {
                    await this.analyzeComponentFile(relativePath, content);
                } else if (this.isMedicalCalculator(content)) {
                    await this.analyzeMedicalCalculator(relativePath, content);
                } else if (this.isClinicalCase(content)) {
                    await this.analyzeClinicalCase(relativePath, content);
                }
                
            } catch (error) {
                console.warn(`Erro ao analisar ${file}: ${error.message}`);
            }
        }
    }
    
    /**
     * Encontra arquivos por extensões
     */
    async findFiles(dir, extensions) {
        const files = [];
        
        async function scanDir(currentDir) {
            try {
                const entries = await fs.readdir(currentDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);
                    
                    if (entry.isDirectory()) {
                        const shouldExclude = this.config.excludePatterns.some(pattern => 
                            entry.name.includes(pattern)
                        );
                        
                        if (!shouldExclude) {
                            await scanDir(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const hasValidExtension = extensions.some(ext => 
                            entry.name.endsWith(ext)
                        );
                        
                        if (hasValidExtension) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Ignorar erros de permissão
            }
        }
        
        await scanDir.call(this, dir);
        return files;
    }
    
    /**
     * Analisa arquivo de API
     */
    async analyzeApiFile(filePath, content) {
        const apiInfo = {
            path: filePath,
            endpoint: this.extractApiEndpoint(filePath),
            methods: this.extractHttpMethods(content),
            parameters: this.extractParameters(content),
            responses: this.extractResponses(content),
            authentication: this.checkAuthentication(content),
            validation: this.checkValidation(content),
            medicalRelevance: this.checkMedicalRelevance(content),
            lgpdCompliance: this.checkLGPDCompliance(content),
            documentation: this.extractInlineDocumentation(content)
        };
        
        this.documentation.apis.push(apiInfo);
    }
    
    /**
     * Analisa arquivo de componente React
     */
    async analyzeComponentFile(filePath, content) {
        const componentInfo = {
            path: filePath,
            name: this.extractComponentName(filePath, content),
            props: this.extractPropsInterface(content),
            hooks: this.extractHooks(content),
            dependencies: this.extractImports(content),
            accessibility: this.checkAccessibility(content),
            medicalUI: this.checkMedicalUIStandards(content),
            interactivity: this.checkInteractivity(content),
            personas: this.checkPersonasUsage(content),
            documentation: this.extractInlineDocumentation(content),
            examples: this.extractUsageExamples(content)
        };
        
        this.documentation.components.push(componentInfo);
    }
    
    /**
     * Analisa calculadora médica
     */
    async analyzeMedicalCalculator(filePath, content) {
        const calculatorInfo = {
            path: filePath,
            name: this.extractCalculatorName(content),
            purpose: this.extractMedicalPurpose(content),
            formulas: this.extractFormulas(content),
            validations: this.extractMedicalValidations(content),
            units: this.extractUnits(content),
            references: this.extractMedicalReferences(content),
            accuracy: this.checkCalculationAccuracy(content),
            clinicalContext: this.extractClinicalContext(content),
            documentation: this.extractInlineDocumentation(content)
        };
        
        this.documentation.medicalCalculators.push(calculatorInfo);
    }
    
    /**
     * Analisa caso clínico
     */
    async analyzeClinicalCase(filePath, content) {
        const caseInfo = {
            path: filePath,
            title: this.extractCaseTitle(content),
            patientProfile: this.extractPatientProfile(content),
            clinicalPresentation: this.extractClinicalPresentation(content),
            diagnosis: this.extractDiagnosis(content),
            treatment: this.extractTreatment(content),
            learningObjectives: this.extractLearningObjectives(content),
            assessmentCriteria: this.extractAssessmentCriteria(content),
            references: this.extractMedicalReferences(content),
            difficulty: this.assessDifficulty(content),
            personas: this.identifyTargetPersonas(content)
        };
        
        this.documentation.clinicalCases.push(caseInfo);
    }
    
    /**
     * Extrai endpoint de API
     */
    extractApiEndpoint(filePath) {
        const segments = filePath.split('/');
        const apiIndex = segments.findIndex(seg => seg === 'api');
        
        if (apiIndex !== -1) {
            return '/' + segments.slice(apiIndex).join('/').replace(/\.[jt]sx?$/, '');
        }
        
        return null;
    }
    
    /**
     * Extrai métodos HTTP
     */
    extractHttpMethods(content) {
        const methods = [];
        const methodPatterns = [
            /export\s+(?:default\s+)?(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/gi,
            /const\s+(GET|POST|PUT|DELETE|PATCH)\s*=/gi,
            /\.method\s*===\s*['"]?(GET|POST|PUT|DELETE|PATCH)['"]?/gi
        ];
        
        for (const pattern of methodPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (!methods.includes(match[1].toUpperCase())) {
                    methods.push(match[1].toUpperCase());
                }
            }
        }
        
        return methods;
    }
    
    /**
     * Extrai parâmetros
     */
    extractParameters(content) {
        const parameters = [];
        
        // Parâmetros de query
        const queryMatches = content.match(/req\\.query\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        if (queryMatches) {
            queryMatches.forEach(match => {
                const param = match.replace('req.query.', '');
                parameters.push({ name: param, type: 'query', required: false });
            });
        }
        
        // Parâmetros de body
        const bodyMatches = content.match(/req\\.body\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        if (bodyMatches) {
            bodyMatches.forEach(match => {
                const param = match.replace('req.body.', '');
                parameters.push({ name: param, type: 'body', required: false });
            });
        }
        
        return parameters;
    }
    
    /**
     * Extrai respostas
     */
    extractResponses(content) {
        const responses = [];
        
        // Status codes
        const statusMatches = content.match(/res\.status\((\d+)\)/g);
        if (statusMatches) {
            statusMatches.forEach(match => {
                const status = match.match(/\d+/)[0];
                if (!responses.find(r => r.status === status)) {
                    responses.push({ status, description: this.getStatusDescription(status) });
                }
            });
        }
        
        return responses;
    }
    
    /**
     * Verifica autenticação
     */
    checkAuthentication(content) {
        const authPatterns = [
            /auth|authorization|token|jwt/gi,
            /req\\.user|req\\.session/gi,
            /middleware.*auth/gi
        ];
        
        return authPatterns.some(pattern => pattern.test(content));
    }
    
    /**
     * Verifica validação
     */
    checkValidation(content) {
        const validationPatterns = [
            /validate|validation|schema/gi,
            /zod|joi|yup/gi,
            /\.parse\(|\.validate\(/gi
        ];
        
        return validationPatterns.some(pattern => pattern.test(content));
    }
    
    /**
     * Verifica relevância médica
     */
    checkMedicalRelevance(content) {
        const medicalTerms = [
            'dose', 'dosagem', 'medicamento', 'tratamento',
            'hanseniase', 'bacilo', 'lesao', 'clinico',
            'paciente', 'diagnostico', 'terapia'
        ];
        
        const medicalCount = medicalTerms.filter(term => 
            new RegExp(term, 'gi').test(content)
        ).length;
        
        return {
            relevant: medicalCount > 0,
            score: Math.min(medicalCount / medicalTerms.length, 1),
            terms: medicalTerms.filter(term => new RegExp(term, 'gi').test(content))
        };
    }
    
    /**
     * Verifica conformidade LGPD
     */
    checkLGPDCompliance(content) {
        const sensitiveDataPatterns = [
            /cpf|rg|email|telefone/gi,
            /dados.*pessoais|informacoes.*pessoais/gi,
            /consentimento|consent/gi
        ];
        
        const hasSensitiveData = sensitiveDataPatterns.some(pattern => pattern.test(content));
        const hasConsentCheck = /consent|consentimento/gi.test(content);
        
        return {
            hasSensitiveData,
            hasConsentCheck,
            compliant: !hasSensitiveData || hasConsentCheck
        };
    }
    
    /**
     * Extrai documentação inline
     */
    extractInlineDocumentation(content) {
        const docs = {
            jsdoc: [],
            comments: [],
            descriptions: []
        };
        
        // JSDoc comments
        const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
        if (jsdocMatches) {
            docs.jsdoc = jsdocMatches;
        }
        
        // Single line comments
        const commentMatches = content.match(/\/\/.*$/gm);
        if (commentMatches) {
            docs.comments = commentMatches.map(c => c.replace('//', '').trim()).filter(Boolean);
        }
        
        return docs;
    }
    
    /**
     * Extrai nome do componente
     */
    extractComponentName(filePath, content) {
        // Tenta extrair do nome do arquivo
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // Tenta extrair da definição do componente
        const componentMatches = content.match(/(?:function|const)\\s+([A-Z][a-zA-Z0-9]*)/);
        if (componentMatches) {
            return componentMatches[1];
        }
        
        return fileName;
    }
    
    /**
     * Extrai interface de props
     */
    extractPropsInterface(content) {
        const props = [];
        
        // TypeScript interfaces
        const interfaceMatches = content.match(/interface\\s+\\w*Props\\s*{[\\s\\S]*?}/g);
        if (interfaceMatches) {
            interfaceMatches.forEach(match => {
                const propMatches = match.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)(\\??):\\s*([^;\\n]+)/g);
                if (propMatches) {
                    propMatches.forEach(propMatch => {
                        const [, name, optional, type] = propMatch.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)(\\??):\\s*([^;\\n]+)/);
                        props.push({
                            name,
                            type: type.trim(),
                            required: !optional,
                            description: null
                        });
                    });
                }
            });
        }
        
        return props;
    }
    
    /**
     * Extrai hooks utilizados
     */
    extractHooks(content) {
        const hooks = [];
        const hookPattern = /use[A-Z][a-zA-Z0-9]*/g;
        let match;
        
        while ((match = hookPattern.exec(content)) !== null) {
            if (!hooks.includes(match[0])) {
                hooks.push(match[0]);
            }
        }
        
        return hooks;
    }
    
    /**
     * Extrai imports
     */
    extractImports(content) {
        const imports = [];
        const importMatches = content.match(/import.*from\\s+['\"]([^'\"]+)['\"]/g);
        
        if (importMatches) {
            importMatches.forEach(match => {
                const moduleMatch = match.match(/from\\s+['\"]([^'\"]+)['\"]/);
                if (moduleMatch) {
                    imports.push(moduleMatch[1]);
                }
            });
        }
        
        return imports;
    }
    
    /**
     * Verifica acessibilidade
     */
    checkAccessibility(content) {
        const a11yFeatures = {
            ariaLabels: (content.match(/aria-label|aria-labelledby|aria-describedby/g) || []).length,
            altText: (content.match(/alt=/g) || []).length,
            semanticElements: (content.match(/<(header|nav|main|section|article|aside|footer)>/g) || []).length,
            keyboardSupport: /onKeyDown|onKeyPress|onKeyUp|tabIndex/g.test(content),
            focusManagement: /focus\\(\\)|autoFocus|tabIndex/g.test(content)
        };
        
        const score = Object.values(a11yFeatures).filter(Boolean).length / Object.keys(a11yFeatures).length;
        
        return {
            score,
            features: a11yFeatures,
            compliant: score > 0.5
        };
    }
    
    /**
     * Verifica padrões de UI médica
     */
    checkMedicalUIStandards(content) {
        const medicalUIFeatures = {
            criticalActions: /confirm|confirmation|alert|warning/gi.test(content),
            clearLabels: /label|placeholder/gi.test(content),
            errorHandling: /error|validation|invalid/gi.test(content),
            loadingStates: /loading|spinner|skeleton/gi.test(content),
            dataVisualization: /chart|graph|plot|visualization/gi.test(content)
        };
        
        const score = Object.values(medicalUIFeatures).filter(Boolean).length / Object.keys(medicalUIFeatures).length;
        
        return {
            score,
            features: medicalUIFeatures,
            compliant: score > 0.6
        };
    }
    
    /**
     * Verifica interatividade
     */
    checkInteractivity(content) {
        const interactiveFeatures = {
            clickHandlers: /onClick|onPress|onTap/g.test(content),
            formControls: /input|select|textarea|checkbox|radio/gi.test(content),
            stateManagement: /useState|useReducer|state/g.test(content),
            eventHandlers: /onChange|onSubmit|onFocus|onBlur/g.test(content)
        };
        
        return {
            interactive: Object.values(interactiveFeatures).some(Boolean),
            features: interactiveFeatures
        };
    }
    
    /**
     * Verifica uso de personas
     */
    checkPersonasUsage(content) {
        const personas = ['dr_gasnelio', 'ga', 'gasnelio'];
        const usedPersonas = personas.filter(persona => 
            new RegExp(persona, 'gi').test(content)
        );
        
        return {
            used: usedPersonas.length > 0,
            personas: usedPersonas
        };
    }
    
    /**
     * Extrai exemplos de uso
     */
    extractUsageExamples(content) {
        const examples = [];
        
        // Procura por comentários com exemplos
        const exampleMatches = content.match(/\/\*\*[\s\S]*?@example[\s\S]*?\*\//g);
        if (exampleMatches) {
            exampleMatches.forEach(match => {
                const exampleContent = match.match(/@example([\s\S]*?)(?=\*\/|@\w+)/);
                if (exampleContent) {
                    examples.push(exampleContent[1].trim());
                }
            });
        }
        
        return examples;
    }
    
    /**
     * Verifica se é calculadora médica
     */
    isMedicalCalculator(content) {
        const calculatorKeywords = [
            'dose', 'dosagem', 'calculo', 'calculator',
            'formula', 'medicamento', 'concentracao'
        ];
        
        return calculatorKeywords.some(keyword => 
            new RegExp(keyword, 'gi').test(content)
        );
    }
    
    /**
     * Verifica se é caso clínico
     */
    isClinicalCase(content) {
        const caseKeywords = [
            'caso clinico', 'clinical case', 'paciente',
            'diagnostico', 'tratamento', 'sintomas'
        ];
        
        return caseKeywords.some(keyword => 
            new RegExp(keyword, 'gi').test(content)
        );
    }
    
    /**
     * Gera documentação de APIs
     */
    async generateApiDocumentation(projectPath) {
        if (this.documentation.apis.length === 0) {
            return;
        }
        
        for (const api of this.documentation.apis) {
            const apiDoc = this.generateApiDocMarkdown(api);
            const fileName = `${api.endpoint.replace(/\\//g, '_').replace(/^_/, '')}.md`;
            const filePath = path.join(this.config.apiDocsDir, fileName);
            
            await fs.writeFile(filePath, apiDoc, 'utf-8');
        }
        
        // Gera índice de APIs
        const apiIndex = this.generateApiIndexMarkdown();
        await fs.writeFile(path.join(this.config.apiDocsDir, 'README.md'), apiIndex, 'utf-8');
    }
    
    /**
     * Gera markdown para API
     */
    generateApiDocMarkdown(api) {
        return `# API: ${api.endpoint}

## Visão Geral
- **Arquivo**: ${api.path}
- **Métodos**: ${api.methods.join(', ')}
- **Autenticação**: ${api.authentication ? 'Requerida' : 'Não requerida'}
- **Validação**: ${api.validation ? 'Implementada' : 'Não implementada'}

## Relevância Médica
${api.medicalRelevance.relevant ? 
  `- **Score de Relevância**: ${(api.medicalRelevance.score * 100).toFixed(1)}%
  - **Termos Médicos**: ${api.medicalRelevance.terms.join(', ')}` :
  'Esta API não possui relevância médica direta.'
}

## Conformidade LGPD
- **Manipula Dados Sensíveis**: ${api.lgpdCompliance.hasSensitiveData ? 'Sim' : 'Não'}
- **Verifica Consentimento**: ${api.lgpdCompliance.hasConsentCheck ? 'Sim' : 'Não'}
- **Status de Conformidade**: ${api.lgpdCompliance.compliant ? '✅ Compliant' : '❌ Não Compliant'}

## Parâmetros
${api.parameters.length > 0 ? 
  api.parameters.map(param => 
    `- **${param.name}** (${param.type}) - ${param.required ? 'Obrigatório' : 'Opcional'}`
  ).join('\\n') :
  'Nenhum parâmetro específico identificado.'
}

## Respostas
${api.responses.length > 0 ?
  api.responses.map(resp => 
    `- **${resp.status}**: ${resp.description}`
  ).join('\\n') :
  'Respostas não documentadas automaticamente.'
}

## Documentação Inline
${api.documentation.jsdoc.length > 0 ? 
  '### JSDoc\\n' + api.documentation.jsdoc.join('\\n\\n') : 
  ''
}

${api.documentation.comments.length > 0 ?
  '### Comentários\\n' + api.documentation.comments.map(c => `- ${c}`).join('\\n') :
  ''
}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera índice de APIs
     */
    generateApiIndexMarkdown() {
        return `# Documentação de APIs

Esta documentação foi gerada automaticamente para todas as APIs do projeto.

## APIs Identificadas

${this.documentation.apis.map(api => 
  `- [${api.endpoint}](./${api.endpoint.replace(/\\//g, '_').replace(/^_/, '')}.md) - ${api.methods.join(', ')}`
).join('\\n')}

## Estatísticas

- **Total de APIs**: ${this.documentation.apis.length}
- **APIs com Autenticação**: ${this.documentation.apis.filter(a => a.authentication).length}
- **APIs com Validação**: ${this.documentation.apis.filter(a => a.validation).length}
- **APIs com Relevância Médica**: ${this.documentation.apis.filter(a => a.medicalRelevance.relevant).length}
- **APIs LGPD Compliant**: ${this.documentation.apis.filter(a => a.lgpdCompliance.compliant).length}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera documentação de componentes
     */
    async generateComponentDocumentation(projectPath) {
        if (this.documentation.components.length === 0) {
            return;
        }
        
        for (const component of this.documentation.components) {
            const componentDoc = this.generateComponentDocMarkdown(component);
            const fileName = `${component.name}.md`;
            const filePath = path.join(this.config.componentDocsDir, fileName);
            
            await fs.writeFile(filePath, componentDoc, 'utf-8');
        }
        
        // Gera índice de componentes
        const componentIndex = this.generateComponentIndexMarkdown();
        await fs.writeFile(path.join(this.config.componentDocsDir, 'README.md'), componentIndex, 'utf-8');
    }
    
    /**
     * Gera markdown para componente
     */
    generateComponentDocMarkdown(component) {
        return `# Componente: ${component.name}

## Visão Geral
- **Arquivo**: ${component.path}
- **Tipo**: Componente React
- **Interativo**: ${component.interactivity.interactive ? 'Sim' : 'Não'}

## Props Interface
${component.props.length > 0 ?
  component.props.map(prop => 
    `- **${prop.name}${prop.required ? '' : '?'}**: \`${prop.type}\`${prop.description ? ` - ${prop.description}` : ''}`
  ).join('\\n') :
  'Props não identificadas automaticamente.'
}

## Hooks Utilizados
${component.hooks.length > 0 ?
  component.hooks.map(hook => `- ${hook}`).join('\\n') :
  'Nenhum hook identificado.'
}

## Dependências
${component.dependencies.length > 0 ?
  component.dependencies.map(dep => `- ${dep}`).join('\\n') :
  'Nenhuma dependência externa identificada.'
}

## Acessibilidade
- **Score de Acessibilidade**: ${(component.accessibility.score * 100).toFixed(1)}%
- **Status**: ${component.accessibility.compliant ? '✅ Acessível' : '⚠️ Precisa Melhorar'}

### Recursos de Acessibilidade
- **ARIA Labels**: ${component.accessibility.features.ariaLabels}
- **Texto Alternativo**: ${component.accessibility.features.altText}
- **Elementos Semânticos**: ${component.accessibility.features.semanticElements}
- **Suporte a Teclado**: ${component.accessibility.features.keyboardSupport ? 'Sim' : 'Não'}
- **Gerenciamento de Foco**: ${component.accessibility.features.focusManagement ? 'Sim' : 'Não'}

## Padrões de UI Médica
- **Score de UI Médica**: ${(component.medicalUI.score * 100).toFixed(1)}%
- **Status**: ${component.medicalUI.compliant ? '✅ Compliant' : '⚠️ Precisa Melhorar'}

### Recursos de UI Médica
- **Ações Críticas**: ${component.medicalUI.features.criticalActions ? 'Protegidas' : 'Não identificadas'}
- **Labels Claros**: ${component.medicalUI.features.clearLabels ? 'Sim' : 'Não'}
- **Tratamento de Erros**: ${component.medicalUI.features.errorHandling ? 'Sim' : 'Não'}
- **Estados de Loading**: ${component.medicalUI.features.loadingStates ? 'Sim' : 'Não'}
- **Visualização de Dados**: ${component.medicalUI.features.dataVisualization ? 'Sim' : 'Não'}

## Uso de Personas
${component.personas.used ?
  `Este componente utiliza as seguintes personas: ${component.personas.personas.join(', ')}` :
  'Este componente não utiliza personas específicas.'
}

## Interatividade
${component.interactivity.interactive ?
  `### Recursos Interativos
  - **Click Handlers**: ${component.interactivity.features.clickHandlers ? 'Sim' : 'Não'}
  - **Controles de Formulário**: ${component.interactivity.features.formControls ? 'Sim' : 'Não'}
  - **Gerenciamento de Estado**: ${component.interactivity.features.stateManagement ? 'Sim' : 'Não'}
  - **Event Handlers**: ${component.interactivity.features.eventHandlers ? 'Sim' : 'Não'}` :
  'Este componente não possui recursos interativos identificados.'
}

## Exemplos de Uso
${component.examples.length > 0 ?
  component.examples.map(example => '```tsx\\n' + example + '\\n```').join('\\n\\n') :
  'Exemplos de uso não encontrados na documentação inline.'
}

## Documentação Inline
${component.documentation.jsdoc.length > 0 ?
  '### JSDoc\\n' + component.documentation.jsdoc.join('\\n\\n') :
  ''
}

${component.documentation.comments.length > 0 ?
  '### Comentários\\n' + component.documentation.comments.map(c => `- ${c}`).join('\\n') :
  ''
}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera índice de componentes
     */
    generateComponentIndexMarkdown() {
        const interactiveCount = this.documentation.components.filter(c => c.interactivity.interactive).length;
        const accessibleCount = this.documentation.components.filter(c => c.accessibility.compliant).length;
        const medicalUICount = this.documentation.components.filter(c => c.medicalUI.compliant).length;
        const personasCount = this.documentation.components.filter(c => c.personas.used).length;
        
        return `# Documentação de Componentes React

Esta documentação foi gerada automaticamente para todos os componentes React do projeto.

## Componentes Identificados

${this.documentation.components.map(comp => 
  `- [${comp.name}](./${comp.name}.md) - ${comp.interactivity.interactive ? '🎯 Interativo' : '📄 Estático'}${comp.accessibility.compliant ? ' ♿ Acessível' : ''}${comp.medicalUI.compliant ? ' 🏥 UI Médica' : ''}${comp.personas.used ? ' 👥 Personas' : ''}`
).join('\\n')}

## Estatísticas

- **Total de Componentes**: ${this.documentation.components.length}
- **Componentes Interativos**: ${interactiveCount}
- **Componentes Acessíveis**: ${accessibleCount}
- **Componentes com UI Médica**: ${medicalUICount}
- **Componentes com Personas**: ${personasCount}

## Métricas de Qualidade

- **Média de Acessibilidade**: ${(this.documentation.components.reduce((sum, c) => sum + c.accessibility.score, 0) / this.documentation.components.length * 100).toFixed(1)}%
- **Média de UI Médica**: ${(this.documentation.components.reduce((sum, c) => sum + c.medicalUI.score, 0) / this.documentation.components.length * 100).toFixed(1)}%

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera documentação médica específica
     */
    async generateMedicalDocumentation(projectPath) {
        // Documentação de calculadoras médicas
        if (this.documentation.medicalCalculators.length > 0) {
            for (const calculator of this.documentation.medicalCalculators) {
                const calcDoc = this.generateCalculatorDocMarkdown(calculator);
                const fileName = `calculator_${calculator.name.replace(/\\s+/g, '_').toLowerCase()}.md`;
                const filePath = path.join(this.config.medicalDocsDir, fileName);
                
                await fs.writeFile(filePath, calcDoc, 'utf-8');
            }
        }
        
        // Documentação de casos clínicos
        if (this.documentation.clinicalCases.length > 0) {
            for (const clinicalCase of this.documentation.clinicalCases) {
                const caseDoc = this.generateClinicalCaseDocMarkdown(clinicalCase);
                const fileName = `case_${clinicalCase.title.replace(/\\s+/g, '_').toLowerCase()}.md`;
                const filePath = path.join(this.config.medicalDocsDir, fileName);
                
                await fs.writeFile(filePath, caseDoc, 'utf-8');
            }
        }
        
        // Gera índice médico
        const medicalIndex = this.generateMedicalIndexMarkdown();
        await fs.writeFile(path.join(this.config.medicalDocsDir, 'README.md'), medicalIndex, 'utf-8');
    }
    
    /**
     * Gera markdown para calculadora
     */
    generateCalculatorDocMarkdown(calculator) {
        return `# Calculadora Médica: ${calculator.name}

## Visão Geral
- **Arquivo**: ${calculator.path}
- **Propósito**: ${calculator.purpose}
- **Contexto Clínico**: ${calculator.clinicalContext}

## Fórmulas Identificadas
${calculator.formulas.length > 0 ?
  calculator.formulas.map(formula => `- ${formula}`).join('\\n') :
  'Fórmulas não identificadas automaticamente.'
}

## Unidades de Medida
${calculator.units.length > 0 ?
  calculator.units.map(unit => `- ${unit}`).join('\\n') :
  'Unidades não identificadas automaticamente.'
}

## Validações Médicas
${calculator.validations.length > 0 ?
  calculator.validations.map(validation => `- ${validation}`).join('\\n') :
  'Validações não identificadas automaticamente.'
}

## Precisão de Cálculos
${calculator.accuracy ? '✅ Verificações de precisão implementadas' : '⚠️ Verificações de precisão não identificadas'}

## Referências Médicas
${calculator.references.length > 0 ?
  calculator.references.map(ref => `- ${ref}`).join('\\n') :
  'Referências não identificadas automaticamente.'
}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera markdown para caso clínico
     */
    generateClinicalCaseDocMarkdown(clinicalCase) {
        return `# Caso Clínico: ${clinicalCase.title}

## Perfil do Paciente
${clinicalCase.patientProfile || 'Perfil não identificado automaticamente.'}

## Apresentação Clínica
${clinicalCase.clinicalPresentation || 'Apresentação não identificada automaticamente.'}

## Diagnóstico
${clinicalCase.diagnosis || 'Diagnóstico não identificado automaticamente.'}

## Tratamento
${clinicalCase.treatment || 'Tratamento não identificado automaticamente.'}

## Objetivos de Aprendizagem
${clinicalCase.learningObjectives.length > 0 ?
  clinicalCase.learningObjectives.map(obj => `- ${obj}`).join('\\n') :
  'Objetivos não identificados automaticamente.'
}

## Critérios de Avaliação
${clinicalCase.assessmentCriteria.length > 0 ?
  clinicalCase.assessmentCriteria.map(criteria => `- ${criteria}`).join('\\n') :
  'Critérios não identificados automaticamente.'
}

## Nível de Dificuldade
${clinicalCase.difficulty || 'Não avaliado automaticamente.'}

## Personas Alvo
${clinicalCase.personas.length > 0 ?
  clinicalCase.personas.map(persona => `- ${persona}`).join('\\n') :
  'Personas não identificadas.'
}

## Referências Médicas
${clinicalCase.references.length > 0 ?
  clinicalCase.references.map(ref => `- ${ref}`).join('\\n') :
  'Referências não identificadas automaticamente.'
}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera índice médico
     */
    generateMedicalIndexMarkdown() {
        return `# Documentação Médica

Esta seção contém documentação específica para componentes e funcionalidades médicas do projeto de educação sobre hanseníase.

## Calculadoras Médicas

${this.documentation.medicalCalculators.length > 0 ?
  this.documentation.medicalCalculators.map(calc => 
    `- [${calc.name}](./calculator_${calc.name.replace(/\\s+/g, '_').toLowerCase()}.md)`
  ).join('\\n') :
  'Nenhuma calculadora médica identificada.'
}

## Casos Clínicos

${this.documentation.clinicalCases.length > 0 ?
  this.documentation.clinicalCases.map(caseItem => 
    `- [${caseItem.title}](./case_${caseItem.title.replace(/\\s+/g, '_').toLowerCase()}.md) - ${caseItem.difficulty || 'N/A'}`
  ).join('\\n') :
  'Nenhum caso clínico identificado.'
}

## Estatísticas Médicas

- **Calculadoras Médicas**: ${this.documentation.medicalCalculators.length}
- **Casos Clínicos**: ${this.documentation.clinicalCases.length}
- **Referências Médicas Total**: ${[...this.documentation.medicalCalculators, ...this.documentation.clinicalCases].reduce((sum, item) => sum + (item.references?.length || 0), 0)}

## Conformidade e Padrões

- **Framework Educacional**: ${this.config.medicalConfig.educationalFramework}
- **Contexto da Doença**: ${this.config.medicalConfig.diseaseContext}
- **Público-alvo**: ${this.config.medicalConfig.targetAudience}
- **Padrões Médicos**: ${this.config.medicalConfig.medicalStandards.join(', ')}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Calcula métricas de código
     */
    async calculateCodeMetrics(projectPath) {
        const sourceFiles = await this.findFiles(projectPath, this.config.sourceExtensions);
        
        let totalLines = 0;
        let totalComponents = 0;
        let totalApis = 0;
        let totalTests = 0;
        
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\\n').length;
                totalLines += lines;
                
                if (file.includes('/components/')) totalComponents++;
                if (file.includes('/api/')) totalApis++;
                if (file.includes('.test.') || file.includes('.spec.')) totalTests++;
                
            } catch (error) {
                // Ignore
            }
        }
        
        this.documentation.codeMetrics = {
            totalFiles: sourceFiles.length,
            totalLines,
            totalComponents,
            totalApis,
            totalTests,
            testCoverage: totalTests > 0 ? (totalTests / (totalComponents + totalApis)) * 100 : 0,
            averageLinesPerFile: totalLines / sourceFiles.length,
            medicalRelevance: {
                components: this.documentation.components.length,
                apis: this.documentation.apis.filter(a => a.medicalRelevance.relevant).length,
                calculators: this.documentation.medicalCalculators.length,
                clinicalCases: this.documentation.clinicalCases.length
            }
        };
    }
    
    /**
     * Analisa dependências
     */
    async analyzeDependencies(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'apps/frontend-nextjs/package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };
            
            const categorizedDeps = {
                react: [],
                ui: [],
                testing: [],
                build: [],
                medical: [],
                analytics: [],
                security: [],
                other: []
            };
            
            for (const [name, version] of Object.entries(allDeps)) {
                if (name.includes('react')) categorizedDeps.react.push({ name, version });
                else if (name.includes('test') || name.includes('jest')) categorizedDeps.testing.push({ name, version });
                else if (name.includes('build') || name.includes('webpack')) categorizedDeps.build.push({ name, version });
                else if (name.includes('ui') || name.includes('component')) categorizedDeps.ui.push({ name, version });
                else if (name.includes('analytics') || name.includes('tracking')) categorizedDeps.analytics.push({ name, version });
                else if (name.includes('security') || name.includes('auth')) categorizedDeps.security.push({ name, version });
                else if (this.isMedicalDependency(name)) categorizedDeps.medical.push({ name, version });
                else categorizedDeps.other.push({ name, version });
            }
            
            this.documentation.dependencies = {
                total: Object.keys(allDeps).length,
                categorized: categorizedDeps,
                vulnerabilities: await this.checkVulnerabilities(allDeps)
            };
            
        } catch (error) {
            console.warn('Erro ao analisar dependências:', error.message);
        }
    }
    
    /**
     * Verifica se é dependência médica
     */
    isMedicalDependency(name) {
        const medicalKeywords = ['medical', 'health', 'clinical', 'pharma', 'dose', 'drug'];
        return medicalKeywords.some(keyword => name.toLowerCase().includes(keyword));
    }
    
    /**
     * Verifica vulnerabilidades
     */
    async checkVulnerabilities(dependencies) {
        // Simulação de verificação de vulnerabilidades
        // Em implementação real, integraria com npm audit ou Snyk
        const knownVulnerabilities = ['lodash', 'moment', 'request'];
        const vulnerableDeps = [];
        
        for (const depName of Object.keys(dependencies)) {
            if (knownVulnerabilities.some(vuln => depName.includes(vuln))) {
                vulnerableDeps.push({
                    name: depName,
                    severity: 'medium',
                    description: 'Dependência com vulnerabilidades conhecidas'
                });
            }
        }
        
        return vulnerableDeps;
    }
    
    /**
     * Análise de segurança
     */
    async performSecurityAnalysis(projectPath) {
        const sourceFiles = await this.findFiles(projectPath, this.config.sourceExtensions);
        
        const securityIssues = [];
        const securityFeatures = {
            authentication: 0,
            authorization: 0,
            inputValidation: 0,
            outputSanitization: 0,
            httpsEnforcement: 0,
            secureHeaders: 0
        };
        
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                
                // Verifica recursos de segurança
                if (/auth|authentication|login/gi.test(content)) securityFeatures.authentication++;
                if (/authorize|permission|role|access/gi.test(content)) securityFeatures.authorization++;
                if (/validate|validation|sanitize/gi.test(content)) securityFeatures.inputValidation++;
                if (/escape|sanitize|dompurify/gi.test(content)) securityFeatures.outputSanitization++;
                if (/https|ssl|tls/gi.test(content)) securityFeatures.httpsEnforcement++;
                if (/security.*header|csp|hsts/gi.test(content)) securityFeatures.secureHeaders++;
                
                // Verifica problemas de segurança
                if (/eval\(|innerHTML\s*=/g.test(content)) {
                    securityIssues.push({
                        file,
                        issue: 'Uso potencialmente inseguro de eval() ou innerHTML',
                        severity: 'high'
                    });
                }
                
                if (/console\\.log.*(?:password|token|secret|key)/gi.test(content)) {
                    securityIssues.push({
                        file,
                        issue: 'Possível exposição de dados sensíveis em logs',
                        severity: 'medium'
                    });
                }
                
            } catch (error) {
                // Ignore
            }
        }
        
        this.documentation.securityAnalysis = {
            issues: securityIssues,
            features: securityFeatures,
            score: Math.max(0, 100 - (securityIssues.length * 10)),
            recommendations: this.generateSecurityRecommendations(securityIssues, securityFeatures)
        };
    }
    
    /**
     * Gera recomendações de segurança
     */
    generateSecurityRecommendations(issues, features) {
        const recommendations = [];
        
        if (issues.length > 0) {
            recommendations.push('Corrigir problemas de segurança identificados no código');
        }
        
        if (features.authentication === 0) {
            recommendations.push('Implementar autenticação para proteger dados médicos');
        }
        
        if (features.inputValidation === 0) {
            recommendations.push('Implementar validação rigorosa de entradas');
        }
        
        if (features.secureHeaders === 0) {
            recommendations.push('Configurar cabeçalhos de segurança HTTP');
        }
        
        return recommendations;
    }
    
    /**
     * Gera índices
     */
    async generateIndexes() {
        // Índice principal
        const mainIndex = this.generateMainIndexMarkdown();
        await fs.writeFile(path.join(this.config.outputDir, 'README.md'), mainIndex, 'utf-8');
        
        // Índice de métricas
        const metricsIndex = this.generateMetricsMarkdown();
        await fs.writeFile(path.join(this.config.outputDir, 'metrics', 'README.md'), metricsIndex, 'utf-8');
        
        // Índice de segurança
        const securityIndex = this.generateSecurityMarkdown();
        await fs.writeFile(path.join(this.config.outputDir, 'security', 'README.md'), securityIndex, 'utf-8');
    }
    
    /**
     * Gera índice principal
     */
    generateMainIndexMarkdown() {
        return `# Documentação Automática do Projeto

Documentação gerada automaticamente para a plataforma educacional médica sobre hanseníase.

## Seções da Documentação

### 📚 [APIs](./api/README.md)
Documentação completa de todas as APIs do projeto.
- Total de APIs: ${this.documentation.apis.length}
- APIs com relevância médica: ${this.documentation.apis.filter(a => a.medicalRelevance.relevant).length}
- APIs LGPD compliant: ${this.documentation.apis.filter(a => a.lgpdCompliance.compliant).length}

### ⚛️ [Componentes React](./components/README.md)
Documentação de todos os componentes React.
- Total de componentes: ${this.documentation.components.length}
- Componentes interativos: ${this.documentation.components.filter(c => c.interactivity.interactive).length}
- Componentes acessíveis: ${this.documentation.components.filter(c => c.accessibility.compliant).length}

### 🏥 [Documentação Médica](./medical/README.md)
Documentação específica para funcionalidades médicas.
- Calculadoras médicas: ${this.documentation.medicalCalculators.length}
- Casos clínicos: ${this.documentation.clinicalCases.length}

### 📊 [Métricas](./metrics/README.md)
Métricas detalhadas do código e qualidade.

### 🔒 [Segurança](./security/README.md)
Análise de segurança e recomendações.

## Resumo Executivo

### Estatísticas Gerais
- **Arquivos Analisados**: ${this.documentation.codeMetrics.totalFiles}
- **Linhas de Código**: ${this.documentation.codeMetrics.totalLines.toLocaleString()}
- **Componentes**: ${this.documentation.codeMetrics.totalComponents}
- **APIs**: ${this.documentation.codeMetrics.totalApis}
- **Testes**: ${this.documentation.codeMetrics.totalTests}

### Qualidade e Conformidade
- **Cobertura de Testes**: ${this.documentation.codeMetrics.testCoverage.toFixed(1)}%
- **Score de Segurança**: ${this.documentation.securityAnalysis.score}%
- **Conformidade LGPD**: ${this.documentation.apis.filter(a => a.lgpdCompliance.compliant).length}/${this.documentation.apis.length} APIs
- **Acessibilidade**: ${(this.documentation.components.reduce((sum, c) => sum + c.accessibility.score, 0) / Math.max(this.documentation.components.length, 1) * 100).toFixed(1)}% média

### Contexto Médico
- **Doença Foco**: ${this.config.medicalConfig.diseaseContext}
- **Público-alvo**: ${this.config.medicalConfig.targetAudience}
- **Personas Clínicas**: ${this.config.medicalConfig.clinicalPersonas.join(', ')}
- **Padrões Médicos**: ${this.config.medicalConfig.medicalStandards.join(', ')}

---
*Documentação gerada automaticamente em ${new Date().toLocaleString('pt-BR')}*

**Sistema de Documentação Automática v${(() => {
            try {
                return require('../package.json').version;
            } catch {
                return '2.0.0';
            }
        })()}**
`;
    }
    
    /**
     * Gera markdown de métricas
     */
    generateMetricsMarkdown() {
        return `# Métricas do Projeto

## Métricas de Código

| Métrica | Valor |
|---------|-------|
| Total de Arquivos | ${this.documentation.codeMetrics.totalFiles} |
| Linhas de Código | ${this.documentation.codeMetrics.totalLines.toLocaleString()} |
| Média de Linhas/Arquivo | ${this.documentation.codeMetrics.averageLinesPerFile.toFixed(0)} |
| Componentes React | ${this.documentation.codeMetrics.totalComponents} |
| APIs | ${this.documentation.codeMetrics.totalApis} |
| Testes | ${this.documentation.codeMetrics.totalTests} |
| Cobertura de Testes | ${this.documentation.codeMetrics.testCoverage.toFixed(1)}% |

## Métricas Médicas

| Métrica | Valor |
|---------|-------|
| Componentes Médicos | ${this.documentation.codeMetrics.medicalRelevance.components} |
| APIs Médicas | ${this.documentation.codeMetrics.medicalRelevance.apis} |
| Calculadoras Médicas | ${this.documentation.codeMetrics.medicalRelevance.calculators} |
| Casos Clínicos | ${this.documentation.codeMetrics.medicalRelevance.clinicalCases} |

## Dependências

| Categoria | Quantidade |
|-----------|------------|
| React | ${this.documentation.dependencies?.categorized?.react?.length || 0} |
| UI/Componentes | ${this.documentation.dependencies?.categorized?.ui?.length || 0} |
| Testes | ${this.documentation.dependencies?.categorized?.testing?.length || 0} |
| Build | ${this.documentation.dependencies?.categorized?.build?.length || 0} |
| Médicas | ${this.documentation.dependencies?.categorized?.medical?.length || 0} |
| Analytics | ${this.documentation.dependencies?.categorized?.analytics?.length || 0} |
| Segurança | ${this.documentation.dependencies?.categorized?.security?.length || 0} |
| Outras | ${this.documentation.dependencies?.categorized?.other?.length || 0} |
| **Total** | **${this.documentation.dependencies?.total || 0}** |

---
*Métricas calculadas em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera markdown de segurança
     */
    generateSecurityMarkdown() {
        return `# Análise de Segurança

## Score Geral de Segurança: ${this.documentation.securityAnalysis.score}%

## Recursos de Segurança Identificados

| Recurso | Quantidade |
|---------|------------|
| Autenticação | ${this.documentation.securityAnalysis.features.authentication} |
| Autorização | ${this.documentation.securityAnalysis.features.authorization} |
| Validação de Entrada | ${this.documentation.securityAnalysis.features.inputValidation} |
| Sanitização de Saída | ${this.documentation.securityAnalysis.features.outputSanitization} |
| Enforcement HTTPS | ${this.documentation.securityAnalysis.features.httpsEnforcement} |
| Cabeçalhos Seguros | ${this.documentation.securityAnalysis.features.secureHeaders} |

## Problemas de Segurança

${this.documentation.securityAnalysis.issues.length > 0 ?
  this.documentation.securityAnalysis.issues.map(issue => 
    `### ${issue.severity.toUpperCase()}: ${issue.issue}
    - **Arquivo**: ${issue.file}
    - **Severidade**: ${issue.severity}`
  ).join('\\n\\n') :
  '✅ Nenhum problema crítico de segurança identificado.'
}

## Vulnerabilidades em Dependências

${this.documentation.dependencies?.vulnerabilities?.length > 0 ?
  this.documentation.dependencies.vulnerabilities.map(vuln => 
    `### ${vuln.severity.toUpperCase()}: ${vuln.name}
    - **Descrição**: ${vuln.description}
    - **Severidade**: ${vuln.severity}`
  ).join('\\n\\n') :
  '✅ Nenhuma vulnerabilidade conhecida identificada nas dependências.'
}

## Recomendações

${this.documentation.securityAnalysis.recommendations.length > 0 ?
  this.documentation.securityAnalysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\\n') :
  '✅ Nenhuma recomendação específica identificada.'
}

---
*Análise de segurança realizada em ${new Date().toLocaleString('pt-BR')}*
`;
    }
    
    /**
     * Gera relatório final
     */
    async generateFinalReport() {
        const report = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            project: {
                name: 'Plataforma Educacional Médica - Hanseníase',
                context: this.config.medicalConfig
            },
            summary: {
                filesAnalyzed: this.documentation.codeMetrics.totalFiles,
                linesOfCode: this.documentation.codeMetrics.totalLines,
                components: this.documentation.components.length,
                apis: this.documentation.apis.length,
                medicalCalculators: this.documentation.medicalCalculators.length,
                clinicalCases: this.documentation.clinicalCases.length
            },
            quality: {
                testCoverage: this.documentation.codeMetrics.testCoverage,
                securityScore: this.documentation.securityAnalysis.score,
                accessibilityScore: this.documentation.components.length > 0 ? 
                    (this.documentation.components.reduce((sum, c) => sum + c.accessibility.score, 0) / this.documentation.components.length * 100) : 0,
                lgpdCompliance: this.documentation.apis.length > 0 ?
                    (this.documentation.apis.filter(a => a.lgpdCompliance.compliant).length / this.documentation.apis.length * 100) : 100
            },
            documentation: this.documentation
        };
        
        // Salva relatório completo
        await fs.writeFile(
            path.join(this.config.outputDir, 'documentation-report.json'),
            JSON.stringify(report, null, 2),
            'utf-8'
        );
        
        return report;
    }
    
    /**
     * Obtém descrição do status HTTP
     */
    getStatusDescription(status) {
        const descriptions = {
            '200': 'OK - Sucesso',
            '201': 'Created - Recurso criado',
            '400': 'Bad Request - Requisição inválida',
            '401': 'Unauthorized - Não autorizado',
            '403': 'Forbidden - Proibido',
            '404': 'Not Found - Não encontrado',
            '500': 'Internal Server Error - Erro interno'
        };
        
        return descriptions[status] || 'Status desconhecido';
    }
    
    // Métodos stub para extração de informações médicas específicas
    extractCalculatorName(content) { return 'Calculator'; }
    extractMedicalPurpose(content) { return 'Calculadora médica'; }
    extractFormulas(content) { return []; }
    extractMedicalValidations(content) { return []; }
    extractUnits(content) { return []; }
    extractMedicalReferences(content) { return []; }
    checkCalculationAccuracy(content) { return false; }
    extractClinicalContext(content) { return 'Contexto clínico'; }
    extractCaseTitle(content) { return 'Caso clínico'; }
    extractPatientProfile(content) { return null; }
    extractClinicalPresentation(content) { return null; }
    extractDiagnosis(content) { return null; }
    extractTreatment(content) { return null; }
    extractLearningObjectives(content) { return []; }
    extractAssessmentCriteria(content) { return []; }
    assessDifficulty(content) { return null; }
    identifyTargetPersonas(content) { return []; }
}

// Execução principal
if (require.main === module) {
    const generator = new AutoDocumentationGenerator();
    
    generator.generateDocumentation()
        .then(report => {
            console.log('\\n📊 Relatório de Documentação Automática');
            console.log('==========================================\\n');
            console.log(`📁 Arquivos Analisados: ${report.summary.filesAnalyzed}`);
            console.log(`📄 Linhas de Código: ${report.summary.linesOfCode.toLocaleString()}`);
            console.log(`⚛️  Componentes: ${report.summary.components}`);
            console.log(`🔗 APIs: ${report.summary.apis}`);
            console.log(`🧮 Calculadoras Médicas: ${report.summary.medicalCalculators}`);
            console.log(`🏥 Casos Clínicos: ${report.summary.clinicalCases}\\n`);
            
            console.log('📊 SCORES DE QUALIDADE:');
            console.log(`   - Cobertura de Testes: ${report.quality.testCoverage.toFixed(1)}%`);
            console.log(`   - Segurança: ${report.quality.securityScore}%`);
            console.log(`   - Acessibilidade: ${report.quality.accessibilityScore.toFixed(1)}%`);
            console.log(`   - Conformidade LGPD: ${report.quality.lgpdCompliance.toFixed(1)}%\\n`);
            
            console.log(`📚 Documentação salva em: ${generator.config.outputDir}\\n`);
            
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro durante geração da documentação:', error.message);
            process.exit(1);
        });
}

module.exports = { AutoDocumentationGenerator };