import os
import re
import codecs

def fix_bom_and_unicode():
    """Remove BOM e caracteres Unicode problemáticos dos workflows"""
    
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
        '📊': '[MONITOR]',
        '💬': '[COMMENT]',
        '🤖': '[BOT]',
        '🔄': '[PROCESS]',
        '🏷️': '[TAG]',
        '🧹': '[CLEANUP]',
        '📝': '[DOCS]',
        '📦': '[PACKAGE]',
        '🔍': '[ANALYZE]',
        '🎯': '[TARGET]',
        '📈': '[STATS]',
        '🛡️': '[SHIELD]',
        '⚡': '[FAST]',
        '🐛': '[BUG]',
        '✨': '[SPARKLE]',
        '🎨': '[ART]',
        '📱': '[MOBILE]',
        '🏠': '[HOME]',
        '🗄️': '[ARCHIVE]',
        '🗑️': '[TRASH]'
    }
    
    for filename in os.listdir(workflows_dir):
        if filename.endswith('.yml') or filename.endswith('.yaml'):
            filepath = os.path.join(workflows_dir, filename)
            
            # Lê o arquivo detectando encoding automaticamente
            try:
                # Primeiro tenta UTF-8 com BOM
                with open(filepath, 'rb') as f:
                    raw_data = f.read()
                
                # Remove BOM UTF-8 se presente
                if raw_data.startswith(codecs.BOM_UTF8):
                    raw_data = raw_data[3:]
                    print(f"[BOM] Removido BOM de {filename}")
                
                # Remove outros BOMs
                if raw_data.startswith(codecs.BOM_UTF16_LE) or raw_data.startswith(codecs.BOM_UTF16_BE):
                    raw_data = raw_data[2:]
                    print(f"[BOM] Removido BOM UTF-16 de {filename}")
                
                # Decodifica para string
                try:
                    content = raw_data.decode('utf-8', errors='ignore')
                except UnicodeDecodeError:
                    content = raw_data.decode('cp1252', errors='ignore')
                
            except Exception as e:
                print(f"[ERROR] Erro ao ler {filename}: {e}")
                continue
            
            original_content = content
            
            # Substitui emojis conhecidos
            for emoji, replacement in emoji_replacements.items():
                content = content.replace(emoji, replacement)
            
            # Remove caracteres Unicode problemáticos
            # Remove surrogates órfãos
            content = re.sub(r'[\uD800-\uDFFF]', '', content)
            
            # Remove caracteres de controle problemáticos
            content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
            
            # Remove caracteres não printáveis que podem causar problemas
            content = re.sub(r'[\u200B-\u200F\u2028-\u202F\u205F-\u206F]', '', content)
            
            # Normaliza quebras de linha para LF (Unix style)
            content = content.replace('\r\n', '\n').replace('\r', '\n')
            
            # Se houve mudanças, salva o arquivo
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8', newline='') as f:
                    f.write(content)
                fixed_files.append(filename)
                print(f"[FIXED] Corrigido: {filename}")
            else:
                print(f"[OK] Sem problemas: {filename}")
    
    return fixed_files

# Executa a correção
print("=== INICIANDO LIMPEZA COMPLETA ===")
print()
fixed = fix_bom_and_unicode()
print()
print(f"=== RESUMO ===")
print(f"Arquivos corrigidos: {len(fixed)}")
if fixed:
    print("Arquivos modificados:", ', '.join(fixed))
print("=== CONCLUIDO ===")