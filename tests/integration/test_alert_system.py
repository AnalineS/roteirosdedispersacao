#!/usr/bin/env python3
"""
Teste do Sistema de Alertas - Roteiros de Dispensação
Testa alertas por Telegram e GitHub Issues conforme necessidade

Uso:
    python test_alert_system.py [--test-type TIPO]

Tipos de teste disponíveis:
    - connectivity: Testa conectividade Telegram
    - simulate-offline: Simula sistema offline para teste completo
    - all: Executa todos os testes

Dependências:
    pip install requests

Configuração:
    Defina as variáveis de ambiente ou edite as constantes abaixo:
    - TELEGRAM_BOT_TOKEN
    - TELEGRAM_CHAT_ID
    - GITHUB_TOKEN (opcional, para APIs do GitHub)
"""

import os
import sys
import requests
import json
import time
import argparse
from datetime import datetime
from urllib.parse import quote

# Configurações - Edite conforme necessário
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')

# URLs dos serviços para teste
BACKEND_URL = "https://roteiro-dispensacao-api-992807978726.us-central1.run.app/api/health"
FRONTEND_URL = "https://roteiros-de-dispensacao.web.app"
MONITORING_URL = "https://github.com/AnalineS/roteirosdedispersacao/actions/workflows/observability-monitoring.yml"

class AlertSystemTester:
    def __init__(self):
        self.timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
    def test_telegram_connectivity(self):
        """Testa conectividade básica do Telegram"""
        print("🧪 Testando conectividade Telegram...")
        
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            print("❌ Erro: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID devem ser configurados")
            return False
            
        message = f"""🧪 *Teste Manual - Sistema de Monitoramento*

✅ *Telegram configurado corretamente!*

📊 *Informações do teste:*
• Horário: {self.timestamp}
• Tipo: Teste de conectividade
• Status: Funcionando

🔗 *Links de ação:*
📊 [Ver Monitoring]({MONITORING_URL})

_Sistema de alertas ativo e funcional_ ✅"""

        return self._send_telegram_message(message)
    
    def test_simulated_offline_alert(self):
        """Simula um alerta de sistema offline"""
        print("🔥 Simulando alerta de sistema offline...")
        
        message = f"""🔴 *Alerta Roteiros de Dispensação*

*Tipo:* 🚨 TESTE - SISTEMA OFFLINE
*Detalhes:* Backend: 500 | Frontend: 200
*Horário:* {self.timestamp}

📊 *Status de Teste:*
• Backend API: 500 (simulado)
• Frontend: 200
• Métricas: OK

🔗 *Ações Rápidas:*
📊 [Ver Monitoring]({MONITORING_URL})
🔍 [Issues](https://github.com/AnalineS/roteirosdedispersacao/issues)

🧪 *ESTE É UM TESTE SIMULADO*
_O sistema está funcionando normalmente_"""

        return self._send_telegram_message(message)
    
    def test_service_status(self):
        """Testa status real dos serviços"""
        print("🌐 Testando status real dos serviços...")
        
        # Testar backend
        try:
            backend_response = requests.get(BACKEND_URL, timeout=10)
            backend_status = backend_response.status_code
            backend_emoji = "✅" if backend_status == 200 else "❌"
        except requests.RequestException as e:
            backend_status = f"Error: {str(e)}"
            backend_emoji = "❌"
        
        # Testar frontend
        try:
            frontend_response = requests.get(FRONTEND_URL, timeout=10)
            frontend_status = frontend_response.status_code
            frontend_emoji = "✅" if frontend_status == 200 else "❌"
        except requests.RequestException as e:
            frontend_status = f"Error: {str(e)}"
            frontend_emoji = "❌"
        
        message = f"""📊 *Status Real dos Serviços*

*Verificação:* {self.timestamp}

📊 *Status Atual:*
• Backend API: {backend_status} {backend_emoji}
• Frontend: {frontend_status} {frontend_emoji}

🔗 *Links diretos:*
🌐 [Backend Health]({BACKEND_URL})
🖥️ [Frontend]({FRONTEND_URL})
📊 [Monitoring]({MONITORING_URL})

_Verificação automática de serviços_"""

        return self._send_telegram_message(message)
    
    def _send_telegram_message(self, message):
        """Envia mensagem via Telegram"""
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            print("❌ Credenciais do Telegram não configuradas")
            return False
            
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        # Codificar mensagem para URL
        encoded_message = quote(message)
        
        data = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'Markdown',
            'disable_web_page_preview': False
        }
        
        try:
            response = requests.post(url, data=data, timeout=10)
            if response.status_code == 200:
                print("✅ Mensagem enviada via Telegram com sucesso")
                return True
            else:
                print(f"❌ Erro ao enviar Telegram: {response.status_code} - {response.text}")
                return False
        except requests.RequestException as e:
            print(f"❌ Erro de conexão Telegram: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Executa todos os testes disponíveis"""
        print("🚀 Executando todos os testes do sistema de alertas...\n")
        
        results = []
        
        # Teste 1: Conectividade
        print("=" * 50)
        results.append(self.test_telegram_connectivity())
        time.sleep(2)
        
        # Teste 2: Status real
        print("\n" + "=" * 50)
        results.append(self.test_service_status())
        time.sleep(2)
        
        # Teste 3: Alerta simulado
        print("\n" + "=" * 50)
        results.append(self.test_simulated_offline_alert())
        
        # Resumo
        print("\n" + "=" * 50)
        print("📊 RESUMO DOS TESTES:")
        print(f"• Conectividade: {'✅' if results[0] else '❌'}")
        print(f"• Status Real: {'✅' if results[1] else '❌'}")
        print(f"• Alerta Simulado: {'✅' if results[2] else '❌'}")
        print(f"\n🎯 Sucesso geral: {sum(results)}/{len(results)} testes")
        
        return all(results)

def main():
    parser = argparse.ArgumentParser(description='Teste do Sistema de Alertas')
    parser.add_argument('--test-type', 
                       choices=['connectivity', 'simulate-offline', 'status', 'all'],
                       default='all',
                       help='Tipo de teste a executar')
    
    args = parser.parse_args()
    
    tester = AlertSystemTester()
    
    print("🔍 TESTE DO SISTEMA DE ALERTAS")
    print("=" * 50)
    print(f"Horário: {tester.timestamp}")
    print(f"Tipo: {args.test_type}")
    print("=" * 50)
    
    success = False
    
    if args.test_type == 'connectivity':
        success = tester.test_telegram_connectivity()
    elif args.test_type == 'simulate-offline':
        success = tester.test_simulated_offline_alert()
    elif args.test_type == 'status':
        success = tester.test_service_status()
    elif args.test_type == 'all':
        success = tester.run_all_tests()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print("❌ TESTE FALHOU - Verifique configurações")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())