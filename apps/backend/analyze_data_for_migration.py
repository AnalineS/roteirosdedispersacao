#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise de Dados para Migração Astra DB
Script para analisar dados existentes sem dependências externas
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

def analyze_json_structure(data: Any, path: str = "root") -> Dict[str, Any]:
    """Analisar estrutura de um objeto JSON"""
    analysis = {
        'type': type(data).__name__,
        'size': 0,
        'depth': 0,
        'keys': 0,
        'text_content': 0,
        'arrays': 0,
        'objects': 0
    }
    
    if isinstance(data, dict):
        analysis['type'] = 'dict'
        analysis['size'] = len(data)
        analysis['keys'] = len(data)
        analysis['objects'] = 1
        
        if data:
            child_depths = []
            for key, value in data.items():
                child_analysis = analyze_json_structure(value, f"{path}.{key}")
                child_depths.append(child_analysis['depth'])
                analysis['keys'] += child_analysis['keys']
                analysis['text_content'] += child_analysis['text_content']
                analysis['arrays'] += child_analysis['arrays']
                analysis['objects'] += child_analysis['objects']
            
            analysis['depth'] = 1 + (max(child_depths) if child_depths else 0)
    
    elif isinstance(data, list):
        analysis['type'] = 'list'
        analysis['size'] = len(data)
        analysis['arrays'] = 1
        
        if data:
            child_depths = []
            for i, item in enumerate(data):
                child_analysis = analyze_json_structure(item, f"{path}[{i}]")
                child_depths.append(child_analysis['depth'])
                analysis['keys'] += child_analysis['keys']
                analysis['text_content'] += child_analysis['text_content']
                analysis['arrays'] += child_analysis['arrays']
                analysis['objects'] += child_analysis['objects']
            
            analysis['depth'] = 1 + (max(child_depths) if child_depths else 0)
    
    elif isinstance(data, str):
        analysis['text_content'] = len(data)
        analysis['size'] = len(data)
    
    else:
        analysis['size'] = len(str(data))
    
    return analysis

def extract_potential_documents(data: Any, filename: str) -> List[Dict[str, Any]]:
    """Extrair potenciais documentos de um arquivo JSON"""
    documents = []
    
    def extract_text_pairs(obj, path="", category="general"):
        """Extrair pares pergunta-resposta e conteúdo textual"""
        pairs = []
        
        if isinstance(obj, dict):
            # Detectar FAQ patterns
            if "question" in obj and any(key.endswith("_answer") for key in obj.keys()):
                question = obj["question"]
                for key, value in obj.items():
                    if key.endswith("_answer") and isinstance(value, str):
                        persona = key.replace("_answer", "")
                        pairs.append({
                            'type': 'qa',
                            'question': question,
                            'answer': value,
                            'persona': persona,
                            'category': category,
                            'priority': 0.9
                        })
            
            # Detectar dosing protocols
            elif "dose" in obj or "frequency" in obj or "duration" in obj:
                content_parts = []
                if "dose" in obj:
                    content_parts.append(f"Dose: {obj['dose']}")
                if "frequency" in obj:
                    content_parts.append(f"Frequência: {obj['frequency']}")
                if "duration" in obj:
                    content_parts.append(f"Duração: {obj['duration']}")
                if "instructions" in obj:
                    content_parts.append(f"Instruções: {obj['instructions']}")
                
                if content_parts:
                    pairs.append({
                        'type': 'dosing',
                        'content': "\n".join(content_parts),
                        'category': path,
                        'priority': 1.0
                    })
            
            # Detectar definições e taxonomias
            elif "definition" in obj:
                pairs.append({
                    'type': 'definition',
                    'term': path.split('.')[-1] if '.' in path else path,
                    'definition': obj['definition'],
                    'synonyms': obj.get('synonyms', []),
                    'category': 'taxonomy',
                    'priority': 0.7
                })
            
            # Detectar mecanismos de medicamentos
            elif "mechanism" in obj or "indications" in obj:
                content_parts = []
                if "mechanism" in obj:
                    content_parts.append(f"Mecanismo: {obj['mechanism']}")
                if "indications" in obj:
                    content_parts.append(f"Indicações: {obj['indications']}")
                if "contraindications" in obj:
                    content_parts.append(f"Contraindicações: {obj['contraindications']}")
                
                if content_parts:
                    pairs.append({
                        'type': 'mechanism',
                        'medication': path.split('.')[-1] if '.' in path else path,
                        'content': "\n".join(content_parts),
                        'category': 'pharmacology',
                        'priority': 0.8
                    })
            
            # Recursão para objetos aninhados
            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                pairs.extend(extract_text_pairs(value, new_path, category))
        
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = f"{path}[{i}]" if path else f"item_{i}"
                pairs.extend(extract_text_pairs(item, new_path, category))
        
        return pairs
    
    # Extrair documentos baseado no nome do arquivo
    if 'frequently_asked_questions' in filename:
        documents.extend(extract_text_pairs(data, "", "qa"))
    elif 'dosing_protocols' in filename:
        documents.extend(extract_text_pairs(data, "", "dosing"))
    elif 'clinical_taxonomy' in filename:
        documents.extend(extract_text_pairs(data, "", "taxonomy"))
    elif 'medications_mechanisms' in filename:
        documents.extend(extract_text_pairs(data, "", "pharmacology"))
    elif 'pharmacovigilance' in filename:
        documents.extend(extract_text_pairs(data, "", "safety"))
    else:
        documents.extend(extract_text_pairs(data, "", "general"))
    
    return documents

