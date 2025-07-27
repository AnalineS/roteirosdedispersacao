#!/usr/bin/env python3
"""
Post-Reorganization Validation Check
Verifica se a reorganização estrutural não quebrou funcionalidades

Data: 27 de Janeiro de 2025
Versão: 2.0.0 - Pós-reorganização estrutural
"""

import sys
import os
from pathlib import Path

def check_structure():
    """Verifica se a nova estrutura está correta"""
    print("=" * 60)
    print("VALIDAÇÃO PÓS-REORGANIZAÇÃO v2.0.0")
    print("=" * 60)
    
    base_path = Path(".")
    
    # Estrutura esperada
    expected_structure = {
        'src/backend/main.py': 'Ponto de entrada do backend',
        'src/backend/core/personas/dr_gasnelio.py': 'Dr. Gasnelio persona',
        'src/backend/core/personas/ga_empathetic.py': 'Gá persona empática',
        'src/backend/core/personas/persona_manager.py': 'Gerenciador de personas',
        'src/backend/core/validation/scope_detector.py': 'Detector de escopo',
        'src/backend/core/rag/knowledge_base.py': 'Sistema RAG',
        'src/backend/config/dr_gasnelio_technical_prompt.py': 'Prompt Dr. Gasnelio',
        'src/backend/config/ga_empathetic_prompt.py': 'Prompt Gá',
        'data/structured/dosing_protocols.json': 'Protocolos de dosagem',
        'data/structured/hanseniase_catalog.json': 'Catálogo hanseníase',
        'tests/quality/scientific/test_persona_coherence.py': 'Teste de coerência',
        'tests/integration/test_simple.py': 'Testes de integração',
        'tools/validation/validation_test.py': 'Script de validação estrutural',
        'tools/validation/enhanced_persona_test.py': 'Teste de personas',
        'tools/monitoring/start_dev_environment.py': 'Script de ambiente',
        'docs/ARCHITECTURE.md': 'Documentação de arquitetura',
        'docs/DEVELOPMENT.md': 'Guia de desenvolvimento',
        'docs/SECURITY.md': 'Guia de segurança',
        'deploy/render.yaml': 'Configuração de deploy',
        'REPOSITORY_STRUCTURE.md': 'Documentação da estrutura',
        'CHANGELOG.md': 'Histórico de mudanças'
    }
    
    print("🔍 VERIFICAÇÃO DE ESTRUTURA:")
    print("-" * 40)
    
    missing_files = []
    found_files = []
    
    for file_path, description in expected_structure.items():
        full_path = base_path / file_path
        if full_path.exists():
            found_files.append(file_path)
            print(f"✅ {file_path}")
        else:
            missing_files.append(file_path)
            print(f"❌ {file_path} - {description}")
    
    # Verificar diretórios vazios antigos
    print()
    print("🗑️ VERIFICAÇÃO DE LIMPEZA:")
    print("-" * 40)
    
    old_dirs_to_check = [
        'src/backend/prompts',
        'src/backend/services',
        'data/knowledge_base',
        'data/structured_knowledge',
        'tests/scientific_quality',
        'scripts'
    ]
    
    cleaned_dirs = []
    remaining_dirs = []
    
    for dir_path in old_dirs_to_check:
        full_path = base_path / dir_path
        if not full_path.exists():
            cleaned_dirs.append(dir_path)
            print(f"✅ {dir_path} - Removido")
        else:
            remaining_dirs.append(dir_path)
            print(f"⚠️ {dir_path} - Ainda existe")
    
    # Resultado final
    print()
    print("📊 RESUMO DA VALIDAÇÃO:")
    print("=" * 60)
    print(f"Arquivos encontrados: {len(found_files)}/{len(expected_structure)}")
    print(f"Arquivos ausentes: {len(missing_files)}")
    print(f"Diretórios limpos: {len(cleaned_dirs)}/{len(old_dirs_to_check)}")
    print(f"Diretórios restantes: {len(remaining_dirs)}")
    
    success_rate = len(found_files) / len(expected_structure) * 100
    cleanup_rate = len(cleaned_dirs) / len(old_dirs_to_check) * 100
    
    print(f"\n📈 Taxa de sucesso estrutural: {success_rate:.1f}%")
    print(f"📈 Taxa de limpeza: {cleanup_rate:.1f}%")
    
    if success_rate >= 90 and cleanup_rate >= 70:
        print("\n🎉 REORGANIZAÇÃO ESTRUTURAL: SUCESSO")
        print("✅ Nova estrutura implementada corretamente")
        return True
    else:
        print("\n⚠️ REORGANIZAÇÃO ESTRUTURAL: REQUER ATENÇÃO")
        if missing_files:
            print("\nArquivos ausentes:")
            for file in missing_files:
                print(f"  - {file}")
        if remaining_dirs:
            print("\nDiretórios não limpos:")
            for dir in remaining_dirs:
                print(f"  - {dir}")
        return False

