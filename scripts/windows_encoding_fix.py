# -*- coding: utf-8 -*-
"""
Windows Encoding Fix - Solução Permanente
========================================

Script para corrigir problemas de encoding UTF-8 no Windows
para todos os arquivos Python do repositório.

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 30/08/2025
"""

import sys
import os
import io
import locale
from pathlib import Path

def setup_windows_utf8():
    """Configura UTF-8 para Windows de forma permanente"""
    
    # 1. Configurar stdout/stderr para UTF-8
    if sys.platform == "win32":
        # Forçar UTF-8 no stdout e stderr
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    # 2. Configurar locale para UTF-8 se possível
    try:
        locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
        except:
            # Fallback para C.UTF-8 ou padrão
            try:
                locale.setlocale(locale.LC_ALL, 'C.UTF-8')
            except:
                pass  # Usar padrão do sistema
    
    # 3. Definir variáveis de ambiente
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['PYTHONUTF8'] = '1'  # Python 3.7+
    
    print("UTF-8 configurado com sucesso para Windows")

def get_safe_text(text: str) -> str:
    """Converte texto para versão Windows-safe"""
    replacements = {
        # Emojis comuns para ASCII
        '[SECURITY]': '[SECURITY]',
        '[SEARCH]': '[SEARCH]',
        '[TEST]': '[TEST]',
        '[REPORT]': '[REPORT]',
        '[OK]': '[OK]',
        '[ERROR]': '[ERROR]',
        '[WARNING]': '[WARNING]',
        '[START]': '[START]',
        '[TARGET]': '[TARGET]',
        '[FIX]': '[FIX]',
        '[LIST]': '[LIST]',
        '[SAVE]': '[SAVE]',
        '[ALERT]': '[ALERT]',
        '[GREEN]': '[GREEN]',
        '[YELLOW]': '[YELLOW]',
        '[RED]': '[RED]',
        '[NOTE]': '[NOTE]',
        '[AUTH]': '[AUTH]',
        '[STAR]': '[STAR]',
        '[STAR]': '[STAR]',
        
        # Outros caracteres problemáticos
        '...': '...',
        '-': '-',
        '--': '--',
        '''''''''"': '"',
        '"': '"',
        '*': '*',
        '->': '->',
        '<-': '<-',
        '^': '^',
        'v': 'v',
    }
    
    result = text
    for unicode_char, ascii_replacement in replacements.items():
        result = result.replace(unicode_char, ascii_replacement)
    
    return result

def fix_file_encoding(file_path: Path) -> bool:
    """Corrige encoding de um arquivo específico"""
    try:
        # Ler arquivo com diferentes encodings
        content = None
        original_encoding = None
        
        # Tentar diferentes encodings
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    original_encoding = encoding
                    break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print(f"Erro: Não foi possível ler {file_path}")
            return False
        
        # Converter caracteres problemáticos
        safe_content = get_safe_text(content)
        
        # Garantir header UTF-8 em arquivos Python
        if file_path.suffix == '.py':
            lines = safe_content.split('\n')
            has_encoding_header = any('coding' in line and 'utf-8' in line for line in lines[:3])
            
            if not has_encoding_header:
                # Adicionar header UTF-8
                if lines and lines[0].startswith('#!'):
                    # Shebang existe, adicionar após
                    lines.insert(1, '# -*- coding: utf-8 -*-')
                else:
                    # Adicionar no início
                    lines.insert(0, '# -*- coding: utf-8 -*-')
                
                safe_content = '\n'.join(lines)
        
        # Salvar arquivo com UTF-8
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(safe_content)
        
        print(f"Corrigido: {file_path} (era {original_encoding})")
        return True
        
    except Exception as e:
        print(f"Erro ao corrigir {file_path}: {e}")
        return False

def scan_and_fix_repository():
    """Escaneia e corrige todos os arquivos do repositório"""
    
    # Obter diretório raiz do repositório
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    
    print(f"Escaneando repositório: {repo_root}")
    
    # Tipos de arquivo para corrigir
    file_patterns = [
        '**/*.py',
        '**/*.md',
        '**/*.txt',
        '**/*.json',
        '**/*.yml',
        '**/*.yaml',
        '**/*.sql'
    ]
    
    # Diretórios para ignorar
    ignore_dirs = {
        '.git', '__pycache__', '.pytest_cache', 'node_modules',
        '.vscode', '.idea', 'venv', 'env', '.env'
    }
    
    fixed_count = 0
    error_count = 0
    
    for pattern in file_patterns:
        for file_path in repo_root.glob(pattern):
            # Ignorar arquivos em diretórios específicos
            if any(ignore_dir in file_path.parts for ignore_dir in ignore_dirs):
                continue
            
            if file_path.is_file():
                if fix_file_encoding(file_path):
                    fixed_count += 1
                else:
                    error_count += 1
    
    print(f"\nResultado:")
    print(f"Arquivos corrigidos: {fixed_count}")
    print(f"Erros encontrados: {error_count}")
    
    return fixed_count, error_count

def create_windows_batch_script():
    """Cria script batch para configurar encoding permanentemente"""
    
    batch_content = '''@echo off
REM Script para configurar encoding UTF-8 no Windows
REM Execute como Administrador para configuracao global

echo Configurando encoding UTF-8 para Python...

REM Configurar variaveis de ambiente do sistema
setx PYTHONIOENCODING utf-8 /M
setx PYTHONUTF8 1 /M

REM Configurar console para UTF-8
chcp 65001 > nul

REM Configurar Git para UTF-8
git config --global core.quotePath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

echo UTF-8 configurado com sucesso!
echo Reinicie o terminal para aplicar as mudancas.
pause
'''
    
    batch_path = Path(__file__).parent / 'configure_utf8_windows.bat'
    
    with open(batch_path, 'w', encoding='utf-8') as f:
        f.write(batch_content)
    
    print(f"Script batch criado: {batch_path}")
    print("Execute como Administrador para configuracao global do sistema")

def main():
    """Função principal"""
    print("Windows Encoding Fix - Solucao Permanente")
    print("=" * 50)
    
    # 1. Configurar UTF-8 para esta sessão
    setup_windows_utf8()
    
    # 2. Criar script batch
    create_windows_batch_script()
    
    # 3. Escanear e corrigir arquivos
    print("\nIniciando correcao de arquivos...")
    fixed, errors = scan_and_fix_repository()
    
    print("\n" + "=" * 50)
    print("SOLUCAO COMPLETA APLICADA")
    print("=" * 50)
    
    if errors == 0:
        print("Status: TODOS OS ARQUIVOS CORRIGIDOS COM SUCESSO")
        print("\nPROXIMOS PASSOS:")
        print("1. Execute 'configure_utf8_windows.bat' como Administrador")
        print("2. Reinicie o terminal/IDE")
        print("3. Todos os problemas de encoding estarao resolvidos")
        return 0
    else:
        print(f"Status: {fixed} arquivos corrigidos, {errors} com erro")
        print("Alguns arquivos podem precisar de correcao manual")
        return 1

if __name__ == "__main__":
    sys.exit(main())