def analyze_local_vector_store(store_path: Path) -> Dict[str, Any]:
    """Analisar vector store local se existir"""
    analysis = {
        'exists': False,
        'embeddings_file_size': 0,
        'metadata_documents': 0,
        'estimated_vectors': 0
    }
    
    if not store_path.exists():
        return analysis
    
    analysis['exists'] = True
    
    # Verificar arquivos do vector store
    embeddings_file = store_path / "embeddings.npy"
    metadata_file = store_path / "metadata.json"
    
    if embeddings_file.exists():
        analysis['embeddings_file_size'] = embeddings_file.stat().st_size / 1024  # KB
        # Estimar número de vetores (assumindo float32 e 384 dimensões)
        estimated_vectors = analysis['embeddings_file_size'] * 1024 / (384 * 4)
        analysis['estimated_vectors'] = int(estimated_vectors)
    
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                analysis['metadata_documents'] = len(metadata)
        except Exception:
            pass
    
    return analysis

def main():
    """Função principal de análise"""
    print("[ANALYSIS] Analisando dados para migração Astra DB")
    print("=" * 60)
    
    # Paths
    current_file = Path(__file__)
    backend_dir = current_file.parent  # apps/backend
    apps_dir = backend_dir.parent      # apps
    project_root = apps_dir.parent     # root do projeto
    data_dir = project_root / "data"
    vector_store_path = project_root / "data" / "embeddings"
    
    # Resultados da análise
    analysis_results = {
        'timestamp': datetime.now().isoformat(),
        'vector_store': analyze_local_vector_store(vector_store_path),
        'structured_files': {},
        'total_potential_documents': 0,
        'document_types': {},
        'recommendations': []
    }
    
    print(f"[PATHS] Diretório de dados: {data_dir}")
    print(f"[PATHS] Vector store: {vector_store_path}")
    
    # Analisar vector store local
    vs_analysis = analysis_results['vector_store']
    print(f"\n[VECTOR STORE] Análise do store local:")
    print(f"  * Existe: {'SIM' if vs_analysis['exists'] else 'NÃO'}")
    if vs_analysis['exists']:
        print(f"  * Arquivo embeddings: {vs_analysis['embeddings_file_size']:.1f} KB")
        print(f"  * Documentos em metadata: {vs_analysis['metadata_documents']}")
        print(f"  * Vetores estimados: {vs_analysis['estimated_vectors']}")
    
    # Analisar dados estruturados
    structured_dir = data_dir / "structured"
    print(f"\n[STRUCTURED DATA] Análise dos dados estruturados:")
    
    if not structured_dir.exists():
        print("  [WARNING] Diretório structured não encontrado")
        analysis_results['recommendations'].append("Criar diretório data/structured com arquivos JSON")
    else:
        json_files = list(structured_dir.glob("*.json"))
        print(f"  * Arquivos JSON encontrados: {len(json_files)}")
        
        for json_file in json_files:
            try:
                print(f"\n  [FILE] Analisando {json_file.name}...")
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Análise estrutural
                structure_analysis = analyze_json_structure(data)
                
                # Extração de documentos
                potential_docs = extract_potential_documents(data, json_file.name)
                
                file_analysis = {
                    'size_kb': json_file.stat().st_size / 1024,
                    'structure': structure_analysis,
                    'potential_documents': len(potential_docs),
                    'document_samples': potential_docs[:3]  # Primeiros 3 para exemplo
                }
                
                analysis_results['structured_files'][json_file.name] = file_analysis
                analysis_results['total_potential_documents'] += len(potential_docs)
                
                # Contar tipos de documentos
                for doc in potential_docs:
                    doc_type = doc.get('type', 'unknown')
                    analysis_results['document_types'][doc_type] = analysis_results['document_types'].get(doc_type, 0) + 1
                
                print(f"    * Tamanho: {file_analysis['size_kb']:.1f} KB")
                print(f"    * Profundidade: {structure_analysis['depth']} níveis")
                print(f"    * Chaves totais: {structure_analysis['keys']}")
                print(f"    * Documentos extraíveis: {len(potential_docs)}")
                
                # Mostrar exemplos
                if potential_docs:
                    print(f"    * Exemplo: {potential_docs[0].get('type', 'N/A')} - {str(potential_docs[0]).get('content', str(potential_docs[0]))[:50]}...")
                
            except Exception as e:
                print(f"    [ERROR] Erro ao analisar {json_file.name}: {e}")
                analysis_results['recommendations'].append(f"Corrigir arquivo {json_file.name}: {e}")
    
    # Resumo da análise
    print(f"\n[SUMMARY] Resumo da análise:")
    print(f"  * Total de documentos potenciais: {analysis_results['total_potential_documents']}")
    print(f"  * Arquivos estruturados: {len(analysis_results['structured_files'])}")
    print(f"  * Vector store local: {'Disponivel' if vs_analysis['exists'] else 'Nao encontrado'}")
    
    print(f"\n[DOCUMENT TYPES] Distribuição por tipo:")
    for doc_type, count in sorted(analysis_results['document_types'].items()):
        percentage = (count / max(1, analysis_results['total_potential_documents'])) * 100
        print(f"  * {doc_type}: {count} ({percentage:.1f}%)")
    
    # Recomendações
    print(f"\n[RECOMMENDATIONS] Recomendações:")
    
    if analysis_results['total_potential_documents'] > 0:
        analysis_results['recommendations'].append("Dados estruturados prontos para migração")
        print("  [OK] Dados estruturados encontrados e processaveis")
    else:
        analysis_results['recommendations'].append("Verificar estrutura dos arquivos JSON")
        print("  [WARNING] Poucos ou nenhum documento extraivel encontrado")
    
    if vs_analysis['exists'] and vs_analysis['metadata_documents'] > 0:
        analysis_results['recommendations'].append("Vector store local disponível para migração")
        print("  [OK] Vector store local com dados existentes")
    else:
        analysis_results['recommendations'].append("Vector store local vazio ou inexistente")
        print("  [WARNING] Vector store local nao contem dados")
    
    if analysis_results['total_potential_documents'] > 100:
        analysis_results['recommendations'].append("Usar migração em batches (100 docs por vez)")
        print("  [INFO] Recomendado: migracao em batches devido ao volume")
    
    # Salvar relatório
    report_path = backend_dir / "data_analysis_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_results, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n[REPORT] Relatorio detalhado salvo em: {report_path}")
    
    # Status final
    ready_for_migration = (
        analysis_results['total_potential_documents'] > 0 or
        (vs_analysis['exists'] and vs_analysis['metadata_documents'] > 0)
    )
    
    print("\n" + "=" * 60)
    if ready_for_migration:
        print("[SUCCESS] DADOS PRONTOS PARA MIGRACAO!")
        print("[NEXT] Execute 'python services/migrate_to_astra.py' com Astra DB configurado")
    else:
        print("[WARNING] DADOS INSUFICIENTES PARA MIGRACAO")
        print("[FIX] Verifique arquivos JSON e configure dados estruturados")
    print("=" * 60)
    
    return ready_for_migration

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)