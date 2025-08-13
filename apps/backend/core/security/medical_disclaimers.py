# -*- coding: utf-8 -*-
"""
Sistema de Disclaimers Médico-Educacionais
==========================================

Gerencia disclaimers e avisos de responsabilidade médica para plataforma educacional
de dispensação farmacêutica PQT-U, seguindo diretrizes do CFM e legislação brasileira.

Características:
- Disclaimers específicos por tipo de consulta
- Integração com sistema de personas
- Conformidade com diretrizes médicas brasileiras
- Rastreamento de aceitação de termos
- Headers HTTP de responsabilidade médica

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-08-12
Baseado: PCDT Hanseníase 2022, CFM Resolução 2.314/2022
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum
from flask import request, jsonify, g
import json

# Import configurações
from app_config import config, EnvironmentConfig

logger = logging.getLogger(__name__)

class DisclaimerType(Enum):
    """Tipos de disclaimer médico-educacional"""
    EDUCATIONAL_GENERAL = "educational_general"
    DOSAGE_CALCULATION = "dosage_calculation"
    CLINICAL_GUIDANCE = "clinical_guidance"
    DRUG_INTERACTION = "drug_interaction"
    ADVERSE_EVENTS = "adverse_events"
    EMERGENCY_CONSULTATION = "emergency_consultation"
    PERSONA_CONSULTATION = "persona_consultation"

class ConsultationContext(Enum):
    """Contexto da consulta médica"""
    EDUCATIONAL = "educational"
    PROFESSIONAL_GUIDANCE = "professional_guidance"
    EMERGENCY_SUPPORT = "emergency_support"
    ACADEMIC_RESEARCH = "academic_research"
    TRAINING_SIMULATION = "training_simulation"

@dataclass
class MedicalDisclaimer:
    """Estrutura de disclaimer médico"""
    disclaimer_type: DisclaimerType
    consultation_context: ConsultationContext
    title: str
    content: str
    legal_references: List[str]
    severity_level: str  # info, warning, critical
    requires_acknowledgment: bool
    validity_days: int
    persona_specific: Optional[str] = None

class MedicalDisclaimerSystem:
    """Sistema de gerenciamento de disclaimers médicos"""
    
    def __init__(self):
        self.disclaimers = self._initialize_disclaimers()
        self.user_acknowledgments: Dict[str, Dict[str, datetime]] = {}
        self.disclaimer_impressions: Dict[str, int] = {}
    
    def _initialize_disclaimers(self) -> Dict[DisclaimerType, MedicalDisclaimer]:
        """Inicializa todos os disclaimers médico-educacionais"""
        
        disclaimers = {}
        
        # DISCLAIMER GERAL EDUCACIONAL
        disclaimers[DisclaimerType.EDUCATIONAL_GENERAL] = MedicalDisclaimer(
            disclaimer_type=DisclaimerType.EDUCATIONAL_GENERAL,
            consultation_context=ConsultationContext.EDUCATIONAL,
            title="Plataforma Educacional - Roteiros de Dispensação PQT-U",
            content="""
🎓 **IMPORTANTE: PLATAFORMA EDUCACIONAL**

Esta é uma plataforma educacional baseada na tese de doutorado "Roteiro de Dispensação para Hanseníase PQT-U" (UnB, 2025), desenvolvida exclusivamente para fins educacionais e de pesquisa acadêmica.

⚠️ **AVISOS IMPORTANTES:**
• Este sistema NÃO substitui consulta médica presencial
• NÃO é um dispositivo médico ou sistema de telemedicina
• NÃO deve ser usado para diagnósticos ou tratamentos reais
• Todas as informações são baseadas no PCDT Hanseníase 2022 (Ministério da Saúde)

🔬 **FINALIDADE EDUCACIONAL:**
• Capacitação de profissionais de saúde
• Apoio ao ensino farmacêutico
• Pesquisa acadêmica em dispensação farmacêutica
• Treinamento em protocolos de hanseníase

