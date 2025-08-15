# Configuração DNS Correta no Registro.br

## ⚠️ IMPORTANTE: Regras do DNS

- **NÃO** é possível usar CNAME no domínio raiz (@)
- Você deve usar registros **A** para o domínio principal
- CNAME só pode ser usado em subdomínios (www, api, etc.)

## 📝 Configuração Correta no Registro.br

### Passo 1: Remova registros conflitantes
Primeiro, delete qualquer registro CNAME que esteja tentando usar no domínio raiz.

### Passo 2: Adicione os seguintes registros

| Tipo | Nome | Dados | Ação |
|------|------|-------|------|
| **A** | *(deixe vazio ou use @)* | 151.101.1.195 | Adicionar |
| **A** | *(deixe vazio ou use @)* | 151.101.65.195 | Adicionar |
| **CNAME** | www | roteirosdispensacao.web.app. | Adicionar |
| **TXT** | *(deixe vazio ou use @)* | firebase=roteirosdispensacao | Adicionar |

### Passo 3: Para subdomínios adicionais

| Tipo | Nome | Dados | Ação |
|------|------|-------|------|
| **CNAME** | homolog | roteirosdispensacao-staging.web.app. | Adicionar |
| **CNAME** | api | roteiro-dispensacao-api-xyz123.a.run.app. | Adicionar |

## 🔍 Como preencher no Registro.br

### Para registros A (domínio principal):
- **Tipo**: Selecione "A"
- **Nome**: Deixe VAZIO ou coloque @ (significa domínio raiz)
- **Dados**: Digite o IP (ex: 151.101.1.195)
- Clique em adicionar

### Para registro CNAME (www):
- **Tipo**: Selecione "CNAME"
- **Nome**: Digite "www" (sem aspas)
- **Dados**: Digite "roteirosdispensacao.web.app." (com ponto no final)
- Clique em adicionar

### Para registro TXT (verificação):
- **Tipo**: Selecione "TXT"
- **Nome**: Deixe VAZIO ou coloque @
- **Dados**: Digite "firebase=roteirosdispensacao" (com aspas se solicitado)
- Clique em adicionar

## ✅ Configuração Final Esperada

Após configurar, sua zona DNS deve ficar assim:

```
Tipo    Nome                            Dados
A       roteirosdispensacao.com.br      151.101.1.195
A       roteirosdispensacao.com.br      151.101.65.195
CNAME   www.roteirosdispensacao.com.br  roteirosdispensacao.web.app.
TXT     roteirosdispensacao.com.br      firebase=roteirosdispensacao
```

## 🚀 Próximos Passos

1. **Aguarde propagação**: 15 minutos a 48 horas
2. **Verifique no Firebase Console**: 
   - Vá em Hosting → Domínios personalizados
   - Adicione `roteirosdispensacao.com.br`
   - O Firebase verificará automaticamente
3. **SSL será provisionado**: Automático em até 24h

## 🔧 Teste de Propagação

Use estes comandos para verificar:

```cmd
nslookup roteirosdispensacao.com.br
nslookup www.roteirosdispensacao.com.br
```

Ou acesse: https://dnschecker.org/#A/roteirosdispensacao.com.br

## ❗ Resolução de Problemas

### "Record CNAME inválido - o campo 'nome' é obrigatório"
- Você está tentando criar CNAME no domínio raiz
- Solução: Use registros A para o domínio raiz

### "Conflito de registros"
- Não pode ter CNAME e A no mesmo nome
- Solução: Delete o CNAME conflitante primeiro

### Site não carrega após 48h
- Verifique se os IPs estão corretos
- Confirme no Firebase Console se o domínio foi verificado
- Teste com: `ping roteirosdispensacao.com.br`

## 📞 Suporte Registro.br

Se tiver dúvidas:
- Email: suporte@registro.br
- Telefone: (11) 5509-3511
- Chat online: https://registro.br/ajuda/