import yaml
import os
import sys

def validate_yaml_files():
    """Valida sintaxe YAML dos arquivos de workflow"""
    
    workflows_dir = '.github/workflows'
    yaml_files = [f for f in os.listdir(workflows_dir) if f.endswith('.yml') or f.endswith('.yaml')]
    
    print("=== VALIDACAO DE ARQUIVOS YAML ===")
    print()
    
    valid_count = 0
    invalid_count = 0
    
    for filename in yaml_files:
        filepath = os.path.join(workflows_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                yaml.safe_load(f)
            print(f"[OK] {filename} - YAML valido")
            valid_count += 1
        except yaml.YAMLError as e:
            print(f"[ERROR] {filename} - YAML invalido: {e}")
            invalid_count += 1
        except Exception as e:
            print(f"[ERROR] {filename} - Erro ao ler arquivo: {e}")
            invalid_count += 1
    
    print()
    print(f"=== RESUMO ===")
    print(f"Arquivos validos: {valid_count}")
    print(f"Arquivos invalidos: {invalid_count}")
    print(f"Total: {len(yaml_files)}")
    
    if invalid_count > 0:
        sys.exit(1)
    else:
        print("[OK] Todos os arquivos YAML estao validos!")

if __name__ == "__main__":
    validate_yaml_files()