⚖️ **RESPONSABILIDADE PROFISSIONAL:**
O uso de informações desta plataforma é de total responsabilidade do profissional de saúde, que deve sempre:
• Consultar fontes oficiais atualizadas
• Seguir protocolos institucionais
• Buscar supervisão clínica quando necessário
• Exercer julgamento clínico independente

📚 **BASE CIENTÍFICA:**
Baseado em: PCDT Hanseníase 2022, Diretrizes SBD, OMS Guidelines, literatura científica revisada por pares.
            """,
            legal_references=[
                "CFM Resolução 2.314/2022 (Telemedicina)",
                "Lei 13.989/2020 (Telemedicina durante pandemia)",
                "PCDT Hanseníase 2022 - Ministério da Saúde",
                "Código de Ética Médica - CFM",
                "Lei 5.991/1973 (Controle Sanitário do Comércio de Medicamentos)"
            ],
            severity_level="warning",
            requires_acknowledgment=True,
            validity_days=30
        )
        
        # DISCLAIMER CÁLCULO DE DOSES
        disclaimers[DisclaimerType.DOSAGE_CALCULATION] = MedicalDisclaimer(
            disclaimer_type=DisclaimerType.DOSAGE_CALCULATION,
            consultation_context=ConsultationContext.PROFESSIONAL_GUIDANCE,
            title="Calculadora de Doses PQT-U - Uso Educacional",
            content="""
💊 **CALCULADORA DE DOSES PQT-U - FERRAMENTA EDUCACIONAL**

⚠️ **ATENÇÃO CRÍTICA:**
• Os cálculos são baseados no PCDT Hanseníase 2022
• Sempre CONFIRME os cálculos manualmente
• Considere condições clínicas específicas do paciente
• Verifique contraindicações e interações medicamentosas

🔍 **VALIDAÇÃO OBRIGATÓRIA:**
• Revise TODOS os parâmetros inseridos
• Confirme peso, idade e forma clínica
• Verifique histórico medicamentoso
• Considere comorbidades e alergias

⚖️ **RESPONSABILIDADE CLÍNICA:**
A prescrição final é de EXCLUSIVA responsabilidade do médico assistente. Esta ferramenta é apenas um auxílio educacional.

🚨 **EM CASO DE DÚVIDAS:**
• Consulte o PCDT Hanseníase 2022 atualizado
• Entre em contato com referência em hanseníase
• Considere segunda opinião médica
• Documente todas as decisões clínicas
            """,
            legal_references=[
                "PCDT Hanseníase 2022 - Ministério da Saúde",
                "Portaria SCTIE/MS 364/2022",
                "CFM Resolução 1.931/2009 (Código de Ética Médica)",
                "Lei 5.991/1973 (Controle de Medicamentos)"
            ],
            severity_level="critical",
            requires_acknowledgment=True,
            validity_days=7
        )
        
        # DISCLAIMER INTERAÇÕES MEDICAMENTOSAS
        disclaimers[DisclaimerType.DRUG_INTERACTION] = MedicalDisclaimer(
            disclaimer_type=DisclaimerType.DRUG_INTERACTION,
            consultation_context=ConsultationContext.PROFESSIONAL_GUIDANCE,
            title="Interações Medicamentosas - Verificação Educacional",
            content="""
🧬 **SISTEMA DE VERIFICAÇÃO DE INTERAÇÕES - USO EDUCACIONAL**

⚠️ **LIMITAÇÕES DO SISTEMA:**
• Base de dados pode não estar 100% atualizada
• Não substitui análise farmacológica especializada
• Considere sempre o contexto clínico individual
• Interações raras podem não estar listadas

🔬 **VALIDAÇÃO NECESSÁRIA:**
• Consulte fontes farmacológicas atualizadas
• Considere farmacocinética individual
• Avalie relevância clínica das interações
• Monitore sinais de interação na prática

👨‍⚕️ **DECISÃO CLÍNICA:**
A interpretação e conduta sobre interações é responsabilidade exclusiva do profissional prescritor.

