#!/usr/bin/env python3
"""
Testes de Usabilidade da Interface
UX/UI Testing Specialist & Accessibility Expert

Data: 27 de Janeiro de 2025
Fase: 5.1.3 - Testes de usabilidade
"""

import sys
import os
import time
import json
import requests
from pathlib import Path
from datetime import datetime

# Configurações de teste
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:5000"
TEST_TIMEOUT = 10

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

class UsabilityTester:
    """
    Suite de testes de usabilidade e experiência do usuário
    """
    
    def __init__(self):
        self.test_results = {
            'persona_switching': {'score': 0, 'issues': []},
            'responsiveness': {'score': 0, 'issues': []},
            'performance': {'score': 0, 'issues': []},
            'communication_clarity': {'score': 0, 'issues': []},
            'overall_score': 0
        }
    
    def test_persona_switching_ease(self):
        """
        Testa facilidade de troca de personas
        """
        log("INICIANDO TESTE DE TROCA DE PERSONAS", "INFO")
        print("=" * 60)
        
        switching_criteria = {
            'api_persona_switch': False,
            'response_time_acceptable': False,
            'different_responses': False,
            'consistent_identity': False,
            'error_handling': False
        }
        
        # Teste 1: Verificar endpoint de personas disponível
        try:
            response = requests.get(f"{BACKEND_URL}/api/personas", timeout=TEST_TIMEOUT)
            if response.status_code == 200:
                personas_data = response.json()
                if 'personas' in personas_data and len(personas_data['personas']) >= 2:
                    switching_criteria['api_persona_switch'] = True
                    print("✅ API de personas: Disponível")
                else:
                    print("❌ API de personas: Resposta incompleta")
            else:
                print(f"❌ API de personas: Status {response.status_code}")
        except Exception as e:
            print(f"❌ API de personas: Erro - {e}")
        
        # Teste 2: Verificar tempo de resposta na troca
        if switching_criteria['api_persona_switch']:
            test_question = "Qual a dose de rifampicina para adultos?"
            
            # Testar Dr. Gasnelio
            start_time = time.time()
            try:
                payload = {'question': test_question, 'personality_id': 'dr_gasnelio'}
                response1 = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
                gasnelio_time = time.time() - start_time
                
                if response1.status_code == 200 and gasnelio_time < 8:
                    switching_criteria['response_time_acceptable'] = True
                    print(f"✅ Tempo Dr. Gasnelio: {gasnelio_time:.2f}s")
                else:
                    print(f"❌ Tempo Dr. Gasnelio: {gasnelio_time:.2f}s (muito lento)")
                
                # Testar Gá
                start_time = time.time()
                payload = {'question': test_question, 'personality_id': 'ga'}
                response2 = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
                ga_time = time.time() - start_time
                
                if response2.status_code == 200 and ga_time < 8:
                    print(f"✅ Tempo Gá: {ga_time:.2f}s")
                    
                    # Verificar se as respostas são diferentes
                    if response1.json().get('answer') != response2.json().get('answer'):
                        switching_criteria['different_responses'] = True
                        print("✅ Respostas diferenciadas: Confirmado")
                    else:
                        print("❌ Respostas diferenciadas: Muito similares")
                else:
                    print(f"❌ Tempo Gá: {ga_time:.2f}s (muito lento)")
                    
            except Exception as e:
                print(f"❌ Erro no teste de troca: {e}")
        
        # Teste 3: Verificar consistência de identidade
        identity_questions = ["Quem você é?", "Qual seu nome?"]
        for question in identity_questions:
            try:
                payload = {'question': question, 'personality_id': 'dr_gasnelio'}
                response = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
                if response.status_code == 200:
                    answer = response.json().get('answer', '').lower()
                    if 'gasnelio' in answer or 'dr.' in answer:
                        switching_criteria['consistent_identity'] = True
                        break
            except:
                pass
        
        if switching_criteria['consistent_identity']:
            print("✅ Identidade consistente: Dr. Gasnelio se identifica")
        else:
            print("❌ Identidade consistente: Problemas de identificação")
        
        # Teste 4: Verificar tratamento de erros
        try:
            payload = {'question': 'teste', 'personality_id': 'persona_inexistente'}
            response = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
            if response.status_code in [400, 404]:
                switching_criteria['error_handling'] = True
                print("✅ Tratamento de erros: Adequado")
            else:
                print("❌ Tratamento de erros: Inadequado")
        except:
            print("❌ Tratamento de erros: Falha no teste")
        
        # Calcular score
        score = sum(switching_criteria.values()) / len(switching_criteria) * 100
        self.test_results['persona_switching']['score'] = score
        
        print(f"\n📊 SCORE TROCA DE PERSONAS: {score:.1f}%")
        return score >= 75
    
    def test_responsive_design(self):
        """
        Testa responsividade em diferentes dispositivos (estrutural)
        """
        log("INICIANDO TESTE DE RESPONSIVIDADE", "INFO")
        print("=" * 60)
        
        # Como não temos acesso direto ao DOM, vamos verificar a estrutura do frontend
        frontend_path = Path("src/frontend")
        responsive_criteria = {
            'tailwind_config': False,
            'responsive_components': False,
            'mobile_first_approach': False,
            'accessibility_features': False
        }
        
        # Verificar configuração Tailwind (framework responsivo)
        tailwind_config = frontend_path / "tailwind.config.js"
        if tailwind_config.exists():
            try:
                with open(tailwind_config, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'responsive' in content or 'screens' in content:
                    responsive_criteria['tailwind_config'] = True
                    print("✅ Configuração Tailwind: Responsiva")
                else:
                    print("❌ Configuração Tailwind: Não responsiva")
            except:
                print("❌ Configuração Tailwind: Erro na leitura")
        else:
            print("❌ Configuração Tailwind: Não encontrada")
        
        # Verificar componentes responsivos
        components_path = frontend_path / "src" / "components"
        if components_path.exists():
            responsive_patterns = ['sm:', 'md:', 'lg:', 'xl:', 'mobile', 'tablet', 'desktop']
            responsive_files = 0
            total_files = 0
            
            for tsx_file in components_path.rglob("*.tsx"):
                total_files += 1
                try:
                    with open(tsx_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if any(pattern in content for pattern in responsive_patterns):
                        responsive_files += 1
                except:
                    pass
            
            if total_files > 0 and responsive_files / total_files >= 0.5:
                responsive_criteria['responsive_components'] = True
                print(f"✅ Componentes responsivos: {responsive_files}/{total_files}")
            else:
                print(f"❌ Componentes responsivos: {responsive_files}/{total_files} (insuficiente)")
        
        # Verificar abordagem mobile-first
        globals_css = frontend_path / "src" / "styles" / "globals.css"
        if globals_css.exists():
            try:
                with open(globals_css, 'r', encoding='utf-8') as f:
                    content = f.read()
                if '@media' in content or 'mobile' in content:
                    responsive_criteria['mobile_first_approach'] = True
                    print("✅ Mobile-first: Detectado")
                else:
                    print("❌ Mobile-first: Não detectado")
            except:
                print("❌ Mobile-first: Erro na verificação")
        
        # Verificar recursos de acessibilidade
        accessibility_indicators = ['aria-', 'role=', 'alt=', 'tabIndex', 'accessibility']
        accessible_files = 0
        
        for tsx_file in components_path.rglob("*.tsx"):
            try:
                with open(tsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                if any(indicator in content for indicator in accessibility_indicators):
                    accessible_files += 1
            except:
                pass
        
        if accessible_files >= 3:  # Pelo menos 3 componentes com acessibilidade
            responsive_criteria['accessibility_features'] = True
            print(f"✅ Recursos de acessibilidade: {accessible_files} componentes")
        else:
            print(f"❌ Recursos de acessibilidade: {accessible_files} componentes (insuficiente)")
        
        score = sum(responsive_criteria.values()) / len(responsive_criteria) * 100
        self.test_results['responsiveness']['score'] = score
        
        print(f"\n📊 SCORE RESPONSIVIDADE: {score:.1f}%")
        return score >= 75
    
    def test_performance_metrics(self):
        """
        Testa performance e tempos de resposta
        """
        log("INICIANDO TESTE DE PERFORMANCE", "INFO")
        print("=" * 60)
        
        performance_criteria = {
            'backend_health_fast': False,
            'api_response_time': False,
            'frontend_bundle_size': False,
            'resource_optimization': False
        }
        
        # Teste 1: Health check do backend
        try:
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
            health_time = time.time() - start_time
            
            if response.status_code == 200 and health_time < 2:
                performance_criteria['backend_health_fast'] = True
                print(f"✅ Health check: {health_time:.3f}s")
            else:
                print(f"❌ Health check: {health_time:.3f}s (muito lento)")
        except Exception as e:
            print(f"❌ Health check: Erro - {e}")
        
        # Teste 2: Tempo de resposta da API de chat
        try:
            start_time = time.time()
            payload = {'question': 'O que é hanseníase?', 'personality_id': 'ga'}
            response = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=15)
            api_time = time.time() - start_time
            
            if response.status_code == 200:
                if api_time < 10:  # Aceitável para chatbot médico
                    performance_criteria['api_response_time'] = True
                    print(f"✅ Tempo API chat: {api_time:.2f}s")
                else:
                    print(f"❌ Tempo API chat: {api_time:.2f}s (muito lento)")
            else:
                print(f"❌ API chat: Status {response.status_code}")
        except Exception as e:
            print(f"❌ API chat: Erro - {e}")
        
        # Teste 3: Verificar tamanho do bundle frontend
        dist_path = Path("src/frontend/dist")
        if dist_path.exists():
            total_size = 0
            js_files = 0
            
            for file in dist_path.rglob("*.js"):
                try:
                    size = file.stat().st_size
                    total_size += size
                    js_files += 1
                except:
                    pass
            
            # Converter para MB
            total_mb = total_size / (1024 * 1024)
            
            if total_mb < 5:  # Menos de 5MB é bom para uma aplicação
                performance_criteria['frontend_bundle_size'] = True
                print(f"✅ Bundle size: {total_mb:.2f}MB ({js_files} arquivos)")
            else:
                print(f"❌ Bundle size: {total_mb:.2f}MB (muito grande)")
        else:
            print("⚠️ Bundle size: Dist não encontrado (frontend não compilado)")
        
        # Teste 4: Verificar otimizações de recursos
        package_json = Path("src/frontend/package.json")
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                
                # Verificar dependências de otimização
                optimization_deps = ['vite', '@vitejs/plugin-react', 'terser']
                deps = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                
                optimizations = sum(1 for dep in optimization_deps if dep in deps)
                
                if optimizations >= 2:
                    performance_criteria['resource_optimization'] = True
                    print(f"✅ Otimizações: {optimizations} ferramentas detectadas")
                else:
                    print(f"❌ Otimizações: {optimizations} ferramentas (insuficiente)")
            except:
                print("❌ Otimizações: Erro na verificação")
        
        score = sum(performance_criteria.values()) / len(performance_criteria) * 100
        self.test_results['performance']['score'] = score
        
        print(f"\n📊 SCORE PERFORMANCE: {score:.1f}%")
        return score >= 75
    
    def test_communication_clarity(self):
        """
        Testa clareza da comunicação e feedback visual
        """
        log("INICIANDO TESTE DE CLAREZA DA COMUNICAÇÃO", "INFO")
        print("=" * 60)
        
        communication_criteria = {
            'error_messages_clear': False,
            'loading_states': False,
            'persona_identification': False,
            'user_guidance': False
        }
        
        # Teste 1: Verificar mensagens de erro claras
        try:
            # Tentar requisição inválida
            payload = {'invalid': 'data'}
            response = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
            
            if response.status_code >= 400:
                error_data = response.json() if response.content else {}
                if 'error' in error_data or 'message' in error_data:
                    communication_criteria['error_messages_clear'] = True
                    print("✅ Mensagens de erro: Claras")
                else:
                    print("❌ Mensagens de erro: Não estruturadas")
            else:
                print("❌ Mensagens de erro: Não testáveis")
        except:
            print("❌ Mensagens de erro: Erro no teste")
        
        # Teste 2: Verificar estados de loading no frontend
        frontend_components = Path("src/frontend/src/components")
        loading_indicators = ['Loading', 'Spinner', 'isLoading', 'loading']
        
        loading_components = 0
        for tsx_file in frontend_components.rglob("*.tsx"):
            try:
                with open(tsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                if any(indicator in content for indicator in loading_indicators):
                    loading_components += 1
            except:
                pass
        
        if loading_components >= 2:
            communication_criteria['loading_states'] = True
            print(f"✅ Estados de loading: {loading_components} componentes")
        else:
            print(f"❌ Estados de loading: {loading_components} componentes (insuficiente)")
        
        # Teste 3: Verificar identificação clara das personas
        try:
            gasnelio_test = {'question': 'Quem você é?', 'personality_id': 'dr_gasnelio'}
            response = requests.post(f"{BACKEND_URL}/api/chat", json=gasnelio_test, timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                answer = response.json().get('answer', '').lower()
                if 'gasnelio' in answer or 'farmacêutico' in answer:
                    communication_criteria['persona_identification'] = True
                    print("✅ Identificação de personas: Clara")
                else:
                    print("❌ Identificação de personas: Confusa")
        except:
            print("❌ Identificação de personas: Erro no teste")
        
        # Teste 4: Verificar orientações ao usuário
        persona_components = frontend_components.rglob("*Persona*.tsx")
        guidance_elements = ['tooltip', 'placeholder', 'helper', 'hint', 'guide']
        
        guidance_found = False
        for component in persona_components:
            try:
                with open(component, 'r', encoding='utf-8') as f:
                    content = f.read()
                if any(element in content.lower() for element in guidance_elements):
                    guidance_found = True
                    break
            except:
                pass
        
        if guidance_found:
            communication_criteria['user_guidance'] = True
            print("✅ Orientações ao usuário: Presentes")
        else:
            print("❌ Orientações ao usuário: Ausentes")
        
        score = sum(communication_criteria.values()) / len(communication_criteria) * 100
        self.test_results['communication_clarity']['score'] = score
        
        print(f"\n📊 SCORE CLAREZA DA COMUNICAÇÃO: {score:.1f}%")
        return score >= 75
    
    def generate_usability_report(self):
        """
        Gera relatório final de usabilidade
        """
        log("GERANDO RELATÓRIO DE USABILIDADE", "INFO")
        
        # Calcular score geral
        scores = [
            self.test_results['persona_switching']['score'],
            self.test_results['responsiveness']['score'],
            self.test_results['performance']['score'],
            self.test_results['communication_clarity']['score']
        ]
        
        overall_score = sum(scores) / len(scores)
        self.test_results['overall_score'] = overall_score
        
        print("\n" + "=" * 80)
        print("📋 RELATÓRIO FINAL DE USABILIDADE - FASE 5.1.3")
        print("=" * 80)
        
        print(f"\n🔄 TROCA DE PERSONAS: {self.test_results['persona_switching']['score']:.1f}%")
        print(f"📱 RESPONSIVIDADE: {self.test_results['responsiveness']['score']:.1f}%")
        print(f"⚡ PERFORMANCE: {self.test_results['performance']['score']:.1f}%")
        print(f"💬 CLAREZA DA COMUNICAÇÃO: {self.test_results['communication_clarity']['score']:.1f}%")
        
        print(f"\n📊 SCORE GERAL DE USABILIDADE: {overall_score:.1f}%")
        
        if overall_score >= 85:
            certification = "EXCELENTE - PRONTO PARA PRODUÇÃO"
        elif overall_score >= 75:
            certification = "BOM - APROVADO COM PEQUENOS AJUSTES"
        elif overall_score >= 65:
            certification = "REGULAR - NECESSITA MELHORIAS"
        else:
            certification = "INSUFICIENTE - REQUER CORREÇÕES SIGNIFICATIVAS"
        
        print(f"🎯 CERTIFICAÇÃO: {certification}")
        
        # Salvar relatório
        report_path = Path("tests/quality/usability/usability_report.md")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"""# Relatório de Usabilidade - Fase 5.1.3

**Data:** {datetime.now().strftime("%d de %B de %Y")}
**Especialista:** UX/UI Testing Specialist & Accessibility Expert
**Score Geral:** {overall_score:.1f}%

## Resultados dos Testes

### 🔄 Troca de Personas: {self.test_results['persona_switching']['score']:.1f}%
- Facilidade de alternância entre Dr. Gasnelio e Gá
- Tempo de resposta aceitável
- Diferenciação clara entre personas

### 📱 Responsividade: {self.test_results['responsiveness']['score']:.1f}%
- Design adaptável para diferentes dispositivos
- Configuração mobile-first
- Recursos de acessibilidade

### ⚡ Performance: {self.test_results['performance']['score']:.1f}%
- Tempos de resposta do backend
- Otimização do frontend
- Tamanho do bundle de produção

### 💬 Clareza da Comunicação: {self.test_results['communication_clarity']['score']:.1f}%
- Mensagens de erro claras
- Estados de carregamento
- Orientações ao usuário

## Certificação Final
**{certification}**

## Recomendações
{"- Sistema aprovado para produção com usabilidade excelente" if overall_score >= 85 else "- Implementar melhorias identificadas antes da produção"}

---
*Relatório gerado automaticamente pelo sistema de testes de usabilidade*
""")
        
        print(f"\n📄 Relatório salvo em: {report_path}")
        return overall_score >= 75

def main():
    """
    Executa suite completa de testes de usabilidade
    """
    print("=" * 80)
    print("TESTES DE USABILIDADE - FASE 5.1.3")
    print("UX/UI Testing Specialist & Accessibility Expert")
    print("=" * 80)
    print()
    
    tester = UsabilityTester()
    
    try:
        print("🚀 INICIANDO SUITE DE TESTES DE USABILIDADE")
        print()
        
        # Executar todos os testes
        tests = [
            ("Facilidade de Troca de Personas", tester.test_persona_switching_ease),
            ("Responsividade da Interface", tester.test_responsive_design),
            ("Performance e Tempos de Resposta", tester.test_performance_metrics),
            ("Clareza da Comunicação", tester.test_communication_clarity)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n📋 EXECUTANDO: {test_name}")
            print("-" * 60)
            
            try:
                result = test_func()
                results.append(result)
                status = "APROVADO" if result else "REQUER ATENÇÃO"
                print(f"Resultado: {status}")
            except Exception as e:
                print(f"ERRO: {e}")
                results.append(False)
            
            print()
        
        # Gerar relatório final
        success = tester.generate_usability_report()
        
        print("\n" + "=" * 80)
        if success:
            print("✅ TESTES DE USABILIDADE: APROVADOS")
            print("Sistema possui boa usabilidade para produção!")
        else:
            print("⚠️ TESTES DE USABILIDADE: REQUEREM ATENÇÃO")
            print("Melhorias de usabilidade necessárias.")
        print("=" * 80)
        
        return success
        
    except Exception as e:
        log(f"ERRO durante execução: {e}", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)