#!/usr/bin/env python3
import os
import yaml
import sys

def fix_yaml_structure():
    """Corrige estrutura YAML dos arquivos de workflow"""
    
    workflows_dir = '.github/workflows'
    yaml_files = ['dependabot-manager.yml', 'hml-pipeline.yml', 'main-pipeline.yml', 'security-unified.yml']
    
    print("=== CORRIGINDO ESTRUTURA YAML ===")
    print()
    
    for filename in yaml_files:
        filepath = os.path.join(workflows_dir, filename)
        print(f"Processando: {filename}")
        
        try:
            # Le o arquivo como texto
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            # Tenta fazer parse para validar e reescrever
            try:
                data = yaml.safe_load(content)
                if data is None:
                    print(f"  [ERROR] Arquivo vazio ou inválido")
                    continue
                    
                # Reescreve o arquivo com estrutura YAML limpa
                with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                    yaml.safe_dump(data, f, 
                                 default_flow_style=False,
                                 indent=2, 
                                 width=1000,
                                 allow_unicode=False,
                                 sort_keys=False)
                
                print(f"  [OK] Estrutura YAML corrigida")
                
            except yaml.YAMLError as e:
                print(f"  [ERROR] Parse YAML falhou: {e}")
                # Se falhou o parse, faz limpeza manual da estrutura
                print(f"  [FIX] Tentando limpeza manual...")
                
                # Remove caracteres invisíveis e normaliza
                lines = []
                for line in content.split('\n'):
                    # Remove caracteres não ASCII no início/fim das linhas
                    line = line.strip('\ufeff\u200b\u00a0')
                    # Garante que indentação usa apenas espaços
                    if line.startswith('\t'):
                        line = line.replace('\t', '  ')
                    lines.append(line)
                
                cleaned_content = '\n'.join(lines)
                
                # Tenta parse novamente
                try:
                    data = yaml.safe_load(cleaned_content)
                    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                        yaml.safe_dump(data, f, 
                                     default_flow_style=False,
                                     indent=2, 
                                     width=1000,
                                     allow_unicode=False,
                                     sort_keys=False)
                    print(f"  [OK] Limpeza manual bem-sucedida")
                    
                except yaml.YAMLError as e2:
                    print(f"  [ERROR] Falha definitiva: {e2}")
                    # Como último recurso, salva o conteúdo limpo mesmo sem parse
                    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                        f.write(cleaned_content)
                    print(f"  [WARNING] Arquivo salvo com limpeza básica")
                
        except Exception as e:
            print(f"  [ERROR] Erro geral: {e}")
    
    print()
    print("=== VALIDACAO FINAL ===")
    
    # Validação final
    valid_count = 0
    for filename in yaml_files:
        filepath = os.path.join(workflows_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                yaml.safe_load(f.read())
            print(f"[OK] {filename} - YAML válido")
            valid_count += 1
        except Exception as e:
            print(f"[ERROR] {filename} - YAML inválido: {e}")
    
    print()
    print(f"=== RESUMO ===")
    print(f"Arquivos válidos: {valid_count}/{len(yaml_files)}")
    if valid_count == len(yaml_files):
        print("[OK] Todos os arquivos YAML estão válidos!")
        return True
    else:
        print("[ERROR] Alguns arquivos ainda têm problemas")
        return False

if __name__ == "__main__":
    success = fix_yaml_structure()
    sys.exit(0 if success else 1)