📞 **RECURSOS ADICIONAIS:**
• Centro de Informações sobre Medicamentos (CIM)
• Farmacêutico clínico da instituição
• Literatura farmacológica especializada
            """,
            legal_references=[
                "Formulário Terapêutico Nacional 2010",
                "RENAME 2022",
                "Micromedex Drug Interactions",
                "CFM Resolução 1.931/2009"
            ],
            severity_level="warning",
            requires_acknowledgment=True,
            validity_days=15
        )
        
        # DISCLAIMER DR. GASNELIO (Persona Técnica)
        disclaimers[DisclaimerType.PERSONA_CONSULTATION] = MedicalDisclaimer(
            disclaimer_type=DisclaimerType.PERSONA_CONSULTATION,
            consultation_context=ConsultationContext.EDUCATIONAL,
            title="Dr. Gasnelio - Assistente Técnico-Educacional",
            content="""
👨‍⚕️ **Dr. Gasnelio - Assistente Virtual Educacional**

🤖 **NATUREZA DO ASSISTENTE:**
• Assistente de inteligência artificial educacional
• Baseado em literatura científica e PCDT 2022
• Não é um profissional de saúde real
• Não estabelece relação médico-paciente

🎓 **PROPÓSITO EDUCACIONAL:**
• Apoiar aprendizagem sobre hanseníase
• Exemplificar comunicação técnica
• Demonstrar raciocínio farmacêutico
• Facilitar compreensão de protocolos

⚠️ **LIMITAÇÕES:**
• Pode conter imprecisões ou desatualizações
• Não considera contexto clínico completo
• Não substitui julgamento profissional
• Responses podem necessitar verificação

✅ **USO APROPRIADO:**
• Estudo de casos educacionais
• Treinamento em protocolos
• Revisão de conceitos técnicos
• Apoio ao ensino farmacêutico
            """,
            legal_references=[
                "Lei Geral de Proteção de Dados (LGPD)",
                "CFM Resolução 2.314/2022",
                "Marco Civil da Internet - Lei 12.965/2014"
            ],
            severity_level="info",
            requires_acknowledgment=False,
            validity_days=60,
            persona_specific="dr_gasnelio"
        )
        
        # DISCLAIMER EVENTOS ADVERSOS
        disclaimers[DisclaimerType.ADVERSE_EVENTS] = MedicalDisclaimer(
            disclaimer_type=DisclaimerType.ADVERSE_EVENTS,
            consultation_context=ConsultationContext.EMERGENCY_SUPPORT,
            title="Eventos Adversos - Procedimentos de Emergência",
            content="""
🚨 **EVENTOS ADVERSOS GRAVES - AÇÃO IMEDIATA NECESSÁRIA**

⛑️ **EM CASO DE EMERGÊNCIA:**
• Interrompa IMEDIATAMENTE o tratamento
• Procure atendimento médico de urgência
• Ligue para SAMU 192 se necessário
• Notifique o evento ao VigiMed (Anvisa)

🔴 **SINAIS DE ALARME:**
• Reações cutâneas graves (Stevens-Johnson)
• Hepatotoxicidade aguda
• Neuropatia grave progressiva
• Reações hansênicas severas

📋 **DOCUMENTAÇÃO OBRIGATÓRIA:**
• Registre todos os sintomas
• Mantenha receitas e medicamentos
• Documente cronologia do evento
• Colete exames complementares

📞 **NOTIFICAÇÃO:**
• VigiMed: notificacoes.anvisa.gov.br
• Centro de Farmacovigilância local
• Programa de Controle da Hanseníase

