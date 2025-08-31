#!/usr/bin/env python3
import os
import re

def fix_emojis_in_workflows():
    """Substitui apenas emojis por tags ASCII, preservando estrutura YAML"""
    
    workflows_dir = '.github/workflows'
    yaml_files = ['dependabot-manager.yml', 'hml-pipeline.yml', 'main-pipeline.yml', 'security-unified.yml']
    
    # Mapeamento completo de emojis para ASCII
    emoji_map = {
        # Principais emojis problemáticos
        '🤖': '[BOT]',
        '🔍': '[ANALYZE]', 
        '📥': '[CHECKOUT]',
        '📦': '[PACKAGE]',
        '🔒': '[LOCK]',
        '⚠️': '[WARNING]',
        '📈': '[STATS]',
        '🔧': '[TOOLS]',
        '✅': '[OK]',
        '❌': '[ERROR]',
        '🚀': '[DEPLOY]',
        '⚡': '[FAST]',
        '🛡️': '[SHIELD]',
        '🐛': '[BUG]',
        '✨': '[SPARKLE]',
        '🛠️': '[REPAIR]',
        '💬': '[COMMENT]',
        '📋': '[CLIPBOARD]',
        '📖': '[DOCS]',
        '🧪': '[TEST]',
        '🔄': '[PROCESS]',
        '📊': '[MONITOR]',
        '🚨': '[ALERT]',
        '📧': '[EMAIL]',
        '🏥': '[HEALTH]',
        '📞': '[PHONE]',
        '👥': '[USERS]',
        '🏷️': '[TAG]',
        '📝': '[DOCS]',
        '🧹': '[CLEANUP]',
        '🗄️': '[ARCHIVE]',
        '🎯': '[TARGET]',
        '🌍': '[WORLD]',
        '🎨': '[ART]',
        '📱': '[MOBILE]',
        '🏠': '[HOME]',
        '🔗': '[LINK]',
        '💾': '[BACKUP]',
        '🌐': '[WEB]',
        '🏗️': '[BUILD]',
        '💡': '[IDEA]',
        '📅': '[DATE]',
        '👤': '[USER]',
        '🎉': '[PARTY]',
        '💰': '[MONEY]',
        '🗑️': '[TRASH]',
        '📲': '[NOTIFY]',
        '🔥': '[FIRE]',
        
        # Símbolos de interface
        '✋': '[-]',
        '⏭️': '[SKIP]',
        '💭': '[THINK]',
        '‼️': '[URGENT]',
        '🔎': '[SEARCH]',
        '🎭': '[MASK]',
        '🏄': '[SURF]',
    }
    
    fixed_files = []
    
    print("=== SUBSTITUINDO EMOJIS POR TAGS ASCII ===")
    print()
    
    for filename in yaml_files:
        filepath = os.path.join(workflows_dir, filename)
        
        if not os.path.exists(filepath):
            print(f"[SKIP] {filename} - Arquivo não encontrado")
            continue
            
        print(f"Processando: {filename}")
        
        # Lê o arquivo
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        emoji_count = 0
        
        # Substitui cada emoji por sua tag ASCII
        for emoji, tag in emoji_map.items():
            if emoji in content:
                count_before = content.count(emoji)
                content = content.replace(emoji, tag)
                emoji_count += count_before
                if count_before > 0:
                    print(f"  [EMOJI] -> {tag} ({count_before}x)")
        
        # Se houve mudanças, salva o arquivo
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed_files.append(filename)
            print(f"  [FIXED] {emoji_count} emojis substituídos")
        else:
            print(f"  [OK] Nenhum emoji encontrado")
    
    print()
    print(f"=== RESUMO ===")
    print(f"Arquivos processados: {len(yaml_files)}")
    print(f"Arquivos modificados: {len(fixed_files)}")
    if fixed_files:
        print("Arquivos alterados:", ', '.join(fixed_files))

if __name__ == "__main__":
    fix_emojis_in_workflows()