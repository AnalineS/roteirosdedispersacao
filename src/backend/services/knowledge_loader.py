"""
SISTEMA DE CARREGAMENTO DE BASE DE CONHECIMENTO ESTRUTURADA
Integra dados JSON estruturados para melhorar respostas do sistema
"""

import json
import os
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class StructuredKnowledgeBase:
    """Carregador e consulta de base de conhecimento estruturada"""
    
    def __init__(self, data_path: str = "../../data/structured"):
        self.data_path = data_path
        self.knowledge_base = {}
        self.load_all_data()
    
    def load_all_data(self):
        """Carrega todos os arquivos JSON da base estruturada"""
        try:
            # Mapear arquivos para suas estruturas
            file_mappings = {
                'clinical_taxonomy.json': 'clinical_taxonomy',
                'dispensing_workflow.json': 'dispensing_workflow', 
                'dosing_protocols.json': 'dosing_protocols',
                'frequently_asked_questions.json': 'faq',
                'hanseniase_catalog.json': 'hanseniase_catalog',
                'knowledge_scope_limitations.json': 'scope_limitations',
                'medications_mechanisms.json': 'medications',
                'pharmacovigilance_guidelines.json': 'pharmacovigilance',
                'quick_reference_protocols.json': 'quick_reference'
            }
            
            loaded_count = 0
            for filename, key in file_mappings.items():
                file_path = os.path.join(self.data_path, filename)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        self.knowledge_base[key] = data
                        loaded_count += 1
                        logger.info(f"✅ Carregado: {filename}")
                except FileNotFoundError:
                    logger.warning(f"⚠️ Arquivo não encontrado: {filename}")
                    self.knowledge_base[key] = {}
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Erro JSON em {filename}: {e}")
                    self.knowledge_base[key] = {}
                except Exception as e:
                    logger.error(f"❌ Erro ao carregar {filename}: {e}")
                    self.knowledge_base[key] = {}
            
            logger.info(f"📊 Base estruturada carregada: {loaded_count}/{len(file_mappings)} arquivos")
            
        except Exception as e:
            logger.error(f"❌ Erro crítico ao carregar base estruturada: {e}")
            self.knowledge_base = {}
    
    def get_medication_info(self, medication_name: str) -> Dict[str, Any]:
        """Obtém informações detalhadas sobre um medicamento"""
        medications = self.knowledge_base.get('medications', {})
        
        # Busca case-insensitive
        medication_name_lower = medication_name.lower()
        for med_key, med_data in medications.items():
            if medication_name_lower in med_key.lower():
                return med_data
        
        return {}
    
    def get_dosing_protocol(self, age_group: str = "adult", weight_range: str = None) -> Dict[str, Any]:
        """Obtém protocolo de dosagem específico"""
        protocols = self.knowledge_base.get('dosing_protocols', {})
        
        # Buscar por grupo etário
        if age_group in protocols:
            age_protocols = protocols[age_group]
            
            # Se especificado peso, buscar faixa específica
            if weight_range and isinstance(age_protocols, dict):
                for weight_key, dosing_data in age_protocols.items():
                    if weight_range.lower() in weight_key.lower():
                        return dosing_data
                        
            return age_protocols
        
        return {}
    
    def search_faq(self, question: str) -> List[Dict[str, Any]]:
        """Busca FAQs relacionadas à pergunta"""
        faq_data = self.knowledge_base.get('faq', {})
        
        if not isinstance(faq_data, dict):
            return []
        
        matches = []
        question_lower = question.lower()
        
        # Buscar em categorias
        for category, items in faq_data.items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict):
                        # Buscar na pergunta e resposta
                        item_question = item.get('question', '').lower()
                        item_answer = item.get('answer', '').lower()
                        
                        # Calcular relevância simples
                        question_words = set(question_lower.split())
                        item_words = set(item_question.split() + item_answer.split())
                        
                        common_words = question_words.intersection(item_words)
                        if common_words:
                            relevance = len(common_words) / len(question_words)
                            matches.append({
                                'category': category,
                                'question': item.get('question', ''),
                                'answer': item.get('answer', ''),
                                'relevance': relevance
                            })
        
        # Ordenar por relevância
        matches.sort(key=lambda x: x['relevance'], reverse=True)
        return matches[:3]  # Top 3 matches
    
    def get_dispensing_workflow_step(self, step_name: str) -> Dict[str, Any]:
        """Obtém passo específico do workflow de dispensação"""
        workflow = self.knowledge_base.get('dispensing_workflow', {})
        
        # Busca flexível por nome do passo
        step_name_lower = step_name.lower()
        for step_key, step_data in workflow.items():
            if step_name_lower in step_key.lower():
                return step_data
        
        return {}
    
    def get_adverse_effects(self, medication: str) -> Dict[str, Any]:
        """Obtém efeitos adversos de medicamento específico"""
        pharma_data = self.knowledge_base.get('pharmacovigilance', {})
        
        medication_lower = medication.lower()
        
        # Buscar em dados de farmacovigilância
        if 'adverse_effects' in pharma_data:
            adverse_effects = pharma_data['adverse_effects']
            
            for med_key, effects_data in adverse_effects.items():
                if medication_lower in med_key.lower():
                    return effects_data
        
        return {}
    
    def get_quick_reference(self, topic: str) -> Dict[str, Any]:
        """Obtém referência rápida para tópico específico"""
        quick_ref = self.knowledge_base.get('quick_reference', {})
        
        topic_lower = topic.lower()
        for ref_key, ref_data in quick_ref.items():
            if topic_lower in ref_key.lower():
                return ref_data
        
        return {}
    
    def enhance_context_with_structured_data(self, question: str, base_context: str) -> str:
        """Enriquece contexto básico com dados estruturados relevantes"""
        enhanced_context = base_context
        
        # Detectar tópicos na pergunta
        question_lower = question.lower()
        
        # Se pergunta sobre medicamentos específicos
        medications = ['rifampicina', 'dapsona', 'clofazimina']
        for med in medications:
            if med in question_lower:
                med_info = self.get_medication_info(med)
                if med_info:
                    enhanced_context += f"\n\n=== INFORMAÇÕES ESTRUTURADAS - {med.upper()} ===\n"
                    if 'mechanism' in med_info:
                        enhanced_context += f"Mecanismo: {med_info['mechanism']}\n"
                    if 'dosing' in med_info:
                        enhanced_context += f"Dosagem: {med_info['dosing']}\n"
                    if 'adverse_effects' in med_info:
                        enhanced_context += f"Efeitos adversos: {med_info['adverse_effects']}\n"
        
        # Se pergunta sobre dosagem
        if any(word in question_lower for word in ['dose', 'dosagem', 'mg', 'quantidade']):
            dosing_info = self.get_dosing_protocol()
            if dosing_info:
                enhanced_context += f"\n\n=== PROTOCOLOS DE DOSAGEM ===\n{str(dosing_info)[:300]}...\n"
        
        # Buscar FAQs relevantes
        relevant_faqs = self.search_faq(question)
        if relevant_faqs:
            enhanced_context += "\n\n=== PERGUNTAS FREQUENTES RELACIONADAS ===\n"
            for faq in relevant_faqs[:2]:  # Top 2 FAQs
                enhanced_context += f"P: {faq['question']}\nR: {faq['answer'][:200]}...\n\n"
        
        return enhanced_context
    
    def get_scope_limitations(self) -> Dict[str, Any]:
        """Obtém limitações de escopo do sistema"""
        return self.knowledge_base.get('scope_limitations', {})
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtém estatísticas da base de conhecimento"""
        stats = {
            'total_categories': len(self.knowledge_base),
            'loaded_successfully': sum(1 for v in self.knowledge_base.values() if v),
            'categories': list(self.knowledge_base.keys())
        }
        
        # Contar itens específicos
        for category, data in self.knowledge_base.items():
            if isinstance(data, dict):
                stats[f'{category}_items'] = len(data)
            elif isinstance(data, list):
                stats[f'{category}_items'] = len(data)
            else:
                stats[f'{category}_items'] = 1 if data else 0
        
        return stats

# Instância global para uso em toda a aplicação
structured_kb = StructuredKnowledgeBase()

def get_structured_knowledge_base():
    """Retorna instância global da base estruturada"""
    return structured_kb