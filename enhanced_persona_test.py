#!/usr/bin/env python3
"""
Enhanced Persona Quality Test - Fase 5.1.2
QA Specialist em Conversational AI & UX Testing

Data: 27 de Janeiro de 2025
Objetivo: Incrementar testes existentes com validações estruturais
"""

import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

class EnhancedPersonaTester:
    """
    Testador aprimorado que combina testes estruturais e funcionais
    """
    
    def __init__(self):
        self.base_path = Path(".")
        self.backend_path = self.base_path / "src" / "backend"
        self.test_results = {
            'structural_validation': {},
            'prompt_quality': {},
            'service_integration': {},
            'overall_score': 0
        }
    
    def test_structural_persona_setup(self):
        """
        Testa se a estrutura das personas está corretamente configurada
        """
        log("TESTE ESTRUTURAL DAS PERSONAS", "INFO")
        print("=" * 60)
        
        structural_checks = {
            'dr_gasnelio_prompt': False,
            'ga_prompt': False,
            'dr_gasnelio_service': False,
            'ga_service': False,
            'personas_integration': False
        }
        
        # Verificar arquivos de prompt
        dr_prompt_file = self.backend_path / "prompts" / "dr_gasnelio_technical_prompt.py"
        ga_prompt_file = self.backend_path / "prompts" / "ga_empathetic_prompt.py"
        
        if dr_prompt_file.exists():
            structural_checks['dr_gasnelio_prompt'] = True
            print("OK Dr. Gasnelio prompt: ENCONTRADO")
        else:
            print("ERRO Dr. Gasnelio prompt: AUSENTE")
        
        if ga_prompt_file.exists():
            structural_checks['ga_prompt'] = True
            print("OK Ga prompt: ENCONTRADO")
        else:
            print("ERRO Ga prompt: AUSENTE")
        
        # Verificar serviços
        dr_service_file = self.backend_path / "services" / "dr_gasnelio_enhanced.py"
        ga_service_file = self.backend_path / "services" / "ga_enhanced.py"
        
        if dr_service_file.exists():
            structural_checks['dr_gasnelio_service'] = True
            print("✅ Dr. Gasnelio service: ENCONTRADO")
        else:
            print("❌ Dr. Gasnelio service: AUSENTE")
        
        if ga_service_file.exists():
            structural_checks['ga_service'] = True
            print("✅ Gá service: ENCONTRADO")
        else:
            print("❌ Gá service: AUSENTE")
        
        # Verificar integração de personas
        personas_file = self.backend_path / "services" / "personas.py"
        if personas_file.exists():
            structural_checks['personas_integration'] = True
            print("✅ Integração de personas: ENCONTRADO")
        else:
            print("❌ Integração de personas: AUSENTE")
        
        score = sum(structural_checks.values()) / len(structural_checks) * 100
        self.test_results['structural_validation'] = {
            'score': score,
            'checks': structural_checks
        }
        
        print(f"\n📊 SCORE ESTRUTURAL: {score:.1f}%")
        return score >= 80
    
    def analyze_prompt_quality(self):
        """
        Analisa a qualidade dos prompts das personas
        """
        log("ANÁLISE DE QUALIDADE DOS PROMPTS", "INFO")
        print("=" * 60)
        
        prompt_analysis = {
            'dr_gasnelio': {'quality_score': 0, 'issues': [], 'strengths': []},
            'ga': {'quality_score': 0, 'issues': [], 'strengths': []}
        }
        
        # Analisar Dr. Gasnelio
        dr_prompt_file = self.backend_path / "prompts" / "dr_gasnelio_technical_prompt.py"
        if dr_prompt_file.exists():
            try:
                with open(dr_prompt_file, 'r', encoding='utf-8') as f:
                    dr_content = f.read()
                
                dr_analysis = self._analyze_technical_prompt(dr_content)
                prompt_analysis['dr_gasnelio'] = dr_analysis
                print(f"✅ Dr. Gasnelio prompt analisado: {dr_analysis['quality_score']:.1f}%")
                
            except Exception as e:
                print(f"❌ Erro ao analisar Dr. Gasnelio: {e}")
        
        # Analisar Gá
        ga_prompt_file = self.backend_path / "prompts" / "ga_empathetic_prompt.py"
        if ga_prompt_file.exists():
            try:
                with open(ga_prompt_file, 'r', encoding='utf-8') as f:
                    ga_content = f.read()
                
                ga_analysis = self._analyze_empathetic_prompt(ga_content)
                prompt_analysis['ga'] = ga_analysis
                print(f"✅ Gá prompt analisado: {ga_analysis['quality_score']:.1f}%")
                
            except Exception as e:
                print(f"❌ Erro ao analisar Gá: {e}")
        
        avg_score = (prompt_analysis['dr_gasnelio']['quality_score'] + 
                    prompt_analysis['ga']['quality_score']) / 2
        
        self.test_results['prompt_quality'] = {
            'avg_score': avg_score,
            'analysis': prompt_analysis
        }
        
        print(f"\n📊 SCORE MÉDIO DE QUALIDADE DOS PROMPTS: {avg_score:.1f}%")
        return avg_score >= 75
    
    def _analyze_technical_prompt(self, content):
        """
        Analisa qualidade do prompt técnico do Dr. Gasnelio
        """
        analysis = {
            'quality_score': 0,
            'issues': [],
            'strengths': []
        }
        
        content_lower = content.lower()
        
        # Critérios de qualidade técnica
        technical_criteria = {
            'identity_definition': 'dr. gasnelio' in content_lower or 'gasnelio' in content_lower,
            'technical_language': 'técnico' in content_lower or 'científico' in content_lower,
            'medical_expertise': 'farmacêutico' in content_lower or 'médico' in content_lower,
            'hansen_focus': 'hanseníase' in content_lower or 'hansen' in content_lower,
            'pqtu_reference': 'pqt-u' in content_lower or 'poliquimioterapia' in content_lower,
            'professional_tone': 'profissional' in content_lower or 'técnica' in content_lower,
            'citation_requirement': 'citação' in content_lower or 'referência' in content_lower,
            'limitation_awareness': 'limitação' in content_lower or 'escopo' in content_lower
        }
        
        met_criteria = sum(technical_criteria.values())
        total_criteria = len(technical_criteria)
        
        analysis['quality_score'] = (met_criteria / total_criteria) * 100
        
        # Identificar pontos fortes e áreas de melhoria
        if technical_criteria['identity_definition']:
            analysis['strengths'].append("Identidade bem definida")
        else:
            analysis['issues'].append("Identidade mal definida")
        
        if technical_criteria['technical_language']:
            analysis['strengths'].append("Linguagem técnica apropriada")
        else:
            analysis['issues'].append("Falta ênfase em linguagem técnica")
        
        if technical_criteria['citation_requirement']:
            analysis['strengths'].append("Requisitos de citação presentes")
        else:
            analysis['issues'].append("Falta requisitos de citação")
        
        return analysis
    
    def _analyze_empathetic_prompt(self, content):
        """
        Analisa qualidade do prompt empático do Gá
        """
        analysis = {
            'quality_score': 0,
            'issues': [],
            'strengths': []
        }
        
        content_lower = content.lower()
        
        # Critérios de qualidade empática
        empathetic_criteria = {
            'identity_definition': 'gá' in content_lower,
            'empathetic_language': 'empático' in content_lower or 'empática' in content_lower,
            'accessibility_focus': 'acessível' in content_lower or 'simples' in content_lower,
            'emotional_support': 'acolhedor' in content_lower or 'suporte' in content_lower,
            'language_translation': 'traduzir' in content_lower or 'simplificar' in content_lower,
            'patient_care': 'paciente' in content_lower or 'cuidado' in content_lower,
            'hansen_focus': 'hanseníase' in content_lower or 'hansen' in content_lower,
            'limitation_awareness': 'limitação' in content_lower or 'escopo' in content_lower
        }
        
        met_criteria = sum(empathetic_criteria.values())
        total_criteria = len(empathetic_criteria)
        
        analysis['quality_score'] = (met_criteria / total_criteria) * 100
        
        # Identificar pontos fortes e áreas de melhoria
        if empathetic_criteria['empathetic_language']:
            analysis['strengths'].append("Linguagem empática bem definida")
        else:
            analysis['issues'].append("Falta ênfase em empatia")
        
        if empathetic_criteria['accessibility_focus']:
            analysis['strengths'].append("Foco em acessibilidade presente")
        else:
            analysis['issues'].append("Falta foco em acessibilidade")
        
        if empathetic_criteria['language_translation']:
            analysis['strengths'].append("Orientação para tradução de termos")
        else:
            analysis['issues'].append("Falta orientação para simplificação")
        
        return analysis
    
    def test_service_integration(self):
        """
        Testa integração dos serviços das personas
        """
        log("TESTE DE INTEGRAÇÃO DOS SERVIÇOS", "INFO")
        print("=" * 60)
        
        integration_checks = {
            'dr_gasnelio_functions': False,
            'ga_functions': False,
            'validation_systems': False,
            'error_handling': False
        }
        
        # Verificar funções do Dr. Gasnelio
        dr_service_file = self.backend_path / "services" / "dr_gasnelio_enhanced.py"
        if dr_service_file.exists():
            try:
                with open(dr_service_file, 'r', encoding='utf-8') as f:
                    dr_service_content = f.read()
                
                if 'def ' in dr_service_content and 'prompt' in dr_service_content.lower():
                    integration_checks['dr_gasnelio_functions'] = True
                    print("✅ Dr. Gasnelio service functions: OK")
                else:
                    print("❌ Dr. Gasnelio service functions: INCOMPLETAS")
                    
            except Exception as e:
                print(f"❌ Erro ao verificar Dr. Gasnelio service: {e}")
        
        # Verificar funções do Gá
        ga_service_file = self.backend_path / "services" / "ga_enhanced.py"
        if ga_service_file.exists():
            try:
                with open(ga_service_file, 'r', encoding='utf-8') as f:
                    ga_service_content = f.read()
                
                if 'def ' in ga_service_content and 'empat' in ga_service_content.lower():
                    integration_checks['ga_functions'] = True
                    print("✅ Gá service functions: OK")
                else:
                    print("❌ Gá service functions: INCOMPLETAS")
                    
            except Exception as e:
                print(f"❌ Erro ao verificar Gá service: {e}")
        
        # Verificar sistemas de validação
        scope_validator = self.backend_path / "services" / "scope_detection_system.py"
        if scope_validator.exists():
            integration_checks['validation_systems'] = True
            print("✅ Sistema de validação de escopo: OK")
        else:
            print("❌ Sistema de validação de escopo: AUSENTE")
        
        # Verificar tratamento de erros
        main_file = self.backend_path / "main.py"
        if main_file.exists():
            try:
                with open(main_file, 'r', encoding='utf-8') as f:
                    main_content = f.read()
                
                if 'try:' in main_content and 'except' in main_content:
                    integration_checks['error_handling'] = True
                    print("✅ Tratamento de erros: OK")
                else:
                    print("❌ Tratamento de erros: INADEQUADO")
                    
            except Exception as e:
                print(f"❌ Erro ao verificar main.py: {e}")
        
        score = sum(integration_checks.values()) / len(integration_checks) * 100
        self.test_results['service_integration'] = {
            'score': score,
            'checks': integration_checks
        }
        
        print(f"\n📊 SCORE DE INTEGRAÇÃO: {score:.1f}%")
        return score >= 75
    
    def generate_enhanced_report(self):
        """
        Gera relatório aprimorado de qualidade das personas
        """
        log("GERANDO RELATÓRIO APRIMORADO", "INFO")
        
        # Calcular score geral
        structural_score = self.test_results.get('structural_validation', {}).get('score', 0)
        prompt_score = self.test_results.get('prompt_quality', {}).get('avg_score', 0)
        integration_score = self.test_results.get('service_integration', {}).get('score', 0)
        
        overall_score = (structural_score + prompt_score + integration_score) / 3
        self.test_results['overall_score'] = overall_score
        
        print("\n" + "=" * 80)
        print("📋 RELATÓRIO APRIMORADO DE QUALIDADE DAS PERSONAS")
        print("=" * 80)
        
        print(f"\n🏗️  VALIDAÇÃO ESTRUTURAL: {structural_score:.1f}%")
        print(f"📝 QUALIDADE DOS PROMPTS: {prompt_score:.1f}%")
        print(f"🔗 INTEGRAÇÃO DOS SERVIÇOS: {integration_score:.1f}%")
        
        print(f"\n📊 SCORE GERAL: {overall_score:.1f}%")
        
        if overall_score >= 85:
            certification = "🏆 EXCELENTE - PRONTO PARA PRODUÇÃO"
        elif overall_score >= 75:
            certification = "✅ BOM - APROVADO COM RESSALVAS"
        elif overall_score >= 65:
            certification = "⚠️ REGULAR - NECESSITA MELHORIAS"
        else:
            certification = "❌ INSUFICIENTE - REQUER CORREÇÕES SIGNIFICATIVAS"
        
        print(f"🎯 CERTIFICAÇÃO: {certification}")
        
        # Recomendações específicas
        print(f"\n📝 RECOMENDAÇÕES:")
        if structural_score < 80:
            print("- Verificar arquivos estruturais ausentes")
        if prompt_score < 75:
            print("- Melhorar qualidade dos prompts das personas")
        if integration_score < 75:
            print("- Aprimorar integração entre serviços")
        
        return overall_score >= 75

