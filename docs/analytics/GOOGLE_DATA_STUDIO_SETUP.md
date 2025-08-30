# [REPORT] Google Data Studio - Configuração para Analytics

Este documento detalha como configurar o Google Data Studio para visualizar as métricas do sistema educacional de hanseníase.

## [TARGET] **Pré-requisitos**

1. Conta Google configurada
2. Google Analytics 4 ativo no projeto
3. Dados coletados por pelo menos 24h
4. Acesso à conta Google Analytics

## [FIX] **Configuração Inicial**

### 1. Acessar Google Data Studio
```
URL: https://datastudio.google.com/
Login: Use a mesma conta do Google Analytics
```

### 2. Criar Novo Relatório
1. Clique em "Criar" -> "Relatório"
2. Selecione "Google Analytics" como fonte
3. Escolha a propriedade GA4 do projeto
4. Autorize a conexão

### 3. Configurar Fonte de Dados
```json
{
  "fonte": "Google Analytics 4",
  "propriedade": "Roteiros de Dispensação - Hanseníase",
  "view": "Todos os dados do site",
  "configurações": {
    "atualização_automática": true,
    "cache": "1 hora",
    "filtros_padrão": {
      "país": "Brasil",
      "idioma": "pt-BR"
    }
  }
}
```

## 📈 **Dashboards Principais**

### 1. **Visão Geral - Página Principal**
```
Métricas Principais:
- Usuários ativos (período)
- Sessões totais
- Taxa de engajamento
- Duração média da sessão
- Páginas mais visitadas

Dimensões:
- Data/Hora
- Dispositivo (Mobile/Desktop)
- Fonte/Meio de tráfego
- Localização geográfica
```

### 2. **Analytics de Personas - Página 2**
```
Eventos Customizados:
- persona_selected
- conversation_start
- conversation_end
- message_sent/received

Métricas por Persona:
- Dr. Gasnelio vs Gá (distribuição %)
- Tempo médio por sessão/persona
- Taxa de resolução por persona
- Perguntas mais frequentes
```

### 3. **Métricas Educacionais - Página 3**
```
Eventos Educacionais:
- module_start/complete
- certificate_generated
- quiz_completed

KPIs Educacionais:
- Taxa de conclusão de módulos
- Tempo médio para certificação
- Score médio de quiz
- Módulos mais populares
```

### 4. **Performance e Erros - Página 4**
```
Métricas Técnicas:
- api_error (frequência)
- fallback_triggered
- network_error
- Tempo de resposta médio

Análise de Horários:
- Picos de uso por hora
- Dias da semana mais ativos
- Sazonalidade mensal
```

## 🎨 **Configuração Visual**

### Paleta de Cores Padrão
```css
--primary: #2563eb (Dr. Gasnelio)
--secondary: #16a34a (Gá)
--success: #059669
--warning: #d97706
--error: #dc2626
--neutral: #6b7280
```

### Templates Recomendados
1. **Cards de Métricas**: 4 colunas, altura fixa
2. **Gráficos de Linha**: Tendências temporais
3. **Gráficos de Pizza**: Distribuição por persona
4. **Tabelas**: Top 10 perguntas, detalhes por sessão
5. **Mapas de Calor**: Horários de pico

## 🔗 **Configuração de Embed**

### 1. Obter URL de Incorporação
```
1. No Data Studio, clique em "Compartilhar"
2. Selecione "Incorporar relatório"
3. Configure visibilidade: "Qualquer pessoa na internet pode visualizar"
4. Copie o código de incorporação
```

### 2. Configurar no Frontend
```typescript
// Em apps/frontend-nextjs/src/app/admin/analytics/page.tsx
const DATA_STUDIO_EMBED_URL = 'https://datastudio.google.com/embed/reporting/[ID_DO_RELATORIO]';

// Substituir placeholder por iframe real
<iframe
  src={DATA_STUDIO_EMBED_URL}
  width="100%"
  height="600"
  frameBorder="0"
  style={{ border: 0 }}
  allowFullScreen
/>
```

