import os
import re
import json

def fix_unicode_in_workflows():
    """Remove caracteres Unicode problemáticos dos workflows"""
    
    workflows_dir = '.github/workflows'
    fixed_files = []
    
    # Mapeamento de emojis para texto limpo
    emoji_replacements = {
        '🚨': '[ALERT]',
        '📧': '[EMAIL]',
        '🔧': '[TOOLS]',
        '📞': '[PHONE]',
        '✅': '[OK]',
        '❌': '[ERROR]',
        '⚠️': '[WARNING]',
        '📋': '[CLIPBOARD]',
        '🔒': '[LOCK]',
        '🌍': '[WORLD]',
        '🧪': '[TEST]',
        '🚀': '[DEPLOY]',
        '🏥': '[HEALTH]',
        '📊': '[MONITOR]'
    }
    
    for filename in os.listdir(workflows_dir):
        if filename.endswith('.yml') or filename.endswith('.yaml'):
            filepath = os.path.join(workflows_dir, filename)
            
            # Lê o arquivo com tratamento de erros
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            original_content = content
            
            # Substitui emojis conhecidos
            for emoji, replacement in emoji_replacements.items():
                content = content.replace(emoji, replacement)
            
            # Remove outros caracteres Unicode problemáticos
            # Remove surrogates órfãos
            content = re.sub(r'[\uD800-\uDFFF]', '', content)
            
            # Remove outros caracteres invisíveis problemáticos
            content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
            
            # Se houve mudanças, salva o arquivo
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed_files.append(filename)
                print(f"[FIXED] Corrigido: {filename}")
            else:
                print(f"[OK] Sem problemas: {filename}")
    
    return fixed_files

# Executa a correção
print("Iniciando correção de caracteres Unicode...")
fixed = fix_unicode_in_workflows()
print(f"\nArquivos corrigidos: {len(fixed)}")
if fixed:
    print("Arquivos modificados:", ', '.join(fixed))