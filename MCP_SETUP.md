# Context7 MCP Setup - Ambiente Local

## Status Atual
✅ **Context7 MCP instalado**: `@upstash/context7-mcp v1.0.17`
✅ **Arquivo de configuração criado**: `~/.config/claude-code/mcp_servers.json`
⚠️ **Configuração atual usa variáveis não resolvidas localmente**

## Como Configurar Localmente

### Opção 1: Usar chave do Context7 diretamente
1. Obtenha sua chave da Context7 API
2. Edite o arquivo `~/.config/claude-code/mcp_servers.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp", "--api-key", "SUA_CHAVE_AQUI"],
      "env": {}
    }
  }
}
```

### Opção 2: Usar variável de ambiente local
1. Defina a variável no seu shell:
```bash
export CONTEXT7_API_KEY="sua_chave_aqui"
```

2. Modifique a configuração para:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

### Opção 3: Arquivo .env no projeto
1. Crie `.env.local` no projeto:
```env
CONTEXT7_API_KEY=sua_chave_aqui
```

2. Configure o MCP para usar o arquivo .env

## Testando a Instalação
```bash
# Verificar se o MCP está instalado
npx @upstash/context7-mcp --help

# Testar com chave (substitua pela sua chave)
npx @upstash/context7-mcp --api-key sua_chave_aqui
```

## Funcionalidades do Context7
- **Busca de documentação**: Frameworks, APIs, bibliotecas
- **Exemplos de código**: Patterns e implementações
- **Análise de contexto**: Entendimento de código existente
- **Sugestões inteligentes**: Baseadas na base de conhecimento

## Integração com GitHub Secrets
As chaves estão armazenadas como secrets no GitHub:
- `CONTEXT7_API_KEY`: Chave principal da API
- `API_URL_CONTEXT7`: URL do endpoint (https://context7.com/api/v1)

Para uso em CI/CD, os workflows já estão configurados para usar essas variáveis automaticamente.