# Instruções de Deploy no PythonAnywhere

## Arquivos Atualizados

1. **app_flask.py** - Aplicação Flask simplificada com:
   - Interface web básica
   - Integração com OpenRouter
   - Rate limiting para proteção
   - Suporte a variáveis de ambiente

2. **wsgi_pythonanywhere.py** - Configuração WSGI para PythonAnywhere
   - Carrega variáveis de ambiente do .env
   - Importa app_flask

3. **.env.example** - Exemplo de configuração
   - Copie para .env e adicione suas chaves reais

## Passos para Deploy

### 1. No Console do PythonAnywhere:

```bash
# Criar arquivo .env com sua chave
cd ~/
nano .env
```

Adicione:
```
OPENROUTER_API_KEY=sua_chave_real_aqui
```

### 2. Upload dos arquivos:
- Faça upload de `app_flask.py` para `/home/roteirodedispensacao/`
- O wsgi.py já deve estar configurado

### 3. Instalar dependências:
```bash
pip3.10 install --user python-dotenv
```

### 4. No Web Tab do PythonAnywhere:
- Verifique se Source code está: `/home/roteirodedispensacao`
- Clique em "Reload"

### 5. Acesse:
https://roteirodedispensacao.pythonanywhere.com

## Segurança

- A chave API fica protegida no servidor
- Rate limiting previne abuso (100 requisições/hora por IP)
- CORS configurado para aceitar apenas origens autorizadas

## Problemas Comuns

1. **Erro 500**: Verifique o error log no PythonAnywhere
2. **"API key não configurada"**: Verifique se o .env está correto
3. **Import error**: Verifique se python-dotenv está instalado

## Modelo OpenRouter

O código usa `mistralai/mistral-7b-instruct:free` que é gratuito. 
Você pode mudar para outros modelos editando a linha no app_flask.py:

```python
"model": "mistralai/mistral-7b-instruct:free",
```

Outros modelos gratuitos:
- `google/gemma-7b-it:free`
- `meta-llama/llama-3-8b-instruct:free`