⚖️ **RESPONSABILIDADE LEGAL:**
A notificação de eventos adversos graves é obrigatória conforme RDC 4/2009.
            """,
            legal_references=[
                "RDC Anvisa 4/2009 (Farmacovigilância)",
                "Lei 6.360/1976 (Vigilância Sanitária)",
                "Portaria SVS/MS 344/1998",
                "PCDT Hanseníase 2022 - Seção Farmacovigilância"
            ],
            severity_level="critical",
            requires_acknowledgment=True,
            validity_days=90
        )
        
        return disclaimers
    
    def get_applicable_disclaimers(self, request_context: Dict[str, Any]) -> List[MedicalDisclaimer]:
        """Determina quais disclaimers são aplicáveis ao contexto da request"""
        applicable = []
        
        # Sempre incluir disclaimer geral
        applicable.append(self.disclaimers[DisclaimerType.EDUCATIONAL_GENERAL])
        
        # Análise baseada na rota/endpoint
        endpoint = request_context.get('endpoint', '')
        
        if 'calculator' in endpoint or 'dose' in endpoint:
            applicable.append(self.disclaimers[DisclaimerType.DOSAGE_CALCULATION])
        
        if 'interaction' in endpoint:
            applicable.append(self.disclaimers[DisclaimerType.DRUG_INTERACTION])
        
        if 'adverse' in endpoint or 'reaction' in endpoint:
            applicable.append(self.disclaimers[DisclaimerType.ADVERSE_EVENTS])
        
        # Análise baseada na persona
        persona = request_context.get('persona', '')
        if persona == 'dr_gasnelio':
            persona_disclaimer = None
            for disclaimer in self.disclaimers.values():
                if disclaimer.persona_specific == 'dr_gasnelio':
                    persona_disclaimer = disclaimer
                    break
            if persona_disclaimer:
                applicable.append(persona_disclaimer)
        
        return applicable
    
    def check_acknowledgment_required(self, user_id: str, disclaimers: List[MedicalDisclaimer]) -> List[MedicalDisclaimer]:
        """Verifica quais disclaimers precisam de acknowledgment"""
        required = []
        user_acks = self.user_acknowledgments.get(user_id, {})
        
        for disclaimer in disclaimers:
            if not disclaimer.requires_acknowledgment:
                continue
            
            disclaimer_key = disclaimer.disclaimer_type.value
            last_ack = user_acks.get(disclaimer_key)
            
            if not last_ack:
                required.append(disclaimer)
            elif datetime.now() - last_ack > timedelta(days=disclaimer.validity_days):
                required.append(disclaimer)
        
        return required
    
    def record_acknowledgment(self, user_id: str, disclaimer_type: DisclaimerType) -> bool:
        """Registra acknowledgment de disclaimer"""
        try:
            if user_id not in self.user_acknowledgments:
                self.user_acknowledgments[user_id] = {}
            
            self.user_acknowledgments[user_id][disclaimer_type.value] = datetime.now()
            
            # Log do acknowledgment
            logger.info(f"Disclaimer acknowledged: {disclaimer_type.value} by user {user_id}")
            
            # Incrementar contador de impressões
            self.disclaimer_impressions[disclaimer_type.value] = self.disclaimer_impressions.get(disclaimer_type.value, 0) + 1
            
            return True
        except Exception as e:
            logger.error(f"Erro ao registrar acknowledgment: {e}")
            return False
    
    def get_disclaimer_headers(self, disclaimers: List[MedicalDisclaimer]) -> Dict[str, str]:
        """Gera headers HTTP com informações de disclaimer"""
        headers = {}
        
        # Header principal de disclaimers médicos
        disclaimer_types = [d.disclaimer_type.value for d in disclaimers]
        headers['X-Medical-Disclaimer'] = ','.join(disclaimer_types)
        
        # Header de responsabilidade
        headers['X-Medical-Responsibility'] = 'educational-platform-only'
        
        # Header de conformidade
        headers['X-Medical-Compliance'] = 'PCDT-2022,CFM-2314'
        
        # Header de severidade máxima
        max_severity = 'info'
        for disclaimer in disclaimers:
            if disclaimer.severity_level == 'critical':
                max_severity = 'critical'
                break
            elif disclaimer.severity_level == 'warning' and max_severity != 'critical':
                max_severity = 'warning'
        
        headers['X-Medical-Severity'] = max_severity
        
        return headers
    
    def format_disclaimer_response(self, disclaimers: List[MedicalDisclaimer], include_content: bool = True) -> Dict[str, Any]:
        """Formata disclaimers para response JSON"""
        formatted = {
            'timestamp': datetime.now().isoformat(),
            'total_disclaimers': len(disclaimers),
            'max_severity': 'info',
            'disclaimers': []
        }
        
        # Determinar severidade máxima
        for disclaimer in disclaimers:
            if disclaimer.severity_level == 'critical':
                formatted['max_severity'] = 'critical'
                break
            elif disclaimer.severity_level == 'warning' and formatted['max_severity'] != 'critical':
                formatted['max_severity'] = 'warning'
        
        # Formatar cada disclaimer
        for disclaimer in disclaimers:
            disclaimer_data = {
                'type': disclaimer.disclaimer_type.value,
                'context': disclaimer.consultation_context.value,
                'title': disclaimer.title,
                'severity': disclaimer.severity_level,
                'requires_acknowledgment': disclaimer.requires_acknowledgment,
                'validity_days': disclaimer.validity_days
            }
            
            if include_content:
                disclaimer_data['content'] = disclaimer.content
                disclaimer_data['legal_references'] = disclaimer.legal_references
            
            if disclaimer.persona_specific:
                disclaimer_data['persona'] = disclaimer.persona_specific
            
            formatted['disclaimers'].append(disclaimer_data)
        
        return formatted
    
    def get_disclaimer_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas dos disclaimers"""
        return {
            'total_disclaimers': len(self.disclaimers),
            'total_acknowledgments': sum(len(acks) for acks in self.user_acknowledgments.values()),
            'unique_users': len(self.user_acknowledgments),
            'impression_counts': dict(self.disclaimer_impressions),
            'disclaimer_types': [dt.value for dt in self.disclaimers.keys()]
        }

