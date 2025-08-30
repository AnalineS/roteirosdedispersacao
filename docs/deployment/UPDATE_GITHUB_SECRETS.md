# [AUTH] Atualização de Secrets do GitHub Actions

## [WARNING] IMPORTANTE: Atualize os seguintes secrets no GitHub

### 1. GCP_SA_KEY [OK]
**Status**: Nova chave gerada e pronta
**Ação**: Copie o conteúdo JSON em uma linha (fornecido separadamente)

### 2. GCP_PROJECT_ID
**Valor**: `red-truck-468923-s4`
**Descrição**: ID do projeto Google Cloud

### 3. GCP_REGION  
**Valor**: `us-central1`
**Descrição**: Região para deploy do Cloud Run

### 4. FIREBASE_TOKEN
**Como obter**:
```bash
firebase login:ci
```
**Descrição**: Token para deploy no Firebase Hosting

### 5. TELEGRAM_BOT_TOKEN (Opcional)
**Descrição**: Token do bot Telegram para notificações
**Formato**: `123456789:ABC-DEF...`

### 6. TELEGRAM_CHAT_ID (Opcional)
**Descrição**: ID do chat/grupo Telegram
**Como obter**: Envie uma mensagem para o bot e acesse:
```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

## [NOTE] Como Atualizar no GitHub

1. Acesse: https://github.com/AnalineS/roteirosdedispersacao/settings/secrets/actions
2. Para cada secret:
   - Clique em "Update" ou "New repository secret"
   - Cole o valor correspondente
   - Salve

## [OK] Checklist

- [ ] GCP_SA_KEY atualizado com novo JSON
- [ ] GCP_PROJECT_ID confirmado como `red-truck-468923-s4`
- [ ] GCP_REGION definido
- [ ] FIREBASE_TOKEN configurado
- [ ] SNYK_TOKEN já configurado
- [ ] Secrets opcionais configurados se desejado

## 🔒 Segurança

- **NUNCA** commite secrets no repositório
- **SEMPRE** use secrets do GitHub Actions
- **DELETE** arquivos de chave locais após uso
- **ROTACIONE** chaves periodicamente

---
*Última atualização: 2024-12-21*