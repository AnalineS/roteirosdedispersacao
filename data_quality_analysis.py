#!/usr/bin/env python3
"""
Data Quality Analysis - Preparação para Fine-tuning
Análise detalhada da qualidade dos dados e criação de dataset unificado
"""

import os
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional, Set
import re
from collections import Counter, defaultdict

BASE_PATH = r"C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

class DataQualityAnalyzer:
    def __init__(self):
        self.base_path = Path(BASE_PATH)
        self.data_path = self.base_path / "data" / "structured"
        self.analysis_report = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "version": "Q2-2025-DATA-QUALITY",
                "analyzer": "Claude Code Assistant"
            },
            "file_analysis": {},
            "schema_validation": {},
            "unified_dataset": {},
            "quality_metrics": {},
            "fine_tuning_readiness": {}
        }

    def validate_json_schema(self, data: Any, filename: str) -> Dict[str, Any]:
        """Validar schema dos arquivos JSON"""
        validation = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "schema_type": "unknown",
            "required_fields": [],
            "missing_fields": [],
            "data_types": {}
        }

        try:
            if isinstance(data, dict):
                validation["schema_type"] = "dictionary"
                # Para dicionários, verificar se é um mapeamento de chaves para objetos
                if data:
                    sample_value = next(iter(data.values()))
                    if isinstance(sample_value, dict):
                        validation["schema_type"] = "key_value_mapping"
                        validation["data_types"]["value_type"] = "object"
                    elif isinstance(sample_value, list):
                        validation["schema_type"] = "key_array_mapping"
                        validation["data_types"]["value_type"] = "array"
                    else:
                        validation["data_types"]["value_type"] = type(sample_value).__name__

            elif isinstance(data, list):
                validation["schema_type"] = "array"
                if data:
                    sample_item = data[0]
                    validation["data_types"]["item_type"] = type(sample_item).__name__
                    
                    if isinstance(sample_item, dict):
                        # Analisar campos obrigatórios baseado no nome do arquivo
                        required_fields = self._get_required_fields(filename)
                        validation["required_fields"] = required_fields
                        
                        # Verificar campos em todos os items
                        all_fields = set()
                        for item in data:
                            if isinstance(item, dict):
                                all_fields.update(item.keys())
                        
                        validation["data_types"]["available_fields"] = list(all_fields)
                        
                        # Verificar campos faltantes
                        for item in data:
                            if isinstance(item, dict):
                                missing = [field for field in required_fields if field not in item]
                                if missing:
                                    validation["missing_fields"].extend(missing)

            # Verificar consistência de tipos
            type_consistency = self._check_type_consistency(data)
            validation["type_consistency"] = type_consistency

        except Exception as e:
            validation["valid"] = False
            validation["errors"].append(f"Schema validation error: {str(e)}")

        return validation

    def _get_required_fields(self, filename: str) -> List[str]:
        """Definir campos obrigatórios baseado no tipo de arquivo"""
        field_mappings = {
            "clinical_taxonomy.json": ["name", "category", "description"],
            "dispensing_workflow.json": ["step", "action", "responsible"],
            "dosing_protocols.json": ["medication", "dosage", "frequency"],
            "frequently_asked_questions.json": ["question", "answer", "category"],
            "hanseniase_catalog.json": ["item", "description", "category"],
            "knowledge_scope_limitations.json": ["scope", "limitation", "recommendation"],
            "medications_mechanisms.json": ["medication", "mechanism", "indication"],
            "pharmacovigilance_guidelines.json": ["guideline", "description", "severity"],
            "quick_reference_protocols.json": ["protocol", "steps", "indication"]
        }
        return field_mappings.get(filename, ["id", "content", "category"])

    def _check_type_consistency(self, data: Any) -> Dict[str, Any]:
        """Verificar consistência de tipos de dados"""
        consistency = {
            "consistent": True,
            "type_errors": [],
            "field_type_map": {}
        }

        if isinstance(data, list) and data:
            # Para arrays, verificar se todos os items têm o mesmo schema
            if all(isinstance(item, dict) for item in data):
                field_types = defaultdict(set)
                
                for item in data:
                    for field, value in item.items():
                        field_types[field].add(type(value).__name__)
                
                # Verificar se algum campo tem tipos inconsistentes
                for field, types in field_types.items():
                    consistency["field_type_map"][field] = list(types)
                    if len(types) > 1:
                        consistency["consistent"] = False
                        consistency["type_errors"].append(f"Field '{field}' has inconsistent types: {types}")

        return consistency

    def analyze_data_quality(self, data: Any, filename: str) -> Dict[str, Any]:
        """Analisar qualidade dos dados"""
        quality = {
            "completeness_score": 0,
            "consistency_score": 0,
            "uniqueness_score": 0,
            "validity_score": 0,
            "overall_score": 0,
            "issues": [],
            "stats": {}
        }

        try:
            if isinstance(data, list):
                total_items = len(data)
                quality["stats"]["total_items"] = total_items
                
                if total_items > 0:
                    # Análise de completude
                    complete_items = 0
                    duplicate_items = 0
                    seen_items = set()
                    
                    for item in data:
                        if isinstance(item, dict):
                            # Verificar completude (campos não vazios)
                            non_empty_fields = sum(1 for v in item.values() if v and str(v).strip())
                            if non_empty_fields == len(item):
                                complete_items += 1
                            
                            # Verificar duplicatas (baseado no conteúdo)
                            # SECURITY FIX: Usar SHA256 em vez de MD5 (CWE-916)
                            item_hash = hashlib.sha256(json.dumps(item, sort_keys=True).encode()).hexdigest()
                            if item_hash in seen_items:
                                duplicate_items += 1
                            seen_items.add(item_hash)
                    
                    # Calcular scores
                    quality["completeness_score"] = (complete_items / total_items) * 100
                    quality["uniqueness_score"] = ((total_items - duplicate_items) / total_items) * 100
                    
                    # Score de consistência baseado na validação de schema
                    schema_validation = self.validate_json_schema(data, filename)
                    quality["consistency_score"] = 100 if schema_validation["type_consistency"]["consistent"] else 80
                    
                    # Score de validade (presença de campos obrigatórios)
                    required_fields = self._get_required_fields(filename)
                    valid_items = 0
                    for item in data:
                        if isinstance(item, dict):
                            has_required = all(field in item and item[field] for field in required_fields)
                            if has_required:
                                valid_items += 1
                    
                    quality["validity_score"] = (valid_items / total_items) * 100
                    
                    # Score geral (média ponderada)
                    quality["overall_score"] = (
                        quality["completeness_score"] * 0.3 +
                        quality["consistency_score"] * 0.2 +
                        quality["uniqueness_score"] * 0.2 +
                        quality["validity_score"] * 0.3
                    )
                    
                    quality["stats"]["complete_items"] = complete_items
                    quality["stats"]["duplicate_items"] = duplicate_items
                    quality["stats"]["valid_items"] = valid_items

            elif isinstance(data, dict):
                # Para dicionários, análise diferente
                total_keys = len(data)
                non_empty_values = sum(1 for v in data.values() if v)
                
                quality["completeness_score"] = (non_empty_values / total_keys) * 100 if total_keys > 0 else 0
                quality["consistency_score"] = 100  # Assumir consistente para dicionários simples
                quality["uniqueness_score"] = 100    # Chaves são únicas por definição
                quality["validity_score"] = 100      # Assumir válido se bem formado
                quality["overall_score"] = quality["completeness_score"]
                
                quality["stats"]["total_keys"] = total_keys
                quality["stats"]["non_empty_values"] = non_empty_values

        except Exception as e:
            quality["issues"].append(f"Error analyzing data quality: {str(e)}")
            quality["overall_score"] = 0

        return quality

    def extract_training_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de treinamento dos dados com suporte para estruturas hierárquicas"""
        examples = []
        
        try:
            if filename == "frequently_asked_questions.json":
                # FAQ: estrutura hierárquica com categorias e perguntas/respostas para cada persona
                examples.extend(self._extract_faq_examples(data, filename, source_category))
                            
            elif filename == "dosing_protocols.json":
                # Protocolos de dose: estrutura hierárquica com populações e esquemas
                examples.extend(self._extract_dosing_examples(data, filename, source_category))
                            
            elif filename == "clinical_taxonomy.json":
                # Taxonomia clínica: estrutura hierárquica de termos e definições
                examples.extend(self._extract_taxonomy_examples(data, filename, source_category))
                            
            elif filename == "medications_mechanisms.json":
                # Mecanismos de medicamentos
                examples.extend(self._extract_mechanism_examples(data, filename, source_category))

            elif filename == "hanseniase_catalog.json":
                # Catálogo de informações sobre hanseníase
                examples.extend(self._extract_catalog_examples(data, filename, source_category))

            elif filename == "dispensing_workflow.json":
                # Fluxo de dispensação
                examples.extend(self._extract_workflow_examples(data, filename, source_category))

            elif filename == "pharmacovigilance_guidelines.json":
                # Diretrizes de farmacovigilância
                examples.extend(self._extract_pharmacovigilance_examples(data, filename, source_category))

            elif filename == "knowledge_scope_limitations.json":
                # Limitações de escopo
                examples.extend(self._extract_scope_examples(data, filename, source_category))

            elif filename == "quick_reference_protocols.json":
                # Protocolos de referência rápida
                examples.extend(self._extract_reference_examples(data, filename, source_category))
            
        except Exception as e:
            print(f"Error extracting training examples from {filename}: {str(e)}")
            
        return examples

    def _extract_faq_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de FAQ com estrutura hierárquica"""
        examples = []
        
        if isinstance(data, dict) and "faq_hanseniase_pqtu" in data:
            faq_data = data["faq_hanseniase_pqtu"]
            
            # Processar cada categoria de FAQ
            for category_key, category_data in faq_data.items():
                if isinstance(category_data, dict) and category_key not in ["metadata", "search_optimization", "limitacoes_conhecimento"]:
                    
                    for question_key, question_data in category_data.items():
                        if isinstance(question_data, dict) and "question" in question_data:
                            
                            # Exemplo para Dr. Gasnelio (resposta técnica)
                            if "gasnelio_answer" in question_data:
                                examples.append({
                                    "instruction": "Como Dr. Gasnelio, responda tecnicamente:",
                                    "input": question_data["question"],
                                    "output": question_data["gasnelio_answer"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "dr_gasnelio",
                                    "subcategory": category_key
                                })
                            
                            # Exemplo para Gá (resposta empática/simples)
                            if "ga_answer" in question_data:
                                examples.append({
                                    "instruction": "Como Gá, responda de forma simples e empática:",
                                    "input": question_data["question"],
                                    "output": question_data["ga_answer"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "ga_empathetic",
                                    "subcategory": category_key
                                })
        
        return examples

    def _extract_dosing_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de protocolos de dosagem"""
        examples = []
        
        if isinstance(data, dict) and "dosing_protocols" in data:
            protocols = data["dosing_protocols"]
            
            for protocol_key, protocol_data in protocols.items():
                if isinstance(protocol_data, dict) and "population" in protocol_data:
                    population = protocol_data["population"]
                    
                    # Extrair informações de dosagem supervisionada
                    if "dosing_schedule" in protocol_data and "monthly_supervised" in protocol_data["dosing_schedule"]:
                        supervised = protocol_data["dosing_schedule"]["monthly_supervised"]
                        
                        if "medications" in supervised:
                            for med_name, med_info in supervised["medications"].items():
                                if isinstance(med_info, dict):
                                    dose = med_info.get("dose", "")
                                    admin = med_info.get("administration", "")
                                    
                                    examples.append({
                                        "instruction": f"Explique o protocolo de dosagem supervisionada de {med_name} para {population}:",
                                        "input": "",
                                        "output": f"Dose: {dose}. Administração: {admin}",
                                        "source": filename,
                                        "category": source_category,
                                        "persona_target": "dr_gasnelio"
                                    })
                    
                    # Extrair informações de dosagem diária
                    if "dosing_schedule" in protocol_data and "daily_self_administered" in protocol_data["dosing_schedule"]:
                        daily = protocol_data["dosing_schedule"]["daily_self_administered"]
                        
                        if "medications" in daily:
                            timing = daily.get("timing", "")
                            
                            for med_name, med_info in daily["medications"].items():
                                if isinstance(med_info, dict):
                                    dose = med_info.get("dose", "")
                                    admin = med_info.get("administration", "")
                                    
                                    examples.append({
                                        "instruction": f"Como orientar a dosagem diária de {med_name} para {population}?",
                                        "input": "",
                                        "output": f"Dose diária: {dose}. Horário: {timing}. {admin}",
                                        "source": filename,
                                        "category": source_category,
                                        "persona_target": "both"
                                    })
        
        return examples

    def _extract_taxonomy_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de taxonomia clínica"""
        examples = []
        
        # Processar estrutura hierárquica de taxonomia
        if isinstance(data, dict):
            for main_key, main_value in data.items():
                if isinstance(main_value, dict):
                    for term_key, term_data in main_value.items():
                        if isinstance(term_data, dict):
                            # Se tem descrição direta
                            if "description" in term_data:
                                examples.append({
                                    "instruction": f"Defina o termo médico '{term_key}' no contexto da hanseníase:",
                                    "input": "",
                                    "output": term_data["description"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "both"
                                })
                            # Se tem subcategorias
                            else:
                                for subterm_key, subterm_data in term_data.items():
                                    if isinstance(subterm_data, dict) and "description" in subterm_data:
                                        examples.append({
                                            "instruction": f"Explique '{subterm_key}' relacionado a {term_key}:",
                                            "input": "",
                                            "output": subterm_data["description"],
                                            "source": filename,
                                            "category": source_category,
                                            "persona_target": "both"
                                        })
        
        return examples

    def _extract_mechanism_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de mecanismos de medicamentos"""
        examples = []
        
        if isinstance(data, dict):
            for main_key, main_value in data.items():
                if isinstance(main_value, dict):
                    for med_key, med_data in main_value.items():
                        if isinstance(med_data, dict):
                            if "mechanism" in med_data:
                                examples.append({
                                    "instruction": f"Explique o mecanismo de ação de {med_key}:",
                                    "input": "",
                                    "output": med_data["mechanism"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "dr_gasnelio"
                                })
                            
                            if "indication" in med_data:
                                examples.append({
                                    "instruction": f"Qual a indicação de {med_key} no tratamento da hanseníase?",
                                    "input": "",
                                    "output": med_data["indication"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "both"
                                })
        
        return examples

    def _extract_catalog_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos do catálogo de hanseníase"""
        examples = []
        
        if isinstance(data, dict):
            for main_key, main_value in data.items():
                if isinstance(main_value, dict):
                    for item_key, item_data in main_value.items():
                        if isinstance(item_data, dict):
                            if "description" in item_data:
                                examples.append({
                                    "instruction": f"Explique sobre {item_key} na hanseníase:",
                                    "input": "",
                                    "output": item_data["description"],
                                    "source": filename,
                                    "category": source_category,
                                    "persona_target": "both"
                                })
        
        return examples

    def _extract_workflow_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de fluxo de dispensação"""
        examples = []
        
        if isinstance(data, dict):
            for workflow_key, workflow_data in data.items():
                if isinstance(workflow_data, dict):
                    if "steps" in workflow_data:
                        steps = workflow_data["steps"]
                        if isinstance(steps, list):
                            step_descriptions = [f"Passo {i+1}: {step}" for i, step in enumerate(steps)]
                            examples.append({
                                "instruction": f"Descreva o fluxo de {workflow_key}:",
                                "input": "",
                                "output": ". ".join(step_descriptions),
                                "source": filename,
                                "category": source_category,
                                "persona_target": "both"
                            })
        
        return examples

    def _extract_pharmacovigilance_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de farmacovigilância"""
        examples = []
        
        if isinstance(data, dict):
            for guideline_key, guideline_data in data.items():
                if isinstance(guideline_data, dict):
                    if "description" in guideline_data:
                        examples.append({
                            "instruction": f"Explique a diretriz de farmacovigilância para {guideline_key}:",
                            "input": "",
                            "output": guideline_data["description"],
                            "source": filename,
                            "category": source_category,
                            "persona_target": "dr_gasnelio"
                        })
                    
                    if "severity" in guideline_data:
                        examples.append({
                            "instruction": f"Qual o grau de severidade para {guideline_key}?",
                            "input": "",
                            "output": f"Severidade: {guideline_data['severity']}",
                            "source": filename,
                            "category": source_category,
                            "persona_target": "dr_gasnelio"
                        })
        
        return examples

    def _extract_scope_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de limitações de escopo"""
        examples = []
        
        if isinstance(data, dict):
            for scope_key, scope_data in data.items():
                if isinstance(scope_data, dict):
                    if "limitation" in scope_data and "recommendation" in scope_data:
                        examples.append({
                            "instruction": f"Explique as limitações de {scope_key}:",
                            "input": "",
                            "output": f"Limitação: {scope_data['limitation']}. Recomendação: {scope_data['recommendation']}",
                            "source": filename,
                            "category": source_category,
                            "persona_target": "both"
                        })
        
        return examples

    def _extract_reference_examples(self, data: Any, filename: str, source_category: str) -> List[Dict[str, Any]]:
        """Extrair exemplos de protocolos de referência rápida"""
        examples = []
        
        if isinstance(data, dict):
            for protocol_key, protocol_data in data.items():
                if isinstance(protocol_data, dict):
                    if "steps" in protocol_data and "indication" in protocol_data:
                        steps = protocol_data["steps"]
                        indication = protocol_data["indication"]
                        
                        if isinstance(steps, list):
                            steps_text = ". ".join([f"Passo {i+1}: {step}" for i, step in enumerate(steps)])
                            examples.append({
                                "instruction": f"Descreva o protocolo de referência rápida para {protocol_key}:",
                                "input": "",
                                "output": f"Indicação: {indication}. Passos: {steps_text}",
                                "source": filename,
                                "category": source_category,
                                "persona_target": "both"
                            })
        
        return examples

    def create_unified_dataset(self) -> Dict[str, Any]:
        """Criar dataset unificado para treinamento"""
        print("[DATASET] Criando dataset unificado...")
        
        unified = {
            "training_examples": [],
            "statistics": {
                "total_examples": 0,
                "examples_by_source": {},
                "examples_by_category": {},
                "examples_by_persona": {},
                "persona_distribution": {}
            },
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "format": "instruction_input_output",
                "description": "Unified dataset for hanseniase fine-tuning"
            }
        }

        # Categorias dos arquivos
        file_categories = {
            "frequently_asked_questions.json": "qa",
            "dosing_protocols.json": "protocols",
            "clinical_taxonomy.json": "taxonomy",
            "medications_mechanisms.json": "pharmacology",
            "dispensing_workflow.json": "procedures",
            "hanseniase_catalog.json": "catalog",
            "pharmacovigilance_guidelines.json": "safety",
            "knowledge_scope_limitations.json": "scope",
            "quick_reference_protocols.json": "reference"
        }

        # Processar cada arquivo JSON
        json_files = list(self.data_path.glob("*.json"))
        
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                category = file_categories.get(json_file.name, "general")
                examples = self.extract_training_examples(data, json_file.name, category)
                
                unified["training_examples"].extend(examples)
                unified["statistics"]["examples_by_source"][json_file.name] = len(examples)
                
                print(f"Extracted {len(examples)} examples from {json_file.name}")
                
            except Exception as e:
                print(f"Error processing {json_file.name}: {str(e)}")

        # Calcular estatísticas
        total_examples = len(unified["training_examples"])
        unified["statistics"]["total_examples"] = total_examples
        
        # Distribuição por categoria
        category_count = Counter(ex["category"] for ex in unified["training_examples"])
        unified["statistics"]["examples_by_category"] = dict(category_count)
        
        # Distribuição por persona
        persona_count = Counter(ex["persona_target"] for ex in unified["training_examples"])
        unified["statistics"]["examples_by_persona"] = dict(persona_count)
        
        # Percentuais de distribuição
        if total_examples > 0:
            unified["statistics"]["persona_distribution"] = {
                persona: (count / total_examples) * 100 
                for persona, count in persona_count.items()
            }

        return unified

    def perform_data_augmentation(self, examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Realizar data augmentation básico"""
        print("[AUGMENTATION] Realizando data augmentation...")
        
        augmented = []
        
        for example in examples:
            # Adicionar o exemplo original
            augmented.append(example)
            
            # Variações da instrução
            original_instruction = example["instruction"]
            
            # Variações simples de formulação
            instruction_variants = []
            
            if "explique" in original_instruction.lower():
                variant = original_instruction.replace("Explique", "Descreva")
                instruction_variants.append(variant)
                
            if "o que é" in original_instruction.lower():
                variant = original_instruction.replace("o que é", "qual é a definição de")
                instruction_variants.append(variant)
                
            # Adicionar variações (limitado para não inflar muito o dataset)
            for variant in instruction_variants[:1]:  # Máximo 1 variação por exemplo
                augmented_example = example.copy()
                augmented_example["instruction"] = variant
                augmented_example["augmented"] = True
                augmented.append(augmented_example)
        
        print(f"Data augmentation: {len(examples)} -> {len(augmented)} examples")
        return augmented

    def split_dataset(self, examples: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Dividir dataset em train/validation/test (80/10/10)"""
        print("[SPLIT] Dividindo dataset...")
        
        import random
        random.seed(42)  # Para reprodutibilidade
        
        # Shuffle dos exemplos
        shuffled = examples.copy()
        random.shuffle(shuffled)
        
        total = len(shuffled)
        train_size = int(0.8 * total)
        val_size = int(0.1 * total)
        
        splits = {
            "train": shuffled[:train_size],
            "validation": shuffled[train_size:train_size + val_size],
            "test": shuffled[train_size + val_size:]
        }
        
        print(f"Dataset split: train={len(splits['train'])}, val={len(splits['validation'])}, test={len(splits['test'])}")
        
        return splits

    def calculate_fine_tuning_readiness(self, unified_dataset: Dict) -> Dict[str, Any]:
        """Calcular score de prontidão para fine-tuning"""
        readiness = {
            "overall_score": 0,
            "criteria_scores": {},
            "recommendations": [],
            "blocking_issues": []
        }

        # Critérios de avaliação
        total_examples = unified_dataset["statistics"]["total_examples"]
        
        # 1. Quantidade de dados (peso: 30%)
        if total_examples >= 1000:
            quantity_score = 100
        elif total_examples >= 500:
            quantity_score = 80
        elif total_examples >= 100:
            quantity_score = 60
        else:
            quantity_score = 30
            readiness["blocking_issues"].append(f"Insufficient data: {total_examples} examples (recommend 500+)")
        
        readiness["criteria_scores"]["data_quantity"] = quantity_score
        
        # 2. Diversidade de categorias (peso: 20%)
        categories = len(unified_dataset["statistics"]["examples_by_category"])
        if categories >= 5:
            diversity_score = 100
        elif categories >= 3:
            diversity_score = 80
        else:
            diversity_score = 50
        
        readiness["criteria_scores"]["category_diversity"] = diversity_score
        
        # 3. Distribuição de personas (peso: 20%)
        persona_dist = unified_dataset["statistics"]["persona_distribution"]
        if "both" in persona_dist and persona_dist["both"] > 30:
            persona_score = 100
        elif len(persona_dist) >= 2:
            persona_score = 80
        else:
            persona_score = 60
        
        readiness["criteria_scores"]["persona_balance"] = persona_score
        
        # 4. Qualidade dos dados (peso: 30%)
        # Baseado na análise de qualidade individual dos arquivos
        quality_scores = []
        for file_analysis in self.analysis_report["file_analysis"].values():
            if "quality" in file_analysis:
                quality_scores.append(file_analysis["quality"]["overall_score"])
        
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        readiness["criteria_scores"]["data_quality"] = avg_quality
        
        # Score geral (média ponderada)
        readiness["overall_score"] = (
            quantity_score * 0.3 +
            diversity_score * 0.2 +
            persona_score * 0.2 +
            avg_quality * 0.3
        )
        
        # Recomendações baseadas nos scores
        if quantity_score < 80:
            readiness["recommendations"].append("Increase dataset size through data augmentation or additional sources")
        
        if diversity_score < 80:
            readiness["recommendations"].append("Add more diverse content categories")
        
        if persona_score < 80:
            readiness["recommendations"].append("Balance examples between personas")
        
        if avg_quality < 80:
            readiness["recommendations"].append("Improve data quality and completeness")

        return readiness

    def execute_quality_analysis(self) -> Dict[str, Any]:
        """Executar análise completa de qualidade dos dados"""
        print("=== INICIANDO ANÁLISE DE QUALIDADE DOS DADOS ===")
        
        start_time = time.time()
        
        # 1. Analisar cada arquivo JSON
        json_files = list(self.data_path.glob("*.json"))
        
        for json_file in json_files:
            print(f"[ANALYSIS] Analisando {json_file.name}...")
            
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Validação de schema
                schema_validation = self.validate_json_schema(data, json_file.name)
                
                # Análise de qualidade
                quality_analysis = self.analyze_data_quality(data, json_file.name)
                
                # Calcular estatísticas básicas
                stats = {
                    "file_size_kb": json_file.stat().st_size / 1024,
                    "estimated_tokens": len(json.dumps(data)) // 4,
                    "last_modified": datetime.fromtimestamp(json_file.stat().st_mtime).isoformat()
                }
                
                self.analysis_report["file_analysis"][json_file.name] = {
                    "schema_validation": schema_validation,
                    "quality": quality_analysis,
                    "statistics": stats
                }
                
            except Exception as e:
                self.analysis_report["file_analysis"][json_file.name] = {
                    "error": str(e)
                }
                print(f"Error analyzing {json_file.name}: {str(e)}")
        
        # 2. Criar dataset unificado
        unified_dataset = self.create_unified_dataset()
        
        # 3. Data augmentation
        if unified_dataset["training_examples"]:
            augmented_examples = self.perform_data_augmentation(unified_dataset["training_examples"])
            
            # 4. Dividir dataset
            dataset_splits = self.split_dataset(augmented_examples)
            
            unified_dataset["splits"] = dataset_splits
            unified_dataset["augmented_total"] = len(augmented_examples)
        
        self.analysis_report["unified_dataset"] = unified_dataset
        
        # 5. Calcular métricas de qualidade geral
        quality_scores = []
        for file_analysis in self.analysis_report["file_analysis"].values():
            if "quality" in file_analysis and "overall_score" in file_analysis["quality"]:
                quality_scores.append(file_analysis["quality"]["overall_score"])
        
        self.analysis_report["quality_metrics"] = {
            "average_quality_score": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            "files_with_issues": sum(1 for fa in self.analysis_report["file_analysis"].values() if "error" in fa),
            "total_files_analyzed": len(self.analysis_report["file_analysis"])
        }
        
        # 6. Calcular prontidão para fine-tuning
        fine_tuning_readiness = self.calculate_fine_tuning_readiness(unified_dataset)
        self.analysis_report["fine_tuning_readiness"] = fine_tuning_readiness
        
        # Finalizar
        end_time = time.time()
        self.analysis_report["metadata"]["duration_seconds"] = round(end_time - start_time, 2)
        self.analysis_report["metadata"]["completion_time"] = datetime.now().isoformat()
        
        print(f"=== ANÁLISE FINALIZADA EM {self.analysis_report['metadata']['duration_seconds']}s ===")
        
        return self.analysis_report

    def export_training_data(self) -> None:
        """Exportar dados de treinamento em formato adequado"""
        if "unified_dataset" not in self.analysis_report:
            print("No unified dataset found. Run analysis first.")
            return
        
        unified_dataset = self.analysis_report["unified_dataset"]
        
        # Exportar dataset completo
        output_path = self.base_path / "training_data.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(unified_dataset, f, indent=2, ensure_ascii=False)
        
        print(f"Training data exported to: {output_path}")
        
        # Exportar splits separadamente se existirem
        if "splits" in unified_dataset:
            splits_dir = self.base_path / "training_splits"
            splits_dir.mkdir(exist_ok=True)
            
            for split_name, split_data in unified_dataset["splits"].items():
                split_path = splits_dir / f"{split_name}.json"
                with open(split_path, 'w', encoding='utf-8') as f:
                    json.dump(split_data, f, indent=2, ensure_ascii=False)
                print(f"{split_name} split exported to: {split_path}")

def generate_quality_report_markdown(analysis_report: Dict[str, Any]) -> str:
    """Gerar relatório de qualidade em Markdown"""
    
    md_content = f"""# Data Quality Analysis Report - Q2 2025

## Executive Summary

**Analysis completed:** {analysis_report['metadata']['completion_time']}  
**Duration:** {analysis_report['metadata']['duration_seconds']}s  
**Files analyzed:** {analysis_report['quality_metrics']['total_files_analyzed']}  
**Average quality score:** {analysis_report['quality_metrics']['average_quality_score']:.1f}/100  

## Fine-tuning Readiness

**Overall Readiness Score:** {analysis_report['fine_tuning_readiness']['overall_score']:.1f}/100  

### Criteria Scores
"""
    
    criteria = analysis_report['fine_tuning_readiness']['criteria_scores']
    for criterion, score in criteria.items():
        md_content += f"- **{criterion.replace('_', ' ').title()}:** {score:.1f}/100\n"
    
    md_content += f"""
### Dataset Statistics

**Total Examples:** {analysis_report['unified_dataset']['statistics']['total_examples']}  
**Augmented Total:** {analysis_report['unified_dataset'].get('augmented_total', 'N/A')}  

#### Examples by Category
"""
    
    categories = analysis_report['unified_dataset']['statistics']['examples_by_category']
    for category, count in categories.items():
        md_content += f"- **{category}:** {count}\n"
    
    md_content += f"""
#### Persona Distribution
"""
    
    personas = analysis_report['unified_dataset']['statistics']['persona_distribution']
    for persona, percentage in personas.items():
        md_content += f"- **{persona}:** {percentage:.1f}%\n"
    
    md_content += f"""
## File Quality Analysis

"""
    
    for filename, analysis in analysis_report['file_analysis'].items():
        if "quality" in analysis:
            quality = analysis["quality"]
            status = "[OK]" if quality["overall_score"] > 70 else "[ATTENTION]"
            md_content += f"### {status} {filename}\n"
            md_content += f"**Overall Score:** {quality['overall_score']:.1f}/100  \n"
            md_content += f"**Completeness:** {quality['completeness_score']:.1f}%  \n"
            md_content += f"**Consistency:** {quality['consistency_score']:.1f}%  \n"
            md_content += f"**Uniqueness:** {quality['uniqueness_score']:.1f}%  \n"
            md_content += f"**Validity:** {quality['validity_score']:.1f}%  \n\n"
    
    md_content += f"""
## Recommendations

"""
    
    recommendations = analysis_report['fine_tuning_readiness']['recommendations']
    for i, rec in enumerate(recommendations, 1):
        md_content += f"{i}. {rec}\n"
    
    blocking_issues = analysis_report['fine_tuning_readiness']['blocking_issues']
    if blocking_issues:
        md_content += f"""
## Blocking Issues

"""
        for issue in blocking_issues:
            md_content += f"- [CRITICAL] {issue}\n"
    
    md_content += f"""
---

**Report generated by:** {analysis_report['metadata']['analyzer']}  
**Analysis version:** {analysis_report['metadata']['version']}  
"""
    
    return md_content

# Executar análise se executado diretamente
if __name__ == "__main__":
    analyzer = DataQualityAnalyzer()
    analysis_report = analyzer.execute_quality_analysis()
    
    # Exportar dados de treinamento
    analyzer.export_training_data()
    
    # Salvar relatório
    output_dir = Path(BASE_PATH)
    
    # Relatório JSON
    json_path = output_dir / 'data_quality_report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_report, f, indent=2, ensure_ascii=False)
    print(f"Quality report JSON saved: {json_path}")
    
    # Relatório Markdown
    md_path = output_dir / 'data_quality_report.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(generate_quality_report_markdown(analysis_report))
    print(f"Quality report Markdown saved: {md_path}")
    
    print("\n=== DATA QUALITY ANALYSIS COMPLETED ===")
    print("Next steps:")
    print("1. Review quality report")
    print("2. Address any blocking issues")
    print("3. Proceed to Colab notebook preparation (Phase 2)")