## [REPORT] **Métricas Customizadas**

### 1. Configurar Eventos Customizados
```json
{
  "resolução_dúvidas": {
    "evento": "question_resolution",
    "parâmetros": {
      "persona": "string",
      "resolvido": "boolean",
      "tempo_resolução": "number",
      "categoria": "string"
    }
  },
  "uso_personas": {
    "evento": "persona_usage",
    "parâmetros": {
      "persona_id": "string",
      "sessão_duração": "number",
      "mensagens_count": "number"
    }
  }
}
```

### 2. Campos Calculados
```sql
-- Taxa de Resolução
CASE 
  WHEN Custom Parameter: resolvido = 'true' 
  THEN 1 
  ELSE 0 
END

-- Tempo Médio de Resolução (segundos)
AVG(Custom Parameter: tempo_resolução)

-- Persona Preferida
CASE 
  WHEN Custom Parameter: persona = 'dr_gasnelio' 
  THEN 'Dr. Gasnelio'
  WHEN Custom Parameter: persona = 'ga' 
  THEN 'Gá'
  ELSE 'Não definido'
END
```

## 🔄 **Atualização e Manutenção**

### Cronograma Recomendado
```yaml
Diário:
  - Verificar métricas básicas
  - Monitorar erros críticos

Semanal:
  - Análise de tendências
  - Revisão top 10 perguntas
  - Relatório de performance

Mensal:
  - Relatório executivo
  - Análise de sazonalidade
  - Otimizações baseadas em dados
```

### Alertas Configurados
```json
{
  "taxa_erro_alta": {
    "condição": "Eventos de erro > 10% das sessões",
    "ação": "Email para admin",
    "frequência": "Imediata"
  },
  "queda_engajamento": {
    "condição": "Duração média < 60 segundos",
    "ação": "Investigar UX",
    "frequência": "Diária"
  },
  "pico_uso_inesperado": {
    "condição": "Sessões > 200% da média",
    "ação": "Verificar infraestrutura",
    "frequência": "Tempo real"
  }
}
```

## [TARGET] **KPIs Principais para Acompanhar**

### Métricas de Sucesso
1. **Taxa de Resolução**: >85%
2. **Tempo Médio de Resposta**: <3 segundos
3. **Engajamento por Sessão**: >3 minutos
4. **Taxa de Conclusão de Módulos**: >70%
5. **Satisfação do Usuário**: >4.5/5

### Métricas de Performance
1. **Taxa de Erro**: <5%
2. **Uptime do Sistema**: >99.5%
3. **Uso de Fallback**: <15%
4. **Tempo de Carregamento**: <2 segundos

## [LIST] **Checklist de Implementação**

- [ ] Conta Google Data Studio criada
- [ ] Conexão com GA4 estabelecida
- [ ] Dashboards principais configurados
- [ ] Métricas customizadas implementadas
- [ ] Alertas configurados
- [ ] Embed no frontend funcionando
- [ ] Documentação atualizada
- [ ] Treinamento da equipe realizado

## 🆘 **Troubleshooting**

### Problemas Comuns

1. **Dados não aparecem**
   - Verificar se GA4 está coletando eventos
   - Aguardar 24-48h para processamento inicial
   - Verificar filtros de data

2. **Embed não carrega**
   - Verificar permissões de compartilhamento
   - Testar URL em navegador incógnito
   - Verificar Content Security Policy

3. **Métricas inconsistentes**
   - Comparar com GA4 diretamente
   - Verificar fusos horários
   - Revisar configurações de filtros

### Contatos de Suporte
- **Google Data Studio Help**: https://support.google.com/datastudio/
- **GA4 Support**: https://support.google.com/analytics/
- **Documentação Técnica**: Esta pasta `/docs/analytics/`

---

**Última atualização**: 16/08/2025  
**Responsável**: Sistema Analytics - Roteiros de Dispensação  
**Versão**: 1.0.0