# Instância global
medical_disclaimer_system = MedicalDisclaimerSystem()

# Middleware de disclaimers
def add_medical_disclaimers():
    """Middleware para adicionar disclaimers médicos às responses"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            # Executar função original
            response = f(*args, **kwargs)
            
            # Analisar contexto da request
            request_context = {
                'endpoint': request.endpoint or request.path,
                'persona': getattr(g, 'selected_persona', None),
                'method': request.method
            }
            
            # Obter disclaimers aplicáveis
            applicable_disclaimers = medical_disclaimer_system.get_applicable_disclaimers(request_context)
            
            # Adicionar headers de disclaimer
            if applicable_disclaimers:
                disclaimer_headers = medical_disclaimer_system.get_disclaimer_headers(applicable_disclaimers)
                
                # Se response é um tuple (response, status_code), extrair o response
                if isinstance(response, tuple):
                    response_data, status_code = response[0], response[1]
                else:
                    response_data, status_code = response, 200
                
                # Adicionar headers se é uma resposta Flask
                if hasattr(response_data, 'headers'):
                    for header, value in disclaimer_headers.items():
                        response_data.headers[header] = value
            
            return response
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Funções de conveniência
def get_medical_disclaimers(request_context: Dict[str, Any]) -> List[MedicalDisclaimer]:
    """Obtém disclaimers médicos para contexto"""
    return medical_disclaimer_system.get_applicable_disclaimers(request_context)

def record_disclaimer_acknowledgment(user_id: str, disclaimer_type: str) -> bool:
    """Registra acknowledgment de disclaimer"""
    try:
        dt = DisclaimerType(disclaimer_type)
        return medical_disclaimer_system.record_acknowledgment(user_id, dt)
    except ValueError:
        return False

def get_disclaimer_stats() -> Dict[str, Any]:
    """Retorna estatísticas de disclaimers"""
    return medical_disclaimer_system.get_disclaimer_stats()

__all__ = [
    'MedicalDisclaimerSystem',
    'DisclaimerType',
    'ConsultationContext',
    'medical_disclaimer_system',
    'add_medical_disclaimers',
    'get_medical_disclaimers',
    'record_disclaimer_acknowledgment',
    'get_disclaimer_stats'
]