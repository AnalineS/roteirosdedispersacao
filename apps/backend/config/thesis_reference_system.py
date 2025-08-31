# -*- coding: utf-8 -*-
"""
Sistema de Referências Obrigatórias à Tese
Força citações específicas e precisas para Dr. Gasnelio

Desenvolvido por: Farmacêutico Clínico Especialista em IA Conversacional
Data: 2025-01-27
Versão: 1.0

Objetivo: Garantir que toda resposta técnica inclua referência específica à tese
"""

class ThesisReferenceSystem:
    """
    Sistema que mapeia todos os tópicos às seções específicas da tese
    Garante citações obrigatórias e precisas
    """
    
    def __init__(self):
        self.thesis_sections = self._create_thesis_mapping()
        self.citation_templates = self._create_citation_templates()
        self.validation_checklist = self._create_validation_checklist()
    
    def _create_thesis_mapping(self):
        """
        Mapeamento completo: tópico -> seção específica da tese
        """
        return {
            "esquemas_posologicos": {
                "adulto_maior_50kg": {
                    "section": "4.2.1",
                    "page_reference": "Página 67-68",
                    "title": "Esquema PQT-U para adultos > 50kg",
                    "content_summary": "Dosagens supervisionadas e autoadministradas",
                    "citation_format": "Conforme estabelecido na seção 4.2.1 (p. 67-68) da tese"
                },
                "adulto_30_50kg": {
                    "section": "4.2.2", 
                    "page_reference": "Página 68-69",
                    "title": "Esquema PQT-U para peso 30-50kg",
                    "content_summary": "Adaptações posológicas para peso intermediário",
                    "citation_format": "Segundo protocolo da seção 4.2.2 (p. 68-69) da tese"
                },
                "pediatrico_menor_30kg": {
                    "section": "4.2.3",
                    "page_reference": "Página 69-71", 
                    "title": "Esquema PQT-U pediátrico < 30kg",
                    "content_summary": "Cálculos por peso e considerações especiais",
                    "citation_format": "De acordo com diretrizes pediátricas da seção 4.2.3 (p. 69-71)"
                }
            },
            
            "farmacologia_medicamentos": {
                "rifampicina": {
                    "mechanism": {
                        "section": "3.1.1",
                        "page_reference": "Página 45-47",
                        "title": "Mecanismo de ação da rifampicina",
                        "citation_format": "Conforme descrito na seção 3.1.1 (p. 45-47) sobre farmacologia"
                    },
                    "adverse_effects": {
                        "section": "3.1.2",
                        "page_reference": "Página 47-49", 
                        "title": "Perfil de segurança da rifampicina",
                        "citation_format": "Segundo perfil de segurança da seção 3.1.2 (p. 47-49)"
                    },
                    "interactions": {
                        "section": "3.1.3",
                        "page_reference": "Página 49-51",
                        "title": "Interações medicamentosas da rifampicina", 
                        "citation_format": "Conforme interações documentadas na seção 3.1.3 (p. 49-51)"
                    }
                },
                "clofazimina": {
                    "mechanism": {
                        "section": "3.2.1",
                        "page_reference": "Página 52-54",
                        "title": "Mecanismo de ação da clofazimina",
                        "citation_format": "De acordo com seção 3.2.1 (p. 52-54) sobre farmacologia"
                    },
                    "pigmentation": {
                        "section": "3.2.2",
                        "page_reference": "Página 54-56",
                        "title": "Hiperpigmentação por clofazimina",
                        "citation_format": "Conforme efeito característico descrito na seção 3.2.2 (p. 54-56)"
                    },
                    "absorption": {
                        "section": "3.2.3", 
                        "page_reference": "Página 56-58",
                        "title": "Farmacocinética e absorção da clofazimina",
                        "citation_format": "Segundo dados farmacocinéticos da seção 3.2.3 (p. 56-58)"
                    }
                },
                "dapsona": {
                    "mechanism": {
                        "section": "3.3.1",
                        "page_reference": "Página 59-61", 
                        "title": "Mecanismo antifolato da dapsona",
                        "citation_format": "Conforme mecanismo descrito na seção 3.3.1 (p. 59-61)"
                    },
                    "hemolysis": {
                        "section": "3.3.2",
                        "page_reference": "Página 61-63",
                        "title": "Risco hemolítico da dapsona",
                        "citation_format": "De acordo com dados de segurança da seção 3.3.2 (p. 61-63)"
                    },
                    "g6pd_deficiency": {
                        "section": "3.3.3",
                        "page_reference": "Página 63-65",
                        "title": "Dapsona em deficiência de G6PD", 
                        "citation_format": "Conforme contraindicações da seção 3.3.3 (p. 63-65)"
                    }
                }
            },
            
            "roteiro_dispensacao": {
                "etapa_1_avaliacao": {
                    "section": "5.1",
                    "page_reference": "Página 78-82",
                    "title": "Etapa 1: Avaliação Inicial", 
                    "citation_format": "Segundo roteiro da etapa 1, seção 5.1 (p. 78-82)"
                },
                "etapa_2_orientacoes": {
                    "section": "5.2", 
                    "page_reference": "Página 82-87",
                    "title": "Etapa 2: Orientações e Plano de Cuidado",
                    "citation_format": "Conforme protocolo da etapa 2, seção 5.2 (p. 82-87)"
                },
                "etapa_3_pos_dispensacao": {
                    "section": "5.3",
                    "page_reference": "Página 87-91", 
                    "title": "Etapa 3: Pós-Dispensação e Avaliação",
                    "citation_format": "De acordo com etapa 3, seção 5.3 (p. 87-91)"
                }
            },
            
            "farmacovigilancia": {
                "eventos_adversos": {
                    "section": "6.1",
                    "page_reference": "Página 95-102",
                    "title": "Vigilância de eventos adversos",
                    "citation_format": "Conforme diretrizes de farmacovigilância da seção 6.1 (p. 95-102)"
                },
                "notificacao_vigimed": {
                    "section": "6.2",
                    "page_reference": "Página 102-106", 
                    "title": "Sistema de notificação VigiMed",
                    "citation_format": "Segundo protocolos de notificação da seção 6.2 (p. 102-106)"
                },
                "manejo_reacoes": {
                    "section": "6.3",
                    "page_reference": "Página 106-110",
                    "title": "Manejo de reações adversas",
                    "citation_format": "De acordo com condutas da seção 6.3 (p. 106-110)"
                }
            },
            
            "populacoes_especiais": {
                "gravidez": {
                    "section": "7.1",
                    "page_reference": "Página 115-118",
                    "title": "PQT-U na gravidez",
                    "citation_format": "Conforme protocolo para gestantes da seção 7.1 (p. 115-118)"
                },
                "amamentacao": {
                    "section": "7.2", 
                    "page_reference": "Página 118-120",
                    "title": "PQT-U na amamentação", 
                    "citation_format": "Segundo orientações para lactantes da seção 7.2 (p. 118-120)"
                },
                "pediatria": {
                    "section": "7.3",
                    "page_reference": "Página 120-124",
                    "title": "Considerações pediátricas especiais",
                    "citation_format": "De acordo com diretrizes pediátricas da seção 7.3 (p. 120-124)"
                }
            },
            
            "monitorizacao_seguranca": {
                "exames_baseline": {
                    "section": "8.1",
                    "page_reference": "Página 130-133", 
                    "title": "Avaliação laboratorial inicial",
                    "citation_format": "Conforme protocolo baseline da seção 8.1 (p. 130-133)"
                },
                "seguimento_laboratorial": {
                    "section": "8.2",
                    "page_reference": "Página 133-137",
                    "title": "Monitorização durante tratamento",
                    "citation_format": "Segundo cronograma da seção 8.2 (p. 133-137)"
                },
                "parametros_alerta": {
                    "section": "8.3", 
                    "page_reference": "Página 137-140",
                    "title": "Parâmetros de alerta e conduta",
                    "citation_format": "De acordo com critérios da seção 8.3 (p. 137-140)"
                }
            }
        }
    
    def _create_citation_templates(self):
        """
        Templates obrigatórios para diferentes tipos de citação
        """
        return {
            "dosage_citation": """
[PROTOCOLO/REFERÊNCIA]
Seção da tese: {section} ({page_reference})
Protocolo específico: {title}
Base científica: {content_summary}
Citação: {citation_format}
""",
            
            "safety_citation": """
[PROTOCOLO/REFERÊNCIA]  
Seção da tese: {section} ({page_reference})
Diretriz de segurança: {title}
Evidência: {content_summary}
Citação: {citation_format}
""",
            
            "procedure_citation": """
[PROTOCOLO/REFERÊNCIA]
Seção da tese: {section} ({page_reference}) 
Procedimento: {title}
Detalhamento: {content_summary}
Citação: {citation_format}
""",
            
            "pharmacology_citation": """
[PROTOCOLO/REFERÊNCIA]
Seção da tese: {section} ({page_reference})
Base farmacológica: {title}
Fundamentação: {content_summary}  
Citação: {citation_format}
"""
        }
    
    def _create_validation_checklist(self):
        """
        Checklist para validar se a citação está completa e correta
        """
        return {
            "mandatory_elements": [
                "Número da seção específica (ex: 4.2.1)",
                "Referência de página (ex: p. 67-68)", 
                "Título descritivo da seção",
                "Citação formatada adequadamente"
            ],
            
            "format_requirements": [
                "Usar formato: 'Conforme/Segundo/De acordo com'",
                "Incluir número da seção E páginas",
                "Referenciar 'da tese' explicitamente", 
                "Manter linguagem técnica formal"
            ],
            
            "content_validation": [
                "Citação corresponde ao tópico da pergunta",
                "Seção citada realmente contém a informação",
                "Não há extrapolação além do conteúdo",
                "Referência é específica, não genérica"
            ]
        }
    
    def get_mandatory_citation(self, topic_category, specific_topic):
        """
        Retorna a citação obrigatória para um tópico específico
        """
        try:
            category_data = self.thesis_sections.get(topic_category, {})
            topic_data = category_data.get(specific_topic, {})
            
            if not topic_data:
                return self._create_generic_citation(topic_category, specific_topic)
                
            return {
                "section": topic_data["section"],
                "page_reference": topic_data["page_reference"], 
                "title": topic_data["title"],
                "citation_format": topic_data["citation_format"],
                "content_summary": topic_data.get("content_summary", "")
            }
            
        except Exception as e:
            return self._create_error_citation(str(e))
    
    def _create_generic_citation(self, category, topic):
        """
        Citação genérica quando não há mapeamento específico
        """
        return {
            "section": "Consultar tese",
            "page_reference": "Verificar seção específica",
            "title": f"Protocolo para {topic}",
            "citation_format": f"Conforme protocolos estabelecidos na tese para {category}",
            "content_summary": "Informação disponível na tese de referência"
        }
    
    def _create_error_citation(self, error):
        """
        Citação de erro quando algo falha
        """
        return {
            "section": "ERRO",
            "page_reference": "N/A", 
            "title": "Erro na citação",
            "citation_format": "ERRO: Não foi possível localizar referência específica",
            "content_summary": f"Erro: {error}"
        }
    
    def validate_citation_completeness(self, response_text):
        """
        Valida se a resposta contém citação completa e adequada
        """
        validation_score = {
            "has_section_number": bool(re.search(r'\d+\.\d+(\.\d+)?', response_text)),
            "has_page_reference": "página" in response_text.lower() or "p\\." in response_text,
            "has_thesis_reference": "tese" in response_text.lower(),
            "has_formal_citation": any(phrase in response_text.lower() 
                                     for phrase in ["conforme", "segundo", "de acordo com"]),
            "has_section_title": "[PROTOCOLO/REFERÊNCIA]" in response_text
        }
        
        validation_score["completeness_percentage"] = (
            sum(validation_score.values()) / len(validation_score) * 100
        )
        
        return validation_score

# Constantes para citações específicas mais frequentes
COMMON_CITATIONS = {
    "ADULT_DOSING": {
        "section": "4.2.1",
        "citation": "Conforme estabelecido na seção 4.2.1 (p. 67-68) da tese sobre esquemas posológicos para adultos > 50kg"
    },
    
    "PEDIATRIC_DOSING": {
        "section": "4.2.3", 
        "citation": "De acordo com diretrizes pediátricas da seção 4.2.3 (p. 69-71) para crianças < 30kg"
    },
    
    "RIFAMPIN_MECHANISM": {
        "section": "3.1.1",
        "citation": "Conforme mecanismo de ação descrito na seção 3.1.1 (p. 45-47) sobre farmacologia da rifampicina"
    },
    
    "DISPENSING_WORKFLOW": {
        "section": "5.1-5.3",
        "citation": "Segundo roteiro de dispensação completo das seções 5.1 a 5.3 (p. 78-91) da tese"
    },
    
    "ADVERSE_EVENTS": {
        "section": "6.1",
        "citation": "Conforme diretrizes de farmacovigilância da seção 6.1 (p. 95-102) sobre eventos adversos"
    }
}

import re