# Instruções de Deploy no PythonAnywhere

## Informações do Deploy
- **Usuário PythonAnywhere**: roteirodedispensacao
- **URL**: https://roteirodedispensacao.pythonanywhere.com/
- **Repositório**: https://github.com/AnalineS/siteroteirodedispersacao.git

## Passo a Passo Completo

### 1. Acesse o Console Bash do PythonAnywhere
1. Faça login em: https://www.pythonanywhere.com
2. Vá para a aba "Consoles"
3. Clique em "Bash" para abrir um novo console

### 2. Execute o Script de Deploy

No console Bash, execute os seguintes comandos:

```bash
# Baixar o script de deploy
cd ~
wget https://raw.githubusercontent.com/AnalineS/siteroteirodedispersacao/main/deploy_pythonanywhere.sh

# Tornar executável e executar
chmod +x deploy_pythonanywhere.sh
./deploy_pythonanywhere.sh
```

### 3. Configure a Web App no Painel

1. Vá para a aba "Web"
2. Se ainda não criou a web app:
   - Clique em "Add a new web app"
   - Escolha "Manual configuration"
   - Selecione Python 3.10

### 4. Configure o Virtual Environment

Na seção "Virtualenv":
- Path: `/home/roteirodedispensacao/.virtualenvs/siteroteirodedispensacao`

### 5. Configure o Arquivo WSGI

1. Clique em "WSGI configuration file"
2. O arquivo já foi criado pelo script em: `/home/roteirodedispensacao/roteirodedispensacao_pythonanywhere_com_wsgi.py`

### 6. Configure os Static Files

Na seção "Static files", adicione:
- **URL**: `/`
- **Directory**: `/home/roteirodedispensacao/siteroteirodedispensacao/frontend/build`

### 7. Configure Variáveis de Ambiente (se necessário)

Edite o arquivo `.env` no backend:
```bash
nano /home/roteirodedispensacao/siteroteirodedispersacao/backend/.env
```

### 8. Recarregue a Aplicação

Clique no botão verde "Reload" na página Web

## Solução de Problemas

### Verificar Logs de Erro
```bash
# Log de erros principal
tail -f /var/log/roteirodedispensacao.pythonanywhere.com.error.log

# Log do servidor
tail -f /var/log/roteirodedispensacao.pythonanywhere.com.server.log
```

### Testar Importação Manual
```bash
cd /home/roteirodedispensacao/siteroteirodedispersacao
source /home/roteirodedispensacao/.virtualenvs/siteroteirodedispersacao/bin/activate
python
>>> from backend.app import app
>>> exit()
```

### Problemas Comuns e Soluções

1. **ModuleNotFoundError**
   - Verifique se o virtualenv está ativado
   - Confirme que todas as dependências foram instaladas
   - Verifique o PYTHONPATH no arquivo WSGI

2. **500 Internal Server Error**
   - Verifique os logs de erro
   - Confirme que o arquivo app.py existe em backend/
   - Verifique permissões dos arquivos

3. **Static Files não carregam**
   - Confirme o caminho correto: `/home/roteirodedispensacao/siteroteirodedispersacao/frontend/build`
   - Verifique se o build do React existe
   - Recarregue a aplicação após configurar

## Comandos Úteis

```bash
# Atualizar código do GitHub
cd /home/roteirodedispensacao/siteroteirodedispersacao
git pull origin main

# Reinstalar dependências
source /home/roteirodedispensacao/.virtualenvs/siteroteirodedispersacao/bin/activate
pip install -r backend/requirements.txt

# Recarregar aplicação via linha de comando
touch /var/www/roteirodedispensacao_pythonanywhere_com_wsgi.py
```

## Estrutura de Arquivos Esperada

```
/home/roteirodedispensacao/
├── siteroteirodedispersacao/
│   ├── backend/
│   │   ├── app.py
│   │   ├── requirements.txt
│   │   └── .env
│   └── frontend/
│       └── build/
│           ├── index.html
│           └── static/
└── roteirodedispensacao_pythonanywhere_com_wsgi.py
```