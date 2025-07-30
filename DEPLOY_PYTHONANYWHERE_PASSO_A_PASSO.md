# 🚀 DEPLOY NO PYTHONANYWHERE - PASSO A PASSO COMPLETO

## 📁 PASSO 1: PREPARE OS ARQUIVOS NO SEU COMPUTADOR

### 1.1 Renomeie o arquivo .env
```
📂 Pasta: C:\Users\Ana\Meu Drive\Site roteiro de dispensação\
📄 Arquivo atual: .env.pythonanywhere
🔄 RENOMEIE PARA: .env
```

**Como fazer:**
1. Clique com botão direito no arquivo `.env.pythonanywhere`
2. Escolha "Renomear"
3. Digite: `.env`
4. Pressione Enter

### 1.2 Renomeie o arquivo WSGI
```
📂 Pasta: C:\Users\Ana\Meu Drive\Site roteiro de dispensação\
📄 Arquivo atual: wsgi_pythonanywhere.py
🔄 RENOMEIE PARA: roteirodedispensacao_pythonanywhere_com_wsgi.py
```

**Como fazer:**
1. Clique com botão direito no arquivo `wsgi_pythonanywhere.py`
2. Escolha "Renomear"
3. Digite: `roteirodedispensacao_pythonanywhere_com_wsgi.py`
4. Pressione Enter

## 🌐 PASSO 2: ENTRE NO PYTHONANYWHERE

### 2.1 Faça login
1. Vá para: https://www.pythonanywhere.com/
2. Clique em "Log in"
3. Digite seu usuário: `roteirodedispensacao`
4. Digite sua senha
5. Clique em "Log in"

## 📤 PASSO 3: FAÇA UPLOAD DOS ARQUIVOS

### 3.1 Vá para a área de arquivos
1. No menu superior, clique em "Files"
2. Você verá o caminho: `/home/roteirodedispensacao/`

### 3.2 Faça upload do arquivo .env
1. Clique no botão "Upload a file"
2. Selecione o arquivo `.env` do seu computador
3. Clique em "Upload"
4. **IMPORTANTE**: Arquivo `.env` deve ficar em `/home/roteirodedispensacao/.env`

### 3.3 Faça upload do arquivo app_flask.py
1. Clique no botão "Upload a file"
2. Selecione o arquivo `app_flask.py` do seu computador
3. Clique em "Upload"
4. **Se já existir**, clique em "Replace" para substituir

### 3.4 Faça upload do arquivo WSGI
1. Clique no botão "Upload a file"
2. Selecione o arquivo `roteirodedispensacao_pythonanywhere_com_wsgi.py`
3. Clique em "Upload"
4. **Se já existir**, clique em "Replace" para substituir

## 💻 PASSO 4: INSTALE AS DEPENDÊNCIAS

### 4.1 Abra o Console
1. No menu superior, clique em "Tasks"
2. Clique em "Console"
3. Escolha "Bash"

### 4.2 Digite os comandos (um por vez)
```bash
cd /home/roteirodedispensacao
```
**Pressione Enter e espere**

```bash
pip3.10 install --user Flask==2.3.3
```
**Pressione Enter e espere terminar**

```bash
pip3.10 install --user Flask-CORS==4.0.0
```
**Pressione Enter e espere terminar**

```bash
pip3.10 install --user python-dotenv==1.0.0
```
**Pressione Enter e espere terminar**

```bash
pip3.10 install --user requests==2.31.0
```
**Pressione Enter e espere terminar**

## 🌐 PASSO 5: CONFIGURE A APLICAÇÃO WEB

### 5.1 Vá para Web
1. No menu superior, clique em "Web"
2. Você verá sua aplicação: `roteirodedispensacao.pythonanywhere.com`

### 5.2 Verifique a configuração
1. Procure por "Source code:" 
2. Deve estar: `/home/roteirodedispensacao/`
3. Procure por "WSGI configuration file:"
4. Deve estar: `/var/www/roteirodedispensacao_pythonanywhere_com_wsgi.py`

### 5.3 Se o WSGI estiver errado, corrija:
1. Clique no link do "WSGI configuration file"
2. **APAGUE TODO O CONTEÚDO** do arquivo
3. **COLE ESTE CÓDIGO COMPLETO:**

```python
import sys
import os

# Configurar diretório do projeto
project_home = '/home/roteirodedispensacao'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Tentar carregar variáveis do arquivo .env
try:
    # Primeiro tenta usando python-dotenv se disponível
    from dotenv import load_dotenv
    load_dotenv(os.path.join(project_home, '.env'))
except ImportError:
    # Se python-dotenv não estiver disponível, carrega manualmente
    env_path = os.path.join(project_home, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

# Importar aplicação Flask
from app_flask import app as application
```

4. Clique em "Save" (botão verde)

## 🔄 PASSO 6: REINICIE A APLICAÇÃO

### 6.1 Volte para a página Web
1. No menu superior, clique em "Web"

### 6.2 Reinicie o servidor
1. Procure pelo botão verde grande "Reload roteirodedispensacao.pythonanywhere.com"
2. Clique nele
3. Espere aparecer "✓ reloaded successfully"

## 🧪 PASSO 7: TESTE SEU SITE

### 7.1 Abra seu site
1. Vá para: https://roteirodedispensacao.pythonanywhere.com
2. A página deve carregar sem erros
3. Digite uma pergunta no campo de texto
4. Clique em "Enviar"
5. Deve aparecer uma resposta

## 🔍 PASSO 8: SE DER ERRO, VEJA OS LOGS

### 8.1 Veja os logs de erro
1. No menu superior, clique em "Web"
2. Role para baixo até "Log files"
3. Clique em "Error log"
4. Veja se há erros vermelhos

### 8.2 Veja os logs de acesso
1. Clique em "Access log"
2. Procure por linhas com "500" (erro do servidor)

## ✅ VERIFICAÇÃO FINAL

**Sua estrutura de arquivos deve estar assim:**
```
/home/roteirodedispensacao/
├── .env                                           ← Sua API key aqui
├── app_flask.py                                   ← Aplicação principal
└── roteirodedispensacao_pythonanywhere_com_wsgi.py ← Arquivo WSGI
```

**No arquivo .env deve ter:**
```
OPENROUTER_API_KEY=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
```

## 🆘 SE AINDA DER ERRO

### Erro comum: "No module named 'app_flask'"
**Solução:**
1. Vá em "Files"
2. Verifique se `app_flask.py` está em `/home/roteirodedispensacao/`
3. Se não estiver, faça upload novamente

### Erro comum: "API key não configurada"
**Solução:**
1. Vá em "Files" 
2. Clique no arquivo `.env`
3. Verifique se tem a linha: `OPENROUTER_API_KEY=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`
4. Se não tiver, adicione e salve

### Erro comum: "Internal Server Error"
**Solução:**
1. Vá em "Web" > "Error log"
2. Copie a última mensagem de erro
3. Me envie para eu ajudar

## 🎉 PRONTO!

Se você seguiu todos os passos, seu site deve estar funcionando em:
**https://roteirodedispensacao.pythonanywhere.com**