def main():
    """
    Executa testes aprimorados de qualidade das personas
    """
    print("=" * 80)
    print("TESTE APRIMORADO DE QUALIDADE DAS PERSONAS - FASE 5.1.2")
    print("QA Specialist em Conversational AI & UX Testing")
    print("=" * 80)
    print()
    
    tester = EnhancedPersonaTester()
    
    try:
        print("INICIANDO VALIDACAO APRIMORADA DAS PERSONAS")
        print()
        
        # Teste 1: Validação Estrutural
        structural_ok = tester.test_structural_persona_setup()
        print()
        
        # Teste 2: Qualidade dos Prompts
        prompts_ok = tester.analyze_prompt_quality()
        print()
        
        # Teste 3: Integração dos Serviços
        integration_ok = tester.test_service_integration()
        print()
        
        # Relatório Final
        success = tester.generate_enhanced_report()
        
        print("\n" + "=" * 80)
        if success:
            print("✅ FASE 5.1.2 CONCLUÍDA COM SUCESSO")
            print("Personas estruturalmente válidas para produção!")
        else:
            print("⚠️ FASE 5.1.2 REQUER ATENÇÃO")
            print("Melhorias estruturais necessárias.")
        print("=" * 80)
        
        return success
        
    except Exception as e:
        log(f"ERRO durante execução: {e}", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)