#!/usr/bin/env python3
import os
import re
import unicodedata

def clean_yaml_files():
    """Limpeza completa e agressiva dos arquivos YAML"""
    
    workflows_dir = '.github/workflows'
    fixed_files = []
    
    # Mapeamento completo de emojis e símbolos problemáticos para texto ASCII
    replacements = {
        # Emojis básicos
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
        '🗑️': '[TRASH]',
        
        # Símbolos especiais
        '💾': '[BACKUP]',
        '🌐': '[WEB]',
        '🏗️': '[BUILD]',
        '🔥': '[FIRE]',
        '💡': '[IDEA]',
        '📅': '[DATE]',
        '👤': '[USER]',
        '🎉': '[PARTY]',
        '‼️': '[URGENT]',
        '💰': '[MONEY]',
        '🛠️': '[REPAIR]',
        '👥': '[USERS]',
        '💭': '[THINK]',
        '🔗': '[LINK]',
        '📲': '[NOTIFY]',
        
        # Acentos e caracteres especiais (casos problemáticos)
        'ção': 'cao',
        'ção': 'cao',
        'ção': 'cao',
        'ção': 'cao',
        'ão': 'ao',
        'ã': 'a',
        'á': 'a',
        'à': 'a',
        'â': 'a',
        'é': 'e',
        'ê': 'e',
        'í': 'i',
        'ó': 'o',
        'ô': 'o',
        'ú': 'u',
        'ç': 'c',
    }
    
    for filename in os.listdir(workflows_dir):
        if filename.endswith('.yml') or filename.endswith('.yaml'):
            filepath = os.path.join(workflows_dir, filename)
            
            print(f"Processando: {filename}")
            
            # Lê arquivo em modo binário primeiro
            with open(filepath, 'rb') as f:
                raw_data = f.read()
            
            # Remove BOMs conhecidos
            if raw_data.startswith(b'\xef\xbb\xbf'):
                raw_data = raw_data[3:]
                print(f"  [BOM] UTF-8 BOM removido")
            elif raw_data.startswith(b'\xff\xfe'):
                raw_data = raw_data[2:]
                print(f"  [BOM] UTF-16 LE BOM removido")
            elif raw_data.startswith(b'\xfe\xff'):
                raw_data = raw_data[2:]
                print(f"  [BOM] UTF-16 BE BOM removido")
            
            # Decodifica forçadamente para string, ignorando erros
            try:
                content = raw_data.decode('utf-8', errors='replace')
            except:
                try:
                    content = raw_data.decode('cp1252', errors='replace')
                except:
                    content = raw_data.decode('ascii', errors='replace')
            
            original_content = content
            
            # Remove caracteres Unicode replacement (problemas de decodificação)
            content = content.replace('\ufffd', '')
            
            # Normaliza Unicode (decompõe caracteres acentuados)
            content = unicodedata.normalize('NFD', content)
            
            # Remove diacríticos (acentos)
            content = ''.join(c for c in content if unicodedata.category(c) != 'Mn')
            
            # Aplica substituições de emojis e símbolos
            for old, new in replacements.items():
                content = content.replace(old, new)
            
            # Remove qualquer caractere não-ASCII restante
            content = ''.join(char if ord(char) < 128 else '' for char in content)
            
            # Remove caracteres de controle problemáticos
            content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
            
            # Remove surrogates órfãos e outros caracteres problemáticos
            content = re.sub(r'[\uD800-\uDFFF\u200B-\u200F\u2028-\u202F\u205F-\u206F]', '', content)
            
            # Normaliza quebras de linha
            content = re.sub(r'\r\n|\r', '\n', content)
            
            # Remove linhas vazias excessivas
            content = re.sub(r'\n\n\n+', '\n\n', content)
            
            # Garante que termina com quebra de linha
            if content and not content.endswith('\n'):
                content += '\n'
            
            # Se houve mudanças, salva o arquivo
            if content != original_content:
                with open(filepath, 'w', encoding='ascii', errors='replace') as f:
                    f.write(content)
                fixed_files.append(filename)
                print(f"  [FIXED] Arquivo corrigido")
            else:
                print(f"  [OK] Nenhuma alteracao necessaria")
    
    return fixed_files

if __name__ == "__main__":
    print("=== LIMPEZA AGRESSIVA DE ARQUIVOS YAML ===")
    print()
    
    fixed = clean_yaml_files()
    
    print()
    print(f"=== RESUMO ===")
    print(f"Arquivos processados: {len(os.listdir('.github/workflows'))}")
    print(f"Arquivos corrigidos: {len(fixed)}")
    if fixed:
        print("Arquivos modificados:", ', '.join(fixed))
    print("=== CONCLUIDO ===")