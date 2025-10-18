# Guia de Configuração Google Analytics 4 - Roteiro de Dispensação

## 1. Criar Propriedade GA4 (se ainda não tem)

1. Acesse [Google Analytics](https://analytics.google.com)
2. Admin → Create Property
3. Nome: "Roteiros de Dispensação - Hanseníase"
4. Fuso horário: (GMT-03:00) Brasília
5. Moeda: Real brasileiro (BRL)
6. Categoria: Healthcare
7. Tamanho do negócio: Pequeno

## 2. Configurar Data Stream

1. Em Data Streams → Web
2. URL: https://roteirosdedispensacao.com
3. Nome do stream: "Produção - Cloud Run"
4. Enhanced measurement: ✅ Ativar tudo

## 3. Obter Measurement ID

1. Em Data Streams → clique no seu stream
2. Copie o **Measurement ID**: G-XXXXXXXXXX

## 4. Adicionar ao GitHub Secrets

### Via GitHub CLI (recomendado):
```bash
gh secret set NEXT_PUBLIC_GA_MEASUREMENT_ID --body "G-XXXXXXXXXX" --repo Ana/roteiro-dispensacao
```

### Via GitHub Web:
1. Vá para: Settings → Secrets and variables → Actions
2. New repository secret
3. Nome: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
4. Valor: `G-XXXXXXXXXX`

## 5. Configurar Eventos Customizados no GA4

### Eventos Médicos Importantes:

1. **persona_interaction**
   - Parâmetros: persona_name, question_type, urgency_level

2. **educational_progress**
   - Parâmetros: module_name, completion_rate, time_spent

3. **critical_access**
   - Parâmetros: feature_accessed, time_to_access, success

### Configurar no GA4:
1. Configure → Events → Create event
2. Para cada evento acima, criar com condições apropriadas

## 6. Configurar Conversões

Marcar como conversões:
- `chat_session_completed`
- `educational_module_completed`
- `resource_downloaded`
- `return_visit`

## 7. Audiências Customizadas

Criar audiências:
1. **Profissionais de Saúde**: usuários que acessam Dr. Gasnelio
2. **Pacientes**: usuários que preferem Gá
3. **Usuários Frequentes**: >3 sessões por semana
4. **Mobile Users**: dispositivo = mobile

## 8. Configurar User Properties

```javascript
// No código frontend
gtag('set', 'user_properties', {
  user_type: 'professional', // ou 'patient', 'student'
  preferred_persona: 'dr_gasnelio', // ou 'ga'
  institution: 'encrypted_hash',
  specialization: 'pharmacy' // ou 'medicine', 'nursing'
});
```

## 9. Implementação no Frontend

### Inicialização (já existe em `services/analytics.ts`):
```typescript
// .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

// Verificar se está funcionando:
// Console do navegador → Network → filtrar por "google-analytics"
```

### Eventos UX (usar GA4):
```typescript
// Navegação, cliques, scroll
Analytics.event('NAVIGATION', 'menu_click', 'header');

// Performance
Analytics.timing('page_load', 'chat', loadTime);

// Erros UX
Analytics.exception('UI render failed', false);
```

### Eventos Médicos (NÃO usar GA4):
```typescript
// Enviar para API interna
await fetch('/api/analytics/medical/interaction', {
  method: 'POST',
  body: JSON.stringify({
    persona_id: 'dr_gasnelio',
    question: 'dosagem clofazimina',
    urgency: 'standard'
  })
});
```

## 10. Validação

### Verificar se está funcionando:
1. GA4 → Reports → Realtime
2. Deve aparecer seu acesso em tempo real
3. Events → ver eventos sendo capturados

### Debug Mode:
```javascript
// Adicionar ao código para debug
window.gtag('config', 'G-XXXXXXXXXX', {
  debug_mode: true
});
```

## 11. Dashboards Recomendados

### Criar no GA4:
1. **UX Performance**
   - Page load times
   - Bounce rate por página
   - User flow

2. **Engagement**
   - Session duration
   - Pages per session
   - Return rate

3. **Conversions**
   - Funil de conversão
   - Goal completions
   - Drop-off analysis

## 12. Integração com BigQuery (Opcional)

Para análises avançadas:
1. Admin → BigQuery Linking
2. Criar projeto no Google Cloud
3. Configurar export diário

## Segurança e LGPD

### Configurações de Privacidade:
1. Admin → Data Settings → Data Retention
   - User data: 14 months
   - Event data: 2 months

2. IP Anonymization (já configurado no código):
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  anonymize_ip: true
});
```

3. Consent Mode:
```javascript
gtag('consent', 'update', {
  analytics_storage: userConsent ? 'granted' : 'denied'
});
```

## Monitoramento

### Alertas Customizados:
1. Configure → Custom alerts
2. Criar alertas para:
   - Queda de tráfego >50%
   - Taxa de erro >5%
   - Bounce rate >70%

## Próximos Passos

1. ✅ Configurar Measurement ID no GitHub Secrets
2. ✅ Validar tracking básico funcionando
3. ⏳ Configurar eventos customizados
4. ⏳ Criar dashboards
5. ⏳ Configurar conversões
6. ⏳ Implementar consent mode LGPD