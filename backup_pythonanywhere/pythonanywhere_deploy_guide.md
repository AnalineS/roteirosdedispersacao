# Guia de Deploy no PythonAnywhere

## Passos no Console do PythonAnywhere:

### 1. Instalar dependências básicas (sem ML pesado)
```bash
cd ~/roteiro-de-dispensacao
pip3.10 install --user Flask==2.3.3 Flask-CORS==4.0.0 Werkzeug==2.3.7 openai==1.12.0 python-dotenv==1.0.0 nltk==3.8.1 requests==2.31.0 bleach==6.0.0
```

### 2. Criar arquivo __init__.py nos diretórios services
```bash
touch ~/roteiro-de-dispensacao/src/backend/services/__init__.py
touch ~/roteiro-de-dispensacao/src/backend/core/__init__.py
touch ~/roteiro-de-dispensacao/src/backend/config/__init__.py
```

### 3. Criar um arquivo de configuração simplificado
```bash
cd ~/roteiro-de-dispensacao
nano .env
```

Adicione:
```
OPENAI_API_KEY=sua_chave_aqui
FLASK_ENV=production
```

### 4. Testar importação
```bash
cd ~/roteiro-de-dispensacao
python3.10 -c "import sys; sys.path.extend(['src', 'src/backend']); from main import app; print('✅ Import OK')"
```

### 5. Configurar no PythonAnywhere Web Tab:
- Source code: `/home/analines/roteiro-de-dispensacao`
- Working directory: `/home/analines/roteiro-de-dispensacao`
- WSGI configuration file: `/home/analines/roteiro-de-dispensacao/wsgi.py`

### 6. No arquivo WSGI do PythonAnywhere, certifique-se que tem:
```python
import sys
import os

project_home = '/home/analines/roteiro-de-dispensacao'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

sys.path.insert(0, os.path.join(project_home, 'src'))
sys.path.insert(0, os.path.join(project_home, 'src/backend'))

from main import app as application
```

### 7. Reload da aplicação web no PythonAnywhere

## Problemas Comuns:

1. **Erro de importação**: Verifique se todos os __init__.py existem
2. **Erro de permissão**: Use `chmod 755` nos diretórios se necessário
3. **Módulo não encontrado**: Adicione o caminho ao sys.path no wsgi.py

## Versão Simplificada (se o completo não funcionar):

Use o arquivo `app.py` em vez de `src/backend/main.py` - ele tem menos dependências e é mais simples de fazer funcionar.