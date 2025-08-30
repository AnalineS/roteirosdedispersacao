# [AUTH] Atualizar Chave do Service Account GCP

## Problema
O erro `error:1E08010C:DECODER routines::unsupported` indica que a chave do Service Account está corrompida ou em formato incorreto.

## Solução Passo a Passo

### 1. Gerar Nova Chave (Método Recomendado)

**Via Google Cloud Console:**
1. Acesse: [Console GCP](https://console.cloud.google.com/)
2. Navegue para: IAM & Admin -> Service Accounts
3. Encontre: `github-actions-hml@red-truck-468923-s4.iam.gserviceaccount.com`
4. Clique em "Actions" -> "Manage Keys"
5. Clique "ADD KEY" -> "Create new key"
6. Selecione "JSON" e clique "CREATE"
7. Baixe o arquivo JSON

**Via gcloud CLI:**
```bash
# Execute o script fornecido
bash scripts/generate-gcp-service-account-key.sh
```

### 2. Atualizar GitHub Secret

1. **Acesse o repositório no GitHub:**
   ```
   https://github.com/AnalineS/roteirosdedispersacao/settings/secrets/actions
   ```

2. **Edite o secret `GCP_SA_KEY`:**
   - Clique no lápis ao lado de `GCP_SA_KEY`
   - DELETE todo o conteúdo atual
   - COLE o JSON completo da nova chave (incluindo `{` e `}`)
   - Clique "Update secret"

### 3. Validar o JSON

**Antes de colar no GitHub, valide:**
```bash
# Verificar se é JSON válido
cat sua-chave.json | jq .

# Ou online: https://jsonlint.com/
```

### 4. Testar o Deploy

Após atualizar o secret:
```bash
# Force novo deploy
git commit --allow-empty -m "fix: update GCP service account key"
git push origin hml
```

## Template de Chave Válida

O arquivo deve ter esta estrutura (veja `scripts/gcp-key-template.json`):

```json
{
  "type": "service_account",
  "project_id": "red-truck-468923-s4",
  "private_key_id": "abcd1234...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "github-actions-hml@red-truck-468923-s4.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/github-actions-hml%40red-truck-468923-s4.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## [WARNING] Pontos Importantes

1. **Copie TODO o JSON** - Não corte nenhuma parte
2. **Mantenha as quebras de linha** - Especialmente no `private_key`
3. **Não edite o JSON** - Use exatamente como baixado
4. **Delete arquivos locais** - Após usar, delete a chave do seu computador
5. **Teste imediatamente** - Execute um deploy para validar

## 🔄 Alternativa: Workload Identity

Para maior segurança, considere migrar para Workload Identity (sem chaves JSON):

```yaml
- name: [AUTH] Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
    service_account: 'github-actions-hml@red-truck-468923-s4.iam.gserviceaccount.com'
```

---

📞 **Precisa de ajuda?** Verifique os logs do GitHub Actions para detalhes específicos do erro.