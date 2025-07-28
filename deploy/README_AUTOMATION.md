# 🚀 Scripts de Automação de Deploy - Roteiro de Dispensação

## 📋 Visão Geral

Este diretório contém scripts de automação para deploy completo no Render.com e limpeza de repositórios GitHub.

## 🛠️ Scripts Disponíveis

### 1. `complete_deployment.py` - Script Principal
Script unificado que executa todo o processo de deployment.

**Funcionalidades:**
- ✅ Instala dependências automaticamente
- ✅ Executa limpeza do GitHub (opcional)
- ✅ Faz deploy no Render (opcional)
- ✅ Gera relatório de deployment

### 2. `github_cleanup_automation.py` - Limpeza GitHub
Remove repositórios criados em 2025, mantendo apenas os essenciais.

**Funcionalidades:**
- ✅ Lista todos os repositórios
- ✅ Identifica repos criados em 2025
- ✅ Cria backup antes de deletar
- ✅ Confirmação dupla de segurança

### 3. `render_deploy_automation.py` - Deploy Render
Automatiza o deploy completo no Render.com.

**Funcionalidades:**
- ✅ Cria/atualiza serviço no Render
- ✅ Configura variáveis de ambiente
- ✅ Monitora progresso do deploy
- ✅ Remove serviços extras (opcional)

## 🔧 Pré-requisitos

1. **Python 3.7+** instalado
2. **Git** configurado
3. **Tokens de Acesso:**
   - GitHub Personal Access Token (com permissão `delete_repo`)
   - Render API Key

## 📖 Como Usar

### Opção 1: Script Completo (Recomendado)

```bash
cd deploy
python complete_deployment.py
```

O script irá:
1. Instalar dependências necessárias
2. Perguntar se deseja limpar GitHub
3. Perguntar se deseja fazer deploy no Render
4. Gerar relatório final

### Opção 2: Scripts Individuais

#### Apenas Limpeza GitHub:
```bash
python github_cleanup_automation.py
```

#### Apenas Deploy Render:
```bash
python render_deploy_automation.py
```

## 🔑 Configuração de Tokens

### GitHub Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione o escopo `delete_repo`
4. Copie o token gerado

### Render API Key

1. Acesse: https://dashboard.render.com/account/api-keys
2. Clique em "Create API Key"
3. Copie a chave gerada

### Usando Variáveis de Ambiente (Opcional)

```bash
# Windows
set GITHUB_TOKEN=seu_token_aqui
set RENDER_API_KEY=sua_api_key_aqui

# Linux/Mac
export GITHUB_TOKEN=seu_token_aqui
export RENDER_API_KEY=sua_api_key_aqui
```

## 🔒 Segurança

- **Nunca commite tokens!** Os scripts solicitam tokens em runtime
- **Backup automático** antes de deletar repositórios
- **Confirmação dupla** para ações destrutivas
- **Logs detalhados** de todas as operações

## 📊 Saídas

### Arquivos Gerados:

1. **`github_repos_backup_[timestamp].txt`**
   - Lista de repositórios deletados
   - URLs de clone para backup

2. **`deployment_report_[timestamp].md`**
   - Relatório completo do deployment
   - Status de cada etapa
   - URLs de produção

## ⚠️ Avisos Importantes

1. **Exclusão é permanente!** Não há como recuperar repos deletados
2. **Faça backup** de repositórios importantes antes
3. **Teste primeiro** em um ambiente de desenvolvimento
4. **Verifique os tokens** antes de executar

## 🆘 Troubleshooting

### Erro: "Git não encontrado"
```bash
# Instale o Git
# Windows: https://git-scm.com/download/win
# Linux: sudo apt-get install git
# Mac: brew install git
```

### Erro: "requests não encontrado"
```bash
pip install requests pyyaml
```

### Erro: "Autenticação falhou"
- Verifique se o token está correto
- Confirme as permissões do token
- Tente gerar um novo token

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs detalhados no console
2. Consulte os arquivos de backup gerados
3. Revise as configurações de tokens

---

**🤖 Scripts desenvolvidos por DevOps Engineer Sênior**
**📅 Última atualização: 2025-01-27**