def check_imports():
    """Verifica se há imports quebrados nos arquivos principais"""
    print("\n🔗 VERIFICAÇÃO DE IMPORTS:")
    print("-" * 40)
    
    base_path = Path(".")
    
    # Arquivos Python principais para verificar
    python_files = [
        'src/backend/main.py',
        'src/backend/core/personas/dr_gasnelio.py',
        'src/backend/core/personas/ga_empathetic.py',
        'src/backend/core/personas/persona_manager.py',
        'src/backend/core/validation/scope_detector.py',
        'src/backend/core/rag/knowledge_base.py'
    ]
    
    import_issues = []
    
    for file_path in python_files:
        full_path = base_path / file_path
        if full_path.exists():
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar imports possivelmente quebrados
                lines = content.split('\n')
                for line_num, line in enumerate(lines, 1):
                    if line.strip().startswith('from ') or line.strip().startswith('import '):
                        # Verificar imports relativos antigos
                        if ('services.' in line or 'prompts.' in line or 
                            'scientific_quality' in line):
                            import_issues.append({
                                'file': file_path,
                                'line': line_num,
                                'content': line.strip()
                            })
                
                print(f"✅ {file_path}")
                
            except Exception as e:
                print(f"❌ {file_path} - Erro: {e}")
                import_issues.append({
                    'file': file_path,
                    'line': 0,
                    'content': f"Erro de leitura: {e}"
                })
        else:
            print(f"❌ {file_path} - Arquivo não encontrado")
    
    if import_issues:
        print(f"\n⚠️ {len(import_issues)} possíveis problemas de import encontrados:")
        for issue in import_issues[:5]:  # Mostrar apenas os primeiros 5
            print(f"  {issue['file']}:{issue['line']} - {issue['content']}")
        if len(import_issues) > 5:
            print(f"  ... e mais {len(import_issues) - 5} problemas")
        return False
    else:
        print("\n✅ Nenhum problema óbvio de import detectado")
        return True

def main():
    """Executa validação completa pós-reorganização"""
    try:
        print("Verificando estrutura pós-reorganização...")
        
        structure_ok = check_structure()
        imports_ok = check_imports()
        
        print("\n" + "=" * 60)
        if structure_ok and imports_ok:
            print("🎉 VALIDAÇÃO COMPLETA: SUCESSO")
            print("✅ Reorganização estrutural implementada corretamente")
            print("✅ Nenhum problema crítico detectado")
            print("\n🚀 Sistema pronto para próximas etapas:")
            print("  1. Atualizar imports específicos se necessário")
            print("  2. Testar funcionalidade completa")
            print("  3. Prosseguir com Fase 5.1.3")
            return True
        else:
            print("⚠️ VALIDAÇÃO COMPLETA: REQUER ATENÇÃO")
            print("Algumas correções podem ser necessárias antes de prosseguir")
            return False
            
    except Exception as e:
        print(f"ERRO na validação: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)